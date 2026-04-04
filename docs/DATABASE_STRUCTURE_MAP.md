# Beeliber 데이터베이스 구조 맵

> 생성일: 2026-03-31
> Supabase 프로젝트: `xpnfjolqiffduedwtxey` (ap-northeast-1)
> PostgreSQL 17 | Schema: `public`

---

## 전체 구조 다이어그램

```
┌─────────────────────────────────────────────────────────────┐
│                    AUTH & ORGANIZATION                       │
│                                                             │
│  auth.users ──→ profiles ──→ employees ──┬→ employee_roles  │
│                                          │    └→ roles      │
│                                          └→ employee_branch │
│                               branches ←──── _assignments   │
│                               └→ branch_types               │
└─────────────────────────────────────────────────────────────┘
          │                        │
          ▼                        ▼
┌─────────────────────────────────────────────────────────────┐
│                   RESERVATION CORE                           │
│                                                             │
│  customers ──→ reservations ──┬→ reservation_items           │
│  services  ──→      │        │    └→ baggage_types          │
│  branches  ──→      │        ├→ payments                    │
│                     │        ├→ booking_details              │
│                     │        │    ├→ locations (pickup)      │
│                     │        │    └→ locations (dropoff)     │
│                     │        ├→ delivery_assignments         │
│                     │        ├→ proof_assets                 │
│                     │        ├→ issue_tickets                │
│                     │        ├→ operation_status_logs        │
│                     │        └→ notifications                │
│                     │                                       │
│  service_rules ←── services + branches + baggage_types      │
└─────────────────────────────────────────────────────────────┘
          │
          ▼
┌─────────────────────────────────────────────────────────────┐
│                   OPERATIONS & FINANCE                       │
│                                                             │
│  locations (54 cols) ──→ location_translations               │
│  daily_closings ←── branches                                │
│  expenditures   ←── branches                                │
│  audit_logs                                                 │
│  storage_tiers                                              │
└─────────────────────────────────────────────────────────────┘
          │
          ▼
┌─────────────────────────────────────────────────────────────┐
│               CMS & AI & COMMUNICATIONS                      │
│                                                             │
│  cms_areas ──→ cms_contents                                 │
│  cms_themes                                                 │
│  content_translations                                       │
│  ai_outputs ──→ ai_review_logs                              │
│  chat_sessions ──→ chat_messages                            │
│  system_notices                                             │
│  legal_documents                                            │
│  google_reviews / google_review_summary                     │
└─────────────────────────────────────────────────────────────┘
          │
          ▼
┌─────────────────────────────────────────────────────────────┐
│                PROMOTION & PARTNERSHIPS                       │
│                                                             │
│  discount_codes ──→ user_coupons                            │
│  partnership_inquiries ──→ branch_prospects                  │
│  app_settings                                               │
└─────────────────────────────────────────────────────────────┘
```

---

## 1. AUTH & ORGANIZATION (인증·조직)

### profiles
> Supabase Auth 사용자 프로필

| 컬럼 | 타입 | 설명 |
|------|------|------|
| `id` | uuid PK | auth.users.id FK (cascade) |
| `email` | text | 이메일 |
| `display_name` | text | 표시명 |
| `account_type` | text | employee / customer / partner |
| `avatar_url` | text | 아바타 URL |
| `phone` | text | 전화번호 |
| `locale` | text | 기본 'ko' |
| `timezone` | text | 기본 'Asia/Seoul' |
| `last_login_at` | timestamptz | 마지막 로그인 |
| `is_active` | boolean | 활성 여부 |
| `metadata` | jsonb | 추가 메타데이터 |

### roles
> 역할 코드 마스터

| 컬럼 | 타입 | 설명 |
|------|------|------|
| `id` | uuid PK | |
| `code` | text UNIQUE | super_admin, hq_admin, hub_manager 등 |
| `name` | text | 역할명 |
| `description` | text | 설명 |
| `is_system` | boolean | 시스템 기본 역할 여부 |

### branches (20 cols)
> 지점/허브/파트너

| 컬럼 | 타입 | 설명 |
|------|------|------|
| `id` | uuid PK | |
| `branch_code` | text UNIQUE | 지점 코드 |
| `name` | text | 지점명 |
| `branch_type` | text | HQ / HUB / PARTNER / DRIVER_GROUP |
| `branch_type_id` | uuid FK | → branch_types |
| `status` | text | active / inactive / suspended / closed |
| `address` / `address_detail` | text | 주소 |
| `lat` / `lng` | numeric | 좌표 |
| `phone` / `email` | text | 연락처 |
| `is_active` | boolean | 활성 여부 |
| `open_time` / `close_time` | time | 영업시간 |

### employees (15 cols)
> 직원 정보

| 컬럼 | 타입 | 설명 |
|------|------|------|
| `id` | uuid PK | |
| `profile_id` | uuid UNIQUE FK | → profiles (cascade) |
| `employee_code` | text | 사번 |
| `name` | text | 이름 |
| `email` / `login_id` / `phone` | text | 연락처 |
| `job_title` | text | 직책 |
| `org_type` | text | HQ / HUB / PARTNER / DRIVER_GROUP |
| `employment_status` | text | active / inactive / suspended / resigned |

### employee_roles
> 직원-역할 매핑 (M:N)

| 컬럼 | 타입 | 설명 |
|------|------|------|
| `employee_id` | uuid FK | → employees (cascade) |
| `role_id` | uuid FK | → roles (restrict) |
| `is_primary` | boolean | 주 역할 여부 |

### employee_branch_assignments
> 직원-지점 배정 (M:N)

| 컬럼 | 타입 | 설명 |
|------|------|------|
| `employee_id` | uuid FK | → employees (cascade) |
| `branch_id` | uuid FK | → branches (restrict) |
| `assignment_type` | text | primary / member / secondary / temporary / auditor |
| `is_primary` | boolean | 주 지점 여부 |

---

## 2. RESERVATION CORE (예약 핵심)

### customers (6 cols)
> 고객 정보

| 컬럼 | 타입 | 설명 |
|------|------|------|
| `id` | uuid PK | |
| `full_name` | text | 고객명 |
| `language_code` | text | 기본 'en' |
| `email` / `phone` | text | 연락처 |

### services
> 서비스 종류 (DELIVERY, STORAGE 등)

| 컬럼 | 타입 | 설명 |
|------|------|------|
| `id` | uuid PK | |
| `code` | text UNIQUE | 서비스 코드 |
| `name` | text | 서비스명 |
| `is_active` | boolean | |

### baggage_types
> 짐 유형 (핸드백, 캐리어, 유모차 등)

| 컬럼 | 타입 | 설명 |
|------|------|------|
| `id` | uuid PK | |
| `code` | text UNIQUE | 짐 유형 코드 |
| `name` | text | 유형명 |
| `requires_manual_review` | boolean | 수동 검토 필요 |

### reservations (16 cols) ★ 핵심 테이블
> 예약 마스터

| 컬럼 | 타입 | 설명 |
|------|------|------|
| `id` | uuid PK | |
| `reservation_no` | text UNIQUE | 예약번호 |
| `customer_id` | uuid FK | → customers |
| `branch_id` | uuid FK | → branches |
| `service_id` | uuid FK | → services |
| `scheduled_at` | timestamptz | 예약 일시 |
| `status` | text | lead_created → validation_passed → payment_pending → payment_completed → reservation_confirmed / cancelled |
| `ops_status` | text | pickup_ready → pickup_completed → in_transit → arrived_at_destination → handover_completed → completed |
| `issue_status` | text | issue_open → issue_in_progress → issue_resolved → issue_closed |
| `risk_level` | text | low / medium / high |
| `approval_mode` | text | auto / manual |
| `total_amount` | numeric(12,2) | 총액 |

### reservation_items (7 cols)
> 예약 짐 항목

| 컬럼 | 타입 | 설명 |
|------|------|------|
| `reservation_id` | uuid FK | → reservations (cascade) |
| `baggage_type_id` | uuid FK | → baggage_types |
| `quantity` | int | 수량 (>0) |
| `size_note` | text | 크기 메모 |

### booking_details (51 cols) ★ 상세 예약 정보
> Firebase bookings → Supabase 매핑 테이블

| 주요 컬럼 | 타입 | 설명 |
|----------|------|------|
| `reservation_id` | uuid FK | → reservations (cascade) |
| `sns_channel` / `sns_id` | text | SNS 채널·ID |
| `pickup_location_id` | uuid FK | → locations |
| `dropoff_location_id` | uuid FK | → locations |
| `pickup_date` / `pickup_time` | date/time | 픽업 일시 |
| `dropoff_date` / `delivery_time` | date/time | 배송 일시 |
| `return_date` / `return_time` | date/time | 반환 일시 |
| `base_price` / `final_price` | numeric | 가격 |
| `promo_code` / `discount_amount` | text/numeric | 할인 |
| `payment_method` / `payment_key` | text | 결제 정보 |
| `service_type` | text | 서비스 유형 |
| `user_name` / `user_email` | text | 고객 정보 |
| `reservation_code` | text | 예약 코드 |
| `settlement_status` / `settled_at` | text/timestamptz | 정산 |
| `branch_commission_*` | numeric | 수수료율 |

### payments (9 cols)
> 결제 내역

| 컬럼 | 타입 | 설명 |
|------|------|------|
| `reservation_id` | uuid FK | → reservations (cascade) |
| `provider` | text | 결제 제공자 |
| `payment_key` | text | 결제키 |
| `status` | text | pending / paid / failed / refunded |
| `amount` | numeric(12,2) | 금액 |
| `paid_at` | timestamptz | 결제일 |

### delivery_assignments (9 cols)
> 배송 배정

| 컬럼 | 타입 | 설명 |
|------|------|------|
| `reservation_id` | uuid FK | → reservations (cascade) |
| `driver_name` / `driver_phone` | text | 기사 정보 |
| `status` | text | unassigned → assigned → picked_up → handover_done |
| `eta` / `sla_due_at` | timestamptz | ETA·SLA |

---

## 3. OPERATIONS & FINANCE (운영·재무)

### locations (54 cols) ★ 거점 마스터
> 공항·호텔·파트너 거점

| 주요 컬럼 | 타입 | 설명 |
|----------|------|------|
| `id` | uuid PK | |
| `short_code` | text UNIQUE | 거점 코드 |
| `name` + 다국어 (en/ja/zh/zh_tw/zh_hk) | text | 거점명 |
| `type` | text | AIRPORT / HOTEL / STATION / PARTNER 등 |
| `address` + 다국어 | text | 주소 |
| `description` + 다국어 | text | 설명 |
| `pickup_guide` + 다국어 | text | 픽업 가이드 |
| `business_hours` + 다국어 | text | 영업시간 |
| `supports_delivery` / `supports_storage` | boolean | 서비스 지원 |
| `is_origin` / `is_destination` | boolean | 출발/도착 여부 |
| `lat` / `lng` | numeric | 좌표 |
| `commission_rate_delivery` / `_storage` | numeric(5,2) | 수수료율 |
| `branch_id` | uuid FK | → branches |
| `branch_code` | text | 지점 코드 |

### location_translations
> 거점 다국어 번역

### daily_closings (18 cols)
> 일일 마감

| 주요 컬럼 | 타입 | 설명 |
|----------|------|------|
| `branch_id` | uuid FK | → branches |
| `date` | date | 마감일 |
| `total_revenue` | numeric | 총 매출 |
| `cash_/card_/apple_/...revenue` | numeric | 결제수단별 매출 |
| `closed_by` | text | 마감자 |

### expenditures (8 cols)
> 지출 내역

### service_rules (12 cols)
> 서비스별 짐 유형 허용/제한 규칙

### storage_tiers (9 cols)
> 보관 요금 등급

### audit_logs (8 cols)
> 감사 로그

---

## 4. CMS & AI (콘텐츠·AI)

### cms_areas → cms_contents → content_translations
> 지역별 콘텐츠 관리

### cms_themes
> 콘텐츠 테마 (맛집, 관광 등)

### ai_outputs → ai_review_logs
> AI 생성 콘텐츠 + 검수 기록

### system_notices
> 시스템 공지

### legal_documents
> 약관·개인정보처리방침 (다국어)

### google_reviews / google_review_summary
> 구글 리뷰 동기화

---

## 5. COMMUNICATIONS (메시징)

### chat_sessions → chat_messages
> 고객 채팅

### notifications
> 알림 (kakao / sms / email / slack)

---

## 6. PROMOTION (프로모션)

### discount_codes → user_coupons
> 할인 코드 → 고객별 쿠폰

### partnership_inquiries → branch_prospects
> 파트너 제휴 문의 → 지점 후보

### app_settings
> 앱 설정 (key-value)

---

## 7. VIEWS (뷰)

| 뷰 | 설명 |
|----|------|
| `admin_booking_list_v1` | 관리자 예약 목록 (예약+상세+고객+결제+짐 통합) |
| `admin_revenue_daily_v1` | 일별 매출 집계 |
| `admin_revenue_monthly_v1` | 월별 매출 집계 |
| `v_branch_daily_summary` | 지점 일일 요약 |
| `v_branch_settlement_candidates` | 정산 후보 |
| `v_branch_settlement_monthly` | 월별 정산 |
| `v_branch_settlement_summary` | 정산 요약 |
| `v_cms_public_list` | CMS 공개 목록 |
| `v_reservation_admin_list` | 예약 관리자 목록 |

---

## 8. FK 관계도 (Foreign Keys)

```
auth.users ─────→ profiles
                    └──→ employees
                           ├──→ employee_roles ←── roles
                           └──→ employee_branch_assignments ←── branches
                                                                  ├──→ branch_types
                                                                  ├──→ locations
                                                                  ├──→ daily_closings
                                                                  ├──→ expenditures
                                                                  └──→ service_rules ←── services
                                                                                    ←── baggage_types

customers ──→ reservations ←── branches
                   │       ←── services
                   ├──→ reservation_items ←── baggage_types
                   ├──→ booking_details ──→ locations (pickup/dropoff)
                   ├──→ payments
                   ├──→ delivery_assignments
                   ├──→ proof_assets
                   ├──→ issue_tickets
                   ├──→ operation_status_logs
                   └──→ notifications

cms_areas ──→ cms_contents
ai_outputs ──→ ai_review_logs
chat_sessions ──→ chat_messages
discount_codes ──→ user_coupons
partnership_inquiries ──→ branch_prospects
```

---

## 9. Firebase → Supabase 테이블 매핑

| Firebase (Firestore) | Supabase (PostgreSQL) |
|---------------------|----------------------|
| `bookings` | `booking_details` |
| `archived_bookings` | `booking_details` |
| `locations` | `locations` |
| `admins` | `employees` |
| `daily_closings` | `daily_closings` |
| `expenditures` | `expenditures` |
| `inquiries` | `partnership_inquiries` |
| `branch_prospects` | `branch_prospects` |
| `notices` | `system_notices` |
| `promo_codes` | `discount_codes` |
| `chat_sessions` | `chat_sessions` |
| `chats` | `chat_messages` |
| `branches` | `branches` |
| `users` | `customers` |
| `userCoupons` | `user_coupons` |
| `settings` | `app_settings` |

---

## 10. 상태 머신 (Status Flow)

### 예약 상태 (reservations.status)
```
lead_created → validation_passed → manual_review_required → rejected
                    │
                    ▼
              payment_pending → payment_completed → reservation_confirmed
                    │                                      │
                    ▼                                      ▼
                cancelled                              cancelled
```

### 운영 상태 (reservations.ops_status)
```
pickup_ready → pickup_completed → in_transit → arrived_at_destination
                                                       │
                                                       ▼
                                              handover_pending → handover_completed → completed
```

### 배송 상태 (delivery_assignments.status)
```
unassigned → assigned → arrived_pickup → picked_up → arrived_destination → handover_done
                                                                              │
                                                                          cancelled
```

### 이슈 상태 (issue_tickets.status)
```
open → in_progress → waiting_customer / waiting_internal → resolved → closed
```

---

## 11. RLS 정책 요약

| 접근 수준 | 대상 테이블 | 정책 |
|----------|-----------|------|
| **Public READ** | locations, services, baggage_types, branch_types, storage_tiers, app_settings, discount_codes, legal_documents, cms_*, google_reviews, employees | 누구나 읽기 가능 |
| **Public INSERT** | booking_details, reservations, partnership_inquiries, user_coupons | 비인증 사용자도 생성 가능 |
| **Customer (자기 것)** | reservations, booking_details, payments, delivery_assignments, issue_tickets, proof_assets, notifications | customer_id = auth.uid() |
| **Employee (역할 기반)** | 대부분의 테이블 | has_any_role() 함수로 역할 확인 |
| **HQ Only** | branches, employee_roles, employee_branch_assignments, roles | super_admin, hq_admin만 쓰기 |
| **Authenticated** | profiles | 본인 또는 HQ만 접근 |

---

## 12. 총 테이블 수: 49개 | 뷰: 9개 | 트리거: 15개
