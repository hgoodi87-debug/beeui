# Beeliber 가격 계산 로직 문서

> 최종 업데이트: 2026-04-07  
> 소스 파일: `client/src/domains/booking/bookingService.ts`, `deliveryStoragePricing.ts`, `client/components/BookingPage.tsx`

---

## 1. 서비스 유형 분류

| 서비스 | 코드 | 설명 |
|---|---|---|
| 당일 배송 | `SAME_DAY` | 당일 공항/호텔 → 지점 픽업 후 배송 |
| 예약 배송 | `SCHEDULED` | 사전 예약 배송 (지원 예정) |
| 짐보관 | `STORAGE` | 지점에서 시간/일 단위 보관 |

`SAME_DAY`와 `SCHEDULED`는 가격 계산 시 동일하게 `isDelivery = true`로 처리.

---

## 2. 수하물 종류별 기본 단가

### 2-1. 짐보관 단가표

> 소스: `STORAGE_RATES` in `bookingService.ts`

| 구분 | 4시간 기본 | 4시간 초과 (시간당) | 1일 | 추가 1일 | 7일 패키지 |
|---|---|---|---|---|---|
| **손가방·쇼핑백** (handBag) | ₩4,000 | ₩1,000| ₩8,000 | ₩6,000 | ₩44,000 |
| **캐리어** (carrier) | ₩5,000 | ₩1,250 | ₩10,000 | ₩8,000 | ₩58,000 |
| **유모차·자전거** (strollerBicycle) | ₩10,000 | ₩2,500 | ₩14,000 | ₩10,000 | ₩74,000 |

### 2-2. 배송 단가 (DeliveryPrices — DB 관리)

| 구분 | 기본값 |
|---|---|
| 손가방·쇼핑백 | `DEFAULT_DELIVERY_PRICES.handBag` |
| 캐리어 | `DEFAULT_DELIVERY_PRICES.carrier` |
| 유모차·자전거 | 배송 불가 (UI에서 선택 차단) |

> 실제 단가는 Supabase DB `price_settings` 테이블에서 로드. 미로드 시 `DEFAULT_DELIVERY_PRICES` fallback.

---

## 3. 짐보관(STORAGE) 가격 계산 흐름

### 3-1. 진입점

```
calculateStoragePrice(start, end, bags, lang, { businessHours })
  = calculateBookingStoragePrice (bookingService.ts)
```

BookingPage.tsx에서 호출:
```typescript
const pickupDateTime = parseKstDateTime(booking.pickupDate, booking.pickupTime);
const retrievalDateTime = parseKstDateTime(booking.dropoffDate, booking.deliveryTime, '23:59');
calculateStoragePrice(pickupDateTime, retrievalDateTime, bags, lang, { businessHours: branch.businessHours })
```

> **필드 매핑 주의**: 보관 예약에서 `deliveryTime` = 짐 찾는 시각(반납 시각), `dropoffDate` = 짐 찾는 날짜. 이름이 배송 로직과 공유되어 혼동 가능.

### 3-2. 청구 시간 결정 (`chargeableHours`)

```typescript
const diffHours = (end - start) / ms_per_hour;

// 당일 예약(diffHours < 24)이고 영업 마감 이후에 반납하면 하루치 청구
const shouldChargeDayRate = diffHours > 0 && diffHours < 24
    && hasBusinessHoursBoundaryCrossed(start, end, businessHours);

const chargeableHours = shouldChargeDayRate ? 24 : diffHours;
```

#### `hasBusinessHoursBoundaryCrossed` 판단 기준

| 조건 | 결과 | 설명 |
|---|---|---|
| `businessHours` 파싱 불가 또는 null | `false` | 시간당 정상 청구 |
| 24시간 영업 지점 (00:00~23:30+) | `false` | 시간당 정상 청구 |
| **날짜가 다름** (익일 반납) | `true` | → 하루치 청구 |
| 같은 날이고 **반납 시각 > 영업 마감** | `true` | → 하루치 청구 |
| 같은 날이고 반납 시각 ≤ 영업 마감 | `false` | 시간당 정상 청구 |

> **2026-04-07 버그 수정**: 이전에는 같은 날이더라도 픽업 시각이 영업 시작 전이면 하루치를 청구했음 (`startMinutes < openMinutes`). 수정 후 반납 시각 기준으로만 판단. 픽업이 오픈 전이어도 정상 시간 카운트.

#### 예시

| 드롭오프 | 반납 | 지점 영업시간 | chargeableHours | 비고 |
|---|---|---|---|---|
| 10:00 | 15:00 (동일) | 10:00-22:00 | 5h | 정상 시간당 |
| 09:00 | 15:00 (동일) | 10:00-22:00 | 6h | 오픈 전 드롭오프 → 정상 카운트 (수정됨) |
| 10:00 | 23:00 (동일) | 10:00-22:00 | 24h | 마감 후 반납 → 하루치 |
| 18:00 | 다음날 10:00 | 10:00-22:00 | 24h | 익일 반납 → 하루치 |
| 10:00 | 다음날 10:00 | 10:00-22:00 | 24h | diffHours=24, shouldCharge=false → 24h 시간당 |

### 3-3. 가방 1개당 가격 계산 (`getSingleBagStoragePrice`)

```
roundedHours = max(1, ceil(chargeableHours))

if roundedHours ≤ 4:
    가격 = rate.hours4                                     ← 기본 4시간 요금

if 4 < roundedHours ≤ 24:
    가격 = rate.hours4 + (roundedHours - 4) × rate.hourlyAfter4h   ← 초과 시간당 요금

if roundedHours > 24:
    extraDays = ceil((roundedHours - 24) / 24)
    가격 = rate.day1 + extraDays × rate.extraDay           ← 일 단위 요금
    if extraDays ≥ 6: 가격 = min(가격, rate.day7)          ← 7일 패키지 적용
```

> **반올림**: 분 단위는 항상 올림(ceil). 4시간 1분 = 5시간으로 계산.

#### 캐리어 기준 시간별 단가 예시

| 보관 시간 | roundedHours | 계산식 | 캐리어 1개 |
|---|---|---|---|
| 1분 ~ 4시간 | 1~4 | hours4 | ₩5,000 |
| 4시간 1분 ~ 5시간 | 5 | min(5000 + 1×1250, 10000) | ₩6,250 |
| 6시간 | 6 | min(5000 + 2×1250, 10000) | ₩7,500 |
| 7시간 | 7 | min(5000 + 3×1250, 10000) | ₩8,750 |
| **8시간** | 8 | min(5000 + 4×1250, 10000) = 10000 | **₩10,000 (day1 도달)** |
| 9시간 ~ 24시간 | 9~24 | day1 상한 적용 | ₩10,000 |
| 2일 (48h) | 48 | 10000 + 1×8000 | ₩18,000 |
| 3일 (72h) | 72 | 10000 + 2×8000 | ₩26,000 |
| 7일 (168h) | 168 | min(10000+6×8000, 58000) | ₩58,000 |
| 8일 (192h) | 192 | 10000 + 7×8000 = 66000 > 58000 | ₩58,000 (패키지) |

#### day1 요금 도달 시점 (시간당 요금 상한)

| 구분 | hours4 | hourlyAfter4h | day1 도달 시간 |
|---|---|---|---|
| 손가방 | ₩4,000 | ₩1,000 | **8시간** (4000 + 4×1000 = 8000) |
| 캐리어 | ₩5,000 | ₩1,250 | **8시간** (5000 + 4×1250 = 10000) |
| 유모차·자전거 | ₩10,000 | ₩2,500 | **6시간** (10000 + 2×2500 = 15000 → cap → 14000, 정확히는 5.6h) |

---

## 4. 배송(DELIVERY) 가격 계산 흐름

### 4-1. 기본 배송 요금

```typescript
base = handBag수 × deliveryPrices.handBag
     + carrier수 × deliveryPrices.carrier
// 유모차·자전거는 배송 불가
```

### 4-2. 선보관 요금 (배송 전 날짜가 다를 때)

배송 예약 시 픽업 날짜(`pickupDate`)와 배송 날짜(`dropoffDate`)가 다르면 선보관 요금 추가:

```typescript
storageDays = floor((dropoffDate KST 자정 - pickupDate KST 자정) / 24h)

// 1일이면 day1, 2일 이상이면 day1 + (days-1) × extraDay
if storageDays == 1: fee = rate.day1
else: fee = rate.day1 + (storageDays - 1) × rate.extraDay
```

> 배송 당일은 보관 일수에 포함하지 않음.

```
배송 최종 base = 기본배송요금 + 선보관요금
```

---

## 5. 지점 추가 요금 (Surcharge)

배송 서비스에만 적용. 보관 서비스는 0.

| 필드 | 대상 | 설명 |
|---|---|---|
| `originSurcharge` | 픽업 지점 | 지점별 픽업 추가 요금 (공항: ₩2,000~3,000) |
| `destinationSurcharge` | 배송 지점 | 지점별 배송 추가 요금 |

현재 값:
- 인천공항 T1/T2: origin/destination 각 ₩3,000
- 김포공항: origin/destination 각 ₩2,000
- 시내 지점: 0

---

## 6. 프리미엄 보험 (선택)

```typescript
if booking.agreedToPremium:
    insuranceFee = 5000 × insuranceLevel × max(1, totalBags)
```

- `insuranceLevel`: 1~3 (단계)
- 기본 1단계: 짐 1개당 ₩5,000

---

## 7. 할인 / 쿠폰

```typescript
if appliedCoupon.type == 'fixed':
    discount = appliedCoupon.amount  // 고정 금액 할인

if appliedCoupon.type == 'percent':
    discount = floor(subtotal × coupon.amount / 100)

discount = min(discount, subtotal)  // 음수 방지
```

---

## 8. 최종 금액 계산 요약

```
subtotal = base + originSurcharge + destSurcharge + insuranceFee
total    = subtotal - discount

// 저장 필드
price      = base + originSurcharge + destSurcharge + insuranceFee  (할인 전)
finalPrice = total                                                   (할인 후 실결제)
```

---

## 9. 커미션 계산 (지점 정산)

커미션은 완료(COMPLETED) 예약에만 적용.

```typescript
const price = booking.settlementHardCopyAmount ?? booking.finalPrice ?? 0;
const rate  = serviceType === DELIVERY ? branch.commissionRates.delivery
                                       : branch.commissionRates.storage;
commission  = floor(price × (rate / 100));
```

| 필드 | 설명 |
|---|---|
| `settlementHardCopyAmount` | 실물 정산서 기준 금액 (있으면 우선) |
| `finalPrice` | 시스템 결제 금액 |
| `commissionRates.delivery` | 배송 커미션율 (%) |
| `commissionRates.storage` | 보관 커미션율 (%) |

커미션은 소수점 버림(`Math.floor`).

---

## 10. 예외 처리

| 케이스 | 처리 |
|---|---|
| `start >= end` | total = 0 반환 |
| `pickupDateTime` 파싱 실패 | total = 0 반환 |
| bags 전부 0개 | total = 0 |
| bags 선택됐는데 price = 0 | 4시간 기본 요금으로 표시 ("기본 4시간 예상") |
| `businessHours` 형식 오류 | boundary 체크 skip → 시간당 정상 청구 |

---

## 11. 지점별 서비스 지원 현황

| 유형 | supportsDelivery | supportsStorage |
|---|---|---|
| 공항 (인천T1, T2, 김포) | ✅ | ❌ |
| 시내 파트너 지점 | ✅ | ✅ |

> `isActive: false` 지점은 UI에서 필터링되어 표시 안 됨.

---

## 12. 데이터 흐름 다이어그램

```
LocationsPage (날짜/시간 선택)
  └─ onSelectLocation("YYYY-MM-DD HH:mm", "YYYY-MM-DD HH:mm")
      └─ App.tsx handleLocationSelect → preSelectedBooking 저장
          └─ BookingPage initialDate.split(' ') → [date, time]
              └─ parseKstDateTime(date, time) → KST Date 객체
                  └─ calculateStoragePrice(start, end, bags, lang, {businessHours})
                      └─ hasBusinessHoursBoundaryCrossed → chargeableHours
                          └─ getSingleBagStoragePrice(chargeableHours, rate) × count
                              └─ PriceResult { total, breakdown, durationText }
```

---

## 13. 변경 이력

| 날짜 | 변경 내용 |
|---|---|
| 2026-04-07 | `hasBusinessHoursBoundaryCrossed`: 동일 날짜에서 픽업 시각이 영업 시작 전인 경우 하루치 청구하던 버그 수정. 반납 시각이 마감 후일 때만 하루치 청구하도록 변경. |
| 2026-04-07 | `STORAGE_RATES.hourlyAfter4h` 단가 수정: 손가방 200→1000, 캐리어 250→1250, 유모차 200→2500. `getSingleBagStoragePrice` 공식에 `day1` 상한 처리(`Math.min`) 추가. |
