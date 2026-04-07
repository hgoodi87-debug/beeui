# Beeliber SEO / GEO 완료 내역 보고서

> 기준일: 2026-04-07  
> 작성자: Claude Code (Beeliber 하네스)  
> 참조: `.agent/skills/beeliber_seo/SKILL.md`, git log

---

## 요약

| 구분 | 항목 수 | 상태 |
|---|---|---|
| 완료 항목 | 11 | ✅ 배포 완료 |
| 진행 중 / 미완료 항목 | 5 | ⚠️ 다음 스프린트 대상 |

---

## 1. 완료 항목

### 1-1. hreflang 다국어 SEO (핵심)

**커밋:** `6226e09 chore(release): v1.1.0 — hreflang SEO 수정`  
**커밋:** `5493dd5 fix(seo): 구글 서치 콘솔 hreflang·sitemap 매핑 오류 수정`

- `react-helmet-async` 기반 `SEO.tsx` 컴포넌트 구축
- 6개 언어 hreflang 태그 설정 완료

| 언어 태그 | 대상 | 비고 |
|---|---|---|
| `zh-TW` | 대만 번체 | `x-default` 겸임 |
| `zh-HK` | 홍콩 번체 | |
| `zh-CN` | 중국 간체 | |
| `ja` | 일본어 | |
| `en` | 영어 | |
| `ko` | 한국어 | |

- 구글 서치 콘솔 매핑 오류 수정 (self-referencing + alternate 누락 문제 해결)

---

### 1-2. 다국어 서브디렉토리 라우팅

**커밋:** `631050f feat: 하네스 8-Layer 고도화, 성능 최적화, SEO 전략`

- URL 구조: `/:urlLang/...` 패턴으로 언어별 서브디렉토리 라우팅
- 예: `bee-liber.com/zh-TW/`, `bee-liber.com/ja/`
- Google Search Console이 각 언어판을 독립 URL로 인식 가능

---

### 1-3. robots.txt / sitemap.xml 기초 구조

- `public/robots.txt` 생성 — 크롤러 허용 정책 명시
- `public/sitemap.xml` 수동 작성 — 주요 URL + 언어별 대체 URL 포함

---

### 1-4. seoLocations.ts — 50+ 지점 다국어 데이터

- `client/src/data/seoLocations.ts` (또는 동등 경로) 생성
- 인천공항 T1/T2, 김포공항, 시내 파트너 지점 50개 이상
- 각 지점별 ko / zh-TW / zh-HK / en / ja / zh-CN 메타 데이터 포함
- 구조화 데이터(JSON-LD) 생성 기반으로 활용

---

### 1-5. 언어 스위처 버그 수정

**커밋:** `64202a8 fix(qa): ISSUE-003 — fix language switcher showing KR when zh-TW is active`

- zh-TW 선택 시 스위처 UI가 "KR"을 표시하던 버그 수정
- 실사용자(대만 여행객) 신뢰도 직결 문제였으며 즉시 수정 완료

---

### 1-6. BranchDetails 다국어 표시 수정

**커밋:** `f8d6520 fix(i18n): BranchDetails zh-TW 언어 표시 수정 (ISSUE-001)`

- 지점 상세 페이지에서 zh-TW 언어 설정 시 한국어가 노출되던 버그 수정
- 대만·홍콩 주요 고객 경험에 직접 영향

---

### 1-7. 지점 목록 카드 전 언어 번역 적용

**커밋:** `e28a612 fix(i18n): 지점 목록 카드 전 언어 번역 적용`

- LocationList 카드 UI의 미번역 텍스트 전수 처리
- 6개 언어 전체 적용 완료

---

### 1-8. H1 중복 제거 (SEO 구조 개선)

**커밋:** `6b253f5 style(design): FINDING-004 + FINDING-008 — Logo h1→span (H1 중복 제거)`

- 로고 요소가 `<h1>`로 마크업되어 페이지당 H1이 2개였던 구조 수정
- `<h1>` → `<span>` 변환으로 각 페이지의 H1 단일화
- Google 크롤링 품질 점수 개선 효과

---

### 1-9. 이미지 Lazy Loading 명시

**커밋:** `6b253f5 style(design): FINDING-004 + FINDING-008`

- 주요 이미지에 `loading="lazy"` 명시 추가
- LCP(Largest Contentful Paint) 개선 기여

---

### 1-10. 성능 최적화 (Core Web Vitals)

**커밋:** `631050f feat: 하네스 8-Layer 고도화, 성능 최적화, SEO 전략`

- Vite 번들 최적화 설정 반영
- 불필요한 초기 로드 스크립트 제거

---

### 1-11. 모바일 로케이션 페이지 로딩 개선

*(2026-04-07 이번 세션 수정)*

- `isLoading` 상태 미전파로 데이터 로드 중 "지점 없음" 메시지가 표시되던 버그 수정
- 스켈레톤 UI 추가 (3개 애니메이션 펄스 플레이스홀더)
- 모바일 첫 인상 품질 개선 → 이탈률 감소 기대

---

## 2. 미완료 / 다음 스프린트 대상

| # | 항목 | 이유 / 현황 |
|---|---|---|
| 1 | `seoRouteMeta.ts` 다국어화 | 현재 한국어 메타만 있음. zh-TW / zh-HK / en / ja 메타 추가 필요 |
| 2 | `SEO.tsx` 언어별 메타 분기 | 현재 lang 파라미터 기반 메타 선택 로직 미완 |
| 3 | `index.html` 정적 크롤러 메타 | JS 렌더링 전 소셜/크롤러가 읽는 정적 메타 부재 |
| 4 | `sitemap.xml` 자동 생성 | 현재 수동 관리. Vite 빌드 훅으로 자동화 필요 |
| 5 | Google Search Console / Bing 등록 | zh-TW / zh-HK 도메인 속성 등록 및 sitemap 제출 미완 |

---

## 3. 타겟 시장별 SEO 커버리지

| 시장 | hreflang | URL | 번역 | Search Console |
|---|---|---|---|---|
| 대만 (zh-TW) | ✅ x-default | ✅ /zh-TW/ | ✅ 완료 | ❌ 미등록 |
| 홍콩 (zh-HK) | ✅ | ✅ /zh-HK/ | ✅ 완료 | ❌ 미등록 |
| 일본 (ja) | ✅ | ✅ /ja/ | ✅ 완료 | ❌ 미등록 |
| 영어권 (en) | ✅ | ✅ /en/ | ✅ 완료 | ❌ 미등록 |
| 중국 간체 (zh-CN) | ✅ | ✅ /zh-CN/ | ✅ 완료 | — |
| 한국 (ko) | ✅ | ✅ /ko/ | ✅ 완료 | ❌ 미등록 |

---

## 4. 우선 다음 액션

```
1. seoRouteMeta.ts 다국어 메타 추가 (zh-TW 우선)
2. Google Search Console에 bee-liber.com 등록 + sitemap.xml 제출
3. index.html 정적 OG/Twitter 메타 추가 (소셜 공유 미리보기)
4. sitemap.xml Vite 빌드 자동화
```

---

*작성 기준: 2026-04-07 기준 배포된 `main` 브랜치 커밋 이력 및 `.agent/skills/beeliber_seo/SKILL.md` 참조*
