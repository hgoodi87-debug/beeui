# Beeliber — Claude Admin Integration Plan
<!-- /autoplan restore point: /Users/cm/.gstack/projects/dbcjsaud-ycm-beeliber-main/codex-continue-after-restore-20260322-autoplan-restore-20260403-221623.md -->

**Branch:** `codex/continue-after-restore-20260322`
**Date:** 2026-04-03
**Author:** cm

---

## 문제 정의

빌리버 어드민에서 반복적인 운영 작업(지점 안내문 작성, 고객 응답 초안, 다국어 번역)을 수동으로 처리하고 있어 운영 비효율이 높다. 또한 AI가 생성한 콘텐츠가 브랜드 가이드(금지어, 미운영 서비스 언급 등)를 위반할 위험이 있어 자동 검수 체계가 필요하다.

**목표**: Claude를 어드민의 콘텐츠 생성 + 자동 검수 주체로 연동해 운영 효율 2배, 브랜드 가이드 준수율 100% 달성.

---

## 범위

### 포함
1. **AI 콘텐츠 생성 버튼** — AdminDashboard 내 지점 관리(LocationsTab)에 "AI 작성" 버튼 추가. 지점명·주소 입력 시 Claude가 en/zh-TW/zh-HK/ja 번역 초안 자동 생성
2. **자동 정책 검사** — 생성된 콘텐츠에 대해 beeliber_master 금지어 + 미운영 서비스 언급 자동 체크
3. **AI 검수 큐** — AdminDashboard 새 탭 "AI 검수함": ai_review_pending 상태 콘텐츠 목록, 원문/수정본 diff, 승인/반려 액션
4. **Supabase Edge Function** — `ai-content-gen` 함수: Claude API 호출 + 정책 검사 + DB 저장
5. **DB 스키마** — `ai_outputs` 테이블 + RLS

### 제외 (Phase 2)
- SNS 포스트 자동 생성 (샤오홍슈·Threads)
- B2B 제안서 초안
- CS 응답 자동화 (고객 직접 노출 위험)
- PayPal Live 전환 (인증 대기 중, 별도 작업)

---

## 기술 아키텍처

```
AdminDashboard (React)
  └── LocationsTab
        └── "AI 번역 생성" 버튼
              │
              ▼
  supabase/functions/ai-content-gen/index.ts
        ├── Claude API (claude-sonnet-4-6)
        │     └── system: beeliber_master 금지어 + 브랜드 톤 주입
        ├── policy_check() — 금지어·미운영 서비스·가격 환각 자동 검사
        └── INSERT ai_outputs (status: ai_review_pending | ai_policy_failed)
              │
              ▼
  AdminDashboard
  └── AIReviewTab (신규)
        ├── 콘텐츠 목록 (use_case 필터)
        ├── diff view (원문 ↔ AI 생성본)
        ├── 정책 검사 결과 (통과/실패 + 위반 단어 하이라이트)
        └── 승인/수정후승인/반려 액션
```

### DB 스키마

```sql
CREATE TABLE ai_outputs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  use_case TEXT NOT NULL,  -- 'translation' | 'branch_guide' | 'cs_reply'
  entity_id TEXT,          -- 지점 ID 등 연관 엔티티
  prompt_snapshot JSONB,   -- 사용된 프롬프트
  generated_content JSONB, -- {en, zh_tw, zh_hk, ja, ...}
  policy_check JSONB,      -- 검사 결과 {passed, violations: [...]}
  status TEXT DEFAULT 'ai_review_pending',
  reviewer_id UUID REFERENCES admin_users(id),
  reviewed_at TIMESTAMPTZ,
  final_content JSONB,     -- 승인된 최종 콘텐츠
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### RLS
- `ai_outputs` SELECT/INSERT: 인증된 관리자만
- `ai_outputs` UPDATE (승인/반려): 관리자만

---

## 구현 단계

### Step 1 — DB + Edge Function (1일)
- `supabase/migrations/20260404000001_ai_outputs.sql` 작성
- `supabase/functions/ai-content-gen/index.ts` 작성
  - Claude API 호출 (claude-sonnet-4-6)
  - 금지어 정책 검사 (beeliber_master 기반 하드코딩)
  - ai_outputs INSERT

### Step 2 — LocationsTab AI 버튼 (반일)
- `client/components/AdminDashboard.tsx` > LocationsTab
- "AI 번역 생성" 버튼 → ai-content-gen Edge Function 호출
- 로딩/성공/실패 상태 표시

### Step 3 — AIReviewTab 신규 탭 (1일)
- AdminDashboard 탭 추가: "AI 검수함"
- 콘텐츠 목록 (Supabase realtime 구독)
- diff view 컴포넌트
- 승인/반려 API 호출 + 상태 업데이트

### Step 4 — 번역 자동 적용 (반일)
- 승인 시 locations 테이블 번역 필드 자동 업데이트
- PATCH locations SET name_en=..., name_zh_tw=... WHERE id=...

---

## 성공 기준

- 지점 번역 생성 소요 시간: 30분 → 2분
- 브랜드 가이드 위반 자동 탐지율: >95%
- AIReviewTab에서 승인/반려 처리 가능

---

## 보안 고려사항

- Claude API 키는 Supabase secrets에만 저장 (클라이언트 노출 금지)
- 관리자 인증 토큰 검증 (Edge Function 내 Supabase Auth)
- 생성 콘텐츠는 직접 locations에 반영 금지 — 반드시 검수함 통과 필수
- Rate limiting: 관리자 ID당 분당 10회 요청 제한

---

## 위험 요소

| 위험 | 가능성 | 대응 |
|------|--------|------|
| Claude API 할당량 초과 | 낮음 | 요청당 비용 모니터링 |
| 금지어 검사 누락 | 중간 | 검수함 강제 통과로 완화 |
| 관리자 승인 없이 locations 업데이트 | 낮음 | 상태 머신 강제 + RLS |

---

## 디자인 결정 (Phase 2 리뷰)

### "AI 번역 생성" 버튼
- **위치**: 지점 편집 모달 내 번역 섹션 옆 (또는 LocationsTab 카드 우측 하단)
- **스타일**: `bg-yellow-400 text-black font-bold rounded-full px-4 py-2`
- **아이콘**: 🌐 prefix
- **로딩 상태**: "AI 생성 중..." 스피너, disabled
- **성공 상태**: "검수함에 저장됨 ✓" 토스트 알림

### 생성 → 검수 → 승인 플로우
```
[LocationsTab] 지점 선택 → "AI 번역 생성" 클릭
  → 로딩 3-5초 (Edge Function 호출)
  → 성공: "AI 검수함에 1건 추가됨" 배너
  → [AIReviewTab] 배지 카운트 증가 (빨간 숫자)

[AIReviewTab]
  → 목록: 지점명 / 생성일시 / 정책 통과여부 (✓ 통과 / ⚠ 위반)
  → 클릭 → 상세: 원문(한국어) | AI 생성본(en/zh-TW/zh-HK/ja) 2열 레이아웃
  → 정책 위반 시: 위반 단어 빨간 하이라이트
  → 액션 버튼: [승인] green / [수정 후 승인] yellow / [반려] red
  → 승인 시: locations 테이블 자동 업데이트 + 목록에서 제거
```

### 빈 상태
- AIReviewTab 항목 없음: "✨ 모두 검수했어요! 지점 탭에서 AI 번역을 생성해보세요."

---

## 엔지니어링 결정 (Phase 3 리뷰)

### 재활용 필수
- `supabase/functions/_shared/admin-auth.ts:298` `authenticateAdminRequest()` — Edge Function에서 import해 JWT 검증. 직접 구현 금지.
- 기존 Edge Function 패턴 (Deno + `SUPABASE_SERVICE_ROLE_KEY`) 그대로 따를 것.

### Rate Limiting 구현 방법
Supabase Edge Function에 built-in rate limit 없음. DB 기반으로:
```sql
-- ai-content-gen Edge Function 내부
SELECT COUNT(*) FROM ai_outputs
WHERE created_by = $uid AND created_at > NOW() - INTERVAL '1 minute'
-- COUNT >= 10이면 429 반환
```

### Supabase 시크릿 등록 명령어
```bash
supabase secrets set ANTHROPIC_API_KEY=sk-ant-...
# 확인
supabase secrets list
```

### 승인 원자성 — RPC 사용
`UPDATE locations` + `UPDATE ai_outputs status='approved'`를 단일 Postgres 함수로:
```sql
CREATE OR REPLACE FUNCTION approve_ai_output(p_output_id UUID, p_reviewer_id UUID)
RETURNS void AS $$
BEGIN
  -- 낙관적 잠금: pending 상태일 때만 처리
  UPDATE ai_outputs SET status='approved', reviewer_id=p_reviewer_id, reviewed_at=NOW()
  WHERE id=p_output_id AND status='ai_review_pending';
  IF NOT FOUND THEN RAISE EXCEPTION 'already_processed'; END IF;
  -- locations 번역 업데이트 (final_content 기반)
  UPDATE locations SET
    name_en=(SELECT final_content->>'en' FROM ai_outputs WHERE id=p_output_id),
    name_zh_tw=(SELECT final_content->>'zh_tw' FROM ai_outputs WHERE id=p_output_id),
    name_zh_hk=(SELECT final_content->>'zh_hk' FROM ai_outputs WHERE id=p_output_id),
    name_ja=(SELECT final_content->>'ja' FROM ai_outputs WHERE id=p_output_id)
  WHERE id=(SELECT entity_id FROM ai_outputs WHERE id=p_output_id)::UUID;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### DB 스키마 수정
- `reviewer_id`: `auth.users(id)` 참조 (admin_users 아님)
- `created_by UUID REFERENCES auth.users(id)` 컬럼 추가 (Rate limiting용)

### 구현 파일 목록 (5개)
1. `supabase/migrations/20260404000001_ai_outputs.sql` — 테이블 + RLS + approve RPC
2. `supabase/functions/ai-content-gen/index.ts` — Edge Function
3. `client/components/admin/LocationsTab.tsx` — AI 버튼 추가 (기존 파일 수정)
4. `client/components/admin/AIReviewTab.tsx` — 신규 탭 (신규 파일)
5. `client/components/AdminDashboard.tsx` — 탭 등록 (기존 파일 수정)

---

## GSTACK REVIEW REPORT

| Review | Trigger | Why | Runs | Status | Findings |
|--------|---------|-----|------|--------|----------|
| CEO Review | `/plan-ceo-review` | Scope & strategy | 1 | PASS | SNS/CS Phase 1 포함, AIReviewTab MVP=diff 없음, admin JWT 필수 |
| Design Review | `/plan-design-review` | UI/UX gaps | 1 | PASS | 버튼/플로우 정의 완료, 빈상태 정의 |
| Eng Review | `/plan-eng-review` | Architecture & tests | 1 | PASS | admin-auth 재활용, Rate limit DB 구현, 승인 RPC 원자성, 5개 파일 |
| Codex Review | `/codex review` | Independent 2nd opinion | 0 | — | — |

**VERDICT:** APPROVED — 구현 시작 가능. Codex 외부 리뷰는 선택사항.
