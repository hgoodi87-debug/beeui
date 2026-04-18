-- ─────────────────────────────────────────────────────────────────────────────
-- 고객 이메일 매직링크 로그인 — RLS 정책
-- 목적: 로그인한 고객이 자신의 이메일로 된 예약 내역만 조회할 수 있도록 허용
-- 관련 컴포넌트: MyLoginPage.tsx, MyReservationsPage.tsx
-- ─────────────────────────────────────────────────────────────────────────────

-- ── 1. booking_details: 본인 이메일 예약 조회 ─────────────────────────────────
-- 기존 anon SELECT 정책은 유지 (관리자 조회, 예약코드 조회 등 기존 기능 영향 없음)
-- authenticated 사용자에게만 추가 정책 부여

DO $$
BEGIN
  -- 정책이 이미 존재하면 DROP 후 재생성
  IF EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'booking_details'
      AND policyname = 'customers_read_own_bookings'
  ) THEN
    DROP POLICY customers_read_own_bookings ON booking_details;
  END IF;
END $$;

CREATE POLICY customers_read_own_bookings
  ON booking_details
  FOR SELECT
  TO authenticated
  USING (
    user_email IS NOT NULL
    AND user_email = auth.email()
  );

-- ── 2. Supabase Auth redirect URL 허용 목록 안내 (수동 설정 필요) ──────────────
-- Supabase Dashboard > Authentication > URL Configuration > Redirect URLs 에
-- 아래 URL 패턴을 추가해야 매직링크 리다이렉트가 동작합니다:
--
--   https://bee-liber.com/*/my/reservations
--   http://localhost:5173/*/my/reservations     (로컬 개발)
--
-- 설정하지 않으면 "redirect_uri is not allowed" 오류 발생.
-- ─────────────────────────────────────────────────────────────────────────────
