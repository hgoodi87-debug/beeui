// Firebase 완전 제거 — Supabase Edge Function 사용
const SUPABASE_URL = (import.meta.env.VITE_SUPABASE_URL || '').trim();
const SUPABASE_KEY = (import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || '').trim();
import { BookingState } from '../types';

const tossClientKey = import.meta.env.VITE_TOSS_PAYMENTS_CLIENT_KEY?.trim() || '';
const isLocalMockMode = import.meta.env.VITE_TOSS_PAYMENTS_MOCK_MODE === 'true';
const isTossCheckoutFeatureEnabled = import.meta.env.VITE_TOSS_PAYMENTS_ENABLED === 'true';
const TOSS_SDK_URL = 'https://js.tosspayments.com/v2/standard';
const MOCK_PAYMENT_SESSION_PREFIX = 'beeliber_toss_mock_session:';
const MOCK_PAYMENT_SESSION_LATEST_KEY = 'beeliber_toss_mock_session_latest';

declare global {
    interface Window {
        TossPayments?: (clientKey: string) => {
            payment: (options: { customerKey: string }) => {
                requestPayment: (request: {
                    method: 'CARD';
                    amount: {
                        currency: 'KRW';
                        value: number;
                    };
                    orderId: string;
                    orderName: string;
                    customerName?: string;
                    customerEmail?: string;
                    successUrl: string;
                    failUrl: string;
                    windowTarget?: 'self' | 'iframe';
                    metadata?: Record<string, string>;
                    card?: {
                        flowMode?: 'DEFAULT' | 'DIRECT';
                    };
                }) => Promise<void> | void;
            };
        };
    }
}

export interface TossPaymentSessionResult {
    requiresPayment: boolean;
    orderId?: string;
    amount: number;
    orderName?: string;
    customerKey?: string;
    booking: BookingState;
}

export interface TossPaymentConfirmResult {
    booking: BookingState;
    payment: {
        paymentKey?: string;
        orderId?: string;
        approvedAt?: string;
        receiptUrl?: string;
        method?: string;
    };
}

let tossSdkPromise: Promise<NonNullable<Window['TossPayments']>> | null = null;

// Auth 대기 불필요 — Supabase Edge Function은 JWT 검증 없이 동작

const loadTossPaymentsSdk = async () => {
    if (typeof window === 'undefined') {
        throw new Error('브라우저 환경에서만 토스페이먼츠 SDK를 사용할 수 있습니다.');
    }

    if (window.TossPayments) {
        return window.TossPayments;
    }

    if (!tossSdkPromise) {
        tossSdkPromise = new Promise((resolve, reject) => {
            const existing = document.querySelector<HTMLScriptElement>('script[data-toss-payments-sdk="true"]');
            if (existing) {
                existing.addEventListener('load', () => {
                    if (window.TossPayments) {
                        resolve(window.TossPayments);
                        return;
                    }
                    reject(new Error('토스페이먼츠 SDK 전역 객체를 찾지 못했습니다.'));
                }, { once: true });
                existing.addEventListener('error', () => reject(new Error('토스페이먼츠 SDK 로드에 실패했습니다.')), { once: true });
                return;
            }

            const script = document.createElement('script');
            script.src = TOSS_SDK_URL;
            script.async = true;
            script.dataset.tossPaymentsSdk = 'true';
            script.onload = () => {
                if (window.TossPayments) {
                    resolve(window.TossPayments);
                    return;
                }
                reject(new Error('토스페이먼츠 SDK 전역 객체를 찾지 못했습니다.'));
            };
            script.onerror = () => reject(new Error('토스페이먼츠 SDK 로드에 실패했습니다.'));
            document.head.appendChild(script);
        });
    }

    return tossSdkPromise;
};

const getWindowTarget = (): 'self' | 'iframe' => {
    if (typeof window === 'undefined') {
        return 'self';
    }

    return window.innerWidth < 1024 ? 'self' : 'iframe';
};

export const isTossPaymentsFlowEnabled = () => isTossCheckoutFeatureEnabled;
export const isTossPaymentsEnabled = () => isTossCheckoutFeatureEnabled && Boolean(tossClientKey);
export const isTossPaymentsMockMode = () => isLocalMockMode;

const buildMockOrderId = () => `MOCK_BEEPAY_${Date.now().toString(36).toUpperCase()}`;

const getMockSessionKey = (orderId: string) => `${MOCK_PAYMENT_SESSION_PREFIX}${orderId}`;

const getMockStorage = () => {
    if (typeof window === 'undefined') {
        return null;
    }

    return {
        session: window.sessionStorage,
        local: window.localStorage,
    };
};

const persistMockSession = (session: TossPaymentSessionResult) => {
    if (!session.orderId) return;
    const storage = getMockStorage();
    if (!storage) return;

    const serialized = JSON.stringify(session);
    storage.session.setItem(getMockSessionKey(session.orderId), serialized);
    storage.local.setItem(getMockSessionKey(session.orderId), serialized);
    storage.local.setItem(MOCK_PAYMENT_SESSION_LATEST_KEY, serialized);
};

const readMockSession = (orderId: string): TossPaymentSessionResult | null => {
    const storage = getMockStorage();
    if (!storage) return null;

    const raw =
        storage.session.getItem(getMockSessionKey(orderId))
        || storage.local.getItem(getMockSessionKey(orderId))
        || storage.local.getItem(MOCK_PAYMENT_SESSION_LATEST_KEY);
    if (!raw) return null;

    try {
        const parsed = JSON.parse(raw) as TossPaymentSessionResult;
        if (parsed?.orderId && parsed.orderId !== orderId) {
            return null;
        }
        return parsed;
    } catch (error) {
        console.warn('[TossMock] 결제 세션 파싱 실패:', error);
        return null;
    }
};

const clearMockSession = (orderId: string) => {
    const storage = getMockStorage();
    if (!storage) return;

    storage.session.removeItem(getMockSessionKey(orderId));
    storage.local.removeItem(getMockSessionKey(orderId));

    const latestRaw = storage.local.getItem(MOCK_PAYMENT_SESSION_LATEST_KEY);
    if (!latestRaw) return;

    try {
        const latest = JSON.parse(latestRaw) as TossPaymentSessionResult;
        if (latest?.orderId === orderId) {
            storage.local.removeItem(MOCK_PAYMENT_SESSION_LATEST_KEY);
        }
    } catch {
        storage.local.removeItem(MOCK_PAYMENT_SESSION_LATEST_KEY);
    }
};

export const createTossPaymentSession = async (booking: BookingState): Promise<TossPaymentSessionResult> => {
    if (isLocalMockMode) {
        const orderId = buildMockOrderId();
        const amount = Math.max(0, Number(booking.finalPrice || booking.price || 0));
        const session: TossPaymentSessionResult = {
            requiresPayment: amount > 0,
            orderId,
            amount,
            orderName: booking.serviceType === 'DELIVERY' ? '비리버 배송 예약' : '비리버 보관 예약',
            customerKey: `mock_${orderId.toLowerCase()}`,
            booking,
        };
        persistMockSession(session);
        return session;
    }

    // Supabase Edge Function 호출
    const res = await fetch(`${SUPABASE_URL}/functions/v1/toss-payments/create-session`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'apikey': SUPABASE_KEY },
        body: JSON.stringify({ booking }),
    });
    if (!res.ok) throw new Error(`Toss session failed [${res.status}]`);
    const json = await res.json();
    return json.data as TossPaymentSessionResult;
};

export const confirmTossPayment = async (params: {
    paymentKey: string;
    orderId: string;
    amount: number;
}): Promise<TossPaymentConfirmResult> => {
    if (isLocalMockMode) {
        const mockSession = readMockSession(params.orderId);
        if (!mockSession) {
            throw new Error('로컬 토스 mock 세션을 찾지 못했습니다. 예약하기부터 다시 진행해 주세요.');
        }

        clearMockSession(params.orderId);

        return {
            booking: {
                ...mockSession.booking,
                paymentMethod: 'card',
                paymentStatus: 'paid',
                paymentProvider: 'toss',
                paymentOrderId: params.orderId,
                paymentKey: params.paymentKey,
                paymentApprovedAt: new Date().toISOString(),
                paymentReceiptUrl: `${window.location.origin}/payments/toss/success?mock-receipt=${encodeURIComponent(params.orderId)}`,
            },
            payment: {
                paymentKey: params.paymentKey,
                orderId: params.orderId,
                approvedAt: new Date().toISOString(),
                receiptUrl: `${window.location.origin}/payments/toss/success?mock-receipt=${encodeURIComponent(params.orderId)}`,
                method: 'CARD',
            },
        };
    }

    // Supabase Edge Function 호출
    const res = await fetch(`${SUPABASE_URL}/functions/v1/toss-payments/confirm`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'apikey': SUPABASE_KEY },
        body: JSON.stringify(params),
    });
    if (!res.ok) throw new Error(`Toss confirm failed [${res.status}]`);
    const json = await res.json();
    return json.data as TossPaymentConfirmResult;
};

export const requestTossCardPayment = async (params: {
    orderId: string;
    orderName: string;
    amount: number;
    customerKey: string;
    customerName?: string;
    customerEmail?: string;
}) => {
    if (isLocalMockMode) {
        const origin = window.location.origin;
        const url = new URL('/payments/toss/success', origin);
        url.searchParams.set('paymentKey', `mock_payment_${params.orderId}`);
        url.searchParams.set('orderId', params.orderId);
        url.searchParams.set('amount', String(params.amount));
        window.location.assign(url.toString());
        return;
    }

    if (!tossClientKey) {
        throw new Error('토스페이먼츠 클라이언트 키가 설정되지 않았습니다.');
    }

    const TossPayments = await loadTossPaymentsSdk();
    const tossPayments = TossPayments(tossClientKey);
    const payment = tossPayments.payment({ customerKey: params.customerKey });
    const origin = window.location.origin;

    await payment.requestPayment({
        method: 'CARD',
        amount: {
            currency: 'KRW',
            value: params.amount,
        },
        orderId: params.orderId,
        orderName: params.orderName,
        customerName: params.customerName,
        customerEmail: params.customerEmail,
        successUrl: `${origin}/payments/toss/success`,
        failUrl: `${origin}/payments/toss/fail`,
        windowTarget: getWindowTarget(),
        metadata: {
            source: 'beeliber-booking',
        },
        card: {
            flowMode: 'DEFAULT',
        },
    });
};
