
import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Star, MapPin } from "lucide-react";
import { isSupabaseDataEnabled, supabaseGet } from "../../services/supabaseClient";

interface LandingReviewsProps {
    t: any;
}

interface GoogleReview {
    id: string;
    author_name: string;
    author_photo_url?: string;
    rating: number;
    text: string;
    relative_time?: string;
}

interface ReviewSummary {
    average_rating: number;
    total_reviews: number;
    place_name: string;
}

const LandingReviews: React.FC<LandingReviewsProps> = ({ t }) => {
    const [googleReviews, setGoogleReviews] = useState<GoogleReview[]>([]);
    const [summary, setSummary] = useState<ReviewSummary | null>(null);

    // Google 리뷰 로드 — sessionStorage 캐시 우선, 없으면 네트워크
    useEffect(() => {
        if (!isSupabaseDataEnabled()) return;
        // Strip 컴포넌트가 이미 캐시했으면 재사용
        try {
            const raw = sessionStorage.getItem('beeliber_google_reviews_cache');
            if (raw) {
                const cached = JSON.parse(raw);
                if (Date.now() - cached.ts < 10 * 60 * 1000 && cached.data?.reviews?.length) {
                    setGoogleReviews(cached.data.reviews);
                    if (cached.data.summary) setSummary(cached.data.summary);
                    return;
                }
            }
        } catch { /* ignore */ }
        // 캐시 없으면 네트워크
        (async () => {
            try {
                const [reviews, summaries] = await Promise.all([
                    supabaseGet<GoogleReview[]>('google_reviews?select=id,author_name,author_photo_url,rating,text,relative_time&is_visible=eq.true&order=rating.desc&limit=8'),
                    supabaseGet<ReviewSummary[]>('google_review_summary?select=average_rating,total_reviews&limit=1'),
                ]);
                if (reviews?.length) setGoogleReviews(reviews);
                if (summaries?.[0]) setSummary(summaries[0]);
            } catch (e) {
                console.warn("[LandingReviews] Google reviews fetch failed:", e);
            }
        })();
    }, []);

    // 목업 폴백 (Google 리뷰가 없으면 기존 데이터 사용)
    const fallbackReviews = [
        { name: t.reviews_section.review_1.name, location: t.reviews_section.review_1.location, text: t.reviews_section.review_1.text, img: "/images/reviews/sarah_ddp.png", rating: 5 },
        { name: t.reviews_section.review_2.name, location: t.reviews_section.review_2.location, text: t.reviews_section.review_2.text, img: "/images/reviews/yuki_gyeongbok.png", rating: 5 },
        { name: t.reviews_section.review_3.name, location: t.reviews_section.review_3.location, text: t.reviews_section.review_3.text, img: "/images/reviews/emma_namsan.png", rating: 5 },
        { name: t.reviews_section.review_4.name, location: t.reviews_section.review_4.location, text: t.reviews_section.review_4.text, img: "/images/reviews/real_op_1.jpg", rating: 4 },
        { name: t.reviews_section.review_5.name, location: t.reviews_section.review_5.location, text: t.reviews_section.review_5.text, img: "/images/reviews/real_op_2.jpg", rating: 5 },
        { name: t.reviews_section.review_6.name, location: t.reviews_section.review_6.location, text: t.reviews_section.review_6.text, img: "/images/reviews/real_op_3.jpg", rating: 4 },
        { name: t.reviews_section.review_7.name, location: t.reviews_section.review_7.location, text: t.reviews_section.review_7.text, img: "/images/reviews/real_op_4.jpg", rating: 5 },
        { name: t.reviews_section.review_8.name, location: t.reviews_section.review_8.location, text: t.reviews_section.review_8.text, img: "/images/reviews/real_op_5.jpg", rating: 4 },
    ];

    const useGoogleReviews = googleReviews.length > 0;
    const displayReviews = useGoogleReviews
        ? googleReviews.map(gr => ({
            name: gr.author_name,
            location: gr.relative_time || 'Google Review',
            text: gr.text,
            img: gr.author_photo_url || '',
            rating: gr.rating,
        }))
        : fallbackReviews;

    const renderStars = (rating: number) => (
        <div className="flex gap-0.5">
            {[1, 2, 3, 4, 5].map(i => (
                <Star key={i} size={12} className={i <= rating ? "text-yellow-400 fill-yellow-400" : "text-white/30"} />
            ))}
        </div>
    );

    return (
        <section className="py-16 md:py-24 bg-bee-light/10 overflow-hidden relative">
            <div className="max-w-7xl mx-auto px-6 relative z-10">
                <div className="text-center mb-12 md:mb-20">
                    {/* Google 리뷰 배지 */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        className="inline-flex items-center gap-3 px-6 py-3 bg-white border border-bee-black/5 rounded-full mb-10 shadow-xl"
                    >
                        <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none">
                            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                        </svg>
                        {summary ? (
                            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-bee-black/60">
                                {t.reviews_section.verified_google} · {summary.average_rating}★ · {summary.total_reviews.toLocaleString()} {t.reviews_section.reviews_count}
                            </span>
                        ) : (
                            <span className="text-[10px] font-black uppercase tracking-[0.4em] text-bee-black/40 font-outfit">#beeliber_seoul</span>
                        )}
                    </motion.div>
                    <h2 className="text-3xl md:text-6xl font-display font-black text-bee-black leading-tight tracking-tighter break-keep px-4 whitespace-pre-line">
                        {t.reviews_section.headline}
                    </h2>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8">
                    {displayReviews.map((review, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, scale: 0.8 }}
                            whileInView={{ opacity: 1, scale: 1 }}
                            viewport={{ once: true }}
                            transition={{ delay: (i % 4) * 0.1, duration: 0.8 }}
                            className="group relative aspect-square rounded-3xl md:rounded-[2.5rem] overflow-hidden shadow-xl"
                        >
                            {review.img ? (
                                <img
                                    src={review.img}
                                    alt={`${review.name || "빌리버 사용자"}의 서울 짐보관 여행 서비스 이용 후기`}
                                    loading="lazy"
                                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-[2s]"
                                    onError={(e) => { e.currentTarget.src = "/images/operations/real_ops_01.jpg"; }}
                                />
                            ) : (
                                <div className="w-full h-full bg-gradient-to-br from-bee-yellow/20 to-bee-black/5 flex items-center justify-center">
                                    <MapPin className="w-12 h-12 text-bee-yellow/40" />
                                </div>
                            )}
                            {/* 하단 그라데이션 + 리뷰 */}
                            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent pt-16 md:pt-24 p-4 md:p-6 flex flex-col justify-end">
                                <div className="flex items-center gap-2 md:gap-3 mb-1.5 md:mb-2">
                                    <div className="w-7 h-7 md:w-9 md:h-9 rounded-full bg-yellow-400 flex items-center justify-center font-bold text-black text-xs md:text-sm border border-black/20 shadow-sm flex-shrink-0">
                                        {(review.name || "U")[0]}
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <div className="flex items-center gap-2">
                                            <h4 className="font-bold text-white text-xs md:text-sm truncate">{review.name || "Beeliber User"}</h4>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            {renderStars(review.rating || 5)}
                                            <p className="text-[10px] text-white/50 truncate">{review.location || "Google"}</p>
                                        </div>
                                    </div>
                                </div>
                                <p className="text-white/90 text-[11px] md:text-sm leading-snug line-clamp-2 md:line-clamp-3 italic">
                                    "{review.text}"
                                </p>
                            </div>
                        </motion.div>
                    ))}
                </div>

                {/* Proof Ticker */}
                <div className="mt-12 md:mt-16 overflow-hidden flex whitespace-nowrap gap-12 opacity-20 hover:opacity-100 transition-opacity duration-1000 border-y border-bee-black/5 py-8">
                    <div className="flex gap-16 animate-infinite-scroll w-max">
                        {[1, 2, 3, 4].map(ticker => (
                            <div key={ticker} className="flex gap-16 items-center font-display font-black text-xl md:text-5xl tracking-tighter italic text-bee-black uppercase">
                                <span>{summary ? `${summary.total_reviews.toLocaleString()}+ REVIEWS` : '15,000+ CUSTOMERS JOINED'}</span>
                                <span className="text-bee-yellow text-2xl">★</span>
                                <span>{summary ? `${summary.average_rating}★ GOOGLE RATING` : 'CERTIFIED BY MONEYBOX'}</span>
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
