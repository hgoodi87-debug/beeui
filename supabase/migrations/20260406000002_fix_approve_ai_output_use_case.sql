-- Fix: approve_ai_output RPC가 use_case 무관하게 locations를 업데이트하던 버그 수정
-- CS reply 행이 entity_id를 가지면 locations 테이블에 CS 답변 텍스트가 기록되는 데이터 오염 방지
-- Fix: SECURITY DEFINER RPC 실행 권한을 명시적으로 제한 (authenticated only, not public)

-- approve_ai_output 재정의
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
  v_use_case TEXT;
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
    -- UUID 노출 제거
    RAISE EXCEPTION 'already_processed: 이미 처리된 항목입니다.';
  END IF;

  -- entity_id, content, use_case 조회
  SELECT entity_id, generated_content, use_case
  INTO v_entity_id, v_content, v_use_case
  FROM ai_outputs
  WHERE id = p_output_id;

  -- locations 번역 업데이트는 translation use_case에서만 수행
  IF v_use_case = 'translation' AND v_entity_id IS NOT NULL THEN
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
    WHERE id = v_entity_id::UUID;
  END IF;
  -- cs_reply, branch_guide 등 다른 use_case는 locations 업데이트 없음
END;
$$;

-- reject_ai_output 재정의 (에러 메시지 UUID 노출 제거)
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
    RAISE EXCEPTION 'already_processed: 이미 처리된 항목입니다.';
  END IF;
END;
$$;

-- GRANT EXECUTE: authenticated 사용자만 (public 제거)
REVOKE EXECUTE ON FUNCTION approve_ai_output(UUID, UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION approve_ai_output(UUID, UUID) TO authenticated;

REVOKE EXECUTE ON FUNCTION reject_ai_output(UUID, UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION reject_ai_output(UUID, UUID) TO authenticated;
