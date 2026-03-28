# Delivery Pre-Storage Pricing Rule
> 업데이트: 2026-03-28
> 목적: 배송 예약에서 먼저 보관하는 경우의 보관비 계산 기준을 고정한다

## 1. 적용 대상

- 서비스 타입이 `DELIVERY`
- `pickupDate < dropoffDate`
- 즉, 짐을 먼저 맡기고 다른 날짜에 배송하는 예약

## 2. 운영 기준

- 배송 예약의 기본 배송비는 기존 배송 단가를 그대로 사용한다.
- 선보관이 발생하면 보관비는 시간제가 아니라 `일일 보관 단가`로 계산한다.
- 배송일 당일은 보관일에 포함하지 않는다.
- 따라서 보관일 수는 `pickupDate`부터 `dropoffDate` 전날까지의 달력 일수다.

예시:

- 3월 28일 맡기고 3월 28일 배송: 보관비 `0일`
- 3월 28일 맡기고 3월 29일 배송: 보관비 `1일`
- 3월 28일 맡기고 3월 30일 배송: 보관비 `2일`

## 3. 단가 규칙

보관일 수가 1일 이상이면 아래 규칙을 적용한다.

- 1일차: `day1`
- 2일차 이상: `day1 + (추가일수 * extraDay)`

가방 타입별 기준:

- `handBag`: `day1 8,000 / extraDay 6,000`
- `carrier`: `day1 10,000 / extraDay 8,000`
- `strollerBicycle`: `day1 14,000 / extraDay 10,000`

단, 현재 배송 예약에서는 `strollerBicycle`는 선택 불가라 실질적으로 `handBag`, `carrier`만 계산 대상이다.

## 4. 계산식

```text
storageDays = max(0, dropoffDate - pickupDate in KST calendar days)

if storageDays === 0:
  storageFee = 0
if storageDays === 1:
  storageFee = day1
if storageDays >= 2:
  storageFee = day1 + ((storageDays - 1) * extraDay)
```

최종 금액:

```text
deliveryTotal = deliveryBase + preStorageFee + surcharge + insurance - discount
```

## 5. 반영 범위

같은 규칙을 아래 경로에 모두 적용한다.

- 공개 예약 페이지 `BookingPage`
- 예약 위젯 `BookingWidget`
- 상세 예약 모달 `BookingDetailed`
- 서버 결제 검증 `functions/src/domains/payments/tossPaymentsService.js`

## 6. 구현 원칙

- 프론트와 서버가 같은 규칙을 써야 한다.
- 화면 표시 문구는 `선보관 N일 (배송일 제외)` 기준으로 맞춘다.
- 기존 순수 보관 서비스 `STORAGE` 시간제 계산 로직은 변경하지 않는다.
