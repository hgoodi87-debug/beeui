export interface SeoLocation {
    slug: string;
    keywords: {
        ko: string;
        en: string;
        ja: string;
        zh: string;
        'zh-TW': string;
        'zh-HK': string;
    };
    titles: {
        ko: string;
        en: string;
        ja: string;
        zh: string;
        'zh-TW': string;
        'zh-HK': string;
    };
    descriptions: {
        ko: string;
        en: string;
        ja: string;
        zh: string;
        'zh-TW': string;
        'zh-HK': string;
    };
    intros: {
        ko: string;
        en: string;
        ja: string;
        zh: string;
        'zh-TW': string;
        'zh-HK': string;
    };
    faqs: {
        question: string;
        answer: {
            ko: string;
            en: string;
            ja: string;
            zh: string;
            'zh-TW': string;
            'zh-HK': string;
        };
    }[];
    relatedTipIds?: string[];
    relatedBranchIds: string[];
    touristSpots: {
        id: string;
        name: { ko: string; en: string; ja: string; zh: string; 'zh-TW': string; 'zh-HK': string; };
        description: { ko: string; en: string; ja: string; zh: string; 'zh-TW': string; 'zh-HK': string; };
        category: 'landmark' | 'shopping' | 'food' | 'culture' | 'nature';
        lat: number;
        lng: number;
        distance?: string;
    }[];
}

export const SEO_LOCATIONS: SeoLocation[] = [
    {
        slug: 'airport',
        relatedTipIds: ['shipping-to-airport', 'luggage-free-seoul'],
        keywords: {
            ko: '인천공항 짐보관, 김포공항 짐보관, 공항 캐리어 배송, 운서역 짐보관, 김해공항 짐보관',
            en: 'Airport luggage storage, Airport suitcase delivery, Incheon, Gimpo, Gimhae',
            ja: '空港 荷物預かり, 空港 キャリア配送, 仁川, 金浦, 金海',
            zh: '机场行李寄存, 机场行李配送, 仁川, 金浦, 金海',
            'zh-TW': '機場行李寄存, 機場行李配送, 仁川, 金浦, 金海',
            'zh-HK': '機場行李寄存, 機場行李配送, 仁川, 金浦, 金海'
        },
        titles: {
            ko: '인천·김포·김해공항 짐보관 & 배송 | Beeliber 공항 서비스 💅',
            en: 'Airport Luggage Storage & Delivery | Beeliber 💅',
            ja: '空港 荷物預かり & 配送 | Beeliber 💅',
            zh: '机场行李寄存 & 配送 | Beeliber 💅',
            'zh-TW': '機場行李寄存 & 配送 | Beeliber 💅',
            'zh-HK': '機場行李寄存 & 配送 | Beeliber 💅'
        },
        descriptions: {
            ko: '공항 도착 즉시 무거운 캐리어는 맡기세요. 호텔까지 당일 배송 서비스로 가볍게 시작하는 여행.',
            en: 'Drop off heavy bags as soon as you arrive. Start your trip light with same-day hotel delivery.',
            ja: '空港到着後すぐに重이 荷物을 預けて。ホテルへの当日配送サービスで身軽な旅のスタート。',
            zh: '抵达机场即刻寄放沉重行李。提供酒店当日配送，开启轻松之旅。',
            'zh-TW': '抵達機場即刻寄放沉重行李. 提供酒店當日配送, 開啟輕鬆之旅.',
            'zh-HK': '抵達 機場 即刻 寄放 沉重 行李. 提供 酒店 當日 配送, 開啟 輕鬆 之旅. 💅'
        },
        intros: {
            ko: '여행의 시작과 끝을 비리버의 프리미엄 공항 서비스와 함께하세요! 입국장에서 바로 짐을 맡기고 빈손으로 관광을 시작하거나, 출국 전 마중 나온 캐리어를 공항에서 편하게 받아보세요. 💅✨',
            en: 'Start and end your journey with Beeliber\'s premium airport services! Drop off bags at the arrivals and start sightseeing empty-handed. 💅✨',
            ja: '旅の始まりと終わりをBeeliberのプレミアム空港サービスと共に！到着ロビーで荷物を預けて身軽に観光へ. 💅✨',
            zh: '在机场畅享Beeliber高级服务！抵达后即刻寄放，开启轻松之旅，返程时在机场便捷取件。 💅✨',
            'zh-TW': '在 機場 暢享 Beeliber 高級 服務! 抵達 後 即刻 寄放, 開啟 輕鬆 之旅, 返程 時 在 機場 便捷 取件. 💅✨',
            'zh-HK': '在 機場 暢享 Beeliber 高級 服務! 抵達 後 即刻 寄放, 開啟 輕鬆 之旅, 返程 時 在 機場 便捷 取件. 💅✨'
        },
        faqs: [],
        relatedBranchIds: ['IN1T', 'IN2T', 'GMP', 'MBX-020', 'MBX-028'],
        touristSpots: []
    },
    {
        slug: 'hongdae',
        relatedTipIds: ['luggage-free-seoul', 'shipping-to-airport'],
        keywords: {
            ko: '홍대 짐보관, 홍대입구역 물품보관소, 홍대 캐리어 배송, 홍대 짐배송, 마포 짐보관',
            en: 'Hongdae luggage storage, Hongik Univ. Station luggage delivery, Mapo storage',
            ja: '弘大 荷物預かり, 弘大入口駅 荷物配送, 麻浦 荷物預かり',
            zh: '弘大行李寄存, 弘益大学站行李寄存, 麻浦行李寄存',
            'zh-TW': '弘大行李寄存, 弘益大學站行李寄存, 麻浦行李寄存',
            'zh-HK': '弘大行李寄存, 弘益大學站行李寄存, 麻浦行李寄存'
        },
        titles: {
            ko: '홍대입구역 & 연남동 짐보관 | Beeliber 핸즈프리 💅',
            en: 'Hongdae & Yeonnam Luggage Storage | Beeliber 💅',
            ja: '弘大入口駅 & 延南洞 荷物預かり | Beeliber 💅',
            zh: '弘大站 & 延南洞行李寄存 | Beeliber 💅',
            'zh-TW': '弘大站 & 延남洞行李寄存 | Beeliber 💅',
            'zh-HK': '弘大站 & 延남洞行李寄存 | Beeliber 💅'
        },
        descriptions: {
            ko: '홍대의 젊음과 예술! 무거운 짐 없이 자유롭게 거리 쇼핑과 맛집 탐방을 즐기세요.',
            en: 'Youth and Art in Hongdae! Enjoy shopping and cafes without heavy suitcases.',
            ja: '弘大の若さと芸術！重い荷物なしでショッピングやカフェを楽しんで。',
            zh: '在弘大开启活力之旅！告别沉重行李，尽情享受购物与美食。',
            'zh-TW': '在弘大開啟活力之旅！告別沉重行李，盡情享受購物與美食。',
            'zh-HK': '在 弘大 開啟 活力 之旅! 告別 沉重 行李, 盡情 享受 購物 與 美食. 💅'
        },
        intros: {
            ko: '홍대는 서울에서 가장 활기찬 곳이죠? 비리버 홍대/연남 센터에 짐을 맡기시면 연트럴파크 산책부터 홍대 레드로드 버스킹 구경까지 양손 자유롭게 즐길 수 있습니다. 💅✨',
            en: 'Hongdae is the most vibrant place in Seoul. Visit our centers and enjoy Yeonnam-dong and the Red Road empty-handed. 💅✨',
            ja: '弘大はソウルで最も活気あふれる場所！Beeliberの弘大・延南センターに預けて、延南洞から弘大のストリートパフォーマンスまで自由に。 💅✨',
            zh: '弘大是首尔最具活力的地方！将行李寄存在Beeliber弘大/延南中心，无忧散步延南洞，尽情打卡红色之路吧. 💅✨',
            'zh-TW': '弘大是首爾最具活力的地方！將行李寄存在Beeliber弘大/延南中心，無憂散步延南洞, 盡情打卡紅色之路吧. 💅✨',
            'zh-HK': '弘大是首爾最具活力的地方！將行李寄存在Beeliber弘大/延남中心, 無憂 散步 延南洞, 盡情 打卡 紅色之路吧. 💅✨'
        },
        faqs: [],
        relatedBranchIds: ['HBO', 'MYN', 'MBX-015', 'MMP'],
        touristSpots: [
            {
                id: 'hongdae-walking-street',
                category: 'culture',
                lat: 37.5562,
                lng: 126.9239,
                name: { ko: '홍대 걷고싶은 거리', en: 'Hongdae Walking Street', ja: '弘大歩きたい通り', zh: '弘大想散步的街道', 'zh-TW': '弘大想散步的街道', 'zh-HK': '弘大想散步的街道' },
                description: {
                    ko: '버스킹과 예술 공연이 끊이지 않는 홍대의 심장부입니다. 짐 없이 가볍게 축제를 즐기세요! ✨',
                    en: 'The heart of Hongdae with continuous performances. Enjoy festivals light as a feather! ✨',
                    ja: 'バスキングが絶えない弘大の心臓部です. 身軽にお祭りを楽しんで! ✨',
                    zh: '街头艺术表演不断的弘大核心. 告别行李, 轻松加入狂欢吧! ✨',
                    'zh-TW': '街頭 藝術 表演 不斷 의 弘大 核心. 告別 行李, 輕鬆 加入 狂歡吧! ✨',
                    'zh-HK': '街頭 藝術 表演 不斷 의 弘大 核心. 告別 行李, 輕鬆 加入 狂歡吧! ✨'
                }
            }
        ]
    },
    {
        slug: 'myeongdong',
        relatedTipIds: ['luggage-free-seoul'],
        keywords: {
            ko: '명동 짐보관, 명동역 물품보관소, 남대문시장 짐보관, 을지로 짐보관',
            en: 'Myeongdong luggage storage, Namdaemun Market storage, Euljiro delivery',
            ja: '明洞 荷物預かり, 南大門市場 荷物預かり, 乙支路 配送',
            zh: '明洞行李寄存, 南大门市场行李寄存, 乙支路行李配送',
            'zh-TW': '明洞行李寄存, 南大門市場行李寄存, 乙支路行李配送',
            'zh-HK': '明洞行李寄存, 南大門市場行李寄存, 乙支路行李配送'
        },
        titles: {
            ko: '명동·남대문 & 을지로 짐보관 | Beeliber 💅',
            en: 'Myeongdong & Namdaemun Storage | Beeliber 💅',
            ja: '明洞 & 南大門 荷物預かり | Beeliber 💅',
            zh: '明洞 & 南大门行李寄存 | Beeliber 💅',
            'zh-TW': '明洞 & 南大門行李寄存 | Beeliber 💅',
            'zh-HK': '明洞 & 南大門行李寄存 | Beeliber 💅'
        },
        descriptions: {
            ko: '쇼핑 천국 명동! 양손 가득 쇼핑백을 들고 다니지 마세요. 비리버가 안전하게 지켜드립니다.',
            en: 'Myeongdong shopping haven! Don\'t carry heavy bags. Beeliber keeps them safe.',
            ja: 'ショッピングの天国・明洞！両手いっぱいの荷物は持たないで。Beeliberが安全にお預かりします. ',
            zh: '购物天堂明洞！告别拎包重负，尽情血拼。Beeliber为您安全守护。',
            'zh-TW': '購物天堂明洞！告別拎包重負，盡情血拼。Beeliber為您安全守護。',
            'zh-HK': '購物 天堂 明洞! 告別 拎包 重負, 盡情 血拼. Beeliber 為 您 安全 守護. 💅'
        },
        intros: {
            ko: '명동 쇼핑 거리와 남대문 맛집 탐방! 수많은 쇼핑백은 명동 프리미엄 센터에 맡기시고 가볍게 돌아다니세요. 💅✨',
            en: 'Explore Myeongdong and Namdaemun! Leave your shopping bags at our premium centers. 💅✨',
            ja: '明洞と南大門を散策! たくさんの荷物はプレミアムセンターに預けて, 身軽に動きましょう. 💅✨',
            zh: '打卡明洞购物街和南大门美食! 把大大小小的购物袋寄存在高级中心, 开启轻松之旅. 💅✨',
            'zh-TW': '打卡明洞購物街和南大門美食! 把 大大小小 의 購物袋 寄存 在 高級 中心, 開啟 輕鬆 之旅. 💅✨',
            'zh-HK': '打卡 明洞 購物街 和 南大門 美食! 把 大大小小 의 購物袋 寄存 在 高級 中心, 開啟 輕鬆 之旅. 💅✨'
        },
        faqs: [],
        relatedBranchIds: ['MBX-016', 'MBX-009', 'MBX-007', 'MBX-013'],
        touristSpots: [
            {
                id: 'myeongdong-cathedral',
                category: 'culture',
                lat: 37.5631,
                lng: 126.9873,
                name: { ko: '명동성당', en: 'Myeongdong Cathedral', ja: '明洞聖堂', zh: '明洞圣堂', 'zh-TW': '명동성당', 'zh-HK': '명동성당' },
                description: {
                    ko: '한국 천주교의 상징이자 명동의 랜드마크입니다. 💅',
                    en: 'Symbol of Korean Catholicism and landmark of Myeongdong. 💅',
                    ja: '韓国カトリックの象徴であり、明洞のランドマーク。 💅',
                    zh: '韩国天主教的象征，也是明洞的地标。 💅',
                    'zh-TW': '韓國天주교의 象徵이자 명동의 랜드마크입니다. 💅',
                    'zh-HK': '韓國 天主教 의 象徵, 也是 명동 의 地標. 💅'
                }
            }
        ]
    },
    {
        slug: 'dongdaemun',
        relatedTipIds: ['luggage-free-seoul'],
        keywords: {
            ko: '동대문 짐보관, DDP 짐보관, 광장시장 짐보관, 충무로 짐보관',
            en: 'Dongdaemun luggage storage, DDP storage, Gwangjang Market',
            ja: '東大門 荷物預かり, DDP, 広蔵市場',
            zh: '东大门行李寄存, DDP, 广藏市场',
            'zh-TW': '东大门行李寄存, DDP, 廣藏市場',
            'zh-HK': '东大门行李寄存, DDP, 廣藏市場'
        },
        titles: {
            ko: '동대문 & 광장시장 짐보관 | Beeliber 핸즈프리 💅',
            en: 'Dongdaemun & Gwangjang Market Storage | Beeliber 💅',
            ja: '東大門 & 広蔵市場 荷物預かり | Beeliber 💅',
            zh: '东大门 & 广藏市场行李寄存 | Beeliber 💅',
            'zh-TW': '東大門 & 廣藏市場行李寄存 | Beeliber 💅',
            'zh-HK': '東대門 & 廣藏市場行李寄存 | Beeliber 💅'
        },
        descriptions: {
            ko: '패션의 성지 동대문과 먹거리 천국 광장시장! 무거운 짐은 맡기고 서울의 에너지를 200% 즐기세요.',
            en: 'Fashion in Dongdaemun and food in Gwangjang Market! Enjoy 200% of Seoul empty-handed.',
            ja: 'ファッションの聖地・東大門と食の天国・広蔵市場！荷物を預けてソウルの活気を感じて。',
            zh: '时尚圣地东大门与美食天堂广藏市场！告别行李身外物，200% 尽享首尔活力。',
            'zh-TW': '時尚聖地东大门與美食天堂廣藏市場! 告別行李身外物, 200% 盡享首爾活力.',
            'zh-HK': '時尚 聖地 東大門 與 美食 天堂 廣藏市場! 告別 行李 身外物, 200% 盡享 首爾 活力. 💅'
        },
        intros: {
            ko: '동대문 DDP의 야경과 광장시장의 육회, 빈손으로 정복하세요! 비리버 동대문/광장시장 지점이 당신의 짐을 완벽하게 지켜드립니다. 💅✨',
            en: 'Conquer DDP night view and Gwangjang food empty-handed! Our centers keep your bags perfectly safe. 💅✨',
            ja: 'DDPの夜景と広蔵市場の美食を身軽に！東大門・広蔵市場支店があなたの荷物をしっかり守ります。 💅✨',
            zh: '开启 DDP 夜景与广藏市场美食之旅! Beeliber 东大门/广藏市场店为您妥善保管行李. 💅✨',
            'zh-TW': '開啟 DDP 夜景與廣藏市場美食之旅! Beeliber 東大門/廣藏市場店 為 您 妥善 保管 行李. 💅✨',
            'zh-HK': '開啟 DDP 夜景 與 廣藏市場 美食 之旅! Beeliber 東大門/廣藏市場店 為 您 妥善 保管 行李. 💅✨'
        },
        faqs: [],
        relatedBranchIds: ['MDD', 'MGH', 'MBX-002', 'MBX-004'],
        touristSpots: [
            {
                id: 'ddp',
                category: 'culture',
                lat: 37.5665,
                lng: 127.0092,
                name: { ko: 'DDP (동대문디자인플라자)', en: 'DDP', ja: 'DDP (東大門デザインプラザ)', zh: 'DDP (东大门设计广场)', 'zh-TW': 'DDP (東大門設計廣場)', 'zh-HK': 'DDP' },
                description: {
                    ko: '세계 최대 규모의 3차원 비정형 건축물로 동대문의 랜드마크입니다. 💅',
                    en: 'The largest 3D atypical structure and a landmark of Dongdaemun. 💅',
                    ja: '世界最大規模の3次元非定型建築物で, 東大門のランドマークです. 💅',
                    zh: '世界上最大的三维非定型建筑, 东大门的地标. 💅',
                    'zh-TW': '世界上最大的三維非定型建築, 東大門 의 地標. 💅',
                    'zh-HK': '世界 最大 規模 의 三維 非定型 建築物, 東大門 의 地標. 💅'
                }
            }
        ]
    },
    {
        slug: 'bukchon',
        relatedTipIds: ['luggage-free-seoul'],
        keywords: {
            ko: '북촌 한옥마을 짐보관, 안국역 짐보관, 인사동 짐보관, 종로 짐보관',
            en: 'Bukchon luggage storage, Anguk Station, Insadong storage',
            ja: '北村 荷物預かり, 安国駅, 仁寺洞',
            zh: '北村行李寄存, 安国站, 仁寺洞',
            'zh-TW': '北村行李寄存, 安國站, 仁寺洞',
            'zh-HK': '北村行李寄存, 安國站, 仁寺洞'
        },
        titles: {
            ko: '북촌·안국 & 인사동 짐보관 | Beeliber 핸즈프리 여행 💅',
            en: 'Bukchon & Insadong Luggage Storage | Beeliber 💅',
            ja: '北村 & 仁寺洞 荷物預かり | Beeliber 💅',
            zh: '北村 & 仁寺洞行李寄存 | Beeliber 💅',
            'zh-TW': '北村 & 仁寺洞行李寄存 | Beeliber 💅',
            'zh-HK': '北村 & 仁寺洞行李寄存 | Beeliber 💅'
        },
        descriptions: {
            ko: '좁은 골목길과 한옥의 정취! 무거운 캐리어는 비리버에게 맡기고 북촌의 아름다움을 만끽하세요.',
            en: 'Narrow alleys and Hanok vibes! Leave your heavy suitcase and enjoy Bukchon.',
            ja: '細い路地と韓屋の情緒！重いキャリアは預けて北村の美しさを堪능して。',
            zh: '漫步传统韩屋小巷！告别沉身行李，尽情领略北村韵味。',
            'zh-TW': '漫步傳統韓屋小巷！告別沉身行李，盡情領略北村韻味。',
            'zh-HK': '漫步 傳統 韓屋 小巷! 告別 沉身 行李, 盡情 領略 北村 韻味. 💅'
        },
        intros: {
            ko: '북촌 한옥마을의 언덕길과 인사동 갤러리 투어! 비리버 안국/인사동 센터를 이용하시면 가벼운 발걸음으로 한국의 전통미를 발견할 수 있습니다. 💅✨',
            en: 'Bukchon hills and Insadong galleries! Visit our centers and discover traditional Korean beauty with a light step. 💅✨',
            ja: '北村韓屋村の坂道と仁寺洞のギャラリー巡り! 身軽に韓国の伝統美を発見しましょう. 💅✨',
            zh: '打卡北村韩屋村山道和仁寺洞画廊! 利用 Beeliber 中心, 身轻如燕地探索韩国传统之美. 💅✨',
            'zh-TW': '打卡北村韓屋村山道和仁寺洞畫廊! 利用 Beeliber 中心, 身輕如燕地 探索 韓國 傳統之美. 💅✨',
            'zh-HK': '打卡 北村 韓屋村 山道 和 仁寺洞 畫廊! 利用 Beeliber 中心, 身輕 如燕地 探索 韓國 傳統之美. 💅✨'
        },
        faqs: [],
        relatedBranchIds: ['MBX-001', 'MBX-003', 'MBX-014'],
        touristSpots: [
            {
                id: 'bukchon-hanok-village',
                category: 'culture',
                lat: 37.5826,
                lng: 126.9835,
                name: { ko: '북촌 한옥마을', en: 'Bukchon Hanok Village', ja: '北村韓屋村', zh: '北村韩屋村', 'zh-TW': '北村韓屋村', 'zh-HK': '북촌 한옥마을' },
                description: {
                    ko: '전통의 미가 살아있는 한옥 밀집 지역입니다. 💅',
                    en: 'Historic village with traditional Korean houses. 💅',
                    ja: '伝統的な美しさが残る韓屋が並ぶ場所. 💅',
                    zh: '保留着传统之美的韩屋密集区. 💅',
                    'zh-TW': '保留著傳統之美的韓屋密集區. 💅',
                    'zh-HK': '保留著 傳統之美 의 韓屋 密集區. 💅'
                }
            }
        ]
    },
    {
        slug: 'itaewon',
        relatedTipIds: ['luggage-free-seoul'],
        keywords: {
            ko: '이태원 짐보관, 한남동 짐보관, 용산 짐보관, 드래곤시티 짐보관',
            en: 'Itaewon luggage storage, Hannam-dong, Yongsan storage',
            ja: '梨泰院 荷物預かり, 漢南洞, 龍山',
            zh: '梨泰院行李寄存, 汉南洞, 龙山',
            'zh-TW': '梨泰院行李寄存, 漢南洞, 龍山',
            'zh-HK': '梨泰院行李寄存, 漢南洞, 龍山'
        },
        titles: {
            ko: '이태원 & 용산 드래곤시티 짐보관 | Beeliber 💅',
            en: 'Itaewon & Yongsan Storage | Beeliber 💅',
            ja: '梨泰院 & 龍山 荷物預かり | Beeliber 💅',
            zh: '梨泰院 & 龙山行李寄存 | Beeliber 💅',
            'zh-TW': '梨泰院 & 龍山行李寄存 | Beeliber 💅',
            'zh-HK': '梨泰院 & 龍山行李寄存 | Beeliber 💅'
        },
        descriptions: {
            ko: '언덕과 골목이 매력적인 이태원과 용산! 무거운 짐은 맡기고 힙한 감성을 마음껏 즐기세요.',
            en: 'Uphill roads and unique alleys in Itaewon! Drop off bags and enjoy the hip vibes.',
            ja: '坂道と路地が魅力の梨泰院と龍山！荷物を預けてヒップな感性を楽しんで。',
            zh: '魅力梨泰院与龙山！告别沉重行李，尽情探索特色街巷。',
            'zh-TW': '魅力梨泰院與龍山！告別沉重行李，盡情探索特色街巷。',
            'zh-HK': '魅力 梨泰院 與 龍山! 告別 沉重 行李, 盡情 探索 特色 街巷. 💅'
        },
        intros: {
            ko: '이태원의 앤티크 거리와 용산 드래곤시티의 럭셔리함! 비리버와 함께라면 그 어떤 비탈길도 가볍게 오를 수 있습니다. 💅✨',
            en: 'Antique street in Itaewon and luxury in Yongsan! With Beeliber, any hill is easy to climb. 💅✨',
            ja: '梨泰院のアンティーク通りと龍山のラグジュアリーさ! Beeliberがあればどんな坂道も楽々です. 💅✨',
            zh: '梨泰院古董街与龙山龙城的奢华感! 有了 Beeliber, 无惧地势高低, 轻盈前行. 💅✨',
            'zh-TW': '梨泰院古董街與龍山龍城的奢華感! 有了 Beeliber, 無懼 地勢 高低, 輕盈 前行. 💅✨',
            'zh-HK': '梨泰院 古董街 與 龍山 龍城 의 奢華感! 有了 Beeliber, 無懼 地勢 高低, 輕盈 前行. 💅✨'
        },
        faqs: [],
        relatedBranchIds: ['MIT', 'MBX-010', 'MYS'],
        touristSpots: [
            {
                id: 'itaewon-antique-street',
                category: 'culture',
                lat: 37.5342,
                lng: 126.9945,
                name: { ko: '이태원 앤티크 가구 거리', en: 'Itaewon Antique Street', ja: '梨泰院アンティーク家具通り', zh: '梨泰院古董家具街', 'zh-TW': '梨泰院古董家具街', 'zh-HK': '이태원 앤티크 가구 거리' },
                description: {
                    ko: '이색적인 소품과 앤티크 가구가 가득한 이태원의 명소입니다. 💅',
                    en: 'Exotic street with unique props and antique furniture. 💅',
                    ja: '異国情緒あふれる雑貨店や家具店が並ぶ. 💅',
                    zh: '充满异国情调的饰品和古董家具的梨泰院名胜. 💅',
                    'zh-TW': '充滿異國情調的飾品和古董家具的梨泰院名勝. 💅',
                    'zh-HK': '充滿 異國情調 의 飾品 과 古董家具 의 梨泰院 名勝. 💅'
                }
            }
        ]
    },
    {
        slug: 'gangnam',
        relatedTipIds: ['luggage-free-seoul'],
        keywords: {
            ko: '강남역 짐보관, 가로수길 짐보관, 신사역 짐보관, 삼성역 짐보관',
            en: 'Gangnam luggage storage, Sinsa Garosu-gil, Samsung storage',
            ja: '江南駅 荷物預かり, 新沙 街로樹通り, 三成',
            zh: '江南站行李寄存, 新沙林荫道, 三成',
            'zh-TW': '江南站行李寄存, 新沙林蔭道, 三成',
            'zh-HK': '江南站行李寄存, 新沙林蔭道, 三成'
        },
        titles: {
            ko: '강남역 & 가로수길 짐보관 | 비리버 프리미엄 💅',
            en: 'Gangnam & Sinsa Luggage Storage | Beeliber 💅',
            ja: '江南駅 & 街로樹通り 荷物預かり | Beeliber 💅',
            zh: '江南站 & 林荫道行李寄存 | Beeliber 💅',
            'zh-TW': '江南站 & 林蔭道行李寄存 | Beeliber 💅',
            'zh-HK': '江南站 & 林蔭道行李寄存 | Beeliber 💅'
        },
        descriptions: {
            ko: '트렌드의 중심 강남! 세련된 매장 쇼핑을 짐 걱정 없이 완벽하게 즐기세요.',
            en: 'Trendy Gangnam center! Enjoy shopping in stylish shops without bag worries.',
            ja: 'トレンドの中心・江南！洗練されたショップでのショッピングを、身軽に楽しんで。',
            zh: '潮流中心江南！告别行李，开启完美高级购物之旅。',
            'zh-TW': '潮流中心江南！告別行李，開啟完美高級購物之旅。',
            'zh-HK': '潮流 中心 江南! 告別 行李, 開啟 完美 高級 購物之旅. 💅'
        },
        intros: {
            ko: '강남의 세련된 감성 투어! 무거운 짐은 비리버 강남/신사 센터에 맡기고, 당신의 럭셔리한 하루에 온전히 집중하세요. 💅✨',
            en: 'Stylish tour in Gangnam! Leave heavy bags at Beeliber and focus on your luxury day. 💅✨',
            ja: '江南のスタイリッシュな旅! 重い荷物はBeeliberに預けて, ラグジュאリーな一日に集中しましょう. 💅✨',
            zh: '打卡时尚江南! 把沉重行李寄存在 Beeliber 江南/新沙中心, 身轻松享受奢华日常. 💅✨',
            'zh-TW': '打卡時尚江南! 把 沉重行李 寄存 在 Beeliber 江남/新사 中心, 身輕鬆享受奢華日常. 💅✨',
            'zh-HK': '打卡 時尚 江南! 把 沉重 行李 寄存 在 Beeliber 江남/新사 中心, 身 輕鬆 享受 奢華 日常. 💅✨'
        },
        faqs: [],
        relatedBranchIds: ['MGN', 'MSIS', 'MBX-006', 'MBX-012'],
        touristSpots: [
            {
                id: 'garosu-gil',
                category: 'shopping',
                lat: 37.5218,
                lng: 127.0226,
                name: { ko: '가로수길', en: 'Garosu-gil', ja: '街로樹通り', zh: '林荫道', 'zh-TW': '林蔭道', 'zh-HK': '가로수길' },
                description: {
                    ko: '감각적인 카페와 브랜드 숍이 가득한 서울의 트렌디한 거리입니다. 💅',
                    en: 'Seoul\'s trendy street with stylish brand shops. 💅',
                    ja: '感覚的なカフェやブランドショップが集まる通り. 💅',
                    zh: '遍布时尚品牌和特色咖啡屋的潮流地标. 💅',
                    'zh-TW': '遍布時尚品牌和特色咖啡屋的潮流地標. 💅',
                    'zh-HK': '遍布 時尚 品牌 和 特色 咖啡屋 의 潮流 地標. 💅'
                }
            }
        ]
    },
    {
        slug: 'yeouido',
        relatedTipIds: ['luggage-free-seoul'],
        keywords: {
            ko: '여의도 짐보관, 더현대 서울 짐보관, 한강공원 짐보관',
            en: 'Yeouido luggage storage, The Hyundai Seoul, Han River Park',
            ja: '汝矣島 荷物預かり, ザ・現代ソウル, 漢江公園',
            zh: '汝矣岛行李寄存, 现代百货首尔店, 汉江公园',
            'zh-TW': '汝矣島行李寄存, 現代百貨首爾店, 漢江公園',
            'zh-HK': '汝矣島行李寄存, 現代百貨首爾店, 漢江公園'
        },
        titles: {
            ko: '여의도 & 더현대 서울 짐보관 | Beeliber 핸즈프리 💅',
            en: 'Yeouido & The Hyundai Seoul Storage | Beeliber 💅',
            ja: '汝矣島 & ザ・現代ソウル 荷物預かり | Beeliber 💅',
            zh: '汝矣岛 & 现代百货首尔店行李寄存 | Beeliber 💅',
            'zh-TW': '汝矣島 & 現代百貨首爾店行李寄存 | Beeliber 💅',
            'zh-HK': '汝矣島 & 現代百貨首爾店行李寄存 | Beeliber 💅'
        },
        descriptions: {
            ko: '여의도 공원 피크닉과 더현대 서울 쇼핑! 무거운 짐은 맡기고 빈손으로 낭만을 즐기세요.',
            en: 'Yeouido park picnic and The Hyundai Seoul shopping! Enjoy romance without bags.',
            ja: '汝矣島公園のピクニックとザ・現代ソウルのショッピング！荷물을 預けて浪漫を楽しんで。',
            zh: '汉江公园野餐与现代百货购物！告别行李，尽享浪漫时光。',
            'zh-TW': '漢江公園野餐與現代百貨購物！告別行李，盡享浪漫時光.',
            'zh-HK': '漢江 公園 野餐 與 現代 百貨 購物! 告別 行李, 盡享 浪漫 時光. 💅'
        },
        intros: {
            ko: '여의도의 탁 트인 풍경과 쇼핑의 즐거움! 비리버 여의도 지점과 함께라면 거추장스러운 짐은 더 이상 방해물이 아닙니다. 💅✨',
            en: 'Yeouido views and shopping fun! With Beeliber, heavy tags are no longer an obstacle. 💅✨',
            ja: '汝矣島の開放的な景色とショッピングの楽しさ! Beeliberがあれば荷物はもう邪魔になりません. 💅✨',
            zh: '在汝矣岛畅享美景与购物! 有了 Beeliber, 沉重行李不再是您的绊脚石. 💅✨',
            'zh-TW': '在汝矣島暢享美景與購物！有了 Beeliber, 沉重 行李 不再은 您的 絆腳石. 💅✨',
            'zh-HK': '在 汝矣島 暢享 美景 與 購物! 有了 Beeliber, 沉重 行李 不再 是 您的 絆腳石. 💅✨'
        },
        faqs: [],
        relatedBranchIds: ['MBX-008'],
        touristSpots: [
            {
                id: 'yeouido-han-river-park',
                category: 'nature',
                lat: 37.5284,
                lng: 126.9321,
                name: { ko: '여의도 한강공원', en: 'Yeouido Han River Park', ja: '汝矣島漢江公園', zh: '汝矣岛汉江公园', 'zh-TW': '汝矣島漢江公園', 'zh-HK': '여의도 한강공원' },
                description: {
                    ko: '서울의 낭만이 가득한 한강공원입니다. 💅',
                    en: 'Romantic riverside park in Seoul. 💅',
                    ja: 'ソウルのロマンがつまった漢江公園. 💅',
                    zh: '充满首尔浪漫气息的汉江公园. 💅',
                    'zh-TW': '充滿首爾浪漫氣息的漢江公園. 💅',
                    'zh-HK': '充滿 首爾 浪漫 氣息 의 漢江 公園. 💅'
                }
            }
        ]
    },
    {
        slug: 'busan',
        relatedTipIds: ['shipping-to-airport'],
        keywords: {
            ko: '부산 짐보관, 부산역 짐보관, 해운대 짐보관, 광안리 짐보관, 남포동 짐보관',
            en: 'Busan luggage storage, Haeundae suitcase, Busan Stn',
            ja: '釜山 荷物預かり, 海雲台 荷物配送, 釜山駅',
            zh: '釜山行李寄存, 海云台行李配送, 釜山站',
            'zh-TW': '釜山行李寄存, 海雲台行李配送, 釜山站',
            'zh-HK': '釜山行李寄存, 海雲台行李配送, 釜山站'
        },
        titles: {
            ko: '부산 전역 짐보관 & 배송 | Beeliber 💅',
            en: 'Busan Luggage Storage & Delivery | Beeliber 💅',
            ja: '釜山 荷物預かり & 配送 | Beeliber 💅',
            zh: '釜山行李寄存 & 配送 | Beeliber 💅',
            'zh-TW': '釜山行李寄存 & 配送 | Beeliber 💅',
            'zh-HK': '釜山行李寄存 & 配送 | Beeliber 💅'
        },
        descriptions: {
            ko: '부산역 도착부터 해운대 해변까지! 무거운 짐은 맡기고 부산의 파도를 가볍게 즐기세요.',
            en: 'From Busan Stn to Haeundae Beach! Enjoy the waves without bag worries.',
            ja: '釜山駅到着から海雲台まで！重い荷物は預けて海を楽しんで。',
            zh: '从釜山站到海云台！告别行李，尽情感受大海气息。',
            'zh-TW': '從釜山站到海雲台！告別行李，盡情感受大海氣息。',
            'zh-HK': '從 釜山站 到 海雲台! 告別 行李, 盡情 感受 大海 氣息. 💅'
        },
        intros: {
            ko: '제2의 도시 부산, 비리버와 함께 가장 힙하게 여행하세요! 부산역, 광안리, 해운대 어디서든 당신의 여정을 가볍게 만들어 드립니다. 💅🌊',
            en: 'Travel Busan hip as it gets with Beeliber! We make your journey light at Busan Stn, Haeundae, and Gwangalli. 💅🌊',
            ja: '第二の都市・釜山, Beeliberと共に最高にヒップな旅を! 釜山駅, 海雲台, 広安里どこでも身軽に. 💅🌊',
            zh: '在釜山开启最时尚的旅行! 无论是在釜山站还是广安里、海云台, Beeliber 都能让您的旅程倍感轻松. 💅🌊',
            'zh-TW': '在釜山開啟最時尚的旅行! 無論是在釜山站還是廣安里, 海雲台, Beeliber 都能 讓 您的 旅程 倍感 輕鬆. 💅🌊',
            'zh-HK': '在 釜山 開啟 最 時尚 의 旅行! 無論 是 在 釜山站 還是 廣安里, 海雲台, Beeliber 都能 讓 您的 旅程 倍감 輕鬆. 💅🌊'
        },
        faqs: [],
        relatedBranchIds: ['MBX-026', 'MBX-025', 'MBX-029', 'MBX-030'],
        touristSpots: [
            {
                id: 'busan-haeundae-beach',
                category: 'nature',
                lat: 35.1587,
                lng: 129.1603,
                name: { ko: '해운대 해수욕장', en: 'Haeundae Beach', ja: '海雲台海水浴場', zh: '海云台海水浴场', 'zh-TW': '海雲台海水浴場', 'zh-HK': '해운대 해수욕장' },
                description: {
                    ko: '부산 최고의 랜드마크이자 대표 해변입니다. 💅',
                    en: 'Most iconic beach and landmark in Busan. 💅',
                    ja: '釜山最高のランドマークであり, 代表的なビーチ. 💅',
                    zh: '釜山最具代表性的地标海滩. 💅',
                    'zh-TW': '釜山最具代表性的地標海灘. 💅',
                    'zh-HK': '釜山 最 具 代表性 의 地標 海灘. 💅'
                }
            }
        ]
    },
    {
        slug: 'jeju',
        relatedTipIds: ['luggage-free-seoul'],
        keywords: {
            ko: '제주공항 짐보관, 동문시장 짐보관, 제주도 짐배송',
            en: 'Jeju luggage storage, Dongmun Market delivery',
            ja: '済州 荷物預かり, 東門市場 配送',
            zh: '济州行李寄存, 东门市场配送',
            'zh-TW': '濟州行李寄存, 東門市場配送',
            'zh-HK': '濟州行李寄存, 東門市場配送'
        },
        titles: {
            ko: '제주공항 & 동문시장 짐보관 | Beeliber 인 제주 💅',
            en: 'Jeju Airport & Dongmun Market Storage | Beeliber 💅',
            ja: '済州空港 & 東門市場 荷物預かり | Beeliber 💅',
            zh: '济州机场 & 东门市场行李寄存 | Beeliber 💅',
            'zh-TW': '濟州機場 & 東門市場行李寄存 | Beeliber 💅',
            'zh-HK': '濟州機場 & 東門市場行李寄存 | Beeliber 💅'
        },
        descriptions: {
            ko: '환상의 섬 제주! 비리버와 함께 빈손으로 가벼운 제주 여행을 시작하세요.',
            en: 'Fantasy island Jeju! Start your flight empty-handed with Beeliber.',
            ja: '幻想の島・済州！Beeliberで身軽な済州旅行をスタート。',
            zh: '奇幻岛屿济州！开启 Beeliber 陪伴下的轻松之旅。',
            'zh-TW': '奇幻島嶼濟州！開啟 Beeliber 陪伴下的輕鬆之旅。',
            'zh-HK': '奇幻 島嶼 濟州! 開啟 Beeliber 陪伴 下 의 輕鬆 之旅. 💅'
        },
        intros: {
            ko: '제주 공항부터 동문시장 야시장 탐방까지! 무거운 짐 걱정 말고 Beeliber와 함께 여유로운 섬 여행을 즐기세요. 💅🌴',
            en: 'From Jeju Airport to Dongmun night market! Enjoy a breezy island trip with Beeliber. 💅🌴',
            ja: '済州空港から東門市場の夜市巡りまで! Beeliberと共にゆったりとした島旅行を. 💅🌴',
            zh: '从济州机场到东门夜市! 告别行李身外物, 随 Beeliber 畅享悠闲海岛行. 💅🌴',
            'zh-TW': '從濟州機場到東門夜市！告別行李身外물, 隨 Beeliber 暢享 悠閒海島行. 💅🌴',
            'zh-HK': '從 濟州 機場 到 東門 夜市! 告別 行李 身外物, 隨 Beeliber 暢享 悠閒 海島行. 💅🌴'
        },
        faqs: [],
        relatedBranchIds: ['MBX-031', 'MBX-032'],
        touristSpots: [
            {
                id: 'jeju-dongmun-market',
                category: 'culture',
                lat: 33.5126,
                lng: 126.5281,
                name: { ko: '제주 동문시장', en: 'Jeju Dongmun Market', ja: '済州東門市場', zh: '济州东门 市场', 'zh-TW': '濟州東門市場', 'zh-HK': '제주 동문시장' },
                description: {
                    ko: '제주의 활기를 느낄 수 있는 대표 재래시장입니다. 💅',
                    en: 'The representative market in Jeju. 💅',
                    ja: '済州の活気を感じられる代表的な伝統市場. 💅',
                    zh: '可以感受济州活力的代表性传统市场. 💅',
                    'zh-TW': '可以感受濟州活力的代表性傳統市場. 💅',
                    'zh-HK': '可以 感受 濟州 活力 의 代表性 傳統 市場. 💅'
                }
            }
        ]
    },
    {
        slug: 'regional-cities',
        keywords: {
            ko: '전국 짐보관, 대구 짐보관, 광주 짐보관, 울산 짐보관, 수원 짐보관, 평택 짐보관',
            en: 'Nationwide luggage storage South Korea, Daegu, Suwon, Pyeongtaek',
            ja: '韓国全土 荷物預かり, 大邱, 水原, 平澤',
            zh: '韩国全境行李寄存, 大邱, 水原, 平泽',
            'zh-TW': '韓國全境行李寄存, 大邱, 水原, 平澤',
            'zh-HK': '韓國 全境 行李寄存, 大邱, 水原, 平澤'
        },
        titles: {
            ko: '대한민국 전역 거점 짐보관 | 비리버 네트워크 💅',
            en: 'Nationwide Luggage Network | Beeliber 💅',
            ja: '韓国全土 荷物預かり | Beeliber 💅',
            zh: '韩国全境行李寄存 | Beeliber 💅',
            'zh-TW': '韓國全境行李寄存 | Beeliber 💅',
            'zh-HK': '韓國 全境 行李寄存 | Beeliber 💅'
        },
        descriptions: {
            ko: '전국 어디서나 비리버의 프리미엄 핸즈프리 서비스를 만나보세요.',
            en: 'Experience Beeliber\'s premium hands-free service anywhere in Korea.',
            ja: '韓国中どこでもBeeliberのプレミアムハン즈프리サービスを体験して。',
            zh: '在韩国任何地方开启 Beeliber 高级免提服务。',
            'zh-TW': '在韓國任何地方開啟 Beeliber 高級免提服務。',
            'zh-HK': 'In 韓國 任何 地方 開啟 Beeliber 高級 免提 服務. 💅'
        },
        intros: {
            ko: '주요 도시와 교통 허브마다 위치한 비리버 파트너 센터! 대구, 광주, 수원 등 당신이 가는 그곳에 비리버가 항상 가벼운 여행을 위해 기다리고 있습니다. 💅✨',
            en: 'Beeliber partner centers in major cities and hubs! We are always there for your light travel in Daegu, Gwangju, Suwon, and more. 💅✨',
            ja: '主要都市や交通の拠点にあるBeeliberパートナーセンター! 大邱, 光州, 水原など, どこでも身軽な旅をサポートします. 💅✨',
            zh: '打卡各大城市及交通枢纽的 Beeliber 合作伙伴中心! 无论是在大邱、光州还是水原, Beeliber 始终如一为您提供便利. 💅✨',
            'zh-TW': '打卡各大城市及交通樞紐的 Beeliber 合作夥伴中心! 無論是在大邱, 光州 還是 水原, Beeliber 始終如一 為 您 提供 便利. 💅✨',
            'zh-HK': '打卡 各大 城市 及 交通 樞紐 의 Beeliber 合作 夥伴 中心! 無論 是 在 大邱, 光州 還是 水原, Beeliber 始終如一 為 您 提供 便利. 💅✨'
        },
        faqs: [],
        relatedBranchIds: ['MBX-017', 'MBX-018', 'MBX-019', 'MBX-021', 'MBX-023', 'MBX-024', 'MBX-027', 'MBX-033'],
        touristSpots: []
    }
];
