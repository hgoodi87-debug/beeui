-- ═══════════════════════════════════════════════════════════════════════════
-- Security Fix — 2026-04-12
-- CSO Audit Findings #1 + #4
--
-- #1 CRITICAL: booking_details 공개 RLS 제거 (전 고객 PII 공개 노출)
--   - public_read_booking_details (USING true) → 소유자/직원만 조회
--   - public_insert_booking_details (WITH CHECK true) → service_role 전용 (Edge Fn)
--   - admin_update_booking_details (USING true) → 실제 관리자 역할 검증
--
-- #4 HIGH: FIX_ANON_RLS 잘못된 anon 공개 정책 제거
--   - profiles anon read → 전 직원 email/phone 공개 노출 차단
--   - roles / employee_roles / employee_branch_assignments anon read 제거
-- ═══════════════════════════════════════════════════════════════════════════

-- ─── #1: booking_details RLS 수정 ─────────────────────────────────────────

-- 잘못된 공개 정책 제거
DROP POLICY IF EXISTS "public_read_booking_details"  ON public.booking_details;
DROP POLICY IF EXISTS "public_insert_booking_details" ON public.booking_details;
DROP POLICY IF EXISTS "admin_update_booking_details"  ON public.booking_details;

-- SELECT: 예약 소유자(customer) 또는 관리 직원만 조회
-- Edge Function(service_role)은 RLS를 우회하므로 별도 정책 불필요
CREATE POLICY "owner_or_staff_read_booking_details"
  ON public.booking_details FOR SELECT
  USING (
    -- 예약 소유자 (고객 본인)
    reservation_id IN (
      SELECT id FROM public.reservations WHERE customer_id = auth.uid()
    )
    OR
    -- 관리 직원 (운영·정산·CS)
    public.has_any_role(ARRAY[
      'super_admin', 'hq_admin', 'hub_manager', 'partner_manager',
      'finance_staff', 'ops_staff', 'cs_staff'
    ])
  );

-- INSERT: anon/authenticated 모두 차단 (Edge Function service_role만 삽입 가능)
-- service_role은 RLS를 우회하므로 아래 정책이 있어도 Edge Fn 정상 동작
CREATE POLICY "deny_direct_insert_booking_details"
  ON public.booking_details FOR INSERT
  WITH CHECK (false);

-- UPDATE: 관리 직원만 (정책 이름과 실제 조건 일치시킴)
CREATE POLICY "staff_update_booking_details"
  ON public.booking_details FOR UPDATE
  USING (
    public.has_any_role(ARRAY[
      'super_admin', 'hq_admin', 'hub_manager',
      'finance_staff', 'ops_staff'
    ])
  )
  WITH CHECK (
    public.has_any_role(ARRAY[
      'super_admin', 'hq_admin', 'hub_manager',
      'finance_staff', 'ops_staff'
    ])
  );

-- ─── #4: FIX_ANON_RLS 잘못된 anon 공개 정책 제거 ─────────────────────────

-- profiles: anon에게 전 직원 email/phone 공개 → 제거
DROP POLICY IF EXISTS "p_profiles_anon" ON public.profiles;

-- roles: anon 공개 제거 → authenticated 사용자만 읽기 (역할 코드는 민감 PII 아님)
DROP POLICY IF EXISTS "p_roles_anon" ON public.roles;
CREATE POLICY "roles_read_authenticated"
  ON public.roles FOR SELECT
  TO authenticated
  USING (true);

-- employee_roles: anon 공개 제거 → 관리자만
DROP POLICY IF EXISTS "p_employee_roles_anon" ON public.employee_roles;

-- employee_branch_assignments: anon 공개 제거 → 관리자만
DROP POLICY IF EXISTS "p_eba_anon" ON public.employee_branch_assignments;

-- profiles 원래 올바른 정책이 살아있는지 확인용 재생성 (idempotent)
-- "profiles_select_self_or_hq" 정책이 없으면 생성
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'profiles'
      AND policyname = 'profiles_select_self_or_hq'
  ) THEN
    EXECUTE $policy$
      CREATE POLICY "profiles_select_self_or_hq"
        ON public.profiles FOR SELECT TO authenticated
        USING (
          id = auth.uid()
          OR public.has_any_role(ARRAY['super_admin', 'hq_admin', 'finance_staff'])
        )
    $policy$;
  END IF;
END;
$$;
