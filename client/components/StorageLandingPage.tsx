import React, { useCallback, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { MapPin, Clock, ArrowLeft, Star, Luggage } from 'lucide-react';
import SEO from './SEO';
import { SEO_LOCATIONS } from '../src/constants/seoLocations';
import { LOCAL_BUSINESS_SCHEMAS } from '../src/constants/localBusinessSchemas';

interface StorageLandingPageProps {
    lang: string;
    onBack: () => void;
    onBook: (locationId: string) => void;
    mode?: 'storage' | 'delivery';
}

type LangKey = 'ko' | 'en' | 'ja' | 'zh' | 'zh-TW' | 'zh-HK';

const getLangKey = (lang: string): LangKey => {
    if (lang === 'zh-tw') return 'zh-TW';
    if (lang === 'zh-hk') return 'zh-HK';
    if (lang === 'zh') return 'zh';
    if (lang === 'ja') return 'ja';
    if (lang === 'en') return 'en';
    return 'ko';
};

const UI_TEXT: Record<LangKey, {
    bookNow: string;
    backToLocations: string;
    relatedSpots: string;
    howToUse: string;
    step1: string;
    step2: string;
    step3: string;
    faq: string;
    notFound: string;
    notFoundDesc: string;
}> = {
    'zh-TW': {
        bookNow: '立即預約',
        backToLocations: '返回據點列表',
        relatedSpots: '附近景點',
        howToUse: '如何使用',
        step1: '線上預約選擇據點與時段',
        step2: '到達據點寄放行李',
        step3: '盡情遊玩，隨時取回',
        faq: '常見問題',
        notFound: '找不到此地區',
        notFoundDesc: '請返回據點列表查看所有可用地點。',
    },
    'zh-HK': {
        bookNow: '立即預約',
        backToLocations: '返回據點列表',
        relatedSpots: '附近景點',
        howToUse: '如何使用',
        step1: '網上預約選擇據點與時段',
        step2: '到達據點寄存行李',
        step3: '盡情遊玩，隨時取回',
        faq: '常見問題',
        notFound: '找不到此地區',
        notFoundDesc: '請返回據點列表查看所有可用地點。',
    },
    'en': {
        bookNow: 'Book Now',
        backToLocations: 'Back to Locations',
        relatedSpots: 'Nearby Spots',
        howToUse: 'How to Use',
        step1: 'Book online — select branch & time',
        step2: 'Drop off your bags at the branch',
        step3: 'Explore freely, pick up anytime',
        faq: 'FAQ',
        notFound: 'Location Not Found',
        notFoundDesc: 'Please go back to see all available locations.',
    },
    'ja': {
        bookNow: '今すぐ予約',
        backToLocations: '拠点リストに戻る',
        relatedSpots: '近くの観光スポット',
        howToUse: '使い方',
        step1: 'オンラインで拠点と時間を予約',
        step2: '拠点に荷物を預ける',
        step3: '自由に観光、いつでも受け取り',
        faq: 'よくある質問',
        notFound: '地区が見つかりません',
        notFoundDesc: '拠点リストに戻って利用可能な場所を確認してください。',
    },
    'zh': {
        bookNow: '立即预约',
        backToLocations: '返回据点列表',
        relatedSpots: '附近景点',
        howToUse: '如何使用',
        step1: '线上预约选择据点与时段',
        step2: '到达据点寄存行李',
        step3: '尽情游玩，随时取回',
        faq: '常见问题',
        notFound: '找不到此地区',
        notFoundDesc: '请返回据点列表查看所有可用地点。',
    },
    'ko': {
        bookNow: '지금 예약하기',
        backToLocations: '지점 목록으로',
        relatedSpots: '근처 관광지',
        howToUse: '이용 방법',
        step1: '온라인으로 지점과 시간 예약',
        step2: '지점에 짐 맡기기',
        step3: '자유롭게 여행, 언제든 찾기',
        faq: '자주 묻는 질문',
        notFound: '지역을 찾을 수 없습니다',
        notFoundDesc: '지점 목록으로 돌아가 이용 가능한 지점을 확인하세요.',
    },
};

const CATEGORY_ICON: Record<string, string> = {
    landmark: '🏛️',
    shopping: '🛍️',
    food: '🍜',
    culture: '🎭',
    nature: '🌿',
};

const cleanTitleText = (value: string) =>
    value
        .replace(/[💅✨]/g, '')
        .replace(/\s+/g, ' ')
        .trim();

const getAreaLabel = (location: typeof SEO_LOCATIONS[number], lk: LangKey) => {
    const title = location.titles[lk] || location.titles.en || location.slug;
    return cleanTitleText(title.split('|')[0] || title)
        .replace(/\s*(짐보관|Luggage Storage|Storage|荷物預かり|行李寄放|行李寄存).*$/i, '')
        .trim() || location.slug;
};

const buildDeliveryMeta = (location: typeof SEO_LOCATIONS[number], lk: LangKey) => {
    const area = getAreaLabel(location, lk);
    const metaByLang: Record<LangKey, { title: string; description: string; keywords: string }> = {
        'zh-TW': {
            title: `${area} 機場當日行李配送 | Beeliber`,
            description: `從${area}寄送行李到仁川機場T1·T2。退房後先去逛街，當天在機場取回行李。`,
            keywords: `${area} 行李配送, 仁川機場行李配送, 首爾行李配送, 韓國行李寄放`,
        },
        'zh-HK': {
            title: `${area} 機場即日行李配送 | Beeliber`,
            description: `從${area}寄送行李到仁川機場T1·T2。退房後先去行街，即日在機場取回行李。`,
            keywords: `${area} 行李配送, 仁川機場行李配送, 首爾行李配送, 韓國行李寄存`,
        },
        en: {
            title: `${area} Airport Luggage Delivery | Beeliber`,
            description: `Send luggage from ${area} to Incheon Airport T1 or T2 on the same day. Explore after check-out and pick up your bags at the airport.`,
            keywords: `${area} luggage delivery, Incheon airport luggage delivery, Seoul luggage delivery, same-day airport luggage delivery`,
        },
        ja: {
            title: `${area} 空港当日荷物配送 | Beeliber`,
            description: `${area}から仁川空港T1·T2まで当日荷物配送。チェックアウト後は身軽に観光し、空港で荷物を受け取れます。`,
            keywords: `${area} 荷物配送, 仁川空港 荷物配送, ソウル 荷物配送, 当日配送`,
        },
        zh: {
            title: `${area} 机场当日行李配送 | Beeliber`,
            description: `从${area}寄送行李到仁川机场T1·T2。退房后轻松逛街，当天在机场取回行李。`,
            keywords: `${area} 行李配送, 仁川机场行李配送, 首尔行李配送, 韩国行李寄存`,
        },
        ko: {
            title: `${area} 공항 당일 짐배송 | 빌리버`,
            description: `${area}에서 인천공항 T1·T2까지 당일 짐배송을 예약하세요. 체크아웃 후 가볍게 이동하고 공항에서 캐리어를 찾을 수 있습니다.`,
            keywords: `${area} 짐배송, 인천공항 짐배송, 서울 당일 짐배송, 공항 캐리어 배송`,
        },
    };

    return metaByLang[lk] || metaByLang.en;
};

const buildDeliveryFaqs = (location: typeof SEO_LOCATIONS[number], lk: LangKey) => {
    const area = getAreaLabel(location, lk);
    return [
        {
            question: lk === 'ko' ? `${area}에서 인천공항으로 당일 짐배송이 가능한가요?`
                : lk === 'en' ? `Can I send luggage from ${area} to Incheon Airport on the same day?`
                : lk === 'ja' ? `${area}から仁川空港へ当日荷物配送できますか？`
                : `${area}可以當日配送行李到仁川機場嗎？`,
            answer: {
                ko: `${area} 인근 빌리버 지점에 짐을 맡기면 인천공항 T1·T2 출국장 수령 지점으로 당일 배송할 수 있습니다. 예약 시 날짜와 공항 터미널을 확인하세요.`,
                en: `Yes. Drop off your bags at a Beeliber branch near ${area}, then pick them up at the Incheon Airport T1 or T2 departure hall on the same day.`,
                ja: `はい。${area}近くのBeeliber拠点に荷物を預けると、同日中に仁川空港T1·T2の出発ロビーで受け取れます。`,
                zh: `可以。将行李交给${area}附近的Beeliber据点后，当天可在仁川机场T1·T2出境大厅取回。`,
                'zh-TW': `可以。將行李交給${area}附近的Beeliber據點後，當天可在仁川機場T1·T2出境大廳取回。`,
                'zh-HK': `可以。將行李交給${area}附近的Beeliber據點後，即日可在仁川機場T1·T2出境大堂取回。`,
            },
        },
        {
            question: lk === 'ko' ? '캐리어 외 짐도 배송할 수 있나요?'
                : lk === 'en' ? 'Can I send bags other than suitcases?'
                : lk === 'ja' ? 'スーツケース以外も配送できますか？'
                : '行李箱以外也可以配送嗎？',
            answer: {
                ko: '캐리어, 쇼핑백, 손가방은 배송할 수 있습니다. 유모차와 자전거는 배송이 아닌 지점 보관만 가능합니다.',
                en: 'Suitcases, shopping bags, and handbags are accepted for delivery. Strollers and bicycles are storage-only.',
                ja: 'スーツケース、ショッピングバッグ、ハンドバッグは配送できます。ベビーカーと自転車は保管のみ対応しています。',
                zh: '行李箱、购物袋、手提包可以配送。婴儿车与自行车仅支持据点寄存。',
                'zh-TW': '行李箱、購物袋、手提包可以配送。嬰兒車與自行車僅支援據點寄放。',
                'zh-HK': '行李箱、購物袋、手提包可以配送。嬰兒車與單車只支援據點寄存。',
            },
        },
        {
            question: lk === 'ko' ? '공항에서 어디서 수령하나요?'
                : lk === 'en' ? 'Where do I pick up my bags at the airport?'
                : lk === 'ja' ? '空港ではどこで受け取れますか？'
                : '在機場哪裡取回行李？',
            answer: {
                ko: '인천공항 T1은 3층 출국장 A카운터, T2는 3층 출국장 H카운터 기준으로 안내합니다. 실제 수령 지점은 예약 안내에서 다시 확인하세요.',
                en: 'For Incheon Airport, we guide travelers to T1 3F Departure Hall A Counter or T2 3F Departure Hall H Counter. Confirm the final pickup point in your booking notice.',
                ja: '仁川空港T1は3階出発ロビーAカウンター、T2は3階出発ロビーHカウンターを基準にご案内します。予約案内で最終受け取り場所をご確認ください。',
                zh: '仁川机场T1为3楼出境大厅A柜台，T2为3楼出境大厅H柜台。请在预约通知中再次确认实际取件点。',
                'zh-TW': '仁川機場T1為3樓出境大廳A櫃台，T2為3樓出境大廳H櫃台。請在預約通知中再次確認實際取件點。',
                'zh-HK': '仁川機場T1為3樓出境大堂A櫃台，T2為3樓出境大堂H櫃台。請在預約通知中再次確認實際取件點。',
            },
        },
    ];
};

const StorageLandingPage: React.FC<StorageLandingPageProps> = ({ lang, onBack, onBook, mode = 'storage' }) => {
    const { slug } = useParams<{ slug: string }>();
    const lk = getLangKey(lang);
    const ui = UI_TEXT[lk];
    const isDelivery = mode === 'delivery';
    const pagePath = `/${mode}/${slug || ''}`;

    const location = SEO_LOCATIONS.find((loc) => loc.slug === slug);

    useEffect(() => {
        window.scrollTo(0, 0);
    }, [slug]);

    // viewContent — 페이지 진입 시 GA4 + Meta Pixel 이벤트 발화
    useEffect(() => {
        if (!location) return;
        import('../services/trackingService').then(({ TrackingService }) => {
            TrackingService.viewContent(
                `${isDelivery ? '배송' : '보관'} — ${location.slug}`,
                location.slug,
                undefined,
                {
                    item_category: isDelivery ? 'delivery' : 'storage',
                    item_category2: location.slug,
                }
            );
        });
    }, [slug, isDelivery, location]);

    const handleBook = useCallback((locationId: string) => {
        import('../services/trackingService').then(({ TrackingService }) => {
            TrackingService.addToCart(undefined, {
                item_id: slug || '',
                item_name: `${isDelivery ? '배송' : '보관'} — ${slug}`,
                item_category: isDelivery ? 'delivery' : 'storage',
                item_category2: slug || '',
            });
        });
        onBook(locationId);
    }, [slug, isDelivery, onBook]);

    // 해당 slug를 찾지 못한 경우
    if (!location) {
        return (
            <div className="min-h-screen bg-gradient-to-b from-[#111] to-[#1a1a1a] flex flex-col items-center justify-center px-6 text-white">
                <SEO lang={lang} path={pagePath} noIndex />
                <p className="text-2xl font-bold mb-3">{ui.notFound}</p>
                <p className="text-white/60 mb-8 text-center">{ui.notFoundDesc}</p>
                <button
                    onClick={onBack}
                    className="flex items-center gap-2 px-6 py-3 rounded-full bg-[#FFD700] text-black font-bold"
                >
                    <ArrowLeft size={16} />
                    {ui.backToLocations}
                </button>
            </div>
        );
    }

    const deliveryMeta = buildDeliveryMeta(location, lk);
    const title = isDelivery ? deliveryMeta.title : location.titles[lk] || location.titles.en;
    const description = isDelivery ? deliveryMeta.description : location.descriptions[lk] || location.descriptions.en;
    const intro = isDelivery
        ? description
        : location.intros[lk] || location.intros.en;
    const keywords = isDelivery ? deliveryMeta.keywords : location.keywords[lk] || location.keywords.en;
    const faqs = isDelivery ? buildDeliveryFaqs(location, lk) : location.faqs;
    const steps = isDelivery
        ? {
            'zh-TW': ['線上預約行李配送與機場航廈', '到達據點交付行李', '在仁川機場取回行李'],
            'zh-HK': ['網上預約行李配送與機場航廈', '到達據點交付行李', '在仁川機場取回行李'],
            en: ['Book delivery and airport terminal online', 'Drop off your bags at the branch', 'Pick up at Incheon Airport'],
            ja: ['オンラインで配送と空港ターミナルを予約', '拠点で荷物を預ける', '仁川空港で受け取り'],
            zh: ['线上预约行李配送与机场航站楼', '到达据点交付行李', '在仁川机场取回行李'],
            ko: ['온라인으로 배송과 공항 터미널 예약', '지점에서 짐 맡기기', '인천공항에서 짐 수령'],
        }[lk]
        : [ui.step1, ui.step2, ui.step3];
    const serviceLabel = isDelivery
        ? ({ 'zh-TW': '機場行李配送', 'zh-HK': '機場行李配送', en: 'Airport Luggage Delivery', ja: '空港荷物配送', zh: '机场行李配送', ko: '공항 짐배송' }[lk])
        : 'Beeliber';
    const ctaLabel = isDelivery
        ? ({ 'zh-TW': '預約機場配送', 'zh-HK': '預約機場配送', en: 'Book Airport Delivery', ja: '空港配送を予約', zh: '预约机场配送', ko: '공항 배송 예약하기' }[lk])
        : ui.bookNow;

    // JSON-LD: FAQPage + LocalBusiness 배열 → @graph로 묶어서 주입
    const localBusinessList = LOCAL_BUSINESS_SCHEMAS[location.slug] || [];
    const faqEntity = faqs.length > 0 ? {
        '@type': 'FAQPage',
        mainEntity: faqs.map((faq) => ({
            '@type': 'Question',
            name: faq.question,
            acceptedAnswer: { '@type': 'Answer', text: faq.answer[lk] || faq.answer['en'] },
        })),
    } : null;

    const combinedSchema = (localBusinessList.length > 0 || faqEntity) ? {
        '@context': 'https://schema.org',
        '@graph': [
            ...localBusinessList.map(({ '@context': _ctx, ...rest }) => rest),
            ...(faqEntity ? [faqEntity] : []),
        ],
    } : undefined;

    const fadeUp = {
        initial: { opacity: 0, y: 24 },
        whileInView: { opacity: 1, y: 0 },
        viewport: { once: true },
        transition: { duration: 0.55, ease: [0.25, 0.1, 0.25, 1] as const },
    };

    return (
        <div className="min-h-screen bg-[#111] text-white">
            <SEO
                title={title}
                description={description}
                keywords={keywords}
                lang={lang}
                path={pagePath}
                schema={combinedSchema}
            />

            {/* Hero */}
            <div className="relative overflow-hidden bg-gradient-to-br from-[#1a1a1a] to-[#0d0d0d] pt-16 pb-20 px-6">
                <div className="absolute inset-0 opacity-5">
                    <div className="absolute top-10 right-10 w-64 h-64 rounded-full bg-[#FFD700] blur-3xl" />
                    <div className="absolute bottom-0 left-0 w-48 h-48 rounded-full bg-[#FFD700] blur-2xl" />
                </div>

                <div className="relative max-w-2xl mx-auto">
                    <button
                        onClick={onBack}
                        className="flex items-center gap-1.5 text-white/50 hover:text-white text-sm mb-8 transition-colors"
                    >
                        <ArrowLeft size={15} />
                        {ui.backToLocations}
                    </button>

                    <motion.div {...fadeUp}>
                        <div className="flex items-center gap-2 mb-3">
                            <Luggage size={18} className="text-[#FFD700]" />
                            <span className="text-[#FFD700] text-sm font-medium">{serviceLabel}</span>
                        </div>
                        <h1 className="text-3xl md:text-4xl font-bold leading-tight mb-4">{title}</h1>
                        <p className="text-white/70 text-base leading-relaxed mb-8">{description}</p>

                        <button
                            onClick={() => handleBook(location.relatedBranchIds[0] || '')}
                            className="inline-flex items-center gap-2 px-8 py-4 rounded-full bg-[#FFD700] text-black font-bold text-base hover:bg-[#FFE44D] transition-colors shadow-lg shadow-[#FFD700]/20"
                        >
                            {ctaLabel}
                        </button>
                    </motion.div>
                </div>
            </div>

            <div className="max-w-2xl mx-auto px-6 py-12 space-y-14">

                {/* 소개 텍스트 */}
                {intro && (
                    <motion.section {...fadeUp}>
                        <p className="text-white/80 text-base leading-relaxed whitespace-pre-line">{intro}</p>
                    </motion.section>
                )}

                {/* 이용 방법 */}
                <motion.section {...fadeUp}>
                    <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                        <Star size={18} className="text-[#FFD700]" />
                        {ui.howToUse}
                    </h2>
                    <div className="space-y-4">
                        {steps.map((step, i) => (
                            <div key={i} className="flex items-start gap-4">
                                <div className="w-8 h-8 rounded-full bg-[#FFD700] text-black font-bold text-sm flex items-center justify-center shrink-0">
                                    {i + 1}
                                </div>
                                <p className="text-white/80 pt-1">{step}</p>
                            </div>
                        ))}
                    </div>
                </motion.section>

                {/* 근처 관광지 */}
                {location.touristSpots.length > 0 && (
                    <motion.section {...fadeUp}>
                        <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                            <MapPin size={18} className="text-[#FFD700]" />
                            {ui.relatedSpots}
                        </h2>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {location.touristSpots.slice(0, 6).map((spot) => {
                                const spotName = spot.name[lk] || spot.name['en'];
                                const spotDesc = spot.description[lk] || spot.description['en'];
                                return (
                                    <div
                                        key={spot.id}
                                        className="rounded-2xl bg-white/5 border border-white/10 p-4 hover:bg-white/8 transition-colors"
                                    >
                                        <div className="flex items-center gap-2 mb-2">
                                            <span className="text-lg">{CATEGORY_ICON[spot.category] || '📍'}</span>
                                            <span className="font-semibold text-sm">{spotName}</span>
                                        </div>
                                        <p className="text-white/60 text-xs leading-relaxed line-clamp-2">{spotDesc}</p>
                                        {spot.distance && (
                                            <div className="flex items-center gap-1 mt-2">
                                                <Clock size={11} className="text-white/40" />
                                                <span className="text-white/40 text-xs">{spot.distance}</span>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </motion.section>
                )}

                {/* FAQ */}
                {faqs.length > 0 && (
                    <motion.section {...fadeUp}>
                        <h2 className="text-xl font-bold mb-6">{ui.faq}</h2>
                        <div className="space-y-4">
                            {faqs.map((faq, i) => {
                                const answer = faq.answer[lk] || faq.answer['en'];
                                return (
                                    <div key={i} className="rounded-2xl bg-white/5 border border-white/10 p-5">
                                        <p className="font-semibold text-sm mb-2">Q. {faq.question}</p>
                                        <p className="text-white/70 text-sm leading-relaxed">{answer}</p>
                                    </div>
                                );
                            })}
                        </div>
                    </motion.section>
                )}

                {/* Bottom CTA */}
                <motion.div {...fadeUp} className="text-center pt-4 pb-8">
                    <button
                        onClick={() => handleBook(location.relatedBranchIds[0] || '')}
                        className="inline-flex items-center gap-2 px-10 py-4 rounded-full bg-[#FFD700] text-black font-bold text-base hover:bg-[#FFE44D] transition-colors shadow-lg shadow-[#FFD700]/20"
                    >
                        {ctaLabel}
                    </button>
                </motion.div>
            </div>
        </div>
    );
};

export default StorageLandingPage;
