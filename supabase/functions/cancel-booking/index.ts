import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { authenticateAdminRequest, CORS_HEADERS, EdgeHttpError } from "../_shared/admin-auth.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: CORS_HEADERS });
  }

  try {
    const body = await req.json();
    const { bookingId, reason, name, email } = body;

    if (!bookingId) {
      return new Response(JSON.stringify({ error: "bookingId required" }), {
        status: 400,
        headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
      });
    }

    // ─── 인증 경로 1: 관리자 JWT ──────────────────────────────────────────
    // Authorization 헤더가 있으면 관리자 인증 시도
    let isAdminCancellation = false;
    const authHeader = req.headers.get("authorization") || req.headers.get("x-supabase-access-token");
    if (authHeader) {
      await authenticateAdminRequest(req); // 실패하면 401/403 throw
      isAdminCancellation = true;
    }

    // ─── 인증 경로 2: 고객 소유권 검증 (name + email) ────────────────────
    if (!isAdminCancellation) {
      if (!name || !email) {
        throw new EdgeHttpError(
          401,
          "취소하려면 예약 시 입력한 이름과 이메일이 필요합니다.",
          "Customer cancellation requires name and email for ownership verification.",
        );
      }
    }

    // 1. booking_details 현재 상태 조회
    const { data: booking } = await supabase
      .from("booking_details")
      .select("id, reservation_id, settlement_status, payment_key, service_type, user_name, user_email")
      .eq("id", bookingId)
      .single();

    if (!booking) {
      return new Response(JSON.stringify({ error: "Booking not found" }), {
        status: 404,
        headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
      });
    }

    // 고객 경로: 이름·이메일 일치 여부 검증 (대소문자 무시)
    if (!isAdminCancellation) {
      const nameMatch = (booking.user_name || "").trim().toLowerCase() === name.trim().toLowerCase();
      const emailMatch = (booking.user_email || "").trim().toLowerCase() === email.trim().toLowerCase();
      if (!nameMatch || !emailMatch) {
        throw new EdgeHttpError(
          403,
          "예약자 정보가 일치하지 않습니다.",
          `Ownership check failed: name=${nameMatch}, email=${emailMatch}`,
        );
      }
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
      changed_by: isAdminCancellation ? "admin" : "customer",
      reason: reason || (isAdminCancellation ? "Admin cancellation" : "Customer cancellation"),
    });

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
    });
  } catch (e) {
    const status = e instanceof EdgeHttpError ? e.status : 500;
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : String(e) }), {
      status,
      headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
    });
  }
});
