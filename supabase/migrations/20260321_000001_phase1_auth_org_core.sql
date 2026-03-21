begin;

create extension if not exists pgcrypto;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  display_name text,
  account_type text not null default 'employee' check (account_type in ('employee', 'customer', 'partner')),
  avatar_url text,
  phone text,
  locale text default 'ko',
  timezone text default 'Asia/Seoul',
  last_login_at timestamptz,
  is_active boolean not null default true,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists profiles_email_lower_idx
  on public.profiles (lower(email))
  where email is not null;

create table if not exists public.roles (
  id uuid primary key default gen_random_uuid(),
  code text not null,
  name text not null,
  description text,
  is_system boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint roles_code_not_blank check (length(trim(code)) > 0)
);

create unique index if not exists roles_code_lower_idx
  on public.roles (lower(code));

create table if not exists public.branches (
  id uuid primary key default gen_random_uuid(),
  branch_code text not null,
  name text not null,
  branch_type text not null check (branch_type in ('HQ', 'HUB', 'PARTNER', 'DRIVER_GROUP')),
  status text not null default 'active' check (status in ('active', 'inactive', 'suspended', 'closed')),
  address text,
  address_detail text,
  lat numeric(10, 7),
  lng numeric(10, 7),
  phone text,
  email text,
  is_active boolean not null default true,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint branches_code_not_blank check (length(trim(branch_code)) > 0),
  constraint branches_name_not_blank check (length(trim(name)) > 0)
);

create unique index if not exists branches_code_lower_idx
  on public.branches (lower(branch_code));

create table if not exists public.employees (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null unique references public.profiles(id) on delete cascade,
  employee_code text,
  legacy_admin_doc_id text,
  name text not null,
  email text,
  login_id text,
  phone text,
  job_title text,
  org_type text check (org_type in ('HQ', 'HUB', 'PARTNER', 'DRIVER_GROUP')),
  employment_status text not null default 'active' check (employment_status in ('active', 'inactive', 'suspended', 'resigned', 'merged')),
  security jsonb not null default '{}'::jsonb,
  memo text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint employees_name_not_blank check (length(trim(name)) > 0)
);

create unique index if not exists employees_code_lower_idx
  on public.employees (lower(employee_code))
  where employee_code is not null;

create unique index if not exists employees_email_lower_idx
  on public.employees (lower(email))
  where email is not null;

create unique index if not exists employees_login_id_lower_idx
  on public.employees (lower(login_id))
  where login_id is not null;

create unique index if not exists employees_legacy_admin_doc_id_idx
  on public.employees (legacy_admin_doc_id)
  where legacy_admin_doc_id is not null;

create table if not exists public.employee_roles (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid not null references public.employees(id) on delete cascade,
  role_id uuid not null references public.roles(id) on delete restrict,
  is_primary boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint employee_roles_unique unique (employee_id, role_id)
);

create unique index if not exists employee_roles_primary_idx
  on public.employee_roles (employee_id)
  where is_primary = true;

create table if not exists public.employee_branch_assignments (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid not null references public.employees(id) on delete cascade,
  branch_id uuid not null references public.branches(id) on delete restrict,
  assignment_type text not null default 'member' check (assignment_type in ('primary', 'member', 'secondary', 'temporary', 'auditor')),
  is_primary boolean not null default false,
  starts_on date,
  ends_on date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint employee_branch_assignments_unique unique (employee_id, branch_id)
);

create unique index if not exists employee_branch_assignments_primary_idx
  on public.employee_branch_assignments (employee_id)
  where is_primary = true;

create index if not exists employee_roles_employee_id_idx
  on public.employee_roles (employee_id);

create index if not exists employee_roles_role_id_idx
  on public.employee_roles (role_id);

create index if not exists employee_branch_assignments_employee_id_idx
  on public.employee_branch_assignments (employee_id);

create index if not exists employee_branch_assignments_branch_id_idx
  on public.employee_branch_assignments (branch_id);

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

drop trigger if exists roles_set_updated_at on public.roles;
create trigger roles_set_updated_at
before update on public.roles
for each row execute function public.set_updated_at();

drop trigger if exists branches_set_updated_at on public.branches;
create trigger branches_set_updated_at
before update on public.branches
for each row execute function public.set_updated_at();

drop trigger if exists employees_set_updated_at on public.employees;
create trigger employees_set_updated_at
before update on public.employees
for each row execute function public.set_updated_at();

drop trigger if exists employee_roles_set_updated_at on public.employee_roles;
create trigger employee_roles_set_updated_at
before update on public.employee_roles
for each row execute function public.set_updated_at();

drop trigger if exists employee_branch_assignments_set_updated_at on public.employee_branch_assignments;
create trigger employee_branch_assignments_set_updated_at
before update on public.employee_branch_assignments
for each row execute function public.set_updated_at();

insert into public.roles (code, name, description)
values
  ('super_admin', 'Super Admin', '전체 시스템과 모든 지점 권한'),
  ('hq_admin', 'HQ Admin', '본사 운영 및 정산 관리 권한'),
  ('hub_manager', 'Hub Manager', '허브/지점 운영 관리 권한'),
  ('partner_manager', 'Partner Manager', '파트너 지점 운영/정산 조회 권한'),
  ('finance_staff', 'Finance Staff', '정산/재무 중심 조회 권한'),
  ('ops_staff', 'Ops Staff', '운영 실무 권한'),
  ('driver', 'Driver', '배송 기사 권한'),
  ('cs_staff', 'CS Staff', '고객 응대 권한')
on conflict ((lower(code))) do update
set
  name = excluded.name,
  description = excluded.description,
  updated_at = now();

create or replace function public.current_profile_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select auth.uid();
$$;

create or replace function public.current_employee_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select e.id
  from public.employees e
  where e.profile_id = auth.uid()
  limit 1;
$$;

create or replace function public.has_any_role(required_roles text[])
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.employees e
    join public.employee_roles er on er.employee_id = e.id
    join public.roles r on r.id = er.role_id
    where e.profile_id = auth.uid()
      and e.employment_status = 'active'
      and lower(r.code) = any (
        select lower(value)
        from unnest(required_roles) as value
      )
  );
$$;

create or replace function public.has_branch_access(target_branch_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select
    public.has_any_role(array['super_admin', 'hq_admin'])
    or public.has_any_role(array['finance_staff'])
    or exists (
      select 1
      from public.employee_branch_assignments eba
      join public.employees e on e.id = eba.employee_id
      where e.profile_id = auth.uid()
        and e.employment_status = 'active'
        and eba.branch_id = target_branch_id
        and (eba.ends_on is null or eba.ends_on >= current_date)
    );
$$;

create or replace function public.shares_branch_with_employee(target_employee_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.employee_branch_assignments mine
    join public.employees me on me.id = mine.employee_id
    join public.employee_branch_assignments target on target.branch_id = mine.branch_id
    where me.profile_id = auth.uid()
      and me.employment_status = 'active'
      and target.employee_id = target_employee_id
      and (mine.ends_on is null or mine.ends_on >= current_date)
      and (target.ends_on is null or target.ends_on >= current_date)
  );
$$;

alter table public.profiles enable row level security;
alter table public.roles enable row level security;
alter table public.branches enable row level security;
alter table public.employees enable row level security;
alter table public.employee_roles enable row level security;
alter table public.employee_branch_assignments enable row level security;

drop policy if exists "profiles_select_self_or_hq" on public.profiles;
create policy "profiles_select_self_or_hq"
on public.profiles
for select
to authenticated
using (
  id = auth.uid()
  or public.has_any_role(array['super_admin', 'hq_admin', 'finance_staff'])
);

drop policy if exists "profiles_insert_self" on public.profiles;
create policy "profiles_insert_self"
on public.profiles
for insert
to authenticated
with check (id = auth.uid());

drop policy if exists "profiles_update_self_or_hq" on public.profiles;
create policy "profiles_update_self_or_hq"
on public.profiles
for update
to authenticated
using (
  id = auth.uid()
  or public.has_any_role(array['super_admin', 'hq_admin'])
)
with check (
  id = auth.uid()
  or public.has_any_role(array['super_admin', 'hq_admin'])
);

drop policy if exists "roles_select_authenticated" on public.roles;
create policy "roles_select_authenticated"
on public.roles
for select
to authenticated
using (true);

drop policy if exists "roles_manage_hq_only" on public.roles;
create policy "roles_manage_hq_only"
on public.roles
for all
to authenticated
using (public.has_any_role(array['super_admin', 'hq_admin']))
with check (public.has_any_role(array['super_admin', 'hq_admin']));

drop policy if exists "branches_select_authenticated" on public.branches;
create policy "branches_select_authenticated"
on public.branches
for select
to authenticated
using (is_active = true or public.has_any_role(array['super_admin', 'hq_admin', 'finance_staff']));

drop policy if exists "branches_manage_hq_only" on public.branches;
create policy "branches_manage_hq_only"
on public.branches
for all
to authenticated
using (public.has_any_role(array['super_admin', 'hq_admin']))
with check (public.has_any_role(array['super_admin', 'hq_admin']));

drop policy if exists "employees_select_scoped" on public.employees;
create policy "employees_select_scoped"
on public.employees
for select
to authenticated
using (
  profile_id = auth.uid()
  or public.has_any_role(array['super_admin', 'hq_admin', 'finance_staff'])
  or (
    public.has_any_role(array['hub_manager', 'partner_manager'])
    and public.shares_branch_with_employee(id)
  )
);

drop policy if exists "employees_insert_hq_only" on public.employees;
create policy "employees_insert_hq_only"
on public.employees
for insert
to authenticated
with check (public.has_any_role(array['super_admin', 'hq_admin']));

drop policy if exists "employees_update_self_or_hq" on public.employees;
create policy "employees_update_self_or_hq"
on public.employees
for update
to authenticated
using (
  profile_id = auth.uid()
  or public.has_any_role(array['super_admin', 'hq_admin'])
)
with check (
  profile_id = auth.uid()
  or public.has_any_role(array['super_admin', 'hq_admin'])
);

drop policy if exists "employee_roles_select_scoped" on public.employee_roles;
create policy "employee_roles_select_scoped"
on public.employee_roles
for select
to authenticated
using (
  public.has_any_role(array['super_admin', 'hq_admin', 'finance_staff'])
  or exists (
    select 1
    from public.employees e
    where e.id = employee_roles.employee_id
      and e.profile_id = auth.uid()
  )
);

drop policy if exists "employee_roles_manage_hq_only" on public.employee_roles;
create policy "employee_roles_manage_hq_only"
on public.employee_roles
for all
to authenticated
using (public.has_any_role(array['super_admin', 'hq_admin']))
with check (public.has_any_role(array['super_admin', 'hq_admin']));

drop policy if exists "employee_branch_assignments_select_scoped" on public.employee_branch_assignments;
create policy "employee_branch_assignments_select_scoped"
on public.employee_branch_assignments
for select
to authenticated
using (
  public.has_any_role(array['super_admin', 'hq_admin', 'finance_staff'])
  or exists (
    select 1
    from public.employees e
    where e.id = employee_branch_assignments.employee_id
      and e.profile_id = auth.uid()
  )
  or (
    public.has_any_role(array['hub_manager', 'partner_manager'])
    and public.has_branch_access(branch_id)
  )
);

drop policy if exists "employee_branch_assignments_manage_hq_only" on public.employee_branch_assignments;
create policy "employee_branch_assignments_manage_hq_only"
on public.employee_branch_assignments
for all
to authenticated
using (public.has_any_role(array['super_admin', 'hq_admin']))
with check (public.has_any_role(array['super_admin', 'hq_admin']));

commit;
