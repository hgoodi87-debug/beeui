
import React from "react";
import { motion } from "framer-motion";
import { MapPin, ShieldCheck, Lock } from "lucide-react";

interface LandingVIPSafetyProps {
    t: any;
}

const LandingVIPSafety: React.FC<LandingVIPSafetyProps> = ({ t }) => {
    const cards = [
        {
            icon: MapPin,
            title: t.trust?.tracking?.title || "실시간 위치 알림",
            desc: t.trust?.tracking?.desc || "내 짐의 보관/배송 상태를 실시간 이메일로 확인하세요.",
            badge: t.trust?.tracking?.accent || "STATUS UPDATE",
            color: "from-blue-500/20 to-cyan-500/20",
            iconColor: "text-blue-400"
        },
        {
            icon: ShieldCheck,
            title: t.trust?.insurance?.title || "프리미엄 안심 보험",
            desc: t.trust?.insurance?.desc || "분실/파손 걱정 끝! 최대 50만 원까지 보장되는 든든한 보험.",
            badge: t.trust?.insurance?.accent || "SECURED",
            color: "from-bee-yellow/20 to-orange-500/20",
            iconColor: "text-bee-yellow"
        },
        {
            icon: Lock,
            title: t.trust?.seal?.title || "스마트 보안 시스템",
            desc: t.trust?.seal?.desc || "CCTV와 전문 파트너가 당신의 짐을 24시간 안전하게 지킵니다.",
            badge: t.trust?.seal?.accent || "SAFE CARE",
            color: "from-purple-500/20 to-pink-500/20",
            iconColor: "text-purple-400"
        }
    ];

    return (
        <section className="py-16 md:py-32 bg-black relative overflow-hidden">
            {/* Background Glows */}
            <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-bee-yellow/5 blur-[120px] rounded-full pointer-events-none" />
            <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-white/5 blur-[100px] rounded-full pointer-events-none" />

            <div className="max-w-7xl mx-auto px-4 md:px-6 relative z-10">
                <div className="text-center mb-12 md:mb-24">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        viewport={{ once: true }}
                        className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-white/10 bg-white/5 backdrop-blur-md mb-6 md:mb-8"
                    >
                        <div className="w-1 h-1 md:w-1.5 md:h-1.5 rounded-full bg-bee-yellow animate-pulse" />
                        <span className="text-[10px] md:text-xs font-black tracking-[0.2em] md:tracking-[0.3em] text-white/40 uppercase">
                            {t.trust?.badge_label || 'SAFE & TRUST BEELIBER'}
                        </span>
                    </motion.div>
                    <h2 className="text-3xl md:text-7xl font-display font-black tracking-tighter text-white leading-[1.1] md:leading-[1.05]"
                        dangerouslySetInnerHTML={{ __html: t.trust?.headline || '당신의 짐은,<br class="md:hidden" /> 우리에겐 <span class="text-bee-yellow italic">VIP</span>입니다.' }}
                    />
                </div>

                <div className="grid grid-cols-3 md:grid-cols-3 gap-2 md:gap-8">
                    {cards.map((card, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: i * 0.1, duration: 0.6 }}
                            className="group relative"
                        >
                            {/* Card Glow Effect */}
                            <div className={`absolute -inset-0.5 bg-gradient-to-br ${card.color} rounded-2xl md:rounded-[3rem] opacity-0 group-hover:opacity-100 transition duration-500 blur-sm`} />
                            
                            <div className="relative h-full bg-[#0D0D0D] border border-white/10 rounded-2xl md:rounded-[3rem] p-3 md:p-10 flex flex-col items-center text-center transition-all duration-500 overflow-hidden group-hover:translate-y-[-5px] group-hover:border-white/20">
                                {/* Subtle Inner Glow */}
                                <div className="absolute top-0 right-0 w-24 h-24 bg-white/[0.02] rounded-full -mr-12 -mt-12 blur-2xl pointer-events-none" />

                                <div className="w-8 h-8 md:w-20 md:h-20 rounded-lg md:rounded-[1.5rem] bg-white/5 border border-white/10 flex items-center justify-center mb-3 md:mb-8 transition-transform duration-500 relative">
                                    <div className="absolute inset-0 bg-white/5 rounded-full blur-xl group-hover:bg-bee-yellow/10 transition-colors" />
                                    <card.icon className={`w-4 h-4 md:w-10 md:h-10 ${card.iconColor} relative z-10 transition-colors duration-500`} />
                                </div>

                                <div className="space-y-1.5 md:space-y-4">
                                    <span className="inline-block text-[8px] md:text-[10px] font-black tracking-[0.1em] md:tracking-[0.2em] text-white/20 uppercase group-hover:text-bee-yellow transition-colors duration-500">
                                        {card.badge}
                                    </span>
                                    <h3 className="text-[11px] md:text-[2rem] font-display font-black text-white tracking-tight leading-[1.2]">
                                        {card.title}
                                    </h3>
                                    <p className="hidden md:block text-sm md:text-base text-white/40 font-medium leading-relaxed break-keep max-w-[240px] mx-auto">
                                        {card.desc}
                                    </p>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>

                <div className="mt-12 md:mt-32 pt-8 md:pt-16 border-t border-white/5 flex flex-row flex-wrap items-center justify-center gap-4 md:gap-16 opacity-30">
                    {[t.trust?.footer_label1 || '마포/서울 공식 파트너십', t.trust?.footer_label2 || '검증된 보관 거점', t.trust?.footer_label3 || '이미 수만 명이 경험한 신뢰'].map((label, idx) => (
                        <div key={idx} className="flex items-center gap-2 md:gap-3 group px-2">
                            <ShieldCheck className="w-3 h-3 md:w-5 md:h-5 text-white group-hover:text-bee-yellow transition-colors" />
                            <span className="text-[8px] md:text-xs font-bold text-white tracking-widest uppercase">{label}</span>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default LandingVIPSafety;
