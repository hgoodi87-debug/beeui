# Beeliber Supabase Storage 실행 런북

## 문서 목적

이 문서는 Beeliber가 Supabase Storage로 넘어갈 때,
어떤 순서로 무엇을 실행해야 하는지 실무 기준으로 정리한 순서표다.

이번 문서는 **지금 코드 기준**으로 썼다.

즉, 현재 Firebase Storage 업로드가 아직 살아 있는 상태에서
무엇부터 바꾸고, 무엇은 나중에 바꾸는지 기준을 잡아준다.

---

## 1. 현재 상태 요약

현재 프론트 업로드는 아직 Firebase Storage를 사용한다.

확인된 업로드 경로:

- 공지 이미지: `notices/...`
- 지점 대표/수령 이미지: `locations/...`
- 히어로 이미지/영상: `hero/...`

관련 코드:

- [storageService.ts](/Users/cm/Desktop/beeliber/beeliber-main/client/services/storageService.ts)
- [AdminDashboard.tsx](/Users/cm/Desktop/beeliber/beeliber-main/client/components/AdminDashboard.tsx)

즉, 지금 당장 private 버킷 운영 증빙부터 한 번에 옮기는 게 아니라,
**공개 자산부터 얇게 전환**하는 순서가 더 안전하다.

---

## 2. 권장 실행 순서

### Step 1. Phase 1 스키마 선확인

먼저 아래 파일이 이미 적용돼 있어야 한다.

- [20260321_000001_phase1_auth_org_core.sql](/Users/cm/Desktop/beeliber/beeliber-main/supabase/migrations/20260321_000001_phase1_auth_org_core.sql)

확인할 것:

- `profiles`
- `roles`
- `branches`
- `employees`
- `employee_roles`
- `employee_branch_assignments`

왜냐하면 이번 Storage 정책 초안은 이 구조를 참조하니까요, 참나.

### Step 2. Storage 초안 SQL 실행

다음으로 이 파일을 Supabase SQL Editor에서 실행한다.

- [20260322_000002_storage_bucket_rls_draft.sql](/Users/cm/Desktop/beeliber/beeliber-main/supabase/migrations/20260322_000002_storage_bucket_rls_draft.sql)

이 파일이 하는 일:

- 버킷 5개 생성
- `customers`, `bookings`, `storage_assets` 최소 테이블 생성
- Storage helper function 생성
- `storage.objects` RLS 정책 생성

### Step 3. 버킷 생성 결과 확인

Supabase Storage에서 아래 버킷이 생겼는지 확인:

- `brand-public`
- `branch-public`
- `ops-private`
- `customer-private`
- `backoffice-private`

### Step 4. 정책 smoke test

확인 포인트:

- 관리자 계정으로 `brand-public` 업로드 가능
- 지점 담당 계정으로 자기 지점 `branch-public` 업로드 가능
- 일반 계정으로 `ops-private` 직접 업로드 불가
- 고객 계정으로 자기 `customer-private` 경로만 허용

### Step 5. 공개 자산부터 코드 전환

현재 코드상 먼저 바꾸기 좋은 순서는 이거다.

1. `hero/...` -> `brand-public`
2. `locations/...` -> `branch-public`
3. `notices/...` -> `backoffice-private`

이유:

- 운영 증빙보다 영향 범위가 작다
- 관리자 화면에서 바로 테스트 가능하다
- signed upload 없이도 구조 검증이 쉽다

### Step 6. 운영 증빙은 signed upload 방식으로 별도 전환

이 단계에서 옮길 대상:

- 픽업 사진
- 드롭오프 사진
- 보관 체크인/체크아웃 사진
- 파손/클레임 사진

여기는 경로 계산과 ownership 검증이 중요하니
클라이언트 직업로드보다 **서버 발급 signed upload URL**로 가야 한다.

관련 설계 문서:

- [SUPABASE_SIGNED_UPLOAD_FLOW.md](/Users/cm/Desktop/beeliber/beeliber-main/docs/SUPABASE_SIGNED_UPLOAD_FLOW.md)
- [SUPABASE_SIGNED_UPLOAD_ENDPOINT_DRAFT.md](/Users/cm/Desktop/beeliber/beeliber-main/docs/SUPABASE_SIGNED_UPLOAD_ENDPOINT_DRAFT.md)

---

## 3. Firebase 경로 -> Supabase 버킷 매핑

### 공개 자산

- `hero/...` -> `brand-public/{category}/{yyyymm}/{uuid}.{ext}`
- `locations/...` -> `branch-public/{branch_type}/{branch_code}/{category}/{yyyymm}/{uuid}.{ext}`

### 내부 CMS/백오피스

- `notices/...` -> `backoffice-private/notice/{yyyy}/{mm}/{entity_id}/{uuid}.{ext}`

### 운영 증빙

- `bookings/...` 또는 예약 관련 사진 -> `ops-private/{service_type}/{event_type}/{yyyy}/{mm}/{branch_code}/{booking_id}/{bag_id}/{uuid}.{ext}`

### 고객 파일

- `users/...` 또는 고객 제출물 -> `customer-private/{customer_id}/{topic}/{yyyy}/{mm}/{uuid}.{ext}`

---

## 4. 현재 코드에서 먼저 손댈 대상

### 1차

- `AdminDashboard`의 히어로 이미지 업로드
- `AdminDashboard`의 지점 이미지 업로드

이유:

- 공개/준공개 버킷 검증에 적합
- 지점/관리자 권한 분기를 바로 볼 수 있다

### 2차

- 공지 이미지 업로드

이유:

- `backoffice-private` + signed URL 또는 관리자 직접 업로드 기준을 잡기 좋다
- 현재 draft endpoint가 이 범위까지 먼저 받도록 정리돼 있다

### 3차

- 예약/운영 증빙 업로드

이유:

- 예약 ownership, branch access, signed upload, 메타 기록이 모두 필요하다

---

## 5. 실행 전 체크리스트

- Supabase 프로젝트 dev/staging에서 먼저 검증
- 운영에 바로 실행하지 않기
- `storage_assets` 메타가 실제 엔터티와 연결되는지 확인
- private 버킷은 공개 URL 사용 금지
- 서비스 키는 서버/시크릿 전용
- signed upload endpoint는 최소 `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` 필요
- 관리자 요청 헤더는 Firebase ID token 기준으로 먼저 검증

---

## 6. 이번 런북의 완료 조건

아래가 되면 “Storage 준비 1차 완료”로 본다.

- 버킷 5개 생성 완료
- Storage RLS 정책 생성 완료
- 관리자 계정 업로드 smoke test 통과
- 지점 계정 업로드 smoke test 통과
- signed upload 서버 설계 문서 확정
- signed upload 발급 endpoint 초안 정리 완료
