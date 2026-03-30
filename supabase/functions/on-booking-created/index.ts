// Supabase Edge Function: on-booking-created
// Database Webhook → booking_details INSERT 트리거
// 하는 일: 예약코드 생성 + 바우처 이메일 + Google Chat 알림

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const SMTP_USER = Deno.env.get("SMTP_USER") || "ceo@bee-liber.com";
const SMTP_PASS = Deno.env.get("SMTP_PASS") || "";
const INTERNAL_MAIL_KEY = Deno.env.get("INTERNAL_MAIL_KEY") || "";
const GOOGLE_CHAT_WEBHOOK_URL = Deno.env.get("GOOGLE_CHAT_WEBHOOK_URL") || "";
const FIREBASE_VOUCHER_MAIL_ENDPOINT =
  Deno.env.get("FIREBASE_VOUCHER_MAIL_ENDPOINT")
  || "https://us-central1-beeliber-main.cloudfunctions.net/sendBookingVoucherEmail";
const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

// 예약코드 생성
function generateReservationCode(pickupCode: string, dropoffCode: string): string {
  const random = Math.floor(1000 + Math.random() * 9000);
  return `${pickupCode}-${dropoffCode}-${random}`;
}

// 위치 short_code 조회
async function getShortCode(locationId: string | null): Promise<string> {
  if (!locationId || locationId === "custom") return "ADDR";
  const { data } = await supabase
    .from("locations")
    .select("id, short_code, name")
    .or(`id.eq.${locationId},short_code.eq.${locationId}`)
    .limit(1)
    .single();
  return data?.short_code || locationId.substring(0, 3).toUpperCase();
}

async function getLocationLabel(locationId: string | null, fallbackValue: unknown): Promise<string> {
  const fallback = String(fallbackValue || "").trim();
  const lookupValue = String(locationId || fallbackValue || "").trim();

  if (!lookupValue || lookupValue === "custom") {
    return fallback || "주소 직접 입력";
  }

  const { data } = await supabase
    .from("locations")
    .select("id, short_code, name, name_en")
    .or(`id.eq.${lookupValue},short_code.eq.${lookupValue}`)
    .limit(1)
    .maybeSingle();

  return data?.name || data?.name_en || fallback || lookupValue;
}

// 바우처 이메일 발송 (Gmail SMTP via Deno)
async function sendVoucherEmail(booking: Record<string, unknown>) {
  const email = booking.user_email as string;
  if (!email) {
    console.warn("[on-booking-created] No user_email, skipping voucher");
    return { attempted: false, skipped: true, reason: "missing_email" };
  }
  if (!SMTP_PASS) {
    console.warn("[on-booking-created] SMTP_PASS missing, skipping voucher");
    return { attempted: false, skipped: true, reason: "missing_smtp_pass" };
  }
  if (!INTERNAL_MAIL_KEY) {
    console.warn("[on-booking-created] INTERNAL_MAIL_KEY missing, skipping voucher");
    return { attempted: false, skipped: true, reason: "missing_internal_mail_key" };
  }

  const reservationCode = booking.reservation_code || booking.id;
  const subject = `[Beeliber] 예약 확인 | Booking Confirmed - ${reservationCode}`;
  const pickupLabel = await getLocationLabel(
    booking.pickup_location_id as string | null,
    booking.pickup_location,
  );
  const dropoffLabel = booking.service_type === "DELIVERY"
    ? await getLocationLabel(booking.dropoff_location_id as string | null, booking.dropoff_location)
    : pickupLabel;
  const body = `
    <h2>🐝 Beeliber 예약이 확인되었습니다!</h2>
    <p><strong>예약코드:</strong> ${reservationCode}</p>
    <p><strong>서비스:</strong> ${booking.service_type === "DELIVERY" ? "배송" : "보관"}</p>
    <p><strong>픽업 지점:</strong> ${pickupLabel}</p>
    ${booking.service_type === "DELIVERY" ? `<p><strong>도착 지점:</strong> ${dropoffLabel}</p>` : ""}
    <p><strong>날짜:</strong> ${booking.pickup_date} ${booking.pickup_time}</p>
    <p><strong>금액:</strong> ₩${Number(booking.final_price || 0).toLocaleString()}</p>
    <br>
    <p>가벼운 여행 되세요! 🐝</p>
    <p>— beeliber · bee-liber.com</p>
  `;

  // Firebase mailer relay (Node + nodemailer)
  try {
    const response = await fetch(FIREBASE_VOUCHER_MAIL_ENDPOINT, {
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
          pickup_label: pickupLabel,
          dropoff_label: dropoffLabel,
          smtp_user: SMTP_USER,
        },
      }),
    });

    const responseText = await response.text().catch(() => "");
    if (!response.ok) {
      console.error(
        `[on-booking-created] Voucher email failed (${response.status}): ${responseText}`,
      );
      return {
        attempted: true,
        skipped: false,
        ok: false,
        status: response.status,
        body: responseText,
      };
    }

    console.log(`[on-booking-created] Voucher email sent to ${email}: ${response.status}`);
    return {
      attempted: true,
      skipped: false,
      ok: true,
      status: response.status,
      body: responseText,
      smtpConfigured: Boolean(SMTP_PASS),
    };
  } catch (e) {
    console.error("[on-booking-created] Email failed:", e);
    return {
      attempted: true,
      skipped: false,
      ok: false,
      error: String(e),
      smtpConfigured: Boolean(SMTP_PASS),
    };
  }
}

// Google Chat 알림
async function notifyGoogleChat(booking: Record<string, unknown>) {
  if (!GOOGLE_CHAT_WEBHOOK_URL) {
    console.warn("[on-booking-created] GOOGLE_CHAT_WEBHOOK_URL missing, skipping chat");
    return { attempted: false, skipped: true, reason: "missing_webhook" };
  }

  const code = booking.reservation_code || booking.id;
  const isDelivery = booking.service_type === "DELIVERY";
  const pickupLabel = await getLocationLabel(
    booking.pickup_location_id as string | null,
    booking.pickup_location,
  );
  const dropoffLabel = isDelivery
    ? await getLocationLabel(booking.dropoff_location_id as string | null, booking.dropoff_location)
    : pickupLabel;
  const text = isDelivery
    ? `*🚨 신규 배송 예약 알림*\n━━━━━━━━━━━━━━━━━━━━\n🔖 *예약코드*: ${code}\n👤 *이름*: ${booking.user_name}\n🚚 *서비스*: 배송\n📍 *픽업*: ${pickupLabel} (${booking.pickup_time})\n🎯 *도착*: ${dropoffLabel} (${booking.dropoff_date || ""} ${booking.delivery_time || ""})\n💰 *금액*: ₩${Number(booking.final_price || 0).toLocaleString()}\n━━━━━━━━━━━━━━━━━━━━`
    : `*🚨 신규 보관 예약 알림*\n━━━━━━━━━━━━━━━━━━━━\n🔖 *예약코드*: ${code}\n👤 *이름*: ${booking.user_name}\n🏦 *서비스*: 보관\n📥 *보관*: ${pickupLabel} (${booking.pickup_date} ${booking.pickup_time})\n💰 *금액*: ₩${Number(booking.final_price || 0).toLocaleString()}\n━━━━━━━━━━━━━━━━━━━━`;

  try {
    const response = await fetch(GOOGLE_CHAT_WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text }),
    });

    const responseText = await response.text().catch(() => "");
    if (!response.ok) {
      console.error(
        `[on-booking-created] Google Chat notify failed (${response.status}): ${responseText}`,
      );
      return {
        attempted: true,
        skipped: false,
        ok: false,
        status: response.status,
        body: responseText,
      };
    }

    return {
      attempted: true,
      skipped: false,
      ok: true,
      status: response.status,
      body: responseText,
    };
  } catch (e) {
    console.error("[on-booking-created] Chat notify failed:", e);
    return {
      attempted: true,
      skipped: false,
      ok: false,
      error: String(e),
    };
  }
}

serve(async (req) => {
  try {
    if (req.method === "OPTIONS") {
      return new Response("ok", { headers: CORS_HEADERS });
    }

    const payload = await req.json();
    // Database Webhook payload: { type: "INSERT", table: "booking_details", record: {...} }
    const record = payload.record;
    if (!record) {
      return new Response(JSON.stringify({ error: "No record" }), {
        status: 400,
        headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
      });
    }

    console.log(`[on-booking-created] Processing booking: ${record.reservation_code || record.id}`);

    // 1. 예약코드가 없으면 생성
    if (!record.reservation_code) {
      const originCode = await getShortCode(record.pickup_location_id);
      const destCode = record.service_type === "DELIVERY" ? "ADDR" : await getShortCode(record.dropoff_location_id);
      const reservationCode = generateReservationCode(originCode, destCode);

      await supabase
        .from("booking_details")
        .update({ reservation_code: reservationCode })
        .eq("id", record.id);

      record.reservation_code = reservationCode;
    }

    // 2. 바우처 이메일
    const emailResult = await sendVoucherEmail(record);

    // 3. Google Chat 알림
    const chatResult = await notifyGoogleChat(record);

    return new Response(JSON.stringify({
      success: true,
      code: record.reservation_code,
      email: emailResult,
      chat: chatResult,
    }), {
      headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("[on-booking-created] Error:", e);
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500,
      headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
    });
  }
});
