-- ═══════════════════════════════════════════════════════════════════════════
-- Force Fix Booking Insert — 2026-04-14
-- 모든 booking_details INSERT 정책을 강제 삭제 후 단일 공개 정책 재설정
-- 이전 마이그레이션(20260413000001, 000002)의 적용 여부 무관하게 확실히 수정
-- ═══════════════════════════════════════════════════════════════════════════

DO $$
DECLARE
  pol RECORD;
BEGIN
  -- booking_details의 모든 INSERT 정책 동적 삭제
  FOR pol IN
    SELECT policyname
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename  = 'booking_details'
      AND cmd IN ('INSERT', 'ALL')
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.booking_details', pol.policyname);
    RAISE NOTICE 'Dropped policy: %', pol.policyname;
  END LOOP;
END $$;

-- 단일 공개 INSERT 정책 (고객 예약 경로: anon 키로 직접 INSERT)
CREATE POLICY "allow_public_insert_booking_details"
  ON public.booking_details FOR INSERT
  WITH CHECK (true);

-- 관리자·직원 ALL 정책 재생성 (DROP 과정에서 삭제됐을 수 있음)
CREATE POLICY "employee_all_booking_details"
  ON public.booking_details FOR ALL
  USING (
    public.has_any_role(ARRAY[
      'super_admin','hq_admin','ops_manager','ops_staff',
      'finance_staff','hub_manager','partner_manager'
    ])
  )
  WITH CHECK (
    public.has_any_role(ARRAY[
      'super_admin','hq_admin','ops_manager','ops_staff',
      'finance_staff','hub_manager','partner_manager'
    ])
  );
