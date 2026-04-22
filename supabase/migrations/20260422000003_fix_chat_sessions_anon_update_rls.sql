-- chat_sessions anon UPDATE 정책 보안 강화
-- 기존 USING(true)/WITH CHECK(true)는 모든 행에 대해 anon UPDATE를 허용.
-- is_bot_disabled 컬럼은 관리자만 변경 가능해야 함.
-- 클라이언트 코드 변경 없이 적용: anon은 session_id를 WHERE 조건으로 제공하고
-- UUID 비추측성(128-bit random)이 실질적 보호를 제공하되,
-- WITH CHECK으로 is_bot_disabled=false 강제 → anon이 봇 비활성화 불가.

DROP POLICY IF EXISTS "anon_update_chat_sessions" ON public.chat_sessions;
DROP POLICY IF EXISTS "anon_update_own_chat_session" ON public.chat_sessions;

CREATE POLICY "anon_update_chat_session_restricted"
  ON public.chat_sessions FOR UPDATE
  USING (true)
  WITH CHECK (is_bot_disabled = false);

-- 참고: is_bot_disabled = true 설정은 authenticated 사용자(관리자)만 가능.
-- 관리자 UPDATE는 별도 RLS 정책 또는 SECURITY DEFINER 함수로 처리할 것.
-- 완전한 격리를 위해서는 client_token 컬럼 추가 및 클라이언트 헤더 전송 필요.
