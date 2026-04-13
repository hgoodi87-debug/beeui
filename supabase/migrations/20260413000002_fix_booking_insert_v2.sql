-- ═══════════════════════════════════════════════════════════════════════════
-- Fix Booking Insert v2 — 2026-04-13
-- booking_details INSERT 정책 전체 초기화 후 단일 공개 정책으로 재설정
-- ═══════════════════════════════════════════════════════════════════════════

-- 기존 INSERT 정책 전부 제거 (이름 불문)
DROP POLICY IF EXISTS "deny_direct_insert_booking_details" ON public.booking_details;
DROP POLICY IF EXISTS "public_insert_booking_details"      ON public.booking_details;
DROP POLICY IF EXISTS "p_booking_details_i"                ON public.booking_details;
DROP POLICY IF EXISTS "anon_insert_booking_details"        ON public.booking_details;

-- 단일 공개 INSERT 정책 생성
CREATE POLICY "anon_insert_booking_details"
  ON public.booking_details FOR INSERT
  WITH CHECK (true);
