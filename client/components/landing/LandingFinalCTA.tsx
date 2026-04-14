
import React from "react";
import { motion } from "framer-motion";
import { Plane, Navigation } from "lucide-react";

interface LandingFinalCTAProps {
    t: any;
    onNavigate: (view: any) => void;
    lang: string;
}

const LandingFinalCTA: React.FC<LandingFinalCTAProps> = ({ t, onNavigate, lang }) => {
    return (
        <section className="relative h-[80vh] flex items-center justify-center overflow-hidden">
            {/* Background Image Container */}
            <div className="absolute inset-0">
                <img
                    src="https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&q=80&w=2000" // 공항에서 손 흔들며 자유롭게 떠나는 뒷모습
                    alt="인천공항 짐배송 서비스를 이용해 두 손 가볍게 여행을 마무리하는 자유로운 모습"
                    loading="lazy"
                    width="2000"
                    height="1333"
                    className="w-full h-full object-cover brightness-[0.4]"
                />
            </div>

            {/* Overlay Gradient for Visibility */}
            <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/40 to-black/90 pointer-events-none" />
            <div className="absolute inset-0 opacity-[0.05] pointer-events-none noise-overlay" />

            <div className="max-w-7xl mx-auto px-6 relative z-10 text-center">
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    className="mb-8"
                >
                    <div className="inline-flex items-center gap-4 text-bee-black mb-8">
                        <div className="w-12 h-12 rounded-full border-2 border-bee-black flex items-center justify-center">
                            <Plane className="w-6 h-6 animate-bounce" />
                        </div>
                        <div className="h-px w-12 bg-bee-black opacity-30" />
                        <div className="w-12 h-12 rounded-full border-2 border-bee-black flex items-center justify-center">
                            <Navigation className="w-6 h-6 rotate-45" />
                        </div>
                    </div>

                    <h2 className="text-4xl md:text-6xl lg:text-[6.5rem] font-display font-black text-white drop-shadow-2xl leading-[1.1] md:leading-[1.1] tracking-tighter mb-6 break-keep whitespace-pre-line px-4">
                        {t.final_cta.headline}
                    </h2>

                    {t.final_cta.sub && (
                        <p className="text-white/60 text-sm md:text-base mb-10 font-medium">
                            {t.final_cta.sub}
                        </p>
                    )}

                    <div className="flex flex-col md:flex-row gap-6 md:gap-10 justify-center">
                        <motion.a
                            href={`/${lang}/locations`}
                            onClick={(e) => { e.preventDefault(); onNavigate('LOCATIONS'); }}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            className="px-12 py-5 md:px-20 md:py-8 bg-bee-black text-bee-yellow text-lg md:text-2xl font-black rounded-[2.5rem] shadow-2xl transition-all tracking-widest uppercase flex items-center justify-center gap-3 cursor-pointer"
                        >
                            {t.final_cta.btn_airport_hotel} ➔
                        </motion.a>
                        <motion.a
                            href={`/${lang}/locations`}
                            onClick={(e) => { e.preventDefault(); onNavigate('LOCATIONS'); }}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            className="px-12 py-5 md:px-20 md:py-8 bg-white text-bee-black text-lg md:text-2xl font-black rounded-[2.5rem] shadow-2xl transition-all tracking-widest uppercase flex items-center justify-center gap-3 border-2 border-bee-black cursor-pointer"
                        >
                            {t.final_cta.btn_hotel_airport} ➔
                        </motion.a>
                    </div>
                </motion.div>
            </div>

            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 w-full text-center z-20">
                <div className="text-[10px] font-black uppercase tracking-[0.5em] text-bee-black opacity-30">
                    © 2026 BEELIBER GLOBAL LOGISTICS | TRUSTED BY THOUSANDS
                </div>
            </div>

            {/* Glowing Accent */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-bee-yellow/20 blur-[150px] -z-10" />
        </section>
    );
};

export default LandingFinalCTA;
