
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
        <section className="relative min-h-[100svh] overflow-hidden bg-[#080808] text-white flex flex-col">

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
            <div className="relative z-10 mx-auto w-full max-w-[1200px] px-5 pt-20 pb-10 sm:px-7 flex-1 flex flex-col justify-center items-center">
                <motion.div
                    style={{ y: y1, opacity }}
                    className="w-full max-w-[820px] flex flex-col items-center"
                >
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mb-8 flex flex-wrap items-center justify-center gap-3"
                    >
                        {branchData && (
                            <div className="px-4 py-2 rounded-full bg-bee-yellow text-bee-black shadow-2xl shadow-bee-yellow/20 flex items-center gap-2">
                                <MapPin size={14} className="animate-pulse" />
                                <span className="text-[11px] font-black tracking-widest uppercase">
                                    {branchData.name} {branchData.ownerName ? `| ${branchData.ownerName}` : ''}
                                </span>
                            </div>
                        )}
                        <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-[10px] font-black uppercase tracking-[0.28em] text-white/85 backdrop-blur-md">
                            <ShieldCheck size={14} className="text-bee-yellow" />
                            {t.hero.badge || "Verified Luggage Care"}
                        </span>
                    </motion.div>

                    <h1 className="w-full max-w-[920px] text-center text-[clamp(2.6rem,9vw,5rem)] lg:text-[72px] font-black leading-[1.13] tracking-[-0.03em] text-white drop-shadow-2xl break-keep">
                        {isKo ? (
                            <>
                                짐 없이 시작되는<br />
                                <span className="text-bee-yellow">진짜 한국 여행</span>
                            </>
                        ) : (
                            <>
                                Travel Korea without<br />
                                <span className="text-bee-yellow">the baggage</span>
                            </>
                        )}
                    </h1>

                    <p className="mt-8 max-w-[560px] text-center text-base font-semibold leading-relaxed text-white/78 lg:text-lg break-keep">
                        {isKo
                            ? '서울 전역 40여개 이상의 지점에서 짐을 안전하게 보관하고 배송합니다.'
                            : subtitle}
                    </p>

                    {/* CTA Buttons */}
                    <motion.div
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        className="mt-8 flex flex-col gap-3 sm:flex-row sm:gap-4 sm:max-w-[580px] w-full"
                    >
                        <motion.button
                            whileHover={{ scale: 1.03, backgroundColor: "#fff", color: "#000" }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => onNavigate('LOCATIONS_STORE')}
                            className="flex h-14 w-full items-center justify-center gap-2 rounded-full bg-bee-yellow px-6 text-sm font-black uppercase tracking-[0.08em] text-bee-black transition-all md:h-16 md:text-base"
                        >
                            {isKo ? '가까운 보관소 찾기' : (t.hero.cta_storage || "Store luggage")}
                            <ArrowRight size={18} />
                        </motion.button>
                        <motion.button
                            whileHover={{ scale: 1.03, backgroundColor: "#fff", color: "#000" }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => onNavigate('LOCATIONS_DELIVER')}
                            className="flex h-14 w-full items-center justify-center gap-2 rounded-full border-2 border-white/70 bg-transparent px-6 text-sm font-black uppercase tracking-[0.08em] text-white transition-all hover:border-white hover:bg-white/10 md:h-16 md:text-base"
                        >
                            {isKo ? '공항 배송 예약' : (t.hero.cta_delivery || "Airport delivery")}
                            <ArrowRight size={18} />
                        </motion.button>
                    </motion.div>
                </motion.div>
            </div>

            {/* 3. Google Reviews Strip - normal flow at bottom of hero */}
            <div className="relative z-10 w-full">
                <LandingGoogleReviewsStrip />
            </div>

        </section>
    );
};

export default LandingHero;
