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

-- 4. app_settings 접근 제어 재설계
--    - pricing 데이터(storage_tiers, delivery_prices)는 anon 읽기 허용 (프론트엔드 BookingPage, Hero 사용)
--    - payment_session_* 등 민감 키는 staff만 읽기 허용
DROP POLICY IF EXISTS "public_read_app_settings" ON public.app_settings;

-- 4a. 가격/공개 설정: anon 포함 전체 읽기 허용
CREATE POLICY "public_read_pricing_settings"
  ON public.app_settings
  FOR SELECT
  TO anon, authenticated
  USING (
    key IN ('storage_tiers', 'delivery_prices', 'hero', 'privacy_policy', 'terms_policy', 'qna_policy')
  );

-- 4b. 민감 설정(결제 세션 등): staff만 읽기 허용
CREATE POLICY "staff_read_sensitive_settings"
  ON public.app_settings
  FOR SELECT
  TO authenticated
  USING (
    key NOT IN ('storage_tiers', 'delivery_prices', 'hero', 'privacy_policy', 'terms_policy', 'qna_policy')
    AND coalesce(auth.jwt() -> 'app_metadata' ->> 'role', '') IN (
      'admin', 'ops_manager', 'ops_staff', 'finance_staff',
      'hub_manager', 'super_admin', 'hq_admin'
    )
  );
