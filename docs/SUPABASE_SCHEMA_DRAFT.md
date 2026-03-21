# Beeliber Supabase 스키마 초안

## 문서 목적

이 문서는 Firebase 구조를 Supabase로 옮길 때 사용할 1차 스키마 초안이다.

원칙은 간단하다.

- 먼저 운영 코어를 안정화한다.
- 직원/권한/지점부터 고친다.
- 예약/배송/정산은 그 다음이다.

---

## 1. 스키마 설계 원칙

### 핵심 원칙

- `auth.users`는 인증 원본만 담당
- 업무 데이터는 `public` 스키마 테이블에서 관리
- 역할은 문자열 한 칸이 아니라 관계형으로 분리
- 삭제보다 상태 전환 우선
- 지점 배정은 별도 테이블로 분리

### 공통 컬럼 원칙

거의 모든 운영 테이블에 아래 컬럼을 둔다.

- `id uuid primary key`
- `created_at timestamptz not null default now()`
- `updated_at timestamptz not null default now()`
- `status text`
- `created_by uuid null`
- `updated_by uuid null`

---

## 2. Phase 1 우선 테이블

## 2-1. `profiles`

목적:

- `auth.users`와 1:1 연결되는 공개 프로필

주요 컬럼:

- `id uuid primary key references auth.users(id) on delete cascade`
- `email text unique`
- `display_name text`
- `account_type text`
- `last_login_at timestamptz`
- `is_active boolean default true`

메모:

- 직원/고객 공통 베이스 프로필

## 2-2. `employees`

목적:

- 직원 마스터

주요 컬럼:

- `id uuid primary key default gen_random_uuid()`
- `profile_id uuid unique references public.profiles(id) on delete cascade`
- `employee_code text unique`
- `name text not null`
- `email text`
- `login_id text`
- `phone text`
- `job_title text`
- `employment_status text not null default 'active'`
- `org_type text`
- `memo text`

상태 후보:

- `active`
- `inactive`
- `suspended`
- `resigned`
- `merged`

## 2-3. `roles`

목적:

- 시스템 역할 마스터

권장 기본값:

- `super_admin`
- `hq_admin`
- `hub_manager`
- `partner_manager`
- `finance_staff`
- `ops_staff`
- `driver`
- `cs_staff`

주요 컬럼:

- `id uuid primary key`
- `code text unique not null`
- `name text not null`
- `description text`

## 2-4. `employee_roles`

목적:

- 직원과 역할 연결

주요 컬럼:

- `id uuid primary key`
- `employee_id uuid references public.employees(id) on delete cascade`
- `role_id uuid references public.roles(id)`
- `is_primary boolean default false`

## 2-5. `branches`

목적:

- 지점/허브/파트너 거점 마스터

주요 컬럼:

- `id uuid primary key`
- `branch_code text unique not null`
- `name text not null`
- `branch_type text not null`
- `address text`
- `lat numeric`
- `lng numeric`
- `is_active boolean default true`

`branch_type` 후보:

- `HQ`
- `HUB`
- `PARTNER`
- `DRIVER_GROUP`

## 2-6. `employee_branch_assignments`

목적:

- 직원과 지점의 소속/겸직 관리

주요 컬럼:

- `id uuid primary key`
- `employee_id uuid references public.employees(id) on delete cascade`
- `branch_id uuid references public.branches(id) on delete cascade`
- `assignment_type text`
- `is_primary boolean default false`

---

## 3. Phase 2 운영 코어 테이블

## 3-1. `customers`

주요 컬럼:

- `id uuid primary key`
- `profile_id uuid null references public.profiles(id) on delete set null`
- `name text`
- `email text`
- `phone text`
- `sns_channel text`
- `sns_id text`

## 3-2. `bookings`

주요 컬럼:

- `id uuid primary key`
- `booking_code text unique not null`
- `customer_id uuid references public.customers(id)`
- `service_type text not null`
- `booking_status text not null`
- `payment_status text`
- `settlement_status text`
- `origin_branch_id uuid references public.branches(id)`
- `destination_branch_id uuid references public.branches(id)`
- `pickup_date date`
- `pickup_time text`
- `dropoff_date date`
- `dropoff_time text`
- `total_price numeric`
- `currency text default 'KRW'`
- `source_channel text`
- `legacy_firebase_id text`

## 3-3. `baggage_items`

주요 컬럼:

- `id uuid primary key`
- `booking_id uuid references public.bookings(id) on delete cascade`
- `bag_type text`
- `size_code text`
- `weight numeric`
- `quantity integer default 1`
- `photo_url text`

## 3-4. `delivery_jobs`

주요 컬럼:

- `id uuid primary key`
- `booking_id uuid references public.bookings(id) on delete cascade`
- `assigned_branch_id uuid references public.branches(id)`
- `assigned_employee_id uuid references public.employees(id)`
- `job_status text`
- `scheduled_at timestamptz`
- `completed_at timestamptz`

## 3-5. `job_events`

주요 컬럼:

- `id uuid primary key`
- `job_id uuid references public.delivery_jobs(id) on delete cascade`
- `booking_id uuid references public.bookings(id) on delete cascade`
- `event_type text not null`
- `event_at timestamptz not null default now()`
- `actor_employee_id uuid null references public.employees(id)`
- `payload jsonb`

---

## 4. Phase 3 정산 / 리포트 테이블

## 4-1. `daily_settlements`

주요 컬럼:

- `id uuid primary key`
- `branch_id uuid references public.branches(id)`
- `settlement_date date not null`
- `cash_total numeric default 0`
- `card_total numeric default 0`
- `refund_total numeric default 0`
- `confirmed_by uuid null references public.employees(id)`
- `confirmed_at timestamptz`

## 4-2. `monthly_settlements`

주요 컬럼:

- `id uuid primary key`
- `branch_id uuid references public.branches(id)`
- `settlement_month date not null`
- `gross_sales numeric default 0`
- `refund_total numeric default 0`
- `net_sales numeric default 0`

## 4-3. `partner_commissions`

주요 컬럼:

- `id uuid primary key`
- `branch_id uuid references public.branches(id)`
- `booking_id uuid references public.bookings(id)`
- `commission_rate numeric`
- `commission_amount numeric`

## 4-4. `audit_logs`

주요 컬럼:

- `id uuid primary key`
- `actor_profile_id uuid null references public.profiles(id)`
- `actor_employee_id uuid null references public.employees(id)`
- `target_type text not null`
- `target_id text not null`
- `action text not null`
- `payload jsonb`
- `created_at timestamptz not null default now()`

---

## 5. RLS 초안 방향

## 공통 원칙

- 모든 `public` 운영 테이블은 RLS 활성화
- 조회/수정 권한은 `profiles -> employees -> roles -> branches`를 따라 계산

## 최소 정책 예시

### `profiles`

- 본인만 조회/수정
- `super_admin`은 전체 조회 가능

### `employees`

- 본인 조회 가능
- HQ 관리자는 전체 조회 가능
- 지점 관리자는 자기 지점 소속만 조회 가능

### `branches`

- 인증 사용자 읽기 가능
- HQ만 쓰기 가능

### `bookings`

- HQ는 전체 조회 가능
- 지점 관리자는 자기 지점 관련 예약만 조회 가능
- 고객은 본인 예약만 조회 가능

### `daily_settlements`

- HQ/재무만 조회 가능
- 지점 사용자는 자기 지점 데이터만 조회 가능

---

## 6. 마이그레이션 매핑 메모

### `admins` -> Supabase

- 로그인 자격은 `auth.users`
- 공개 프로필은 `profiles`
- 직원 정보는 `employees`
- 역할은 `employee_roles`
- 소속 지점은 `employee_branch_assignments`

### `locations` + `branches` -> Supabase

- 우선 `branches` 하나로 통합 설계
- 레거시 필드는 필요 시 `metadata jsonb` 보관

### `bookings` -> Supabase

- 예약 본문은 `bookings`
- 짐 목록은 `baggage_items`
- 배송 상태 이력은 `job_events`

### `daily_closings` + 일부 `bookings` 정산 필드

- `daily_settlements`
- `monthly_settlements`
- `partner_commissions`

---

## 7. 이번 주 PoC 범위

이번 주 PoC는 여기까지만 잡는다.

1. `profiles`
2. `employees`
3. `roles`
4. `employee_roles`
5. `branches`
6. `employee_branch_assignments`

이 범위가 끝나야 관리자 로그인과 인사관리가 살아납니다.
