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
    // 💅 [스봉이] 현지화 인트로 추가 (Phase 2)
    intros: {
        ko: string;
        en: string;
        ja: string;
        zh: string;
        'zh-TW': string;
        'zh-HK': string;
    };
    // 💅 [스봉이] 자동 FAQ 추가 (Phase 2)
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
}

export const SEO_LOCATIONS: SeoLocation[] = [
    {
        slug: 'hongdae',
        relatedTipIds: ['luggage-free-seoul', 'shipping-to-airport'],
        keywords: {
            ko: '홍대 짐보관, 홍대입구역 물품보관소, 홍대 캐리어 배송, 홍대 짐배송, 홍대입구역 짐보관',
            en: 'Hongdae luggage storage, Hongik Univ. Station luggage delivery, Hongdae suitcase storage, Hongdae locker',
            ja: '弘大 荷物預かり, 弘大入口駅 コ인ロッカー, 弘대 キャ리아配送, 弘대 荷물配送',
            zh: '弘大行李寄存, 弘益大学站行李寄存, 弘大行李配送, 弘大机场配送',
            'zh-TW': '弘大行李寄存, 弘益大學站行李寄存, 弘大行李配送, 弘大機場配送',
            'zh-HK': '弘大行李寄存, 弘益大學站行李寄存, 弘大行李配送, 弘大機場配送'
        },
        titles: {
            ko: '홍대입구역 짐보관 & 캐리어 배송 | Beeliber 무중력 여행 💅',
            en: 'Hongdae Luggage Storage & Suitcase Delivery | Beeliber 💅',
            ja: '弘大入口駅 荷物預かり & キャリア配送 | Beeliber 💅',
            zh: '弘大行李寄存 & 行李当日配送 | Beeliber 💅',
            'zh-TW': '弘大行李寄存 & 行李當日配送 | Beeliber 💅',
            'zh-HK': '弘大行李寄存 & 行李當日配送 | Beeliber 💅'
        },
        descriptions: {
            ko: '홍대입구역 9번 출구 3분 거리. 무거운 캐리어는 홍대에 맡기고 가볍게 여행하세요. 호텔/공항 당일 배송 가능.',
            en: '3 min walk from Hongik Univ. Stn Exit 9. Leave your heavy luggage in Hongdae and travel light. Same-day delivery available.',
            ja: '弘大入口駅9番出口から徒歩3分。重い荷物は弘大に預けて、身軽に旅行を楽しみましょう。当日配送対応。',
            zh: '距离弘大站9号出口仅3分钟。把沉重的行李留在弘大，轻松开启旅程。提供酒店/机场当日配送服务。',
            'zh-TW': '距離弘大站9號出口僅3分鐘。把沉重的行李留在弘大，輕鬆開啟旅程。提供酒店/機場當日配送服務。',
            'zh-HK': '距離弘大站9號出口僅3分鐘。把沉重的行李留在弘大，輕鬆開啟旅程。提供酒店/機場當日配送服務。'
        },
        intros: {
            ko: '홍대는 서울의 젊음과 예술이 가득한 곳입니다. 무거운 짐 없이 거리 공연과 쇼핑을 즐겨보세요.',
            en: 'Hongdae is full of youth and art. Enjoy street performances and shopping without heavy bags.',
            ja: '弘大はソウルの若さと芸術が溢れる場所です。重い荷物なしでストリートパフォーマンスやショッピングを楽しんでください。',
            zh: '弘大充满活力和艺术。无忧享受街头表演和购物。',
            'zh-TW': '弘大充滿活力和藝術。無憂享受街頭表演和購物。',
            'zh-HK': '弘大充滿活力和藝術。無憂享受街頭表演和購物。'
        },
        faqs: [
            {
                question: 'How long can I store bags in Hongdae?',
                answer: {
                    ko: '최대 30일까지 보관 가능하며, 당일 배송도 연계 가능합니다.',
                    en: 'Up to 30 days of storage with optional same-day delivery.',
                    ja: '最大30日間保管可能で、当日配送も連携可能です。',
                    zh: '最多可寄存30天，支持当日配送。',
                    'zh-TW': '最多可寄存30天，支持當日配送。',
                    'zh-HK': '最多可寄存30天，支持當日配送。'
                }
            }
        ],
        relatedBranchIds: ['HBO', 'MYN']
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
            ko: '대한민국 쇼핑의 메카 명동! 양손 가득 쇼핑백을 들고 다니기엔 명동의 거리는 너무나 즐거운 곳이 많죠?',
            en: 'Myeongdong, the mecca of shopping in Korea! Too many bags to enjoy all the fun spots?',
            ja: '韓国ショッピングのメッカ明洞！両手いっぱいのショッピングバッグを持って歩くには、明洞は楽しすぎますよね？',
            zh: '韩国购物圣地明洞！提着大大小小的购物袋，怎么能尽兴游玩呢？',
            'zh-TW': '韓國購物聖地明洞！提著大大小小的購物袋，怎麼能盡興遊玩呢？',
            'zh-HK': '韓國購物聖地明洞！提著大大小小的購物袋，怎麼能盡興遊玩呢？'
        },
        faqs: [
            {
                question: 'Can I send my shopping bags to the airport?',
                answer: {
                    ko: '네, 명동에서 맡기신 짐을 인천공항으로 당일 배송해 드립니다.',
                    en: 'Yes, we provide same-day delivery from Myeongdong to Incheon Airport.',
                    ja: 'はい、明洞で預けた荷物を仁川空港へ当日配送いたします。',
                    zh: '是的，我们可以将您在明洞寄存的行李当日配送至仁川机场。',
                    'zh-TW': '是的，我們可以將您在明洞寄存的行李當日配送至仁川機場。',
                    'zh-HK': '是的，我們可以將您在明洞寄存的行李當日配送至仁川機場。'
                }
            }
        ],
        relatedBranchIds: ['MYN', 'HBO']
    },
    {
        slug: 'seoul-station',
        relatedTipIds: ['shipping-to-airport'],
        keywords: {
            ko: '서울역 짐보관, 서울역 물품보관소, 서울역 기차 짐보관, 서울역 공항철도 짐보관',
            en: 'Seoul Station luggage storage, Seoul Station locker, KTX luggage delivery, AREX luggage storage',
            ja: 'ソウル駅 荷物預かり, ソウル駅 コインロッカー, 仁川空港 荷物配送',
            zh: '首尔站行李寄存, 首尔站行李寄存柜, 首尔站当日配送',
            'zh-TW': '首爾站行李寄存, 首爾站行李寄存櫃, 首爾站當日配送',
            'zh-HK': '首爾站行李寄存, 首爾站行李寄存櫃, 首爾站當日配送'
        },
        titles: {
            ko: '서울역 짐보관 & 캐리어 배송 | 여행의 시작과 끝을 가볍게 Beeliber 💅',
            en: 'Seoul Station Luggage Storage & Delivery | Beeliber 💅',
            ja: 'ソウル駅 荷物預かり & 配送 | 旅行の始まりと終わりを身軽に Beeliber 💅',
            zh: '首尔站行李寄存 & 配送 | 开启轻松旅程 | Beeliber 💅',
            'zh-TW': '首爾站行李寄存 & 配送 | 開啟輕鬆旅程 | Beeliber 💅',
            'zh-HK': '首爾站行李寄存 & 配送 | 開啟輕鬆旅程 | Beeliber 💅'
        },
        descriptions: {
            ko: '서울역 공항철도 및 KTX 이용 전후, 무거운 짐은 맡기고 남은 시간을 효율적으로 사용하세요.',
            en: 'Before or after taking KTX or AREX at Seoul Station, leave your heavy luggage with us.',
            ja: 'ソウル駅の空港鉄道やKTXの利用前後に、重い荷物を預けて時間を有効活用。',
            zh: '在首尔站乘坐快线或高铁前后，寄存在此，高效利用您的空余时间。',
            'zh-TW': '在首爾站乘坐快線或高鐵前後，寄存在此，高效利用您的空餘時間。',
            'zh-HK': '在首爾站乘坐快線或高鐵前後，寄存在此，高效利用您的空餘時間。'
        },
        intros: {
            ko: '서울의 관문 서울역! 여행의 첫 단추와 마지막 기억을 무거운 짐과 함께하고 싶지는 않으시죠?',
            en: 'Seoul Station, the gateway to Seoul! Don\'t let heavy bags ruin your first or last memories of the city.',
            ja: 'ソウルの玄関口ソウル駅！旅行の始まりと終わりを重い荷物と一緒に過ごしたくはないですよね？',
            zh: '首尔的门户首尔站！您不希望旅行的第一步或最后一步被沉重的行李拖累吧？',
            'zh-TW': '首爾的門戶首爾站！您不希望旅行的第一步或最後一步被沉重的行李拖累吧？',
            'zh-HK': '首爾的門戶首爾站！您不希望旅行的第一步或最後一步被沉重的行李拖累吧？'
        },
        faqs: [
            {
                question: 'Where is the storage located in Seoul Station?',
                answer: {
                    ko: '공항철도 및 1/4호선 출구에서 도보 5분 거리 내 프리미엄 라운지가 위치합니다.',
                    en: 'Our premium lounge is within a 5-minute walk from AREX and Line 1/4 exits.',
                    ja: '空港鉄道および1/4号線の出口から徒歩5分以内にプレミアムラウンジがあります。',
                    zh: '我们的高级休息室距离机场快线及1/4号线出口步行不到5分钟。',
                    'zh-TW': '我們的高級休息室距離機場快線及1/4號線出口步行不到5分鐘。',
                    'zh-HK': '我們的高級休息室距離機場快線及1/4號線出口步行不到5分鐘。'
                }
            }
        ],
        relatedBranchIds: ['MYN']
    },
    {
        slug: 'seongsu',
        relatedTipIds: ['luggage-free-seoul'],
        keywords: {
            ko: '성수동 짐보관, 성수역 물품보관소, 성수 캐리어 배송, 서울숲 짐보관, 팝업스토어 짐보관',
            en: 'Seongsu-dong luggage storage, Seongsu Station luggage delivery, Seoul Forest luggage locker',
            ja: '聖水洞 荷物預かり, 聖水駅 コインロッカー, ソウル森 荷物配送',
            zh: '圣水洞行李寄存, 圣水站行李寄存, 首尔林行李寄存',
            'zh-TW': '聖水洞行李寄存, 聖水站行李寄存, 首爾林行李寄存',
            'zh-HK': '聖水洞行李寄存, 聖水站行李寄存, 首爾林行李寄存'
        },
        titles: {
            ko: '성수역 & 서울숲 짐보관 | 팝업스토어 쇼핑도 가볍게 Beeliber 💅',
            en: 'Seongsu & Seoul Forest Luggage Storage | Shop Light with Beeliber 💅',
            ja: '聖水洞 & ソウル森 荷物預かり | ポップアップストアも身軽に | Beeliber 💅',
            zh: '圣水洞 & 首尔林行李寄存 | 轻松购物体验 | Beeliber 💅',
            'zh-TW': '聖水洞 & 首爾林行李寄存 | 輕鬆購物體驗 | Beeliber 💅',
            'zh-HK': '聖水洞 & 首爾林行李寄存 | 輕鬆購物體驗 | Beeliber 💅'
        },
        descriptions: {
            ko: '성수동 팝업스토어 대기 줄에서 캐리어 때문에 고생하지 마세요. 성수역 인근 Beeliber 보관소에 맡기고 핫플레이스를 즐기세요.',
            en: 'Don\'t struggle with luggage at Seongsu pop-up stores. Leave it at Beeliber near Seongsu Station.',
            ja: '聖水洞のポップアップストアの列でキャリアに苦労しないでください。聖水駅近くのBeeliberに預けて。',
            zh: '不用在圣水洞快闪店排队时为行李发愁。寄存在圣水站旁的Beeliber，轻松打卡。',
            'zh-TW': '不用在聖水洞快閃店排隊時為行李發愁。寄存在聖水站旁的Beeliber，輕鬆打卡。',
            'zh-HK': '不用在聖水洞快閃店排隊時為行李發愁。寄存在聖水站旁的Beeliber，輕鬆打卡。'
        },
        intros: {
            ko: '최근 서울에서 가장 핫한 성수동, 좁은 팝업스토어 안에 무거운 짐을 들고 가기는 너무 힘들죠?',
            en: 'Seongsu-dong is the trendiest spot in Seoul. It\'s hard to bring heavy bags into tiny pop-up stores.',
            ja: '最近ソウルで最もホットな聖水洞、狭いポップアップストアに重い荷物を持っていくのは大変ですよね？',
            zh: '圣水洞是首尔目前最热门的地点。提着重物进入狭窄的快闪店非常不便。',
            'zh-TW': '聖水洞是首爾目前最熱門的地點。提著重物進入狹窄的快閃店非常不便。',
            'zh-HK': '聖水洞是首爾目前最熱門的地點。提著重物進入狹窄的快閃店非常不便。'
        },
        faqs: [
            {
                question: 'Are there storage units near Seongsu pop-up stores?',
                answer: {
                    ko: '성수역과 서울숲 인근에 위치하여 모든 팝업스토어 접근성이 좋습니다.',
                    en: 'Located near Seongsu Stn and Seoul Forest for easy access to all stores.',
                    ja: '聖水駅とソウル森の近くに位置し、全てのストアへのアクセスが良いです。',
                    zh: '位于圣水洞和首尔林附近，方便前往各快闪店。',
            'zh-TW': '位於聖水洞和首爾林附近，方便前往各快閃店。',
            'zh-HK': '位於聖水洞和首爾林附近，方便前往各快閃店。'
                }
            }
        ],
        relatedBranchIds: ['HBO']
    },
    {
        slug: 'bukchon',
        relatedTipIds: ['luggage-free-seoul'],
        keywords: {
            ko: '북촌 한옥마을 짐보관, 안국역 물품보관소, 북촌 캐리어 배송, 익선동 짐보관, 경복궁 짐보관',
            en: 'Bukchon Hanok Village luggage storage, Anguk Station luggage delivery, Ikseon-dong luggage locker',
            ja: '北村韓屋村 荷物預かり, 安国駅 コインロッカー, 益善洞 荷物配送',
            zh: '北村韩屋村行李寄存, 安国站行李寄存, 益善洞行李寄存',
            'zh-TW': '北村韓屋村行李寄存, 安國站行李寄存, 益善洞行李寄存',
            'zh-HK': '北村韓屋村行李寄存, 安國站行李寄存, 益善洞行李寄存'
        },
        titles: {
            ko: '북촌 & 안국역 짐보관 | 한옥마을 오르막길 자유롭게 Beeliber 💅',
            en: 'Bukchon & Anguk Stn Luggage Storage | Hanok Village Free | Beeliber 💅',
            ja: '北村 & 安国駅 荷物預かり | 韓屋村の坂道も自由に | Beeliber 💅',
            zh: '北村 & 安国站行李寄存 | 轻松漫步韩屋村 | Beeliber 💅',
            'zh-TW': '北村 & 安國站行李寄存 | 輕鬆漫步韓屋村 | Beeliber 💅',
            'zh-HK': '北村 & 安國站行李寄存 | 輕鬆漫步韓屋村 | Beeliber 💅'
        },
        descriptions: {
            ko: '북촌 한옥마을의 경사진 골목길, 캐리어를 끌고 다니지 마세요. 안국역 근처 Beeliber에 맡기고 인생샷을 남기세요.',
            en: 'Don\'t drag suitcases through Bukchon\'s hilly alleys. Leave them at Beeliber near Anguk Station.',
            ja: '北村韓屋村の坂道でキャリアを引かないで。安国駅近くのBeeliberに預けて最高の一枚を。',
            zh: '别在北村韩屋村的台阶上拖行行李。寄存在安国站旁的Beeliber，完美打卡。',
            'zh-TW': '別在北村韓屋村的台階上拖行行李。寄存在安國站旁的Beeliber，完美打卡。',
            'zh-HK': '別在北村韓屋村的台階上拖行行李。寄存在安國站旁的Beeliber，完美打卡。'
        },
        intros: {
            ko: '고즈넉한 북촌 한옥마을 투어, 캐리어 소음으로 주민들에게 피해를 줄까 걱정되지는 않나요?',
            en: 'Worried about luggage noise in the quiet Bukchon Village? Travel silent and respectful.',
            ja: '閑静な北村韓屋村ツアー、キャリアの騒音で住民に迷惑をかけないか心配ではありませんか？',
            zh: '在安静的北村韩屋村，担心行李噪音打扰居民吗？请选择无声旅行。',
            'zh-TW': '在安靜的北村韓屋村，擔心行李噪音打擾居民嗎？請選擇無聲旅行。',
            'zh-HK': '在安靜的北村韓屋村，擔心行李噪音打擾居民嗎？請選擇無聲旅行。'
        },
        faqs: [
            {
                question: 'Is it hard to move luggage in Bukchon?',
                answer: {
                    ko: '네, 언덕과 계단이 많아 캐리어 휴대가 매우 어렵습니다. 보관을 권장합니다.',
                    en: 'Yes, hills and stairs make it very difficult. Storage is highly recommended.',
                    ja: 'はい、坂道や階段が多く、キャリアの携帯は非常に困難です。保管をお勧めします。',
                    zh: '是的，坡道和台阶较多，提行李非常困难。建议寄存。',
                    'zh-TW': '是的，坡道和台階較多，提行李非常困難。建議寄存。',
                    'zh-HK': '是的，坡道和台階較多，提行李非常困難。建議寄存。'
                }
            }
        ],
        relatedBranchIds: ['MYN']
    }
];
