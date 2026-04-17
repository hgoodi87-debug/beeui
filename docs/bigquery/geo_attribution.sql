-- ─────────────────────────────────────────────────────────────────────────────
-- 지역별 전환 어트리뷰션 분석
-- 사전 조건: GA4 BigQuery 연동 완료
-- 파라미터: @start_date, @end_date (YYYYMMDD 형식)
-- ─────────────────────────────────────────────────────────────────────────────

SELECT
  geo.country                                               AS country,
  geo.region                                                AS region,
  device.language                                           AS language,
  traffic_source.source                                     AS first_source,
  traffic_source.medium                                     AS first_medium,
  COUNT(DISTINCT user_pseudo_id)                            AS users,
  COUNT(DISTINCT IF(event_name = 'purchase', user_pseudo_id, NULL))    AS purchasers,
  ROUND(
    SAFE_DIVIDE(
      COUNT(DISTINCT IF(event_name = 'purchase', user_pseudo_id, NULL)),
      COUNT(DISTINCT user_pseudo_id)
    ) * 100, 2
  )                                                         AS cvr_pct,
  ROUND(
    SUM(IF(event_name = 'purchase', ecommerce.purchase_revenue, 0)), 0
  )                                                         AS revenue
FROM `beeliber.analytics_379859002.events_*`
WHERE _TABLE_SUFFIX BETWEEN @start_date AND @end_date
GROUP BY 1, 2, 3, 4, 5
ORDER BY revenue DESC
LIMIT 100;
