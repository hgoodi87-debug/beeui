# SEO 프리렌더 배포 전 QA 체크리스트

## 목적

- prerender 산출물이 실제 배포 전에 검색엔진 친화적으로 나오는지 빠르게 점검한다.
- Firebase Hosting rewrite가 SPA fallback과 충돌하지 않는지 확인한다.

## 1. 로컬 빌드

실행:

```bash
npm run build:seo
```

정상 기준:

- 에러 없이 종료
- `client/public/robots.txt`가 최신 정책으로 재생성된다
- `client/public/sitemap.xml`이 최신 prerender 경로 기준으로 재생성된다
- `client/dist/sitemap.xml`이 생성된다
- `client/dist/robots.txt`가 생성된다
- `client/dist/__spa-fallback.html` 생성
- `client/dist/locations/index.html` 생성
- `client/dist/services/index.html` 생성
- `client/dist/storage/hongdae/index.html` 생성
- `client/dist/delivery/hongdae/index.html` 생성

## 2. 핵심 raw HTML 확인

확인 파일:

- `client/dist/index.html`
- `client/dist/locations/index.html`
- `client/dist/services/index.html`
- `client/dist/storage/hongdae/index.html`
- `client/dist/delivery/hongdae/index.html`
- `client/dist/__spa-fallback.html`
- `client/dist/sitemap.xml`
- `client/dist/robots.txt`

정상 기준:

- 각 파일의 `title`이 다르다
- `canonical`이 각 경로에 맞다
- `og:url`이 각 경로에 맞다
- `delivery/hongdae`는 `storage/hongdae`와 다른 제목을 가진다
- `sitemap.xml`에 `/storage/hongdae`, `/delivery/hongdae`가 모두 들어 있다
- `robots.txt`가 `/admin`, `/staff`, `/mypage`, `/payments/`를 막고 `sitemap.xml`을 가리킨다

## 3. Firebase Hosting 설정 확인

확인 파일:

- `firebase.json`

정상 기준:

- 최종 rewrite가 `"/__spa-fallback.html"`를 가리킨다
- `/api/verify-admin`, `/api/notify-google-chat` function rewrite는 유지된다
- `/storage/**`, `/delivery/**`, `/admin/**` 캐시 정책이 유지된다
- `"/__spa-fallback.html"`도 `no-cache, no-store, must-revalidate`다

## 4. 배포 후 실제 URL 확인

우선 확인 URL:

- `/`
- `/locations`
- `/services`
- `/qna`
- `/tracking`
- `/storage/hongdae`
- `/delivery/hongdae`

정상 기준:

- 브라우저 `view-source:` 기준으로도 제목/설명이 경로별로 다르다
- 새로고침해도 route가 404 없이 열린다
- `/booking`, `/admin`, `/mypage` 같은 SPA 전용 경로도 정상 동작한다

### 로컬 preview 확인 팁

- 일반 앱 동작 확인은 `vite preview`
- SEO 프리렌더 확인은 아래 전용 서버를 사용한다:

```bash
npm run preview:seo --workspace=beeliber-web
```

- 이 서버는 정적 HTML을 우선 서빙하고, 없으면 `__spa-fallback.html`로 보내므로 Firebase Hosting 동작과 더 가깝다.
- 로컬 자동 검증은 아래 명령으로 확인한다:

```bash
npm run verify:seo-preview --workspace=beeliber-web
```

## 5. Search Console 확인

배포 후 확인:

- URL 검사에서 `/locations`가 홈 메타가 아니라 지점 메타로 보이는지
- `/storage/hongdae`, `/delivery/hongdae`가 서로 다른 canonical로 보이는지
- 색인 요청 후 제목/설명 반영 추세 확인

## 6. 롤백 기준

아래 중 하나면 롤백 검토:

- `/admin` 또는 `/booking` 같은 SPA 경로가 비정상 404
- prerender 경로 raw HTML이 전부 같은 title로 나온다
- canonical이 루트로 뭉친다
- 배포 후 주요 route 렌더가 깨진다

## 7. 메모

- 현재는 `현재 SPA 유지 + 선택 경로 prerender` 전략이다.
- SSR/SSG 전체 전환이 아니므로, SEO 핵심 경로를 먼저 챙기는 방식으로 운영한다.
