---
name: beeliber_ai_harness
description: Layer 4 AI Harness — AI 생성·자동검사·승인·배포 통제. AI 콘텐츠 생성, 검수, 자동 안내 작업 시 필수 참조.
---

# 🤖 Beeliber AI Harness (Layer 4)

원문: `docs/beeliber_harness_engineering_v1.md` § 5-6, 6-4

---

## AI 상태 머신

```
ai_generated → ai_policy_failed (자동 검사 실패)
             → ai_review_pending (검사 통과, 사람 검수 대기)
               → ai_approved → ai_published
               → ai_rejected
```

---

## AI 검수 대상

| use_case | 설명 | 위험도 |
|----------|------|--------|
| ad_copy | 광고 카피 | 높음 |
| sns_post | SNS 문구 (샤오홍슈·Threads·X) | 높음 |
| branch_guide | 지점 안내문 | 중간 |
| cs_reply | 고객 응답 초안 | 높음 |
| translation | 다국어 번역 | 중간 |
| b2b_proposal | B2B 제안서 초안 | 높음 |

> 고위험 use_case → **관리자 승인 필수**

---

## 자동 검사 항목 (Policy Check)

| 검사 | 통과 기준 | 실패 시 |
|------|---------|--------|
| 미운영 서비스 언급 | 공항→호텔, 호텔픽업, Phase 2 서비스 없음 | `ai_policy_failed` |
| 금지어 포함 | `beeliber_master` 금지어 목록 대조 | `ai_policy_failed` |
| 브랜드 톤 이탈 | Active/Balance/Trust 모드 기준 | 경고 + 수동검수 |
| 가격/정책 환각 | `beeliber_pricing` 기준값과 불일치 | `ai_policy_failed` |
| 확정적 표현 과다 | "보장", "완전", "무조건" 등 | 경고 + 수동검수 |
| 운영시간 오류 | 09:00~21:00 외 시간 언급 | `ai_policy_failed` |

---

## AI 검수함 UI (FSD 5-6)

**필수 UI**:
- use_case 필터
- 위험 점수 표시
- 금지어 검사 결과 (통과/실패 + 해당 단어 하이라이트)
- 미운영 서비스 검사 결과
- 원문 / 수정본 비교 (diff view)

**액션**:
- 승인 → `ai_approved`
- 수정 후 승인 → 수정본 저장 + `ai_approved`
- 반려 → `ai_rejected` + 반려 사유
- 프롬프트 수정 요청 → 재생성 요청

**개발 포인트**:
- 승인 전 검사 로그 펼쳐보기
- 반려 preset 메시지
- 프롬프트 개선 요청 필드

---

## API

| 엔드포인트 | 기능 |
|-----------|------|
| `POST /api/ai/generate` | AI 초안 생성 |
| `POST /api/ai/review` | 자동 검사 + `ai_review_logs` 저장 |
| `PATCH /api/ai/outputs/:id/approve` | 승인 |
| `PATCH /api/ai/outputs/:id/reject` | 반려 |

---

## 관련 DB 테이블

- `ai_outputs` — 생성된 텍스트, risk_score, policy_passed, approval_status
- `ai_review_logs` — 개별 검사 항목 결과 (check_type, result, detail)

---

## beeliber_master 연동

AI 검사 시 아래 스킬 기준을 자동 대조:
- `beeliber_master` → 금지어, 서비스 범위, 채널 현황
- `beeliber_pricing` → 가격 기준값
- `beeliber_design` → 브랜드 톤 (Active/Balance/Trust)
