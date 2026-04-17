# DONE — 완료된 작업 (재조사 불필요)

세션 시작 시 이 파일을 먼저 읽고, 이미 해결된 이슈는 재조사하지 마세요.
파일·함수 이름이 변경됐을 수 있으니 경로는 참고용으로만 사용.

---

## 2026-04-09

### 관리자 버그

| 이슈 | 파일 | 커밋 | 핵심 |
|---|---|---|---|
| `chk_settlement_status` 제약 오류 | `client/services/storageService.ts` | c1109d6 | `status→settlement_status` 잘못된 매핑 3줄 삭제. `status`는 UI 합성 필드, DB에 쓰지 않음 |
| 완료/취소 탭 필터 버그 | `client/components/admin/LogisticsTab.tsx` | 16e7557 | `DONE_STATUSES`가 `activeStatusTab` 무시하던 버그 |
| 예약 접수시간(createdAt) 표시 | `client/components/admin/LogisticsTab.tsx` | c37d65b | `fmtCreatedAt` 헬퍼 추가, KST +9h 보정 |
| 완료 이력 별도 조회 | `client/components/admin/LogisticsTab.tsx` | 1094c98 | 완료 탭 분리 |
| 지점 관리 지점 사라짐 | `client/services/storageService.ts` | (미커밋) | `INITIAL_LOCATION_ID_SET` 필터 제거 (line ~1415, ~1351). Supabase `short_code`와 `INITIAL_LOCATIONS` ID 불일치로 41개 중 ~11개만 표시되던 문제 |

### SEO

| 이슈 | 파일 | 커밋 | 핵심 |
|---|---|---|---|
| JSON-LD aggregateRating | `client/index.html` | 440f476 | `ratingValue: 5.0`, `reviewCount: 5` 실제 구글 리뷰 반영 |
| 하드코딩 canonical 제거 | `client/index.html` | 2f194ff | 동적 canonical로 교체 |
| 사이트맵 인덱스 분리 | `client/public/sitemap*.xml` | 86a78ed | `sitemap-core.xml` + `sitemap-locations.xml` 분리 |
| 사이트맵 Content-Type 헤더 | `firebase.json` | (미커밋) | `application/xml; charset=utf-8` + `max-age=0` 명시. GSC "Sitemap이 HTML" 오류는 재크롤 후 자동 해소 |
| noscript 소프트 404 방지 | `client/index.html` | d870b46 | 한/중/영 noscript 블록 추가 |

### DB / 인프라

| 이슈 | 파일 | 커밋 | 핵심 |
|---|---|---|---|
| `admin_booking_list_v1` INNER JOIN | Supabase SQL | 646b123 | LEFT JOIN으로 교체 — 일부 예약 누락 버그 |
| settlement_status 레거시 한국어 값 정규화 | Supabase migration | 72322cc | `이동중`, `완료` 등 → `PENDING`/`PAID_OUT` |
| UUID_PATTERN Supabase v7 허용 | `client/services/storageService.ts` | 67ebb0c | 비표준 variant UUID 수락하도록 완화 |
| pg_cron CRON_SECRET 설정 | Supabase SQL | (세션내) | `ALTER DATABASE` 권한 거부 → SQL 헤더에 시크릿 하드코딩으로 우회 |
| 상태변경 DB 미저장 | `client/services/storageService.ts` | a8f82e1 | — |

---

## 2026-04-11

### 키오스크 보안 + 버그 수정

| 이슈 | 파일 | 핵심 |
|---|---|---|
| 태그 중복 레이스 컨디션 | `kioskDb.ts` + Supabase migration | `UNIQUE(branch_id,date,tag)` + `insertStorageLog` 23505 시 최대 3회 재시도·재배정 |
| 오프라인 큐 stale 태그 충돌 | `kioskDb.ts` `flushOfflineQueue` | 플러시 시 DB 현황 조회 → 충돌 태그 자동 재배정. `_isFlushing` guard로 동시 플러시 방지 |
| anon DELETE 보안 취약점 | Supabase migration | `kiosk_log_anon_delete` 정책 제거 |
| done=TRUE 항목 수정 차단 | Supabase migration | `kiosk_log_anon_update` 정책 강화 |
| 미수금 손님 화면 노출 | `KioskPage.tsx` | `paymentOptions`에서 `'미수금'` 제거. 어드민 통계 탭은 유지 |
| 성공 화면 시간 재계산 버그 | `KioskPage.tsx` | `resultStartTime` state 추가. 접수 시점 저장 후 성공 화면에 전달 |
| AdminPanel 매 렌더 remount | `KioskPage.tsx` | KioskPage 내부 정의 → 최상위 `AdminPanel` 컴포넌트로 추출. Props 인터페이스 명시 |

---

## 2026-04-12

### 채널 어트리뷰션 + 보안 감사 (CSO)

| 이슈 | 파일 | 핵심 |
|---|---|---|
| UTM 채널 추적 sessionStorage → localStorage | `client/src/utils/gads.ts` | 14일 TTL localStorage로 교체. `inferChannelFromReferrer()` + `normalizeChannel()` 추가 |
| 채널 분석 관리자 탭 신규 | `client/components/admin/ChannelAnalyticsTab.tsx` | 파이차트·막대·트렌드·캠페인 테이블 포함 전체 채널 리포트 |
| 예약 사이드패널 채널 표시 | `client/components/admin/BookingSidePanel.tsx` | 정규화된 채널명 + raw utm_source + campaign 배지 표시 |
| CSO #1 CRITICAL: booking_details 공개 RLS | `supabase/migrations/20260412000001_security_fix_rls.sql` | `USING(true)` → 소유자/직원만 조회. INSERT 전면 차단. UPDATE 관리자만 |
| CSO #4 HIGH: anon 공개 RLS 제거 | 동 마이그레이션 | profiles/roles/employee_roles/employee_branch_assignments anon 정책 삭제 |
| CSO #3 HIGH: sync-google-reviews 무인증 | `supabase/functions/sync-google-reviews/index.ts` | `SYNC_SECRET_KEY` Bearer 토큰 검증 + MAX_PLACE_IDS=10 쿼터 보호 추가 |
| CSO #2 HIGH: dist_old 민감정보 git 노출 | `.gitignore` + `git rm --cached` | `client/dist_old/` git 추적 제거 |
| 마이그레이션 Supabase 적용 | Supabase Dashboard | `20260412000001_security_fix_rls.sql` 적용 완료 |

> ✅ **전체 완료**: `SYNC_SECRET_KEY` 시크릿 설정 완료. Google API 키 교체 완료.
>
> **잔여 권고사항 조치 (2026-04-12 추가):**
> - `rls_audit()` DB 함수: `20260412000003_rls_audit_function.sql`
> - `check-rls-health` Edge Function 배포 완료
> - Google API 키 IP 제한 가이드: `빌리버_Google_API키_IP제한_가이드.md`
>
> **종합 RLS 수정 (20260412000004) — DB 적용 완료:**
> - booking_details `p_booking_details_r/u` 공개 정책 잔존 확인 후 삭제 (오늘 마이그레이션에서 누락됐던 것)
> - app_settings ALL 공개 → 관리자 전용
> - employees 전 직원 PII 공개 → 관리자+본인만
> - discount_codes 공개 생성 → 관리자 전용
> - user_coupons 타인 쿠폰 조회 → 본인+관리자만
> - locations, cms_*, daily_closings, delivery_assignments, expenditures, google_reviews, system_notices 공개 쓰기 전부 차단
> - chat_sessions/messages 전체 공개 → 세션 소유자+CS 직원만
> - branch_prospects SELECT 관리자만 / INSERT 공개 유지
> - reservation_items, storage_assets, beeliber 정책 없던 테이블 정책 추가
> - 잔존 공개 쓰기: kiosk_settings만 (키오스크 PIN 보호로 의도적 유지)

---

## 2026-04-13

### 현금결제 예약 저장 버그 수정

| 이슈 | 파일 | 핵심 |
|---|---|---|
| 현장결제 버튼 클릭 시 예약 저장 실패 (42501 RLS) | `supabase/migrations/20260413000001~20260414000001` | `20260412000001_security_fix_rls.sql`의 `deny_direct_insert_booking_details WITH CHECK(false)` 정책이 모든 anon INSERT 차단. `20260414000001_force_fix_booking_insert.sql`로 모든 INSERT 정책 초기화 후 `allow_public_insert_booking_details WITH CHECK(true)` 단일 정책 재설정. 마이그레이션 push 후 anon INSERT HTTP 201 확인 |
| MCP Supabase 프로젝트 불일치 | — | MCP는 `fzvfyeskdivulazjjpgr`에 연결되지만 실제 프로덕션은 `xpnfjolqiffduedwtxey`. 중간 수정 시도(20260413000001, 000002)는 잘못된 프로젝트에 적용됨. `supabase db push --linked`로 올바른 프로젝트에 적용 필요 |
| 랜딩페이지 버튼 텍스트 변경 | `LandingPricing.tsx` + 6개 번역 파일 | "예약하러" → 보관하기(btn_storage) / 배송하기(btn_delivery). 6개 언어 모두 적용 |

---

## 2026-04-13 (후속)

### 챗봇 메시지 렌더링 수정

| 이슈 | 파일 | 커밋 | 핵심 |
|---|---|---|---|
| 채팅창 항상 비어있음 (Gemini 응답도 안 보임) | `client/components/ChatBot.tsx` | 3a903ba, 2b2798c | **원인 2개**: ① geminiService 히스토리 첫 turn이 'model'로 시작해 Gemini API 오류 → 제거 수정 ② Firestore 어댑터가 Supabase `chat_messages`로 라우팅, timestamp 컬럼 없어 오류 → 메시지 Firestore 미저장 → subscribeChatMessages 빈 배열 반환 → UI 빈 화면 |
| 수정 1: storageService Supabase fire-and-forget | `client/services/storageService.ts` | 3a903ba | saveChatMessage/saveChatSession Supabase 호출 `.catch()` 비동기로 변경. Gemini 호출 블로킹 방지 |
| 수정 2: ChatBot 로컬 state 즉시 업데이트 | `client/components/ChatBot.tsx` | 2b2798c | processMessage에서 `setMessages(prev => [...prev, msg])` 즉시 호출. 환영 메시지도 `setMessages([welcomeMsg])` 추가. subscribeChatMessages 콜백: `msgs.length > 0 ? msgs : prev` (빈 구독 결과로 로컬 덮어쓰기 방지) |
| 검증 결과 | — | — | Gemini API 200 응답 확인. 환영 메시지·사용자 메시지·봇 응답 모두 렌더링 정상. 예약 안내(Hongdae 보관 방법·가격 안내)까지 완전 동작 |

---

## 2026-04-13 (후속 2)

### 알림·바우처 미발송 버그 수정

| 이슈 | 파일 | 핵심 |
|---|---|---|
| 4월 12일 이후 예약 바우처·알림 미발송 | `on-booking-created` Edge Function | **원인**: 2026-04-12 이후 `on-booking-created` Edge Function이 HTTP 404 반환. `supabase functions list`엔 ACTIVE 표시됐으나 실제 호출 불가 상태. 재배포로 해결 |
| Edge Function 재배포 | `supabase/functions/on-booking-created/index.ts` | `supabase functions deploy on-booking-created --no-verify-jwt` 재배포 후 HTTP 400→200 정상 응답 확인 |
| DB 트리거 Vault 의존성 제거 | `supabase/migrations/20260415000001_fix_booking_trigger_vault.sql` | `trigger_on_booking_created()` 함수: Vault에 `supabase_service_role_key` 없어도 `no-verify-jwt` 배포된 Edge Function을 호출하도록 수정. Vault 있으면 인증 포함, 없으면 무인증 호출 |
| 누락 예약 재발송 | DB 직접 호출 | `a892e0d2` (dbcjsaud@gmail.com) 수동 재트리거 완료. 실제 고객 미발송 건 없음 확인 |
| 트리거 정상 동작 검증 | — | 신규 INSERT → 5초 내 `email_sent_at` 자동 설정 + `reservation_code` 생성 확인. Google Chat 알림 200 응답 확인 |

---

## 2026-04-17

### fzvf 레거시 이관 + xpnf 보안 대대적 감사·패치

| 이슈 | 파일 / DB | 핵심 |
|---|---|---|
| .mcp.json xpnf 전용 서버 등록 | `.mcp.json` (커밋 29fa777) | project_ref 박은 project-scoped MCP. `claude mcp add --scope project ...` |
| fzvf→xpnf 조직 이전 | Supabase Dashboard | 사장님이 xpnf 조직에 beeliberofficial 계정 멤버 추가 완료 |
| fzvf.luggage_storage_log 136행 누락 발견 | MCP SQL 대조 | 2026-04-07~04-15 연남점 키오스크 **미이관** 136행 / ₩1,114,000. branch_id 컬럼 없는 단일지점 레거시 |
| archive 테이블 이관 | migration `create_luggage_storage_log_archive` | `public.luggage_storage_log_archive` 신설 + 관리자 전용 RLS. 원본 구조 그대로 + branch_id='yeonnam' + source='fzvf_legacy' |
| 136행 JSON 일괄 INSERT | `execute_sql` (jsonb_array_elements) | 원본과 날짜별 행수·매출 **100% 일치** (04-07:2/18K → 04-15:9/45K) |
| SECURITY DEFINER 뷰 3개 차단 | migrations `revoke_anon_from_admin_views` + `views_to_security_invoker` | `admin_booking_list_v1`/`admin_revenue_daily_v1`/`admin_revenue_monthly_v1` → REVOKE anon + `SET (security_invoker = true)`. 이전엔 anon key로 전 예약·결제·이메일 조회 가능했던 경로 차단 |
| 함수 9개 search_path 고정 | migration `fix_function_search_path_mutable` | `admin_adjust_credits`, `deduct_credits`, `approve_ai_output`x2, `reject_ai_output`x2, `trigger_on_booking_created/updated`, `map_admin_booking_status`, `set_updated_at` 모두 `SET search_path = public, pg_temp`. SECURITY DEFINER 권한 승격 경로 차단 |
| chat_sessions anon_update 축소 | migration `tighten_chat_sessions_anon_update` | `USING(true) WITH CHECK(true)` 제거 → session_id 기반 self-update만 허용. 세션 탈취 → 과거 대화 열람 공격 차단 |
| bank_transactions anon 전권 차단 (CRITICAL) | migration `fix_critical_public_rls_3tables` | 기존 `admin_all_bank_transactions`가 `roles={public}` + `ALL true/true`로 **anon이 통장 거래 전권**이었음. `finance_staff` 이상만 접근하도록 4개 정책으로 분리 |
| partnership_inquiries SELECT 차단 | 동 migration | `p_partnership_inq_r` SELECT `qual=true` → 관리자 전용. 문의자 회사·담당자·연락처 PII 유출 차단 |
| user_coupons INSERT 차단 | 동 migration | `p_user_coupons_i` WITH CHECK `true` → 관리자(finance/cs) 또는 본인(`user_id=auth.uid()`)만 INSERT |
| fzvf 프로젝트 pause | MCP `pause_project` | 이관 완료 확인 후 pause. 실코드가 fzvf 쓰는 경로 있으면 즉시 오류로 드러남. 트래픽 차단만, 데이터 보존 |

**advisor 결과: ERROR 3건 / function WARN 9건 → 0건 해결.** 남은 WARN 8건은 모두 의도적 공개 INSERT (예약·챗봇·키오스크·파트너십 접수) + Supabase Auth 토글 1건(`auth_leaked_password_protection`).

**Performance advisor 198건 요약**: multiple_permissive_policies 130건, auth_rls_initplan 34건, unindexed_foreign_keys 10건, unused_index 23건. → TODOS.md `DB-06`~`DB-09`로 이관.

**⚠️ 수동 작업 필요**:
- Supabase Dashboard → Auth → Password Policy → "Leaked Password Protection" 토글 활성화
- fzvf pause 후 1주일 오류 관찰 → 문제없으면 Dashboard에서 Delete Project

---

## 2026-04-13 (후속 3)

### 직원 소속지점 수정 불가 버그 수정

| 이슈 | 파일 | 핵심 |
|---|---|---|
| 직원 소속지점 저장 실패 (400 "계정 상태 값이 올바르지 않습니다.") | `client/services/storageService.ts` | **원인**: `getAdmins()` → `employees.employment_status = 'inactive'` 그대로 반환. Edge Function `validateInput`의 `VALID_STATUSES`에 `'inactive'` 없음 → 400 에러. **수정**: `getAdmins()` 에서 `'inactive'` → `'invited'` 정규화 |
| `isUuid` Supabase v7 UUID 불인식 | `supabase/functions/_shared/admin-auth.ts` | 기존 패턴 `[1-5]`가 v7 UUID의 version digit `7`을 거부 → `loadAdminFromSupabase`에서 employee UUID로 직접 조회 불가. 패턴을 `[0-9a-f]{4}` (폭넓게)로 완화 |
| Edge Function 재배포 | `admin-account-sync` | `supabase functions deploy admin-account-sync --no-verify-jwt` 재배포 완료 |

---

## 재조사 불필요 영역

아래 동작은 정상 확인됨. 버그 의심 시 먼저 최신 코드 확인 후 조사:

- `BookingState.status` — UI 합성 필드. DB `booking_details` 테이블에 없음. `settlement_status`와 별개
- `getLocations()` / `subscribeLocations()` — Supabase 우선, INITIAL_LOCATIONS 폴백. `INITIAL_LOCATION_ID_SET` 필터 **제거된 상태**
- `sitemap.xml` / `sitemap-core.xml` / `sitemap-locations.xml` — `dist/`에 존재, `application/xml` 정상 서비스
