# Beeliber Env Connection Map
> 업데이트: 2026-03-27  
> 목적: 현재 Beeliber 코드에서 어떤 환경 변수를 어디에 연결해야 하는지 정리

---

## 1. 이번 대화 기준으로 바로 매핑되는 값

사용자가 이번 대화에서 준 값 중 현재 코드에 바로 연결되는 것은 아래다.

| 전달값 종류 | 표준 env 키 | 들어가는 위치 | 비고 |
|---|---|---|---|
| Supabase 프로젝트 URL | `VITE_SUPABASE_URL` | `client/.env.local` | 프론트 REST/Storage/Edge Function 호출용 |
| Supabase 프로젝트 URL | `SUPABASE_URL` | 셸 env / `functions/.env.local` / Supabase Edge Functions secrets | 서버/스크립트/Edge Function 공통 |
| Supabase 서버용 시크릿 키 | `SUPABASE_SERVICE_ROLE_KEY` | 서버/Functions/Edge Functions secrets | 서버 관리자 권한용 |
| Supabase 서버용 시크릿 키 | `SUPABASE_SECRET_KEY` | 셸 env / `functions/.env.local` | 현재 마이그레이션 스크립트 다수가 이 이름 사용 |

### 아직 확정 매핑되지 않은 값

이번 대화에서 받은 `클라이언트 id` 값은 현재 저장소의 env 이름과 1:1로 바로 확정되지 않는다.

현재 코드에서 실제로 쓰는 클라이언트 계열 값은 아래 2종류다.

- `VITE_NAVER_MAP_CLIENT_ID`
- `VITE_TOSS_PAYMENTS_CLIENT_KEY`

즉, 그 UUID가 어느 서비스의 client id인지 확정되기 전에는 임의로 넣지 않는 것이 안전하다.

---

## 2. 지금 기준으로 추천하는 표준 env 구성

### A. 프론트엔드 `client/.env.local`

```bash
VITE_SUPABASE_URL=...
VITE_SUPABASE_PUBLISHABLE_KEY=...
VITE_SUPABASE_ANON_KEY=...
VITE_ADMIN_AUTH_PROVIDER=supabase
VITE_STORAGE_UPLOAD_PROVIDER=supabase
VITE_SUPABASE_STORAGE_SIGNED_UPLOAD_ENDPOINT=https://your-project-ref.supabase.co/functions/v1/signed-upload
VITE_ADMIN_ACCOUNT_SYNC_ENDPOINT=https://your-project-ref.supabase.co/functions/v1/admin-account-sync

# 선택
VITE_NAVER_MAP_CLIENT_ID=...
VITE_TOSS_PAYMENTS_ENABLED=true
VITE_TOSS_PAYMENTS_CLIENT_KEY=...
VITE_TOSS_PAYMENTS_MOCK_MODE=false
VITE_LOCAL_ADMIN_DATA_BRIDGE_URL=http://localhost:8790
VITE_RECAPTCHA_SITE_KEY=...
```

로컬 개발 예외:

- 현재 프로젝트는 `client/vite.config.ts`에서 `/supabase -> 실제 Supabase URL` 프록시를 잡아두고 있다.
- 따라서 로컬 `client/.env.local`에서는 `VITE_SUPABASE_URL=/supabase`로 써도 정상 동작한다.
- 운영/일반 기준 문서에서는 이해를 위해 실제 URL 형식을 표준으로 적는다.

원칙:

- 프론트에는 절대 `SUPABASE_SECRET_KEY`나 `SUPABASE_SERVICE_ROLE_KEY`를 넣지 않는다.
- 프론트는 공개 키만 사용한다.

### B. Functions / 서버 `functions/.env.local`

```bash
SUPABASE_URL=...
SUPABASE_SERVICE_ROLE_KEY=...
SUPABASE_SECRET_KEY=...
POSTGRES_URL=...

# 선택
SMTP_PASS=...
GOOGLE_CHAT_WEBHOOK_URL=...
TOSS_PAYMENTS_SECRET_KEY=...
TOSS_SECRET_KEY=...
GOOGLE_PLACES_API_KEY=...
```

원칙:

- 현재 저장소는 `SUPABASE_SECRET_KEY`와 `SUPABASE_SERVICE_ROLE_KEY`를 혼용한다.
- 당장은 같은 서버용 관리자 키를 두 이름 모두에 맞춰두는 것이 안전하다.

### C. Supabase 마이그레이션 / 운영 스크립트 실행용 셸 env

```bash
SUPABASE_URL=...
SUPABASE_SECRET_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
SUPABASE_PUBLISHABLE_KEY=...
```

스크립트는 대부분 셸에서 직접 읽으므로 `.env` 자동 로딩보다 실행 셸 env를 우선 기준으로 본다.

### D. Supabase Edge Functions secrets

```bash
SUPABASE_URL=...
SUPABASE_SERVICE_ROLE_KEY=...
SMTP_USER=...
SMTP_PASS=...
GOOGLE_CHAT_WEBHOOK_URL=...
GOOGLE_PLACES_API_KEY=...
TOSS_SECRET_KEY=...
```

---

## 3. 현재 코드에서 Supabase 핵심 env가 연결되는 위치

### `VITE_SUPABASE_URL`

프론트에서 가장 넓게 쓰는 기본 URL이다.

- `client/services/supabaseClient.ts:6`
  - REST `/rest/v1/*` 호출 기본 URL
- `client/services/storageService.ts:12`, `client/services/storageService.ts:29`
  - Storage 업로드/공개 URL 생성
- `client/services/adminAuthService.ts:27`
  - 관리자 로그인용 `/auth/v1/*`, `/rest/v1/*`
- `client/services/tossPaymentsService.ts:2`, `client/services/tossPaymentsService.ts:204`, `client/services/tossPaymentsService.ts:249`
  - Toss 결제 Edge Function 호출
- `client/services/supabaseStorageUploadService.ts:66`, `client/services/supabaseStorageUploadService.ts:168`
  - Supabase Storage 공개 URL / signed upload 연계
- `client/components/AdminDashboard.tsx:277-283`
  - 바우처 재발행용 Edge Function 호출

### `VITE_SUPABASE_PUBLISHABLE_KEY`

프론트 공개 키로 쓰인다.

- `client/services/adminAuthService.ts:28`
  - 관리자 비밀번호 로그인, 토큰 갱신, 로그아웃
- `client/services/supabaseStorageUploadService.ts:68`, `client/services/supabaseStorageUploadService.ts:146-149`, `client/services/supabaseStorageUploadService.ts:354-360`
  - signed upload 기능 활성화 + 요청 헤더
- `client/services/supabaseClient.ts:8-12`
  - `VITE_SUPABASE_ANON_KEY` 없을 때 폴백
- `client/services/storageService.ts:13`
  - Storage 업로드용 헤더 폴백
- `client/services/tossPaymentsService.ts:3`
  - 결제 Edge Function 요청 헤더 폴백

### `VITE_SUPABASE_ANON_KEY`

현재 프론트 fetch 유틸의 호환용 공개 키 별칭처럼 쓰인다.

- `client/services/supabaseClient.ts:8-12`
- `client/services/storageService.ts:13`
- `client/services/tossPaymentsService.ts:3`
- `client/components/AdminDashboard.tsx:278`

정리:

- 현재 코드는 `VITE_SUPABASE_ANON_KEY` 우선, 없으면 `VITE_SUPABASE_PUBLISHABLE_KEY` 폴백 구조다.
- 따라서 프론트 env 정리 시 둘 중 하나만 넣기보다, 당분간 둘 다 같은 공개 키로 맞춰두는 편이 안전하다.

### `VITE_ADMIN_AUTH_PROVIDER`

- `client/services/adminAuthService.ts:29`
  - `supabase`면 관리자 로그인/세션 관리가 Supabase로 전환됨

권장값:

- `VITE_ADMIN_AUTH_PROVIDER=supabase`

### `VITE_STORAGE_UPLOAD_PROVIDER`

- `client/services/supabaseStorageUploadService.ts:63-68`
  - `supabase`면 signed upload 경로를 사용
  - 아니면 Firebase 업로드로 폴백

권장값:

- `VITE_STORAGE_UPLOAD_PROVIDER=supabase`

### `VITE_SUPABASE_STORAGE_SIGNED_UPLOAD_ENDPOINT`

- `client/services/supabaseStorageUploadService.ts:67`
- `client/services/supabaseStorageUploadService.ts:343-384`

설명:

- 프론트가 직접 private 버킷에 쓰지 않고
- 백엔드가 서명 URL을 발급해주는 엔드포인트 주소다
- 현재 기준 권장 경로는 `https://<project-ref>.supabase.co/functions/v1/signed-upload`다

### `VITE_ADMIN_ACCOUNT_SYNC_ENDPOINT`

- `client/services/storageService.ts:291`
- `client/services/storageService.ts:388-416`
- `client/services/storageService.ts:1899-1902`
- `client/services/storageService.ts:1961-1964`

설명:

- Supabase 관리자 로그인 모드에서 인사관리 `저장/삭제`를 Firebase callable 대신 HTTP 엔드포인트로 보낸다
- 요청 헤더에는 `X-Supabase-Access-Token`과 `X-Admin-Auth-Provider`가 함께 실린다
- 현재 기준 권장 경로는 `https://<project-ref>.supabase.co/functions/v1/admin-account-sync`다

---

## 4. 현재 코드에서 서버/스크립트용 Supabase env가 연결되는 위치

### `SUPABASE_URL`

- `scripts/supabase/bootstrapFirstAdmin.mjs:15`
- `scripts/supabase/syncFirebasePhase1Auth.mjs:10`
- `scripts/supabase/syncFirebasePhase1Org.mjs:10`
- `scripts/supabase/migrateFirebaseData.mjs:19`
- `scripts/supabase/verifyPhase1Access.mjs:10`
- `scripts/supabase/assignBranchLoginEmails.mjs:12`
- `scripts/supabase/exportPhase1LoginInventory.mjs:13`
- `scripts/supabase/repairAdminLoginHealth.mjs:9`
- `functions/src/domains/admin/upsertAdminAccountService.js:337`
- `functions/src/domains/storage/signedUploadService.js:362`
- `supabase/functions/on-booking-created/index.ts:8`
- `supabase/functions/on-booking-updated/index.ts:8`
- `supabase/functions/toss-payments/index.ts:3`
- `supabase/functions/cancel-booking/index.ts:3`
- `supabase/functions/sync-google-reviews/index.ts:3`

### `SUPABASE_SECRET_KEY`

현재는 마이그레이션/운영 스크립트에서 많이 사용한다.

- `scripts/supabase/bootstrapFirstAdmin.mjs:3`, `scripts/supabase/bootstrapFirstAdmin.mjs:16`
- `scripts/supabase/syncFirebasePhase1Auth.mjs:11`
- `scripts/supabase/syncFirebasePhase1Org.mjs:11`
- `scripts/supabase/migrateFirebaseData.mjs:20`
- `scripts/supabase/verifyPhase1Access.mjs:11`
- `scripts/supabase/assignBranchLoginEmails.mjs:13`
- `scripts/supabase/exportPhase1LoginInventory.mjs:14`
- `scripts/supabase/repairAdminLoginHealth.mjs:10`
- `functions/src/domains/admin/upsertAdminAccountService.js:338-340`

### `SUPABASE_SERVICE_ROLE_KEY`

현재는 백엔드 서비스나 Edge Function에서 관리자 권한 키로 사용한다.

- `functions/src/domains/storage/signedUploadService.js:363`
- `functions/src/domains/admin/upsertAdminAccountService.js:338-340`
- `supabase/functions/on-booking-created/index.ts:9`
- `supabase/functions/on-booking-updated/index.ts:9`
- `supabase/functions/toss-payments/index.ts:4`
- `supabase/functions/cancel-booking/index.ts:3`
- `supabase/functions/sync-google-reviews/index.ts:3`

실무 권장:

- 서버 런타임은 `SUPABASE_SERVICE_ROLE_KEY`를 표준으로 잡고
- 기존 스크립트 호환 때문에 `SUPABASE_SECRET_KEY`를 당분간 같이 유지한다

### `SUPABASE_PUBLISHABLE_KEY`

서버 쪽에서는 거의 안 쓰지만, 아래 스크립트에서 관리자 로그인 검증용으로 사용한다.

- `scripts/supabase/repairAdminLoginHealth.mjs:11`

---

## 5. 클라이언트 ID / 지도 / 결제 관련 env 연결

### `VITE_NAVER_MAP_CLIENT_ID`

현재 코드에서 실제로 쓰는 지도 client id 키다.

- `client/components/locations/LocationMap.tsx:271-275`
  - 메인 위치 지도 SDK 로드
- `client/components/AdminDashboard.tsx:1029-1032`
  - 관리자 단건 주소 geocode
- `client/components/AdminDashboard.tsx:1100-1102`
  - 관리자 bulk geocode

만약 이번에 받은 client id가 네이버 지도용이면 이 키로 연결하면 된다.

### `VITE_TOSS_PAYMENTS_CLIENT_KEY`

현재 코드에서 실제로 쓰는 Toss 클라이언트 키다.

- `client/services/tossPaymentsService.ts:6-8`
- `client/services/tossPaymentsService.ts` 내부 Toss SDK 초기화 로직

만약 받은 client id가 Toss 결제용이면 이 키가 대상이다.

---

## 6. Supabase 외에 현재 코드가 실제로 읽는 주요 env

### 프론트

- `VITE_RECAPTCHA_SITE_KEY`
  - `client/services/recaptchaService.ts:8`
- `VITE_LOCAL_ADMIN_DATA_BRIDGE_URL`
  - `client/services/storageService.ts:289`
- `VITE_FIREBASE_STORAGE_BUCKET`
  - `client/firebaseApp.ts:7`

### 서버 / Functions

- `POSTGRES_URL`
  - `functions/src/shared/dbService.js:5`
- `SMTP_PASS`
  - `functions/src/domains/notification/mailer.js:6`, `functions/src/domains/notification/mailer.js:12`
  - `supabase/functions/on-booking-created/index.ts:11`
  - `supabase/functions/on-booking-updated/index.ts:11`
- `GOOGLE_CHAT_WEBHOOK_URL`
  - `functions/index.js:538-549`
  - `supabase/functions/on-booking-created/index.ts:12`
- `GOOGLE_PLACES_API_KEY`
  - `supabase/functions/sync-google-reviews/index.ts:4`
- `TOSS_PAYMENTS_SECRET_KEY`
  - `functions/index.js:187`
- `TOSS_SECRET_KEY`
  - `supabase/functions/toss-payments/index.ts:5`

### Firebase 브릿지 / 이전 스크립트

- `FIREBASE_PROJECT_ID`
- `FIREBASE_SERVICE_ACCOUNT_PATH`
- `GOOGLE_APPLICATION_CREDENTIALS`
- `FIREBASE_SERVICE_ACCOUNT_JSON`

이 키들은 `scripts/supabase/*`의 Firebase -> Supabase 이전 스크립트에서 계속 사용한다.

---

## 7. 현재 저장소에서 이름이 섞여 있는 지점

### A. 같은 공개 키를 두 이름으로 읽는다

- `VITE_SUPABASE_ANON_KEY`
- `VITE_SUPABASE_PUBLISHABLE_KEY`

현재 프론트는 둘 중 하나만 있어도 동작하는 파일이 많다.

### B. 같은 서버 관리자 키를 두 이름으로 읽는다

- `SUPABASE_SECRET_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

현재 스크립트/백엔드가 둘을 혼용한다.

### C. 문서에 있지만 코드에서 안 쓰는 값이 있다

- `SUPABASE_PROJECT_REF`

이 값은 과거 setup 문서에는 있었지만, 현재 코드 검색 기준 사용처가 없다.

### D. 선언 누락된 프론트 env가 있다

현재 사용 중이지만 `client/vite-env.d.ts`에 선언되지 않은 값이 보인다.

- `VITE_CLAUDE_API_KEY`
  - 사용처: `client/services/claudeService.ts:47`
- `VITE_GA4_MEASUREMENT_ID`
  - 사용처: `client/index.html:186-192`

즉, env 타입 선언 파일이 실제 사용량을 아직 전부 따라가지 못하고 있다.

---

## 8. 바로 적용할 때의 추천 결론

### 지금 당장 안전한 기준

1. 프론트 공개 키는 `VITE_SUPABASE_PUBLISHABLE_KEY` 중심으로 넣는다.
2. 레거시 호환 때문에 `VITE_SUPABASE_ANON_KEY`도 같은 공개 키로 같이 넣어둔다.
3. 서버 키는 `SUPABASE_SERVICE_ROLE_KEY`를 표준으로 잡는다.
4. 기존 스크립트 호환 때문에 `SUPABASE_SECRET_KEY`에도 같은 서버 키를 같이 넣어둔다.
5. `SUPABASE_URL`과 `VITE_SUPABASE_URL`은 같은 프로젝트 URL로 맞춘다.

### 현재 Beeliber에서 가장 중요한 실제 연결 키

- 프론트:
  - `VITE_SUPABASE_URL`
  - `VITE_SUPABASE_PUBLISHABLE_KEY`
  - `VITE_SUPABASE_ANON_KEY`
  - `VITE_ADMIN_AUTH_PROVIDER`
  - `VITE_STORAGE_UPLOAD_PROVIDER`

- 서버/스크립트:
  - `SUPABASE_URL`
  - `SUPABASE_SERVICE_ROLE_KEY`
  - `SUPABASE_SECRET_KEY`

### 한 줄 요약

> 현재 Beeliber는 프론트에서 `VITE_SUPABASE_*`, 서버/스크립트에서 `SUPABASE_*`를 쓰고 있으며, 공개 키는 `ANON/PUBLISHABLE`, 서버 키는 `SECRET/SERVICE_ROLE` 이름이 아직 혼용되고 있으므로 당장은 둘 다 맞춰주는 방식이 가장 안전하다.
