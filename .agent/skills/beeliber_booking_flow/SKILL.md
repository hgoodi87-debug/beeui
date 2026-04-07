---
name: beeliber_booking_flow
description: "사용자 예약 플로우 전체 로직. BookingPage 4단계, 가격 계산, 결제 연동, 후처리 웹훅. 예약 관련 수정 시 필수 참조."
---

# 예약 플로우 스킬

## 예약 4단계 (BookingPage.tsx)

| 단계 | 내용 | 핵심 로직 |
|------|------|----------|
| Step 01 | 일정 & 장소 | 서비스 토글, 거점 선택, 날짜/시간 (generateTimeSlots) |
| Step 02 | 짐 선택 | handBag/carrier/strollerBicycle 수량 |
| Step 03 | 고객 정보 | 이름/이메일/SNS/국가/동의/보험 |
| Step 04 | 가격 & 결제 | priceDetails useMemo, Toss 결제 or 직접 예약 |

## 가격 계산 규칙

### STORAGE
- 4시간 기본 → 시간당 추가 → 1일 → 추가일 → 7일 패키지
- 영업시간 경계 넘으면 1일 요금
- KST 타임존 기준

### DELIVERY
- 기본: handBag 10,000 / carrier 25,000
- 배송일 > 픽업일이면 보관 요금 추가
- strollerBicycle 배송 불가

### 공통
- 보험료 = 5,000 × 레벨 × 짐 개수
- 출발지/도착지 할증
- 쿠폰 할인 (정액/정률)

## 결제 흐름
1. finalPrice = 0 → 바로 저장
2. finalPrice > 0 → Toss 세션 생성 → 결제창 → 성공/실패 → 확인

## 후처리 (on-booking-created)
1. 예약 코드 생성 (ORIGIN-DEST-RANDOM)
2. 바우처 이메일 발송
3. Google Chat 알림

## 수정 시 주의
- 가격 로직 변경 시 bookingService.ts + deliveryStoragePricing.ts + bagCategoryUtils.ts 3곳 확인
- 시간 슬롯 변경 시 BookingPage.tsx의 generateTimeSlots() 확인
- 거점 추가 시 locations 테이블 + location_translations 동시 업데이트
- 결제 변경 시 tossPaymentsService.ts + Supabase Edge Function 동시 확인

## 핵심 파일
- `client/components/BookingPage.tsx`
- `client/src/domains/booking/bookingService.ts`
- `client/src/domains/booking/deliveryStoragePricing.ts`
- `client/src/domains/booking/bagCategoryUtils.ts`
- `client/services/tossPaymentsService.ts`
- `client/services/storageService.ts` (saveBooking)
- `supabase/functions/on-booking-created/index.ts`
