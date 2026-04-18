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

// 앱 언어 코드 → PayPal SDK locale 코드 매핑
function toPayPalLocale(lang: string): string {
    const map: Record<string, string> = {
        ko: 'ko_KR',
        en: 'en_US',
        zh: 'zh_CN',
        'zh-CN': 'zh_CN',
        'zh-TW': 'zh_TW',
        'zh-HK': 'zh_HK',
        ja: 'ja_JP',
    };
    return map[lang] ?? 'zh_TW';
}

let sdkLoadPromise: Promise<void> | null = null;

export function loadPayPalSDK(lang = 'zh-TW'): Promise<void> {
    if (!PAYPAL_CLIENT_ID) return Promise.reject(new Error('PayPal Client ID가 설정되지 않았습니다.'));
    if (window.paypal) return Promise.resolve();
    if (sdkLoadPromise) return sdkLoadPromise;

    const locale = toPayPalLocale(lang);
    sdkLoadPromise = new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = `https://www.paypal.com/sdk/js?client-id=${PAYPAL_CLIENT_ID}&currency=USD&intent=capture&locale=${locale}&enable-funding=card`;
        script.async = true;
        script.dataset.paypalSdk = 'true';
        script.onload = () => resolve();
        script.onerror = () => reject(new Error('PayPal SDK 로드 실패'));
        document.head.appendChild(script);
    });

    return sdkLoadPromise;
}

const PAYPAL_EDGE_HEADERS = {
    'Content-Type': 'application/json',
    'apikey': SUPABASE_KEY,
    'Authorization': `Bearer ${SUPABASE_KEY}`,
};

// Edge Function 콜드 스타트 예방용 워밍 핑
// PayPal 섹션이 보일 때 호출 → createOrder 시점에는 이미 warm 상태
export async function warmPayPalFunction(): Promise<void> {
    try {
        await fetch(`${SUPABASE_URL}/functions/v1/paypal-payments/ping`, {
            method: 'POST',
            headers: PAYPAL_EDGE_HEADERS,
            body: '{}',
        });
    } catch {
        // 워밍 실패는 무시 — 결제 흐름에 영향 없음
    }
}

export async function createPayPalOrder(amountKRW: number, description: string): Promise<string> {
    const amountUsd = krwToUsd(amountKRW);
    const res = await fetch(`${SUPABASE_URL}/functions/v1/paypal-payments/create-order`, {
        method: 'POST',
        headers: PAYPAL_EDGE_HEADERS,
        body: JSON.stringify({ amountUsd, description }),
    });
    if (!res.ok) {
        const errText = await res.text().catch(() => '');
        throw new Error(`PayPal 주문 생성 실패 [${res.status}]: ${errText}`);
    }
    const json = await res.json();
    return json.data.orderId;
}

export async function capturePayPalOrder(orderId: string): Promise<{ status: string; captureId: string; paidAt: string }> {
    const res = await fetch(`${SUPABASE_URL}/functions/v1/paypal-payments/capture-order`, {
        method: 'POST',
        headers: PAYPAL_EDGE_HEADERS,
        body: JSON.stringify({ orderId }),
    });
    if (!res.ok) {
        const errText = await res.text().catch(() => '');
        throw new Error(`PayPal 결제 확인 실패 [${res.status}]: ${errText}`);
    }
    const json = await res.json();
    return json.data;
}
