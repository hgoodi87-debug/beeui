
import React from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { Smartphone, ChevronRight, MapPin } from "lucide-react";
import { Branch } from "../../types";
import LandingGoogleReviewsStrip from "./LandingGoogleReviewsStrip";

interface LandingHeroProps {
    t: any;
    lang: string;
    onNavigate: (view: any) => void;
    onTrackClick: () => void;
    branchCode?: string;
    branchData?: Branch;
}

const LandingHero: React.FC<LandingHeroProps> = ({ t, lang, onNavigate, onTrackClick, branchCode, branchData }) => {
    const { scrollY } = useScroll();

    // Parallax effects for typography
    const y1 = useTransform(scrollY, [0, 500], [0, -100]);
    const opacity = useTransform(scrollY, [0, 300], [1, 0]);

    return (
        <section className="relative h-screen min-h-[700px] flex items-center justify-center overflow-hidden bg-black">

            {/* 1. LAYER: Cinematic Background */}
            <div className="absolute inset-0 z-0 overflow-hidden bg-black">
                <img
                    src="https://firebasestorage.googleapis.com/v0/b/beeliber-main.firebasestorage.app/o/vc%2F1_background_cinematic_2k_202602230049.jpeg?alt=media&token=66532fb7-1f97-417f-8b7d-062e1f3a1b2b"
                    alt="빌리버 비전 배경"
                    className="absolute inset-0 w-full h-full object-cover object-center opacity-70 brightness-[0.6] scale-105"
                    loading="eager"
                    fetchPriority="high"
                />
                <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-black z-[1]" />
            </div>

            {/* 2. LAYER: Content */}
            <div className="relative z-10 w-full max-w-[1600px] mx-auto px-6 pointer-events-none -mt-48 md:-mt-56">
                <motion.div
                    style={{ y: y1, opacity }}
                    className="flex flex-col items-center text-center"
                >
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mb-8"
                    >
                        {branchData && (
                            <div className="px-5 py-2.5 rounded-2xl bg-bee-yellow text-bee-black shadow-2xl shadow-bee-yellow/20 flex items-center gap-2 mb-4">
                                <MapPin size={14} className="animate-pulse" />
                                <span className="text-[11px] font-black tracking-widest uppercase">
                                    {branchData.name} {branchData.ownerName ? `| ${branchData.ownerName}` : ''}
                                </span>
                            </div>
                        )}
                        <span className="inline-block px-5 py-2 rounded-full border border-white/10 text-white/90 text-[10px] md:text-xs font-bold uppercase tracking-[0.5em] backdrop-blur-md bg-white/5">
                            {t.hero.badge || "Global Logistics Excellence"}
                        </span>
                    </motion.div>

                    <h1 className="flex flex-col items-center">
                        <span className="macro-type block text-[clamp(1.5rem,6vw,3.5rem)] font-black text-white leading-[1.1] md:leading-[1.2] tracking-tighter break-keep whitespace-normal drop-shadow-2xl">
                            {t.hero.main_title_1}
                        </span>
                        <span className="macro-type block text-[clamp(1.5rem,6vw,3.5rem)] font-black text-white leading-[1.1] md:leading-[1.2] tracking-tighter mt-2 break-keep whitespace-normal drop-shadow-2xl">
                            {t.hero.main_title_2}
                        </span>
                    </h1>

                    <p className="text-white/70 text-base md:text-xl font-medium mt-8 max-w-2xl mx-auto break-keep leading-relaxed opacity-90">
                        {t.hero.subtitle}
                    </p>
                </motion.div>
            </div>

            {/* 3. CTA Area */}
            <div className="absolute bottom-52 md:bottom-64 inset-x-0 z-40 flex items-center justify-center px-6 pointer-events-none">
                <div className="flex flex-row gap-4 pointer-events-auto">
                    <motion.button
                        whileHover={{ scale: 1.05, backgroundColor: "#fff", color: "#000" }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => onNavigate('LOCATIONS_STORE')}
                        className="w-[170px] md:w-[240px] py-4 md:py-5 bg-bee-yellow text-bee-black font-black rounded-full text-[12px] md:text-base shadow-2xl shadow-bee-yellow/20 transition-all uppercase tracking-widest flex items-center justify-center"
                    >
                        {t.hero.cta_storage || "STORE"}
                    </motion.button>
                    <motion.button
                        whileHover={{ scale: 1.05, backgroundColor: "#fff", color: "#000" }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => onNavigate('LOCATIONS_DELIVER')}
                        className="w-[170px] md:w-[240px] py-4 md:py-5 bg-bee-yellow text-bee-black font-black rounded-full text-[12px] md:text-base shadow-2xl shadow-bee-yellow/20 transition-all uppercase tracking-widest flex items-center justify-center"
                    >
                        {t.hero.cta_delivery || "DELIVER"}
                    </motion.button>
                </div>
            </div>

            {/* 4. Google Reviews Strip - VISIBLE IMMEDIATELY at bottom 💅 */}
            <div className="absolute bottom-0 left-0 right-0 z-50">
                <div className="bg-gradient-to-t from-black to-transparent h-40 absolute bottom-0 inset-x-0 z-0" />
                <div className="relative z-10 scale-[0.9] md:scale-100 origin-bottom">
                    <LandingGoogleReviewsStrip />
                </div>
            </div>

        </section>
    );
};

export default LandingHero;
