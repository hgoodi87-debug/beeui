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
6. SEO / CTR / 이탈율 기획 기준

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

## 8. SEO / 유입 최적화 기준

- SEO 구조, CTR, 이탈율 개선 실행안은 [SEO_CTR_BOUNCE_PLAN.md](/Users/cm/Desktop/beeliber/beeliber-main/docs/SEO_CTR_BOUNCE_PLAN.md) 를 본다.
- 핵심 원칙:
  - 색인 URL 체계는 하나로 통일한다
  - 실제 배포 HTML에 page별 title / description / canonical 이 반영되어야 한다
  - sitemap / prerender / live route 는 같은 URL 집합을 바라봐야 한다
  - SEO lander 는 검색 의도와 첫 화면 메시지가 일치해야 한다

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

## 10. Firebase DB Retired 상태

### 현재 기준

- 운영 웹과 관리자 웹은 Firebase Firestore를 더 이상 런타임 데이터베이스로 사용하지 않는다
- 예약, 지점, 정산, 회계, HR, 공지, 할인코드, 설정 저장은 Supabase REST / view / Edge Function 기준이다
- `client/firebaseApp.ts`의 `db`는 더미 객체이며, Firestore 초기화는 하지 않는다
- `storageService.ts` 내부의 `doc/getDoc/getDocs/setDoc` 명칭은 기존 코드 호환을 위한 Supabase 어댑터 이름일 뿐 실제 Firebase DB 호출이 아니다

### 과거 데이터 기준

- 과거 예약은 `scripts/supabase/migrateFirebaseBookings.mjs`로 `customers + reservations + booking_details + reservation_items + payments`에 적재한다
- Firebase Admin/Org 데이터는 `scripts/supabase/syncFirebasePhase1Auth.mjs`, `scripts/supabase/syncFirebasePhase1Org.mjs` 기준으로 Supabase `profiles + employees + employee_roles + employee_branch_assignments`에 동기화한다
- Firebase DB는 운영 조회 브리지로 쓰지 않고, 필요 시 일회성 마이그레이션 입력원으로만 취급한다

### 운영 원칙

- 새 읽기/쓰기는 Supabase only
- 로컬 bridge / Firebase fallback을 전제로 기능을 만들지 않는다
- 과거 데이터가 필요하면 bridge보다 먼저 Supabase 적재를 수행한다
- 배포 서버 공개 페이지와 관리자 페이지는 Firebase DB 가용성에 의존하지 않는다
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
