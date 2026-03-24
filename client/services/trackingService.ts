/**
 * [스봉이] Beeliber 통합 트래킹 서비스 💅✨
 * Meta Pixel, GA4, 그리고 추후 CAPI 연동을 위한 통합 인터페이스입니다.
 * 아시겠어요? 🙄
 */

declare global {
  interface Window {
    fbq: any;
    gtag: any;
    dataLayer: any[];
  }
}

export const META_PIXEL_ID = '2813327635677634';

export const trackEvent = (eventName: string, params?: Record<string, any>) => {
  const eventId = `ev_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  // 1. Meta Pixel (Browser) 💅
  if (window.fbq) {
    window.fbq('track', eventName, {
      ...params,
      event_id: eventId
    });
  }

  // 2. GA4 📊
  if (window.gtag) {
    window.gtag('event', eventName, params);
  }

  // 3. TODO: CAPI (Server-side) 연결부 🚀
  // 여기서 백엔드 API를 호출하여 서버에서도 이벤트를 쏴줘야 합니다.
  
  return eventId;
};

export const TrackingService = {
  // 1단계: 서비스/콘텐츠 조회 🥯
  viewContent: (contentName: string, contentId?: string, value?: number) => {
    trackEvent('ViewContent', {
      content_name: contentName,
      content_ids: contentId ? [contentId] : undefined,
      content_type: 'product',
      value: value,
      currency: 'KRW'
    });
  },

  // 2단계: 예약 페이지 진입 (장바구니 담기 대용) 🛒
  addToCart: (value?: number) => {
    trackEvent('AddToCart', {
      content_type: 'product',
      value: value,
      currency: 'KRW'
    });
  },

  // 3단계: 예약 시작 (체크아웃 시작) 💳
  initiateCheckout: (value?: number) => {
    trackEvent('InitiateCheckout', {
      content_type: 'product',
      value: value,
      currency: 'KRW'
    });
  },

  // 4단계: 예약/결제 완료 (구매 완료) 🎉
  purchase: (orderId: string, value: number, contents?: any[]) => {
    return trackEvent('Purchase', {
      content_ids: [orderId],
      content_type: 'product',
      value: value,
      currency: 'KRW',
      num_items: contents?.length || 1
    });
  }
};
