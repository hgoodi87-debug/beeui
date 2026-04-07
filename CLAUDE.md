# Beeliber Claude Code 하네스 설정 (v2026.04)

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

## 현재 진행 중인 주요 이니셔티브

| 우선순위 | 이니셔티브 | 상태 | 참조 문서 |
|---|---|---|---|
| 1 | Supabase 마이그레이션 | Phase 0 진단 중 | `beeliber_supabase` |
| 2 | 다국어 SEO 개선 | 전략 수립 완료, 구현 대기 | `beeliber_seo` |
| 3 | Toss Payments 실배포 | 코드 준비 완료, 환경변수 대기 | `beeliber_payments` |
| 4 | 랜딩페이지 리뉴얼 | 진행 중 | `beeliber_design` |

## 빌드 & 배포

```bash
npm run build     # 빌드 검증 (작업 완료 후 필수)
firebase deploy   # 전체 배포
```

## 중요 파일 위치

- 예약 로직: `client/src/domains/booking/`
- 가격 계산: `client/utils/pricing.ts` + `client/src/domains/booking/deliveryStoragePricing.ts`
- 랜딩 컴포넌트: `client/components/landing/`
- 관리자 대시보드: `client/components/AdminDashboard.tsx`
- 번역 파일: `client/translations_split/`
- SEO 컴포넌트: `client/components/SEO.tsx`
- Supabase Edge Functions: `supabase/functions/`

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
