
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
    X
} from "lucide-react";

import TrackingWidget from "./TrackingWidget";

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

/**
 * [GENIUS CONFIG] 모바일 최적화 설정
 */
const CONFIG = {
    colors: {
        primary: "#ffcb05",
        dark: "#0C0C0C",
    },
    video: {
        src: "https://firebasestorage.googleapis.com/v0/b/beeliber-main.firebasestorage.app/o/vc%2Fbee.mp4?alt=media&token=1d445016-6586-4922-bd40-ff7c677ec125",
    },
    sizes: [
        { label: "M", range: "18-23\"", height: "h-20" },
        { label: "L", range: "24-26\"", height: "h-28" },
        { label: "XL", range: "27-30\"", height: "h-36" },
    ]
};

const LandingRenewal: React.FC<LandingRenewalProps> = ({ t, lang, onNavigate, onLangChange, onAdminClick, onLoginClick, onMyPageClick, user, onSuccess }) => {
    const [isMenuOpen, setIsMenuOpen] = React.useState(false);
    const [isTrackingModalOpen, setIsTrackingModalOpen] = React.useState(false);

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

            {/* 1. NAVIGATION (스티키 & 블러) */}
            <nav className={`fixed top-0 left-0 right-0 backdrop-blur-xl bg-white/80 border-b border-black/5 transition-all duration-300 ${isMenuOpen ? 'z-[9999]' : 'z-[100]'}`}>
                <div className="max-w-[1600px] mx-auto px-5 flex items-center h-16 md:h-24 relative">

                    <div role="button" aria-label="Go to Home" onClick={() => onNavigate('USER')} className="text-xl md:text-2xl font-black tracking-tighter cursor-pointer z-10">
                        <span className="text-bee-yellow">bee</span>liber
                    </div>

                    {/* [CENTER] Language Dropdown (PC/Mobile 공용) */}
                    <div className="absolute left-1/2 -translate-x-1/2 flex items-center">
                        <div className="relative group">
                            <button title="Change Language" aria-label="Change Language" className="flex items-center gap-2 px-4 py-2 bg-gray-50 rounded-full border border-black/5 hover:border-black/10 transition-all">
                                <span className="text-lg">
                                    {lang === 'ko' ? '🇰🇷' : lang === 'en' ? '🇺🇸' : lang === 'ja' ? '🇯🇵' : lang.startsWith('zh-') ? (lang === 'zh-TW' || lang === 'zh-HK' ? '🇭🇰' : '🇨🇳') : '🇨🇳'}
                                </span>
                                <span className="text-[10px] font-black uppercase tracking-widest hidden sm:block">
                                    {lang === 'zh' ? 'CN' : lang === 'zh-TW' ? 'TW' : lang === 'zh-HK' ? 'HK' : lang.toUpperCase()}
                                </span>
                                <ChevronRight className="w-3 h-3 rotate-90 text-black/20" />
                            </button>

                            {/* Hover/Click Dropdown */}
                            <div className="absolute top-full left-1/2 -translate-x-1/2 pt-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300">
                                <div className="bg-white border border-black/5 rounded-2xl shadow-2xl p-2 min-w-[140px] max-h-[300px] overflow-y-auto no-scrollbar">
                                    {[
                                        { code: 'ko', flag: '🇰🇷', label: '한국어' },
                                        { code: 'en', flag: '🇺🇸', label: 'English' },
                                        { code: 'ja', flag: '🇯🇵', label: '日本語' },
                                        { code: 'zh', flag: '🇨🇳', label: '简体中文' },
                                        { code: 'zh-TW', flag: '🇭🇰', label: '繁體中文' }
                                    ].map((l) => (
                                        <button
                                            key={l.code}
                                            onClick={() => onLangChange(l.code)}
                                            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-colors ${lang === l.code ? 'bg-black text-white' : 'hover:bg-gray-50 text-black/60'}`}
                                        >
                                            <span className="text-lg">{l.flag}</span>
                                            <span className="text-[11px] font-bold">{l.label}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* [RIGHT] Menu & Portal */}
                    <div className="ml-auto hidden md:flex items-center gap-8 text-[11px] font-black uppercase tracking-[0.2em] text-black/40">
                        <button title="Services" aria-label="Services" onClick={() => onNavigate('SERVICES')} className="hover:text-black transition-colors">{t.nav.services}</button>
                        <button title="Locations" aria-label="Locations" onClick={() => onNavigate('LOCATIONS')} className="hover:text-black transition-colors">{t.nav.locations}</button>
                        <button title="Partners" aria-label="Partners" onClick={() => onNavigate('PARTNERSHIP')} className="hover:text-black transition-colors">{t.nav.partners}</button>

                        {user && !user.isAnonymous ? (
                            <button
                                title="My Page"
                                aria-label="My Page"
                                onClick={onMyPageClick}
                                className="flex items-center gap-2 text-black hover:text-[#FF495C] transition-colors"
                            >
                                <div className="w-8 h-8 rounded-full bg-bee-yellow flex items-center justify-center shadow-sm">
                                    <i className="fa-solid fa-user text-[10px] text-bee-black"></i>
                                </div>
                                <span className="hidden lg:block">{user.displayName || 'MY PAGE'}</span>
                            </button>
                        ) : (
                            <button
                                title="Login"
                                aria-label="Login"
                                onClick={onLoginClick}
                                className="hover:text-black transition-colors"
                            >
                                {t.login || 'LOGIN'}
                            </button>
                        )}

                        <button onClick={onAdminClick} className="px-6 py-2.5 bg-black text-bee-yellow rounded-full text-[10px] tracking-widest hover:scale-105 transition-transform active:scale-95">Portal</button>
                    </div>

                    {/* Mobile Hamburger (Only for menu if needed, but we keep it simple) */}
                    <button title="Toggle Menu" aria-label="Toggle Menu" onClick={() => setIsMenuOpen(!isMenuOpen)} className="md:hidden ml-auto p-2 z-10">
                        {isMenuOpen ? <X /> : <Menu />}
                    </button>
                </div>

                <AnimatePresence>
                    {isMenuOpen && (
                        <div key="mobile-menu-container" className="md:hidden fixed inset-0 z-[10000]">
                            {/* Backdrop: 전체 화면을 터치하여 닫기 */}
                            <motion.div
                                key="backdrop"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                onClick={() => setIsMenuOpen(false)}
                                className="absolute inset-0 bg-black/[0.01] backdrop-blur-[0.5px] cursor-pointer"
                            />

                            <motion.div
                                key="menu-panel"
                                initial={{ y: '-100%' }}
                                animate={{ y: 0 }}
                                exit={{ y: '-100%' }}
                                transition={{ type: 'spring', damping: 38, stiffness: 450 }}
                                onClick={(e) => e.stopPropagation()}
                                className="absolute top-0 right-0 w-[40%] min-w-[140px] bg-white shadow-[-10px_10px_40px_rgba(0,0,0,0.1)] p-4 pt-20 border-l border-b border-gray-100 rounded-bl-[3rem] flex flex-col items-center gap-1 z-[1001]"
                            >
                                <div className="w-4 h-0.5 bg-bee-yellow mb-3 rounded-full" />

                                {[
                                    { label: t.nav.services, view: 'SERVICES', icon: 'fa-concierge-bell' },
                                    { label: t.nav.locations, view: 'LOCATIONS', icon: 'fa-map-marker-alt' },
                                    { label: t.nav.partners, view: 'PARTNERSHIP', icon: 'fa-handshake' }
                                ].map((item, idx) => (
                                    <motion.button
                                        key={item.view}
                                        initial={{ opacity: 0, scale: 0.8 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        transition={{ delay: idx * 0.05 }}
                                        onClick={() => { onNavigate(item.view); setIsMenuOpen(false); }}
                                        className="w-full flex flex-col items-center py-3 gap-1.5 rounded-2xl hover:bg-gray-50 transition-colors"
                                    >
                                        <i className={`fa-solid ${item.icon} text-[11px] text-bee-black/40`}></i>
                                        <span className="text-[8px] font-black tracking-tighter text-black/50 break-keep text-center leading-tight">
                                            {item.label}
                                        </span>
                                    </motion.button>
                                ))}

                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ delay: 0.2 }}
                                    className="w-full pt-4 pb-2 flex flex-col items-center gap-4"
                                >
                                    {user && !user.isAnonymous ? (
                                        <button
                                            title="My Page"
                                            aria-label="My Page"
                                            onClick={() => { onMyPageClick(); setIsMenuOpen(false); }}
                                            className="w-10 h-10 bg-bee-yellow text-bee-black rounded-full flex items-center justify-center shadow-lg active:scale-90 transition-all"
                                        >
                                            <i className="fa-solid fa-user text-[11px]"></i>
                                        </button>
                                    ) : (
                                        <button
                                            onClick={() => { onLoginClick(); setIsMenuOpen(false); }}
                                            className="w-10 h-10 bg-white border border-gray-100 text-black rounded-full flex items-center justify-center shadow-md active:scale-90 transition-all font-black text-[10px]"
                                        >
                                            LOGIN
                                        </button>
                                    )}
                                    <button
                                        title="Admin Dashboard"
                                        aria-label="Admin Dashboard"
                                        onClick={() => { onAdminClick(); setIsMenuOpen(false); }}
                                        className="w-10 h-10 bg-bee-black text-bee-yellow rounded-full flex items-center justify-center shadow-lg active:scale-90 transition-all"
                                    >
                                        <i className="fa-solid fa-user-shield text-[11px]"></i>
                                    </button>
                                </motion.div>
                            </motion.div>
                        </div>
                    )}
                </AnimatePresence>
            </nav>

            {/* 2. HERO SECTION */}
            <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-16">

                {/* Background Video Layer */}
                <div className="absolute inset-0 z-0">
                    <video
                        autoPlay
                        loop
                        muted
                        playsInline
                        preload="auto"
                        poster="https://images.unsplash.com/photo-1565026057447-bc90a3dceb87?auto=format&fit=crop&q=80&w=1920"
                        src={CONFIG.video.src}
                        className="w-full h-full object-cover object-center"
                    />
                    {/* Dark Overlay for Readability */}
                    <div className="absolute inset-0 bg-black/30 backdrop-blur-[2px]" />
                    <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/60" />
                </div>

                {/* Content Layer */}
                <div className="relative z-10 w-full max-w-[1600px] mx-auto px-6 py-32 md:py-0 text-center flex flex-col items-center">
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="w-full max-w-4xl"
                    >
                        <motion.span
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="inline-block px-4 py-1.5 rounded-full bg-yellow-500/10 border border-yellow-500/30 text-[11px] font-black tracking-[0.3em] mb-8 text-yellow-500 uppercase backdrop-blur-md"
                        >
                            {t.hero.badge || "No more heavy luggage"}
                        </motion.span>

                        <h1 className="text-5xl md:text-[120px] font-black leading-[1.15] tracking-tighter mb-10 text-white">
                            {t.hero.main_title_1}<br />
                            <span className="text-bee-yellow drop-shadow-[0_15px_40px_rgba(255,203,5,0.4)] relative inline-block">
                                {t.hero.main_title_2}
                                <motion.div
                                    initial={{ width: 0 }}
                                    whileInView={{ width: '100%' }}
                                    transition={{ delay: 0.5, duration: 0.8 }}
                                    className="absolute -bottom-2 left-0 h-2 bg-bee-yellow/30 rounded-full"
                                />
                            </span>
                        </h1>

                        <p className="text-base md:text-2xl text-white/60 mb-14 leading-relaxed max-w-2xl mx-auto font-bold">
                            {t.hero.subtitle}
                        </p>

                        <div className="flex flex-col sm:flex-row gap-6 w-full max-w-2xl mx-auto">
                            <button
                                title="Book Branch"
                                aria-label="Book Branch"
                                onClick={() => onNavigate('LOCATIONS')}
                                className="group relative flex-1 px-6 py-2.5 bg-bee-yellow text-bee-black font-bold rounded-xl text-sm md:text-base flex items-center justify-between gap-4 shadow-[0_10px_25px_rgba(255,215,0,0.1)] hover:scale-[1.03] active:scale-95 transition-all overflow-hidden"
                            >
                                <div className="z-10 flex items-center gap-3">
                                    <div className="w-7 h-7 md:w-9 md:h-9 rounded-lg bg-black/5 flex items-center justify-center">
                                        <MapPin className="w-3.5 h-3.5 md:w-4.5 md:h-4.5" />
                                    </div>
                                    <span className="tracking-tight font-black">{t.hero.book_branch}</span>
                                </div>
                                <ChevronRight className="w-4 h-4 md:w-5 md:h-5 group-hover:translate-x-1.5 transition-transform z-10 opacity-70" />
                                <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-500" />
                            </button>

                            <button
                                title="Track Booking"
                                aria-label="Track Booking"
                                onClick={() => setIsTrackingModalOpen(true)}
                                className="group flex-1 px-6 py-2.5 bg-white/5 text-white font-bold rounded-xl text-sm md:text-base flex items-center justify-between gap-4 border border-white/10 backdrop-blur-xl hover:bg-white/10 hover:border-bee-yellow/40 active:scale-95 transition-all shadow-lg"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="w-7 h-7 md:w-9 md:h-9 rounded-lg bg-white/5 flex items-center justify-center">
                                        <Smartphone className="w-3.5 h-3.5 md:w-4.5 md:h-4.5 text-bee-yellow" />
                                    </div>
                                    <span className="tracking-tight font-black">{t.hero.track_booking}</span>
                                </div>
                                <ChevronRight className="w-4 h-4 md:w-5 md:h-5 text-white/20 group-hover:text-bee-yellow group-hover:translate-x-1.5 transition-all" />
                            </button>
                        </div>
                    </motion.div>
                </div>

                {/* Floating Trust Badge */}
                <div className="absolute bottom-10 right-10 z-20 hidden md:block">
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="p-5 bg-white/10 backdrop-blur-2xl rounded-[32px] border border-white/20 flex items-center gap-4 shadow-2xl"
                    >
                        <div className="w-12 h-12 rounded-2xl bg-bee-yellow text-bee-black flex items-center justify-center shadow-lg">
                            <ShieldCheck className="w-6 h-6" />
                        </div>
                        <div>
                            <div className="text-white text-xs font-black tracking-widest uppercase mb-0.5">{t.hero.insurance_title}</div>
                            <span className="text-bee-yellow font-black text-[10px] tracking-tighter opacity-80">{t.hero.insurance_badge_text}</span>
                        </div>
                    </motion.div>
                </div>
            </section>

            {/* 3. HOW IT WORKS (From ServicesPage) */}
            <section className="py-24 bg-gray-50">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl md:text-4xl font-black mb-4">{t.services_page?.how_title || 'How it works'}</h2>
                        <p className="text-gray-500">{t.services_page?.how_desc_simple || 'Three simple steps to travel hands-free.'}</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {[
                            { icon: 'fa-calendar-check', title: t.services_page?.how_steps?.[0] || 'Booking', desc: t.services_page?.how_step_descs?.[0] || 'Select date and location easily.' },
                            { icon: 'fa-suitcase-rolling', title: t.services_page?.how_steps?.[1] || 'Drop / Pickup', desc: t.services_page?.how_step_descs?.[1] || 'Hand over your bags at the spot.' },
                            { icon: 'fa-paper-plane', title: t.services_page?.how_steps?.[2] || 'Explore', desc: t.services_page?.how_step_descs?.[2] || 'Enjoy your trip without burden.' }
                        ].map((item, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, y: 30 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.6, ease: "easeOut", delay: i * 0.1 }}
                                className="bg-white p-10 rounded-[2rem] shadow-sm hover:shadow-xl hover:-translate-y-2 transition-all duration-300 text-center group"
                            >
                                <div className="w-20 h-20 mx-auto bg-yellow-50 rounded-full flex items-center justify-center text-3xl text-bee-yellow mb-6 group-hover:bg-bee-yellow group-hover:text-bee-black transition-colors">
                                    <i className={`fa-solid ${item.icon}`}></i>
                                </div>
                                <h3 className="text-xl font-black mb-3">{item.title}</h3>
                                <p className="text-gray-400 font-medium leading-relaxed">{item.desc}</p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* 4. SERVICE DETAILS (From ServicesPage) */}
            <section className="py-32 px-6 bg-white">
                <div className="max-w-7xl mx-auto">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center mb-32">
                        <motion.div
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.6, ease: "easeOut" }}
                            className="order-1 h-[500px] rounded-[3rem] overflow-hidden relative shadow-2xl"
                        >
                            <img src="https://firebasestorage.googleapis.com/v0/b/beeliber-main.firebasestorage.app/o/%EC%86%8C%EA%B0%9C%2F%EB%B0%B0%EC%86%A1.png?alt=media&token=469984dc-4c0e-4276-8c31-9b56b4abd969" alt="Delivery Service" className="w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
                            <div className="absolute bottom-10 left-10 text-white">
                                <div className="font-bold text-bee-yellow mb-1">Fast & Safe</div>
                                <div className="text-2xl font-black">Airport Delivery</div>
                            </div>
                        </motion.div>
                        <motion.div
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.6, ease: "easeOut" }}
                            className="order-2"
                        >
                            <span className="text-bee-yellow font-black text-sm uppercase tracking-widest mb-2 block">Service 01</span>
                            <h2 className="text-4xl md:text-5xl font-black mb-6 leading-tight">{t.services_page?.delivery_section?.title || 'Delivery'} <br /> <span className="text-gray-200">{t.services_page?.delivery_section?.subtitle || 'between Airport & Hotel'}</span></h2>
                            <p className="text-lg text-gray-500 mb-8 leading-relaxed break-keep">
                                {t.services_page?.delivery_section?.desc || "Don't waste your first and last day dragging luggage. We deliver your bags safely from Incheon/Gimpo Airport to your accommodation (and vice versa) within the same day."}
                            </p>
                            <ul className="space-y-4 mb-10">
                                <li className="flex items-center gap-4 text-lg font-bold">
                                    <div className="w-8 h-8 rounded-full bg-green-50 text-green-500 flex items-center justify-center"><i className="fa-solid fa-check"></i></div>
                                    {t.services_page?.delivery_section?.features?.[0] || 'Same-day Arrival'}
                                </li>
                                <li className="flex items-center gap-4 text-lg font-bold">
                                    <div className="w-8 h-8 rounded-full bg-green-50 text-green-500 flex items-center justify-center"><i className="fa-solid fa-check"></i></div>
                                    {t.services_page?.delivery_section?.features?.[1] || 'Photo Verification'}
                                </li>
                                <li className="flex items-center gap-4 text-lg font-bold">
                                    <div className="w-8 h-8 rounded-full bg-green-50 text-green-500 flex items-center justify-center"><i className="fa-solid fa-check"></i></div>
                                    {t.services_page?.delivery_section?.features?.[2] || 'Insurance Coverage'}
                                </li>
                            </ul>
                            <button onClick={() => onNavigate('LOCATIONS')} className="bg-bee-black text-white px-8 py-4 rounded-xl font-bold hover:bg-gray-800 transition-colors">
                                {t.services_page?.delivery_section?.btn || 'Book Delivery'}
                            </button>
                        </motion.div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
                        <motion.div
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.6, ease: "easeOut" }}
                        >
                            <span className="text-bee-yellow font-black text-sm uppercase tracking-widest mb-2 block">Service 02</span>
                            <h2 className="text-4xl md:text-5xl font-black mb-6 leading-tight">{t.services_page?.storage_section?.title || 'Storage'} <br /> <span className="text-gray-200">{t.services_page?.storage_section?.subtitle || 'at Prime Locations'}</span></h2>
                            <p className="text-lg text-gray-500 mb-8 leading-relaxed break-keep">
                                {t.services_page?.storage_section?.desc || "Need to store your bags for a few hours? Use our secure storages located at key spots like Hongdae and Seoul Station. Book online, drop off, and exploring freely."}
                            </p>
                            <ul className="space-y-4 mb-10">
                                <li className="flex items-center gap-4 text-lg font-bold">
                                    <div className="w-8 h-8 rounded-full bg-blue-50 text-bee-blue flex items-center justify-center"><i className="fa-solid fa-location-dot"></i></div>
                                    {t.services_page?.storage_section?.features?.[0] || 'Near Subway Stations'}
                                </li>
                                <li className="flex items-center gap-4 text-lg font-bold">
                                    <div className="w-8 h-8 rounded-full bg-blue-50 text-bee-blue flex items-center justify-center"><i className="fa-solid fa-clock"></i></div>
                                    {t.services_page?.storage_section?.features?.[1] || 'Real-time Booking'}
                                </li>
                                <li className="flex items-center gap-4 text-lg font-bold">
                                    <div className="w-8 h-8 rounded-full bg-blue-50 text-bee-blue flex items-center justify-center"><i className="fa-solid fa-shield-halved"></i></div>
                                    {t.services_page?.storage_section?.features?.[2] || 'CCTV Monitoring'}
                                </li>
                            </ul>
                            <button onClick={() => onNavigate('LOCATIONS')} className="bg-white text-bee-black border-2 border-bee-black px-8 py-4 rounded-xl font-bold hover:bg-bee-black hover:text-bee-yellow transition-colors">
                                {t.services_page?.storage_section?.btn || 'Book Storage'}
                            </button>
                        </motion.div>
                        <motion.div
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.6, ease: "easeOut" }}
                            className="h-[500px] rounded-[3rem] overflow-hidden relative shadow-2xl"
                        >
                            <img src="https://firebasestorage.googleapis.com/v0/b/beeliber-main.firebasestorage.app/o/%EC%86%8C%EA%B0%9C%2F%EB%B3%B4%EA%B4%80.png?alt=media&token=fa3d8687-c743-44eb-8e91-97b111eb12ee" alt="Storage Service" className="w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
                            <div className="absolute bottom-10 left-10 text-white">
                                <div className="font-bold text-bee-yellow mb-1">Convenient</div>
                                <div className="text-2xl font-black">Secure Storage</div>
                            </div>
                        </motion.div>
                    </div>
                </div>
            </section>

            {/* 5. TRUST BADGE (From ServicesPage) */}
            <section className="py-20 bg-bee-yellow/5 border-y border-bee-yellow/10">
                <div className="max-w-4xl mx-auto px-6 text-center">
                    <img src="https://firebasestorage.googleapis.com/v0/b/beeliber-main.firebasestorage.app/o/%EC%86%8C%EA%B0%9C%2F%EC%89%B4%EB%93%9C.png?alt=media&token=8547086f-b37a-45a9-8e7f-70038b4daff4" alt="Shield" className="w-16 h-16 mx-auto mb-6 drop-shadow-lg" />
                    <h2 className="text-3xl font-black mb-4">{t.hero?.insurance_title || 'Fully Insured'}</h2>
                    <p className="text-gray-500 text-lg mb-8 break-keep">
                        {t.hero?.insurance_desc || "We provide compensation up to 500,000 KRW (approx $380) per bag for any loss or damage. Travel with total peace of mind."}
                    </p>
                    <div className="inline-flex items-center gap-2 bg-white px-6 py-3 rounded-full shadow-sm text-sm font-bold text-gray-600">
                        <i className="fa-solid fa-check-circle text-green-500"></i>
                        {t.hero?.insurance_badge_text || 'Safety Guarantee Policy Applied'}
                    </div>
                </div>
            </section>

        </div>
    );
};

export default LandingRenewal;
