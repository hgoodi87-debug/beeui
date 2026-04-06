
import React from "react";

const LandingOperationsMarquee: React.FC<{ t: any }> = ({ t }) => {
    if (!t || !t.reviews_section) return null;

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

    const renderCard = (review: { src: string; text: string }, key: string) => (
        <div
            key={key}
            className="w-[200px] h-[150px] md:w-[280px] md:h-[200px] rounded-2xl md:rounded-[2.5rem] overflow-hidden shrink-0 shadow-2xl relative group"
        >
            <img
                src={review.src}
                alt="Beeliber Customer Review"
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                loading="lazy"
                decoding="async"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/35 to-transparent pointer-events-none" />
            <div className="absolute bottom-0 inset-x-0 p-4 md:p-6">
                <p className="text-white text-[10px] md:text-[13px] font-bold leading-snug drop-shadow-lg break-keep line-clamp-3">
                    "{review.text}"
                </p>
            </div>
        </div>
    );

    return (
        <section className="pt-0 pb-8 md:pb-14 bg-transparent overflow-hidden border-b border-gray-100 relative z-20 -mt-16 md:-mt-24">
            <div className="flex w-full">
                <div
                    className="flex shrink-0 gap-4 md:gap-6 animate-marquee-slide will-change-transform"
                    style={{ animationDuration: "60s" }}
                >
                    {reviews.map((r, i) => renderCard(r, `a-${i}`))}
                    {reviews.map((r, i) => renderCard(r, `b-${i}`))}
                </div>
            </div>
        </section>
    );
};

export default LandingOperationsMarquee;
