# Beeliber Supabase Storage 정책 초안

## 문서 목적

이 문서는 Beeliber의 Supabase Storage 버킷 구조와 `storage.objects` RLS 초안을 한 번에 보기 위한 기준 문서다.

이번 초안은 현재 Phase 1 스키마(`profiles`, `employees`, `roles`, `branches`)와 연결되도록 맞췄다.

실행용 SQL은 아래 파일이다.

- [20260322_000002_storage_bucket_rls_draft.sql](/Users/cm/Desktop/beeliber/beeliber-main/supabase/migrations/20260322_000002_storage_bucket_rls_draft.sql)

같이 보면 좋은 운영 문서:

- [SUPABASE_STORAGE_EXECUTION_RUNBOOK.md](/Users/cm/Desktop/beeliber/beeliber-main/docs/SUPABASE_STORAGE_EXECUTION_RUNBOOK.md)
- [SUPABASE_SIGNED_UPLOAD_FLOW.md](/Users/cm/Desktop/beeliber/beeliber-main/docs/SUPABASE_SIGNED_UPLOAD_FLOW.md)

---

## 1. 버킷 분리 기준

### 공개 버킷

- `brand-public`
- `branch-public`

원칙:

- 조회는 공개 URL 기준
- 업로드/수정/삭제는 인증 + 역할 제한

### 비공개 버킷

- `ops-private`
- `customer-private`
- `backoffice-private`

원칙:

- 기본적으로 공개 URL 금지
- JWT 기반 접근 또는 signed URL 사용
- 운영 증빙은 지점/예약/고객 ownership 기준으로 제한

---

## 2. 버킷별 책임

### `brand-public`

- 브랜드 로고
- 랜딩 이미지
- 공용 배너

권한:

- 읽기 공개
- 쓰기/수정/삭제는 본사 관리자만

### `branch-public`

- 지점 대표 이미지
- 지점 공개 썸네일
- 파트너/허브 노출용 사진

권한:

- 읽기 공개
- 쓰기/수정은 해당 지점 접근 가능한 직원 또는 관리자
- 삭제는 관리자만

### `ops-private`

- 픽업 사진
- 드롭오프 사진
- 보관 체크인/체크아웃 사진
- 파손/클레임 증빙

권한:

- 읽기: 본사/재무, 해당 지점 직원, 해당 예약 소유 고객
- 쓰기: 해당 지점 직원만
- 수정/삭제: 관리자만

### `customer-private`

- 고객 제출 사진
- 고객 민감 첨부
- 고객 전용 문서

권한:

- 읽기/쓰기/수정: 본인 또는 관리자
- 삭제: 관리자만

### `backoffice-private`

- 정산 첨부
- 내부 문서
- 운영 백오피스 전용 파일

권한:

- 읽기: 본사/재무 또는 메타상 자기 지점 문서에 접근 가능한 매니저
- 쓰기: 직원 계정
- 수정/삭제: 관리자만

---

## 3. object path 기준

버킷 안의 `name` 값은 아래 규칙을 전제로 한다.

### `branch-public`

```text
{branch_type}/{branch_code}/{category}/{yyyymm}/{uuid}.{ext}
```

예:

```text
hub/MSIS/hero/202603/xxxxx.webp
partner/HBO/thumb/202603/yyyyy.jpg
```

### `ops-private`

```text
{service_type}/{event_type}/{yyyy}/{mm}/{branch_code}/{booking_id}/{bag_id}/{uuid}.{ext}
```

예:

```text
delivery/pickup/2026/03/MSIS/uuid-booking/bag-01/file.jpg
storage/checkin/2026/03/HBO/uuid-booking/bag-02/file.heic
```

### `customer-private`

```text
{customer_id}/{topic}/{yyyy}/{mm}/{uuid}.{ext}
```

### `backoffice-private`

```text
{domain}/{yyyy}/{mm}/{entity_id}/{uuid}.{ext}
```

---

## 4. 정책 설계 핵심

핵심은 세 가지다.

### 1) 공개 버킷은 읽기 공개 / 쓰기 제한

- `brand-public`, `branch-public`은 공개 버킷
- 그래도 업로드/덮어쓰기/삭제는 아무나 못 한다

### 2) 운영 증빙은 경로 + 지점 접근 권한을 같이 본다

- `ops-private`는 경로의 `branch_code`, `booking_id`를 정책에 녹였다
- 해당 지점 직원인지, 해당 예약 고객인지 같이 확인한다

### 3) 백오피스 파일은 메타 테이블로 한 번 더 검증한다

- `backoffice-private`는 경로만 보고 판단하지 않는다
- `storage_assets` 메타에서 실제 엔터티와 지점 연결을 한 번 더 본다

---

## 5. 이번 초안에서 같이 들어간 최소 테이블

Storage 정책 참조를 위해 아래 초안 테이블도 같이 포함했다.

- `customers`
- `bookings`
- `storage_assets`

메모:

- 이미 운영용 테이블이 있으면 그대로 쓰고, 컬럼명만 맞추면 된다
- 아직 없을 때는 이 초안이 최소 골격 역할을 한다

---

## 6. 주의할 점

### `upsert`

Supabase Storage에서 `upsert`를 쓰면 `INSERT`만이 아니라 경우에 따라 `SELECT`, `UPDATE`도 같이 필요하다.

그래서 이번 초안은 공개 버킷 관리용 `select` 정책도 같이 넣어뒀다.

### update/delete 보수 정책

- 운영 증빙 파일은 덮어쓰기보다 새 파일 업로드 + DB 상태 변경이 더 안전하다
- 그래서 `ops-private`, `backoffice-private`는 `update/delete`를 꽤 보수적으로 막았다

### service_role key

- `service_role key`는 RLS를 우회한다
- 서버 전용으로만 써야 하고, 프론트에는 절대 넣으면 안 된다

---

## 7. 다음 단계

이 초안 다음엔 아래 순서가 좋다.

1. 실제 `customers`, `bookings`, `storage_assets` 최종 컬럼명 확정
2. signed upload URL 경로 계산을 서버 함수로 고정
3. private 버킷 업로드 경로를 클라이언트가 임의 생성하지 않게 제한
4. 운영 증빙 업로드 플로우를 Firebase Storage에서 Supabase Storage로 단계 이전
