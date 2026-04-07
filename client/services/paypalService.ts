import { getSupabaseBaseUrl, getSupabaseConfig } from './supabaseRuntime';

const SUPABASE_URL = getSupabaseBaseUrl();
const SUPABASE_KEY = getSupabaseConfig().anonKey;

// 1 USD ≈ 1380 KRW — 분기마다 업데이트 권장
const KRW_USD_RATE = 1380;

const PAYPAL_CLIENT_ID = import.meta.env.VITE_PAYPAL_CLIENT_ID?.trim() || '';

declare global {
    interface Window {
        paypal?: any;
    }
}

export function isPayPalEnabled(): boolean {
    return !!PAYPAL_CLIENT_ID;
}

export function krwToUsd(amountKRW: number): string {
    const usd = amountKRW / KRW_USD_RATE;
    return Math.max(0.01, usd).toFixed(2);
}

let sdkLoadPromise: Promise<void> | null = null;

export function loadPayPalSDK(): Promise<void> {
    if (!PAYPAL_CLIENT_ID) return Promise.reject(new Error('PayPal Client ID가 설정되지 않았습니다.'));
    if (window.paypal) return Promise.resolve();
    if (sdkLoadPromise) return sdkLoadPromise;

    sdkLoadPromise = new Promise((resolve, reject) => {
        const script = document.createElement('script');
        // zh-TW 로케일 + USD 통화
        script.src = `https://www.paypal.com/sdk/js?client-id=${PAYPAL_CLIENT_ID}&currency=USD&intent=capture&locale=zh_TW`;
        script.async = true;
        script.dataset.paypalSdk = 'true';
        script.onload = () => resolve();
        script.onerror = () => reject(new Error('PayPal SDK 로드 실패'));
        document.head.appendChild(script);
    });

    return sdkLoadPromise;
}

export async function createPayPalOrder(amountKRW: number, description: string): Promise<string> {
    const amountUsd = krwToUsd(amountKRW);
    const res = await fetch(`${SUPABASE_URL}/functions/v1/paypal-payments/create-order`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'apikey': SUPABASE_KEY },
        body: JSON.stringify({ amountUsd, description }),
    });
    if (!res.ok) throw new Error(`PayPal 주문 생성 실패 [${res.status}]`);
    const json = await res.json();
    return json.data.orderId;
}

export async function capturePayPalOrder(orderId: string): Promise<{ status: string; captureId: string; paidAt: string }> {
    const res = await fetch(`${SUPABASE_URL}/functions/v1/paypal-payments/capture-order`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'apikey': SUPABASE_KEY },
        body: JSON.stringify({ orderId }),
    });
    if (!res.ok) throw new Error(`PayPal 결제 확인 실패 [${res.status}]`);
    const json = await res.json();
    return json.data;
}
