
import React from "react";
import { motion } from "framer-motion";
import { MapPin, Smartphone, ChevronRight, ShieldCheck, Users, Briefcase } from "lucide-react";

interface LandingHeroProps {
    t: any;
    onNavigate: (view: any) => void;
    onTrackClick: () => void;
    videoSrc: string;
}

const LandingHero: React.FC<LandingHeroProps> = ({ t, onNavigate, onTrackClick, videoSrc }) => {
    return (
        <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-16">

            {/* Background Video Layer */}
            <div className="absolute inset-0 z-0 bg-black">
                <video
                    autoPlay
                    loop
                    muted
                    playsInline
                    preload="auto"
                    poster="https://images.unsplash.com/photo-1565026057447-bc90a3dceb87?auto=format&fit=crop&q=80&w=1920"
                    src={videoSrc}
                    className="w-full h-full object-cover object-center opacity-80"
                />

                {/* Luxury Grain Overlay */}
                <div className="luxury-grain-overlay" />

                {/* Dark Overlays for Readability & Depth */}
                <div className="absolute inset-0 bg-black/20 backdrop-blur-[1px] z-[2]" />
                <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/80 z-[3]" />
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
                        className="inline-block px-4 py-1.5 rounded-full bg-yellow-500/10 border border-yellow-500/30 text-[11px] font-black tracking-[0.3em] mb-6 text-yellow-500 uppercase backdrop-blur-md"
                    >
                        {t.hero.badge || "No more heavy luggage"}
                    </motion.span>

                    <h1 className="text-5xl md:text-[120px] font-black leading-[1.15] tracking-tighter mb-8 text-white">
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

                    <p className="text-base md:text-2xl text-white/60 mb-12 leading-relaxed max-w-2xl mx-auto font-bold">
                        {t.hero.subtitle}
                    </p>

                    {/* [NEW] Social Proof Stats */}
                    <div className="flex flex-wrap justify-center gap-8 mb-14">
                        <div className="flex flex-col items-center">
                            <div className="flex items-center gap-2 text-white font-black text-2xl">
                                <Users className="w-5 h-5 text-bee-yellow" />
                                <span>15,000+</span>
                            </div>
                            <span className="text-[10px] text-white/40 font-black uppercase tracking-widest">Happy Travelers</span>
                        </div>
                        <div className="flex flex-col items-center">
                            <div className="flex items-center gap-2 text-white font-black text-2xl">
                                <Briefcase className="w-5 h-5 text-bee-yellow" />
                                <span>24,500+</span>
                            </div>
                            <span className="text-[10px] text-white/40 font-black uppercase tracking-widest">Bags Delivered</span>
                        </div>
                    </div>

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
                            onClick={onTrackClick}
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
    );
};

export default LandingHero;
