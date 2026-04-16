-- ─────────────────────────────────────────────────────────────────────────────
-- Migration: 20260416000005_fix_admin_update_booking_auth.sql
-- Purpose:   admin_update_booking_details RPC 인증 조건 수정
--
-- 문제: has_any_role()은 employees.profile_id = auth.uid() 조회를 수행하는데,
--       지점 직원이 Supabase Auth로 로그인해도 employees.profile_id가 미연결이면
--       42501 에러가 발생함.
--
-- 해결: employees 테이블 의존 없이 auth.role() = 'authenticated' 확인으로 단순화.
--       빌리버 관리자 전용 Supabase Auth 계정만 authenticated 토큰을 가짐.
--       (일반 고객은 Firebase Auth 사용, Supabase Auth 계정 없음)
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
  -- ── 권한 검사: authenticated 사용자만 허용 (anon 차단) ───────────────────
  IF auth.role() IS DISTINCT FROM 'authenticated' THEN
    RAISE EXCEPTION '예약 수정 권한이 없습니다. 관리자 계정으로 로그인해주세요.'
      USING ERRCODE = '42501';
  END IF;

  -- ── 허용된 컬럼만 UPDATE (알 수 없는 키는 무시) ─────────────────────────
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
    pickup_date        = COALESCE((p_payload->>'pickup_date'),         pickup_date),
    pickup_time        = COALESCE((p_payload->>'pickup_time'),         pickup_time),
    dropoff_date       = COALESCE((p_payload->>'dropoff_date'),        dropoff_date),
    delivery_time      = COALESCE((p_payload->>'delivery_time'),       delivery_time),
    return_date        = COALESCE((p_payload->>'return_date'),         return_date),
    return_time        = COALESCE((p_payload->>'return_time'),         return_time),
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
    insurance_level    = COALESCE((p_payload->>'insurance_level')::integer, insurance_level),
    insurance_fee      = COALESCE((p_payload->>'insurance_fee')::numeric,   insurance_fee),
    use_insurance      = COALESCE((p_payload->>'use_insurance')::boolean,   use_insurance),
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

-- anon/authenticated 모두 RPC 호출 가능 (내부에서 authenticated 검증)
GRANT EXECUTE ON FUNCTION public.admin_update_booking_details(uuid, jsonb) TO anon;
GRANT EXECUTE ON FUNCTION public.admin_update_booking_details(uuid, jsonb) TO authenticated;
