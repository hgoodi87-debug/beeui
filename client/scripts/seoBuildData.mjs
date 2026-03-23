export const SITE_URL = 'https://bee-liber.com';

export const SEO_DEFAULT_OG_IMAGE =
  'https://firebasestorage.googleapis.com/v0/b/beeliber-main.firebasestorage.app/o/vc%2F1_background_cinematic_2k_202602230049.jpeg?alt=media&token=66532fb7-1f97-417f-8b7d-062e1f3a1b2b';

export const STATIC_ROUTE_META = {
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

export const SEO_BUILD_LOCATIONS = [
  {
    slug: 'airport',
    areaLabel: '인천·김포·김해공항',
    storageTitle: '인천·김포·김해공항 짐보관 & 배송 | Beeliber 공항 서비스',
    storageDescription: '공항 도착 즉시 무거운 캐리어는 맡기세요. 호텔까지 당일 배송 서비스로 가볍게 시작하는 여행.',
    storageKeywords: '인천공항 짐보관, 김포공항 짐보관, 공항 캐리어 배송, 운서역 짐보관, 김해공항 짐보관',
  },
  {
    slug: 'hongdae',
    areaLabel: '홍대입구역 & 연남동',
    storageTitle: '홍대입구역 & 연남동 짐보관 | Beeliber 핸즈프리',
    storageDescription: '홍대의 젊음과 예술! 무거운 짐 없이 자유롭게 거리 쇼핑과 맛집 탐방을 즐기세요.',
    storageKeywords: '홍대 짐보관, 홍대입구역 물품보관소, 홍대 캐리어 배송, 홍대 짐배송, 마포 짐보관',
  },
  {
    slug: 'myeongdong',
    areaLabel: '명동·남대문 & 을지로',
    storageTitle: '명동·남대문 & 을지로 짐보관 | Beeliber',
    storageDescription: '쇼핑 천국 명동! 양손 가득 쇼핑백을 들고 다니지 마세요. 비리버가 안전하게 지켜드립니다.',
    storageKeywords: '명동 짐보관, 명동역 물품보관소, 남대문시장 짐보관, 을지로 짐보관',
  },
  {
    slug: 'dongdaemun',
    areaLabel: '동대문 & 광장시장',
    storageTitle: '동대문 & 광장시장 짐보관 | Beeliber 핸즈프리',
    storageDescription: '패션의 성지 동대문과 먹거리 천국 광장시장! 무거운 짐은 맡기고 서울의 에너지를 즐기세요.',
    storageKeywords: '동대문 짐보관, DDP 짐보관, 광장시장 짐보관, 충무로 짐보관',
  },
  {
    slug: 'bukchon',
    areaLabel: '북촌 & 삼청동',
    storageTitle: '북촌한옥마을 & 삼청동 짐보관 | Beeliber',
    storageDescription: '북촌한옥마을, 삼청동, 경복궁 산책을 더 가볍게. 무거운 짐은 맡기고 서울의 정취를 즐기세요.',
    storageKeywords: '북촌 짐보관, 삼청동 짐보관, 경복궁 짐보관, 안국역 짐보관',
  },
  {
    slug: 'itaewon',
    areaLabel: '이태원 & 한남',
    storageTitle: '이태원 & 한남동 짐보관 | Beeliber',
    storageDescription: '이태원과 한남동을 빈손으로 가볍게 즐기세요. 쇼핑과 식사, 카페 동선을 더 편하게 만듭니다.',
    storageKeywords: '이태원 짐보관, 한남동 짐보관, 서울 짐보관',
  },
  {
    slug: 'gangnam',
    areaLabel: '강남역 & 신논현',
    storageTitle: '강남역 & 신논현 짐보관 | Beeliber',
    storageDescription: '강남역, 신논현, 가로수길 이동 전 무거운 짐은 맡기고 더 가볍게 움직이세요.',
    storageKeywords: '강남 짐보관, 강남역 짐보관, 신논현 짐보관, 가로수길 짐보관',
  },
  {
    slug: 'yeouido',
    areaLabel: '여의도 & 더현대서울',
    storageTitle: '여의도 & 더현대서울 짐보관 | Beeliber',
    storageDescription: '더현대서울 쇼핑, IFC몰, 여의도 산책 전 짐을 맡기고 자유롭게 이동하세요.',
    storageKeywords: '여의도 짐보관, 더현대서울 짐보관, IFC몰 짐보관',
  },
  {
    slug: 'busan',
    areaLabel: '부산역 & 해운대',
    storageTitle: '부산역 & 해운대 짐보관 | Beeliber',
    storageDescription: '부산역에서 체크인 전후, 해운대 이동 전 짐보관과 당일 배송을 더 편하게 이용하세요.',
    storageKeywords: '부산역 짐보관, 해운대 짐보관, 부산 짐배송',
  },
  {
    slug: 'jeju',
    areaLabel: '제주공항 & 제주시',
    storageTitle: '제주공항 & 제주시 짐보관 | Beeliber',
    storageDescription: '제주공항 도착 직후 무거운 짐은 맡기고, 제주시와 제주 여행 일정을 더 가볍게 시작하세요.',
    storageKeywords: '제주공항 짐보관, 제주 짐보관, 제주시 짐보관',
  },
  {
    slug: 'regional-cities',
    areaLabel: '지역 관광도시',
    storageTitle: '지역 관광도시 짐보관 | Beeliber',
    storageDescription: '서울 밖 주요 관광도시에서도 짐보관과 연계 이동 동선을 더 가볍게 준비하세요.',
    storageKeywords: '지역 도시 짐보관, 관광도시 짐보관, 국내 여행 짐보관',
  },
];

export const ALL_PRERENDER_ROUTES = [
  { path: '/', group: 'core-static', source: 'static' },
  { path: '/locations', group: 'core-static', source: 'static' },
  { path: '/services', group: 'core-static', source: 'static' },
  { path: '/qna', group: 'core-static', source: 'static' },
  { path: '/tracking', group: 'core-static', source: 'static' },
  { path: '/partnership', group: 'core-static', source: 'static' },
  { path: '/vision', group: 'core-static', source: 'static' },
  { path: '/terms', group: 'core-static', source: 'static' },
  { path: '/privacy', group: 'core-static', source: 'static' },
  ...SEO_BUILD_LOCATIONS.map((location) => ({
    path: `/storage/${location.slug}`,
    group: 'storage-lander',
    source: 'seoLocations',
  })),
  ...SEO_BUILD_LOCATIONS.map((location) => ({
    path: `/delivery/${location.slug}`,
    group: 'delivery-lander',
    source: 'seoLocations',
  })),
];

export const buildStorageLanderMeta = (location) => ({
  title: location.storageTitle,
  description: location.storageDescription,
  keywords: location.storageKeywords,
});

export const buildDeliveryLanderMeta = (location) => ({
  title: `${location.areaLabel} 당일 짐배송 | 빌리버`,
  description: `${location.areaLabel}에서 인천공항, 호텔, 다음 목적지까지 당일 짐배송을 예약하세요. 체크아웃 후 무거운 캐리어 없이 바로 이동할 수 있습니다.`,
  keywords: `${location.storageKeywords}, ${location.areaLabel} 당일 짐배송, ${location.areaLabel} 공항 짐배송, 호텔 짐배송`,
});
