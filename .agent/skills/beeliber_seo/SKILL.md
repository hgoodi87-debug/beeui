---
name: beeliber_seo
description: 다국어 SEO 전략 v5 + 실행 가이드. zh-TW 기본 루트, 서브디렉토리 구조, 메타 다국어화, 크롤러 접근성, 콘텐츠 SEO. 모든 SEO/메타태그 작업 시 필수 참조.
---

# Beeliber 다국어 SEO 전략 v5 (2026-04)

> 실행 계획서: `docs/SEO_EXECUTION_PLAN_v2.md`

## 현황 (2026-04 기준)

### 완료
- react-helmet-async 기반 SEO 컴포넌트 (`client/components/SEO.tsx`)
- 서브디렉토리 라우팅 (`/:urlLang/...`) 동작 중
- hreflang 6개 언어 + x-default → zh-tw
- 지역별 랜딩 50개+ 다국어 데이터 (`seoLocations.ts`)
- robots.txt, sitemap.xml 기본 구조

### 미완료 (GAP)
- seoRouteMeta.ts 한국어만 지원 → **6개 언어 번역 필요**
- SEO.tsx가 lang별 메타 미선택 → **lang 기반 분기 필요**
- index.html 정적 메타 한국어 고정 → **크롤러 대응 필요**
- sitemap.xml 언어별 URL 없음 → **자동 생성 스크립트 필요**
- 대만/홍콩 Search Console/Bing 미등록

---

## URL 구조 (서브디렉토리)

| 언어 | URL | html lang | 비고 |
|---|---|---|---|
| 번체 중국어 (대만) | `https://bee-liber.com/zh-tw/` | `zh-Hant-TW` | **x-default** (90% 고객) |
| 홍콩 광동어 | `https://bee-liber.com/zh-hk/` | `zh-Hant-HK` | "寄存/即日" 용어 |
| 영어 | `https://bee-liber.com/en/` | `en` | |
| 일본어 | `https://bee-liber.com/ja/` | `ja` | |
| 간체 중국어 | `https://bee-liber.com/zh/` | `zh-Hans` | |
| 한국어 | `https://bee-liber.com/ko/` | `ko` | |

---

## hreflang 표준

모든 페이지에 아래 hreflang 세트 필수:

```html
<link rel="alternate" hreflang="zh-TW" href="https://bee-liber.com/zh-tw{path}" />
<link rel="alternate" hreflang="zh-HK" href="https://bee-liber.com/zh-hk{path}" />
<link rel="alternate" hreflang="en"    href="https://bee-liber.com/en{path}" />
<link rel="alternate" hreflang="ja"    href="https://bee-liber.com/ja{path}" />
<link rel="alternate" hreflang="zh-CN" href="https://bee-liber.com/zh{path}" />
<link rel="alternate" hreflang="ko"    href="https://bee-liber.com/ko{path}" />
<link rel="alternate" hreflang="x-default" href="https://bee-liber.com/zh-tw{path}" />
```

---

## 언어별 메타태그 기준

### zh-TW (대만) — x-default
- **title**: `Beeliber 行李寄放 | 首爾寄放行李·仁川機場當日配送`
- **description**: `弘大、聖水、明洞等主要據點寄放行李，仁川機場當日配送。退房後輕鬆暢遊首爾！`
- **keywords**: `首爾寄放行李, 韓國行李寄存, 仁川機場行李配送, 聖水寄物, 弘大寄放行李, 明洞行李寄存`

### zh-HK (홍콩)
- **title**: `Beeliber 行李寄存 | 首爾寄存行李·仁川機場即日配送`
- **description**: `弘大、聖水、明洞等主要據點寄存行李，仁川機場即日配送。退房後輕鬆暢遊首爾！`
- **핵심 차이**: 대만 "寄放/當日" → 홍콩 "寄存/即日"

### en (영어)
- **title**: `Beeliber | Seoul Luggage Storage · Same-Day Airport Delivery`
- **description**: `Store your luggage at Hongdae, Seongsu, Myeongdong and more. Same-day delivery to Incheon Airport. Travel light after check-out!`
- **keywords**: `Seoul luggage storage, Incheon airport luggage delivery, Hongdae luggage storage, Seongsu luggage storage`

### ja (일본어)
- **title**: `Beeliber | ソウル荷物預かり·仁川空港当日配送`
- **description**: `弘大、聖水、明洞など主要拠点で荷物預かり、仁川空港への当日配送。チェックアウト後は手ぶらでソウルを満喫！`
- **keywords**: `ソウル荷物預かり, 仁川空港荷物配送, ホンデ荷物預かり, 韓国旅行荷物`

### zh-CN (간체)
- **title**: `Beeliber 行李寄存 | 首尔寄存行李·仁川机场当日配送`
- **description**: `弘大、首尔站、明洞等主要据点寄存行李，仁川机场当日配送。退房后轻松畅游首尔！`

### ko (한국어)
- **title**: `빌리버 | 서울 짐보관 · 인천공항 당일 짐배송`
- **description**: `홍대입구역, 성수, 명동 등 주요 거점 짐 보관부터 인천공항 당일 짐배송까지. 체크아웃 후 무거운 캐리어 없이 가볍게 여행하세요.`

---

## JSON-LD 구조화 데이터

### 필수 스키마

1. **Organization** — 회사 정보
2. **Service** — 짐보관/배송 서비스 (AggregateRating 포함)
3. **LocalBusiness** — 각 지점별 (주소, 좌표, 운영시간)
4. **BreadcrumbList** — 페이지 계층
5. **FAQPage** — QNA 페이지 + 지역별 FAQ

### 필수 수정
- "비리버" → "빌리버" (오타 전부)
- lang에 맞는 언어로 name/description 동적 변환

---

## 핵심 키워드

### zh-TW (최우선)

| 키워드 | 유형 | 타겟 페이지 |
|---|---|---|
| 首爾 行李寄放 | Head | / (홈) |
| 弘大 行李寄放 | Local | /storage/hongdae |
| 明洞 行李寄放 | Local | /storage/myeongdong |
| 聖水 行李寄放 | Local | /storage/seongsu |
| 仁川機場 行李配送 | Service | /services |
| 韓國旅行 行李寄存 | Long-tail | /tips/luggage-storage-seoul |

### en

| 키워드 | 유형 | 타겟 페이지 |
|---|---|---|
| luggage storage Seoul | Head | / |
| luggage storage Hongdae | Local | /storage/hongdae |
| luggage delivery Incheon airport | Service | /services |
| Seoul luggage delivery service | Long-tail | /tips/airport-delivery-guide |

---

## 관련 파일

| 파일 | 역할 |
|---|---|
| `client/components/SEO.tsx` | 메타태그/hreflang 렌더링 |
| `client/src/constants/seoRouteMeta.ts` | 라우트별 메타 데이터 |
| `client/src/constants/seoLocations.ts` | 지역별 다국어 SEO 데이터 |
| `client/public/sitemap.xml` | XML 사이트맵 |
| `client/public/robots.txt` | 크롤러 지시 |
| `client/index.html` | 정적 메타 + JSON-LD |
| `docs/SEO_EXECUTION_PLAN_v2.md` | 실행 계획서 |

## 작업 시 체크리스트

- [ ] 새 페이지 추가 시: seoRouteMeta.ts에 6개 언어 메타 추가
- [ ] 새 지역 추가 시: seoLocations.ts에 다국어 데이터 추가
- [ ] 메타 수정 시: SEO.tsx의 lang 분기 확인
- [ ] 배포 전: sitemap.xml 재생성
- [ ] JSON-LD 수정 시: "빌리버" 표기 확인 ("비리버" 금지)
- [ ] 대만/홍콩 용어 차이 확인: 寄放 vs 寄存, 當日 vs 即日
