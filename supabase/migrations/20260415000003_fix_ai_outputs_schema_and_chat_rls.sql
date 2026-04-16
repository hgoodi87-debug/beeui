-- Fix 1: ai_outputs 컬럼 누락 수정
-- FULL_MIGRATION_FOR_NEW_PROJECT.sql로 생성된 구버전 테이블(approval_status 기반)에
-- 신규 스키마 컬럼이 CREATE TABLE IF NOT EXISTS 스킵으로 추가되지 않은 문제 해결

ALTER TABLE ai_outputs ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'ai_review_pending';
ALTER TABLE ai_outputs ADD COLUMN IF NOT EXISTS entity_id TEXT;
ALTER TABLE ai_outputs ADD COLUMN IF NOT EXISTS prompt_snapshot JSONB;
ALTER TABLE ai_outputs ADD COLUMN IF NOT EXISTS generated_content JSONB;
ALTER TABLE ai_outputs ADD COLUMN IF NOT EXISTS policy_check JSONB;
ALTER TABLE ai_outputs ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id);
ALTER TABLE ai_outputs ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMPTZ;
ALTER TABLE ai_outputs ADD COLUMN IF NOT EXISTS final_content JSONB;

-- status 인덱스 (없으면 생성)
CREATE INDEX IF NOT EXISTS ai_outputs_status_idx ON ai_outputs(status);
CREATE INDEX IF NOT EXISTS ai_outputs_entity_idx ON ai_outputs(entity_id);
CREATE INDEX IF NOT EXISTS ai_outputs_created_by_idx ON ai_outputs(created_by, created_at);

-- RLS 정책 재정의 (app_metadata.role 기반)
ALTER TABLE ai_outputs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "admin_select_ai_outputs" ON ai_outputs;
CREATE POLICY "admin_select_ai_outputs"
  ON ai_outputs FOR SELECT
  TO authenticated
  USING (
    coalesce(auth.jwt() -> 'app_metadata' ->> 'role', '') IN (
      'admin', 'ops_manager', 'ops_staff', 'finance_staff',
      'hub_manager', 'super_admin', 'hq_admin'
    )
  );

DROP POLICY IF EXISTS "admin_insert_ai_outputs" ON ai_outputs;
CREATE POLICY "admin_insert_ai_outputs"
  ON ai_outputs FOR INSERT
  TO authenticated
  WITH CHECK (
    coalesce(auth.jwt() -> 'app_metadata' ->> 'role', '') IN (
      'admin', 'ops_manager', 'ops_staff', 'finance_staff',
      'hub_manager', 'super_admin', 'hq_admin'
    )
  );

DROP POLICY IF EXISTS "admin_update_ai_outputs" ON ai_outputs;
CREATE POLICY "admin_update_ai_outputs"
  ON ai_outputs FOR UPDATE
  TO authenticated
  USING (
    coalesce(auth.jwt() -> 'app_metadata' ->> 'role', '') IN (
      'admin', 'ops_manager', 'ops_staff', 'finance_staff',
      'hub_manager', 'super_admin', 'hq_admin'
    )
  );

-- Fix 2: chat_messages / chat_sessions anon INSERT 허용
-- ChatBot.tsx에서 비로그인 고객이 채팅 메시지를 보낼 수 있어야 함

DROP POLICY IF EXISTS "anon_insert_chat_sessions" ON public.chat_sessions;
CREATE POLICY "anon_insert_chat_sessions"
  ON public.chat_sessions FOR INSERT
  WITH CHECK (true);

DROP POLICY IF EXISTS "anon_insert_chat_messages" ON public.chat_messages;
CREATE POLICY "anon_insert_chat_messages"
  ON public.chat_messages FOR INSERT
  WITH CHECK (true);
