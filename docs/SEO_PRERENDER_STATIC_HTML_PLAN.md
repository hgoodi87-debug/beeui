# SEO 프리렌더 / 정적 HTML 전환 설계안

## 목적

- 검색엔진이 `view-source` 기준으로도 페이지별 `title`, `description`, `canonical`, `og` 정보를 다르게 읽게 만든다.
- 현재 Vite SPA 구조와 Firebase Hosting 배포 방식을 최대한 유지한다.
- `SSR 프레임워크 전환` 같은 큰 공사는 미루고, 먼저 CTR 개선 효과가 큰 페이지부터 정적 HTML을 생성한다.

## 현재 구조 진단

### 현재 상태

- 프론트는 `client/vite.config.ts` 기준 일반 Vite SPA다.
- 라우팅은 `client/App.tsx` 안의 `react-router-dom` 선언형 라우트다.
- 배포는 `firebase.json`에서 `** -> /index.html` rewrite 방식이다.
- 최근 1차 SEO 패치로 `client/index.html`에 초기 메타 동기화 스크립트를 넣어 브라우저 렌더 후 메타는 좋아졌지만, 검색엔진이 JS 실행 전에 읽는 HTML은 아직 한계가 있다.

### 확인된 문제

- `/locations`, `/services`, `/qna` 같은 페이지도 서버 응답 기준으로는 홈 HTML을 먼저 받는다.
- 현재 구조에서는 검색엔진이 JS를 충분히 렌더하지 않으면 서브페이지 CTR이 떨어질 수밖에 없다.
- `client/components/LocationLander.tsx`는 `/delivery/:slug`에서도 `path={`/storage/${slug}`}`를 쓰고 있어, delivery 랜딩 canonical이 잘못 잡힐 위험이 있다.

## 추천안

### 추천 방식

`현재 SPA 유지 + 선택 라우트만 빌드 후 정적 HTML 생성 + 나머지는 SPA fallback 유지`

이 방식이 지금 프로젝트에 가장 맞는 이유:

- Firebase Hosting은 **해당 경로에 실제 파일/디렉터리가 있으면 rewrite보다 정적 파일을 우선 서빙**한다.
- 즉 `/locations/index.html`, `/services/index.html` 같은 파일만 만들어 두면 현재 배포 구조를 크게 뜯지 않고도 검색용 HTML을 분리할 수 있다.
- React Router Framework Mode의 공식 prerender는 좋긴 하지만, 지금 앱은 그 모드가 아니라 `App.tsx` 기반 선언형 SPA라서 전환 비용이 크다.
- Vite 공식 SSR 가이드도 low-level API 성격이 강해서, 지금 시점에는 구조 변경 범위가 너무 크다.

## 비교안

### 안 1. 현재 구조 유지 + postbuild 프리렌더

- 추천도: 높음
- 장점:
  - 현재 앱 구조를 거의 유지
  - Firebase Hosting 배포 흐름 유지
  - CTR 개선 타깃 페이지부터 빠르게 적용 가능
- 단점:
  - 완전한 SSR은 아님
  - 데이터 기반 동적 페이지는 별도 manifest/스크립트가 필요

### 안 2. React Router Framework Mode prerender 전환

- 추천도: 중간 이하
- 장점:
  - 공식 prerender + SPA fallback 출력 지원
  - 정적 경로와 동적 경로 목록 관리가 좋음
- 단점:
  - 현재 `App.tsx` 선언형 라우트 구조에서 `routes.ts`, `react-router.config.ts` 체계로 옮겨야 함
  - 범위가 SEO 1건보다 커짐

### 안 3. Vite SSR / SSR 프레임워크 전환

- 추천도: 낮음
- 장점:
  - 가장 정석
- 단점:
  - 서버 엔트리, hydration, 빌드 파이프라인까지 다 바뀜
  - 지금 당장 CTR 개선 목적엔 과함

## 1차 프리렌더 대상

### Tier 1: 무조건 정적 HTML 생성

- `/`
- `/locations`
- `/services`
- `/qna`
- `/tracking`
- `/partnership`
- `/vision`
- `/terms`
- `/privacy`

### Tier 2: 지역 랜딩 SEO 페이지

`client/src/constants/seoLocations.ts` 기준 슬러그:

- `airport`
- `hongdae`
- `myeongdong`
- `dongdaemun`
- `bukchon`
- `itaewon`
- `gangnam`
- `yeouido`
- `busan`
- `jeju`
- `regional-cities`

생성 대상:

- `/storage/{slug}`
- `/delivery/{slug}`

총 22개

### 1차 제외 대상

- `/booking`
- `/booking-success`
- `/payments/toss/*`
- `/admin/*`
- `/staff/*`
- `/mypage`
- 상태/로그인/개인화 의존 화면

이 경로들은 SEO보다 사용자 상태/세션이 더 중요하니 SPA fallback 유지가 맞다.

## 산출물 구조

빌드 후 기대 산출물 예시:

```text
client/dist/
  index.html
  locations/index.html
  services/index.html
  qna/index.html
  tracking/index.html
  partnership/index.html
  vision/index.html
  terms/index.html
  privacy/index.html
  storage/hongdae/index.html
  storage/myeongdong/index.html
  ...
  delivery/hongdae/index.html
  delivery/myeongdong/index.html
  ...
  __spa-fallback.html
  assets/*
```

핵심은:

- 루트 `/`는 `index.html`
- 프리렌더 경로는 각 디렉터리의 `index.html`
- 그 외 경로는 `__spa-fallback.html`로 hydrate

## 구현 설계

### 1. 라우트 매니페스트 분리

새 파일:

- `client/src/constants/prerenderRoutes.ts`

역할:

- Tier 1 정적 경로 정의
- `SEO_LOCATIONS` 기반 storage/delivery 랜딩 경로 생성
- prerender 대상과 제외 대상을 한눈에 관리

### 2. route metadata source of truth 정리

메타 원본은 아래로 통일:

- 일반 페이지: `SEO.tsx`의 route defaults
- 지역 랜딩: `SEO_LOCATIONS`

필수 조건:

- `LocationLander.tsx`는 현재 pathname에 맞춰 `/storage/...`와 `/delivery/...`를 구분해서 canonical/path를 넣도록 먼저 수정해야 한다.

### 3. build 후 HTML 생성 스크립트

추천 신규 파일:

- `client/scripts/prerender-static-html.mjs`

동작:

1. `vite build` 결과의 `client/dist/index.html`을 읽는다.
2. prerender 대상 경로별로:
   - `title`
   - `description`
   - `keywords`
   - `canonical`
   - `og:url`
   - `og:title`
   - `og:description`
   - `twitter:title`
   - `twitter:description`
   - 필요 JSON-LD
   를 주입한 HTML을 복제 생성한다.
3. `/foo/bar` 경로는 `client/dist/foo/bar/index.html`로 출력한다.
4. SPA 전용 fallback shell을 `client/dist/__spa-fallback.html`로 만든다.

### 4. Firebase Hosting rewrite 변경

현재:

```json
{
  "source": "**",
  "destination": "/index.html"
}
```

목표:

```json
{
  "source": "**",
  "destination": "/__spa-fallback.html"
}
```

이렇게 하면:

- 정적 HTML이 있는 경로는 Firebase가 그 파일을 먼저 준다.
- 정적 HTML이 없는 경로만 SPA fallback으로 간다.

### 5. 캐시 정책

- prerender된 HTML:
  - `no-cache, no-store, must-revalidate`
- JS/CSS chunk:
  - 해시 파일 기준 장기 캐시 유지

즉 HTML만 자주 갱신하고, asset 캐시는 그대로 살린다.

## 구현 순서

### Step 1

- `prerenderRoutes.ts` 추가
- `LocationLander.tsx`의 canonical/path 버그 수정

### Step 2

- `prerender-static-html.mjs` 추가
- `client/package.json`에 예:
  - `build:seo`: `vite build && node scripts/prerender-static-html.mjs`

### Step 3

- `firebase.json` rewrite를 `__spa-fallback.html` 기준으로 변경

### Step 4

- 로컬 빌드 후 아래 확인:
  - `client/dist/locations/index.html`
  - `client/dist/services/index.html`
  - `client/dist/storage/hongdae/index.html`
  - `client/dist/delivery/hongdae/index.html`
  - `client/dist/__spa-fallback.html`

### Step 5

- `curl` 또는 `view-source:` 기준으로 페이지별 메타가 다르게 보이는지 확인

## QA 체크리스트

- `/locations` raw HTML title이 홈과 다르다
- `/services` raw HTML description이 서비스 페이지 전용이다
- `/storage/hongdae`와 `/delivery/hongdae` canonical이 서로 다르다
- `/booking`은 여전히 SPA fallback으로 정상 동작한다
- `/admin` 로그인 흐름은 영향 없다
- sitemap 경로와 prerender 경로가 맞다

## 리스크

### 리스크 1. delivery 랜딩 canonical 오염

- 현재 `LocationLander.tsx`가 `/delivery/:slug`에서도 `/storage/${slug}`를 path로 넣고 있다.
- prerender 전에 먼저 바로잡아야 한다.

### 리스크 2. 데이터 의존 페이지 과도한 정적화

- 예약, 마이페이지, 관리자, 추적 결과처럼 세션/실시간 의존 화면은 프리렌더 대상에서 빼야 한다.

### 리스크 3. JSON-LD 중복

- `index.html` 공통 schema + 페이지별 schema가 겹치면 snippet이 흐려질 수 있다.
- prerender 단계에서 route별 JSON-LD 전략을 다시 나눠야 한다.

## 결론

지금 프로젝트에서 가장 현실적인 다음 수는:

`React Router / Vite 전체 구조를 뜯지 말고, Firebase Hosting 우선순위를 활용해 선택 페이지별 정적 HTML을 생성하는 것`

이 방향이면:

- CTR 개선 속도 빠름
- 현재 운영 구조 보존
- SEO 랜딩 페이지 확대도 쉬움

그리고 그 다음 단계에서야:

- React Router Framework Mode prerender
- 또는 SSR/SSG 전환

같은 큰 공사를 검토하는 게 맞다.
