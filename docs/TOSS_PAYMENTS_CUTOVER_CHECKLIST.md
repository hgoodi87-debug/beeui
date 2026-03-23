# Toss Payments Cutover Checklist

## 문서 목적

이 문서는 Beeliber 예약 흐름을 토스페이먼츠 SDK 기반 결제로 전환하기 전에 확인해야 할 항목을 정리한 실행 체크리스트다.

빠르게 한 번에 보려면 이 문서를 같이 본다.

- [TOSS_PAYMENTS_GO_LIVE_ONE_PAGER.md](/Users/cm/Desktop/beeliber/beeliber-main/docs/TOSS_PAYMENTS_GO_LIVE_ONE_PAGER.md)

현재 로컬 상태는 다음과 같다.

- 프론트 토스 결제 라우트 구현 완료
- 함수 승인 API 초안 구현 완료
- 로컬 프리뷰에서는 `mock 결제 모드` 사용 중
- 운영 반영은 아직 하지 않음

---

## 1. 현재 로컬 mock 상태

로컬에서는 아래 값으로 안전하게 mock 흐름을 본다.

- [client/.env.local](/Users/cm/Desktop/beeliber/beeliber-main/client/.env.local)
  - `VITE_TOSS_PAYMENTS_CLIENT_KEY`
  - `VITE_TOSS_PAYMENTS_MOCK_MODE=true`
- [functions/.env.local](/Users/cm/Desktop/beeliber/beeliber-main/functions/.env.local)
  - `TOSS_PAYMENTS_SECRET_KEY`

이 상태에서는 실제 카드 결제가 일어나지 않는다.

예약 페이지에서:

1. 예약하기 클릭
2. 토스 mock 성공 URL 이동
3. 승인 확인 화면
4. 예약 완료 화면

까지만 확인한다.

---

## 2. 실전 전환 전 필수 값

### 프론트 환경변수

- `VITE_TOSS_PAYMENTS_CLIENT_KEY`
  - 테스트면 `test_ck_*`
  - 운영이면 `live_ck_*`
- `VITE_TOSS_PAYMENTS_MOCK_MODE=false`

### 함수 시크릿

- `TOSS_PAYMENTS_SECRET_KEY`
  - 테스트면 `test_sk_*`
  - 운영이면 `live_sk_*`

주의:

- 클라이언트 키와 시크릿 키를 절대 섞으면 안 된다.
- 시크릿 키는 프론트 코드나 Git 저장소에 직접 넣으면 안 된다.

---

## 3. 토스 콘솔에서 확인할 것

### 리다이렉트 URL

토스 결제 성공/실패 리다이렉트 URL이 실제 배포 도메인과 일치해야 한다.

- 성공 URL: `/payments/toss/success`
- 실패 URL: `/payments/toss/fail`

운영 도메인 기준 예시:

- `https://bee-liber.com/payments/toss/success`
- `https://bee-liber.com/payments/toss/fail`

### 상점 정보

- 테스트 상점 / 운영 상점 구분 확인
- MID가 올바른 환경과 연결되어 있는지 확인
- 카드/간편결제 사용 가능 여부 확인

---

## 4. 배포 전 코드 확인

아래 파일들이 같이 올라가야 한다.

- [client/components/BookingPage.tsx](/Users/cm/Desktop/beeliber/beeliber-main/client/components/BookingPage.tsx)
- [client/components/TossPaymentSuccessPage.tsx](/Users/cm/Desktop/beeliber/beeliber-main/client/components/TossPaymentSuccessPage.tsx)
- [client/components/TossPaymentFailPage.tsx](/Users/cm/Desktop/beeliber/beeliber-main/client/components/TossPaymentFailPage.tsx)
- [client/services/tossPaymentsService.ts](/Users/cm/Desktop/beeliber/beeliber-main/client/services/tossPaymentsService.ts)
- [client/App.tsx](/Users/cm/Desktop/beeliber/beeliber-main/client/App.tsx)
- [functions/index.js](/Users/cm/Desktop/beeliber/beeliber-main/functions/index.js)
- [functions/src/domains/payments/tossPaymentsService.js](/Users/cm/Desktop/beeliber/beeliber-main/functions/src/domains/payments/tossPaymentsService.js)

확인 포인트:

- 예약하기가 바로 저장으로 안 가는지
- `createTossPaymentSession` 호출 후 결제창으로 넘어가는지
- 성공 시 `confirmTossPayment`가 호출되는지
- 승인 후에만 예약 성공 화면으로 가는지
- 실패 시 예약 성공 화면으로 안 가는지

---

## 5. 테스트 시나리오

### A. 정상 결제

1. 예약 데이터 입력
2. 카드 결제 진행
3. 성공 URL 복귀
4. 예약 성공 화면 진입
5. Firestore `bookings` 생성 확인
6. `paymentStatus=paid`, `paymentProvider=toss` 확인

### B. 결제 취소

1. 예약 데이터 입력
2. 결제창 진입
3. 사용자 취소
4. 실패 URL 복귀
5. 예약 성공 화면 진입 금지 확인

### C. 금액 변조 방지

1. 성공 URL 쿼리의 `amount`를 임의로 수정
2. 승인 API 호출
3. 서버에서 거절되는지 확인

### D. 중복 승인 방지

1. 같은 `orderId`로 성공 URL 재호출
2. 중복 승인 방지 또는 동일 승인 결과 반환 확인

### E. 이메일/바우처

1. 결제 성공 예약 1건 생성
2. 바우처 메일 발송 확인
3. 예약 QR 정상 노출 확인

---

## 6. 실제 배포 직전 변경

배포 직전에는 아래 두 가지만 꼭 바꾼다.

1. [client/.env.local](/Users/cm/Desktop/beeliber/beeliber-main/client/.env.local) 또는 배포 env
   - `VITE_TOSS_PAYMENTS_MOCK_MODE=false`
2. 함수 시크릿
   - 실제 환경에 `TOSS_PAYMENTS_SECRET_KEY` 등록

---

## 7. 배포 후 모니터링

배포 직후 최소 1시간은 아래를 본다.

- 결제 성공률
- 성공 URL 복귀 실패 여부
- 예약 생성 누락 여부
- 중복 승인 여부
- 바우처 메일 발송 실패 로그

---

## 8. 롤백 기준

아래 중 하나라도 보이면 즉시 mock 이전 구조로 돌릴지 판단한다.

- 결제는 됐는데 예약이 저장되지 않음
- 예약은 저장됐는데 `paymentStatus`가 비정상
- 성공 URL 복귀 후 무한 로딩
- 결제 취소가 예약 성공으로 넘어감

즉시 조치 우선순위:

1. 예약 생성 차단
2. 결제 승인 함수 로그 확인
3. 토스 콘솔/실패 응답 확인
4. 필요 시 mock 모드 또는 기존 저장 흐름으로 임시 복귀
