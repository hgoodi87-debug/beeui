// Supabase Edge Function: branch-payout-calculator
// W-12: 지점별 정산 금액 계산 — 인간 확인 후 지급 확정 처리
//
// POST { period_start, period_end, branch_id?, create_payout? }
//   create_payout=true  → branch_payouts 레코드 생성 + booking_details.payout_id 연결
//   create_payout=false → 계산 결과만 반환 (기본값)

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { authenticateAdminRequest, isUuid, normalizeText } from "../_shared/admin-auth.ts";

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

const DATE_ONLY_RE = /^\d{4}-\d{2}-\d{2}$/;

function isValidDateOnly(value: string): boolean {
  if (!DATE_ONLY_RE.test(value)) return false;
  const parsed = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
}

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS, "Content-Type": "application/json" },
  });
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: CORS });
  if (req.method !== "POST") {
    return jsonResponse({ error: "Method not allowed" }, 405);
  }

  // ── 인증 검증 (어드민만 허용) ─────────────────────────────────
  let auth;
  try {
    auth = await authenticateAdminRequest(req);
  } catch (_err) {
    return jsonResponse({ error: "Unauthorized" }, 401);
  }

  // ── 파라미터 파싱 ────────────────────────────────────────────
  const body = await req.json().catch(() => ({}));
  const period_start = normalizeText(body?.period_start);
  const period_end = normalizeText(body?.period_end);
  const branch_id = normalizeText(body?.branch_id) || null;
  const create_payout = body?.create_payout === true;
  const actorName = normalizeText(auth.adminContext.name || auth.adminContext.email) || "admin";

  // create_payout=true 는 재무/본사/슈퍼어드민만 허용
  if (create_payout) {
    const role = auth.adminContext.role as string | undefined;
    const ALLOWED_ROLES = ["finance", "finance_staff", "hq_admin", "super_admin", "super"];
    if (!role || !ALLOWED_ROLES.includes(role)) {
      return jsonResponse({ error: "Forbidden — 재무/본사 관리자만 지급 확정 가능합니다." }, 403);
    }
  }

  if (!period_start || !period_end) {
    return jsonResponse({ error: "period_start, period_end 필수" }, 400);
  }
  if (!isValidDateOnly(period_start) || !isValidDateOnly(period_end)) {
    return jsonResponse({ error: "period_start, period_end는 YYYY-MM-DD 형식이어야 합니다." }, 400);
  }
  if (period_start > period_end) {
    return jsonResponse({ error: "period_start는 period_end보다 늦을 수 없습니다." }, 400);
  }
  if (branch_id && !isUuid(branch_id)) {
    return jsonResponse({ error: "branch_id 형식 오류" }, 400);
  }
  if (body?.create_payout != null && typeof body.create_payout !== "boolean") {
    return jsonResponse({ error: "create_payout은 boolean이어야 합니다." }, 400);
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
    console.error("[branch-payout-calculator] 예약 조회 오류:", fetchErr);
    return jsonResponse({ error: "지급 대상 예약 조회에 실패했습니다." }, 500);
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
  const payoutErrors: Array<{ branch_id: string | null; step: "insert" | "update" | "rollback" }> = [];

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
          paid_by: actorName,
        })
        .select("id")
        .single();

      if (payoutErr || !payout) {
        console.error("[branch-payout-calculator] payout 생성 오류:", payoutErr);
        payoutErrors.push({ branch_id: row.branch_id, step: "insert" });
        continue;
      }

      // booking_details.payout_id + settlement_status 업데이트
      const { error: updateErr } = await supabase
        .from("booking_details")
        .update({ payout_id: payout.id, settlement_status: "PAID_OUT" })
        .in("id", row.booking_ids);

      if (updateErr) {
        console.error("[branch-payout-calculator] 예약 지급 연결 오류:", updateErr);
        payoutErrors.push({ branch_id: row.branch_id, step: "update" });

        const { error: rollbackErr } = await supabase
          .from("branch_payouts")
          .delete()
          .eq("id", payout.id);
        if (rollbackErr) {
          console.error("[branch-payout-calculator] payout 롤백 오류:", rollbackErr);
          payoutErrors.push({ branch_id: row.branch_id, step: "rollback" });
        }
        continue;
      }

      payoutRecords.push({ branch_id: row.branch_id, payout_id: payout.id });
    }
  }

  if (payoutErrors.length > 0) {
    return jsonResponse({
      error: "일부 지점 지급 확정에 실패했습니다.",
      failures: payoutErrors,
      payout_records: payoutRecords,
    }, 500);
  }

  return jsonResponse(
    {
      period_start,
      period_end,
      total_bookings: (bookings ?? []).length,
      total_payout: results.reduce((s, r) => s + r.total_amount, 0),
      branches: results,
      payout_created: payoutRecords.length > 0,
      payout_records: payoutRecords,
    },
  );
});
