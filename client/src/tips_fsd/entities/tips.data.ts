
import { TipContent, AreaInfo } from './tips.types';

export const TIPS_DATA: TipContent[] = [
    {
        id: 'luggage-free-seoul',
        slug: 'luggage-free-seoul',
        title: {
            ko: '짐 없이 서울 24시간 즐기는 법 💅',
            en: 'Guide: 24 Hours in Seoul without Luggage',
            ja: 'ガイド: 荷物なしでソウル24時間を楽しむ方法',
            zh: '指南: 在首尔开启24小时无行李自由行'
        },
        content_type: 'attraction',
        area_slug: 'airport',
        summary: {
            ko: '체크아웃 후 공항 가기 전까지, 무거운 캐리어 없이 핫플레이스만 골라가는 법.',
            en: 'How to visit trendy spots without heavy bags after checkout and before airport.',
            ja: 'チェックアウト後、空港へ行くまで。重い荷物なしでホットスポットを巡るコツ.',
            zh: '从退房到登机前，教你如何告别行李负担，轻松打卡网红地.'
        },
        body: {
            ko: '서울 여행의 핵심은 "가벼움"입니다. 체크인 전후의 비어있는 시간을 캐리어와 사투하며 낭비하지 마세요. \n\n1. **호텔에서 공항으로 바로 송부**: 비리버 앱에서 예약 후 로비에 짐을 맡기면, 당신은 그 즉시 자유입니다. \n2. **마지막 카페 투어까지 완벽하게**: 체크아웃 후 남은 5시간, 비리버가 당신의 시간을 선물합니다. \n3. **인천공항에서 여유롭게 수령**: 여행을 마무리하고 공항에 도착했을 때, 당신의 짐은 이미 안전하게 기다리고 있습니다. ✨',
            en: 'The key to Seoul travel is "lightness." Don\'t waste the gaps before check-in or after check-out struggling with heavy luggage.',
        },
        cover_image_url: 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&q=80&w=1200',
        audience_tags: ['first-day', 'last-day'],
        theme_tags: ['service', 'guide', 'shopping', 'alone'],
        publish_status: 'published',
        language_available: ['ko', 'en', 'ja', 'zh'],
        
        // [스봉이] CMS 뼈대 구조 반영 🦴
        quality_score: 100,
        priority_score: 10,
        is_foreigner_friendly: true,
        forbidden_word_detected: false,
        
        created_at: '2026-03-17T00:00:00Z',
        updated_at: '2026-03-17T00:00:00Z'
    },
    // 더 많은 데이터는 실제 구현 시 SEO_LOCATIONS에서 루프를 돌리거나 매핑함.
];

export const AREAS_DATA: AreaInfo[] = [
    {
        id: 'hongdae',
        area_slug: 'hongdae',
        area_name: { ko: '홍대', en: 'Hongdae', ja: '弘大', zh: '弘大' },
        headline: { ko: '홍대입구역 & 연남동 짐보관 | Beeliber 핸즈프리 💅', en: 'Hongdae & Yeonnam Luggage Storage | Beeliber 💅' },
        intro_text: { ko: '홍대는 서울에서 가장 활기찬 곳이죠? 비리버 홍대/연남 센터에 짐을 맡기시면 연트럴파크 산책부터 홍대 레드로드 버스킹 구경까지 양손 자유롭게 즐길 수 있습니다. 💅✨', en: 'Hongdae is the most vibrant place in Seoul. Visit our centers and enjoy Yeonnam-dong and the Red Road empty-handed. 💅✨' },
        cover_image_url: 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?auto=format&fit=crop&q=80&w=1200',
        is_priority_area: true,
        relatedBranchIds: ['HBO', 'MYN', 'MBX-015', 'MMP']
    },
    {
        id: 'myeongdong',
        area_slug: 'myeongdong',
        area_name: { ko: '명동', en: 'Myeongdong', ja: '明洞', zh: '明洞' },
        headline: { ko: '명동·남대문 & 을지로 짐보관 | Beeliber 💅', en: 'Myeongdong & Namdaemun Storage | Beeliber 💅' },
        intro_text: { ko: '명동 쇼핑 거리와 남대문 맛집 탐방! 수많은 쇼핑백은 명동 프리미엄 센터에 맡기시고 가볍게 돌아다니세요. 💅✨', en: 'Explore Myeongdong and Namdaemun! Leave your shopping bags at our premium centers. 💅✨' },
        cover_image_url: 'https://images.unsplash.com/photo-1538481199705-c710c4e965fc?auto=format&fit=crop&q=80&w=1200',
        is_priority_area: true,
        relatedBranchIds: ['MBX-016', 'MBX-009', 'MBX-007', 'MBX-013']
    },
    {
        id: 'dongdaemun',
        area_slug: 'dongdaemun',
        area_name: { ko: '동대문', en: 'Dongdaemun', ja: '東大門', zh: '东大门' },
        headline: { ko: '동대문 & 광장시장 짐보관 | Beeliber 핸즈프리 💅', en: 'Dongdaemun & Gwangjang Market Storage | Beeliber 💅' },
        intro_text: { ko: '동대문 DDP의 야경과 광장시장의 육회, 빈손으로 정복하세요! 비리버 동대문/광장시장 지점이 당신의 짐을 완벽하게 지켜드립니다. 💅✨', en: 'Conquer DDP night view and Gwangjang food empty-handed! Our centers keep your bags perfectly safe. 💅✨' },
        cover_image_url: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?auto=format&fit=crop&q=80&w=1200',
        is_priority_area: true,
        relatedBranchIds: ['MDD', 'MGH', 'MBX-002', 'MBX-004']
    },
    {
        id: 'bukchon',
        area_slug: 'bukchon',
        area_name: { ko: '북촌/인사동', en: 'Bukchon/Insadong', ja: '北村/仁寺洞', zh: '北村/仁寺洞' },
        headline: { ko: '북촌·안국 & 인사동 짐보관 | Beeliber 핸즈프리 여행 💅', en: 'Bukchon & Insadong Luggage Storage | Beeliber 💅' },
        intro_text: { ko: '북촌 한옥마을의 언덕길과 인사동 갤러릴 투어! 비리버 안국/인사동 센터를 이용하시면 가벼운 발걸음으로 한국의 전통미를 발견할 수 있습니다. 💅✨', en: 'Bukchon hills and Insadong galleries! Visit our centers and discover traditional Korean beauty with a light step. 💅✨' },
        cover_image_url: 'https://images.unsplash.com/photo-1558714138-08f375c3db0a?auto=format&fit=crop&q=80&w=1200',
        is_priority_area: true,
        relatedBranchIds: ['MBX-001', 'MBX-003', 'MBX-014']
    },
    {
        id: 'itaewon',
        area_slug: 'itaewon',
        area_name: { ko: '이태원/용산', en: 'Itaewon/Yongsan', ja: '梨泰院/龍山', zh: '梨泰院/龙山' },
        headline: { ko: '이태원 & 용산 드래곤시티 짐보관 | Beeliber 💅', en: 'Itaewon & Yongsan Storage | Beeliber 💅' },
        intro_text: { ko: '이태원의 앤티크 거리와 용산 드래곤시티의 럭셔리함! 비리버와 함께라면 그 어떤 비탈길도 가볍게 오를 수 있습니다. 💅✨', en: 'Antique street in Itaewon and luxury in Yongsan! With Beeliber, any hill is easy to climb. 💅✨' },
        cover_image_url: 'https://images.unsplash.com/photo-1538332576228-eb5b4c4de6ec?auto=format&fit=crop&q=80&w=1200',
        is_priority_area: true,
        relatedBranchIds: ['MIT', 'MBX-010', 'MYS']
    },
    {
        id: 'gangnam',
        area_slug: 'gangnam',
        area_name: { ko: '강남/가로수길', en: 'Gangnam/Garosu-gil', ja: '江南/街路樹通り', zh: '江南/林荫道' },
        headline: { ko: '강남역 & 가로수길 짐보관 | 비리버 프리미엄 💅', en: 'Gangnam & Sinsa Luggage Storage | Beeliber 💅' },
        intro_text: { ko: '강남의 세련된 감성 투어! 무거운 짐은 비리버 강남/신사 센터에 맡기고, 당신의 럭셔리한 하루에 온전히 집중하세요. 💅✨', en: 'Stylish tour in Gangnam! Leave heavy bags at Beeliber and focus on your luxury day. 💅✨' },
        cover_image_url: 'https://images.unsplash.com/photo-1518599904199-0ca897819ddb?auto=format&fit=crop&q=80&w=1200',
        is_priority_area: true,
        relatedBranchIds: ['MGN', 'MSIS', 'MBX-006', 'MBX-012']
    }
];

export const THEMES_DATA = [
    {
        id: 'shopping',
        slug: 'shopping',
        title: { ko: '쇼핑 천국 🛍️', en: 'Shopping Heaven', ja: 'ショッピング天国', zh: '购物天堂' },
        description: { ko: '양손 가득 쇼핑백도 걱정 없는 비리버 루트', en: 'Hands-free luxury shopping routes' },
        cover_image_url: 'https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&q=80&w=1200'
    },
    {
        id: 'rainy',
        slug: 'rainy',
        title: { ko: '비 올 때 가기 좋은 곳 🌧️', en: 'Rainy Day Spots', ja: '雨の日におすすめ', zh: '雨天好去处' },
        description: { ko: '비 걱정 없이 실내에서 즐기는 서울의 낭만', en: 'Enjoy Seoul indoors without getting wet' },
        cover_image_url: 'https://images.unsplash.com/photo-1534067783941-51c9c23ecefd?auto=format&fit=crop&q=80&w=1200'
    },
    {
        id: 'alone',
        slug: 'alone',
        title: { ko: '혼자 여행하기 좋은 곳 🚶', en: 'Solo Traveler Picks', ja: '一人旅におすすめ', zh: '独自旅行推荐' },
        description: { ko: '누구의 눈치도 보지 않고 온전히 나에게 집중하는 시간', en: 'Focus on yourself with these solo-friendly spots' },
        cover_image_url: 'https://images.unsplash.com/photo-1503220317375-aaad61436b1b?auto=format&fit=crop&q=80&w=1200'
    }
];
