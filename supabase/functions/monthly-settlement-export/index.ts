// Supabase Edge Function: monthly-settlement-export
// W-15: 월별 정산 데이터 CSV 다운로드
//
// GET /functions/v1/monthly-settlement-export?year=2026&month=4&branch_id=xxx
// Authorization: Bearer <admin_token>
//
// 응답: text/csv (월별 정산 전체 예약 목록)

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { authenticateAdminRequest } from "../_shared/admin-auth.ts";
import { calcMonthlyVat } from "../_shared/vat.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
};

/** CSV 셀 이스케이프 */
function esc(value: unknown): string {
  const str = value == null ? "" : String(value);
  if (str.includes(",") || str.includes('"') || str.includes("\n")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

/** 배열 → CSV 행 */
function csvRow(cols: unknown[]): string {
  return cols.map(esc).join(",");
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: CORS });

  // ── 인증 ──────────────────────────────────────────────────────
  try {
    await authenticateAdminRequest(req);
  } catch (_err) {
    return new Response("Unauthorized", { status: 401, headers: CORS });
  }

  // ── 파라미터 파싱 ─────────────────────────────────────────────
  const url = new URL(req.url);
  const yearParam  = url.searchParams.get("year");
  const monthParam = url.searchParams.get("month");
  const branchId   = url.searchParams.get("branch_id") || null;
  const mode       = url.searchParams.get("mode") || "bookings"; // bookings | summary

  if (!yearParam || !monthParam) {
    return new Response("year, month 쿼리 파라미터 필수", { status: 400, headers: CORS });
  }

  const year  = parseInt(yearParam);
  const month = parseInt(monthParam);
  if (isNaN(year) || isNaN(month) || month < 1 || month > 12) {
    return new Response("year/month 형식 오류", { status: 400, headers: CORS });
  }

  const startDate = `${year}-${String(month).padStart(2, "0")}-01`;
  const endDate   = new Date(year, month, 0).toISOString().split("T")[0]; // 말일

  // ── mode=summary: 월별 요약 뷰 ───────────────────────────────
  if (mode === "summary") {
    let summaryQ = supabase
      .from("admin_revenue_monthly_v1")
      .select("*")
      .eq("month", startDate);
    if (branchId) summaryQ = summaryQ.eq("branch_id", branchId);

    const { data: summaryRows, error: summaryErr } = await summaryQ;
    if (summaryErr) {
      return new Response(summaryErr.message, { status: 500, headers: CORS });
    }

    const headers = [
      "월", "지점명", "예약수", "활성예약", "배송", "보관",
      "총매출(원)", "정산확정(원)", "미정산(원)", "지점지급(원)",
      "VAT과세표준(원)", "VAT액(원)", "현금매출(원)", "카드매출(원)",
      "취소건수", "취소액(원)", "환불건수", "환불액(원)",
    ];

    const rows = (summaryRows ?? []).map((r) => {
      const vat = calcMonthlyVat({
        totalRevenue: Number(r.total_revenue || 0),
        cancelledTotal: Number(r.cancelled_total || 0),
        refundedTotal: Number(r.refunded_total || 0),
      });
      return csvRow([
        r.month, r.branch_name || "전체",
        r.booking_count, r.active_booking_count, r.delivery_count, r.storage_count,
        r.total_revenue, r.confirmed_amount, r.unconfirmed_amount, r.partner_payout_total,
        vat.supplyPrice, vat.vatAmount,
        r.cash_revenue, r.card_revenue,
        r.cancelled_count, r.cancelled_total,
        r.refunded_count, r.refunded_total,
      ]);
    });

    const csv = [csvRow(headers), ...rows].join("\r\n");
    const filename = `beeliber_settlement_summary_${yearParam}${String(month).padStart(2, "0")}.csv`;

    return new Response("\uFEFF" + csv, {  // BOM for Excel
      headers: {
        ...CORS,
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  }

  // ── mode=bookings (기본): 개별 예약 목록 ─────────────────────
  let query = supabase
    .from("admin_booking_list_v1")
    .select([
      "reservation_code", "pickup_date", "branch_name", "service_type",
      "user_name", "user_email", "sns_channel", "bags",
      "final_price", "insurance_fee", "credit_used",
      "discount_amount", "payment_method", "payment_status",
      "branch_settlement_amount", "settlement_status", "settled_at", "settled_by",
      "payout_id", "status", "is_deleted",
    ].join(","))
    .gte("pickup_date", startDate)
    .lte("pickup_date", endDate)
    .eq("is_deleted", false)
    .order("pickup_date", { ascending: true });

  if (branchId) query = query.eq("branch_id", branchId);

  const { data: bookings, error: bookingErr } = await query;
  if (bookingErr) {
    return new Response(bookingErr.message, { status: 500, headers: CORS });
  }

  const headers = [
    "예약코드", "픽업일", "지점명", "서비스유형",
    "고객명", "이메일", "SNS채널", "짐수",
    "최종금액(원)", "보험료(원)", "크레딧사용(원)",
    "할인금액(원)", "결제방법", "결제상태",
    "지점정산금(원)", "정산상태", "정산확정일", "정산담당자",
    "지급ID", "예약상태",
  ];

  const rows = (bookings ?? []).map((b) =>
    csvRow([
      b.reservation_code, b.pickup_date, b.branch_name, b.service_type,
      b.user_name, b.user_email, b.sns_channel, b.bags,
      b.final_price, b.insurance_fee, b.credit_used,
      b.discount_amount, b.payment_method, b.payment_status,
      b.branch_settlement_amount, b.settlement_status,
      b.settled_at ? b.settled_at.substring(0, 10) : "",
      b.settled_by || "",
      b.payout_id || "", b.status,
    ])
  );

  const csv = [csvRow(headers), ...rows].join("\r\n");
  const filename = `beeliber_settlement_${yearParam}${String(month).padStart(2, "0")}.csv`;

  return new Response("\uFEFF" + csv, {
    headers: {
      ...CORS,
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
});
