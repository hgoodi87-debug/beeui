import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { ShieldCheck, Smartphone, ChevronRight } from 'lucide-react';
import TrackingWidget from './TrackingWidget';

interface ServicesPageProps {
    onBack: () => void;
    t: any;
    landingT?: any;
}

const ServicesPage: React.FC<ServicesPageProps> = ({ onBack, t, landingT }) => {
    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    if (!t) return <div className="min-h-screen flex items-center justify-center bg-white">Loading...</div>;

    const fadeInUp = {
        initial: { opacity: 0, y: 30 },
        whileInView: { opacity: 1, y: 0 },
        viewport: { once: true },
        transition: { duration: 0.6, ease: "easeOut" }
    };

    return (
        <div className="min-h-screen bg-white font-sans text-bee-black">
            {/* Sticky Header */}
            <nav className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-gray-100 py-4 px-6 md:px-12 flex justify-between items-center shadow-sm">
                <div className="flex items-center gap-1 cursor-pointer" onClick={onBack}>
                    <span className="text-2xl font-black italic text-bee-yellow">bee</span>
                    <span className="text-2xl font-black text-bee-black">liber</span>
                </div>
                <button onClick={onBack} className="text-sm font-bold text-gray-500 hover:text-bee-black flex items-center gap-2 px-4 py-2 rounded-full hover:bg-gray-50 transition-all">
                    <i className="fa-solid fa-arrow-left"></i> {t.back || 'Back'}
                </button>
            </nav>

            {/* Hero Section */}
            <section className="relative pt-20 pb-32 px-6 overflow-hidden">
                <div className="max-w-7xl mx-auto flex flex-col items-center text-center relative z-10">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                    >
                        <span className="inline-block px-4 py-1.5 rounded-full bg-yellow-50 text-bee-yellow border border-bee-yellow/20 font-bold text-xs uppercase tracking-widest mb-6">
                            {t.services_page?.badge || "Smart Luggage Solution"}
                        </span>
                        <h1 className="text-5xl md:text-7xl font-black leading-tight mb-8 text-bee-black">
                            {t.services_page?.main_title_1 || 'Leave your luggage,'} <br className="hidden md:block" />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-bee-yellow to-yellow-500">
                                {t.services_page?.main_title_2 || 'Find your freedom.'}
                            </span>
                        </h1>
                        <p className="text-lg md:text-xl text-gray-500 max-w-2xl mx-auto leading-relaxed mb-12">
                            {t.services_page?.subtitle || 'From Hongdae to Incheon Airport. We handle your heavy bags so you can enjoy every moment of your trip.'}
                        </p>
                    </motion.div>

                    {/* Booking/Status Toggle or Widget Area */}
                    <motion.div
                        className="w-full max-w-4xl"
                        initial={{ opacity: 0, y: 40 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2, duration: 0.8 }}
                    >
                        <div className="bg-white rounded-[2.5rem] shadow-[0_20px_60px_-15px_rgba(0,0,0,0.1)] border border-gray-100 overflow-hidden relative">
                            <div className="absolute top-0 left-0 w-full h-2 bg-bee-yellow"></div>
                            <div className="p-8 md:p-12">
                                <div className="flex flex-col md:flex-row items-center justify-between mb-8">
                                    <div className="text-left">
                                        <h3 className="text-2xl font-black mb-2">{t.tracking?.title || 'Check your bag status'}</h3>
                                        <p className="text-gray-400 text-sm">{t.tracking?.desc || 'Enter your details to track your luggage.'}</p>
                                    </div>
                                    <div className="hidden md:block w-12 h-12 bg-yellow-50 rounded-full flex items-center justify-center text-bee-yellow text-xl">
                                        <i className="fa-solid fa-box-open"></i>
                                    </div>
                                </div>

                                <div className="tracking-widget-container-light">
                                    <div className="bg-bee-black rounded-3xl p-6 md:p-8">
                                        <TrackingWidget t={t} isModal={true} />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </div>
            </section>

            {/* 3. SERVICE INTRODUCTION & PAIN POINTS (From Main) */}
            <section className="py-24 md:py-40 bg-white">
                <div className="max-w-[1400px] mx-auto px-6">
                    {/* Header: Service Intro */}
                    <div className="max-w-4xl mb-24 md:mb-32">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            className="inline-block px-4 py-1.5 rounded-full bg-bee-yellow/10 border border-bee-yellow/20 text-[10px] font-black tracking-[0.3em] mb-6 text-bee-black uppercase"
                        >
                            {t.services_page?.subtitle_badge || "Beeliber Service"}
                        </motion.div>
                        <h2 className="text-4xl md:text-7xl font-black tracking-tighter leading-[1.1] mb-10 break-keep">
                            {t.services_page?.title}
                        </h2>
                        <p className="text-lg md:text-2xl text-black/50 font-bold leading-relaxed break-keep">
                            {t.services_page?.intro}
                        </p>
                    </div>

                    {/* Pain points section */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-20 items-center mb-32 md:mb-48">
                        <div className="space-y-12">
                            <div className="space-y-6">
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true }}
                                    className="inline-block px-3 py-1 bg-[#FF4B5C]/10 text-[#FF4B5C] text-[10px] font-black rounded-sm mx-auto md:mx-0"
                                >
                                    {t.services_page?.pain_badge || landingT?.pain_section?.badge || "TRAVEL CHALLENGES"}
                                </motion.div>
                                <h3 className="text-3xl md:text-5xl font-black tracking-tighter break-keep leading-tight text-center md:text-left">
                                    {t.services_page?.pain_title || landingT?.pain_section?.title_1} <br />
                                </h3>
                            </div>

                            <div className="space-y-6">
                                {[
                                    { t: t.services_page?.pain_1, d: t.services_page?.pain_1_desc || landingT?.pain_section?.item1_d, icon: "!" },
                                    { t: t.services_page?.pain_2, d: t.services_page?.pain_2_desc || landingT?.pain_section?.item2_d, icon: "📵" },
                                    { t: t.services_page?.pain_3, d: t.services_page?.pain_3_desc || landingT?.pain_section?.item3_d, icon: "🕒" }
                                ].map((item, idx) => (
                                    <motion.div
                                        key={idx}
                                        initial={{ opacity: 0, x: -20 }}
                                        whileInView={{ opacity: 1, x: 0 }}
                                        transition={{ delay: idx * 0.1 }}
                                        viewport={{ once: true }}
                                        className="flex gap-6 p-8 bg-slate-50/50 rounded-[2rem] border border-black/5 items-start group hover:bg-white hover:shadow-xl transition-all duration-500"
                                    >
                                        <div className="w-10 h-10 rounded-full bg-[#FF4B5C] text-white flex items-center justify-center shrink-0 font-black text-sm shadow-lg shadow-[#FF4B5C]/20">
                                            {idx === 0 ? <ShieldCheck className="w-5 h-5" /> : item.icon}
                                        </div>
                                        <div className="space-y-2">
                                            <h4 className="text-lg md:text-xl font-black text-black break-keep group-hover:text-[#FF4B5C] transition-colors">
                                                {item.t}
                                            </h4>
                                            <p className="text-sm md:text-base font-bold text-black/40 leading-relaxed break-keep">
                                                {item.d}
                                            </p>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>

                            <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                whileInView={{ opacity: 1, scale: 1 }}
                                viewport={{ once: true }}
                                className="relative p-8 bg-[#ffcb05] rounded-[2rem] overflow-hidden shadow-[0_20px_40px_rgba(255,203,5,0.2)]"
                            >
                                <div className="absolute top-0 right-0 w-32 h-32 bg-white/20 rounded-full -mr-16 -mt-16 blur-3xl" />
                                <p className="relative z-10 text-lg md:text-xl font-black text-black break-keep leading-snug">
                                    🐝 {t.services_page?.pain_solution || landingT?.pain_section?.solution}
                                </p>
                            </motion.div>
                        </div>

                        {/* Visual Side (Image 2 style) */}
                        <motion.div
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            className="relative aspect-[4/5] rounded-[4rem] overflow-hidden shadow-2xl group border border-black/5"
                        >
                            <img
                                src="https://firebasestorage.googleapis.com/v0/b/beeliber-main.firebasestorage.app/o/vc%2FGemini_Generated_Image_h8zoceh8zoceh8zo.png?alt=media&token=09b1531c-646b-49a8-afe7-633ba5627e45"
                                alt="Beeliber Pain Point"
                                className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105"
                            />
                            <div className="absolute inset-0 bg-black/10" />

                            {/* Floating Badge on Image */}
                            <div className="absolute top-8 right-6">
                                <span className="px-4 py-2 bg-[#FF4B5C] text-[10px] font-black rounded-full shadow-xl flex items-center gap-2">
                                    <span className="w-2.5 h-2.5 bg-white/20 rounded-full flex items-center justify-center">
                                        <span className="w-1 h-1 bg-white rounded-full animate-pulse" />
                                    </span>
                                    {t.services_page?.main_title_2}
                                </span>
                            </div>

                            {/* Bottom White Card Overlay */}
                            <div className="absolute top-8 left-6 w-32">
                                <div className="p-2.5 bg-white/90 backdrop-blur-md rounded-[1.2rem] shadow-2xl border border-white/50 space-y-1">
                                    <div className="w-6 h-6 bg-bee-yellow rounded-lg flex items-center justify-center shadow-lg">
                                        <Smartphone className="w-3 h-3 text-bee-black" />
                                    </div>
                                    <h4 className="text-[10px] font-black tracking-tight text-black leading-tight">
                                        {t.services_page?.main_title_2}, <span className="text-bee-black">{t.services_page?.main_title_1}</span>
                                    </h4>
                                    <p className="text--[7px] font-bold text-black/50 leading-tight break-keep">
                                        {t.services_page?.intro?.split('.')[0]}
                                    </p>
                                </div>
                            </div>
                        </motion.div>
                    </div>

                    {/* Benefits Grid */}
                    <div className="space-y-20">
                        <div className="text-center">
                            <h3 className="text-3xl md:text-5xl font-black tracking-tighter mb-6">{t.services_page?.benefits_title}</h3>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-8">
                            {t.services_page?.benefits?.map((benefit: any, idx: number) => (
                                <motion.div
                                    key={idx}
                                    initial={{ opacity: 0, y: 20 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    transition={{ delay: idx * 0.1 }}
                                    viewport={{ once: true }}
                                    className="p-8 bg-white border border-black/5 rounded-[2.5rem] shadow-xl hover:shadow-2xl hover:-translate-y-2 transition-all group"
                                >
                                    <div className="w-12 h-12 rounded-2xl bg-bee-yellow text-bee-black flex items-center justify-center mb-8 shadow-lg group-hover:scale-110 transition-transform">
                                        <ShieldCheck className="w-6 h-6" />
                                    </div>
                                    <h4 className="text-xl font-black mb-4 tracking-tighter break-keep">{benefit.t}</h4>
                                    <p className="text-sm font-bold text-black/40 leading-relaxed break-keep">{benefit.d}</p>
                                </motion.div>
                            ))}
                        </div>
                    </div>


                </div>
            </section>

            {/* CTA */}
            <section className="py-24 text-center px-6">
                <div className="max-w-3xl mx-auto">
                    <h2 className="text-4xl md:text-6xl font-black mb-8 leading-tight">{t.services_page?.cta_main_title || 'Ready to verify your freedom?'}</h2>
                    <button onClick={onBack} className="bg-bee-yellow text-bee-black px-12 py-6 rounded-[2rem] text-xl font-black hover:scale-105 transition-transform shadow-[0_20px_40px_-10px_rgba(255,215,0,0.3)]">
                        {t.services_page?.btn_book_now || t.nav?.book || 'Start Now'} <i className="fa-solid fa-arrow-right ml-3"></i>
                    </button>
                </div>
            </section>

            {/* Simple Footer */}
            <footer className="bg-white text-gray-300 py-12 text-center text-xs font-bold uppercase tracking-widest border-t border-gray-100">
                © 2025 Beeliber Global Logistics. Designed by Beeliber Team.
            </footer>
        </div>
    );
};

export default ServicesPage;
