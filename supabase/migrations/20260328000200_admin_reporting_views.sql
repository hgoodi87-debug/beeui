-- 관리자 예약/정산 조회 기준선을 reservations 중심으로 이동한다.
-- booking_details 직조회 대신 admin_booking_list_v1 / admin_revenue_*_v1를 사용한다.

create index if not exists booking_details_pickup_date_idx
  on public.booking_details (pickup_date desc nulls last);

create index if not exists booking_details_pickup_location_id_idx
  on public.booking_details (pickup_location_id);

create index if not exists booking_details_dropoff_location_id_idx
  on public.booking_details (dropoff_location_id);

create index if not exists booking_details_settlement_status_idx
  on public.booking_details (settlement_status);

create index if not exists payments_reservation_status_paid_at_idx
  on public.payments (reservation_id, status, paid_at desc, created_at desc);

create or replace function public.map_admin_booking_status(
  legacy_settlement_status text,
  reservation_status text,
  reservation_ops_status text,
  latest_payment_status text,
  normalized_service_type text
)
returns text
language sql
immutable
as $$
  select case
    when legacy_settlement_status in (
      '접수완료',
      '예약완료',
      '보관중',
      '이동중',
      '목적지도착',
      '완료',
      '취소됨',
      '환불완료'
    ) then legacy_settlement_status
    when lower(coalesce(latest_payment_status, '')) = 'refunded' then '환불완료'
    when lower(coalesce(reservation_status, '')) in ('cancelled', 'rejected') then '취소됨'
    when lower(coalesce(reservation_ops_status, '')) in ('handover_completed', 'completed') then '완료'
    when lower(coalesce(reservation_ops_status, '')) in ('arrived_at_destination', 'handover_pending') then '목적지도착'
    when lower(coalesce(reservation_ops_status, '')) = 'in_transit' then '이동중'
    when lower(coalesce(reservation_ops_status, '')) = 'pickup_completed'
      and upper(coalesce(normalized_service_type, '')) = 'STORAGE' then '보관중'
    when lower(coalesce(reservation_ops_status, '')) = 'pickup_completed' then '이동중'
    when lower(coalesce(reservation_ops_status, '')) = 'pickup_ready' then '예약완료'
    when lower(coalesce(reservation_status, '')) in ('payment_completed', 'reservation_confirmed') then '예약완료'
    else '접수완료'
  end
$$;

create or replace view public.admin_booking_list_v1
with (security_invoker = true)
as
with booking_core as (
  select
    bd.id,
    r.id as reservation_id,
    coalesce(nullif(bd.reservation_code, ''), r.reservation_no) as reservation_code,
    r.reservation_no,
    r.customer_id,
    r.branch_id,
    b.branch_code,
    b.name as branch_name,
    r.service_id,
    case
      when upper(coalesce(nullif(bd.service_type, ''), s.code, '')) in ('HUB_TO_AIRPORT', 'DELIVERY') then 'DELIVERY'
      when upper(coalesce(nullif(bd.service_type, ''), s.code, '')) = 'STORAGE' then 'STORAGE'
      else upper(coalesce(nullif(bd.service_type, ''), s.code, 'STORAGE'))
    end as service_type,
    r.scheduled_at,
    r.status as reservation_status,
    r.ops_status,
    r.issue_status,
    r.risk_level,
    r.approval_mode,
    r.currency,
    r.notes as audit_note,
    coalesce(bd.user_name, c.full_name) as user_name,
    coalesce(bd.user_email, c.email) as user_email,
    bd.sns_channel,
    bd.sns_id,
    bd.country,
    bd.language,
    bd.pickup_location_id,
    coalesce(nullif(bd.pickup_location, ''), bd.pickup_location_id::text) as pickup_location,
    pickup.name as pickup_location_name,
    bd.pickup_address,
    bd.pickup_address_detail,
    bd.pickup_image_url,
    bd.pickup_date,
    bd.pickup_time,
    bd.dropoff_location_id,
    coalesce(nullif(bd.dropoff_location, ''), bd.dropoff_location_id::text) as dropoff_location,
    dropoff.name as dropoff_location_name,
    bd.dropoff_address,
    bd.dropoff_address_detail,
    bd.dropoff_date,
    bd.delivery_time,
    bd.return_date,
    bd.return_time,
    coalesce(baggage.bag_count, 0) as bags,
    coalesce(
      baggage.bag_sizes,
      jsonb_build_object('handBag', 0, 'carrier', 0, 'strollerBicycle', 0)
    ) as bag_sizes,
    bd.insurance_level,
    bd.insurance_bag_count,
    coalesce(bd.use_insurance, false) as use_insurance,
    coalesce(bd.base_price, 0) as price,
    coalesce(nullif(bd.final_price, 0), nullif(r.total_amount, 0), latest_payment.amount, bd.base_price, 0) as final_price,
    coalesce(nullif(r.total_amount, 0), nullif(bd.final_price, 0), latest_payment.amount, bd.base_price, 0) as settlement_hard_copy_amount,
    bd.promo_code,
    bd.promo_code as discount_code,
    coalesce(bd.discount_amount, 0) as discount_amount,
    bd.weight_surcharge_5kg,
    bd.weight_surcharge_10kg,
    coalesce(nullif(bd.payment_method, ''), case when latest_payment.status = 'paid' then 'card' else null end) as payment_method,
    coalesce(nullif(bd.payment_provider, ''), latest_payment.provider) as payment_provider,
    bd.payment_order_id,
    coalesce(nullif(bd.payment_key, ''), latest_payment.payment_key) as payment_key,
    bd.payment_receipt_url,
    coalesce(latest_payment.paid_at, bd.payment_approved_at) as payment_approved_at,
    coalesce(latest_payment.status, case when bd.payment_approved_at is not null then 'paid' else 'pending' end) as payment_status,
    bd.agreed_to_terms,
    bd.agreed_to_privacy,
    bd.agreed_to_high_value,
    bd.image_url,
    bd.branch_commission_delivery,
    bd.branch_commission_storage,
    bd.branch_settlement_amount,
    bd.settlement_status,
    bd.settled_at,
    bd.settled_by,
    coalesce(bd.created_at, r.created_at) as created_at,
    r.updated_at,
    lower(coalesce(bd.settlement_status, '')) = 'deleted' as is_deleted
  from public.booking_details bd
  join public.reservations r on r.id = bd.reservation_id
  left join public.customers c on c.id = r.customer_id
  left join public.services s on s.id = r.service_id
  left join public.branches b on b.id = r.branch_id
  left join public.locations pickup on pickup.id = bd.pickup_location_id
  left join public.locations dropoff on dropoff.id = bd.dropoff_location_id
  left join lateral (
    select
      p.provider,
      p.payment_key,
      p.status,
      p.amount,
      p.paid_at,
      p.created_at
    from public.payments p
    where p.reservation_id = r.id
    order by coalesce(p.paid_at, p.created_at) desc, p.created_at desc
    limit 1
  ) latest_payment on true
  left join lateral (
    select
      coalesce(sum(ri.quantity), 0)::int as bag_count,
      jsonb_build_object(
        'handBag', coalesce(sum(case when upper(coalesce(bt.code, '')) in ('SHOPPING_BAG', 'HAND_BAG') then ri.quantity else 0 end), 0)::int,
        'carrier', coalesce(sum(case when upper(coalesce(bt.code, '')) in ('CARRY_ON', 'SUITCASE', 'CARRIER') then ri.quantity else 0 end), 0)::int,
        'strollerBicycle', coalesce(sum(case when upper(coalesce(bt.code, '')) in ('SPECIAL', 'STROLLER_BICYCLE') then ri.quantity else 0 end), 0)::int
      ) as bag_sizes
    from public.reservation_items ri
    left join public.baggage_types bt on bt.id = ri.baggage_type_id
    where ri.reservation_id = r.id
  ) baggage on true
)
select
  booking_core.*,
  public.map_admin_booking_status(
    booking_core.settlement_status,
    booking_core.reservation_status,
    booking_core.ops_status,
    booking_core.payment_status,
    booking_core.service_type
  ) as status
from booking_core;

create or replace view public.admin_revenue_daily_v1
with (security_invoker = true)
as
select
  abl.pickup_date as date,
  abl.branch_id,
  abl.branch_code,
  abl.branch_name,
  count(*) filter (where not abl.is_deleted) as booking_count,
  count(*) filter (where not abl.is_deleted and abl.status not in ('취소됨', '환불완료')) as active_booking_count,
  count(*) filter (where not abl.is_deleted and abl.service_type = 'DELIVERY' and abl.status not in ('취소됨', '환불완료')) as delivery_count,
  count(*) filter (where not abl.is_deleted and abl.service_type = 'STORAGE' and abl.status not in ('취소됨', '환불완료')) as storage_count,
  coalesce(sum(case when not abl.is_deleted then abl.bags else 0 end), 0)::int as bag_count,
  coalesce(sum(case when not abl.is_deleted then coalesce((abl.bag_sizes ->> 'handBag')::int, 0) else 0 end), 0)::int as hand_bag_count,
  coalesce(sum(case when not abl.is_deleted then coalesce((abl.bag_sizes ->> 'carrier')::int, 0) else 0 end), 0)::int as carrier_count,
  coalesce(sum(case when not abl.is_deleted then coalesce((abl.bag_sizes ->> 'strollerBicycle')::int, 0) else 0 end), 0)::int as stroller_bicycle_count,
  count(*) filter (where not abl.is_deleted and abl.status = '완료') as completed_count,
  count(*) filter (where not abl.is_deleted and abl.status = '취소됨') as cancelled_count,
  count(*) filter (where not abl.is_deleted and abl.status = '환불완료') as refunded_count,
  coalesce(sum(case when not abl.is_deleted and abl.status not in ('취소됨', '환불완료') then abl.settlement_hard_copy_amount else 0 end), 0)::numeric(12,2) as total_revenue,
  coalesce(sum(case when not abl.is_deleted and abl.status = '취소됨' then abl.settlement_hard_copy_amount else 0 end), 0)::numeric(12,2) as cancelled_total,
  coalesce(sum(case when not abl.is_deleted and abl.status = '환불완료' then abl.settlement_hard_copy_amount else 0 end), 0)::numeric(12,2) as refunded_total,
  coalesce(sum(case when not abl.is_deleted and abl.status not in ('취소됨', '환불완료') and abl.payment_method = 'cash' then abl.settlement_hard_copy_amount else 0 end), 0)::numeric(12,2) as cash_revenue,
  coalesce(sum(case when not abl.is_deleted and abl.status not in ('취소됨', '환불완료') and abl.payment_method = 'card' then abl.settlement_hard_copy_amount else 0 end), 0)::numeric(12,2) as card_revenue,
  coalesce(sum(case when not abl.is_deleted and abl.status not in ('취소됨', '환불완료') and abl.payment_method = 'apple' then abl.settlement_hard_copy_amount else 0 end), 0)::numeric(12,2) as apple_revenue,
  coalesce(sum(case when not abl.is_deleted and abl.status not in ('취소됨', '환불완료') and abl.payment_method = 'samsung' then abl.settlement_hard_copy_amount else 0 end), 0)::numeric(12,2) as samsung_revenue,
  coalesce(sum(case when not abl.is_deleted and abl.status not in ('취소됨', '환불완료') and abl.payment_method = 'wechat' then abl.settlement_hard_copy_amount else 0 end), 0)::numeric(12,2) as wechat_revenue,
  coalesce(sum(case when not abl.is_deleted and abl.status not in ('취소됨', '환불완료') and abl.payment_method = 'alipay' then abl.settlement_hard_copy_amount else 0 end), 0)::numeric(12,2) as alipay_revenue,
  coalesce(sum(case when not abl.is_deleted and abl.status not in ('취소됨', '환불완료') and abl.payment_method = 'naver' then abl.settlement_hard_copy_amount else 0 end), 0)::numeric(12,2) as naver_revenue,
  coalesce(sum(case when not abl.is_deleted and abl.status not in ('취소됨', '환불완료') and abl.payment_method = 'kakao' then abl.settlement_hard_copy_amount else 0 end), 0)::numeric(12,2) as kakao_revenue,
  coalesce(sum(case when not abl.is_deleted and abl.status not in ('취소됨', '환불완료') and abl.payment_method = 'paypal' then abl.settlement_hard_copy_amount else 0 end), 0)::numeric(12,2) as paypal_revenue,
  coalesce(sum(case when not abl.is_deleted and abl.status not in ('취소됨', '환불완료') and coalesce(abl.settlement_status, '') = 'CONFIRMED' then abl.settlement_hard_copy_amount else 0 end), 0)::numeric(12,2) as confirmed_amount,
  coalesce(sum(case when not abl.is_deleted and abl.status not in ('취소됨', '환불완료') and coalesce(abl.settlement_status, '') <> 'CONFIRMED' then abl.settlement_hard_copy_amount else 0 end), 0)::numeric(12,2) as unconfirmed_amount,
  coalesce(sum(case when not abl.is_deleted and abl.status not in ('취소됨', '환불완료') then coalesce(abl.branch_settlement_amount, 0) else 0 end), 0)::numeric(12,2) as partner_payout_total
from public.admin_booking_list_v1 abl
where abl.pickup_date is not null
group by abl.pickup_date, abl.branch_id, abl.branch_code, abl.branch_name;

create or replace view public.admin_revenue_monthly_v1
with (security_invoker = true)
as
select
  date_trunc('month', ard.date::timestamp)::date as month,
  ard.branch_id,
  ard.branch_code,
  ard.branch_name,
  sum(ard.booking_count)::int as booking_count,
  sum(ard.active_booking_count)::int as active_booking_count,
  sum(ard.delivery_count)::int as delivery_count,
  sum(ard.storage_count)::int as storage_count,
  sum(ard.bag_count)::int as bag_count,
  sum(ard.hand_bag_count)::int as hand_bag_count,
  sum(ard.carrier_count)::int as carrier_count,
  sum(ard.stroller_bicycle_count)::int as stroller_bicycle_count,
  sum(ard.completed_count)::int as completed_count,
  sum(ard.cancelled_count)::int as cancelled_count,
  sum(ard.refunded_count)::int as refunded_count,
  sum(ard.total_revenue)::numeric(12,2) as total_revenue,
  sum(ard.cancelled_total)::numeric(12,2) as cancelled_total,
  sum(ard.refunded_total)::numeric(12,2) as refunded_total,
  sum(ard.cash_revenue)::numeric(12,2) as cash_revenue,
  sum(ard.card_revenue)::numeric(12,2) as card_revenue,
  sum(ard.apple_revenue)::numeric(12,2) as apple_revenue,
  sum(ard.samsung_revenue)::numeric(12,2) as samsung_revenue,
  sum(ard.wechat_revenue)::numeric(12,2) as wechat_revenue,
  sum(ard.alipay_revenue)::numeric(12,2) as alipay_revenue,
  sum(ard.naver_revenue)::numeric(12,2) as naver_revenue,
  sum(ard.kakao_revenue)::numeric(12,2) as kakao_revenue,
  sum(ard.paypal_revenue)::numeric(12,2) as paypal_revenue,
  sum(ard.confirmed_amount)::numeric(12,2) as confirmed_amount,
  sum(ard.unconfirmed_amount)::numeric(12,2) as unconfirmed_amount,
  sum(ard.partner_payout_total)::numeric(12,2) as partner_payout_total
from public.admin_revenue_daily_v1 ard
group by date_trunc('month', ard.date::timestamp)::date, ard.branch_id, ard.branch_code, ard.branch_name;

grant execute on function public.map_admin_booking_status(text, text, text, text, text)
  to authenticated, service_role;

grant select on public.admin_booking_list_v1
  to authenticated, service_role;

grant select on public.admin_revenue_daily_v1
  to authenticated, service_role;

grant select on public.admin_revenue_monthly_v1
  to authenticated, service_role;
