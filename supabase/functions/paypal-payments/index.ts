import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const PAYPAL_CLIENT_ID = Deno.env.get("PAYPAL_CLIENT_ID") || "";
const PAYPAL_SECRET = Deno.env.get("PAYPAL_SECRET") || "";
const PAYPAL_MODE = Deno.env.get("PAYPAL_MODE") || "sandbox"; // "sandbox" | "live"
const PAYPAL_API = PAYPAL_MODE === "live"
  ? "https://api-m.paypal.com"
  : "https://api-m.sandbox.paypal.com";

// amountUsd 서버사이드 유효성 검사: 양수, 소수점 2자리, $0.50~$500 범위
// (전체 DB 기반 재계산은 결제 연동 완성 시 적용)
function validateAmountUsd(raw: unknown): string {
  const s = String(raw ?? "").trim();
  const n = parseFloat(s);
  if (isNaN(n) || n <= 0) throw new Error("amountUsd must be a positive number");
  if (!/^\d+(\.\d{1,2})?$/.test(s)) throw new Error("amountUsd must have at most 2 decimal places");
  if (n < 0.5 || n > 500) throw new Error(`amountUsd out of allowed range: $${s} (allowed $0.50–$500.00)`);
  return n.toFixed(2);
}

async function getAccessToken(): Promise<string> {
  if (!PAYPAL_CLIENT_ID || !PAYPAL_SECRET) throw new Error("PayPal credentials not configured");
  const res = await fetch(`${PAYPAL_API}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      "Authorization": `Basic ${btoa(`${PAYPAL_CLIENT_ID}:${PAYPAL_SECRET}`)}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  });
  if (!res.ok) throw new Error(`PayPal auth failed [${res.status}]`);
  const data = await res.json();
  return data.access_token;
}

async function createOrder(amountUsd: string, description: string): Promise<{ orderId: string }> {
  const token = await getAccessToken();
  const res = await fetch(`${PAYPAL_API}/v2/checkout/orders`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json",
      "PayPal-Request-Id": `beeliber-${Date.now()}`,
    },
    body: JSON.stringify({
      intent: "CAPTURE",
      purchase_units: [{
        amount: { currency_code: "USD", value: amountUsd },
        description: description || "Beeliber Seoul Luggage Service",
      }],
      application_context: {
        brand_name: "Beeliber",
        locale: "zh-TW",
        user_action: "PAY_NOW",
      },
    }),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`PayPal create order failed [${res.status}]: ${err}`);
  }
  const data = await res.json();
  return { orderId: data.id };
}

async function captureOrder(orderId: string): Promise<{ status: string; captureId: string; paidAt: string }> {
  const token = await getAccessToken();
  const res = await fetch(`${PAYPAL_API}/v2/checkout/orders/${orderId}/capture`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });

  // 422 ORDER_ALREADY_CAPTURED: 네트워크 재시도 시 이미 완료된 결제 — 기존 데이터 조회
  if (res.status === 422) {
    const errBody = await res.json().catch(() => ({}));
    const issue = errBody?.details?.[0]?.issue ?? "";
    if (issue === "ORDER_ALREADY_CAPTURED") {
      // 주문 상태 조회로 기존 capture 데이터 반환
      const orderRes = await fetch(`${PAYPAL_API}/v2/checkout/orders/${orderId}`, {
        headers: { "Authorization": `Bearer ${token}` },
      });
      if (orderRes.ok) {
        const orderData = await orderRes.json();
        const existingCapture = orderData.purchase_units?.[0]?.payments?.captures?.[0];
        if (existingCapture?.status === "COMPLETED") {
          return {
            status: "COMPLETED",
            captureId: existingCapture.id,
            paidAt: existingCapture.create_time || new Date().toISOString(),
          };
        }
      }
    }
    throw new Error(`PayPal capture failed [422]: ${JSON.stringify(errBody)}`);
  }

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`PayPal capture failed [${res.status}]: ${err}`);
  }

  const data = await res.json();

  // COMPLETED가 아닌 상태(PENDING_REVIEW, VOIDED, FAILED 등)는 결제 실패로 처리
  if (data.status !== "COMPLETED") {
    throw new Error(`PayPal capture not completed: status=${data.status}. 결제가 완료되지 않았습니다.`);
  }

  const capture = data.purchase_units?.[0]?.payments?.captures?.[0];
  return {
    status: data.status,
    captureId: capture?.id || "",
    paidAt: capture?.create_time || new Date().toISOString(),
  };
}

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Content-Type": "application/json",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  // JWT 인증: Supabase anon/authenticated JWT 검증
  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return new Response(JSON.stringify({ error: "Unauthorized: missing Bearer token" }), {
      status: 401,
      headers: corsHeaders,
    });
  }
  const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
  const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
  if (supabaseUrl && supabaseAnonKey) {
    const client = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { error: authError } = await client.auth.getUser();
    if (authError) {
      return new Response(JSON.stringify({ error: "Unauthorized: invalid token" }), {
        status: 401,
        headers: corsHeaders,
      });
    }
  }

  const path = new URL(req.url).pathname.split("/").pop();
  try {
    const body = await req.json();
    if (path === "create-order") {
      const amountUsd = validateAmountUsd(body.amountUsd);
      const result = await createOrder(amountUsd, String(body.description || ""));
      return new Response(JSON.stringify({ data: result }), { headers: corsHeaders });
    }
    if (path === "capture-order") {
      const result = await captureOrder(String(body.orderId));
      return new Response(JSON.stringify({ data: result }), { headers: corsHeaders });
    }
    return new Response(JSON.stringify({ error: "Unknown action" }), { status: 404, headers: corsHeaders });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), { status: 500, headers: corsHeaders });
  }
});
