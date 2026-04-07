---
name: beeliber_architecture
description: 기술 아키텍처, 6-Layer 하네스 구조, 상태 머신, API 명세, Next.js 전환 구조. 설계·구현 작업 시 필수 참조.
---

# 🏗️ Beeliber 시스템 아키텍처 & 하네스 구조

원문: `docs/beeliber_harness_engineering_v1.md`

## 📍 1. System Structure

Beeliber is built as a React SPA with Firebase integration (Firestore, Auth, Functions v2, Storage, Hosting).

### 🚀 Page Architecture (ViewTypes)

- **User Facing**: `LandingRenewal`, `ServicesPage`, `LocationsPage`, `BookingPage`, `TrackingPage`.
- **Administrative**: `AdminDashboard`, `BranchAdminPage`, `StaffScanPage`.
- **Informative**: `ManualPage`, `Terms`, `Privacy`.

### 🛡️ Admin Dashboard Modules

The dashboard is segmented by `AdminTab`:

- **Logistics**: Delivery and Storage booking management.
- **Operations**: Location management, Promotions, Accounting, Settlement.
- **System**: HR (Staff roles), System config, Cloud API settings, Hero/Notice editors.
- **CS**: Partnership inquiries, Live Chat history.

## 👩‍💻 2. Current Optimizations

- **Modular Functions v2**: Dedicated domains for booking, notification, and locations.
- **Lazy Loading**: Use `React.lazy()` and `Suspense` for heavy admin modules to keep user-facing pages fast.
- **SEO Strategy**: Meta-tag optimization per page (Landing, Branches).

## 🛰️ 3. "Hyper-Gap" Master Plan

- **Phase 1 (AI & Trust)**: Digital Twin Luggage 관제(Visualization), Demand Forecasting, Emotional AI CS.
- **Phase 2 (Automation)**: Zero-PII (QR-based anonymous tracking), Smart Contract Insurance (instant compensation), AMR robot delivery integration.
- **Phase 3 (Evolution)**: Next.js migration for SSR, Dynamic Routing based on user context, B2B Omichannel gateways.

> "We are not just building a website; we are replacing the heart of Beeliber with cutting-edge tech. 💅🛰️"

## 🎛️ 4. 하네스 6-Layer 구조

| Layer | 이름 | 담당 스킬 |
|-------|------|---------|
| **1** | Brand Harness | `beeliber_master` |
| **2** | Commerce Harness | `beeliber_pricing` + `beeliber_payments` |
| **3** | Operations Harness | `beeliber_operations` |
| **4** | AI Harness | `beeliber_ai_harness` |
| **5** | Admin Harness | `beeliber_ui_map` + `beeliber_stitch_qa` |
| **6** | Eval Harness | `beeliber_eval` |

## 🔄 5. 상태 머신 (State Machine)

### 예약 상태
```
lead_created → validation_passed → payment_pending → payment_completed
  → reservation_confirmed → cancelled
  → manual_review_required → rejected
```

### 운영 상태
```
pickup_ready → pickup_completed → in_transit → arrived_at_destination
  → handover_pending → handover_completed → completed
```

### 이슈 상태
```
issue_open → issue_in_progress → issue_waiting_customer/internal
  → issue_resolved → issue_closed
```

### AI 상태
```
ai_generated → ai_policy_failed / ai_review_pending
  → ai_approved → ai_published / ai_rejected
```

## 🌐 6. API 명세 (목표)

| 영역 | 엔드포인트 | 기능 |
|------|-----------|------|
| 예약 | `POST /api/reservations/validate` | 예약 가능 여부 사전 판정 |
| 예약 | `POST /api/reservations` | 예약 생성 |
| 예약 | `PATCH /api/reservations/:id/status` | 상태 변경 |
| 결제 | `POST /api/payments/confirm` | 결제 승인 |
| 결제 | `POST /api/payments/webhook` | 웹훅 수신 |
| 결제 | `POST /api/payments/refund` | 환불 |
| 운영 | `POST /api/ops/assign-driver` | 기사 배정 |
| 운영 | `PATCH /api/ops/reservations/:id/ops-status` | 운영 상태 변경 |
| 운영 | `POST /api/ops/reservations/:id/proofs` | 증빙 업로드 |
| 이슈 | `POST /api/issues` | 이슈 생성 |
| AI | `POST /api/ai/generate` | AI 초안 생성 |
| AI | `POST /api/ai/review` | 자동 검사 |
| 규칙 | `GET/POST/PATCH /api/rules` | 규칙 CRUD |
| 규칙 | `POST /api/rules/simulate` | 시뮬레이션 |

## 📂 7. Next.js 전환 목표 구조

```
apps/web/app/
  (public)/page.tsx              ← 랜딩
  (public)/reservation/page.tsx  ← 예약
  api/reservations/              ← 예약 API
  api/payments/                  ← 결제 API
  api/ops/                       ← 운영 API
  api/issues/                    ← 이슈 API
  api/ai/                        ← AI API
  api/rules/                     ← 규칙 API
  dashboard/                     ← 관리자 화면
    reservations/                ← 예약 검토함
    ops-board/                   ← 운영 보드
    issues/                      ← 이슈 센터
    ai-review/                   ← AI 검수함
    rules/                       ← 규칙 관리
    analytics/                   ← KPI 대시보드
```

## 📋 8. 개발 로드맵

| 차수 | 핵심 작업 |
|------|---------|
| **1차** | branch/service/rules 테이블 + validate API + 예약 상태머신 + 검토함 |
| **2차** | 결제 연동 + 운영 상태 + 증빙 + 이슈센터 + 알림 |
| **3차** | 실시간 운영보드 + SLA + 감사로그 + 규칙관리 |
| **4차** | AI generate/review/approve + AI 검수함 + KPI 대시보드 |
| **5차** | 재배차 추천 + ETA 예측 + 이상탐지 자동화 |
