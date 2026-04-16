-- ─────────────────────────────────────────────────────────────────────────────
-- Migration: 20260416000007_fix_rpc_time_column_cast.sql
-- Purpose:   admin_update_booking_details RPC time 컬럼 타입 캐스트 수정
--
-- 문제: pickup_time / delivery_time / return_time 컬럼이 time 타입인데
--       p_payload->>'...' 는 text를 반환해서
--       COALESCE(text, time) → "types text and time cannot be matched" 400 에러
--
-- 해결: ::time 캐스트 추가 (date 컬럼은 이전 006 마이그레이션에서 수정됨)
-- ─────────────────────────────────────────────────────────────────────────────

DROP FUNCTION IF EXISTS public.admin_update_booking_details(uuid, jsonb);

CREATE OR REPLACE FUNCTION public.admin_update_booking_details(
  p_id      UUID,
  p_payload JSONB
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_rows_updated integer;
BEGIN
  -- authenticated 사용자만 허용 (anon 차단)
  IF auth.role() IS DISTINCT FROM 'authenticated' THEN
    RAISE EXCEPTION '예약 수정 권한이 없습니다. 관리자 계정으로 로그인해주세요.'
      USING ERRCODE = '42501';
  END IF;

  UPDATE public.booking_details
  SET
    ops_status         = COALESCE((p_payload->>'ops_status'),          ops_status),
    settlement_status  = COALESCE((p_payload->>'settlement_status'),   settlement_status),
    settled_at         = CASE
                           WHEN p_payload ? 'settled_at'
                             THEN (p_payload->>'settled_at')::timestamptz
                           ELSE settled_at
                         END,
    settled_by         = COALESCE((p_payload->>'settled_by'),          settled_by),
    payout_id          = CASE
                           WHEN p_payload ? 'payout_id'
                             THEN (p_payload->>'payout_id')::uuid
                           ELSE payout_id
                         END,
    user_name          = COALESCE((p_payload->>'user_name'),           user_name),
    user_email         = COALESCE((p_payload->>'user_email'),          user_email),
    -- date 타입 컬럼 (::date 캐스트)
    pickup_date        = COALESCE((p_payload->>'pickup_date')::date,   pickup_date),
    -- time 타입 컬럼 (::time 캐스트)
    pickup_time        = COALESCE((p_payload->>'pickup_time')::time,   pickup_time),
    dropoff_date       = COALESCE((p_payload->>'dropoff_date')::date,  dropoff_date),
    delivery_time      = COALESCE((p_payload->>'delivery_time')::time, delivery_time),
    return_date        = COALESCE((p_payload->>'return_date')::date,   return_date),
    return_time        = COALESCE((p_payload->>'return_time')::time,   return_time),
    pickup_location    = COALESCE((p_payload->>'pickup_location'),     pickup_location),
    dropoff_location   = COALESCE((p_payload->>'dropoff_location'),    dropoff_location),
    bags               = COALESCE((p_payload->>'bags')::integer,       bags),
    bag_summary        = COALESCE((p_payload->>'bag_summary'),         bag_summary),
    final_price        = COALESCE((p_payload->>'final_price')::numeric, final_price),
    payment_method     = COALESCE((p_payload->>'payment_method'),      payment_method),
    admin_note         = COALESCE((p_payload->>'admin_note'),          admin_note),
    branch_settlement_amount = COALESCE(
                           (p_payload->>'branch_settlement_amount')::numeric,
                           branch_settlement_amount
                         ),
    image_url          = COALESCE((p_payload->>'image_url'),           image_url),
    pickup_image_url   = COALESCE((p_payload->>'pickup_image_url'),    pickup_image_url),
    sns_channel        = COALESCE((p_payload->>'sns_channel'),         sns_channel),
    sns_id             = COALESCE((p_payload->>'sns_id'),              sns_id),
    language           = COALESCE((p_payload->>'language'),            language),
    service_type       = COALESCE((p_payload->>'service_type'),        service_type),
    insurance_level    = COALESCE((p_payload->>'insurance_level')::integer,  insurance_level),
    insurance_fee      = COALESCE((p_payload->>'insurance_fee')::integer,    insurance_fee),
    use_insurance      = COALESCE((p_payload->>'use_insurance')::boolean,    use_insurance),
    weight_surcharge_5kg  = COALESCE((p_payload->>'weight_surcharge_5kg')::numeric,  weight_surcharge_5kg),
    weight_surcharge_10kg = COALESCE((p_payload->>'weight_surcharge_10kg')::numeric, weight_surcharge_10kg),
    discount_amount    = COALESCE((p_payload->>'discount_amount')::numeric, discount_amount),
    promo_code         = COALESCE((p_payload->>'promo_code'),          promo_code),
    nametag_id         = COALESCE((p_payload->>'nametag_id')::integer, nametag_id)
  WHERE id = p_id;

  GET DIAGNOSTICS v_rows_updated = ROW_COUNT;

  IF v_rows_updated = 0 THEN
    RAISE EXCEPTION '예약을 찾을 수 없습니다: %', p_id
      USING ERRCODE = 'P0002';
  END IF;

  RETURN jsonb_build_object('id', p_id, 'updated', true, 'rows', v_rows_updated);
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_update_booking_details(uuid, jsonb) TO anon;
GRANT EXECUTE ON FUNCTION public.admin_update_booking_details(uuid, jsonb) TO authenticated;
