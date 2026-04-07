# TODOS — 빌리버 개선 항목 통합

작업 완료 후 다음 단계를 위한 기술 부채 · SEO · AI 기능 개선 목록.
마지막 갱신: 2026-04-07

---

## 기술 부채

### storageService.ts 도메인별 분리

**What:** `client/services/storageService.ts` (~2500줄)를 도메인별 파일로 분리.

**Why:** 단일 파일에 예약·위치·관리자·정산·채팅 로직이 모두 있어 유지보수 시 파일 전체를 탐색해야 함. 분리하면 PR 충돌 감소, 온보딩 속도 향상.

**Target files:** `bookingService.ts`, `locationService.ts`, `adminService.ts`, `chatService.ts`, `settingsService.ts`

**Effort:** L (human: ~2일 / CC: ~30분) **Priority:** P2  
**Depends on:** Supabase Realtime PR 완료 후

---

### storageService.ts REST 호출 → @supabase/supabase-js 통일

**What:** 수동 `fetch()` + `supabaseGet()` 패턴 30개 호출을 `@supabase/supabase-js` 쿼리 빌더로 교체.

**Why:** REST fetch와 SDK 두 방식이 공존 중. SDK 전환 시 타입 안전 쿼리, 자동 토큰 갱신 활용 가능.

**Effort:** L (CC: ~20분) **Priority:** P3  
**Depends on:** storageService.ts 도메인별 분리 완료 후

---

### ANTHROPIC_API_KEY Supabase Secret 등록

**What:** `supabase secrets set ANTHROPIC_API_KEY=sk-ant-...` 실행.

**Why:** `ai-content-gen` Edge Function이 이 키 없이는 503으로 실패.

**Effort:** XS (즉시 실행 가능) **Priority:** P1  
**Depends on:** 없음

---

## SEO 개선 (SEO_EXECUTION_PLAN_v2 잔여 항목)

완료: G1 (seoRouteMeta 다국어), G2 (SEO.tsx lang 기반 메타), G5 (JSON-LD 오타), hreflang 3중 레이어

### G3 — 크롤러 접근성: Prerender / SSG 도입 (HIGH)

**What:** SPA의 치명적 약점 해결 — 크롤러가 JS 실행 못하면 한국어 index.html만 인식.

**Options:**
- 단기: Firebase Hosting rewrites + Puppeteer/Rendertron으로 봇 감지 → pre-rendered HTML 반환
- 중기: Vite SSG 플러그인으로 빌드 타임 정적 생성
- 장기: Next.js 마이그레이션

**권장 순서:** Prerender → Vite SSG → Next.js 검토

**Effort:** XL (human: ~1주 / CC: ~1시간) **Priority:** P1 (SEO 임팩트 최대)

---

### G4 — sitemap.xml 언어별 URL 자동 생성 (HIGH)

**What:** 현재 37개 URL (한국어만) → 언어별 hreflang 포함 654 URL 자동 생성.

**How:** `client/scripts/generateSitemap.mjs` 빌드 스크립트 작성. 9 라우트 × 6 언어 + 50 지역 × 6 언어 + 50 배송 × 6 언어.

**예시:**
```xml
<url>
  <loc>https://bee-liber.com/zh-tw/</loc>
  <xhtml:link rel="alternate" hreflang="zh-TW" href="https://bee-liber.com/zh-tw/" />
  <xhtml:link rel="alternate" hreflang="x-default" href="https://bee-liber.com/zh-tw/" />
</url>
```

**Effort:** M (CC: ~20분) **Priority:** P2

---

### G6 — Search Console / Bing Webmaster Tools 등록 (HIGH)

**What:** Google Search Console에 zh-TW 속성 추가 + sitemap 제출. Bing Webmaster Tools 신규 등록.

**Why:** Yahoo Taiwan은 Bing 기반이라 대만 오가닉 트래픽의 핵심 채널.

**Effort:** XS (수동 작업) **Priority:** P2

---

### G7 — OG 이미지 언어별 대응 (LOW)

**What:** SNS 공유 시 언어별 텍스트가 포함된 OG 이미지 제공.

**How:** Cloudinary/Sharp로 언어별 OG 이미지 동적 생성, 또는 언어별 정적 이미지 세트 준비.

**Effort:** M **Priority:** P3

---

## AI 기능 개선

### AI 검수 큐 알림 시스템

**What:** `ai_outputs` 큐에 새 항목이 쌓일 때 관리자에게 Google Chat 알림 발송.

**Why:** 현재 관리자가 AIReviewTab을 수동으로 확인해야 함. 큐 적체 → CS 응답 지연.

**How:** `on-booking-created`와 동일한 Google Chat Webhook 패턴. `GOOGLE_CHAT_WEBHOOK_URL` 이미 Supabase secret 등록됨.

**Effort:** S (CC: ~15분) **Priority:** P2  
**Depends on:** ai-content-gen Edge Function + AIReviewTab 구현 완료 후

---

### AI 검수 편집 이력 로깅

**What:** `ai_outputs` 테이블에 `original_content JSONB` 컬럼 추가. 인라인 에디터 수정 후 원본 vs 최종 diff 추적 가능하게.

**Why:** 현재 `generated_content`는 편집으로 덮어써짐. Claude 응답과 실제 발송 내용 차이를 추적할 수 없어 AI 품질 평가 불가.

**How:** INSERT 시 `generated_content`를 `original_content`에도 복사 (trigger 또는 app 코드).

**Effort:** S **Priority:** P2  
**Depends on:** Phase 2 인라인 에디터 완료 후

---

### AI 검수 정책 재검사 버튼

**What:** AIReviewTab 인라인 에디터에서 수정 후 저장 전 "정책 재검사" 버튼으로 금지어 검사 재실행.

**Why:** 현재 편집 후 승인하면 original policy_check가 그대로 유지 — 관리자가 실수로 금지어 추가해도 경고 없음.

**Effort:** S **Priority:** P3  
**Depends on:** Phase 2 인라인 에디터 완료 후

---

## 성과 목표 (SEO KPI)

| 지표 | 현재 | 3개월 목표 | 6개월 목표 |
|---|---|---|---|
| Google 인덱싱 페이지 수 | ~37 | 200+ | 600+ |
| zh-TW 오가닉 트래픽 | 미측정 | 500/월 | 2,000/월 |
| "首爾 行李寄放" 순위 | 미순위 | Top 20 | Top 5 |
| Core Web Vitals (mobile) | 미측정 | 모두 양호 | 모두 양호 |
