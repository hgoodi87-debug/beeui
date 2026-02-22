
import React from "react";
import { motion } from "framer-motion";

interface LandingPainSectionProps {
    t: any;
}

const LandingPainSection: React.FC<LandingPainSectionProps> = ({ t }) => {
    return (
        <section className="relative py-24 md:py-48 bg-white overflow-hidden">
            {/* Background Texture & Grain */}
            <div className="absolute inset-0 opacity-[0.03] pointer-events-none mix-blend-overlay noise-overlay" />

            <div className="max-w-7xl mx-auto px-6 relative z-10">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 md:gap-32 items-center">

                    {/* Visual Metaphor: The Struggle */}
                    <motion.div
                        initial={{ opacity: 0, x: -50 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
                        className="relative group lg:pr-10"
                    >
                        <div className="aspect-[4/5] rounded-[3.5rem] overflow-hidden shadow-[0_50px_100px_rgba(0,0,0,0.12)] border border-black/5 relative">
                            <img
                                src="https://firebasestorage.googleapis.com/v0/b/beeliber-main.firebasestorage.app/o/vc%2FGemini_Generated_Image_h8zoceh8zoceh8zo.png?alt=media&token=09b1531c-646b-49a8-afe7-633ba5627e45"
                                alt="Struggling with luggage"
                                className="w-full h-full object-cover group-hover:scale-105 transition-all duration-1000"
                            />
                            {/* Overlay Gradient - 하단 그라데이션을 더 입체적으로 조정 */}
                            <div className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-white via-white/40 to-transparent" />

                            {/* Pain Points Overlay */}
                            <div className="absolute bottom-10 inset-x-6 md:bottom-12 md:inset-x-12">
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.5 }}
                                    className="space-y-3 md:space-y-4"
                                >
                                    {[
                                        { icon: 'fa-stairs', text: t.pain?.point1 || "Stairs are your worst enemy" },
                                        { icon: 'fa-hourglass-half', text: t.pain?.point2 || "Wasting your last 4 hours" },
                                        { icon: 'fa-user-slash', text: t.pain?.point3 || "Crowded trains with 30kg bags" }
                                    ].map((item, idx) => (
                                        <div key={idx} className="flex items-center gap-3 md:gap-4 text-bee-black text-[14px] md:text-[16px] font-black uppercase tracking-[0.15em] md:tracking-[0.2em] bg-white/95 border border-black/5 px-5 md:px-6 py-3 md:py-4 rounded-2xl shadow-2xl backdrop-blur-2xl font-outfit break-keep">
                                            <i className={`fa-solid ${item.icon} text-bee-yellow text-base`}></i>
                                            {item.text}
                                        </div>
                                    ))}
                                </motion.div>
                            </div>
                        </div>

                        {/* Interactive Aura */}
                        <div className="absolute -inset-10 border border-bee-yellow/10 rounded-[5rem] -z-10 animate-pulse-soft" />
                    </motion.div>

                    {/* Text Content */}
                    <div className="lg:pl-6">
                        <motion.span
                            initial={{ opacity: 0 }}
                            whileInView={{ opacity: 1 }}
                            className="inline-block px-5 py-2 rounded-full bg-bee-light text-[11px] font-black tracking-[0.25em] text-bee-black/50 uppercase mb-8 font-outfit"
                        >
                            {t.pain?.badge || "Travel Reality"} 😫
                        </motion.span>
                        <motion.h2
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: 0.1 }}
                            className="text-4xl md:text-6xl lg:text-7xl font-display font-black text-bee-black leading-[1.2] md:leading-[1.1] tracking-tighter mb-10 break-keep"
                        >
                            {t.pain?.title_1 || "Your luggage"} <br className="hidden md:block" />
                            <span className="text-bee-yellow drop-shadow-sm">{t.pain?.title_2 || "is actually"}</span> <br className="hidden md:block" />
                            {t.pain?.title_3 || "Holding you back."}
                        </motion.h2>

                        <motion.p
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: 0.2 }}
                            className="text-lg md:text-2xl text-bee-muted leading-relaxed md:leading-[1.6] max-w-xl mb-16 font-bold font-outfit break-keep opacity-80"
                        >
                            {t.pain?.desc || "Travel shouldn't be a fitness test. Why spend your limited time in Korea sweating over heavy suitcases? Hand them over and be truly free."}
                        </motion.p>

                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            whileInView={{ opacity: 1, scale: 1 }}
                            viewport={{ once: true }}
                            transition={{ delay: 0.3 }}
                        >
                            <div className="inline-flex flex-col gap-4">
                                <div className="text-bee-yellow font-black text-[11px] tracking-[0.3em] uppercase opacity-90 font-outfit">The solution? 💅</div>
                                <div className="text-bee-black text-5xl md:text-7xl font-display font-black tracking-tighter italic">
                                    <span className="text-bee-yellow group-hover:animate-bounce inline-block">bee</span>liber It.
                                </div>
                            </div>
                        </motion.div>
                    </div>
                </div>
            </div>

            {/* Decorative Elements */}
            <div className="absolute top-0 right-0 w-1/4 h-full bg-gradient-to-l from-bee-yellow/5 to-transparent pointer-events-none" />
            <div className="absolute -bottom-40 -left-40 w-[500px] h-[500px] bg-bee-yellow/5 rounded-full blur-[150px] pointer-events-none" />
        </section>
    );
};

export default LandingPainSection;
