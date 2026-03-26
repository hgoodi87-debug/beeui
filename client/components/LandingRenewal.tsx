
import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    ChevronRight,
    MapPin,
    Smartphone,
    Truck,
    Hotel,
    ShieldCheck,
    Menu,
    X,
    Users,
    Package,
    ThumbsUp,
    Globe,
    Sparkles
} from "lucide-react";
import { Branch } from "../types";
import { StorageService } from "../services/storageService";
import { TipAreaInfo } from "../src/domains/shared/types";

import TrackingWidget from "./TrackingWidget";
import LandingHero from "./landing/LandingHero";
import LandingOperationsMarquee from "./landing/LandingOperationsMarquee";

// [스봉이] 아래 섹션들은 스크롤 할 때만 불러오도록 지능적으로 세팅했어요. 💅✨
const LandingPainSection = React.lazy(() => import("./landing/LandingPainSection"));
const LandingHowItWorks = React.lazy(() => import("./landing/LandingHowItWorks"));
const LandingTrustBadge = React.lazy(() => import("./landing/LandingTrustBadge"));
const LandingPricing = React.lazy(() => import("./landing/LandingPricing"));
const LandingReviews = React.lazy(() => import("./landing/LandingReviews"));
const LandingFAQ = React.lazy(() => import("./landing/LandingFAQ"));
const LandingFinalCTA = React.lazy(() => import("./landing/LandingFinalCTA"));
import Logo from "./Logo";


interface LandingRenewalProps {
    t: any;
    lang: string;
    onNavigate: (view: any) => void;
    onLangChange: (lang: string) => void;
    onAdminClick: () => void;
    onLoginClick: () => void;
    onMyPageClick: () => void;
    user: any;
    onSuccess?: (booking: any) => void | Promise<void>;
    branchCode?: string;
    branchData?: Branch;
}

const LandingRenewal: React.FC<LandingRenewalProps> = ({
    t,
    lang,
    onNavigate,
    onLangChange,
    onAdminClick,
    onLoginClick,
    onMyPageClick,
    user,
    onSuccess,
    branchCode,
    branchData
}) => {
    const [isMenuOpen, setIsMenuOpen] = React.useState(false);
    const [showTracking, setShowTracking] = React.useState(false);
    const [tipsAreas, setTipsAreas] = React.useState<any[]>([]);

    React.useEffect(() => {
        // [스봉이] 팁스 지역 데이터를 실시간으로 공수해옵니다! 🛰️✨
        const unsub = StorageService.subscribeTipsAreas((data: TipAreaInfo[]) => {
            // [스봉이] 우선순위가 높은(is_priority_area) 지역들만 예쁘게 골라내요 💅
            const priorityAreas = data.filter(a => a.is_priority_area);
            setTipsAreas(priorityAreas.length > 0 ? priorityAreas : data.slice(0, 4));
        });

        // [스봉이] 메타 광고 트래킹: 랜딩 페이지 조회 💅✨
        import('../services/trackingService').then(({ TrackingService }) => {
            TrackingService.viewContent('Landing Page Renewal');
        });

        return () => unsub();
    }, []);

    return (
        <div className="w-full bg-white selection:bg-bee-yellow selection:text-bee-black overflow-x-hidden">

            {/* Global Navigation */}
            <nav className="fixed top-0 inset-x-0 z-[100] px-4 py-4 transition-all duration-300">
                <div className="max-w-[1200px] mx-auto flex justify-between items-center backdrop-blur-xl bg-black/40 border border-white/10 rounded-full px-6 py-2 shadow-2xl">
                    <div className="flex items-center gap-3">
                        <motion.a
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            href={`/${lang}`}
                            className="flex items-center group cursor-pointer"
                            onClick={(e) => { e.preventDefault(); onNavigate('HOME'); }}
                        >
                            <Logo size="sm" />
                        </motion.a>


                    </div>

                    <div className="flex items-center gap-3">
                        {/* Language Picker */}
                        <div className="relative group">
                            <button className="flex items-center gap-2 px-3 py-1.5 bg-white/10 border border-white/20 rounded-full text-white text-[11px] font-black tracking-wider hover:bg-white/20 transition-all uppercase shadow-lg">
                                <img
                                    src={`https://flagcdn.com/w40/${lang === 'ko' ? 'kr' : lang === 'en' ? 'us' : lang === 'ja' ? 'jp' : lang === 'zh' ? 'cn' : lang === 'zh-TW' ? 'tw' : 'hk'}.png`}
                                    alt={lang}
                                    className="w-4 h-auto rounded-sm shadow-sm"
                                />
                                <span className="opacity-90">
                                    {lang === 'ko' ? 'KR' : lang === 'en' ? 'EN' : lang === 'ja' ? 'JP' : lang === 'zh' ? 'CN' : lang === 'zh-TW' ? 'TW' : 'HK'}
                                </span>
                            </button>
                            <div className="absolute top-full right-0 pt-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-[101]">
                                <div className="bg-white rounded-2xl shadow-2xl p-2 min-w-[150px] border border-black/5">
                                    {[
                                        { id: 'ko', name: '한국어', flag: 'kr' },
                                        { id: 'en', name: 'English', flag: 'us' },
                                        { id: 'ja', name: '日本語', flag: 'jp' },
                                        { id: 'zh', name: '中文(简)', flag: 'cn' },
                                        { id: 'zh-TW', name: '繁體中文', flag: 'tw' },
                                        { id: 'zh-HK', name: '廣東話', flag: 'hk' }
                                    ].map(item => (
                                        <button
                                            key={item.id}
                                            onClick={() => onLangChange(item.id)}
                                            className={`w-full flex items-center justify-between px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-colors ${lang === item.id ? 'bg-bee-black text-bee-yellow' : 'hover:bg-gray-50 text-bee-muted'}`}
                                        >
                                            <div className="flex items-center gap-2.5">
                                                <img
                                                    src={`https://flagcdn.com/w40/${item.flag}.png`}
                                                    alt={item.name}
                                                    className="w-4 h-auto rounded-sm shadow-sm"
                                                />
                                                <span>{item.name}</span>
                                            </div>
                                            {lang === item.id && <div className="w-1 h-1 rounded-full bg-bee-yellow" />}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="hidden md:flex items-center gap-6 mr-2">
                            {user && !user.isAnonymous ? (
                                <button onClick={onMyPageClick} className="text-[11px] font-black text-white/80 hover:text-bee-yellow uppercase tracking-[0.2em] transition-colors flex items-center gap-2">
                                    <Users className="w-3.5 h-3.5" />
                                    {user.displayName || t.nav.mypage}
                                </button>
                            ) : (
                                <button onClick={onLoginClick} className="text-[11px] font-black text-white/80 hover:text-bee-yellow uppercase tracking-[0.2em] transition-colors">
                                    {t.nav.login}
                                </button>
                            )}
                        </div>

                        <button
                            onClick={() => setIsMenuOpen(!isMenuOpen)}
                            className="w-10 h-10 rounded-xl bg-bee-yellow text-bee-black flex items-center justify-center hover:scale-110 active:scale-95 transition-all shadow-xl"
                        >
                            {isMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                        </button>
                    </div>
                </div>
            </nav>

            {/* Mobile Menu Overlay */}
            <AnimatePresence>
                {isMenuOpen && (
                    <motion.div
                        initial={{ opacity: 0, scale: 1.1 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 1.1 }}
                        className="fixed inset-0 z-[99] bg-bee-black/95 backdrop-blur-2xl flex items-center justify-center p-12"
                    >
                        <div className="flex flex-col gap-8 text-center">
                            {[
                                { id: 'SERVICES', label: t.nav.services, path: 'services' },
                                { id: 'LOCATIONS', label: t.nav.locations, path: 'locations' },
                                { id: 'VISION', label: 'Brand Vision', path: 'vision' },
                                { id: 'PARTNERSHIP', label: t.nav.partners, path: 'partnership' },
                                { id: 'QNA', label: 'Q&A', path: 'qna' },
                                { id: 'TRACKING', label: t.hero?.track_booking || '예약 조회', path: 'tracking' },
                                { id: 'MYPAGE', label: user && !user.isAnonymous ? t.nav.mypage : t.nav.login, path: 'mypage' }
                            ].map((item, i) => (
                                <motion.a
                                    key={item.id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: i * 0.1 }}
                                    href={`/${lang}/${item.path}`}
                                    onClick={(e) => {
                                        e.preventDefault();
                                        if (item.id === 'MYPAGE') {
                                            if (user && !user.isAnonymous) onMyPageClick();
                                            else onLoginClick();
                                        } else if (item.id === 'TRACKING') {
                                            setShowTracking(true);
                                        } else {
                                            onNavigate(item.id);
                                        }
                                        setIsMenuOpen(false);
                                    }}
                                    className="text-2xl md:text-5xl font-display font-black text-white hover:text-bee-yellow transition-colors tracking-tighter uppercase cursor-pointer"
                                >
                                    {item.label}
                                </motion.a>
                            ))}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* 7-Step Main Sections */}
            <main>
                <LandingHero
                    t={t}
                    lang={lang}
                    onNavigate={onNavigate}
                    onTrackClick={() => setShowTracking(true)}
                    branchCode={branchCode}
                    branchData={branchData}
                />

                <LandingOperationsMarquee t={t} />

                {/* 💅 THE SEOUL HUB 섹션 - 비활성화됨 (숨김 처리) */}
                {/* <section className="py-24 bg-white border-y border-gray-100">
                    ... THE SEOUL HUB section hidden ...
                </section> */}

                <React.Suspense fallback={<div className="h-40 bg-gray-50 animate-pulse" />}>
                    <LandingPainSection t={t} />
                    <LandingHowItWorks t={t} />
                    <LandingTrustBadge t={t} />
                    <LandingPricing t={t} onNavigate={onNavigate} lang={lang} />
                    <LandingReviews t={t} />
                    <LandingFAQ t={t} />
                    <LandingFinalCTA t={t} onNavigate={onNavigate} lang={lang} />
                </React.Suspense>
            </main>

            <AnimatePresence>
                {showTracking && (
                    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 md:p-10">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-black/60 backdrop-blur-3xl"
                            onClick={() => setShowTracking(false)}
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="relative w-full max-w-5xl bg-white rounded-[3.5rem] shadow-[0_50px_100px_-20px_rgba(0,0,0,0.5)] overflow-hidden"
                        >
                            {/* Modal Header 💅 */}
                            <div className="absolute top-8 right-8 z-[1001]">
                                <button
                                    onClick={() => setShowTracking(false)}
                                    className="w-14 h-14 rounded-full bg-gray-50 flex items-center justify-center hover:bg-bee-yellow hover:scale-110 transition-all active:scale-95 shadow-lg border border-gray-100"
                                    title="Close Tracking"
                                >
                                    <X className="w-6 h-6 text-bee-black" />
                                </button>
                            </div>

                            <div className="p-10 md:p-20 max-h-[90vh] overflow-y-auto custom-scrollbar">
                                <TrackingWidget t={t} isModal={true} onClose={() => setShowTracking(false)} theme="light" />
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default LandingRenewal;
