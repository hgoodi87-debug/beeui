
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
            ko: '서울 여행의 핵심은 "가벼움"입니다. 체크인 전후의 비어있는 시간을 캐리어와 사투하며 낭비하지 마세요. \n\n1. **호텔에서 공항으로 바로 송부**: 비리버 앱에서 예약 후 로비에 짐을 맡기면, 당신은 그 즉시 자유입니다. 성수동의 좁은 골목길도, 홍대의 열기 가득한 클럽거리도 두 손 자유롭게 즐기세요. \n2. **마지막 카페 투어까지 완벽하게**: 체크아웃 후 남은 5시간, 비리버가 당신의 시간을 선물합니다. \n3. **인천공항에서 여유롭게 수령**: 여행을 마무리하고 공항에 도착했을 때, 당신의 짐은 이미 안전하게 기다리고 있습니다. ✨ \n\n*Future Intelligence Peek: 곧 도입될 실시간 GPS 배송 관제 시스템을 통해 당신의 짐이 어디쯤 오고 있는지 1m 단위로 확인하게 될 거예요. 🛰️*',
            en: 'The key to Seoul travel is "lightness." Don\'t waste the gaps before check-in or after check-out struggling with heavy luggage. \n\n1. **Direct Hotel-to-Airport Shipping**: Book on the Beeliber app, drop your bags at the lobby, and you\'re free. Navigate the narrow alleys of Seongsu or the energetic streets of Hongdae hands-free. \n2. **Complete Your Final Cafe Tour**: Beeliber gifts you those 5 hours after check-out. \n3. **Relax and Pick Up at Incheon**: When you arrive at the airport, your bags are already there waiting safely. ✨ \n\n*Future Intelligence Peek: Coming soon, our real-time GPS tracking system will let you monitor your luggage\'s exact location within 1 meter. 🛰️*',
            ja: 'ソウル旅行の鍵は「身軽さ」です。チェックイン前後やチェックアウト後の空き時間を、重い荷物との格闘で無駄にしないでください。\n\n1. **ホテルから空港へ直接配送**: Beeliberアプリで予約し、ロビーに荷物を預ければ、その瞬間からあなたは自由です。聖水の細い路地や弘大の活気ある通りを両手いっぱいに楽しめます。\n2. **最後のカフェ巡りまで完璧に**: チェックアウト後の残り5時間、Beeliberがあなたの時間をプレゼントします。\n3. **仁川空港でゆったり受け取り**: 旅行を終えて空港に到着した時、あなたの荷物はすでに安全に待機しています。✨ \n\n*Future Intelligence Peek: まもなく導入されるリアルタイムGPS追跡システムにより、荷物が今どこにあるか1m単位で確認できるようになります。🛰️*',
            zh: '首尔旅行的核心在于“轻便”。不要在办理入住前后或退房后的空闲时间内，因与沉重的行李“搏斗”而白白浪费时间。 \n\n1. **酒店直达机场配送**: 在Beeliber App预约后将行李交给大堂，您便立刻重获自由。两手空空地穿梭在圣水洞的窄巷，或感受弘大的火热街头。 \n2. **完美打卡最后一间咖啡厅**: 退房后的5小时空余时间，Beeliber为您精准找回。 \n3. **在仁川机场轻松提取**: 当您结束行程抵达机场时，您的行李已在此安全等候。 ✨ \n\n*Future Intelligence Peek: 即将引入的实时GPS配送监控系统，将让您能够以1米为单位实时掌握行李的最新位置。🛰️*'
        }
    },
    {
        id: 'seongsu-hidden-gem',
        category: 'spot',
        title: {
            ko: '성수동: 짐 없이 걷는 붉은 벽돌의 낭만 🧱',
            en: 'Seongsu-dong: Red Brick Romance without Luggage',
            ja: '聖水洞：荷物なしで歩く赤レンガのロマン',
            zh: '圣水洞：告别行李，漫步红砖巷弄的浪漫'
        },
        desc: {
            ko: '무거운 가방은 비리버 성수 센터에 맡기고, 힙한 팝업스토어와 카페를 정복하세요.',
            en: 'Drop your bags at Beeliber Seongsu Center and conquer trendy pop-up stores and cafes.',
            ja: '重いバッグはBeeliber聖水センターに預けて、ヒップなポップアップストアやカフェを制覇しましょう。',
            zh: '把厚重的行李交给Beeliber圣水中心，尽情打卡最High的快闪店和咖啡厅。'
        },
        content: {
            ko: '성수동의 팝업스토어는 대부분 좁고 대기줄이 깁니다. 캐리어를 들고 1시간 이상 기다리는 것은 여행의 질을 급격히 떨어뜨리죠. 비리버 성수 라운지에 짐을 맡기면, 당신은 마치 현지인처럼 가볍게 핫플레이스를 누빌 수 있습니다. ✨',
            en: 'Most pop-up stores in Seongsu-dong are narrow with long queues. Waiting for over an hour with a suitcase ruins the travel experience. Leave your bags at the Beeliber Seongsu Lounge to navigate the trendiest spots as light as a local. ✨',
            ja: '聖水洞のポップアップストアはほとんどが狭く、待ち行列が長いです。キャリアを持ったまま1時間以上待つのは、旅行の質を急激に下げてしまいます。Beeliber聖スラウンジに荷物を預ければ、地元の人のように軽やかにホットスポットを巡ることができます。✨',
            zh: '圣水洞的快闪店大多空间狭窄且排队较长。拖着行李箱等待1小时以上会严重影响旅行体验。将行李寄存在Beeliber圣水休息室，您就能像当地人一样轻松打卡热门地标。✨'
        },
        coordinates: {
            lat: 37.5447,
            lng: 127.0567
        }
    },
    {
        id: 'shipping-to-airport',
        category: 'service',
        title: {
            ko: '호텔에서 인천공항으로 짐 보내기 완벽 가이드 ✈️',
            en: 'The Ultimate Guide: Hotel to Incheon Airport Delivery',
            ja: '完全ガイド: ホテルから仁川空港への荷物配送',
            zh: '攻略: 从酒店到仁川机场行李当日配送全过程'
        },
        desc: {
            ko: 'Beeliber의 당일 배송 서비스를 200% 활용하여 공항까지 가볍게 이동하는 팁.',
            en: 'Tips for using Beeliber same-day delivery to travel light to the airport.',
            ja: 'Beeliberの当日配送サービスを200%活用して、空港まで身軽に移動するポイント。',
            zh: '如何200%利用Service的当日配送服务，让去机场的路不再沉重。'
        },
        content: {
            ko: '인천공항으로 전철을 타고 가시나요? 공항철도는 출퇴근 시간에 매우 붐빕니다. 대형 캐리어를 들고 서서 가는 고통 대신, 비리버의 "Hands-free Airport" 서비스를 선택하세요. \n\n- **T1/T2 위치 확인**: 당신의 항공사가 어느 터미널인지에 따라 정확한 위치로 짐을 배송해 드립니다.\n- **마감 시간**: 오전 10시 이전 호텔에 맡기면 당일 오후 공항 수령 가능! ✈️',
            en: 'Taking the train to Incheon Airport? The AREX gets very crowded during peak hours. Avoid the pain of standing with a large suitcase by choosing Beeliber\'s "Hands-free Airport" service. \n\n- **T1/T2 Location Check**: We deliver your bags to the exact arrival point of your terminal.\n- **Cut-off Time**: Drop at your hotel before 10 AM for same-day afternoon pickup at the airport! ✈️',
            ja: '仁川空港まで電車で行かれますか？空港鉄道はラッシュ時に非常に混雑します。大型キャリアを持って立っていく苦痛の代わりに、Beeliberの「Hands-free Airport」サービスを選んでください。\n\n- **T1/T2 位置確認**: 航空会社がどのターミナルかによって、正確な位置に荷物を配送します。\n- **締め切り時間**: 午前10時までにホテル에 預ければ、当日午後に空港で受け取り可能！ ✈️',
            zh: '打算坐地铁去仁川机场吗？机场快线在上下班高峰期非常拥挤。别再忍受提着大行李箱挤地铁的痛苦，选择Beeliber的“无忧机场”服务吧。 \n\n- **确认T1/T2位置**: 我们将根据您的航空公司所在的航站楼，将行李精准配送至取件点。\n- **截止时间**: 上午10点前在酒店交寄，当天下午即可在机场提件！✈️'
        }
    },
    {
        id: 'hongdae-safety',
        category: 'guide',
        title: {
            ko: '홍대 밤거리, 안전하게 수하물 보관하는 법 🐝',
            en: 'Hongdae Nightlife: Safe Luggage Storage Tips',
            ja: '弘大の夜：安全に手荷物を預ける方法',
            zh: '弘大之夜：行李安全寄存贴士'
        },
        desc: {
            ko: '늦은 시간까지 운영하는 비리버 거점을 확인하고 홍대의 열기를 즐기세요.',
            en: 'Check Beeliber spots operating late and enjoy the energy of Hongdae.',
            ja: '遅くまで営業しているBeeliber拠点を確認して、弘大の熱気を楽しんでください。',
            zh: '确认营业至深夜的Beeliber据点，尽情感受弘大的活力。'
        },
        coordinates: {
            lat: 37.5565,
            lng: 126.9239
        }
    }
];
