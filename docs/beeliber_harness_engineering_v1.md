# Beeliber Harness Engineering Master v2.0

> 최종 업데이트: 2026-03-31 | 실 구현 기준 반영

## 0. 문서 개요

이 문서는 Beeliber 운영을 위한 하네스 엔지니어링 기준 문서다.
목표는 예약, 결제, 보관, 배송, CS, AI 콘텐츠, 관리자 운영을 **반복 가능하고 안전한 체계**로 묶는 것이다.

핵심 원칙은 다음과 같다.

- 운영 가능한 예약만 받는다.
- 상태값은 고객/지점/기사/관리자 화면에서 일치해야 한다.
- AI 출력은 브랜드/운영 규칙을 통과한 것만 사용한다.
- 모든 예외는 감이 아니라 코드와 로그로 처리한다.
- 지점이 늘어나도 규칙 기반으로 확장 가능해야 한다.

---

## 1. 현재 기술 스택 (실 구현)

| 항목 | 기술 | 상태 |
|------|------|------|
| Frontend | React SPA (Vite + TypeScript) + Tailwind CSS | 운영 중 |
| Backend | Supabase Edge Functions (Deno) | 운영 중 |
| DB | Supabase PostgreSQL 17 (49개 테이블, 9개 뷰) | 운영 중 |
| Auth | Supabase Auth (JWT) | 운영 중 |
| Storage | Supabase Storage (5개 버킷) | 운영 중 |
| Hosting | Firebase Hosting | 운영 중 |
| 결제 | Toss Payments | Mock 모드 (실배포 대기) |
| 상태관리 | Zustand (3개 스토어) + TanStack React Query | 운영 중 |
| i18n | 6개 언어 (ko/en/ja/zh/zh-TW/zh-HK) | 운영 중 |
| Supabase 프로젝트 | `xpnfjolqiffduedwtxey` (ap-northeast-1) | ACTIVE |

> Firebase Firestore/Auth는 2026-03-29 기준 **완전 retired**. Supabase가 유일한 런타임 DB.

---

## 2. Beeliber형 하네스 엔지니어링 정의

7가지를 한 세트로 설계하는 방식이다.

1. 입력 규칙
2. 자동 판정 규칙
3. 상태 전이 규칙
4. 예외 처리 규칙
5. 승인/검수 규칙
6. 로그 기록 규칙
7. 성과 측정 규칙

---

## 3. 전체 구조 (6-Layer)

```
┌──────────────────────────────────────────────────────┐
│ Layer 1. Brand       │ beeliber_master               │
│ 브랜드 표현, 금지 문구, 서비스 운영 범위 통제           │
├──────────────────────┼───────────────────────────────┤
│ Layer 2. Commerce    │ beeliber_pricing + payments   │
│ 예약 4단계, 가격 계산, 결제(Toss), 환불              │
├──────────────────────┼───────────────────────────────┤
│ Layer 3. Operations  │ beeliber_operations           │
│ 보관, 픽업, 배송, 인계, SLA, 예외 처리               │
├──────────────────────┼───────────────────────────────┤
│ Layer 4. AI          │ beeliber_ai_harness           │
│ AI 생성, 자동 검사, 승인, 배포 통제                   │
├──────────────────────┼───────────────────────────────┤
│ Layer 5. Admin       │ beeliber_ui_map + stitch_qa   │
│ 20개 탭 대시보드, 운영보드, 이슈센터, 규칙관리         │
├──────────────────────┼───────────────────────────────┤
│ Layer 6. Eval        │ beeliber_eval                 │
│ KPI, 실패 원인, 지점별/기사별/AI 성능 측정            │
└──────────────────────┴───────────────────────────────┘
```

---

## 4. 사용자 예약 플로우 (실 구현)

```
[랜딩] → [거점 선택] → [예약 폼 4단계] → [결제] → [저장] → [웹훅] → [완료]
```

### 4-1. 예약 폼 (BookingPage.tsx, 1352줄)

| 단계 | 내용 |
|------|------|
| Step 01 | 서비스 유형 (STORAGE/DELIVERY), 거점, 날짜/시간 |
| Step 02 | 짐 수량 (handBag, carrier, strollerBicycle) |
| Step 03 | 고객 정보, SNS, 동의, 보험 |
| Step 04 | 가격 확인, 쿠폰, 결제 |

### 4-2. 가격 계산 (실 구현)

**보관 요금** (bookingService.ts):
```
핸드백:  4h 4,000 / 시간당 200 / 1일 8,000 / 추가일 6,000 / 7일 44,000
캐리어:  4h 5,000 / 시간당 250 / 1일 10,000 / 추가일 8,000 / 7일 58,000
유모차:  4h 10,000 / 시간당 200 / 1일 14,000 / 추가일 10,000 / 7일 74,000
```

**배송 요금** (deliveryStoragePricing.ts):
```
핸드백: 10,000 / 캐리어: 25,000 (유모차 배송 불가)
배송일 > 픽업일이면 보관 요금 추가
```

**공통 추가**: 보험 5,000×레벨×짐수 + 출발지/도착지 할증 - 쿠폰 할인

### 4-3. 결제 (tossPaymentsService.ts)

1. `createTossPaymentSession()` → orderId 발급
2. `requestTossCardPayment()` → Toss 결제창
3. 성공: `/payments/toss/success` → `confirmTossPayment()`
4. 실패: `/payments/toss/fail`

### 4-4. 후처리 (on-booking-created Edge Function)

1. 예약 코드 생성 (ORIGIN-DEST-RANDOM)
2. 바우처 이메일 발송
3. Google Chat 알림

---

## 5. 상태 머신 (실 구현)

### 5-1. 예약 상태 (reservations.status)
```
lead_created → validation_passed → manual_review_required → rejected
                    │
                    ▼
              payment_pending → payment_completed → reservation_confirmed
                    │                                      │
                    ▼                                      ▼
                cancelled                              cancelled
```

### 5-2. 운영 상태 (reservations.ops_status)
```
pickup_ready → pickup_completed → in_transit → arrived_at_destination
                                                       │
                                                       ▼
                                              handover_pending → handover_completed → completed
```

### 5-3. 배송 상태 (delivery_assignments.status)
```
unassigned → assigned → arrived_pickup → picked_up → arrived_destination → handover_done
                                                                              │
                                                                          cancelled
```

### 5-4. 이슈 상태 (issue_tickets.status)
```
open → in_progress → waiting_customer / waiting_internal → resolved → closed
```

### 5-5. AI 상태 (ai_outputs.approval_status)
```
review_pending → approved → published
              → rejected
```

---

## 6. DB 현황 (Supabase PostgreSQL 17)

### 6-1. 테이블 구조 (49개)

| 영역 | 테이블 | 수 |
|------|--------|:--:|
| AUTH & ORG | profiles, roles, branches, branch_types, employees, employee_roles, employee_branch_assignments | 7 |
| RESERVATION | customers, services, baggage_types, service_rules, reservations, reservation_items, booking_details, payments, delivery_assignments, proof_assets, issue_tickets, operation_status_logs, storage_tiers | 13 |
| OPERATIONS | locations, location_translations, daily_closings, expenditures, audit_logs, audit_logs_archive | 6 |
| CMS & AI | cms_areas, cms_contents, cms_themes, content_translations, ai_outputs, ai_review_logs, system_notices, legal_documents, google_reviews, google_review_summary | 10 |
| COMMS | chat_sessions, chat_messages, notifications, notifications_archive | 4 |
| PROMOTION | discount_codes, user_coupons, partnership_inquiries, branch_prospects, app_settings | 5 |
| ARCHIVE | archive_audit_logs, archive_notifications, archive_operation_status_logs, operation_status_logs_archive | 4 |

### 6-2. 뷰 (9개)
- `admin_booking_list_v1` — 관리자 예약 목록
- `admin_revenue_daily_v1` — 일별 매출
- `admin_revenue_monthly_v1` — 월별 매출
- `v_branch_daily_summary`, `v_branch_settlement_*` — 지점 정산
- `v_cms_public_list`, `v_reservation_admin_list`

### 6-3. RLS 정책

전체 테이블 RLS 활성화. 11개 역할 기반 접근 제어:
```
super_admin, hq_admin, hub_manager, partner_manager, ops_manager,
ops_staff, finance_staff, cs_staff, driver, marketing, content_editor
```

헬퍼 함수: `has_any_role()`, `has_branch_access()`, `shares_branch_with_employee()`, `current_employee_id()`

### 6-4. Edge Functions (6개)
- `on-booking-created` — 예약 생성 후처리 (코드+이메일+알림)
- `on-booking-updated` — 예약 수정 후처리
- `signed-upload` — Supabase Storage 서명 업로드
- `admin-account-sync` — 관리자 계정 동기화
- `toss-payments` — Toss 결제 세션/확인
- `cancel-booking` — 예약 취소

> 상세 DB 구조: `docs/DATABASE_STRUCTURE_MAP.md` 참조

---

## 7. 프로젝트 구조 (실 구현)

```
client/                          ← React SPA (Vite + TypeScript)
├── App.tsx                      ← 전체 라우팅 (25+ 사용자 + 4 관리자)
├── components/
│   ├── BookingPage.tsx          ← 예약 폼 4단계 (1,352줄)
│   ├── AdminDashboard.tsx       ← 관리자 대시보드 (3,000+줄, 20탭)
│   ├── LandingRenewal.tsx       ← 랜딩 페이지 (12개 섹션)
│   ├── admin/                   ← 관리자 탭 컴포넌트 (20개)
│   └── landing/                 ← 랜딩 섹션 컴포넌트 (12개)
├── src/
│   ├── domains/                 ← DDD 도메인 구조
│   │   ├── booking/             ← 예약 (타입, 서비스, 가격 계산, 훅)
│   │   ├── location/            ← 거점 (타입, 구독 훅)
│   │   ├── admin/               ← 관리자 (통계, 매출, 정산 훅)
│   │   ├── user/                ← 사용자 (인증 훅)
│   │   └── shared/              ← 공통 (타입, SEO 스키마)
│   └── store/                   ← Zustand 스토어
│       ├── appStore.ts          ← 언어, 관리자 정보
│       ├── bookingStore.ts      ← 예약 상태
│       └── adminStore.ts        ← 관리자 UI 상태
├── services/
│   ├── storageService.ts        ← 핵심 CRUD (Supabase 어댑터, 1,400+줄)
│   ├── adminAuthService.ts      ← 관리자 인증 (Supabase Auth)
│   ├── supabaseClient.ts        ← Supabase REST 클라이언트
│   ├── supabaseRuntime.ts       ← Supabase URL/키 설정
│   └── tossPaymentsService.ts   ← Toss 결제 연동
├── translations_split/          ← 6개 언어 번역 (326KB)
└── types.ts                     ← 전체 타입 정의

supabase/
├── functions/                   ← Edge Functions (6개)
│   ├── on-booking-created/
│   ├── on-booking-updated/
│   ├── signed-upload/
│   ├── admin-account-sync/
│   ├── toss-payments/
│   └── cancel-booking/
└── migrations/                  ← DB 마이그레이션 (17개 SQL)

functions/                       ← Firebase Functions (레거시, 운영 중)
├── index.js                     ← 이메일, 알림 등

.agent/
├── skills/                      ← 22개 스킬 (브랜드~DB검수)
├── rules/                       ← 9개 규칙 (설계/구현/수정 모드)
└── workflows/                   ← 워크플로우 (스크린샷→코드)
```

---

## 8. 관리자 대시보드 (실 구현, 20탭)

| # | 탭 | 컴포넌트 | 역할 |
|---|-----|---------|------|
| 1 | Overview | OverviewTab | KPI + 매출 요약 |
| 2 | Logistics | LogisticsTab | 예약 목록 + 상태 관리 |
| 3 | Locations | LocationsTab | 거점 CRUD + 지도 |
| 4 | Daily Settlement | DailySettlementTab | 일일 정산 |
| 5 | Accounting | AccountingTab | 회계 상세 |
| 6 | Monthly Settlement | MonthlySettlementTab | 월별 정산 |
| 7 | Financial Comparison | FinancialComparisonTab | 재무 비교 |
| 8 | Notice | NoticeTab | 공지 CRUD |
| 9 | Partnership | PartnershipTab | 제휴 관리 |
| 10 | HR | HRTab | 직원/역할 관리 |
| 11 | System | SystemTab | 시스템 설정 |
| 12 | Cloud | CloudTab | 클라우드 설정 |
| 13 | Chat | ChatTab | 채팅 관리 |
| 14 | Discount | DiscountTab | 할인 코드 CRUD |
| 15 | Reports | ReportsTab | 리포트 |
| 16 | Roadmap | RoadmapTab | 로드맵 |
| 17 | Operations | OperationsConsole | 운영 콘솔 |
| 18-20 | Editors | Privacy/Terms/QnaEditorTab | 약관 편집 |

> 70+ 버튼/핸들러 전수 검사 완료 (2026-03-31). 코드 레벨 broken 0건.

---

## 9. Supabase Edge Function API 명세 (실 구현)

| Endpoint | Method | 역할 |
|----------|--------|------|
| `/functions/v1/on-booking-created` | POST | 예약 코드 생성 + 이메일 + 알림 |
| `/functions/v1/on-booking-updated` | POST | 예약 수정 후처리 |
| `/functions/v1/toss-payments` | POST | 결제 세션 생성/확인 |
| `/functions/v1/cancel-booking` | POST | 예약 취소 처리 |
| `/functions/v1/signed-upload` | POST | Storage 서명 업로드 |
| `/functions/v1/admin-account-sync` | POST | 관리자 계정 동기화 |

REST API는 Supabase PostgREST 자동 생성 (`/rest/v1/{table}`)

---

## 10. 하네스 스킬 맵 (22개)

### 핵심 스킬 (우선 참조)
| 스킬 | Layer | 역할 |
|------|-------|------|
| `beeliber_master` | 1. Brand | 금지어, 가격표, 서비스 구조 |
| `beeliber_security` | 공통 | CISO 보안 가드레일 5대 원칙 |
| `beeliber_design` | 공통 | 컬러, 폰트, UX 원칙 |
| `beeliber_core` | 공통 | DDD 아키텍처, 팀 프로토콜 |

### Layer별 스킬
| 스킬 | Layer | 역할 |
|------|-------|------|
| `beeliber_pricing` | 2. Commerce | 가격 정책 + 계산 로직 |
| `beeliber_payments` | 2. Commerce | Toss Payments 실배포 |
| `beeliber_booking_flow` | 2. Commerce | 예약 4단계 + 결제 + 후처리 |
| `beeliber_operations` | 3. Operations | 상태머신, SLA, 기사배정, 이슈 |
| `beeliber_ai_harness` | 4. AI | AI 생성·검사·승인·배포 통제 |
| `beeliber_ui_map` | 5. Admin | 화면 구조 + 연동 포인트 맵 |
| `beeliber_stitch_qa` | 5. Admin | UI/UX 수정 후 QA 프로토콜 |
| `beeliber_eval` | 6. Eval | KPI, 실패분석, 성과측정 |

### 인프라 스킬
| 스킬 | 역할 |
|------|------|
| `beeliber_app_structure` | 라우팅, 도메인, 서비스, 상태관리 |
| `beeliber_architecture` | 기술 아키텍처 + Hyper-Gap 로드맵 |
| `beeliber_supabase` | Supabase 전환 마스터 플랜 |
| `beeliber_seo` | 다국어 SEO (zh-TW 우선) |

### DB 검수 스킬 (6개)
| 스킬 | 담당 테이블 |
|------|-----------|
| `db_audit_auth` | profiles, roles, branches, employees |
| `db_audit_reservation` | reservations, booking_details, payments |
| `db_audit_operations` | locations, daily_closings, service_rules |
| `db_audit_cms` | cms_contents, ai_outputs, google_reviews |
| `db_audit_comms` | chat_sessions, notifications |
| `db_audit_promotion` | discount_codes, user_coupons |

---

## 11. 개발 로드맵

| 차수 | 핵심 작업 | 상태 |
|------|---------|:----:|
| **1차** | 테이블 구축 + validate API + 상태머신 + 예약 검토함 | **완료** |
| **2차** | 결제 연동 + 운영 상태 + 증빙 + 이슈센터 + 알림 | 진행 중 |
| **3차** | 실시간 운영보드 + SLA + 감사로그 + 규칙관리 | 대기 |
| **4차** | AI 흐름 + AI 검수함 + KPI 대시보드 | 대기 |
| **5차** | 재배차 추천 + ETA 예측 + 이상탐지 | 대기 |

---

## 12. 최종 요약

> 예약, 운영, AI, 관리자 업무를
> "사람의 감"이 아니라 "규칙 + 상태 + 로그 + 검수"로 움직이게 만드는 구조

**참조 문서:**
- DB 구조 맵: `docs/DATABASE_STRUCTURE_MAP.md`
- 앱 구조 + 예약 플로우: `docs/APP_STRUCTURE_AND_BOOKING_FLOW.md`
- 브랜드 가이드: `docs/beeliber_brand_guide_v4.md`
