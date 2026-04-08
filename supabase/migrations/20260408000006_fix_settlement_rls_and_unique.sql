-- W-FIX-1: branch_payouts / monthly_closings RLS 강화
-- W-FIX-2: branch_payouts 중복 지급 방지 UNIQUE 제약
--
-- 문제:
--   1) 기존 RLS는 TO authenticated — 일반 고객도 정산 데이터 쓰기 가능
--   2) branch_payouts에 (branch_id, period_start, period_end) UNIQUE 없음
--      → 동일 기간 중복 호출 시 duplicate payout 생성 가능
--   3) 단순 UNIQUE 제약은 branch_id IS NULL인 미분류 지급 중복을 막지 못함

-- ── 1. branch_payouts RLS 재구성 ─────────────────────────────────────

-- 기존 정책 제거
DROP POLICY IF EXISTS "authenticated read branch_payouts"  ON public.branch_payouts;
DROP POLICY IF EXISTS "authenticated write branch_payouts" ON public.branch_payouts;
DROP POLICY IF EXISTS "admin read branch_payouts"          ON public.branch_payouts;
DROP POLICY IF EXISTS "finance write branch_payouts"      ON public.branch_payouts;
DROP POLICY IF EXISTS "service_role write branch_payouts" ON public.branch_payouts;

-- 읽기: 본사/재무는 전체, 지점 담당자는 자신의 지점만
CREATE POLICY "admin read branch_payouts"
  ON public.branch_payouts FOR SELECT
  TO authenticated
  USING (
    public.has_any_role(array['super_admin', 'hq_admin', 'finance_staff'])
    OR public.has_branch_access(branch_id)
  );

-- 쓰기: 본사/재무 관리자만. service_role Edge Function은 RLS 우회 권한을 사용.
CREATE POLICY "finance write branch_payouts"
  ON public.branch_payouts FOR ALL
  TO authenticated
  USING (public.has_any_role(array['super_admin', 'hq_admin', 'finance_staff']))
  WITH CHECK (public.has_any_role(array['super_admin', 'hq_admin', 'finance_staff']));

-- ── 2. monthly_closings RLS 재구성 ───────────────────────────────────

DROP POLICY IF EXISTS "authenticated read monthly_closings"  ON public.monthly_closings;
DROP POLICY IF EXISTS "authenticated write monthly_closings" ON public.monthly_closings;
DROP POLICY IF EXISTS "finance read monthly_closings"        ON public.monthly_closings;
DROP POLICY IF EXISTS "finance write monthly_closings"       ON public.monthly_closings;
DROP POLICY IF EXISTS "service_role write monthly_closings"  ON public.monthly_closings;

CREATE POLICY "finance read monthly_closings"
  ON public.monthly_closings FOR SELECT
  TO authenticated
  USING (public.has_any_role(array['super_admin', 'hq_admin', 'finance_staff']));

CREATE POLICY "finance write monthly_closings"
  ON public.monthly_closings FOR ALL
  TO authenticated
  USING (public.has_any_role(array['super_admin', 'hq_admin', 'finance_staff']))
  WITH CHECK (public.has_any_role(array['super_admin', 'hq_admin', 'finance_staff']));

-- ── 3. branch_payouts 중복 지급 방지 UNIQUE 제약 ─────────────────────

ALTER TABLE public.branch_payouts
  DROP CONSTRAINT IF EXISTS uq_branch_payout_period;

-- 같은 지점, 같은 정산 기간에 중복 지급 레코드 방지
CREATE UNIQUE INDEX IF NOT EXISTS uq_branch_payout_period_branch
  ON public.branch_payouts (branch_id, period_start, period_end)
  WHERE branch_id IS NOT NULL;

-- branch_id가 NULL인 미분류 지급도 기간별 하나만 허용
CREATE UNIQUE INDEX IF NOT EXISTS uq_branch_payout_period_unassigned
  ON public.branch_payouts (period_start, period_end)
  WHERE branch_id IS NULL;

COMMENT ON INDEX public.uq_branch_payout_period_branch IS
  '같은 지점·기간에 중복 지급 레코드 방지. branch-payout-calculator 중복 실행 안전망.';

COMMENT ON INDEX public.uq_branch_payout_period_unassigned IS
  '미분류 branch_id NULL 지급의 기간별 중복 레코드 방지.';
