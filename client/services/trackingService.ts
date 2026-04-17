/**
 * Beeliber 통합 트래킹 서비스
 * Meta Pixel (브라우저) + GA4 전자상거래 표준 이벤트 + Naver Analytics 통합
 *
 * GA4 이벤트명은 Google 표준(view_item / add_to_cart / begin_checkout / purchase)을 따름.
 * Meta Pixel 이벤트명은 Meta 표준(ViewContent / AddToCart / InitiateCheckout / Purchase)을 따름.
 * 두 플랫폼의 명명 규칙이 다르므로 trackEvent()에서 각각 분리 처리.
 */

declare global {
  interface Window {
    fbq: (...args: unknown[]) => void;
    gtag: (...args: unknown[]) => void;
    wcs: unknown;
    wcs_do: () => void;
    dataLayer: unknown[];
  }
}

export const META_PIXEL_ID = '2813327635677634';

/**
 * 내부 로우레벨 이벤트 발송.
 * 직접 호출보다는 TrackingService의 메서드를 사용할 것.
 */
const _send = (
  metaEvent: string,
  ga4Event: string,
  metaParams?: Record<string, unknown>,
  ga4Params?: Record<string, unknown>
): string => {
  const eventId = `ev_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  // 1. Meta Pixel (Browser)
  if (typeof window.fbq === 'function') {
    window.fbq('track', metaEvent, { ...metaParams, event_id: eventId });
  }

  // 2. GA4 — ecommerce 이벤트는 ecommerce 객체를 초기화 후 전송
  if (typeof window.gtag === 'function') {
    if (ga4Params && 'items' in ga4Params) {
      window.dataLayer = window.dataLayer || [];
      window.dataLayer.push({ ecommerce: null }); // 이전 ecommerce 데이터 초기화
    }
    window.gtag('event', ga4Event, ga4Params ?? {});
  }

  // 3. Naver Analytics
  if (window.wcs && typeof window.wcs_do === 'function') {
    window.wcs_do();
  }

  return eventId;
};

/** 레거시 호환용 단일 이벤트명 전송 (두 플랫폼에 같은 이름) */
export const trackEvent = (eventName: string, params?: Record<string, unknown>): string => {
  return _send(eventName, eventName, params, params);
};

// ─── 서비스 카탈로그 (GA4 items 생성 헬퍼) ───────────────────────────────
export interface TrackItem {
  item_id: string;
  item_name: string;
  item_category?: 'storage' | 'delivery' | 'combo';
  item_category2?: string;  // 지점명
  price?: number;
  quantity?: number;
}

// ─── TrackingService ─────────────────────────────────────────────────────

export const TrackingService = {
  /**
   * 1단계: 서비스/콘텐츠 조회
   * GA4: view_item / Meta: ViewContent
   */
  viewContent: (contentName: string, contentId?: string, value?: number, item?: Partial<TrackItem>) => {
    const ga4Item: TrackItem = {
      item_id: contentId ?? contentName,
      item_name: contentName,
      item_category: item?.item_category ?? 'storage',
      item_category2: item?.item_category2,
      price: value ?? 0,
      quantity: 1,
    };
    return _send(
      'ViewContent',
      'view_item',
      {
        content_name: contentName,
        content_ids: contentId ? [contentId] : undefined,
        content_type: 'product',
        value,
        currency: 'KRW',
      },
      {
        currency: 'KRW',
        value: value ?? 0,
        items: [ga4Item],
      }
    );
  },

  /**
   * 2단계: 예약 페이지 진입 (장바구니 추가)
   * GA4: add_to_cart / Meta: AddToCart
   */
  addToCart: (value?: number, item?: Partial<TrackItem>) => {
    const ga4Item: TrackItem = {
      item_id: item?.item_id ?? 'beeliber_service',
      item_name: item?.item_name ?? 'Beeliber 서비스',
      item_category: item?.item_category ?? 'storage',
      item_category2: item?.item_category2,
      price: value ?? 0,
      quantity: 1,
    };
    return _send(
      'AddToCart',
      'add_to_cart',
      { content_type: 'product', value, currency: 'KRW' },
      { currency: 'KRW', value: value ?? 0, items: [ga4Item] }
    );
  },

  /**
   * 3단계: 결제 시작
   * GA4: begin_checkout / Meta: InitiateCheckout
   */
  initiateCheckout: (value?: number, items?: TrackItem[]) => {
    const ga4Items: TrackItem[] = items ?? [{
      item_id: 'beeliber_service',
      item_name: 'Beeliber 서비스',
      item_category: 'storage',
      price: value ?? 0,
      quantity: 1,
    }];
    return _send(
      'InitiateCheckout',
      'begin_checkout',
      { content_type: 'product', value, currency: 'KRW' },
      { currency: 'KRW', value: value ?? 0, items: ga4Items }
    );
  },

  /**
   * 4단계: 예약/결제 완료
   * GA4: purchase (표준 ecommerce) / Meta: Purchase
   */
  purchase: (orderId: string, value: number, items?: TrackItem[]) => {
    const ga4Items: TrackItem[] = items ?? [{
      item_id: orderId,
      item_name: 'Beeliber 서비스',
      item_category: 'storage',
      price: value,
      quantity: 1,
    }];
    return _send(
      'Purchase',
      'purchase',
      {
        content_ids: [orderId],
        content_type: 'product',
        value,
        currency: 'KRW',
        num_items: ga4Items.length,
      },
      {
        transaction_id: orderId,
        value,
        currency: 'KRW',
        items: ga4Items,
      }
    );
  },
};
