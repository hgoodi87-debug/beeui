// Supabase Edge Function: on-booking-updated
// Database Webhook → booking_details UPDATE 트리거
// 하는 일: 도착 알림 이메일 + 정산 금액 계산

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const SMTP_USER = Deno.env.get("SMTP_USER") || "ceo@bee-liber.com";
const SMTP_PASS = Deno.env.get("SMTP_PASS") || "";
const INTERNAL_MAIL_KEY = Deno.env.get("INTERNAL_MAIL_KEY") || "";
const FIREBASE_ARRIVAL_MAIL_ENDPOINT =
  Deno.env.get("FIREBASE_ARRIVAL_MAIL_ENDPOINT")
  || "https://us-central1-beeliber-main.cloudfunctions.net/sendBookingArrivalEmail";
const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

// 도착 알림 이메일
async function sendArrivalEmail(booking: Record<string, unknown>) {
  const email = booking.user_email as string;
  if (!email) {
    return { attempted: false, skipped: true, reason: "missing_email" };
  }
  if (!SMTP_PASS) {
    return { attempted: false, skipped: true, reason: "missing_smtp_pass" };
  }
  if (!INTERNAL_MAIL_KEY) {
    return { attempted: false, skipped: true, reason: "missing_internal_mail_key" };
  }

  const code = booking.reservation_code || booking.id;
  const subject = `[Beeliber] 짐이 도착했습니다! | Your luggage has arrived - ${code}`;
  const body = `
    <h2>🐝 짐이 목적지에 도착했습니다!</h2>
    <p><strong>예약코드:</strong> ${code}</p>
    <p>지금 바로 수령하실 수 있습니다.</p>
    <br>
    <p>가벼운 여행 되세요! 🐝</p>
    <p>— beeliber · bee-liber.com</p>
  `;

  try {
    const response = await fetch(FIREBASE_ARRIVAL_MAIL_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-beeliber-mail-key": INTERNAL_MAIL_KEY,
      },
      body: JSON.stringify({
        booking: {
          ...booking,
          subject,
          html: body,
          smtp_user: SMTP_USER,
        },
      }),
    });
    const responseText = await response.text().catch(() => "");
    if (!response.ok) {
      console.error(
        `[on-booking-updated] Arrival email failed (${response.status}): ${responseText}`,
      );
      return {
        attempted: true,
        skipped: false,
        ok: false,
        status: response.status,
        body: responseText,
        smtpConfigured: Boolean(SMTP_PASS),
      };
    }
    console.log(`[on-booking-updated] Arrival email sent to ${email}`);
    return {
      attempted: true,
      skipped: false,
      ok: true,
      status: response.status,
      body: responseText,
      smtpConfigured: Boolean(SMTP_PASS),
    };
  } catch (e) {
    console.error("[on-booking-updated] Arrival email failed:", e);
    return {
      attempted: true,
      skipped: false,
      ok: false,
      error: String(e),
      smtpConfigured: Boolean(SMTP_PASS),
    };
  }
}

// 정산 금액 계산
async function calculateSettlement(record: Record<string, unknown>) {
  const commDelivery = Number(record.branch_commission_delivery || 0);
  const commStorage = Number(record.branch_commission_storage || 0);
  const finalPrice = Number(record.final_price || 0);
  const serviceType = record.service_type as string;

  const rate = serviceType === "DELIVERY" ? commDelivery : commStorage;
  let settlement = Math.round(finalPrice * (rate / 100));

  // 취소/환불이면 정산 0
  if (record.settlement_status === "cancelled" || record.settlement_status === "refunded") {
    settlement = 0;
  }

  if (Number(record.branch_settlement_amount) !== settlement) {
    await supabase
      .from("booking_details")
      .update({ branch_settlement_amount: settlement })
      .eq("id", record.id);
    console.log(`[on-booking-updated] Settlement updated: ₩${settlement}`);
  }
}

serve(async (req) => {
  try {
    if (req.method === "OPTIONS") {
      return new Response("ok", { headers: CORS_HEADERS });
    }

    const payload = await req.json();
    // Database Webhook payload: { type: "UPDATE", table: "booking_details", record: {...}, old_record: {...} }
    const record = payload.record;
    const oldRecord = payload.old_record;
    if (!record) {
      return new Response(JSON.stringify({ error: "No record" }), {
        status: 400,
        headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
      });
    }

    console.log(`[on-booking-updated] Processing update: ${record.reservation_code || record.id}`);

    // 1. 도착 알림 — reservation의 ops_status가 arrived_at_destination으로 변경됐을 때
    // (booking_details에서는 settlement_status 변경으로 감지)
    let emailResult: Record<string, unknown> | null = null;
    if (oldRecord?.settlement_status !== "arrived" && record.settlement_status === "arrived") {
      emailResult = await sendArrivalEmail(record);
    }

    // 2. 정산 금액 계산
    if (record.branch_commission_delivery || record.branch_commission_storage) {
      await calculateSettlement(record);
    }

    return new Response(JSON.stringify({ success: true, email: emailResult }), {
      headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("[on-booking-updated] Error:", e);
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500,
      headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
    });
  }
});
