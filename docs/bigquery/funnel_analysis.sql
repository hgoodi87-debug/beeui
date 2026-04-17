-- ─────────────────────────────────────────────────────────────────────────────
-- 전환 퍼널 이탈 분석 (6단계)
-- 사전 조건: GA4 BigQuery 연동 완료
-- 파라미터: @start_date, @end_date (YYYYMMDD 형식)
-- ─────────────────────────────────────────────────────────────────────────────

WITH funnel AS (
  SELECT
    user_pseudo_id,
    MAX(IF(event_name = 'page_view',        1, 0)) AS s1_page_view,
    MAX(IF(event_name = 'view_item',        1, 0)) AS s2_view_service,
    MAX(IF(event_name = 'add_to_cart',      1, 0)) AS s3_add_to_cart,
    MAX(IF(event_name = 'begin_checkout',   1, 0)) AS s4_begin_checkout,
    MAX(IF(event_name = 'add_payment_info', 1, 0)) AS s5_add_payment,
    MAX(IF(event_name = 'purchase',         1, 0)) AS s6_purchase
  FROM `beeliber.analytics_379859002.events_*`
  WHERE _TABLE_SUFFIX BETWEEN @start_date AND @end_date
  GROUP BY user_pseudo_id
)
SELECT
  SUM(s1_page_view)      AS step1_page_view,
  SUM(s2_view_service)   AS step2_view_service,
  SUM(s3_add_to_cart)    AS step3_add_to_cart,
  SUM(s4_begin_checkout) AS step4_begin_checkout,
  SUM(s5_add_payment)    AS step5_add_payment,
  SUM(s6_purchase)       AS step6_purchase,

  -- 단계별 전환율
  ROUND(SAFE_DIVIDE(SUM(s2_view_service),   SUM(s1_page_view))      * 100, 2) AS s1_to_s2_pct,
  ROUND(SAFE_DIVIDE(SUM(s3_add_to_cart),    SUM(s2_view_service))   * 100, 2) AS s2_to_s3_pct,
  ROUND(SAFE_DIVIDE(SUM(s4_begin_checkout), SUM(s3_add_to_cart))    * 100, 2) AS s3_to_s4_pct,
  ROUND(SAFE_DIVIDE(SUM(s5_add_payment),    SUM(s4_begin_checkout)) * 100, 2) AS s4_to_s5_pct,
  ROUND(SAFE_DIVIDE(SUM(s6_purchase),       SUM(s5_add_payment))    * 100, 2) AS s5_to_s6_pct,

  -- 전체 전환율 (방문 → 구매)
  ROUND(SAFE_DIVIDE(SUM(s6_purchase), SUM(s1_page_view)) * 100, 2)           AS overall_cvr_pct
FROM funnel;
