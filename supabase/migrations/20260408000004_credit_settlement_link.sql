-- W-8: credit_accounts 정산 연동
-- booking_details에 credit_used 컬럼 추가
-- final_price에서 크레딧 차감분을 분리하여 정산 추적 가능하게 함

ALTER TABLE public.booking_details
  ADD COLUMN IF NOT EXISTS credit_used INTEGER NOT NULL DEFAULT 0;

COMMENT ON COLUMN public.booking_details.credit_used
  IS '예약 시 사용된 크레딧 금액 (원). final_price는 credit_used 차감 후 금액.';

-- admin_booking_list_v1 뷰에 credit_used 반영을 위해 뷰 재생성
-- (기존 뷰 DROP 후 재생성 — 주요 컬럼 유지)
DROP VIEW IF EXISTS public.admin_booking_list_v1;

CREATE OR REPLACE VIEW public.admin_booking_list_v1 AS
WITH booking_core AS (
  SELECT
    r.id                        AS reservation_id,
    bd.id                       AS id,
    r.status,
    r.created_at,
    r.user_id,
    bd.service_type,
    bd.user_name,
    bd.user_email,
    bd.sns_channel,
    bd.sns_id,
    bd.country,
    bd.language,
    bd.pickup_location_id,
    bd.pickup_location,
    bd.dropoff_location_id,
    bd.dropoff_location,
    bd.pickup_date,
    bd.pickup_time,
    bd.dropoff_date,
    bd.delivery_time,
    bd.return_date,
    bd.return_time,
    bd.bags,
    bd.bag_summary,
    bd.insurance_level,
    bd.insurance_bag_count,
    bd.use_insurance,
    bd.insurance_fee,
    bd.base_price,
    bd.final_price,
    bd.credit_used,
    bd.promo_code,
    bd.discount_amount,
    bd.payment_method,
    bd.payment_provider,
    bd.payment_order_id,
    bd.payment_key,
    bd.payment_receipt_url,
    bd.payment_approved_at,
    bd.branch_commission_delivery,
    bd.branch_commission_storage,
    bd.branch_settlement_amount,
    bd.settlement_status,
    bd.settled_at,
    bd.settled_by,
    bd.payout_id,
    bd.reservation_code,
    bd.image_url,
    bd.admin_note,
    bd.nametag_id,
    bd.agreed_to_terms,
    bd.agreed_to_privacy,
    bd.agreed_to_high_value,
    bd.updated_at,
    coalesce(bd.final_price, bd.base_price, 0) AS settlement_hard_copy_amount,
    lower(coalesce(bd.settlement_status, '')) = 'deleted' AS is_deleted
  FROM public.reservations r
  JOIN public.booking_details bd ON bd.reservation_id = r.id
)
SELECT
  bc.*,
  -- 최신 결제 정보
  (
    SELECT p.status FROM public.payments p
    WHERE p.reservation_id = bc.reservation_id
    ORDER BY p.created_at DESC LIMIT 1
  ) AS payment_status
FROM booking_core bc;

GRANT SELECT ON public.admin_booking_list_v1 TO authenticated;
GRANT SELECT ON public.admin_booking_list_v1 TO anon;
