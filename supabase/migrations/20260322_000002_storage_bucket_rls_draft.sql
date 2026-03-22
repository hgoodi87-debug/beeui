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

-- =========================================================
-- Beeliber Supabase Storage 정책 초안
-- 버킷 내부 object path 기준:
-- 1) branch-public:    {branch_type}/{branch_code}/{category}/{yyyymm}/{uuid}.{ext}
-- 2) ops-private:      {service_type}/{event_type}/{yyyy}/{mm}/{branch_code}/{booking_id}/{bag_id}/{uuid}.{ext}
-- 3) customer-private: {customer_id}/{topic}/{yyyy}/{mm}/{uuid}.{ext}
-- 4) backoffice-private:{domain}/{yyyy}/{mm}/{entity_id}/{uuid}.{ext}
-- =========================================================

-- =========================================================
-- 1) 버킷 생성
-- =========================================================
insert into storage.buckets
  (id, name, public, file_size_limit, allowed_mime_types)
values
  (
    'brand-public',
    'brand-public',
    true,
    10485760,
    array['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml']
  ),
  (
    'branch-public',
    'branch-public',
    true,
    15728640,
    array['image/png', 'image/jpeg', 'image/webp']
  ),
  (
    'ops-private',
    'ops-private',
    false,
    20971520,
    array['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif']
  ),
  (
    'customer-private',
    'customer-private',
    false,
    15728640,
    array['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif']
  ),
  (
    'backoffice-private',
    'backoffice-private',
    false,
    26214400,
    array['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
  )
on conflict (id) do update
set
  name = excluded.name,
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- =========================================================
-- 2) Storage 정책이 참조할 최소 앱 테이블
-- Phase 2/3 본 테이블이 아직 없을 경우를 위한 초안입니다.
-- 이미 운영 테이블이 있다면 컬럼만 맞춰서 정리하면 됩니다.
-- =========================================================
create table if not exists public.customers (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid unique references public.profiles(id) on delete set null,
  legacy_customer_id text,
  name text,
  email text,
  phone text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists customers_profile_id_idx
  on public.customers (profile_id)
  where profile_id is not null;

create unique index if not exists customers_legacy_customer_id_idx
  on public.customers (legacy_customer_id)
  where legacy_customer_id is not null;

drop trigger if exists customers_set_updated_at on public.customers;
create trigger customers_set_updated_at
before update on public.customers
for each row execute function public.set_updated_at();

create table if not exists public.bookings (
  id uuid primary key default gen_random_uuid(),
  booking_code text,
  customer_id uuid references public.customers(id) on delete set null,
  branch_id uuid references public.branches(id) on delete set null,
  created_by_user_id uuid references auth.users(id) on delete set null,
  status text not null default 'created',
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists bookings_code_lower_idx
  on public.bookings (lower(booking_code))
  where booking_code is not null;

create index if not exists bookings_branch_id_idx
  on public.bookings (branch_id);

create index if not exists bookings_customer_id_idx
  on public.bookings (customer_id);

drop trigger if exists bookings_set_updated_at on public.bookings;
create trigger bookings_set_updated_at
before update on public.bookings
for each row execute function public.set_updated_at();

create table if not exists public.storage_assets (
  id uuid primary key default gen_random_uuid(),
  bucket_id text not null,
  object_path text not null unique,
  entity_type text not null,
  entity_id uuid,
  branch_id uuid references public.branches(id) on delete set null,
  uploaded_by_user_id uuid references auth.users(id) on delete set null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint storage_assets_entity_type_check check (
    entity_type in (
      'booking',
      'bag',
      'claim',
      'branch',
      'employee',
      'settlement',
      'notice',
      'branding',
      'customer',
      'backoffice'
    )
  )
);

create index if not exists storage_assets_bucket_path_idx
  on public.storage_assets (bucket_id, object_path);

create index if not exists storage_assets_branch_id_idx
  on public.storage_assets (branch_id)
  where branch_id is not null;

drop trigger if exists storage_assets_set_updated_at on public.storage_assets;
create trigger storage_assets_set_updated_at
before update on public.storage_assets
for each row execute function public.set_updated_at();

-- =========================================================
-- 3) Helper functions
-- 기존 Phase 1의 roles / employees / branches 구조에 맞춰서 작성
-- =========================================================
create or replace function public.current_app_role()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select r.code
  from public.employees e
  join public.employee_roles er on er.employee_id = e.id
  join public.roles r on r.id = er.role_id
  where e.profile_id = auth.uid()
    and e.employment_status = 'active'
  order by er.is_primary desc, lower(r.code) asc
  limit 1
$$;

create or replace function public.is_staff()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    public.current_app_role() in (
      'driver',
      'ops_staff',
      'hub_manager',
      'partner_manager',
      'hq_admin',
      'super_admin'
    ),
    false
  )
$$;

create or replace function public.is_admin_level()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    public.current_app_role() in ('hq_admin', 'super_admin'),
    false
  )
$$;

create or replace function public.is_internal_backoffice_reader()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    public.current_app_role() in ('finance_staff', 'hq_admin', 'super_admin'),
    false
  )
$$;

create or replace function public.is_branch_manager_level()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    public.current_app_role() in ('hub_manager', 'partner_manager'),
    false
  )
$$;

create or replace function public.current_customer_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select c.id
  from public.customers c
  where c.profile_id = auth.uid()
  limit 1
$$;

create or replace function public.user_has_branch_code(branch_code_input text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.branches b
    where lower(b.branch_code) = lower(trim(branch_code_input))
      and public.has_branch_access(b.id)
  )
$$;

create or replace function public.user_owns_booking(booking_id_input uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.bookings b
    where b.id = booking_id_input
      and (
        b.created_by_user_id = auth.uid()
        or (
          public.current_customer_id() is not null
          and b.customer_id = public.current_customer_id()
        )
      )
  )
$$;

create or replace function public.object_exists_in_assets(bucket_input text, path_input text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.storage_assets sa
    where sa.bucket_id = bucket_input
      and sa.object_path = path_input
  )
$$;

create or replace function public.user_can_access_asset_branch(bucket_input text, path_input text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.storage_assets sa
    join public.branches b on b.id = sa.branch_id
    where sa.bucket_id = bucket_input
      and sa.object_path = path_input
      and public.has_branch_access(b.id)
  )
$$;

-- =========================================================
-- 4) Storage RLS
-- =========================================================
alter table storage.objects enable row level security;

-- =========================================================
-- 5) 기존 정책 정리
-- =========================================================
drop policy if exists "brand public select admin only" on storage.objects;
drop policy if exists "brand public write admin only" on storage.objects;
drop policy if exists "brand public update admin only" on storage.objects;
drop policy if exists "brand public delete admin only" on storage.objects;

drop policy if exists "branch public select scoped" on storage.objects;
drop policy if exists "branch public write staff" on storage.objects;
drop policy if exists "branch public update staff" on storage.objects;
drop policy if exists "branch public delete admin only" on storage.objects;

drop policy if exists "ops private read owner or branch staff" on storage.objects;
drop policy if exists "ops private insert staff only" on storage.objects;
drop policy if exists "ops private update admin only" on storage.objects;
drop policy if exists "ops private delete admin only" on storage.objects;

drop policy if exists "customer private read own path" on storage.objects;
drop policy if exists "customer private insert own path" on storage.objects;
drop policy if exists "customer private update own path" on storage.objects;
drop policy if exists "customer private delete admin only" on storage.objects;

drop policy if exists "backoffice private read branch or hq" on storage.objects;
drop policy if exists "backoffice private insert staff only" on storage.objects;
drop policy if exists "backoffice private update admin only" on storage.objects;
drop policy if exists "backoffice private delete admin only" on storage.objects;

-- =========================================================
-- 6) brand-public
-- 공개 URL 서빙은 bucket public 옵션으로 처리하고,
-- 쓰기/덮어쓰기/삭제만 내부 권한으로 제한
-- =========================================================
create policy "brand public select admin only"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'brand-public'
  and public.is_internal_backoffice_reader()
);

create policy "brand public write admin only"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'brand-public'
  and public.is_admin_level()
  and lower(storage.extension(name)) in ('png', 'jpg', 'jpeg', 'webp', 'svg')
);

create policy "brand public update admin only"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'brand-public'
  and public.is_admin_level()
)
with check (
  bucket_id = 'brand-public'
  and public.is_admin_level()
  and lower(storage.extension(name)) in ('png', 'jpg', 'jpeg', 'webp', 'svg')
);

create policy "brand public delete admin only"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'brand-public'
  and public.is_admin_level()
);

-- =========================================================
-- 7) branch-public
-- object path: {branch_type}/{branch_code}/{category}/{yyyymm}/{uuid}.{ext}
-- foldername(name)[1] = branch_type
-- foldername(name)[2] = branch_code
-- =========================================================
create policy "branch public select scoped"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'branch-public'
  and (
    public.is_internal_backoffice_reader()
    or public.user_has_branch_code((storage.foldername(name))[2])
  )
);

create policy "branch public write staff"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'branch-public'
  and public.is_staff()
  and lower(storage.extension(name)) in ('png', 'jpg', 'jpeg', 'webp')
  and lower((storage.foldername(name))[1]) in ('hub', 'partner')
  and public.user_has_branch_code((storage.foldername(name))[2])
);

create policy "branch public update staff"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'branch-public'
  and (
    public.is_internal_backoffice_reader()
    or public.user_has_branch_code((storage.foldername(name))[2])
  )
)
with check (
  bucket_id = 'branch-public'
  and (
    public.is_internal_backoffice_reader()
    or public.user_has_branch_code((storage.foldername(name))[2])
  )
  and lower(storage.extension(name)) in ('png', 'jpg', 'jpeg', 'webp')
);

create policy "branch public delete admin only"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'branch-public'
  and public.is_admin_level()
);

-- =========================================================
-- 8) ops-private
-- object path: {service_type}/{event_type}/{yyyy}/{mm}/{branch_code}/{booking_id}/{bag_id}/{uuid}.{ext}
-- foldername(name)[1] = service_type
-- foldername(name)[2] = event_type
-- foldername(name)[5] = branch_code
-- foldername(name)[6] = booking_id
-- =========================================================
create policy "ops private read owner or branch staff"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'ops-private'
  and (
    public.is_internal_backoffice_reader()
    or public.user_has_branch_code((storage.foldername(name))[5])
    or (
      (storage.foldername(name))[6] ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
      and public.user_owns_booking(((storage.foldername(name))[6])::uuid)
    )
  )
);

create policy "ops private insert staff only"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'ops-private'
  and public.is_staff()
  and lower(storage.extension(name)) in ('jpg', 'jpeg', 'png', 'webp', 'heic', 'heif')
  and lower((storage.foldername(name))[1]) in ('delivery', 'storage', 'claim')
  and lower((storage.foldername(name))[2]) in ('pickup', 'dropoff', 'checkin', 'checkout', 'damage')
  and public.user_has_branch_code((storage.foldername(name))[5])
);

create policy "ops private update admin only"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'ops-private'
  and public.is_admin_level()
)
with check (
  bucket_id = 'ops-private'
  and public.is_admin_level()
  and lower(storage.extension(name)) in ('jpg', 'jpeg', 'png', 'webp', 'heic', 'heif')
);

create policy "ops private delete admin only"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'ops-private'
  and public.is_admin_level()
);

-- =========================================================
-- 9) customer-private
-- object path: {customer_id}/{topic}/{yyyy}/{mm}/{uuid}.{ext}
-- foldername(name)[1] = customer_id
-- =========================================================
create policy "customer private read own path"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'customer-private'
  and (
    public.is_internal_backoffice_reader()
    or public.current_customer_id()::text = (storage.foldername(name))[1]
  )
);

create policy "customer private insert own path"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'customer-private'
  and lower(storage.extension(name)) in ('jpg', 'jpeg', 'png', 'webp', 'heic', 'heif')
  and public.current_customer_id()::text = (storage.foldername(name))[1]
);

create policy "customer private update own path"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'customer-private'
  and (
    public.is_internal_backoffice_reader()
    or public.current_customer_id()::text = (storage.foldername(name))[1]
  )
)
with check (
  bucket_id = 'customer-private'
  and (
    public.is_internal_backoffice_reader()
    or public.current_customer_id()::text = (storage.foldername(name))[1]
  )
  and lower(storage.extension(name)) in ('jpg', 'jpeg', 'png', 'webp', 'heic', 'heif')
);

create policy "customer private delete admin only"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'customer-private'
  and public.is_admin_level()
);

-- =========================================================
-- 10) backoffice-private
-- object path: {domain}/{yyyy}/{mm}/{entity_id}/{uuid}.{ext}
-- 경로만으로 부족한 내부 문서는 storage_assets 메타를 함께 확인
-- =========================================================
create policy "backoffice private read branch or hq"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'backoffice-private'
  and (
    public.is_internal_backoffice_reader()
    or (
      public.is_branch_manager_level()
      and public.object_exists_in_assets(bucket_id, name)
      and public.user_can_access_asset_branch(bucket_id, name)
    )
  )
);

create policy "backoffice private insert staff only"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'backoffice-private'
  and public.is_staff()
  and lower(storage.extension(name)) in ('jpg', 'jpeg', 'png', 'webp', 'pdf')
);

create policy "backoffice private update admin only"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'backoffice-private'
  and public.is_admin_level()
)
with check (
  bucket_id = 'backoffice-private'
  and public.is_admin_level()
  and lower(storage.extension(name)) in ('jpg', 'jpeg', 'png', 'webp', 'pdf')
);

create policy "backoffice private delete admin only"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'backoffice-private'
  and public.is_admin_level()
);

commit;
