-- EMS(subscale.cloud)용 analytics 전용 뷰
-- booking_details는 RLS로 anon 접근 차단 (20260412000001).
-- EMS는 Supabase Auth 없이 anon 키만 사용하므로, PII 없는 집계 컬럼만
-- 노출하는 뷰를 생성하고 anon SELECT 권한 부여.
--
-- 노출 컬럼: id, service_type, final_price, payment_method,
--             utm_source, utm_medium, utm_campaign,
--             created_at, pickup_date, settlement_status
-- PII 제외: user_name, user_email, sns_id, country, pickup_address 등 전부 제외

CREATE OR REPLACE VIEW public.booking_analytics AS
  SELECT
    id,
    service_type,
    final_price,
    payment_method,
    utm_source,
    utm_medium,
    utm_campaign,
    utm_content,
    utm_term,
    created_at,
    pickup_date,
    settlement_status
  FROM public.booking_details;

-- anon 역할에 SELECT 권한 부여
-- (RLS는 테이블에 적용; 뷰는 별도 GRANT로 제어)
GRANT SELECT ON public.booking_analytics TO anon;
GRANT SELECT ON public.booking_analytics TO authenticated;
