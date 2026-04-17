# TODOS — 빌리버 개선 항목 통합

작업 완료 후 다음 단계를 위한 기술 부채 · SEO · AI 기능 개선 목록.
마지막 갱신: 2026-04-17

---

## 관리자 DB 연동 감사 결과 (2026-04-17 세션)

### [DB-01] AccountingTab 통장 거래 에러 UX (P1 — 부분 완료)

**완료 부분 (2026-04-17):** `handleSaveBankTx`에 `catch` 블록 + `alert` 추가 — 저장 실패 시 사용자가 인지 가능.

**잔여 작업:** `alert` 대신 프로젝트 토스트 시스템(`motion` 기반 `csToast` 등)으로 교체. 접근성·다국어 고려.

**Why:** `alert`는 모바일 UX 저해. 관리자는 다국어 운영자 포함. **How to apply:** `BookingDetailModal.tsx`의 `setCsToast` 패턴 동일 적용.

**Effort:** XS **Priority:** P2

---

### [DB-02] 키오스크 anon 키 노출 — RLS 감사 재확인 (P1)

**What:** `client/services/kioskDb.ts:9` 의 `_ANON` 변수가 `supabaseGet/supabaseMutate` 로 직접 전달된다. 2026-04-12 RLS 강화 이후 `kiosk_storage_log`·`kiosk_branches`·`kiosk_settings`가 실제로 다음 5개 공격 시나리오를 차단하는지 SQL로 확인 필요.

1. 다른 `branch_id`의 로그 INSERT (악의적 클라이언트가 branch_id 위조)
2. 다른 지점의 완료된 로그 UPDATE (done=true 이후 수정)
3. 다른 지점의 로그 DELETE (이미 정책 제거됨 — 재검증)
4. `kiosk_settings.admin_password` 읽기
5. 다른 지점 바우처 태그 순번 훔치기

**Why:** anon key 노출 자체는 Supabase 설계 의도. 취약점은 RLS 정책 부실. **How to apply:** `supabase/migrations/20260412000004_*.sql` 정책 검토 + `select rls_audit()` Edge Function 재실행.

**Effort:** S (CC: ~20분) **Priority:** P1

---

### [DB-03] AccountingTab 실시간 구독 cleanup 확인 (P3)

**What:** `useBankTransactions`(React Query)는 자동 cleanup이지만, `StorageService`의 `subscribeXxx` 계열을 사용하는 다른 탭(`OperationsConsole`, `LogisticsTab`)에서 unsubscribe 누수 여부 코드 리뷰.

**Why:** 탭 전환 시 구독 누적되면 대시보드 장기 구동 시 메모리·네트워크 부하.

**Effort:** S (CC: ~15분) **Priority:** P3

---

### [DB-04] 금액 정밀도 방어 (P3 — 한국 원화 특성상 위험 낮음)

**What:** `AccountingTab.tsx:67,105` 등에서 `reduce((s, t) => s + t.amount, 0)` 부동소수점 합산. 한국 원화는 소수점 없어 2^53까지 정수 정확성 보장 → 실사용 위험 낮음.

**Why:** 단, `bankForm.balance` 입력이 `<input type="number">`일 경우 사용자가 소수점 입력 가능 → DB에 decimal 유입 가능.

**How to apply:** `<input step="1" min="0">` + `onChange`에서 `Math.round` 강제.

**Effort:** XS **Priority:** P3

---

### [DB-05] kioskDb flushOfflineQueue flushed 카운트 버그 (완료 — 2026-04-17)

**완료:** 기존 코드는 mutation result가 빈 배열이어도 `flushed++` 실행하고 큐에서 제거했다. `result?.[0]`가 없을 때 `remaining.push(entry)` + `console.warn` 추가로 수정. 이로써 RLS 정책 위반·네트워크 이상 시 큐에 유지되어 재시도 가능.

---

### [DB-06] Leaked Password Protection 활성화 (P1 — 수동 작업)

**What:** Supabase Dashboard → Auth → Password Policy → "Leaked Password Protection" 토글 ON.

**Why:** HaveIBeenPwned.org 유출 패스워드 자동 차단. 현재 advisor WARN 상태.

**Effort:** XS (1분) **Priority:** P1

---

### [DB-07] fzvf 최종 삭제 (P2 — 관찰 후 수동 작업)

**What:** https://supabase.com/dashboard/project/fzvfyeskdivulazjjpgr/settings/general → Delete Project.

**Why:** 2026-04-17 pause 완료. 이관 검증 끝. 1주일 관찰해서 에러 없으면 삭제.

**Check first:** pause 이후 애플리케이션 로그·Google Chat 알림에서 `fzvfyeskdivulazjjpgr` 관련 오류 없는지. 있으면 **`client/services/supabaseRuntime.ts:4` LEGACY_PROJECT_ID 우회 로직이 아직 동작 중**이니 삭제 전 해당 코드 확인.

**Effort:** XS (5분) **Priority:** P2 (1주일 후)

---

### [DB-08] Performance: RLS 정책 통합 (P2)

**What:** advisor `multiple_permissive_policies` 130건. 같은 롤·액션에 중복 permissive 정책이 쌓여 쿼리마다 전부 평가됨.

**핵심 테이블 (영향도 순):**
- `booking_details` (21건), `chat_sessions` (19), `reservations` (18), `chat_messages` (12), `payments` (10), `kiosk_storage_log` (7)

**Approach:** `p_*_admin` + `owner_or_staff_*` + `staff_*` 계열을 OR 조건 단일 정책으로 병합. 예:
```sql
-- Before: 3개 정책 (admin, owner, staff)
-- After: 1개 정책 USING (admin_role OR owner_match OR staff_role)
```

**Effort:** L (CC: ~45분) **Priority:** P2

---

### [DB-09] Performance: auth.uid() InitPlan 래핑 (P2)

**What:** advisor `auth_rls_initplan` 34건. `auth.uid()` / `auth.role()` 호출이 매 row마다 재평가됨.

**Fix:** 모든 RLS 정책에서 `auth.uid()` → `(select auth.uid())`, `auth.role()` → `(select auth.role())` 래핑. PostgreSQL 쿼리 플래너가 InitPlan으로 한 번만 평가.

**Effort:** M (CC: ~30분) **Priority:** P2
**Depends on:** DB-08 진행 후 같이 처리 권장

---

### [DB-10] FK 인덱스 추가 (P2)

**What:** advisor `unindexed_foreign_keys` 10건. 우선순위:
1. `reservation_items.reservation_id_fkey` + `baggage_type_id_fkey`
2. `proof_assets.reservation_id_fkey`
3. `booking_details.payout_id_fkey`
4. `daily_closings.branch_id`, `expenditures.branch_id`
5. `user_coupons.discount_code_id`, `branch_prospects`, `storage_assets.uploaded_by_user_id`, `cms_contents.area_slug`

**Why:** FK 없는 child row 조회/CASCADE 삭제 시 seq scan.

**Effort:** S (CC: ~10분) **Priority:** P2

---

### [DB-11] 남은 공개 INSERT 정책 검증 (P3)

**What:** advisor `rls_policy_always_true` WARN 남은 8건은 모두 의도적 공개 INSERT (DONE.md 2026-04-17 참조). 단 **각 테이블별 추가 제약이 코드에서 수행되는지** 검증:
- `booking_details` allow_public_insert: 중복 예약 감지 + payment_key 검증이 Edge Function이나 client에 있는지
- `kiosk_storage_log` anon_insert/update: branch_id 위조 방지 장치 (현재 없음, 클라이언트 trust)
- `chat_messages`/`chat_sessions` anon_insert: rate limit (abuse 방지)
- `partnership_inquiries` INSERT: spam 방지 (캡차 등)
- `branch_prospects` INSERT: 같은 이유

**Effort:** M **Priority:** P3

---

## 배포 후 확인 필요 (2026-04-16 세션)

### [QA-01] 관리자 화면 — 커미션 제거 실환경 확인 (P1)

**What:** 아래 두 화면 실제 로그인 후 확인:
1. 일일 정산탭 — "지점 커미션" 카드 없음, "총 할인" 카드 표시
2. 통합 회계탭 — 키오스크 테이블에 "지점 커미션" 컬럼 없음 (colSpan 5)
3. 키오스크 설정 — "지점 커미션 비율" 입력 없음

**Why:** 인증 필요 페이지라 QA 브라우저 테스트 불가. 코드 검수는 완료.

**Effort:** XS (5분) **Priority:** P1 (배포 후 즉시)

---

---

## 정산 시스템 후속 작업 (plan-eng-review 결과)

### [A1] 정산 상태 전이 DB 레벨 검증 (HIGH)

**What:** `settlement_status` 전이 규칙을 PostgreSQL trigger 또는 application layer에서 강제.
예: `PAID_OUT → PENDING` 역전이 방지.

**Why:** 현재는 CHECK 제약(허용값)만 있고, 전이 경로 검증 없음. 실수로 `PAID_OUT` 상태를 `PENDING`으로 되돌려도 DB가 허용함.

**Option A (추천):** PostgreSQL BEFORE UPDATE trigger로 허용 전이 행렬 체크
**Option B:** `storageService.ts` application layer에서 전이 검증 함수 추가

**Effort:** M (CC: ~15분) **Priority:** P2
**Depends on:** 없음

---

### [A2] CRON_SECRET + app.cron_secret 설정 (CRITICAL — 수동 작업)

**What:** Supabase에서 두 군데 설정 필요:
1. `Dashboard → Project Settings → Secrets` → `CRON_SECRET = <랜덤 32자 이상 문자열>`
2. `Dashboard → Database → SQL Editor`:
   ```sql
   ALTER DATABASE postgres SET "app.cron_secret" = '<동일한 값>';
   ```

**Why:** pg_cron이 `x-cron-secret` 헤더 없이 호출하면 Edge Function이 401 반환.
설정하지 않으면 `daily-settlement-summary`가 매일 조용히 실패.

**Effort:** XS (5분) **Priority:** P1 (즉시 실행)
**Depends on:** 없음

---

### [C3] storageService.ts 소문자 'deleted' 방어 코드 명시화 (LOW)

**What:** `client/services/storageService.ts:693,706,718` — `|| row.settlement_status === 'deleted'` 조건에 주석 추가.

**Why:** 마이그레이션으로 DB값은 모두 대문자로 정규화됨. 이 체크는 이제 방어 목적.
명시적 주석 없으면 미래 개발자가 해당 조건이 살아있는 코드라 오해할 수 있음.

**Effort:** XS **Priority:** P3

---

### [T1] VAT 단위 테스트 실행 환경 구성 (MEDIUM)

**What:** `supabase/functions/_shared/vat.test.ts` 실행:
```bash
deno install  # Deno 설치 후
deno test supabase/functions/_shared/vat.test.ts
```
또는 CI에 `deno test` 스텝 추가.

**Why:** 테스트 파일은 작성됨. Deno 미설치로 로컬 실행 불가.

**Effort:** XS **Priority:** P2

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

## 키오스크 후속 작업 (plan-eng-review 2026-04-11)

### [K1] 오프라인 큐 내구성 개선 (MEDIUM)

**What:** 현재 오프라인 큐는 `localStorage` 기반. 브라우저 재시작 또는 강제 종료 시 미전송 접수 데이터 유실 가능.

**Why:** Wi-Fi 불안정한 현장 키오스크 특성상, 손님 접수 후 오프라인 상태에서 직원이 실수로 브라우저를 닫으면 데이터가 사라짐. 실제 사고 발생 시 수동 복구 불가.

**How:** `localStorage` → IndexedDB 전환, 또는 Service Worker의 Background Sync API 활용. `kioskDb.ts` `enqueueOffline/flushOfflineQueue` 교체.

**Effort:** M (CC: ~30분) **Priority:** P2
**Depends on:** 현장 운영 후 실제 유실 빈도 확인 시 우선 작업

---

### [K2] kiosk_branches.branch_id NULL 점검 (SMALL)

**What:** 신규 지점 추가 시 `branch_id`가 null이면 한국어 slug('연남' 등)이 `kiosk_storage_log.branch_id`로 저장됨. 이후 관리자 대시보드 조회 시 매핑 불일치 가능.

**Why:** `KioskPage.tsx`에서 `branch.branch_id ?? branch.slug` 패턴 사용. branch_id가 항상 채워져 있으면 문제 없지만, 방어 없이 실수 가능.

**How:** Supabase SQL Editor에서 검증:
```sql
SELECT id, slug, branch_id FROM kiosk_branches WHERE branch_id IS NULL;
```
결과 있으면 branch_id 채워넣기.

**Effort:** XS (5분) **Priority:** P1 (신규 지점 추가할 때마다 체크)
**Depends on:** 없음

---

## 성과 목표 (SEO KPI)

| 지표 | 현재 | 3개월 목표 | 6개월 목표 |
|---|---|---|---|
| Google 인덱싱 페이지 수 | ~37 | 200+ | 600+ |
| zh-TW 오가닉 트래픽 | 미측정 | 500/월 | 2,000/월 |
| "首爾 行李寄放" 순위 | 미순위 | Top 20 | Top 5 |
| Core Web Vitals (mobile) | 미측정 | 모두 양호 | 모두 양호 |

---

## 키오스크 후속 작업 (plan-eng-review 2026-04-14 결과)

### [K1] 키오스크 전용 Supabase Auth 계정 마이그레이션 (MEDIUM)

**What:** 키오스크 디바이스가 anon key 대신 전용 Supabase Auth 계정으로 로그인.
`localStorage`에 세션 영구 저장 후 RLS에서 `anon`/`authenticated` 명확히 분리.

**Why:** 현재 anon key 기반 아키텍처에서 RLS 패치가 계속 쌓이고 있음.
인증 기반으로 전환하면 admin_password 키 노출 문제 자체가 사라지고,
설정 write 정책도 인증 사용자로만 제한 가능. Edge Function 의존도 줄어듦.

**How to apply:** 1) `supabase auth admin createUser` 로 kiosk@bee-liber.com 계정 생성
2) 각 지점 태블릿에서 최초 1회 로그인 (세션 영구 저장)
3) RLS를 authenticated 기반으로 재작성

**Effort:** L (CC: ~2h) **Priority:** P3 (현재 Edge Function 방향으로 안정화 후)
**Depends on:** K2 Edge Function 완료 후

---

### [K2] 태블릿 hit target QA (HIGH — 현장 확인 필요)

**What:** 실제 태블릿(10인치 전후)에서 3컬럼 레이아웃의 ± 버튼, 시간 선택 버튼 터치 정확도 검증.
WCAG 최소 44px × 44px touch target 기준 충족 여부 확인.

**Why:** 설계 문서에 "실제 태블릿에서 hit target 확인 필요"로 명시됐지만 미검증.
작은 버튼이 외국인 여행객의 손가락 크기와 맞지 않으면 접수 오류 발생.

**How to apply:** 현장에서 태블릿으로 1시간 이상 실 사용 테스트. 버튼 크기 피드백 수집.

**Effort:** S (직접 QA) **Priority:** P2 (배포 직후)
**Depends on:** 현장 배포 후

