-- ─────────────────────────────────────────────────────────────────────────────
-- 채널별 ROAS 분석
-- 사전 조건: GA4 BigQuery 연동 완료, beeliber.raw.ad_spend 테이블 존재
-- 파라미터: @start_date, @end_date (YYYYMMDD 형식)
-- ─────────────────────────────────────────────────────────────────────────────

WITH conversions AS (
  SELECT
    traffic_source.source                              AS source,
    traffic_source.medium                              AS medium,
    traffic_source.name                                AS campaign,
    SUM(ecommerce.purchase_revenue)                    AS revenue,
    COUNT(DISTINCT ecommerce.transaction_id)           AS order_count,
    COUNT(DISTINCT user_pseudo_id)                     AS converters
  FROM `beeliber.analytics_379859002.events_*`
  WHERE event_name = 'purchase'
    AND _TABLE_SUFFIX BETWEEN @start_date AND @end_date
    AND ecommerce.purchase_revenue IS NOT NULL
  GROUP BY 1, 2, 3
),
spend AS (
  SELECT
    source,
    medium,
    SUM(cost) AS cost
  FROM `beeliber.raw.ad_spend`
  WHERE date BETWEEN PARSE_DATE('%Y%m%d', @start_date)
                 AND PARSE_DATE('%Y%m%d', @end_date)
  GROUP BY 1, 2
)
SELECT
  c.source,
  c.medium,
  c.campaign,
  ROUND(c.revenue, 0)                                 AS revenue,
  c.order_count,
  c.converters,
  ROUND(s.cost, 0)                                    AS ad_spend,
  ROUND(SAFE_DIVIDE(c.revenue, s.cost), 2)            AS roas,
  ROUND(SAFE_DIVIDE(c.revenue, c.order_count), 0)     AS avg_order_value
FROM conversions c
LEFT JOIN spend s USING(source, medium)
ORDER BY roas DESC NULLS LAST;
