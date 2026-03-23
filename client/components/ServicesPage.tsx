import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { ShieldCheck, MapPin, Zap, PackageCheck, Smartphone, CheckCircle2, Box, Sparkles } from 'lucide-react';
import TrackingWidget from './TrackingWidget';
import Logo from './Logo';
import SEO from './SEO';
import { useAppStore } from '../src/store/appStore';

interface ServicesPageProps {
    onBack: () => void;
    t: any;
    landingT?: any;
}

const ServicesPage: React.FC<ServicesPageProps> = ({ onBack, t, landingT }) => {
    const lang = useAppStore(state => state.lang);
    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    if (!t) return <div className="min-h-screen flex items-center justify-center bg-white">Loading...</div>;

    const fadeInUp = {
        initial: { opacity: 0, y: 30 },
        whileInView: { opacity: 1, y: 0 },
        viewport: { once: true },
        transition: { duration: 0.6, ease: [0.25, 0.1, 0.25, 1] as const }
    };
    const seoTitle = lang === 'ko'
        ? '서비스 안내 | 빌리버 짐보관 · 공항 당일 배송'
        : 'Services | Beeliber Luggage Storage & Same-Day Airport Delivery';
    const seoDescription = lang === 'ko'
        ? '짐 보관, 공항 당일 배송, 이용 방법과 운영 범위를 한 번에 확인하세요.'
        : 'See Beeliber luggage storage, same-day airport delivery, and how the service works.';

    return (
        <div className="relative flex flex-col min-h-screen w-full bg-white overflow-x-hidden font-pretendard text-bee-black">
            <SEO
                title={seoTitle}
                description={seoDescription}
                lang={lang}
                path="/services"
            />
            {/* Nav */}
            <nav className="fixed top-0 w-full z-50 bg-white/95 backdrop-blur-md border-b border-gray-100 py-4 px-6 md:px-12 flex justify-between items-center transition-all duration-300">
                <div className="flex items-center gap-1 cursor-pointer group" onClick={onBack}>
                    <Logo size="md" />
                </div>
                <button onClick={onBack} className="text-xs font-black text-gray-400 hover:text-bee-black flex items-center gap-2 px-4 py-2 rounded-full hover:bg-gray-50 transition-all uppercase tracking-[0.1em]">
                    <i className="fa-solid fa-arrow-left"></i> {t.back || 'Back'}
                </button>
            </nav>

            {/* Section 1: Hero */}
            <section className="relative pt-32 pb-20 px-6 min-h-[85vh] flex flex-col items-center justify-center">
                {/* Full-bleed background vibe */}
                <div className="absolute inset-0 z-0 bg-slate-50 overflow-hidden">
                    {/* Soft abstract shapes to mimic natural sunlight/warmth */}
                    <div className="absolute top-0 right-0 w-3/4 h-3/4 bg-bee-yellow/20 rounded-bl-[100%] blur-3xl opacity-60"></div>
                    <div className="absolute bottom-0 left-0 w-1/2 h-1/2 bg-yellow-100/40 rounded-tr-[100%] blur-3xl opacity-60"></div>
                </div>

                <div className="max-w-7xl mx-auto flex flex-col items-center text-center relative z-10 w-full">
                    <motion.div
                        className="mb-12"
                        initial={{ opacity: 0, y: 40 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
                    >
                        <h1 className="text-5xl md:text-7xl font-black tracking-tighter leading-[1.1] text-bee-black mb-6">
                            {t.main_title_1} <br className="md:hidden" />
                            <span className="text-bee-yellow">{t.main_title_2}</span>
                        </h1>
                        <p className="text-lg md:text-2xl text-gray-500 font-bold max-w-2xl mx-auto leading-relaxed mb-10 tracking-tight break-keep">
                            {t.subtitle}
                        </p>
                        <button onClick={onBack} className="px-8 py-4 bg-bee-yellow text-bee-black font-black rounded-full text-lg shadow-xl shadow-bee-yellow/30 hover:-translate-y-1 hover:shadow-2xl hover:shadow-bee-yellow/40 transition-all duration-300">
                            {t.btn_book_now}
                        </button>
                    </motion.div>

                    {/* Tracking Widget (Dashboard style) */}
                    <motion.div
                        className="w-full max-w-4xl mx-auto"
                        initial={{ opacity: 0, y: 40, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        transition={{ delay: 0.3, duration: 0.8 }}
                    >
                        <div className="bg-white rounded-[2.5rem] shadow-[0_20px_80px_-15px_rgba(0,0,0,0.08)] border border-gray-100 overflow-hidden">
                            <div className="flex bg-gray-50/80 border-b border-gray-100 px-6 py-4 items-center gap-3">
                                <div className="w-3 h-3 rounded-full bg-red-400"></div>
                                <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
                                <div className="w-3 h-3 rounded-full bg-green-400"></div>
                                <span className="ml-4 text-xs font-bold text-gray-400 uppercase tracking-widest">{t.email_status_check}</span>
                            </div>
                            <div className="p-8">
                                <TrackingWidget t={t} isModal={true} theme="light" />
                            </div>
                        </div>
                    </motion.div>
                </div>
            </section>

            {/* Section 2: Pain Point vs Freedom (3-column grid) */}
            <section className="py-24 px-6 bg-[#F5F5F0]">
                <div className="max-w-6xl mx-auto">
                    <motion.div {...fadeInUp} className="text-center mb-16">
                        <span className="text-xs font-black tracking-[0.2em] text-gray-400 uppercase mb-4 block">Difference</span>
                        <h2 className="text-4xl md:text-5xl font-black tracking-tighter text-bee-black">
                            {t.pain_title}
                        </h2>
                    </motion.div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {/* Column 1: Pain (Desaturated) */}
                        <motion.div {...fadeInUp} className="bg-white p-8 rounded-[2rem] border border-gray-200 shadow-sm opacity-80 grayscale-[50%] hover:grayscale-0 transition-all duration-500">
                            <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-6 text-2xl">📦</div>
                            <h3 className="text-xl font-black mb-3 tracking-tight">{t.service_1_title}</h3>
                            <p className="text-gray-500 font-medium leading-relaxed break-keep">
                                {t.pain_1}
                            </p>
                        </motion.div>

                        {/* Column 2: Pain (Desaturated) */}
                        <motion.div {...fadeInUp} transition={{ delay: 0.1 }} className="bg-white p-8 rounded-[2rem] border border-gray-200 shadow-sm opacity-80 grayscale-[50%] hover:grayscale-0 transition-all duration-500">
                            <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-6 text-2xl">⏰</div>
                            <h3 className="text-xl font-black mb-3 tracking-tight">{t.service_2_title}</h3>
                            <p className="text-gray-500 font-medium leading-relaxed break-keep">
                                {t.pain_3}
                            </p>
                        </motion.div>

                        {/* Column 3: Beeliber's Freedom (Warm Yellow) */}
                        <motion.div {...fadeInUp} transition={{ delay: 0.2 }} className="bg-bee-yellow p-8 rounded-[2rem] shadow-xl relative overflow-hidden transform hover:-translate-y-2 transition-transform duration-500">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-white/30 rounded-full blur-2xl -mr-10 -mt-10"></div>
                            <div className="w-12 h-12 bg-bee-black rounded-full flex items-center justify-center mb-6 text-bee-yellow relative z-10">
                                <Zap className="w-6 h-6" />
                            </div>
                            <h3 className="text-2xl font-black mb-3 tracking-tight text-bee-black relative z-10">{t.freedom_title}</h3>
                            <p className="text-bee-black/90 font-bold leading-relaxed break-keep relative z-10">
                                {t.pain_solution}
                            </p>
                        </motion.div>
                    </div>
                </div>
            </section>

            {/* Section 3: Process Timeline */}
            <section className="py-24 px-6 bg-white">
                <div className="max-w-5xl mx-auto">
                    <motion.div {...fadeInUp} className="text-center mb-20">
                        <span className="text-xs font-black tracking-[0.2em] text-gray-400 uppercase mb-4 block">{t.how_it_works_badge}</span>
                        <h2 className="text-4xl md:text-5xl font-black tracking-tighter text-bee-black">
                            {t.how_title}
                        </h2>
                    </motion.div>

                    <div className="flex flex-col md:flex-row items-center justify-between gap-12 relative w-full h-full max-w-4xl mx-auto">
                        {/* Connecting Line */}
                        <div className="hidden md:block absolute top-[50%] left-[10%] right-[10%] h-0.5 bg-gray-200 -z-10 -translate-y-[45px]"></div>

                        {[
                            { step: "1", title: t.how_steps?.[0] || (lang === 'ko' ? "예약하기" : "Booking"), desc: t.how_step_descs?.[0], icon: <Smartphone /> },
                            { step: "2", title: t.how_steps?.[1] || (lang === 'ko' ? "짐 인계" : "Drop-off"), desc: t.how_step_descs?.[1], icon: <Box /> },
                            { step: "3", title: t.how_steps?.[2] || (lang === 'ko' ? "자유로운 여행" : "Free Travel"), desc: t.how_step_descs?.[2], icon: <Sparkles /> }
                        ].map((item, idx) => (
                            <motion.div
                                key={idx}
                                initial={{ opacity: 0, scale: 0.9 }}
                                whileInView={{ opacity: 1, scale: 1 }}
                                transition={{ delay: idx * 0.15, duration: 0.5 }}
                                viewport={{ once: true }}
                                className="flex flex-col items-center text-center w-full max-w-[280px]"
                            >
                                <div className="w-24 h-24 bg-white border border-gray-100 shadow-xl rounded-full flex items-center justify-center text-bee-yellow mb-6 relative">
                                    <div className="absolute -top-3 -right-2 w-8 h-8 bg-bee-black text-bee-yellow rounded-full text-sm font-black flex items-center justify-center shadow-md">
                                        {item.step}
                                    </div>
                                    {React.cloneElement(item.icon, { className: 'w-10 h-10' })}
                                </div>
                                <h3 className="text-xl font-black tracking-tight mb-3 text-bee-black">{item.title}</h3>
                                <p className="text-gray-500 text-sm font-medium leading-relaxed whitespace-pre-line break-keep">{item.desc}</p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Section 4: Trust Dashboard */}
            <section className="py-24 px-6 bg-bee-black text-white relative overflow-hidden">
                <div className="absolute -left-40 -top-40 w-96 h-96 bg-bee-yellow/15 rounded-full blur-[100px]"></div>
                <div className="absolute -right-20 -bottom-20 w-80 h-80 bg-blue-500/10 rounded-full blur-[80px]"></div>

                <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center gap-16 relative z-10">
                    <div className="md:w-1/2 space-y-8">
                        <motion.div {...fadeInUp}>
                            <span className="text-bee-yellow text-xs font-black tracking-[0.2em] uppercase mb-4 block">{t.trust_badge}</span>
                            <h2 className="text-4xl md:text-6xl font-black tracking-tighter leading-tight mb-6">
                                {t.trust_title}
                            </h2>
                            <p className="text-gray-400 text-lg font-medium leading-relaxed max-w-md break-keep">
                                {t.trust_desc}
                            </p>
                        </motion.div>

                        <motion.div {...fadeInUp} transition={{ delay: 0.2 }} className="flex flex-col gap-5">
                            <div className="flex items-center gap-5 bg-white/5 p-5 rounded-2xl border border-white/10 hover:bg-white/10 transition-colors">
                                <div className="w-12 h-12 rounded-full bg-bee-yellow/20 flex items-center justify-center text-bee-yellow shrink-0">
                                    <MapPin className="w-6 h-6" />
                                </div>
                                <div>
                                    <h4 className="font-black text-xl mb-1">{t.status_update} & Email Alerts</h4>
                                    <p className="text-sm text-gray-400">{landingT?.trust?.tracking?.desc || "Status updates & email alerts"}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-5 bg-white/5 p-5 rounded-2xl border border-white/10 hover:bg-white/10 transition-colors">
                                <div className="w-12 h-12 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400 shrink-0">
                                    <ShieldCheck className="w-6 h-6" />
                                </div>
                                <div>
                                    <h4 className="font-black text-xl mb-1">{t.trust?.insurance?.title || "Safety Insurance"}</h4>
                                    <p className="text-sm text-gray-400">{t.trust?.insurance?.desc || "Safe compensation insurance System"}</p>
                                </div>
                            </div>
                        </motion.div>
                    </div>

                    <motion.div
                        initial={{ opacity: 0, x: 50 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.8 }}
                        viewport={{ once: true }}
                        className="md:w-1/2 w-full"
                    >
                        {/* Mock Dashboard UI Snippet */}
                        <div className="bg-white/10 backdrop-blur-md rounded-3xl p-8 border border-white/10 shadow-2xl relative">
                            {/* Glass reflection */}
                            <div className="absolute top-0 left-0 w-full h-1/2 bg-gradient-to-b from-white/5 to-transparent rounded-t-3xl"></div>

                            <div className="flex justify-between items-center mb-8 pb-4 border-b border-white/10 relative z-10">
                                <div className="flex items-center gap-3">
                                    <div className="relative flex h-3 w-3">
                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                                        <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                                    </div>
                                    <span className="font-bold text-sm uppercase tracking-wider">{t.status_update}</span>
                                </div>
                                <span className="text-xs font-mono text-gray-400 bg-black/30 px-3 py-1.5 rounded-full text-[10px] tracking-widest">ID: BLB-2401-8X91</span>
                            </div>

                            <div className="space-y-8 relative z-10">
                                <div className="flex items-center gap-5">
                                    <div className="w-14 h-14 bg-bee-yellow rounded-2xl flex items-center justify-center text-bee-black shadow-lg shadow-bee-yellow/20">
                                        <PackageCheck className="w-7 h-7" />
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex justify-between mb-2">
                                            <span className="font-bold text-white">{t.current_status}</span>
                                            <span className="text-bee-yellow font-black">{t.moving}</span>
                                        </div>
                                        <div className="w-full h-2.5 bg-black/50 rounded-full overflow-hidden">
                                            <div className="w-[75%] h-full bg-bee-yellow rounded-full relative">
                                                <div className="absolute inset-0 bg-white/20 w-full h-full animate-[shimmer_2s_infinite]"></div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-black/40 rounded-2xl p-5 text-sm font-medium text-gray-300 space-y-4 border border-white/5">
                                    <div className="flex items-center gap-4">
                                        <CheckCircle2 className="text-green-400 w-5 h-5 shrink-0" />
                                        <span className="text-gray-200">{t.pickup_complete}</span>
                                        <span className="ml-auto text-xs text-gray-500 font-mono">09:15 AM</span>
                                    </div>
                                    <div className="w-px h-4 bg-white/10 ml-2.5 my-[-8px]"></div>
                                    <div className="flex items-center gap-4">
                                        <CheckCircle2 className="text-green-400 w-5 h-5 shrink-0" />
                                        <span className="text-gray-200">{t.transferring}</span>
                                        <span className="ml-auto text-xs text-gray-500 font-mono">10:30 AM</span>
                                    </div>
                                    <div className="w-px h-4 bg-white/10 ml-2.5 my-[-8px]"></div>
                                    <div className="flex items-center gap-4 text-white bg-white/5 p-3 rounded-xl -ml-3 w-[calc(100%+24px)] border border-white/10">
                                        <div className="w-5 h-5 shrink-0 flex items-center justify-center">
                                            <div className="w-4 h-4 rounded-full border-2 border-bee-yellow border-t-transparent animate-spin"></div>
                                        </div>
                                        <span className="font-bold text-bee-yellow">{t.moving_to_hotel} (Current)</span>
                                        <span className="ml-auto text-xs text-bee-yellow/80 font-mono animate-pulse">LIVE</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </div>
            </section>

            {/* Section 5: Persona Cards */}
            <section className="py-32 px-6 bg-slate-50">
                <div className="max-w-6xl mx-auto">
                    <motion.div {...fadeInUp} className="text-center mb-16">
                        <span className="text-xs font-black tracking-[0.2em] text-gray-400 uppercase mb-4 block">{t.everyone_badge}</span>
                        <h2 className="text-4xl md:text-5xl font-black tracking-tighter text-bee-black">
                            {t.who_needs_title}
                        </h2>
                    </motion.div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {[
                            { title: t.persona_1_title, desc: t.persona_1_desc, emoji: "🛬", bg: "bg-[#FFF8E1]" },
                            { title: t.persona_2_title, desc: t.persona_2_desc, emoji: "🛫", bg: "bg-[#FFF8E1]" },
                            { title: t.persona_3_title, desc: t.persona_3_desc, emoji: "🚶‍♂️", bg: "bg-white border border-gray-200 shadow-sm" }
                        ].map((persona, idx) => (
                            <motion.div
                                key={idx}
                                initial={{ opacity: 0, y: 30 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                transition={{ delay: idx * 0.1, duration: 0.6 }}
                                viewport={{ once: true }}
                                className={`${idx === 2 ? 'bg-white border border-yellow-200' : 'bg-[#FFF8E1]'} p-10 rounded-[2.5rem] flex flex-col items-start hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 group`}
                            >
                                <div className="text-6xl mb-8 group-hover:scale-110 transition-transform duration-300 origin-bottom-left">{persona.emoji}</div>
                                <h3 className="text-2xl font-black mb-4 tracking-tight text-bee-black">{persona.title}</h3>
                                <p className="text-gray-600 font-medium leading-relaxed whitespace-pre-line break-keep">
                                    {persona.desc}
                                </p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Section 6: Footer */}
            <footer className="py-20 text-center border-t border-gray-200 bg-white relative overflow-hidden">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-lg h-1 bg-gradient-to-r from-transparent via-bee-yellow/50 to-transparent"></div>
                <div className="max-w-xl mx-auto px-6">
                    <h2 className="text-3xl md:text-4xl font-black italic tracking-tighter text-bee-black mb-8 flex items-center justify-center gap-3">
                        {t.footer_msg}
                        <span className="not-italic text-4xl inline-block hover:rotate-12 transition-transform cursor-pointer">🐝</span>
                    </h2>
                    <p className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-400">
                        © 2025 Beeliber Global Logistics.<br className="md:hidden" /> Designed by Beeliber Team.
                    </p>
                </div>
            </footer>

            <style>{`
                @keyframes shimmer {
                    0% { transform: translateX(-100%); }
                    100% { transform: translateX(100%); }
                }
            `}</style>
        </div>
    );
};

export default ServicesPage;
