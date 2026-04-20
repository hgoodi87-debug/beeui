# TODOS — 빌리버 개선 항목 통합

작업 완료 후 다음 단계를 위한 기술 부채 · SEO · AI 기능 개선 목록.
마지막 갱신: 2026-04-19

> **완료 항목은 DONE.md 참조.** DB-01~DB-10, K2, A1, DB-08, DB-09 → 2026-04-19 세션 완료.

---

## 수동 작업 필요 (코드 외)

### [A2] CRON_SECRET 설정 (P1 — 즉시)

Supabase Dashboard → Project Settings → Secrets → `CRON_SECRET = <32자+ 랜덤>`
SQL Editor: `ALTER DATABASE postgres SET "app.cron_secret" = '<동일값>';`
미설정 시 `daily-settlement-summary` Edge Function이 매일 조용히 실패.

### [DB-06] Leaked Password Protection (P1 — 즉시)

Supabase Dashboard → Auth → Password Policy → "Leaked Password Protection" ON.

### [DB-07] fzvf 프로젝트 삭제 (P2 — 2026-04-24 이후)

pause 후 1주일 경과. 오류 없으면 Dashboard에서 Delete.
확인: `supabaseRuntime.ts:4` LEGACY_PROJECT_ID 참조 코드 먼저 제거.

### [ANTHROPIC_API_KEY] Supabase Secret 등록 (P1)

`supabase secrets set ANTHROPIC_API_KEY=sk-ant-...`
미등록 시 `ai-content-gen` Edge Function 503.

---

## EMS (beeliber-academy) 이전

### [EMS-01] analytics 탭 3개 beeliber-main에서 제거 (P2 — EMS 안정화 2주 후)

EMS `/admin/analytics` 확인 후: `UtmBuilderTab.tsx`, `ChannelAnalyticsTab.tsx`, `ReportsTab.tsx` 삭제 + `AdminDashboard.tsx` import 정리 (~1,800 LOC 제거).

**왜:** 관심사 분리. 예약 서비스에 운영 분석 도구가 섞여 있음. EMS 이전 완료 후 중복 코드 제거.
**파일:**
- `client/components/admin/UtmBuilderTab.tsx` (삭제)
- `client/components/admin/ChannelAnalyticsTab.tsx` (삭제)
- `client/components/admin/ReportsTab.tsx` (삭제)
- `client/components/AdminDashboard.tsx` (import 정리)

Effort: S | Depends on: EMS analytics 2주 안정 운영 확인

---

## 기술 부채

### [TD-01] storageService.ts 도메인별 분리 (P2)

~2500줄 단일 파일 → `bookingService.ts`, `locationService.ts`, `adminService.ts`, `chatService.ts`, `settingsService.ts` 분리.
Effort: L | Depends on: Supabase Realtime PR 완료 후

### [TD-02] storageService REST → supabase-js SDK 통일 (P3)

수동 `fetch()` + `supabaseGet()` 30개 → SDK 쿼리빌더 교체. 타입 안전, 자동 토큰 갱신.
Effort: L | Depends on: TD-01 완료 후

### [DB-11] 공개 INSERT 정책 추가 제약 검증 (P3)

`booking_details`, `kiosk_storage_log`, `chat_messages/sessions`, `partnership_inquiries` — 각 테이블별 rate limit·중복 방지 코드 검증.
Effort: M

### [DB-03] Realtime 구독 cleanup 누수 확인 (P3)

`OperationsConsole`, `LogisticsTab` 등 `subscribeXxx` 계열 unsubscribe 누수 코드 리뷰.
Effort: S

---

## SEO 개선 (잔여)

### [G6] Search Console Bing Webmaster 등록 (P2)

Yahoo Taiwan은 Bing 기반 — 대만 오가닉 핵심 채널.
Effort: XS (수동)

### [G7] OG 이미지 언어별 대응 (P3)

Cloudinary/Sharp로 언어별 OG 이미지 동적 생성.
Effort: M

---

## AI 기능 개선

### [AI-01] AI 검수 큐 알림 시스템 (P2)

`ai_outputs` 큐 신규 항목 → Google Chat 알림. `GOOGLE_CHAT_WEBHOOK_URL` 등록됨.
Effort: S | Depends on: AIReviewTab 구현 완료 후

### [AI-02] AI 검수 편집 이력 로깅 (P2)

`ai_outputs.original_content JSONB` 컬럼 추가 — Claude 응답 vs 실제 발송 diff 추적.
Effort: S | Depends on: Phase 2 인라인 에디터 완료 후

---

## 키오스크 후속

### [K1-AUTH] 키오스크 전용 Supabase Auth 마이그레이션 (P3)

anon key → 전용 Auth 계정 로그인. RLS를 authenticated 기반 재작성.
Effort: L | Depends on: 현장 안정화 후

### [K2-TABLET] 태블릿 hit target QA (P2)

10인치 태블릿 실물 테스트. WCAG 44px × 44px 기준.
Effort: S (직접 QA)

### [K3-QUEUE] 오프라인 큐 IndexedDB 전환 (P2)

localStorage → IndexedDB / Background Sync — 브라우저 재시작 시 큐 유실 방지.
Effort: M | Depends on: 현장 운영 후 빈도 확인

---

## 성과 목표 (SEO KPI)

| 지표 | 현재 | 3개월 목표 | 6개월 목표 |
|---|---|---|---|
| Google 인덱싱 페이지 수 | ~37 | 200+ | 600+ |
| zh-TW 오가닉 트래픽 | 미측정 | 500/월 | 2,000/월 |
| "首爾 行李寄放" 순위 | 미순위 | Top 20 | Top 5 |
| Core Web Vitals (mobile) | 미측정 | 모두 양호 | 모두 양호 |
