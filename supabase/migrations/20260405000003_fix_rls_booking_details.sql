-- ============================================================
-- P0 보안 수정: booking_details RLS 재설계
-- OWASP A01 — 취약한 접근 제어 수정
-- Finding #2: public SELECT USING(true) → 고객 소유 범위로 제한
-- Finding #3: public UPDATE USING(true) → 삭제 (service_role만 허용)
-- ============================================================

-- 1. 기존 취약 정책 제거
DROP POLICY IF EXISTS "public_read_booking_details" ON public.booking_details;
DROP POLICY IF EXISTS "admin_update_booking_details" ON public.booking_details;

-- 2. 고객 본인 예약만 SELECT 허용
--    booking_details.reservation_id → reservations.customer_id = auth.uid()
CREATE POLICY "customer_read_own_booking_details"
  ON public.booking_details
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM public.reservations r
      WHERE r.id = booking_details.reservation_id
        AND r.customer_id = auth.uid()
    )
  );

-- 3. UPDATE: 명시적 정책 없음 → service_role만 허용 (Edge Function 경유)
--    service_role 키는 RLS를 우회하므로 별도 정책 불필요.
--    anon/authenticated JWT 토큰으로는 UPDATE 불가.

-- 4. (선택) app_settings 결제 세션 노출 완화 (P2 Medium)
--    결제 세션 키(payment_session_*)는 anon 읽기 차단
DROP POLICY IF EXISTS "public_read_app_settings" ON public.app_settings;
CREATE POLICY "service_read_app_settings"
  ON public.app_settings
  FOR SELECT
  USING (
    -- service_role은 RLS 우회, 여기서는 JWT 클레임 기반 staff 허용
    coalesce(auth.jwt() ->> 'role', '') IN (
      'admin', 'ops_manager', 'ops_staff', 'finance_staff',
      'hub_manager', 'super_admin', 'hq_admin'
    )
  );
