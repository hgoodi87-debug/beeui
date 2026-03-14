
export interface TravelTip {
    id: string;
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
}

export const TRAVEL_TIPS: TravelTip[] = [
    {
        id: 'luggage-free-seoul',
        title: {
            ko: '짐 없이 서울 24시간 즐기는 법 💅',
            en: 'Guide: 24 Hours in Seoul without Luggage',
            ja: 'ガイド: 荷物なしでソウル24時間を楽しむ方法',
            zh: '指南: 在首尔开启24小时无行李自由行'
        },
        desc: {
            ko: '체크아웃 후 공항 가기 전까지, 무거운 캐리어 없이 핫플레이스만 골라가는 법.',
            en: 'How to visit trendy spots without heavy bags after checkout and before airport.',
            ja: 'チェックアウト後、空港へ行くまで。重이 荷物なしでホットスポットを巡るコツ。',
            zh: '从退房到登机前，教你如何告别行李负担，轻松打卡网红地。'
        }
    },
    {
        id: 'shipping-to-airport',
        title: {
            ko: '호텔에서 인천공항으로 짐 보내기 완벽 가이드 ✈️',
            en: 'The Ultimate Guide: Hotel to Incheon Airport Delivery',
            ja: '完全ガイド: ホテルから仁川空港への荷物配送',
            zh: '攻略: 从酒店到仁川机场行李当日配送全过程'
        },
        desc: {
            ko: 'Beeliber의 당일 배송 서비스를 200% 활용하여 공항까지 가볍게 이동하는 팁.',
            en: 'Tips for using Beeliber same-day delivery to travel light to the airport.',
            ja: 'Beeliberの当日配送サービスを200%活用して、空港まで身軽에 移動하는 팁.',
            zh: '如何200%利用Beeliber의 당일 배송 서비스,让去机场的路不再沉重。'
        }
    }
];
