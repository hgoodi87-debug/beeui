-- =============================================
-- Fix: trigger_on_booking_created Vault 의존성 제거
-- 문제: Vault에 supabase_service_role_key 없으면 silent fail
-- 해결: no-verify-jwt 함수 배포 + Vault 없어도 호출되도록 수정
--      (함수 자체가 service_role_key로 DB 접근하므로 호출 인증 불필요)
-- =============================================

CREATE OR REPLACE FUNCTION public.trigger_on_booking_created()
RETURNS TRIGGER AS $$
DECLARE
  _auth_token TEXT;
  _edge_url TEXT := 'https://xpnfjolqiffduedwtxey.supabase.co/functions/v1/on-booking-created';
BEGIN
  -- Vault에서 service_role_key 시도 (있으면 사용, 없으면 무인증 호출)
  BEGIN
    SELECT decrypted_secret INTO _auth_token
    FROM vault.decrypted_secrets
    WHERE name = 'supabase_service_role_key'
    LIMIT 1;
  EXCEPTION WHEN OTHERS THEN
    _auth_token := NULL;
  END;

  -- Edge Function 호출 (no-verify-jwt로 배포됨 → 인증 없어도 동작)
  IF _auth_token IS NOT NULL THEN
    -- Vault 키 있으면 Bearer 인증 포함
    PERFORM extensions.http_post(
      url     := _edge_url,
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
  ELSE
    -- Vault 키 없어도 호출 (함수는 no-verify-jwt 배포)
    PERFORM extensions.http_post(
      url     := _edge_url,
      body    := jsonb_build_object(
                   'type', 'INSERT',
                   'table', 'booking_details',
                   'record', row_to_json(NEW)::jsonb
                 )::text,
      headers := jsonb_build_object(
                 'Content-Type', 'application/json'
               )
    );
  END IF;

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING '[trigger_on_booking_created] http_post failed: %', SQLERRM;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
