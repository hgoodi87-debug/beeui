# Beeliber Database ERD (Entity Relationship Diagram)
> 2026-03-31 기준 | Supabase `xpnfjolqiffduedwtxey` (ap-northeast-1) | 49 테이블 + 9 뷰 | RLS 전체 활성화
> 상세 구조: `docs/DATABASE_STRUCTURE_MAP.md` 참조

---

## 전체 구조 시각화

```
                         ┌─────────────────────────────────────────┐
                         │        AUTH / 조직 레이어 (Phase 0)       │
                         │          실데이터 운영 중                  │
                         └─────────────────────────────────────────┘

   ┌──────────┐     ┌───────────────┐     ┌──────────┐     ┌──────────────────────────┐
   │ profiles │────▶│   employees   │◀────│  roles   │     │ employee_branch_          │
   │  (53)    │  1:1│    (53)       │  M:N│   (8)    │     │ assignments (53)          │
   │          │     │               │     │          │     │                           │
   │ id = PK  │     │ profile_id FK │     │ id = PK  │     │ employee_id FK ──▶ employees│
   │ (auth.uid)     │ name          │     │ code     │     │ branch_id FK ──▶ branches  │
   │ email    │     │ email         │     │ name     │     │ assignment_type            │
   │ display_ │     │ login_id      │     │ is_system│     │ is_primary                │
   │  name    │     │ job_title     │     └──────────┘     └──────────────────────────┘
   │ locale   │     │ org_type      │          │
   └──────────┘     │ employment_   │     ┌──────────────┐
                    │  status       │     │ employee_    │
                    └───────────────┘     │ roles (54)   │
                                          │              │
                                          │ employee_id  │
                                          │ role_id      │
                                          │ is_primary   │
                                          └──────────────┘

─────────────────────────────────────────────────────────────────────────────────

                     ┌─────────────────────────────────────────┐
                     │       마스터 데이터 레이어 (Harness v1)    │
                     │           규칙 기반 운영 제어              │
                     └─────────────────────────────────────────┘

   ┌──────────────┐       ┌──────────────┐       ┌──────────────┐
   │ branch_types │       │   services   │       │ baggage_types│
   │     (3)      │       │     (2)      │       │     (4)      │
   │              │       │              │       │              │
   │ HUB          │       │ STORAGE      │       │ SHOPPING_BAG │
   │ PARTNER      │       │ HUB_TO_      │       │ CARRY_ON     │
   │ HQ           │       │  AIRPORT     │       │ SUITCASE     │
   └──────┬───────┘       └──────┬───────┘       │ SPECIAL (수동)│
          │                      │               └──────┬───────┘
          │    ┌─────────────────┼──────────────────────┘
          │    │                 │
          ▼    ▼                 ▼
   ┌──────────────────────────────────┐       ┌───────────────────────┐
   │        service_rules (24)        │       │     branches (42)     │
   │                                  │       │                       │
   │  branch_type_id FK ─▶ branch_   │       │  branch_code (unique) │
   │                         types    │──────▶│  name                 │
   │  branch_id FK ─▶ branches       │       │  branch_type (text)   │
   │  service_id FK ─▶ services      │       │  branch_type_id FK    │
   │  baggage_type_id FK ─▶ baggage_ │       │  address / lat / lng  │
   │                         types    │       │  open_time / close_   │
   │  allowed (bool)                  │       │   time                │
   │  requires_manual_review          │       │  is_active            │
   │  phase_code (PHASE_1)            │       │  metadata (jsonb)     │
   │  reject_message_ko / _en         │       └───────────────────────┘
   │  priority                        │
   └──────────────────────────────────┘

─────────────────────────────────────────────────────────────────────────────────

                     ┌─────────────────────────────────────────┐
                     │     커머스 레이어 (예약 · 결제 · 짐)       │
                     │     ★ reservations = 중심 테이블 ★        │
                     └─────────────────────────────────────────┘

   ┌──────────────┐                                    ┌──────────────┐
   │  customers   │                                    │  payments    │
   │     (0)      │                                    │     (0)      │
   │              │                                    │              │
   │ id = PK      │    ┌────────────────────────┐      │ reservation_ │
   │ (= auth.uid) │───▶│    reservations (0)    │◀─────│  id FK       │
   │ full_name    │    │                        │      │ provider     │
   │ language_code│    │  reservation_no (uniq)  │      │ payment_key  │
   │ email        │    │  customer_id FK         │      │ status ───── │─ pending
   │ phone        │    │  branch_id FK ──▶ branches     │              │  paid
   └──────────────┘    │  service_id FK ──▶ services    │ amount       │  failed
                       │  scheduled_at          │      │ paid_at      │  refunded
                       │                        │      └──────────────┘
                       │  status ────────────── │─ lead_created
                       │                        │  validation_passed
                       │  ops_status ────────── │─ pickup_ready
                       │                        │  ... → completed
                       │  issue_status ──────── │─ issue_open
                       │                        │  ... → issue_closed
                       │  risk_level (low/med/hi)│
                       │  approval_mode          │
                       │  total_amount           │
                       └────────────┬───────────┘
                                    │
                       ┌────────────┴───────────┐
                       ▼                        ▼
              ┌──────────────────┐    (아래 운영 레이어로 연결)
              │reservation_items │
              │      (0)         │
              │                  │
              │ reservation_id FK│
              │ baggage_type_id  │
              │  FK ──▶ baggage_ │
              │          types   │
              │ quantity         │
              │ requires_manual_ │
              │  review          │
              └──────────────────┘

─────────────────────────────────────────────────────────────────────────────────

                     ┌─────────────────────────────────────────┐
                     │         운영 레이어 (배송 · 증빙 · 이슈)    │
                     │       모두 reservations.id 참조           │
                     └─────────────────────────────────────────┘

            reservations
                 │
     ┌───────────┼───────────┬──────────────┬──────────────┐
     ▼           ▼           ▼              ▼              ▼
┌──────────┐┌──────────┐┌──────────────┐┌──────────┐┌──────────────┐
│ delivery_││ proof_   ││ operation_   ││ issue_   ││notifications │
│ assign-  ││ assets   ││ status_logs  ││ tickets  ││    (0)       │
│ ments(0) ││   (0)    ││    (0)       ││   (0)    ││              │
│          ││          ││              ││          ││ channel:     │
│ driver_  ││ asset_   ││ from_status  ││ issue_   ││  kakao/sms/  │
│  name    ││  type:   ││ to_status    ││  code    ││  email/slack │
│ driver_  ││  pickup_ ││ changed_by   ││ severity:││ template_code│
│  phone   ││  photo / ││ reason       ││  low/med/││ recipient    │
│ eta      ││  handover││              ││  high/   ││ status:      │
│ sla_due_ ││  _photo /││              ││  critical││  queued/sent/│
│  at      ││  receipt ││              ││ status:  ││  failed      │
│ status:  ││          ││              ││  open →  ││              │
│ unassign-││ file_url ││              ││  closed  ││              │
│ ed →     ││ uploaded_││              ││ assigned_││              │
│ handover ││  by      ││              ││  to      ││              │
│ _done    ││          ││              ││ title    ││              │
└──────────┘└──────────┘└──────────────┘└──────────┘└──────────────┘

─────────────────────────────────────────────────────────────────────────────────

                     ┌─────────────────────────────────────────┐
                     │           AI 레이어 (생성 · 검수)          │
                     └─────────────────────────────────────────┘

              ┌──────────────────────────┐
              │     ai_outputs (0)       │
              │                          │
              │  use_case (ad_copy,      │     ┌──────────────────┐
              │   sns_post, cs_reply...) │     │ ai_review_logs   │
              │  input_context (jsonb)   │────▶│      (0)         │
              │  generated_text          │     │                  │
              │  risk_score              │     │ ai_output_id FK  │
              │  policy_passed           │     │ check_type       │
              │  approval_status ─────── │     │ result:          │
              │   review_pending         │     │  pass/fail/      │
              │   approved               │     │  warning         │
              │   rejected               │     │ detail           │
              │   published              │     └──────────────────┘
              │  reviewer_id             │
              │  published_at            │
              └──────────────────────────┘

─────────────────────────────────────────────────────────────────────────────────

                     ┌─────────────────────────────────────────┐
                     │          감사 로그 (전체 추적)              │
                     └─────────────────────────────────────────┘

              ┌──────────────────────────┐
              │    audit_logs (0)        │
              │                          │
              │  entity_type (어떤 테이블) │
              │  entity_id (어떤 레코드)   │
              │  action (create/update/  │
              │          delete/approve) │
              │  actor (누가)             │
              │  before_data (jsonb)     │
              │  after_data (jsonb)      │
              └──────────────────────────┘
```

---

## FK 관계 요약 (22개 Foreign Key)

```
branches.branch_type_id ─────────────────▶ branch_types.id
employees.profile_id ────────────────────▶ profiles.id
employee_roles.employee_id ──────────────▶ employees.id
employee_roles.role_id ──────────────────▶ roles.id
employee_branch_assignments.employee_id ─▶ employees.id
employee_branch_assignments.branch_id ───▶ branches.id
service_rules.branch_id ─────────────────▶ branches.id
service_rules.branch_type_id ────────────▶ branch_types.id
service_rules.service_id ────────────────▶ services.id
service_rules.baggage_type_id ───────────▶ baggage_types.id
reservations.customer_id ────────────────▶ customers.id
reservations.branch_id ──────────────────▶ branches.id
reservations.service_id ─────────────────▶ services.id
reservation_items.reservation_id ────────▶ reservations.id
reservation_items.baggage_type_id ───────▶ baggage_types.id
payments.reservation_id ─────────────────▶ reservations.id
delivery_assignments.reservation_id ─────▶ reservations.id
proof_assets.reservation_id ─────────────▶ reservations.id
issue_tickets.reservation_id ────────────▶ reservations.id
operation_status_logs.reservation_id ────▶ reservations.id
notifications.reservation_id ────────────▶ reservations.id
ai_review_logs.ai_output_id ─────────────▶ ai_outputs.id
```

---

## 테이블별 데이터 현황

| 레이어 | 테이블 | 행 수 | RLS | 상태 |
|--------|--------|------:|:---:|------|
| **Auth/Org** | profiles | 53 | ON | 운영 중 |
| | employees | 53 | ON | 운영 중 |
| | roles | 8 | ON | 운영 중 |
| | employee_roles | 54 | ON | 운영 중 |
| | employee_branch_assignments | 53 | ON | 운영 중 |
| **마스터** | branch_types | 3 | ON | HUB/PARTNER/HQ |
| | branches | 42 | ON | 실데이터 운영 중 |
| | services | 2 | ON | STORAGE / HUB_TO_AIRPORT |
| | baggage_types | 4 | ON | 쇼핑백/기내용/대형/특수짐 |
| | service_rules | 24 | ON | Phase 1 baseline |
| **커머스** | customers | 0 | ON | 대기 |
| | reservations | 0 | ON | 대기 |
| | reservation_items | 0 | ON | 대기 |
| | payments | 0 | ON | 대기 |
| **운영** | delivery_assignments | 0 | ON | 대기 |
| | proof_assets | 0 | ON | 대기 |
| | operation_status_logs | 0 | ON | 대기 |
| | issue_tickets | 0 | ON | 대기 |
| **AI** | ai_outputs | 0 | ON | 대기 |
| | ai_review_logs | 0 | ON | 대기 |
| **인프라** | notifications | 0 | ON | 대기 |
| | audit_logs | 0 | ON | 대기 |

---

## 상태값 CHECK Constraints

### reservations.status
```
lead_created → validation_passed → manual_review_required → rejected
                                → payment_pending → payment_completed
                                → reservation_confirmed → cancelled
```

### reservations.ops_status
```
pickup_ready → pickup_completed → in_transit → arrived_at_destination
→ handover_pending → handover_completed → completed
```

### reservations.issue_status
```
issue_open → issue_in_progress → issue_waiting_customer
→ issue_waiting_internal → issue_resolved → issue_closed
```

### payments.status
`pending → paid → failed → refunded`

### delivery_assignments.status
`unassigned → assigned → arrived_pickup → picked_up → arrived_destination → handover_done → cancelled`

### issue_tickets.severity
`low → medium → high → critical`

### ai_outputs.approval_status
`review_pending → approved → rejected → published`

### ai_review_logs.result
`pass / fail / warning`

---

## RLS 권한 매트릭스

| 테이블 | customer | driver | ops_staff | finance | marketing | admin/ops_mgr |
|--------|:--------:|:------:|:---------:|:-------:|:---------:|:-------------:|
| customers | R (본인) | - | - | - | - | - |
| reservations | R (본인) | - | - | - | - | CRUD |
| reservation_items | R (본인) | - | - | - | - | CRUD |
| payments | R (본인) | - | - | CRUD | - | CRUD |
| proof_assets | R (본인) | CRUD | CRUD | - | - | CRUD |
| issue_tickets | R (본인) | - | CRUD | - | - | CRUD |
| operation_status_logs | - | - | CRUD | - | - | CRUD |
| ai_outputs | - | - | - | - | CRUD | CRUD |
| ai_review_logs | - | - | - | - | CRUD | CRUD |
| notifications | - | - | CRUD | - | CRUD | CRUD |
| audit_logs | - | - | - | - | - | CRUD |
