-- =============================================
-- PART 2: 하네스 테이블 + 브릿지 테이블 전체
-- PART 1 실행 완료 후 실행
-- =============================================

-- branches 확장 컬럼 추가
create table if not exists public.branch_types (id uuid primary key default gen_random_uuid(), code text not null unique, name text not null, created_at timestamptz not null default now());
insert into public.branch_types (code, name) values ('HUB','배송+보관'),('PARTNER','보관 전용'),('HQ','본사') on conflict (code) do nothing;
alter table public.branches add column if not exists branch_type_id uuid references public.branch_types(id);
alter table public.branches add column if not exists city text;
alter table public.branches add column if not exists timezone text not null default 'Asia/Seoul';
alter table public.branches add column if not exists open_time time;
alter table public.branches add column if not exists close_time time;

-- services, baggage_types
create table if not exists public.services (id uuid primary key default gen_random_uuid(), code text not null unique, name text not null, is_active boolean not null default true, created_at timestamptz not null default now());
create table if not exists public.baggage_types (id uuid primary key default gen_random_uuid(), code text not null unique, name text not null, requires_manual_review boolean not null default false, created_at timestamptz not null default now());

-- service_rules
create table if not exists public.service_rules (id uuid primary key default gen_random_uuid(), branch_id uuid references public.branches(id), branch_type_id uuid references public.branch_types(id), service_id uuid not null references public.services(id), baggage_type_id uuid references public.baggage_types(id), allowed boolean not null default true, requires_manual_review boolean not null default false, phase_code text not null default 'PHASE_1', reject_message_ko text, reject_message_en text, priority int not null default 100, created_at timestamptz not null default now(), constraint service_rules_branch_or_type_check check (branch_id is not null or branch_type_id is not null));

-- customers, reservations
create table if not exists public.customers (id uuid primary key, full_name text not null, language_code text not null default 'en', email text, phone text, created_at timestamptz not null default now());
create table if not exists public.reservations (id uuid primary key default gen_random_uuid(), reservation_no text not null unique, customer_id uuid not null references public.customers(id), branch_id uuid not null references public.branches(id), service_id uuid not null references public.services(id), scheduled_at timestamptz not null, status text not null, ops_status text, issue_status text, risk_level text not null default 'low', approval_mode text not null default 'auto', currency text not null default 'KRW', total_amount numeric(12,2) not null default 0, notes text, created_at timestamptz not null default now(), updated_at timestamptz not null default now(), constraint reservations_status_check check (status in ('lead_created','validation_passed','manual_review_required','rejected','payment_pending','payment_completed','reservation_confirmed','cancelled')), constraint reservations_ops_status_check check (ops_status is null or ops_status in ('pickup_ready','pickup_completed','in_transit','arrived_at_destination','handover_pending','handover_completed','completed')), constraint reservations_issue_status_check check (issue_status is null or issue_status in ('issue_open','issue_in_progress','issue_waiting_customer','issue_waiting_internal','issue_resolved','issue_closed')), constraint reservations_risk_level_check check (risk_level in ('low','medium','high')), constraint reservations_approval_mode_check check (approval_mode in ('auto','manual')));
create table if not exists public.reservation_items (id uuid primary key default gen_random_uuid(), reservation_id uuid not null references public.reservations(id) on delete cascade, baggage_type_id uuid not null references public.baggage_types(id), quantity int not null check (quantity > 0), size_note text, requires_manual_review boolean not null default false, created_at timestamptz not null default now());
create table if not exists public.payments (id uuid primary key default gen_random_uuid(), reservation_id uuid not null references public.reservations(id) on delete cascade, provider text not null, payment_key text, status text not null, amount numeric(12,2) not null, paid_at timestamptz, failed_reason text, created_at timestamptz not null default now(), constraint payments_status_check check (status in ('pending','paid','failed','refunded')));
create table if not exists public.delivery_assignments (id uuid primary key default gen_random_uuid(), reservation_id uuid not null references public.reservations(id) on delete cascade, driver_name text, driver_phone text, assigned_at timestamptz, eta timestamptz, sla_due_at timestamptz, status text not null default 'unassigned', created_at timestamptz not null default now(), constraint delivery_assignments_status_check check (status in ('unassigned','assigned','arrived_pickup','picked_up','arrived_destination','handover_done','cancelled')));
create table if not exists public.proof_assets (id uuid primary key default gen_random_uuid(), reservation_id uuid not null references public.reservations(id) on delete cascade, asset_type text not null, file_url text not null, uploaded_by text, created_at timestamptz not null default now(), constraint proof_assets_type_check check (asset_type in ('pickup_photo','handover_photo','receipt')));
create table if not exists public.issue_tickets (id uuid primary key default gen_random_uuid(), reservation_id uuid not null references public.reservations(id) on delete cascade, issue_code text not null, severity text not null default 'medium', status text not null default 'open', title text not null, description text, assigned_to text, opened_at timestamptz not null default now(), resolved_at timestamptz, constraint issue_tickets_severity_check check (severity in ('low','medium','high','critical')), constraint issue_tickets_status_check check (status in ('open','in_progress','waiting_customer','waiting_internal','resolved','closed')));
create table if not exists public.operation_status_logs (id uuid primary key default gen_random_uuid(), reservation_id uuid not null references public.reservations(id) on delete cascade, from_status text, to_status text not null, changed_by text not null, reason text, created_at timestamptz not null default now());
create table if not exists public.ai_outputs (id uuid primary key default gen_random_uuid(), use_case text not null, source_ref text, input_context jsonb not null default '{}'::jsonb, generated_text text not null, risk_score numeric(5,2) not null default 0, policy_passed boolean not null default false, approval_status text not null default 'review_pending', reviewer_id text, published_at timestamptz, created_at timestamptz not null default now(), constraint ai_outputs_approval_status_check check (approval_status in ('review_pending','approved','rejected','published')));
create table if not exists public.ai_review_logs (id uuid primary key default gen_random_uuid(), ai_output_id uuid not null references public.ai_outputs(id) on delete cascade, check_type text not null, result text not null, detail text, created_at timestamptz not null default now(), constraint ai_review_logs_result_check check (result in ('pass','fail','warning')));
create table if not exists public.notifications (id uuid primary key default gen_random_uuid(), reservation_id uuid references public.reservations(id) on delete cascade, channel text not null, template_code text not null, recipient text not null, status text not null default 'queued', sent_at timestamptz, created_at timestamptz not null default now(), constraint notifications_channel_check check (channel in ('kakao','sms','email','slack')), constraint notifications_status_check check (status in ('queued','sent','failed')));
create table if not exists public.audit_logs (id uuid primary key default gen_random_uuid(), entity_type text not null, entity_id text not null, action text not null, actor text not null, before_data jsonb, after_data jsonb, created_at timestamptz not null default now());

-- Firebase bridge tables
create table if not exists public.locations (id uuid primary key default gen_random_uuid(), short_code text unique, name text not null, name_en text, name_ja text, name_zh text, name_zh_tw text, name_zh_hk text, type text not null default 'PARTNER', address text, address_en text, address_ja text, address_zh text, address_zh_tw text, address_zh_hk text, description text, description_en text, description_ja text, description_zh text, description_zh_tw text, description_zh_hk text, pickup_guide text, pickup_guide_en text, pickup_guide_ja text, pickup_guide_zh text, pickup_guide_zh_tw text, pickup_guide_zh_hk text, business_hours text, business_hours_en text, business_hours_ja text, business_hours_zh text, business_hours_zh_tw text, business_hours_zh_hk text, supports_delivery boolean not null default false, supports_storage boolean not null default true, is_origin boolean not null default false, is_destination boolean not null default false, lat numeric, lng numeric, origin_surcharge numeric(12,2) default 0, destination_surcharge numeric(12,2) default 0, image_url text, is_active boolean not null default true, is_partner boolean not null default false, branch_code text, owner_name text, phone text, commission_rate_delivery numeric(5,2) default 0, commission_rate_storage numeric(5,2) default 0, branch_id uuid references public.branches(id), created_at timestamptz not null default now(), updated_at timestamptz not null default now(), constraint locations_type_check check (type in ('AIRPORT','HOTEL','STATION','PARTNER','LOCAL_HOME','AIRBNB','GUESTHOUSE','OTHER')));
create table if not exists public.booking_details (id uuid primary key default gen_random_uuid(), reservation_id uuid references public.reservations(id) on delete cascade, sns_channel text, sns_id text, country text, pickup_location_id uuid references public.locations(id), pickup_address text, pickup_address_detail text, pickup_image_url text, pickup_date date, pickup_time time, dropoff_location_id uuid references public.locations(id), dropoff_address text, dropoff_address_detail text, dropoff_date date, delivery_time time, return_date date, return_time time, insurance_level int, insurance_bag_count int, use_insurance boolean default false, base_price numeric(12,2) default 0, final_price numeric(12,2) default 0, promo_code text, discount_amount numeric(12,2) default 0, weight_surcharge_5kg numeric(12,2) default 0, weight_surcharge_10kg numeric(12,2) default 0, payment_method text, payment_provider text, payment_order_id text, payment_key text, payment_receipt_url text, payment_approved_at timestamptz, agreed_to_terms boolean default false, agreed_to_privacy boolean default false, agreed_to_high_value boolean default false, branch_commission_delivery numeric(5,2), branch_commission_storage numeric(5,2), branch_settlement_amount numeric(12,2), settlement_status text, settled_at timestamptz, settled_by text, reservation_code text, language text default 'en', image_url text, service_type text, user_name text, user_email text, pickup_location text, dropoff_location text, created_at timestamptz not null default now());
create table if not exists public.daily_closings (id uuid primary key default gen_random_uuid(), branch_id uuid references public.branches(id), date date not null, total_revenue numeric(12,2) not null default 0, cash_revenue numeric(12,2) default 0, card_revenue numeric(12,2) default 0, apple_revenue numeric(12,2) default 0, samsung_revenue numeric(12,2) default 0, wechat_revenue numeric(12,2) default 0, alipay_revenue numeric(12,2) default 0, naver_revenue numeric(12,2) default 0, kakao_revenue numeric(12,2) default 0, paypal_revenue numeric(12,2) default 0, actual_cash_on_hand numeric(12,2) default 0, difference numeric(12,2) default 0, notes text, closed_by text not null, created_at timestamptz not null default now());
create table if not exists public.expenditures (id uuid primary key default gen_random_uuid(), branch_id uuid references public.branches(id), date date not null, category text not null, amount numeric(12,2) not null, description text, created_by text not null, created_at timestamptz not null default now());
create table if not exists public.partnership_inquiries (id uuid primary key default gen_random_uuid(), company_name text not null, contact_name text, position text, email text, phone text, message text, location text, business_type text, status text not null default 'NEW', assigned_admin_id text, notes text, created_at timestamptz not null default now(), constraint inquiries_status_check check (status in ('NEW','CONTACTED','NEGOTIATING','CONVERTED','REJECTED')));
create table if not exists public.branch_prospects (id uuid primary key default gen_random_uuid(), name text not null, address text, lat numeric, lng numeric, contact_person text, phone text, email text, status text not null default 'PROSPECTING', potential_score int default 0, notes text, partnership_inquiry_id uuid references public.partnership_inquiries(id), expected_open_date date, created_at timestamptz not null default now(), updated_at timestamptz not null default now(), constraint prospects_status_check check (status in ('PROSPECTING','NEGOTIATING','READY','ACTIVE','ON_HOLD')));
create table if not exists public.system_notices (id uuid primary key default gen_random_uuid(), title text not null, category text not null default 'NOTICE', is_active boolean not null default true, image_url text, content text, link_url text, start_date timestamptz, end_date timestamptz, created_at timestamptz not null default now(), constraint notices_category_check check (category in ('NOTICE','NEWS','EVENT','FAQ')));
create table if not exists public.discount_codes (id uuid primary key default gen_random_uuid(), code text not null unique, amount_per_bag numeric(12,2) not null default 0, description text, is_active boolean not null default true, allowed_service text default 'ALL', created_at timestamptz not null default now(), constraint discount_allowed_service_check check (allowed_service in ('DELIVERY','STORAGE','ALL')));
create table if not exists public.user_coupons (id uuid primary key default gen_random_uuid(), user_id uuid not null, discount_code_id uuid references public.discount_codes(id), code text not null, amount_per_bag numeric(12,2) not null default 0, description text, is_used boolean not null default false, used_at timestamptz, expiry_date timestamptz, issued_at timestamptz not null default now());
create table if not exists public.chat_sessions (id uuid primary key default gen_random_uuid(), session_id text not null unique, user_name text, user_email text, last_message text, is_bot_disabled boolean not null default false, unread_count int not null default 0, created_at timestamptz not null default now(), updated_at timestamptz not null default now());
create table if not exists public.chat_messages (id uuid primary key default gen_random_uuid(), session_id text not null references public.chat_sessions(session_id) on delete cascade, role text not null, text text not null, user_name text, user_email text, is_read boolean not null default false, created_at timestamptz not null default now(), constraint chat_role_check check (role in ('user','model','admin')));
create table if not exists public.app_settings (id uuid primary key default gen_random_uuid(), key text not null unique, value jsonb not null default '{}'::jsonb, updated_by text, updated_at timestamptz not null default now());
create table if not exists public.storage_tiers (id uuid primary key default gen_random_uuid(), tier_code text not null unique, label text not null, price_hand_bag numeric(12,2) not null default 0, price_carrier numeric(12,2) not null default 0, price_stroller_bicycle numeric(12,2) not null default 0, is_active boolean not null default true, sort_order int not null default 0, created_at timestamptz not null default now());
create table if not exists public.cms_areas (id uuid primary key default gen_random_uuid(), area_slug text not null unique, area_name_ko text, area_name_en text, area_name_ja text, area_name_zh text, headline_ko text, headline_en text, intro_text_ko text, intro_text_en text, cover_image_url text, is_priority_area boolean not null default false, sort_order int not null default 0, created_at timestamptz not null default now(), updated_at timestamptz not null default now());
create table if not exists public.cms_themes (id uuid primary key default gen_random_uuid(), theme_slug text not null unique, theme_name_ko text, theme_name_en text, description_ko text, description_en text, icon text, sort_order int not null default 0, is_active boolean not null default true, created_at timestamptz not null default now());
create table if not exists public.cms_contents (id uuid primary key default gen_random_uuid(), slug text not null unique, title_ko text, title_en text, title_ja text, title_zh text, summary_ko text, summary_en text, body_ko text, body_en text, body_ja text, body_zh text, content_type text not null default 'landmark', area_slug text references public.cms_areas(area_slug), cover_image_url text, recommended_time text, audience_tags text[] default '{}', theme_tags text[] default '{}', official_url text, source_name text, start_date date, end_date date, publish_status text not null default 'draft', language_available text[] default '{ko,en}', author_id text, reviewer_id text, review_comment text, quality_score int, priority_score int, is_foreigner_friendly boolean default true, created_at timestamptz not null default now(), updated_at timestamptz not null default now(), constraint cms_content_type_check check (content_type in ('landmark','hotplace','attraction','event')), constraint cms_publish_status_check check (publish_status in ('draft','in_review','approved','published','rejected','archived')));
create table if not exists public.legal_documents (id uuid primary key default gen_random_uuid(), doc_type text not null, language text not null default 'ko', title text, content text, articles jsonb default '[]'::jsonb, updated_by text, created_at timestamptz not null default now(), updated_at timestamptz not null default now(), constraint legal_doc_type_check check (doc_type in ('terms','privacy','qna','refund')), unique(doc_type, language));
create table if not exists public.google_reviews (id uuid primary key default gen_random_uuid(), place_id text not null, author_name text not null, author_photo_url text, rating int not null check (rating>=1 and rating<=5), text text, language text default 'ko', relative_time text, review_time timestamptz, is_featured boolean not null default false, is_visible boolean not null default true, fetched_at timestamptz not null default now(), created_at timestamptz not null default now());
create table if not exists public.google_review_summary (id uuid primary key default gen_random_uuid(), place_id text not null unique, place_name text, total_reviews int not null default 0, average_rating numeric(3,2) not null default 0, last_synced_at timestamptz not null default now());

-- Seed data
insert into public.services (code, name) values ('STORAGE','보관'),('HUB_TO_AIRPORT','Hub → 인천공항 배송') on conflict (code) do nothing;
insert into public.baggage_types (code, name, requires_manual_review) values ('SHOPPING_BAG','쇼핑백',false),('CARRY_ON','기내용 캐리어',false),('SUITCASE','대형 캐리어',false),('SPECIAL','특수짐',true) on conflict (code) do nothing;
insert into public.service_rules (branch_type_id,service_id,baggage_type_id,allowed,requires_manual_review,phase_code,reject_message_ko,reject_message_en,priority) select bt.id,s.id,b.id,case when bt.code='PARTNER' and s.code='HUB_TO_AIRPORT' then false else true end,case when b.code='SPECIAL' then true else false end,'PHASE_1',case when bt.code='PARTNER' and s.code='HUB_TO_AIRPORT' then '해당 지점은 현재 공항 배송을 운영하지 않습니다.' else null end,case when bt.code='PARTNER' and s.code='HUB_TO_AIRPORT' then 'This location currently does not support airport delivery.' else null end,100 from public.branch_types bt cross join public.services s cross join public.baggage_types b where not exists (select 1 from public.service_rules sr where sr.branch_type_id=bt.id and sr.service_id=s.id and sr.baggage_type_id=b.id and sr.phase_code='PHASE_1');

-- Indexes
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
create index if not exists idx_reservations_scheduled_at on public.reservations(scheduled_at);
create index if not exists idx_payments_reservation_id on public.payments(reservation_id);
create index if not exists idx_payments_status on public.payments(status);
create index if not exists idx_delivery_assignments_reservation_id on public.delivery_assignments(reservation_id);
create index if not exists idx_issue_tickets_reservation_id on public.issue_tickets(reservation_id);
create index if not exists idx_issue_tickets_status on public.issue_tickets(status);
create index if not exists idx_operation_status_logs_reservation_id on public.operation_status_logs(reservation_id);
create index if not exists idx_ai_outputs_approval_status on public.ai_outputs(approval_status);
create index if not exists idx_ai_review_logs_ai_output_id on public.ai_review_logs(ai_output_id);
create index if not exists idx_notifications_reservation_id on public.notifications(reservation_id);
create index if not exists idx_audit_logs_entity_type_entity_id on public.audit_logs(entity_type, entity_id);
create index if not exists idx_locations_branch_id on public.locations(branch_id);
create index if not exists idx_locations_type on public.locations(type);
create index if not exists idx_booking_details_reservation_id on public.booking_details(reservation_id);
create index if not exists idx_daily_closings_date on public.daily_closings(date);
create index if not exists idx_expenditures_date on public.expenditures(date);
create index if not exists idx_discount_codes_code on public.discount_codes(code);
create index if not exists idx_user_coupons_user_id on public.user_coupons(user_id);
create index if not exists idx_chat_messages_session_id on public.chat_messages(session_id);
create index if not exists idx_google_reviews_place_id on public.google_reviews(place_id);

-- RLS enable + policies
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
alter table public.locations enable row level security;
alter table public.booking_details enable row level security;
alter table public.daily_closings enable row level security;
alter table public.expenditures enable row level security;
alter table public.partnership_inquiries enable row level security;
alter table public.branch_prospects enable row level security;
alter table public.system_notices enable row level security;
alter table public.discount_codes enable row level security;
alter table public.user_coupons enable row level security;
alter table public.chat_sessions enable row level security;
alter table public.chat_messages enable row level security;
alter table public.app_settings enable row level security;
alter table public.storage_tiers enable row level security;
alter table public.cms_areas enable row level security;
alter table public.cms_themes enable row level security;
alter table public.cms_contents enable row level security;
alter table public.legal_documents enable row level security;
alter table public.google_reviews enable row level security;
alter table public.google_review_summary enable row level security;
alter table public.branch_types enable row level security;
alter table public.services enable row level security;
alter table public.baggage_types enable row level security;
alter table public.service_rules enable row level security;

-- Public read policies
create policy "p_locations" on public.locations for select using (true);
create policy "p_app_settings" on public.app_settings for select using (true);
create policy "p_discount_codes" on public.discount_codes for select using (true);
create policy "p_services" on public.services for select using (true);
create policy "p_baggage_types" on public.baggage_types for select using (true);
create policy "p_branch_types" on public.branch_types for select using (true);
create policy "p_service_rules" on public.service_rules for select using (true);
create policy "p_storage_tiers" on public.storage_tiers for select using (true);
create policy "p_system_notices" on public.system_notices for select using (is_active=true);
create policy "p_cms_areas" on public.cms_areas for select using (true);
create policy "p_cms_themes" on public.cms_themes for select using (true);
create policy "p_cms_contents" on public.cms_contents for select using (true);
create policy "p_legal_documents" on public.legal_documents for select using (true);
create policy "p_google_reviews" on public.google_reviews for select using (is_visible=true);
create policy "p_review_summary" on public.google_review_summary for select using (true);
create policy "p_booking_details_r" on public.booking_details for select using (true);
create policy "p_booking_details_i" on public.booking_details for insert with check (true);
create policy "p_booking_details_u" on public.booking_details for update using (true) with check (true);
create policy "p_chat_sessions" on public.chat_sessions for all using (true) with check (true);
create policy "p_chat_messages" on public.chat_messages for all using (true) with check (true);
create policy "p_daily_closings" on public.daily_closings for all using (true) with check (true);
create policy "p_expenditures" on public.expenditures for all using (true) with check (true);
create policy "p_branch_prospects" on public.branch_prospects for all using (true) with check (true);
create policy "p_partnership_inq_r" on public.partnership_inquiries for select using (true);
create policy "p_partnership_inq_i" on public.partnership_inquiries for insert with check (true);
create policy "p_user_coupons_r" on public.user_coupons for select using (true);
create policy "p_user_coupons_i" on public.user_coupons for insert with check (true);
create policy "p_locations_w" on public.locations for all using (true) with check (true);
create policy "p_app_settings_w" on public.app_settings for all using (true) with check (true);
create policy "p_discount_codes_w" on public.discount_codes for all using (true) with check (true);
create policy "p_system_notices_w" on public.system_notices for all using (true) with check (true);
create policy "p_cms_areas_w" on public.cms_areas for all using (true) with check (true);
create policy "p_cms_themes_w" on public.cms_themes for all using (true) with check (true);
create policy "p_cms_contents_w" on public.cms_contents for all using (true) with check (true);
create policy "p_google_reviews_w" on public.google_reviews for all using (true) with check (true);
create policy "p_review_summary_w" on public.google_review_summary for all using (true) with check (true);
create policy "p_delivery_assign" on public.delivery_assignments for all using (true) with check (true);
create policy "p_customers_r" on public.customers for select using (id=auth.uid());
create policy "p_reservations_r" on public.reservations for select using (customer_id=auth.uid());
create policy "p_reservations_i" on public.reservations for insert with check (customer_id=auth.uid());
create policy "p_reservations_admin" on public.reservations for all using (coalesce(auth.jwt()->> 'role','') in ('admin','ops_manager')) with check (coalesce(auth.jwt()->> 'role','') in ('admin','ops_manager'));
create policy "p_payments_r" on public.payments for select using (exists(select 1 from public.reservations r where r.id=payments.reservation_id and r.customer_id=auth.uid()));
create policy "p_payments_admin" on public.payments for all using (coalesce(auth.jwt()->> 'role','') in ('admin','ops_manager','finance')) with check (coalesce(auth.jwt()->> 'role','') in ('admin','ops_manager','finance'));
create policy "p_issues_admin" on public.issue_tickets for all using (coalesce(auth.jwt()->> 'role','') in ('admin','ops_manager','ops_staff')) with check (coalesce(auth.jwt()->> 'role','') in ('admin','ops_manager','ops_staff'));
create policy "p_ops_logs_admin" on public.operation_status_logs for all using (coalesce(auth.jwt()->> 'role','') in ('admin','ops_manager','ops_staff')) with check (coalesce(auth.jwt()->> 'role','') in ('admin','ops_manager','ops_staff'));
create policy "p_proofs_admin" on public.proof_assets for all using (coalesce(auth.jwt()->> 'role','') in ('admin','ops_manager','ops_staff','driver')) with check (coalesce(auth.jwt()->> 'role','') in ('admin','ops_manager','ops_staff','driver'));
create policy "p_ai_outputs" on public.ai_outputs for all using (coalesce(auth.jwt()->> 'role','') in ('admin','ops_manager','marketing','content_manager')) with check (coalesce(auth.jwt()->> 'role','') in ('admin','ops_manager','marketing','content_manager'));
create policy "p_ai_review_logs" on public.ai_review_logs for all using (coalesce(auth.jwt()->> 'role','') in ('admin','ops_manager','marketing','content_manager')) with check (coalesce(auth.jwt()->> 'role','') in ('admin','ops_manager','marketing','content_manager'));
create policy "p_notifications" on public.notifications for all using (coalesce(auth.jwt()->> 'role','') in ('admin','ops_manager','ops_staff','marketing')) with check (coalesce(auth.jwt()->> 'role','') in ('admin','ops_manager','ops_staff','marketing'));
create policy "p_audit_logs" on public.audit_logs for all using (coalesce(auth.jwt()->> 'role','') in ('admin','ops_manager')) with check (coalesce(auth.jwt()->> 'role','') in ('admin','ops_manager'));

-- DB Triggers for Edge Functions
create extension if not exists pg_net with schema extensions;

create or replace function public.trigger_on_booking_created() returns trigger as $$
begin
  perform extensions.http_post(url:='https://xpnfjolqiffduedwtxey.supabase.co/functions/v1/on-booking-created',body:=jsonb_build_object('type','INSERT','table','booking_details','record',row_to_json(NEW)::jsonb)::text,headers:=jsonb_build_object('Content-Type','application/json')::jsonb);
  return NEW;
exception when others then raise warning '[trigger] %', SQLERRM; return NEW;
end; $$ language plpgsql security definer;

create or replace function public.trigger_on_booking_updated() returns trigger as $$
begin
  perform extensions.http_post(url:='https://xpnfjolqiffduedwtxey.supabase.co/functions/v1/on-booking-updated',body:=jsonb_build_object('type','UPDATE','table','booking_details','record',row_to_json(NEW)::jsonb,'old_record',row_to_json(OLD)::jsonb)::text,headers:=jsonb_build_object('Content-Type','application/json')::jsonb);
  return NEW;
exception when others then raise warning '[trigger] %', SQLERRM; return NEW;
end; $$ language plpgsql security definer;

drop trigger if exists on_booking_details_insert on public.booking_details;
create trigger on_booking_details_insert after insert on public.booking_details for each row execute function public.trigger_on_booking_created();
drop trigger if exists on_booking_details_update on public.booking_details;
create trigger on_booking_details_update after update on public.booking_details for each row execute function public.trigger_on_booking_updated();

comment on table public.issue_tickets is 'OPS-001~010 issue codes';
