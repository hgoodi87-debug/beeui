# Supabase Phase 1 실행 런북

## 문서 목적

이 문서는 Beeliber의 Supabase Phase 1을 실제로 실행할 때 따라갈 순서표다.

대상 범위는 여기까지다.

- 관리자 로그인
- 직원/권한/지점 구조
- RLS 기본 정책

현재 운영에서 무엇을 Firebase에 남기고 무엇을 Supabase로 넘기는지는 아래 문서를 같이 본다.

- [Firebase / Supabase 운영 경계표](/Users/cm/Desktop/beeliber/beeliber-main/docs/FIREBASE_SUPABASE_OPERATING_BOUNDARY.md)

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
- `finance_staff`
- `ops_staff`
- `driver`
- `cs_staff`

### Step 4. 프론트 전환용 env 준비

`client/.env` 또는 배포 환경변수에 아래 값을 넣어둡니다.

```env
VITE_SUPABASE_URL=https://fzvfyeskdivulazjjpgr.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=사장님_프로젝트_publishable_key
VITE_ADMIN_AUTH_PROVIDER=supabase
```

메모:

- `publishable key`만 프론트에 넣습니다.
- `secret key`는 절대 프론트에 넣으면 안 됩니다.
- `VITE_ADMIN_AUTH_PROVIDER=supabase`를 넣기 전까지는 기존 Firebase 관리자 로그인 경로가 유지됩니다.
- Supabase role code는 프론트에서 기존 어드민 권한(`super`, `hq`, `branch`, `finance`, `staff`, `driver`, `cs`, `partner`)으로 다시 매핑됩니다.
- Firebase Hosting GitHub Actions 배포를 쓴다면 아래 이름으로도 같이 넣어야 합니다.
  - Repository Secret `VITE_SUPABASE_URL`
  - Repository Secret `VITE_SUPABASE_PUBLISHABLE_KEY`
  - Repository Variable `VITE_ADMIN_AUTH_PROVIDER=supabase`

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
- 프론트 env에 `VITE_ADMIN_AUTH_PROVIDER=supabase` 넣을 준비 완료

### Database

- 위 6개 테이블 생성 완료
- role seed 정상 입력
- 첫 관리자 1명 생성 완료
- 첫 HQ branch 생성 완료

### RLS

- 각 테이블 `RLS enabled` 상태 확인
- `profiles`, `employees`, `branches` 정책 생성 확인

---

## 5. Firebase 직원/지점 이관 스크립트

Phase 1 SQL이 깔렸다고 바로 직원 구조가 채워지는 건 아니니까, 순서를 이렇게 가는 게 제일 안전합니다.

1. Firebase `admins` -> Supabase Auth 사용자 생성
2. Firebase `admins / locations / branches` -> Supabase Phase 1 조직 테이블 반영
3. 프론트 env를 `VITE_ADMIN_AUTH_PROVIDER=supabase`로 전환

### 5-1. Firebase 관리자 -> Supabase Auth

파일:

- [syncFirebasePhase1Auth.mjs](/Users/cm/Desktop/beeliber/beeliber-main/scripts/supabase/syncFirebasePhase1Auth.mjs)

실행 전제:

1. Firebase Admin SDK가 읽을 수 있는 자격증명 준비
2. Supabase Email Auth 활성화
3. 현재 Firebase `admins` 문서에 email + password가 들어 있는 원본 관리자 문서가 존재

Firebase 자격증명은 둘 중 하나면 됩니다.

- `FIREBASE_SERVICE_ACCOUNT_PATH=/절대경로/service-account.json`
- `FIREBASE_SERVICE_ACCOUNT_JSON='{"type":"service_account", ... }'`

읽기 전용 미리보기:

```bash
SUPABASE_URL=프로젝트_URL \
SUPABASE_SECRET_KEY=서버_전용_secret_key \
FIREBASE_PROJECT_ID=beeliber-main \
npm run supabase:sync-phase1-auth
```

실제 반영:

```bash
SUPABASE_URL=프로젝트_URL \
SUPABASE_SECRET_KEY=서버_전용_secret_key \
FIREBASE_PROJECT_ID=beeliber-main \
SUPABASE_APPLY=true \
npm run supabase:sync-phase1-auth
```

선택 옵션:

- 기존 Auth 계정 메타데이터도 같이 맞추고 싶으면 `SUPABASE_AUTH_UPDATE_EXISTING=true`
- 기존 Auth 계정 비밀번호까지 Firebase 값으로 덮고 싶으면 `SUPABASE_AUTH_UPDATE_PASSWORD=true`

주의:

- 기본값은 `dry-run`
- email 없는 관리자 문서는 건너뜁니다.
- password 없는 문서도 건너뜁니다.
- 비밀번호는 로그에 출력하지 않습니다.

### 5-2. Firebase 직원/지점 -> Supabase 조직 테이블

Phase 1 SQL이 깔린 다음에는, Firebase `admins` / `locations` / `branches`를 Supabase Phase 1 테이블로 맞춰 넣는 스크립트를 쓸 수 있습니다.

파일:

- [syncFirebasePhase1Org.mjs](/Users/cm/Desktop/beeliber/beeliber-main/scripts/supabase/syncFirebasePhase1Org.mjs)

실행 전제:

1. Firebase Admin SDK가 읽을 수 있는 자격증명 준비
2. Supabase Phase 1 SQL 실행 완료
3. Supabase Auth에 최소한 옮길 직원 이메일 계정이 먼저 생성되어 있음
  - 가장 쉬운 방법은 바로 위 `supabase:sync-phase1-auth`를 먼저 돌리는 겁니다.

여기서도 Firebase 자격증명은 아래 둘 중 하나면 됩니다.

- `FIREBASE_SERVICE_ACCOUNT_PATH=/절대경로/service-account.json`
- `FIREBASE_SERVICE_ACCOUNT_JSON='{"type":"service_account", ... }'`

읽기 전용 미리보기:

```bash
SUPABASE_URL=프로젝트_URL \
SUPABASE_SECRET_KEY=서버_전용_secret_key \
FIREBASE_PROJECT_ID=beeliber-main \
npm run supabase:sync-phase1-org
```

실제 반영:

```bash
SUPABASE_URL=프로젝트_URL \
SUPABASE_SECRET_KEY=서버_전용_secret_key \
FIREBASE_PROJECT_ID=beeliber-main \
SUPABASE_APPLY=true \
npm run supabase:sync-phase1-org
```

이 스크립트가 하는 일:

- Firebase `admins` 문서에서 UID 매핑 문서를 제외하고 정규 직원 후보를 고릅니다.
- Firebase `locations` + `branches`를 Supabase `branches` 후보로 병합합니다.
- Supabase Auth에 이미 존재하는 이메일 계정만 골라 `profiles`, `employees`, `employee_roles`, `employee_branch_assignments`를 맞춰 넣습니다.
- 레거시 역할은 아래처럼 변환합니다.
  - `super` -> `super_admin`
  - `branch` -> `hub_manager`
  - `partner` -> `partner_manager`
  - `finance` -> `finance_staff`
  - `cs` -> `cs_staff`
  - `driver` -> `driver`
  - 그 외 -> `ops_staff`

주의:

- 이 스크립트는 기본값이 `dry-run`입니다.
- Supabase Auth에 아직 없는 이메일 계정은 자동 생성하지 않고, “미일치”로만 리포트합니다.

### 5-3. 일괄 실행

위 두 단계를 따로 돌리기 귀찮으면, 준비가 끝난 뒤 아래 일괄 실행기로 한 번에 진행할 수 있습니다.

파일:

- [runPhase1Migration.mjs](/Users/cm/Desktop/beeliber/beeliber-main/scripts/supabase/runPhase1Migration.mjs)

실행:

```bash
SUPABASE_URL=프로젝트_URL \
SUPABASE_SECRET_KEY=서버_전용_secret_key \
FIREBASE_PROJECT_ID=beeliber-main \
FIREBASE_SERVICE_ACCOUNT_JSON='{"type":"service_account", ... }' \
npm run supabase:phase1-run
```

이 스크립트 순서:

1. `supabase:verify`
2. `supabase:sync-phase1-auth`
3. `supabase:sync-phase1-org`
4. 마지막 `supabase:verify`

중요:

- 이 일괄 실행기는 `verify` 단계에서 테이블이 없으면 바로 멈춥니다.
- 즉, 반드시 먼저 SQL Editor에서 [20260321_000001_phase1_auth_org_core.sql](/Users/cm/Desktop/beeliber/beeliber-main/supabase/migrations/20260321_000001_phase1_auth_org_core.sql)을 실행해야 합니다.

---

## 6. 로그인 인벤토리 산출

직원들이 실제로 무슨 이메일로 로그인해야 하는지 공유하려면 아래 스크립트로 로그인 인벤토리를 뽑습니다.

파일:

- [exportPhase1LoginInventory.mjs](/Users/cm/Desktop/beeliber/beeliber-main/scripts/supabase/exportPhase1LoginInventory.mjs)

실행:

```bash
SUPABASE_URL=프로젝트_URL \
SUPABASE_SECRET_KEY=서버_전용_secret_key \
npm run supabase:export-login-inventory
```

산출물:

- [SUPABASE_PHASE1_LOGIN_INVENTORY.md](/Users/cm/Desktop/beeliber/beeliber-main/docs/SUPABASE_PHASE1_LOGIN_INVENTORY.md)
- [SUPABASE_PHASE1_LOGIN_INVENTORY.csv](/Users/cm/Desktop/beeliber/beeliber-main/docs/SUPABASE_PHASE1_LOGIN_INVENTORY.csv)

메모:

- `@staff.bee-liber.invalid` 는 synthetic 로그인 이메일입니다.
- 실제 이메일이 확보되면 나중에 Supabase 계정 이메일을 교체해야 합니다.

---

## 7. 제가 다음에 이어서 할 작업

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
