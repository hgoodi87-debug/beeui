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

insert into storage.buckets
  (id, name, public, file_size_limit, allowed_mime_types)
values
  ('brand-public', 'brand-public', true, 10485760, array['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml']),
  ('branch-public', 'branch-public', true, 15728640, array['image/png', 'image/jpeg', 'image/webp']),
  ('ops-private', 'ops-private', false, 20971520, array['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif']),
  ('customer-private', 'customer-private', false, 15728640, array['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif']),
  ('backoffice-private', 'backoffice-private', false, 26214400, array['image/jpeg', 'image/png', 'image/webp', 'application/pdf'])
on conflict (id) do update
set name = excluded.name,
    public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

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
      'booking', 'bag', 'claim', 'branch', 'employee', 'settlement',
      'notice', 'branding', 'customer', 'backoffice'
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

commit;
