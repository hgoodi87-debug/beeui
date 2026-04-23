-- ─────────────────────────────────────────────────────────────────────────────
-- Migration: 20260423000001_storage_daily_numbers.sql
-- Purpose:
--   - 보관(STORAGE) 예약: 지점별/일(KST) 단위 1~30 보관번호 할당
--   - 결제완료(payment_approved_at) 시점에 bags 수량만큼 연속 번호 예약
--   - QR/바우처 노출을 위해 booking_details.storage_numbers 저장
--
-- Notes:
--   - 배송(DELIVERY) 흐름은 영향 없음 (조건: service_type='STORAGE')
--   - 초과(>30) 시 예외로 INSERT/UPDATE 자체를 막아 "예약 불가"로 처리
-- ─────────────────────────────────────────────────────────────────────────────

-- 1) booking_details 컬럼 추가
ALTER TABLE public.booking_details
  ADD COLUMN IF NOT EXISTS storage_numbers integer[];

COMMENT ON COLUMN public.booking_details.storage_numbers
  IS '보관(STORAGE) 전용: 결제완료 시점에 지점별(KST 일 단위) 1~30 연속 번호 예약. bags 수량만큼 할당.';

-- 2) 지점별 일 단위 카운터 (KST date)
CREATE TABLE IF NOT EXISTS public.storage_daily_counters (
  branch_id   uuid NOT NULL REFERENCES public.branches(id) ON DELETE CASCADE,
  kst_date    date NOT NULL,
  last_number integer NOT NULL DEFAULT 0,
  updated_at  timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (branch_id, kst_date)
);

COMMENT ON TABLE public.storage_daily_counters
  IS '보관(STORAGE) 지점별(KST 일 단위) 보관번호 카운터. last_number는 당일 마지막 예약 번호.';

-- 3) 번호 예약 함수 (원자적 증가 + 범위 체크)
DROP FUNCTION IF EXISTS public.reserve_storage_numbers_v1(uuid, timestamptz, integer);
CREATE OR REPLACE FUNCTION public.reserve_storage_numbers_v1(
  p_branch_id uuid,
  p_paid_at   timestamptz,
  p_qty       integer
)
RETURNS integer[]
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_kst_date date;
  v_new_last integer;
  v_start    integer;
  v_end      integer;
BEGIN
  IF p_branch_id IS NULL THEN
    RAISE EXCEPTION 'p_branch_id is required' USING ERRCODE = '22004';
  END IF;
  IF p_qty IS NULL OR p_qty <= 0 THEN
    RETURN ARRAY[]::integer[];
  END IF;

  -- 결제 완료 시점을 KST date로 환산 (요구사항: 한국시간 24시간 단위 초기화)
  v_kst_date := (COALESCE(p_paid_at, now()) AT TIME ZONE 'Asia/Seoul')::date;

  INSERT INTO public.storage_daily_counters(branch_id, kst_date, last_number)
  VALUES (p_branch_id, v_kst_date, 0)
  ON CONFLICT (branch_id, kst_date) DO NOTHING;

  UPDATE public.storage_daily_counters
  SET last_number = last_number + p_qty,
      updated_at  = now()
  WHERE branch_id = p_branch_id
    AND kst_date  = v_kst_date
  RETURNING last_number INTO v_new_last;

  v_end   := v_new_last;
  v_start := v_new_last - p_qty + 1;

  IF v_end > 30 THEN
    RAISE EXCEPTION '보관번호가 모두 사용되었습니다. (지점별 1~30, KST 일 단위) branch_id=%, date=%', p_branch_id, v_kst_date
      USING ERRCODE = 'P0001';
  END IF;

  RETURN ARRAY(SELECT generate_series(v_start, v_end));
END;
$$;

-- 직접 호출은 운영자/백엔드 한정. (일반 사용자가 번호를 선점하는 공격면 방지)
GRANT EXECUTE ON FUNCTION public.reserve_storage_numbers_v1(uuid, timestamptz, integer) TO service_role;

-- 4) payment_approved_at 시점에 storage_numbers 자동 할당 (보관 예약만)
DROP FUNCTION IF EXISTS public.assign_storage_numbers_on_payment_v1();
CREATE OR REPLACE FUNCTION public.assign_storage_numbers_on_payment_v1()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_service_type text;
  v_branch_id uuid;
  v_qty integer;
BEGIN
  v_service_type := upper(COALESCE(NULLIF(NEW.service_type, ''), ''));
  IF v_service_type <> 'STORAGE' THEN
    RETURN NEW;
  END IF;

  IF NEW.payment_approved_at IS NULL THEN
    RETURN NEW;
  END IF;

  -- 이미 할당된 경우 그대로 유지
  IF NEW.storage_numbers IS NOT NULL AND array_length(NEW.storage_numbers, 1) IS NOT NULL THEN
    RETURN NEW;
  END IF;

  v_qty := COALESCE(NEW.bags, 0);
  IF v_qty <= 0 THEN
    RETURN NEW;
  END IF;

  -- branch_id 결정: reservation.branch_id 우선, 없으면 pickup_location.branch_id
  SELECT COALESCE(
    (SELECT r.branch_id FROM public.reservations r WHERE r.id = NEW.reservation_id),
    (SELECT l.branch_id FROM public.locations    l WHERE l.id = NEW.pickup_location_id)
  )
  INTO v_branch_id;

  IF v_branch_id IS NULL THEN
    -- 지점 정보를 못 찾으면 번호 할당 불가 (데이터 정합성 문제)
    RAISE EXCEPTION '보관번호 할당 실패: branch_id를 찾을 수 없습니다. booking_details.id=%', NEW.id
      USING ERRCODE = 'P0001';
  END IF;

  NEW.storage_numbers := public.reserve_storage_numbers_v1(v_branch_id, NEW.payment_approved_at, v_qty);

  -- 기존 운영 화면/프린트 호환을 위해 첫 번호를 nametag_id에도 세팅
  IF NEW.nametag_id IS NULL OR NEW.nametag_id = 0 THEN
    NEW.nametag_id := NEW.storage_numbers[1];
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_assign_storage_numbers_on_payment ON public.booking_details;
CREATE TRIGGER trg_assign_storage_numbers_on_payment
BEFORE INSERT OR UPDATE OF payment_approved_at, bags, service_type, pickup_location_id, reservation_id
ON public.booking_details
FOR EACH ROW
EXECUTE FUNCTION public.assign_storage_numbers_on_payment_v1();

-- 5) admin_update_booking_details: storage_numbers 업데이트 허용 (관리자/서비스롤 전용)
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
  v_role text := auth.role();
  v_storage_numbers integer[];
BEGIN
  -- authenticated 또는 service_role만 허용 (anon 차단)
  IF v_role NOT IN ('authenticated', 'service_role') THEN
    RAISE EXCEPTION '예약 수정 권한이 없습니다. 관리자 계정으로 로그인해주세요.'
      USING ERRCODE = '42501';
  END IF;

  v_storage_numbers := CASE
    WHEN p_payload ? 'storage_numbers' THEN (
      SELECT COALESCE(array_agg(value::integer), ARRAY[]::integer[])
      FROM jsonb_array_elements_text(p_payload->'storage_numbers')
    )
    ELSE NULL
  END;

  UPDATE public.booking_details
  SET
    -- text 타입
    ops_status         = COALESCE(p_payload->>'ops_status',          ops_status),
    settlement_status  = COALESCE(p_payload->>'settlement_status',   settlement_status),
    settled_by         = COALESCE(p_payload->>'settled_by',          settled_by),
    user_name          = COALESCE(p_payload->>'user_name',           user_name),
    user_email         = COALESCE(p_payload->>'user_email',          user_email),
    pickup_location    = COALESCE(p_payload->>'pickup_location',     pickup_location),
    dropoff_location   = COALESCE(p_payload->>'dropoff_location',    dropoff_location),
    payment_method     = COALESCE(p_payload->>'payment_method',      payment_method),
    admin_note         = COALESCE(p_payload->>'admin_note',          admin_note),
    image_url          = COALESCE(p_payload->>'image_url',           image_url),
    pickup_image_url   = COALESCE(p_payload->>'pickup_image_url',    pickup_image_url),
    sns_channel        = COALESCE(p_payload->>'sns_channel',         sns_channel),
    sns_id             = COALESCE(p_payload->>'sns_id',              sns_id),
    language           = COALESCE(p_payload->>'language',            language),
    service_type       = COALESCE(p_payload->>'service_type',        service_type),
    bag_summary        = COALESCE(p_payload->>'bag_summary',         bag_summary),
    promo_code         = COALESCE(p_payload->>'promo_code',          promo_code),
    -- timestamptz 타입
    settled_at         = CASE
                           WHEN p_payload ? 'settled_at'
                             THEN NULLIF(p_payload->>'settled_at','')::timestamptz
                           ELSE settled_at
                         END,
    -- uuid 타입
    payout_id          = CASE
                           WHEN p_payload ? 'payout_id'
                             THEN NULLIF(p_payload->>'payout_id','')::uuid
                           ELSE payout_id
                         END,
    -- date 타입
    pickup_date        = COALESCE(NULLIF(p_payload->>'pickup_date','')::date,   pickup_date),
    dropoff_date       = COALESCE(NULLIF(p_payload->>'dropoff_date','')::date,  dropoff_date),
    return_date        = COALESCE(NULLIF(p_payload->>'return_date','')::date,   return_date),
    -- time 타입
    pickup_time        = COALESCE(NULLIF(p_payload->>'pickup_time','')::time,   pickup_time),
    delivery_time      = COALESCE(NULLIF(p_payload->>'delivery_time','')::time, delivery_time),
    return_time        = COALESCE(NULLIF(p_payload->>'return_time','')::time,   return_time),
    -- integer 타입
    bags               = COALESCE(NULLIF(p_payload->>'bags','')::integer,               bags),
    insurance_level    = COALESCE(NULLIF(p_payload->>'insurance_level','')::integer,    insurance_level),
    insurance_fee      = COALESCE(NULLIF(p_payload->>'insurance_fee','')::integer,      insurance_fee),
    nametag_id         = COALESCE(NULLIF(p_payload->>'nametag_id','')::integer,         nametag_id),
    storage_numbers    = COALESCE(v_storage_numbers, storage_numbers),
    -- numeric 타입
    final_price           = COALESCE(NULLIF(p_payload->>'final_price','')::numeric,           final_price),
    branch_settlement_amount = COALESCE(NULLIF(p_payload->>'branch_settlement_amount','')::numeric, branch_settlement_amount),
    weight_surcharge_5kg  = COALESCE(NULLIF(p_payload->>'weight_surcharge_5kg','')::numeric,  weight_surcharge_5kg),
    weight_surcharge_10kg = COALESCE(NULLIF(p_payload->>'weight_surcharge_10kg','')::numeric, weight_surcharge_10kg),
    discount_amount       = COALESCE(NULLIF(p_payload->>'discount_amount','')::numeric,       discount_amount),
    -- boolean 타입
    use_insurance      = COALESCE((p_payload->>'use_insurance')::boolean, use_insurance)
  WHERE id = p_id;

  GET DIAGNOSTICS v_rows_updated = ROW_COUNT;

  IF v_rows_updated = 0 THEN
    RAISE EXCEPTION '예약을 찾을 수 없습니다: %', p_id
      USING ERRCODE = 'P0002';
  END IF;

  RETURN jsonb_build_object('id', p_id, 'updated', true, 'rows', v_rows_updated);
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_update_booking_details(uuid, jsonb) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_update_booking_details(uuid, jsonb) TO service_role;

-- 6) public storage booking insert RPC (insert + trigger로 번호 할당 후 반환)
DROP FUNCTION IF EXISTS public.public_create_booking_details_v1(jsonb);
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
  v_storage_numbers integer[];
BEGIN
  v_storage_numbers := CASE
    WHEN p_payload ? 'storage_numbers' THEN (
      SELECT COALESCE(array_agg(value::integer), NULL)
      FROM jsonb_array_elements_text(p_payload->'storage_numbers')
    )
    ELSE NULL
  END;

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
    v_storage_numbers
  )
  RETURNING * INTO v_row;

  -- 트리거로 storage_numbers가 할당될 수 있으므로 반환은 v_row 기반
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
