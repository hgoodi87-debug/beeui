
import React from "react";
import { motion } from "framer-motion";
import { Instagram, Star } from "lucide-react";

interface LandingReviewsProps {
    t: any;
}

const LandingReviews: React.FC<LandingReviewsProps> = ({ t }) => {
    // 10~15개의 리뷰 목업 (기획안 기반)
    const reviews = [
        { name: "Sarah", location: "USA", text: t.reviews_section.review1, img: "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?auto=format&fit=crop&q=80&w=400" },
        { name: "Min-tae", location: "Korea", text: t.reviews_section.review2, img: "https://images.unsplash.com/photo-1501785888041-af3ef285b470?auto=format&fit=crop&q=80&w=400" },
        { name: "Lee J.", location: "Singapore", text: t.reviews_section.review3, img: "https://images.unsplash.com/photo-1527631746610-bca00a040d60?auto=format&fit=crop&q=80&w=400" },
        { name: "Yuki", location: "Japan", text: "Shopping in Myeongdong without bags was like a dream! ❤️", img: "https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?auto=format&fit=crop&q=80&w=400" },
        { name: "Chen", location: "China", text: "Same-day delivery service is super fast. Highly recommend Beeliber!", img: "https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&q=80&w=400" },
        { name: "Emma", location: "UK", text: "My first time in Seoul and didn't have to carry my suitcase. Perfect!", img: "https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?auto=format&fit=crop&q=80&w=400" },
        { name: "Hans", location: "Germany", text: "The security seal made me feel so safe about my bags. 10/10.", img: "https://images.unsplash.com/photo-1488085061387-422e29b40080?auto=format&fit=crop&q=80&w=400" },
        { name: "Sofia", location: "Italy", text: "GPS tracking worked perfectly. I could see my bag moving to my hotel.", img: "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&q=80&w=400" }
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
                    <h2 className="text-4xl md:text-7xl font-display font-black text-bee-black leading-tight tracking-tighter break-keep">
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
                                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-[2s]"
                            />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-500 flex flex-col justify-end p-6 md:p-10">
                                <div className="flex gap-1 mb-2">
                                    {[1, 2, 3, 4, 5].map(s => <Star key={s} className="w-3 h-3 text-bee-yellow fill-bee-yellow" />)}
                                </div>
                                <p className="text-xs md:text-sm text-white font-bold leading-relaxed mb-4 line-clamp-3 italic">"{review.text}"</p>
                                <div className="text-[10px] text-bee-yellow font-black tracking-widest uppercase">
                                    - {review.name}, {review.location}
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>

                {/* Proof Ticker */}
                <div className="mt-32 overflow-hidden flex whitespace-nowrap gap-12 opacity-20 hover:opacity-100 transition-opacity duration-1000">
                    {[1, 2].map(ticker => (
                        <div key={ticker} className="flex gap-12 font-display font-black text-3xl md:text-5xl tracking-tighter italic text-bee-black animate-infinite-scroll">
                            <span>15,000+ CUSTOMERS JOINED</span>
                            <span className="text-bee-yellow">★</span>
                            <span>CERTIFIED BY MONEYBOX</span>
                            <span className="text-bee-yellow">★</span>
                            <span>SAFE HANDLING GUARANTEED</span>
                            <span className="text-bee-yellow">★</span>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default LandingReviews;
