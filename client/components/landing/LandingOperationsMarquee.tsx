import React from "react";
import { motion } from "framer-motion";

const LandingOperationsMarquee: React.FC<{ t: any }> = ({ t }) => {
    if (!t || !t.reviews_section) return null;
    // User provided operational review images with their respective quotes
    // Omitted op3.jpg (hero banner lookalike) per user request
    // 실제 운영 현장 사진 5장을 순환 배치 (외부 URL 의존성 제거)
    const opsImages = [
        "/images/operations/real_ops_01.jpg",
        "/images/operations/real_ops_02.jpg",
        "/images/operations/real_ops_03.jpg",
        "/images/operations/real_ops_04.jpg",
        "/images/operations/real_ops_05.jpg",
    ];
    const reviews = [
        { src: opsImages[0], text: t.reviews_section.review_1.text },
        { src: opsImages[1], text: t.reviews_section.review_2.text },
        { src: opsImages[2], text: t.reviews_section.review_3.text },
        { src: opsImages[3], text: t.reviews_section.review_4.text },
        { src: opsImages[4], text: t.reviews_section.review_5.text },
        { src: opsImages[0], text: t.reviews_section.review_6.text },
        { src: opsImages[1], text: t.reviews_section.review_7.text },
        { src: opsImages[2], text: t.reviews_section.review_8.text },
    ];

    // To prevent any gap/break on reasonable monitors, we render multiple sets.
    // Grouping them into two EXACTLY identical halves allows us to translate exactly -50% perfectly.
    const repeatingSets = [1]; // 1 set per half is efficient and enough for common screens.

    return (
        <section className="py-6 md:py-10 bg-white overflow-hidden border-b border-gray-100 relative z-20 -mt-12 md:-mt-20">
            <div className="flex w-full">
                <motion.div
                    className="flex shrink-0 w-max"
                    animate={{ x: ["0%", "-50%"] }}
                    transition={{ ease: "linear", duration: 60, repeat: Infinity }}
                >
                    {/* First Half */}
                    <div className="flex shrink-0">
                        {repeatingSets.map((setIdx) => (
                            <div key={`half1-set-${setIdx}`} className="flex shrink-0 gap-3 md:gap-5 pr-3 md:pr-5">
                                {reviews.map((review, idx) => (
                                    <div
                                        key={`half1-item-${setIdx}-${idx}`}
                                        className="w-[180px] h-[130px] md:w-[260px] md:h-[180px] rounded-2xl md:rounded-[2rem] overflow-hidden shrink-0 shadow-lg relative group"
                                    >
                                        <img
                                            src={review.src}
                                            alt="Beeliber Customer Success Stories"
                                            className="w-full h-full object-cover transition-all duration-500"
                                            loading="lazy"
                                        />
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent transition-all duration-500" />
                                        <div className="absolute bottom-0 inset-x-0 p-3 md:p-5">
                                            <p className="text-white text-[9px] md:text-[11px] font-medium leading-tight line-clamp-2 drop-shadow-md">
                                                "{review.text}"
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ))}
                    </div>

                    {/* Second Half (Exact Duplicate) */}
                    <div className="flex shrink-0">
                        {repeatingSets.map((setIdx) => (
                            <div key={`half2-set-${setIdx}`} className="flex shrink-0 gap-3 md:gap-5 pr-3 md:pr-5">
                                {reviews.map((review, idx) => (
                                    <div
                                        key={`half2-item-${setIdx}-${idx}`}
                                        className="w-[180px] h-[130px] md:w-[260px] md:h-[180px] rounded-2xl md:rounded-[2rem] overflow-hidden shrink-0 shadow-lg relative group"
                                    >
                                        <img
                                            src={review.src}
                                            alt="Beeliber Real Operations"
                                            className="w-full h-full object-cover transition-all duration-500"
                                            loading="lazy"
                                        />
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent transition-all duration-500" />
                                        <div className="absolute bottom-0 inset-x-0 p-3 md:p-5">
                                            <p className="text-white text-[9px] md:text-[11px] font-medium leading-tight line-clamp-2 drop-shadow-md">
                                                "{review.text}"
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ))}
                    </div>
                </motion.div>
            </div>
        </section>
    );
};

export default LandingOperationsMarquee;
