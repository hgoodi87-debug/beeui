import React, { useEffect } from 'react';
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

const StorageLandingPage: React.FC<StorageLandingPageProps> = ({ lang, onBack, onBook }) => {
    const { slug } = useParams<{ slug: string }>();
    const lk = getLangKey(lang);
    const ui = UI_TEXT[lk];

    const location = SEO_LOCATIONS.find((loc) => loc.slug === slug);

    useEffect(() => {
        window.scrollTo(0, 0);
    }, [slug]);

    // 해당 slug를 찾지 못한 경우
    if (!location) {
        return (
            <div className="min-h-screen bg-gradient-to-b from-[#111] to-[#1a1a1a] flex flex-col items-center justify-center px-6 text-white">
                <SEO lang={lang} path={`/storage/${slug || ''}`} />
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

    const title = location.titles[lk] || location.titles['en'];
    const description = location.descriptions[lk] || location.descriptions['en'];
    const intro = location.intros[lk] || location.intros['en'];
    const keywords = location.keywords[lk] || location.keywords['en'];

    // JSON-LD FAQPage 스키마
    const faqSchema = location.faqs.length > 0 ? {
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: location.faqs.map((faq) => ({
            '@type': 'Question',
            name: faq.question,
            acceptedAnswer: {
                '@type': 'Answer',
                text: faq.answer[lk] || faq.answer['en'],
            },
        })),
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
                path={`/storage/${slug}`}
                schema={faqSchema}
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
                            <span className="text-[#FFD700] text-sm font-medium">Beeliber</span>
                        </div>
                        <h1 className="text-3xl md:text-4xl font-bold leading-tight mb-4">{title}</h1>
                        <p className="text-white/70 text-base leading-relaxed mb-8">{description}</p>

                        <button
                            onClick={() => onBook(location.relatedBranchIds[0] || '')}
                            className="inline-flex items-center gap-2 px-8 py-4 rounded-full bg-[#FFD700] text-black font-bold text-base hover:bg-[#FFE44D] transition-colors shadow-lg shadow-[#FFD700]/20"
                        >
                            {ui.bookNow}
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
                        {[ui.step1, ui.step2, ui.step3].map((step, i) => (
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
                {location.faqs.length > 0 && (
                    <motion.section {...fadeUp}>
                        <h2 className="text-xl font-bold mb-6">{ui.faq}</h2>
                        <div className="space-y-4">
                            {location.faqs.map((faq, i) => {
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
                        onClick={() => onBook(location.relatedBranchIds[0] || '')}
                        className="inline-flex items-center gap-2 px-10 py-4 rounded-full bg-[#FFD700] text-black font-bold text-base hover:bg-[#FFE44D] transition-colors shadow-lg shadow-[#FFD700]/20"
                    >
                        {ui.bookNow}
                    </button>
                </motion.div>
            </div>
        </div>
    );
};

export default StorageLandingPage;
