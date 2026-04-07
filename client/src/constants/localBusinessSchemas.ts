/**
 * localBusinessSchemas.ts
 * 지점별 Google LocalBusiness JSON-LD 스키마 상수
 * StorageLandingPage에서 SEO 컴포넌트의 schema prop으로 주입됨
 *
 * GEO 최적화: AI 검색 엔진(ChatGPT, Perplexity, Google AI Overviews)이
 * 각 지점을 구체적인 위치를 가진 독립 사업장으로 인식하도록 함
 */

export interface LocalBusinessSchema {
    '@context': 'https://schema.org';
    '@type': 'LocalBusiness';
    name: string;
    alternateName?: string;
    description: string;
    url: string;
    telephone: string;
    image: string;
    priceRange: string;
    address: {
        '@type': 'PostalAddress';
        streetAddress: string;
        addressLocality: string;
        addressRegion: string;
        postalCode?: string;
        addressCountry: string;
    };
    geo: {
        '@type': 'GeoCoordinates';
        latitude: number;
        longitude: number;
    };
    openingHoursSpecification: {
        '@type': 'OpeningHoursSpecification';
        dayOfWeek: string[];
        opens: string;
        closes: string;
    }[];
    aggregateRating?: {
        '@type': 'AggregateRating';
        ratingValue: string;
        reviewCount: string;
    };
    hasOfferCatalog: {
        '@type': 'OfferCatalog';
        name: string;
        itemListElement: {
            '@type': 'Offer';
            name: string;
            description: string;
            priceCurrency: string;
            price: string;
        }[];
    };
}

const EVERY_DAY = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const BEELIBER_PHONE = '+82-10-2922-7731';
const BEELIBER_URL = 'https://bee-liber.com';
const BEELIBER_IMAGE = 'https://firebasestorage.googleapis.com/v0/b/beeliber-main.firebasestorage.app/o/vc%2F1_background_cinematic_2k_202602230049.jpeg?alt=media&token=66532fb7-1f97-417f-8b7d-062e1f3a1b2b';

const STORAGE_OFFERS = [
    { '@type': 'Offer' as const, name: 'Handbag / Shopping Bag Storage (4h)', description: 'Handbag and shopping bag storage — base 4 hours', priceCurrency: 'KRW', price: '4000' },
    { '@type': 'Offer' as const, name: 'Suitcase / Carrier Storage (4h)', description: 'Suitcase and carrier storage — base 4 hours', priceCurrency: 'KRW', price: '5000' },
    { '@type': 'Offer' as const, name: 'Stroller / Bicycle Storage (4h)', description: 'Stroller and bicycle storage — base 4 hours', priceCurrency: 'KRW', price: '10000' },
];

const DELIVERY_OFFERS = [
    { '@type': 'Offer' as const, name: 'Same-Day Airport Delivery — Handbag', description: 'Same-day delivery to Incheon / Gimpo Airport', priceCurrency: 'KRW', price: '15000' },
    { '@type': 'Offer' as const, name: 'Same-Day Airport Delivery — Suitcase', description: 'Same-day delivery to Incheon / Gimpo Airport', priceCurrency: 'KRW', price: '20000' },
];

// ─── 지점별 스키마 ────────────────────────────────────────────────────────────

export const LOCAL_BUSINESS_SCHEMAS: Record<string, LocalBusinessSchema[]> = {

    /** 공항 */
    airport: [
        {
            '@context': 'https://schema.org',
            '@type': 'LocalBusiness',
            name: 'Beeliber 仁川機場T1 行李寄放',
            alternateName: '빌리버 인천공항 T1',
            description: '仁川機場T1 3樓出境大廳A櫃台。提供機場行李寄放及首爾市區行李配送服務。Seoul luggage storage & airport delivery at Incheon T1.',
            url: `${BEELIBER_URL}/zh-tw/storage/airport`,
            telephone: BEELIBER_PHONE,
            image: BEELIBER_IMAGE,
            priceRange: '₩₩',
            address: {
                '@type': 'PostalAddress',
                streetAddress: '공항로 272 인천국제공항 T1 3층 출국장 A카운터',
                addressLocality: 'Incheon',
                addressRegion: 'Incheon',
                postalCode: '22382',
                addressCountry: 'KR',
            },
            geo: { '@type': 'GeoCoordinates', latitude: 37.4485, longitude: 126.4525 },
            openingHoursSpecification: [{ '@type': 'OpeningHoursSpecification', dayOfWeek: EVERY_DAY, opens: '07:00', closes: '22:00' }],
            aggregateRating: { '@type': 'AggregateRating', ratingValue: '4.9', reviewCount: '420' },
            hasOfferCatalog: { '@type': 'OfferCatalog', name: 'Airport Luggage Services', itemListElement: DELIVERY_OFFERS },
        },
        {
            '@context': 'https://schema.org',
            '@type': 'LocalBusiness',
            name: 'Beeliber 仁川機場T2 行李寄放',
            alternateName: '빌리버 인천공항 T2',
            description: '仁川機場T2 3樓出境大廳H櫃台。Seoul same-day airport delivery & luggage storage at Incheon T2.',
            url: `${BEELIBER_URL}/zh-tw/storage/airport`,
            telephone: BEELIBER_PHONE,
            image: BEELIBER_IMAGE,
            priceRange: '₩₩',
            address: {
                '@type': 'PostalAddress',
                streetAddress: '제2터미널대로 446 인천국제공항 T2 3층 출국장 H카운터',
                addressLocality: 'Incheon',
                addressRegion: 'Incheon',
                postalCode: '22382',
                addressCountry: 'KR',
            },
            geo: { '@type': 'GeoCoordinates', latitude: 37.4687, longitude: 126.4344 },
            openingHoursSpecification: [{ '@type': 'OpeningHoursSpecification', dayOfWeek: EVERY_DAY, opens: '07:00', closes: '22:00' }],
            aggregateRating: { '@type': 'AggregateRating', ratingValue: '4.9', reviewCount: '380' },
            hasOfferCatalog: { '@type': 'OfferCatalog', name: 'Airport Luggage Services', itemListElement: DELIVERY_OFFERS },
        },
    ],

    /** 홍대 */
    hongdae: [
        {
            '@context': 'https://schema.org',
            '@type': 'LocalBusiness',
            name: 'Beeliber 弘大 行李寄放 (Bao店)',
            alternateName: '빌리버 홍대 바오점',
            description: '弘益大學站9號出口步行3分鐘。首爾弘大行李寄放，支援當日仁川機場配送。Seoul Hongdae luggage storage near Hongik University Station.',
            url: `${BEELIBER_URL}/zh-tw/storage/hongdae`,
            telephone: BEELIBER_PHONE,
            image: BEELIBER_IMAGE,
            priceRange: '₩₩',
            address: {
                '@type': 'PostalAddress',
                streetAddress: '홍익로2길 27-22',
                addressLocality: 'Seoul',
                addressRegion: 'Seoul',
                postalCode: '04065',
                addressCountry: 'KR',
            },
            geo: { '@type': 'GeoCoordinates', latitude: 37.5555529, longitude: 126.9244614 },
            openingHoursSpecification: [{ '@type': 'OpeningHoursSpecification', dayOfWeek: EVERY_DAY, opens: '10:00', closes: '22:00' }],
            aggregateRating: { '@type': 'AggregateRating', ratingValue: '4.9', reviewCount: '312' },
            hasOfferCatalog: { '@type': 'OfferCatalog', name: 'Hongdae Luggage Storage & Delivery', itemListElement: [...STORAGE_OFFERS, ...DELIVERY_OFFERS] },
        },
        {
            '@context': 'https://schema.org',
            '@type': 'LocalBusiness',
            name: 'Beeliber 延南 行李寄放 (延南店)',
            alternateName: '빌리버 연남점',
            description: '弘益大學站3號出口步行2分鐘。首爾延南洞行李寄放。Seoul Yeonnam-dong luggage storage near Hongik University Station Exit 3.',
            url: `${BEELIBER_URL}/zh-tw/storage/hongdae`,
            telephone: BEELIBER_PHONE,
            image: BEELIBER_IMAGE,
            priceRange: '₩₩',
            address: {
                '@type': 'PostalAddress',
                streetAddress: '월드컵북로2길 93',
                addressLocality: 'Seoul',
                addressRegion: 'Seoul',
                postalCode: '03980',
                addressCountry: 'KR',
            },
            geo: { '@type': 'GeoCoordinates', latitude: 37.5587971, longitude: 126.9248631 },
            openingHoursSpecification: [{ '@type': 'OpeningHoursSpecification', dayOfWeek: EVERY_DAY, opens: '10:00', closes: '21:00' }],
            aggregateRating: { '@type': 'AggregateRating', ratingValue: '4.8', reviewCount: '198' },
            hasOfferCatalog: { '@type': 'OfferCatalog', name: 'Yeonnam Luggage Storage & Delivery', itemListElement: [...STORAGE_OFFERS, ...DELIVERY_OFFERS] },
        },
    ],

    /** 명동 */
    myeongdong: [
        {
            '@context': 'https://schema.org',
            '@type': 'LocalBusiness',
            name: 'Beeliber 明洞 行李寄放',
            alternateName: '빌리버 명동점',
            description: '明洞站6號出口步行約3分鐘。首爾明洞行李寄放，退房後輕鬆購物。Seoul Myeongdong luggage storage near Myeongdong Station.',
            url: `${BEELIBER_URL}/zh-tw/storage/myeongdong`,
            telephone: BEELIBER_PHONE,
            image: BEELIBER_IMAGE,
            priceRange: '₩₩',
            address: {
                '@type': 'PostalAddress',
                streetAddress: '서울시 중구 명동길',
                addressLocality: 'Seoul',
                addressRegion: 'Seoul',
                addressCountry: 'KR',
            },
            geo: { '@type': 'GeoCoordinates', latitude: 37.5615, longitude: 126.9815 },
            openingHoursSpecification: [{ '@type': 'OpeningHoursSpecification', dayOfWeek: EVERY_DAY, opens: '09:00', closes: '21:00' }],
            aggregateRating: { '@type': 'AggregateRating', ratingValue: '4.8', reviewCount: '267' },
            hasOfferCatalog: { '@type': 'OfferCatalog', name: 'Myeongdong Luggage Storage & Delivery', itemListElement: [...STORAGE_OFFERS, ...DELIVERY_OFFERS] },
        },
    ],

    /** 성수 */
    seongsu: [
        {
            '@context': 'https://schema.org',
            '@type': 'LocalBusiness',
            name: 'Beeliber 聖水 行李寄放',
            alternateName: '빌리버 성수역점',
            description: '聖水站步行約3分鐘。首爾聖水洞行李寄放，輕鬆探索咖啡街與首爾森林。Seoul Seongsu luggage storage — cafe street & Seoul Forest access.',
            url: `${BEELIBER_URL}/zh-tw/storage/seongsu`,
            telephone: BEELIBER_PHONE,
            image: BEELIBER_IMAGE,
            priceRange: '₩₩',
            address: {
                '@type': 'PostalAddress',
                streetAddress: '서울시 성동구 연무장5가길 16',
                addressLocality: 'Seoul',
                addressRegion: 'Seoul',
                addressCountry: 'KR',
            },
            geo: { '@type': 'GeoCoordinates', latitude: 37.5435, longitude: 127.0561 },
            openingHoursSpecification: [{ '@type': 'OpeningHoursSpecification', dayOfWeek: EVERY_DAY, opens: '10:00', closes: '22:00' }],
            aggregateRating: { '@type': 'AggregateRating', ratingValue: '4.9', reviewCount: '143' },
            hasOfferCatalog: { '@type': 'OfferCatalog', name: 'Seongsu Luggage Storage & Delivery', itemListElement: [...STORAGE_OFFERS, ...DELIVERY_OFFERS] },
        },
    ],

    /** 강남 */
    gangnam: [
        {
            '@context': 'https://schema.org',
            '@type': 'LocalBusiness',
            name: 'Beeliber 江南 行李寄放',
            alternateName: '빌리버 강남역점',
            description: '江南站11號出口步行約3分鐘。首爾江南行李寄放，加羅樹路購物後輕鬆出行。Seoul Gangnam luggage storage near Gangnam Station.',
            url: `${BEELIBER_URL}/zh-tw/storage/gangnam`,
            telephone: BEELIBER_PHONE,
            image: BEELIBER_IMAGE,
            priceRange: '₩₩',
            address: {
                '@type': 'PostalAddress',
                streetAddress: '서울시 강남구 강남대로',
                addressLocality: 'Seoul',
                addressRegion: 'Seoul',
                addressCountry: 'KR',
            },
            geo: { '@type': 'GeoCoordinates', latitude: 37.5012, longitude: 127.0256 },
            openingHoursSpecification: [{ '@type': 'OpeningHoursSpecification', dayOfWeek: EVERY_DAY, opens: '10:00', closes: '22:00' }],
            aggregateRating: { '@type': 'AggregateRating', ratingValue: '4.8', reviewCount: '189' },
            hasOfferCatalog: { '@type': 'OfferCatalog', name: 'Gangnam Luggage Storage & Delivery', itemListElement: [...STORAGE_OFFERS, ...DELIVERY_OFFERS] },
        },
    ],

    /** 동대문 */
    dongdaemun: [
        {
            '@context': 'https://schema.org',
            '@type': 'LocalBusiness',
            name: 'Beeliber 東大門 行李寄放',
            alternateName: '빌리버 동대문점',
            description: '東大門歷史文化公園站步行約3分鐘。首爾東大門行李寄放。Seoul Dongdaemun luggage storage near DDP.',
            url: `${BEELIBER_URL}/zh-tw/storage/dongdaemun`,
            telephone: BEELIBER_PHONE,
            image: BEELIBER_IMAGE,
            priceRange: '₩₩',
            address: {
                '@type': 'PostalAddress',
                streetAddress: '서울시 중구 장충단로',
                addressLocality: 'Seoul',
                addressRegion: 'Seoul',
                addressCountry: 'KR',
            },
            geo: { '@type': 'GeoCoordinates', latitude: 37.5665, longitude: 127.0092 },
            openingHoursSpecification: [{ '@type': 'OpeningHoursSpecification', dayOfWeek: EVERY_DAY, opens: '10:00', closes: '21:00' }],
            hasOfferCatalog: { '@type': 'OfferCatalog', name: 'Dongdaemun Luggage Storage & Delivery', itemListElement: [...STORAGE_OFFERS, ...DELIVERY_OFFERS] },
        },
    ],

    /** 이태원 */
    itaewon: [
        {
            '@context': 'https://schema.org',
            '@type': 'LocalBusiness',
            name: 'Beeliber 梨泰院 行李寄放',
            alternateName: '빌리버 이태원지점',
            description: '梨泰院站3號出口步行5分鐘。首爾梨泰院行李寄放。Seoul Itaewon luggage storage.',
            url: `${BEELIBER_URL}/zh-tw/storage/itaewon`,
            telephone: BEELIBER_PHONE,
            image: BEELIBER_IMAGE,
            priceRange: '₩₩',
            address: {
                '@type': 'PostalAddress',
                streetAddress: '서울시 용산구 보광로 126',
                addressLocality: 'Seoul',
                addressRegion: 'Seoul',
                addressCountry: 'KR',
            },
            geo: { '@type': 'GeoCoordinates', latitude: 37.5340, longitude: 126.9946 },
            openingHoursSpecification: [{ '@type': 'OpeningHoursSpecification', dayOfWeek: EVERY_DAY, opens: '10:00', closes: '22:00' }],
            hasOfferCatalog: { '@type': 'OfferCatalog', name: 'Itaewon Luggage Storage & Delivery', itemListElement: [...STORAGE_OFFERS, ...DELIVERY_OFFERS] },
        },
    ],
};
