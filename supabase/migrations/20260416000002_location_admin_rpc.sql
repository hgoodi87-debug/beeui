-- ─────────────────────────────────────────────────────────────────────────────
-- Migration: 20260416000002_location_admin_rpc.sql
-- Purpose:   어드민 지점(locations) 저장/수정을 위한 SECURITY DEFINER RPC
--
-- 문제: admin_write_locations RLS 정책이 has_any_role(super_admin/hq_admin/hub_manager)를
--       요구하지만, PATCH가 RLS에 막히면 조용히 [] 반환 → 코드가 INSERT 시도 →
--       WITH CHECK 실패로 42501 에러. 실제 권한 있는 계정도 JWT 상태에 따라 실패 가능.
--
-- 해결: SECURITY DEFINER RPC로 내부에서 권한 검증 후 UPSERT 수행.
--       - jsonb_populate_record(NULL::locations, payload) 로 알 수 없는 컬럼 자동 필터
--       - has_any_role 실패 시 명확한 한국어 에러 메시지 반환
-- ─────────────────────────────────────────────────────────────────────────────

DROP FUNCTION IF EXISTS public.admin_upsert_location(uuid, text, jsonb);
DROP FUNCTION IF EXISTS public.admin_upsert_location(jsonb);

CREATE OR REPLACE FUNCTION public.admin_upsert_location(
  p_id        UUID    DEFAULT NULL,  -- 기존 레코드 UUID (수정 시)
  p_short_code TEXT   DEFAULT NULL,  -- short_code (신규 또는 코드 기반 조회)
  p_payload   JSONB   DEFAULT '{}'::jsonb  -- 전체 location 데이터
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_row          public.locations%ROWTYPE;
  v_populated    public.locations%ROWTYPE;
  v_result       JSONB;
BEGIN
  -- ── 권한 검사 ────────────────────────────────────────────────────────────
  IF NOT public.has_any_role(ARRAY['super_admin','hq_admin','hub_manager']) THEN
    RAISE EXCEPTION '지점 수정 권한이 없습니다 (super_admin/hq_admin/hub_manager 역할 필요). 올바른 관리자 계정으로 로그인해주세요.'
      USING ERRCODE = '42501';
  END IF;

  -- ── payload → locations 행 변환 (알 수 없는 컬럼은 자동 무시됨) ──────────
  -- p_id / p_short_code 가 payload에 없을 경우 주입
  IF p_id IS NOT NULL THEN
    p_payload := p_payload || jsonb_build_object('id', p_id::text);
  END IF;
  IF p_short_code IS NOT NULL AND (p_payload->>'short_code') IS NULL THEN
    p_payload := p_payload || jsonb_build_object('short_code', p_short_code);
  END IF;

  SELECT * INTO v_populated
  FROM jsonb_populate_record(NULL::public.locations, p_payload);

  -- ── 케이스 1: UUID로 기존 레코드 업데이트 ───────────────────────────────
  IF p_id IS NOT NULL THEN
    UPDATE public.locations l
    SET
      short_code             = COALESCE(v_populated.short_code,             l.short_code),
      name                   = COALESCE(NULLIF(v_populated.name,''),         l.name),
      name_en                = COALESCE(v_populated.name_en,                 l.name_en),
      name_ja                = COALESCE(v_populated.name_ja,                 l.name_ja),
      name_zh                = COALESCE(v_populated.name_zh,                 l.name_zh),
      name_zh_tw             = COALESCE(v_populated.name_zh_tw,              l.name_zh_tw),
      name_zh_hk             = COALESCE(v_populated.name_zh_hk,              l.name_zh_hk),
      type                   = COALESCE(v_populated.type,                    l.type),
      address                = COALESCE(v_populated.address,                 l.address),
      address_en             = COALESCE(v_populated.address_en,              l.address_en),
      address_ja             = COALESCE(v_populated.address_ja,              l.address_ja),
      address_zh             = COALESCE(v_populated.address_zh,              l.address_zh),
      address_zh_tw          = COALESCE(v_populated.address_zh_tw,           l.address_zh_tw),
      address_zh_hk          = COALESCE(v_populated.address_zh_hk,           l.address_zh_hk),
      description            = COALESCE(v_populated.description,             l.description),
      description_en         = COALESCE(v_populated.description_en,          l.description_en),
      description_ja         = COALESCE(v_populated.description_ja,          l.description_ja),
      description_zh         = COALESCE(v_populated.description_zh,          l.description_zh),
      description_zh_tw      = COALESCE(v_populated.description_zh_tw,       l.description_zh_tw),
      description_zh_hk      = COALESCE(v_populated.description_zh_hk,       l.description_zh_hk),
      pickup_guide           = COALESCE(v_populated.pickup_guide,            l.pickup_guide),
      pickup_guide_en        = COALESCE(v_populated.pickup_guide_en,         l.pickup_guide_en),
      pickup_guide_ja        = COALESCE(v_populated.pickup_guide_ja,         l.pickup_guide_ja),
      pickup_guide_zh        = COALESCE(v_populated.pickup_guide_zh,         l.pickup_guide_zh),
      pickup_guide_zh_tw     = COALESCE(v_populated.pickup_guide_zh_tw,      l.pickup_guide_zh_tw),
      pickup_guide_zh_hk     = COALESCE(v_populated.pickup_guide_zh_hk,      l.pickup_guide_zh_hk),
      business_hours         = COALESCE(v_populated.business_hours,          l.business_hours),
      business_hours_en      = COALESCE(v_populated.business_hours_en,       l.business_hours_en),
      business_hours_ja      = COALESCE(v_populated.business_hours_ja,       l.business_hours_ja),
      business_hours_zh      = COALESCE(v_populated.business_hours_zh,       l.business_hours_zh),
      business_hours_zh_tw   = COALESCE(v_populated.business_hours_zh_tw,    l.business_hours_zh_tw),
      business_hours_zh_hk   = COALESCE(v_populated.business_hours_zh_hk,    l.business_hours_zh_hk),
      supports_delivery      = COALESCE(v_populated.supports_delivery,       l.supports_delivery),
      supports_storage       = COALESCE(v_populated.supports_storage,        l.supports_storage),
      is_origin              = COALESCE(v_populated.is_origin,               l.is_origin),
      is_destination         = COALESCE(v_populated.is_destination,          l.is_destination),
      lat                    = COALESCE(v_populated.lat,                     l.lat),
      lng                    = COALESCE(v_populated.lng,                     l.lng),
      origin_surcharge       = COALESCE(v_populated.origin_surcharge,        l.origin_surcharge),
      destination_surcharge  = COALESCE(v_populated.destination_surcharge,   l.destination_surcharge),
      image_url              = COALESCE(v_populated.image_url,               l.image_url),
      pickup_image_url       = COALESCE(v_populated.pickup_image_url,        l.pickup_image_url),
      is_active              = COALESCE(v_populated.is_active,               l.is_active),
      is_partner             = COALESCE(v_populated.is_partner,              l.is_partner),
      branch_code            = COALESCE(v_populated.branch_code,             l.branch_code),
      branch_id              = COALESCE(v_populated.branch_id,               l.branch_id),
      owner_name             = COALESCE(v_populated.owner_name,              l.owner_name),
      phone                  = COALESCE(v_populated.phone,                   l.phone),
      commission_rate_delivery  = COALESCE(v_populated.commission_rate_delivery,  l.commission_rate_delivery),
      commission_rate_storage   = COALESCE(v_populated.commission_rate_storage,   l.commission_rate_storage),
      updated_at             = NOW()
    WHERE l.id = p_id
    RETURNING * INTO v_row;

    IF FOUND THEN
      RETURN row_to_json(v_row)::jsonb;
    END IF;
    -- id로 찾지 못하면 short_code로 fallthrough
  END IF;

  -- ── 케이스 2: short_code 기반 UPSERT ────────────────────────────────────
  IF p_short_code IS NOT NULL OR v_populated.short_code IS NOT NULL THEN
    INSERT INTO public.locations (
      short_code, name, name_en, name_ja, name_zh, name_zh_tw, name_zh_hk,
      type, address, address_en, address_ja, address_zh, address_zh_tw, address_zh_hk,
      description, description_en, description_ja, description_zh, description_zh_tw, description_zh_hk,
      pickup_guide, pickup_guide_en, pickup_guide_ja, pickup_guide_zh, pickup_guide_zh_tw, pickup_guide_zh_hk,
      business_hours, business_hours_en, business_hours_ja, business_hours_zh, business_hours_zh_tw, business_hours_zh_hk,
      supports_delivery, supports_storage, is_origin, is_destination,
      lat, lng, origin_surcharge, destination_surcharge,
      image_url, pickup_image_url, is_active, is_partner,
      branch_code, branch_id, owner_name, phone,
      commission_rate_delivery, commission_rate_storage
    )
    SELECT
      v_populated.short_code, v_populated.name, v_populated.name_en, v_populated.name_ja,
      v_populated.name_zh, v_populated.name_zh_tw, v_populated.name_zh_hk,
      v_populated.type, v_populated.address, v_populated.address_en, v_populated.address_ja,
      v_populated.address_zh, v_populated.address_zh_tw, v_populated.address_zh_hk,
      v_populated.description, v_populated.description_en, v_populated.description_ja,
      v_populated.description_zh, v_populated.description_zh_tw, v_populated.description_zh_hk,
      v_populated.pickup_guide, v_populated.pickup_guide_en, v_populated.pickup_guide_ja,
      v_populated.pickup_guide_zh, v_populated.pickup_guide_zh_tw, v_populated.pickup_guide_zh_hk,
      v_populated.business_hours, v_populated.business_hours_en, v_populated.business_hours_ja,
      v_populated.business_hours_zh, v_populated.business_hours_zh_tw, v_populated.business_hours_zh_hk,
      COALESCE(v_populated.supports_delivery, true),
      COALESCE(v_populated.supports_storage, true),
      COALESCE(v_populated.is_origin, false),
      COALESCE(v_populated.is_destination, false),
      v_populated.lat, v_populated.lng,
      COALESCE(v_populated.origin_surcharge, 0),
      COALESCE(v_populated.destination_surcharge, 0),
      v_populated.image_url, v_populated.pickup_image_url,
      COALESCE(v_populated.is_active, false),
      COALESCE(v_populated.is_partner, false),
      v_populated.branch_code, v_populated.branch_id,
      v_populated.owner_name, v_populated.phone,
      COALESCE(v_populated.commission_rate_delivery, 0),
      COALESCE(v_populated.commission_rate_storage, 0)
    ON CONFLICT (short_code) DO UPDATE SET
      name                   = COALESCE(EXCLUDED.name,                   locations.name),
      name_en                = COALESCE(EXCLUDED.name_en,                locations.name_en),
      name_ja                = COALESCE(EXCLUDED.name_ja,                locations.name_ja),
      name_zh                = COALESCE(EXCLUDED.name_zh,                locations.name_zh),
      name_zh_tw             = COALESCE(EXCLUDED.name_zh_tw,             locations.name_zh_tw),
      name_zh_hk             = COALESCE(EXCLUDED.name_zh_hk,             locations.name_zh_hk),
      type                   = COALESCE(EXCLUDED.type,                   locations.type),
      address                = COALESCE(EXCLUDED.address,                locations.address),
      address_en             = COALESCE(EXCLUDED.address_en,             locations.address_en),
      address_ja             = COALESCE(EXCLUDED.address_ja,             locations.address_ja),
      address_zh             = COALESCE(EXCLUDED.address_zh,             locations.address_zh),
      address_zh_tw          = COALESCE(EXCLUDED.address_zh_tw,          locations.address_zh_tw),
      address_zh_hk          = COALESCE(EXCLUDED.address_zh_hk,          locations.address_zh_hk),
      description            = COALESCE(EXCLUDED.description,            locations.description),
      description_en         = COALESCE(EXCLUDED.description_en,         locations.description_en),
      description_ja         = COALESCE(EXCLUDED.description_ja,         locations.description_ja),
      description_zh         = COALESCE(EXCLUDED.description_zh,         locations.description_zh),
      description_zh_tw      = COALESCE(EXCLUDED.description_zh_tw,      locations.description_zh_tw),
      description_zh_hk      = COALESCE(EXCLUDED.description_zh_hk,      locations.description_zh_hk),
      pickup_guide           = COALESCE(EXCLUDED.pickup_guide,           locations.pickup_guide),
      pickup_guide_en        = COALESCE(EXCLUDED.pickup_guide_en,        locations.pickup_guide_en),
      pickup_guide_ja        = COALESCE(EXCLUDED.pickup_guide_ja,        locations.pickup_guide_ja),
      pickup_guide_zh        = COALESCE(EXCLUDED.pickup_guide_zh,        locations.pickup_guide_zh),
      pickup_guide_zh_tw     = COALESCE(EXCLUDED.pickup_guide_zh_tw,     locations.pickup_guide_zh_tw),
      pickup_guide_zh_hk     = COALESCE(EXCLUDED.pickup_guide_zh_hk,     locations.pickup_guide_zh_hk),
      business_hours         = COALESCE(EXCLUDED.business_hours,         locations.business_hours),
      business_hours_en      = COALESCE(EXCLUDED.business_hours_en,      locations.business_hours_en),
      business_hours_ja      = COALESCE(EXCLUDED.business_hours_ja,      locations.business_hours_ja),
      business_hours_zh      = COALESCE(EXCLUDED.business_hours_zh,      locations.business_hours_zh),
      business_hours_zh_tw   = COALESCE(EXCLUDED.business_hours_zh_tw,   locations.business_hours_zh_tw),
      business_hours_zh_hk   = COALESCE(EXCLUDED.business_hours_zh_hk,   locations.business_hours_zh_hk),
      supports_delivery      = COALESCE(EXCLUDED.supports_delivery,      locations.supports_delivery),
      supports_storage       = COALESCE(EXCLUDED.supports_storage,       locations.supports_storage),
      is_origin              = COALESCE(EXCLUDED.is_origin,              locations.is_origin),
      is_destination         = COALESCE(EXCLUDED.is_destination,         locations.is_destination),
      lat                    = COALESCE(EXCLUDED.lat,                    locations.lat),
      lng                    = COALESCE(EXCLUDED.lng,                    locations.lng),
      origin_surcharge       = COALESCE(EXCLUDED.origin_surcharge,       locations.origin_surcharge),
      destination_surcharge  = COALESCE(EXCLUDED.destination_surcharge,  locations.destination_surcharge),
      image_url              = COALESCE(EXCLUDED.image_url,              locations.image_url),
      pickup_image_url       = COALESCE(EXCLUDED.pickup_image_url,       locations.pickup_image_url),
      is_active              = COALESCE(EXCLUDED.is_active,              locations.is_active),
      is_partner             = COALESCE(EXCLUDED.is_partner,             locations.is_partner),
      branch_code            = COALESCE(EXCLUDED.branch_code,            locations.branch_code),
      branch_id              = COALESCE(EXCLUDED.branch_id,              locations.branch_id),
      owner_name             = COALESCE(EXCLUDED.owner_name,             locations.owner_name),
      phone                  = COALESCE(EXCLUDED.phone,                  locations.phone),
      commission_rate_delivery  = COALESCE(EXCLUDED.commission_rate_delivery,  locations.commission_rate_delivery),
      commission_rate_storage   = COALESCE(EXCLUDED.commission_rate_storage,   locations.commission_rate_storage),
      updated_at             = NOW()
    RETURNING * INTO v_row;

    RETURN row_to_json(v_row)::jsonb;
  END IF;

  RAISE EXCEPTION 'id 또는 short_code 중 하나는 반드시 제공되어야 합니다.'
    USING ERRCODE = '22023';
END;
$$;

-- authenticated 사용자만 호출 가능 (함수 내부에서 역할 재검사)
GRANT EXECUTE ON FUNCTION public.admin_upsert_location(uuid, text, jsonb) TO authenticated;

COMMENT ON FUNCTION public.admin_upsert_location(uuid, text, jsonb) IS
  '어드민 지점(locations) UPSERT. SECURITY DEFINER로 RLS 우회, 내부에서 has_any_role 역할 검사 수행. '
  '알 수 없는 payload 컬럼은 jsonb_populate_record가 자동 필터링.';
