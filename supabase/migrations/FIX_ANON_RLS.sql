-- profiles anon 읽기
DROP POLICY IF EXISTS "p_profiles_anon" ON public.profiles;
CREATE POLICY "p_profiles_anon" ON public.profiles FOR SELECT USING (true);

-- roles anon 읽기
DROP POLICY IF EXISTS "p_roles_anon" ON public.roles;
CREATE POLICY "p_roles_anon" ON public.roles FOR SELECT USING (true);

-- employee_roles anon 읽기
DROP POLICY IF EXISTS "p_employee_roles_anon" ON public.employee_roles;
CREATE POLICY "p_employee_roles_anon" ON public.employee_roles FOR SELECT USING (true);

-- employee_branch_assignments anon 읽기
DROP POLICY IF EXISTS "p_eba_anon" ON public.employee_branch_assignments;
CREATE POLICY "p_eba_anon" ON public.employee_branch_assignments FOR SELECT USING (true);
