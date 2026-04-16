-- ─────────────────────────────────────────────────────────────────────────────
-- Migration: 20260416000010_add_utm_to_booking_list_view.sql
-- Purpose:   admin_booking_list_v1 뷰에 UTM 컬럼 추가
--
-- 문제: 20260416000009 마이그레이션에서 뷰 재생성 시
--       utm_source / utm_medium / utm_campaign 컬럼이 누락됨
--       → 채널 어트리뷰션 탭에서 항상 UTM 0건으로 표시됨
--
-- 해결: 뷰에 bd.utm_source / bd.utm_medium / bd.utm_campaign 추가
-- ─────────────────────────────────────────────────────────────────────────────

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
      CASE WHEN bd.bag_summary IS NOT NULL AND bd.bag_summary <> '' THEN
        jsonb_build_object(
          'handBag',
          COALESCE((regexp_match(bd.bag_summary, '핸드백\s*(\d+)개'))[1]::integer, 0),
          'carrier',
          COALESCE((regexp_match(bd.bag_summary, '캐리어\s*(\d+)개'))[1]::integer, 0),
          'strollerBicycle',
          COALESCE((regexp_match(bd.bag_summary, '유모차[^\d]*(\d+)개'))[1]::integer, 0)
        )
      ELSE NULL END,
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
    -- UTM 어트리뷰션 컬럼 (채널 분석용)
    bd.utm_source,
    bd.utm_medium,
    bd.utm_campaign,
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
  utm_source,
  utm_medium,
  utm_campaign,
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
  count(*) FILTER (WHERE NOT is_deleted AND service_type = 'DELIVERY' AND status <> ALL(ARRAY['취소됨','환불완료'])) AS delivery_count,
  count(*) FILTER (WHERE NOT is_deleted AND service_type = 'STORAGE'  AND status <> ALL(ARRAY['취소됨','환불완료'])) AS storage_count,
  count(*) FILTER (WHERE NOT is_deleted AND status <> ALL(ARRAY['취소됨','환불완료'])) AS active_booking_count,
  COALESCE(SUM(CASE WHEN NOT is_deleted AND status <> ALL(ARRAY['취소됨','환불완료']) THEN final_price ELSE 0 END), 0)::numeric(12,2) AS total_revenue,
  COALESCE(SUM(CASE WHEN NOT is_deleted AND status <> ALL(ARRAY['취소됨','환불완료']) AND COALESCE(settlement_status,'') = 'CONFIRMED' THEN settlement_hard_copy_amount ELSE 0 END), 0)::numeric(12,2) AS confirmed_amount,
  COALESCE(SUM(CASE WHEN NOT is_deleted AND status <> ALL(ARRAY['취소됨','환불완료']) AND COALESCE(settlement_status,'') <> 'CONFIRMED' THEN settlement_hard_copy_amount ELSE 0 END), 0)::numeric(12,2) AS unconfirmed_amount,
  COALESCE(SUM(CASE WHEN NOT is_deleted AND status <> ALL(ARRAY['취소됨','환불완료']) THEN COALESCE(branch_settlement_amount, 0) ELSE 0 END), 0)::numeric(12,2) AS partner_payout_total
FROM public.admin_booking_list_v1
WHERE pickup_date IS NOT NULL
GROUP BY pickup_date, branch_id, branch_code, branch_name;

-- admin_revenue_monthly_v1 재생성
CREATE OR REPLACE VIEW public.admin_revenue_monthly_v1 AS
SELECT
  date_trunc('month', pickup_date::timestamptz) AS month,
  branch_id,
  branch_code,
  branch_name,
  count(*) FILTER (WHERE NOT is_deleted) AS booking_count,
  count(*) FILTER (WHERE NOT is_deleted AND status <> ALL(ARRAY['취소됨','환불완료'])) AS active_booking_count,
  COALESCE(SUM(CASE WHEN NOT is_deleted AND status <> ALL(ARRAY['취소됨','환불완료']) THEN final_price ELSE 0 END), 0)::numeric(12,2) AS total_revenue,
  COALESCE(SUM(CASE WHEN NOT is_deleted AND status <> ALL(ARRAY['취소됨','환불완료']) AND COALESCE(settlement_status,'') = 'CONFIRMED' THEN settlement_hard_copy_amount ELSE 0 END), 0)::numeric(12,2) AS confirmed_amount,
  COALESCE(SUM(CASE WHEN NOT is_deleted AND status <> ALL(ARRAY['취소됨','환불완료']) THEN COALESCE(branch_settlement_amount, 0) ELSE 0 END), 0)::numeric(12,2) AS partner_payout_total
FROM public.admin_booking_list_v1
WHERE pickup_date IS NOT NULL
GROUP BY date_trunc('month', pickup_date::timestamptz), branch_id, branch_code, branch_name;

-- 권한 재부여
GRANT SELECT ON public.admin_booking_list_v1    TO authenticated;
GRANT SELECT ON public.admin_booking_list_v1    TO anon;
GRANT SELECT ON public.admin_revenue_daily_v1   TO authenticated;
GRANT SELECT ON public.admin_revenue_daily_v1   TO anon;
GRANT SELECT ON public.admin_revenue_monthly_v1 TO authenticated;
GRANT SELECT ON public.admin_revenue_monthly_v1 TO anon;
