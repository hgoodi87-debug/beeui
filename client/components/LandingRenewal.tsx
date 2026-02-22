
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
    ThumbsUp
} from "lucide-react";

import TrackingWidget from "./TrackingWidget";
import LandingPainSection from "./landing/LandingPainSection";
import LandingHowItWorks from "./landing/LandingHowItWorks";
import LandingServiceDetails from "./landing/LandingServiceDetails";
import LandingTrustBadge from "./landing/LandingTrustBadge";

interface LandingRenewalProps {
    t: any;
    lang: string;
    onNavigate: (view: any) => void;
    onLangChange: (lang: string) => void;
    onAdminClick: () => void;
    onLoginClick: () => void;
    onMyPageClick: () => void;
    onSuccess?: (booking: any) => void;
    user: any;
}

const CONFIG = {
    colors: {
        primary: "#ffcb05",
        dark: "#0C0C0C",
    },
    video: {
        src: "https://firebasestorage.googleapis.com/v0/b/beeliber-main.firebasestorage.app/o/vc%2F0216.mp4?alt=media&token=47660d79-e317-4df8-b4df-ca37ecf95d6b",
    }
};

const LandingRenewal: React.FC<LandingRenewalProps> = ({ t, lang, onNavigate, onLangChange, onAdminClick, onLoginClick, onMyPageClick, user }) => {
    const [isMenuOpen, setIsMenuOpen] = React.useState(false);
    const [isTrackingModalOpen, setIsTrackingModalOpen] = React.useState(false);

    // Simulated "Dynamic" Stats
    const stats = [
        { icon: <Users className="w-5 h-5" />, value: "24,800+", label: "Happy Travelers", color: "#FFCB05" },
        { icon: <Package className="w-5 h-5" />, value: "152,400+", label: "Safe Deliveries", color: "#00BCFF" },
        { icon: <ThumbsUp className="w-5 h-5" />, value: "99.2%", label: "Satisfaction Rate", color: "#FF495C" }
    ];

    return (
        <div className="w-full bg-white font-sans text-black overflow-x-hidden select-none">

            {/* Tracking Modal */}
            <AnimatePresence>
                {isTrackingModalOpen && (
                    <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsTrackingModalOpen(false)}
                            className="absolute inset-0 bg-black/80 backdrop-blur-md cursor-pointer"
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="w-full max-w-2xl relative z-10"
                        >
                            <TrackingWidget t={t} isModal={true} onClose={() => setIsTrackingModalOpen(false)} />
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* 1. NAVIGATION */}
            <nav className={`fixed top-0 left-0 right-0 backdrop-blur-xl bg-white/80 border-b border-black/5 transition-all duration-300 ${isMenuOpen ? 'z-[9999]' : 'z-[100]'}`}>
                <div className="max-w-[1600px] mx-auto px-5 flex items-center h-16 md:h-24 relative">

                    <div role="button" aria-label="Go to Home" onClick={() => onNavigate('USER')} className="text-xl md:text-2xl font-black tracking-tighter cursor-pointer z-10 transition-transform hover:scale-105 active:scale-95">
                        <span className="text-bee-yellow">bee</span>liber
                    </div>

                    <div className="ml-auto flex items-center gap-2 md:gap-8 overflow-visible">
                        {/* Language Selector - Moved to Right for both PC and Mobile */}
                        <div className="relative group">
                            <button title="Change Language" className="flex items-center gap-2 px-3 md:px-4 py-2 bg-gray-50 rounded-full border border-black/5 hover:border-black/10 transition-all hover:bg-gray-100 active:scale-95">
                                <span className="text-base md:text-lg">
                                    {lang === 'ko' ? '🇰🇷' : lang === 'en' ? '🇺🇸' : lang === 'ja' ? '🇯🇵' : lang === 'zh-HK' ? '🇭🇰' : lang === 'zh-TW' ? '🇹🇼' : '🇨🇳'}
                                </span>
                                <ChevronRight className="w-3 h-3 rotate-90 text-black/20" />
                            </button>
                            <div className="absolute top-full right-0 pt-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 z-[99999]">
                                <div className="bg-white border border-black/5 rounded-2xl shadow-2xl p-2 min-w-[140px]">
                                    {[
                                        { code: 'ko', label: '🇰🇷 한국어 (KR)' },
                                        { code: 'en', label: '🇺🇸 English (US)' },
                                        { code: 'ja', label: '🇯🇵 日本語 (JP)' },
                                        { code: 'zh', label: '🇨🇳 简体中文 (CN)' },
                                        { code: 'zh-HK', label: '🇭🇰 繁體中文 (HK)' },
                                        { code: 'zh-TW', label: '🇹🇼 繁體中文 (TW)' }
                                    ].map((item) => (
                                        <button key={item.code} onClick={() => { onLangChange(item.code); setIsMenuOpen(false); }} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-colors font-black text-[10px] uppercase tracking-wider ${lang === item.code ? 'bg-bee-black text-bee-yellow' : 'hover:bg-gray-50 text-black/40 hover:text-black'}`}>
                                            <span>{item.label}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Desktop Links */}
                        <div className="hidden md:flex items-center gap-8 text-[11px] font-black uppercase tracking-[0.2em] text-black/40">
                            <button onClick={() => onNavigate('SERVICES')} className="hover:text-black transition-colors">{t.nav.services}</button>
                            <button onClick={() => onNavigate('LOCATIONS')} className="hover:text-black transition-colors">{t.nav.locations}</button>
                            <button onClick={() => onNavigate('PARTNERSHIP')} className="hover:text-black transition-colors">{t.nav.partners}</button>
                        </div>

                        {/* Mobile Menu Trigger */}
                        <button
                            onClick={() => setIsMenuOpen(!isMenuOpen)}
                            className="md:hidden p-2 rounded-xl bg-gray-50 border border-black/5 hover:bg-gray-100 transition-all active:scale-90"
                        >
                            {isMenuOpen ? <X size={20} /> : <Menu size={20} />}
                        </button>
                    </div>
                </div >

                {/* Mobile Menu Dropdown Slide */}
                <AnimatePresence>
                    {
                        isMenuOpen && (
                            <>
                                {/* Backdrop for click outside */}
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    onClick={() => setIsMenuOpen(false)}
                                    className="fixed inset-0 top-16 bg-black/40 backdrop-blur-sm z-[-1] md:hidden"
                                />
                                <motion.div
                                    initial={{ y: "-100%" }}
                                    animate={{ y: 0 }}
                                    exit={{ y: "-100%" }}
                                    transition={{ type: "spring", damping: 25, stiffness: 200 }}
                                    className="absolute top-full left-0 right-0 bg-white border-b border-black/5 shadow-2xl overflow-hidden md:hidden z-10"
                                >
                                    <div className="p-6 space-y-2">
                                        {[
                                            { id: 'SERVICES', label: t.nav.services, icon: <Smartphone className="w-5 h-5 text-bee-yellow" /> },
                                            { id: 'LOCATIONS', label: t.nav.locations, icon: <MapPin className="w-5 h-5 text-bee-yellow" /> },
                                            { id: 'PARTNERSHIP', label: t.nav.partners, icon: <Users className="w-5 h-5 text-bee-yellow" /> }
                                        ].map((item) => (
                                            <button
                                                key={item.id}
                                                onClick={() => {
                                                    onNavigate(item.id);
                                                    setIsMenuOpen(false);
                                                }}
                                                className="w-full flex items-center justify-between p-5 bg-gray-50 rounded-2xl hover:bg-bee-black hover:text-bee-yellow transition-all group active:scale-95"
                                            >
                                                <div className="flex items-center gap-4">
                                                    <div className="w-10 h-10 rounded-xl bg-white border border-black/5 flex items-center justify-center group-hover:bg-bee-yellow/10 group-hover:border-bee-yellow/20 transition-all">
                                                        {item.icon}
                                                    </div>
                                                    <span className="font-black text-sm uppercase tracking-widest">{item.label}</span>
                                                </div>
                                                <ChevronRight className="w-4 h-4 opacity-20 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                                            </button>
                                        ))}

                                        <div className="pt-6 mt-4 border-t border-black/5 flex flex-col gap-3">
                                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-2">Account</p>
                                            <button
                                                onClick={() => { onLoginClick(); setIsMenuOpen(false); }}
                                                className="w-full py-4 px-6 rounded-2xl border border-black text-black font-black text-sm uppercase tracking-widest hover:bg-gray-50 transition-all active:scale-95"
                                            >
                                                {user && !user.isAnonymous ? t.nav.mypage || 'My Page' : t.nav.login || 'Login'}
                                            </button>
                                        </div>
                                    </div>
                                </motion.div>
                            </>
                        )
                    }
                </AnimatePresence >
            </nav >

            {/* 2. HERO SECTION */}
            < section className="relative min-h-[90vh] md:min-h-screen flex items-center justify-center overflow-hidden pt-16" >
                <div className="absolute inset-0 z-0 bg-black">
                    <video autoPlay loop muted playsInline preload="auto" poster="https://images.unsplash.com/photo-1565026057447-bc90a3dceb87?auto=format&fit=crop&q=80&w=1920" src={CONFIG.video.src} className="w-full h-full object-cover" />
                    <div className="absolute inset-0 opacity-[0.03] noise-overlay z-[1]" />
                    <div className="absolute inset-0 bg-black/20 backdrop-blur-[1px] z-[2]" />
                    <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/80 z-[3]" />
                </div>

                <div className="relative z-10 w-full max-w-[1600px] mx-auto px-6 text-center flex flex-col items-center pt-20">
                    <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-4xl">
                        <motion.span initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="inline-block px-4 py-1.5 rounded-full bg-yellow-500/10 border border-yellow-500/30 text-[11px] font-black tracking-[0.3em] mb-8 text-yellow-500 uppercase backdrop-blur-md font-outfit">
                            {t.hero.badge || "Unburden your journey"}
                        </motion.span>
                        <h1 className="text-5xl md:text-[140px] font-display font-black leading-[1.1] md:leading-[0.95] tracking-tighter mb-10 text-white">
                            {t.hero.main_title_1}<br />
                            <span className="text-bee-yellow drop-shadow-[0_15px_40px_rgba(255,203,5,0.4)]">{t.hero.main_title_2}</span>
                        </h1>
                        <p className="text-base md:text-2xl text-white/50 mb-14 leading-relaxed md:leading-loose max-w-2xl mx-auto font-bold font-outfit break-keep">
                            {t.hero.subtitle}
                        </p>
                        <div className="flex flex-col sm:flex-row gap-6 w-full max-w-2xl mx-auto">
                            <button onClick={() => onNavigate('LOCATIONS')} className="group flex-1 px-10 py-5 bg-bee-yellow text-bee-black font-black rounded-2xl text-base flex items-center justify-between gap-4 shadow-xl hover:scale-[1.03] transition-all font-outfit">
                                <span className="tracking-tight">{t.hero.book_branch}</span>
                                <ChevronRight className="w-5 h-5 group-hover:translate-x-1.5 transition-transform" />
                            </button>
                            <button onClick={() => setIsTrackingModalOpen(true)} className="group flex-1 px-10 py-5 bg-white/5 text-white font-black rounded-2xl text-base flex items-center justify-between gap-4 border border-white/10 backdrop-blur-xl hover:bg-white/10 transition-all font-outfit">
                                <span className="tracking-tight">{t.hero.track_booking}</span>
                                <ChevronRight className="w-5 h-5 text-white/20 group-hover:text-bee-yellow group-hover:translate-x-1.5 transition-all" />
                            </button>
                        </div>
                    </motion.div>
                </div>
            </section >

            {/* 3. PAIN SECTION: The Problem 😫 (Staff Idea #1) */}
            < LandingPainSection t={t} />

            {/* 4. HOW IT WORKS: The Solution 🛡️ (Staff Idea #2 - Updated) */}
            < LandingHowItWorks t={t} />

            <section className="py-24 bg-white border-y border-gray-100 relative overflow-hidden">
                <div className="max-w-7xl mx-auto px-6 relative z-10">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12">
                        {[
                            { label: t.stats?.users || "Happy Travelers", value: "24,800+", icon: Users, color: "text-blue-400" },
                            { label: t.stats?.items || "Safe Deliveries", value: "152,400+", icon: Package, color: "text-bee-yellow" },
                            { label: t.stats?.satisfaction || "Satisfaction Rate", value: "99.2%", icon: ThumbsUp, color: "text-green-400" }
                        ].map((stat, i) => (
                            <motion.div key={i} whileHover={{ y: -5 }} className="flex flex-col items-center bg-white p-10 rounded-3xl shadow-xl border border-gray-100 min-h-[220px] justify-center text-center">
                                <stat.icon className={`w-10 h-10 ${stat.color} mb-6`} />
                                <div className="text-5xl font-display font-black text-bee-black mb-3 tracking-tighter leading-none">{stat.value}</div>
                                <div className="text-[11px] font-black text-bee-muted uppercase tracking-[0.2em] font-outfit leading-relaxed">{stat.label}</div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* 6. SERVICE DETAILS: Proof 🖼️ (Staff Idea #4 - Updated) */}
            <LandingServiceDetails t={t} onNavigate={onNavigate} />

            {/* 7. TRUST BADGE: Peace of Mind 🛡️ (Staff Idea #5 - Updated) */}
            <LandingTrustBadge t={t} />

            <section className="py-40 bg-bee-yellow flex flex-col items-center text-center px-6">
                <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
                    <h2 className="text-5xl md:text-9xl font-display font-black tracking-tighter mb-12 text-bee-black leading-none">
                        Ready to be<br /><span className="italic opacity-20">Weightless?</span>
                    </h2>
                    <button onClick={() => onNavigate('LOCATIONS')} className="px-20 py-8 bg-bee-black text-bee-yellow rounded-2xl font-black text-xl hover:scale-110 active:scale-95 transition-all shadow-2xl font-outfit tracking-widest uppercase">
                        Start Booking 💅
                    </button>
                </motion.div>
            </section>

        </div >
    );
};

export default LandingRenewal;
