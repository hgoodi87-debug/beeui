
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

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-stretch h-[450px] md:h-[600px]">
                    {/* Left Side: Pleasure (Color) - Swapped to Left */}
                    <motion.div
                        style={{ x: leftX, opacity: leftOpacity }}
                        className="relative rounded-[3rem] shadow-2xl"
                    >
                        <div className="w-full h-full rounded-[3rem] overflow-hidden bg-bee-yellow/10 group">
                            <img
                                src="https://firebasestorage.googleapis.com/v0/b/beeliber-main.firebasestorage.app/o/%EB%9E%9C%EB%94%A9%2F%E1%84%8B%E1%85%AE%E1%84%8E%E1%85%B3%E1%86%A81.jpeg?alt=media&token=5e01a01d-4f5e-401b-808b-d744e972f6d1"
                                alt="인천공항 당일 짐배송 서비스를 이용해 가벼운 몸으로 여행을 마무리하는 뒷모습"
                                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-[3s]"
                            />
                        </div>
                    </motion.div>

                    {/* Right Side: Pain (Originally Black & White) - Swapped to Right */}
                    <motion.div
                        style={{ x: rightX, opacity: rightOpacity }}
                        className="relative rounded-[3rem] shadow-2xl"
                    >
                        <div className="w-full h-full rounded-[3rem] overflow-hidden bg-bee-black group">
                            <img
                                src="https://firebasestorage.googleapis.com/v0/b/beeliber-main.firebasestorage.app/o/%EB%9E%9C%EB%94%A9%2F%E1%84%8C%E1%85%AA%E1%84%8E%E1%85%B3%E1%86%A8.jpeg?alt=media&token=d0d1055b-cafd-40af-8127-4ea24532ee84"
                                alt="무거운 캐리어와 짐 때문에 서울 지하철 계단에서 고생하는 여행자의 모습"
                                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-[3s]"
                            />
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
