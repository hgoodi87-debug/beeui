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
