# Beeliber Implementation Master Guide
> 업데이트: 2026-03-28
> 목적: 운영 반영에 필요한 기준을 한 문서로 묶은 통합 가이드

## 1. 이 문서의 역할

이 문서는 아래 내용을 한 번에 본다.

1. 브랜드 반영 기준
2. Supabase 구조 기준
3. 관리자 화면 데이터 계약
4. env / Edge Function / 코드 연결 지점
5. 현재 운영 마이그레이션 기준

새 반영 작업을 시작할 때는 이 문서를 먼저 본다.

---

## 2. 브랜드 반영 요약

### 서비스/메시지 기준

- 브랜드 표기: `beeliber`
- 핵심 메시지: `짐 없는 자유, 온전한 만끽`
- 핵심 가치: `Trust / Freedom / Satisfaction`
- 톤: 경쾌하고 친근하지만 과장하지 않음

### Phase 1 운영 범위

- 현재 운영 서비스는 `Hub -> 인천공항`
- 금지:
  - 호텔 픽업
  - 공항 -> 호텔 배송
  - 아직 시작하지 않은 미래 서비스 암시

### 카피 주의

- 피해야 하는 표현:
  - `저렴한`, `싼`, `택배`, `물류`, `호텔픽업`
- 과장 금지:
  - `24시간 이용 가능`
  - 무제한/완전 보상 뉘앙스

브랜드 원문은 [beeliber_brand_guide_v4.md](/Users/cm/Desktop/beeliber/beeliber-main/docs/beeliber_brand_guide_v4.md) 를 본다.

---

## 3. 현재 운영 프로젝트 기준

- 프로젝트 ref: `xpnfjolqiffduedwtxey`
- URL: `https://xpnfjolqiffduedwtxey.supabase.co`
- 물리 데이터 스키마: `public`
- 새 REST/Edge 조회는 모두 `public` 기준으로 본다

### 스키마 원칙

- 실테이블 기준은 `public.*`
- 클라이언트 REST 요청은 `Accept-Profile: public`
- 쓰기 요청은 `Content-Profile: public`
- 새 관리자 조회는 원시 테이블보다 view/RPC를 우선 사용

핵심 연결 파일:

- [supabaseClient.ts](/Users/cm/Desktop/beeliber/beeliber-main/client/services/supabaseClient.ts)
- [adminAuthService.ts](/Users/cm/Desktop/beeliber/beeliber-main/client/services/adminAuthService.ts)
- [admin-auth.ts](/Users/cm/Desktop/beeliber/beeliber-main/supabase/functions/_shared/admin-auth.ts)

---

## 4. 데이터 구조 기준

### 인증 / 직원

```text
auth.users.id
  -> profiles.id
  -> employees.profile_id
  -> employee_roles.employee_id -> roles
  -> employee_branch_assignments.employee_id -> branches
```

고정 규칙:

- `profiles.id = auth.uid()`
- `employees.profile_id = profiles.id`
- 역할은 `roles`, `employee_roles`
- 직원 지점 범위는 `employee_branch_assignments`

### 고객 / 예약

```text
customers.id (= auth.uid())
  -> reservations.customer_id
  -> booking_details
  -> payments
  -> reservation_items
```

고정 규칙:

- 예약의 Source of Truth는 `reservations`
- 운영 확장 필드는 `booking_details`
- 결제 최종 상태는 `payments`

### branch / location 계약

- `branches` = 조직 / 권한 / 정산 단위
- `locations` = 고객이 실제 선택하는 픽업 / 드롭오프 장소

허용 연결 순서:

1. `locations.branch_id -> branches.id`
2. `locations.branch_code <-> branches.branch_code`
3. 레거시 호환 토큰 비교는 fallback 용도로만 사용

직접 비교 금지:

- `booking.pickupLocation === booking.branchId`
- `closing.branchId === location.id` 를 고정 규칙처럼 쓰는 코드

상세 문서는 [BRANCH_LOCATION_CONTRACT.md](/Users/cm/Desktop/beeliber/beeliber-main/docs/BRANCH_LOCATION_CONTRACT.md) 를 본다.

---

## 5. 관리자 화면 데이터 계약

### 예약 목록

더 이상 `booking_details` 단독 조회를 기준으로 보지 않는다.

현재 관리자 예약 목록 기준:

- `public.admin_booking_list_v1`
- 구성: `reservations + booking_details + payments + branches + locations + reservation_items`

목적:

- 기존 관리자 UI가 기대하는 booking shape 유지
- 원천 기준은 `reservations`로 이동
- 결제/상태/지점/운영 장소를 한 레코드에서 함께 노출

### 정산 / 회계 집계

현재 기준 view:

- `public.admin_revenue_daily_v1`
- `public.admin_revenue_monthly_v1`

용도:

- 일별 매출
- 월별 매출
- 결제수단별 합계
- 취소/환불
- 정산 확정/미확정
- 파트너 지급 예상액

### 과거 매출 데이터

과거 Firebase 매출은 아직 일부 환경에서 읽기 전용 브리지로 병합한다.

현재 복구된 범위:

- `bookings`
- `daily_closings`
- `expenditures`

원칙:

- 운영 기준은 Supabase
- 로컬 개발 환경에서만 legacy bridge 읽기 병합 허용
- 새 쓰기 경로는 Supabase만 사용

핵심 연결 파일:

- [storageService.ts](/Users/cm/Desktop/beeliber/beeliber-main/client/services/storageService.ts)
- [AdminDashboard.tsx](/Users/cm/Desktop/beeliber/beeliber-main/client/components/AdminDashboard.tsx)
- [useAdminStats.ts](/Users/cm/Desktop/beeliber/beeliber-main/client/src/domains/admin/hooks/useAdminStats.ts)

요약 쿼리 기준은 [ADMIN_QUERY_MAP.md](/Users/cm/Desktop/beeliber/beeliber-main/docs/ADMIN_QUERY_MAP.md) 를 본다.

### 배송 선보관 가격 규칙

- `DELIVERY` 예약에서 `pickupDate < dropoffDate` 이면 선보관 보관비를 붙인다.
- 보관비는 시간제가 아니라 `일일 단가`를 쓴다.
- 배송일 당일은 보관비에서 제외한다.
- 계산식은 `1일차 = day1`, 이후는 `extraDay` 추가다.

상세 기준은 [DELIVERY_PRE_STORAGE_PRICING_RULE.md](/Users/cm/Desktop/beeliber/beeliber-main/docs/DELIVERY_PRE_STORAGE_PRICING_RULE.md) 를 본다.

---

## 6. env / 연결 기준

### 프론트

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PUBLIC_URL`
- `VITE_SUPABASE_ANON_KEY`
- `VITE_SUPABASE_PUBLISHABLE_KEY`
- `VITE_ADMIN_AUTH_PROVIDER=supabase`
- `VITE_STORAGE_UPLOAD_PROVIDER=supabase`

### 서버 / 함수 / 스크립트

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `SUPABASE_SECRET_KEY`

원칙:

- 프론트는 `VITE_SUPABASE_*`
- 서버/스크립트는 `SUPABASE_*`
- 새 코드는 시크릿 하드코딩 금지
- 로컬 개발에서 `VITE_SUPABASE_URL=/supabase` 를 쓰더라도, 배포 런타임은 실제 Supabase 호스트로 해석되어야 한다
- 정적 호스팅 배포에서는 `/supabase` 프록시 URL을 그대로 쓰면 안 된다

상세 매핑은 [ENV_CONNECTION_MAP.md](/Users/cm/Desktop/beeliber/beeliber-main/docs/ENV_CONNECTION_MAP.md) 를 본다.

---

## 7. Edge Function 기준

현재 관리자 쪽 핵심 함수:

- `signed-upload`
- `admin-account-sync`

공통 인증 기준:

- 관리자 세션 토큰 사용
- `public` 스키마 기준 REST 호출
- 민감 에러는 `message` 중심으로만 노출

핵심 파일:

- [signed-upload/index.ts](/Users/cm/Desktop/beeliber/beeliber-main/supabase/functions/signed-upload/index.ts)
- [admin-account-sync/index.ts](/Users/cm/Desktop/beeliber/beeliber-main/supabase/functions/admin-account-sync/index.ts)
- [admin-auth.ts](/Users/cm/Desktop/beeliber/beeliber-main/supabase/functions/_shared/admin-auth.ts)

---

## 8. 마이그레이션 기준

### 현재 운영 기준

- `20260327065330_remote_baseline.sql`
- `20260328000100_storage_runtime_bridge.sql`
- `20260328000200_admin_reporting_views.sql`

### 직접 재적용 금지

- `20260322_000002_storage_bucket_rls_draft.sql`
- `FULL_MIGRATION_FOR_NEW_PROJECT.sql`
- `NEW_PROJECT_PART1_core.sql`
- `NEW_PROJECT_PART2_harness.sql`
- `AUTH_DATA_MIGRATION.sql`

이 파일들은 참고/부트스트랩/초안 성격이 섞여 있어 운영 프로젝트에 그대로 재실행하지 않는다.

상세 이력은 [DATABASE_MIGRATION_CHANGELOG.md](/Users/cm/Desktop/beeliber/beeliber-main/docs/DATABASE_MIGRATION_CHANGELOG.md) 를 본다.

---

## 9. 반영 작업 체크리스트

새 작업을 할 때는 아래 순서를 기본으로 본다.

1. 브랜드/Phase 1 범위 위반 여부 확인
2. `public` 스키마 기준인지 확인
3. 예약은 `reservations` 중심 계약인지 확인
4. 관리자 조회는 raw table 대신 view/RPC 우선 적용

---

## 10. 남아 있는 레거시 브리지 요약

### 아직 남아 있는 Firebase / legacy 읽기 브리지

- `bookings`
  - 관리자 예약 목록에서 local legacy read bridge 병합 가능
- `daily_closings`
  - 정산 화면에서 legacy 병합 가능
- `expenditures`
  - 회계 화면에서 legacy 병합 가능
- `locations`
  - Supabase 실패 시 로컬 브리지 또는 Firebase fallback 존재
- `admins`
  - HR 화면 일부 fallback 존재

### Supabase-only 전환 우선순위

1. `locations`, `booking_details`, `app_settings`
   - 공개 페이지와 예약 플로우가 직접 영향
2. `daily_closings`, `expenditures`
   - 정산 / 회계 집계 일관성 영향
3. `employees`, `branches`, `admin account sync`
   - HR / 관리자 권한 영향
4. notices / CMS / chats / discounts
   - 운영 보조 기능

### 관리자 탭 기준 남은 병합 구간

- `OVERVIEW`
  - Supabase view 우선, 일부 bookings / expenditures / closings legacy 병합 가능
- `DELIVERY_BOOKINGS`, `STORAGE_BOOKINGS`
  - `admin_booking_list_v1` 우선, legacy bookings 병합 가능
- `DAILY_SETTLEMENT`, `ACCOUNTING`, `MONTHLY_SETTLEMENT`, `REPORTS`
  - `admin_revenue_*` view 우선, expenditures / closings / 일부 bookings 병합 가능
- `LOCATIONS`
  - Supabase `locations` 우선, 실패 시 bridge/fallback 영향 가능
- `HR`
  - Supabase `employees` 우선, 일부 legacy admin fallback 존재

원칙:

- 새 쓰기는 Supabase only
- legacy 병합은 과거 데이터 조회와 로컬 복구용으로만 축소
- 배포 서버 공개 페이지는 legacy bridge에 의존하지 않도록 유지
5. `branches`와 `locations`를 섞어 쓰지 않는지 확인
6. 과거 매출이 필요한 화면이면 legacy read bridge 영향 확인
7. 운영 마이그레이션과 충돌하지 않는지 확인

---

## 10. 상세 참고 문서

- 구조 상세: [SUPABASE_STRUCTURE_CONNECTION_GUIDE.md](/Users/cm/Desktop/beeliber/beeliber-main/docs/SUPABASE_STRUCTURE_CONNECTION_GUIDE.md)
- 관리자 데이터 맵: [ADMIN_QUERY_MAP.md](/Users/cm/Desktop/beeliber/beeliber-main/docs/ADMIN_QUERY_MAP.md)
- branch/location 계약: [BRANCH_LOCATION_CONTRACT.md](/Users/cm/Desktop/beeliber/beeliber-main/docs/BRANCH_LOCATION_CONTRACT.md)
- ERD: [DATABASE_ERD.md](/Users/cm/Desktop/beeliber/beeliber-main/docs/DATABASE_ERD.md)
- env: [ENV_CONNECTION_MAP.md](/Users/cm/Desktop/beeliber/beeliber-main/docs/ENV_CONNECTION_MAP.md)
- 마이그레이션 이력: [DATABASE_MIGRATION_CHANGELOG.md](/Users/cm/Desktop/beeliber/beeliber-main/docs/DATABASE_MIGRATION_CHANGELOG.md)
