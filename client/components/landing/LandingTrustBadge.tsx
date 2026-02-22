
import React from "react";
import { motion } from "framer-motion";
import { ShieldCheck, CheckCircle2, Lock } from "lucide-react";

interface LandingTrustBadgeProps {
    t: any;
}

const LandingTrustBadge: React.FC<LandingTrustBadgeProps> = ({ t }) => {
    return (
        <section className="py-24 md:py-40 bg-bee-black overflow-hidden relative">
            {/* Subtle background decoration */}
            <div className="absolute inset-0 opacity-[0.03] pointer-events-none noise-overlay" />
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-px bg-gradient-to-r from-transparent via-bee-yellow/20 to-transparent" />

            <div className="max-w-7xl mx-auto px-6 relative z-10">
                <div className="text-center mb-20">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        className="inline-flex items-center gap-3 px-6 py-3 bg-white/5 border border-white/10 rounded-full shadow-2xl mb-10 backdrop-blur-xl"
                    >
                        <ShieldCheck className="w-5 h-5 text-bee-yellow" />
                        <span className="text-xs font-black uppercase tracking-[0.3em] text-white/60 font-outfit">Our Safety Philosophy</span>
                    </motion.div>
                    <h2 className="text-4xl md:text-7xl font-display font-black text-white leading-tight tracking-tighter mb-8">
                        {t.trust?.title || "Your Peace of Mind"}<br />
                        <span className="text-bee-yellow italic opacity-80">is our Standard.</span>
                    </h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {[
                        {
                            icon: <Lock className="w-6 h-6" />,
                            title: t.trust?.point1_title || "Secured Storage",
                            desc: t.trust?.point1_desc || "CCTV-monitored, restricted access facilities."
                        },
                        {
                            icon: <ShieldCheck className="w-6 h-6" />,
                            title: t.trust?.point2_title || "100% Guaranteed",
                            desc: t.trust?.point2_desc || "Full insurance coverage for every item."
                        },
                        {
                            icon: <CheckCircle2 className="w-6 h-6" />,
                            title: t.trust?.point3_title || "Expert Handling",
                            desc: t.trust?.point3_desc || "Professional logistics team with 10+ years experience."
                        }
                    ].map((item, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: i * 0.1 }}
                            className="bg-white/5 p-10 rounded-[2.5rem] shadow-2xl hover:bg-white/10 transition-all border border-white/10 flex flex-col items-center text-center backdrop-blur-sm"
                        >
                            <div className="w-14 h-14 bg-bee-yellow rounded-2xl flex items-center justify-center text-bee-black mb-8 shadow-lg shadow-bee-yellow/20">
                                {item.icon}
                            </div>
                            <h3 className="text-xl font-display font-black text-white mb-4 tracking-tight">{item.title}</h3>
                            <p className="text-sm font-bold text-white/50 font-outfit leading-relaxed break-keep">{item.desc}</p>
                        </motion.div>
                    ))}
                </div>

                <div className="mt-24 pt-16 border-t border-white/5 flex flex-col items-center">
                    <div className="text-[10px] font-black uppercase tracking-[0.4em] text-white/20 mb-12">Official Partners & Security</div>
                    <div className="flex flex-wrap justify-center gap-12 md:gap-20">
                        {/* Placeholder for real partner logos with grayscale effect for premium look */}
                        <div className="text-xl md:text-2xl font-display font-black tracking-widest text-white/30 hover:text-bee-yellow transition-colors cursor-default">NAVERMAP</div>
                        <div className="text-xl md:text-2xl font-display font-black tracking-widest text-white/30 hover:text-bee-yellow transition-colors cursor-default">INCOCO</div>
                        <div className="text-xl md:text-2xl font-display font-black tracking-widest text-white/30 hover:text-bee-yellow transition-colors cursor-default">K-TRAVEL</div>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default LandingTrustBadge;
