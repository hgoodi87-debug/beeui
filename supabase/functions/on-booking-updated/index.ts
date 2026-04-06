// Supabase Edge Function: on-booking-updated
// Database Webhook → booking_details UPDATE 트리거
// 하는 일: 도착 알림 이메일 + 정산 금액 계산

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

import {
  buildArrivalEmailHtml,
  type ArrivalEmailTemplateInput,
} from "../_shared/booking-email-templates.ts";
import { sendEdgeMail } from "../_shared/mailer.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

const getLocationDetails = async (locationId: string | null | undefined) => {
  const lookupValue = String(locationId || "").trim();
  if (!lookupValue || lookupValue === "custom") {
    return null;
  }

  const { data } = await supabase
    .from("locations")
    .select("id, short_code, name, name_en, pickup_guide, pickup_image_url, lat, lng")
    .or(`id.eq.${lookupValue},short_code.eq.${lookupValue}`)
    .limit(1)
    .maybeSingle();

  return data || null;
};

// 도착 알림 이메일
async function sendArrivalEmail(booking: Record<string, unknown>) {
  const email = booking.user_email as string;
  if (!email) {
    return { attempted: false, skipped: true, reason: "missing_email" };
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
    const destination = await getLocationDetails(
      String(booking.dropoff_location_id || booking.dropoff_location || ""),
    );
    const destinationLabel =
      String(destination?.name || destination?.name_en || booking.dropoff_location || booking.pickup_location || "");
    const mapUrl =
      destination?.lat && destination?.lng
        ? `https://www.google.com/maps/search/?api=1&query=${destination.lat},${destination.lng}`
        : "https://bee-liber.com/locations";

    const emailInput: ArrivalEmailTemplateInput = {
      bookingId: String(booking.id || code || ""),
      reservationCode: String(code || ""),
      destinationLabel,
      arrivalDate: String(booking.dropoff_date || booking.return_date || ""),
      arrivalTime: String(booking.delivery_time || booking.return_time || ""),
      pickupGuide: String(destination?.pickup_guide || ""),
      pickupImageUrl: String(destination?.pickup_image_url || ""),
      mapUrl,
    };

    await sendEdgeMail({
      to: email,
      bcc: "bee@bee-liber.com",
      subject,
      html: buildArrivalEmailHtml(emailInput) || body,
    });

    console.log(`[on-booking-updated] Arrival email sent to ${email}`);
    return {
      attempted: true,
      skipped: false,
      ok: true,
      smtpConfigured: true,
    };
  } catch (e) {
    console.error("[on-booking-updated] Arrival email failed:", e);
    return {
      attempted: true,
      skipped: false,
      ok: false,
      error: String(e),
      smtpConfigured: Boolean(Deno.env.get("SMTP_PASS")),
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
