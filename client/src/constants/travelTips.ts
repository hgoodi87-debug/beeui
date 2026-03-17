
export interface TravelTip {
    id: string;
    category: 'service' | 'guide' | 'spot';
    title: {
        ko: string;
        en: string;
        ja: string;
        zh: string;
    };
    desc: {
        ko: string;
        en: string;
        ja: string;
        zh: string;
    };
    content?: {
        ko: string;
        en: string;
        ja: string;
        zh: string;
    };
    coordinates?: {
        lat: number;
        lng: number;
    };
    targetBranchId?: string; // [스봉이] 명시적으로 매칭될 추천 지점 ID 🛰️✨
}

export const TRAVEL_TIPS: TravelTip[] = [
    {
        id: 'luggage-free-seoul',
        category: 'service',
        title: {
            ko: '짐 없이 서울 24시간 즐기는 법 💅',
            en: 'Guide: 24 Hours in Seoul without Luggage',
            ja: 'ガイド: 荷物なしでソウル24時間を楽しむ方法',
            zh: '指南: 在首尔开启24小时无行李自由行'
        },
        desc: {
            ko: '체크아웃 후 공항 가기 전까지, 무거운 캐리어 없이 핫플레이스만 골라가는 법.',
            en: 'How to visit trendy spots without heavy bags after checkout and before airport.',
            ja: 'チェックアウト後、空港へ行くまで。重い荷物なしでホットスポットを巡るコツ.',
            zh: '从退房到登机前，教你如何告别行李负担，轻松打卡网红地.'
        },
        content: {
            ko: '서울 여행의 핵심은 "가벼움"입니다. 체크인 전후의 비어있는 시간을 캐리어와 사투하며 낭비하지 마세요. \n\n1. **호텔에서 공항으로 바로 송부**: 비리버 앱에서 예약 후 로비에 짐을 맡기면, 당신은 그 즉시 자유입니다. \n2. **마지막 카페 투어까지 완벽하게**: 체크아웃 후 남은 5시간, 비리버가 당신의 시간을 선물합니다. \n3. **인천공항에서 여유롭게 수령**: 여행을 마무리하고 공항에 도착했을 때, 당신의 짐은 이미 안전하게 기다리고 있습니다. ✨',
            en: 'The key to Seoul travel is "lightness." Don\'t waste the gaps before check-in or after check-out struggling with heavy luggage.',
            ja: 'ソウル旅行の鍵は「身軽さ」です。チェックイン前後やチェックアウト後の空き時間を、重이荷物との格闘で無駄にしないでください。',
            zh: '首尔旅行的核心在于“轻便”。不要在办理入住前后或退房后的空闲时间内，因与沉重的行李“搏斗”而白白浪费时间。'
        }
    },
    {
        id: 'seongsu-hidden-gem',
        category: 'spot',
        title: {
            ko: '성수동: 붉은 벽돌의 낭만 🧱',
            en: 'Seongsu-dong: Red Brick Romance',
            ja: '聖水洞：赤レンガのロマン',
            zh: '圣水洞：红砖巷弄的浪漫'
        },
        desc: {
            ko: '비리버 성수 센터에 짐을 맡기고, 힙한 팝업스토어와 카페를 정복하세요.',
            en: 'Drop your bags at Beeliber Seongsu Center and conquer trendy spots.',
            ja: 'Beeliber聖水センターに荷物を預けて、ヒップなスポットを制覇しましょう。',
            zh: '把行李交给Beeliber圣水中心，尽情打卡网红地。'
        },
        coordinates: {
            lat: 37.5447,
            lng: 127.0567
        },
        targetBranchId: 'MSUS'
    },
    {
        id: 'myeongdong-shopping',
        category: 'spot',
        title: {
            ko: '명동: 쇼핑의 천국, 두 손은 가볍게 🛍️',
            en: 'Myeong-dong: Shopping Heaven, Hands-free',
            ja: '明洞：ショッピング天国、両手は軽く',
            zh: '明洞：购物天堂，两手空空'
        },
        desc: {
            ko: '쇼핑백으로 가득 찬 손? 비리버 명동 센터에 맡기고 더 즐거운 쇼핑을 즐기세요.',
            en: 'Hands full of shopping bags? Leave them at Beeliber Myeongdong Center.',
            ja: 'ショッピングバッグでいっぱいの手？Beeliber明洞センターに預けてもっと楽しもう。',
            zh: '购物袋塞满双手？交给Beeliber明洞中心。'
        },
        coordinates: {
            lat: 37.5635,
            lng: 126.9842
        },
        targetBranchId: 'MBX-016'
    },
    {
        id: 'bukchon-hanok',
        category: 'spot',
        title: {
            ko: '북촌 한옥마을: 고즈넉한 골목길 산책 ⛩️',
            en: 'Bukchon Hanok Village: Quiet Alley Walk',
            ja: '北村韓屋村：静かな路地裏散歩',
            zh: '北村韩屋村：宁静的小巷散步'
        },
        desc: {
            ko: '언덕이 많은 북촌, 캐리어 대신 비리버와 함께 고귀한 산책을 시작하세요.',
            en: 'Hilly Bukchon, start your noble walk with Beeliber instead of a suitcase.',
            ja: '坂の多い北村、キャリアの代わりにBeeliberと高貴な散歩を始めましょう。',
            zh: '坡道较多的北村，让Beeliber代劳行李，开启优雅漫步。'
        },
        coordinates: {
            lat: 37.5829,
            lng: 126.9835
        }
    },
    {
        id: 'itaewon-night',
        category: 'spot',
        title: {
            ko: '이태원: 잠들지 않는 서울의 밤 🌙',
            en: 'Itaewon: Seoul\'s Night That Never Sleeps',
            ja: '梨泰院：眠らないソウルの夜',
            zh: '梨泰院：不眠之城的首尔之夜'
        },
        desc: {
            ko: '비리버 이태원 지점에 짐을 보관하고 자유로운 이태원의 밤을 즐기세요.',
            en: 'Store bags at Beeliber Itaewon Branch and enjoy the free night.',
            ja: 'Beeliber梨泰院店に荷物を預けて、自由な夜を楽しみましょう。',
            zh: '将行李存放在Beeliber梨泰院店，尽情享受自由之夜。'
        },
        coordinates: {
            lat: 37.5340,
            lng: 126.9946
        },
        targetBranchId: 'MIT'
    },
    {
        id: 'hongdae-street',
        category: 'spot',
        title: {
            ko: '홍대: 젊음과 예술의 거리 🎨',
            en: 'Hongdae: Street of Youth and Art',
            ja: '弘大：若さと芸術の街',
            zh: '弘大：青春与艺术之街'
        },
        desc: {
            ko: '버스킹 공연부터 힙한 클럽까지, 무거운 짐 없이 홍대를 100% 즐기는 법.',
            en: 'From busking to clubs, enjoy Hongdae 100% without heavy bags.',
            ja: 'バスキングからクラブまで、重い荷物なしで弘大를 100% 즐기는 법.',
            zh: '从街头表演到夜店，告别沉重行李，100%享受弘大魅力。'
        },
        coordinates: {
            lat: 37.5565,
            lng: 126.9239
        },
        targetBranchId: 'HBO'
    },
    {
        id: 'gyeongbokgung-palace',
        category: 'spot',
        title: {
            ko: '경복궁: 조선의 위엄 👑',
            en: 'Gyeongbokgung Palace: Grandeur of Joseon',
            ja: '景福宮：朝鮮の威厳',
            zh: '景福宫：朝鲜的威严'
        },
        desc: {
            ko: '한복 입고 인생샷 찍기 전, 무거운 짐은 가까운 비리버 지점에 맡기세요.',
            en: 'Before taking life shots in Hanbok, drop your bags at a nearby Beeliber.',
            ja: '韓服を着て人生ショットを撮る前に、重い荷物は近くのBeeliberに預けましょう。',
            zh: '换上韩服拍美照前，把重行李交给明洞或附近的Beeliber。'
        },
        coordinates: {
            lat: 37.5796,
            lng: 126.9770
        },
        targetBranchId: 'MBX-013'
    },
    {
        id: 'n-seoul-tower',
        category: 'spot',
        title: {
            ko: 'N서울타워: 서울의 파노라마 🗼',
            en: 'N Seoul Tower: Seoul Panorama',
            ja: 'Nソウルタワー：ソウルのパノラマ',
            zh: 'N首尔塔：首尔全景'
        },
        desc: {
            ko: '남산의 가파른 언덕, 캐리어는 비리버에게 맡기고 가볍게 오르세요.',
            en: 'Steep hills of Namsan, leave your luggage with Beeliber and climb light.',
            ja: '南山の急な坂、キャリアはBeeliberに預けて身軽에 登りましょう.',
            zh: '南山的陡坡，把行李交给Beeliber，轻松登顶。'
        },
        coordinates: {
            lat: 37.5512,
            lng: 126.9882
        }
    },
    {
        id: 'ddp-design',
        category: 'spot',
        title: {
            ko: 'DDP: 동대문의 미래주의 🛸',
            en: 'DDP: Dongdaemun Futurism',
            ja: 'DDP：東大門の未来主義',
            zh: 'DDP：东大门的未来主义'
        },
        desc: {
            ko: 'DDP 전시 관람, 짐 걱정 없이 우주선 같은 건축미를 감상하세요.',
            en: 'DDP exhibitions, enjoy the spaceship-like architecture without bag worries.',
            ja: 'DDP展示観覧、荷物の心配なし에 宇宙船のような建築美を鑑賞してください.',
            zh: '打卡DDP展览，告别行李负担，尽情欣赏未来感建筑。'
        },
        coordinates: {
            lat: 37.5665,
            lng: 127.0092
        },
        targetBranchId: 'MBX-002'
    },
    {
        id: 'banpo-bridge',
        category: 'spot',
        title: {
            ko: '반포대교: 달빛무지개분수 🌈',
            en: 'Banpo Bridge: Moonlight Rainbow Fountain',
            ja: '盤浦大橋：月光レインボー噴水',
            zh: '盘浦大桥：月光彩虹喷泉'
        },
        desc: {
            ko: '세계 최장 교량 분수의 화려한 야경을 감상하세요.',
            en: 'Enjoy the spectacular night view of the world\'s longest bridge fountain.',
            ja: '世界最長の橋の噴水の華やかな夜景を鑑賞してください。',
            zh: '欣赏世界上最长的桥梁喷泉的壮丽夜景。'
        },
        coordinates: {
            lat: 37.5152,
            lng: 127.0016
        },
        targetBranchId: 'MIT'
    },
    {
        id: '63-building',
        category: 'spot',
        title: {
            ko: '63빌딩: 여의도의 황금빛 랜드마크 🏢',
            en: '63 Building: Golden Landmark of Yeouido',
            ja: '63ビル：汝矣島の黄金龍のランドマーク',
            zh: '63大厦：汝矣岛的金色地标'
        },
        desc: {
            ko: '전망대와 아쿠아리움에서 특별한 추억을 만드세요.',
            en: 'Make special memories at the observatory and aquarium.',
            ja: '展望台とアクアリウムで特別な思い出を作ってください。',
            zh: '在观景台和水族馆留下特别的回忆。'
        },
        coordinates: {
            lat: 37.5194,
            lng: 126.9402
        },
        targetBranchId: 'MYS'
    },
    {
        id: 'lotte-world-tower',
        category: 'spot',
        title: {
            ko: '롯데월드타워: 서울의 지붕 🗼',
            en: 'Lotte World Tower: Roof of Seoul',
            ja: 'ロッテワールドタワー：ソウルの屋根',
            zh: '乐天世界塔：首尔之巅'
        },
        desc: {
            ko: '세계에서 5번째로 높은 빌딩에서 서울을 발아래에 두세요.',
            en: 'Look down on Seoul from the 5th tallest building in the world.',
            ja: '世界で5番目に高いビルからソウルを見下ろしてください。',
            zh: '在世界第五高楼俯瞰首尔全景。'
        },
        coordinates: {
            lat: 37.5126,
            lng: 127.1025
        }
    },
    {
        id: 'starfield-library',
        category: 'spot',
        title: {
            ko: '별마당 도서관: 코엑스의 심장 📚',
            en: 'Starfield Library: Heart of COEX',
            ja: 'ピョルマダン図書館：COEXの心臓部',
            zh: '星空图书馆：COEX核心'
        },
        desc: {
            ko: '거대한 책장과 예술적 공간이 주는 영감을 느껴보세요.',
            en: 'Feel the inspiration from huge bookshelves and artistic space.',
            ja: '巨大な本棚と芸術的な空間が与えるインスピレーションを感じてください。',
            zh: '感受巨大书架和艺术空间带来的灵感。'
        },
        coordinates: {
            lat: 37.5118,
            lng: 127.0588
        }
    },
    {
        id: 'heunginjimun-gate',
        category: 'spot',
        title: {
            ko: '흥인지문: 동쪽의 살아있는 역사 🏯',
            en: 'Heunginjimun: Living History of the East',
            ja: '興仁之門：東の生きた歴史',
            zh: '兴仁之门：东方的历史见证'
        },
        desc: {
            ko: '보물 제1호, 동대문의 웅장한 자태를 만나보세요.',
            en: 'Meet the majestic appearance of Treasure No. 1, Dongdaemun Gate.',
            ja: '宝物第1号、東大門の雄大な姿に会ってみてください。',
            zh: '打卡第一号国宝，感受兴仁之门的雄伟气势。'
        },
        coordinates: {
            lat: 37.5711,
            lng: 127.0097
        },
        targetBranchId: 'MBX-002'
    },
    {
        id: 'ikseon-dong',
        category: 'spot',
        title: {
            ko: '익선동: 과거와 현재의 공존 ☕',
            en: 'Ikseon-dong: Past and Present Coexistence',
            ja: '益善洞：過去と現在の共存',
            zh: '益善洞：过去与现在的共存'
        },
        desc: {
            ko: '좁은 골목길 사이 숨겨진 보석 같은 한옥 카페들을 탐험하세요.',
            en: 'Explore hidden gem-like Hanok cafes in narrow alleys.',
            ja: '狭い路地裏に隠れた宝石のような韓屋カフェを探索してください。',
            zh: '探索狭窄巷弄间如宝石般的韩屋咖啡馆。'
        },
        coordinates: {
            lat: 37.5744,
            lng: 126.9897
        },
        targetBranchId: 'MBX-013'
    },
    {
        id: 'gwangjang-market',
        category: 'spot',
        title: {
            ko: '광장시장: 서울의 맛을 찾아서 🥟',
            en: 'Gwangjang Market: Taste of Seoul',
            ja: '広蔵市場：ソウルの味を求めて',
            zh: '广藏市场：寻找首尔之味'
        },
        desc: {
            ko: '빈대떡과 육회, 넷플릭스가 열광한 서울의 스트리트 푸드를 경험하세요.',
            en: 'Experience the street food Netflix loved: Bindaetteok and Yukhoe.',
            ja: 'ピンデトッやユッケなど、Netflixも熱狂したソウルのストリートフードを体験してください。',
            zh: '品尝绿豆饼和生牛肉，体验令Netflix着迷的首尔街头美食。'
        },
        coordinates: {
            lat: 37.5701,
            lng: 126.9995
        },
        targetBranchId: 'MBX-002'
    },
    {
        id: 'hannam-dong',
        category: 'spot',
        title: {
            ko: '한남동: 감각적인 라이프스타일 🛍️',
            en: 'Hannam-dong: Sensible Lifestyle',
            ja: '漢南洞：感性的なライフスタイル',
            zh: '汉南洞：感性的生活方式'
        },
        desc: {
            ko: '트렌디한 편집숍과 전시설이 가득한 서울의 가장 힙한 동네입니다.',
            en: 'Seoul\'s hippest neighborhood full of trendy shops and galleries.',
            ja: 'トレンディなセレクトショップや展示施設が並ぶ、ソウルで最もヒップな街です。',
            zh: '遍布潮流买手店和展览空间，是首尔最时髦的社区。'
        },
        coordinates: {
            lat: 37.5350,
            lng: 127.0010
        },
        targetBranchId: 'MIT'
    },
    {
        id: 'seoul-forest',
        category: 'spot',
        title: {
            ko: '서울숲: 도심 속 초록빛 휴식 🌿',
            en: 'Seoul Forest: Green Oasis in the City',
            ja: 'ソウルの森：都会の中の緑の休息',
            zh: '首尔林：都市中的绿色休憩'
        },
        desc: {
            ko: '성수동 핫라인을 걷다 만나는 넓은 공원에서 피크닉을 즐기세요.',
            en: 'Enjoy a picnic in the vast park met while walking the Seongsu hotline.',
            ja: '聖水洞のホットラインを歩いていると現れる広い公園でピクニックを楽しんでください。',
            zh: '在漫步圣水洞热门路线时偶遇的广阔公园里享受野餐。'
        },
        coordinates: {
            lat: 37.5443,
            lng: 127.0374
        },
        targetBranchId: 'MSUS'
    }
];
