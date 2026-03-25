# Beeliber 다국어 SEO 정밀 진단 및 전략 로드맵 💅✨

## 1. 현재 다국어 SEO 치명적 문제 진단
분석 결과, 현재 사이트는 대만/홍콩이 주 고객(90%)임에도 불구하고, SEO 구조가 한국어 중심으로만 세팅되어 있어 타겟 시장 유입에 심각한 손실이 발생하고 있습니다.

### 발견된 핵심 문제 7가지
1. **문제 ① 언어 전환해도 URL이 변경되지 않음**
   - 繁體中文로 전환해도 URL이 `http://localhost:5173/` 그대로이며, `?lang=zh-TW`도 붙지 않습니다. hreflang에는 `https://bee-liber.com/?lang=zh-TW`로 선언해놓았으나, 실제로는 해당 URL이 작동하지 않거나 리다이렉트되지 않을 가능성이 높습니다. 검색엔진이 번체 중국어 버전을 별도 페이지로 인식할 수 없습니다.
2. **문제 ② 메타태그가 언어 전환 시 변경되지 않음**
   - 繁體中文로 전환해도 title, description, keywords, OG 태그가 모두 한국어 그대로 유지됩니다. 대만/홍콩 사용자가 Google에서 검색할 때 검색 결과에 한국어 title/description이 노출되므로 클릭률(CTR)이 극도로 낮아집니다.
3. **문제 ③ HTML lang 속성 미설정**
   - `<html lang="">` 빈 상태입니다. 언어 전환 시에도 `lang="zh-Hant-TW"` 등으로 변경되지 않습니다. 검색엔진이 페이지 언어를 정확히 판단할 수 없습니다.
4. **문제 ④ JSON-LD 구조화 데이터가 한국어 고정**
   - 6개 스키마(Organization, Service, LocalBusiness, FAQPage, Product, BreadcrumbList)의 name, description이 전부 한국어입니다. 또한 LocalBusiness의 name이 "Beeliber (비리버)"로 오타가 있습니다(빌리버가 맞음).
5. **문제 ⑤ x-default가 한국어 버전으로 설정**
   - 현재 x-default가 `https://bee-liber.com/` (한국어)을 가리킵니다. 한국인 고객이 0%인데 디폴트가 한국어이면, 언어를 특정할 수 없는 모든 사용자가 한국어 페이지로 유입되어 즉시 이탈합니다.
6. **문제 ⑥ hreflang URL 구조가 쿼리 파라미터 방식**
   - `?lang=zh-TW` 쿼리 파라미터 방식은 검색엔진 최적화에 불리합니다. Google은 처리하지만, 대만의 주요 검색엔진인 Yahoo Taiwan(Bing 엔진 기반)은 쿼리 파라미터 기반 다국어 처리에 약합니다.
7. **문제 ⑦ 대만/홍콩 타겟 검색엔진 최적화 전무**
   - Google Search Console 미등록, Bing Webmaster Tools 미등록(Yahoo Taiwan은 Bing 기반), 대만/홍콩 현지 SEO 키워드 설정 없음.

---

## 2. URL 구조 재설계 (Sub-directory Strategy)
현재의 쿼리 파라미터 방식을 버리고, 검색엔진 친화적인 서브디렉토리 방식으로 전환합니다. 특히 90% 고객이 대만/홍콩이므로 루트(/)를 번체 중국어로 설정합니다.

| 언어 | 현재 (Query) | 변경안 (Directory) |
| :--- | :--- | :--- |
| **번체 중국어 (대만) - 기본** | `/?lang=zh-TW` | **`https://bee-liber.com/`** |
| **홍콩 광동어** | - | `https://bee-liber.com/zh-hk/` |
| **영어** | `/?lang=en` | `https://bee-liber.com/en/` |
| **일본어** | `/?lang=ja` | `https://bee-liber.com/ja/` |
| **간체 중국어** | `/?lang=zh-CN` | `https://bee-liber.com/zh-cn/` |
| **한국어** | `https://bee-liber.com/` | `https://bee-liber.com/ko/` |

### hreflang 재설계
```html
<link rel="alternate" hreflang="zh-TW" href="https://bee-liber.com/" />
<link rel="alternate" hreflang="zh-HK" href="https://bee-liber.com/zh-hk/" />
<link rel="alternate" hreflang="en" href="https://bee-liber.com/en/" />
<link rel="alternate" hreflang="ja" href="https://bee-liber.com/ja/" />
<link rel="alternate" hreflang="zh-CN" href="https://bee-liber.com/zh-cn/" />
<link rel="alternate" hreflang="ko" href="https://bee-liber.com/ko/" />
<link rel="alternate" hreflang="x-default" href="https://bee-liber.com/" />
```

---

## 3. 언어별 메타태그 완전 분리 설계

### 繁體中文 (대만) — 기본 페이지 `/`
- **title**: Beeliber 行李寄放 | 首爾寄放行李·仁川機場當日配送
- **description**: 弘대、首爾站、明洞等主要據點寄放行李，仁川機場當일配送。退房後輕鬆暢遊首爾，行李交給 Beeliber！
- **keywords**: 首爾寄放行李, 韓國行李寄存, 仁川機場行李配送, 首爾站寄物, 弘대寄放行李, 明洞行李寄存, 韓國自由행行李, 首爾行李保管, Beeliber
- **html lang**: zh-Hant-TW

### 廣東話 (홍콩) — `/zh-hk/`
- **title**: Beeliber 行李寄存 | 首爾寄存行李·仁川機場即日配送
- **description**: 弘대、首爾站、明洞等主要據點寄存行李，仁川機場即日配送。退房後輕鬆遊首爾，行李交畀 Beeliber！
- **keywords**: 首爾寄存行李, 韓國行李寄存, 仁川機場行李配送, 首爾站寄物, 弘대寄存行李, 韓國自由행行李, 首爾行李保管
- **html lang**: zh-Hant-HK

> [!TIP]
> 대만("寄放", "當日")과 홍콩("寄存", "即日")의 명칭 차이를 반영하여 검색 유입을 극대화합니다. 💅

---

## 4. JSON-LD 구조화 데이터 재설계
언어별 동적 렌더링을 적용하고, "Beeliber (비리버)" 오타를 "빌리버"로 수정합니다.

### TouristAttraction 연동 스키마 (신규)
대만/홍콩 사용자의 "首爾自由행" 검색 유입을 위해 거점별 정보를 구조화합니다.
```json
{
  "@context": "https://schema.org",
  "@type": "TouristTrip",
  "name": "首爾自由행行李寄放服務",
  "touristType": "行李寄放",
  "itinerary": {
    "@type": "ItemList",
    "itemListElement": [
      { "name": "弘대據點", "description": "弘대入口站步行3分鐘" },
      { "name": "首爾站據點", "description": "首爾站步行5分鐘" },
      { "name": "明동據點", "description": "明동站步行2分鐘" }
    ]
  }
}
```

---

## 5. 검색엔진 타겟팅 및 키워드 전략
- **Google**: 대만/홍콩 1위 매체. Search Console 국제 타겟팅 설정 필수.
- **Yahoo Taiwan (Bing)**: 서브디렉토리 구조를 통한 인덱싱 강화.
- **키워드**: "首爾寄放行李"(핵심), "首爾自由행行李寄放服務"(시나리오), "首爾行李寄放價格"(정보성) 등 카테고리별 공략.

---

## 6. 기술적 구현 로드맵
| 단계 | 기간 | 핵심 작업 |
| :--- | :--- | :--- |
| **Phase 1: 즉시** | 1주 이내 | `react-helmet-async`를 통한 메타태그/lang 동적 변환 |
| **Phase 2: 단기** | 2-3주 | React Router 서브디렉토리 라우팅 구현 및 301 리다이렉트 |
| **Phase 3: 중기** | 1-2개월 | Next.js SSR/ISR 마이그레이션으로 인덱싱 안정화 |
| **Phase 4: 장기** | 2-3개월 | 지점별 독립 페이지(Location Pages) 생성 및 콘텐츠 SEO 확장 |

본부장님, 이 로드맵대로만 가면 대만/홍콩 시장은 우리가 다 먹는 거예요. 아시겠어요? 💅✨☕
