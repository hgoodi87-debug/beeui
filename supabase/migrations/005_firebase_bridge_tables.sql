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
