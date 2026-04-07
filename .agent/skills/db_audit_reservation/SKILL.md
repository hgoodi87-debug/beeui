---
name: db_audit_reservation
description: "DB 검수 서브에이전트 — RESERVATION CORE 섹션. customers, reservations, reservation_items, booking_details, payments, delivery_assignments, proof_assets, issue_tickets, operation_status_logs, notifications 테이블 검증."
---

# DB 검수: RESERVATION CORE

## 담당 테이블
- `customers` — 고객 정보
- `services` — 서비스 종류 (DELIVERY, STORAGE)
- `baggage_types` — 짐 유형
- `service_rules` — 서비스별 짐 유형 허용/제한 규칙
- `reservations` — 예약 마스터 ★
- `reservation_items` — 예약 짐 항목
- `booking_details` — 상세 예약 정보 (51 cols) ★
- `payments` — 결제 내역
- `delivery_assignments` — 배송 배정
- `proof_assets` — 증빙 사진
- `issue_tickets` — 이슈 티켓
- `operation_status_logs` — 운영 상태 변경 로그
- `notifications` — 알림

## 검수 체크리스트

### 1. 스키마 무결성
- [ ] reservations.reservation_no UNIQUE NOT NULL 확인
- [ ] reservations → customers, branches, services FK 확인
- [ ] reservation_items → reservations (CASCADE), baggage_types FK 확인
- [ ] booking_details → reservations (CASCADE) FK 확인
- [ ] booking_details → locations (pickup_location_id, dropoff_location_id) FK 확인
- [ ] payments → reservations (CASCADE) FK 확인
- [ ] delivery_assignments → reservations (CASCADE) FK 확인
- [ ] reservation_items.quantity > 0 CHECK 제약 확인
- [ ] payments.amount NOT NULL 확인

### 2. 상태 머신 검증
- [ ] reservations.status 허용값: lead_created, validation_passed, manual_review_required, rejected, payment_pending, payment_completed, reservation_confirmed, cancelled
- [ ] reservations.ops_status 허용값: pickup_ready, pickup_completed, in_transit, arrived_at_destination, handover_pending, handover_completed, completed (+ NULL)
- [ ] reservations.issue_status 허용값: issue_open ~ issue_closed (+ NULL)
- [ ] delivery_assignments.status 허용값: unassigned ~ cancelled
- [ ] payments.status 허용값: pending, paid, failed, refunded
- [ ] 상태 전이 규칙 위반 데이터가 없는지 (예: status=lead_created인데 ops_status가 completed)

### 3. RLS 정책 검증
- [ ] booking_details: public INSERT 허용 (고객 예약 생성)
- [ ] reservations: public INSERT 허용
- [ ] booking_details: customer_read는 reservation_id → reservations.customer_id = auth.uid()
- [ ] payments: employee_all은 역할 기반 접근
- [ ] delivery_assignments: driver 역할 포함 확인

### 4. 데이터 정합성
- [ ] booking_details에서 reservation_id가 NULL인 행이 없는지
- [ ] reservations에서 customer_id가 customers에 존재하는지
- [ ] reservations에서 branch_id가 branches에 존재하는지
- [ ] booking_details.pickup_location_id가 locations에 존재하는지
- [ ] booking_details.final_price와 payments.amount 합계가 일치하는지
- [ ] reservation_code가 중복되지 않는지

### 5. 트리거 검증
- [ ] on_booking_details_insert 트리거 → trigger_on_booking_created Edge Function 호출
- [ ] on_booking_details_update 트리거 → trigger_on_booking_updated Edge Function 호출
- [ ] 트리거 함수 내 URL이 올바른 프로젝트를 가리키는지

## 검수 SQL 예시

```sql
-- 예약번호 중복 확인
SELECT reservation_no, count(*)
FROM reservations GROUP BY reservation_no HAVING count(*) > 1;

-- 상태 이상: 결제 완료인데 ops_status가 NULL
SELECT id, reservation_no, status, ops_status
FROM reservations
WHERE status = 'reservation_confirmed' AND ops_status IS NULL;

-- booking_details에 reservation_id 없는 행
SELECT bd.id FROM booking_details bd
LEFT JOIN reservations r ON bd.reservation_id = r.id
WHERE r.id IS NULL;

-- 결제 금액 불일치
SELECT r.id, r.total_amount, sum(p.amount) as paid
FROM reservations r
JOIN payments p ON p.reservation_id = r.id AND p.status = 'paid'
GROUP BY r.id, r.total_amount
HAVING r.total_amount != sum(p.amount);
```

## 연관 스킬
- `beeliber_pricing` — 가격 정책 + 계산 로직
- `beeliber_payments` — Toss Payments 실배포
- `beeliber_operations` — 상태머신·SLA·기사배정
