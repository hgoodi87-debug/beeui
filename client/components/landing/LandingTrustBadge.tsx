
import React from "react";
import { motion } from "framer-motion";
import { ShieldCheck, MapPin, Lock, CheckCircle2 } from "lucide-react";
import AggregateRatingSchema from "../../src/domains/shared/ui/FAQ/AggregateRatingSchema";

interface LandingTrustBadgeProps {
    t: any;
}

const LandingTrustBadge: React.FC<LandingTrustBadgeProps> = ({ t }) => {
    const trustFeatures = [
        {
            icon: <MapPin className="w-8 h-8" />,
            title: t.trust?.tracking?.title || '실시간 이메일 알림',
            desc: t.trust?.tracking?.desc || '내 짐의 상태를 실시간으로 이메일로 전송 받으세요.',
            accent: t.trust?.tracking?.accent || "EMAIL STATUS"
        },
        {
            icon: <ShieldCheck className="w-8 h-8" />,
            title: t.trust?.insurance?.title || '프리미엄 파손 보험',
            desc: t.trust?.insurance?.desc || '스크래치 하나까지 책임지는 글로벌 수준의 보험 기본 가입.',
            accent: t.trust?.insurance?.accent || "GLOBAL INSURED"
        },
        {
            icon: <Lock className="w-8 h-8" />,
            title: t.trust?.seal?.title || '보안 씰(Seal) 시스템',
            desc: t.trust?.seal?.desc || '도착 전까지 절대 열리지 않음을 보장하는 스마트 보안 씰.',
            accent: t.trust?.seal?.accent || "SMART SEAL"
        }
    ];

    return (
        <section className="py-16 md:py-24 bg-bee-black overflow-hidden relative">
            <AggregateRatingSchema />
            {/* Background Visual Depth */}
            <div className="absolute inset-0">
                <img
                    src="https://images.unsplash.com/photo-1557597774-9d2739f85a76?auto=format&fit=crop&q=80&w=2000" // 세련된 보안 시스템/네트워크 느낌
                    alt="빌리버의 스마트 보안 시스템과 실시간 배송 추적이 이루어지는 안전한 인프라"
                    className="w-full h-full object-cover opacity-10 grayscale"
                />
            </div>

            {/* Premium Glowing Background */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-bee-yellow/10 blur-[150px] rounded-full pointer-events-none" />
            <div className="absolute inset-0 opacity-[0.05] pointer-events-none noise-overlay" />
            <div className="absolute inset-0 bg-gradient-to-b from-bee-black via-transparent to-bee-black pointer-events-none" />

            <div className="max-w-7xl mx-auto px-6 relative z-10">
                <div className="text-center mb-12 md:mb-20">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        className="inline-flex items-center gap-3 px-6 py-3 bg-white/5 border border-white/10 rounded-full mb-10 backdrop-blur-xl"
                    >
                        <ShieldCheck className="w-5 h-5 text-bee-yellow" />
                        <span className="text-[10px] font-black uppercase tracking-[0.4em] text-white/60 font-outfit text-bee-yellow">
                            {t.trust?.badge_label || "VIP Bee-Keeper Trust"}
                        </span>
                    </motion.div>
                    <h2 className="text-3xl md:text-6xl font-display font-black text-white leading-tight tracking-tighter break-keep px-4 whitespace-pre-line">
                        {t.trust.headline}
                    </h2>
                </div>

                <div className="grid grid-cols-3 gap-3 md:gap-12">
                    {trustFeatures.map((feature, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: i * 0.1 }}
                            className="bg-white/5 p-4 md:p-12 rounded-3xl md:rounded-[3.5rem] border border-white/10 hover:border-bee-yellow/40 hover:bg-white/[0.08] transition-all duration-500 group flex flex-col items-center text-center shadow-2xl backdrop-blur-md"
                        >
                            <div className="w-10 h-10 md:w-20 md:h-20 bg-bee-yellow rounded-xl md:rounded-3xl flex items-center justify-center text-bee-black mb-4 md:mb-10 shadow-[0_10px_20px_rgba(255,203,5,0.15)] md:shadow-[0_20px_40px_rgba(255,203,5,0.2)] group-hover:scale-110 group-hover:rotate-6 transition-all duration-500">
                                <div className="scale-75 md:scale-100">
                                    {feature.icon}
                                </div>
                            </div>
                            <div className="text-bee-yellow text-[7px] md:text-[10px] font-black tracking-[0.2em] md:tracking-[0.3em] uppercase mb-1 md:mb-4 opacity-70 group-hover:opacity-100">{feature.accent}</div>
                            <h3 className="text-[10px] md:text-2xl font-display font-black text-white mb-2 md:mb-6 tracking-tight leading-tight">{feature.title}</h3>
                            <p className="hidden md:block text-base font-bold text-white/80 font-outfit leading-relaxed break-keep group-hover:text-white transition-colors whitespace-pre-line">{feature.desc}</p>
                            <p className="md:hidden text-[8px] font-bold text-white/60 font-outfit leading-tight break-keep">{feature.desc.split('.')[0]}</p>
                        </motion.div>
                    ))}
                </div>

                {/* Assurance Indicator */}
                <div className="mt-16 pt-10 border-t border-white/10 flex flex-wrap justify-center items-center gap-12 md:gap-24 opacity-30 grayscale hover:grayscale-0 hover:opacity-100 transition-all duration-1000">
                    <div className="flex items-center gap-3">
                        <CheckCircle2 className="w-6 h-6 text-bee-yellow" />
                        <span className="text-white font-black tracking-widest text-sm uppercase">{t.trust?.footer_label1 || "24/7 Monitoring"}</span>
                    </div>
                    <div className="flex items-center gap-3">
                        <CheckCircle2 className="w-6 h-6 text-bee-yellow" />
                        <span className="text-white font-black tracking-widest text-sm uppercase">{t.trust?.footer_label2 || "Certified Partners"}</span>
                    </div>
                    <div className="flex items-center gap-3">
                        <CheckCircle2 className="w-6 h-6 text-bee-yellow" />
                        <span className="text-white font-black tracking-widest text-sm uppercase">{t.trust?.footer_label3 || "Secure Cloud Encryption"}</span>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default LandingTrustBadge;
