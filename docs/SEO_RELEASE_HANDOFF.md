# SEO 변경분 인수인계 메모

## 현재 상태

- 상태: 로컬 저장 완료
- 푸시: 안 함
- 배포: 안 함
- 기준 빌드: `npm run build:seo`
- 기준 검증: `npm run verify:seo-preview --workspace=beeliber-web`

## 핵심 변경 파일

### 기존 파일 수정

- `client/index.html`
- `client/components/SEO.tsx`
- `client/components/LocationLander.tsx`
- `client/package.json`
- `client/public/robots.txt`
- `client/public/sitemap.xml`
- `firebase.json`
- `package.json`

### 신규 파일 추가

- `client/src/constants/seoRouteMeta.ts`
- `client/src/constants/prerenderRoutes.ts`
- `client/scripts/generate-robots.mjs`
- `client/scripts/generate-sitemap.mjs`
- `client/scripts/prerender-static-html.mjs`
- `client/scripts/seo-preview-server.mjs`
- `client/scripts/verify-prerender-preview.mjs`
- `docs/SEO_PRERENDER_STATIC_HTML_PLAN.md`
- `docs/SEO_PRERENDER_DEPLOY_QA.md`
- `docs/SEARCH_CONSOLE_SUBMISSION_RUNBOOK.md`

## 이번 변경으로 된 것

- 주요 SEO 경로 prerender 대상 정의
- `/storage/*`와 `/delivery/*` 메타 분리
- `__spa-fallback.html` 기반 fallback 준비
- `robots.txt` 자동 생성
- `sitemap.xml` 자동 생성
- Firebase Hosting rewrite를 prerender 친화적으로 변경 준비
- 로컬 SEO 전용 프리뷰 서버 추가
- 로컬 자동 검증 명령 추가

## 실행 명령

### 1. 빌드

```bash
npm run build:seo
```

### 2. 일반 앱 프리뷰

```bash
npm run preview --workspace=beeliber-web -- --host 0.0.0.0 --port 4176
```

확인 주소:

- `http://localhost:4176`
- `http://172.30.1.78:4176`

### 3. SEO 전용 프리뷰

```bash
npm run preview:seo --workspace=beeliber-web
```

확인 주소:

- `http://localhost:4177`
- `http://172.30.1.78:4177`

### 4. 자동 검증

```bash
npm run verify:seo-preview --workspace=beeliber-web
```

## 자동 검증 기준

- `/locations`
- `/storage/hongdae`
- `/delivery/hongdae`
- `/robots.txt`
- `/sitemap.xml`

위 5개가 모두 `OK`여야 한다.

## 배포 전 최종 순서

1. `npm run build:seo`
2. `npm run preview:seo --workspace=beeliber-web`
3. `npm run verify:seo-preview --workspace=beeliber-web`
4. `docs/SEO_PRERENDER_DEPLOY_QA.md` 체크
5. 문제 없으면 그때 푸시/배포 판단

## 배포 후 해야 할 것

- `docs/SEARCH_CONSOLE_SUBMISSION_RUNBOOK.md` 순서대로 Search Console 제출
- `sitemap.xml` 제출
- `/locations`, `/storage/hongdae`, `/delivery/hongdae` URL 검사

## 메모

- `vite preview`는 일반 앱 동작 확인용
- SEO raw HTML 확인은 `preview:seo`가 더 정확함
- 현재 작업트리에는 SEO 외 다른 로컬 변경도 섞여 있으니, 푸시 전에는 이번 변경분만 다시 골라서 점검해야 한다
