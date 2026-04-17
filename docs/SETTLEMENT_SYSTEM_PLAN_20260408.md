# 빌리버 예산 관리 및 정산 체계 현황 & 개선 계획

> **[상태] ✅ 계획 완료** — CHANGELOG v1.3.0.0 (2026-04-08) 기준 Phase 1~3 구현 완료.
> 실제 구현 현황은 `client/components/admin/DailySettlementTab.tsx`, `MonthlySettlementTab.tsx`, `AccountingTab.tsx` 참조.
> 본 문서는 역사적 참조용으로 유지. 신규 정산 개선은 `TODOS.md` [A1~A2] 항목 참조.
>
> 작성일: 2026-04-08 | 작성자: Claude (하네스 보조) | 버전: 1.0

---

## 요약 (Executive Summary)

빌리버의 정산 시스템은 **기초 인프라(DB 뷰·UI 탭)는 갖춰져 있으나, 운영 자동화와 데이터 정합성이 미흡**한 상태다.
현재 일일 마감·지출 입력·수익 통계는 동작하지만, 지점별 수익 배분 자동화, 보험료 추적, 월 마감 저장, Enum 상태 관리 등 핵심 기능이 누락되어 실무 정산에 수동 작업이 과다하다.

**3단계 로드맵**으로 6~8주 내 운영 자동화 완료를 목표로 한다.

---

## 1. 현재 구현 현황

### 1.1 데이터 흐름 (현재)

```
[예약 생성]
    ↓
booking_details
  ├─ base_price (기본료)
  ├─ discount_amount (할인액)
  ├─ final_price (최종 청구액)
  ├─ settlement_status (문자열: 'CONFIRMED' | 'deleted')
  ├─ settled_at / settled_by
  ├─ branch_commission_delivery / _storage (%)
  └─ branch_settlement_amount

    ↓ (수동 마감)
daily_closings
  ├─ 날짜별 결제수단별 매출 수동 입력
  ├─ actual_cash_on_hand (실제 현금 시재)
  └─ difference (차액)

    ↓ (DB VIEW 자동 집계)
admin_revenue_daily_v1
  └─ confirmed_amount / unconfirmed_amount / partner_payout_total

    ↓ (DB VIEW 월 합산)
admin_revenue_monthly_v1

    ↓ (UI 리포트)
AccountingTab / DailySettlementTab / MonthlySettlementTab
```

### 1.2 구현된 기능 목록

| 기능 | 탭/위치 | 상태 |
|------|---------|------|
| 완료 처리 시 정산 확정 | LogisticsTab / AdminDashboard | ✅ 2026-04-08 추가 |
| 일괄 완료 시 정산 확정 | LogisticsTab / AdminDashboard | ✅ 2026-04-08 추가 |
| 미정산 건 금융 대조 페이지 | 제거됨 | ✅ 2026-04-08 제거 |
| 감사 로그 기록 | AuditService | ✅ 동작 |
| 일일 매출 현황 | DailySettlementTab | ✅ 동작 |
| 일일 마감 입력 | DailySettlementTab | ✅ 동작 |
| 지출 입력/삭제 | DailySettlementTab / AccountingTab | ✅ 동작 |
| 지출 비용 유형 (고정/변동) | expenditures.cost_type | ✅ 2026-04-07 추가 |
| 지출 결제 유형 (법인카드/개인) | expenditures.payment_type | ✅ 2026-04-07 추가 |
| 매출 통계 (일별/월별) | AccountingTab | ✅ 동작 |
| CSV 내보내기 | AccountingTab | ✅ 동작 |
| XLSX 내보내기 (손익계산서) | AccountingTab | ✅ 동작 |
| 할인코드 사용 리포트 | DailySettlementTab | ✅ 동작 |
| 취소/환불 금액 분리 | admin_revenue_daily_v1 | ✅ 동작 |
| 월별 KPI 통계 | MonthlySettlementTab | ✅ UI 있음 |
| 크레딧 계정 | credit_accounts | ⚠️ DB만 있음 |
| 지점별 수익 배분 자동화 | - | ❌ 미구현 |
| 보험료 별도 추적 | - | ❌ 미구현 |
| 월 마감 데이터 저장 | - | ❌ 미구현 |
| 지점 지급 확정 기록 | - | ❌ 미구현 |
| 부분 환불 정산 | - | ❌ 미구현 |

### 1.3 가격 계산 로직 (현재)

**보관료 (STORAGE)**

| 짐 유형 | 4시간 기본 | 시간당(+4h) | 1일 | 추가일 | 7일 패키지 |
|---------|-----------|------------|-----|-------|-----------|
| 손가방/쇼핑백 | ₩4,000 | ₩1,000 | ₩8,000 | ₩6,000 | ₩44,000 |
| 캐리어 | ₩5,000 | ₩1,000 | ₩10,000 | ₩8,000 | ₩58,000 |
| 유모차/자전거 | ₩10,000 | ₩2,500 | ₩14,000 | ₩10,000 | ₩74,000 |

- 시간 경계: `≤4h → 기본요금` / `5~7h → 기본+시간당` / `8~24h → 1일` / `25h+ → 추가일`
- 7일 이상: 누적액과 7일 패키지 중 유리한 금액 적용
- 영업 마감 초과 시 → 자동 1일 청구 (KST 기준)

**배송 보관료 (DELIVERY)**
- 출발 당일 ~ 배송일 전날까지 일수 × `day1 + (n-1) × extraDay`
- `price_settings` 테이블에서 로드, 없으면 기본값 fallback

**보험료**
- 선택 시: `₩5,000 × insuranceLevel × max(1, totalBags)`
- insuranceLevel: 1~3 (배수)

**총액 계산**
```
총액 = 기본료 + 출발지 할증 + 도착지 할증 + 보험료 - 할인액
```

---

## 2. 핵심 문제점 (Gap Analysis)

### 🔴 긴급 (운영 정합성 문제)

#### G-1. settlement_status 문자열 기반 → Enum 불일치
- `booking_details.settlement_status`: raw 문자열 (`'CONFIRMED'`, `'deleted'`)
- `admin/types.ts`의 `SettlementStatus` enum은 별개로 정의되어 있어 불일치 위험
- 오타나 새 상태 추가 시 조용한 버그 발생 가능

#### G-2. 보험료 booking_details 미저장
- 보험료는 `BookingPage`에서 계산되지만 `booking_details`에 별도 컬럼 없음
- 정산 시 보험 수익 항목 분리 불가
- 보험사 보고서, 리스크 추적 불가

#### G-3. branch_commission / branch_settlement_amount 미채움
- 컬럼은 존재하지만 예약 저장 시 값이 채워지지 않음
- DailySettlementTab에서 `b.branchSettlementAmount || 0` (기본값 0) 표시 중
- 지점별 실제 수익 배분 추적 불가

#### G-4. 중복 예약 체크 쿼리 UUID 불일치
- `BookingPage.tsx:566`: `pickup_location_id=eq.${booking.pickupLocation}` (short_code 사용)
- DB 컬럼은 UUID 타입 → 조용히 catch되고 진행되지만, 중복 예약 감지 실패

---

### 🟡 중간 (운영 효율 저하)

#### G-5. 월 마감 데이터 저장소 없음
- `monthly_summaries` 테이블 미존재
- 월별 최종 정산 상태(마감 완료/진행 중) 저장 방법 없음
- MonthlySettlementTab의 `onSettlementClose()` 콜백이 구현되지 않음

#### G-6. 지점별 정산 지급 확정 기록 없음
- `onBulkPayoutConfirm()` 콜백 UI만 있고 실제 저장 로직 없음
- 지점에 얼마를 언제 지급했는지 이력 없음

#### G-7. 부분 환불 정산 미지원
- `PARTIAL_REFUND` 상태 정산 로직 없음
- 환불 후 정산 재처리 방법 없음 (settled_at 덮어쓰기만 가능)

#### G-8. 크레딧 계정 정산 연동 없음
- `credit_accounts` 테이블 존재하지만
- 예약 결제 시 크레딧 차감 → 정산액 감소 로직 없음
- 정산 리포트에 크레딧 사용 항목 없음

---

### 🟢 개선 (완성도 향상)

#### G-9. VAT(부가세) 계산 출처 불명
- `revenueStats.vat` 계산 로직 확인 필요
- 한국 면세 조건(관광객 환급 등) 미적용 여부 확인 필요

#### G-10. 정산 Edge Function 없음
- 일일 마감 자동 집계, 월 정산 트리거, 배분 자동화 함수 없음
- 모든 집계를 클라이언트 VIEW에 의존 → 복잡한 비즈니스 로직 처리 한계

#### G-11. 결제수단별 매출 수동 입력
- `daily_closings`에 결제수단별 매출은 담당자가 수동 입력
- 실제 Toss Payments 데이터와 자동 대조 없음

---

## 3. 개선 작업 목록 (Work Items)

### Phase 1 — 데이터 정합성 (1~2주)

| # | 작업 | 파일 | 우선순위 |
|---|------|------|---------|
| W-1 | `settlement_status` DB CHECK 제약 + TypeScript Enum 통일 | `supabase/migrations/` + `admin/types.ts` | 🔴 긴급 |
| W-2 | `booking_details`에 `insurance_fee` 컬럼 추가 + 저장 로직 | migration + `storageService.ts` | 🔴 긴급 |
| W-3 | `branch_commission_*` / `branch_settlement_amount` 예약 저장 시 자동 채움 | `storageService.ts:saveBooking()` | 🔴 긴급 |
| W-4 | 중복 예약 체크 쿼리 UUID 수정 (`pickupLoc?.supabaseId` 사용) | `BookingPage.tsx:566` | 🟡 중간 |

**W-1 상세**: `settlement_status` 정의

```sql
-- 마이그레이션
ALTER TABLE booking_details
  ADD CONSTRAINT chk_settlement_status
  CHECK (settlement_status IN ('PENDING', 'CONFIRMED', 'ON_HOLD', 'MONTHLY_INCLUDED', 'PAID_OUT', 'DELETED'));

-- 기존 'deleted' → 'DELETED' 업데이트
UPDATE booking_details SET settlement_status = 'DELETED' WHERE settlement_status = 'deleted';
UPDATE booking_details SET settlement_status = 'PENDING' WHERE settlement_status IS NULL;
```

**W-2 상세**: `insurance_fee` 컬럼

```sql
ALTER TABLE booking_details ADD COLUMN insurance_fee INTEGER DEFAULT 0;
```

```typescript
// storageService.ts:saveBooking() bookingData에 추가
insurance_fee: safeBooking.insuranceFee || 0,
```

**W-3 상세**: `branch_settlement_amount` 자동 계산

```typescript
// BookingPage 또는 storageService에서
// 지점 수수료 적용 (예: 배송 20%, 보관 15%)
const commissionRate = serviceType === 'DELIVERY'
  ? pickupLoc?.deliveryCommission || 0.20
  : pickupLoc?.storageCommission || 0.15;
const branchSettlementAmount = Math.floor(finalPrice * commissionRate);
```

---

### Phase 2 — 운영 자동화 (2~4주)

| # | 작업 | 파일 | 우선순위 |
|---|------|------|---------|
| W-5 | `monthly_closings` 테이블 추가 (월 마감 이력) | `supabase/migrations/` | 🟡 중간 |
| W-6 | MonthlySettlementTab `onSettlementClose()` 실제 저장 구현 | `AdminDashboard.tsx` | 🟡 중간 |
| W-7 | 지점 지급 확정 테이블 + 이력 UI | `branch_payouts` 테이블 신규 | 🟡 중간 |
| W-8 | `credit_accounts` → 예약 정산 연동 | `storageService.ts` | 🟡 중간 |
| W-9 | 부분 환불 정산 로직 | 정산 조정 UI 신규 | 🟡 중간 |
| W-10 | Toss Payments 거래 데이터 자동 대조 | Edge Function 신규 | 🟡 중간 |

**W-5 상세**: `monthly_closings` 스키마

```sql
CREATE TABLE monthly_closings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  month DATE NOT NULL,                        -- 월 기준일 (예: 2026-04-01)
  branch_id UUID REFERENCES branches(id),
  total_revenue INTEGER NOT NULL DEFAULT 0,
  confirmed_amount INTEGER NOT NULL DEFAULT 0,
  partner_payout_total INTEGER NOT NULL DEFAULT 0,
  net_profit INTEGER NOT NULL DEFAULT 0,
  is_closed BOOLEAN DEFAULT FALSE,
  closed_at TIMESTAMPTZ,
  closed_by TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

**W-7 상세**: `branch_payouts` 스키마

```sql
CREATE TABLE branch_payouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  branch_id UUID NOT NULL REFERENCES branches(id),
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  total_amount INTEGER NOT NULL,
  payment_method TEXT,                        -- 'bank_transfer' | 'cash'
  bank_account TEXT,
  paid_at TIMESTAMPTZ,
  paid_by TEXT,
  confirmed_by TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

---

### Phase 3 — 서버사이드 자동화 (4~8주)

| # | 작업 | 파일 | 우선순위 |
|---|------|------|---------|
| W-11 | 일일 매출 자동 집계 Edge Function (자정 cron) | `supabase/functions/daily-settlement-cron/` | 🟢 개선 |
| W-12 | 지점별 수익 배분 자동 계산 Edge Function | `supabase/functions/branch-payout-calculator/` | 🟢 개선 |
| W-13 | VAT(부가세) 계산 공식화 + 면세 조건 적용 | `AccountingTab.tsx` + `storageService.ts` | 🟢 개선 |
| W-14 | 정산 알림 (Slack/카카오톡) | Edge Function | 🟢 개선 |
| W-15 | 월 정산 PDF 자동 생성 | Edge Function or client | 🟢 개선 |

**W-11 상세**: 일일 정산 자동화

```typescript
// supabase/functions/daily-settlement-cron/index.ts
// Supabase cron: 매일 02:00 KST (17:00 UTC)
// 1. admin_revenue_daily_v1에서 전일 집계
// 2. daily_closings에 자동 INSERT (확정값만)
// 3. unconfirmed 건 수 알림
```

---

## 4. 데이터 흐름 (목표 아키텍처)

```
[예약 생성]
    ↓
booking_details
  ├─ base_price
  ├─ insurance_fee         ← W-2 신규
  ├─ discount_amount
  ├─ final_price
  ├─ branch_commission_%   ← W-3 자동 채움
  ├─ branch_settlement_amount ← W-3 자동 계산
  └─ settlement_status (ENUM) ← W-1 통일

    ↓ (완료 처리 시 정산 확정)
LogisticsTab / AdminDashboard
  └─ settlement_status = 'CONFIRMED'

    ↓ (자동 집계 - W-11)
admin_revenue_daily_v1 VIEW

    ↓ (지점 지급 확정 - W-7)
branch_payouts
  └─ 지점별 지급 이력

    ↓ (월 마감 - W-5/W-6)
monthly_closings
  └─ 월별 확정 이력

    ↓ (Toss 자동 대조 - W-10)
Toss Payments API ←→ daily_closings

    ↓ (리포트)
AccountingTab / DailySettlementTab / MonthlySettlementTab
  └─ VAT 공식화 (W-13)
```

---

## 5. 정산 상태 체계 (목표)

### 예약 레벨 (`booking_details.settlement_status`)

| 상태 | 의미 | 전환 트리거 |
|------|------|------------|
| `PENDING` | 정산 대기 | 기본값 (예약 완료 시) |
| `CONFIRMED` | 정산 확정 | 배송/보관 예약 완료 처리 |
| `ON_HOLD` | 정산 보류 | 이슈 발생 시 |
| `MONTHLY_INCLUDED` | 월정산 반영 | 월 마감 실행 시 |
| `PAID_OUT` | 지점 지급 완료 | branch_payouts 생성 시 |
| `DELETED` | 정산 제외 | 담당자 삭제 |

### 월 레벨 (`monthly_closings.is_closed`)

```
미마감(is_closed=false) → 담당자 검토 → 마감 확정(is_closed=true) → PDF 생성
```

---

## 6. 작업 우선순위 요약

```
🔴 이번 주 (긴급): W-1, W-2, W-3, W-4
   → 데이터 정합성 확보. 현재 정산 데이터 신뢰도 문제.

🟡 다음 2주 (중간): W-5, W-6, W-7, W-8, W-9, W-10
   → 운영 자동화. 수동 작업 최소화.

🟢 이후 (개선): W-11, W-12, W-13, W-14, W-15
   → 서버사이드 자동화 및 세금 처리 공식화.
```

---

## 7. 예상 일정

| 주차 | 작업 | 결과물 |
|------|------|--------|
| 1주차 | W-1 Enum 통일, W-2 보험료 컬럼, W-3 수수료 자동화 | 정산 데이터 정합성 확보 |
| 2주차 | W-4 UUID 수정, W-5 monthly_closings 테이블 | 중복예약 감지 + 월마감 기반 |
| 3주차 | W-6 월마감 저장, W-7 지점 지급 이력 | 월정산 완전 동작 |
| 4주차 | W-8 크레딧 연동, W-9 부분환불, W-10 Toss 대조 | 특수 케이스 처리 |
| 5~6주차 | W-11 일일 cron, W-12 배분 자동화 | 서버사이드 자동화 |
| 7~8주차 | W-13 VAT, W-14 알림, W-15 PDF | 리포팅 완성 |

---

*본 보고서는 2026-04-08 기준 코드베이스 분석을 기반으로 작성되었습니다.*
*코드 참조: `supabase/migrations/`, `client/components/admin/`, `client/services/storageService.ts`*
