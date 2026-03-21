# Supabase Phase 1 실행 런북

## 문서 목적

이 문서는 Beeliber의 Supabase Phase 1을 실제로 실행할 때 따라갈 순서표다.

대상 범위는 여기까지다.

- 관리자 로그인
- 직원/권한/지점 구조
- RLS 기본 정책

---

## 1. 먼저 준비할 것

사장님이 Supabase에서 먼저 완료해야 할 것:

1. 프로젝트 생성
2. Region 확정
3. Email Auth 활성화
4. Google OAuth 유지 여부 결정
5. `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `PROJECT_REF` 확인

---

## 2. SQL 실행 순서

### Step 1. SQL Editor 열기

Supabase 콘솔에서 `SQL Editor`를 연다.

### Step 2. 아래 파일 실행

[20260321_000001_phase1_auth_org_core.sql](/Users/cm/Desktop/beeliber/beeliber-main/supabase/migrations/20260321_000001_phase1_auth_org_core.sql)

이 파일이 하는 일:

- `profiles`
- `roles`
- `branches`
- `employees`
- `employee_roles`
- `employee_branch_assignments`

테이블 생성

- `updated_at` 트리거 생성
- 기본 role seed 입력
- RLS helper function 생성
- RLS policy 생성

### Step 3. 실행 후 바로 확인

테이블이 생겼는지 확인:

- `profiles`
- `roles`
- `branches`
- `employees`
- `employee_roles`
- `employee_branch_assignments`

역할 seed가 들어갔는지 확인:

- `super_admin`
- `hq_admin`
- `hub_manager`
- `partner_manager`
- `ops_staff`
- `driver`
- `cs_staff`

---

## 3. 첫 관리자 부트스트랩

이 단계는 꼭 필요합니다.

이유:

- 현재 RLS상 직원/역할/지점 쓰기는 HQ 권한이 있어야 하는데
- 처음 한 명은 사람이 직접 넣어줘야 하니까요, 참나.

### 방법

1. Supabase Auth에서 사장님 이메일 계정 1개를 먼저 만든다.
2. 그 계정의 UUID를 확인한다.
3. 아래 SQL에서 값만 바꿔서 실행한다.

```sql
with upsert_profile as (
  insert into public.profiles (
    id,
    email,
    display_name,
    account_type,
    is_active
  )
  values (
    'AUTH_USER_UUID_HERE',
    'ceo@bee-liber.com',
    '본사 관리자',
    'employee',
    true
  )
  on conflict (id) do update
  set
    email = excluded.email,
    display_name = excluded.display_name,
    updated_at = now()
  returning id
),
upsert_branch as (
  insert into public.branches (
    branch_code,
    name,
    branch_type,
    status,
    is_active
  )
  values (
    'HQ-SEOUL',
    'Beeliber HQ',
    'HQ',
    'active',
    true
  )
  on conflict ((lower(branch_code))) do update
  set
    name = excluded.name,
    updated_at = now()
  returning id
),
upsert_employee as (
  insert into public.employees (
    profile_id,
    employee_code,
    name,
    email,
    job_title,
    org_type,
    employment_status
  )
  select
    p.id,
    'EMP-HQ-0001',
    '본사 관리자',
    'ceo@bee-liber.com',
    'CEO',
    'HQ',
    'active'
  from upsert_profile p
  on conflict (profile_id) do update
  set
    name = excluded.name,
    email = excluded.email,
    job_title = excluded.job_title,
    updated_at = now()
  returning id
)
insert into public.employee_roles (employee_id, role_id, is_primary)
select
  e.id,
  r.id,
  true
from upsert_employee e
join public.roles r
  on lower(r.code) = 'super_admin'
on conflict (employee_id, role_id) do update
set
  is_primary = excluded.is_primary,
  updated_at = now();
```

### 이어서 지점 배정도 넣기

```sql
insert into public.employee_branch_assignments (
  employee_id,
  branch_id,
  assignment_type,
  is_primary
)
select
  e.id,
  b.id,
  'primary',
  true
from public.employees e
join public.profiles p on p.id = e.profile_id
join public.branches b on lower(b.branch_code) = lower('HQ-SEOUL')
where p.id = 'AUTH_USER_UUID_HERE'
on conflict (employee_id, branch_id) do update
set
  assignment_type = excluded.assignment_type,
  is_primary = excluded.is_primary,
  updated_at = now();
```

---

## 4. 사장님이 Supabase에서 꼭 확인할 체크포인트

### Auth

- 이메일 로그인 켜짐
- 사장님 계정 생성 완료
- 추후 Google OAuth 유지 여부 결정

### Database

- 위 6개 테이블 생성 완료
- role seed 정상 입력
- 첫 관리자 1명 생성 완료
- 첫 HQ branch 생성 완료

### RLS

- 각 테이블 `RLS enabled` 상태 확인
- `profiles`, `employees`, `branches` 정책 생성 확인

---

## 5. 제가 다음에 이어서 할 작업

이 단계가 끝나면 제가 바로 이어서 할 수 있는 건 이겁니다.

1. Supabase 클라이언트 연결 코드 추가
2. 관리자 로그인 PoC
3. HR 목록 PoC
4. Branch 목록 PoC
5. Firebase `admins` -> Supabase `employees` 변환 스크립트 초안

---

## 6. Phase 1 종료 직후 해야 할 보안 작업

이건 꼭 하셔야 합니다.

- 이번 대화에 나온 secret key는 더 이상 깨끗한 키로 보면 안 됩니다.
- Phase 1 검증이 끝나는 즉시 Supabase에서 secret key를 rotate 해야 합니다.
- 새 key는 로컬 파일에 박지 말고 시크릿 저장소와 환경변수로만 교체합니다.

순서:

1. Supabase `API Settings`에서 secret key rotate
2. 배포 시크릿과 로컬 환경변수 교체
3. 예전 key 폐기 확인

---

## 7. 지금 당장 사장님이 해야 할 한 줄 요약

사장님은 지금 Supabase 콘솔에서

1. 프로젝트 만들고
2. 위 migration SQL 실행하고
3. 본인 Auth 계정 하나 만든 뒤
4. 첫 관리자 부트스트랩 SQL만 실행하시면 됩니다.
5. Phase 1 끝나면 secret key rotate 하시면 됩니다.
