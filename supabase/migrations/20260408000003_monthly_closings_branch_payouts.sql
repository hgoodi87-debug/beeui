-- W-5: 월 마감 이력 테이블
-- W-7: 지점 지급 확정 테이블

-- ── monthly_closings: 월별 정산 마감 이력 ──────────────────────────
CREATE TABLE IF NOT EXISTS public.monthly_closings (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  month                DATE NOT NULL,                          -- 월 기준일 (예: 2026-04-01)
  total_revenue        INTEGER NOT NULL DEFAULT 0,            -- 월 총 매출
  confirmed_amount     INTEGER NOT NULL DEFAULT 0,            -- 정산 확정액
  unconfirmed_amount   INTEGER NOT NULL DEFAULT 0,            -- 미정산액
  partner_payout_total INTEGER NOT NULL DEFAULT 0,            -- 지점 합계 지급액
  net_profit           INTEGER NOT NULL DEFAULT 0,            -- 본사 순수익
  booking_count        INTEGER NOT NULL DEFAULT 0,            -- 확정 예약 수
  is_closed            BOOLEAN NOT NULL DEFAULT FALSE,
  closed_at            TIMESTAMPTZ,
  closed_by            TEXT,
  notes                TEXT,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (month)
);

COMMENT ON TABLE public.monthly_closings IS '월별 정산 마감 이력. 마감 시 스냅샷 저장.';

-- ── branch_payouts: 지점 지급 확정 이력 ──────────────────────────────
CREATE TABLE IF NOT EXISTS public.branch_payouts (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  branch_id        UUID REFERENCES public.branches(id) ON DELETE SET NULL,
  branch_name      TEXT,                                       -- 지점명 스냅샷
  period_start     DATE NOT NULL,
  period_end       DATE NOT NULL,
  total_amount     INTEGER NOT NULL DEFAULT 0,                 -- 지급 총액 (원)
  booking_count    INTEGER NOT NULL DEFAULT 0,                 -- 대상 예약 수
  payment_method   TEXT DEFAULT 'bank_transfer',               -- 'bank_transfer' | 'cash'
  bank_account     TEXT,
  paid_at          TIMESTAMPTZ,
  paid_by          TEXT,
  notes            TEXT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT chk_payout_method CHECK (payment_method IN ('bank_transfer', 'cash', 'other'))
);

COMMENT ON TABLE public.branch_payouts IS '지점별 정산 지급 확정 이력';

-- ── booking_details: settlement_status PAID_OUT 상태 연결 컬럼 ───────
ALTER TABLE public.booking_details
  ADD COLUMN IF NOT EXISTS payout_id UUID REFERENCES public.branch_payouts(id) ON DELETE SET NULL;

COMMENT ON COLUMN public.booking_details.payout_id IS '지급 확정된 branch_payouts.id';

-- RLS: 인증된 사용자만 접근
ALTER TABLE public.monthly_closings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.branch_payouts   ENABLE ROW LEVEL SECURITY;

CREATE POLICY "authenticated read monthly_closings"
  ON public.monthly_closings FOR SELECT
  TO authenticated USING (true);

CREATE POLICY "authenticated write monthly_closings"
  ON public.monthly_closings FOR ALL
  TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "authenticated read branch_payouts"
  ON public.branch_payouts FOR SELECT
  TO authenticated USING (true);

CREATE POLICY "authenticated write branch_payouts"
  ON public.branch_payouts FOR ALL
  TO authenticated USING (true) WITH CHECK (true);
