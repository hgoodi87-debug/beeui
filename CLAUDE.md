# Beeliber Claude Code 하네스 설정 (v2026.04)

## Advisor 응답 규칙

Advisor(Opus)는 다음 규칙을 반드시 준수:
1. 100단어 이내로만 응답
2. 열거된 단계 형태(numbered list)로만 응답
3. 산문형 설명 금지

## 프로젝트 개요

**Beeliber (빌리버)** — 서울 여행객 대상 짐보관·공항배송 서비스.
- 웹사이트: bee-liber.com
- 슬로건: 짐 없는 자유, 온전한 만끽
- 핵심 차별화: 빌리버는 짐을 맡기는 곳이 아니라, 여행을 완성하는 곳입니다.
- 주요 고객: 대만·홍콩 20~30대 여성 여행객 (90%)

## 기술 스택

- **Frontend**: React SPA (Vite + TypeScript) + Tailwind CSS
- **Backend**: Firebase Functions v2 (Callable + REST) + Supabase Edge Functions
- **DB**: Supabase (PostgreSQL) — Firestore 레거시 브릿지 병행
- **Auth**: Supabase Auth
- **Storage**: Supabase Storage
- **Hosting**: Firebase Hosting
- **결제**: Toss Payments (현재 mock 모드, 실배포 대기)

## 작업 브랜치

현재 브랜치: `codex/continue-after-restore-20260322`
메인 브랜치: `main`

---

## gstack 통합 (Garry Tan's Virtual Engineering Team)

gstack은 Claude Code를 가상 엔지니어링 팀으로 확장하는 슬래시 커맨드 세트입니다.
빌리버 하네스 6-Layer와 gstack 역할을 결합하여 운영합니다.

### 웹 브라우징 규칙

- 모든 웹 브라우징은 `/browse` 스킬을 사용합니다.
- `mcp__claude-in-chrome__*` 도구는 절대 사용하지 마세요.

### gstack 스킬 맵 (빌리버 레이어별 매핑)

| 빌리버 Layer | gstack 스킬 | 용도 |
|---|---|---|
| **기획·설계** | `/office-hours` | 제품 방향 점검, 아이디어 브레인스토밍 |
| | `/plan-ceo-review` | CEO 관점 기획 리뷰 (범위 확장/축소 판단) |
| | `/plan-eng-review` | 아키텍처·데이터 흐름·실패 모드 정리 |
| | `/plan-design-review` | 디자인 감사 워크플로우 |
| | `/design-consultation` | 디자인 시스템 설계 |
| | `/autoplan` | CEO→디자인→엔지니어 리뷰 자동 파이프라인 |
| **L1 Brand** | `/design-review` | 라이브 사이트 비주얼 QA (AI slop 감지) |
| | `/design-shotgun` | 디자인 변형 탐색 + 비교 보드 |
| | `/design-html` | AI 목업 → 프로덕션 HTML/CSS 변환 |
| **L2 Commerce** | `/review` | PR 코드 리뷰 (SQL 안전, 신뢰 경계 위반) |
| | `/investigate` | 결제·가격 버그 근본 원인 추적 |
| **L3 Operations** | `/qa` | 체계적 QA + 버그 수정 루프 |
| | `/qa-only` | 수정 없이 QA 리포트만 작성 |
| | `/browse` | 헤드리스 브라우저 QA 테스팅 |
| **L4 AI** | `/cso` | 보안 감사 (OWASP + STRIDE + 시크릿 스캔) |
| | `/careful` | 파괴적 명령 안전 가드레일 |
| | `/guard` | `/careful` + `/freeze` 결합 최대 안전 모드 |
| **L5 Admin** | `/freeze` | 특정 디렉토리만 편집 허용 (범위 제한) |
| | `/unfreeze` | freeze 해제 |
| **L6 Eval** | `/retro` | 주간 회고 (커밋 분석, 코드 품질, 트렌드) |
| | `/benchmark` | 성능 회귀 감지 (Core Web Vitals) |
| **배포** | `/ship` | 테스트→리뷰→VERSION 범프→PR 생성 |
| | `/land-and-deploy` | PR 머지→CI→프로덕션 배포→헬스체크 |
| | `/canary` | 배포 후 카나리 모니터링 |
| | `/document-release` | 배포 후 문서 자동 갱신 |
| **유틸** | `/learn` | 프로젝트 학습 내역 관리 |
| | `/codex` | Codex 환경 작업 가이드 |
| | `/connect-chrome` | 실제 Chrome 연결 (Side Panel 확장) |
| | `/setup-browser-cookies` | 인증 페이지 QA용 쿠키 임포트 |
| | `/setup-deploy` | 배포 설정 구성 |
| | `/gstack-upgrade` | gstack 최신 버전 업그레이드 |

### gstack 트러블슈팅

gstack 스킬이 작동하지 않으면:
```bash
cd ~/.claude/skills/gstack && ./setup
```

---

## 하네스 구조

```
.agent/
  skills/
    beeliber_master/       # 브랜드·서비스·가격 Master (최우선 참조)
    beeliber_architecture/  # 기술 아키텍처 + Hyper-Gap 로드맵
    beeliber_core/          # DDD 개발 원칙 + 협업 프로토콜
    beeliber_design/        # 비주얼 아이덴티티 + UX 가이드
    beeliber_security/      # CISO 보안 가드레일 (5대 원칙)
    beeliber_supabase/      # Supabase 전환 마스터 플랜
    beeliber_seo/           # 다국어 SEO 전략 (zh-TW 우선)
    beeliber_payments/      # Toss Payments 실배포 가이드
    beeliber_pricing/       # 가격 정책 + 계산 로직 기준
    beeliber_stitch_qa/     # Stitch UI/UX 수정 후 전 직원 QA 프로토콜
    beeliber_ui_map/        # 전체 사용자 화면 구조 + 화면별 연동 포인트 맵
    beeliber_operations/    # Layer 3 운영 하네스 (상태머신·SLA·기사배정·이슈)
    beeliber_ai_harness/    # Layer 4 AI 하네스 (생성·검사·승인·배포 통제)
    beeliber_eval/          # Layer 6 성과 측정 (KPI·실패분석·회고)
    agent_planner/          # 기획이 — Layer 0 제품 전략 + 아키텍처
    agent_brand/            # 브랜드이 — Layer 1 브랜드 가디언
    agent_commerce/         # 상거래이 — Layer 2 결제/가격 엔진
    agent_ops/              # 운영이 — Layer 3 운영 총괄
    agent_security/         # 보안이 — Layer 4 보안 + AI 통제
    agent_eval/             # 평가이 — Layer 5+6 KPI + 대시보드
    agent_shipper/          # 배포이 — Layer 7 배포 게이트키퍼
  rules/
    brand_guide_v2.md       # 브랜드 가이드 v4 최우선 적용 규칙
    blueprint.md            # 설계/기획 모드 트리거
    reflector.md            # 구현 모드 트리거
    fix.md                  # 버그 수정 모드 트리거
    uipolish.md             # UI 다듬기 모드 트리거
    doc.md                  # 문서 작성 모드 트리거
    bug_fix.md              # 버그 수정 상세 절차
    safe_refactor.md        # 안전 리팩토링 절차
    ui_patch.md             # UI 패치 상세 절차
  workflows/
    screenshot-to-code.md   # 스샷 → 코드 자동 반영 워크플로우
~/.claude/skills/
    gstack/                 # gstack 원본 (31개 스킬)
    gstack-ko/              # gstack 한국어 참조 문서
```

## 스킬 참조 우선순위

작업 시작 전 항상 아래 순서로 참조하세요:

1. `beeliber_master` — 브랜드 금지어, 가격표, 서비스 구조
2. `beeliber_security` + `/cso` — 보안 가드레일 (코드 작성 전 필수)
3. `beeliber_design` — 컬러, 폰트, UX 원칙 (UI 작업 시)
4. `beeliber_core` + `/plan-eng-review` — 아키텍처 원칙, 설계 검증
5. 도메인별: `beeliber_supabase` / `beeliber_seo` / `beeliber_payments` / `beeliber_pricing`

## 핵심 금지사항 (beeliber_master 요약)

절대 사용 금지 단어: **저렴한, 싼, 할인, 힘들다, 무겁다, 택배, 물류, AI기반솔루션, 호텔픽업, 공항→호텔배송**

추가 금지 (v4): **24시간 이용 가능, Instagram 콘텐츠 작성 (현재 중단), Phase 2 미래 서비스 언급, 거점 수 1위 표현, 보험 완전·무한정 보상**

채널 현황: 샤오홍슈·Threads·X 이용 중 / Instagram 중단 / 샤오홍슈 본문 마지막 `🐝 bee-liber.com` 필수

## 하네스 엔지니어링 8-Layer 구조

> 원문: `docs/beeliber_harness_engineering_v1.md`

기존 6-Layer에 gstack의 기획·배포 레이어를 추가하여 8-Layer로 고도화.

| Layer | 이름 | 담당 | 핵심 |
|-------|------|------|------|
| **0** | Planning | `/office-hours` `/plan-ceo-review` `/plan-eng-review` `/autoplan` | 제품 방향, 아키텍처 설계, 자동 리뷰 파이프라인 |
| **1** | Brand | `beeliber_master` + `/design-review` | 금지어, 서비스 범위, 브랜드 톤, 비주얼 QA |
| **2** | Commerce | `beeliber_pricing` + `beeliber_payments` + `/review` | 예약 검증, 가격, 결제, 환불, PR 코드 리뷰 |
| **3** | Operations | `beeliber_operations` + `/qa` `/browse` | 상태머신, SLA, 기사배정, QA 테스팅 |
| **4** | AI & Security | `beeliber_ai_harness` + `/cso` `/guard` | AI 통제, OWASP 감사, 안전 가드레일 |
| **5** | Admin | `beeliber_ui_map` + `beeliber_stitch_qa` + `/freeze` | 검토함, 운영보드, 편집 범위 제한 |
| **6** | Eval | `beeliber_eval` + `/retro` `/benchmark` | KPI, 회고, 성능 회귀 감지 |
| **7** | Ship | `/ship` `/land-and-deploy` `/canary` `/document-release` | PR→배포→모니터링→문서 갱신 자동화 |

### 추천 워크플로우

**기능 개발 전체 사이클:**
```
/office-hours → /plan-ceo-review → /plan-eng-review → 구현
  → [비평이 + 검수이-코드 + 검수이-UX + 검수이-비즈 병렬 검수]
  → /review → /qa → /ship → /land-and-deploy → /canary → /retro
```

**버그 수정:**
```
/investigate → 수정
  → [비평이 + 검수이-코드 병렬 검수]
  → /review → /qa → /ship
```

**UI 작업:**
```
/design-consultation → /design-shotgun → /design-html → /design-review
  → [비평이 + 검수이-UX + 검수이-비즈 병렬 검수]
  → /qa → /ship
```

**보안 감사:**
```
/cso → [비평이 + 검수이-코드 병렬 검수] → /review → /careful 모드에서 수정
```

**리팩토링:**
```
/investigate → 리팩이 Phase 1(충격 분석) → Phase 2~3(실행·검증)
  → [비평이 + 검수이-코드 병렬 검수]
  → /review → /qa → /ship
```

**예약·결제 오류 점검:**
```
감시이 Step 1(로그 조회) → Step 2(심각도 판정) → 🔴 상거래이/보안이 에스컬레이션
  → /investigate → hotfix
  → [비평이 + 검수이-코드 + 검수이-비즈 병렬 검수]
  → /ship
```

## 개발 로드맵

| 차수 | 핵심 작업 |
|------|---------|
| **1차** | 테이블 구축 + validate API + 상태머신 + 예약 검토함 |
| **2차** | 결제 연동 + 운영 상태 + 증빙 + 이슈센터 + 알림 |
| **3차** | 실시간 운영보드 + SLA + 감사로그 + 규칙관리 |
| **4차** | AI 흐름 + AI 검수함 + KPI 대시보드 |
| **5차** | 재배차 추천 + ETA 예측 + 이상탐지 |

## 완료 이력

`DONE.md` — 해결된 버그·작업 목록. **세션 시작 시 먼저 확인하고, 이미 완료된 이슈는 재조사하지 말 것.**

## 현재 진행 중인 주요 이니셔티브

| 우선순위 | 이니셔티브 | 상태 | 참조 문서 |
|---|---|---|---|
| 1 | Supabase 마이그레이션 | Phase 0 진단 중 | `beeliber_supabase` |
| 2 | 다국어 SEO 개선 | 사이트맵·JSON-LD·canonical 완료 / 콘텐츠·hreflang 보강 대기 | `beeliber_seo` |
| 3 | Toss Payments 실배포 | 코드 준비 완료, 환경변수 대기 | `beeliber_payments` |
| 4 | 랜딩페이지 리뉴얼 | 진행 중 | `beeliber_design` |

## 빌드 & 배포

```bash
npm run build     # 빌드 검증 (작업 완료 후 필수)
firebase deploy   # 전체 배포
```

---

## 데이터베이스 구조 (Supabase PostgreSQL — 2026-04-15 기준)

**프로덕션 프로젝트 ID:** `xpnfjolqiffduedwtxey` | **리전:** `ap-southeast-1` | **총 테이블:** 57개
**⚠️ MCP 연결 프로젝트 ID:** `fzvfyeskdivulazjjpgr` (프로덕션과 다름 — MCP Supabase 명령은 실제 DB가 아닐 수 있음. 실제 DB 변경은 `supabase db push --linked` 필수. DONE.md 2026-04-13 참조)

> **연동 주의사항**
> - `booking_details`와 `reservations`는 별개 테이블. `booking_details.reservation_id → reservations.id` (nullable FK)
> - `kiosk_storage_log`의 PK는 `bigint` (UUID 아님). `branch_id`는 `text` 타입 (UUID 아님)
> - `settlement_status` CHECK 제약: `PENDING|CONFIRMED|PAID_OUT|MONTHLY_INCLUDED|ON_HOLD|CANCELLED|REFUNDED|DELETED` — 소문자·한국어 불허
> - `expenditures` 테이블의 실제 컬럼: `receipt_url`, `approved_by`, `notes`, `updated_at` 존재 (타입 코드와 다를 수 있음)
> - `employees.profile_id → profiles.id` (UNIQUE FK) — 직원 조회 시 profiles 조인 필수
> - `locations.branch_id → branches.id` (nullable) — 일부 지점은 branch_id 없음

### 도메인별 테이블 구조

#### 예약 · 주문

| 테이블 | PK 타입 | 핵심 컬럼 | 비고 |
|--------|---------|-----------|------|
| `reservations` | uuid | `reservation_no`(UNIQUE), `customer_id`, `branch_id`, `service_id`, `status`, `ops_status`, `total_amount` | 새 예약 체계의 루트 |
| `booking_details` | uuid | `reservation_id`(nullable), `service_type`, `pickup_date`, `pickup_location`, `dropoff_location`, `final_price`, `settlement_status`, `payment_method`, `bags`, `user_name`, `user_email` | 레거시 예약 + 정산 상태 |
| `reservation_items` | uuid | `reservation_id`, `baggage_type_id`, `quantity`, `subtotal` | 예약 품목 상세 |
| `payments` | uuid | `reservation_id`, `provider`, `payment_key`, `status`, `amount`, `paid_at` | 결제 기록 |
| `delivery_assignments` | uuid | `reservation_id`, `driver_name`, `driver_phone`, `assigned_at`, `delivered_at` | 기사 배정 |
| `proof_assets` | uuid | `reservation_id`, `asset_type`, `asset_url`, `verification_status` | 증빙 사진 |
| `issue_tickets` | uuid | `reservation_id`, `issue_code`, `severity`, `status`, `title` | 이슈 센터 |

#### 정산

| 테이블 | PK 타입 | 핵심 컬럼 | 비고 |
|--------|---------|-----------|------|
| `booking_details.settlement_status` | — | `PENDING→CONFIRMED→PAID_OUT` | 예약별 정산 상태 |
| `branch_payouts` | uuid | `branch_id`, `period_start`, `period_end`, `gross_amount`, `net_amount`, `status`, `payment_date` | 지점 지급 기록 |
| `monthly_closings` | uuid | `month`(UNIQUE date), `total_revenue`, `confirmed_amount`, `is_closed`, `closed_by` | 월별 마감 |
| `daily_closings` | uuid | `branch_id`, `date`, `total_revenue`, `actual_cash_on_hand`, `difference`, `closed_by` | 일마감 |
| `bank_transactions` | uuid | `date`, `bank_name`, `account_alias`, `tx_type`(deposit/withdrawal), `amount`, `balance`, `description` | 통장 잔고 수동 입력 |
| `expenditures` | uuid | `branch_id`, `date`, `category`, `amount`, `description`, `receipt_url`, `approved_by` | 지출 내역 |

#### 키오스크

| 테이블 | PK 타입 | 핵심 컬럼 | 비고 |
|--------|---------|-----------|------|
| `kiosk_branches` | uuid | `slug`(UNIQUE text), `branch_id`(text), `branch_name`, `is_active` | 키오스크 지점 매핑 |
| `kiosk_storage_log` | **bigint** | `branch_id`(text), `date`, `tag`, `original_price`, `discount`, `payment`, `done`, `commission_rate` | 키오스크 거래 로그 |
| `kiosk_settings` | text(key) | `key`, `value`(jsonb), `updated_at` | 키오스크 설정 |
| `luggage_storage_log` | **bigint** | `date`, `tag`, `original_price`, `payment`, `done` | 레거시 보관 로그 |

#### 지점 · 지역

| 테이블 | PK 타입 | 핵심 컬럼 | 비고 |
|--------|---------|-----------|------|
| `branches` | uuid | `branch_code`, `name`, `branch_type`, `status`, `lat`, `lng`, `is_active`, `open_time`, `close_time` | 지점 마스터 |
| `branch_types` | uuid | `code`(UNIQUE), `name` | 지점 유형 |
| `locations` | uuid | `short_code`, `name`, `name_en/ja/zh/zh_tw`, `type`, `supports_delivery`, `supports_storage`, `branch_id`, `lat`, `lng`, `is_active` | 서비스 지역 |
| `location_translations` | uuid | `location_id`, `lang`, `name`, `description`, `address` | 지역 다국어 |
| `branch_prospects` | uuid | `name`, `status`, `potential_score`, `partnership_inquiry_id` | 지점 유치 후보 |
| `service_rules` | uuid | `branch_id`, `service_id`, `baggage_type_id`, `allowed`, `requires_manual_review`, `phase_code` | 서비스 허용 규칙 |

#### 고객 · 인증

| 테이블 | PK 타입 | 핵심 컬럼 | 비고 |
|--------|---------|-----------|------|
| `customers` | uuid | `full_name`, `language_code`, `phone`, `email`, `nationality` | 고객 마스터 |
| `profiles` | uuid | `email`, `display_name` (Supabase Auth 연동) | Auth 프로필 |
| `credit_accounts` | uuid | `user_id`(UNIQUE→customers), `balance`, `monthly_allowance`, `used_this_month`, `reset_date` | 크레딧 잔액 |
| `user_coupons` | uuid | `user_id`, `discount_code_id`, `used_at`, `used_for_reservation` | 쿠폰 사용 |
| `discount_codes` | uuid | `code`(UNIQUE), `amount_per_bag`, `is_active`, `allowed_service` | 할인 코드 |

#### 직원 · 권한

| 테이블 | PK 타입 | 핵심 컬럼 | 비고 |
|--------|---------|-----------|------|
| `employees` | uuid | `profile_id`(UNIQUE→profiles), `name`, `email`, `login_id`, `employment_status`, `security`(jsonb), `job_title` | 직원 마스터 |
| `employee_branch_assignments` | uuid | `employee_id`, `branch_id`, `assignment_type`, `is_primary`, `starts_on`, `ends_on` | 지점 배속 |
| `employee_roles` | uuid | `employee_id`, `role_id` | 역할 배정 |
| `roles` | uuid | `code`(UNIQUE), `name`, `is_system` | 역할 정의 |

#### AI · CMS

| 테이블 | PK 타입 | 핵심 컬럼 | 비고 |
|--------|---------|-----------|------|
| `ai_outputs` | uuid | `use_case`, `entity_id`, `generated_content`(jsonb), `status`, `reviewer_id` | AI 생성 콘텐츠 |
| `ai_review_logs` | uuid | `ai_output_id`, `check_type`, `passed`, `flags`(jsonb) | AI 검수 로그 |
| `cms_contents` | uuid | `slug`, `title_ko/en/ja/zh`, `body_ko/en/ja/zh`, `content_type`, `publish_status`, `fts_ko/fts_en` | 콘텐츠 CMS |
| `cms_areas` | uuid | `area_slug`(UNIQUE), `area_name_ko/en`, `is_priority_area` | 지역 CMS |
| `cms_themes` | uuid | `theme_slug`(UNIQUE), `theme_name_ko/en`, `is_active` | 테마 CMS |
| `content_translations` | uuid | `content_id`, `content_type`, `field_name`, `language`, `value`, `is_machine_translated` | 콘텐츠 번역 |

#### 운영 · 알림 · 감사

| 테이블 | PK 타입 | 핵심 컬럼 | 비고 |
|--------|---------|-----------|------|
| `notifications` | uuid | `reservation_id`, `channel`, `template_code`, `recipient`, `status`, `sent_at` | 알림 (활성) |
| `notifications_archive` | uuid | 동일 | 알림 아카이브 |
| `audit_logs` | uuid | `entity_type`, `entity_id`, `action`, `actor`, `before_data`/`after_data`(jsonb) | 감사 로그 |
| `operation_status_logs` | uuid | `reservation_id`, `from_status`, `to_status`, `changed_by` | 상태 변경 로그 |
| `system_notices` | uuid | `title`, `category`, `is_active`, `start_date`, `end_date` | 시스템 공지 |

#### 기타

| 테이블 | PK 타입 | 핵심 컬럼 | 비고 |
|--------|---------|-----------|------|
| `storage_tiers` | uuid | `tier_code`(UNIQUE), `price_hand_bag`, `price_carrier`, `price_stroller_bicycle` | 보관 가격 티어 |
| `baggage_types` | uuid | `code`(UNIQUE), `name`, `requires_manual_review` | 짐 종류 |
| `services` | uuid | `code`(UNIQUE), `name`, `is_active` | 서비스 종류 |
| `chat_sessions` | uuid | `session_id`(UNIQUE text), `user_name`, `user_email`, `is_bot_disabled` | 채팅 세션 |
| `chat_messages` | uuid | `session_id`→chat_sessions, `role`, `content` | 채팅 메시지 |
| `google_reviews` | uuid | `place_id`, `rating`, `text`, `is_featured`, `is_visible` | 구글 리뷰 |
| `google_review_summary` | uuid | `place_id`(UNIQUE), `total_reviews`, `average_rating`, `last_synced_at` | 리뷰 요약 |
| `legal_documents` | uuid | `doc_type`, `language`, `content`, `articles`(jsonb) | 약관·개인정보 |
| `partnership_inquiries` | uuid | `company_name`, `status`, `assigned_admin_id` | 파트너십 문의 |
| `app_settings` | uuid | `key`(UNIQUE text), `value`(jsonb) | 앱 전역 설정 |

### Edge Functions (정산 자동화)

| 함수명 | 트리거 | 역할 |
|--------|--------|------|
| `daily-settlement-summary` | pg_cron 매일 02:00 KST | 전일 예약 집계 → `daily_closings` 갱신 |
| `monthly-settlement-export` | 관리자 수동 호출 | 월별 정산 데이터 집계·내보내기 |
| `admin-account-sync` | 관리자 액션 | 직원 계정 동기화 |
| `ai-content-gen` | AI 생성 요청 | CMS 콘텐츠 AI 생성 |

### 주요 FK 관계 요약

```
customers ──< reservations ──< reservation_items
                    │
                    ├──< booking_details (settlement_status)
                    ├──< payments
                    ├──< delivery_assignments
                    ├──< proof_assets
                    ├──< issue_tickets
                    ├──< notifications
                    └──< operation_status_logs

branches ──< locations
         ──< employee_branch_assignments ──< employees ──< employee_roles ──< roles
         ──< branch_payouts
         ──< expenditures
         ──< daily_closings

kiosk_branches  (branch_id: text, slug: text — UUID 아님 주의)
kiosk_storage_log (PK: bigint, branch_id: text — UUID 아님 주의)
bank_transactions (독립, FK 없음)
```

---

## 중요 파일 위치

- 예약 로직: `client/src/domains/booking/`
- 가격 계산: `client/utils/pricing.ts` + `client/src/domains/booking/deliveryStoragePricing.ts`
- 랜딩 컴포넌트: `client/components/landing/`
- 관리자 대시보드: `client/components/AdminDashboard.tsx`
- 번역 파일: `client/translations_split/`
- SEO 컴포넌트: `client/components/SEO.tsx`
- Supabase Edge Functions: `supabase/functions/`

## 컨텍스트 효율화 규칙

1. **세션 시작 시** `DONE.md`를 읽고 완료된 이슈 목록을 파악할 것
2. 버그 조사 전 `DONE.md`에서 해당 파일·이슈가 이미 해결됐는지 확인할 것
3. 완료된 이슈는 재조사·재독 없이 `DONE.md`의 핵심 메모를 직접 인용할 것
4. 새 작업 완료 시 `DONE.md`에 항목 추가할 것

## Skill routing

When the user's request matches an available skill, ALWAYS invoke it using the Skill
tool as your FIRST action. Do NOT answer directly, do NOT use other tools first.
The skill has specialized workflows that produce better results than ad-hoc answers.

Key routing rules:
- Product ideas, "is this worth building", brainstorming → invoke office-hours
- Bugs, errors, "why is this broken", 500 errors → invoke investigate
- Ship, deploy, push, create PR → invoke ship
- QA, test the site, find bugs → invoke qa
- Code review, check my diff → invoke review
- Update docs after shipping → invoke document-release
- Weekly retro → invoke retro
- Design system, brand → invoke design-consultation
- Visual audit, design polish → invoke design-review
- Architecture review → invoke plan-eng-review

## Agent routing (서브 에이전트)

복합 작업 시 Agent tool로 서브 에이전트를 호출하여 전문 영역 위임:

| 에이전트 | Layer | 트리거 |
|---|---|---|
| **기획이** (agent_planner) | 0 | 새 기능 기획, 아키텍처 설계, 제품 방향 |
| **브랜드이** (agent_brand) | 1 | UI 텍스트, 콘텐츠, 번역, 브랜드 검수 |
| **상거래이** (agent_commerce) | 2 | 가격, 결제, 환불, 예약 검증 |
| **운영이** (agent_ops) | 3 | 상태머신, SLA, 기사배정, QA |
| **보안이** (agent_security) | 4 | 인증/권한, RLS, 보안 감사, AI 검수 |
| **평가이** (agent_eval) | 5+6 | KPI, 대시보드, 벤치마크, 회고 |
| **리팩이** (agent_refactor) | 2.5 | 페이지·컴포넌트 리팩토링, 충격 분석, 기능 동일성 검증 |
| **감시이** (agent-sentinel) | 2.5 | 예약·결제 오류 감시, 로그 분석, 심각도별 에스컬레이션 |
| **배포이** (agent_shipper) | 7 | 배포, PR, 카나리, 문서 갱신 |
| **디비이** (agent_dbi) | DB | 스키마 설계, 마이그레이션, RLS 정합성, 데이터 검수 |
| **슈파이** (agent_supa) | DB | RLS 정책 설계, Edge Functions, Auth, Storage 버킷 |
| **비평이** (agent_critic) | X | 모든 작업 완료 후 전방위 냉정 비평. BLOCKING 발견 시 배포 차단 |
| **검수이-코드** (agent_inspector_code) | X | 코드 변경 포함 작업 후 타입·에러처리·성능·보안 검수 |
| **검수이-UX** (agent_inspector_ux) | X | UI 변경 포함 작업 후 다국어·접근성·모바일·상태 UI 검수 |
| **검수이-비즈** (agent_inspector_biz) | X | 비즈 로직 포함 작업 후 가격정책·브랜드규칙·상태머신 검수 |

배포 전 필수 게이트: **비평이 PASS + 검수이-코드 PASS + 검수이-UX PASS + 검수이-비즈 PASS** + 보안이 PASS + 평가이 Performance OK

> **검수 4인방 병렬 호출 규칙**: 구현 완료 후 `/review` 또는 `/ship` 직전에
> 비평이·검수이-코드·검수이-UX·검수이-비즈를 Agent tool로 **동시 4개** 호출.
> 코드 변경 없는 문서·기획 작업은 비평이 + 검수이-비즈만 호출.

---

## MCP 서버 연동 (외부 서비스)

| MCP | 서버명 | 용도 | 상태 |
|-----|--------|------|------|
| **Slack** | `slack` | 배포/장애/리뷰 알림 전송·조회 | ⚠️ Bot Token 설정 필요 |
| **Google Drive** | `gdrive` | PRD, 브랜드가이드, 기획문서 참조 | ⚠️ OAuth 확인 필요 |
| **GitHub** | `github` | 이슈/PR 티켓 상태 관리 | ✅ 설정됨 |
| **GA4 Analytics** | `analytics` | 예약·전환 수치 확인 | ⚠️ Property ID 설정 필요 |

설정 가이드: `docs/MCP_SETUP_GUIDE.md`

### MCP 활용 규칙

- **배포 후**: Slack `#deploy` 채널에 자동 알림 (`mcp__slack__*`)
- **기획 작업 전**: Drive에서 PRD·브랜드가이드 최신본 확인
- **이슈 수정 시**: GitHub 이슈 상태 업데이트 (`mcp__github__*`)
- **주간 회고**: GA4에서 전주 예약 전환율 조회 후 `/retro`에 포함
