# Beeliber SEO / GEO 전략 플랜 2026

> 최종 업데이트: 2026-04-07  
> 기준 문서: `beeliber_seo/SKILL.md`, `SEO_GEO_REPORT_20260407.md`  
> 목표 시장: 대만·홍콩 (90%), 일본·영어권 (10%)

---

## 목차

1. [현황 진단 (As-Is)](#1-현황-진단)
2. [목표 설정 (OKR)](#2-목표-설정)
3. [타겟 고객 & 검색 행동 분석](#3-타겟-고객--검색-행동-분석)
4. [키워드 전략](#4-키워드-전략)
5. [기술 SEO 로드맵 (Technical SEO)](#5-기술-seo-로드맵)
6. [콘텐츠 SEO 전략](#6-콘텐츠-seo-전략)
7. [GEO — AI 검색 최적화 (Generative Engine Optimization)](#7-geo--ai-검색-최적화)
8. [플랫폼 등록 & 외부 링크 전략](#8-플랫폼-등록--외부-링크-전략)
9. [성과 측정 체계 (KPI)](#9-성과-측정-체계)
10. [분기별 실행 로드맵](#10-분기별-실행-로드맵)

---

## 1. 현황 진단

### 1-1. 완료된 기반 인프라

| 항목 | 상태 | 메모 |
|---|---|---|
| hreflang 6개 언어 | ✅ 완료 | zh-TW x-default |
| 서브디렉토리 URL | ✅ 완료 | `/:urlLang/...` |
| SEO.tsx 컴포넌트 | ✅ 완료 | react-helmet-async |
| MULTILANG_ROUTE_META | ✅ 완료 | `/`, `/locations`, `/services` 등 |
| seoLocations.ts (50개+ 지역) | ✅ 완료 | FAQ·관광지 포함 |
| robots.txt | ✅ 완료 | /admin, /staff, /payments 차단 |
| sitemap.xml | ✅ 수동 완료 | 자동화 미완 |
| JSON-LD 구조화 데이터 | ⚠️ 부분 완료 | Organization/Service 있음, LocalBusiness 미완 |
| 언어 스위처 버그 수정 | ✅ 완료 | ISSUE-003 |
| BranchDetails i18n 수정 | ✅ 완료 | ISSUE-001 |
| H1 중복 제거 | ✅ 완료 | Logo h1→span |
| 이미지 lazy loading | ✅ 완료 | |

### 1-2. 핵심 GAP (즉시 해결 필요)

| GAP | 비즈니스 임팩트 | 난이도 |
|---|---|---|
| Search Console 미등록 | 크롤링 현황 파악 불가, 색인 오류 알 수 없음 | 낮음 |
| index.html 정적 메타 한국어 고정 | Googlebot, ChatGPT 크롤러가 서버 렌더링 전 KR 메타 읽음 | 중간 |
| 지역 랜딩 페이지 미연결 | seoLocations.ts 데이터가 실제 URL로 노출 안 됨 | 높음 |
| Google Business Profile 미등록 | 지도 검색 완전 제외 | 낮음 |
| 리뷰 플랫폼 전략 없음 | 대만 여행자 의사결정 핵심이 "平台評價" | 중간 |
| 샤오홍슈(小紅書) SEO 전략 없음 | 주 고객 90%가 샤오홍슈로 여행 정보 탐색 | 중간 |

---

## 2. 목표 설정

### OKR — 2026년 2분기 (2026 Q2: 4월~6월)

**Objective 1: 검색 가시성 확보**
- KR 1.1: Google Search Console 등록 + zh-TW/zh-HK sitemap 제출 완료 (4월 말)
- KR 1.2: 대만 Google에서 "首爾 行李寄放" 키워드 Top 10 진입 (6월 말)
- KR 1.3: 월간 organic impressions 5,000회 달성 (6월 말)

**Objective 2: 지역 검색 점령**
- KR 2.1: 주요 지점 5개 Google Business Profile 등록 완료 (5월 말)
- KR 2.2: 홍대·성수·명동 "附近行李寄放" 검색 시 지도 Pack 노출 (6월 말)

**Objective 3: AI 검색 대응 (GEO)**
- KR 3.1: ChatGPT/Perplexity에 "서울 짐보관 추천" 질의 시 Beeliber 언급 (6월 말)
- KR 3.2: 구조화 데이터 FAQ 20개 이상 Google AI Overviews 등재 (6월 말)

### OKR — 2026년 3분기 (7월~9월)

**Objective 4: 콘텐츠 SEO 트래픽**
- KR 4.1: 지역 랜딩 페이지 20개 Google 색인 완료
- KR 4.2: 영어·zh-TW 여행 가이드 콘텐츠 10개 발행
- KR 4.3: 샤오홍슈 SEO 최적화 콘텐츠 20개 누적

---

## 3. 타겟 고객 & 검색 행동 분석

### 3-1. 핵심 페르소나

**페르소나 A — 대만 20대 여성 "小芸"**
- 서울 2박 3일, 홍대·성수·명동 필수 코스
- 여행 준비: 샤오홍슈(小紅書)에서 "首爾行程攻略" 검색 → 저장 → 출발 전날 재확인
- 짐 고민: 체크아웃 후 공항 가기 전 쇼핑 시간 뺏기기 싫음
- 검색어: "首爾 行李寄放 弘大", "弘大 附近 行李寄放", "仁川機場 行李配送 推薦"
- 의사결정: 플랫폼 별점 4.5+, 샤오홍슈 후기 10개 이상

**페르소나 B — 홍콩 30대 커플 "Lawrence & Amy"**
- 서울 3박 4일, 1박은 한옥마을/성수 스테이
- 검색어: "首爾 行李寄存 推薦", "仁川機場 即日行李配送", "홍대 근처 짐보관"
- 홍콩 특유 용어: 寄存(보관), 即日(당일) — 대만의 寄放/當日과 다름

**페르소나 C — 일본 20대 여성 "Yuki"**
- 서울 4박 5일, 쇼핑 중심
- 검색어: "ソウル 荷物預かり おすすめ", "弘大 荷物預かり"
- 검색 플랫폼: Google Japan, X(트위터) 여행 후기

**페르소나 D — 영어권 배낭여행자**
- "luggage storage Seoul near me", "Hongdae luggage storage cheap" 검색
- Google Maps 지도 검색 높은 의존도

### 3-2. 검색 단계별 행동

```
인지 (Awareness)
  └─ 샤오홍슈 "首爾行程" 콘텐츠 → 빌리버 언급
  └─ Google "首爾 行李寄放" 검색 → 사이트 발견

고려 (Consideration)
  └─ 사이트 내 서비스/요금 확인
  └─ Google Maps 지도 리뷰 확인
  └─ 샤오홍슈 빌리버 후기 검색

결정 (Decision)
  └─ 예약 페이지 진입 → 날짜/지점 선택
  └─ 모바일 위치 기반 근처 지점 확인 (핵심!)
```

### 3-3. 플랫폼별 트래픽 소스 전망

| 채널 | 현재 기여도 | 6개월 후 목표 |
|---|---|---|
| Google Organic (zh-TW) | 낮음 | **가장 높음** |
| 샤오홍슈 | 없음 | 높음 |
| Google Maps | 없음 | 중간 |
| ChatGPT/Perplexity | 없음 | 성장 중 |
| Direct / Referral | 있음 | 유지 |

---

## 4. 키워드 전략

### 4-1. 키워드 우선순위 매트릭스

**Tier 1 — 즉시 타겟 (검색량 높음 + 경쟁 낮음)**

| 키워드 | 언어 | 유형 | 타겟 URL |
|---|---|---|---|
| 首爾 行李寄放 | zh-TW | Head | `/zh-tw/` |
| 弘大 行李寄放 | zh-TW | Local | `/zh-tw/locations/hongdae` |
| 仁川機場 行李配送 | zh-TW | Service | `/zh-tw/services` |
| 首爾 行李寄存 | zh-HK | Head | `/zh-hk/` |
| Seoul luggage storage | en | Head | `/en/` |
| ソウル 荷物預かり | ja | Head | `/ja/` |
| 서울 짐보관 | ko | Head | `/ko/` |

**Tier 2 — 지역 롱테일 (빠른 순위 진입 가능)**

| 키워드 | 언어 | 이유 |
|---|---|---|
| 明洞 行李寄放 추천 | zh-TW | 명동 방문객 많음, 경쟁 낮음 |
| 聖水 行李寄放 | zh-TW | 성수 MZ 여행자 폭증 |
| 弘大 近 行李寄放 | zh-TW | "근처" 검색 증가 |
| 仁川機場 T1 行李配送 | zh-TW | 터미널 구체화 |
| Hongdae luggage storage walking distance | en | 롱테일, CPC 낮음 |
| Seoul luggage delivery Incheon airport | en | 고의도 검색 |

**Tier 3 — 콘텐츠 키워드 (여행 가이드용)**

| 키워드 | 언어 | 콘텐츠 형태 |
|---|---|---|
| 首爾3天2夜行程攻略 行李寄放 | zh-TW | 여행 가이드 블로그 |
| 韓國旅行 退房後行李處理 | zh-TW | FAQ 콘텐츠 |
| Seoul travel tips luggage | en | Travel guide |
| ソウル旅行 チェックアウト後の過ごし方 | ja | 여행 팁 |

### 4-2. 대만 vs 홍콩 용어 차이 (반드시 구분)

| 개념 | 대만(zh-TW) | 홍콩(zh-HK) | 이유 |
|---|---|---|---|
| 짐보관 | 行李**寄放** | 行李**寄存** | 관습 차이 |
| 당일 배송 | **當日**配送 | **即日**配送 | 광동어 영향 |
| 캐리어 | **行李箱** | **喼/行李箱** | 광동어 喼(gip) |
| 예약 | **預約** | **訂** / **預約** | |

---

## 5. 기술 SEO 로드맵

### Phase 1 — 즉시 실행 (1~2주, 이번 스프린트)

#### 5-1. Google Search Console 등록

```
1. search.google.com/search-console
2. "도메인 속성" bee-liber.com 추가
3. DNS TXT 레코드 인증
4. sitemap.xml 제출: https://bee-liber.com/sitemap.xml
5. URL 검사 → 수동 색인 요청 (/, /zh-tw/, /zh-hk/, /en/, /ja/)
```

> 빌리버 DNS는 Firebase Hosting → Firebase Console에서 TXT 레코드 추가

#### 5-2. index.html 정적 메타 수정

현재 문제: JS 실행 전 Googlebot/ChatGPT 크롤러가 읽는 `index.html`에 한국어 메타만 있음

```html
<!-- 현재 (문제) -->
<title>빌리버 | 서울 짐보관</title>
<meta name="description" content="홍대입구역 ...">

<!-- 수정 후: zh-TW 기본으로 (x-default 정책 일치) -->
<title>Beeliber 行李寄放 | 首爾寄放行李·仁川機場當日配送</title>
<meta name="description" content="弘大、聖水、明洞等主要據點寄放行李，仁川機場當日配送。退房後輕鬆暢遊首爾！">
<meta name="keywords" content="首爾寄放行李, 韓國行李寄存, 仁川機場行李配送">

<!-- OG 태그 추가 -->
<meta property="og:title" content="Beeliber 行李寄放 | 首爾">
<meta property="og:description" content="退房後輕鬆暢遊首爾！">
<meta property="og:image" content="https://bee-liber.com/images/og-zh-tw.jpg">
<meta property="og:type" content="website">
<meta property="og:url" content="https://bee-liber.com/zh-tw/">

<!-- Twitter Card -->
<meta name="twitter:card" content="summary_large_image">
```

> 파일 위치: `client/index.html`

#### 5-3. JSON-LD LocalBusiness 추가

각 지점 페이지에 `LocalBusiness` 스키마 추가. seoLocations.ts 데이터 활용.

```json
{
  "@context": "https://schema.org",
  "@type": "LocalBusiness",
  "name": "Beeliber 弘大 行李寄放",
  "image": "...",
  "address": {
    "@type": "PostalAddress",
    "streetAddress": "서울특별시 마포구 ...",
    "addressLocality": "Seoul",
    "addressCountry": "KR"
  },
  "geo": { "@type": "GeoCoordinates", "latitude": 37.557, "longitude": 126.923 },
  "openingHoursSpecification": [...],
  "aggregateRating": { "@type": "AggregateRating", "ratingValue": "4.8", "reviewCount": "127" }
}
```

### Phase 2 — 단기 (3~4주)

#### 5-4. 지역 랜딩 페이지 URL 연결

현재 `seoLocations.ts`에 50개+ 지역 데이터가 있지만 실제 라우트가 없음.

```
/zh-tw/storage/hongdae    → 홍대 행리 기방 랜딩
/zh-tw/storage/seongsu    → 성수 랜딩
/zh-tw/storage/myeongdong → 명동 랜딩
/zh-tw/storage/seoul-station → 서울역 랜딩
/zh-tw/airport-delivery   → 공항배송 전용 랜딩
```

- 각 페이지: H1, 지점 정보, FAQ JSON-LD, LocalBusiness 스키마, 관광지 연관 링크
- SEO_LOCATIONS 배열 데이터 기반 동적 생성 (`/storage/:slug`)

#### 5-5. sitemap.xml 자동화

Vite 빌드 시 자동 생성 스크립트 (`scripts/generate-sitemap.ts`):

```typescript
// 생성 URL 목록:
// 1. 6개 언어 × 기본 라우트 (/, /locations, /services, /qna, ...)
// 2. 6개 언어 × seoLocations slugs (/storage/:slug)
// 3. lastmod = 빌드 날짜 자동 삽입
// 4. hreflang alternate URL 자동 포함
```

#### 5-6. Bing Webmaster Tools 등록

대만 여행자 일부는 Bing 사용. 특히 iOS 사파리에서 Bing 엔진 점유율 있음.

```
1. bing.com/webmasters 등록
2. sitemap 제출
3. BingSiteAuth.xml → 이미 client/public/에 있음! 활성화만 필요
```

### Phase 3 — 중기 (5~8주)

#### 5-7. Core Web Vitals 최적화

| 지표 | 현재 예상 | 목표 | 방법 |
|---|---|---|---|
| LCP | 2.5~3.5s | < 2.0s | Hero 이미지 preload, WebP 전환 |
| FID / INP | 100~200ms | < 100ms | 번들 스플리팅, 렌더 차단 스크립트 제거 |
| CLS | 0.1~0.2 | < 0.1 | 이미지 width/height 명시 |

Google Page Experience는 모바일 랭킹에 직접 영향. 특히 대만 사용자 대부분 모바일.

#### 5-8. 서버 사이드 렌더링 또는 Prerendering 도입

현재: React SPA → Googlebot이 JS 실행 필요 → 색인 지연 가능

옵션:
- **옵션 A: prerender.io / prerendercloud** — 봇 감지 시 캐시된 HTML 제공 (쉬움, 비용 발생)
- **옵션 B: Firebase Dynamic Rendering** — Cloud Functions에서 puppeteer 렌더링
- **옵션 C: Vite SSG (Static Site Generation)** — 빌드 타임에 모든 언어/지역별 HTML 생성 (best but 공수 큼)

> **추천**: prerenderRoutes.ts 파일이 이미 있음 (`client/src/constants/prerenderRoutes.ts`). 이걸 활용해 Phase 1에 주요 경로 prerender 적용.

---

## 6. 콘텐츠 SEO 전략

### 6-1. 콘텐츠 계층 구조

```
1단계 — 허브 페이지 (Hub) — 높은 권위
  └─ /zh-tw/             (서울 전체 행이 기방)
  └─ /zh-tw/services     (서비스 설명)
  └─ /zh-tw/airport-delivery  (공항배송 전용)

2단계 — 지역 스포크 (Local Spoke) — 롱테일 트래픽
  └─ /zh-tw/storage/hongdae
  └─ /zh-tw/storage/seongsu
  └─ /zh-tw/storage/myeongdong
  └─ ... (50개+ 지역)

3단계 — 여행 가이드 콘텐츠 (Article) — 인지→트래픽
  └─ /zh-tw/tips/seoul-3days-itinerary
  └─ /zh-tw/tips/checkout-luggage-guide
  └─ /zh-tw/tips/incheon-airport-guide
```

### 6-2. 필수 콘텐츠 페이지 목록 (우선순위 순)

| 페이지 | 키워드 | 예상 효과 |
|---|---|---|
| `/zh-tw/airport-delivery` | 仁川機場行李配送 | 고의도, 구매 전환 |
| `/zh-tw/storage/hongdae` | 弘大行李寄放 | 검색량 최다 지역 |
| `/zh-tw/storage/myeongdong` | 明洞行李寄放 | 대만 관광객 밀집 |
| `/zh-tw/storage/seongsu` | 聖水行李寄放 | MZ 여행자 급증 |
| `/zh-tw/tips/checkout-guide` | 退房後行李處理 | 롱테일 인지 트래픽 |
| `/en/storage/hongdae` | Hongdae luggage storage | 영어 배낭여행자 |

### 6-3. 콘텐츠 품질 기준

각 지역 랜딩 페이지 구성 요소:

```
1. H1: [지역명] 行李寄放 — 首爾빌리버 [지역명]据點
2. 지점 정보: 주소, 지도, 운영시간, 보관 가격
3. 접근 안내: 지하철역 도보 X분, 버스 정류장
4. 관광지 연계: 이 지점에서 도보 10분 내 관광지 3~5개
5. 이용 후기 (Google Reviews 임베드)
6. FAQ: 5개 이상 (JSON-LD FAQPage 스키마)
7. CTA: 지금 예약하기 버튼 (위치 색전 자동 입력)
8. 인접 지점 링크: "근처 다른 빌리버 지점"
```

### 6-4. 여행 가이드 콘텐츠 계획 (travelTips.ts 확장)

현재 TRAVEL_TIPS에 있는 콘텐츠를 SEO 랜딩 페이지로 발행:

| 아티클 ID | 제목 (zh-TW) | 타겟 키워드 |
|---|---|---|
| `luggage-free-seoul` | 首爾24小時無行李自由行攻略 | 首爾行李寄放 攻略 |
| `checkout-guide` | 退房後怎麼玩？首爾行李寄放完整指南 | 首爾退房後 行李 |
| `incheon-airport-guide` | 仁川機場行李配送：離港當天還能玩幾個小時 | 仁川機場 行李 |
| `hongdae-spots` | 弘大必去景點×行李寄放一次解決 | 弘大 行李寄放 |
| `seongsu-guide` | 聖水洞咖啡店探店×行李攻略 | 聖水 行李寄放 |

---

## 7. GEO — AI 검색 최적화

### 7-1. GEO란

ChatGPT, Perplexity, Google AI Overviews, Claude 같은 AI 검색 엔진이 사이트 내용을 직접 인용하도록 최적화하는 전략. SEO가 "색인"이라면 GEO는 "인용".

2026년 기준 대만 여행자의 AI 검색 사용이 빠르게 증가 중. 특히 ChatGPT + 샤오홍슈 AI 기능.

### 7-2. GEO 최적화 원칙

**원칙 1 — 명확하고 직접적인 답변 구조**

AI는 질문에 답하는 구조를 선호. 각 페이지에 질문-답변 형식 삽입:

```
Q: 首爾行李寄放哪裡好？
A: Beeliber提供弘大、聖水、明洞等10個以上據點的行李寄放服務。
   4小時₩5,000起，當日可預約。

Q: 仁川機場能寄行李配送嗎？
A: Beeliber提供仁川機場T1/T2當日行李配送服務，早上10點前預約當天送達。
```

**원칙 2 — 구조화 데이터 완벽 구현**

AI 크롤러는 JSON-LD를 직접 파싱. 빌리버가 구현해야 할 스키마:
- `FAQPage` — 모든 지역 페이지에 5개 이상
- `Service` — 가격, 서비스 범위, 운영시간
- `LocalBusiness` — 각 지점 위치, 평점
- `HowTo` — 서비스 이용 방법 (4단계 절차)
- `BreadcrumbList` — 페이지 계층

**원칙 3 — E-E-A-T 신호 강화**

AI가 신뢰할 소스로 인식하려면:
- About 페이지에 서비스 창립 스토리, 운영 통계 (지점 수, 누적 이용객)
- 실제 후기 임베드 (Google Reviews)
- 미디어 언급 / 파트너십 페이지
- 서비스 투명성: 가격표, 보험 약관 명시

**원칙 4 — 다언어 명확성**

AI는 언어가 뒤섞인 페이지를 신뢰하지 않음. 각 언어 버전이 100% 해당 언어로만 구성되어야 함.

### 7-3. Google AI Overviews 대응

"서울 짐보관 추천", "首爾行李寄放推薦" 검색 시 AI Overview에 빌리버가 노출되려면:

1. **FAQ 콘텐츠 충분히** — FAQPage JSON-LD 20개 이상
2. **직접 답변형 문장** — "빌리버는 홍대, 성수, 명동 등 10개 거점에서..."
3. **신선도** — sitemap lastmod 최신 유지, 정기 콘텐츠 업데이트
4. **권위성** — 외부 사이트에서 빌리버 언급 (여행 블로그, 포털)

### 7-4. ChatGPT / Perplexity 대응

이 AI들은 웹 크롤링 + 외부 링크 신호를 사용.

전략:
- 영문 Wikipedia에 Seoul Luggage Storage 관련 항목에 빌리버 링크 삽입 (가능하다면)
- TripAdvisor, Tripadvisor-KR, Klook에 빌리버 리스팅
- Reddit r/koreatravel, r/seoul에 자연스러운 언급
- 영어 여행 블로그 (노마딕맷, The Points Guy Korea 등) 아웃리치

### 7-5. 샤오홍슈 GEO (별도 중요)

샤오홍슈 내 AI 검색("小紅書搜索")에서도 GEO 개념이 적용됨.

- 샤오홍슈 콘텐츠에 핵심 키워드 자연스럽게 삽입
- 해시태그 전략: `#首爾行李寄放` `#韓國自由行` `#弘大必去` `#仁川機場`
- 매달 최소 4개 신규 포스트 유지
- 이용 후기 콘텐츠 유도 (고객 리뷰 → 샤오홍슈 게시 가이드)

---

## 8. 플랫폼 등록 & 외부 링크 전략

### 8-1. Google Business Profile (최우선)

| 지점 | 등록 우선순위 | 이유 |
|---|---|---|
| 홍대 | 1순위 | 검색량 최다 |
| 명동 | 2순위 | 관광객 밀집 |
| 성수 | 3순위 | MZ 여행자 급증 |
| 인천공항 T1 | 4순위 | 배송 서비스 인지 |
| 인천공항 T2 | 5순위 | 동상 |

등록 시 필수 항목:
- 카테고리: "Luggage Storage" + "Delivery Service"
- 영업시간 정확히 입력
- 사진 최소 10장 (내부, 외부, 서비스 과정)
- Q&A 5개 이상 직접 등록
- 후기 유도 QR코드 지점에 비치

### 8-2. 여행 플랫폼 리스팅

| 플랫폼 | 언어 | 우선순위 |
|---|---|---|
| Klook | zh-TW, zh-HK, en, ja | 최우선 — 대만/홍콩 여행자 주사용 |
| KKday | zh-TW, zh-HK | 대만 No.1 여행 플랫폼 |
| TripAdvisor | en, ja | 영어/일본어 |
| Viator | en | 구글 파트너 |
| Tripadvisor zh-TW | zh-TW | 별도 중국어 리뷰 기반 |

> Klook/KKday는 수수료 발생하지만 트래픽 및 리뷰 기반 구축에 필수.

### 8-3. 링크 빌딩 전략

**국내 여행 미디어 아웃리치**
- 대만 여행 전문 블로거 (LINE 여행 채널, PTT 여행 게시판)
- 홍콩 여행 유튜버 협업 (짐보관 솔직 체험 콘텐츠)
- 일본 여행 블로그 (아메블로, note.com) 게스트 포스팅

**커뮤니티 자연 언급**
- PTT (대만 최대 커뮤니티) KoreaTour 게시판
- 홍콩 LIHKG 여행 게시판
- Reddit r/koreatravel 후기 제출

**파트너십 링크**
- 서울 숙소 (게스트하우스, 부티크 호텔) 파트너 페이지 상호 링크
- 한국관광공사 외국인 관광 안내 파트너 등록

---

## 9. 성과 측정 체계

### 9-1. 핵심 KPI

| KPI | 측정 도구 | 목표 (2026 Q2) | 목표 (2026 Q3) |
|---|---|---|---|
| Google Organic 세션 | GA4 | 월 2,000 | 월 8,000 |
| Organic Impressions (zh-TW) | Search Console | 월 10,000 | 월 50,000 |
| "首爾行李寄放" 순위 | Search Console | Top 20 | Top 10 |
| 지역 랜딩 색인 수 | Search Console | 10개 | 50개 |
| Google Business 조회수 | GBP | 월 500 | 월 2,000 |
| Klook 리뷰 수 | Klook Dashboard | 20개 | 100개 |

### 9-2. 측정 주기

| 주기 | 측정 항목 | 담당 |
|---|---|---|
| 주간 | 색인 오류, 새 크롤링 요청 | Search Console |
| 월간 | 키워드 순위 변동, 트래픽 소스 | GA4 + Search Console |
| 분기 | GBP 인사이트, Klook 리뷰, AI 검색 노출 | 수동 확인 |

### 9-3. 트래킹 설정 필요 항목

- GA4 이벤트: 예약 완료 (`booking_complete`), 언어별 전환율
- Search Console 연동 GA4: organic 클릭 → 예약 전환 퍼널
- UTM 파라미터: Klook, KKday, 샤오홍슈 링크에 UTM 부착

---

## 10. 분기별 실행 로드맵

### 2026 Q2 (4월~6월) — 기반 완성

```
[4월 2주차]
□ Google Search Console 등록 + sitemap 제출
□ index.html 정적 메타 zh-TW 기준으로 수정
□ OG 태그 추가 (소셜 공유 미리보기)
□ BingSiteAuth.xml 활성화 → Bing Webmaster Tools 등록

[4월 3~4주차]
□ Google Business Profile — 홍대·명동 지점 등록
□ seoLocations.ts 기반 지역 랜딩 라우트 연결 (/storage/:slug)
□ 홍대·성수·명동·서울역 지역 랜딩 페이지 4개 발행

[5월]
□ JSON-LD LocalBusiness 스키마 지점별 추가
□ FAQPage JSON-LD — 지역 페이지마다 5개 이상
□ sitemap.xml 자동화 스크립트 (Vite 빌드 훅)
□ GBP — 성수·인천공항T1·T2 추가 등록

[6월]
□ Klook 빌리버 리스팅 등록 신청
□ KKday 리스팅 등록 신청
□ Core Web Vitals 측정 후 LCP 개선 (WebP, preload)
□ Search Console 색인 현황 점검 + 오류 수정
□ Q2 성과 측정 + Q3 계획 수정
```

### 2026 Q3 (7월~9월) — 콘텐츠 & GEO 확장

```
[7월]
□ 여행 가이드 콘텐츠 5개 발행 (zh-TW 우선)
□ 샤오홍슈 SEO 콘텐츠 전략 실행 시작
□ 영어 여행 블로그 아웃리치 (TripAdvisor + Reddit)

[8월]
□ 지역 랜딩 페이지 20개 완성 (6개 언어)
□ HowTo 스키마 이용방법 페이지 추가
□ Prerendering 도입 (prerenderRoutes.ts 활용)

[9월]
□ "서울 짐보관 추천" AI 검색 노출 현황 점검
□ TripAdvisor 리뷰 캠페인
□ Q3 성과 측정 + 전략 업데이트
```

### 2026 Q4 (10월~12월) — 권위 & 반복 유입

```
□ 대만 여행 블로거 협업 콘텐츠 3개
□ 홍콩 LIHKG PTT 자연 언급 캠페인
□ JSON-LD AggregateRating 실데이터 연동
□ 전체 SEO 감사 + 전략 2027 수립
```

---

## 부록 A — 즉시 실행 체크리스트

```
□ [오늘] Google Search Console 도메인 속성 등록
□ [오늘] client/index.html — OG 태그 + zh-TW 기본 메타
□ [이번 주] 홍대 Google Business Profile 등록
□ [이번 주] sitemap.xml 자동화 스크립트 작성
□ [이번 달] 지역 랜딩 라우트 코드 구현 (/storage/:slug)
```

---

## 부록 B — 금지 사항 (빌리버 브랜드 가이드)

SEO 콘텐츠 작성 시 절대 금지 표현:
- "저렴한", "싼", "할인" → "합리적인", "실속있는" 대체
- "24시간 이용 가능" (영업시간 지점 있음)
- "인스타그램" (현재 운영 중단)
- "AI 기반 솔루션" 등 기술 표현
- "거점 수 1위" 표현
- 보험 관련 "완전 보상", "무한정 보상" 표현

---

*전략 수립 기준: 2026-04-07. 분기별 재검토 권장.*  
*관련 문서: `docs/SEO_GEO_REPORT_20260407.md`, `.agent/skills/beeliber_seo/SKILL.md`*
