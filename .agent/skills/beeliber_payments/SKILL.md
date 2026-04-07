---
name: beeliber_payments
description: Toss Payments 실배포 체크리스트 및 결제 연동 구조. 결제/예약 로직 작업 시 필수 참조.
---

# 💳 Beeliber Toss Payments 실배포 가이드

## 📍 현재 상태

| 항목 | 상태 |
|---|---|
| 로컬 결제 프리뷰 | mock 결제 모드로 작동 중 |
| 실제 카드 승인 | **미배포** |
| 승인 함수 코드 | 준비 완료 (`confirmTossPayment`) |
| 운영 환경변수 | **교체 필요** |

## 🔑 환경변수 배포 전 필수 교체

```env
# 현재 (로컬)
VITE_TOSS_PAYMENTS_CLIENT_KEY=test_ck_xxx
VITE_TOSS_PAYMENTS_MOCK_MODE=true

# 운영 배포 시
VITE_TOSS_PAYMENTS_CLIENT_KEY=live_ck_xxx
VITE_TOSS_PAYMENTS_MOCK_MODE=false
```

**함수 시크릿**: `TOSS_PAYMENTS_SECRET_KEY` = `live_sk_*` (test_sk 아님)

> [!IMPORTANT]
> `client key`는 프론트, `secret key`는 함수/서버. 절대 섞지 말 것.

## 📋 배포 순서 (8단계)

1. 프론트 env → `live_ck_*` 교체
2. 함수 시크릿 `TOSS_PAYMENTS_SECRET_KEY` = `live_sk_*` 등록
3. `VITE_TOSS_PAYMENTS_MOCK_MODE=false` 확인
4. 토스 콘솔: 성공 URL + 실패 URL 등록 확인
5. 함수 배포
6. 프론트 배포
7. 테스트 카드로 실제 승인 1건 확인
8. 예약 생성 + 바우처 메일 발송 확인

**토스 콘솔 등록 URL**:
- 성공: `https://bee-liber.com/payments/toss/success`
- 실패: `https://bee-liber.com/payments/toss/fail`

## ✅ 배포 직후 10분 체크

1. 결제 성공 후 예약 완료 화면 표시
2. Firestore `bookings` 문서 생성 여부
3. `paymentStatus=paid` 저장 여부
4. 바우처 메일 실발송 여부

## 🚨 롤백 기준 (즉시 중단)

- 결제는 됐는데 예약이 저장 안 됨
- 취소했는데 성공 화면으로 이동
- 같은 주문이 두 번 승인됨
- 바우처 메일이 계속 안 나감

**긴급 대응**: 예약 결제 버튼 노출 차단 → mock 모드 복귀 검토 → 함수 로그 분석

## 🐛 문제 발생 시 확인 포인트

| 증상 | 확인 대상 |
|---|---|
| 성공 화면은 떴는데 예약 없음 | `confirmTossPayment` 함수 로그, `TOSS_PAYMENTS_SECRET_KEY` |
| 결제창은 뜨는데 승인 후 실패 | 성공/실패 URL 등록, 토스 콘솔 상점 모드 |
| 예약은 있는데 결제 상태 이상 | `paymentStatus`, `paymentKey`, `paymentOrderId` 4개 필드 |

## 🔗 관련 파일

- `functions/src/domains/payments/tossPaymentsService.js`
- `client/components/BookingPage.tsx`
- `docs/TOSS_PAYMENTS_CUTOVER_CHECKLIST.md`
