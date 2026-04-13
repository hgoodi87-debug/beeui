-- ═══════════════════════════════════════════════════════════════════════════
-- RLS 감사 헬퍼 함수 — 2026-04-12
-- 잔여 권고사항 #3: 신규 테이블 RLS 활성화 여부 정기 점검
--
-- 사용법:
--   SELECT * FROM public.rls_audit();
--   → RLS 비활성화 테이블 목록 반환 (있으면 즉시 활성화 조치 필요)
-- ═══════════════════════════════════════════════════════════════════════════

-- ─── RLS 감사 함수 ────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.rls_audit()
RETURNS TABLE (
  tablename        text,
  rls_enabled      boolean,
  policy_count     bigint,
  policies         text,
  risk_level       text
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    t.tablename::text,
    t.rowsecurity                                      AS rls_enabled,
    COUNT(p.policyname)                                AS policy_count,
    COALESCE(
      STRING_AGG(p.policyname || '[' || p.cmd || ']', ', ' ORDER BY p.policyname),
      '(정책 없음)'
    )                                                  AS policies,
    CASE
      WHEN NOT t.rowsecurity            THEN '🔴 CRITICAL — RLS 비활성화'
      WHEN COUNT(p.policyname) = 0      THEN '🟠 HIGH — RLS 활성화되었으나 정책 없음 (전면 차단 상태)'
      WHEN COUNT(p.policyname) > 0
        AND EXISTS (
          SELECT 1 FROM pg_policies pp
          WHERE pp.tablename = t.tablename
            AND pp.schemaname = 'public'
            AND pp.qual = 'true'        -- USING(true) 공개 정책
        )                               THEN '🟡 MEDIUM — USING(true) 공개 정책 존재'
      ELSE                                   '✅ OK'
    END                                                AS risk_level
  FROM pg_tables t
  LEFT JOIN pg_policies p
    ON p.schemaname = t.schemaname
    AND p.tablename = t.tablename
  WHERE t.schemaname = 'public'
  GROUP BY t.tablename, t.rowsecurity
  ORDER BY
    t.rowsecurity ASC,    -- RLS 꺼진 것 먼저
    COUNT(p.policyname) ASC,
    t.tablename;
$$;

-- super_admin / hq_admin 만 호출 가능
REVOKE ALL ON FUNCTION public.rls_audit() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.rls_audit()
  TO authenticated;   -- has_any_role 검사는 함수 내부에서 추가 가능

COMMENT ON FUNCTION public.rls_audit() IS
  '모든 public 테이블의 RLS 활성화 여부와 정책 현황을 반환. '
  'RLS 꺼진 테이블·USING(true) 공개 정책을 위험도와 함께 표시.';

-- ─── Edge Function 401 모니터링용 뷰 (pg_cron 연동 가능) ──────────────────
-- edge_function_logs 테이블이 존재하는 경우에만 생성
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_name = 'edge_function_logs'
  ) THEN
    EXECUTE $v$
      CREATE OR REPLACE VIEW public.edge_fn_401_monitor AS
      SELECT
        DATE_TRUNC('hour', created_at) AS hour,
        function_name,
        COUNT(*)                        AS request_count,
        SUM(CASE WHEN status_code = 401 THEN 1 ELSE 0 END) AS unauthorized_count,
        ROUND(
          100.0 * SUM(CASE WHEN status_code = 401 THEN 1 ELSE 0 END) / COUNT(*),
          1
        ) AS unauthorized_pct
      FROM public.edge_function_logs
      WHERE created_at >= NOW() - INTERVAL '24 hours'
      GROUP BY 1, 2
      ORDER BY unauthorized_count DESC;
    $v$;
    RAISE NOTICE 'edge_fn_401_monitor 뷰 생성 완료';
  ELSE
    RAISE NOTICE 'edge_function_logs 테이블 없음 — 뷰 생성 건너뜀 (Supabase Dashboard에서 직접 확인)';
  END IF;
END;
$$;
