-- =============================================
-- Email Voucher Fix: idempotency + DB trigger auth
-- 1. booking_details에 email_sent_at 컬럼 추가 (멱등성)
-- 2. DB trigger에 Authorization 헤더 추가 (Vault 사용)
-- =============================================

-- Step 1: email_sent_at 컬럼 추가
ALTER TABLE public.booking_details
  ADD COLUMN IF NOT EXISTS email_sent_at TIMESTAMPTZ;

-- Step 2: Vault에 service_role_key 저장
-- ⚠️ 아래 명령은 Supabase 대시보드 SQL Editor에서 직접 실행하세요
--    (service_role_key 값은 Settings > API > service_role에서 확인)
-- SELECT vault.create_secret('<YOUR_SERVICE_ROLE_KEY>', 'supabase_service_role_key');

-- Step 3: DB trigger 업데이트 — Vault에서 서비스 롤 키 읽어 Authorization 헤더 포함
CREATE OR REPLACE FUNCTION public.trigger_on_booking_created()
RETURNS TRIGGER AS $$
DECLARE
  _auth_token TEXT;
BEGIN
  -- Vault에서 service_role_key 조회
  BEGIN
    SELECT decrypted_secret INTO _auth_token
    FROM vault.decrypted_secrets
    WHERE name = 'supabase_service_role_key'
    LIMIT 1;
  EXCEPTION WHEN OTHERS THEN
    _auth_token := NULL;
  END;

  -- Vault 키 없으면 인증 없는 HTTP 요청 차단
  IF _auth_token IS NULL THEN
    RAISE EXCEPTION '[trigger_on_booking_created] Vault 키(supabase_service_role_key) 없음 — 인증 없는 Edge Function 호출 차단';
  END IF;

  PERFORM extensions.http_post(
    url     := 'https://xpnfjolqiffduedwtxey.supabase.co/functions/v1/on-booking-created',
    body    := jsonb_build_object(
                 'type', 'INSERT',
                 'table', 'booking_details',
                 'record', row_to_json(NEW)::jsonb
               )::text,
    headers := jsonb_build_object(
               'Content-Type', 'application/json',
               'Authorization', 'Bearer ' || _auth_token
             )
  );

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING '[trigger_on_booking_created] http_post failed: %', SQLERRM;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
