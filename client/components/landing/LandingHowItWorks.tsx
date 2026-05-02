import React from "react";
import { motion } from "framer-motion";

interface LandingHowItWorksProps {
    t: any;
}

const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: { staggerChildren: 0.15, delayChildren: 0.1 }
    }
};

const itemVariants = {
    hidden: { opacity: 0, y: 24 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.7 } }
};

const LandingHowItWorks: React.FC<LandingHowItWorksProps> = ({ t }) => {
    const steps = [
        {
            num: "STEP 01",
            title: t.howitworks?.step1?.title || "서비스 선택",
            desc: t.howitworks?.step1?.desc || "짐 보관 또는 공항 배송 중 필요한 서비스를 선택합니다.",
        },
        {
            num: "STEP 02",
            title: t.howitworks?.step2?.title || "지점 및 시간 선택",
            desc: t.howitworks?.step2?.desc || "가까운 지점을 찾고 맡길 시간과 찾을 시간을 지정하세요.",
        },
        {
            num: "STEP 03",
            title: t.howitworks?.step3?.title || "결제 완료",
            desc: t.howitworks?.step3?.desc || "카드·간편결제로 즉시 예약이 확정됩니다.",
        },
        {
            num: "STEP 04",
            title: t.howitworks?.step4?.title || "QR 바우처로 이용",
            desc: t.howitworks?.step4?.desc || "지점에서 QR만 보여주면 끝. 더 이상 줄 서지 마세요.",
        },
    ];

    return (
        <section id="how-it-works" className="py-16 md:py-28 bg-[#0d0d0d] overflow-hidden relative">
            {/* Background glows */}
            <div className="absolute top-0 right-1/4 w-[400px] h-[400px] bg-bee-yellow/5 rounded-full blur-[100px] pointer-events-none" />
            <div className="absolute bottom-0 left-1/4 w-[400px] h-[400px] bg-white/3 rounded-full blur-[100px] pointer-events-none" />

            <div className="max-w-[1200px] mx-auto px-5 md:px-6 relative z-10">
                {/* Headline */}
                <motion.div
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, margin: "-80px" }}
                    variants={containerVariants}
                    className="mb-12 md:mb-16"
                >
                    <motion.h2
                        variants={itemVariants}
                        className="text-3xl md:text-5xl font-black tracking-[-0.03em] text-white leading-[1.1] mb-4 break-keep"
                    >
                        {t.howitworks?.headline || "쉽고 빠른 4단계"}
                    </motion.h2>
                    <motion.p
                        variants={itemVariants}
                        className="text-sm md:text-base text-white/50 font-medium"
                    >
                        {t.howitworks?.subtitle || "복잡한 절차 없이, 예약부터 픽업까지."}
                    </motion.p>
                </motion.div>

                {/* Timeline — left vertical line */}
                <div className="relative flex flex-col gap-5 pl-6 md:pl-8">
                    {/* Vertical line */}
                    <div className="absolute left-0 top-3 bottom-3 w-[2px] bg-gradient-to-b from-[#F5B200] via-[#F5B200]/40 to-transparent" />

                    {steps.map((step, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, x: -20 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true, margin: "-50px" }}
                            transition={{ duration: 0.6, delay: i * 0.1 }}
                            className="relative rounded-2xl p-6 md:p-8 border transition-all duration-300"
                            style={{
                                background: "rgba(255,255,255,0.05)",
                                borderColor: "rgba(255,255,255,0.12)",
                            }}
                        >
                            {/* Yellow bullet */}
                            <div className="absolute -left-[calc(1.5rem+5px)] md:-left-[calc(2rem+5px)] top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-[#F5B200] border-2 border-[#0d0d0d] shadow-sm" />

                            <span className="inline-block text-[10px] font-black tracking-[0.2em] text-[#F5B200] uppercase mb-2">
                                {step.num}
                            </span>
                            <h3 className="text-lg md:text-xl font-black text-white mb-2 break-keep">
                                {step.title}
                            </h3>
                            <p className="text-sm text-white/45 font-medium leading-relaxed break-keep">
                                {step.desc}
                            </p>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default LandingHowItWorks;
