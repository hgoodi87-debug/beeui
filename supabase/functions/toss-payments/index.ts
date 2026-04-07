import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const TOSS_SECRET_KEY = Deno.env.get("TOSS_SECRET_KEY") || "";
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

// [W-4] stale payment session 정리 (30분 이상 미결제 세션 삭제)
async function cleanStaleSessions() {
  const cutoff = new Date(Date.now() - 30 * 60 * 1000).toISOString();
  await supabase
    .from('app_settings')
    .delete()
    .like('key', 'payment_session_%')
    .lt('value->>createdAt', cutoff);
}

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

  // [W-4] 세션 생성 시점에 stale 세션 정리 (fire-and-forget)
  cleanStaleSessions().catch((e) => console.warn('[toss-payments] stale session cleanup failed:', e));

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
  // [C-2] 설정 오류는 CONFIG_ERROR 코드로 구분
  if (!TOSS_SECRET_KEY) {
    const err = new Error('TOSS_SECRET_KEY not configured') as Error & { code: string };
    err.code = 'CONFIG_ERROR';
    throw err;
  }

  // 서버 측 금액 검증: 세션 생성 시 저장한 금액과 일치하는지 확인
  const { data: session } = await supabase
    .from('app_settings')
    .select('value')
    .eq('key', `payment_session_${params.orderId}`)
    .single();

  if (session?.value?.amount != null && Number(session.value.amount) !== params.amount) {
    // [C-2] 금액 위조는 AMOUNT_MISMATCH 코드로 구분 (보안 이슈)
    const err = new Error(`Amount mismatch: expected ${session.value.amount}, got ${params.amount}`) as Error & { code: string };
    err.code = 'AMOUNT_MISMATCH';
    throw err;
  }

  const res = await fetch('https://api.tosspayments.com/v1/payments/confirm', {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${btoa(`${TOSS_SECRET_KEY}:`)}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(params),
  });
  if (!res.ok) {
    // [C-2] Toss API 실패는 TOSS_API_ERROR 코드로 구분
    const err = new Error(`Toss confirm failed [${res.status}]`) as Error & { code: string };
    err.code = 'TOSS_API_ERROR';
    throw err;
  }
  const data = await res.json();

  // [C-1] 결제 완료 기록을 payments 테이블에 저장 (booking_details 연결 없이 payment_key로 추적)
  const { error: paymentInsertError } = await supabase.from('payments').insert({
    provider: 'toss',
    payment_key: params.paymentKey,
    status: 'paid',
    amount: params.amount,
    paid_at: data.approvedAt || new Date().toISOString(),
  });
  if (paymentInsertError) {
    // 결제 기록 저장 실패는 치명적 — 로그 남기고 계속 (Toss 결제는 이미 완료됨)
    console.error('[toss-payments] payments INSERT failed:', paymentInsertError.message);
  }

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

// [C-2] 오류 코드 분류 헬퍼
function classifyError(e: unknown): { error: string; code: string } {
  const msg = e instanceof Error ? e.message : String(e);
  const code = (e as { code?: string }).code
    || (msg.includes('mismatch') ? 'AMOUNT_MISMATCH'
      : msg.includes('TOSS_SECRET_KEY') ? 'CONFIG_ERROR'
      : msg.includes('Toss confirm failed') ? 'TOSS_API_ERROR'
      : 'PAYMENT_FAILED');
  return { error: msg, code };
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
    return new Response(JSON.stringify({ error: 'Unknown', code: 'UNKNOWN_PATH' }), { status: 404 });
  } catch (e) {
    // [C-2] 오류 유형 분류하여 반환
    const classified = classifyError(e);
    console.error(`[toss-payments] ${classified.code}:`, classified.error);
    return new Response(JSON.stringify(classified), { status: 500, headers: { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' } });
  }
});
