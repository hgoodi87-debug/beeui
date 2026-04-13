-- ═══════════════════════════════════════════════════════════════════════════
-- Restore Booking Insert Policy — 2026-04-13
--
-- 문제: 20260412000001_security_fix_rls.sql 이 booking_details INSERT를
--       WITH CHECK (false)로 전면 차단 → 고객 예약 불가
--
-- 수정: deny_direct_insert_booking_details 제거,
--       anon/authenticated 공개 INSERT 복원
--       (CSO #1 SELECT 보안 + #4 anon 공개 정책 제거는 유지)
-- ═══════════════════════════════════════════════════════════════════════════

-- 차단 정책 제거
DROP POLICY IF EXISTS "deny_direct_insert_booking_details" ON public.booking_details;

-- 공개 INSERT 복원 (고객 예약 경로: anon 키로 직접 INSERT)
CREATE POLICY "public_insert_booking_details"
  ON public.booking_details FOR INSERT
  WITH CHECK (true);
