-- [DB-08] RLS permissive 정책 중복 통합

-- 1. app_settings: p_app_settings(qual=true)가 anon에게 전체 설정 노출 → 제거
DROP POLICY IF EXISTS p_app_settings ON app_settings;

-- 2. booking_details: customer_read_own_booking_details가 owner_or_staff에 이미 포함
DROP POLICY IF EXISTS customer_read_own_booking_details ON booking_details;

-- 3. employees: admin_read_employees(hub_manager 무제한)가 employees_select_scoped 무효화
--    단일 정책으로 통합: super/hq/finance는 전체, hub/partner는 지점 범위, ops/cs는 전체
DROP POLICY IF EXISTS admin_read_employees ON employees;
DROP POLICY IF EXISTS employees_select_scoped ON employees;
CREATE POLICY employees_read ON employees FOR SELECT
  USING (
    profile_id = (SELECT auth.uid())
    OR has_any_role(ARRAY['super_admin','hq_admin','finance_staff','ops_staff','cs_staff'])
    OR (has_any_role(ARRAY['hub_manager','partner_manager']) AND shares_branch_with_employee(id))
  );

-- 4. roles: 완전 동일 정책 중복 제거
DROP POLICY IF EXISTS roles_select_authenticated ON roles;

-- 5. branches: public/authenticated 두 정책 → 단일 정책으로 통합
DROP POLICY IF EXISTS public_read_branches ON branches;
DROP POLICY IF EXISTS branches_select_authenticated ON branches;
CREATE POLICY branches_read ON branches FOR SELECT
  USING (
    is_active = true
    OR has_any_role(ARRAY['super_admin','hq_admin','finance_staff'])
  );
