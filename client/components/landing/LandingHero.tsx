
import React, { useEffect, useState } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { ArrowRight, MapPin, ShieldCheck } from "lucide-react";
import { Branch } from "../../types";
import LandingGoogleReviewsStrip from "./LandingGoogleReviewsStrip";
import { fetchExchangeRate, getCachedRate, krwToUsd } from "../../services/paypalService";

const ORIGINAL_HERO_IMAGE_URL = "https://firebasestorage.googleapis.com/v0/b/beeliber-main.firebasestorage.app/o/vc%2F1_background_cinematic_2k_202602230049.jpeg?alt=media&token=66532fb7-1f97-417f-8b7d-062e1f3a1b2b";

interface LandingHeroProps {
    t: any;
    lang: string;
    onNavigate: (view: any) => void;
    onTrackClick: () => void;
    branchCode?: string;
    branchData?: Branch;
}

const LandingHero: React.FC<LandingHeroProps> = ({ t, lang, onNavigate, onTrackClick, branchCode, branchData }) => {
    const [rate, setRate] = useState<number>(getCachedRate());
    useEffect(() => { fetchExchangeRate().then(setRate); }, []);

    const isKo = lang === 'ko';
    const rawSubtitle: string = t.hero?.subtitle ?? '';
    const subtitle = isKo
        ? rawSubtitle
        : rawSubtitle.replace(/₩([\d,]+)/g, (_, num) => `USD $${krwToUsd(Number(num.replace(/,/g, '')), rate)}`);

    const { scrollY } = useScroll();

    // Parallax effects for typography
    const y1 = useTransform(scrollY, [0, 520], [0, -80]);
    const opacity = useTransform(scrollY, [0, 360], [1, 0.08]);

    return (
        <section className="relative min-h-[100svh] overflow-hidden bg-[#080808] text-white flex flex-col justify-center" style={{ paddingTop: 'env(safe-area-inset-top)', paddingBottom: 'env(safe-area-inset-bottom)' }}>

            {/* 1. LAYER: Cinematic Background */}
            <div className="absolute inset-0 z-0 overflow-hidden bg-black">
                <img
                    src={ORIGINAL_HERO_IMAGE_URL}
                    alt="빌리버 비전 배경"
                    className="absolute inset-0 h-full w-full object-cover object-center opacity-55 brightness-[0.58] scale-105"
                    loading="eager"
                    fetchPriority="high"
                />
                <div className="absolute inset-0 z-[1] bg-[radial-gradient(circle_at_50%_12%,rgba(255,199,0,0.22),transparent_28%),linear-gradient(180deg,rgba(0,0,0,0.82)_0%,rgba(0,0,0,0.35)_42%,#080808_100%)] pointer-events-none" />
            </div>

            {/* 2. LAYER: Content — vertically centered, inline CTA below */}
            <div className="relative z-10 mx-auto w-full max-w-[1200px] px-5 pt-16 pb-4 sm:px-7 md:pt-20 md:pb-36 flex flex-col items-center text-center">
                <motion.div
                    style={{ y: y1, opacity }}
                    className="w-full max-w-[820px]"
                >
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mb-7 flex flex-wrap items-center justify-center gap-3 md:mb-10"
                    >
                        {branchData && (
                            <div className="px-4 py-2 rounded-full bg-bee-yellow text-bee-black shadow-2xl shadow-bee-yellow/20 flex items-center gap-2">
                                <MapPin size={14} className="animate-pulse" />
                                <span className="text-[11px] font-black tracking-widest uppercase">
                                    {branchData.name} {branchData.ownerName ? `| ${branchData.ownerName}` : ''}
                                </span>
                            </div>
                        )}
                        <span className="inline-flex items-center rounded-full border border-white/15 bg-white/10 px-4 py-2 text-[10px] font-black uppercase tracking-[0.28em] text-white/85 backdrop-blur-md">
                            {t.hero.badge || "Verified Luggage Care"}
                        </span>
                    </motion.div>

                    <h1 className={`w-full text-center font-bold leading-[1.1] tracking-[0.02em] text-white drop-shadow-2xl break-keep ${isKo ? 'text-[2.4rem] md:text-[clamp(3.5rem,8vw,6rem)] lg:text-[88px]' : 'text-[1.9rem] md:text-[clamp(2.5rem,6vw,4.5rem)] lg:text-[64px]'}`}>
                        {t.hero?.main_title_1 || '서울·부산 짐 보관'}
                        <br />
                        {t.hero?.main_title_2 || '인천공항 당일 배송'}
                    </h1>

                    <p className="mt-5 text-center mx-auto text-sm md:text-xl font-semibold leading-relaxed text-white/78 md:mt-8 no-underline whitespace-normal md:whitespace-nowrap" style={{ textDecoration: 'none', WebkitTextDecorationLine: 'none' }}>
                        {isKo ? '명동·홍대·강남 어디서나 맡기고 공항에서 바로 찾으세요.' : subtitle.split('\n').map((line, i) => (
                            <React.Fragment key={i}>{i > 0 && <br />}{line}</React.Fragment>
                        ))}
                    </p>

                    {/* CTA Buttons */}
                    <motion.div
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        className="mt-6 flex flex-col gap-3 sm:flex-row sm:gap-[14px] sm:max-w-[680px] mx-auto justify-center md:mt-10"
                    >
                        <motion.button
                            whileHover={{ scale: 1.03, backgroundColor: "#fff", color: "#000" }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => onNavigate('LOCATIONS_STORE')}
                            className="flex h-14 w-full sm:flex-1 items-center justify-center gap-2 rounded-full bg-bee-yellow px-6 text-sm font-black uppercase tracking-[0.08em] text-bee-black shadow-2xl shadow-bee-yellow/25 transition-all md:h-16 md:text-base"
                        >
                            {isKo ? '가까운 보관소 찾기' : (t.hero.cta_storage || "Store luggage")}
                            <ArrowRight size={16} />
                        </motion.button>
                        <motion.button
                            whileHover={{ scale: 1.03, backgroundColor: "#fff", color: "#000" }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => onNavigate('LOCATIONS_DELIVER')}
                            className="flex h-14 w-full sm:flex-1 items-center justify-center gap-2 rounded-full border border-white/60 bg-transparent px-6 text-sm font-black uppercase tracking-[0.08em] text-white shadow-2xl transition-all hover:border-white hover:bg-white/10 md:h-16 md:text-base"
                        >
                            {isKo ? '공항 배송 예약' : (t.hero.cta_delivery || "Airport delivery")}
                            <ArrowRight size={16} />
                        </motion.button>
                    </motion.div>
                </motion.div>

                {/* Mobile: 버튼 바로 아래 리뷰 스트립 */}
                <div className="w-screen -mx-5 mt-4 md:hidden">
                    <div className="bg-gradient-to-t from-black/60 to-transparent pt-2">
                        <LandingGoogleReviewsStrip />
                    </div>
                </div>
            </div>

            {/* Desktop: 하단 고정 */}
            <div className="hidden md:block absolute bottom-0 left-0 right-0 z-50">
                <div className="bg-gradient-to-t from-black to-transparent h-40 absolute bottom-0 inset-x-0 z-0" />
                <div className="relative z-10">
                    <LandingGoogleReviewsStrip />
                </div>
            </div>

        </section>
    );
};

export default LandingHero;
