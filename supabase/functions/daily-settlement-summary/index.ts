// Supabase Edge Function: daily-settlement-summary
// W-11: 매일 02:00 KST (17:00 UTC) 자동 실행 — 전일 매출 집계 + Google Chat 알림
//
// 호출 방법:
//   1) pg_cron (20260408000005_cron_daily_settlement.sql 마이그레이션으로 자동 설정)
//   2) 수동: POST /functions/v1/daily-settlement-summary  { "date": "2026-04-07" }

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { calcMonthlyVat } from "../_shared/vat.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const GOOGLE_CHAT_WEBHOOK_URL = Deno.env.get("GOOGLE_CHAT_WEBHOOK_URL") || "";
// pg_cron 호출 또는 수동 호출 시 공유 시크릿으로 인증
// Supabase Dashboard → Project Settings → Secrets 에서 CRON_SECRET 등록
const CRON_SECRET = Deno.env.get("CRON_SECRET") || "";

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-cron-secret",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const JSON_HEADERS = { ...CORS, "Content-Type": "application/json" };
const DATE_ONLY_RE = /^\d{4}-\d{2}-\d{2}$/;

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: JSON_HEADERS });
}

/** KST 기준 어제 날짜 (YYYY-MM-DD) */
function getYesterdayKST(): string {
  const kstNow = new Date(Date.now() + 9 * 3600 * 1000);
  kstNow.setUTCDate(kstNow.getUTCDate() - 1);
  return kstNow.toISOString().split("T")[0];
}

/** 금액 → 원화 포맷 */
function krw(amount: number): string {
  return `₩${Math.round(amount).toLocaleString("ko-KR")}`;
}

function parseBearer(req: Request): string {
  return (req.headers.get("authorization") || "").replace(/^Bearer\s+/i, "").trim();
}

function isAuthorizedRequest(req: Request): boolean {
  const cronHeader = req.headers.get("x-cron-secret") || "";
  const bearerToken = parseBearer(req);

  // CRON_SECRET 전용 — service_role key를 Bearer로 수락하지 않음 (키 유출 시 남용 방지)
  return Boolean(CRON_SECRET) && (cronHeader === CRON_SECRET || bearerToken === CRON_SECRET);
}

function isValidDateOnly(value: string): boolean {
  if (!DATE_ONLY_RE.test(value)) return false;
  const parsed = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
}

serve(async (req) => {
  // CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: CORS });
  }

  if (req.method !== "POST") {
    return jsonResponse({ error: "Method not allowed" }, 405);
  }

  // ── 인증: CRON_SECRET 또는 service_role Bearer ─────────────────────
  if (!isAuthorizedRequest(req)) {
    return jsonResponse({ error: "Unauthorized" }, 401);
  }

  // 날짜 결정: body.date → 어제 KST 순서
  let targetDate = getYesterdayKST();
  const body = await req.json().catch(() => ({}));
  if (body?.date != null) {
    if (typeof body.date !== "string" || !isValidDateOnly(body.date)) {
      return jsonResponse({ error: "date는 YYYY-MM-DD 형식이어야 합니다." }, 400);
    }
    targetDate = body.date;
  }

  // ── 전일 매출 집계 조회 ──────────────────────────────────────────
  const { data: rows, error } = await supabase
    .from("admin_revenue_daily_v1")
    .select("*")
    .eq("date", targetDate);

  if (error) {
    console.error("[daily-settlement-summary] 조회 오류:", error);
    return jsonResponse({ error: "정산 요약 조회에 실패했습니다." }, 500);
  }

  // ── 지점별 + 전체 합산 ─────────────────────────────────────────
  type Summary = {
    booking_count: number;
    active_booking_count: number;
    delivery_count: number;
    storage_count: number;
    bag_count: number;
    total_revenue: number;
    confirmed_amount: number;
    unconfirmed_amount: number;
    partner_payout_total: number;
    cancelled_count: number;
    refunded_count: number;
    cancelled_total: number;
    refunded_total: number;
    cash_revenue: number;
    card_revenue: number;
  };

  const ZERO: Summary = {
    booking_count: 0, active_booking_count: 0, delivery_count: 0, storage_count: 0,
    bag_count: 0, total_revenue: 0, confirmed_amount: 0, unconfirmed_amount: 0,
    partner_payout_total: 0, cancelled_count: 0, refunded_count: 0,
    cancelled_total: 0, refunded_total: 0, cash_revenue: 0, card_revenue: 0,
  };

  const totals: Summary = (rows ?? []).reduce<Summary>((acc, r) => ({
    booking_count:        acc.booking_count        + (r.booking_count        || 0),
    active_booking_count: acc.active_booking_count + (r.active_booking_count || 0),
    delivery_count:       acc.delivery_count       + (r.delivery_count       || 0),
    storage_count:        acc.storage_count        + (r.storage_count        || 0),
    bag_count:            acc.bag_count            + (r.bag_count            || 0),
    total_revenue:        acc.total_revenue        + Number(r.total_revenue        || 0),
    confirmed_amount:     acc.confirmed_amount     + Number(r.confirmed_amount     || 0),
    unconfirmed_amount:   acc.unconfirmed_amount   + Number(r.unconfirmed_amount   || 0),
    partner_payout_total: acc.partner_payout_total + Number(r.partner_payout_total || 0),
    cancelled_count:      acc.cancelled_count      + (r.cancelled_count      || 0),
    refunded_count:       acc.refunded_count       + (r.refunded_count       || 0),
    cancelled_total:      acc.cancelled_total      + Number(r.cancelled_total      || 0),
    refunded_total:       acc.refunded_total       + Number(r.refunded_total       || 0),
    cash_revenue:         acc.cash_revenue         + Number(r.cash_revenue         || 0),
    card_revenue:         acc.card_revenue         + Number(r.card_revenue         || 0),
  }), ZERO);

  // ── VAT 계산 ────────────────────────────────────────────────────
  const vat = calcMonthlyVat({
    totalRevenue: totals.total_revenue,
    cancelledTotal: totals.cancelled_total,
    refundedTotal: totals.refunded_total,
  });

  const netProfit = totals.total_revenue - totals.partner_payout_total;

  // ── Google Chat 알림 ─────────────────────────────────────────────
  if (GOOGLE_CHAT_WEBHOOK_URL) {
    const lines = [
      `🐝 *빌리버 일별 정산 요약 — ${targetDate}*`,
      ``,
      `📦 예약 ${totals.active_booking_count}건 | 배송 ${totals.delivery_count} / 보관 ${totals.storage_count} | 짐 ${totals.bag_count}개`,
      `💰 총매출: ${krw(totals.total_revenue)}`,
      `  ├ 정산확정: ${krw(totals.confirmed_amount)}`,
      `  ├ 미정산: ${krw(totals.unconfirmed_amount)}`,
      `  ├ 지점지급: ${krw(totals.partner_payout_total)}`,
      `  └ 본사순수익: ${krw(netProfit)}`,
      `🧾 부가세(VAT): ${krw(vat.vatAmount)} (과세표준 ${krw(vat.supplyPrice)})`,
      `💳 현금 ${krw(totals.cash_revenue)} / 카드 ${krw(totals.card_revenue)}`,
    ];
    if (totals.cancelled_count > 0 || totals.refunded_count > 0) {
      lines.push(`⚠️ 취소 ${totals.cancelled_count}건 (${krw(totals.cancelled_total)}) / 환불 ${totals.refunded_count}건 (${krw(totals.refunded_total)})`);
    }
    if (rows && rows.length > 1) {
      lines.push(``, `*지점별 상세*`);
      for (const r of rows) {
        if ((r.active_booking_count || 0) > 0) {
          lines.push(`  • ${r.branch_name || "미분류"}: ${r.active_booking_count}건 ${krw(Number(r.total_revenue || 0))}`);
        }
      }
    }

    await fetch(GOOGLE_CHAT_WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: lines.join("\n") }),
    }).catch((err) => console.error("[daily-settlement-summary] Google Chat 오류:", err));
  }

  // ── 응답 ────────────────────────────────────────────────────────
  return new Response(
    JSON.stringify({ date: targetDate, totals, vat, netProfit, branchRows: rows }),
    { headers: JSON_HEADERS },
  );
});
