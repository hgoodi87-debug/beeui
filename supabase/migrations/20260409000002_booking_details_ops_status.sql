-- Fix: booking_details에 ops_status 추가
-- 신규 예약(reservation_id=NULL)의 상태 변경을 위한 ops_status 컬럼
-- 기존: ops_status는 reservations 테이블에만 존재 → 신규 예약 상태변경 불가
-- 수정: booking_details에 ops_status 추가 + 뷰/함수 업데이트

-- 1) ops_status 컬럼 추가
ALTER TABLE public.booking_details
  ADD COLUMN IF NOT EXISTS ops_status text DEFAULT NULL;

-- 2) map_admin_booking_status 함수 업데이트
--    reservation_ops_status (= COALESCE(r.ops_status, bd.ops_status))로 cancelled/refunded도 처리
CREATE OR REPLACE FUNCTION public.map_admin_booking_status(
  legacy_settlement_status text,
  reservation_status text,
  reservation_ops_status text,
  latest_payment_status text,
  normalized_service_type text
)
RETURNS text
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT CASE
    -- 레거시 한국어 값 우선 (이전 Firestore 데이터)
    WHEN legacy_settlement_status IN (
      '접수완료', '예약완료', '보관중', '이동중', '목적지도착', '완료', '취소됨', '환불완료'
    ) THEN legacy_settlement_status
    -- ops_status 기반 (reservation 또는 booking_details 직접 기입)
    WHEN lower(coalesce(reservation_ops_status, '')) IN ('handover_completed', 'completed') THEN '완료'
    WHEN lower(coalesce(reservation_ops_status, '')) IN ('arrived_at_destination', 'handover_pending') THEN '목적지도착'
    WHEN lower(coalesce(reservation_ops_status, '')) = 'in_transit' THEN '이동중'
    WHEN lower(coalesce(reservation_ops_status, '')) = 'pickup_completed'
      AND upper(coalesce(normalized_service_type, '')) = 'STORAGE' THEN '보관중'
    WHEN lower(coalesce(reservation_ops_status, '')) = 'pickup_completed' THEN '이동중'
    WHEN lower(coalesce(reservation_ops_status, '')) = 'pickup_ready' THEN '예약완료'
    WHEN lower(coalesce(reservation_ops_status, '')) = 'cancelled' THEN '취소됨'
    WHEN lower(coalesce(reservation_ops_status, '')) = 'refunded' THEN '환불완료'
    -- reservation_status 기반
    WHEN lower(coalesce(latest_payment_status, '')) = 'refunded' THEN '환불완료'
    WHEN lower(coalesce(reservation_status, '')) IN ('cancelled', 'rejected') THEN '취소됨'
    WHEN lower(coalesce(reservation_status, '')) IN ('payment_completed', 'reservation_confirmed') THEN '예약완료'
    ELSE '접수완료'
  END
$$;

-- 3) 뷰 재생성: ops_status COALESCE(r.ops_status, bd.ops_status)
DROP VIEW IF EXISTS public.admin_revenue_monthly_v1;
DROP VIEW IF EXISTS public.admin_revenue_daily_v1;
DROP VIEW IF EXISTS public.admin_booking_list_v1;

CREATE OR REPLACE VIEW public.admin_booking_list_v1 AS
WITH booking_core AS (
  SELECT
    bd.id,
    r.id                        AS reservation_id,
    COALESCE(NULLIF(bd.reservation_code, ''), r.reservation_no) AS reservation_code,
    r.reservation_no,
    r.customer_id,
    COALESCE(r.branch_id, pickup.branch_id) AS branch_id,
    COALESCE(b.branch_code, pickup.branch_code) AS branch_code,
    COALESCE(b.name, pickup_branch.name) AS branch_name,
    r.service_id,
    CASE
      WHEN upper(COALESCE(NULLIF(bd.service_type,''), s.code, '')) = ANY(ARRAY['HUB_TO_AIRPORT','DELIVERY']) THEN 'DELIVERY'
      WHEN upper(COALESCE(NULLIF(bd.service_type,''), s.code, '')) = 'STORAGE' THEN 'STORAGE'
      ELSE upper(COALESCE(NULLIF(bd.service_type,''), s.code, 'STORAGE'))
    END                         AS service_type,
    r.scheduled_at,
    r.status                    AS reservation_status,
    -- ops_status: reservation 우선, 없으면 booking_details 직접 기입 값
    COALESCE(r.ops_status, bd.ops_status) AS ops_status,
    r.issue_status,
    r.risk_level,
    r.approval_mode,
    COALESCE(r.currency, 'KRW') AS currency,
    r.notes                     AS audit_note,
    COALESCE(bd.user_name, c.full_name)  AS user_name,
    COALESCE(bd.user_email, c.email)     AS user_email,
    bd.sns_channel,
    bd.sns_id,
    bd.country,
    bd.language,
    bd.pickup_location_id,
    COALESCE(NULLIF(bd.pickup_location,''), bd.pickup_location_id::text) AS pickup_location,
    pickup.name                 AS pickup_location_name,
    bd.pickup_address,
    bd.pickup_address_detail,
    bd.pickup_image_url,
    bd.pickup_date,
    bd.pickup_time,
    bd.dropoff_location_id,
    COALESCE(NULLIF(bd.dropoff_location,''), bd.dropoff_location_id::text) AS dropoff_location,
    dropoff.name                AS dropoff_location_name,
    bd.dropoff_address,
    bd.dropoff_address_detail,
    bd.dropoff_date,
    bd.delivery_time,
    bd.return_date,
    bd.return_time,
    COALESCE(
      CASE WHEN r.id IS NOT NULL THEN baggage.bag_count ELSE NULL END,
      bd.bags,
      0
    )::integer AS bags,
    COALESCE(
      CASE WHEN r.id IS NOT NULL THEN baggage.bag_sizes ELSE NULL END,
      jsonb_build_object('handBag',0,'carrier',0,'strollerBicycle',0)
    ) AS bag_sizes,
    bd.insurance_level,
    bd.insurance_bag_count,
    COALESCE(bd.use_insurance, false) AS use_insurance,
    COALESCE(bd.insurance_fee, 0)     AS insurance_fee,
    COALESCE(bd.base_price, 0)        AS price,
    COALESCE(NULLIF(bd.final_price,0), NULLIF(r.total_amount,0), latest_payment.amount, bd.base_price, 0) AS final_price,
    COALESCE(NULLIF(r.total_amount,0), NULLIF(bd.final_price,0), latest_payment.amount, bd.base_price, 0) AS settlement_hard_copy_amount,
    COALESCE(bd.credit_used, 0)       AS credit_used,
    bd.promo_code,
    bd.promo_code                     AS discount_code,
    COALESCE(bd.discount_amount, 0)   AS discount_amount,
    bd.weight_surcharge_5kg,
    bd.weight_surcharge_10kg,
    COALESCE(NULLIF(bd.payment_method,''),
      CASE WHEN latest_payment.status = 'paid' THEN 'card' ELSE NULL END
    )                           AS payment_method,
    COALESCE(NULLIF(bd.payment_provider,''), latest_payment.provider) AS payment_provider,
    bd.payment_order_id,
    COALESCE(NULLIF(bd.payment_key,''), latest_payment.payment_key) AS payment_key,
    bd.payment_receipt_url,
    COALESCE(latest_payment.paid_at, bd.payment_approved_at) AS payment_approved_at,
    COALESCE(latest_payment.status,
      CASE WHEN bd.payment_approved_at IS NOT NULL THEN 'paid' ELSE 'pending' END
    )                           AS payment_status,
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
    bd.payout_id,
    COALESCE(bd.created_at, r.created_at) AS created_at,
    r.updated_at,
    (lower(COALESCE(bd.settlement_status,'')) = 'deleted') AS is_deleted
  FROM booking_details bd
  LEFT JOIN reservations r ON r.id = bd.reservation_id
  LEFT JOIN customers c ON c.id = r.customer_id
  LEFT JOIN services s ON s.id = r.service_id
  LEFT JOIN branches b ON b.id = r.branch_id
  LEFT JOIN locations pickup ON pickup.id = bd.pickup_location_id
  LEFT JOIN branches pickup_branch ON pickup_branch.id = pickup.branch_id
  LEFT JOIN locations dropoff ON dropoff.id = bd.dropoff_location_id
  LEFT JOIN LATERAL (
    SELECT p.provider, p.payment_key, p.status, p.amount, p.paid_at, p.created_at
    FROM payments p
    WHERE p.reservation_id = r.id
    ORDER BY COALESCE(p.paid_at, p.created_at) DESC, p.created_at DESC
    LIMIT 1
  ) latest_payment ON true
  LEFT JOIN LATERAL (
    SELECT
      COALESCE(SUM(ri.quantity), 0)::integer AS bag_count,
      jsonb_build_object(
        'handBag',         COALESCE(SUM(CASE WHEN upper(COALESCE(bt.code,'')) = ANY(ARRAY['SHOPPING_BAG','HAND_BAG'])    THEN ri.quantity ELSE 0 END), 0)::integer,
        'carrier',         COALESCE(SUM(CASE WHEN upper(COALESCE(bt.code,'')) = ANY(ARRAY['CARRY_ON','SUITCASE','CARRIER']) THEN ri.quantity ELSE 0 END), 0)::integer,
        'strollerBicycle', COALESCE(SUM(CASE WHEN upper(COALESCE(bt.code,'')) = ANY(ARRAY['SPECIAL','STROLLER_BICYCLE'])  THEN ri.quantity ELSE 0 END), 0)::integer
      ) AS bag_sizes
    FROM reservation_items ri
    LEFT JOIN baggage_types bt ON bt.id = ri.baggage_type_id
    WHERE ri.reservation_id = r.id
  ) baggage ON true
)
SELECT
  id,
  reservation_id,
  reservation_code,
  reservation_no,
  customer_id,
  branch_id,
  branch_code,
  branch_name,
  service_id,
  service_type,
  scheduled_at,
  reservation_status,
  ops_status,
  issue_status,
  risk_level,
  approval_mode,
  currency,
  audit_note,
  user_name,
  user_email,
  sns_channel,
  sns_id,
  country,
  language,
  pickup_location_id,
  pickup_location,
  pickup_location_name,
  pickup_address,
  pickup_address_detail,
  pickup_image_url,
  pickup_date,
  pickup_time,
  dropoff_location_id,
  dropoff_location,
  dropoff_location_name,
  dropoff_address,
  dropoff_address_detail,
  dropoff_date,
  delivery_time,
  return_date,
  return_time,
  bags,
  bag_sizes,
  insurance_level,
  insurance_bag_count,
  use_insurance,
  insurance_fee,
  price,
  final_price,
  settlement_hard_copy_amount,
  credit_used,
  promo_code,
  discount_code,
  discount_amount,
  weight_surcharge_5kg,
  weight_surcharge_10kg,
  payment_method,
  payment_provider,
  payment_order_id,
  payment_key,
  payment_receipt_url,
  payment_approved_at,
  payment_status,
  agreed_to_terms,
  agreed_to_privacy,
  agreed_to_high_value,
  image_url,
  branch_commission_delivery,
  branch_commission_storage,
  branch_settlement_amount,
  settlement_status,
  settled_at,
  settled_by,
  payout_id,
  created_at,
  updated_at,
  is_deleted,
  map_admin_booking_status(settlement_status, reservation_status, ops_status, payment_status, service_type) AS status
FROM booking_core;

-- admin_revenue_daily_v1 재생성
CREATE OR REPLACE VIEW public.admin_revenue_daily_v1 AS
SELECT
  pickup_date AS date,
  branch_id,
  branch_code,
  branch_name,
  count(*) FILTER (WHERE NOT is_deleted) AS booking_count,
  count(*) FILTER (WHERE NOT is_deleted AND status <> ALL(ARRAY['취소됨','환불완료'])) AS active_booking_count,
  count(*) FILTER (WHERE NOT is_deleted AND service_type = 'DELIVERY' AND status <> ALL(ARRAY['취소됨','환불완료'])) AS delivery_count,
  count(*) FILTER (WHERE NOT is_deleted AND service_type = 'STORAGE'  AND status <> ALL(ARRAY['취소됨','환불완료'])) AS storage_count,
  COALESCE(SUM(CASE WHEN NOT is_deleted THEN bags ELSE 0 END), 0)::integer AS bag_count,
  COALESCE(SUM(CASE WHEN NOT is_deleted THEN COALESCE((bag_sizes->>'handBag')::integer,0) ELSE 0 END), 0)::integer AS hand_bag_count,
  COALESCE(SUM(CASE WHEN NOT is_deleted THEN COALESCE((bag_sizes->>'carrier')::integer,0) ELSE 0 END), 0)::integer AS carrier_count,
  COALESCE(SUM(CASE WHEN NOT is_deleted THEN COALESCE((bag_sizes->>'strollerBicycle')::integer,0) ELSE 0 END), 0)::integer AS stroller_bicycle_count,
  count(*) FILTER (WHERE NOT is_deleted AND status = '완료')    AS completed_count,
  count(*) FILTER (WHERE NOT is_deleted AND status = '취소됨')  AS cancelled_count,
  count(*) FILTER (WHERE NOT is_deleted AND status = '환불완료') AS refunded_count,
  COALESCE(SUM(CASE WHEN NOT is_deleted AND status <> ALL(ARRAY['취소됨','환불완료']) THEN settlement_hard_copy_amount ELSE 0 END), 0)::numeric(12,2) AS total_revenue,
  COALESCE(SUM(CASE WHEN NOT is_deleted AND status = '취소됨'  THEN settlement_hard_copy_amount ELSE 0 END), 0)::numeric(12,2) AS cancelled_total,
  COALESCE(SUM(CASE WHEN NOT is_deleted AND status = '환불완료' THEN settlement_hard_copy_amount ELSE 0 END), 0)::numeric(12,2) AS refunded_total,
  COALESCE(SUM(CASE WHEN NOT is_deleted AND status <> ALL(ARRAY['취소됨','환불완료']) AND payment_method = 'cash'    THEN settlement_hard_copy_amount ELSE 0 END), 0)::numeric(12,2) AS cash_revenue,
  COALESCE(SUM(CASE WHEN NOT is_deleted AND status <> ALL(ARRAY['취소됨','환불완료']) AND payment_method = 'card'    THEN settlement_hard_copy_amount ELSE 0 END), 0)::numeric(12,2) AS card_revenue,
  COALESCE(SUM(CASE WHEN NOT is_deleted AND status <> ALL(ARRAY['취소됨','환불완료']) AND payment_method = 'apple'   THEN settlement_hard_copy_amount ELSE 0 END), 0)::numeric(12,2) AS apple_revenue,
  COALESCE(SUM(CASE WHEN NOT is_deleted AND status <> ALL(ARRAY['취소됨','환불완료']) AND payment_method = 'samsung' THEN settlement_hard_copy_amount ELSE 0 END), 0)::numeric(12,2) AS samsung_revenue,
  COALESCE(SUM(CASE WHEN NOT is_deleted AND status <> ALL(ARRAY['취소됨','환불완료']) AND payment_method = 'wechat'  THEN settlement_hard_copy_amount ELSE 0 END), 0)::numeric(12,2) AS wechat_revenue,
  COALESCE(SUM(CASE WHEN NOT is_deleted AND status <> ALL(ARRAY['취소됨','환불완료']) AND payment_method = 'alipay'  THEN settlement_hard_copy_amount ELSE 0 END), 0)::numeric(12,2) AS alipay_revenue,
  COALESCE(SUM(CASE WHEN NOT is_deleted AND status <> ALL(ARRAY['취소됨','환불완료']) AND payment_method = 'naver'   THEN settlement_hard_copy_amount ELSE 0 END), 0)::numeric(12,2) AS naver_revenue,
  COALESCE(SUM(CASE WHEN NOT is_deleted AND status <> ALL(ARRAY['취소됨','환불완료']) AND payment_method = 'kakao'   THEN settlement_hard_copy_amount ELSE 0 END), 0)::numeric(12,2) AS kakao_revenue,
  COALESCE(SUM(CASE WHEN NOT is_deleted AND status <> ALL(ARRAY['취소됨','환불완료']) AND payment_method = 'paypal'  THEN settlement_hard_copy_amount ELSE 0 END), 0)::numeric(12,2) AS paypal_revenue,
  COALESCE(SUM(CASE WHEN NOT is_deleted AND status <> ALL(ARRAY['취소됨','환불완료']) AND COALESCE(settlement_status,'') = 'CONFIRMED' THEN settlement_hard_copy_amount ELSE 0 END), 0)::numeric(12,2) AS confirmed_amount,
  COALESCE(SUM(CASE WHEN NOT is_deleted AND status <> ALL(ARRAY['취소됨','환불완료']) AND COALESCE(settlement_status,'') <> 'CONFIRMED' THEN settlement_hard_copy_amount ELSE 0 END), 0)::numeric(12,2) AS unconfirmed_amount,
  COALESCE(SUM(CASE WHEN NOT is_deleted AND status <> ALL(ARRAY['취소됨','환불완료']) THEN COALESCE(branch_settlement_amount, 0) ELSE 0 END), 0)::numeric(12,2) AS partner_payout_total
FROM public.admin_booking_list_v1
WHERE pickup_date IS NOT NULL
GROUP BY pickup_date, branch_id, branch_code, branch_name;

-- admin_revenue_monthly_v1 재생성
CREATE OR REPLACE VIEW public.admin_revenue_monthly_v1 AS
SELECT
  date_trunc('month', date::timestamp)::date AS month,
  branch_id,
  branch_code,
  branch_name,
  SUM(booking_count)::integer        AS booking_count,
  SUM(active_booking_count)::integer AS active_booking_count,
  SUM(delivery_count)::integer       AS delivery_count,
  SUM(storage_count)::integer        AS storage_count,
  SUM(bag_count)::integer            AS bag_count,
  SUM(hand_bag_count)::integer       AS hand_bag_count,
  SUM(carrier_count)::integer        AS carrier_count,
  SUM(stroller_bicycle_count)::integer AS stroller_bicycle_count,
  SUM(completed_count)::integer      AS completed_count,
  SUM(cancelled_count)::integer      AS cancelled_count,
  SUM(refunded_count)::integer       AS refunded_count,
  SUM(total_revenue)::numeric(12,2)      AS total_revenue,
  SUM(cancelled_total)::numeric(12,2)    AS cancelled_total,
  SUM(refunded_total)::numeric(12,2)     AS refunded_total,
  SUM(cash_revenue)::numeric(12,2)       AS cash_revenue,
  SUM(card_revenue)::numeric(12,2)       AS card_revenue,
  SUM(apple_revenue)::numeric(12,2)      AS apple_revenue,
  SUM(samsung_revenue)::numeric(12,2)    AS samsung_revenue,
  SUM(wechat_revenue)::numeric(12,2)     AS wechat_revenue,
  SUM(alipay_revenue)::numeric(12,2)     AS alipay_revenue,
  SUM(naver_revenue)::numeric(12,2)      AS naver_revenue,
  SUM(kakao_revenue)::numeric(12,2)      AS kakao_revenue,
  SUM(paypal_revenue)::numeric(12,2)     AS paypal_revenue,
  SUM(confirmed_amount)::numeric(12,2)   AS confirmed_amount,
  SUM(unconfirmed_amount)::numeric(12,2) AS unconfirmed_amount,
  SUM(partner_payout_total)::numeric(12,2) AS partner_payout_total
FROM public.admin_revenue_daily_v1
GROUP BY date_trunc('month', date::timestamp)::date, branch_id, branch_code, branch_name;

-- 권한 재부여
GRANT SELECT ON public.admin_booking_list_v1    TO authenticated;
GRANT SELECT ON public.admin_booking_list_v1    TO anon;
GRANT SELECT ON public.admin_revenue_daily_v1   TO authenticated;
GRANT SELECT ON public.admin_revenue_daily_v1   TO anon;
GRANT SELECT ON public.admin_revenue_monthly_v1 TO authenticated;
GRANT SELECT ON public.admin_revenue_monthly_v1 TO anon;
