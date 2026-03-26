---
name: beeliber_operations
description: Layer 3 Operations Harness — 보관·픽업·배송·인계·SLA·예외처리 통제. 운영 상태 전이, 기사 배정, 증빙, 이슈 관련 작업 시 필수 참조.
---

# 🚚 Beeliber Operations Harness (Layer 3)

원문: `docs/beeliber_harness_engineering_v1.md` § 5-4, 5-5, 6-2, 6-3

---

## 운영 상태 머신

```
pickup_ready → pickup_completed → in_transit → arrived_at_destination
  → handover_pending → handover_completed → completed
```

**전이 규칙**:
- 상태 전환은 **규칙 기반 버튼만 허용** (drag & drop 금지)
- 전환 시 `operation_status_logs` 에 from/to/changed_by/reason 기록 필수
- 상태 정체 10분 이상 → 자동 경고
- ETA 초과 시 → 자동 경고
- 증빙 누락 시 → 관리자 알림
- 고객 미응답 시 → issue 자동 생성

---

## 실시간 운영 보드 (FSD 5-4)

**칸반 컬럼**: 예약 접수 → 결제 완료 → 예약 확정 → 픽업 준비 → 픽업 완료 → 이동 중 → 인계 대기 → 완료 / 이슈

**카드 정보**: 예약번호, 고객명, 지점, 기사, ETA, SLA 상태, 증빙 유무, 위험도

**개발 포인트**:
- 실시간 갱신 (polling 또는 realtime subscription)
- 이슈 발생 카드 강조
- SLA 타이머 표시

---

## 기사 배정

**API**: `POST /api/ops/assign-driver`
- 배정 시 `delivery_assignments` 생성
- ETA + SLA 마감 시간 자동 계산
- 미배정 상태 일정 시간 경과 → 자동 경고

---

## 증빙 관리

**API**: `POST /api/ops/reservations/:id/proofs`
- 픽업/인계 시점에 사진 증빙 업로드
- `proof_assets` 테이블: asset_type (pickup_photo / handover_photo / damage_photo)
- 증빙 누락 시 completed 전환 차단 또는 경고

---

## 이슈 센터 (FSD 5-5)

### 이슈 유형
| 코드 | 설명 |
|------|------|
| CUSTOMER_NO_RESPONSE | 고객 미응답 |
| BRANCH_HOURS_MISMATCH | 지점 영업시간 불일치 |
| DRIVER_DELAY | 기사 지연 |
| ADDRESS_ERROR | 주소 오류 |
| PROOF_MISSING | 증빙 누락 |
| SIZE_MISMATCH | 짐 규격 상이 |
| POST_PAYMENT_BLOCK | 결제 후 운영 불가 |
| DAMAGE_SUSPECTED | 파손/분실 의심 |
| AIRPORT_HANDOVER_FAIL | 공항 인계 실패 |

### 이슈 상태 머신
```
issue_open → issue_in_progress → issue_waiting_customer / issue_waiting_internal
  → issue_resolved → issue_closed
```

### 개발 포인트
- issue_code별 템플릿 제공
- 고객 대기 / 내부 대기 분리
- 해결 완료 시 **회고 태그 필수**
- 담당자 지정 + 우선순위 + 고객 대응 로그

---

## 관련 DB 테이블

- `delivery_assignments` — 기사 배정, ETA, SLA
- `proof_assets` — 증빙 파일
- `issue_tickets` — 이슈 코드, 심각도, 담당자
- `operation_status_logs` — 상태 전이 기록
- `notifications` — 알림 발송 기록

---

## SLA 기준 (Phase 1)

| 구간 | SLA |
|------|-----|
| 예약확정 → 픽업준비 | 즉시 (자동) |
| 픽업준비 → 픽업완료 | 영업시간 내 |
| Hub → 공항 이동 | 3시간 이내 |
| 공항 도착 → 인계완료 | 30분 이내 |
