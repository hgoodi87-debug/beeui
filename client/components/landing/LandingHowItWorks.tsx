import React from "react";
import { motion } from "framer-motion";
import { MapPin, Search as SearchIcon, Briefcase } from "lucide-react";

interface LandingHowItWorksProps {
    t: any;
}

const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: { staggerChildren: 0.3, delayChildren: 0.2 }
    }
};

const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.8 } }
};

const LandingHowItWorks: React.FC<LandingHowItWorksProps> = ({ t }) => {
    const steps = [
        { icon: <MapPin />,         title: t.howitworks.step1.title, desc: t.howitworks.step1.desc, badge: t.howitworks.step1.badge },
        { icon: <SearchIcon />,     title: t.howitworks.step2.title, desc: t.howitworks.step2.desc, badge: t.howitworks.step2.badge },
        { icon: <Briefcase />,      title: t.howitworks.step3.title, desc: t.howitworks.step3.desc, badge: t.howitworks.step3.badge },
    ];

    return (
        <section className="py-10 md:py-20 bg-[#F8F8F5] overflow-hidden relative">
            <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-white to-transparent" />
            <div className="absolute top-0 right-1/4 w-[400px] h-[400px] bg-bee-yellow/5 rounded-full blur-[100px] pointer-events-none" />
            <div className="absolute bottom-0 left-1/4 w-[400px] h-[400px] bg-black/5 rounded-full blur-[100px] pointer-events-none" />

            <div className="max-w-7xl mx-auto px-4 md:px-6 relative z-10">
                {/* 헤드라인 */}
                <motion.div
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, margin: "-100px" }}
                    variants={containerVariants}
                    className="text-center mb-8 md:mb-12"
                >
                    <motion.h2
                        variants={itemVariants}
                        className="text-2xl md:text-5xl font-display font-black tracking-[-0.04em] text-bee-black leading-[1.1] mb-3 md:mb-5 break-keep"
                    >
                        {t.howitworks.headline.split('\n').map((line: string, i: number) => (
                            <React.Fragment key={i}>
                                <span className={i === 0 ? "text-[#EBB200]" : "text-bee-black opacity-90"}>{line}</span>
                                {i < t.howitworks.headline.split('\n').length - 1 && <br />}
                            </React.Fragment>
                        ))}
                    </motion.h2>
                    <motion.p
                        variants={itemVariants}
                        className="text-black/30 text-[11px] md:text-xs font-black tracking-[0.25em] uppercase"
                    >
                        {t.howitworks.subtitle || "The Beeliber Guide"}
                    </motion.p>
                </motion.div>

                {/* 타임라인 — 모바일/PC 동일 구조 */}
                <div className="relative">
                    {/* 중앙 수직선 */}
                    <div className="absolute left-1/2 -translate-x-1/2 top-4 bottom-4 w-[1px] md:w-[2px] bg-gradient-to-b from-bee-yellow via-bee-yellow/30 to-transparent" />

                    <div className="flex flex-col gap-6 md:gap-10 relative">
                        {steps.map((step, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, y: 15 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true, margin: "-50px" }}
                                transition={{ duration: 0.6, ease: [0, 0.55, 0.45, 1], delay: i * 0.05 }}
                                className={`flex items-center gap-0 relative ${i % 2 === 0 ? 'flex-row' : 'flex-row-reverse'}`}
                            >
                                {/* 카드 */}
                                <div className={`w-[calc(50%-28px)] md:w-[calc(50%-32px)] flex ${i % 2 === 0 ? 'justify-end pr-2 md:pr-4' : 'justify-start pl-2 md:pl-4'}`}>
                                    <div className="bg-white p-3 md:p-6 rounded-[1rem] md:rounded-[1.5rem] shadow-[0_8px_20px_-6px_rgba(0,0,0,0.06)] border border-black/5 w-full hover:border-bee-yellow/40 hover:-translate-y-0.5 transition-all duration-300">
                                        <div className="flex flex-col gap-1.5 md:gap-3">
                                            <div className="flex items-center gap-1">
                                                <div className="w-1 h-1 rounded-full bg-bee-yellow animate-pulse shrink-0" />
                                                <span className="text-[10px] md:text-[11px] font-black tracking-[0.12em] text-bee-yellow uppercase italic leading-none">{step.badge}</span>
                                            </div>
                                            <h3 className="text-[13px] md:text-xl font-display font-black text-bee-black tracking-tight leading-snug break-keep">{step.title}</h3>
                                            <p className="text-[11px] md:text-[14px] text-black/50 font-medium leading-relaxed break-keep hidden sm:block">
                                                {step.desc}
                                            </p>
                                            <p className="text-[11px] text-black/50 font-medium leading-relaxed break-keep sm:hidden line-clamp-3">
                                                {step.desc}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* 중앙 아이콘 */}
                                <div className="w-14 md:w-16 shrink-0 flex items-center justify-center z-20">
                                    <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-white flex items-center justify-center text-bee-yellow shadow-[0_6px_18px_rgba(0,0,0,0.08)] border border-black/5">
                                        {React.cloneElement(step.icon as React.ReactElement, { className: "w-4 h-4 md:w-5 md:h-5" } as any)}
                                    </div>
                                </div>

                                {/* 반대편 빈 공간 */}
                                <div className="w-[calc(50%-28px)] md:w-[calc(50%-32px)]" />
                            </motion.div>
                        ))}
                    </div>
                </div>
            </div>

            <div className="absolute bottom-0 left-0 w-full h-24 bg-gradient-to-t from-black/5 to-transparent pointer-events-none" />
        </section>
    );
};

export default LandingHowItWorks;
