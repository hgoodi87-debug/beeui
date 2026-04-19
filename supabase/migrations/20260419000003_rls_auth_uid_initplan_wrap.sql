-- [DB-09] auth.uid() → (select auth.uid()) InitPlan 래핑
-- 매 row마다 재평가되던 auth.uid() 호출을 쿼리당 1회로 최적화 (advisor auth_rls_initplan 34건)

DROP POLICY IF EXISTS customer_read_own_booking_details ON booking_details;
CREATE POLICY customer_read_own_booking_details ON booking_details FOR SELECT
  USING (EXISTS (SELECT 1 FROM reservations r WHERE r.id = booking_details.reservation_id AND r.customer_id = (SELECT auth.uid())));

DROP POLICY IF EXISTS owner_or_staff_read_booking_details ON booking_details;
CREATE POLICY owner_or_staff_read_booking_details ON booking_details FOR SELECT
  USING (reservation_id IN (SELECT id FROM reservations WHERE customer_id = (SELECT auth.uid())) OR has_any_role(ARRAY['super_admin','hq_admin','hub_manager','partner_manager','finance_staff','ops_staff','cs_staff']));

DROP POLICY IF EXISTS owner_or_staff_chat_messages ON chat_messages;
CREATE POLICY owner_or_staff_chat_messages ON chat_messages FOR SELECT
  USING (user_email = (SELECT email FROM profiles WHERE id = (SELECT auth.uid())) OR has_any_role(ARRAY['super_admin','hq_admin','cs_staff','ops_staff']));

DROP POLICY IF EXISTS owner_or_staff_chat_sessions ON chat_sessions;
CREATE POLICY owner_or_staff_chat_sessions ON chat_sessions FOR SELECT
  USING (user_email = (SELECT email FROM profiles WHERE id = (SELECT auth.uid())) OR has_any_role(ARRAY['super_admin','hq_admin','cs_staff','ops_staff']));

DROP POLICY IF EXISTS users_read_own_credits ON credit_accounts;
CREATE POLICY users_read_own_credits ON credit_accounts FOR SELECT USING ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS p_customers_r ON customers;
CREATE POLICY p_customers_r ON customers FOR SELECT USING (id = (SELECT auth.uid()));

DROP POLICY IF EXISTS employee_branch_assignments_select_scoped ON employee_branch_assignments;
CREATE POLICY employee_branch_assignments_select_scoped ON employee_branch_assignments FOR SELECT
  USING (has_any_role(ARRAY['super_admin','hq_admin','finance_staff']) OR EXISTS (SELECT 1 FROM employees e WHERE e.id = employee_branch_assignments.employee_id AND e.profile_id = (SELECT auth.uid())) OR (has_any_role(ARRAY['hub_manager','partner_manager']) AND has_branch_access(branch_id)));

DROP POLICY IF EXISTS employee_roles_select_scoped ON employee_roles;
CREATE POLICY employee_roles_select_scoped ON employee_roles FOR SELECT
  USING (has_any_role(ARRAY['super_admin','hq_admin','finance_staff']) OR EXISTS (SELECT 1 FROM employees e WHERE e.id = employee_roles.employee_id AND e.profile_id = (SELECT auth.uid())));

DROP POLICY IF EXISTS admin_read_employees ON employees;
CREATE POLICY admin_read_employees ON employees FOR SELECT
  USING (profile_id = (SELECT auth.uid()) OR has_any_role(ARRAY['super_admin','hq_admin','hub_manager','finance_staff','ops_staff','cs_staff']));

DROP POLICY IF EXISTS employees_select_scoped ON employees;
CREATE POLICY employees_select_scoped ON employees FOR SELECT
  USING (profile_id = (SELECT auth.uid()) OR has_any_role(ARRAY['super_admin','hq_admin','finance_staff']) OR (has_any_role(ARRAY['hub_manager','partner_manager']) AND shares_branch_with_employee(id)));

DROP POLICY IF EXISTS employees_update_self_or_hq ON employees;
CREATE POLICY employees_update_self_or_hq ON employees FOR UPDATE
  USING (profile_id = (SELECT auth.uid()) OR has_any_role(ARRAY['super_admin','hq_admin']))
  WITH CHECK (profile_id = (SELECT auth.uid()) OR has_any_role(ARRAY['super_admin','hq_admin']));

DROP POLICY IF EXISTS p_payments_r ON payments;
CREATE POLICY p_payments_r ON payments FOR SELECT
  USING (EXISTS (SELECT 1 FROM reservations r WHERE r.id = payments.reservation_id AND r.customer_id = (SELECT auth.uid())));

DROP POLICY IF EXISTS profiles_select_self_or_hq ON profiles;
CREATE POLICY profiles_select_self_or_hq ON profiles FOR SELECT
  USING (id = (SELECT auth.uid()) OR has_any_role(ARRAY['super_admin','hq_admin','finance_staff']));

DROP POLICY IF EXISTS profiles_update_self_or_hq ON profiles;
CREATE POLICY profiles_update_self_or_hq ON profiles FOR UPDATE
  USING (id = (SELECT auth.uid()) OR has_any_role(ARRAY['super_admin','hq_admin']))
  WITH CHECK (id = (SELECT auth.uid()) OR has_any_role(ARRAY['super_admin','hq_admin']));

DROP POLICY IF EXISTS owner_or_staff_reservation_items ON reservation_items;
CREATE POLICY owner_or_staff_reservation_items ON reservation_items FOR SELECT
  USING (reservation_id IN (SELECT id FROM reservations WHERE customer_id = (SELECT auth.uid())) OR has_any_role(ARRAY['super_admin','hq_admin','hub_manager','ops_staff','cs_staff','finance_staff']));

DROP POLICY IF EXISTS p_reservations_r ON reservations;
CREATE POLICY p_reservations_r ON reservations FOR SELECT USING (customer_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS owner_or_staff_read_storage_assets ON storage_assets;
CREATE POLICY owner_or_staff_read_storage_assets ON storage_assets FOR SELECT
  USING (uploaded_by_user_id = (SELECT auth.uid()) OR has_any_role(ARRAY['super_admin','hq_admin','hub_manager','ops_staff']));

DROP POLICY IF EXISTS owner_read_user_coupons ON user_coupons;
CREATE POLICY owner_read_user_coupons ON user_coupons FOR SELECT
  USING (user_id = (SELECT auth.uid()) OR has_any_role(ARRAY['super_admin','hq_admin','finance_staff','cs_staff']));
