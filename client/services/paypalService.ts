import { getSupabaseBaseUrl, getSupabaseConfig } from './supabaseRuntime';

const SUPABASE_URL = getSupabaseBaseUrl();
const SUPABASE_KEY = getSupabaseConfig().anonKey;

const FALLBACK_KRW_USD_RATE = 1380;
const RATE_CACHE_KEY = 'bee_usd_krw_rate';
const RATE_CACHE_TTL_MS = 6 * 60 * 60 * 1000; // 6시간

let _cachedRate: number = FALLBACK_KRW_USD_RATE;

export async function fetchExchangeRate(): Promise<number> {
    try {
        const stored = localStorage.getItem(RATE_CACHE_KEY);
        if (stored) {
            const { rate, ts } = JSON.parse(stored);
            if (Date.now() - ts < RATE_CACHE_TTL_MS) {
                _cachedRate = rate;
                return rate;
            }
        }
        const apiUrl = import.meta.env.DEV
            ? '/frankfurter/latest?from=USD&to=KRW'
            : 'https://api.frankfurter.app/latest?from=USD&to=KRW';
        const res = await fetch(apiUrl);
        const data = await res.json();
        const rate = data?.rates?.KRW ?? FALLBACK_KRW_USD_RATE;
        localStorage.setItem(RATE_CACHE_KEY, JSON.stringify({ rate, ts: Date.now() }));
        _cachedRate = rate;
        return rate;
    } catch {
        return _cachedRate;
    }
}

export function getCachedRate(): number {
    return _cachedRate;
}

const PAYPAL_CLIENT_ID = import.meta.env.VITE_PAYPAL_CLIENT_ID?.trim() || '';

declare global {
    interface Window {
        paypal?: any;
    }
}

export function isPayPalEnabled(): boolean {
    return !!PAYPAL_CLIENT_ID;
}

export function krwToUsd(amountKRW: number, rate?: number): string {
    const usd = amountKRW / (rate ?? _cachedRate);
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
    // window.paypal이 있어도 현재 client-id가 다른 경우 무시 (sandbox→live 전환 후 stale 방지)
    if (window.paypal && sdkLoadPromise) return Promise.resolve();
    if (sdkLoadPromise) return sdkLoadPromise;

    // locale 파라미터 제거 — PayPal이 자동 감지 (zh_CN 등 미지원 locale 로드 실패 방지)
    sdkLoadPromise = new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = `https://www.paypal.com/sdk/js?client-id=${PAYPAL_CLIENT_ID}&currency=USD&intent=capture`;
        script.async = true;
        script.dataset.paypalSdk = 'true';
        script.onload = () => resolve();
        script.onerror = () => {
            sdkLoadPromise = null; // 실패 시 캐시 초기화 → 재시도 가능
            reject(new Error('PayPal SDK 로드 실패'));
        };
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
