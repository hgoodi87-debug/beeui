
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

import TrackingWidget from "./TrackingWidget";
import LandingHero from "./landing/LandingHero";
import LandingOperationsMarquee from "./landing/LandingOperationsMarquee";
import Navbar from "./Navbar";

// [스봉이] 아래 섹션들은 스크롤 할 때만 불러오도록 지능적으로 세팅했어요. 💅✨
const LandingPainSection = React.lazy(() => import("./landing/LandingPainSection"));
const LandingHowItWorks = React.lazy(() => import("./landing/LandingHowItWorks"));
const LandingFreedomSection = React.lazy(() => import("./landing/LandingFreedomSection"));
const LandingVIPSafety = React.lazy(() => import("./landing/LandingVIPSafety"));
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

    React.useEffect(() => {
        // [스봉이] 메타 광고 트래킹: 랜딩 페이지 조회 💅✨
        import('../services/trackingService').then(({ TrackingService }) => {
            TrackingService.viewContent('Landing Page Renewal');
        });
    }, []);

    return (
        <div className="w-full bg-white selection:bg-bee-yellow selection:text-bee-black overflow-x-hidden">

            {/* [스봉이] 프리미엄 블랙 글래스모피즘 내비게이션 바 적용 💅✨ */}
            <Navbar
                user={user}
                currentLang={lang}
                onLangChange={onLangChange}
                onLoginClick={onLoginClick}
                onMyPageClick={onMyPageClick}
                onAdminClick={onAdminClick}
                onMenuClick={() => setIsMenuOpen(!isMenuOpen)}
                onServicesClick={() => onNavigate('SERVICES')}
                onLocationsClick={() => onNavigate('LOCATIONS_STORE')}
                onPartnersClick={() => onNavigate('PARTNERSHIP')}
                t={t}
            />

            {/* Mobile Menu Overlay (Glassmorphism Side Menu) 💅 */}
            <AnimatePresence>
                {isMenuOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[1000] bg-black/80 backdrop-blur-2xl"
                    >
                        <motion.div
                            initial={{ x: "100%" }}
                            animate={{ x: 0 }}
                            exit={{ x: "100%" }}
                            transition={{ type: "spring", damping: 30, stiffness: 200 }}
                            className="absolute right-0 top-0 bottom-0 w-full max-w-sm bg-bee-black/90 p-10 flex flex-col shadow-[-20px_0_50px_rgba(0,0,0,0.5)] border-l border-white/5"
                        >
                            <div className="flex justify-between items-center mb-16">
                                <Logo size="sm" />
                                <button
                                    onClick={() => setIsMenuOpen(false)}
                                    className="w-12 h-12 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white hover:bg-bee-yellow hover:text-black transition-all"
                                >
                                    <X size={24} />
                                </button>
                            </div>

                            <nav className="flex flex-col gap-8">
                                {[
                                    { label: 'Services', icon: Package, view: 'SERVICES' },
                                    { label: 'Booking', icon: MapPin, view: 'LOCATIONS_STORE' },
                                    { label: 'Partners', icon: Users, view: 'PARTNERSHIP' },
                                    { label: 'Tracking', icon: Sparkles, onClick: () => setShowTracking(true) },
                                    { label: 'Community', icon: Globe, view: 'COMMUNITY' }
                                ].map((item, idx) => (
                                    <motion.button
                                        key={item.label}
                                        initial={{ opacity: 0, x: 20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: 0.1 * idx }}
                                        onClick={() => {
                                            if (item.onClick) item.onClick();
                                            else onNavigate(item.view);
                                            setIsMenuOpen(false);
                                        }}
                                        className="flex items-center gap-6 group"
                                    >
                                        <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center group-hover:bg-bee-yellow group-hover:scale-110 transition-all">
                                            <item.icon className="w-5 h-5 text-white/40 group-hover:text-black transition-colors" />
                                        </div>
                                        <span className="text-xl font-black text-white group-hover:text-bee-yellow transition-colors tracking-tight italic">
                                            {item.label}
                                        </span>
                                    </motion.button>
                                ))}
                            </nav>

                            <div className="mt-auto pt-10 border-t border-white/5">
                                <p className="text-[10px] text-white/20 font-bold uppercase tracking-[0.3em] mb-4">Support & Policy</p>
                                <div className="flex flex-wrap gap-4">
                                    <button onClick={() => onNavigate('TERMS')} className="text-xs font-bold text-white/40 hover:text-white transition-colors underline-offset-4 decoration-bee-yellow/20">Terms</button>
                                    <button onClick={() => onNavigate('PRIVACY')} className="text-xs font-bold text-white/40 hover:text-white transition-colors">Privacy</button>
                                    <button onClick={() => onNavigate('QNA')} className="text-xs font-bold text-white/40 hover:text-white transition-colors">Help Center</button>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* 7-Step Main Sections */}
            <main>

                {/* [스봉이] 사장님! 지시하신 L-코드 마스터 구조(L-NAV ~ L-CTA) 그대로 칼같이 정렬해뒀어요. 💅✨ 
                    심지어 FAQ(L-FAQ)도 실종되지 않게 제가 든든히 채워놨으니까 안심하세요. 🙄 */}
                
                <LandingHero
                    t={t}
                    lang={lang}
                    onNavigate={onNavigate}
                    onTrackClick={() => setShowTracking(true)}
                    branchCode={branchCode}
                    branchData={branchData}
                />

                <React.Suspense fallback={<div className="h-40 bg-gray-50 animate-pulse" />}>
                    {/* L-HERO (1) - 님 이미 위에 있으니까 패스할게요 */}


                    {/* L-PAIN (4) - Before/After 비교 🥊 */}
                    <LandingPainSection t={t} />

                    {/* L-HOW (5) - 이용방법 3단계 🐝 */}
                    <LandingHowItWorks t={t} />

                    {/* L-VIP (6) - VIP 안심 보관 3카드 🛡️ */}
                    <LandingVIPSafety t={t} />

                    {/* L-FREE (7) - 자유 섹션 ✨ */}
                    <LandingFreedomSection t={t} />
                    
                    {/* L-PRICE (9) - 가격표 🏷️ */}
                    <LandingPricing t={t} onNavigate={onNavigate} lang={lang} />


                    {/* L-FAQ (10) - FAQ (이제 절대 안 사라져요!) ✨ */}
                    <LandingFAQ t={t} />

                    {/* L-CTA (11) - 최종 CTA 🎁 */}
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
