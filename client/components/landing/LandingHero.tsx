
import React from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { Smartphone, ChevronRight } from "lucide-react";

interface LandingHeroProps {
    t: any;
    onNavigate: (view: any) => void;
    onTrackClick: () => void;
    videoSrc: string;
    branchCode?: string;
}

const LandingHero: React.FC<LandingHeroProps> = ({ t, onNavigate, onTrackClick, videoSrc, branchCode }) => {
    const { scrollY } = useScroll();

    // Parallax effects for typography
    const y1 = useTransform(scrollY, [0, 500], [0, -100]);
    const opacity = useTransform(scrollY, [0, 300], [1, 0]);

    return (
        <section className="relative h-[100dvh] flex items-center justify-center overflow-hidden bg-black">

            {/* 1. LAYER: Cinematic Background (Authentic POV) 💅 */}
            <div className="absolute inset-0 z-0">
                <img
                    src="https://firebasestorage.googleapis.com/v0/b/beeliber-main.firebasestorage.app/o/vc%2F1_background_cinematic_2k_202602230049.jpeg?alt=media&token=66532fb7-1f97-417f-8b7d-062e1f3a1b2b"
                    alt="Cinematic Seoul Background"
                    className="w-full h-full object-cover object-center opacity-80 brightness-[0.7] contrast-[1.1]"
                />

                {/* Cinematic Overlays */}
                <div className="absolute inset-0 cinematic-overlay z-[2]" />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black/40 z-[3]" />
                <div className="luxury-grain-overlay opacity-30" />
            </div>

            {/* 2. LAYER: Macro-Typography (Advanced Reveal Animations) ✨ */}
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
                                staggerChildren: 0.15,
                                delayChildren: 0.2
                            }
                        }
                    }}
                >
                    <motion.div
                        variants={{
                            hidden: { opacity: 0, scale: 0.8, filter: 'blur(10px)' },
                            visible: { opacity: 1, scale: 1, filter: 'blur(0px)', transition: { duration: 1, ease: [0.16, 1, 0.3, 1] } }
                        }}
                        className="mb-6 md:mb-8"
                    >
                        <span className="inline-block px-4 py-1.5 rounded-full border border-white/20 text-white/80 text-[10px] md:text-xs font-black uppercase tracking-[0.4em] backdrop-blur-md bg-black/20 shadow-lg">
                            {t.hero.badge || "Global Logistics Excellence"}
                        </span>
                    </motion.div>

                    <div className="overflow-hidden pb-2 mb-2">
                        <motion.h1
                            variants={{
                                hidden: { y: "100%", opacity: 0 },
                                visible: { y: 0, opacity: 1, transition: { duration: 1.2, ease: [0.16, 1, 0.3, 1] } }
                            }}
                            className="macro-type text-5xl md:text-[5.5rem] lg:text-[7.5rem] font-black text-white drop-shadow-2xl leading-[1.1] md:leading-[1.2] tracking-tighter"
                        >
                            {t.hero.main_title_1 || "LEAVE THE"} <span className="text-bee-yellow">{t.hero.main_title_bags || "BAGS."}</span>
                        </motion.h1>
                    </div>
                    <div className="overflow-hidden pb-4">
                        <motion.div
                            variants={{
                                hidden: { y: "100%", opacity: 0 },
                                visible: { y: 0, opacity: 1, transition: { duration: 1.2, ease: [0.16, 1, 0.3, 1] } }
                            }}
                            className="macro-type text-5xl md:text-[5.5rem] lg:text-[7.5rem] font-black text-white drop-shadow-2xl leading-[1.1] md:leading-[1.2] tracking-tighter"
                        >
                            {t.hero.main_title_2 || "LIVE THE"} {t.hero.main_title_city || "CITY."}
                        </motion.div>
                    </div>

                    <motion.p
                        variants={{
                            hidden: { opacity: 0, y: 20, filter: 'blur(5px)' },
                            visible: { opacity: 1, y: 0, filter: 'blur(0px)', transition: { duration: 1, ease: "easeOut" } }
                        }}
                        className="text-white/90 text-base md:text-xl font-medium mt-6 md:mt-10 max-w-2xl mx-auto break-keep leading-relaxed drop-shadow-lg whitespace-pre-line px-4"
                    >
                        {t.hero.subtitle}
                    </motion.p>
                </motion.div>
            </div>

            {/* 3. LAYER: Bento Grid Widgets (The Micro-Trust) - REMOVED per user request 🗑️ */}

            {/* 4. CTA: Apple-style 심플 버튼 & Micro-interaction 🚀 */}
            <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.2, duration: 1, ease: [0.16, 1, 0.3, 1] }}
                className="absolute bottom-12 md:bottom-20 inset-x-0 z-40 flex flex-col sm:flex-row items-center justify-center gap-3 md:gap-4 px-6"
            >
                <motion.button
                    whileHover={{ scale: 1.05, backgroundColor: "#fff", color: "#000" }}
                    whileTap={{ scale: 0.95 }}
                    transition={{ type: "spring", stiffness: 400, damping: 25 }}
                    onClick={() => onNavigate('LOCATIONS')}
                    className="w-full sm:w-auto group relative px-6 py-3 md:px-10 md:py-4 bg-bee-yellow text-bee-black font-black rounded-full text-sm md:text-lg flex items-center justify-center gap-2 shadow-[0_15px_30px_rgba(255,203,5,0.15)] overflow-hidden"
                >
                    <span className="relative z-10">{t.hero.btn_now || "BOOK NOW & FREE YOUR HANDS"}</span>
                    <ChevronRight className="relative z-10 w-4 h-4 md:w-5 md:h-5 group-hover:translate-x-1.5 transition-transform" />
                </motion.button>

                <motion.button
                    whileHover={{ scale: 1.05, backgroundColor: "rgba(255,255,255,0.15)" }}
                    whileTap={{ scale: 0.95 }}
                    transition={{ type: "spring", stiffness: 400, damping: 25 }}
                    onClick={onTrackClick}
                    className="w-full sm:w-auto group px-6 py-3 md:px-10 md:py-4 bg-white/5 text-white font-black rounded-full text-sm md:text-lg flex items-center justify-center gap-2 border border-white/10 backdrop-blur-xl shadow-xl"
                >
                    <Smartphone className="w-4 h-4 md:w-5 md:h-5 text-bee-yellow group-hover:scale-110 transition-transform" />
                    <span>{t.hero.track_booking}</span>
                </motion.button>
            </motion.div>

            {/* Bottom Gradient Fade */}
            <div className="absolute bottom-0 inset-x-0 h-40 bg-gradient-to-t from-black to-transparent z-[5]" />

        </section>
    );
};

export default LandingHero;
