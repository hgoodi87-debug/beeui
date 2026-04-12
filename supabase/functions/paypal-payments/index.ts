import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const PAYPAL_CLIENT_ID = Deno.env.get("PAYPAL_CLIENT_ID") || "";
const PAYPAL_SECRET = Deno.env.get("PAYPAL_SECRET") || "";
const PAYPAL_MODE = Deno.env.get("PAYPAL_MODE") || "sandbox"; // "sandbox" | "live"
const PAYPAL_API = PAYPAL_MODE === "live"
  ? "https://api-m.paypal.com"
  : "https://api-m.sandbox.paypal.com";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY") ?? "";

// [C-0] PayPal access token 캐시 (cold start 후 최대 8시간 유효)
let cachedAccessToken: string | null = null;
let tokenExpiresAt = 0;

// [C-1] 환율: app_settings.paypal_krw_usd_rate → 없으면 fallback 1380
// 캐시: 모듈 단위 (cold start 기준 최대 1시간)
let cachedRate: number | null = null;
let cacheAt = 0;
const RATE_CACHE_TTL_MS = 60 * 60 * 1000; // 1시간

async function getKrwUsdRate(): Promise<number> {
  const now = Date.now();
  if (cachedRate !== null && now - cacheAt < RATE_CACHE_TTL_MS) return cachedRate;

  try {
    const db = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const { data } = await db
      .from("app_settings")
      .select("value")
      .eq("key", "paypal_krw_usd_rate")
      .single();
    const rate = Number(data?.value ?? 0);
    if (rate > 100) {
      cachedRate = rate;
      cacheAt = now;
      return rate;
    }
  } catch (e) {
    console.warn("[paypal-payments] rate fetch failed, using fallback:", e);
  }

  // fallback — 최신 환율로 주기적 업데이트 필요
  cachedRate = 1380;
  cacheAt = now;
  return 1380;
}

// amountUsd 서버사이드 유효성 검사: 양수, 소수점 2자리, $0.50~$500 범위
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
  // 캐시 히트: 만료 2분 전까지 재사용
  const now = Date.now();
  if (cachedAccessToken && now < tokenExpiresAt - 120_000) return cachedAccessToken;

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
  cachedAccessToken = data.access_token;
  // PayPal 토큰 기본 만료: 32400초(9시간). expires_in 없으면 8시간으로 보수적 설정
  tokenExpiresAt = now + ((data.expires_in ?? 28800) * 1000);
  return cachedAccessToken!;
}

async function createOrder(amountUsd: string, description: string): Promise<{ orderId: string; rateUsed: number }> {
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
        shipping_preference: "NO_SHIPPING",
      },
    }),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`PayPal create order failed [${res.status}]: ${err}`);
  }
  const data = await res.json();
  const rateUsed = await getKrwUsdRate();
  return { orderId: data.id, rateUsed };
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

  if (data.status !== "COMPLETED") {
    throw new Error(`PayPal capture not completed: status=${data.status}. 결제가 완료되지 않았습니다.`);
  }

  const capture = data.purchase_units?.[0]?.payments?.captures?.[0];
  const result = {
    status: data.status,
    captureId: capture?.id || "",
    paidAt: capture?.create_time || new Date().toISOString(),
  };

  // [C-2] 결제 완료 기록 payments 테이블에 저장
  if (SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY && result.captureId) {
    const db = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const amountUsd = Number(capture?.amount?.value ?? 0);
    const { error: insertErr } = await db.from("payments").insert({
      provider: "paypal",
      payment_key: result.captureId,
      status: "paid",
      amount: amountUsd,
      paid_at: result.paidAt,
    });
    if (insertErr) {
      console.error("[paypal-payments] payments INSERT failed:", insertErr.message);
    }
  }

  return result;
}

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Content-Type": "application/json",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  // Supabase 게이트웨이가 JWT/apikey 검증을 처리하므로 여기까지 온 요청은 인증됨
  if (!SUPABASE_URL) {
    console.error("[paypal-payments] SUPABASE_URL not configured");
    return new Response(JSON.stringify({ error: "Server configuration error" }), {
      status: 503,
      headers: corsHeaders,
    });
  }

  const path = new URL(req.url).pathname.split("/").pop();

  // /ping — Edge Function 워밍 용도. body 파싱 없이 즉시 응답
  if (path === "ping") {
    return new Response(JSON.stringify({ ok: true }), { headers: corsHeaders });
  }

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
    console.error("[paypal-payments] error:", e);
    return new Response(JSON.stringify({ error: String(e) }), { status: 500, headers: corsHeaders });
  }
});
