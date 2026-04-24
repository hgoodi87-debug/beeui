// Supabase Edge Function: on-booking-created
// Database Webhook → booking_details INSERT 트리거
// 하는 일: 예약코드 생성 + 바우처 이메일 + Google Chat 알림

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

import {
  buildVoucherEmailHtml,
  type VoucherEmailTemplateInput,
} from "../_shared/booking-email-templates.ts";
import { sendEdgeMail } from "../_shared/mailer.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
// 예약 알림 전용 웹훅 (챗봇 채널과 분리). 미설정 시 공용 채널로 폴백.
const GOOGLE_CHAT_WEBHOOK_URL =
  Deno.env.get("GOOGLE_CHAT_BOOKING_WEBHOOK_URL") ||
  Deno.env.get("GOOGLE_CHAT_WEBHOOK_URL") ||
  "";
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

interface LocationInfo {
  name: string;
  pickupImageUrl: string;
  pickupGuide: string;
  lat: number | null;
  lng: number | null;
  address: string;
}

async function getLocationInfo(locationId: string | null, fallbackName: unknown): Promise<LocationInfo> {
  const lookupValue = String(locationId || "").trim();
  const fallback = String(fallbackName || "").trim();

  if (!lookupValue || lookupValue === "custom") {
    return { name: fallback || "주소 직접 입력", pickupImageUrl: "", pickupGuide: "", lat: null, lng: null, address: "" };
  }

  const { data } = await supabase
    .from("locations")
    .select("id, name, name_en, pickup_image_url, pickup_guide, lat, lng, address")
    .or(`id.eq.${lookupValue},short_code.eq.${lookupValue}`)
    .limit(1)
    .maybeSingle();

  return {
    name: data?.name || data?.name_en || fallback || lookupValue,
    pickupImageUrl: data?.pickup_image_url || "",
    pickupGuide: data?.pickup_guide || "",
    lat: data?.lat ?? null,
    lng: data?.lng ?? null,
    address: data?.address || "",
  };
}

// 바우처 이메일 발송 (Gmail SMTP via Deno)
async function sendVoucherEmail(booking: Record<string, unknown>) {
  const email = booking.user_email as string;
  if (!email) {
    console.warn("[on-booking-created] No user_email, skipping voucher");
    return { attempted: false, skipped: true, reason: "missing_email" };
  }

  // 멱등성: 이미 발송된 경우 스킵 (force_resend=true 이면 무시)
  if (booking.email_sent_at && !booking.force_resend) {
    console.log(`[on-booking-created] Email already sent at ${booking.email_sent_at}, skipping`);
    return { attempted: false, skipped: true, reason: "already_sent" };
  }

  const reservationCode = booking.reservation_code || booking.id;
  const subject = `[Beeliber] 예약 확인 | Booking Confirmed - ${reservationCode}`;
  const pickupInfo = await getLocationInfo(
    booking.pickup_location_id as string | null,
    booking.pickup_location,
  );
  const pickupLabel = pickupInfo.name;
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

  // 네이버 지도 URL 생성 (픽업 지점 좌표 or 주소 기반)
  const buildMapUrl = (info: LocationInfo) => {
    if (info.lat && info.lng) {
      return `https://map.naver.com/v5/search/${encodeURIComponent(info.address || info.name)}?c=${info.lng},${info.lat},15,0,0,0,dh`;
    }
    if (info.address) {
      return `https://map.naver.com/v5/search/${encodeURIComponent(info.address)}`;
    }
    return "";
  };

  try {
    // bag_summary 있으면 그걸 우선, 없으면 총 개수만
    const bagSummary = typeof booking.bag_summary === "string" && String(booking.bag_summary).trim()
      ? String(booking.bag_summary).trim()
      : Number(booking.bags || 0) > 0
      ? `총 ${Number(booking.bags)}개`
      : "-";

    const emailInput: VoucherEmailTemplateInput = {
      bookingId: String(booking.id || reservationCode || ""),
      reservationCode: String(reservationCode || ""),
      userName: String(booking.user_name || "Guest"),
      serviceType: String(booking.service_type || ""),
      pickupLabel,
      pickupDate: String(booking.pickup_date || ""),
      pickupTime: String(booking.pickup_time || ""),
      dropoffLabel,
      dropoffDate: String(booking.dropoff_date || booking.return_date || booking.pickup_date || ""),
      deliveryTime: String(booking.delivery_time || booking.return_time || ""),
      finalPrice: Number(booking.final_price || 0),
      bagSummary,
      nametagNumber: String((booking as any).nametag_id || ""),
      storageNumbers: Array.isArray((booking as any).storage_numbers)
        ? (booking as any).storage_numbers.map((n: unknown) => Number(n)).filter((n: number) => Number.isFinite(n))
        : undefined,
      pickupImageUrl: pickupInfo.pickupImageUrl || undefined,
      pickupGuide: pickupInfo.pickupGuide || undefined,
      pickupAddress: pickupInfo.address || undefined,
      pickupMapUrl: buildMapUrl(pickupInfo) || undefined,
      adminNote: typeof booking.admin_note === "string" && booking.admin_note.trim()
        ? booking.admin_note.trim()
        : typeof booking.audit_note === "string" && booking.audit_note.trim()
        ? booking.audit_note.trim()
        : undefined,
      paymentMethod: typeof booking.payment_method === "string" ? booking.payment_method : undefined,
      paidAt: typeof booking.paid_at === "string"
        ? booking.paid_at
        : typeof booking.created_at === "string"
        ? booking.created_at
        : undefined,
      language: typeof booking.language === "string" ? booking.language : "en",
    };

    await sendEdgeMail({
      to: email,
      bcc: "bee@bee-liber.com",
      subject,
      html: buildVoucherEmailHtml(emailInput) || body,
    });

    // 멱등성 마크: 발송 성공 후 email_sent_at 기록
    if (booking.id) {
      await supabase
        .from("booking_details")
        .update({ email_sent_at: new Date().toISOString() })
        .eq("id", booking.id as string);
    }

    console.log(`[on-booking-created] Voucher email sent to ${email}`);
    return {
      attempted: true,
      skipped: false,
      ok: true,
      smtpConfigured: true,
    };
  } catch (e) {
    console.error("[on-booking-created] Email failed:", e);
    return {
      attempted: true,
      skipped: false,
      ok: false,
      error: String(e),
      smtpConfigured: Boolean(Deno.env.get("SMTP_PASS")),
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
  // service_type 판단: 명시적 값 우선, 없으면 dropoff 주소/지점 존재 여부로 fallback
  const isDelivery =
    booking.service_type === "DELIVERY" ||
    (!booking.service_type && !!(booking.dropoff_address || booking.dropoff_location_id));
  const bagCount = Number(booking.bags || 0);
  const bagSummaryLine = booking.bag_summary
    ? `🧳 *수하물*: ${booking.bag_summary} (총 ${bagCount}개)`
    : bagCount > 0
    ? `🧳 *수하물*: 총 ${bagCount}개`
    : "";
  const pickupLabel = await getLocationLabel(
    booking.pickup_location_id as string | null,
    booking.pickup_location,
  );
  const dropoffLabel = isDelivery
    ? await getLocationLabel(booking.dropoff_location_id as string | null, booking.dropoff_location)
    : pickupLabel;
  const isCash = booking.payment_method === "cash";
  const isPaypal = booking.payment_method === "paypal";
  const isPaid = !!(booking.payment_approved_at);
  const paymentLine = isCash
    ? "💵 *결제*: 방문 현금"
    : isPaypal && isPaid
    ? "💳 *결제*: 페이팔 결제완료 ✅"
    : "";
  const text = isDelivery
    ? `*🚨 신규 배송 예약 알림*\n━━━━━━━━━━━━━━━━━━━━\n🔖 *예약코드*: ${code}\n👤 *이름*: ${booking.user_name}\n🚚 *서비스*: 배송\n📍 *픽업*: ${pickupLabel} (${booking.pickup_time})\n🎯 *도착*: ${dropoffLabel} (${booking.dropoff_date || ""} ${booking.delivery_time || ""})\n${bagSummaryLine ? bagSummaryLine + "\n" : ""}💰 *금액*: ₩${Number(booking.final_price || 0).toLocaleString()}${paymentLine ? "\n" + paymentLine : ""}\n━━━━━━━━━━━━━━━━━━━━`
    : `*🚨 신규 보관 예약 알림*\n━━━━━━━━━━━━━━━━━━━━\n🔖 *예약코드*: ${code}\n👤 *이름*: ${booking.user_name}\n🏦 *서비스*: 보관\n📥 *보관*: ${pickupLabel} (${booking.pickup_date} ${booking.pickup_time})\n${bagSummaryLine ? bagSummaryLine + "\n" : ""}💰 *금액*: ₩${Number(booking.final_price || 0).toLocaleString()}${paymentLine ? "\n" + paymentLine : ""}\n━━━━━━━━━━━━━━━━━━━━`;

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
    // UPDATE 이벤트(reservation_code/email_sent_at 업데이트)는 무시 — 중복 알림 방지
    if (payload.type && payload.type !== "INSERT") {
      return new Response(JSON.stringify({ skipped: true, reason: "not_insert" }), {
        status: 200,
        headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
      });
    }

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

      // [W-2] update 실패 시 명시적 에러 처리
      const { error: codeUpdateError } = await supabase
        .from("booking_details")
        .update({ reservation_code: reservationCode })
        .eq("id", record.id);

      if (codeUpdateError) {
        console.error(`[on-booking-created] reservation_code update failed for ${record.id}:`, codeUpdateError.message);
        // 예약코드 DB 저장 실패 — 이메일/알림은 메모리 코드로 계속 진행하되 에러 기록
      }

      record.reservation_code = reservationCode;
    }

    // 2. 바우처 이메일
    const emailResult = await sendVoucherEmail(record);

    // 3. Google Chat 알림
    const chatResult = await notifyGoogleChat(record);

    // [W-1] 이메일 발송 실패 시 Google Chat에 별도 경고 알림
    if (emailResult.attempted && !emailResult.ok && GOOGLE_CHAT_WEBHOOK_URL) {
      const code = record.reservation_code || record.id;
      const warnText = `*⚠️ 바우처 이메일 발송 실패*\n예약코드: ${code}\n수신자: ${record.user_email || "unknown"}\n사유: ${emailResult.error || "unknown"}\nSMTP 설정 확인 필요`;
      fetch(GOOGLE_CHAT_WEBHOOK_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: warnText }),
      }).catch((e) => console.error("[on-booking-created] email-fail chat notify failed:", e));
    }

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
