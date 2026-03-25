---
name: beeliber_seo
description: 다국어 SEO 전략 v4. zh-TW(대만)을 기본 루트로 설정하는 서브디렉토리 구조, hreflang 설계, JSON-LD 스키마. SEO/메타태그 작업 시 필수 참조.
---

# 🔍 Beeliber 다국어 SEO 전략 v4

상세 원문: `docs/seo_strategy_v4.md`

## 🚨 현재 치명적 문제 7가지

1. **언어 전환해도 URL이 변경되지 않음** — `?lang=zh-TW` 쿼리 파라미터 방식으로 검색엔진이 별도 페이지 인식 불가
2. **메타태그가 언어 전환 시 변경되지 않음** — title/description/OG가 항상 한국어 고정
3. **HTML lang 속성 미설정** — `<html lang="">` 빈 상태
4. **JSON-LD 구조화 데이터가 한국어 고정** — "Beeliber (비리버)" 오타 포함 (→ 빌리버가 맞음)
5. **x-default가 한국어** — 고객 0%인 한국어가 기본, 즉시 이탈 유발
6. **hreflang이 쿼리 파라미터 방식** — Yahoo Taiwan(Bing 기반)에서 취약
7. **대만/홍콩 타겟 검색엔진 최적화 전무** — GSC/Bing 미등록

## 🗂️ 목표 URL 구조 (서브디렉토리 방식)

| 언어 | URL | 비고 |
|---|---|---|
| 번체 중국어 (대만) | `https://bee-liber.com/` | **기본 — 90% 고객** |
| 홍콩 광동어 | `https://bee-liber.com/zh-hk/` | |
| 영어 | `https://bee-liber.com/en/` | |
| 일본어 | `https://bee-liber.com/ja/` | |
| 간체 중국어 | `https://bee-liber.com/zh-cn/` | |
| 한국어 | `https://bee-liber.com/ko/` | 기존 루트에서 이동 |

## 🌐 hreflang 설계

```html
<link rel="alternate" hreflang="zh-TW" href="https://bee-liber.com/" />
<link rel="alternate" hreflang="zh-HK" href="https://bee-liber.com/zh-hk/" />
<link rel="alternate" hreflang="en"    href="https://bee-liber.com/en/" />
<link rel="alternate" hreflang="ja"    href="https://bee-liber.com/ja/" />
<link rel="alternate" hreflang="zh-CN" href="https://bee-liber.com/zh-cn/" />
<link rel="alternate" hreflang="ko"    href="https://bee-liber.com/ko/" />
<link rel="alternate" hreflang="x-default" href="https://bee-liber.com/" />
```

## 📝 언어별 메타태그 기준

### 繁體中文 (대만) — `/`
- **html lang**: `zh-Hant-TW`
- **title**: `Beeliber 行李寄放 | 首爾寄放行李·仁川機場當日配送`
- **description**: `弘大、首爾站、明洞等主要據點寄放行李，仁川機場當日配送。退房後輕鬆暢遊首爾！`
- **keywords**: `首爾寄放行李, 韓國行李寄存, 仁川機場行李配送, 首爾站寄物, 弘大寄放行李, 明洞行李寄存`

### 廣東話 (홍콩) — `/zh-hk/`
- **html lang**: `zh-Hant-HK`
- **title**: `Beeliber 行李寄存 | 首爾寄存行李·仁川機場即日配送`
- 대만 "寄放/當日" vs 홍콩 "寄存/即日" — 명칭 차이 반드시 반영

> [!IMPORTANT]
> **JSON-LD 오타 수정 필수**: "Beeliber (비리버)" → "Beeliber (빌리버)"

## 🗺️ SEO 콘텐츠 페이지 구조 (목표)

```
지역 랜딩: /tips/luggage-storage/seoul, /hongdae, /myeongdong, /seoul-station
품목 랜딩: /tips/shopping-bag-storage/seoul, /suitcase-storage/seoul
```

## 🔑 핵심 키워드

| 언어 | 키워드 |
|---|---|
| 번체중문 | 首爾 行李寄放, 明洞 行李寄放, 弘大 行李寄放, 仁川機場行李配送 |
| 영어 | luggage storage seoul, luggage storage myeongdong, luggage storage hongdae |

## 📅 기술 구현 로드맵

| Phase | 기간 | 작업 |
|---|---|---|
| **Phase 1** | 1주 이내 | `react-helmet-async`로 메타태그/lang 동적 변환 |
| **Phase 2** | 2-3주 | React Router 서브디렉토리 라우팅 + 301 리다이렉트 |
| **Phase 3** | 1-2개월 | Next.js SSR/ISR 마이그레이션 |
| **Phase 4** | 2-3개월 | 지점별 독립 Location Pages 생성 |

## 🔗 관련 문서

- `docs/SEO_PRERENDER_STATIC_HTML_PLAN.md`
- `docs/SEO_RELEASE_HANDOFF.md`
- `docs/SEARCH_CONSOLE_SUBMISSION_RUNBOOK.md`
- `client/components/SEO.tsx`
