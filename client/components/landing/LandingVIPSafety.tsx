
import React from "react";
import { motion } from "framer-motion";

interface LandingVIPSafetyProps {
    t: any;
}

const LandingVIPSafety: React.FC<LandingVIPSafetyProps> = ({ t }) => {
    const tiers = [
        {
            label: "SILVER",
            labelColor: "#6B7280",
            condition: t.vip?.silver_condition || "10회 이용 시",
            title: t.vip?.silver_title || "다음 예약 10% 할인",
            bg: "linear-gradient(160deg, #e8e8e8 0%, #c8c8c8 100%)",
            border: "#b0b0b0",
            conditionColor: "#555",
            titleColor: "#222",
        },
        {
            label: "GOLD",
            labelColor: "#92610A",
            condition: t.vip?.gold_condition || "20회 이용 시",
            title: t.vip?.gold_title || "전용 픽업 서비스 + 20% 할인",
            bg: "linear-gradient(160deg, #FFD700 0%, #F5B200 100%)",
            border: "#D4A017",
            conditionColor: "#6B4200",
            titleColor: "#3B2200",
        },
        {
            label: "PLATINUM",
            labelColor: "#4B6A8A",
            condition: t.vip?.platinum_condition || "50회 이용 시",
            title: t.vip?.platinum_title || "콘시어지 전담 + 30% 할인",
            bg: "linear-gradient(160deg, #D8E8F4 0%, #B0C8E0 100%)",
            border: "#8AADCE",
            conditionColor: "#2C4A6A",
            titleColor: "#1A2F45",
        },
    ];

    return (
        <section className="py-10 md:py-32 bg-[#0d0d0d] relative overflow-hidden">
            {/* Background Glows */}
            <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-bee-yellow/5 blur-[120px] rounded-full pointer-events-none" />
            <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-white/5 blur-[100px] rounded-full pointer-events-none" />

            <div className="max-w-[1200px] mx-auto px-4 md:px-6 relative z-10">
                {/* Header */}
                <div className="mb-6 md:mb-20 text-center">
                    <motion.h2
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.1 }}
                        className="text-3xl md:text-5xl font-bold tracking-[0.02em] text-bee-yellow leading-[1.1] break-keep"
                    >
                        {(t.vip?.headline || "beeliber membership").replace(/membership/i, '')}
                        <span className="uppercase">{(t.vip?.headline || "beeliber membership").match(/membership/i)?.[0] || "membership"}</span>
                    </motion.h2>
                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.2 }}
                        className="mt-4 text-sm md:text-base text-white/50 font-medium break-keep"
                    >
                        {t.vip?.desc || "beeliber를 자주 이용할수록 다양한 혜택이 있습니다. 더 가볍게 여행다니세요."}
                    </motion.p>
                </div>

                {/* 3-Column VIP Tier Cards */}
                <div className="grid grid-cols-3 gap-3 md:gap-6">
                    {tiers.map((tier, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: i * 0.1, duration: 0.6 }}
                            className="rounded-xl flex flex-col items-center text-center px-3 py-4 md:px-6 md:py-8 transition-all duration-300 hover:-translate-y-1 shadow-lg"
                            style={{
                                background: tier.bg,
                                border: `1.5px solid ${tier.border}`,
                            }}
                        >
                            <span
                                className="text-[9px] font-medium tracking-[0.3em] uppercase mb-1"
                                style={{ color: tier.labelColor }}
                            >
                                {tier.label}
                            </span>
                            <p className="text-[10px] md:text-xs font-bold mb-1" style={{ color: tier.conditionColor }}>
                                {tier.condition}
                            </p>
                            <p className="text-[11px] md:text-sm font-black leading-snug break-words" style={{ color: tier.titleColor }}>
                                {tier.title}
                            </p>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default LandingVIPSafety;
