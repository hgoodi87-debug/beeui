import type { SeoLocation } from './seoLocations.ts';

export interface StaticSeoMeta {
  title: string;
  description: string;
  keywords?: string;
}

export const SITE_URL = 'https://bee-liber.com';

export type SeoLangCode = 'ko' | 'en' | 'ja' | 'zh-tw' | 'zh-hk' | 'zh';

export const SEO_DEFAULT_OG_IMAGE =
  'https://firebasestorage.googleapis.com/v0/b/beeliber-main.firebasestorage.app/o/vc%2F1_background_cinematic_2k_202602230049.jpeg?alt=media&token=66532fb7-1f97-417f-8b7d-062e1f3a1b2b';

export const STATIC_ROUTE_META: Record<string, StaticSeoMeta> = {
  '/': {
    title: '빌리버 | 서울 짐보관 · 인천공항 당일 짐배송',
    description:
      '홍대입구역, 서울역, 명동 등 주요 거점 짐 보관부터 인천공항 당일 짐배송까지. 체크아웃 후 무거운 캐리어 없이 가볍게 여행하세요.',
    keywords:
      '서울 짐보관, 인천공항 짐배송, 서울역 짐보관, 홍대 짐보관, 명동 짐보관, 호텔 체크아웃 짐보관, 당일 짐배송',
  },
  '/locations': {
    title: '지점 안내 | 빌리버 서울 짐보관 지점 찾기',
    description:
      '내 위치에서 가까운 빌리버 짐보관 지점과 운영시간, 예약 가능한 보관·배송 서비스를 확인하세요.',
  },
  '/services': {
    title: '서비스 안내 | 빌리버 짐보관 · 공항 당일 배송',
    description:
      '짐 보관, 공항 당일 배송, 이용 방법과 운영 범위를 한 번에 확인하세요.',
  },
  '/qna': {
    title: '자주 묻는 질문 | 빌리버',
    description:
      '예약, 취소·환불, 보관 안전, 지점 이용 방법까지 빌리버 FAQ를 확인하세요.',
  },
  '/tracking': {
    title: '예약 조회 | 빌리버 배송 상태 확인',
    description: '예약자 정보로 현재 짐 보관·배송 상태를 간편하게 확인하세요.',
  },
  '/partnership': {
    title: '제휴 문의 | 빌리버 파트너십',
    description:
      '호텔, 환전소, 리테일 공간과 함께 빌리버 짐보관 제휴를 시작하세요.',
  },
  '/vision': {
    title: '비전과 로드맵 | 빌리버',
    description: '빌리버의 서비스 확장 방향과 운영 로드맵을 확인하세요.',
  },
  '/terms': {
    title: '이용약관 | 빌리버',
    description: '빌리버 서비스 이용약관과 예약 조건을 확인하세요.',
  },
  '/privacy': {
    title: '개인정보처리방침 | 빌리버',
    description: '빌리버의 개인정보 수집, 이용, 보관 정책을 확인하세요.',
  },
};

// 라우트별 6개 언어 메타 — SEO.tsx에서 lang prop 기반으로 선택
export const MULTILANG_ROUTE_META: Record<string, Partial<Record<SeoLangCode, StaticSeoMeta>>> = {
  '/': {
    ko: { title: '빌리버 | 서울 짐보관 · 인천공항 당일 짐배송', description: '홍대입구역, 서울역, 명동 등 주요 거점 짐 보관부터 인천공항 당일 짐배송까지. 체크아웃 후 무거운 캐리어 없이 가볍게 여행하세요.', keywords: '서울 짐보관, 인천공항 짐배송, 서울역 짐보관, 홍대 짐보관, 명동 짐보관, 당일 짐배송' },
    en: { title: 'Beeliber | Seoul Luggage Storage · Same-Day Airport Delivery', description: 'Store your luggage at Hongdae, Seongsu, Myeongdong and more. Same-day delivery to Incheon Airport. Travel light after check-out!', keywords: 'Seoul luggage storage, Incheon airport luggage delivery, Hongdae luggage storage, Seongsu luggage storage' },
    ja: { title: 'Beeliber | ソウル荷物預かり · 仁川空港当日配送', description: '弘大、聖水、明洞など主要拠点で荷物預かり、仁川空港への当日配送。チェックアウト後は手ぶらでソウルを満喫！', keywords: 'ソウル荷物預かり, 仁川空港荷物配送, ホンデ荷物預かり, 韓国旅行荷物' },
    'zh-tw': { title: 'Beeliber 行李寄放 | 首爾寄放行李 · 仁川機場當日配送', description: '弘大、聖水、明洞等主要據點寄放行李，仁川機場當日配送。退房後輕鬆暢遊首爾！', keywords: '首爾寄放行李, 韓國行李寄存, 仁川機場行李配送, 聖水寄物, 弘大寄放行李' },
    'zh-hk': { title: 'Beeliber 行李寄存 | 首爾寄存行李 · 仁川機場即日配送', description: '弘大、聖水、明洞等主要據點寄存行李，仁川機場即日配送。退房後輕鬆暢遊首爾！', keywords: '首爾寄存行李, 韓國行李寄存, 仁川機場行李配送, 弘大寄存行李' },
    zh: { title: 'Beeliber 行李寄存 | 首尔寄存行李 · 仁川机场当日配送', description: '弘大、首尔站、明洞等主要据点寄存行李，仁川机场当日配送。退房后轻松畅游首尔！', keywords: '首尔寄存行李, 韩国行李寄存, 仁川机场行李配送, 弘大寄存行李' },
  },
  '/locations': {
    ko: { title: '지점 안내 | 빌리버 서울 짐보관 지점 찾기', description: '내 위치에서 가까운 빌리버 짐보관 지점과 운영시간, 예약 가능한 보관·배송 서비스를 확인하세요.' },
    en: { title: 'Branch Locations | Beeliber Seoul Luggage Storage', description: 'Find the nearest Beeliber luggage storage branch, check hours and reserve storage or delivery.' },
    ja: { title: '店舗案内 | Beeliber ソウル荷物預かり拠点', description: '最寄りのBeeliber荷物預かり拠点と営業時間、保管・配送予約を確認できます。' },
    'zh-tw': { title: '據點查詢 | Beeliber 首爾行李寄放據點', description: '查詢最近的Beeliber行李寄放據點、營業時間及寄放·配送預約。' },
    'zh-hk': { title: '據點查詢 | Beeliber 首爾行李寄存據點', description: '查詢最近的Beeliber行李寄存據點、營業時間及寄存·配送預約。' },
    zh: { title: '据点查询 | Beeliber 首尔行李寄存据点', description: '查询最近的Beeliber行李寄存据点、营业时间及寄存·配送预约。' },
  },
  '/services': {
    ko: { title: '서비스 안내 | 빌리버 짐보관 · 공항 당일 배송', description: '짐 보관, 공항 당일 배송, 이용 방법과 운영 범위를 한 번에 확인하세요.' },
    en: { title: 'Services | Beeliber Luggage Storage & Same-Day Airport Delivery', description: 'Luggage storage, same-day airport delivery, pricing and service coverage — all in one place.' },
    ja: { title: 'サービス案内 | Beeliber 荷物預かり · 空港当日配送', description: '荷物預かり、空港当日配送、ご利用方法と対応エリアをまとめてご確認いただけます。' },
    'zh-tw': { title: '服務介紹 | Beeliber 行李寄放 · 機場當日配送', description: '行李寄放、機場當日配送、使用方式與服務範圍一次查清楚。' },
    'zh-hk': { title: '服務介紹 | Beeliber 行李寄存 · 機場即日配送', description: '行李寄存、機場即日配送、使用方式與服務範圍一次查清楚。' },
    zh: { title: '服务介绍 | Beeliber 行李寄存 · 机场当日配送', description: '行李寄存、机场当日配送、使用方式与服务范围一次查清楚。' },
  },
  '/qna': {
    ko: { title: '자주 묻는 질문 | 빌리버', description: '예약, 취소·환불, 보관 안전, 지점 이용 방법까지 빌리버 FAQ를 확인하세요.' },
    en: { title: 'FAQ | Beeliber', description: 'Find answers about reservations, cancellations, luggage safety, and how to use our branches.' },
    ja: { title: 'よくある質問 | Beeliber', description: '予約・キャンセル・荷物安全・店舗利用方法についてのFAQをご確認ください。' },
    'zh-tw': { title: '常見問題 | Beeliber', description: '預約、取消退款、行李安全、據點使用方式等常見問題解答。' },
    'zh-hk': { title: '常見問題 | Beeliber', description: '預約、取消退款、行李安全、據點使用方式等常見問題解答。' },
    zh: { title: '常见问题 | Beeliber', description: '预约、取消退款、行李安全、据点使用方式等常见问题解答。' },
  },
  '/tracking': {
    ko: { title: '예약 조회 | 빌리버 배송 상태 확인', description: '예약자 정보로 현재 짐 보관·배송 상태를 간편하게 확인하세요.' },
    en: { title: 'Track Order | Beeliber', description: 'Check your current luggage storage or delivery status with your booking information.' },
    ja: { title: '予約確認 | Beeliber', description: '予約情報で荷物の保管・配送状況をかんたんに確認できます。' },
    'zh-tw': { title: '查詢預約 | Beeliber', description: '以預約資訊查詢行李寄放·配送目前狀態。' },
    'zh-hk': { title: '查詢預約 | Beeliber', description: '以預約資訊查詢行李寄存·配送目前狀態。' },
    zh: { title: '查询预约 | Beeliber', description: '以预约信息查询行李寄存·配送目前状态。' },
  },
  '/partnership': {
    ko: { title: '제휴 문의 | 빌리버 파트너십', description: '호텔, 환전소, 리테일 공간과 함께 빌리버 짐보관 제휴를 시작하세요.' },
    en: { title: 'Partnership | Beeliber', description: 'Partner with Beeliber for luggage storage at hotels, exchange offices, and retail spaces.' },
    ja: { title: 'パートナーシップ | Beeliber', description: 'ホテル・両替所・リテールスペースとBeeliber荷物預かり提携を開始しましょう。' },
    'zh-tw': { title: '合作洽詢 | Beeliber', description: '與飯店、換錢所、零售空間合作Beeliber行李寄放服務。' },
    'zh-hk': { title: '合作洽詢 | Beeliber', description: '與飯店、換錢所、零售空間合作Beeliber行李寄存服務。' },
    zh: { title: '合作洽询 | Beeliber', description: '与酒店、换汇处、零售空间合作Beeliber行李寄存服务。' },
  },
  '/vision': {
    ko: { title: '비전과 로드맵 | 빌리버', description: '빌리버의 서비스 확장 방향과 운영 로드맵을 확인하세요.' },
    en: { title: 'Vision & Roadmap | Beeliber', description: "Learn about Beeliber's service expansion direction and operational roadmap." },
    ja: { title: 'ビジョンとロードマップ | Beeliber', description: 'Beeliberのサービス拡大方向と運営ロードマップをご確認ください。' },
    'zh-tw': { title: '品牌願景 | Beeliber', description: '了解Beeliber的服務擴展方向與營運路線圖。' },
    'zh-hk': { title: '品牌願景 | Beeliber', description: '了解Beeliber的服務擴展方向與營運路線圖。' },
    zh: { title: '品牌愿景 | Beeliber', description: '了解Beeliber的服务扩展方向与运营路线图。' },
  },
  '/terms': {
    ko: { title: '이용약관 | 빌리버', description: '빌리버 서비스 이용약관과 예약 조건을 확인하세요.' },
    en: { title: 'Terms of Service | Beeliber', description: 'Read Beeliber service terms and reservation conditions.' },
    ja: { title: '利用規約 | Beeliber', description: 'Beeliber利用規約と予約条件をご確認ください。' },
    'zh-tw': { title: '服務條款 | Beeliber', description: '查閱Beeliber服務條款與預約條件。' },
    'zh-hk': { title: '服務條款 | Beeliber', description: '查閱Beeliber服務條款與預約條件。' },
    zh: { title: '服务条款 | Beeliber', description: '查阅Beeliber服务条款与预约条件。' },
  },
  '/privacy': {
    ko: { title: '개인정보처리방침 | 빌리버', description: '빌리버의 개인정보 수집, 이용, 보관 정책을 확인하세요.' },
    en: { title: 'Privacy Policy | Beeliber', description: "Review Beeliber's data collection, usage, and retention policies." },
    ja: { title: 'プライバシーポリシー | Beeliber', description: 'Beeliberの個人情報収集・利用・保管ポリシーをご確認ください。' },
    'zh-tw': { title: '隱私政策 | Beeliber', description: '查閱Beeliber的個人資料收集、使用及保存政策。' },
    'zh-hk': { title: '隱私政策 | Beeliber', description: '查閱Beeliber的個人資料收集、使用及保存政策。' },
    zh: { title: '隱私政策 | Beeliber', description: '查閱Beeliber的個人資料收集、使用及保存政策。' },
  },
  '/refund': {
    ko: { title: '환불 정책 | 빌리버', description: '빌리버 예약 취소 및 환불 정책을 확인하세요.' },
    en: { title: 'Refund Policy | Beeliber', description: 'Check Beeliber cancellation and refund policy.' },
    ja: { title: '返金ポリシー | Beeliber', description: 'Beeliberのキャンセル・返金ポリシーをご確認ください。' },
    'zh-tw': { title: '退款政策 | Beeliber', description: '查閱Beeliber預約取消及退款政策。' },
    'zh-hk': { title: '退款政策 | Beeliber', description: '查閱Beeliber預約取消及退款政策。' },
    zh: { title: '退款政策 | Beeliber', description: '查阅Beeliber预约取消及退款政策。' },
  },
};

// lang + path 기반 메타 조회 헬퍼
export const getLocalizedRouteMeta = (lang: string, cleanPath: string): StaticSeoMeta | undefined => {
  const pathMeta = MULTILANG_ROUTE_META[cleanPath];
  if (!pathMeta) return undefined;
  const langKey = lang.toLowerCase() as SeoLangCode;
  return pathMeta[langKey] ?? pathMeta['ko'];
};

const extractLanderAreaLabel = (location: SeoLocation) => {
  const baseTitle = location.titles.ko.split('|')[0]?.trim() || location.slug;
  return baseTitle.replace(/\s*짐보관.*$/, '').trim();
};

export const buildStorageLanderMeta = (location: SeoLocation): StaticSeoMeta => ({
  title: location.titles.ko,
  description: location.descriptions.ko,
  keywords: location.keywords.ko,
});

export const buildDeliveryLanderMeta = (location: SeoLocation): StaticSeoMeta => {
  const areaLabel = extractLanderAreaLabel(location);
  return {
    title: `${areaLabel} 당일 짐배송 | 빌리버`,
    description: `${areaLabel}에서 인천공항, 호텔, 다음 목적지까지 당일 짐배송을 예약하세요. 체크아웃 후 무거운 캐리어 없이 바로 이동할 수 있습니다.`,
    keywords: `${location.keywords.ko}, ${areaLabel} 당일 짐배송, ${areaLabel} 공항 짐배송, 호텔 짐배송`,
  };
};
