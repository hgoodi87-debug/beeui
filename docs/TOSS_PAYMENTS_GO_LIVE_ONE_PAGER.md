# Toss Payments 실배포 한 장 요약

## 문서 목적

이 문서는 Beeliber 예약 결제를 토스페이먼츠 실서비스로 올리기 직전에
사장님이 딱 한 번 보고 체크할 수 있게 만든 최종 요약본이다.

현재 기준:

- 로컬 프리뷰에서는 `mock 결제 모드`
- 운영 배포는 아직 안 함
- 실제 결제 승인 함수는 코드만 준비 완료

---

## 1. 지금 상태

### 로컬에서 보이는 것

- 예약하기 버튼
- 토스 mock 성공 라우트
- 예약 완료 화면

### 아직 운영에서 안 된 것

- 실제 토스 카드 승인
- 운영 함수 승인 API 호출
- 운영 예약 생성과 결제 승인 실연결

---

## 2. 배포 직전 꼭 바꿀 것

### 프론트 환경변수

운영에서는 아래처럼 되어야 한다.

```env
VITE_TOSS_PAYMENTS_CLIENT_KEY=live_ck_xxx
VITE_TOSS_PAYMENTS_MOCK_MODE=false
```

지금 로컬은 이렇게 되어 있다.

```env
VITE_TOSS_PAYMENTS_CLIENT_KEY=test_ck_xxx
VITE_TOSS_PAYMENTS_MOCK_MODE=true
```

즉,

- `test_ck_*` -> 운영이면 `live_ck_*`
- `true` -> 운영이면 `false`

---

## 3. 함수 시크릿

함수에는 이 값이 들어가야 한다.

```text
TOSS_PAYMENTS_SECRET_KEY
```

운영에서는:

- 테스트 키 `test_sk_*` 말고
- 운영 키 `live_sk_*`

를 넣어야 한다.

중요:

- `client key`는 프론트
- `secret key`는 함수/서버
- 둘을 섞으면 안 된다

---

## 4. 토스 콘솔에서 확인할 것

반드시 확인:

- 성공 URL 등록
- 실패 URL 등록
- 상점 환경이 테스트/운영 중 어느 쪽인지 확인

운영 URL 예시:

- `https://bee-liber.com/payments/toss/success`
- `https://bee-liber.com/payments/toss/fail`

---

## 5. 배포 순서

1. 프론트 env를 운영값으로 교체
2. 함수 시크릿 `TOSS_PAYMENTS_SECRET_KEY` 등록
3. `VITE_TOSS_PAYMENTS_MOCK_MODE=false` 확인
4. 함수 배포
5. 프론트 배포
6. 테스트 카드로 실제 승인 1건 확인
7. 예약 생성 확인
8. 바우처 메일 확인

---

## 6. 배포 직후 바로 볼 것

배포 직후 10분 안에 이 네 개부터 본다.

1. 결제 성공 후 예약 완료 화면이 뜨는지
2. Firestore `bookings` 문서가 생기는지
3. `paymentStatus=paid`로 저장되는지
4. 바우처 메일이 실제로 발송되는지

---

## 7. 문제 생기면 가장 먼저 볼 곳

### 성공 화면은 떴는데 예약이 없음

- 함수 `confirmTossPayment` 로그 확인
- `TOSS_PAYMENTS_SECRET_KEY` 설정 확인
- 토스 승인 응답 확인

### 결제창은 뜨는데 승인 후 실패

- 성공 URL / 실패 URL 등록 확인
- 토스 콘솔 상점 모드 확인
- `amount`, `orderId` 검증 실패 로그 확인

### 예약은 생겼는데 결제 상태가 이상함

- `paymentStatus`
- `paymentProvider`
- `paymentOrderId`
- `paymentKey`

이 네 필드 확인

---

## 8. 롤백 기준

아래 중 하나라도 보이면 바로 중단 판단한다.

- 결제는 됐는데 예약이 저장 안 됨
- 취소했는데 성공 화면으로 감
- 같은 주문이 두 번 승인됨
- 바우처 메일이 계속 안 나감

가장 빠른 임시 대응:

1. 예약 결제 버튼 노출 차단
2. mock 모드 또는 기존 저장 흐름으로 임시 복귀 검토
3. 함수 로그 분석 후 재배포

---

## 9. 같이 봐야 하는 문서

- [TOSS_PAYMENTS_CUTOVER_CHECKLIST.md](/Users/cm/Desktop/beeliber/beeliber-main/docs/TOSS_PAYMENTS_CUTOVER_CHECKLIST.md)
- [SUPABASE_MIGRATION_MASTER_PLAN.md](/Users/cm/Desktop/beeliber/beeliber-main/docs/SUPABASE_MIGRATION_MASTER_PLAN.md)

---

## 10. 한 줄 결론

운영 올리기 직전엔 이것만 기억하면 된다.

- 프론트는 `live_ck`
- 함수는 `live_sk`
- mock 모드는 `false`
- 배포 후 실제 카드 1건으로 예약/메일까지 바로 검증
