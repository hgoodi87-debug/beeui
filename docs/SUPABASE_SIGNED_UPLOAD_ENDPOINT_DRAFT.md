# Beeliber Supabase Signed Upload 발급 엔드포인트 초안

## 문서 목적

이 문서는 Firebase Functions에 둘
`issueSupabaseSignedUpload` 초안의 역할과 계약을 정리한다.

이번 단계는 **로컬 저장용 초안**이다.

즉,

- 아직 운영 배포 안 함
- 아직 모든 버킷 지원 안 함
- 현재는 `hero / locations / notices` 전환을 위한 서버 발급기 기준만 잡는다

---

## 1. 현재 구현 범위

지원 버킷:

- `brand-public`
- `branch-public`
- `backoffice-private`

현재 지원 대상:

- 히어로 이미지
- 지점 대표/수령 이미지
- 공지 이미지

아직 이 함수에서 직접 안 받는 것:

- `ops-private`
- `customer-private`
- 히어로 비디오

그건 지금 넣으면 범위가 커져서 사고 나니까요, 참나.

---

## 2. 엔드포인트 파일

- 함수 export: [index.js](/Users/cm/Desktop/beeliber/beeliber-main/functions/index.js)
- 발급 로직: [signedUploadService.js](/Users/cm/Desktop/beeliber/beeliber-main/functions/src/domains/storage/signedUploadService.js)

---

## 3. 요청 헤더 계약

필수:

- `Authorization: Bearer {firebase_id_token}`

보조:

- `X-Admin-Auth-Provider`
- `X-Supabase-Access-Token`

현재 초안은 **Firebase 관리자 세션**으로 서버 인증을 확인한다.

이유:

- 현재 관리자 로그인 흐름이 Supabase로 넘어가도
  Firebase `verifyAdmin` 브리지가 같이 살아 있다
- 그래서 서버 발급기는 일단 Firebase ID token으로 막는 게 제일 덜 위험하다

`X-Supabase-Access-Token`은 나중에
Supabase 단독 인증으로 옮길 때 같이 검증할 여지를 남겨둔 거다.

---

## 4. 요청 바디 계약

현재 프론트 어댑터와 동일한 camelCase 기준:

```json
{
  "bucketKind": "branch-public",
  "entityType": "branch",
  "entityId": "legacy-location-id",
  "contentType": "image/jpeg",
  "fileExtension": "jpg",
  "branchCode": "HBO",
  "branchType": "partner",
  "assetCategory": "main",
  "metadata": {
    "originalFileName": "hero.jpg"
  }
}
```

---

## 5. 서버 검증 규칙

### 공통

- POST만 허용
- Firebase ID token 필수
- 관리자 문서 존재 필수
- 허용 버킷만 통과
- 허용 MIME / 확장자만 통과

### `brand-public`

- `super / staff / finance / cs`만 허용
- `entityType = branding`
- `assetCategory = hero-image | hero-mobile-image`

### `branch-public`

- 본사 계정은 전체 지점 허용
- `branch / partner`는 자기 `branchId`와 같은 `branchCode`만 허용
- `entityType = branch`
- `branchType = hub | partner`
- `assetCategory = main | pickup | thumb | cover`

### `backoffice-private`

- `super / staff / finance / cs`만 허용
- `entityType = notice | backoffice`
- `domain` 필수

---

## 6. object path 규칙

### `brand-public`

```text
branding/{assetCategory}/{yyyymm}/{uuid}.{ext}
```

### `branch-public`

```text
{branchType}/{branchCode}/{assetCategory}/{yyyymm}/{uuid}.{ext}
```

### `backoffice-private`

```text
{domain}/{yyyy}/{mm}/{entityId}/{uuid}.{ext}
```

---

## 7. 서버가 하는 일

1. 관리자 인증 확인
2. 업로드 입력 검증
3. object path 생성
4. Supabase signed upload URL 발급
5. `storage_assets`에 pending row 기록
6. 프론트에 업로드 URL 반환

---

## 8. 필요한 서버 환경값

최소 필요:

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

운영에 올릴 때는 이 둘을 코드에 두지 말고
반드시 시크릿으로 빼야 한다.

---

## 9. 현재 프론트 연결 상태

프론트 어댑터 파일:

- [supabaseStorageUploadService.ts](/Users/cm/Desktop/beeliber/beeliber-main/client/services/supabaseStorageUploadService.ts)

현재 동작:

- 기본값은 `firebase`
- `VITE_STORAGE_UPLOAD_PROVIDER=supabase`일 때만 발급 엔드포인트 호출
- 아직 운영 env를 안 바꿨으니 기존 Firebase 업로드는 그대로 유지

---

## 10. 다음 단계

다음으로 붙일 작업:

1. `issueSupabaseSignedUpload`를 dev 환경에서만 실제 호출
2. `notices` private read signed URL 계약 추가
3. `ops-private` 전용 endpoint scope 추가
4. 업로드 완료 확인 API 추가
