/**
 * Google Ads 전환 추적 유틸리티
 * - UTM 파라미터 / GCLID 캡처 (SPA 라우팅 중 유실 방지)
 * - 예약 완료 시 전환 이벤트 발송
 */

const SESSION_KEY = 'beeliber_ad_params';

/** 페이지 최초 로드 시 UTM + GCLID를 sessionStorage에 저장 */
export function captureAdParams(): void {
  // 이미 저장된 경우 덮어쓰지 않음 (첫 터치 어트리뷰션 유지)
  if (sessionStorage.getItem(SESSION_KEY)) return;

  const params = new URLSearchParams(window.location.search);
  const adParams: Record<string, string> = {};

  const keys = [
    'utm_source', 'utm_medium', 'utm_campaign',
    'utm_term', 'utm_content', 'gclid', 'gad_source',
  ];

  keys.forEach((k) => {
    const v = params.get(k);
    if (v) adParams[k] = v;
  });

  if (Object.keys(adParams).length > 0) {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(adParams));
  }
}

/** 저장된 광고 파라미터 반환 */
export function getAdParams(): Record<string, string> {
  try {
    return JSON.parse(sessionStorage.getItem(SESSION_KEY) || '{}');
  } catch {
    return {};
  }
}

declare const gtag: (...args: unknown[]) => void;

/**
 * Google Ads 전환 이벤트 발송
 * - Google Ads 계정에서 전환 액션 생성 후 ID/Label 입력 필요
 * - 환경변수: VITE_GOOGLE_ADS_ID, VITE_GOOGLE_ADS_CONVERSION_LABEL
 */
export function fireBookingConversion(params: {
  value: number;
  currency?: string;
  transactionId?: string;
}): void {
  const adsId = import.meta.env.VITE_GOOGLE_ADS_ID as string | undefined;
  const label = import.meta.env.VITE_GOOGLE_ADS_CONVERSION_LABEL as string | undefined;

  if (!adsId || !label || typeof gtag === 'undefined') return;

  gtag('event', 'conversion', {
    send_to: `${adsId}/${label}`,
    value: params.value,
    currency: params.currency ?? 'KRW',
    transaction_id: params.transactionId,
  });
}
