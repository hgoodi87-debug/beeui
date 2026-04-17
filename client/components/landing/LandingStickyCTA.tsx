/**
 * LandingStickyCTA — 스크롤 후 하단 고정 CTA 바
 * 히어로 섹션(100vh)을 지나면 나타나고, 예약 클릭 시 사라짐.
 * 전환율 개선 목적: 콘텐츠 보기 → 장바구니 담기 전환율 9% → 15% 목표
 */

import React, { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface LandingStickyCTAProps {
    t: {
        hero?: { cta_storage?: string; cta_delivery?: string };
        sticky_cta?: {
            storage_label?: string;
            delivery_label?: string;
            price_hint?: string;
            trust?: string;
        };
    };
    lang: string;
    onNavigate: (view: string) => void;
}

// 언어별 기본 텍스트
const STICKY_LABELS: Record<string, {
    storage: string;
    delivery: string;
    price_hint: string;
    trust: string;
}> = {
    ko:    { storage: '짐보관 예약', delivery: '공항 배송 예약', price_hint: '4시간 4,000원~', trust: '이미 3만+ 여행객이 선택' },
    en:    { storage: 'Book Storage', delivery: 'Book Delivery', price_hint: 'From ₩4,000/4h', trust: 'Trusted by 30,000+ travelers' },
    ja:    { storage: '荷物預かり予約', delivery: '空港配送予約', price_hint: '4時間₩4,000〜', trust: '3万人以上が利用中' },
    zh:    { storage: '预约行李寄存', delivery: '预约机场配送', price_hint: '4小时起₩4,000', trust: '已有3万+旅客选择' },
    'zh-tw': { storage: '預約行李寄放', delivery: '預約機場配送', price_hint: '4小時起₩4,000', trust: '已有3萬+旅客選擇' },
    'zh-hk': { storage: '預約行李寄存', delivery: '預約機場配送', price_hint: '4小時起₩4,000', trust: '已有3萬+旅客選擇' },
};

const LandingStickyCTA: React.FC<LandingStickyCTAProps> = ({ lang, onNavigate }) => {
    const [visible, setVisible] = useState(false);
    const [dismissed, setDismissed] = useState(false);

    const labels = STICKY_LABELS[lang?.toLowerCase()] ?? STICKY_LABELS['en'];

    const handleScroll = useCallback(() => {
        if (dismissed) return;
        setVisible(window.scrollY > window.innerHeight * 0.85);
    }, [dismissed]);

    useEffect(() => {
        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => window.removeEventListener('scroll', handleScroll);
    }, [handleScroll]);

    const handleClick = (view: string) => {
        setDismissed(true);
        setVisible(false);
        onNavigate(view);
    };

    return (
        <AnimatePresence>
            {visible && (
                <motion.div
                    key="sticky-cta"
                    initial={{ y: 100, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: 100, opacity: 0 }}
                    transition={{ type: 'spring', damping: 24, stiffness: 300 }}
                    className="fixed bottom-0 inset-x-0 z-[9999] safe-area-bottom"
                >
                    {/* 배경 블러 */}
                    <div className="bg-black/90 backdrop-blur-xl border-t border-white/10 px-4 py-2">
                        {/* 한 줄: 신뢰 지표 + 버튼 2개 + 닫기 */}
                        <div className="flex items-center gap-2 max-w-lg mx-auto">
                            {/* 신뢰 지표 (모바일에서 숨김) */}
                            <div className="hidden sm:flex items-center gap-1.5 flex-shrink-0">
                                <div className="flex -space-x-1">
                                    {['🇹🇼','🇯🇵','🇰🇷'].map((flag, i) => (
                                        <span key={i} className="text-xs leading-none">{flag}</span>
                                    ))}
                                </div>
                                <span className="text-[#F5C842] text-[10px] font-black">★★★★★</span>
                            </div>

                            {/* 버튼 2개 */}
                            <div className="flex gap-2 flex-1">
                                <button
                                    onClick={() => handleClick('LOCATIONS_STORE')}
                                    className="flex-1 bg-[#F5C842] text-[#111] font-black py-2 rounded-xl text-[12px] uppercase tracking-wide transition-all active:scale-[0.97] shadow-md shadow-[#F5C842]/20 flex items-center justify-center gap-1.5"
                                >
                                    <span>{labels.storage}</span>
                                    <span className="text-[10px] font-bold text-[#111]/50 normal-case tracking-normal">{labels.price_hint}</span>
                                </button>
                                <button
                                    onClick={() => handleClick('LOCATIONS_DELIVER')}
                                    className="flex-1 bg-white/10 text-white font-black py-2 rounded-xl text-[12px] uppercase tracking-wide transition-all active:scale-[0.97] border border-white/20 flex items-center justify-center gap-1.5"
                                >
                                    <span>{labels.delivery}</span>
                                    <span className="text-[10px] font-bold text-white/40 normal-case tracking-normal">₩10,000~</span>
                                </button>
                            </div>

                            {/* 닫기 */}
                            <button
                                onClick={() => setDismissed(true)}
                                className="flex-shrink-0 text-white/30 hover:text-white/60 transition-colors p-1"
                                aria-label="close"
                            >
                                <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                                    <path d="M12 4L4 12M4 4l8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                                </svg>
                            </button>
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default LandingStickyCTA;
