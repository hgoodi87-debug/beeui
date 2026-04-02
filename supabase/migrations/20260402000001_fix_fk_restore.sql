-- FK 복원 (branch FK 제외 — UUID 불일치)
ALTER TABLE public.employees ADD CONSTRAINT employees_profile_id_fkey
  FOREIGN KEY (profile_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

ALTER TABLE public.employee_roles ADD CONSTRAINT employee_roles_employee_id_fkey
  FOREIGN KEY (employee_id) REFERENCES public.employees(id) ON DELETE CASCADE;

ALTER TABLE public.employee_roles ADD CONSTRAINT employee_roles_role_id_fkey
  FOREIGN KEY (role_id) REFERENCES public.roles(id) ON DELETE RESTRICT;

ALTER TABLE public.employee_branch_assignments ADD CONSTRAINT employee_branch_assignments_employee_id_fkey
  FOREIGN KEY (employee_id) REFERENCES public.employees(id) ON DELETE CASCADE;

-- branch_id FK는 UUID 불일치로 스킵 (나중에 branch 매핑 후 복원)
