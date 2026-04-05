-- Credit accounts — one row per user, tracks current balance
create table if not exists public.credit_accounts (
  user_id      uuid        not null primary key references auth.users(id) on delete cascade,
  balance      integer     not null default 0 check (balance >= 0),
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

-- Auto-update updated_at on change
drop trigger if exists credit_accounts_set_updated_at on public.credit_accounts;
create trigger credit_accounts_set_updated_at
  before update on public.credit_accounts
  for each row execute function public.set_updated_at();

-- RLS: users can only read their own balance
alter table public.credit_accounts enable row level security;

drop policy if exists "users_read_own_credits" on public.credit_accounts;
create policy "users_read_own_credits"
  on public.credit_accounts for select
  using (auth.uid() = user_id);

-- Service role (admin client) bypasses RLS — no extra policy needed

-- Helper: deduct credits atomically (used by generation routes)
-- 호출자 본인(auth.uid() = p_user_id)만 허용
create or replace function public.deduct_credits(
  p_user_id     uuid,
  p_amount      integer,
  p_generation_id text default null
) returns integer
language plpgsql security definer as $$
declare
  v_balance integer;
begin
  -- 호출자 본인 크레딧만 차감 허용 (service_role은 RLS 우회)
  if auth.uid() is distinct from p_user_id then
    raise exception 'unauthorized: can only deduct own credits';
  end if;

  update public.credit_accounts
  set    balance    = balance - p_amount,
         updated_at = now()
  where  user_id = p_user_id
    and  balance  >= p_amount
  returning balance into v_balance;

  if not found then
    raise exception 'insufficient_credits';
  end if;

  return v_balance;
end;
$$;

-- 공개 실행 권한 제거 — service_role / 명시 GRANT만 허용
revoke execute on function public.deduct_credits(uuid, integer, text) from public;

-- Helper: admin adjust credits (add or deduct, used by admin panel)
-- staff JWT role 보유자만 호출 가능
create or replace function public.admin_adjust_credits(
  p_user_id     uuid,
  p_amount      integer,   -- positive = add, negative = deduct
  p_note        text       default null,
  p_granted_by  uuid       default null
) returns integer
language plpgsql security definer as $$
declare
  v_balance integer;
  v_caller_role text;
begin
  -- JWT app_metadata.role 확인 (service_role 경우 NULL → 통과)
  v_caller_role := coalesce(auth.jwt() -> 'app_metadata' ->> 'role', '');
  if v_caller_role not in ('admin', 'ops_manager', 'finance_staff', 'super_admin', 'hq_admin', '') then
    raise exception 'unauthorized: admin role required to adjust credits';
  end if;

  -- service_role(anon 아님) 또는 staff JWT만 허용
  if auth.uid() is not null and v_caller_role = '' then
    raise exception 'unauthorized: authenticated users without admin role cannot adjust credits';
  end if;

  insert into public.credit_accounts (user_id, balance)
  values (p_user_id, greatest(0, p_amount))
  on conflict (user_id) do update
    set balance    = greatest(0, credit_accounts.balance + p_amount),
        updated_at = now()
  returning balance into v_balance;

  return v_balance;
end;
$$;

-- 공개 실행 권한 제거 — service_role / 명시 GRANT만 허용
revoke execute on function public.admin_adjust_credits(uuid, integer, text, uuid) from public;
