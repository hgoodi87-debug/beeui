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
create extension if not exists "pgcrypto";

create table if not exists public.branch_types (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.branches (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null,
  branch_type_id uuid not null references public.branch_types(id),
  is_active boolean not null default true,
  address text,
  city text,
  timezone text not null default 'Asia/Seoul',
  open_time time,
  close_time time,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.services (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.baggage_types (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null,
  requires_manual_review boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.service_rules (
  id uuid primary key default gen_random_uuid(),
  branch_id uuid references public.branches(id),
  branch_type_id uuid references public.branch_types(id),
  service_id uuid not null references public.services(id),
  baggage_type_id uuid references public.baggage_types(id),
  allowed boolean not null default true,
  requires_manual_review boolean not null default false,
  phase_code text not null default 'PHASE_1',
  reject_message_ko text,
  reject_message_en text,
  priority int not null default 100,
  created_at timestamptz not null default now(),
  constraint service_rules_branch_or_type_check check (
    branch_id is not null or branch_type_id is not null
  )
);

create table if not exists public.customers (
  id uuid primary key,
  full_name text not null,
  language_code text not null default 'en',
  email text,
  phone text,
  created_at timestamptz not null default now()
);

create table if not exists public.reservations (
  id uuid primary key default gen_random_uuid(),
  reservation_no text not null unique,
  customer_id uuid not null references public.customers(id),
  branch_id uuid not null references public.branches(id),
  service_id uuid not null references public.services(id),
  scheduled_at timestamptz not null,
  status text not null,
  ops_status text,
  issue_status text,
  risk_level text not null default 'low',
  approval_mode text not null default 'auto',
  currency text not null default 'KRW',
  total_amount numeric(12,2) not null default 0,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint reservations_status_check check (
    status in (
      'lead_created',
      'validation_passed',
      'manual_review_required',
      'rejected',
      'payment_pending',
      'payment_completed',
      'reservation_confirmed',
      'cancelled'
    )
  ),
  constraint reservations_ops_status_check check (
    ops_status is null or ops_status in (
      'pickup_ready',
      'pickup_completed',
      'in_transit',
      'arrived_at_destination',
      'handover_pending',
      'handover_completed',
      'completed'
    )
  ),
  constraint reservations_issue_status_check check (
    issue_status is null or issue_status in (
      'issue_open',
      'issue_in_progress',
      'issue_waiting_customer',
      'issue_waiting_internal',
      'issue_resolved',
      'issue_closed'
    )
  ),
  constraint reservations_risk_level_check check (
    risk_level in ('low', 'medium', 'high')
  ),
  constraint reservations_approval_mode_check check (
    approval_mode in ('auto', 'manual')
  )
);

create table if not exists public.reservation_items (
  id uuid primary key default gen_random_uuid(),
  reservation_id uuid not null references public.reservations(id) on delete cascade,
  baggage_type_id uuid not null references public.baggage_types(id),
  quantity int not null check (quantity > 0),
  size_note text,
  requires_manual_review boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  reservation_id uuid not null references public.reservations(id) on delete cascade,
  provider text not null,
  payment_key text,
  status text not null,
  amount numeric(12,2) not null,
  paid_at timestamptz,
  failed_reason text,
  created_at timestamptz not null default now(),
  constraint payments_status_check check (
    status in ('pending', 'paid', 'failed', 'refunded')
  )
);

create table if not exists public.delivery_assignments (
  id uuid primary key default gen_random_uuid(),
  reservation_id uuid not null references public.reservations(id) on delete cascade,
  driver_name text,
  driver_phone text,
  assigned_at timestamptz,
  eta timestamptz,
  sla_due_at timestamptz,
  status text not null default 'unassigned',
  created_at timestamptz not null default now(),
  constraint delivery_assignments_status_check check (
    status in ('unassigned', 'assigned', 'arrived_pickup', 'picked_up', 'arrived_destination', 'handover_done', 'cancelled')
  )
);

create table if not exists public.proof_assets (
  id uuid primary key default gen_random_uuid(),
  reservation_id uuid not null references public.reservations(id) on delete cascade,
  asset_type text not null,
  file_url text not null,
  uploaded_by text,
  created_at timestamptz not null default now(),
  constraint proof_assets_type_check check (
    asset_type in ('pickup_photo', 'handover_photo', 'receipt')
  )
);

create table if not exists public.issue_tickets (
  id uuid primary key default gen_random_uuid(),
  reservation_id uuid not null references public.reservations(id) on delete cascade,
  issue_code text not null,
  severity text not null default 'medium',
  status text not null default 'open',
  title text not null,
  description text,
  assigned_to text,
  opened_at timestamptz not null default now(),
  resolved_at timestamptz,
  constraint issue_tickets_severity_check check (
    severity in ('low', 'medium', 'high', 'critical')
  ),
  constraint issue_tickets_status_check check (
    status in ('open', 'in_progress', 'waiting_customer', 'waiting_internal', 'resolved', 'closed')
  )
);

create table if not exists public.operation_status_logs (
  id uuid primary key default gen_random_uuid(),
  reservation_id uuid not null references public.reservations(id) on delete cascade,
  from_status text,
  to_status text not null,
  changed_by text not null,
  reason text,
  created_at timestamptz not null default now()
);

create table if not exists public.ai_outputs (
  id uuid primary key default gen_random_uuid(),
  use_case text not null,
  source_ref text,
  input_context jsonb not null default '{}'::jsonb,
  generated_text text not null,
  risk_score numeric(5,2) not null default 0,
  policy_passed boolean not null default false,
  approval_status text not null default 'review_pending',
  reviewer_id text,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  constraint ai_outputs_approval_status_check check (
    approval_status in ('review_pending', 'approved', 'rejected', 'published')
  )
);

create table if not exists public.ai_review_logs (
  id uuid primary key default gen_random_uuid(),
  ai_output_id uuid not null references public.ai_outputs(id) on delete cascade,
  check_type text not null,
  result text not null,
  detail text,
  created_at timestamptz not null default now(),
  constraint ai_review_logs_result_check check (
    result in ('pass', 'fail', 'warning')
  )
);

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  reservation_id uuid references public.reservations(id) on delete cascade,
  channel text not null,
  template_code text not null,
  recipient text not null,
  status text not null default 'queued',
  sent_at timestamptz,
  created_at timestamptz not null default now(),
  constraint notifications_channel_check check (
    channel in ('kakao', 'sms', 'email', 'slack')
  ),
  constraint notifications_status_check check (
    status in ('queued', 'sent', 'failed')
  )
);

create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  entity_type text not null,
  entity_id text not null,
  action text not null,
  actor text not null,
  before_data jsonb,
  after_data jsonb,
  created_at timestamptz not null default now()
);
create index if not exists idx_branches_branch_type_id on public.branches(branch_type_id);
create index if not exists idx_service_rules_branch_id on public.service_rules(branch_id);
create index if not exists idx_service_rules_branch_type_id on public.service_rules(branch_type_id);
create index if not exists idx_service_rules_service_id on public.service_rules(service_id);
create index if not exists idx_service_rules_baggage_type_id on public.service_rules(baggage_type_id);
create index if not exists idx_reservations_customer_id on public.reservations(customer_id);
create index if not exists idx_reservations_branch_id on public.reservations(branch_id);
create index if not exists idx_reservations_service_id on public.reservations(service_id);
create index if not exists idx_reservations_status on public.reservations(status);
create index if not exists idx_reservations_ops_status on public.reservations(ops_status);
create index if not exists idx_reservations_issue_status on public.reservations(issue_status);
create index if not exists idx_reservations_scheduled_at on public.reservations(scheduled_at);
create index if not exists idx_reservation_items_reservation_id on public.reservation_items(reservation_id);
create index if not exists idx_payments_reservation_id on public.payments(reservation_id);
create index if not exists idx_payments_status on public.payments(status);
create index if not exists idx_delivery_assignments_reservation_id on public.delivery_assignments(reservation_id);
create index if not exists idx_delivery_assignments_status on public.delivery_assignments(status);
create index if not exists idx_proof_assets_reservation_id on public.proof_assets(reservation_id);
create index if not exists idx_issue_tickets_reservation_id on public.issue_tickets(reservation_id);
create index if not exists idx_issue_tickets_status on public.issue_tickets(status);
create index if not exists idx_issue_tickets_issue_code on public.issue_tickets(issue_code);
create index if not exists idx_operation_status_logs_reservation_id on public.operation_status_logs(reservation_id);
create index if not exists idx_ai_outputs_approval_status on public.ai_outputs(approval_status);
create index if not exists idx_ai_outputs_use_case on public.ai_outputs(use_case);
create index if not exists idx_ai_review_logs_ai_output_id on public.ai_review_logs(ai_output_id);
create index if not exists idx_notifications_reservation_id on public.notifications(reservation_id);
create index if not exists idx_notifications_status on public.notifications(status);
create index if not exists idx_audit_logs_entity_type_entity_id on public.audit_logs(entity_type, entity_id);
alter table public.customers enable row level security;
alter table public.reservations enable row level security;
alter table public.reservation_items enable row level security;
alter table public.payments enable row level security;
alter table public.proof_assets enable row level security;
alter table public.issue_tickets enable row level security;
alter table public.operation_status_logs enable row level security;
alter table public.ai_outputs enable row level security;
alter table public.ai_review_logs enable row level security;
alter table public.notifications enable row level security;
alter table public.audit_logs enable row level security;

-- customers
create policy "customers can view own profile"
on public.customers
for select
using (id = auth.uid());

create policy "customers can update own profile"
on public.customers
for update
using (id = auth.uid())
with check (id = auth.uid());

-- reservations
create policy "customers can view own reservations"
on public.reservations
for select
using (customer_id = auth.uid());

create policy "customers can create own reservations"
on public.reservations
for insert
with check (customer_id = auth.uid());

create policy "customers can view own reservation items"
on public.reservation_items
for select
using (
  exists (
    select 1
    from public.reservations r
    where r.id = reservation_items.reservation_id
      and r.customer_id = auth.uid()
  )
);

create policy "customers can view own payments"
on public.payments
for select
using (
  exists (
    select 1
    from public.reservations r
    where r.id = payments.reservation_id
      and r.customer_id = auth.uid()
  )
);

create policy "customers can view own proofs"
on public.proof_assets
for select
using (
  exists (
    select 1
    from public.reservations r
    where r.id = proof_assets.reservation_id
      and r.customer_id = auth.uid()
  )
);

create policy "customers can view own issues"
on public.issue_tickets
for select
using (
  exists (
    select 1
    from public.reservations r
    where r.id = issue_tickets.reservation_id
      and r.customer_id = auth.uid()
  )
);

create policy "customers can view own notifications"
on public.notifications
for select
using (
  exists (
    select 1
    from public.reservations r
    where r.id = notifications.reservation_id
      and r.customer_id = auth.uid()
  )
);

-- admin / ops / finance / marketing access
create policy "staff full access reservations"
on public.reservations
for all
using (coalesce(auth.jwt() ->> 'role', '') in ('admin','ops_manager'))
with check (coalesce(auth.jwt() ->> 'role', '') in ('admin','ops_manager'));

create policy "staff full access reservation_items"
on public.reservation_items
for all
using (coalesce(auth.jwt() ->> 'role', '') in ('admin','ops_manager'))
with check (coalesce(auth.jwt() ->> 'role', '') in ('admin','ops_manager'));

create policy "finance full access payments"
on public.payments
for all
using (coalesce(auth.jwt() ->> 'role', '') in ('admin','ops_manager','finance'))
with check (coalesce(auth.jwt() ->> 'role', '') in ('admin','ops_manager','finance'));

create policy "ops staff full access issues"
on public.issue_tickets
for all
using (coalesce(auth.jwt() ->> 'role', '') in ('admin','ops_manager','ops_staff'))
with check (coalesce(auth.jwt() ->> 'role', '') in ('admin','ops_manager','ops_staff'));

create policy "ops staff full access operation logs"
on public.operation_status_logs
for all
using (coalesce(auth.jwt() ->> 'role', '') in ('admin','ops_manager','ops_staff'))
with check (coalesce(auth.jwt() ->> 'role', '') in ('admin','ops_manager','ops_staff'));

create policy "drivers and ops can manage proofs"
on public.proof_assets
for all
using (coalesce(auth.jwt() ->> 'role', '') in ('admin','ops_manager','ops_staff','driver'))
with check (coalesce(auth.jwt() ->> 'role', '') in ('admin','ops_manager','ops_staff','driver'));

create policy "marketing and content can manage ai outputs"
on public.ai_outputs
for all
using (coalesce(auth.jwt() ->> 'role', '') in ('admin','ops_manager','marketing','content_manager'))
with check (coalesce(auth.jwt() ->> 'role', '') in ('admin','ops_manager','marketing','content_manager'));

create policy "marketing and content can manage ai review logs"
on public.ai_review_logs
for all
using (coalesce(auth.jwt() ->> 'role', '') in ('admin','ops_manager','marketing','content_manager'))
with check (coalesce(auth.jwt() ->> 'role', '') in ('admin','ops_manager','marketing','content_manager'));

create policy "ops can manage notifications"
on public.notifications
for all
using (coalesce(auth.jwt() ->> 'role', '') in ('admin','ops_manager','ops_staff','marketing'))
with check (coalesce(auth.jwt() ->> 'role', '') in ('admin','ops_manager','ops_staff','marketing'));

create policy "admins can manage audit logs"
on public.audit_logs
for all
using (coalesce(auth.jwt() ->> 'role', '') in ('admin','ops_manager'))
with check (coalesce(auth.jwt() ->> 'role', '') in ('admin','ops_manager'));
insert into public.branch_types (code, name)
values
  ('HUB', '배송+보관'),
  ('PARTNER', '보관 전용')
on conflict (code) do nothing;

insert into public.services (code, name)
values
  ('STORAGE', '보관'),
  ('HUB_TO_AIRPORT', 'Hub → 인천공항 배송')
on conflict (code) do nothing;

insert into public.baggage_types (code, name, requires_manual_review)
values
  ('SHOPPING_BAG', '쇼핑백', false),
  ('CARRY_ON', '기내용 캐리어', false),
  ('SUITCASE', '대형 캐리어', false),
  ('SPECIAL', '특수짐', true)
on conflict (code) do nothing;

-- branch type level baseline rules
insert into public.service_rules (
  branch_type_id,
  service_id,
  baggage_type_id,
  allowed,
  requires_manual_review,
  phase_code,
  reject_message_ko,
  reject_message_en,
  priority
)
select
  bt.id,
  s.id,
  b.id,
  case
    when bt.code = 'PARTNER' and s.code = 'HUB_TO_AIRPORT' then false
    else true
  end as allowed,
  case
    when b.code = 'SPECIAL' then true
    else false
  end as requires_manual_review,
  'PHASE_1',
  case
    when bt.code = 'PARTNER' and s.code = 'HUB_TO_AIRPORT' then '해당 지점은 현재 공항 배송을 운영하지 않습니다.'
    else null
  end,
  case
    when bt.code = 'PARTNER' and s.code = 'HUB_TO_AIRPORT' then 'This location currently does not support airport delivery.'
    else null
  end,
  100
from public.branch_types bt
cross join public.services s
cross join public.baggage_types b
where not exists (
  select 1 from public.service_rules sr
  where sr.branch_type_id = bt.id
    and sr.service_id = s.id
    and sr.baggage_type_id = b.id
    and sr.phase_code = 'PHASE_1'
);

-- recommended issue code reference comments
comment on table public.issue_tickets is 'Recommended issue_code values: OPS-001 customer_no_response, OPS-002 branch_hours_mismatch, OPS-003 driver_delay, OPS-004 address_mismatch, OPS-005 proof_missing, OPS-006 baggage_mismatch, OPS-007 invalid_after_payment, OPS-008 onsite_rejection, OPS-009 damage_loss_suspected, OPS-010 airport_handover_failed';
-- ============================================================
-- 005: Firebase → Supabase 브릿지 테이블 (17개 신규)
-- Firebase 23개 컬렉션 → Supabase 완전 매핑
-- 적용일: 2026-03-26
-- ============================================================

-- 1. locations (다국어 지점/센터 마스터)
create table if not exists public.locations (
  id uuid primary key default gen_random_uuid(),
  short_code text unique,
  name text not null,
  name_en text, name_ja text, name_zh text, name_zh_tw text, name_zh_hk text,
  type text not null default 'PARTNER',
  address text, address_en text, address_ja text, address_zh text, address_zh_tw text, address_zh_hk text,
  description text, description_en text, description_ja text, description_zh text, description_zh_tw text, description_zh_hk text,
  pickup_guide text, pickup_guide_en text, pickup_guide_ja text, pickup_guide_zh text, pickup_guide_zh_tw text, pickup_guide_zh_hk text,
  business_hours text, business_hours_en text, business_hours_ja text, business_hours_zh text, business_hours_zh_tw text, business_hours_zh_hk text,
  supports_delivery boolean not null default false,
  supports_storage boolean not null default true,
  is_origin boolean not null default false,
  is_destination boolean not null default false,
  lat numeric, lng numeric,
  origin_surcharge numeric(12,2) default 0,
  destination_surcharge numeric(12,2) default 0,
  image_url text,
  is_active boolean not null default true,
  is_partner boolean not null default false,
  branch_code text, owner_name text, phone text,
  commission_rate_delivery numeric(5,2) default 0,
  commission_rate_storage numeric(5,2) default 0,
  branch_id uuid references public.branches(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint locations_type_check check (type in ('AIRPORT','HOTEL','STATION','PARTNER','LOCAL_HOME','AIRBNB','GUESTHOUSE','OTHER'))
);

-- 2. booking_details (예약 확장 필드)
create table if not exists public.booking_details (
  id uuid primary key default gen_random_uuid(),
  reservation_id uuid not null references public.reservations(id) on delete cascade,
  sns_channel text, sns_id text, country text,
  pickup_location_id uuid references public.locations(id),
  pickup_address text, pickup_address_detail text, pickup_image_url text,
  pickup_date date, pickup_time time,
  dropoff_location_id uuid references public.locations(id),
  dropoff_address text, dropoff_address_detail text,
  dropoff_date date, delivery_time time, return_date date, return_time time,
  insurance_level int, insurance_bag_count int, use_insurance boolean default false,
  base_price numeric(12,2) default 0, final_price numeric(12,2) default 0,
  promo_code text, discount_amount numeric(12,2) default 0,
  weight_surcharge_5kg numeric(12,2) default 0, weight_surcharge_10kg numeric(12,2) default 0,
  payment_method text, payment_provider text, payment_order_id text, payment_key text,
  payment_receipt_url text, payment_approved_at timestamptz,
  agreed_to_terms boolean default false, agreed_to_privacy boolean default false, agreed_to_high_value boolean default false,
  branch_commission_delivery numeric(5,2), branch_commission_storage numeric(5,2),
  branch_settlement_amount numeric(12,2), settlement_status text, settled_at timestamptz, settled_by text,
  reservation_code text, language text default 'en', image_url text,
  created_at timestamptz not null default now()
);

-- 3. daily_closings
create table if not exists public.daily_closings (
  id uuid primary key default gen_random_uuid(),
  branch_id uuid references public.branches(id),
  date date not null,
  total_revenue numeric(12,2) not null default 0,
  cash_revenue numeric(12,2) default 0, card_revenue numeric(12,2) default 0,
  apple_revenue numeric(12,2) default 0, samsung_revenue numeric(12,2) default 0,
  wechat_revenue numeric(12,2) default 0, alipay_revenue numeric(12,2) default 0,
  naver_revenue numeric(12,2) default 0, kakao_revenue numeric(12,2) default 0, paypal_revenue numeric(12,2) default 0,
  actual_cash_on_hand numeric(12,2) default 0, difference numeric(12,2) default 0,
  notes text, closed_by text not null,
  created_at timestamptz not null default now()
);

-- 4. expenditures
create table if not exists public.expenditures (
  id uuid primary key default gen_random_uuid(),
  branch_id uuid references public.branches(id),
  date date not null, category text not null,
  amount numeric(12,2) not null, description text,
  created_by text not null, created_at timestamptz not null default now()
);

-- 5. partnership_inquiries
create table if not exists public.partnership_inquiries (
  id uuid primary key default gen_random_uuid(),
  company_name text not null, contact_name text, position text,
  email text, phone text, message text, location text, business_type text,
  status text not null default 'NEW', assigned_admin_id text, notes text,
  created_at timestamptz not null default now(),
  constraint inquiries_status_check check (status in ('NEW','CONTACTED','NEGOTIATING','CONVERTED','REJECTED'))
);

-- 6. branch_prospects
create table if not exists public.branch_prospects (
  id uuid primary key default gen_random_uuid(),
  name text not null, address text, lat numeric, lng numeric,
  contact_person text, phone text, email text,
  status text not null default 'PROSPECTING', potential_score int default 0, notes text,
  partnership_inquiry_id uuid references public.partnership_inquiries(id),
  expected_open_date date,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  constraint prospects_status_check check (status in ('PROSPECTING','NEGOTIATING','READY','ACTIVE','ON_HOLD'))
);

-- 7. system_notices
create table if not exists public.system_notices (
  id uuid primary key default gen_random_uuid(),
  title text not null, category text not null default 'NOTICE',
  is_active boolean not null default true, image_url text, content text, link_url text,
  start_date timestamptz, end_date timestamptz,
  created_at timestamptz not null default now(),
  constraint notices_category_check check (category in ('NOTICE','NEWS','EVENT','FAQ'))
);

-- 8. discount_codes
create table if not exists public.discount_codes (
  id uuid primary key default gen_random_uuid(),
  code text not null unique, amount_per_bag numeric(12,2) not null default 0,
  description text, is_active boolean not null default true,
  allowed_service text default 'ALL',
  created_at timestamptz not null default now(),
  constraint discount_allowed_service_check check (allowed_service in ('DELIVERY','STORAGE','ALL'))
);

-- 9. user_coupons
create table if not exists public.user_coupons (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null, discount_code_id uuid references public.discount_codes(id),
  code text not null, amount_per_bag numeric(12,2) not null default 0,
  description text, is_used boolean not null default false,
  used_at timestamptz, expiry_date timestamptz,
  issued_at timestamptz not null default now()
);

-- 10. chat_sessions
create table if not exists public.chat_sessions (
  id uuid primary key default gen_random_uuid(),
  session_id text not null unique,
  user_name text, user_email text, last_message text,
  is_bot_disabled boolean not null default false, unread_count int not null default 0,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);

-- 11. chat_messages
create table if not exists public.chat_messages (
  id uuid primary key default gen_random_uuid(),
  session_id text not null references public.chat_sessions(session_id) on delete cascade,
  role text not null, text text not null,
  user_name text, user_email text, is_read boolean not null default false,
  created_at timestamptz not null default now(),
  constraint chat_role_check check (role in ('user','model','admin'))
);

-- 12. app_settings
create table if not exists public.app_settings (
  id uuid primary key default gen_random_uuid(),
  key text not null unique, value jsonb not null default '{}'::jsonb,
  updated_by text, updated_at timestamptz not null default now()
);

-- 13. storage_tiers
create table if not exists public.storage_tiers (
  id uuid primary key default gen_random_uuid(),
  tier_code text not null unique, label text not null,
  price_hand_bag numeric(12,2) not null default 0,
  price_carrier numeric(12,2) not null default 0,
  price_stroller_bicycle numeric(12,2) not null default 0,
  is_active boolean not null default true, sort_order int not null default 0,
  created_at timestamptz not null default now()
);

-- 14. cms_areas
create table if not exists public.cms_areas (
  id uuid primary key default gen_random_uuid(),
  area_slug text not null unique,
  area_name_ko text, area_name_en text, area_name_ja text, area_name_zh text,
  headline_ko text, headline_en text, intro_text_ko text, intro_text_en text,
  cover_image_url text, is_priority_area boolean not null default false,
  sort_order int not null default 0,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);

-- 15. cms_themes
create table if not exists public.cms_themes (
  id uuid primary key default gen_random_uuid(),
  theme_slug text not null unique,
  theme_name_ko text, theme_name_en text, description_ko text, description_en text,
  icon text, sort_order int not null default 0, is_active boolean not null default true,
  created_at timestamptz not null default now()
);

-- 16. cms_contents
create table if not exists public.cms_contents (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title_ko text, title_en text, title_ja text, title_zh text,
  summary_ko text, summary_en text,
  body_ko text, body_en text, body_ja text, body_zh text,
  content_type text not null default 'landmark',
  area_slug text references public.cms_areas(area_slug),
  cover_image_url text, recommended_time text,
  audience_tags text[] default '{}', theme_tags text[] default '{}',
  official_url text, source_name text, start_date date, end_date date,
  publish_status text not null default 'draft',
  language_available text[] default '{ko,en}',
  author_id text, reviewer_id text, review_comment text,
  quality_score int, priority_score int, is_foreigner_friendly boolean default true,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  constraint cms_content_type_check check (content_type in ('landmark','hotplace','attraction','event')),
  constraint cms_publish_status_check check (publish_status in ('draft','in_review','approved','published','rejected','archived'))
);

-- 17. legal_documents
create table if not exists public.legal_documents (
  id uuid primary key default gen_random_uuid(),
  doc_type text not null, language text not null default 'ko',
  title text, content text, articles jsonb default '[]'::jsonb,
  updated_by text,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  constraint legal_doc_type_check check (doc_type in ('terms','privacy','qna','refund')),
  unique(doc_type, language)
);

-- 인덱스
create index if not exists idx_locations_branch_id on public.locations(branch_id);
create index if not exists idx_locations_type on public.locations(type);
create index if not exists idx_booking_details_reservation_id on public.booking_details(reservation_id);
create index if not exists idx_daily_closings_date on public.daily_closings(date);
create index if not exists idx_daily_closings_branch_id on public.daily_closings(branch_id);
create index if not exists idx_expenditures_date on public.expenditures(date);
create index if not exists idx_discount_codes_code on public.discount_codes(code);
create index if not exists idx_user_coupons_user_id on public.user_coupons(user_id);
create index if not exists idx_chat_messages_session_id on public.chat_messages(session_id);
create index if not exists idx_cms_contents_area_slug on public.cms_contents(area_slug);
create index if not exists idx_cms_contents_publish_status on public.cms_contents(publish_status);
--- 추가 마이그레이션 (브릿지 + RLS + 스키마 수정) ---

-- Bridge: branch_types 시드 + branches.branch_type_id
INSERT INTO public.branch_types (code, name) VALUES ('HUB','배송+보관'),('PARTNER','보관 전용'),('HQ','본사') ON CONFLICT (code) DO NOTHING;
ALTER TABLE public.branches ADD COLUMN IF NOT EXISTS branch_type_id uuid REFERENCES public.branch_types(id);
ALTER TABLE public.branches ADD COLUMN IF NOT EXISTS city text;
ALTER TABLE public.branches ADD COLUMN IF NOT EXISTS timezone text NOT NULL DEFAULT 'Asia/Seoul';
ALTER TABLE public.branches ADD COLUMN IF NOT EXISTS open_time time;
ALTER TABLE public.branches ADD COLUMN IF NOT EXISTS close_time time;

-- booking_details 누락 컬럼
ALTER TABLE public.booking_details ALTER COLUMN reservation_id DROP NOT NULL;
ALTER TABLE public.booking_details ADD COLUMN IF NOT EXISTS service_type text;
ALTER TABLE public.booking_details ADD COLUMN IF NOT EXISTS user_name text;
ALTER TABLE public.booking_details ADD COLUMN IF NOT EXISTS user_email text;
ALTER TABLE public.booking_details ADD COLUMN IF NOT EXISTS pickup_location text;
ALTER TABLE public.booking_details ADD COLUMN IF NOT EXISTS dropoff_location text;

-- roles unique constraint + 신규 역할
-- roles_code_unique는 이미 roles_code_lower_idx로 존재하므로 스킵
INSERT INTO public.roles (code, name, description, is_system) VALUES
  ('marketing','Marketing','AI 콘텐츠 생성·검수',true),
  ('content_manager','Content Manager','AI 출력 승인·배포',true),
  ('customer','Customer','고객 계정',true)
ON CONFLICT ((lower(code))) DO NOTHING;

-- Google Reviews 테이블
CREATE TABLE IF NOT EXISTS public.google_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  place_id text NOT NULL,
  author_name text NOT NULL,
  author_photo_url text,
  rating int NOT NULL CHECK (rating >= 1 AND rating <= 5),
  text text,
  language text DEFAULT 'ko',
  relative_time text,
  review_time timestamptz,
  is_featured boolean NOT NULL DEFAULT false,
  is_visible boolean NOT NULL DEFAULT true,
  fetched_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_google_reviews_place_id ON public.google_reviews(place_id);

CREATE TABLE IF NOT EXISTS public.google_review_summary (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  place_id text NOT NULL UNIQUE,
  place_name text,
  total_reviews int NOT NULL DEFAULT 0,
  average_rating numeric(3,2) NOT NULL DEFAULT 0,
  last_synced_at timestamptz NOT NULL DEFAULT now()
);

-- 공개 RLS 정책 (22개 테이블)
DROP POLICY IF EXISTS "public_read_locations" ON public.locations; CREATE POLICY "public_read_locations" ON public.locations FOR SELECT USING (true);
DROP POLICY IF EXISTS "public_read_app_settings" ON public.app_settings; CREATE POLICY "public_read_app_settings" ON public.app_settings FOR SELECT USING (true);
DROP POLICY IF EXISTS "public_read_discount_codes" ON public.discount_codes; CREATE POLICY "public_read_discount_codes" ON public.discount_codes FOR SELECT USING (true);
DROP POLICY IF EXISTS "public_read_services" ON public.services; CREATE POLICY "public_read_services" ON public.services FOR SELECT USING (true);
DROP POLICY IF EXISTS "public_read_baggage_types" ON public.baggage_types; CREATE POLICY "public_read_baggage_types" ON public.baggage_types FOR SELECT USING (true);
DROP POLICY IF EXISTS "public_read_branch_types" ON public.branch_types; CREATE POLICY "public_read_branch_types" ON public.branch_types FOR SELECT USING (true);
DROP POLICY IF EXISTS "public_read_service_rules" ON public.service_rules; CREATE POLICY "public_read_service_rules" ON public.service_rules FOR SELECT USING (true);
DROP POLICY IF EXISTS "public_read_storage_tiers" ON public.storage_tiers; CREATE POLICY "public_read_storage_tiers" ON public.storage_tiers FOR SELECT USING (true);
DROP POLICY IF EXISTS "public_read_system_notices" ON public.system_notices; CREATE POLICY "public_read_system_notices" ON public.system_notices FOR SELECT USING (is_active = true);
DROP POLICY IF EXISTS "public_read_cms_areas" ON public.cms_areas; CREATE POLICY "public_read_cms_areas" ON public.cms_areas FOR SELECT USING (true);
DROP POLICY IF EXISTS "public_read_cms_themes" ON public.cms_themes; CREATE POLICY "public_read_cms_themes" ON public.cms_themes FOR SELECT USING (true);
DROP POLICY IF EXISTS "public_read_cms_contents" ON public.cms_contents; CREATE POLICY "public_read_cms_contents" ON public.cms_contents FOR SELECT USING (true);
DROP POLICY IF EXISTS "public_read_legal_documents" ON public.legal_documents; CREATE POLICY "public_read_legal_documents" ON public.legal_documents FOR SELECT USING (true);
DROP POLICY IF EXISTS "public_all_chat_sessions" ON public.chat_sessions; CREATE POLICY "public_all_chat_sessions" ON public.chat_sessions FOR ALL USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "public_all_chat_messages" ON public.chat_messages; CREATE POLICY "public_all_chat_messages" ON public.chat_messages FOR ALL USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "public_insert_booking_details" ON public.booking_details; CREATE POLICY "public_insert_booking_details" ON public.booking_details FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "public_read_booking_details" ON public.booking_details; CREATE POLICY "public_read_booking_details" ON public.booking_details FOR SELECT USING (true);
DROP POLICY IF EXISTS "public_read_branches" ON public.branches; CREATE POLICY "public_read_branches" ON public.branches FOR SELECT USING (is_active = true);
DROP POLICY IF EXISTS "public_read_employees" ON public.employees; CREATE POLICY "public_read_employees" ON public.employees FOR SELECT USING (true);
DROP POLICY IF EXISTS "public_read_google_reviews" ON public.google_reviews; CREATE POLICY "public_read_google_reviews" ON public.google_reviews FOR SELECT USING (is_visible = true);
DROP POLICY IF EXISTS "public_read_review_summary" ON public.google_review_summary; CREATE POLICY "public_read_review_summary" ON public.google_review_summary FOR SELECT USING (true);
DROP POLICY IF EXISTS "admin_all_daily_closings" ON public.daily_closings; CREATE POLICY "admin_all_daily_closings" ON public.daily_closings FOR ALL USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "admin_all_expenditures" ON public.expenditures; CREATE POLICY "admin_all_expenditures" ON public.expenditures FOR ALL USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "admin_all_branch_prospects" ON public.branch_prospects; CREATE POLICY "admin_all_branch_prospects" ON public.branch_prospects FOR ALL USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "admin_update_booking_details" ON public.booking_details; CREATE POLICY "admin_update_booking_details" ON public.booking_details FOR UPDATE USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "admin_write_locations" ON public.locations; CREATE POLICY "admin_write_locations" ON public.locations FOR ALL USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "admin_write_app_settings" ON public.app_settings; CREATE POLICY "admin_write_app_settings" ON public.app_settings FOR ALL USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "admin_write_discount_codes" ON public.discount_codes; CREATE POLICY "admin_write_discount_codes" ON public.discount_codes FOR ALL USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "admin_write_system_notices" ON public.system_notices; CREATE POLICY "admin_write_system_notices" ON public.system_notices FOR ALL USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "admin_write_cms_areas" ON public.cms_areas; CREATE POLICY "admin_write_cms_areas" ON public.cms_areas FOR ALL USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "admin_write_cms_themes" ON public.cms_themes; CREATE POLICY "admin_write_cms_themes" ON public.cms_themes FOR ALL USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "admin_write_cms_contents" ON public.cms_contents; CREATE POLICY "admin_write_cms_contents" ON public.cms_contents FOR ALL USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "admin_all_google_reviews" ON public.google_reviews; CREATE POLICY "admin_all_google_reviews" ON public.google_reviews FOR ALL USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "admin_all_review_summary" ON public.google_review_summary; CREATE POLICY "admin_all_review_summary" ON public.google_review_summary FOR ALL USING (true) WITH CHECK (true);

-- DB Triggers for Edge Functions
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

CREATE OR REPLACE FUNCTION public.trigger_on_booking_created() RETURNS trigger AS $$
BEGIN
  PERFORM extensions.http_post(
    url := 'https://xpnfjolqiffduedwtxey.supabase.co/functions/v1/on-booking-created',
    body := jsonb_build_object('type','INSERT','table','booking_details','record',row_to_json(NEW)::jsonb)::text,
    headers := jsonb_build_object('Content-Type','application/json')::jsonb
  );
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING '[trigger] Edge Function call failed: %', SQLERRM;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.trigger_on_booking_updated() RETURNS trigger AS $$
BEGIN
  PERFORM extensions.http_post(
    url := 'https://xpnfjolqiffduedwtxey.supabase.co/functions/v1/on-booking-updated',
    body := jsonb_build_object('type','UPDATE','table','booking_details','record',row_to_json(NEW)::jsonb,'old_record',row_to_json(OLD)::jsonb)::text,
    headers := jsonb_build_object('Content-Type','application/json')::jsonb
  );
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING '[trigger] Edge Function call failed: %', SQLERRM;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_booking_details_insert ON public.booking_details;
CREATE TRIGGER on_booking_details_insert AFTER INSERT ON public.booking_details FOR EACH ROW EXECUTE FUNCTION public.trigger_on_booking_created();
DROP TRIGGER IF EXISTS on_booking_details_update ON public.booking_details;
CREATE TRIGGER on_booking_details_update AFTER UPDATE ON public.booking_details FOR EACH ROW EXECUTE FUNCTION public.trigger_on_booking_updated();
