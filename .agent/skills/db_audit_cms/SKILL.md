---
name: db_audit_cms
description: "DB 검수 서브에이전트 — CMS & AI 섹션. cms_areas, cms_contents, cms_themes, content_translations, ai_outputs, ai_review_logs, system_notices, legal_documents, google_reviews 테이블 검증."
---

# DB 검수: CMS & AI

## 담당 테이블
- `cms_areas` — 지역별 콘텐츠 영역
- `cms_contents` (34 cols) — CMS 콘텐츠
- `cms_themes` — 콘텐츠 테마
- `content_translations` — 콘텐츠 번역
- `ai_outputs` — AI 생성 콘텐츠
- `ai_review_logs` — AI 검수 기록
- `system_notices` — 시스템 공지
- `legal_documents` — 약관/개인정보처리방침
- `google_reviews` / `google_review_summary` — 구글 리뷰

## 검수 체크리스트

### 1. 스키마 무결성
- [ ] cms_contents.slug UNIQUE 확인
- [ ] cms_contents.area_slug → cms_areas.area_slug FK 확인
- [ ] cms_contents.publish_status CHECK 제약 (draft/in_review/approved/published/rejected/archived)
- [ ] cms_contents.content_type CHECK 제약 (landmark/hotplace/attraction/event)
- [ ] ai_review_logs.ai_output_id → ai_outputs (CASCADE) FK 확인
- [ ] legal_documents (doc_type, language) UNIQUE 확인
- [ ] google_review_summary.place_id UNIQUE 확인
- [ ] cms_areas.area_slug UNIQUE 확인
- [ ] cms_themes.theme_slug UNIQUE 확인

### 2. RLS 정책 검증
- [ ] cms_areas, cms_contents, cms_themes: public_read (모든 사용자 읽기 가능)
- [ ] cms 쓰기: super_admin/hq_admin/marketing_staff/content_editor만
- [ ] ai_outputs, ai_review_logs: super_admin/hq_admin/ops_manager/marketing_staff/content_editor만
- [ ] google_reviews: public_read는 is_visible=true 조건 포함
- [ ] legal_documents: public_read (약관은 모두 공개)
- [ ] system_notices: public_read는 is_active=true 조건 포함

### 3. 데이터 정합성 — CMS
- [ ] published 상태의 콘텐츠에 title_ko 또는 title_en이 있는지
- [ ] cms_contents.area_slug가 cms_areas에 실제 존재하는지
- [ ] 다국어 필드(zh_tw 우선)가 published 콘텐츠에 채워져 있는지
- [ ] content_translations에서 orphan 레코드가 없는지

### 4. 데이터 정합성 — AI
- [ ] ai_outputs.approval_status 허용값 확인
- [ ] ai_review_logs.result 허용값 (pass/fail/warning) 확인
- [ ] published된 ai_output에 policy_passed=true인지
- [ ] risk_score > 0.7인 항목이 approved되지 않았는지

### 5. 뷰 검증
- [ ] v_cms_public_list 정상 조회 가능

## 검수 SQL 예시

```sql
-- published인데 제목 없는 콘텐츠
SELECT id, slug, publish_status
FROM cms_contents
WHERE publish_status = 'published' AND title_ko IS NULL AND title_en IS NULL;

-- orphan content_translations
SELECT ct.id FROM content_translations ct
LEFT JOIN cms_contents cc ON ct.id = cc.id
WHERE cc.id IS NULL;

-- 위험 AI 콘텐츠가 승인된 경우
SELECT id, use_case, risk_score, approval_status
FROM ai_outputs
WHERE risk_score > 0.7 AND approval_status = 'approved';

-- 리뷰 요약과 실제 리뷰 수 불일치
SELECT gs.place_id, gs.total_reviews, count(gr.id) as actual
FROM google_review_summary gs
LEFT JOIN google_reviews gr ON gs.place_id = gr.place_id
GROUP BY gs.place_id, gs.total_reviews
HAVING gs.total_reviews != count(gr.id);
```

## 연관 스킬
- `beeliber_seo` — 다국어 SEO 전략 (zh-TW 우선)
- `beeliber_ai_harness` — AI 생성·검사·승인·배포 통제
- `beeliber_design` — 비주얼 아이덴티티 + UX 가이드
