# Beeliber Supabase Database — Harness Engineering Analysis

> **Project**: beeliber (`fzvfyeskdivulazjjpgr`) | **Region**: ap-northeast-1 | **Postgres**: 17.6.1
> **Generated**: 2026-03-29 | **Author**: Claude Code Harness

---

## 1. Overview

| Metric | Count |
|--------|-------|
| Tables (regular) | 39 |
| Archive tables | 6 |
| Views | 9 (6 existing + 3 admin views applied 2026-03-29) |
| Materialized Views | 5 |
| Custom Functions | 23 (+ map_admin_booking_status applied 2026-03-29) |
| Triggers | 9 |
| RLS Policies | 73 |
| Foreign Keys | 33 |
| Total rows (live) | ~429 |

---

## 2. 6-Layer Table Map

### Layer 1: Auth / Organization

| Table | Rows | Description | FK |
|-------|------|-------------|-----|
| `profiles` | 53 | auth.users 1:1 매핑, 이메일·표시명 | `id = auth.users.id` |
| `employees` | 53 | 직원 마스터 (1 auth = 1 profile = 1 employee) | `profile_id → profiles.id` |
| `roles` | 11 | 역할 정의 (super_admin ~ customer) | — |
| `employee_roles` | 54 | 직원-역할 다대다 (is_primary 유니크 제약) | `employee_id → employees`, `role_id → roles` |
| `employee_branch_assignments` | 53 | 직원-지점 배정 (기간·유형 포함) | `employee_id → employees`, `branch_id → branches` |
| `branches` | 42 | 지점 (정산·조직 단위) | `branch_type_id → branch_types` |
| `branch_types` | 3 | 지점 유형 (hub, partner 등) | — |

**Auth Chain**: `auth.users.id → profiles.id → employees.profile_id → employee_roles → roles`
**Branch Chain**: `employees → employee_branch_assignments → branches → branch_types`

### Layer 2: Commerce (예약·결제·가격)

| Table | Rows | Description | FK |
|-------|------|-------------|-----|
| `customers` | 0 | 고객 프로필 (`id = auth.uid()`) | — |
| `reservations` | 0 | 예약 마스터 (상태·ops_status·issue_status) | `customer_id → customers`, `branch_id → branches`, `service_id → services` |
| `reservation_items` | 0 | 예약 아이템 (수하물별) | `reservation_id → reservations`, `baggage_type_id → baggage_types` |
| `booking_details` | 0 | 예약 상세 (픽업·드롭오프·수수료·정산) | `reservation_id → reservations`, `pickup/dropoff_location_id → locations` |
| `payments` | 0 | 결제 내역 (Toss Payments 연동) | `reservation_id → reservations` |
| `services` | 2 | 서비스 유형 (delivery, storage) | — |
| `baggage_types` | 4 | 수하물 종류 | — |
| `service_rules` | 24 | 서비스-지점별 가격 규칙 | `service_id → services`, `branch_id → branches`, `branch_type_id → branch_types`, `baggage_type_id → baggage_types` |
| `storage_tiers` | 0 | 보관 단계별 요금 | — |
| `discount_codes` | 1 | 할인 코드 | — |
| `user_coupons` | 0 | 사용자 쿠폰 발급 내역 | `discount_code_id → discount_codes` |

**Booking Chain**: `customers → reservations → booking_details + reservation_items + payments`

### Layer 3: Operations (운영)

| Table | Rows | Description | FK |
|-------|------|-------------|-----|
| `delivery_assignments` | 0 | 기사 배정 | `reservation_id → reservations` |
| `proof_assets` | 0 | 증빙 사진/파일 | `reservation_id → reservations` |
| `operation_status_logs` | 0 | 운영 상태 변경 이력 | `reservation_id → reservations` |
| `issue_tickets` | 0 | 이슈 티켓 | `reservation_id → reservations` |
| `daily_closings` | 1 | 일마감 | `branch_id → branches` |
| `expenditures` | 29 | 지출 내역 | `branch_id → branches` |

### Layer 4: AI

| Table | Rows | Description | FK |
|-------|------|-------------|-----|
| `ai_outputs` | 0 | AI 생성물 (승인 전 대기) | — |
| `ai_review_logs` | 0 | AI 생성물 리뷰 이력 | `ai_output_id → ai_outputs` |

### Layer 5: Admin / CMS / Public

| Table | Rows | Description | FK |
|-------|------|-------------|-----|
| `locations` | 41 | 고객 대면 장소 (픽업·드롭오프) | `branch_id → branches` |
| `location_translations` | 0 | 장소 다국어 번역 | `location_id → locations` |
| `app_settings` | 4 | 앱 설정 (key-value) | — |
| `partnership_inquiries` | 0 | 파트너십 문의 | — |
| `branch_prospects` | 0 | 파트너 후보 | `partnership_inquiry_id → partnership_inquiries` |
| `system_notices` | 0 | 시스템 공지 | — |
| `chat_sessions` | 123 | 채팅 세션 | — |
| `chat_messages` | 5 | 채팅 메시지 | `session_id → chat_sessions` |
| `cms_areas` | 0 | CMS 지역 | — |
| `cms_themes` | 0 | CMS 테마 | — |
| `cms_contents` | 0 | CMS 콘텐츠 (다국어 FTS) | `area_slug → cms_areas` |
| `content_translations` | 0 | 범용 번역 테이블 | — |
| `legal_documents` | 0 | 법률 문서 | — |
| `google_reviews` | 5 | Google 리뷰 | — |
| `google_review_summary` | 1 | Google 리뷰 요약 | — |

### Layer 6: Infrastructure

| Table | Rows | Description | FK |
|-------|------|-------------|-----|
| `notifications` | 0 | 알림 | `reservation_id → reservations` |
| `audit_logs` | 0 | 감사 로그 | — |
| `audit_logs_archive` | 0 | 감사 로그 아카이브 | — |
| `archive_audit_logs` | 0 | 감사 로그 아카이브 (v2) | — |
| `notifications_archive` | 0 | 알림 아카이브 | — |
| `archive_notifications` | 0 | 알림 아카이브 (v2) | — |
| `operation_status_logs_archive` | 0 | 운영로그 아카이브 | — |
| `archive_operation_status_logs` | 0 | 운영로그 아카이브 (v2) | — |

---

## 3. Entity Relationship Diagram (Text)

```
┌─────────────┐     ┌──────────────┐     ┌────────────┐
│ auth.users  │────▶│   profiles   │────▶│  employees  │
└─────────────┘  1:1└──────────────┘  1:1└─────┬──────┘
                                           │       │
                              ┌────────────┘       └────────────┐
                              ▼                                  ▼
                     ┌─────────────────┐          ┌──────────────────────────┐
                     │ employee_roles  │          │ employee_branch_assignments│
                     └────────┬────────┘          └────────────┬─────────────┘
                              │                                 │
                              ▼                                 ▼
                     ┌────────────────┐              ┌──────────────┐
                     │     roles      │              │   branches   │◀── branch_types
                     └────────────────┘              └──────┬───────┘
                                                       │         │
                              ┌─────────────────────────┘         │
                              ▼                                   ▼
                     ┌────────────────┐              ┌──────────────┐
                     │   locations    │              │ service_rules │
                     └────────────────┘              └──────────────┘
                              │                            │    │
                              ▼                            ▼    ▼
┌──────────────┐     ┌────────────────┐    ┌──────────┐  ┌──────────────┐
│  customers   │────▶│  reservations  │◀───│ services │  │ baggage_types│
└──────────────┘     └───────┬────────┘    └──────────┘  └──────────────┘
                             │
           ┌─────────┬───────┼────────┬──────────┬──────────┐
           ▼         ▼       ▼        ▼          ▼          ▼
    booking_     reservation  payments  delivery_   proof_    issue_
    details      _items                assignments  assets    tickets
                                                      │
                                                      ▼
                                              operation_status_logs
                                              notifications
                                              audit_logs
```

---

## 4. RLS Policy Matrix

### Access Pattern Summary

| Access Level | Target Roles | Tables |
|---|---|---|
| **Public Read** | `anon`, `authenticated` | locations, services, baggage_types, branches, branch_types, service_rules, storage_tiers, discount_codes, app_settings, system_notices, legal_documents, cms_*, google_reviews, google_review_summary, content_translations, location_translations, user_coupons |
| **Public Insert** | `anon` | booking_details, partnership_inquiries, chat_sessions, chat_messages |
| **Customer (auth.uid)** | `authenticated` | own customers, reservations, booking_details (read via reservation), payments, delivery_assignments, proof_assets, notifications, issue_tickets |
| **HQ Only** | `super_admin`, `hq_admin` | profiles (manage), employees (insert), roles (manage), employee_roles (manage), employee_branch_assignments (manage), branches (manage) |
| **Finance** | `finance_staff` + above | payments, reservations (read), daily_closings, expenditures |
| **Ops** | `ops_manager`, `ops_staff` | reservations (branch-scoped), reservation_items, delivery_assignments, proof_assets, operation_status_logs, audit_logs |
| **Branch Manager** | `hub_manager`, `partner_manager` | reservations (own branch), delivery_assignments, issue_tickets (own branch), daily_closings, expenditures |
| **Marketing/Content** | `marketing_staff`, `content_editor` | cms_*, ai_outputs, ai_review_logs, discount_codes, google_reviews, notifications, location_translations, content_translations |
| **Driver** | `driver` | delivery_assignments, proof_assets |

### Key RLS Helper Functions

| Function | Purpose |
|---|---|
| `has_any_role(text[])` | 현재 사용자가 지정 역할 중 하나 이상 보유 확인 (employees + employee_roles + roles 조인) |
| `has_branch_access(uuid)` | super_admin/hq_admin/finance_staff이거나 해당 지점에 배정된 직원인지 확인 |
| `current_employee_id()` | 현재 auth.uid()의 employee.id 반환 |
| `current_profile_id()` | `auth.uid()` 래퍼 |
| `shares_branch_with_employee(uuid)` | 대상 직원과 같은 지점에 배정되었는지 확인 |
| `fn_can_manage_reservation(uuid)` | 해당 예약을 관리할 수 있는지 (HQ or branch-scoped) |
| `fn_can_edit_cms()` | CMS 편집 권한 확인 |

### RLS Architecture Note

> **Warning**: 현재 RLS는 모든 policy를 `{public}` 롤에 적용하고 `has_any_role()` 함수로 내부 분기합니다.
> 일부 테이블(branches, employee_*, profiles, roles)만 `{authenticated}` 롤을 사용합니다.
> 통합 방향: `{authenticated}` + `has_any_role()` 패턴으로 일원화 필요.

---

## 5. Views

### Regular Views (6)

| View | Purpose | Key Joins |
|---|---|---|
| `v_reservation_admin_list` | 관리자 예약 목록 (결제·배송·이슈 포함) | reservations + customers + branches + services + payments(LATERAL) + delivery(LATERAL) + issues(LATERAL) |
| `v_branch_daily_summary` | 지점별 일별 예약 요약 | reservations + branches |
| `v_branch_settlement_candidates` | 정산 대상 예약 목록 | reservations + branches + booking_details + payments(LATERAL) |
| `v_branch_settlement_summary` | 지점별 월간 정산 요약 | reservations + branches + booking_details |
| `v_branch_settlement_monthly` | 지점별 월간 정산 상세 | reservations + branches + booking_details |
| `v_cms_public_list` | 공개 CMS 콘텐츠 목록 | cms_contents (published only) |

### Materialized Views (5)

| MV | Purpose | Refresh |
|---|---|---|
| `mv_monthly_kpi` | 월간 KPI (예약수, 완료율, 매출, 고객수) | `fn_refresh_materialized_views()` |
| `mv_branch_performance` | 지점별 성과 | `fn_refresh_materialized_views()` |
| `mv_service_popularity` | 서비스별 인기도 | `fn_refresh_materialized_views()` |
| `mv_branch_monthly_report` | 지점 월간 리포트 | `fn_refresh_report_views()` |
| `mv_reservation_funnel` | 주간 예약 퍼널 | `fn_refresh_report_views()` |

---

## 6. Functions

### Business Logic Functions

| Function | Type | Description |
|---|---|---|
| `fn_confirm_reservation(uuid, uuid)` | SECURITY DEFINER | 예약 확인 (pending/pending_review → confirmed) + audit_log |
| `fn_cancel_reservation(uuid, text, uuid)` | SECURITY DEFINER | 예약 취소 + 사유 기록 + audit_log |
| `fn_update_ops_status(uuid, text, text, uuid)` | SECURITY DEFINER | 운영 상태 변경 + operation_status_logs + audit_log |
| `fn_assign_driver(uuid, text, text, timestamptz, uuid)` | SECURITY DEFINER | 기사 배정 → delivery_assignments + ops_status 갱신 |
| `fn_open_issue_ticket(uuid, text, text, text, text, uuid)` | SECURITY DEFINER | 이슈 티켓 생성 → reservation.issue_status 갱신 |
| `fn_resolve_issue_ticket(uuid, uuid)` | SECURITY DEFINER | 이슈 해결 → 잔여 이슈 0이면 reservation.issue_status = resolved |

### Search Functions

| Function | Type | Description |
|---|---|---|
| `fn_search_locations(text, int)` | STABLE | 장소 검색 (FTS + trigram similarity) |
| `fn_search_cms(text, text, text, text, int, int)` | STABLE | CMS 콘텐츠 검색 (FTS + trigram, 다국어) |
| `fn_get_translation(uuid, text, text, text, text)` | STABLE | content_translations에서 번역 조회 (fallback: ko) |

### System Functions

| Function | Type | Description |
|---|---|---|
| `fn_archive_old_logs(int, int, int)` | SECURITY DEFINER | audit_logs, notifications, operation_status_logs 아카이브 이동 |
| `fn_archive_old_records(int, int, int)` | SECURITY DEFINER | archive_* 테이블로 이동 (v2, audit_log 기록 포함) |
| `fn_refresh_materialized_views()` | SECURITY DEFINER | mv_monthly_kpi, mv_branch_performance, mv_service_popularity 갱신 |
| `fn_refresh_report_views()` | SECURITY DEFINER | mv_branch_monthly_report, mv_reservation_funnel 갱신 |
| `fn_current_employee_context()` | STABLE | 현재 로그인 직원의 전체 컨텍스트 (역할 + 지점 배정) JSON 반환 |
| `rls_auto_enable()` | EVENT TRIGGER | 새 테이블 생성 시 자동 RLS 활성화 |
| `set_updated_at()` | TRIGGER | updated_at 자동 갱신 |

---

## 7. Triggers

| Trigger | Table | Event | Target |
|---|---|---|---|
| `on_booking_details_insert` | booking_details | AFTER INSERT | → Edge Function `on-booking-created` |
| `on_booking_details_update` | booking_details | AFTER UPDATE | → Edge Function `on-booking-updated` |
| `profiles_set_updated_at` | profiles | BEFORE UPDATE | `set_updated_at()` |
| `employees_set_updated_at` | employees | BEFORE UPDATE | `set_updated_at()` |
| `branches_set_updated_at` | branches | BEFORE UPDATE | `set_updated_at()` |
| `roles_set_updated_at` | roles | BEFORE UPDATE | `set_updated_at()` |
| `employee_roles_set_updated_at` | employee_roles | BEFORE UPDATE | `set_updated_at()` |
| `employee_branch_assignments_set_updated_at` | employee_branch_assignments | BEFORE UPDATE | `set_updated_at()` |
| `set_updated_at` | location_translations | BEFORE UPDATE | `set_updated_at()` |
| `set_content_translations_updated_at` | content_translations | BEFORE UPDATE | `set_updated_at()` |

---

## 8. Index Strategy

### Coverage Summary

| Table | Index Count | Notable Indexes |
|---|---|---|
| `reservations` | 14 | branch+status+scheduled, customer+created, ops_status, issue_status, service+scheduled, reservation_no UNIQUE |
| `cms_contents` | 13 | FTS(ko/en), trigram(title/summary), slug UNIQUE, publish+type+area composite |
| `locations` | 9 | FTS(combined/name), trigram(name/name_en), branch+active, short_code UNIQUE |
| `employees` | 6 | profile_id UNIQUE, code/email/login_id UNIQUE(lower), legacy_admin_doc_id UNIQUE |
| `employee_branch_assignments` | 6 | employee+branch UNIQUE, is_primary UNIQUE, branch+active_period |
| `employee_roles` | 5 | employee+role UNIQUE, is_primary UNIQUE |
| `issue_tickets` | 5 | reservation+status, issue_code, status |
| `service_rules` | 5 | service_id, branch_id, branch_type_id, baggage_type_id |
| `payments` | 4 | reservation+created, status |
| `notifications` | 4 | reservation+created, status |

### Search Indexes

- **Full-Text Search (GIN)**: `locations.fts_combined`, `locations.fts_name`, `cms_contents.fts_ko`, `cms_contents.fts_en`
- **Trigram (GIN)**: `locations.name`, `locations.name_en`, `cms_contents.title_ko`, `cms_contents.title_en`, `cms_contents.summary_ko`, `cms_contents.summary_en`

---

## 9. Archive Strategy

### Dual Archive Pattern (주의)

현재 아카이브 테이블이 **2벌** 존재합니다:

| Pattern A (v1) | Pattern B (v2) | Function |
|---|---|---|
| `audit_logs_archive` | `archive_audit_logs` | `fn_archive_old_logs` / `fn_archive_old_records` |
| `notifications_archive` | `archive_notifications` | same |
| `operation_status_logs_archive` | `archive_operation_status_logs` | same |

> **Action Required**: 하나로 통합 필요. `fn_archive_old_logs`는 `*_archive` 사용, `fn_archive_old_records`는 `archive_*` 사용.

---

## 10. Edge Functions Integration

| Edge Function | Trigger Source | Actions | Status |
|---|---|---|---|
| `on-booking-created` | booking_details INSERT trigger | 예약 코드 생성 + 바우처 이메일 + Google Chat 알림 | ACTIVE |
| `on-booking-updated` | booking_details UPDATE trigger | 도착 알림 + 정산 계산 | ACTIVE |
| `toss-payments` | API call | 결제 세션 생성/확인 | ACTIVE |
| `cancel-booking` | API call | 취소 처리 | ACTIVE |
| `sync-google-reviews` | Cron/manual | Google Places API → google_reviews + google_review_summary | ACTIVE |
| `admin-account-sync` | API call (StorageService) | 관리자 계정 CRUD (auth + profile + employee + role + branch) | ACTIVE (deployed 2026-03-29) |
| `signed-upload` | API call (StorageService) | Storage 버킷 signed URL 발급 + storage_assets 기록 | ACTIVE (deployed 2026-03-29) |

---

## 11. Data Health Check

### Active Data (rows > 0)

| Table | Rows | Status |
|---|---|---|
| chat_sessions | 123 | Active |
| employee_roles | 54 | Active |
| employee_branch_assignments | 53 | Active |
| profiles | 53 | Active |
| employees | 53 | Active |
| branches | 42 | Active |
| locations | 41 | Active |
| expenditures | 29 | Active |
| service_rules | 24 | Active |
| roles | 11 | Active |
| chat_messages | 5 | Active |
| google_reviews | 5 | Active |
| baggage_types | 4 | Active |
| app_settings | 4 | Active |
| branch_types | 3 | Active |
| services | 2 | Active |
| discount_codes | 1 | Active |
| google_review_summary | 1 | Active |
| daily_closings | 1 | Active |

### Empty Tables (no live bookings yet)

`customers`, `reservations`, `reservation_items`, `booking_details`, `payments`, `delivery_assignments`, `proof_assets`, `operation_status_logs`, `issue_tickets`, `notifications`, `audit_logs`, `ai_outputs`, `ai_review_logs`, `cms_areas`, `cms_themes`, `cms_contents`, `content_translations`, `location_translations`, `legal_documents`, `system_notices`, `storage_tiers`, `user_coupons`, `partnership_inquiries`, `branch_prospects`

---

## 12. Risk & Improvement Notes

### Critical

| # | Issue | Impact | Action |
|---|---|---|---|
| 1 | **Archive 테이블 2벌** | 데이터 분산, 함수 혼동 | v2(`archive_*`)로 통합, v1 drop |
| 2 | **RLS role target 불일치** | 일부 `{public}`, 일부 `{authenticated}` | `{authenticated}` + `has_any_role()` 표준화 |
| 3 | **booking_details public INSERT** | 인증 없이 예약 상세 삽입 가능 | auth.uid() 확인 추가 검토 |
| 4 | **chat_sessions/messages ALL public** | 인증 없이 전체 접근 | 세션 소유자 검증 추가 필요 |
| 5 | **branch_prospects ALL true** | 무제한 접근 | admin role 제한 필요 |

### Medium

| # | Issue | Impact | Action |
|---|---|---|---|
| 6 | **content_translations 중복 RLS** | `employee_write_translations` + `employee_write_content_translations` 중복 | 하나 제거 |
| 7 | **delivery_assignments 중복 RLS** | `employee_all_delivery` + `employee_all_delivery_assignments` 중복 | 하나 제거 |
| 8 | **MV refresh 미자동화** | materialized view가 수동 refresh만 가능 | pg_cron 또는 Edge Function cron 설정 |
| 9 | **customers 테이블 0건** | Firebase에서 마이그레이션 미완료 or 미사용 | 예약 플로우 확인 필요 |
| 10 | **location_translations 0건** | 번역 데이터 미입력 | locations 테이블에 inline 번역 컬럼 추가 고려 |

### Low

| # | Issue | Impact | Action |
|---|---|---|---|
| 11 | **discount_codes 중복 인덱스** | `code` UNIQUE + `idx_discount_codes_code` 중복 | idx 제거 |
| 12 | **Enum 미사용** | status 값이 text CHECK 대신 text로 관리됨 | 현재 유연성 유지 or Enum 전환 고려 |

---

## 13. Role Hierarchy

```
super_admin
  └── hq_admin
        ├── ops_manager
        │     ├── ops_staff
        │     └── driver
        ├── finance_staff
        ├── hub_manager
        ├── partner_manager
        ├── marketing_staff
        │     └── content_editor
        └── cs_staff
customer (별도 auth 경로: customers 테이블)
```

**11 Roles in DB**: super_admin, hq_admin, ops_manager, ops_staff, finance_staff, hub_manager, partner_manager, marketing_staff, content_editor, cs_staff, driver

---

## 14. State Machine Summary

### Reservation Status (`reservations.status`)
```
pending → pending_review → confirmed → completed
                │                │
                └──── cancelled ◀─┘
```

### Ops Status (`reservations.ops_status`)
```
pending → confirmed → driver_assigned → picked_up → in_transit → delivered → completed
                                                                      │
                                                                 cancelled
```

### Issue Status (`reservations.issue_status`)
```
none → has_issue → resolved
```

### Delivery Status (`delivery_assignments.status`)
```
assigned → picked_up → in_transit → delivered → completed
```

### Payment Status (`payments.status`)
```
pending → paid → refunded
           │
      partially_refunded
```

### Settlement Status (`booking_details.settlement_status`)
```
pending → settled
```

---

## 15. Extensions

| Extension | Purpose |
|---|---|
| `pg_trgm` | Trigram similarity search (locations, CMS) |
| `unaccent` | 악센트 제거 검색 |
| `http` (`extensions` schema) | Edge Function HTTP 호출 (trigger에서 사용) |

---

## Appendix: FK Relationship Full List

| From | Column | To | Column |
|---|---|---|---|
| ai_review_logs | ai_output_id | ai_outputs | id |
| booking_details | reservation_id | reservations | id |
| booking_details | pickup_location_id | locations | id |
| booking_details | dropoff_location_id | locations | id |
| branch_prospects | partnership_inquiry_id | partnership_inquiries | id |
| branches | branch_type_id | branch_types | id |
| chat_messages | session_id | chat_sessions | session_id |
| cms_contents | area_slug | cms_areas | area_slug |
| daily_closings | branch_id | branches | id |
| delivery_assignments | reservation_id | reservations | id |
| employee_branch_assignments | branch_id | branches | id |
| employee_branch_assignments | employee_id | employees | id |
| employee_roles | employee_id | employees | id |
| employee_roles | role_id | roles | id |
| employees | profile_id | profiles | id |
| expenditures | branch_id | branches | id |
| issue_tickets | reservation_id | reservations | id |
| location_translations | location_id | locations | id |
| locations | branch_id | branches | id |
| notifications | reservation_id | reservations | id |
| operation_status_logs | reservation_id | reservations | id |
| payments | reservation_id | reservations | id |
| proof_assets | reservation_id | reservations | id |
| reservation_items | reservation_id | reservations | id |
| reservation_items | baggage_type_id | baggage_types | id |
| reservations | branch_id | branches | id |
| reservations | customer_id | customers | id |
| reservations | service_id | services | id |
| service_rules | baggage_type_id | baggage_types | id |
| service_rules | branch_id | branches | id |
| service_rules | branch_type_id | branch_types | id |
| service_rules | service_id | services | id |
| user_coupons | discount_code_id | discount_codes | id |
