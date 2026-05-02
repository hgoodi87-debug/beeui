
import React from "react";
import { motion } from "framer-motion";

interface LandingVIPSafetyProps {
    t: any;
}

const LandingVIPSafety: React.FC<LandingVIPSafetyProps> = ({ t }) => {
    const tiers = [
        {
            label: "SILVER",
            labelColor: "#F5B200",
            condition: t.vip?.silver_condition || "10회 이용 시",
            title: t.vip?.silver_title || "다음 예약 10% 할인",
            featured: false,
        },
        {
            label: "GOLD",
            labelColor: "#FF3B30",
            condition: t.vip?.gold_condition || "20회 이용 시",
            title: t.vip?.gold_title || "전용 픽업 서비스 + 20% 할인",
            featured: true,
        },
        {
            label: "PLATINUM",
            labelColor: "#34C759",
            condition: t.vip?.platinum_condition || "50회 이용 시",
            title: t.vip?.platinum_title || "콘시어지 전담 + 30% 할인",
            featured: false,
        },
    ];

    return (
        <section className="py-16 md:py-32 bg-[#0d0d0d] relative overflow-hidden">
            {/* Background Glows */}
            <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-bee-yellow/5 blur-[120px] rounded-full pointer-events-none" />
            <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-white/5 blur-[100px] rounded-full pointer-events-none" />

            <div className="max-w-[1200px] mx-auto px-4 md:px-6 relative z-10">
                {/* Header */}
                <div className="mb-12 md:mb-20">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        viewport={{ once: true }}
                        className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-white/10 bg-white/5 backdrop-blur-md mb-6"
                    >
                        <div className="w-1.5 h-1.5 rounded-full bg-bee-yellow animate-pulse" />
                        <span className="text-[10px] font-black tracking-[0.25em] text-white/40 uppercase">
                            {t.vip?.badge_label || "VIP MEMBERSHIP"}
                        </span>
                    </motion.div>
                    <motion.h2
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.1 }}
                        className="text-3xl md:text-6xl font-black tracking-[-0.03em] text-white leading-[1.1] break-keep"
                    >
                        {t.vip?.headline || "여행을 더 가볍게"}
                    </motion.h2>
                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.2 }}
                        className="mt-4 text-sm md:text-base text-white/50 font-medium max-w-[480px] break-keep"
                    >
                        {t.vip?.desc || "자주 여행하는 분들을 위한 특별한 혜택을 준비했습니다."}
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
                            className={`rounded-2xl border border-[#F5B200] flex flex-col items-center justify-center text-center p-4 md:p-6 min-h-[140px] transition-all duration-300 hover:-translate-y-1 ${
                                tier.featured
                                    ? "bg-gradient-to-b from-[#fffcf0] to-white shadow-xl"
                                    : "bg-white/92"
                            }`}
                            style={{
                                background: tier.featured
                                    ? "linear-gradient(160deg, #fffcf0 0%, #fff 60%)"
                                    : "rgba(255,255,255,0.92)",
                            }}
                        >
                            <span
                                className="text-[10px] font-black tracking-[0.15em] uppercase mb-2"
                                style={{ color: tier.labelColor }}
                            >
                                {tier.label}
                            </span>
                            <p className="text-[11px] md:text-xs font-bold text-[#444] mb-1">
                                {tier.condition}
                            </p>
                            <p className="text-[12px] md:text-sm font-black text-[#111] leading-snug break-keep">
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
