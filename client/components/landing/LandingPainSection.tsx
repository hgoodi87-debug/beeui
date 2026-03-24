
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
        <section ref={targetRef} className="relative py-16 md:py-24 bg-white overflow-hidden">
            {/* Background Texture */}
            <div className="absolute inset-0 opacity-[0.03] pointer-events-none noise-overlay" />

            <div className="max-w-7xl mx-auto px-6 relative z-10">
                <div className="text-center mb-12">
                    <motion.h2
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="text-3xl md:text-6xl font-display font-black text-bee-black leading-[1.2] tracking-tight break-keep px-4"
                    >
                        {t.pain?.headline || '짐꾼 신세는 그만,\n가볍게 걷는 여행의 시작'}
                    </motion.h2>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-stretch h-[450px] md:h-[600px]">
                    {/* Left Side: Pain (Black & White) */}
                    <motion.div
                        style={{ x: leftX, opacity: leftOpacity }}
                        className="relative rounded-[3rem] shadow-2xl"
                    >
                        {/* 이미지 영역 - overflow-hidden 격리 */}
                        <div className="w-full h-full rounded-[3rem] overflow-hidden bg-bee-black group">
                            <img
                                src="https://firebasestorage.googleapis.com/v0/b/beeliber-main.firebasestorage.app/o/%EB%9E%9C%EB%94%A9%2F%E1%84%8C%E1%85%AA%E1%84%8E%E1%85%B3%E1%86%A8.jpeg?alt=media&token=d0d1055b-cafd-40af-8127-4ea24532ee84"
                                alt="Struggling with heavy bags"
                                className="w-full h-full object-cover grayscale filter brightness-[0.4] group-hover:scale-110 transition-transform duration-[3s]"
                            />
                            <div className="absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-black/90 via-black/40 to-transparent" />
                        </div>
                        {/* 텍스트 블록 - 카드 상단 배치 */}
                        <div className="absolute top-10 left-8 right-8 z-20">
                            <div className="px-2 py-2">
                                <div className="inline-block px-4 py-1.5 bg-white/10 backdrop-blur-md rounded-full text-[10px] font-black tracking-widest text-white/80 uppercase mb-3 border border-white/20">{t.pain?.badge_without || 'Without Beeliber'}</div>
                                <h3 className="text-2xl md:text-3xl font-display font-black text-red-500 tracking-tight italic leading-snug drop-shadow-md">{t.pain?.quote_bad || '"STAIRS ARE HELL"'}</h3>
                            </div>
                        </div>
                    </motion.div>

                    {/* Right Side: Pleasure (Color) */}
                    <motion.div
                        style={{ x: rightX, opacity: rightOpacity }}
                        className="relative rounded-[3rem] shadow-2xl"
                    >
                        {/* 이미지 영역 - overflow-hidden 격리 */}
                        <div className="w-full h-full rounded-[3rem] overflow-hidden bg-bee-yellow/10 group">
                            <img
                                src="https://firebasestorage.googleapis.com/v0/b/beeliber-main.firebasestorage.app/o/%EB%9E%9C%EB%94%A9%2F%E1%84%8B%E1%85%AE%E1%84%8E%E1%85%B3%E1%86%A81.jpeg?alt=media&token=5e01a01d-4f5e-401b-808b-d744e972f6d1"
                                alt="Free and happy traveler"
                                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-[3s] brightness-[0.9]"
                            />
                            <div className="absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-bee-black/90 via-bee-black/40 to-transparent" />
                        </div>
                        {/* 텍스트 블록 - 카드 상단 배치 */}
                        <div className="absolute top-10 left-8 right-8 z-20">
                            <div className="px-2 py-2">
                                <div className="inline-block px-4 py-1.5 bg-bee-black/80 backdrop-blur-md rounded-full text-[10px] font-black tracking-widest text-bee-yellow uppercase mb-3 border border-bee-yellow/30">{t.pain?.badge_with || 'With Beeliber'}</div>
                                <h3 className="text-2xl md:text-3xl font-display font-black text-bee-yellow tracking-tight leading-snug drop-shadow-md">{t.pain?.quote_good || '"WALKING ON CLOUDS"'}</h3>
                            </div>
                        </div>
                    </motion.div>
                </div>

                <div className="mt-12 max-w-3xl mx-auto text-center">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.2 }}
                        className="text-xl md:text-3xl text-bee-black font-bold font-outfit leading-relaxed tracking-tight break-keep"
                    >
                        {(t.pain?.sub_copy || '무거운 짐은 비리버가 다 책임집니다.\n당신은 가볍게 돌아다니고, 가장 편안한 상태로 출국하세요.').split('\n').map((line: string, index: number) => (
                            <React.Fragment key={index}>
                                {line}
                                <br />
                            </React.Fragment>
                        ))}
                    </motion.div>
                </div>
            </div>

            {/* Decorative Pulse */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-[600px] bg-bee-yellow/5 rounded-full blur-[150px] -z-10 animate-pulse-soft" />
        </section>
    );
};

export default LandingPainSection;
