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
        <section className="py-8 md:py-14 bg-white overflow-hidden border-b border-gray-100 relative z-20 -mt-6 md:-mt-10">
            <div className="flex w-full">
                <motion.div
                    className="flex shrink-0 w-max"
                    animate={{ x: ["0%", "-50%"] }}
                    transition={{ ease: "linear", duration: 70, repeat: Infinity }}
                >
                    {/* First Half */}
                    <div className="flex shrink-0">
                        {repeatingSets.map((setIdx) => (
                            <div key={`half1-set-${setIdx}`} className="flex shrink-0 gap-4 md:gap-6 pr-4 md:pr-6">
                                {reviews.map((review, idx) => (
                                    <div
                                        key={`half1-item-${setIdx}-${idx}`}
                                        className="w-[200px] h-[150px] md:w-[280px] md:h-[200px] rounded-2xl md:rounded-[2.5rem] overflow-hidden shrink-0 shadow-2xl relative group"
                                    >
                                        <img
                                            src={review.src}
                                            alt="Beeliber Customer Success Stories"
                                            className="w-full h-full object-cover transition-all duration-700 group-hover:scale-110"
                                            loading="lazy"
                                        />
                                        {/* Deeper gradient for better text legibility */}
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent opacity-80 transition-all duration-500" />
                                        <div className="absolute bottom-0 inset-x-0 p-4 md:p-6">
                                            <p className="text-white text-[10px] md:text-[13px] font-bold leading-snug drop-shadow-lg break-keep line-clamp-3">
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
                            <div key={`half2-set-${setIdx}`} className="flex shrink-0 gap-4 md:gap-6 pr-4 md:pr-6">
                                {reviews.map((review, idx) => (
                                    <div
                                        key={`half2-item-${setIdx}-${idx}`}
                                        className="w-[200px] h-[150px] md:w-[280px] md:h-[200px] rounded-2xl md:rounded-[2.5rem] overflow-hidden shrink-0 shadow-2xl relative group"
                                    >
                                        <img
                                            src={review.src}
                                            alt="Beeliber Real Operations"
                                            className="w-full h-full object-cover transition-all duration-700 group-hover:scale-110"
                                            loading="lazy"
                                        />
                                        {/* Deeper gradient for better text legibility */}
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent opacity-80 transition-all duration-500" />
                                        <div className="absolute bottom-0 inset-x-0 p-4 md:p-6">
                                            <p className="text-white text-[10px] md:text-[13px] font-bold leading-snug drop-shadow-lg break-keep line-clamp-3">
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
