
import React from "react";
import { motion } from "framer-motion";
import { Instagram, Star } from "lucide-react";

interface LandingReviewsProps {
    t: any;
}

const LandingReviews: React.FC<LandingReviewsProps> = ({ t }) => {
    // 10~15개의 리뷰 목업 (기획안 기반)
    const reviews = [
        { name: t.reviews_section.review_1.name, location: t.reviews_section.review_1.location, text: t.reviews_section.review_1.text, img: "https://firebasestorage.googleapis.com/v0/b/beeliber-main.firebasestorage.app/o/%EB%9E%9C%EB%94%A9%2Fddp.jpeg?alt=media&token=80e940bf-f6c6-4ec2-a356-18d3fec33cea" },
        { name: t.reviews_section.review_2.name, location: t.reviews_section.review_2.location, text: t.reviews_section.review_2.text, img: "https://firebasestorage.googleapis.com/v0/b/beeliber-main.firebasestorage.app/o/%EB%9E%9C%EB%94%A9%2F%E1%84%80%E1%85%A7%E1%86%BC%E1%84%87%E1%85%A9%E1%86%BC%E1%84%80%E1%85%A5%E1%86%BC.jpeg?alt=media&token=83543c35-1a2b-478f-9918-6502e0802ccb" },
        { name: t.reviews_section.review_3.name, location: t.reviews_section.review_3.location, text: t.reviews_section.review_3.text, img: "https://firebasestorage.googleapis.com/v0/b/beeliber-main.firebasestorage.app/o/%EB%9E%9C%EB%94%A9%2F%E1%84%82%E1%85%A1%E1%86%B7%E1%84%89%E1%85%A1%E1%86%AB.jpeg?alt=media&token=ea864bd8-3fbb-4e8f-a28d-30380cd8f329" },
        { name: t.reviews_section.review_4.name, location: t.reviews_section.review_4.location, text: t.reviews_section.review_4.text, img: "https://firebasestorage.googleapis.com/v0/b/beeliber-main.firebasestorage.app/o/%EB%9E%9C%EB%94%A9%2F%E1%84%87%E1%85%AE%E1%86%A8%E1%84%8E%E1%85%A9%E1%86%AB%E1%84%92%E1%85%A1%E1%86%AB%E1%84%8B%E1%85%A9%E1%86%A8.jpeg?alt=media&token=d532a9b0-7873-47d7-8649-63b526054276" },
        { name: t.reviews_section.review_5.name, location: t.reviews_section.review_5.location, text: t.reviews_section.review_5.text, img: "https://firebasestorage.googleapis.com/v0/b/beeliber-main.firebasestorage.app/o/%EB%9E%9C%EB%94%A9%2F%E1%84%89%E1%85%A5%E1%86%BC%E1%84%89%E1%85%AE.jpeg?alt=media&token=090a577b-05c1-4006-8e0b-d912fe85845c" },
        { name: t.reviews_section.review_6.name, location: t.reviews_section.review_6.location, text: t.reviews_section.review_6.text, img: "https://firebasestorage.googleapis.com/v0/b/beeliber-main.firebasestorage.app/o/%EB%9E%9C%EB%94%A9%2F%E1%84%80%E1%85%AA%E1%86%BC%E1%84%92%E1%85%AA%E1%86%86%E1%84%86%E1%85%AE%E1%86%AB.jpeg?alt=media&token=a5351946-4ffe-4735-b0fd-942d5f1da530" },
        { name: t.reviews_section.review_7.name, location: t.reviews_section.review_7.location, text: t.reviews_section.review_7.text, img: "https://firebasestorage.googleapis.com/v0/b/beeliber-main.firebasestorage.app/o/%EB%9E%9C%EB%94%A9%2F%E1%84%8B%E1%85%B5%E1%86%A8%E1%84%89%E1%85%A5%E1%86%AB%E1%84%83%E1%85%A9%E1%86%BC1.jpeg?alt=media&token=21aacaa3-210b-4638-b33b-2f171f737908" },
        { name: t.reviews_section.review_8.name, location: t.reviews_section.review_8.location, text: t.reviews_section.review_8.text, img: "https://firebasestorage.googleapis.com/v0/b/beeliber-main.firebasestorage.app/o/%EB%9E%9C%EB%94%A9%2F%E1%84%92%E1%85%A1%E1%86%AB%E1%84%80%E1%85%A1%E1%86%BC%E1%84%80%E1%85%A9%E1%86%BC%E1%84%8B%E1%85%AF%E1%86%AB.jpeg?alt=media&token=ba196c34-32cb-4c77-8589-d4e1fad3a7d4" }
    ];

    return (
        <section className="py-32 md:py-64 bg-bee-light/10 overflow-hidden relative">
            <div className="max-w-7xl mx-auto px-6 relative z-10">
                <div className="text-center mb-24 md:mb-40">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        className="inline-flex items-center gap-3 px-6 py-3 bg-white border border-bee-black/5 rounded-full mb-10 shadow-xl"
                    >
                        <Instagram className="w-5 h-5 text-pink-500" />
                        <span className="text-[10px] font-black uppercase tracking-[0.4em] text-bee-black/40 font-outfit">#beeliber_seoul</span>
                    </motion.div>
                    <h2 className="text-3xl md:text-6xl font-display font-black text-bee-black leading-tight tracking-tighter break-keep px-4">
                        {t.reviews_section.headline}
                    </h2>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8">
                    {reviews.map((review, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, scale: 0.8 }}
                            whileInView={{ opacity: 1, scale: 1 }}
                            viewport={{ once: true }}
                            transition={{ delay: (i % 4) * 0.1, duration: 0.8 }}
                            className="group relative aspect-square rounded-3xl md:rounded-[2.5rem] overflow-hidden shadow-xl"
                        >
                            <img
                                src={review.img}
                                alt={review.name}
                                loading="lazy"
                                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-[2s]"
                            />
                            <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-100 transition-opacity duration-500 flex flex-col justify-end p-6 md:p-10">
                                    <div className="flex items-center gap-3 mb-4">
                                        <div className="w-10 h-10 rounded-full bg-yellow-400 flex items-center justify-center font-bold text-black border border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                                            {(review.name || "U")[0]}
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-black">{review.name || "Beeliber User"}</h4>
                                            <p className="text-xs text-black/60">{review.location || "Global Travel"}</p>
                                        </div>
                                    </div>
                                    <p className="text-black leading-relaxed italic">
                                        "{review.text}"
                                    </p>
                            </div>
                        </motion.div>
                    ))}
                </div>

                {/* Proof Ticker */}
                <div className="mt-24 md:mt-32 overflow-hidden flex whitespace-nowrap gap-12 opacity-20 hover:opacity-100 transition-opacity duration-1000 border-y border-bee-black/5 py-8">
                    <div className="flex gap-16 animate-infinite-scroll w-max">
                        {[1, 2, 3, 4].map(ticker => (
                            <div key={ticker} className="flex gap-16 items-center font-display font-black text-xl md:text-5xl tracking-tighter italic text-bee-black uppercase">
                                <span>15,000+ CUSTOMERS JOINED</span>
                                <span className="text-bee-yellow text-2xl">★</span>
                                <span>CERTIFIED BY MONEYBOX</span>
                                <span className="text-bee-yellow text-2xl">★</span>
                                <span>SAFE HANDLING GUARANTEED</span>
                                <span className="text-bee-yellow text-2xl">★</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
};

export default LandingReviews;
