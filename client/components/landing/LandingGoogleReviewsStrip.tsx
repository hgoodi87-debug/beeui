
import React, { useEffect, useState, useRef } from "react";
import { Star } from "lucide-react";
import { isSupabaseDataEnabled, supabaseGet } from "../../services/supabaseClient";

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
    const [reviews, setReviews] = useState<GoogleReview[]>(cached.current?.reviews || []);
    const [summary, setSummary] = useState<ReviewSummary | null>(cached.current?.summary || null);

    useEffect(() => {
        if (!isSupabaseDataEnabled()) return;
        // 캐시 있으면 네트워크 스킵
        if (cached.current?.reviews?.length) return;

        // 네트워크 요청 (캐시 없을 때만)
        (async () => {
            try {
                const [revs, sums] = await Promise.all([
                    supabaseGet<GoogleReview[]>('google_reviews?select=id,author_name,author_photo_url,rating,text,relative_time&is_visible=eq.true&order=rating.desc&limit=10'),
                    supabaseGet<ReviewSummary[]>('google_review_summary?select=average_rating,total_reviews&limit=1'),
                ]);
                if (revs?.length) {
                    setReviews(revs);
                    const sum = sums?.[0] || null;
                    setSummary(sum);
                    setCachedData({ reviews: revs, summary: sum });
                }
            } catch (e) {
                console.warn("[GoogleReviewsStrip] fetch failed:", e);
            }
        })();
    }, []);

    if (reviews.length === 0) return null;

    const renderStars = (rating: number) => (
        <div className="flex gap-0.5">
            {[1, 2, 3, 4, 5].map(i => (
                <Star key={i} size={10} className={i <= rating ? "text-yellow-400 fill-yellow-400" : "text-gray-300"} />
            ))}
        </div>
    );

    const renderCard = (review: GoogleReview, key: string) => (
        <div key={key} className="w-[280px] md:w-[320px] shrink-0 bg-white rounded-2xl p-4 md:p-5 shadow-lg border border-gray-100">
            <div className="flex items-center gap-3 mb-2">
                {review.author_photo_url ? (
                    <img src={review.author_photo_url} alt="" className="w-8 h-8 rounded-full" loading="lazy" decoding="async" />
                ) : (
                    <div className="w-8 h-8 rounded-full bg-bee-yellow flex items-center justify-center text-xs font-bold text-black">
                        {(review.author_name || "U")[0]}
                    </div>
                )}
                <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold text-gray-900 truncate">{review.author_name}</p>
                    {renderStars(review.rating)}
                </div>
                <svg viewBox="0 0 24 24" className="w-4 h-4 shrink-0 opacity-40">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
            </div>
            {review.text && (
                <p className="text-xs text-gray-600 leading-relaxed line-clamp-3">{review.text}</p>
            )}
            {review.relative_time && (
                <p className="text-[10px] text-gray-400 mt-2">{review.relative_time}</p>
            )}
        </div>
    );

    return (
        <section className="py-6 md:py-10 bg-white overflow-hidden relative z-20">
            {summary && (
                <div className="flex items-center justify-center gap-3 mb-4 md:mb-6">
                    <svg viewBox="0 0 24 24" className="w-5 h-5">
                        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                    </svg>
                    <span className="text-sm font-bold text-gray-700">
                        Google Reviews {summary.average_rating}★ ({summary.total_reviews.toLocaleString()})
                    </span>
                </div>
            )}
            <div className="flex w-full">
                <div className="flex shrink-0 gap-4 md:gap-6 animate-marquee-slide will-change-transform" style={{ animationDuration: "40s" }}>
                    {reviews.map((r, i) => renderCard(r, `a-${i}`))}
                    {reviews.map((r, i) => renderCard(r, `b-${i}`))}
                </div>
            </div>
        </section>
    );
};

export default LandingGoogleReviewsStrip;
