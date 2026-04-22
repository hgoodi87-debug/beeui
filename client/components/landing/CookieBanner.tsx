import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const STORAGE_KEY = 'beeliber_cookie_consent';

const LABELS: Record<string, {
    title: string;
    body: string;
    detail: string;
    accept: string;
    essential: string;
}> = {
    ko: {
        title: '이 웹사이트는 쿠키를 사용합니다',
        body: '당사는 Google Analytics, Meta Pixel 등의 쿠키를 사용하여 콘텐츠를 개인화하고 트래픽을 분석합니다. 수집된 정보는 소셜 미디어 및 광고 파트너와 공유될 수 있습니다.',
        detail: '자세히 보기',
        accept: '모두 허용',
        essential: '필수만 허용',
    },
    en: {
        title: 'This site uses cookies',
        body: 'We use cookies including GA4 and Meta Pixel to personalise content and analyse traffic. We may share data with advertising and analytics partners.',
        detail: 'Show details',
        accept: 'Allow all',
        essential: 'Essential only',
    },
    'zh-TW': {
        title: '本網站使用 Cookie',
        body: '我們使用 Google Analytics、Meta Pixel 等 Cookie 來個人化內容並分析流量，相關資料可能與廣告及分析合作夥伴共享。',
        detail: '顯示詳情',
        accept: '全部允許',
        essential: '僅必要',
    },
    zh: {
        title: '本网站使用 Cookie',
        body: '我们使用 Google Analytics、Meta Pixel 等 Cookie 来个性化内容并分析流量，相关数据可能与广告及分析合作伙伴共享。',
        detail: '显示详情',
        accept: '全部允许',
        essential: '仅必要',
    },
    ja: {
        title: 'このサイトはCookieを使用します',
        body: 'Google Analytics・Meta Pixelなどのクッキーでコンテンツをパーソナライズし、トラフィックを分析します。広告・分析パートナーとデータを共有する場合があります。',
        detail: '詳細を見る',
        accept: 'すべて許可',
        essential: '必須のみ',
    },
};

interface CookieBannerProps {
    lang: string;
}

const CookieBanner: React.FC<CookieBannerProps> = ({ lang }) => {
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        const consent = localStorage.getItem(STORAGE_KEY);
        if (!consent) setVisible(true);
    }, []);

    const label = LABELS[lang] ?? LABELS['en'];

    const grantAll = () => {
        localStorage.setItem(STORAGE_KEY, 'all');
        window.gtag?.('consent', 'update', {
            analytics_storage: 'granted',
            ad_storage: 'granted',
            ad_user_data: 'granted',
            ad_personalization: 'granted',
        });
        window.fbq?.('init', '2813327635677634');
        window.fbq?.('track', 'PageView');
        setVisible(false);
    };

    const essentialOnly = () => {
        localStorage.setItem(STORAGE_KEY, 'essential');
        setVisible(false);
    };

    return (
        <AnimatePresence>
            {visible && (
                <motion.div
                    initial={{ y: '100%', opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: '100%', opacity: 0 }}
                    transition={{ type: 'spring', damping: 32, stiffness: 260 }}
                    className="fixed bottom-0 left-0 right-0 z-[9999]"
                >
                    <div
                        className="rounded-t-2xl shadow-[0_-8px_40px_rgba(0,0,0,0.55)] px-4 md:px-8 py-4 md:py-5"
                        style={{ background: 'rgba(28,27,27,0.97)' }}
                    >
                        {/* ── 데스크톱: 3-column (mascot | text | buttons) ── */}
                        <div className="hidden md:flex items-center gap-6">

                            {/* Left: Beeboy mascot */}
                            <img
                                src="/images/bee-mascot-nobg.webp"
                                alt="beeboy"
                                className="w-16 h-16 object-contain shrink-0 drop-shadow-lg"
                            />

                            {/* Center: text */}
                            <div className="flex-1 min-w-0">
                                <p className="text-white font-bold text-[14px] leading-tight mb-1 font-display">
                                    {label.title}
                                </p>
                                <p className="text-white/60 text-[12px] leading-relaxed font-outfit">
                                    {label.body}
                                </p>
                                <a
                                    href="/privacy"
                                    className="text-white/40 text-[11px] hover:text-bee-yellow transition-colors mt-0.5 inline-block font-outfit"
                                >
                                    {label.detail} &rsaquo;
                                </a>
                            </div>

                            {/* Right: buttons stacked */}
                            <div className="flex flex-col gap-2 shrink-0 w-44">
                                <button
                                    onClick={grantAll}
                                    className="w-full h-10 rounded-full text-[13px] font-bold font-outfit transition-all active:scale-95 hover:brightness-110"
                                    style={{ background: '#FFC700', color: '#000' }}
                                >
                                    {label.accept}
                                </button>
                                <button
                                    onClick={essentialOnly}
                                    className="w-full h-10 rounded-full border border-white/30 text-white text-[13px] font-bold font-outfit hover:border-white/60 transition-all active:scale-95"
                                >
                                    {label.essential}
                                </button>
                            </div>
                        </div>

                        {/* ── 모바일: mascot + text 위, 버튼 아래 ── */}
                        <div className="flex md:hidden flex-col gap-3">
                            <div className="flex items-center gap-3">
                                <img
                                    src="/images/bee-mascot-nobg.webp"
                                    alt="beeboy"
                                    className="w-12 h-12 object-contain shrink-0 drop-shadow-md"
                                />
                                <div className="flex-1 min-w-0">
                                    <p className="text-white font-bold text-[13px] leading-tight mb-0.5 font-display">
                                        {label.title}
                                    </p>
                                    <p className="text-white/60 text-[11px] leading-snug font-outfit">
                                        {label.body}
                                    </p>
                                    <a
                                        href="/privacy"
                                        className="text-white/40 text-[10px] hover:text-bee-yellow transition-colors mt-0.5 inline-block font-outfit"
                                    >
                                        {label.detail} &rsaquo;
                                    </a>
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <button
                                    onClick={essentialOnly}
                                    className="flex-1 h-9 rounded-full border border-white/30 text-white text-[12px] font-bold font-outfit hover:border-white/60 transition-all active:scale-95"
                                >
                                    {label.essential}
                                </button>
                                <button
                                    onClick={grantAll}
                                    className="flex-1 h-9 rounded-full text-[12px] font-bold font-outfit transition-all active:scale-95 hover:brightness-110"
                                    style={{ background: '#FFC700', color: '#000' }}
                                >
                                    {label.accept}
                                </button>
                            </div>
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default CookieBanner;
