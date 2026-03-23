import type { SeoLocation } from './seoLocations.ts';

export interface StaticSeoMeta {
  title: string;
  description: string;
  keywords?: string;
}

export const SITE_URL = 'https://bee-liber.com';

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
