
import React, { useEffect, useState, useRef } from "react";
import { Star } from "lucide-react";
import { supabaseGet } from "../../services/supabaseClient";

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
}

// 메모리 + sessionStorage 캐시 (페이지 새로고침까지 유지)
const CACHE_KEY = 'beeliber_google_reviews_cache';
const CACHE_TTL = 10 * 60 * 1000; // 10분

function getCachedData(): { reviews: GoogleReview[]; summary: ReviewSummary | null } | null {
    try {
        const raw = sessionStorage.getItem(CACHE_KEY);
        if (!raw) return null;
        const cached = JSON.parse(raw);
        if (Date.now() - cached.ts > CACHE_TTL) return null;
        return cached.data;
    } catch { return null; }
}

function setCachedData(data: { reviews: GoogleReview[]; summary: ReviewSummary | null }) {
    try {
        sessionStorage.setItem(CACHE_KEY, JSON.stringify({ data, ts: Date.now() }));
    } catch { /* quota exceeded 무시 */ }
}

const LandingGoogleReviewsStrip: React.FC = () => {
    const cached = useRef(getCachedData());
    const [reviews, setReviews] = useState<GoogleReview[]>(cached.current?.reviews || [
        { id: 'm1', author_name: 'Sarah', rating: 5, text: 'The delivery service was a lifesaver for my visit to DDP! ✨', relative_time: '1 week ago' },
        { id: 'm2', author_name: 'Yuki', rating: 5, text: 'So easy to drop off my bags at Hongdae and pick them up at ICN. 🌸', relative_time: '2 days ago' },
        { id: 'm3', author_name: 'Emma', rating: 5, text: 'Walking through Bukchon without bags was the highlight of my trip! 🏠', relative_time: '3 days ago' }
    ]);
    const [summary, setSummary] = useState<ReviewSummary | null>(cached.current?.summary || {
        average_rating: 4.9,
        total_reviews: 1240
    });

    useEffect(() => {
        (async () => {
            try {
                const [revs, sums] = await Promise.all([
                    supabaseGet<GoogleReview[]>('google_reviews?select=id,author_name,author_photo_url,rating,text,relative_time&is_visible=eq.true&order=rating.desc&limit=10'),
                    supabaseGet<ReviewSummary[]>('google_review_summary?select=average_rating,total_reviews&limit=1'),
                ]);
                if (revs?.length) {
                    setReviews(revs);
                    const sum = sums?.[0] || null;
                    if (sum) setSummary(sum);
                    setCachedData({ reviews: revs, summary: sum });
                }
            } catch (e) {
                console.warn("[GoogleReviewsStrip] fetch failed, using fallback:", e);
            }
        })();
    }, []);

    const renderStars = (rating: number) => (
        <div className="flex gap-0.5">
            {[1, 2, 3, 4, 5].map(i => (
                <Star key={i} size={10} className={i <= rating ? "text-yellow-400 fill-yellow-400" : "text-gray-600"} />
            ))}
        </div>
    );

    const renderPlaceholderCard = (index: number) => (
        <div
            key={`placeholder-${index}`}
            className="w-[220px] sm:w-[250px] md:w-[280px] shrink-0 bg-white/5 border border-white/10 rounded-2xl p-3 md:p-4 backdrop-blur-xl"
        >
            <div className="flex items-center gap-3 mb-3">
                <div className="w-8 h-8 rounded-full bg-white/10 animate-pulse" />
                <div className="min-w-0 flex-1 space-y-2">
                    <div className="h-2 w-20 rounded-full bg-white/10 animate-pulse" />
                    <div className="h-2 w-12 rounded-full bg-white/10 animate-pulse" />
                </div>
            </div>
            <div className="space-y-2">
                <div className="h-2.5 rounded-full bg-white/10 animate-pulse" />
                <div className="h-2.5 w-5/6 rounded-full bg-white/10 animate-pulse" />
            </div>
        </div>
    );

    const renderCard = (review: GoogleReview, i: number) => {
        return (
            <div key={`${review.id}-${i}`} className="w-[220px] sm:w-[250px] md:w-[280px] shrink-0 bg-white/5 border border-white/10 rounded-2xl p-3 md:p-4 backdrop-blur-xl group hover:border-bee-yellow/50 transition-all duration-500">
                <div className="flex items-center gap-2 mb-2">
                    <div className="w-7 h-7 rounded-full bg-bee-yellow/20 flex items-center justify-center text-[10px] font-black text-bee-yellow border border-bee-yellow/30 shadow-sm">
                        {(review.author_name || "U")[0]}
                    </div>
                    <div className="min-w-0 flex-1">
                        <p className="text-xs font-bold text-white/90 truncate">{review.author_name}</p>
                        {renderStars(review.rating)}
                    </div>
                    <svg viewBox="0 0 24 24" className="w-3 h-3 shrink-0 opacity-40 grayscale brightness-200">
                        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                    </svg>
                </div>
                {review.text && (
                    <p className="text-[11px] md:text-[12px] text-white/70 leading-relaxed line-clamp-2 font-medium">
                        "{review.text}"
                    </p>
                )}
                {review.relative_time && (
                    <p className="text-[9px] font-bold text-white/20 mt-2 uppercase tracking-tighter">{review.relative_time}</p>
                )}
            </div>
        );
    };

    return (
        <section className="py-3 md:py-4 bg-transparent overflow-hidden relative z-20">
            {summary && (
                <div className="flex items-center justify-center gap-3 mb-4 md:mb-6">
                    <span className="text-[11px] font-black text-white/40 tracking-[0.25em] uppercase">
                        Verified Google Feedback
                    </span>
                    <div className="w-1 h-1 bg-bee-yellow rounded-full" />
                    <span className="text-[10px] font-bold text-bee-yellow">
                        {summary.average_rating}★ / {summary.total_reviews.toLocaleString()} People Experienced
                    </span>
                </div>
            )}
            <div className="flex w-full">
                <div className="flex shrink-0 gap-4 md:gap-6 animate-marquee-slide will-change-transform" style={{ animationDuration: "40s" }}>
                    {reviews.length > 0
                        ? (
                            <>
                                {reviews.map((r, i) => renderCard(r, i))}
                                {reviews.map((r, i) => renderCard(r, reviews.length + i))}
                            </>
                        )
                        : (
                            <>
                                {[0, 1, 2].map(renderPlaceholderCard)}
                                {[3, 4, 5].map(renderPlaceholderCard)}
                            </>
                        )}
                </div>
            </div>
        </section>

    );
};

export default LandingGoogleReviewsStrip;
