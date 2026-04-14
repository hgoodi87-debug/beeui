/**
 * globalSchemas.ts
 * 사이트 전체에서 사용하는 Organization, Service, BreadcrumbList JSON-LD 스키마
 * GEO 최적화: AI 검색엔진(ChatGPT, Perplexity, Google AI Overviews)이
 * Beeliber 브랜드와 서비스를 정확히 인식하도록 구조화 데이터를 제공
 */

import { SITE_URL } from './seoRouteMeta';

// ─── Organization 스키마 ──────────────────────────────────────────────────────
export const BEELIBER_ORGANIZATION_SCHEMA = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'Beeliber',
  alternateName: ['빌리버', 'ビーリバー', '哔哩保'],
  url: SITE_URL,
  logo: `${SITE_URL}/favicon.ico`,
  description:
    'Seoul-based luggage storage and same-day airport delivery service. Store your bags at key locations (Hongdae, Seoul Station, Myeongdong) and travel freely.',
  foundingLocation: {
    '@type': 'Place',
    name: 'Seoul, South Korea',
  },
  areaServed: {
    '@type': 'City',
    name: 'Seoul',
    sameAs: 'https://www.wikidata.org/wiki/Q8684',
  },
  contactPoint: {
    '@type': 'ContactPoint',
    telephone: '+82-10-2922-7731',
    contactType: 'customer service',
    availableLanguage: ['Korean', 'English', 'Japanese', 'Chinese'],
  },
  sameAs: [
    'https://www.xiaohongshu.com/user/profile/beeliber',
    'https://bee-liber.com',
  ],
};

// ─── Service 스키마 (짐보관 + 공항 당일 배송) ─────────────────────────────────
export const BEELIBER_SERVICE_SCHEMA = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'Service',
      '@id': `${SITE_URL}/#luggage-storage`,
      name: 'Luggage Storage Seoul',
      alternateName: ['서울 짐보관', 'ソウル荷物預かり', '首爾行李寄放'],
      description:
        'Secure luggage storage at key Seoul locations including Hongdae, Seoul Station, and Myeongdong. Store bags for as little as 4 hours. QR code check-in, insured storage.',
      provider: {
        '@type': 'Organization',
        name: 'Beeliber',
        url: SITE_URL,
      },
      areaServed: {
        '@type': 'City',
        name: 'Seoul',
      },
      serviceType: 'Luggage Storage',
      availableChannel: {
        '@type': 'ServiceChannel',
        serviceUrl: `${SITE_URL}/ko/locations`,
        servicePhone: '+82-10-2922-7731',
      },
      offers: {
        '@type': 'AggregateOffer',
        priceCurrency: 'KRW',
        lowPrice: '4000',
        highPrice: '10000',
        offerCount: '3',
      },
      aggregateRating: {
        '@type': 'AggregateRating',
        ratingValue: '4.9',
        reviewCount: '1240',
        bestRating: '5',
      },
    },
    {
      '@type': 'Service',
      '@id': `${SITE_URL}/#airport-delivery`,
      name: 'Same-Day Airport Delivery Seoul',
      alternateName: ['인천공항 당일 짐배송', '仁川機場當日行李配送', '仁川空港当日手荷物配送'],
      description:
        'Same-day luggage delivery from your Seoul accommodation to Incheon Airport (ICN). Book by 10 PM the night before, delivered before your departure.',
      provider: {
        '@type': 'Organization',
        name: 'Beeliber',
        url: SITE_URL,
      },
      areaServed: [
        { '@type': 'City', name: 'Seoul' },
        { '@type': 'Airport', name: 'Incheon International Airport', iataCode: 'ICN' },
      ],
      serviceType: 'Luggage Delivery',
      availableChannel: {
        '@type': 'ServiceChannel',
        serviceUrl: `${SITE_URL}/ko/delivery/airport`,
      },
      offers: {
        '@type': 'AggregateOffer',
        priceCurrency: 'KRW',
        lowPrice: '15000',
        highPrice: '25000',
        offerCount: '3',
      },
    },
  ],
};

// ─── BreadcrumbList 빌더 ──────────────────────────────────────────────────────
export interface BreadcrumbItem {
  name: string;
  url: string;
}

export function buildBreadcrumbSchema(items: BreadcrumbItem[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };
}

// ─── 페이지별 사전 정의 브레드크럼 ────────────────────────────────────────────
export function getLocationsBreadcrumb(lang: string) {
  return buildBreadcrumbSchema([
    { name: 'Home', url: `${SITE_URL}/${lang}` },
    { name: 'Locations', url: `${SITE_URL}/${lang}/locations` },
  ]);
}

export function getServicesBreadcrumb(lang: string) {
  return buildBreadcrumbSchema([
    { name: 'Home', url: `${SITE_URL}/${lang}` },
    { name: 'Services', url: `${SITE_URL}/${lang}/services` },
  ]);
}

export function getDeliveryBreadcrumb(lang: string) {
  return buildBreadcrumbSchema([
    { name: 'Home', url: `${SITE_URL}/${lang}` },
    { name: 'Services', url: `${SITE_URL}/${lang}/services` },
    { name: 'Airport Delivery', url: `${SITE_URL}/${lang}/delivery/airport` },
  ]);
}

export function getStorageBreadcrumb(lang: string, branchName?: string, branchSlug?: string) {
  const items: BreadcrumbItem[] = [
    { name: 'Home', url: `${SITE_URL}/${lang}` },
    { name: 'Locations', url: `${SITE_URL}/${lang}/locations` },
  ];
  if (branchName && branchSlug) {
    items.push({ name: branchName, url: `${SITE_URL}/${lang}/storage/${branchSlug}` });
  }
  return buildBreadcrumbSchema(items);
}
