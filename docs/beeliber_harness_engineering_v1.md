# Beeliber Harness Engineering Master v1.0

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

## 1. Beeliber에 왜 하네스 엔지니어링이 필요한가

Beeliber는 단순 예약 웹이 아니라 다음이 동시에 물려 있다.

- Hub 지점: 배송 + 보관
- Partner 지점: 보관 위주
- Phase 1 배송 범위: Hub → 인천공항 중심
- 미운영 범위: 공항 → 호텔, 호텔 픽업
- 다국어 고객 응대
- 실시간 운영 관리
- 기사/지점/관리자 협업
- 광고/콘텐츠/CS에 AI 활용

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

## 3. 목표

### 3-1. 핵심 목표

- 예약 단계에서 운영 불가 요청을 최대한 차단
- 결제 이후 운영 실패율 감소
- 기사/지점/관리자 간 상태 불일치 최소화
- CS와 안내 문구 일관성 확보
- AI를 적극 사용하되 사고를 줄임
- 운영 데이터를 개선 가능한 구조로 축적

### 3-2. 성공 조건

- 예약 시작 대비 결제 완료율 상승
- 결제 완료 대비 예약 확정률 상승
- 수동 검토 비율 합리화
- 운영 지연률 감소
- 증빙 누락률 감소
- 오안내 발생률 감소
- AI 초안 승인율 상승
- 이슈 해결 시간 단축

---

## 4. 전체 구조

Beeliber 하네스는 6개 레이어로 구성한다.

### Layer 1. Brand Harness
브랜드 표현, 금지 문구, 서비스 운영 범위 통제

### Layer 2. Commerce Harness
예약, 상품, 가격, 결제, 환불 전 단계 통제

### Layer 3. Operations Harness
보관, 픽업, 배송, 인계, SLA, 예외 처리 통제

### Layer 4. AI Harness
AI 생성, 자동 검사, 승인, 배포 통제

### Layer 5. Admin Harness
검토함, 운영보드, 이슈 센터, 규칙 관리, 감사 로그

### Layer 6. Eval Harness
KPI, 실패 원인, 지점별/기사별/AI 성능 측정

---

## 5. FSD (Functional Spec Document)

### 5-1. 고객 예약 페이지

**입력 항목**: 이용 유형(보관/Hub→공항 배송), 이용 지점, 날짜, 시간, 짐 종류, 수량, 고객 언어, 이름, 연락처, 목적지 정보, 추가 요청사항

**실시간 검증**:
- 지점이 Hub인지 Partner인지 판별
- 선택 서비스가 지점 유형과 맞는지 확인
- 미운영 배송 방향인지 확인
- 운영 시간 내 예약 가능 여부 확인
- 짐 종류 허용 여부 확인
- 특수짐 여부 확인

**결과 상태**: 예약 가능 / 수동 검토 필요 / 예약 불가

### 5-2. 결제 페이지

- 운영 불가 상태는 결제 진입 차단
- 수동 검토 상태는 결제 hold 가능
- 결제 완료 후 운영 불가 발견 시 issue 생성

### 5-3. 예약 검토함

**필터**: 오늘 검토 필요, 고위험 짐, 규격 불일치, 지점 불명확, 시간 충돌, 결제 완료 후 보류

**액션**: 승인, 반려, 추가 정보 요청, 대체 지점 추천, 기사 배정 대기 전환

### 5-4. 실시간 운영 보드

**컬럼**: 예약 접수 → 결제 완료 → 예약 확정 → 픽업 준비 → 픽업 완료 → 이동 중 → 인계 대기 → 완료 / 이슈

**자동 이벤트**: 상태 정체 10분 경고, ETA 초과 경고, 증빙 누락 알림, 고객 미응답 issue 자동 생성

### 5-5. 이슈 센터

**이슈 유형**: 고객 미응답, 지점 영업시간 불일치, 기사 지연, 주소 오류, 증빙 누락, 짐 규격 상이, 결제 후 운영 불가, 파손/분실 의심, 공항 인계 실패

### 5-6. AI 검수함

**자동 검사**: 미운영 서비스 언급, 금지어 포함, 브랜드 톤 이탈, 가격/정책 환각, 확정적 표현 과다

**액션**: 승인, 수정 후 승인, 반려, 프롬프트 수정 요청

### 5-7. 규칙 관리 페이지

**관리 항목**: 지점 유형, 서비스 가능 범위, 운영 시간, 자동 승인 조건, 수동 검토 조건, 금지 문구, 언어별 시스템 메시지, AI 위험도 기준

### 5-8. KPI 대시보드

예약→결제 완료율, 결제→예약 확정률, 수동 검토 비율, 운영 지연률, 증빙 누락률, 이슈 발생률, AI 승인/반려율, 오안내 발생률, 파손/분실 사고율

---

## 6. 상태값 체계

### 6-1. 예약 상태
lead_created → validation_passed → manual_review_required → rejected
                                 → payment_pending → payment_completed → reservation_confirmed → cancelled

### 6-2. 운영 상태
pickup_ready → pickup_completed → in_transit → arrived_at_destination → handover_pending → handover_completed → completed

### 6-3. 이슈 상태
issue_open → issue_in_progress → issue_waiting_customer / issue_waiting_internal → issue_resolved → issue_closed

### 6-4. AI 상태
ai_generated → ai_policy_failed / ai_review_pending → ai_approved / ai_rejected → ai_published

---

## 7. DB 스키마 SQL 초안

```sql
create extension if not exists "pgcrypto";

-- 지점 유형
create table branch_types (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null,
  created_at timestamptz not null default now()
);

-- 지점
create table branches (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null,
  branch_type_id uuid not null references branch_types(id),
  is_active boolean not null default true,
  address text,
  city text,
  timezone text not null default 'Asia/Seoul',
  open_time time,
  close_time time,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 서비스
create table services (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

-- 짐 유형
create table baggage_types (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null,
  requires_manual_review boolean not null default false,
  created_at timestamptz not null default now()
);

-- 서비스 규칙
create table service_rules (
  id uuid primary key default gen_random_uuid(),
  branch_id uuid references branches(id),
  branch_type_id uuid references branch_types(id),
  service_id uuid not null references services(id),
  baggage_type_id uuid references baggage_types(id),
  allowed boolean not null default true,
  requires_manual_review boolean not null default false,
  phase_code text not null default 'PHASE_1',
  reject_message_ko text,
  reject_message_en text,
  priority int not null default 100,
  created_at timestamptz not null default now()
);

-- 고객
create table customers (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  language_code text not null default 'en',
  email text,
  phone text,
  created_at timestamptz not null default now()
);

-- 예약
create table reservations (
  id uuid primary key default gen_random_uuid(),
  reservation_no text not null unique,
  customer_id uuid not null references customers(id),
  branch_id uuid not null references branches(id),
  service_id uuid not null references services(id),
  scheduled_at timestamptz not null,
  status text not null,
  ops_status text,
  issue_status text,
  risk_level text not null default 'low',
  approval_mode text not null default 'auto',
  currency text not null default 'KRW',
  total_amount numeric(12,2) not null default 0,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 예약 항목
create table reservation_items (
  id uuid primary key default gen_random_uuid(),
  reservation_id uuid not null references reservations(id) on delete cascade,
  baggage_type_id uuid not null references baggage_types(id),
  quantity int not null check (quantity > 0),
  size_note text,
  requires_manual_review boolean not null default false,
  created_at timestamptz not null default now()
);

-- 결제
create table payments (
  id uuid primary key default gen_random_uuid(),
  reservation_id uuid not null references reservations(id) on delete cascade,
  provider text not null,
  payment_key text,
  status text not null,
  amount numeric(12,2) not null,
  paid_at timestamptz,
  failed_reason text,
  created_at timestamptz not null default now()
);

-- 배송 배정
create table delivery_assignments (
  id uuid primary key default gen_random_uuid(),
  reservation_id uuid not null references reservations(id) on delete cascade,
  driver_name text,
  driver_phone text,
  assigned_at timestamptz,
  eta timestamptz,
  sla_due_at timestamptz,
  status text not null default 'unassigned',
  created_at timestamptz not null default now()
);

-- 증빙
create table proof_assets (
  id uuid primary key default gen_random_uuid(),
  reservation_id uuid not null references reservations(id) on delete cascade,
  asset_type text not null,
  file_url text not null,
  uploaded_by text,
  created_at timestamptz not null default now()
);

-- 이슈 티켓
create table issue_tickets (
  id uuid primary key default gen_random_uuid(),
  reservation_id uuid not null references reservations(id) on delete cascade,
  issue_code text not null,
  severity text not null default 'medium',
  status text not null default 'open',
  title text not null,
  description text,
  assigned_to text,
  opened_at timestamptz not null default now(),
  resolved_at timestamptz
);

-- 운영 상태 로그
create table operation_status_logs (
  id uuid primary key default gen_random_uuid(),
  reservation_id uuid not null references reservations(id) on delete cascade,
  from_status text,
  to_status text not null,
  changed_by text not null,
  reason text,
  created_at timestamptz not null default now()
);

-- AI 출력
create table ai_outputs (
  id uuid primary key default gen_random_uuid(),
  use_case text not null,
  source_ref text,
  input_context jsonb not null default '{}'::jsonb,
  generated_text text not null,
  risk_score numeric(5,2) not null default 0,
  policy_passed boolean not null default false,
  approval_status text not null default 'review_pending',
  reviewer_id text,
  published_at timestamptz,
  created_at timestamptz not null default now()
);

-- AI 검수 로그
create table ai_review_logs (
  id uuid primary key default gen_random_uuid(),
  ai_output_id uuid not null references ai_outputs(id) on delete cascade,
  check_type text not null,
  result text not null,
  detail text,
  created_at timestamptz not null default now()
);

-- 알림
create table notifications (
  id uuid primary key default gen_random_uuid(),
  reservation_id uuid references reservations(id) on delete cascade,
  channel text not null,
  template_code text not null,
  recipient text not null,
  status text not null default 'queued',
  sent_at timestamptz,
  created_at timestamptz not null default now()
);

-- 감사 로그
create table audit_logs (
  id uuid primary key default gen_random_uuid(),
  entity_type text not null,
  entity_id text not null,
  action text not null,
  actor text not null,
  before_data jsonb,
  after_data jsonb,
  created_at timestamptz not null default now()
);
```

---

## 8. Supabase RLS 정책 초안

권장 role 구조: admin, ops_manager, ops_staff, finance, marketing, content_manager, driver, customer

핵심 정책:
- customers: 본인 프로필만 조회
- reservations: 고객은 본인만 / admin+ops_manager 전체
- payments: 고객 본인 + admin+ops_manager+finance
- issue_tickets: admin+ops_manager+ops_staff
- proof_assets: admin+ops_manager+driver
- ai_outputs: admin+ops_manager+marketing+content_manager
- audit_logs: admin only

---

## 9. API 명세 초안

### 9-1. Reservation APIs
- `POST /api/reservations/validate` — 예약 가능 여부 사전 판정
- `POST /api/reservations` — 예약 생성
- `GET /api/reservations/:id` — 예약 상세 조회
- `PATCH /api/reservations/:id/status` — 예약 상태 변경

### 9-2. Payment APIs
- `POST /api/payments/confirm` — 결제 승인 처리
- `POST /api/payments/webhook` — 결제사 웹훅 수신
- `POST /api/payments/refund` — 환불 처리

### 9-3. Operations APIs
- `POST /api/ops/assign-driver` — 기사 배정
- `PATCH /api/ops/reservations/:id/ops-status` — 운영 상태 변경
- `POST /api/ops/reservations/:id/proofs` — 증빙 업로드
- `POST /api/issues` — 이슈 생성
- `PATCH /api/issues/:id` — 이슈 상태 업데이트

### 9-4. AI APIs
- `POST /api/ai/generate` — AI 초안 생성
- `POST /api/ai/review` — 자동 검사 및 검수 로그 저장
- `PATCH /api/ai/outputs/:id/approve` — AI 출력 승인
- `PATCH /api/ai/outputs/:id/reject` — AI 출력 반려

### 9-5. Rules APIs
- `GET /api/rules` — 규칙 조회
- `POST /api/rules` — 규칙 생성
- `PATCH /api/rules/:id` — 규칙 수정
- `POST /api/rules/simulate` — 테스트 시뮬레이션

---

## 10. Next.js 프로젝트 폴더 구조 초안

```
apps/web/app/
  (public)/
    page.tsx                    ← 랜딩
    reservation/page.tsx        ← 예약
    reservation/result/page.tsx ← 예약 결과
  api/
    reservations/               ← 예약 API
    payments/                   ← 결제 API
    ops/                        ← 운영 API
    issues/                     ← 이슈 API
    ai/                         ← AI API
    rules/                      ← 규칙 API
  dashboard/
    page.tsx                    ← 관리자 메인
    reservations/page.tsx       ← 예약 검토함
    ops-board/page.tsx          ← 실시간 운영 보드
    issues/page.tsx             ← 이슈 센터
    ai-review/page.tsx          ← AI 검수함
    rules/page.tsx              ← 규칙 관리
    analytics/page.tsx          ← KPI 대시보드

packages/
  db/migrations/ seeds/ policies/ functions/
  ui/ config/ shared/
```

---

## 11. 관리자 화면별 작업지시서

### 11-1. 예약 검토함
위험도/지점유형/서비스유형 배지, 보류사유 태그, 승인/반려/추가정보요청 버튼.
단건 클릭 사이드패널, 최근 로그 5개, 반려 템플릿 메시지, 대체지점 추천.

### 11-2. 실시간 운영 보드
칸반형 상태 보드, SLA 타이머, ETA 표시, 기사 배정, 증빙 아이콘, 이슈 아이콘.
drag & drop 금지 — 규칙 기반 버튼으로만 전이 허용.

### 11-3. 이슈 센터
issue_code별 템플릿, 고객 대기/내부 대기 분리, 해결 완료 시 회고 태그 필수.

### 11-4. AI 검수함
use_case 필터, 위험 점수, 금지어/미운영 검사, 원문/수정본 비교.
고위험 use_case 관리자 승인 필수.

### 11-5. 규칙 관리 페이지
지점별 규칙 테이블, 서비스 토글, 수동검토 토글, 우선순위, 언어별 메시지.
규칙 수정 시 audit log 필수, 미래 적용일, 충돌 시 저장 차단.

---

## 12. 개발 진행 순서

| 차수 | 작업 |
|------|------|
| **1차** | branch/service/baggage/rules 테이블, validate API, 예약 생성/조회, 상태 머신 기본, 예약 검토함 1차 |
| **2차** | 결제 confirm/webhook/refund, 운영 상태 변경, 증빙 업로드, 이슈 센터, 알림 연동 |
| **3차** | 실시간 운영 보드, SLA 타이머, 감사 로그 고도화, 규칙 관리 페이지 |
| **4차** | AI generate/review/approve 흐름, AI 검수함, KPI 대시보드, 규칙 시뮬레이터 |
| **5차** | 재배차 추천, ETA 예측 고도화, 지점별 운영 예측, 이상 탐지 자동화 |

---

## 13. 최종 요약

> 예약, 운영, AI, 관리자 업무를
> "사람의 감"이 아니라 "규칙 + 상태 + 로그 + 검수"로 움직이게 만드는 구조
