# Beeliber — Claude Admin Integration Plan (v2 — CS 자동화 우선)
<!-- /autoplan restore point: /Users/cm/.gstack/projects/dbcjsaud-ycm-beeliber-main/codex-continue-after-restore-20260322-autoplan-restore-20260406-184502.md -->

**Branch:** `codex/continue-after-restore-20260322`
**Date:** 2026-04-06 (v2 — /autoplan CEO 검토 후 피봇)
**Author:** cm

> **전략 피봇 (2026-04-06):** CEO 검토에서 번역 자동화의 ROI가 낮음(월 ~2시간 절감) 확인. CS 응대 자동화가 실질 병목. Phase 1 → CS 자동화. 번역 자동화 → Phase 2.

---

## 문제 정의

빌리버 어드민에서 고객 문의 응대, 예약 변경 알림, 다국어 커뮤니케이션을 수동으로 처리하고 있어 운영 부하가 높다. 관리자가 카카오/샤오홍슈 DM에 직접 답변하는 시간 > 번역 작업 시간. AI 초안 생성 + 관리자 검수 게이트 구조로 CS 품질 유지하면서 속도 향상.

**목표**: Claude를 CS 응대 초안 생성 주체로 연동, 관리자 검수 후 발송. 브랜드 가이드 준수율 100%.

---

## 범위 (Phase 1 — CS 자동화)

### 포함
1. **CS 응답 초안 생성** — 고객 문의(예약 변경, 위치 안내, 수하물 문의) → Claude가 ko/zh-TW/zh-HK/ja 응답 초안 생성
2. **자동 정책 검사** — beeliber_master 금지어 + 미운영 서비스 언급 자동 체크
3. **AI 검수 큐** — AdminDashboard 탭 "AI 검수함": 응답 초안 목록, 원문/초안 diff, 승인/수정후승인/반려
4. **Supabase Edge Function** — `ai-content-gen` 함수 (use_case: 'cs_reply'): Claude API 호출 + 정책 검사 + DB 저장
5. **DB 스키마** — `ai_outputs` 테이블 + RLS (번역 자동화와 공용 테이블)

### 제외 (Phase 2)
- **지점 번역 자동화** — ROI 재측정 후 결정 (현재 월 절감 ~2시간 추정)
- SNS 포스트 자동 생성 (샤오홍슈·Threads)
- B2B 제안서 초안
- PayPal Live 전환 (인증 대기 중, 별도 작업)
- CS 응답 자동 발송 (고객 직접 노출 — 관리자 승인 필수)

---

## 기술 아키텍처

```
AdminDashboard (React)
  └── CSTab (기존) 또는 신규 진입점
        └── "AI 응답 초안 생성" 버튼 (문의 선택 후)
              │
              ▼
  supabase/functions/ai-content-gen/index.ts
        ├── Claude API (claude-sonnet-4-6)
        │     └── system: beeliber_master 금지어 + 브랜드 톤 + CS 페르소나
        ├── policy_check() — 금지어·미운영 서비스·가격 환각 자동 검사
        └── INSERT ai_outputs (use_case: 'cs_reply', status: 'ai_review_pending')
              │
              ▼
  AdminDashboard
  └── AIReviewTab (신규)
        ├── 문의 목록 (use_case 필터)
        ├── 원문 ↔ AI 초안 diff view
        ├── 정책 검사 결과 (통과/실패 + 위반 단어 하이라이트)
        └── 승인/수정후승인/반려 액션 (승인 = 클립보드 복사 or 카카오 전송 준비)
```

### DB 스키마

```sql
CREATE TABLE ai_outputs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  use_case TEXT NOT NULL,  -- 'cs_reply' | 'translation' (Phase 2)
  entity_id TEXT,          -- 예약 ID 또는 고객 ID
  prompt_snapshot JSONB,   -- 사용된 프롬프트 (감사 로그)
  generated_content JSONB, -- {ko, zh_tw, zh_hk, ja, en}
  policy_check JSONB,      -- 검사 결과 {passed, violations: [...]}
  status TEXT DEFAULT 'ai_review_pending',
  reviewer_id UUID REFERENCES auth.users(id),
  reviewed_at TIMESTAMPTZ,
  final_content JSONB,     -- 승인된 최종 응답
  created_by UUID REFERENCES auth.users(id),  -- Rate limiting용
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### RLS
- `ai_outputs` SELECT/INSERT: 인증된 관리자만
- `ai_outputs` UPDATE (승인/반려): 관리자만

---

## 구현 단계

### Step 1 — DB + Edge Function (1일)
- `supabase/migrations/20260407000001_ai_outputs.sql` 작성
- `supabase/functions/ai-content-gen/index.ts` 작성
  - Claude API 호출 (claude-sonnet-4-6), use_case='cs_reply'
  - CS 페르소나 시스템 프롬프트 (친절, 명확, 브랜드 금지어 없음)
  - 금지어 정책 검사 (beeliber_master 기반)
  - Rate limiting: created_by당 분당 10회
  - ai_outputs INSERT

### Step 2 — AI 검수 탭 (1일)
- AdminDashboard 탭 추가: "AI 검수함" (뱃지 카운트 포함)
- 2-column split: 목록 패널 + 상세 패널
- 인라인 에디터 (수정 후 승인 모드)
- 승인/반려 RPC 호출

### Step 3 — CS 응답 진입점 (반일)
- 기존 관리자 화면에 "AI 응답 생성" 버튼 추가
- 문의 내용 + 고객 언어 감지 → ai-content-gen 호출
- 승인 후: 클립보드 복사 (1차) → 카카오 API 연동 (Phase 2)

### Step 4 — approve RPC (반일)
- `approve_ai_output(p_output_id, p_reviewer_id)` PostgreSQL 함수
- 낙관적 잠금 + status 업데이트 원자적 처리

---

## 성공 기준

- CS 응답 초안 생성: 5분 이상 → 30초
- 브랜드 가이드 위반 자동 탐지율: >95%
- AIReviewTab에서 승인/반려 처리 가능

---

## 보안 고려사항

- Claude API 키는 Supabase secrets에만 저장 (클라이언트 노출 금지)
- 관리자 인증 토큰 검증 (`authenticateAdminRequest()` 재활용)
- 생성 콘텐츠는 관리자 승인 전 고객 발송 금지
- Rate limiting: created_by당 분당 10회

---

## 위험 요소

| 위험 | 가능성 | 대응 |
|------|--------|------|
| Claude API 할당량 초과 | 낮음 | 요청당 비용 모니터링 |
| CS 응답 품질 불만족 (오역) | 중간 | 검수함 강제 + 수정후승인 |
| 검수 큐 적체 (알림 없음) | 높음 | TODOS.md: 알림 시스템 추가 |
| 관리자 승인 없이 발송 | 낮음 | 상태 머신 + RLS |

---

## 디자인 결정 (Phase 2 리뷰 — /plan-design-review 업데이트 2026-04-04)

### "AI 번역 생성" 버튼
- **위치**: 지점 편집 모달 내 번역 섹션 옆 (또는 LocationsTab 카드 우측 하단)
- **스타일**: `bg-yellow-400 text-black font-bold rounded-full px-4 py-2`
- **아이콘**: 🌐 prefix
- **로딩 상태**: "AI 생성 중..." 스피너, disabled
- **성공 상태**: "검수함에 저장됨 ✓" 토스트 알림

### AIReviewTab 레이아웃 (결정: 2-column split)
```
md:grid-cols-[320px,1fr] h-full
├── 왼쪽: 목록 패널 (스크롤 가능)
│   - 카드: 지점명(locations JOIN) / 생성일시 / 정책 배지 / 상태 배지
│   - 로드 시 첫 번째 항목 자동 선택
│   - 선택된 항목: border-bee-yellow 하이라이트
└── 오른쪽: 상세 패널 (고정)
    - 헤더: 지점명 + 생성 일시
    - 정책 위반 경고 배너 (위반 시만 표시)
    - 번역 필드 그리드 (인라인 에디터, 아래 참조)
    - 액션 버튼 3개 (하단 고정)
```

### entity_id → 지점명 표시
- `fetchPendingOutputs()`에 Supabase join 추가:
  ```
  GET /rest/v1/ai_outputs?select=*,location:locations!entity_id(name)&status=in.(ai_review_pending,ai_policy_failed)
  ```
- 목록 카드: `location?.name || entity_id.slice(0, 8) + '...'` 표시

### 번역 필드 — 인라인 에디터
- 기본: `<p>` 텍스트 (읽기 모드)
- "수정 후 승인" 클릭 시 → 모든 필드 `<textarea>` 전환 (수정 모드)
- 수정 모드 스타일: `border border-gray-200 rounded-xl p-2 text-xs font-bold w-full resize-none`
- 수정 확인 클릭 시 → `final_content`에 수정된 값 담아 `approve_ai_output` RPC 호출

### 정책 위반 하이라이트 컬러 통일
- `bg-red-100 text-red-700` (배지와 동일, `bg-red-300 text-red-900` 대신)

### 생성 → 검수 → 승인 플로우
```
[LocationsTab] 지점 선택 → "AI 번역 생성" 클릭
  → 로딩 3-5초 (Edge Function 호출)
  → 성공: "AI 검수함에 1건 추가됨" 배너
  → [AIReviewTab] 배지 카운트 증가 (빨간 숫자)

[AIReviewTab — 2-column split]
  → 왼쪽 목록: 지점명 / 생성일시 / 정책통과 배지 / 상태 배지
  → 오른쪽 상세: 번역 필드 (인라인 수정 가능)
  → 정책 위반 시: 위반 단어 bg-red-100 text-red-700 하이라이트
  → 액션 버튼 3개:
      [승인] green — 현재 generated_content를 final_content로 저장
      [수정 후 승인] yellow — 필드 textarea 전환 → 수정 → 저장
      [반려] red — status='rejected' 업데이트
  → 승인/수정후승인 성공 시: "번역이 지점 페이지에 반영되었습니다 ✓" 토스트
  → 목록에서 해당 항목 제거, 다음 항목 자동 선택
```

### 탭 배지 카운트
- `AIReviewTab`에 `onCountChange?: (n: number) => void` prop 추가
- 데이터 로드/승인/반려 후 `onCountChange(pendingCount)` 호출
- `AdminDashboard`의 탭 헤더에서: `{count > 0 && <span className="ml-1.5 bg-red-500 text-white text-[10px] font-black rounded-full w-4 h-4 inline-flex items-center justify-center">{count}</span>}`

### 키보드 접근성 (어드민 내부 도구 기준)
- 목록 항목: `tabIndex={0}` + `onKeyDown Enter` 선택
- 액션 버튼: 기존 `<button>` 키보드 기본 지원 (추가 작업 불필요)
- 승인/반려 버튼에 `aria-label` 추가: `aria-label="번역 승인"`

### 빈 상태
- AIReviewTab 항목 없음: `text-left` 정렬로:
  ```
  ✨ 모두 검수했어요!
  지점 탭에서 AI 번역을 생성해보세요.
  ```

### NOT in scope (이번 리뷰에서 결정적으로 제외)
- 모바일(375px) AIReviewTab 레이아웃 — 어드민 도구이므로 데스크톱 우선
- DESIGN.md 작성 — 현재 브랜치 범위 외 (/design-consultation 별도 실행 권장)

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
| Design Review | `/plan-design-review` | UI/UX gaps | 2 | PASS | score: 4/10 → 8/10, 8 decisions (2-column split, entity join, inline editor, tab badge, keyboard nav, diff color, empty state, 승인 토스트) |
| Eng Review | `/plan-eng-review` | Architecture & tests | 1 | PASS | admin-auth 재활용, Rate limit DB 구현, 승인 RPC 원자성, 5개 파일 |
| Codex Review | `/codex review` | Independent 2nd opinion | 0 | — | — |

**VERDICT:** APPROVED — 구현 시작 가능. Design 결정사항 8개 플랜에 반영 완료.
