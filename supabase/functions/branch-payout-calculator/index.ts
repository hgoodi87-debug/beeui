// Supabase Edge Function: branch-payout-calculator
// W-12: 지점별 정산 금액 계산 — 인간 확인 후 지급 확정 처리
//
// POST { period_start, period_end, branch_id?, create_payout? }
//   create_payout=true  → branch_payouts 레코드 생성 + booking_details.payout_id 연결
//   create_payout=false → 계산 결과만 반환 (기본값)

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { authenticateAdminRequest } from "../_shared/admin-auth.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

interface PayoutCalcRow {
  branch_id: string | null;
  branch_name: string | null;
  booking_count: number;
  total_amount: number;
  booking_ids: string[];
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: CORS });

  // ── 인증 검증 (어드민만 허용) ─────────────────────────────────
  try {
    await authenticateAdminRequest(req);
  } catch (_err) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { ...CORS, "Content-Type": "application/json" },
    });
  }

  // ── 파라미터 파싱 ────────────────────────────────────────────
  const body = await req.json().catch(() => ({}));
  const { period_start, period_end, branch_id, create_payout = false, paid_by } = body;

  if (!period_start || !period_end) {
    return new Response(
      JSON.stringify({ error: "period_start, period_end 필수" }),
      { status: 400, headers: { ...CORS, "Content-Type": "application/json" } },
    );
  }

  // ── CONFIRMED + payout_id 없는 예약 조회 ─────────────────────
  let query = supabase
    .from("admin_booking_list_v1")
    .select("id, reservation_id, branch_id, branch_name, branch_settlement_amount, pickup_date")
    .eq("settlement_status", "CONFIRMED")
    .is("payout_id", null)
    .gte("pickup_date", period_start)
    .lte("pickup_date", period_end)
    .eq("is_deleted", false);

  if (branch_id) {
    query = query.eq("branch_id", branch_id);
  }

  const { data: bookings, error: fetchErr } = await query;

  if (fetchErr) {
    return new Response(JSON.stringify({ error: fetchErr.message }), {
      status: 500,
      headers: { ...CORS, "Content-Type": "application/json" },
    });
  }

  // ── 지점별 집계 ────────────────────────────────────────────────
  const byBranch = new Map<string, PayoutCalcRow>();

  for (const b of bookings ?? []) {
    const key = b.branch_id ?? "__none__";
    if (!byBranch.has(key)) {
      byBranch.set(key, {
        branch_id: b.branch_id,
        branch_name: b.branch_name || "미분류",
        booking_count: 0,
        total_amount: 0,
        booking_ids: [],
      });
    }
    const row = byBranch.get(key)!;
    row.booking_count++;
    row.total_amount += Number(b.branch_settlement_amount || 0);
    row.booking_ids.push(b.id as string);
  }

  const results = Array.from(byBranch.values());

  // ── create_payout=true → branch_payouts 레코드 생성 ──────────
  const payoutRecords: Array<{ branch_id: string | null; payout_id: string }> = [];

  if (create_payout && results.length > 0) {
    for (const row of results) {
      if (row.booking_count === 0) continue;

      // branch_payouts 레코드 삽입
      const { data: payout, error: payoutErr } = await supabase
        .from("branch_payouts")
        .insert({
          branch_id: row.branch_id,
          branch_name: row.branch_name,
          period_start,
          period_end,
          total_amount: Math.round(row.total_amount),
          booking_count: row.booking_count,
          payment_method: "bank_transfer",
          paid_at: new Date().toISOString(),
          paid_by: paid_by || "admin",
        })
        .select("id")
        .single();

      if (payoutErr || !payout) {
        console.error("[branch-payout-calculator] payout 생성 오류:", payoutErr);
        continue;
      }

      // booking_details.payout_id + settlement_status 업데이트
      await supabase
        .from("booking_details")
        .update({ payout_id: payout.id, settlement_status: "PAID_OUT" })
        .in("id", row.booking_ids);

      payoutRecords.push({ branch_id: row.branch_id, payout_id: payout.id });
    }
  }

  return new Response(
    JSON.stringify({
      period_start,
      period_end,
      total_bookings: (bookings ?? []).length,
      total_payout: results.reduce((s, r) => s + r.total_amount, 0),
      branches: results,
      payout_created: create_payout,
      payout_records: payoutRecords,
    }),
    { headers: { ...CORS, "Content-Type": "application/json" } },
  );
});
