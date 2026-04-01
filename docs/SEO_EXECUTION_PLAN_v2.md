# Beeliber SEO 실행 계획서 v2 (2026-04)

## 현황 진단

### 완료된 항목
- [x] `react-helmet-async` 기반 SEO 컴포넌트 (`client/components/SEO.tsx`)
- [x] 서브디렉토리 라우팅 구조 (`/:urlLang/...`)
- [x] hreflang 태그 생성 (6개 언어 + x-default)
- [x] x-default → zh-tw 설정 완료
- [x] 지역별 랜딩 페이지 50개+ 다국어 데이터 (`seoLocations.ts`)
- [x] robots.txt 설정 (admin/staff/payment 차단)
- [x] sitemap.xml 기본 구조
- [x] JSON-LD 구조화 데이터 (Organization, Service, FAQ, BreadcrumbList, LocalBusiness)

### 미완료 — 핵심 GAP

| # | GAP | 영향도 | 난이도 |
|---|-----|--------|--------|
| G1 | **seoRouteMeta.ts가 한국어만 지원** — 9개 메인 라우트가 ko만 있음 | CRITICAL | 중 |
| G2 | **SEO.tsx가 lang별 메타를 선택하지 않음** — 항상 한국어 메타 노출 | CRITICAL | 하 |
| G3 | **index.html 정적 메타가 한국어 고정** — SSR 없어서 크롤러가 한국어만 봄 | CRITICAL | 상 |
| G4 | **sitemap.xml에 언어별 URL 없음** — 37개 URL, 한국어만 | HIGH | 중 |
| G5 | **JSON-LD "비리버" 오타** — "빌리버"로 수정 필요 | MEDIUM | 하 |
| G6 | **대만/홍콩 Search Console/Bing 미등록** | HIGH | 하 |
| G7 | **OG 이미지에 언어별 텍스트 없음** — 한국어 이미지만 공유됨 | LOW | 중 |

---

## 실행 Phase

### Phase 1: 메타 다국어화 (1주)

**목표:** 검색엔진이 각 언어별 고유 메타를 인식하도록 함.

#### 1-1. seoRouteMeta.ts 다국어 확장

`STATIC_ROUTE_META`를 언어별로 확장:

```typescript
export const STATIC_ROUTE_META: Record<string, Record<string, StaticSeoMeta>> = {
  '/': {
    ko: { title: '빌리버 | 서울 짐보관 · 인천공항 당일 짐배송', ... },
    'zh-tw': { title: 'Beeliber 行李寄放 | 首爾寄放行李·仁川機場當日配送', ... },
    'zh-hk': { title: 'Beeliber 行李寄存 | 首爾寄存行李·仁川機場即日配送', ... },
    en: { title: 'Beeliber | Seoul Luggage Storage · Same-Day Airport Delivery', ... },
    ja: { title: 'Beeliber | ソウル荷物預かり·仁川空港当日配送', ... },
    zh: { title: 'Beeliber 行李寄存 | 首尔寄存行李·仁川机场当日配送', ... },
  },
  // ... 9개 라우트 전부
};
```

**주의:** 대만 "寄放/當日" vs 홍콩 "寄存/即日" 차이 반드시 반영.

#### 1-2. SEO.tsx lang 기반 메타 선택

```typescript
const langKey = lang || 'ko';
const routeDefault = STATIC_ROUTE_META[cleanPath]?.[langKey]
  || STATIC_ROUTE_META[cleanPath]?.['ko'];
```

#### 1-3. JSON-LD 오타 수정

`index.html`의 "비리버" → "빌리버" 전부 수정.

**관련 파일:**
- `client/src/constants/seoRouteMeta.ts`
- `client/components/SEO.tsx`
- `client/index.html`

---

### Phase 2: 크롤러 접근성 (2주)

**목표:** SPA의 치명적 약점(크롤러가 JS 실행 못하면 한국어 index.html만 봄) 해결.

#### 2-1. Prerender / Static HTML 생성

Firebase Hosting의 `rewrites` + Cloud Functions로 크롤러 요청 시 pre-rendered HTML 반환.

```
User-Agent: Googlebot → Cloud Function → Puppeteer/Rendertron → 정적 HTML 반환
User-Agent: 일반 → SPA (index.html)
```

대안: Vite SSG 플러그인으로 빌드 타임에 주요 페이지 정적 생성.

#### 2-2. 언어별 sitemap 생성

```xml
<url>
  <loc>https://bee-liber.com/zh-tw/</loc>
  <xhtml:link rel="alternate" hreflang="zh-TW" href="https://bee-liber.com/zh-tw/" />
  <xhtml:link rel="alternate" hreflang="zh-HK" href="https://bee-liber.com/zh-hk/" />
  <xhtml:link rel="alternate" hreflang="en" href="https://bee-liber.com/en/" />
  <xhtml:link rel="alternate" hreflang="ja" href="https://bee-liber.com/ja/" />
  <xhtml:link rel="alternate" hreflang="ko" href="https://bee-liber.com/ko/" />
  <xhtml:link rel="alternate" hreflang="x-default" href="https://bee-liber.com/zh-tw/" />
</url>
```

빌드 스크립트로 자동 생성 (`client/scripts/generateSitemap.mjs`).

**예상 URL 수:** 9 라우트 x 6 언어 + 50 지역 x 6 언어 + 50 배송 x 6 언어 = **654 URL**

#### 2-3. Search Console 등록

| 플랫폼 | 작업 |
|---|---|
| Google Search Console | 속성 추가 + sitemap 제출 |
| Bing Webmaster Tools | 등록 (Yahoo Taiwan은 Bing 기반) |
| Naver Search Advisor | 이미 등록됨 (확인) |

**관련 파일:**
- `firebase.json` (rewrites 설정)
- `client/public/sitemap.xml` (자동 생성으로 교체)
- `client/scripts/generateSitemap.mjs` (신규)

---

### Phase 3: 콘텐츠 SEO (3-4주)

**목표:** 지역별 검색 키워드 장악.

#### 3-1. 지역 랜딩 페이지 최적화

현재 50개+ 지역 데이터 있지만 SEO 측면에서:
- 각 지역 페이지에 고유 JSON-LD (LocalBusiness) 추가
- FAQ 섹션 → FAQPage 구조화 데이터
- 인근 관광지 정보 → 컨텍스트 신호 강화

#### 3-2. 핵심 키워드 타겟

| 우선순위 | 키워드 (zh-TW) | 월 검색량 (추정) | 현재 순위 |
|---|---|---|---|
| 1 | 首爾 行李寄放 | 1,000-3,000 | 미측정 |
| 2 | 弘大 行李寄放 | 500-1,000 | 미측정 |
| 3 | 明洞 行李寄放 | 500-1,000 | 미측정 |
| 4 | 仁川機場行李配送 | 300-500 | 미측정 |
| 5 | 韓國行李寄存服務 | 200-500 | 미측정 |

#### 3-3. 콘텐츠 허브 구축

```
/tips/                          → 여행 팁 허브 (내부 링크 허브)
/tips/luggage-storage-seoul/    → 서울 짐보관 완전 가이드
/tips/hongdae-travel-guide/     → 홍대 여행 가이드 + 짐보관 연결
/tips/airport-delivery-guide/   → 공항 배송 이용 가이드
```

**관련 파일:**
- `client/src/constants/seoLocations.ts`
- 신규 콘텐츠 페이지 컴포넌트

---

### Phase 4: 기술 SEO 고도화 (1-2개월)

#### 4-1. Core Web Vitals 최적화

현재 벤치마크 기준 (2026-04-01):
- FCP: 764ms (양호)
- Transfer: 5.24MB → **폰트 서브셋 + WebP + reCAPTCHA lazy로 ~1.5MB 목표**
- LCP: ~2.5s (경계) → **2.0s 이하 목표**

#### 4-2. SSR 또는 SSG 마이그레이션 평가

| 옵션 | 장점 | 단점 |
|---|---|---|
| Vite SSG | 빌드 타임 정적 생성, 현재 스택 유지 | 동적 콘텐츠 대응 어려움 |
| Prerender.io | SPA 유지, 크롤러에게만 HTML | 비용, 지연 |
| Next.js | 완전한 SSR/ISR, SEO 최적 | 대규모 마이그레이션 필요 |

**권장:** 단기 Prerender → 중기 Vite SSG → 장기 Next.js 검토

#### 4-3. 구조화 데이터 강화

- Product 스키마 (가격 정보 표시)
- HowTo 스키마 (이용 방법 단계별)
- Review 스키마 (고객 리뷰 연동)

---

## 성과 측정 KPI

| 지표 | 현재 | 3개월 목표 | 6개월 목표 |
|---|---|---|---|
| Google 인덱싱 페이지 수 | ~37 | 200+ | 600+ |
| zh-TW 오가닉 트래픽 | 미측정 | 500/월 | 2,000/월 |
| "首爾 行李寄放" 순위 | 미순위 | Top 20 | Top 5 |
| Core Web Vitals (mobile) | 미측정 | 모두 양호 | 모두 양호 |
| 크롤 예산 효율 | 미측정 | 80% 유효 | 95% 유효 |

---

## 우선순위 요약

```
즉시 실행 (이번 주)
├── G5: JSON-LD "비리버" → "빌리버" 오타 수정
├── G1: seoRouteMeta.ts 6개 언어 번역 추가
└── G2: SEO.tsx lang 기반 메타 선택 로직

1-2주
├── G4: sitemap.xml 자동 생성 스크립트
├── G6: Search Console / Bing 등록
└── index.html 정적 메타 다국어 대응

3-4주
├── G3: Prerender 또는 SSG 도입
├── 지역 랜딩 JSON-LD 강화
└── 콘텐츠 허브 첫 3개 페이지

1-2개월
├── Core Web Vitals 전 항목 양호 달성
├── 키워드 순위 추적 시작
└── SSR 마이그레이션 평가
```
