
export interface TravelTip {
    id: string;
    category: 'service' | 'guide' | 'spot';
    title: {
        ko: string;
        en: string;
        ja: string;
        zh: string;
        'zh-TW': string;
        'zh-HK': string;
    };
    desc: {
        ko: string;
        en: string;
        ja: string;
        zh: string;
        'zh-TW': string;
        'zh-HK': string;
    };
    content?: {
        ko: string;
        en: string;
        ja: string;
        zh: string;
        'zh-TW': string;
        'zh-HK': string;
    };
    coordinates?: {
        lat: number;
        lng: number;
    };
    targetBranchId?: string;
    seoKeywords?: {
        ko?: string;
        en?: string;
        'zh-TW'?: string;
    };
}

export const TRAVEL_TIPS: TravelTip[] = [
    // ── 5개 신규 SEO 가이드 콘텐츠 ──────────────────────────────────────────
    {
        id: 'luggage-storage-price-guide',
        category: 'guide',
        seoKeywords: {
            ko: '서울 짐보관 가격 비용 요금 비교',
            en: 'Seoul luggage storage price cost fee',
            'zh-TW': '首爾行李寄放費用 行李寄存價格比較',
        },
        title: {
            ko: '서울 짐보관 가격 완전 비교 가이드',
            en: 'Seoul Luggage Storage Price: Complete Guide',
            ja: 'ソウル荷物預かり料金：完全比較ガイド',
            zh: '首尔行李寄存价格完整比较指南',
            'zh-TW': '首爾行李寄放費用完整比較指南',
            'zh-HK': '首爾行李寄存費用完整比較指南',
        },
        desc: {
            ko: '코인로커부터 빌리버까지 서울 짐보관 옵션 가격 완전 비교. 4시간 4,000원부터 시작.',
            en: 'Full price comparison of Seoul luggage storage: from coin lockers to Beeliber. From ₩4,000 for 4 hours.',
            ja: 'コインロッカーからBeeliberまでソウルの荷物預かり料金を完全比較。4時間4,000ウォンから。',
            zh: '首尔行李寄存全面价格对比：从储物柜到Beeliber。4小时起4,000韩元。',
            'zh-TW': '首爾行李寄放全面費用比較：從置物箱到빌리버。4小時起4,000韓元。',
            'zh-HK': '首爾行李寄存全面費用比較：從儲物箱到빌리버。4小時起4,000韓元。',
        },
        content: {
            ko: '## 서울 짐보관 가격 완전 가이드\n\n서울 여행 중 짐보관이 필요할 때, 어디가 가장 합리적일까요?\n\n### 옵션별 가격 비교\n\n| 옵션 | 4시간 | 1일 | 특징 |\n|------|-------|-----|------|\n| **빌리버** | 핸드백 4,000원 / 캐리어 5,000원 | 8,000원~10,000원 | 당일 공항배송 가능 |\n| 코인로커 (지하철) | 3,000~6,000원 | 6,000~12,000원 | 위치 한정, 도난 위험 |\n| 호텔 클로크룸 | 무료~5,000원 | 무료~10,000원 | 숙박 고객 한정 |\n| Nannybag 등 앱 | 5,000~8,000원 | 10,000~15,000원 | 개인 매장, 품질 미보장 |\n\n### 빌리버를 선택해야 하는 이유\n\n1. **공항 직배송**: 맡긴 짐을 인천공항 T1·T2까지 당일 배송\n2. **보험 적용**: 보관 중 분실·파손 시 보상\n3. **온라인 예약**: 대기 없이 바로 이용\n4. **24시간 운영**: 일부 지점 심야 이용 가능\n\n### 가격 계산 방법\n\n- 4시간 이하: 기본 요금 (핸드백 4,000원 / 캐리어 5,000원)\n- 5~7시간: 기본 + 시간당 1,000원 추가\n- 8시간 이상: 1일 요금 (핸드백 8,000원 / 캐리어 10,000원)\n\n체크아웃 후 공항 가기 전까지 8시간 이하라면 빌리버가 가장 합리적입니다.',
            en: '## Seoul Luggage Storage Price Guide\n\nComparing all luggage storage options in Seoul to find the best value.\n\n### Price Comparison\n\n| Option | 4 hours | 1 day | Feature |\n|--------|---------|-------|--------|\n| **Beeliber** | Handbag ₩4,000 / Carrier ₩5,000 | ₩8,000~₩10,000 | Airport delivery available |\n| Coin Locker (subway) | ₩3,000~₩6,000 | ₩6,000~₩12,000 | Limited locations, theft risk |\n| Hotel Cloakroom | Free~₩5,000 | Free~₩10,000 | Hotel guests only |\n\n### Why Choose Beeliber\n\n1. Airport same-day delivery to Incheon T1/T2\n2. Insurance coverage for loss/damage\n3. Online booking, no waiting\n4. Transparent pricing with no hidden fees',
            ja: '## ソウル荷物預かり料金完全ガイド\n\nコインロッカーからBeeliberまで料金を徹底比較。\n\n### 料金比較\n\n| オプション | 4時間 | 1日 |\n|-----------|-------|-----|\n| **Beeliber** | ハンドバッグ₩4,000 / キャリア₩5,000 | ₩8,000〜₩10,000 |\n| コインロッカー | ₩3,000〜₩6,000 | ₩6,000〜₩12,000 |\n\n空港当日配送が利用できるBeeliberが最もおトクです。',
            zh: '## 首尔行李寄存价格完整指南\n\n从储物柜到Beeliber，全面比较各种行李寄存选项的价格。\n\n### 价格对比\n\n| 选项 | 4小时 | 1天 |\n|------|-------|-----|\n| **Beeliber** | 手提包₩4,000 / 行李箱₩5,000 | ₩8,000~₩10,000 |\n| 地铁储物柜 | ₩3,000~₩6,000 | ₩6,000~₩12,000 |\n\nBeeliber还提供仁川机场当日配送服务，性价比最高。',
            'zh-TW': '## 首爾行李寄放費用完整指南\n\n從置物箱到빌리버，全面比較各類行李寄放選項的費用。\n\n### 費用比較\n\n| 選項 | 4小時 | 1天 | 特色 |\n|------|-------|-----|------|\n| **빌리버** | 手提包₩4,000 / 行李箱₩5,000 | ₩8,000~₩10,000 | 可當日送機場 |\n| 地鐵置物箱 | ₩3,000~₩6,000 | ₩6,000~₩12,000 | 地點有限 |\n| 飯店行李寄放 | 免費~₩5,000 | 免費~₩10,000 | 僅限住客 |\n\n### 選擇빌리버的理由\n\n1. **機場直送**：寄放的行李可當日送往仁川機場T1/T2\n2. **保險保障**：保管期間遺失或損壞可獲賠償\n3. **線上預約**：免排隊立即使用\n4. **透明收費**：無隱藏費用\n\n### 費用計算方式\n\n- 4小時以內：基本費用（手提包₩4,000 / 行李箱₩5,000）\n- 5~7小時：基本費 + 每小時追加₩1,000\n- 8小時以上：全日費用（手提包₩8,000 / 行李箱₩10,000）',
            'zh-HK': '## 首爾行李寄存費用完整指南\n\n從儲物箱到빌리버，全面比較各類行李寄存選項嘅費用。\n\n### 費用比較\n\n| 選項 | 4小時 | 1天 | 特色 |\n|------|-------|-----|------|\n| **빌리버** | 手袋₩4,000 / 行李箱₩5,000 | ₩8,000~₩10,000 | 可即日送機場 |\n| 地鐵儲物箱 | ₩3,000~₩6,000 | ₩6,000~₩12,000 | 地點有限 |\n| 酒店行李寄存 | 免費~₩5,000 | 免費~₩10,000 | 僅限住客 |\n\n빌리버仲提供仁川機場即日配送服務，性價比最高。',
        },
    },
    {
        id: 'airport-delivery-guide',
        category: 'guide',
        seoKeywords: {
            ko: '인천공항 당일 짐배송 공항배송 가이드',
            en: 'Incheon airport luggage delivery same day guide',
            'zh-TW': '仁川機場當日行李配送指南 機場行李配送',
        },
        title: {
            ko: '인천공항 당일 짐배송 A to Z 완전 가이드',
            en: 'Incheon Airport Same-Day Luggage Delivery: Complete Guide',
            ja: '仁川空港当日荷物配送A to Z完全ガイド',
            zh: '仁川机场当日行李配送A to Z完整指南',
            'zh-TW': '仁川機場當日行李配送A to Z完整指南',
            'zh-HK': '仁川機場即日行李配送A to Z完整指南',
        },
        desc: {
            ko: '호텔에서 짐을 맡기고 인천공항에서 받는 빌리버 공항배송 서비스. 예약부터 수령까지 완전 정리.',
            en: 'Drop bags at your hotel, pick them up at Incheon Airport. Complete guide from booking to pick-up.',
            ja: 'ホテルで荷物を預け、仁川空港で受け取るBeeliber空港配送サービス。予約から受け取りまで完全整理。',
            zh: '在酒店托运行李，在仁川机场取件。从预约到取件的完整指南。',
            'zh-TW': '在飯店寄放行李，在仁川機場取件。從預約到取件的完整指南。',
            'zh-HK': '在酒店寄存行李，在仁川機場取件。從預約到取件嘅完整指南。',
        },
        content: {
            ko: '## 인천공항 당일 짐배송 완전 가이드\n\n여행 마지막 날, 호텔 체크아웃 후 공항 가기 전까지 자유로운 시간을 보내고 싶다면? 빌리버 공항배송 서비스를 이용하세요.\n\n### 서비스 흐름\n\n1. **온라인 예약** (전날까지): 수령 날짜, 터미널(T1/T2), 배송 시간 선택\n2. **짐 맡기기**: 체크아웃 시 빌리버 지점에 캐리어 위탁\n3. **서울 자유 시간**: 빈손으로 카페, 쇼핑, 관광 자유롭게\n4. **공항 수령**: 지정 터미널 수령 지점에서 캐리어 픽업 후 출국\n\n### 수령 지점\n\n- **T1(제1터미널)**: 3층 출국장 A 카운터 부근\n- **T2(제2터미널)**: 3층 출국장 H 카운터 부근\n\n### 자주 묻는 질문\n\n**Q. 마감 시간은?**\nA. 전날 오후 6시까지 온라인 예약 필요. 당일 예약은 불가.\n\n**Q. 배송 요금은?**\nA. 핸드백 10,000원 / 캐리어 25,000원 (수량 무관)\n\n**Q. 파손·분실 시?**\nA. 빌리버 보험이 적용됩니다. 예약 시 보험 옵션 확인.',
            en: '## Incheon Airport Same-Day Delivery: Complete Guide\n\nWant free time on your last day after hotel checkout? Use Beeliber\'s airport delivery.\n\n### Service Flow\n\n1. **Online booking** (by day before): Select date, terminal (T1/T2), delivery time\n2. **Drop-off**: Leave bags at Beeliber branch on checkout day\n3. **Free time in Seoul**: Enjoy cafes, shopping, sightseeing hands-free\n4. **Airport pick-up**: Collect bags at the designated terminal counter\n\n### Pick-up Points\n\n- **T1**: Near Counter A, 3F Departure Hall\n- **T2**: Near Counter H, 3F Departure Hall\n\n### Pricing\n\n- Handbag/Backpack: ₩10,000\n- Carrier/Suitcase: ₩25,000',
            ja: '## 仁川空港当日配送完全ガイド\n\nホテルチェックアウト後、空港に行く前の自由時間を楽しみたいなら？Beeliber空港配送サービスを使いましょう。\n\n### サービスの流れ\n\n1. **オンライン予約**（前日まで）：日付、ターミナル、配送時間を選択\n2. **荷物預け**：チェックアウト時にBeeliber店舗に預ける\n3. **ソウル自由時間**：手ぶらでカフェ・ショッピング・観光\n4. **空港受け取り**：指定ターミナルのカウンター付近で受け取り\n\n### 料金\n\n- ハンドバッグ：₩10,000\n- キャリー：₩25,000',
            zh: '## 仁川机场当日配送完整指南\n\n退房后、飞机前想自由逛逛？使用Beeliber机场配送服务。\n\n### 服务流程\n\n1. **在线预约**（前一天前）：选择日期、航站楼、配送时间\n2. **寄存行李**：退房时在Beeliber门店托运\n3. **首尔自由时间**：空手享受咖啡、购物、观光\n4. **机场取件**：在指定航站楼指定柜台附近取件\n\n### 费用\n\n- 手提包：₩10,000\n- 行李箱：₩25,000',
            'zh-TW': '## 仁川機場當日行李配送完整指南\n\n退房後、搭機前想自由逛逛首爾？使用빌리버機場配送服務。\n\n### 服務流程\n\n1. **線上預約**（前一天前截止）：選擇日期、航廈（T1/T2）、配送時間\n2. **寄放行李**：退房時在빌리버門市寄放行李\n3. **首爾自由時光**：空手盡情享受咖啡廳、購物、觀光\n4. **機場取件**：在指定航廈的指定櫃台附近取件後辦理出境\n\n### 取件地點\n\n- **T1（第一航廈）**：3樓出境大廳A櫃台附近\n- **T2（第二航廈）**：3樓出境大廳H櫃台附近\n\n### 費用\n\n- 手提包/背包：₩10,000\n- 行李箱：₩25,000\n\n### 常見問題\n\n**Q. 截止時間？**\nA. 需在前一天下午6時前完成線上預約，當天無法預約。\n\n**Q. 損壞或遺失怎麼辦？**\nA. 빌리버保險適用。預約時請確認保險選項。',
            'zh-HK': '## 仁川機場即日行李配送完整指南\n\n退房後、上機前想自由逛逛首爾？使用빌리버機場配送服務。\n\n### 服務流程\n\n1. **網上預約**（前一天前截止）：選擇日期、航站（T1/T2）、配送時間\n2. **寄存行李**：退房時在빌리버門市寄存行李\n3. **首爾自由時光**：空手盡情享受咖啡、購物、觀光\n4. **機場取件**：喺指定航站嘅指定櫃台附近取件後辦出境\n\n### 費用\n\n- 手袋/背包：₩10,000\n- 行李箱：₩25,000',
        },
    },
    {
        id: 'checkout-day-seoul-guide',
        category: 'guide',
        seoKeywords: {
            ko: '호텔 체크아웃 후 서울 여행 마지막날 짐 없이',
            en: 'Seoul hotel checkout day travel last day luggage free',
            'zh-TW': '退房後首爾自由行 飯店退房行李寄放 最後一天',
        },
        title: {
            ko: '체크아웃 당일, 서울 완전 자유 여행 가이드',
            en: 'Checkout Day: Complete Hands-Free Seoul Guide',
            ja: 'チェックアウト当日：ソウル手ぶら完全ガイド',
            zh: '退房当天：首尔无行李完整自由行指南',
            'zh-TW': '退房當天：首爾無行李完整自由行指南',
            'zh-HK': '退房當天：首爾無行李完整自由行指南',
        },
        desc: {
            ko: '호텔 체크아웃 후 공항까지의 자유 시간을 100% 활용하는 황금 루트. 짐은 빌리버에 맡기고.',
            en: 'Golden route to make the most of free time after hotel checkout. Leave bags at Beeliber.',
            ja: 'ホテルチェックアウト後の自由時間を100%活用するゴールデンルート。荷物はBeeliberに。',
            zh: '充分利用退房后到机场前自由时间的黄金路线。行李交给Beeliber。',
            'zh-TW': '充分善用退房後至機場前自由時光的黃金路線。行李交給빌리버。',
            'zh-HK': '充分善用退房後至機場前自由時光嘅黃金路線。行李交俾빌리버。',
        },
        content: {
            ko: '## 체크아웃 당일 황금 루트\n\n서울 여행의 마지막 날은 늘 아쉽습니다. 체크아웃 후 공항 가기 전까지 평균 4~8시간. 이 시간을 캐리어와 싸우며 보내지 마세요.\n\n### 오전 코스 (체크아웃 → 점심)\n\n1. 호텔 체크아웃 (09:00~10:00)\n2. 빌리버 지점에 짐 맡기기 (10분)\n3. 근처 카페에서 여유로운 아침 (30분)\n4. 쇼핑 또는 관광지 방문 (2~3시간)\n\n### 오후 코스 (점심 → 공항 출발)\n\n1. 현지 맛집에서 점심 (12:00~13:30)\n2. 마지막 쇼핑 또는 카페 투어 (1~2시간)\n3. 빌리버 배송 확인 후 공항 이동\n4. T1/T2 수령 지점에서 짐 픽업 후 출국\n\n### 추천 코스별 지역\n\n**홍대 숙박 → 홍대 → 연남동 → 공항**\n**명동 숙박 → 명동 쇼핑 → 경복궁 → 공항**\n**성수 숙박 → 성수 카페 → 뚝섬 공원 → 공항**',
            en: '## Checkout Day Golden Route\n\nYour last day in Seoul always feels short. Average 4–8 hours between checkout and airport. Don\'t waste it dragging luggage.\n\n### Morning (Checkout → Lunch)\n\n1. Hotel checkout (09:00–10:00)\n2. Drop bags at Beeliber (10 min)\n3. Leisurely breakfast at nearby café (30 min)\n4. Shopping or sightseeing (2–3 hours)\n\n### Afternoon (Lunch → Airport)\n\n1. Local restaurant lunch (12:00–13:30)\n2. Last shopping or café tour (1–2 hours)\n3. Head to airport after confirming delivery\n4. Pick up bags at T1/T2 and depart',
            ja: '## チェックアウト当日のゴールデンルート\n\nソウル旅行最終日の自由時間を最大限活用する方法。\n\n### 午前（チェックアウト→昼食）\n\n1. ホテルチェックアウト（09:00-10:00）\n2. Beeliber店舗へ荷物を預ける（10分）\n3. 近くのカフェでゆったり朝食（30分）\n4. ショッピングや観光（2-3時間）\n\n### 午後（昼食→空港出発）\n\n1. 地元レストランで昼食（12:00-13:30）\n2. 最後のショッピングやカフェ巡り（1-2時間）\n3. 空港へ向かい荷物を受け取って出国',
            zh: '## 退房当天黄金路线\n\n充分利用退房到机场之间的4-8小时自由时间，不要浪费在拖行李上。\n\n### 上午（退房→午餐）\n\n1. 酒店退房（09:00-10:00）\n2. 在Beeliber门店寄存行李（10分钟）\n3. 附近咖啡馆享用早餐（30分钟）\n4. 购物或参观景点（2-3小时）',
            'zh-TW': '## 退房當天黃金路線\n\n首爾旅行最後一天，退房後到機場前平均有4~8小時的自由時間。別讓行李毀了這段美好時光！\n\n### 上午行程（退房 → 午餐）\n\n1. 飯店退房（09:00~10:00）\n2. 前往빌리버門市寄放行李（10分鐘）\n3. 附近咖啡廳悠閒早午餐（30分鐘）\n4. 購物或參觀景點（2~3小時）\n\n### 下午行程（午餐 → 出發機場）\n\n1. 當地人氣餐廳午餐（12:00~13:30）\n2. 最後血拼或咖啡廳巡禮（1~2小時）\n3. 確認빌리버行李配送後前往機場\n4. 在T1/T2取件地點領取行李後出境\n\n### 推薦路線\n\n**弘大住宿 → 弘大 → 延南洞 → 機場**\n**明洞住宿 → 明洞購物 → 景福宮 → 機場**\n**聖水住宿 → 聖水咖啡廳 → 首爾林 → 機場**',
            'zh-HK': '## 退房當天黃金路線\n\n首爾旅行最後一天，退房後到機場前平均有4~8小時自由時間。唔好俾行李毀咗呢段美好時光！\n\n### 上午行程（退房 → 午餐）\n\n1. 酒店退房（09:00~10:00）\n2. 去빌리버門市寄存行李（10分鐘）\n3. 附近咖啡廳悠閒早午餐（30分鐘）\n4. 購物或參觀景點（2~3小時）\n\n### 下午行程（午餐 → 出發機場）\n\n1. 當地人氣餐廳午餐（12:00~13:30）\n2. 最後購物或咖啡廳巡禮（1~2小時）\n3. 確認빌리버行李配送後前往機場\n4. 在T1/T2取件地點領取行李後出境',
        },
    },
    {
        id: 'hongdae-luggage-guide',
        category: 'guide',
        seoKeywords: {
            ko: '홍대 짐보관 홍대입구 캐리어 보관',
            en: 'Hongdae luggage storage Hongik University',
            'zh-TW': '弘大行李寄放 弘大行李寄存 弘大附近',
        },
        title: {
            ko: '홍대 짐보관 완전 가이드 — 홍대입구역 최강 루트',
            en: 'Hongdae Luggage Storage Guide — Best Route from Hongik Univ. Station',
            ja: '弘大荷物預かり完全ガイド — 弘大入口駅最強ルート',
            zh: '弘大行李寄存完整指南 — 弘大入口站最强路线',
            'zh-TW': '弘大行李寄放完整指南 — 弘大入口站最強路線',
            'zh-HK': '弘大行李寄存完整指南 — 弘大入口站最強路線',
        },
        desc: {
            ko: '홍대 빌리버 지점 위치와 가격, 체크인·체크아웃 당일 홍대를 가장 즐겁게 즐기는 법.',
            en: 'Beeliber Hongdae branch location, prices, and the best way to enjoy Hongdae on arrival/departure day.',
            ja: 'Beeliber弘大店の場所、料金、チェックイン・アウト当日の弘大の楽しみ方。',
            zh: 'Beeliber弘大店位置、价格，以及入住/退房当天最佳弘大游览方式。',
            'zh-TW': '빌리버弘大門市位置、費用，以及入住/退房當天最佳弘大遊覽方式。',
            'zh-HK': '빌리버弘大門市位置、費用，以及入住/退房當天最佳弘大遊覽方式。',
        },
        coordinates: { lat: 37.5565, lng: 126.9239 },
        targetBranchId: 'HBO',
        content: {
            ko: '## 홍대 짐보관 완전 가이드\n\n홍대는 서울에서 가장 활기찬 지역 중 하나입니다. 버스킹, 힙한 카페, 클럽, 쇼핑이 공존하는 거리에서 캐리어를 끌고 다니는 건 너무 아깝습니다.\n\n### 빌리버 홍대 지점\n\n- **위치**: 홍대입구역 2번 출구 5분 거리\n- **운영시간**: 09:00~21:00\n- **예약**: 온라인 선예약 권장 (현장 접수도 가능)\n\n### 홍대 추천 루트 (짐 없이)\n\n**오전 코스**: 홍대 거리 버스킹 → 연남동 카페 투어\n**오후 코스**: 홍대 앞 편집숍 쇼핑 → 합정역 카페\n**저녁 코스**: 홍대 맛집 → 클럽 문화 체험\n\n### 주변 관광지\n\n- **연남동**: 경의선 숲길 따라 카페 투어\n- **합정역**: 당인리발전소 문화공간\n- **망원동**: 망리단길 로컬 맛집',
            en: '## Hongdae Luggage Storage Guide\n\nHongdae is one of Seoul\'s most vibrant areas. Don\'t drag your luggage through busking streets, hip cafés, and clubs.\n\n### Beeliber Hongdae Branch\n\n- **Location**: 5 min from Hongik University Station Exit 2\n- **Hours**: 09:00–21:00\n\n### Recommended Routes (hands-free)\n\n**Morning**: Hongdae street busking → Yeonnam-dong café tour\n**Afternoon**: Hongdae boutique shopping → Hapjeong cafés\n**Evening**: Local restaurants → Club culture experience',
            ja: '## 弘大荷物預かり完全ガイド\n\n弘大はソウルで最も活気ある地域の一つ。バスキング、ヒップなカフェ、クラブが共存する街でキャリーを引くのはもったいないです。\n\n### Beeliber弘大店\n\n- **場所**：弘大入口駅2番出口から徒歩5分\n- **営業時間**：09:00〜21:00\n\n### おすすめルート（手ぶら）\n\n午前：弘大ストリートバスキング → 延南洞カフェ巡り\n午後：弘大前セレクトショップ → 合井カフェ',
            zh: '## 弘大行李寄存完整指南\n\n弘大是首尔最具活力的地区之一。不要在街头表演、咖啡馆和夜店间拖着行李箱。\n\n### Beeliber弘大店\n\n- **位置**：弘大入口站2号出口步行5分钟\n- **营业时间**：09:00~21:00',
            'zh-TW': '## 弘大行李寄放完整指南\n\n弘大是首爾最有活力的地區之一。街頭表演、個性咖啡廳、購物品牌應有盡有，拖著行李箱實在太可惜了！\n\n### 빌리버弘大門市\n\n- **位置**：弘大入口站2號出口步行5分鐘\n- **營業時間**：09:00~21:00\n- **預約**：建議線上預約（現場接受也可）\n\n### 弘大推薦路線（無行李）\n\n**上午**：弘大街頭表演 → 延南洞咖啡廳巡禮\n**下午**：弘大前個性選品店購物 → 合井站咖啡廳\n**傍晚**：弘大人氣餐廳 → 夜生活體驗\n\n### 周邊景點\n\n- **延南洞**：沿京義線森林步道享受咖啡廳巡禮\n- **合井站**：唐人里發電廠文化空間\n- **望遠洞**：望里段吉路在地美食',
            'zh-HK': '## 弘大行李寄存完整指南\n\n弘大係首爾最有活力嘅地區之一。街頭表演、個性咖啡廳、購物品牌應有盡有，拖住行李箱實在太可惜喇！\n\n### 빌리버弘大門市\n\n- **位置**：弘大入口站2號出口步行5分鐘\n- **營業時間**：09:00~21:00\n\n### 弘大推薦路線（無行李）\n\n**上午**：弘大街頭表演 → 延南洞咖啡廳巡禮\n**下午**：弘大前個性選品店購物 → 合井站咖啡廳\n**傍晚**：弘大人氣餐廳 → 夜生活體驗',
        },
    },
    {
        id: 'seongsu-myeongdong-shopping',
        category: 'guide',
        seoKeywords: {
            ko: '성수 명동 쇼핑 짐보관 서울 쇼핑 추천',
            en: 'Seongsu Myeongdong shopping luggage storage Seoul',
            'zh-TW': '聖水 明洞 購物 行李寄放 首爾購物推薦',
        },
        title: {
            ko: '성수·명동 쇼핑 완전 가이드 — 짐 걱정 없이 100% 즐기기',
            en: 'Seongsu & Myeongdong Shopping Guide — 100% Hands-Free',
            ja: '聖水・明洞ショッピング完全ガイド — 手ぶらで100%楽しむ',
            zh: '圣水·明洞购物完整指南 — 100%无包袱畅游',
            'zh-TW': '聖水·明洞購物完整指南 — 無行李100%盡興',
            'zh-HK': '聖水·明洞購物完整指南 — 無行李100%盡興',
        },
        desc: {
            ko: '서울 최고의 쇼핑 지역에서 캐리어 없이 즐기는 법. 빌리버 성수·명동 지점 활용 완전 가이드.',
            en: 'How to enjoy Seoul\'s best shopping areas without luggage. Complete guide to Beeliber Seongsu & Myeongdong.',
            ja: 'ソウル最高のショッピングエリアをキャリーなしで楽しむ方法。Beeliber聖水・明洞店完全活用ガイド。',
            zh: '不带行李享受首尔最佳购物区的方法。Beeliber圣水·明洞店完整使用指南。',
            'zh-TW': '無行李享受首爾最佳購物區的方法。빌리버聖水·明洞門市完整使用指南。',
            'zh-HK': '無行李享受首爾最佳購物區嘅方法。빌리버聖水·明洞門市完整使用指南。',
        },
        content: {
            ko: '## 성수·명동 쇼핑 완전 가이드\n\n### 성수동 (서울의 브루클린)\n\n힙한 팝업스토어, 인테리어 카페, 빈티지 편집숍이 가득한 성수동. 캐리어를 끌고 좁은 골목을 돌아다니는 건 불가능합니다.\n\n**빌리버 성수 지점**: 뚝섬역 3번 출구 도보 5분\n\n추천 코스: 성수역 → 아더에러 플래그십 → 어니언 카페 → 서울숲 피크닉\n\n### 명동 (서울 최대 쇼핑 거리)\n\nK-뷰티, 패션, 스트리트 푸드가 집결한 명동. 구매한 쇼핑백이 가득 차도 걱정 없습니다.\n\n**빌리버 명동 지점**: 명동역 6번 출구 도보 3분\n\n추천 코스: 명동 쇼핑 → 남산 케이블카 → 경복궁',
            en: '## Seongsu & Myeongdong Shopping Guide\n\n### Seongsu-dong (Brooklyn of Seoul)\n\nHip pop-up stores, interior cafés, vintage boutiques. Dragging a suitcase through narrow alleys is impossible.\n\n**Beeliber Seongsu**: 5 min from Ttukseom Station Exit 3\n\nRecommended: Seongsu Station → Ader Error Flagship → Onion Café → Seoul Forest picnic\n\n### Myeongdong (Seoul\'s largest shopping street)\n\nK-Beauty, fashion, street food in one place. No worries even if your shopping bags overflow.\n\n**Beeliber Myeongdong**: 3 min from Myeongdong Station Exit 6',
            ja: '## 聖水・明洞ショッピング完全ガイド\n\n### 聖水洞（ソウルのブルックリン）\n\nヒップなポップアップストア、インテリアカフェ、ヴィンテージセレクトショップが集結。狭い路地をキャリーで歩くのは至難の業。\n\n**Beeliber聖水店**：纛島駅3番出口から徒歩5分\n\n### 明洞（ソウル最大ショッピング街）\n\nKビューティー、ファッション、ストリートフードが集結。\n\n**Beeliber明洞店**：明洞駅6番出口から徒歩3分',
            zh: '## 圣水·明洞购物完整指南\n\n### 圣水洞（首尔的布鲁克林）\n\n潮流快闪店、个性咖啡馆、复古精选店云集。带着行李箱穿行于狭窄巷弄几乎不可能。\n\n**Beeliber圣水店**：纛岛站3号出口步行5分钟\n\n### 明洞（首尔最大购物街）\n\nK-美妆、时尚、街头美食汇聚一堂。\n\n**Beeliber明洞店**：明洞站6号出口步行3分钟',
            'zh-TW': '## 聖水·明洞購物完整指南\n\n### 聖水洞（首爾的布魯克林）\n\n個性快閃店、質感咖啡廳、復古選品店齊聚一堂。拖著行李箱穿越狹窄巷弄幾乎是不可能的任務。\n\n**빌리버聖水門市**：纛島站3號出口步行5分鐘\n\n推薦路線：聖水站 → Ader Error旗艦店 → Onion咖啡廳 → 首爾林野餐\n\n### 明洞（首爾最大購物街）\n\nK-Beauty、時尚、街頭美食全部集中在這裡。買再多購物袋也不擔心！\n\n**빌리버明洞門市**：明洞站6號出口步行3分鐘\n\n推薦路線：明洞購物 → 南山纜車 → 景福宮',
            'zh-HK': '## 聖水·明洞購物完整指南\n\n### 聖水洞（首爾嘅布魯克林）\n\n個性快閃店、質感咖啡廳、復古選品店齊聚一堂。拖住行李箱穿越狹窄巷弄幾乎係不可能嘅事。\n\n**빌리버聖水門市**：纛島站3號出口步行5分鐘\n\n### 明洞（首爾最大購物街）\n\nK-Beauty、時尚、街頭美食全部集中係度。買幾多購物袋都唔使擔心！\n\n**빌리버明洞門市**：明洞站6號出口步行3分鐘',
        },
    },
    // ── 기존 팁 (zh-TW/HK 추가 + 비리버 → 빌리버 수정) ────────────────────
    {
        id: 'luggage-free-seoul',
        category: 'service',
        title: {
            ko: '짐 없이 서울 24시간 즐기는 법',
            en: 'Guide: 24 Hours in Seoul without Luggage',
            ja: 'ガイド: 荷物なしでソウル24時間を楽しむ方法',
            zh: '指南: 在首尔开启24小时无行李自由行',
            'zh-TW': '指南：首爾24小時無行李自由行完整攻略',
            'zh-HK': '指南：首爾24小時無行李自由行完整攻略',
        },
        desc: {
            ko: '체크아웃 후 공항 가기 전까지, 무거운 캐리어 없이 핫플레이스만 골라가는 법.',
            en: 'How to visit trendy spots without heavy bags after checkout and before airport.',
            ja: 'チェックアウト後、空港へ行くまで。重い荷物なしでホットスポットを巡るコツ.',
            zh: '从退房到登机前，教你如何告别行李负担，轻松打卡网红地.',
            'zh-TW': '從退房到登機前，教你如何告別行李負擔，輕鬆打卡網紅景點。',
            'zh-HK': '從退房到登機前，教你如何告別行李負擔，輕鬆打卡網紅景點。',
        },
        content: {
            ko: '서울 여행의 핵심은 "가벼움"입니다. 체크인 전후의 비어있는 시간을 캐리어와 사투하며 낭비하지 마세요.\n\n1. **호텔에서 공항으로 바로 송부**: 빌리버 앱에서 예약 후 로비에 짐을 맡기면, 당신은 그 즉시 자유입니다.\n2. **마지막 카페 투어까지 완벽하게**: 체크아웃 후 남은 5시간, 빌리버가 당신의 시간을 선물합니다.\n3. **인천공항에서 여유롭게 수령**: 여행을 마무리하고 공항에 도착했을 때, 당신의 짐은 이미 안전하게 기다리고 있습니다.',
            en: 'The key to Seoul travel is "lightness." Don\'t waste the gaps before check-in or after check-out struggling with heavy luggage.',
            ja: 'ソウル旅行の鍵は「身軽さ」です。チェックイン前後やチェックアウト後の空き時間を、重い荷物との格闘で無駄にしないでください。',
            zh: '首尔旅行的核心在于"轻便"。不要在办理入住前后或退房后的空闲时间内，因与沉重的行李"搏斗"而白白浪费时间。',
            'zh-TW': '首爾旅行的核心在於「輕盈」。不要把退房後的寶貴時間浪費在與沉重行李的拉鋸戰上。\n\n1. **直接從飯店送往機場**：在빌리버預約後將行李寄放，您立即獲得自由。\n2. **最後的咖啡廳巡禮也能完美完成**：退房後的5小時，빌리버為您守護行李。\n3. **在仁川機場從容取件**：旅途結束到達機場時，您的行李已安全等候。',
            'zh-HK': '首爾旅行嘅核心係「輕盈」。唔好把退房後嘅寶貴時間浪費在同沉重行李嘅拉鋸戰上。\n\n1. **直接由酒店送往機場**：喺빌리버預約後將行李寄存，您立即獲得自由。\n2. **最後嘅咖啡廳巡禮都能夠完美完成**：退房後嘅5小時，빌리버為您守護行李。\n3. **喺仁川機場從容取件**：旅途結束到達機場時，您嘅行李已安全等候。',
        },
    },
    {
        id: 'seongsu-hidden-gem',
        category: 'spot',
        title: {
            ko: '성수동: 붉은 벽돌의 낭만',
            en: 'Seongsu-dong: Red Brick Romance',
            ja: '聖水洞：赤レンガのロマン',
            zh: '圣水洞：红砖巷弄的浪漫',
            'zh-TW': '聖水洞：紅磚巷弄的浪漫',
            'zh-HK': '聖水洞：紅磚巷弄的浪漫',
        },
        desc: {
            ko: '빌리버 성수 센터에 짐을 맡기고, 힙한 팝업스토어와 카페를 정복하세요.',
            en: 'Drop your bags at Beeliber Seongsu Center and conquer trendy spots.',
            ja: 'Beeliber聖水センターに荷物を預けて、ヒップなスポットを制覇しましょう。',
            zh: '把行李交给Beeliber圣水中心，尽情打卡网红地。',
            'zh-TW': '將行李交給빌리버聖水中心，盡情打卡網紅景點。',
            'zh-HK': '將行李交俾빌리버聖水中心，盡情打卡網紅景點。',
        },
        coordinates: { lat: 37.5447, lng: 127.0567 },
        targetBranchId: 'MSUS',
    },
    {
        id: 'myeongdong-shopping',
        category: 'spot',
        title: {
            ko: '명동: 쇼핑의 천국, 두 손은 가볍게',
            en: 'Myeong-dong: Shopping Heaven, Hands-free',
            ja: '明洞：ショッピング天国、両手は軽く',
            zh: '明洞：购物天堂，两手空空',
            'zh-TW': '明洞：購物天堂，雙手輕鬆',
            'zh-HK': '明洞：購物天堂，雙手輕鬆',
        },
        desc: {
            ko: '쇼핑백으로 가득 찬 손? 빌리버 명동 센터에 맡기고 더 즐거운 쇼핑을 즐기세요.',
            en: 'Hands full of shopping bags? Leave them at Beeliber Myeongdong Center.',
            ja: 'ショッピングバッグでいっぱいの手？Beeliber明洞センターに預けてもっと楽しもう。',
            zh: '购物袋塞满双手？交给Beeliber明洞中心。',
            'zh-TW': '購物袋塞滿雙手？交給빌리버明洞中心繼續逛！',
            'zh-HK': '購物袋塞滿雙手？交俾빌리버明洞中心繼續逛！',
        },
        coordinates: { lat: 37.5635, lng: 126.9842 },
        targetBranchId: 'MBX-016',
    },
    {
        id: 'bukchon-hanok',
        category: 'spot',
        title: {
            ko: '북촌 한옥마을: 고즈넉한 골목길 산책',
            en: 'Bukchon Hanok Village: Quiet Alley Walk',
            ja: '北村韓屋村：静かな路地裏散歩',
            zh: '北村韩屋村：宁静的小巷散步',
            'zh-TW': '北村韓屋村：靜謐巷弄漫步',
            'zh-HK': '北村韓屋村：靜謐巷弄漫步',
        },
        desc: {
            ko: '언덕이 많은 북촌, 캐리어 대신 빌리버와 함께 고귀한 산책을 시작하세요.',
            en: 'Hilly Bukchon, start your noble walk with Beeliber instead of a suitcase.',
            ja: '坂の多い北村、キャリアの代わりにBeeliberと高貴な散歩を始めましょう。',
            zh: '坡道较多的北村，让Beeliber代劳行李，开启优雅漫步。',
            'zh-TW': '坡道較多的北村，讓빌리버代管行李，開啟優雅漫步。',
            'zh-HK': '坡道較多的北村，讓빌리버代管行李，開啟優雅漫步。',
        },
        coordinates: { lat: 37.5829, lng: 126.9835 },
    },
    {
        id: 'itaewon-night',
        category: 'spot',
        title: {
            ko: '이태원: 잠들지 않는 서울의 밤',
            en: 'Itaewon: Seoul\'s Night That Never Sleeps',
            ja: '梨泰院：眠らないソウルの夜',
            zh: '梨泰院：不眠之城的首尔之夜',
            'zh-TW': '梨泰院：不眠首爾之夜',
            'zh-HK': '梨泰院：不眠首爾之夜',
        },
        desc: {
            ko: '빌리버 이태원 지점에 짐을 보관하고 자유로운 이태원의 밤을 즐기세요.',
            en: 'Store bags at Beeliber Itaewon Branch and enjoy the free night.',
            ja: 'Beeliber梨泰院店に荷物を預けて、自由な夜を楽しみましょう。',
            zh: '将行李存放在Beeliber梨泰院店，尽情享受自由之夜。',
            'zh-TW': '將行李寄放在빌리버梨泰院門市，盡情享受自由夜晚。',
            'zh-HK': '將行李寄存在빌리버梨泰院門市，盡情享受自由夜晚。',
        },
        coordinates: { lat: 37.5340, lng: 126.9946 },
        targetBranchId: 'MIT',
    },
    {
        id: 'hongdae-street',
        category: 'spot',
        title: {
            ko: '홍대: 젊음과 예술의 거리',
            en: 'Hongdae: Street of Youth and Art',
            ja: '弘大：若さと芸術の街',
            zh: '弘大：青春与艺术之街',
            'zh-TW': '弘大：青春與藝術之街',
            'zh-HK': '弘大：青春與藝術之街',
        },
        desc: {
            ko: '버스킹 공연부터 힙한 클럽까지, 무거운 짐 없이 홍대를 100% 즐기는 법.',
            en: 'From busking to clubs, enjoy Hongdae 100% without heavy bags.',
            ja: 'バスキングからクラブまで、重い荷物なしで弘大を100%楽しむ方法。',
            zh: '从街头表演到夜店，告别沉重行李，100%享受弘大魅力。',
            'zh-TW': '從街頭表演到夜店，告別沉重行李，100%享受弘大魅力。',
            'zh-HK': '從街頭表演到夜店，告別沉重行李，100%享受弘大魅力。',
        },
        coordinates: { lat: 37.5565, lng: 126.9239 },
        targetBranchId: 'HBO',
    },
    {
        id: 'gyeongbokgung-palace',
        category: 'spot',
        title: {
            ko: '경복궁: 조선의 위엄',
            en: 'Gyeongbokgung Palace: Grandeur of Joseon',
            ja: '景福宮：朝鮮の威厳',
            zh: '景福宫：朝鲜的威严',
            'zh-TW': '景福宮：朝鮮王朝的威嚴',
            'zh-HK': '景福宮：朝鮮王朝的威嚴',
        },
        desc: {
            ko: '한복 입고 인생샷 찍기 전, 무거운 짐은 가까운 빌리버 지점에 맡기세요.',
            en: 'Before taking life shots in Hanbok, drop your bags at a nearby Beeliber.',
            ja: '韓服を着て人生ショットを撮る前に、重い荷物は近くのBeeliberに預けましょう。',
            zh: '换上韩服拍美照前，把重行李交给明洞或附近的Beeliber。',
            'zh-TW': '換上韓服拍美照前，把重行李交給附近的빌리버。',
            'zh-HK': '換上韓服拍美照前，把重行李交俾附近嘅빌리버。',
        },
        coordinates: { lat: 37.5796, lng: 126.9770 },
        targetBranchId: 'MBX-013',
    },
    {
        id: 'n-seoul-tower',
        category: 'spot',
        title: {
            ko: 'N서울타워: 서울의 파노라마',
            en: 'N Seoul Tower: Seoul Panorama',
            ja: 'Nソウルタワー：ソウルのパノラマ',
            zh: 'N首尔塔：首尔全景',
            'zh-TW': 'N首爾塔：首爾全景',
            'zh-HK': 'N首爾塔：首爾全景',
        },
        desc: {
            ko: '남산의 가파른 언덕, 캐리어는 빌리버에게 맡기고 가볍게 오르세요.',
            en: 'Steep hills of Namsan, leave your luggage with Beeliber and climb light.',
            ja: '南山の急な坂、キャリアはBeeliberに預けて身軽に登りましょう。',
            zh: '南山的陡坡，把行李交给Beeliber，轻松登顶。',
            'zh-TW': '南山的陡坡，把行李交給빌리버，輕鬆登頂。',
            'zh-HK': '南山的陡坡，把行李交俾빌리버，輕鬆登頂。',
        },
        coordinates: { lat: 37.5512, lng: 126.9882 },
    },
    {
        id: 'ddp-design',
        category: 'spot',
        title: {
            ko: 'DDP: 동대문의 미래주의',
            en: 'DDP: Dongdaemun Futurism',
            ja: 'DDP：東大門の未来主義',
            zh: 'DDP：东大门的未来主义',
            'zh-TW': 'DDP：東大門未來主義',
            'zh-HK': 'DDP：東大門未來主義',
        },
        desc: {
            ko: 'DDP 전시 관람, 짐 걱정 없이 우주선 같은 건축미를 감상하세요.',
            en: 'DDP exhibitions, enjoy the spaceship-like architecture without bag worries.',
            ja: 'DDP展示観覧、荷物の心配なしに宇宙船のような建築美を鑑賞してください。',
            zh: '打卡DDP展览，告别行李负担，尽情欣赏未来感建筑。',
            'zh-TW': '參觀DDP展覽，無行李煩惱，盡情欣賞太空船般的建築美感。',
            'zh-HK': '參觀DDP展覽，無行李煩惱，盡情欣賞太空船般的建築美感。',
        },
        coordinates: { lat: 37.5665, lng: 127.0092 },
        targetBranchId: 'MBX-002',
    },
    {
        id: 'banpo-bridge',
        category: 'spot',
        title: {
            ko: '반포대교: 달빛무지개분수',
            en: 'Banpo Bridge: Moonlight Rainbow Fountain',
            ja: '盤浦大橋：月光レインボー噴水',
            zh: '盘浦大桥：月光彩虹喷泉',
            'zh-TW': '盤浦大橋：月光彩虹噴泉',
            'zh-HK': '盤浦大橋：月光彩虹噴泉',
        },
        desc: {
            ko: '세계 최장 교량 분수의 화려한 야경을 감상하세요.',
            en: 'Enjoy the spectacular night view of the world\'s longest bridge fountain.',
            ja: '世界最長の橋の噴水の華やかな夜景を鑑賞してください。',
            zh: '欣赏世界上最长的桥梁喷泉的壮丽夜景。',
            'zh-TW': '欣賞世界最長橋樑噴泉的壯麗夜景。',
            'zh-HK': '欣賞世界最長橋樑噴泉的壯麗夜景。',
        },
        coordinates: { lat: 37.5152, lng: 127.0016 },
        targetBranchId: 'MIT',
    },
    {
        id: '63-building',
        category: 'spot',
        title: {
            ko: '63빌딩: 여의도의 황금빛 랜드마크',
            en: '63 Building: Golden Landmark of Yeouido',
            ja: '63ビル：汝矣島の黄金のランドマーク',
            zh: '63大厦：汝矣岛的金色地标',
            'zh-TW': '63大廈：汝矣島黃金地標',
            'zh-HK': '63大廈：汝矣島黃金地標',
        },
        desc: {
            ko: '전망대와 아쿠아리움에서 특별한 추억을 만드세요.',
            en: 'Make special memories at the observatory and aquarium.',
            ja: '展望台とアクアリウムで特別な思い出を作ってください。',
            zh: '在观景台和水族馆留下特别的回忆。',
            'zh-TW': '在展望台和水族館留下特別的回憶。',
            'zh-HK': '在展望台和水族館留下特別的回憶。',
        },
        coordinates: { lat: 37.5194, lng: 126.9402 },
        targetBranchId: 'MYS',
    },
    {
        id: 'lotte-world-tower',
        category: 'spot',
        title: {
            ko: '롯데월드타워: 서울의 지붕',
            en: 'Lotte World Tower: Roof of Seoul',
            ja: 'ロッテワールドタワー：ソウルの屋根',
            zh: '乐天世界塔：首尔之巅',
            'zh-TW': '樂天世界塔：首爾之巔',
            'zh-HK': '樂天世界塔：首爾之巔',
        },
        desc: {
            ko: '세계에서 5번째로 높은 빌딩에서 서울을 발아래에 두세요.',
            en: 'Look down on Seoul from the 5th tallest building in the world.',
            ja: '世界で5番目に高いビルからソウルを見下ろしてください。',
            zh: '在世界第五高楼俯瞰首尔全景。',
            'zh-TW': '在世界第五高樓俯瞰首爾全景。',
            'zh-HK': '在世界第五高樓俯瞰首爾全景。',
        },
        coordinates: { lat: 37.5126, lng: 127.1025 },
    },
    {
        id: 'starfield-library',
        category: 'spot',
        title: {
            ko: '별마당 도서관: 코엑스의 심장',
            en: 'Starfield Library: Heart of COEX',
            ja: 'ピョルマダン図書館：COEXの心臓部',
            zh: '星空图书馆：COEX核心',
            'zh-TW': '星空圖書館：COEX核心',
            'zh-HK': '星空圖書館：COEX核心',
        },
        desc: {
            ko: '거대한 책장과 예술적 공간이 주는 영감을 느껴보세요.',
            en: 'Feel the inspiration from huge bookshelves and artistic space.',
            ja: '巨大な本棚と芸術的な空間が与えるインスピレーションを感じてください。',
            zh: '感受巨大书架和艺术空间带来的灵感。',
            'zh-TW': '感受巨大書架與藝術空間帶來的靈感。',
            'zh-HK': '感受巨大書架與藝術空間帶來嘅靈感。',
        },
        coordinates: { lat: 37.5118, lng: 127.0588 },
    },
    {
        id: 'heunginjimun-gate',
        category: 'spot',
        title: {
            ko: '흥인지문: 동쪽의 살아있는 역사',
            en: 'Heunginjimun: Living History of the East',
            ja: '興仁之門：東の生きた歴史',
            zh: '兴仁之门：东方的历史见证',
            'zh-TW': '興仁之門：東方的活歷史',
            'zh-HK': '興仁之門：東方的活歷史',
        },
        desc: {
            ko: '보물 제1호, 동대문의 웅장한 자태를 만나보세요.',
            en: 'Meet the majestic appearance of Treasure No. 1, Dongdaemun Gate.',
            ja: '宝物第1号、東大門の雄大な姿に会ってみてください。',
            zh: '打卡第一号国宝，感受兴仁之门的雄伟气势。',
            'zh-TW': '打卡第一號國寶，感受興仁之門的雄偉氣勢。',
            'zh-HK': '打卡第一號國寶，感受興仁之門的雄偉氣勢。',
        },
        coordinates: { lat: 37.5711, lng: 127.0097 },
        targetBranchId: 'MBX-002',
    },
    {
        id: 'ikseon-dong',
        category: 'spot',
        title: {
            ko: '익선동: 과거와 현재의 공존',
            en: 'Ikseon-dong: Past and Present Coexistence',
            ja: '益善洞：過去と現在の共存',
            zh: '益善洞：过去与现在的共存',
            'zh-TW': '益善洞：舊時與當代的邂逅',
            'zh-HK': '益善洞：舊時與當代的邂逅',
        },
        desc: {
            ko: '좁은 골목길 사이 숨겨진 보석 같은 한옥 카페들을 탐험하세요.',
            en: 'Explore hidden gem-like Hanok cafes in narrow alleys.',
            ja: '狭い路地裏に隠れた宝石のような韓屋カフェを探索してください。',
            zh: '探索狭窄巷弄间如宝石般的韩屋咖啡馆。',
            'zh-TW': '探索狹窄巷弄間如寶石般的韓屋咖啡廳。',
            'zh-HK': '探索狹窄巷弄間如寶石般的韓屋咖啡廳。',
        },
        coordinates: { lat: 37.5744, lng: 126.9897 },
        targetBranchId: 'MBX-013',
    },
    {
        id: 'gwangjang-market',
        category: 'spot',
        title: {
            ko: '광장시장: 서울의 맛을 찾아서',
            en: 'Gwangjang Market: Taste of Seoul',
            ja: '広蔵市場：ソウルの味を求めて',
            zh: '广藏市场：寻找首尔之味',
            'zh-TW': '廣藏市場：尋找首爾之味',
            'zh-HK': '廣藏市場：尋找首爾之味',
        },
        desc: {
            ko: '빈대떡과 육회, 넷플릭스가 열광한 서울의 스트리트 푸드를 경험하세요.',
            en: 'Experience the street food Netflix loved: Bindaetteok and Yukhoe.',
            ja: 'ピンデトッやユッケなど、Netflixも熱狂したソウルのストリートフードを体験してください。',
            zh: '品尝绿豆饼和生牛肉，体验令Netflix着迷的首尔街头美食。',
            'zh-TW': '品嚐綠豆煎餅和生牛肉，體驗令Netflix著迷的首爾街頭美食。',
            'zh-HK': '品嚐綠豆煎餅和生牛肉，體驗令Netflix著迷嘅首爾街頭美食。',
        },
        coordinates: { lat: 37.5701, lng: 126.9995 },
        targetBranchId: 'MBX-002',
    },
    {
        id: 'hannam-dong',
        category: 'spot',
        title: {
            ko: '한남동: 감각적인 라이프스타일',
            en: 'Hannam-dong: Sensible Lifestyle',
            ja: '漢南洞：感性的なライフスタイル',
            zh: '汉南洞：感性的生活方式',
            'zh-TW': '漢南洞：感性生活風格',
            'zh-HK': '漢南洞：感性生活風格',
        },
        desc: {
            ko: '트렌디한 편집숍과 전시설이 가득한 서울의 가장 힙한 동네입니다.',
            en: 'Seoul\'s hippest neighborhood full of trendy shops and galleries.',
            ja: 'トレンディなセレクトショップや展示施設が並ぶ、ソウルで最もヒップな街です。',
            zh: '遍布潮流买手店和展览空间，是首尔最时髦的社区。',
            'zh-TW': '遍布潮流選品店和展覽空間，是首爾最時髦的社區。',
            'zh-HK': '遍布潮流選品店和展覽空間，係首爾最時髦嘅社區。',
        },
        coordinates: { lat: 37.5350, lng: 127.0010 },
        targetBranchId: 'MIT',
    },
    {
        id: 'seoul-forest',
        category: 'spot',
        title: {
            ko: '서울숲: 도심 속 초록빛 휴식',
            en: 'Seoul Forest: Green Oasis in the City',
            ja: 'ソウルの森：都会の中の緑の休息',
            zh: '首尔林：都市中的绿色休憩',
            'zh-TW': '首爾林：都市中的綠色綠洲',
            'zh-HK': '首爾林：都市中的綠色綠洲',
        },
        desc: {
            ko: '성수동 핫라인을 걷다 만나는 넓은 공원에서 피크닉을 즐기세요.',
            en: 'Enjoy a picnic in the vast park met while walking the Seongsu hotline.',
            ja: '聖水洞のホットラインを歩いていると現れる広い公園でピクニックを楽しんでください。',
            zh: '在漫步圣水洞热门路线时偶遇的广阔公园里享受野餐。',
            'zh-TW': '在漫步聖水洞熱門路線時偶遇的廣闊公園裡享受野餐。',
            'zh-HK': '在漫步聖水洞熱門路線時偶遇嘅廣闊公園裡享受野餐。',
        },
        coordinates: { lat: 37.5443, lng: 127.0374 },
        targetBranchId: 'MSUS',
    },
];
