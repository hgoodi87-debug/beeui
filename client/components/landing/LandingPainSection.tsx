
import React from "react";
import { motion, useScroll, useTransform } from "framer-motion";

interface LandingPainSectionProps {
    t: any;
}

const LandingPainSection: React.FC<LandingPainSectionProps> = ({ t }) => {
    const targetRef = React.useRef<HTMLDivElement>(null);
    const { scrollYProgress } = useScroll({
        target: targetRef,
        offset: ["start end", "end start"]
    });

    // 좌우 분할 스크롤 모션을 위한 Transform
    const leftX = useTransform(scrollYProgress, [0, 0.5], [-100, 0]);
    const rightX = useTransform(scrollYProgress, [0, 0.5], [100, 0]);
    const leftOpacity = useTransform(scrollYProgress, [0, 0.3, 0.5], [0, 0.5, 1]);
    const rightOpacity = useTransform(scrollYProgress, [0, 0.3, 0.5], [0, 0.5, 1]);

    return (
        <section ref={targetRef} className="relative py-10 md:py-16 bg-white overflow-hidden">
            {/* Background Texture */}
            <div className="absolute inset-0 opacity-[0.03] pointer-events-none noise-overlay" />

            <div className="max-w-7xl mx-auto px-6 relative z-10">
                <div className="hidden">
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-stretch">
                    {/* Left Side: After (자유로운 여행) */}
                    <motion.div
                        style={{ x: leftX, opacity: leftOpacity }}
                        className="relative rounded-[3rem] shadow-2xl aspect-[4/3] md:aspect-[3/2]"
                    >
                        <div className="w-full h-full rounded-[3rem] overflow-hidden bg-bee-yellow/10 group">
                            <picture>
                                <source srcSet="/images/landing/after.webp" type="image/webp" />
                                <img
                                    src="/images/landing/after.jpg"
                                    alt="빌리버 서비스를 이용해 짐 없이 가볍게 한강을 산책하는 자유로운 모습"
                                    loading="lazy"
                                    width="800"
                                    height="600"
                                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-[3s]"
                                />
                            </picture>
                            {/* After 캡션 */}
                            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-6 md:p-8">
                                <span className="inline-block px-3 py-1 bg-bee-yellow text-bee-black text-[10px] md:text-xs font-black rounded-full mb-2">AFTER</span>
                                <p className="text-white font-bold text-sm md:text-lg leading-snug break-keep">
                                    {t.pain?.after_caption || "무거운 짐은 빌리버에게 맡기고,\n당신은 자유로운 여행만 즐기세요."}
                                </p>
                            </div>
                        </div>
                    </motion.div>

                    {/* Right Side: Before (무거운 짐) */}
                    <motion.div
                        style={{ x: rightX, opacity: rightOpacity }}
                        className="relative rounded-[3rem] shadow-2xl aspect-[4/3] md:aspect-[3/2]"
                    >
                        <div className="w-full h-full rounded-[3rem] overflow-hidden bg-bee-black group">
                            <picture>
                                <source srcSet="/images/landing/before.webp" type="image/webp" />
                                <img
                                    src="/images/landing/before.jpg"
                                    alt="캐리어를 들고 지하철 계단을 오르는 여행자의 모습"
                                    loading="lazy"
                                    width="800"
                                    height="600"
                                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-[3s] grayscale group-hover:grayscale-0"
                                />
                            </picture>
                            {/* Before 캡션 */}
                            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-6 md:p-8">
                                <span className="inline-block px-3 py-1 bg-white/20 text-white text-[10px] md:text-xs font-black rounded-full mb-2 backdrop-blur-sm">BEFORE</span>
                                <p className="text-white/80 font-bold text-sm md:text-lg leading-snug break-keep">
                                    {t.pain?.before_caption || "여행의 설렘은 사라지고,\n무거운 짐과의 사투만 남으시겠습니까?"}
                                </p>
                            </div>
                        </div>
                    </motion.div>
                </div>

                <div className="hidden">
                </div>
            </div>

            {/* Decorative Pulse */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-[600px] bg-bee-yellow/5 rounded-full blur-[150px] -z-10 animate-pulse-soft" />
        </section>
    );
};

export default LandingPainSection;
