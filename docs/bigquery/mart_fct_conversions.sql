-- ─────────────────────────────────────────────────────────────────────────────
-- 전환 마트 테이블 (스케줄드 쿼리 — 매일 실행)
-- 사전 조건: GA4 BigQuery 연동 완료, beeliber.mart 데이터셋 존재
-- 스케줄: 매일 UTC 00:30 실행 (KST 09:30)
-- ─────────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE TABLE `beeliber.mart.fct_conversions` AS
SELECT
  PARSE_DATE('%Y%m%d', event_date)                          AS conversion_date,
  user_pseudo_id,
  user_id,

  -- 거래 정보
  (SELECT value.string_value FROM UNNEST(event_params)
   WHERE key = 'transaction_id')                            AS transaction_id,
  ecommerce.purchase_revenue                                AS revenue,
  ecommerce.shipping                                        AS shipping,
  ecommerce.tax                                             AS tax,

  -- 채널 어트리뷰션
  traffic_source.source                                     AS utm_source,
  traffic_source.medium                                     AS utm_medium,
  traffic_source.name                                       AS utm_campaign,

  -- 지역 / 디바이스
  geo.country,
  geo.region,
  device.category                                           AS device_category,
  device.language,
  device.operating_system,

  -- 사용자 속성
  (SELECT value.string_value FROM UNNEST(user_properties)
   WHERE key = 'language')                                  AS preferred_language,
  (SELECT value.string_value FROM UNNEST(user_properties)
   WHERE key = 'user_type')                                 AS user_type

FROM `beeliber.analytics_379859002.events_*`
WHERE event_name = 'purchase'
  AND _TABLE_SUFFIX BETWEEN
    FORMAT_DATE('%Y%m%d', DATE_SUB(CURRENT_DATE(), INTERVAL 90 DAY))
    AND FORMAT_DATE('%Y%m%d', CURRENT_DATE())
  AND ecommerce.purchase_revenue IS NOT NULL;
