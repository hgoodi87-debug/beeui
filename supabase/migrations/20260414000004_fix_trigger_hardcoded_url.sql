-- =============================================
-- Fix: trigger_on_booking_created 하드코딩 URL 제거
-- 문제: URL이 운영 프로젝트 ref(xpnfjolqiffduedwtxey)에 고정됨
--       → 스테이징/개발 환경에서 동일 마이그레이션 실행 시 운영 함수 호출됨
-- 해결: app.supabase_url PostgreSQL 설정값 사용
--       각 환경에서 ALTER DATABASE SET app.supabase_url = '...' 로 주입
-- =============================================

CREATE OR REPLACE FUNCTION public.trigger_on_booking_created()
RETURNS TRIGGER AS $$
DECLARE
  _auth_token TEXT;
  _base_url TEXT;
  _edge_url TEXT;
BEGIN
  -- 환경별 Supabase URL (각 환경에서 ALTER DATABASE SET으로 주입)
  -- 미설정 시 xpnfjolqiffduedwtxey 를 운영 기본값으로 사용
  _base_url := current_setting('app.supabase_url', true);
  IF _base_url IS NULL OR _base_url = '' THEN
    _base_url := 'https://xpnfjolqiffduedwtxey.supabase.co';
  END IF;
  _edge_url := _base_url || '/functions/v1/on-booking-created';

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

-- 운영 환경 기본값 설정 (이미 올바른 값이면 no-op)
-- 스테이징에서는: ALTER DATABASE postgres SET app.supabase_url = 'https://<staging-ref>.supabase.co';
DO $$
BEGIN
  PERFORM set_config('app.supabase_url', 'https://xpnfjolqiffduedwtxey.supabase.co', false);
EXCEPTION WHEN OTHERS THEN NULL; END $$;
