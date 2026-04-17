# 빌리버 기술 기획 심화편 (Deep Dive)

> Sprint 1–7: 즉시 실행 가능한 코드 레벨 상세 설계

---

## 📘 Sprint 1 — UTM 표준화 & Builder 시스템

### 1.1 UTM 네이밍 컨벤션 (공식 규칙)

**불변 규칙 (Hard Rules)**:
- 모두 소문자, snake_case
- 공백 없음, 특수문자 제한 (`-`, `_`만 허용)
- 한글 금지 (인코딩 이슈)
- 최대 50자 이내

```
utm_source    | 유입 플랫폼의 원천
  허용값: instagram | threads | twitter | facebook | youtube
         | naver | google | kakao | line | email | offline

utm_medium    | 매체 유형
  허용값: paid_social | organic_social | cpc | organic
         | email | referral | display | affiliate | qr

utm_campaign  | 캠페인 식별자
  포맷: {YYYYMM}_{region}_{product}_{goal}
  예: 2604_kr_storage_awareness
      2604_jp_delivery_conversion
      2604_global_combo_retention

utm_content   | 크리에이티브 버전
  포맷: {type}_{variant}_{placement}
  예: reels_v01_feed, carousel_a_story, video_b_explore

utm_term      | 타겟 세그먼트 (paid 채널만)
  포맷: {age}_{interest}_{country}
  예: 2535_traveler_tw, 3045_business_jp
```

### 1.2 UTM Builder — 자체 웹 도구

기술 스택: Next.js + Supabase (무료)

```typescript
// pages/tools/utm-builder.tsx
import { useState } from 'react';

const SOURCES = ['instagram', 'threads', 'twitter', 'facebook',
                 'youtube', 'naver', 'google', 'kakao'];
const MEDIUMS = ['paid_social', 'organic_social', 'cpc',
                 'organic', 'email', 'referral'];

export default function UTMBuilder() {
  const [params, setParams] = useState({
    url: 'https://bee-liber.com',
    source: '', medium: '', campaign: '',
    content: '', term: ''
  });

  const buildURL = () => {
    const url = new URL(params.url);
    Object.entries(params).forEach(([k, v]) => {
      if (k !== 'url' && v) url.searchParams.set(`utm_${k}`, v);
    });
    return url.toString();
  };

  const saveToHistory = async () => {
    // Supabase에 저장 → 모든 팀원이 공유
    await supabase.from('utm_history').insert({
      ...params,
      full_url: buildURL(),
      created_by: user.email,
      created_at: new Date()
    });
  };
  // ... UI 구현
}
```

### 1.3 단축 URL 시스템 (bee.ly/xxx)

```sql
-- Supabase 테이블 스키마
CREATE TABLE short_urls (
  id VARCHAR(10) PRIMARY KEY,          -- base62 short id
  original_url TEXT NOT NULL,           -- UTM 포함 full URL
  utm_source VARCHAR(50),
  utm_medium VARCHAR(50),
  utm_campaign VARCHAR(100),
  click_count INT DEFAULT 0,
  created_by VARCHAR(100),
  created_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP
);

CREATE INDEX idx_short_urls_campaign ON short_urls(utm_campaign);
```

리다이렉트 엣지 함수 (Cloudflare Workers):

```javascript
export default {
  async fetch(request, env) {
    const { pathname } = new URL(request.url);
    const shortId = pathname.slice(1);

    const record = await env.DB.prepare(
      'SELECT original_url FROM short_urls WHERE id = ?'
    ).bind(shortId).first();

    if (!record) return new Response('Not Found', { status: 404 });

    // 클릭 카운트 증가 (비동기)
    env.DB.prepare(
      'UPDATE short_urls SET click_count = click_count + 1 WHERE id = ?'
    ).bind(shortId).run();

    return Response.redirect(record.original_url, 302);
  }
}
```

---

## 📘 Sprint 2 — GTM 컨테이너 재설계

### 2.1 dataLayer 표준 스키마 (Typed)

```typescript
// types/dataLayer.ts
type BaseEvent = {
  event: string;
  event_timestamp: number;
  page_type: 'home' | 'branch' | 'service' | 'checkout' | 'confirm';
  user_properties: {
    user_id?: string;          // 로그인 사용자만
    user_type: 'new' | 'returning';
    language: 'ko' | 'en' | 'ja' | 'zh-TW';
    country_code: string;       // ISO 3166-1 alpha-2
  };
};

type EcommerceItem = {
  item_id: string;             // 지점_ID
  item_name: string;           // "빌리버 홍대점 - 대형 수하물"
  item_category: 'storage' | 'delivery' | 'combo';
  item_category2?: string;     // 서울, 부산 등
  item_variant?: string;       // small | medium | large
  price: number;               // KRW
  currency: 'KRW' | 'USD' | 'JPY' | 'TWD';
  quantity: number;
};

type PurchaseEvent = BaseEvent & {
  event: 'purchase';
  ecommerce: {
    transaction_id: string;     // 예약번호
    value: number;
    tax: number;
    shipping: number;
    currency: string;
    coupon?: string;
    items: EcommerceItem[];
  };
};
```

### 2.2 GTM 트리거 설계

| 트리거명 | 조건 |
|---------|------|
| T_page_view | Page View (All Pages) |
| T_view_service_detail | Custom Event: view_item |
| T_select_branch | Custom Event: select_item |
| T_begin_checkout | Custom Event: begin_checkout |
| T_add_payment_info | Custom Event: add_payment |
| T_purchase | Custom Event: purchase |
| T_form_submit_success | Form Submit + DL flag = true |
| T_scroll_75 | Scroll Depth: 75% |
| T_video_complete | YouTube Complete |
| T_external_link_click | Click URL NOT Contains host |
| T_abandon_cart | Timer: 30s on checkout page |

### 2.3 GTM 태그 구성

```
태그 그룹 1: GA4
  - G_GA4_Config (All Pages)
  - G_GA4_Purchase → GA4 Event "purchase"
  - G_GA4_Checkout → GA4 Event "begin_checkout"

태그 그룹 2: Meta Pixel
  - G_Meta_PageView
  - G_Meta_Purchase (value, currency 매핑)
  - G_Meta_InitiateCheckout

태그 그룹 3: Kakao Pixel
  - G_Kakao_Visit
  - G_Kakao_Purchase

태그 그룹 4: 서버사이드
  - G_SGTM_Purchase → Measurement Protocol
```

### 2.4 Consent Mode V2 (개인정보 보호)

```javascript
// GTM에 추가 - 동의 관리
gtag('consent', 'default', {
  'ad_storage': 'denied',
  'ad_user_data': 'denied',
  'ad_personalization': 'denied',
  'analytics_storage': 'granted',  // 익명 분석은 기본 허용
  'wait_for_update': 500
});

// 사용자가 동의한 후
function onUserConsent(consented) {
  gtag('consent', 'update', {
    'ad_storage': consented ? 'granted' : 'denied',
    'ad_user_data': consented ? 'granted' : 'denied',
    'ad_personalization': consented ? 'granted' : 'denied'
  });
}
```

---

## 📘 Sprint 3 — GA4 & BigQuery 스키마

### 3.1 GA4 커스텀 차원/측정항목 등록

**사용자 범위 (User-scoped)**:

| 이름 | 매개변수 | 용도 |
|------|----------|------|
| User Type | user_type | new/returning 구분 |
| Preferred Language | language | 다국어 분석 |
| Country Code | country_code | 지역 분석 |
| First Source | first_source | 첫 유입 소스 고정 |

**이벤트 범위 (Event-scoped)**:

| 이름 | 매개변수 | 용도 |
|------|----------|------|
| Branch ID | branch_id | 지점별 성과 |
| Service Type | service_type | storage/delivery |
| Session Duration | session_duration_min | 보관 시간 |
| Payment Method | payment_method | card/kakao/naver |

### 3.2 BigQuery 연동 및 스키마

```
필수 설정:
GA4 > Admin > Product Links > BigQuery Links
  - Project: beeliber-analytics
  - Dataset: analytics_379859002
  - Frequency: Daily + Streaming
  - Include advertising identifiers: Yes
```

```sql
-- 커스텀 마트 테이블 예시
CREATE OR REPLACE TABLE `beeliber.mart.fct_conversions` AS
SELECT
  PARSE_DATE('%Y%m%d', event_date) AS conversion_date,
  user_pseudo_id,
  user_id,
  (SELECT value.string_value FROM UNNEST(event_params)
   WHERE key = 'transaction_id') AS transaction_id,
  ecommerce.purchase_revenue AS revenue,
  traffic_source.source,
  traffic_source.medium,
  traffic_source.name AS campaign,
  geo.country,
  geo.region,
  device.category AS device_category
FROM `beeliber.analytics_379859002.events_*`
WHERE event_name = 'purchase'
  AND _TABLE_SUFFIX BETWEEN
    FORMAT_DATE('%Y%m%d', DATE_SUB(CURRENT_DATE(), INTERVAL 90 DAY))
    AND FORMAT_DATE('%Y%m%d', CURRENT_DATE());
```

### 3.3 핵심 분석 쿼리 예시

**A. 채널별 ROAS**

```sql
WITH conversions AS (
  SELECT
    traffic_source.source,
    traffic_source.medium,
    SUM(ecommerce.purchase_revenue) AS revenue,
    COUNT(DISTINCT user_pseudo_id) AS converters
  FROM `beeliber.analytics_379859002.events_*`
  WHERE event_name = 'purchase'
    AND _TABLE_SUFFIX BETWEEN '20260401' AND '20260430'
  GROUP BY 1, 2
),
spend AS (
  SELECT source, medium, SUM(cost) AS cost
  FROM `beeliber.raw.ad_spend`  -- Meta, Google Ads API sync
  WHERE date BETWEEN '2026-04-01' AND '2026-04-30'
  GROUP BY 1, 2
)
SELECT
  c.source, c.medium,
  c.revenue, s.cost,
  SAFE_DIVIDE(c.revenue, s.cost) AS roas,
  c.converters
FROM conversions c
LEFT JOIN spend s USING(source, medium)
ORDER BY roas DESC;
```

**B. 퍼널 이탈 분석**

```sql
WITH funnel AS (
  SELECT
    user_pseudo_id,
    MAX(IF(event_name='page_view', 1, 0)) AS s1_view,
    MAX(IF(event_name='view_item', 1, 0)) AS s2_service,
    MAX(IF(event_name='select_item', 1, 0)) AS s3_branch,
    MAX(IF(event_name='begin_checkout', 1, 0)) AS s4_checkout,
    MAX(IF(event_name='add_payment_info', 1, 0)) AS s5_payment,
    MAX(IF(event_name='purchase', 1, 0)) AS s6_purchase
  FROM `beeliber.analytics_379859002.events_*`
  WHERE _TABLE_SUFFIX BETWEEN '20260410' AND '20260416'
  GROUP BY user_pseudo_id
)
SELECT
  SUM(s1_view) AS step1,
  SUM(s2_service) AS step2,
  SUM(s3_branch) AS step3,
  SUM(s4_checkout) AS step4,
  SUM(s5_payment) AS step5,
  SUM(s6_purchase) AS step6,
  ROUND(SUM(s2_service)/SUM(s1_view)*100, 2) AS s1_to_s2_pct,
  ROUND(SUM(s4_checkout)/SUM(s3_branch)*100, 2) AS s3_to_s4_pct,
  ROUND(SUM(s6_purchase)/SUM(s5_payment)*100, 2) AS s5_to_s6_pct
FROM funnel;
```

---

## 📘 Sprint 4 — 퍼널 엔지니어링 & 리커버리 플로우

### 4.1 React 훅 기반 이벤트 트래킹

```typescript
// hooks/useAnalytics.ts
import { useCallback } from 'react';

type TrackEvent = {
  event: string;
  [key: string]: any;
};

export const useAnalytics = () => {
  const track = useCallback((event: TrackEvent) => {
    if (typeof window === 'undefined') return;
    window.dataLayer = window.dataLayer || [];

    // ecommerce 이벤트는 ecommerce 객체 리셋
    if (event.ecommerce) {
      window.dataLayer.push({ ecommerce: null });
    }

    window.dataLayer.push({
      ...event,
      event_timestamp: Date.now(),
    });

    if (process.env.NODE_ENV === 'development') {
      console.log('[Analytics]', event);
    }
  }, []);

  return { track };
};

// 사용 예시
const BranchPage = ({ branch }) => {
  const { track } = useAnalytics();

  useEffect(() => {
    track({
      event: 'view_item',
      page_type: 'branch',
      ecommerce: {
        items: [{
          item_id: branch.id,
          item_name: branch.name,
          item_category: 'storage',
          item_category2: branch.city,
          price: branch.basePrice,
          currency: 'KRW',
          quantity: 1
        }]
      }
    });
  }, [branch.id]);
};
```

### 4.2 장바구니 이탈 감지 & 복구

```typescript
// lib/abandonedCart.ts
const ABANDON_TIMEOUT_MS = 30 * 60 * 1000; // 30분

interface AbandonedCart {
  items: CartItem[];
  email?: string;
  phone?: string;
  recoveryToken: string;
  abandonedAt: number;
  step: 'checkout' | 'payment';
}

export const saveAbandonedCart = async (data: AbandonedCart) => {
  localStorage.setItem('abandoned_cart', JSON.stringify(data));

  if (data.email || data.phone) {
    await fetch('/api/abandoned-cart', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }
};

export const useAbandonmentDetector = (cartItems: CartItem[]) => {
  useEffect(() => {
    if (cartItems.length === 0) return;

    const timer = setTimeout(() => {
      if (document.visibilityState === 'hidden') {
        saveAbandonedCart({
          items: cartItems,
          recoveryToken: crypto.randomUUID(),
          abandonedAt: Date.now(),
          step: 'checkout'
        });
        track({ event: 'cart_abandon' });
      }
    }, ABANDON_TIMEOUT_MS);

    return () => clearTimeout(timer);
  }, [cartItems]);
};
```

### 4.3 복구 워크플로우 (Supabase Edge Functions)

```typescript
// workers/cartRecovery.ts
import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
  const supabase = createClient(URL, KEY);

  // 1시간 전 이탈 카트 조회 (24h 이내)
  const { data: carts } = await supabase
    .from('abandoned_carts')
    .select('*')
    .is('recovered_at', null)
    .lt('abandoned_at', new Date(Date.now() - 3600000).toISOString())
    .gt('abandoned_at', new Date(Date.now() - 86400000).toISOString());

  for (const cart of carts) {
    await sendRecoveryEmail({
      to: cart.email,
      subject: '짐 맡기는 것을 잊으셨나요? 🧳',
      template: 'abandoned_cart',
      data: {
        items: cart.items,
        recoveryUrl: `https://bee-liber.com/checkout?token=${cart.recovery_token}`,
        discount: 'SAVE10'
      }
    });

    if (cart.phone) {
      await sendKakaoAlimTalk({
        phone: cart.phone,
        templateCode: 'CART_RECOVERY_01',
        variables: { name: cart.name, url: recoveryUrl }
      });
    }

    await supabase.from('abandoned_carts')
      .update({ recovery_sent_at: new Date().toISOString() })
      .eq('id', cart.id);
  }
}
// 스케줄링: Supabase Cron 또는 GitHub Actions — 매시간 실행
```

---

## 📘 Sprint 5 — 다크 소셜 해결 & Server-side GTM

### 5.1 Smart Share Button

```typescript
// components/ShareButton.tsx
export const ShareButton = ({ url, title }) => {
  const detectChannel = (userAgent: string) => {
    if (/KAKAOTALK/i.test(userAgent)) return 'kakao';
    if (/Line/i.test(userAgent)) return 'line';
    if (/Instagram/i.test(userAgent)) return 'instagram_app';
    if (/FB_IAB|FBAN/i.test(userAgent)) return 'facebook_app';
    return 'copy_link';
  };

  const handleShare = async () => {
    const channel = detectChannel(navigator.userAgent);
    const enrichedURL = `${url}?utm_source=${channel}` +
      `&utm_medium=share&utm_campaign=user_share_${Date.now()}`;

    window.dataLayer.push({
      event: 'share',
      method: channel,
      content_type: 'branch',
      item_id: title
    });

    if (navigator.share) {
      await navigator.share({ url: enrichedURL, title });
    } else {
      await navigator.clipboard.writeText(enrichedURL);
      alert('링크가 복사되었습니다');
    }
  };

  return <button onClick={handleShare}>공유하기</button>;
};
```

### 5.2 Referrer Policy 전역 설정

```html
<!-- _document.tsx -->
<Head>
  <meta name="referrer" content="strict-origin-when-cross-origin" />
</Head>
```

```nginx
# 서버 레벨 (Nginx)
add_header Referrer-Policy "strict-origin-when-cross-origin" always;
```

### 5.3 Server-side GTM 구축

**아키텍처**:
```
Client → sGTM Endpoint (events.bee-liber.com) → GA4 / Meta CAPI / Kakao
```

이점:
- iOS Safari ITP 쿠키 제한 우회
- Ad blocker 회피 (first-party 도메인)
- 개인정보 필터링 서버 레벨에서 가능
- Meta CAPI / Google Enhanced Conversions 구현

```yaml
# Cloud Run 설정
service: sgtm-beeliber
image: gcr.io/gtm-cloud-image/server-side
cpu: 1
memory: 512Mi
min_instances: 1    # cold start 방지
max_instances: 10
env:
  - CONTAINER_CONFIG: <GTM_CONTAINER_CONFIG>
  - PREVIEW_SERVER_URL: https://preview.bee-liber.com
domain: events.bee-liber.com
# 월 비용: 약 ₩20,000 (소규모 트래픽 기준)
```

### 5.4 Meta CAPI 구현 (Server-side)

```javascript
// sGTM 커스텀 변수
const hashEmail = (email) => {
  return crypto.subtle.digest('SHA-256',
    new TextEncoder().encode(email.toLowerCase().trim()))
    .then(hash => Array.from(new Uint8Array(hash))
      .map(b => b.toString(16).padStart(2, '0')).join(''));
};

// Meta CAPI 전송 데이터
{
  "data": [{
    "event_name": "Purchase",
    "event_time": "<timestamp>",
    "event_source_url": "<page_url>",
    "event_id": "<transaction_id>",  // 중복 제거
    "action_source": "website",
    "user_data": {
      "em": ["<hashed_email>"],
      "ph": ["<hashed_phone>"],
      "client_ip_address": "<ip>",
      "client_user_agent": "<ua>",
      "fbc": "<fbclid_cookie>",
      "fbp": "<fbp_cookie>"
    },
    "custom_data": {
      "currency": "KRW",
      "value": 25000,
      "content_ids": ["branch_123"],
      "content_type": "product"
    }
  }]
}
```

---

## 📘 Sprint 6 — 국제화 (i18n) 완전 구현

### 6.1 Next.js App Router i18n 구조

```
app/
├── [locale]/
│   ├── layout.tsx          ← 언어별 레이아웃
│   ├── page.tsx            ← 홈
│   ├── branches/
│   │   ├── page.tsx        ← 지점 목록
│   │   └── [id]/page.tsx   ← 지점 상세
│   └── checkout/
│       └── page.tsx
├── middleware.ts           ← 언어 감지 & 리다이렉트
└── i18n/
    ├── ko.json
    ├── en.json
    ├── ja.json
    └── zh-TW.json
```

### 6.2 언어 감지 미들웨어

```typescript
// middleware.ts
import { NextRequest, NextResponse } from 'next/server';
import Negotiator from 'negotiator';
import { match } from '@formatjs/intl-localematcher';

const locales = ['ko', 'en', 'ja', 'zh-TW'];
const defaultLocale = 'ko';

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // 이미 locale prefix가 있으면 pass
  const pathnameHasLocale = locales.some(
    locale => pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`
  );
  if (pathnameHasLocale) return NextResponse.next();

  // 1순위: cookie에 저장된 locale
  const cookieLocale = request.cookies.get('NEXT_LOCALE')?.value;

  // 2순위: Accept-Language 헤더
  const headers = { 'accept-language':
    request.headers.get('accept-language') ?? 'ko' };
  const languages = new Negotiator({ headers }).languages();
  const acceptLocale = match(languages, locales, defaultLocale);

  // 3순위: 지역 IP 기반 (Cloudflare country header)
  const country = request.headers.get('cf-ipcountry');
  const countryToLocale: Record<string, string> = {
    'TW': 'zh-TW', 'JP': 'ja', 'HK': 'zh-TW',
    'SG': 'en', 'MY': 'en', 'US': 'en'
  };
  const geoLocale = countryToLocale[country ?? ''] || defaultLocale;

  const finalLocale = cookieLocale || acceptLocale || geoLocale;

  return NextResponse.redirect(
    new URL(`/${finalLocale}${pathname}`, request.url)
  );
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)']
};
```

### 6.3 hreflang 태그 (SEO)

```tsx
// app/[locale]/layout.tsx
export async function generateMetadata({ params }) {
  const { locale } = params;
  const pathname = '/branches'; // 실제는 동적

  return {
    alternates: {
      canonical: `https://bee-liber.com/${locale}${pathname}`,
      languages: {
        'ko-KR': `https://bee-liber.com/ko${pathname}`,
        'en-US': `https://bee-liber.com/en${pathname}`,
        'ja-JP': `https://bee-liber.com/ja${pathname}`,
        'zh-TW': `https://bee-liber.com/zh-TW${pathname}`,
        'x-default': `https://bee-liber.com/en${pathname}`
      }
    }
  };
}
```

### 6.4 번역 워크플로우

```
콘텐츠 번역 전략:
1. Core UI      : next-intl JSON (수동 번역 필수)
2. 블로그/랜딩   : DeepL API + 검수
3. SEO 메타데이터: 지역별 전문 키워드 조사
4. 고객 후기    : 원문 유지 + 번역 배지

기술 구현:
- CMS: Sanity / Strapi로 다국어 필드 관리
- 번역 자동화: GitHub Action → DeepL API → PR 생성
- 검수: 네이티브 스피커 외주 (크몽/Upwork)
```

### 6.5 지역별 결제 수단

| 지역 | 1순위 | 2순위 | 구현 방법 |
|------|-------|-------|----------|
| 한국 | 카카오페이 | 네이버페이 | 포트원 (구 아임포트) |
| 일본 | Line Pay | JCB 카드 | Stripe + Line Pay API |
| 대만 | Line Pay | 街口支付 | Stripe + Newebpay |
| 글로벌 | Visa/Master | Apple Pay | Stripe |

---

## 📘 Sprint 7 — 성능 최적화 (Core Web Vitals)

### 7.1 LCP 개선 (목표 < 2.5s)

```tsx
// 히어로 이미지 최적화
import Image from 'next/image';

<Image
  src="/hero.webp"
  alt="빌리버 서비스 소개"
  width={1920}
  height={1080}
  priority              // LCP 이미지는 priority 필수
  quality={85}
  placeholder="blur"
  blurDataURL="..."
/>
```

```javascript
// next.config.js — 이미지 최적화 설정
module.exports = {
  images: {
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    minimumCacheTTL: 60 * 60 * 24 * 30, // 30일
  }
};
```

### 7.2 CLS 방지

```css
/* 레이아웃 시프트 방지 */
.hero-image-container {
  aspect-ratio: 16 / 9;  /* 고정 비율로 공간 확보 */
  width: 100%;
}

/* 폰트 로딩 중 레이아웃 안정화 */
@font-face {
  font-family: 'Pretendard';
  font-display: swap;    /* FOIT 방지 */
}
```

### 7.3 FID/INP 개선

```typescript
// 무거운 연산은 Web Worker로 오프로드
const worker = new Worker('/workers/price-calculator.js');

worker.postMessage({ bags: cartItems, duration: hours });
worker.onmessage = (e) => setCalculatedPrice(e.data.price);
```

### 7.4 Bundle 최적화

```javascript
// vite.config.ts — 코드 스플리팅
export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-react': ['react', 'react-dom'],
          'vendor-supabase': ['@supabase/supabase-js'],
          'vendor-maps': ['leaflet', 'react-leaflet'],
          'vendor-payment': ['@portone/browser-sdk'],
        }
      }
    },
    chunkSizeWarningLimit: 500
  }
});
```

### 7.5 목표 Core Web Vitals

| 지표 | 현재 추정 | 목표 | 방법 |
|------|----------|------|------|
| LCP | ~4.0s | < 2.5s | 이미지 최적화 + CDN |
| INP | ~300ms | < 200ms | Web Worker + 코드 분할 |
| CLS | ~0.15 | < 0.1 | aspect-ratio + font-display |
| TTFB | ~800ms | < 600ms | Edge caching + SSG |

---

## 📋 전체 Sprint 우선순위 매트릭스

| Sprint | 임팩트 | 공수 | 우선순위 | 담당 |
|--------|--------|------|----------|------|
| S1: UTM 표준화 | 높음 | 낮음 | ★★★★★ | 마케터 + 개발 0.5일 |
| S2: GTM 재설계 | 높음 | 중간 | ★★★★☆ | 개발 2일 |
| S3: BigQuery 연동 | 중간 | 낮음 | ★★★★☆ | 개발 1일 |
| S4: 퍼널 + 리커버리 | 높음 | 높음 | ★★★★☆ | 개발 3일 |
| S5: sGTM | 중간 | 중간 | ★★★☆☆ | 개발 1일 + 인프라 |
| S6: i18n 완전 구현 | 높음 | 높음 | ★★★★☆ | 개발 5일 + 번역 |
| S7: Core Web Vitals | 중간 | 중간 | ★★★☆☆ | 개발 2일 |

> **빠른 승리 (Quick Win)**: S1(UTM) + S3(BigQuery) → 2일 이내 데이터 신뢰도 대폭 향상
