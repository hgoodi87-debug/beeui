import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: CORS_HEADERS });
  }

  try {
    const { bookingId, reason } = await req.json();
    if (!bookingId) {
      return new Response(JSON.stringify({ error: "bookingId required" }), {
        status: 400,
        headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
      });
    }

    // 1. booking_details 현재 상태 조회
    const { data: booking } = await supabase
      .from("booking_details")
      .select("id, reservation_id, settlement_status, payment_key, service_type")
      .eq("id", bookingId)
      .single();

    if (!booking) {
      return new Response(JSON.stringify({ error: "Booking not found" }), {
        status: 404,
        headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
      });
    }

    const previousStatus = booking.settlement_status || "unknown";

    // 2. 이미 취소/환불된 경우 중복 처리 방지
    if (previousStatus === "cancelled" || previousStatus === "refunded") {
      return new Response(JSON.stringify({ error: "Already cancelled" }), {
        status: 409,
        headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
      });
    }

    // 3. booking_details 취소 처리
    await supabase
      .from("booking_details")
      .update({ settlement_status: "cancelled" })
      .eq("id", bookingId);

    // 4. reservations 상태도 함께 업데이트 (상태 머신 일관성)
    if (booking.reservation_id) {
      await supabase
        .from("reservations")
        .update({ status: "cancelled" })
        .eq("id", booking.reservation_id);

      // 5. 배송 배정 취소 (기사 유령 배정 방지)
      await supabase
        .from("delivery_assignments")
        .update({ status: "cancelled" })
        .eq("reservation_id", booking.reservation_id)
        .in("status", ["unassigned", "assigned"]);

      // 6. 결제 상태 업데이트 (환불 추적)
      await supabase
        .from("payments")
        .update({ status: "refunded" })
        .eq("reservation_id", booking.reservation_id)
        .eq("status", "paid");
    }

    // 7. 운영 상태 로그 기록 (실제 이전 상태 사용)
    await supabase.from("operation_status_logs").insert({
      reservation_id: booking.reservation_id || bookingId,
      from_status: previousStatus,
      to_status: "cancelled",
      changed_by: "customer",
      reason: reason || "Customer cancellation",
    });

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500,
      headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
    });
  }
});
