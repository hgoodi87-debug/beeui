
import React from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { Smartphone, ChevronRight, MapPin } from "lucide-react";
import { Branch } from "../../types";

interface LandingHeroProps {
    t: any;
    onNavigate: (view: any) => void;
    onTrackClick: () => void;
    branchCode?: string;
    branchData?: Branch;
}

const LandingHero: React.FC<LandingHeroProps> = ({ t, onNavigate, onTrackClick, branchCode, branchData }) => {
    const { scrollY } = useScroll();

    // Parallax effects for typography
    const y1 = useTransform(scrollY, [0, 500], [0, -100]);
    const opacity = useTransform(scrollY, [0, 300], [1, 0]);

    return (
        <section className="relative h-[100dvh] flex items-center justify-center overflow-hidden bg-black">

            {/* 1. LAYER: Cinematic Background (High-Performance Image) */}
            <div className="absolute inset-0 z-0 overflow-hidden bg-black">
                <img
                    src="https://firebasestorage.googleapis.com/v0/b/beeliber-main.firebasestorage.app/o/vc%2F1_background_cinematic_2k_202602230049.jpeg?alt=media&token=66532fb7-1f97-417f-8b7d-062e1f3a1b2b"
                    alt="Cinematic Seoul Background"
                    className="absolute inset-0 w-full h-full object-cover object-center opacity-80 brightness-[0.7] contrast-[1.1] scale-105"
                    loading="eager"
                    data-priority="high"
                    onError={(e) => {
                        e.currentTarget.src = "/hero_main.jpg";
                    }}
                />

                {/* Cinematic Overlays: To maintain premium aesthetic */}
                <div className="absolute inset-0 cinematic-overlay z-[2] bg-black/40" />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black/60 z-[3]" />
                <div className="luxury-grain-overlay opacity-20" />
            </div>

            {/* 2. LAYER: Macro-Typography (Advanced Reveal Animations) */}
            <div className="relative z-10 w-full max-w-[1600px] mx-auto px-6 pointer-events-none -mt-16 md:-mt-24">
                <motion.div
                    style={{ y: y1, opacity }}
                    className="flex flex-col items-center text-center"
                    initial="hidden"
                    animate="visible"
                    variants={{
                        hidden: {},
                        visible: {
                            transition: {
                                staggerChildren: 0.1,
                                delayChildren: 0.1
                            }
                        }
                    }}
                >
                    <motion.div
                        variants={{
                            hidden: { opacity: 0, scale: 0.8, filter: 'blur(10px)' },
                            visible: { opacity: 1, scale: 1, filter: 'blur(0px)', transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] } }
                        }}
                        className="mb-6 md:mb-8 flex flex-col items-center gap-3"
                    >
                        {branchData && (
                            <motion.div 
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="px-4 py-2 rounded-2xl bg-bee-yellow text-bee-black shadow-xl shadow-bee-yellow/20 flex items-center gap-2 mb-2"
                            >
                                <MapPin size={14} className="animate-pulse" />
                                <span className="text-[11px] font-black tracking-wider uppercase">
                                    {branchData.name} {branchData.ownerName ? `| ${branchData.ownerName}` : ''}
                                </span>
                            </motion.div>
                        )}
                        <span className="inline-block px-4 py-1.5 rounded-full border border-white/20 text-white/80 text-[10px] md:text-xs font-black uppercase tracking-[0.4em] backdrop-blur-md bg-black/20 shadow-lg">
                            {t.hero.badge || "Global Logistics Excellence"}
                        </span>
                    </motion.div>

                    <div className="overflow-hidden pb-2 mb-2">
                        <motion.h1
                            variants={{
                                hidden: { y: "100%", opacity: 0 },
                                visible: { y: 0, opacity: 1, transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] } }
                            }}
                            className="macro-type text-[clamp(1.8rem,8vw,4.5rem)] font-black text-white drop-shadow-2xl leading-[1.1] md:leading-[1.2] tracking-tighter break-keep whitespace-normal"
                        >
                            {t.hero.main_title_1 || t.hero.title1} {t.hero.main_title_bags && t.hero.main_title_bags.trim() !== "" && (
                                <span className="text-bee-yellow">{t.hero.main_title_bags}</span>
                            )}
                        </motion.h1>
                    </div>
                    <div className="overflow-hidden pb-4">
                        <motion.div
                            variants={{
                                hidden: { y: "100%", opacity: 0 },
                                visible: { y: 0, opacity: 1, transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] } }
                            }}
                            className="macro-type text-[clamp(1.8rem,8vw,4.5rem)] font-black text-white drop-shadow-2xl leading-[1.1] md:leading-[1.2] tracking-tighter break-keep whitespace-normal"
                        >
                            {t.hero.main_title_2 || t.hero.title2} {t.hero.main_title_city && t.hero.main_title_city.trim() !== "" && (
                                <span>{t.hero.main_title_city}</span>
                            )}
                        </motion.div>
                    </div>

                    <motion.p
                        variants={{
                            hidden: { opacity: 0, y: 20, filter: 'blur(5px)' },
                            visible: { opacity: 1, y: 0, filter: 'blur(0px)', transition: { duration: 0.6, ease: "easeOut" } }
                        }}
                        className="text-white/90 text-base md:text-xl font-medium mt-6 md:mt-10 max-w-2xl mx-auto break-keep leading-relaxed drop-shadow-lg whitespace-pre-line px-4"
                    >
                        {t.hero.subtitle}
                    </motion.p>
                </motion.div>
            </div>

            {/* 3. LAYER: Bento Grid Widgets (The Micro-Trust) - REMOVED per user request */}

            {/* 4. CTA: Apple-style 심플 버튼 & Micro-interaction */}
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.6, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                className="absolute bottom-12 md:bottom-20 inset-x-0 z-40 flex flex-col xl:flex-row items-center justify-center gap-3 md:gap-4 px-6 w-full max-w-5xl mx-auto"
            >
                <div className="flex flex-row w-full xl:w-auto gap-2 md:gap-4">
                    <motion.button
                        whileHover={{ scale: 1.05, backgroundColor: "#fff", color: "#000" }}
                        whileTap={{ scale: 0.95 }}
                        transition={{ type: "spring", stiffness: 400, damping: 25 }}
                        onClick={() => onNavigate('LOCATIONS_STORE')}
                        className="flex-1 xl:w-[220px] group relative py-4 md:py-5 bg-bee-yellow text-bee-black font-black rounded-full text-sm md:text-[17px] flex items-center justify-center shadow-[0_20px_40px_rgba(255,203,5,0.25)] overflow-hidden whitespace-nowrap px-1"
                    >
                        <span className="relative z-10">{t.hero.btn_store_now || "STORE"}</span>
                    </motion.button>

                    <motion.button
                        whileHover={{ scale: 1.05, backgroundColor: "#fff", color: "#000" }}
                        whileTap={{ scale: 0.95 }}
                        transition={{ type: "spring", stiffness: 400, damping: 25 }}
                        onClick={() => onNavigate('LOCATIONS_DELIVER')}
                        className="flex-1 xl:w-[220px] group relative py-4 md:py-5 bg-bee-yellow text-bee-black font-black rounded-full text-sm md:text-[17px] flex items-center justify-center shadow-[0_20px_40px_rgba(255,203,5,0.25)] overflow-hidden whitespace-nowrap px-1"
                    >
                        <span className="relative z-10">{t.hero.btn_deliver_now || "DELIVER"}</span>
                    </motion.button>
                </div>

                <motion.button
                    whileHover={{ scale: 1.05, backgroundColor: "rgba(255,255,255,0.15)" }}
                    whileTap={{ scale: 0.95 }}
                    transition={{ type: "spring", stiffness: 400, damping: 25 }}
                    onClick={onTrackClick}
                    className="w-full xl:w-[200px] group py-4 md:py-5 bg-white/5 text-white font-black rounded-full text-sm md:text-base flex items-center justify-center gap-2 border border-white/10 backdrop-blur-xl shadow-xl whitespace-nowrap"
                >
                    <Smartphone className="w-4 h-4 text-bee-yellow group-hover:scale-110 transition-transform" />
                    <span>{t.hero.track_booking}</span>
                </motion.button>
            </motion.div>

            {/* Bottom Gradient Fade */}
            <div className="absolute bottom-0 inset-x-0 h-40 bg-gradient-to-t from-black to-transparent z-[5]" />

        </section>
    );
};

export default LandingHero;
