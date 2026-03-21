# Beeliber Firebase 컬렉션 인벤토리

## 문서 목적

이 문서는 현재 코드베이스 기준으로 실제 사용 중인 Firebase 데이터 자산을 정리한 인벤토리다.

목표는 다음 3가지다.

- Supabase 이전 범위를 정확히 식별
- 컬렉션별 우선순위 정리
- 관계형 전환 시 대상 테이블 초안 연결

---

## 1. 인증 구조 인벤토리

현재 인증은 한 가지가 아니라 세 가지가 섞여 있다.

### A. 관리자 인증

- Firebase Anonymous Auth로 세션 확보
- 이후 `verifyAdmin` Cloud Function 호출
- 실제 자격 정보는 Firestore `admins` 컬렉션 기반
- 로그인 성공 후 `admins/{uid}` 형태 UID 매핑 문서 생성

관련 파일:

- [client/firebaseApp.ts](/Users/cm/Desktop/beeliber/beeliber-main/client/firebaseApp.ts)
- [client/components/AdminLoginPage.tsx](/Users/cm/Desktop/beeliber/beeliber-main/client/components/AdminLoginPage.tsx)
- [functions/index.js](/Users/cm/Desktop/beeliber/beeliber-main/functions/index.js)

### B. 고객 인증

- Firebase Auth 이메일/비밀번호
- Google OAuth 로그인
- 사용자 프로필은 Firestore `users` 컬렉션에 저장

관련 파일:

- [client/components/LoginModal.tsx](/Users/cm/Desktop/beeliber/beeliber-main/client/components/LoginModal.tsx)
- [client/components/SignupModal.tsx](/Users/cm/Desktop/beeliber/beeliber-main/client/components/SignupModal.tsx)

### C. 익명 세션

- 예약 저장
- 파일 업로드
- 관리자 로그인 시작점

관련 파일:

- [client/firebaseApp.ts](/Users/cm/Desktop/beeliber/beeliber-main/client/firebaseApp.ts)
- [client/services/storageService.ts](/Users/cm/Desktop/beeliber/beeliber-main/client/services/storageService.ts)

---

## 2. Firestore 컬렉션 목록

## 2-1. 운영 코어 우선 컬렉션

### `admins`

- 용도: 관리자/직원 계정, 로그인 자격, 권한, UID 매핑
- 현재 문제: 원본 자격 문서와 UID 매핑 문서가 혼재
- Supabase 목표: `employees`, `profiles`, `roles`, `employee_roles`, `employee_branch_assignments`
- 우선순위: 최상

주요 사용 파일:

- [client/services/storageService.ts](/Users/cm/Desktop/beeliber/beeliber-main/client/services/storageService.ts)
- [functions/index.js](/Users/cm/Desktop/beeliber/beeliber-main/functions/index.js)
- [firestore.rules](/Users/cm/Desktop/beeliber/beeliber-main/firestore.rules)

### `locations`

- 용도: 지점/센터 정보
- 공개 읽기, 관리자 쓰기
- Supabase 목표: `branches`
- 우선순위: 최상

주요 사용 파일:

- [client/services/storageService.ts](/Users/cm/Desktop/beeliber/beeliber-main/client/services/storageService.ts)
- [functions/index.js](/Users/cm/Desktop/beeliber/beeliber-main/functions/index.js)
- [firestore.rules](/Users/cm/Desktop/beeliber/beeliber-main/firestore.rules)

### `branches`

- 용도: 브랜치 마스터, 코드 조회
- `locations`와 역할 분리가 불명확함
- Supabase 목표: `branches`
- 우선순위: 최상

주요 사용 파일:

- [client/services/storageService.ts](/Users/cm/Desktop/beeliber/beeliber-main/client/services/storageService.ts)

### `bookings`

- 용도: 예약 본문
- 현재 예약/고객/운영/정산 필드가 한 문서에 섞여 있을 가능성 큼
- Supabase 목표: `bookings`, `booking_items`, `baggage_items`, `delivery_jobs`, `job_events`, 일부 정산 테이블
- 우선순위: 매우 높음

주요 사용 파일:

- [client/services/storageService.ts](/Users/cm/Desktop/beeliber/beeliber-main/client/services/storageService.ts)
- [functions/index.js](/Users/cm/Desktop/beeliber/beeliber-main/functions/index.js)
- [firestore.rules](/Users/cm/Desktop/beeliber/beeliber-main/firestore.rules)

### `users`

- 용도: 고객 프로필
- Firebase Auth의 프로필 보조 저장소 역할
- Supabase 목표: `profiles`, `customers`
- 우선순위: 높음

주요 사용 파일:

- [client/components/SignupModal.tsx](/Users/cm/Desktop/beeliber/beeliber-main/client/components/SignupModal.tsx)
- [client/services/storageService.ts](/Users/cm/Desktop/beeliber/beeliber-main/client/services/storageService.ts)

## 2-2. 운영 서브 컬렉션

### `daily_closings`

- 용도: 일일 정산/마감
- Supabase 목표: `daily_settlements`

### `expenditures`

- 용도: 지출
- Supabase 목표: `payouts` 또는 `expense_entries` 후보

### `inquiries`

- 용도: 제휴/문의
- Supabase 목표: `partner_inquiries`

### `audit_logs`

- 용도: 감사 로그
- Supabase 목표: `audit_logs`

### `branch_prospects`

- 용도: 지점/브랜치 prospect 관리
- Supabase 목표: `branch_prospects`

### `notices`

- 용도: 공지사항
- Supabase 목표: `notices`

### `chat_sessions`

- 용도: 고객 채팅 세션 헤더
- Supabase 목표: `chat_sessions`

### `chats`

- 용도: 고객 채팅 메시지
- Supabase 목표: `chat_messages`

## 2-3. 설정/정책/CMS 컬렉션

### `settings`

코드상 사용 중인 문서:

- `api_keys`
- `cloud_config`
- `storage_tiers`
- `hero`
- `delivery_prices`
- `privacy_policy`
- `terms_policy`
- `qna_policy`

Supabase 목표:

- `app_settings`
- `pricing_rules`
- `legal_documents`
- `hero_configs`

### `tips_areas`

- 용도: 팁스 CMS 영역

### `tips_themes`

- 용도: 팁스 CMS 테마

### `tips_contents`

- 용도: 팁스 CMS 본문

## 2-4. 할인/프로모션 컬렉션

### `discountCodes`

- 용도: 기본 할인 코드
- Supabase 목표: `discount_codes`

### `promo_codes`

- 용도: 프로모션 코드
- Supabase 목표: `promo_codes`

### `userCoupons`

- 용도: 사용자 지급 쿠폰
- Supabase 목표: `user_coupons`

## 2-5. 보조/레거시 컬렉션

### `archived_bookings`

- 용도: 아카이브 예약
- 현재와 `bookings.isDeleted`가 동시에 존재할 가능성 있음
- Supabase 이전 전 정리 필요

---

## 3. Firebase Storage 경로 인벤토리

코드에서 확인된 주요 경로는 아래와 같다.

### 현재 사용 중

- `bookings/{bookingId}/...`
- `users/{uid}/...`
- `locations/{file}`
- `notices/{file}`
- `hero/{file}`
- `hero/videos/{file}`

관련 파일:

- [storage.rules](/Users/cm/Desktop/beeliber/beeliber-main/storage.rules)
- [client/services/storageService.ts](/Users/cm/Desktop/beeliber/beeliber-main/client/services/storageService.ts)
- [client/components/AdminDashboard.tsx](/Users/cm/Desktop/beeliber/beeliber-main/client/components/AdminDashboard.tsx)

### Supabase 버킷 초안 매핑

- `bookings/*` -> `booking-proofs/`
- `users/*` -> `customer-files/` 또는 `user-private/`
- `locations/*` -> `branch-assets/`
- `notices/*` -> `notice-assets/`
- `hero/*` -> `branding-assets/`

---

## 4. Cloud Functions 인벤토리

현재 주요 Functions는 아래와 같다.

### 관리자/운영

- `verifyAdmin`
- `runClaudeAgent`
- `resendBookingVoucher`
- `processBookingRefund`
- `cancelBooking`
- `partnerApi`

### 이벤트/알림

- `onBookingCreated`
- `onBookingUpdated`
- `notifyGoogleChat`

실제 전환 시 이 함수들은 Supabase Edge Functions 또는 서버 전용 API로 역할 재분류가 필요하다.

관련 파일:

- [functions/index.js](/Users/cm/Desktop/beeliber/beeliber-main/functions/index.js)

---

## 5. 전환 우선순위 정리

### 1순위

- `admins`
- `locations`
- `branches`
- `bookings`
- `users`

### 2순위

- `daily_closings`
- `expenditures`
- `audit_logs`
- `inquiries`
- `branch_prospects`

### 3순위

- `settings`
- `notices`
- `chat_sessions`
- `chats`
- `tips_*`
- `promo_codes`
- `discountCodes`
- `userCoupons`

---

## 6. 확인이 더 필요한 항목

아직 코드만으로는 확정 못 한 항목이다.

- `bookings` 내부 중첩 객체 구조
- `admins` 문서 유형 구분 기준
- `archived_bookings` 실제 사용량
- Storage 실제 파일 수와 버킷 용량
- `settings` 문서별 스키마 편차
- Functions 이벤트가 의존하는 Firestore 필드 목록

---

## 7. 다음 액션

이 문서 다음 산출물은 아래 순서로 이어진다.

1. `ADMIN_QUERY_MAP.md`
2. `SUPABASE_OWNER_SETUP_CHECKLIST.md`
3. `SUPABASE_SCHEMA_DRAFT.md`

