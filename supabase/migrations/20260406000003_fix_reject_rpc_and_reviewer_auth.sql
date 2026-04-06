-- Fix 1: reject_ai_output이 ai_policy_failed 상태를 처리하지 못하는 버그 수정
-- Fix 2: approve/reject RPC에서 p_reviewer_id를 클라이언트 전달 대신 auth.uid() 사용
--        (감사 로그 오염 방지 — 악의적 admin이 다른 UUID 전달 불가)

-- approve_ai_output 재정의: p_reviewer_id 제거, auth.uid() 사용
CREATE OR REPLACE FUNCTION approve_ai_output(
  p_output_id UUID
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_entity_id TEXT;
  v_content JSONB;
  v_use_case TEXT;
  v_rows INT;
BEGIN
  UPDATE ai_outputs
  SET
    status = 'approved',
    reviewer_id = auth.uid(),
    reviewed_at = NOW(),
    final_content = generated_content
  WHERE id = p_output_id
    AND status = 'ai_review_pending';

  GET DIAGNOSTICS v_rows = ROW_COUNT;
  IF v_rows = 0 THEN
    RAISE EXCEPTION 'already_processed: 이미 처리된 항목입니다.';
  END IF;

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

    GET DIAGNOSTICS v_rows = ROW_COUNT;
    IF v_rows = 0 THEN
      RAISE WARNING 'approve_ai_output: translation 승인 완료했으나 locations 업데이트 0건 (entity_id: %)', v_entity_id;
    END IF;
  END IF;
END;
$$;

-- reject_ai_output 재정의: p_reviewer_id 제거 + ai_policy_failed 상태도 처리
CREATE OR REPLACE FUNCTION reject_ai_output(
  p_output_id UUID
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_rows INT;
BEGIN
  UPDATE ai_outputs
  SET
    status = 'rejected',
    reviewer_id = auth.uid(),
    reviewed_at = NOW()
  WHERE id = p_output_id
    AND status IN ('ai_review_pending', 'ai_policy_failed');

  GET DIAGNOSTICS v_rows = ROW_COUNT;
  IF v_rows = 0 THEN
    RAISE EXCEPTION 'already_processed: 이미 처리된 항목입니다.';
  END IF;
END;
$$;

-- GRANT: 기존 서명(UUID, UUID) 권한 제거, 새 서명(UUID) 권한 부여
REVOKE EXECUTE ON FUNCTION approve_ai_output(UUID, UUID) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION approve_ai_output(UUID, UUID) FROM authenticated;
GRANT EXECUTE ON FUNCTION approve_ai_output(UUID) TO authenticated;

REVOKE EXECUTE ON FUNCTION reject_ai_output(UUID, UUID) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION reject_ai_output(UUID, UUID) FROM authenticated;
GRANT EXECUTE ON FUNCTION reject_ai_output(UUID) TO authenticated;
