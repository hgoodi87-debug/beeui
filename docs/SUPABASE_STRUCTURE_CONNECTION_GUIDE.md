# Beeliber Supabase Structure Connection Guide
> 업데이트: 2026-03-27  
> 목적: Supabase 이전 이후 구조, 권한, 코드 연결 지점을 한 번에 보는 기준선 정리

---

## 1. 이 문서에서 고정할 기준

이 문서는 아래 4가지를 한 번에 정리한다.

1. 현재 운영 Supabase 프로젝트 기준 구조
2. 테이블 관계와 역할/RLS 기준
3. 레거시 Firebase 개념명과 현재 Supabase 테이블 연결
4. 실제 코드에서 어디가 그 구조를 쓰는지

가장 중요한 원칙은 아래다.

- 물리 스키마 기준: `supabase/migrations/*.sql`
- 운영 상태 기준: `docs/DATABASE_MIGRATION_CHANGELOG.md`
- 화면-테이블 연결 기준: `docs/ADMIN_QUERY_MAP.md`
- branch / location 계약 기준: `docs/BRANCH_LOCATION_CONTRACT.md`
- RLS 최종 방향 기준: `/Users/cm/Downloads/beeliber_rls_optimization_notes.md`

즉, 이 문서는 새 스키마를 만드는 문서가 아니라, 이미 흩어진 기준을 하나로 묶는 연결 문서다.

---

## 2. 현재 운영 기준선

### 운영 프로젝트

- 프로젝트 ref: `xpnfjolqiffduedwtxey`
- URL: `https://xpnfjolqiffduedwtxey.supabase.co`
- 리전: `ap-southeast-1`

### 구조를 볼 때의 우선순위

1. `supabase/migrations/NEW_PROJECT_PART1_core.sql`
2. `supabase/migrations/NEW_PROJECT_PART2_harness.sql`
3. `docs/DATABASE_MIGRATION_CHANGELOG.md`
4. `docs/DATABASE_ERD.md`

### 왜 문서 숫자가 다르게 보이는가

- `docs/DATABASE_ERD.md`는 핵심 운영 구조를 중심으로 요약한 문서다.
- `docs/DATABASE_MIGRATION_CHANGELOG.md`는 Firebase 브릿지/CMS/운영 보조 테이블까지 포함한 전체 운영 관점 문서다.

정리하면:

- `ERD 22 테이블` = 코어 구조 중심 요약
- `39+ 테이블` = 실제 운영용 물리 테이블 집합

이 둘은 충돌이라기보다 범위 차이다. 다만 팀 커뮤니케이션에서는 이 차이를 항상 같이 설명해야 한다.

---

## 3. 가장 중요한 연결 구조

### 인증/직원 연결

```text
auth.users.id
  -> profiles.id
  -> employees.profile_id
  -> employee_roles.employee_id -> roles
  -> employee_branch_assignments.employee_id -> branches
```

여기서 고정할 기준은 아래다.

- `profiles.id = auth.uid()`
- `employees.profile_id = profiles.id`
- 역할은 `roles`, `employee_roles`
- 지점 소속은 `employee_branch_assignments`

### 고객/예약 연결

```text
auth.users.id
  -> customers.id
  -> reservations.customer_id
  -> reservation_items / booking_details / payments / delivery_assignments
  -> proof_assets / operation_status_logs / notifications / issue_tickets
```

여기서 고정할 기준은 아래다.

- `customers.id = auth.uid()`
- 예약의 중심 테이블은 `reservations`
- 실무 확장 상세는 `booking_details`
- 결제 최종 상태 기준은 `payments`

### 운영상 절대 기준

- 예약 묶음의 Source of Truth: `reservations`
- 결제 최종 상태: `payments`
- 직원 권한: `roles`, `employee_roles`
- 직원 지점 범위: `employee_branch_assignments`
- 조직 단위 지점: `branches`
- 고객이 실제 고르는 장소: `locations`

---

## 4. 도메인별 구조 정리

### A. Auth / Org

- `profiles`
- `employees`
- `roles`
- `employee_roles`
- `employee_branch_assignments`
- `branches`
- `branch_types`

역할:

- 로그인 주체, 직원 마스터, 역할, 지점 범위 제어

### B. 서비스 정책 / 마스터

- `services`
- `baggage_types`
- `service_rules`
- `storage_tiers`
- `discount_codes`
- `user_coupons`

역할:

- 예약 가능 여부, 짐 타입, 가격/할인 정책

### C. 예약 / 결제 코어

- `customers`
- `reservations`
- `reservation_items`
- `booking_details`
- `payments`

역할:

- 예약 생성, 가격/상세, 결제 상태

### D. 운영 실행

- `delivery_assignments`
- `proof_assets`
- `operation_status_logs`
- `issue_tickets`
- `notifications`
- `audit_logs`

역할:

- 배송 실행, 증빙, 상태 추적, 이슈, 알림, 감사

### E. 운영 관리 / CMS / 브릿지

- `locations`
- `app_settings`
- `daily_closings`
- `expenditures`
- `partnership_inquiries`
- `branch_prospects`
- `system_notices`
- `chat_sessions`
- `chat_messages`
- `cms_areas`
- `cms_themes`
- `cms_contents`
- `legal_documents`
- `google_reviews`
- `google_review_summary`

역할:

- 관리자 운영 데이터, 콘텐츠, 고객 커뮤니케이션, Firebase 호환 레이어

---

## 5. 레거시 Firebase 개념명 -> 현재 Supabase 연결

현재 프론트 어댑터는 `client/services/storageService.ts`에서 아래처럼 매핑하고 있다.

| 레거시 컬렉션/개념 | 현재 Supabase 테이블 | 메모 |
|---|---|---|
| `admins` | `employees` | 직원 마스터로 이동 |
| `bookings` | `admin_booking_list_v1` | 관리자 조회 view, 원천은 `reservations + booking_details + payments` |
| `archived_bookings` | `booking_details` | 보관 개념만 남고 물리 분리는 없음 |
| `locations` | `locations` | 동일 |
| `inquiries` | `partnership_inquiries` | 제휴 문의 |
| `notices` | `system_notices` | 공지 |
| `promo_codes` | `discount_codes` | 할인 코드 |
| `chat_sessions` | `chat_sessions` | 동일 |
| `chats` | `chat_messages` | 메시지 분리 |
| `users` | `customers` | 고객 엔티티 |
| `tips_areas` | `cms_areas` | CMS 영역 |
| `tips_themes` | `cms_themes` | CMS 테마 |
| `tips_contents` | `cms_contents` | CMS 콘텐츠 |
| `settings` | `app_settings` | key-value 설정 저장소 |

여기서 가장 많이 헷갈리는 포인트는 아래 2개다.

### `bookings`는 이제 단일 테이블이 아니다

과거 Firebase의 `bookings` 개념은 현재 아래 묶음으로 나뉜다.

- 예약 마스터: `reservations`
- 예약 확장 상세: `booking_details`
- 품목: `reservation_items`
- 결제: `payments`
- 운영 상태: `operation_status_logs`
- 관리자 조회 계약: `admin_booking_list_v1`

즉, 화면에서 `booking`이라고 부르더라도 DB는 예약 묶음 단위로 봐야 한다.

### `admins`는 이제 로그인 자격 테이블이 아니다

과거 `admins`는 아래 역할이 섞여 있었다.

- 직원 마스터
- 로그인 자격
- 역할 정보
- UID 매핑

현재는 아래처럼 분리한다.

- 계정: `auth.users`
- 프로필: `profiles`
- 직원: `employees`
- 역할: `employee_roles`, `roles`
- 지점 범위: `employee_branch_assignments`

---

## 6. 실제 코드 연결 지점

### 프론트 데이터 진입점

- `client/services/supabaseClient.ts`
  - Supabase REST GET/PATCH/POST/DELETE 공통 유틸
- `client/services/storageService.ts`
  - 기존 Firestore 스타일 호출을 Supabase REST와 관리자 조회 view로 라우팅하는 어댑터
- `client/services/supabaseStorageUploadService.ts`
  - Supabase Storage 업로드 경로

### 관리자 인증

- `client/services/adminAuthService.ts`
  - `VITE_ADMIN_AUTH_PROVIDER=supabase`일 때 Supabase 로그인 사용
  - 로그인 후 `profiles`, `employees`, `employee_roles`, `employee_branch_assignments` 조회

현재 관리자 역할은 화면 호환을 위해 아래처럼 레거시 UI role로 재매핑된다.

| Supabase role code | 현재 UI role |
|---|---|
| `super_admin` | `super` |
| `hq_admin` | `hq` |
| `hub_manager` | `branch` |
| `partner_manager` | `partner` |
| `finance_staff` | `finance` |
| `ops_staff` | `staff` |
| `cs_staff` | `cs` |
| `driver` | `driver` |
| `marketing` | `hq` |
| `content_manager` | `hq` |

### 마이그레이션 / 부트스트랩

- `scripts/supabase/syncFirebasePhase1Auth.mjs`
- `scripts/supabase/syncFirebasePhase1Org.mjs`
- `scripts/supabase/bootstrapFirstAdmin.mjs`
- `scripts/supabase/migrateFirebaseData.mjs`
- `scripts/supabase/verifyPhase1Access.mjs`

### Edge Functions

- `supabase/functions/on-booking-created`
- `supabase/functions/on-booking-updated`
- `supabase/functions/toss-payments`
- `supabase/functions/cancel-booking`
- `supabase/functions/sync-google-reviews`

### 서버 측 직접 DB 접근

- `functions/src/shared/dbService.js`

주의:

- 이 파일은 `POSTGRES_URL`로 직접 PostgreSQL 연결을 열고
- `app.user_id`, `app.role` 세션 변수를 세팅하는 방식이다.

하지만 현재 Supabase 문서와 RLS 기준선은 주로 `auth.uid()`와 관계 테이블 기반이다.  
즉, 이 경로는 현재 Supabase RLS 설계와 완전히 같은 모델이 아니다.

---

## 7. RLS 기준선 정리

사용자가 준 메모 `/Users/cm/Downloads/beeliber_rls_optimization_notes.md`의 핵심은 아래다.

- `profiles.id = auth.uid()`
- `customers.id = auth.uid()`
- 게스트 쓰기는 직접 테이블 쓰기보다 RPC / Edge Function / service role로 보낸다
- HQ는 전역 접근, 지점 직원은 배정 지점 범위 접근
- `payments`, `notifications` 쓰기는 의도적으로 강하게 제한한다
- `chat_sessions`, `chat_messages`는 초안 기준 HQ 전용

이 방향을 현재 Beeliber의 **목표 RLS 기준선**으로 본다.

### 현재 저장소 안에 존재하는 RLS 모델은 3층이다

#### 1. 구형 모델

- `supabase/migrations/003_rls.sql`
- `supabase/migrations/NEW_PROJECT_PART2_harness.sql` 일부 정책

특징:

- `auth.jwt()->>'role'` 기반
- `admin`, `ops_manager`, `finance` 같은 구형 role 문자열 사용
- 일부 운영 테이블에 `using (true)` 정책이 넓게 열려 있음

#### 2. Auth/Org 개선 모델

- `supabase/migrations/20260321_000001_phase1_auth_org_core.sql`
- `supabase/migrations/NEW_PROJECT_PART1_core.sql`
- `supabase/migrations/FULL_MIGRATION_FOR_NEW_PROJECT.sql` 앞부분

특징:

- `current_profile_id()`
- `current_employee_id()`
- `has_any_role()`
- `has_branch_access()`
- `shares_branch_with_employee()`

즉, `auth.uid() -> 직원 -> 역할 -> 지점 배정` 구조로 범위를 계산한다.

#### 3. 임시 예외/패치

- `supabase/migrations/FIX_ANON_RLS.sql`

특징:

- `profiles`, `roles`, `employee_roles`, `employee_branch_assignments`에 anon select를 열어 둠

이 파일은 운영 안정화를 위한 임시 패치인지, 최종 정책인지 별도 확인이 필요하다.

### 문서상 최종 결정

앞으로 구조 연결 문서에서는 아래를 정식 기준으로 본다.

1. 직원 권한은 `jwt role string`보다 `roles + employee_roles`가 기준
2. 지점 범위는 `employee_branch_assignments`가 기준
3. 고객 범위는 `customers.id = auth.uid()`가 기준
4. 게스트 쓰기는 직접 테이블 insert보다 Edge Function/RPC 경유를 우선
5. `payments`, `notifications`, 채팅 관련 테이블은 공개 write 정책을 재검토 대상으로 둔다

---

## 8. 지금 바로 연결할 때 필요한 체크리스트

### 1. 환경 변수 기준

프론트:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY` 또는 `VITE_SUPABASE_PUBLISHABLE_KEY`
- `VITE_ADMIN_AUTH_PROVIDER=supabase`

서버/스크립트:

- `SUPABASE_URL`
- `SUPABASE_SECRET_KEY` 또는 `SUPABASE_SERVICE_ROLE_KEY`
- 필요 시 `POSTGRES_URL`

### 2. Auth/직원 레이어 먼저 동기화

먼저 맞아야 하는 테이블:

- `auth.users`
- `profiles`
- `employees`
- `employee_roles`
- `employee_branch_assignments`

이 레이어가 안정되지 않으면 관리자 로그인, 권한 분기, 지점 범위 조회가 모두 흔들린다.

### 3. 예약 화면은 `booking_details`만 보면 안 된다

관리자/운영 화면 연결 시 최소 아래 묶음을 같이 봐야 한다.

- `reservations`
- `booking_details`
- `reservation_items`
- `payments`
- `delivery_assignments`
- `operation_status_logs`

### 4. 레거시 화면 용어를 같이 적어야 한다

화면 기획이나 QA에서는 여전히 아래 용어가 나온다.

- bookings
- admins
- chats
- settings

문서/개발 시 반드시 현재 테이블명으로 병기해야 한다.

---

## 9. 남아 있는 구조 불일치

현재 저장소 기준으로 바로 보이는 불일치는 아래다.

### A. RLS 모델이 완전히 단일화되지 않았다

- 일부는 `auth.uid() + 관계 테이블`
- 일부는 `auth.jwt()->>'role'`
- 일부는 `using (true)`

즉, 정책 기준이 아직 섞여 있다.

### B. 채팅 정책 방향이 충돌한다

- 사용자 메모: `chat_sessions`, `chat_messages`는 HQ-only 초안
- 현재 통합 마이그레이션 일부: public all 정책

즉, 이 영역은 최종 정책 확정이 필요하다.

### C. 서버 직접 DB 접근 모델이 별도다

- `functions/src/shared/dbService.js`는 세션 변수 기반
- Supabase 쪽 문서는 `auth.uid()` 기반

즉, 둘을 같은 권한 모델로 간주하면 안 된다.

### D. 관리자 UI는 아직 레거시 role명을 사용한다

- 실제 DB role은 `super_admin`, `hq_admin`, `ops_staff` 등
- UI 분기 role은 `super`, `hq`, `staff` 등

즉, 화면 권한 버그를 볼 때는 항상 role 매핑층을 같이 확인해야 한다.

---

## 10. 추천 정리 결론

현재 Beeliber Supabase 구조를 팀에서 설명할 때는 아래 한 줄로 정리하면 된다.

> 인증은 `auth.users -> profiles -> employees -> roles/assignments`, 예약은 `reservations` 중심, 화면 호환은 `storageService` 레거시 매핑층이 맡고, RLS 최종 방향은 `auth.uid()` + 역할/지점 관계 테이블 기반으로 통일한다.

실무적으로는 아래를 기억하면 된다.

- 화면 개념 `booking` = DB에서는 `reservations` 묶음
- 화면 개념 `admin` = DB에서는 `profiles/employees/roles/assignments`
- 공개/게스트 동작 = 직접 테이블 접근보다 함수 경유 우선
- 권한 모델 기준선 = 메모의 RLS 방향이 맞고, 기존 느슨한 정책은 정리 대상
