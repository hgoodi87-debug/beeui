
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
        <section ref={targetRef} className="relative py-32 md:py-64 bg-white overflow-hidden">
            {/* Background Texture */}
            <div className="absolute inset-0 opacity-[0.03] pointer-events-none noise-overlay" />

            <div className="max-w-7xl mx-auto px-6 relative z-10">
                <div className="text-center mb-24">
                    <motion.h2
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="text-4xl md:text-7xl font-display font-black text-bee-black leading-tight tracking-tighter break-keep"
                    >
                        {t.pain.headline}
                    </motion.h2>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-stretch h-[660px] md:h-[880px]">
                    {/* Left Side: Pain (Black & White) */}
                    <motion.div
                        style={{ x: leftX, opacity: leftOpacity }}
                        className="relative rounded-[3rem] shadow-2xl"
                    >
                        {/* 이미지 영역 - overflow-hidden 격리 */}
                        <div className="w-full h-full rounded-[3rem] overflow-hidden bg-bee-black group">
                            <img
                                src="https://firebasestorage.googleapis.com/v0/b/beeliber-main.firebasestorage.app/o/vc%2FGemini_Generated_Image_h8zoceh8zoceh8zo.png?alt=media&token=09b1531c-646b-49a8-afe7-633ba5627e45"
                                alt="Struggling with heavy bags"
                                className="w-full h-full object-cover grayscale filter brightness-[0.4] group-hover:scale-110 transition-transform duration-[3s]"
                            />
                            <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
                        </div>
                        {/* 텍스트 블록 - 카드 하단 밖으로 살짝 띄움 */}
                        <div className="absolute bottom-6 left-8 right-8 z-20">
                            <div className="px-2 py-2">
                                <div className="inline-block px-4 py-1.5 bg-white/10 backdrop-blur-md rounded-full text-[10px] font-black tracking-widest text-white/80 uppercase mb-3 border border-white/20">{t.pain.badge_without || 'Without Beeliber'}</div>
                                <h3 className="text-2xl md:text-3xl font-display font-black text-red-500 tracking-tighter italic leading-tight drop-shadow-md">{t.pain.quote_bad || '"STAIRS ARE HELL"'}</h3>
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
                                src="https://firebasestorage.googleapis.com/v0/b/beeliber-main.firebasestorage.app/o/vc%2F%EB%B0%B1%EA%B7%B8%EB%9D%BC%EC%9A%B4%EB%93%9C.jpeg?alt=media&token=22f04a18-d90b-4940-a958-df84d0d39aa8"
                                alt="Free and happy traveler"
                                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-[3s] brightness-[0.9]"
                            />
                            <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-bee-black/90 via-bee-black/40 to-transparent" />
                        </div>
                        {/* 텍스트 블록 - 카드 하단 밖으로 살짝 띄움 */}
                        <div className="absolute bottom-6 left-8 right-8 z-20">
                            <div className="px-2 py-2">
                                <div className="inline-block px-4 py-1.5 bg-bee-black/80 backdrop-blur-md rounded-full text-[10px] font-black tracking-widest text-bee-yellow uppercase mb-3 border border-bee-yellow/30">{t.pain.badge_with || 'With Beeliber 💅'}</div>
                                <h3 className="text-2xl md:text-3xl font-display font-black text-bee-yellow tracking-tighter leading-tight drop-shadow-md">{t.pain.quote_good || '"WALKING ON CLOUDS"'}</h3>
                            </div>
                        </div>
                    </motion.div>
                </div>

                <div className="mt-24 max-w-3xl mx-auto text-center">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.2 }}
                        className="text-xl md:text-3xl text-bee-black font-bold font-outfit leading-relaxed break-keep"
                    >
                        {t.pain.sub_copy.split('\n').map((line: string, index: number) => (
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
