-- chat_sessions anon UPDATE 정책 추가
-- saveChatSession upsert (on_conflict=session_id) 시 기존 세션 UPDATE 경로에서
-- anon 사용자의 UPDATE 정책이 없어 401 발생하는 문제 수정

DROP POLICY IF EXISTS "anon_update_chat_sessions" ON public.chat_sessions;
CREATE POLICY "anon_update_chat_sessions"
  ON public.chat_sessions FOR UPDATE
  USING (true)
  WITH CHECK (true);
