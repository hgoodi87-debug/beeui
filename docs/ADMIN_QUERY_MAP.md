# Beeliber 관리자 페이지 쿼리 맵

## 문서 목적

이 문서는 관리자 페이지가 실제로 어떤 Firebase 데이터에 의존하는지 정리한 맵이다.

Supabase 전환 시 “어느 화면이 어느 테이블을 먼저 필요로 하는지” 판단하는 기준으로 사용한다.

---

## 1. 관리자 로그인

### 현재 흐름

1. 익명 인증 세션 생성
2. `verifyAdmin` callable 호출
3. Firestore `admins` 전체 검색
4. 성공 시 `admins/{uid}` UID 매핑 문서 생성
5. 대시보드 진입

관련 파일:

- [client/components/AdminLoginPage.tsx](/Users/cm/Desktop/beeliber/beeliber-main/client/components/AdminLoginPage.tsx)
- [client/firebaseApp.ts](/Users/cm/Desktop/beeliber/beeliber-main/client/firebaseApp.ts)
- [functions/index.js](/Users/cm/Desktop/beeliber/beeliber-main/functions/index.js)

### Supabase 절체 대상

- Firebase Anonymous Auth 제거
- `verifyAdmin` 제거
- `auth.users + profiles + employees + employee_roles` 구조로 전환

---

## 2. 관리자 대시보드 메인 데이터

관리자 대시보드는 아래 데이터를 기준으로 동작한다.

### 항상 핵심인 데이터

- `bookings`
- `locations`

현재 `bookings` 조회 기준은 `booking_details` 단독 테이블이 아니라
`admin_booking_list_v1 (reservations + booking_details + payments)`로 보는 것이 맞다.

관련 파일:

- [client/components/AdminDashboard.tsx](/Users/cm/Desktop/beeliber/beeliber-main/client/components/AdminDashboard.tsx)
- [client/src/domains/booking/hooks/useBookings.ts](/Users/cm/Desktop/beeliber/beeliber-main/client/src/domains/booking/hooks/useBookings.ts)
- [client/src/domains/location/hooks/useLocations.ts](/Users/cm/Desktop/beeliber/beeliber-main/client/src/domains/location/hooks/useLocations.ts)

### 조건부 로딩 데이터

- `admins`
- `inquiries`
- `daily_closings`
- `expenditures`
- `notices`

관련 파일:

- [client/src/domains/admin/hooks/useAdmins.ts](/Users/cm/Desktop/beeliber/beeliber-main/client/src/domains/admin/hooks/useAdmins.ts)
- [client/src/domains/admin/hooks/useInquiries.ts](/Users/cm/Desktop/beeliber/beeliber-main/client/src/domains/admin/hooks/useInquiries.ts)
- [client/src/domains/admin/hooks/useCashClosings.ts](/Users/cm/Desktop/beeliber/beeliber-main/client/src/domains/admin/hooks/useCashClosings.ts)
- [client/src/domains/admin/hooks/useExpenditures.ts](/Users/cm/Desktop/beeliber/beeliber-main/client/src/domains/admin/hooks/useExpenditures.ts)

---

## 3. 탭별 데이터 의존성

## 3-1. 인사관리 HR

현재 의존 데이터:

- `admins`
- `locations`

핵심 동작:

- 직원 목록 조회
- 직원 생성/수정/삭제
- 중복 정리
- 역할/지점 표시

Supabase 전환 우선순위:

- 최상

필요 목표 테이블:

- `employees`
- `profiles`
- `roles`
- `employee_roles`
- `branches`
- `employee_branch_assignments`

## 3-2. 배송/보관 예약 관리

현재 의존 데이터:

- `bookings`
- `locations`

추가 액션:

- 상태 변경
- 이메일 재전송
- 환불 처리
- 취소 처리
- soft delete / restore / permanent delete

관련 Functions:

- `resendBookingVoucher`
- `processBookingRefund`
- `cancelBooking`

Supabase 전환 우선순위:

- 매우 높음

필요 목표 테이블:

- `bookings`
- `baggage_items`
- `delivery_jobs`
- `job_events`
- `audit_logs`

## 3-3. 정산 / 회계

현재 의존 데이터:

- `bookings`
- `daily_closings`
- `expenditures`
- `locations`

집계 기준:

- 일별 집계 view: `admin_revenue_daily_v1`
- 월별 집계 view: `admin_revenue_monthly_v1`

계산 특징:

- 프론트 메모/통계 계산이 많음
- 월/일 단위 집계가 클라이언트에서 일부 처리됨

Supabase 전환 우선순위:

- 높음

필요 목표 테이블:

- `daily_settlements`
- `monthly_settlements`
- `payouts`
- `partner_commissions`
- 집계용 `view`와 `sql function`

## 3-4. 지점 관리

현재 의존 데이터:

- `locations`
- `branches`
- `branch_prospects`

Supabase 목표:

- `branches`
- `branch_prospects`

## 3-5. 공지 / 정책 / CMS

현재 의존 데이터:

- `notices`
- `settings`
- `tips_areas`
- `tips_themes`
- `tips_contents`

Supabase 목표:

- `notices`
- `legal_documents`
- `cms_areas`
- `cms_themes`
- `cms_contents`

## 3-6. 채팅

현재 의존 데이터:

- `chat_sessions`
- `chats`

Supabase 목표:

- `chat_sessions`
- `chat_messages`

---

## 4. 관리자 핵심 절체 순서

Supabase 절체는 아래 순서가 맞다.

1. 관리자 로그인
2. 인사관리
3. 지점 마스터
4. 예약 리스트/상세
5. 배송 이벤트/상태 변경
6. 정산/리포트
7. 공지/CMS/채팅

이 순서를 지켜야 하는 이유는, 관리자 로그인과 HR이 안정되지 않으면 이후 모든 탭의 권한 모델이 계속 흔들리기 때문이다.

---

## 5. 즉시 PoC 대상

가장 먼저 PoC 해야 할 관리 기능은 아래 3개다.

### PoC 1. 관리자 로그인

- 입력: email 또는 loginId
- 결과: Supabase Auth 세션 발급
- 후속 조회: `profiles`, `employees`, `employee_roles`

### PoC 2. HR 목록

- 직원 목록 1개 쿼리
- 역할/지점 조인
- 상태 필터

### PoC 3. 지점 목록

- `branches` 조회
- HQ / 지점 / 파트너 구분
- 관리자 권한별 범위 제한

---

## 6. 현재 Firebase 병목 메모

현재 운영 구조의 병목은 아래와 같다.

- 관리자 로그인 자격이 Firestore 문서 상태에 의존
- `admins` 컬렉션이 직원 마스터 + 로그인 자격 + UID 매핑 역할을 동시에 수행
- 예약/정산 집계를 클라이언트가 많이 수행
- 실시간 구독 범위가 넓음

즉, Supabase에서는 단순 이관보다 “역할 분리”가 먼저다.
