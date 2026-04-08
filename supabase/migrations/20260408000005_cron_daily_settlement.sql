-- W-11: 일별 정산 집계 cron 등록
-- Supabase Dashboard → Database → Cron Jobs 에서도 동일하게 설정 가능
--
-- 실행: 매일 17:00 UTC (02:00 KST)
-- 호출: daily-settlement-summary Edge Function
--
-- 사전 준비: Supabase Dashboard → Project Settings → Secrets 에서
--   CRON_SERVICE_ROLE_KEY = <service_role_key> 등록 필요
--   (마이그레이션에 시크릿 직접 입력 금지)
--
-- pg_net 이미 활성화 확인 (이전 마이그레이션: enable_pg_net_and_fix_trigger)

-- pg_cron 활성화
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- 기존 잡 제거 (멱등성)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'daily-settlement-summary') THEN
    PERFORM cron.unschedule('daily-settlement-summary');
  END IF;
END $$;

-- cron 잡 등록
-- 시크릿 키는 Supabase Vault 또는 아래 플레이스홀더를 실제 값으로 교체
-- (운영 환경에서는 Dashboard의 Cron Jobs UI 사용 권장)
SELECT cron.schedule(
  'daily-settlement-summary',
  '0 17 * * *',   -- 매일 17:00 UTC = 02:00 KST
  format(
    $cron$
    SELECT net.http_post(
      url     := %L,
      headers := jsonb_build_object(
        'Content-Type',  'application/json',
        'Authorization', 'Bearer ' || current_setting('app.service_role_key', true)
      ),
      body := '{}'::jsonb
    )
    $cron$,
    'https://fzvfyeskdivulazjjpgr.supabase.co/functions/v1/daily-settlement-summary'
  )
);

-- app.service_role_key 세션 변수 기본값 설정 (실제 키로 교체 필요)
-- ALTER DATABASE postgres SET app.service_role_key = '<YOUR_SERVICE_ROLE_KEY>';
-- 또는 Supabase Dashboard → Database → Cron Jobs 에서 직접 설정

COMMENT ON EXTENSION pg_cron IS
  '빌리버 cron: daily-settlement-summary 02:00 KST, branch-payout-calculator 월간 실행';
