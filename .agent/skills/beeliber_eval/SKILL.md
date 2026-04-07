---
name: beeliber_eval
description: Layer 6 Eval Harness — KPI 측정, 실패 원인 분석, 지점별·기사별·AI 성능 평가. 대시보드·리포트 작업 시 필수 참조.
---

# 📊 Beeliber Eval Harness (Layer 6)

원문: `docs/beeliber_harness_engineering_v1.md` § 3-2, 5-8

---

## 핵심 KPI

### Commerce KPI
| KPI | 산출 | 목표 방향 |
|-----|------|---------|
| 예약→결제 완료율 | payment_completed / lead_created | ↑ 상승 |
| 결제→예약 확정률 | reservation_confirmed / payment_completed | ↑ 상승 |
| 수동 검토 비율 | manual_review / 전체 예약 | ↓ 합리화 |

### Operations KPI
| KPI | 산출 | 목표 방향 |
|-----|------|---------|
| 운영 지연률 | SLA 초과 건 / 전체 운영 건 | ↓ 감소 |
| 증빙 누락률 | 증빙 없는 completed 건 / 전체 | ↓ 감소 |
| 이슈 발생률 | issue_tickets / 전체 예약 | ↓ 감소 |
| 이슈 해결 시간 | resolved_at - opened_at 평균 | ↓ 단축 |
| 파손/분실 사고율 | DAMAGE_SUSPECTED 건 / 전체 | ↓ 감소 |

### AI KPI
| KPI | 산출 | 목표 방향 |
|-----|------|---------|
| AI 승인율 | ai_approved / ai_generated | ↑ 상승 |
| AI 반려율 | ai_rejected / ai_generated | ↓ 감소 |
| AI 정책 실패율 | ai_policy_failed / ai_generated | ↓ 감소 |
| 오안내 발생률 | 잘못된 정보 포함 건 | ↓ 감소 |

---

## KPI 대시보드 UI (FSD 5-8)

**필수 표시**:
- 기간 선택 (오늘 / 이번 주 / 이번 달 / 커스텀)
- KPI별 현재 값 + 추이 그래프
- 지점별 비교 테이블
- 기사별 비교 테이블 (운영 KPI)
- AI use_case별 비교 (AI KPI)

**드릴다운**:
- KPI 클릭 → 해당 예약/이슈/AI 출력 목록
- 지점 클릭 → 지점별 상세 KPI
- 기사 클릭 → 기사별 운영 성과

---

## 실패 원인 분석 구조

이슈 해결 시 반드시 **회고 태그**를 남긴다:

| 태그 | 의미 |
|------|------|
| `input_error` | 고객 입력 오류 |
| `rule_gap` | 규칙 미비 |
| `system_bug` | 시스템 버그 |
| `ops_delay` | 운영 지연 |
| `driver_error` | 기사 실수 |
| `branch_error` | 지점 실수 |
| `customer_no_show` | 고객 노쇼 |
| `external_factor` | 외부 요인 (교통 등) |

회고 태그는 `issue_tickets` 해결 시 필수 입력 → KPI 대시보드에서 원인별 분포 시각화.

---

## 성과 측정 주기

| 주기 | 대상 | 수행자 |
|------|------|--------|
| 일간 | 운영 보드 요약 (지연·이슈·증빙) | 운영팀 자동 |
| 주간 | KPI 추이 + 주요 이슈 회고 | 운영 리드 |
| 월간 | 전체 KPI + AI 성능 + 지점별 비교 | 경영진 |

---

## 관련 DB / 집계 소스

- `reservations` → Commerce KPI 산출
- `operation_status_logs` → 운영 지연 산출
- `proof_assets` → 증빙 누락 산출
- `issue_tickets` → 이슈 발생률 + 회고 태그
- `ai_outputs` + `ai_review_logs` → AI KPI 산출
- `audit_logs` → 규칙 변경 이력 대조
