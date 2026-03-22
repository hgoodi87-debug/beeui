# 사장님용 Supabase 작업 체크리스트

## 문서 목적

이 문서는 사장님이 Supabase 콘솔과 운영 설정에서 직접 해야 할 작업만 따로 정리한 체크리스트다.

개발 작업과 분리해서 봐야 덜 헷갈립니다, 참나.

---

## 1. 이번 주 사장님이 직접 해야 할 일

## A. 프로젝트 생성

사장님이 Supabase에서 먼저 해주셔야 할 것:

1. 새 Supabase 프로젝트 생성
2. 프로젝트 이름 결정
3. 운영 region 결정
4. 강한 DB 비밀번호 생성
5. 팀원 접근 계정 초대 정책 정하기

추천 메모:

- 운영 region은 Firebase와 사용자 위치를 같이 고려해서 정합니다.
- 운영용과 실험용을 분리하면 더 안전합니다.

## B. 프로젝트 기본 보안 설정

Supabase에서 바로 확인할 것:

1. `Project Settings`에서 `Database password` 안전하게 보관
2. `API Settings`에서 `anon key`, `service_role key` 확인
3. `SSL enforcement` 켜기
4. `Network restrictions` 필요 여부 검토
5. 백업/복구 정책 확인

주의:

- `service_role key`는 절대 프론트 코드에 넣으면 안 됩니다.
- 이 키는 서버/시크릿 매니저 전용입니다.

## C. Auth 설정

Supabase에서 결정해야 할 것:

1. 로그인 식별자를 `email` 기준으로 갈지, `email + login_id` 병행으로 갈지
2. 직원 계정과 고객 계정을 같은 Auth 안에서 role/profile로 분리할지
3. Google OAuth를 유지할지
4. 비밀번호 정책 강도 정하기
5. 이메일 인증 요구 여부 결정

현재 Beeliber 기준 추천:

- 직원/관리자: email 기반 고정
- 고객: email + Google 병행 가능
- 직원 role은 `auth.users`가 아니라 `public.profiles`, `employees`에서 관리

## D. Storage 버킷 생성

Supabase Storage에서 미리 만들어둘 버킷:

1. `brand-public`
2. `branch-public`
3. `ops-private`
4. `customer-private`
5. `backoffice-private`

권장 구분:

- `brand-public`, `branch-public` = 공개 버킷
- `ops-private`, `customer-private`, `backoffice-private` = 비공개 버킷

각 버킷별로 정해야 할 것:

- 공개 버킷인지
- 내부 전용인지
- 서명 URL이 필요한지
- 최대 파일 크기
- 허용 MIME 타입

실행용 정책 초안:

- [SUPABASE_STORAGE_POLICY_DRAFT.md](/Users/cm/Desktop/beeliber/beeliber-main/docs/SUPABASE_STORAGE_POLICY_DRAFT.md)
- [20260322_000002_storage_bucket_rls_draft.sql](/Users/cm/Desktop/beeliber/beeliber-main/supabase/migrations/20260322_000002_storage_bucket_rls_draft.sql)

## E. 역할 체계 승인

사장님이 확정해주셔야 하는 최소 역할:

- `super_admin`
- `hq_admin`
- `hub_manager`
- `partner_manager`
- `finance_staff`
- `ops_staff`
- `driver`
- `cs_staff`

이건 “나중에 대충” 정하면 안 됩니다.

왜냐하면 이 역할명이 RLS 정책, 관리자 UI 분기, 데이터 이관 스크립트 기준값이 되기 때문입니다.

## F. 지점 체계 승인

사장님이 결정해야 할 것:

1. HQ / HUB / PARTNER / DRIVER_GROUP 구분 유지 여부
2. 지점의 유일 식별자 기준
3. branch code 규칙
4. 폐점/비활성 지점 상태값 정의

추천:

- 지점은 물리적 이름이 아니라 `branch_code`를 기준 키로 삼기
- 화면 표시 이름과 식별 키를 분리하기

## G. Phase 1 종료 후 키 회전

이번처럼 `secret key`가 채팅이나 외부 공유 경로에 한 번이라도 노출됐으면, Phase 1이 끝난 뒤 반드시 새 키로 바꿔야 합니다.

사장님이 꼭 해야 할 것:

1. Supabase `API Settings`에서 기존 secret key rotate
2. 새 key를 서버 환경변수와 시크릿 저장소에만 반영
3. 예전 key가 들어간 로컬 메모, 채팅, 임시 파일 정리
4. GitHub Actions / 배포 시크릿도 함께 교체

메모:

- 현재 Firebase 레거시 `finance` 역할은 Supabase에서 `finance_staff`로 승격 없이 분리 유지합니다.
- 프론트 어드민 UI에는 자동으로 `finance` 권한으로 다시 매핑되게 맞춰둘 예정입니다.

---

## 2. 제가 Supabase에서 받아야 할 값

작업 진행을 위해 나중에 사장님이 저한테 전달해주실 값은 아래입니다.

### 필수

- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_PROJECT_REF`
- `VITE_SUPABASE_PUBLISHABLE_KEY`

### 서버 작업 시 필요

- `SUPABASE_SERVICE_ROLE_KEY`
- DB 연결 문자열 또는 pooled connection string

### OAuth 사용할 경우

- Google OAuth Client ID
- Google OAuth Client Secret

주의:

- 이 값들은 코드에 하드코딩하면 안 됩니다.
- `.env` 또는 시크릿 관리로만 받아야 합니다.

---

## 3. Supabase 콘솔에서 바로 만들어둘 것

이번 주 기준 최소 생성 권장 목록:

### 스키마/테이블

우선 빈 틀이라도 만들어둘 후보:

- `profiles`
- `employees`
- `roles`
- `employee_roles`
- `branches`
- `employee_branch_assignments`

### Auth

- 이메일 로그인 활성화
- Google OAuth 여부 결정

### Storage

- 위 버킷 5개 생성

### SQL 준비

- `uuid` 기본 생성 전략 확인
- `updated_at trigger` 패턴 준비
- soft delete용 `status` 컬럼 정책 확정
- `storage.objects` RLS와 signed URL 전략 확인

---

## 4. 사장님 승인 필요 항목

제가 개발 이어가기 전에 사장님이 승인해주셔야 하는 내용입니다.

1. 운영 region
2. 직원/고객 Auth 통합 여부
3. 역할 이름 최종안
4. branch code 규칙
5. Storage 버킷 이름 최종안
6. soft delete 기본 정책

---

## 5. 제 추천 결정안

사장님이 빨리 결정하셔야 하니까 제가 추천안도 같이 적어드릴게요.

### Auth

- 직원/관리자/고객 모두 Supabase Auth 사용
- 직원 role은 `public` 테이블에서 관리

### 직원 기준 키

- `employee.id`는 내부 UUID
- 로그인 식별자는 `email`
- 별도 표시용 `employee_code` 선택 가능

### 삭제 정책

- 실제 delete 금지
- `active`, `inactive`, `suspended`, `resigned`, `merged` 상태 전환

### 지점 기준 키

- `branch_code` 고정
- 화면 이름은 별도 컬럼 유지

---

## 6. 이번 주 사장님 액션 한 줄 요약

사장님이 당장 해야 할 건 딱 이겁니다.

1. Supabase 프로젝트 생성
2. region / auth 방식 / 역할 체계 승인
3. Storage 버킷 이름 승인
4. 저한테 `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `PROJECT_REF` 전달 준비
5. Phase 1 끝나면 secret key rotate
6. 프론트 env에 `VITE_ADMIN_AUTH_PROVIDER=supabase` 전환 시점 결정
