-- AI Outputs table for Claude-generated content review workflow
-- Phase 4: AI 콘텐츠 생성 + 검수 큐

CREATE TABLE IF NOT EXISTS ai_outputs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  use_case TEXT NOT NULL,          -- 'translation' | 'branch_guide' | 'cs_reply'
  entity_id TEXT,                  -- 지점 ID 등 연관 엔티티
  prompt_snapshot JSONB,           -- 사용된 프롬프트 (비 PII)
  generated_content JSONB,         -- {en, zh_tw, zh_hk, ja, ...}
  policy_check JSONB,              -- {passed: bool, violations: string[]}
  status TEXT NOT NULL DEFAULT 'ai_review_pending',
  -- 상태: ai_review_pending | ai_policy_failed | approved | rejected
  created_by UUID REFERENCES auth.users(id),
  reviewer_id UUID REFERENCES auth.users(id),
  reviewed_at TIMESTAMPTZ,
  final_content JSONB,             -- 승인된 최종 콘텐츠
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS ai_outputs_status_idx ON ai_outputs(status);
CREATE INDEX IF NOT EXISTS ai_outputs_entity_idx ON ai_outputs(entity_id);
CREATE INDEX IF NOT EXISTS ai_outputs_created_by_idx ON ai_outputs(created_by, created_at);

-- RLS
ALTER TABLE ai_outputs ENABLE ROW LEVEL SECURITY;

-- 관리자만 SELECT
CREATE POLICY "admin_select_ai_outputs"
  ON ai_outputs FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM admin_users WHERE id = auth.uid()
  ));

-- 관리자만 INSERT
CREATE POLICY "admin_insert_ai_outputs"
  ON ai_outputs FOR INSERT
  TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM admin_users WHERE id = auth.uid()
  ));

-- 관리자만 UPDATE (승인/반려)
CREATE POLICY "admin_update_ai_outputs"
  ON ai_outputs FOR UPDATE
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM admin_users WHERE id = auth.uid()
  ));

-- 승인 원자성 RPC: ai_outputs 승인 + locations 번역 업데이트
CREATE OR REPLACE FUNCTION approve_ai_output(
  p_output_id UUID,
  p_reviewer_id UUID
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_entity_id TEXT;
  v_content JSONB;
BEGIN
  -- 낙관적 잠금: pending 상태일 때만 처리
  UPDATE ai_outputs
  SET
    status = 'approved',
    reviewer_id = p_reviewer_id,
    reviewed_at = NOW(),
    final_content = generated_content
  WHERE id = p_output_id
    AND status = 'ai_review_pending';

  IF NOT FOUND THEN
    RAISE EXCEPTION 'already_processed: output % is not in pending state', p_output_id;
  END IF;

  -- entity_id와 content 조회
  SELECT entity_id, generated_content
  INTO v_entity_id, v_content
  FROM ai_outputs
  WHERE id = p_output_id;

  -- locations 번역 필드 업데이트 (translation use_case만)
  IF v_entity_id IS NOT NULL THEN
    UPDATE locations
    SET
      name_en    = COALESCE(v_content->>'en',    name_en),
      name_ja    = COALESCE(v_content->>'ja',    name_ja),
      name_zh    = COALESCE(v_content->>'zh',    name_zh),
      name_zh_tw = COALESCE(v_content->>'zh_tw', name_zh_tw),
      name_zh_hk = COALESCE(v_content->>'zh_hk', name_zh_hk),
      address_en    = COALESCE(v_content->>'address_en',    address_en),
      address_ja    = COALESCE(v_content->>'address_ja',    address_ja),
      address_zh    = COALESCE(v_content->>'address_zh',    address_zh),
      address_zh_tw = COALESCE(v_content->>'address_zh_tw', address_zh_tw),
      address_zh_hk = COALESCE(v_content->>'address_zh_hk', address_zh_hk)
    WHERE supabase_id = v_entity_id
       OR id = v_entity_id;
  END IF;
END;
$$;

-- 반려 RPC
CREATE OR REPLACE FUNCTION reject_ai_output(
  p_output_id UUID,
  p_reviewer_id UUID
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE ai_outputs
  SET
    status = 'rejected',
    reviewer_id = p_reviewer_id,
    reviewed_at = NOW()
  WHERE id = p_output_id
    AND status = 'ai_review_pending';

  IF NOT FOUND THEN
    RAISE EXCEPTION 'already_processed: output % is not in pending state', p_output_id;
  END IF;
END;
$$;
