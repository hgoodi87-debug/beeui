
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

import TrackingWidget from "./TrackingWidget";
import LandingHero from "./landing/LandingHero";
import LandingPainSection from "./landing/LandingPainSection";
import LandingHowItWorks from "./landing/LandingHowItWorks";
import LandingTrustBadge from "./landing/LandingTrustBadge";
import LandingPricing from "./landing/LandingPricing";
import LandingReviews from "./landing/LandingReviews";
import LandingFinalCTA from "./landing/LandingFinalCTA";
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
    branchCode
}) => {
    const [isMenuOpen, setIsMenuOpen] = React.useState(false);
    const [showTracking, setShowTracking] = React.useState(false);

    return (
        <div className="w-full bg-white selection:bg-bee-yellow selection:text-bee-black overflow-x-hidden">

            {/* Global Navigation */}
            <nav className="fixed top-0 inset-x-0 z-[100] px-4 py-4 transition-all duration-300">
                <div className="max-w-[1200px] mx-auto flex justify-between items-center backdrop-blur-xl bg-black/40 border border-white/10 rounded-full px-6 py-2 shadow-2xl">
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="flex items-center gap-3 group cursor-pointer"
                        onClick={() => onNavigate('HOME')}
                    >
                        <Logo size="sm" />
                    </motion.div>

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
                                { id: 'SERVICES', label: t.nav.services },
                                { id: 'LOCATIONS', label: t.nav.locations },
                                { id: 'TIPS', label: 'Travel Tips' },
                                { id: 'PARTNERSHIP', label: t.nav.partners },
                                { id: 'QNA', label: 'Q&A' },
                                { id: 'MYPAGE', label: user && !user.isAnonymous ? t.nav.mypage : t.nav.login }
                            ].map((item, i) => (
                                <motion.button
                                    key={item.id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: i * 0.1 }}
                                    onClick={() => {
                                        if (item.id === 'MYPAGE') {
                                            if (user && !user.isAnonymous) onMyPageClick();
                                            else onLoginClick();
                                        } else {
                                            onNavigate(item.id);
                                        }
                                        setIsMenuOpen(false);
                                    }}
                                    className="text-2xl md:text-5xl font-display font-black text-white hover:text-bee-yellow transition-colors tracking-tighter uppercase"
                                >
                                    {item.label}
                                </motion.button>
                            ))}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* 7-Step Main Sections */}
            <main>
                <LandingHero
                    t={t}
                    onNavigate={onNavigate}
                    onTrackClick={() => setShowTracking(true)}
                    branchCode={branchCode}
                />
                <LandingPainSection t={t} />
                <LandingHowItWorks t={t} />
                <LandingTrustBadge t={t} />
                <LandingPricing t={t} onNavigate={onNavigate} />
                <LandingReviews t={t} />

                {/* 💅 Beeliber Content Hub / Travel Tips Section */}
                <section className="py-24 bg-white border-y border-gray-100">
                    <div className="max-w-[1200px] mx-auto px-6">
                        <div className="flex flex-col md:flex-row items-center justify-between gap-12">
                            <div className="max-w-xl text-center md:text-left">
                                <motion.div 
                                    initial={{ opacity: 0, x: -20 }}
                                    whileInView={{ opacity: 1, x: 0 }}
                                    viewport={{ once: true }}
                                    className="inline-flex items-center gap-2 px-4 py-1.5 bg-bee-yellow/10 text-bee-black border border-bee-yellow rounded-full mb-6"
                                >
                                    <Sparkles size={12} className="text-bee-black" />
                                    <span className="text-[10px] font-black uppercase tracking-[0.2em]">Travel Smarter</span>
                                </motion.div>
                                <h2 className="text-4xl md:text-6xl font-black mb-6 tracking-tight italic uppercase leading-none">
                                    The <span className="text-gray-300">Content</span> Hub 💅
                                </h2>
                                <p className="text-gray-400 font-bold text-lg mb-10">
                                    {lang === 'ko' ? '서울을 200% 더 가볍고 완벽하게 즐기는 법. 비리버가 큐레이션한 프리미엄 여행 팁을 만나보세요.' : 'Discover how to enjoy Seoul light and perfectly. Explore premium travel tips curated by Beeliber.'}
                                </p>
                                <button 
                                    onClick={() => onNavigate('TIPS')}
                                    className="group inline-flex items-center gap-3 px-8 py-4 bg-bee-black text-bee-yellow font-black rounded-full hover:scale-105 transition-all shadow-xl"
                                >
                                    Explore All Tips
                                    <ChevronRight className="group-hover:translate-x-1 transition-transform" />
                                </button>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-4">
                                    <div className="w-40 h-40 rounded-[2.5rem] bg-gray-50 flex items-center justify-center border border-gray-100 italic font-black text-gray-200">Tip 01</div>
                                    <div className="w-40 h-56 rounded-[2.5rem] bg-bee-yellow/5 flex items-center justify-center border border-bee-yellow/20 italic font-black text-bee-yellow/30">Tip 02</div>
                                </div>
                                <div className="space-y-4 pt-8">
                                    <div className="w-40 h-56 rounded-[2.5rem] bg-gray-50 flex items-center justify-center border border-gray-100 italic font-black text-gray-200">Tip 03</div>
                                    <div className="w-40 h-40 rounded-[2.5rem] bg-gray-50 flex items-center justify-center border border-gray-100 italic font-black text-gray-200">Tip 04</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                <LandingFinalCTA t={t} onNavigate={onNavigate} />
            </main>

            {/* Floating Tracking Widget Overlay */}
            <AnimatePresence>
                {showTracking && (
                    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-6 sm:p-10">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-black/80 backdrop-blur-xl"
                            onClick={() => setShowTracking(false)}
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 30 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 30 }}
                            className="relative w-full max-w-4xl bg-white rounded-[3rem] shadow-2xl overflow-hidden"
                        >
                            <div className="p-10 md:p-16">
                                <div className="flex justify-between items-center mb-12">
                                    <div className="space-y-4">
                                        <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-bee-yellow text-bee-black rounded-full shadow-lg shadow-bee-yellow/20">
                                            <span className="text-[10px] font-black uppercase tracking-[0.2em]">{t.hero.status_suffix || 'Tracking status'}</span>
                                        </div>
                                        <h3 className="text-4xl md:text-5xl font-display font-black text-bee-black tracking-tighter leading-tight">
                                            {t.hero.live_label || 'Real-time GPS Monitoring'}
                                        </h3>
                                    </div>
                                    <button
                                        onClick={() => setShowTracking(false)}
                                        className="w-14 h-14 rounded-full bg-bee-light flex items-center justify-center hover:bg-bee-yellow transition-all active:scale-90"
                                        title="Close Tracking Widget"
                                    >
                                        <X className="w-6 h-6" />
                                    </button>
                                </div>
                                <TrackingWidget t={t} isModal={true} onClose={() => setShowTracking(false)} />
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default LandingRenewal;
