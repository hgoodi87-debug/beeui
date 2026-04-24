-- 보안 패치: public_create_booking_details_v1 — anon 사용자가 storage_numbers를 주입하는 신뢰 경계 위반 수정
-- 수정 전: v_storage_numbers = p_payload->'storage_numbers' (사용자 입력을 그대로 INSERT)
-- 수정 후: storage_numbers = NULL 고정 → 트리거(trg_assign_storage_numbers_on_payment)가 항상 reserve_storage_numbers_v1() 호출
-- 참조: beeliber-security/trust-boundary-rpc-2026-04-24

CREATE OR REPLACE FUNCTION public.public_create_booking_details_v1(
  p_payload JSONB
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_row public.booking_details;
BEGIN
  INSERT INTO public.booking_details (
    sns_channel,
    sns_id,
    country,
    pickup_location_id,
    pickup_address,
    pickup_address_detail,
    pickup_image_url,
    pickup_date,
    pickup_time,
    dropoff_location_id,
    dropoff_address,
    dropoff_address_detail,
    dropoff_date,
    delivery_time,
    return_date,
    return_time,
    insurance_level,
    insurance_bag_count,
    use_insurance,
    insurance_fee,
    credit_used,
    base_price,
    final_price,
    promo_code,
    discount_amount,
    weight_surcharge_5kg,
    weight_surcharge_10kg,
    payment_method,
    payment_provider,
    payment_order_id,
    payment_key,
    payment_receipt_url,
    payment_approved_at,
    agreed_to_terms,
    agreed_to_privacy,
    agreed_to_high_value,
    branch_commission_delivery,
    branch_commission_storage,
    branch_settlement_amount,
    settlement_status,
    settled_at,
    settled_by,
    reservation_code,
    language,
    image_url,
    service_type,
    user_name,
    user_email,
    pickup_location,
    dropoff_location,
    bags,
    bag_summary,
    utm_source,
    utm_medium,
    utm_campaign,
    utm_content,
    utm_term,
    nametag_id,
    storage_numbers
  )
  VALUES (
    NULLIF(p_payload->>'sns_channel',''),
    NULLIF(p_payload->>'sns_id',''),
    NULLIF(p_payload->>'country',''),
    NULLIF(p_payload->>'pickup_location_id','')::uuid,
    NULLIF(p_payload->>'pickup_address',''),
    NULLIF(p_payload->>'pickup_address_detail',''),
    NULLIF(p_payload->>'pickup_image_url',''),
    NULLIF(p_payload->>'pickup_date','')::date,
    NULLIF(p_payload->>'pickup_time','')::time,
    NULLIF(p_payload->>'dropoff_location_id','')::uuid,
    NULLIF(p_payload->>'dropoff_address',''),
    NULLIF(p_payload->>'dropoff_address_detail',''),
    NULLIF(p_payload->>'dropoff_date','')::date,
    NULLIF(p_payload->>'delivery_time','')::time,
    NULLIF(p_payload->>'return_date','')::date,
    NULLIF(p_payload->>'return_time','')::time,
    NULLIF(p_payload->>'insurance_level','')::integer,
    NULLIF(p_payload->>'insurance_bag_count','')::integer,
    COALESCE((p_payload->>'use_insurance')::boolean, false),
    COALESCE(NULLIF(p_payload->>'insurance_fee','')::integer, 0),
    COALESCE(NULLIF(p_payload->>'credit_used','')::integer, 0),
    COALESCE(NULLIF(p_payload->>'base_price','')::numeric, 0),
    COALESCE(NULLIF(p_payload->>'final_price','')::numeric, 0),
    NULLIF(p_payload->>'promo_code',''),
    COALESCE(NULLIF(p_payload->>'discount_amount','')::numeric, 0),
    NULLIF(p_payload->>'weight_surcharge_5kg','')::numeric,
    NULLIF(p_payload->>'weight_surcharge_10kg','')::numeric,
    NULLIF(p_payload->>'payment_method',''),
    NULLIF(p_payload->>'payment_provider',''),
    NULLIF(p_payload->>'payment_order_id',''),
    NULLIF(p_payload->>'payment_key',''),
    NULLIF(p_payload->>'payment_receipt_url',''),
    NULLIF(p_payload->>'payment_approved_at','')::timestamptz,
    COALESCE((p_payload->>'agreed_to_terms')::boolean, false),
    COALESCE((p_payload->>'agreed_to_privacy')::boolean, false),
    COALESCE((p_payload->>'agreed_to_high_value')::boolean, false),
    NULLIF(p_payload->>'branch_commission_delivery','')::numeric,
    NULLIF(p_payload->>'branch_commission_storage','')::numeric,
    NULLIF(p_payload->>'branch_settlement_amount','')::numeric,
    NULLIF(p_payload->>'settlement_status',''),
    NULLIF(p_payload->>'settled_at','')::timestamptz,
    NULLIF(p_payload->>'settled_by',''),
    NULLIF(p_payload->>'reservation_code',''),
    COALESCE(NULLIF(p_payload->>'language',''), 'en'),
    NULLIF(p_payload->>'image_url',''),
    COALESCE(NULLIF(p_payload->>'service_type',''), 'STORAGE'),
    NULLIF(p_payload->>'user_name',''),
    NULLIF(p_payload->>'user_email',''),
    NULLIF(p_payload->>'pickup_location',''),
    NULLIF(p_payload->>'dropoff_location',''),
    COALESCE(NULLIF(p_payload->>'bags','')::integer, 0),
    NULLIF(p_payload->>'bag_summary',''),
    NULLIF(p_payload->>'utm_source',''),
    NULLIF(p_payload->>'utm_medium',''),
    NULLIF(p_payload->>'utm_campaign',''),
    NULLIF(p_payload->>'utm_content',''),
    NULLIF(p_payload->>'utm_term',''),
    NULLIF(p_payload->>'nametag_id','')::integer,
    NULL  -- storage_numbers: 사용자 입력 무시. 트리거가 reserve_storage_numbers_v1()으로 할당.
  )
  RETURNING * INTO v_row;

  RETURN jsonb_build_object(
    'id', v_row.id,
    'reservation_code', v_row.reservation_code,
    'nametag_id', v_row.nametag_id,
    'storage_numbers', v_row.storage_numbers,
    'created_at', v_row.created_at
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.public_create_booking_details_v1(jsonb) TO anon;
GRANT EXECUTE ON FUNCTION public.public_create_booking_details_v1(jsonb) TO authenticated;
