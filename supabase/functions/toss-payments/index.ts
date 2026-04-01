import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const TOSS_SECRET_KEY = Deno.env.get("TOSS_SECRET_KEY") || "";
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function createSession(booking: Record<string, unknown>) {
  const amount = Number(booking.finalPrice || booking.price || 0);
  const orderId = `BEEPAY_${Date.now().toString(36).toUpperCase()}_${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

  // 세션 생성 시 orderId-amount 매핑 저장 (결제 확인 시 검증용)
  if (amount > 0) {
    await supabase.from('app_settings').upsert({
      key: `payment_session_${orderId}`,
      value: { amount, createdAt: new Date().toISOString() },
    }, { onConflict: 'key' });
  }

  return {
    requiresPayment: amount > 0,
    orderId,
    amount,
    orderName: booking.serviceType === 'DELIVERY' ? 'Beeliber Delivery' : 'Beeliber Storage',
    customerKey: `cust_${crypto.randomUUID()}`,
    booking,
  };
}

async function confirmPayment(params: { paymentKey: string; orderId: string; amount: number }) {
  if (!TOSS_SECRET_KEY) throw new Error('TOSS_SECRET_KEY not configured');

  // 서버 측 금액 검증: 세션 생성 시 저장한 금액과 일치하는지 확인
  const { data: session } = await supabase
    .from('app_settings')
    .select('value')
    .eq('key', `payment_session_${params.orderId}`)
    .single();

  if (session?.value?.amount != null && Number(session.value.amount) !== params.amount) {
    throw new Error(`Amount mismatch: expected ${session.value.amount}, got ${params.amount}`);
  }

  const res = await fetch('https://api.tosspayments.com/v1/payments/confirm', {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${btoa(`${TOSS_SECRET_KEY}:`)}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(params),
  });
  if (!res.ok) throw new Error(`Toss confirm failed [${res.status}]`);
  const data = await res.json();

  // 사용된 세션 정리
  await supabase.from('app_settings').delete().eq('key', `payment_session_${params.orderId}`);

  return {
    booking: {
      paymentStatus: 'paid',
      paymentProvider: 'toss',
      paymentOrderId: params.orderId,
      paymentKey: params.paymentKey,
      paymentApprovedAt: data.approvedAt,
      paymentReceiptUrl: data.receipt?.url || '',
    },
    payment: {
      paymentKey: params.paymentKey,
      orderId: params.orderId,
      approvedAt: data.approvedAt,
      method: data.method,
      receiptUrl: data.receipt?.url || '',
    },
  };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type', 'Access-Control-Allow-Methods': 'POST, OPTIONS' } });
  }
  const path = new URL(req.url).pathname.split('/').pop();
  try {
    const body = await req.json();
    if (path === 'create-session') return new Response(JSON.stringify({ data: await createSession(body.booking) }), { headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } });
    if (path === 'confirm') return new Response(JSON.stringify({ data: await confirmPayment(body) }), { headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } });
    return new Response(JSON.stringify({ error: 'Unknown' }), { status: 404 });
  } catch (e) { return new Response(JSON.stringify({ error: String(e) }), { status: 500, headers: { 'Access-Control-Allow-Origin': '*' } }); }
});
