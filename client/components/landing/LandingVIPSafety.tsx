
import React from "react";
import { motion } from "framer-motion";
import { MapPin, ShieldCheck, Lock } from "lucide-react";

interface LandingVIPSafetyProps {
    t: any;
}

const LandingVIPSafety: React.FC<LandingVIPSafetyProps> = ({ t }) => {
    const cards = [
        {
            icon: <MapPin className="w-8 h-8 text-bee-black" />,
            title: t.trust?.tracking?.title || "실시간 위치 알림",
            desc: t.trust?.tracking?.desc || "내 짐의 보관/배송 상태를 실시간 이메일로 확인하세요.",
            badge: t.trust?.tracking?.accent || "STATUS UPDATE"
        },
        {
            icon: <ShieldCheck className="w-8 h-8 text-bee-black" />,
            title: t.trust?.insurance?.title || "프리미엄 안심 보험",
            desc: t.trust?.insurance?.desc || "분실/파손 걱정 끝! 최대 50만 원까지 보장되는 든든한 보험.",
            badge: t.trust?.insurance?.accent || "SECURED"
        },
        {
            icon: <Lock className="w-8 h-8 text-bee-black" />,
            title: t.trust?.seal?.title || "스마트 보안 시스템",
            desc: t.trust?.seal?.desc || "CCTV와 전문 파트너가 당신의 짐을 24시간 안전하게 지킵니다.",
            badge: t.trust?.seal?.accent || "SAFE CARE"
        }
    ];

    return (
        <section className="py-20 md:py-32 bg-[#0A0A0A] overflow-hidden">
            <div className="max-w-7xl mx-auto px-6">
                <div className="text-center mb-16 md:mb-24">
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-white/10 bg-white/5 mb-8"
                    >
                        <ShieldCheck className="w-4 h-4 text-bee-yellow" />
                        <span className="text-[10px] font-black tracking-[0.2em] text-white/60 uppercase">
                            {t.trust?.badge_label || 'SAFE & TRUST BEELIBER'}
                        </span>
                    </motion.div>
                    <h2 className="text-4xl md:text-6xl font-display font-black tracking-tight text-white leading-tight"
                        dangerouslySetInnerHTML={{ __html: t.trust?.headline || '당신의 짐은,<br class="md:hidden" /> 우리에겐 <span class="text-bee-yellow italic">VIP</span>입니다.' }}
                    />
                </div>

                {/* Vertical on Desktop, Horizontal Scroll on Mobile */}
                <div className="flex md:grid md:grid-cols-3 gap-6 overflow-x-auto md:overflow-visible pb-8 md:pb-0 scrollbar-hide snap-x snap-mandatory px-4 md:px-0 -mx-4 md:mx-0">
                    {cards.map((card, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, scale: 0.95 }}
                            whileInView={{ opacity: 1, scale: 1 }}
                            viewport={{ once: true }}
                            transition={{ delay: i * 0.1 }}
                            className="min-w-[85vw] md:min-w-0 bg-[#161616] border border-white/5 rounded-[2.5rem] p-10 flex flex-col items-center text-center snap-center hover:bg-[#1C1C1C] transition-colors"
                        >
                            <div className="w-20 h-20 rounded-3xl bg-bee-yellow/10 flex items-center justify-center mb-8 relative">
                                <div className="absolute inset-0 bg-bee-yellow/20 blur-2xl rounded-full" />
                                <div className="relative z-10 w-14 h-14 rounded-2xl bg-bee-yellow flex items-center justify-center text-black">
                                    {card.icon}
                                </div>
                            </div>
                            <span className="text-[10px] font-black tracking-[0.2em] text-bee-yellow/60 uppercase mb-4">
                                {card.badge}
                            </span>
                            <h3 className="text-2xl md:text-3xl font-display font-black text-white mb-6 tracking-tight">
                                {card.title}
                            </h3>
                            <p className="text-white/40 font-bold leading-relaxed break-keep max-w-[240px]">
                                {card.desc}
                            </p>
                        </motion.div>
                    ))}
                </div>

                <div className="mt-20 flex flex-col md:flex-row items-center justify-center gap-8 md:gap-16 opacity-30">
                   <div className="flex items-center gap-3">
                       <ShieldCheck className="w-5 h-5 text-white" />
                       <span className="text-xs font-bold text-white tracking-widest uppercase">{t.trust?.footer_label1 || '마포/서울 공식 파트너십'}</span>
                   </div>
                   <div className="flex items-center gap-3">
                       <ShieldCheck className="w-5 h-5 text-white" />
                       <span className="text-xs font-bold text-white tracking-widest uppercase">{t.trust?.footer_label2 || '검증된 보관 거점'}</span>
                   </div>
                   <div className="flex items-center gap-3">
                       <ShieldCheck className="w-5 h-5 text-white" />
                       <span className="text-xs font-bold text-white tracking-widest uppercase">{t.trust?.footer_label3 || '이미 수만 명이 경험한 신뢰'}</span>
                   </div>
                </div>
            </div>
        </section>
    );
};

export default LandingVIPSafety;
