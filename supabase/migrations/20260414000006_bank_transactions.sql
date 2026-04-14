-- bank_transactions: 통장 잔고 내역 수동 입력 테이블
create table if not exists public.bank_transactions (
  id uuid primary key default gen_random_uuid(),
  date date not null,
  bank_name text not null,
  account_alias text,
  tx_type text not null check (tx_type in ('deposit', 'withdrawal')),
  amount numeric(14,2) not null,
  balance numeric(14,2) not null,
  description text,
  created_by text not null,
  created_at timestamptz not null default now()
);

create index if not exists idx_bank_transactions_date on public.bank_transactions(date desc);

alter table public.bank_transactions enable row level security;

drop policy if exists "admin_all_bank_transactions" on public.bank_transactions;
create policy "admin_all_bank_transactions"
  on public.bank_transactions for all
  using (true)
  with check (true);
