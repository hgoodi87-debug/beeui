
import React from "react";
import { motion } from "framer-motion";

interface LandingPainSectionProps {
    t: any;
}

const LandingPainSection: React.FC<LandingPainSectionProps> = ({ t }) => {
    const cards = [
        {
            label: "STORAGE",
            title: t.pain?.storage_title || "시간 단위 짐 보관",
            desc: t.pain?.storage_desc || "beeliber는 고객이 원하는 시간만큼만 짐 보관이 가능합니다.",
        },
        {
            label: "DELIVERY",
            title: t.pain?.delivery_title || "공항 당일 배송",
            desc: t.pain?.delivery_desc || "beeliber는 호텔·지점에서 접수한 짐을 인천공항까지 당일 안전하게 배송합니다.",
        },
        {
            label: "COVERAGE",
            title: t.pain?.coverage_title || "서울 및 부산 주요 40개 이상 거점",
            desc: t.pain?.coverage_desc || "beeliber는 홍대·명동·강남·종로·해운대·광안리 등 주요 관광지 인근에 파트너 지점이 있습니다.",
        },
    ];

    return (
        <section className="relative py-10 md:py-24 bg-white overflow-hidden">
            {/* Background Texture */}
            <div className="absolute inset-0 opacity-[0.03] pointer-events-none noise-overlay" />

            <div className="max-w-[1200px] mx-auto px-6 relative z-10">
                {/* Section header */}
                <motion.div
                    initial={{ opacity: 0, y: 24 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.7 }}
                    className="mb-6 md:mb-16 text-center"
                >
                    <h2 className="text-2xl md:text-5xl font-black tracking-[-0.03em] text-[#111] leading-[1.1] mb-4 break-words">
                        {t.pain?.section_title || "어떤 서비스를 운영하나요?"}
                    </h2>
                    <p className="text-sm md:text-base text-[#555] font-medium leading-relaxed break-words">
                        {t.pain?.section_desc || "beeliber는 명동, 홍대, 동대문, 강남, 부산 등 총 40여개의 거점에서 짐을 보관하고, 인천공항까지 배송해드리는 여행자 짐 서비스입니다."}
                    </p>
                </motion.div>

                {/* 3 Cards — left vertical timeline */}
                <div className="relative flex flex-col gap-2 md:gap-5 pl-6 md:pl-8">
                    {/* Vertical timeline line */}
                    <div className="absolute left-0 top-3 bottom-3 w-[2px] bg-gradient-to-b from-[#F5B200] via-[#F5B200]/40 to-transparent" />

                    {cards.map((card, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, x: -20 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true, margin: "-60px" }}
                            transition={{ duration: 0.6, delay: i * 0.12 }}
                            className="relative bg-[#fafafa] border border-[#eee] rounded-xl p-3 md:p-8 hover:border-[#F5B200]/40 hover:shadow-md transition-all duration-300"
                        >
                            {/* Yellow bullet on the left side (touching the timeline) */}
                            <div className="absolute -left-[calc(1.5rem+5px)] md:-left-[calc(2rem+5px)] top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-[#F5B200] border-2 border-white shadow-sm" />

                            <span className="inline-block text-[10px] font-medium tracking-[0.4em] text-[#F5B200] uppercase mb-0.5">
                                {card.label}
                            </span>
                            <h3 className="text-base md:text-xl font-black text-[#111] mb-0.5 break-keep">
                                {card.title}
                            </h3>
                            <p className="text-xs md:text-sm text-[#666] font-medium leading-snug break-keep">
                                {card.desc}
                            </p>
                        </motion.div>
                    ))}
                </div>
            </div>

            {/* Decorative Pulse */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-[600px] bg-bee-yellow/5 rounded-full blur-[150px] -z-10 animate-pulse-soft" />
        </section>
    );
};

export default LandingPainSection;
