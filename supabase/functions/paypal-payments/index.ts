import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const PAYPAL_CLIENT_ID = Deno.env.get("PAYPAL_CLIENT_ID") || "";
const PAYPAL_SECRET = Deno.env.get("PAYPAL_SECRET") || "";
const PAYPAL_MODE = Deno.env.get("PAYPAL_MODE") || "sandbox"; // "sandbox" | "live"
const PAYPAL_API = PAYPAL_MODE === "live"
  ? "https://api-m.paypal.com"
  : "https://api-m.sandbox.paypal.com";

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
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`PayPal capture failed [${res.status}]: ${err}`);
  }
  const data = await res.json();
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

  const path = new URL(req.url).pathname.split("/").pop();
  try {
    const body = await req.json();
    if (path === "create-order") {
      const result = await createOrder(String(body.amountUsd), String(body.description || ""));
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
