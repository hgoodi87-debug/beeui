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
