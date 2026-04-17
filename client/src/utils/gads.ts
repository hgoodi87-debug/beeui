/**
 * Google Ads 전환 추적 + 채널 어트리뷰션 유틸리티
 * - UTM 파라미터 / GCLID 캡처 (SPA 라우팅 중 유실 방지)
 * - localStorage 14일 TTL (탭 닫아도 첫터치 보존)
 * - Referrer 자동 채널 추론 (UTM 없는 유기 트래픽 보완)
 * - 예약 완료 시 Google Ads 전환 이벤트 발송
 */

const STORAGE_KEY = 'beeliber_first_touch';
const TTL_MS = 14 * 24 * 60 * 60 * 1000; // 14일

interface StoredAdParams {
  data: Record<string, string>;
  expires: number;
}

/** 페이지 최초 로드 시 UTM + GCLID + Referrer를 localStorage에 저장 (14일 TTL, 첫터치 모델) */
export function captureAdParams(): void {
  // 유효한 첫터치가 이미 저장돼 있으면 덮어쓰지 않음 (첫터치 어트리뷰션 모델)
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const stored: StoredAdParams = JSON.parse(raw);
      if (stored.expires > Date.now()) return;
    }
  } catch {
    // 손상된 데이터는 무시하고 새로 저장
  }

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

  // 랜딩 페이지 항상 기록 (퍼널 분석용)
  adParams['_landing_page'] = window.location.pathname;

  // UTM source가 없으면 referrer 기반으로 자동 분류
  // → booking_details.utm_source 가 항상 채워져 GA4 "미지정" 제거
  if (!adParams['utm_source']) {
    if (document.referrer) {
      adParams['_referrer'] = document.referrer;
      const channel = inferChannelFromReferrer(document.referrer);
      if (channel === 'organic_search') {
        adParams['utm_source'] = 'google';
        adParams['utm_medium'] = 'organic';
      } else if (channel === 'organic_social') {
        try {
          const host = new URL(document.referrer).hostname.toLowerCase();
          if (/xiaohongshu|xhs/.test(host))   { adParams['utm_source'] = 'xiaohongshu'; }
          else if (/instagram/.test(host))    { adParams['utm_source'] = 'instagram'; }
          else if (/threads/.test(host))      { adParams['utm_source'] = 'threads'; }
          else if (/twitter|x\.com/.test(host)) { adParams['utm_source'] = 'twitter'; }
          else if (/facebook|fb\.com/.test(host)) { adParams['utm_source'] = 'facebook'; }
          else if (/youtube/.test(host))      { adParams['utm_source'] = 'youtube'; }
          else if (/line\.me/.test(host))     { adParams['utm_source'] = 'line'; }
          else                                { adParams['utm_source'] = 'social'; }
          adParams['utm_medium'] = 'organic_social';
        } catch {
          adParams['utm_source'] = 'social';
          adParams['utm_medium'] = 'organic_social';
        }
      } else if (channel === 'referral_ota') {
        adParams['utm_source'] = 'ota';
        adParams['utm_medium'] = 'referral';
      } else {
        adParams['utm_source'] = 'referral';
        adParams['utm_medium'] = 'referral';
      }
    } else {
      // 완전 직접 방문 (북마크 / 직접 URL 입력 / 앱 내 브라우저)
      adParams['utm_source'] = 'direct';
      adParams['utm_medium'] = 'none';
    }
  }

  const payload: StoredAdParams = { data: adParams, expires: Date.now() + TTL_MS };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
}

/** 저장된 광고 파라미터 반환 (만료된 경우 빈 객체) */
export function getAdParams(): Record<string, string> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const stored: StoredAdParams = JSON.parse(raw);
    if (stored.expires < Date.now()) {
      localStorage.removeItem(STORAGE_KEY);
      return {};
    }
    return stored.data;
  } catch {
    return {};
  }
}

/**
 * Referrer URL → 채널명 추론
 * UTM 없이 들어온 방문자의 유입 경로를 자동 분류
 */
export function inferChannelFromReferrer(referrer: string): string {
  if (!referrer) return 'direct';
  try {
    const host = new URL(referrer).hostname.toLowerCase();
    if (/google\.|bing\.|naver\.|daum\.|yahoo\.|duckduck/.test(host)) return 'organic_search';
    if (/xiaohongshu|xhs\.com|rednote/.test(host)) return 'organic_social';
    if (/instagram\.com/.test(host)) return 'organic_social';
    if (/threads\.net/.test(host)) return 'organic_social';
    if (/twitter\.com|x\.com/.test(host)) return 'organic_social';
    if (/facebook\.com|fb\.com/.test(host)) return 'organic_social';
    if (/tripadvisor|klook|kkday|viator/.test(host)) return 'referral_ota';
    return 'referral';
  } catch {
    return 'referral';
  }
}

/**
 * UTM source + medium → 표준 채널 그룹 정규화
 * 리포트에서 채널을 일관되게 집계하기 위해 사용
 */
export function normalizeChannel(utmSource?: string, utmMedium?: string): string {
  if (!utmSource) return 'direct';
  const s = utmSource.toLowerCase();
  const m = (utmMedium || '').toLowerCase();

  if (m === 'cpc' || m === 'ppc' || m === 'paid' || m === 'paid_search') return 'paid_search';
  if (m === 'paid_social') return 'paid_social';
  if (m === 'email') return 'email';
  if (m === 'offline') return 'offline';
  if (/xiaohongshu|xhs|rednote/.test(s)) return '샤오홍슈';
  if (/instagram/.test(s)) return 'Instagram';
  if (/threads/.test(s)) return 'Threads';
  if (/twitter|^x$/.test(s)) return 'X';
  if (/facebook|fb/.test(s)) return 'Facebook';
  if (/google/.test(s) && (m === 'organic' || m === 'organic_search')) return 'Google 검색';
  if (/naver/.test(s)) return 'Naver';
  if (/tripadvisor|klook|kkday|viator/.test(s)) return 'OTA';
  if (s === 'organic_search') return 'Google 검색';
  if (s === 'organic_social') return 'SNS';
  if (s === 'referral') return '기타 유입';
  if (s === 'direct') return 'Direct';
  return utmSource; // 알 수 없는 소스는 원본 값 그대로
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
