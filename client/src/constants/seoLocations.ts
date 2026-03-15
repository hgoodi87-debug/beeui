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
        distance?: string;
    }[];
}

export const SEO_LOCATIONS: SeoLocation[] = [
    {
        slug: 'hongdae',
        relatedTipIds: ['luggage-free-seoul', 'shipping-to-airport'],
        keywords: {
            ko: '홍대 짐보관, 홍대입구역 물품보관소, 홍대 캐리어 배송, 홍대 짐배송, 홍대입구역 짐보관',
            en: 'Hongdae luggage storage, Hongik Univ. Station luggage delivery, Hongdae suitcase storage, Hongdae locker',
            ja: '弘大 荷物預かり, 弘大入口駅 コ인로커, 弘大 キャリア配送, 弘大 荷物配送',
            zh: '弘大行李寄存, 弘益大学站行李寄存, 弘大行李配送, 弘大机场配送',
            'zh-TW': '弘大行李寄存, 弘益大學站行李寄存, 弘大行李配送, 弘大機場配送',
            'zh-HK': '弘大行李寄存, 弘益大學站行李寄存, 弘大行李配送, 弘大機場配送'
        },
        titles: {
            ko: '홍대입구역 짐보관 & 캐리어 배송 | Beeliber 핸즈프리 여행 💅',
            en: 'Hongdae Luggage Storage & Suitcase Delivery | Beeliber 💅',
            ja: '弘大入口駅 荷물預かり & キャリア配送 | Beeliber 💅',
            zh: '弘大行李寄存 & 行李当日配送 | Beeliber 💅',
            'zh-TW': '弘大行李寄存 & 行李當日配送 | Beeliber 💅',
            'zh-HK': '弘대行李寄存 & 行李當日配送 | Beeliber 💅'
        },
        descriptions: {
            ko: '홍대입구역 9번 출구 3분 거리. 무거운 캐리어는 홍대에 맡기고 가볍게 여행하세요. 호텔/공항 당일 배송 가능.',
            en: '3 min walk from Hongik Univ. Stn Exit 9. Leave your heavy luggage in Hongdae and travel light. Same-day delivery available.',
            ja: '弘大入口駅9番出口から徒歩3分。重い荷物は弘大に預けて、身軽に旅行を楽しみましょう。当日配送対応。',
            zh: '距离弘大站9号出口仅3分钟。把沉重的行李留在弘大，轻松开启旅程。提供酒店/机场当日配送服务。',
            'zh-TW': '距離弘大站9號出口僅3分鐘。把沉重的行李留在弘大，輕鬆開啟旅程。提供酒店/機場當日配送服務。',
            'zh-HK': '距離弘大站9號出口僅3分鐘. 把 沉重行李 留在 弘大, 輕鬆 開啟旅程. 提供酒店/機場當일配送服務.'
        },
        intros: {
            ko: '홍대는 서울의 젊음과 예술이 가득한 곳입니다. 무거운 짐 없이 거리 공연과 쇼핑을 즐겨보세요. \n\n비리버 홍대 센터는 홍대입구역 9번 출구에서 단 3분 거리에 위치하고 있습니다. 짐을 맡긴 뒤 연남동 카페거리에서 피크닉을 즐기거나, 밤 늦게까지 이어지는 홍대의 에너지를 만끽하세요. 당신의 캐리어는 저희가 안전하게 지키고 있을게요. 💅',
            en: 'Hongdae is full of youth and art. Enjoy street performances and shopping without heavy bags. \n\nBeeliber Hongdae Center is just a 3-minute walk from Exit 9 of Hongik Univ. Station. After dropping your bags, enjoy a picnic in Yeonnam-dong or the vibrant energy of Hongdae that lasts late into the night. We\'ll keep your luggage safe. 💅',
            ja: '弘大はソウルの若さと芸術が溢れる場所です。重い荷物なしでストリートパフォーマンスやショッピングを楽しんでください。\n\nBeeliber弘大センターは弘大入口駅9番出口からわずか3分の場所にあります。荷物を預けた後は、延南洞のカフェ通りでピクニックを楽しんだり、夜遅くまで続く弘大のエネルギーを満喫してください。あなたのキャリアは私たちが安全にお守りします。 💅',
            zh: '弘大充满活力和艺术。无忧享受街头表演和购物。\n\nBeeliber弘大中心距离弘益大学站9号出口仅3分钟路程。寄存在此后，您可以去延南洞咖啡街野餐，或者尽情感受弘大深夜依然火热的活力。您的行李箱将由我们守护。💅',
            'zh-TW': '弘大充滿活力和藝術。無憂享受街頭表演和購物。\n\nBeeliber弘大中心距離弘益大學站9號出口僅3分鐘路程. 寄存在 此後, 您可以 去 延伸洞 咖啡街 野餐, 或 盡情 感受 弘大深夜 依然 火熱的 活力. 您的 行李箱은 由 我們 守護.💅',
            'zh-HK': '弘大充滿活力和藝術。無憂享受街頭表演和購物。\n\nBeeliber弘大中心距離弘益大學站9號出口僅3分鐘路程. 寄存在 此後, 您可以 去 延伸洞 咖啡街 野餐, 或 盡情 感受 弘大深夜 依然 火熱的 活力. 您的 行李箱은 由 我們 守護.💅'
        },
        faqs: [
            {
                question: 'How long can I store bags in Hongdae?',
                answer: {
                    ko: '최대 30일까지 보관 가능하며, 비리버의 프리미엄 물류망을 통해 공항이나 다음 숙소로 당일 배송도 예약할 수 있습니다. 💅',
                    en: 'You can store bags for up to 30 days, and book same-day delivery to the airport or your next hotel through Beeliber\'s premium logistics. 💅',
                    ja: '最大30日間保管可能で、Beeliberのプレミアム物流網を通じて空港や次の宿泊先への当日配送도 予約できます. 💅',
                    zh: '最多可寄存30天，并可通过Beeliber的高级物流网络预约当日配送至机场或下一间酒店。 💅',
                    'zh-TW': '最多可寄存30天，並可通過Beeliber的高級物流網絡預約當日配送至機場或下一間酒店。 💅',
                    'zh-HK': '最多可寄存30天, 並可 通過 Beeliber 高級物流 網絡 預約 當日配送 至 機場 或 下一個 酒店. 💅'
                }
            }
        ],
        relatedBranchIds: ['HBO', 'MYN'],
        touristSpots: [
            {
                id: 'hongdae-walking-street',
                category: 'culture',
                name: { ko: '홍대 걷고싶은 거리', en: 'Hongdae Walking Street', ja: '弘大歩きたい通り', zh: '弘大想散步的街道', 'zh-TW': '弘大想散步的街道', 'zh-HK': '弘大想散步的街道' },
                description: {
                    ko: '버스킹과 예술 공연이 끊이지 않는 홍대의 심장부입니다. 레드로드라고도 불리며 활기찬 에너지를 느낄 수 있어요. 짐 없이 가볍게 댄스 버스킹을 즐겨보세요! ✨',
                    en: 'The heart of Hongdae with continuous busking and performances. Also known as "Red Road". Enjoy busking light as a feather! ✨',
                    ja: 'バスキングや芸術公演が絶えない弘大の心臓部です。レッドロードとも呼ばれ、活気あるエネルギーを感じられます。荷物なしで身軽にダンスバスキングを楽しんでください！ ✨',
                    zh: '街头表演和艺术演出不断的弘大核心地带。也被称为“红色之路”，可以感受到活力。告别行李，轻松享受街头演出吧！ ✨',
                    'zh-TW': '街頭表演和藝術演出不斷的弘大核心地帶。也被稱為“紅色之路”，可以感受到活力。告別行李，輕鬆享受街頭演出吧！ ✨',
                    'zh-HK': '街頭表演和藝術演出不斷的弘大核心地帶. 也 被稱為 “紅色之路”, 可以 感受 活力. 告別 行李, 輕鬆 享受 街頭演出吧! ✨'
                }
            }
        ]
    },
    {
        slug: 'myeongdong',
        relatedTipIds: ['luggage-free-seoul', 'shipping-to-airport'],
        keywords: {
            ko: '명동 짐보관, 명동역 물품보관소, 을지로 짐보관, 명동 캐리어 배송',
            en: 'Myeongdong luggage storage, Myeongdong Station luggage locker, Euljiro luggage delivery',
            ja: '明洞 荷物預かり, 明洞駅 コインロッカー, 乙支路 荷物配送',
            zh: '明洞行李寄存, 明洞站行李寄存, 乙支路行李寄存, 明洞当日配送',
            'zh-TW': '明洞行李寄存, 明洞站行李寄存, 乙支路行李寄存, 明洞當日配送',
            'zh-HK': '明洞行李寄存, 明洞站行李寄存, 乙支路行李寄存, 明洞當日配送'
        },
        titles: {
            ko: '명동역 & 을지로 짐보관 | 쇼핑 전후 무거운 짐은 Beeliber에게 💅',
            en: 'Myeongdong & Euljiro Luggage Storage | Travel Light with Beeliber 💅',
            ja: '明洞駅 & 乙支路 荷物預かり | ショッピングの前後に Beeliber 💅',
            zh: '明洞站 & 乙支路行李寄存 | 购物前后轻松寄存 | Beeliber 💅',
            'zh-TW': '明洞站 & 乙支路行李寄存 | 購物前後輕鬆寄存 | Beeliber 💅',
            'zh-HK': '明洞站 & 乙支路行李寄存 | 購物前後輕鬆寄存 | Beeliber 💅'
        },
        descriptions: {
            ko: '명동 쇼핑 거리 중심가 위치. 수많은 쇼핑백과 캐리어를 안전하게 맡기고 명동의 맛집과 매장을 즐기세요.',
            en: 'Located in the heart of Myeongdong. Store your shopping bags and suitcases safely with Beeliber.',
            ja: '明洞ショッピング街の中心に位置。たくさんのショッピングバッグやキャリアを安全に預けて。',
            zh: '位于明洞购物街中心。安全寄存您的购物袋和行李箱，尽情享受明洞美食。',
            'zh-TW': '位於明洞購物街中心。安全寄存您的購物袋和行李箱，盡情享受明洞美食。',
            'zh-HK': '位於明洞購物街中心。安全寄存您的購物袋和行李箱，盡情享受明洞美食。'
        },
        intros: {
            ko: '대한민국 쇼핑의 메카 명동! 양손 가득 쇼핑백을 들고 다니기엔 명동의 거리는 너무나 즐거운 곳이 많죠? \n\n비리버 명동 센터에 수하물을 맡기시면, 가벼운 몸으로 길거리 음식을 즐기거나 백화점 쇼핑에 온전히 집중할 수 있습니다. 쇼핑이 끝난 후 다시 들를 필요 없이 호텔로 바로 배송하는 서비스를 이용해 보세요. 명동 여행의 새로운 기준을 제시합니다. 💅✨',
            en: 'Myeongdong, the mecca of shopping in Korea! Too many bags to enjoy all the fun spots? \n\nStore your bags at the Beeliber Myeongdong Center to enjoy street food and department store shopping with total focus. Use our direct delivery to your hotel after shopping so you never have to come back to the center. Setting a new standard for Myeongdong travel. 💅✨',
            ja: '韓国ショッピングのメッカ明洞！両手いっぱいのショッピングバッグを持って歩くには、明洞は楽しすぎますよね？\n\nBeeliber明洞センターに手荷物を預ければ、身軽な体で食べ歩きを楽しんだり、百貨店でのショッピングに集中できます。ショッピングが終わった後、再び立ち寄る必要なくホテルへ直接配送するサービスをぜひご利用ください。明洞旅行の新しい基準を提案します。 💅✨',
            zh: '韩国购物圣地明洞！提着大大小小的购物袋，怎么能尽兴游玩呢？\n\n将行李寄存在Beeliber明洞中心，您可以空出双手尽情享受街头小吃，全身心投入购物之旅。购物后无需返回中心取件，直接利用我们的直达酒店配送服务吧。为您开启明洞旅行的新标准。💅✨',
            'zh-TW': '韓國購物聖地明동! 提著大大小小的購物袋, 怎麼能 盡興 遊玩 呢?\n\n將行李寄存在Beeliber 明洞 中心, 您 可以 空出雙手 盡情 享受街 街頭小吃, 全身心 投入 購物之旅. 購物後 無需 返回 中心 取件, 直接 利用 我們 的 直達 酒店 配送服務 吧. 為您 開啟 明洞 旅行 的 新標準.💅✨',
            'zh-HK': '韓國 購物聖地 明洞! 提著 大大小小 的 購物袋, 怎麼能 盡興 遊玩 呢?\n\n將 行李 寄存 在 Beeliber 明洞 中心, 您 可以 空出 雙手 盡情 享受 街頭小吃, 全身心 投入 購物之旅. 購物 後 無需 返回 中心 取件, 直接 利用 我們 的 直達 酒店 配送 服務 吧. 為 您 開啟 明洞 旅行 的 新 標準. 💅✨'
        },
        faqs: [],
        relatedBranchIds: ['MYN', 'HBO'],
        touristSpots: []
    },
    {
        slug: 'seoul-station',
        relatedTipIds: ['shipping-to-airport'],
        keywords: {
            ko: '서울역 짐보관, 서울역 물품보관소, 기차 짐보관',
            en: 'Seoul Station luggage storage',
            ja: 'ソウル駅 荷物預かり',
            zh: '首尔站行李寄存',
            'zh-TW': '首爾站行李寄存',
            'zh-HK': '首爾站行李寄存'
        },
        titles: {
            ko: '서울역 짐보관 & 배송 | Beeliber 💅',
            en: 'Seoul Station Storage & Delivery | Beeliber 💅',
            ja: 'ソウル駅 荷物預かり & 配送 | Beeliber 💅',
            zh: '首尔站行李寄存 & 配送 | Beeliber 💅',
            'zh-TW': '首爾站行李寄存 & 配送 | Beeliber 💅',
            'zh-HK': '首爾站行李寄存 & 配送 | Beeliber 💅'
        },
        descriptions: {
            ko: '서울역 KTX 이용 전후 무거운 짐은 맡기세요.',
            en: 'Before or after taking KTX, leave your heavy luggage.',
            ja: 'ソウル駅KTX利用前後に、重い荷物を預けて。',
            zh: '在首尔站乘坐高铁前后，把行李交给Beeliber。',
            'zh-TW': '在首爾站乘坐高鐵前後，把行李交給Beeliber。',
            'zh-HK': '在首爾站乘坐高鐵前後，把行李交給Beeliber。'
        },
        intros: {
            ko: '서울의 관문 서울역, 빈손으로 여행을 시작하세요! 💅',
            en: 'Seoul Station, the gateway! Start empty-handed! 💅',
            ja: 'ソウルの玄関口ソウル駅、身軽にスタート！ 💅',
            zh: '首尔的门户，开启空手之旅！ 💅',
            'zh-TW': '首爾的門戶，開啟空手之旅！ 💅',
            'zh-HK': '首爾的門戶，開啟空手之旅！ 💅'
        },
        faqs: [],
        relatedBranchIds: ['MYN'],
        touristSpots: []
    },
    {
        slug: 'seongsu',
        relatedTipIds: ['luggage-free-seoul'],
        keywords: {
            ko: '성수동 짐보관, 성수역 짐보관',
            en: 'Seongsu luggage storage',
            ja: '聖水洞 荷物預かり',
            zh: '圣水洞行李寄存',
            'zh-TW': '聖水洞行李寄存',
            'zh-HK': '聖水洞行李寄存'
        },
        titles: {
            ko: '성수역 & 서울숲 짐보관 | Beeliber 💅',
            en: 'Seongsu & Seoul Forest Storage | Beeliber 💅',
            ja: '聖水洞 & ソウル森 荷物預かり | Beeliber 💅',
            zh: '圣水洞 & 首尔林行李寄存 | Beeliber 💅',
            'zh-TW': '聖水洞 & 首爾林行李寄存 | Beeliber 💅',
            'zh-HK': '聖水洞 & 首爾林行李寄存 | Beeliber 💅'
        },
        descriptions: {
            ko: '성수동 팝업스토어 쇼핑, 짐 없이 가볍게 즐기세요.',
            en: 'Enjoy Seongsu pop-ups without bags.',
            ja: '聖水洞のポップアップを荷物なしで楽しんで。',
            zh: '无忧打卡圣水洞快闪店。',
            'zh-TW': '無憂打卡聖水洞快閃店。',
            'zh-HK': '無憂打卡聖水洞快閃店。'
        },
        intros: {
            ko: '성수동의 힙한 감성, 비리버와 함께 짐 없이 완벽하게! 💅✨',
            en: 'Seongsu vibe, perfect with Beeliber! 💅✨',
            ja: '聖水洞の感性、Beeliberと一緒なら完璧！ 💅✨',
            zh: '圣水洞的魅力，与Beeliber一起完美开启！ 💅✨',
            'zh-TW': '聖水洞的魅力，與Beeliber一起完美開啟！ 💅✨',
            'zh-HK': '聖水洞的魅力，與Beeliber一起完美開啟！ 💅✨'
        },
        faqs: [],
        relatedBranchIds: ['HBO'],
        touristSpots: []
    },
    {
        slug: 'bukchon',
        relatedTipIds: ['luggage-free-seoul'],
        keywords: {
            ko: '북촌 한옥마을 짐보관, 안국역 짐보관',
            en: 'Bukchon luggage storage',
            ja: '北村 荷物預かり',
            zh: '北村行李寄存',
            'zh-TW': '北村行李寄存',
            'zh-HK': '北村行李寄存'
        },
        titles: {
            ko: '북촌 & 안국역 짐보관 | Beeliber 💅',
            en: 'Bukchon & Anguk Stn Storage | Beeliber 💅',
            ja: '北村 & 安国駅 荷物預かり | Beeliber 💅',
            zh: '北村 & 安国站行李寄存 | Beeliber 💅',
            'zh-TW': '北村 & 安國站行李寄存 | Beeliber 💅',
            'zh-HK': '北村 & 安國站行李寄存 | Beeliber 💅'
        },
        descriptions: {
            ko: '한옥마을의 좁은 골목길, 비리버에게 짐을 맡기세요.',
            en: 'Bukchon\'s narrow alleys, leave bags with Beeliber.',
            ja: '北村の狭い路地、荷物はBeeliberへ。',
            zh: '漫步北村小巷，行李交给Beeliber。',
            'zh-TW': '漫步北村小巷，行李交給Beeliber。',
            'zh-HK': '漫步北村小巷，行李交給Beeliber。'
        },
        intros: {
            ko: '북촌의 정숙함, 비리버와 함께 무소음 여행을 실천해 보세요. 💅📸',
            en: 'Quiet Bukchon, travel silent with Beeliber. 💅📸',
            ja: '静かな北村、Beeliberと静かな旅行を。 💅📸',
            zh: '宁静北村，由Beeliber陪伴开启无声互动。 💅📸',
            'zh-TW': '寧靜北村，由Beeliber陪伴開啟無聲互動。 💅📸',
            'zh-HK': '寧靜北村，由Beeliber陪伴開啟無聲互動。 💅📸'
        },
        faqs: [],
        relatedBranchIds: ['MYN'],
        touristSpots: []
    },
    {
        slug: 'itaewon',
        relatedTipIds: ['luggage-free-seoul'],
        keywords: {
            ko: '이태원 짐보관, 한남동 짐보관',
            en: 'Itaewon luggage storage',
            ja: '梨泰院 荷物預かり',
            zh: '梨泰院行李寄存',
            'zh-TW': '梨泰院行李寄存',
            'zh-HK': '梨泰院行李寄存'
        },
        titles: {
            ko: '이태원 & 한남동 짐보관 | Beeliber 💅',
            en: 'Itaewon & Hannam-dong Storage | Beeliber 💅',
            ja: '梨泰院 & 漢南洞 荷物預かり | Beeliber 💅',
            zh: '梨泰院 & 汉南洞行李寄存 | Beeliber 💅',
            'zh-TW': '梨泰院 & 漢南洞行李寄存 | Beeliber 💅',
            'zh-HK': '梨泰院 & 漢南洞行李寄存 | Beeliber 💅'
        },
        descriptions: {
            ko: '이태원의 언덕길, 무거운 짐은 맡기고 자유롭게 즐기세요.',
            en: 'Itaewon\'s hills, enjoy without heavy bags.',
            ja: '梨泰院の坂道、荷物を預けて自由に楽しんで。',
            zh: '告别梨泰院坡道负担，尽情游玩。',
            'zh-TW': '告別梨泰院坡道負擔，盡情遊玩。',
            'zh-HK': '告別 梨泰院 坡道 負擔, 盡情 遊玩. 💅'
        },
        intros: {
            ko: '이태원의 활기찬 거리, 비리버와 함께 더 힙하게 즐기세요! 💅✨',
            en: 'Itaewon vibes, enjoy more with Beeliber! 💅✨',
            ja: '梨泰院の活気ある街、Beeliberと一緒にもっとヒップに！ 💅✨',
            zh: '活力梨泰院，与Beeliber一起时尚打卡！ 💅✨',
            'zh-TW': '活力梨泰院，與Beeliber一起時尚打卡！ 💅✨',
            'zh-HK': '活力梨泰院，與Beeliber一起時尚打卡！ 💅✨'
        },
        faqs: [],
        relatedBranchIds: ['MIT'],
        touristSpots: []
    },
    {
        slug: 'yeouido',
        relatedTipIds: ['luggage-free-seoul'],
        keywords: {
            ko: '여의도 짐보관, 더현대 서울 짐보관',
            en: 'Yeouido luggage storage',
            ja: '汝矣島 荷物預かり',
            zh: '汝矣岛行李寄存',
            'zh-TW': '汝矣島行李寄存',
            'zh-HK': '汝矣島行李寄存'
        },
        titles: {
            ko: '여의도 & 더현대 서울 짐보관 | Beeliber 💅',
            en: 'Yeouido & The Hyundai Seoul Storage | Beeliber 💅',
            ja: '汝矣島 & ザ・現代ソウル 荷物預かり | Beeliber 💅',
            zh: '汝矣岛 & 现代百货首尔店行李寄存 | Beeliber 💅',
            'zh-TW': '汝矣島 & 現代百貨首爾店行李寄存 | Beeliber 💅',
            'zh-HK': '汝矣島 & 現代百貨首爾店行李寄存 | Beeliber 💅'
        },
        descriptions: {
            ko: '더현대 서울 쇼핑, 비리버 프리미엄 보관소로 가볍게.',
            en: 'Near The Hyundai Seoul. Use Beeliber.',
            ja: 'ザ・現代ソウル近く、Beeliberを使って身軽に。',
            zh: '现代百货首尔店旁，使用Beeliber开启轻松购物。',
            'zh-TW': '現代百貨首爾店旁, 使用Beeliber 開啟 輕鬆 購物.💅',
            'zh-HK': '現代百貨首爾店旁, 使用Beeliber 開啟 輕鬆 購物.💅'
        },
        intros: {
            ko: '여의도 한강공원 피크닉, 짐 걱정 말고 Beeliber와 함께하세요! 💅🌳',
            en: 'Yeouido Hanok River Park, enjoy with Beeliber! 💅🌳',
            ja: '汝矣島漢江公園ピクニック、Beeliberと一緒に！ 💅🌳',
            zh: '汉江公园野餐，行李交给Beeliber！ 💅🌳',
            'zh-TW': '漢江公園野餐，行李交給Beeliber！ 💅🌳',
            'zh-HK': '漢江公園野餐，行李交給 Beeliber! 💅🌳'
        },
        faqs: [],
        relatedBranchIds: ['MBX-008'],
        touristSpots: []
    },
    {
        slug: 'busan',
        relatedTipIds: ['shipping-to-airport'],
        keywords: {
            ko: '부산역 짐보관, 해운대 짐보관',
            en: 'Busan luggage storage',
            ja: '釜山 荷物預かり',
            zh: '釜山行李寄存',
            'zh-TW': '釜山行李寄存',
            'zh-HK': '釜山行李寄存'
        },
        titles: {
            ko: '부산역 & 해운대 짐보관 | Beeliber 💅',
            en: 'Busan Station & Haeundae Storage | Beeliber 💅',
            ja: '釜山駅 & 海雲台 荷物預かり | Beeliber 💅',
            zh: '釜山站 & 海云台行李寄存 | Beeliber 💅',
            'zh-TW': '釜山站 & 海雲台行李寄存 | Beeliber 💅',
            'zh-HK': '釜山站 & 海雲台行李寄存 | Beeliber 💅'
        },
        descriptions: {
            ko: '부산의 아름다운 바다를 짐 걱정 없이 즐기세요.',
            en: 'Enjoy Busan\'s ocean without bags.',
            ja: '釜山の海を荷物の心配なく楽しんで。',
            zh: '尽情享受釜山大海，行李交给Beeliber。',
            'zh-TW': '盡情享受釜山大海, 行李交給Beeliber.💅',
            'zh-HK': '盡情享受釜山大海, 行李交給 Beeliber! 💅'
        },
        intros: {
            ko: '제2의 도시 부산, 해운대 해변을 짐 없이 Beeliber와 함께! 💅🌊',
            en: 'Busan, the second city! Enjoy Haeundae with Beeliber! 💅🌊',
            ja: '第二の都市釜山、海雲台で荷物の心配はBeeliberに任せて！ 💅🌊',
            zh: '在釜山尽情享受吧，行李交给Beeliber！ 💅🌊',
            'zh-TW': '在釜山盡情享受吧，行李交給Beeliber！ 💅🌊',
            'zh-HK': '在釜山盡情享受吧，行李交給Beeliber！ 💅🌊'
        },
        faqs: [],
        relatedBranchIds: ['MBX-026'],
        touristSpots: []
    },
    {
        slug: 'jeju',
        relatedTipIds: ['luggage-free-seoul'],
        keywords: {
            ko: '제주공항 짐보관, 동문시장 짐보관',
            en: 'Jeju luggage storage',
            ja: '済州 荷物預かり',
            zh: '济州行李寄存',
            'zh-TW': '濟州行李寄存',
            'zh-HK': '濟州行李寄存'
        },
        titles: {
            ko: '제주공항 & 동문시장 짐보관 | Beeliber 💅',
            en: 'Jeju Airport & Dongmun Market Storage | Beeliber 💅',
            ja: '済州空港 & 東門市場 荷物預かり | Beeliber 💅',
            zh: '济州机场 & 东门市场行李寄存 | Beeliber 💅',
            'zh-TW': '濟州機場 & 東門市場行李寄存 | Beeliber 💅',
            'zh-HK': '濟州機場 & 東門市場行李寄存 | Beeliber 💅'
        },
        descriptions: {
            ko: '제주공항 근처, 무거운 짐은 비리버에게 맡기세요.',
            en: 'Near Jeju Airport, leave bags with Beeliber.',
            ja: '済州空港近く、荷物はBeeliberへ。',
            zh: '靠近济州机场，把沉重行李交给Beeliber。',
            'zh-TW': '靠近濟州機場, 把 沉重行李 交給 Beeliber.💅',
            'zh-HK': '靠近 濟州 機場, 把 沉重 行李 交給 Beeliber! 💅'
        },
        intros: {
            ko: '환상의 섬 제주, 비리버와 함께 빈손으로 시작하세요! 💅🌴',
            en: 'Jeju island, start empty-handed with Beeliber! 💅🌴',
            ja: '済州島、Beeliberと身軽にスタート！ 💅🌴',
            zh: '在济州开启空手之旅吧，行李交给Beeliber！ 💅🌴',
            'zh-TW': '在濟州開啟空手之旅吧，行李交給Beeliber！ 💅🌴',
            'zh-HK': '在 濟州 開啟 空手之旅吧, 行李 交給 Beeliber! 💅🌴'
        },
        faqs: [],
        relatedBranchIds: ['MBX-031'],
        touristSpots: []
    }
];
