import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const TOSS_SECRET_KEY = Deno.env.get("TOSS_SECRET_KEY") || "";
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
async function createSession(booking: Record<string, unknown>) {
  const amount = Number(booking.finalPrice || booking.price || 0);
  const orderId = `BEEPAY_${Date.now().toString(36).toUpperCase()}_${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
  return { requiresPayment: amount > 0, orderId, amount, orderName: booking.serviceType === 'DELIVERY' ? 'Beeliber Delivery' : 'Beeliber Storage', customerKey: `cust_${Date.now()}`, booking };
}
async function confirmPayment(params: { paymentKey: string; orderId: string; amount: number }) {
  if (!TOSS_SECRET_KEY) throw new Error('TOSS_SECRET_KEY not configured');
  const res = await fetch('https://api.tosspayments.com/v1/payments/confirm', { method: 'POST', headers: { 'Authorization': `Basic ${btoa(`${TOSS_SECRET_KEY}:`)}`, 'Content-Type': 'application/json' }, body: JSON.stringify(params) });
  if (!res.ok) throw new Error(`Toss confirm failed [${res.status}]`);
  const data = await res.json();
  return { booking: { paymentStatus: 'paid', paymentProvider: 'toss', paymentOrderId: params.orderId, paymentKey: params.paymentKey, paymentApprovedAt: data.approvedAt }, payment: { paymentKey: params.paymentKey, orderId: params.orderId, approvedAt: data.approvedAt, method: data.method } };
}
Deno.serve(async (req) => {
  const path = new URL(req.url).pathname.split('/').pop();
  try {
    const body = await req.json();
    if (path === 'create-session') return new Response(JSON.stringify({ data: await createSession(body.booking) }), { headers: { 'Content-Type': 'application/json' } });
    if (path === 'confirm') return new Response(JSON.stringify({ data: await confirmPayment(body) }), { headers: { 'Content-Type': 'application/json' } });
    return new Response(JSON.stringify({ error: 'Unknown' }), { status: 404 });
  } catch (e) { return new Response(JSON.stringify({ error: String(e) }), { status: 500 }); }
});
