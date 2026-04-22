
import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { fetchExchangeRate, getCachedRate, krwToUsd } from "../../services/paypalService";

interface LandingFreedomSectionProps {
    t: any;
    lang?: string;
}

const LandingFreedomSection: React.FC<LandingFreedomSectionProps> = ({ t, lang }) => {
    const [rate, setRate] = useState<number>(getCachedRate());
    useEffect(() => { fetchExchangeRate().then(setRate); }, []);

    const isKo = !lang || lang === 'ko';
    const rawHeadline = t.freedom?.headline || '짐은 빌리버에게.<br /><span class="text-bee-yellow">지금 이 자유,</span> ₩4,000부터.';
    const headline = isKo
        ? rawHeadline
        : rawHeadline.replace(/₩[\d,]+/g, `USD $${krwToUsd(4000, rate)}`);
    return (
        <section className="relative h-[60vh] md:h-[80vh] flex items-center justify-center overflow-hidden bg-black">
            <div className="absolute inset-0 z-0">
                <picture>
                    <source srcSet="/images/landing/freedom-riverside-night.webp" type="image/webp" />
                    <img
                        src="/images/landing/freedom-riverside-night.jpeg"
                        alt="짐 없이 서울의 밤을 바라보는 자유로운 여행자"
                        className="w-full h-full object-cover brightness-[0.68] contrast-[1.08]"
                        loading="lazy"
                        width="1920"
                        height="1080"
                    />
                </picture>
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-black/35 pointer-events-none" />
                <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-transparent to-black/45 pointer-events-none" />
            </div>

            <div className="relative z-10 w-full max-w-7xl mx-auto px-6 text-center">
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="flex flex-col items-center"
                >
                    <div className="px-4 py-1.5 bg-bee-yellow text-bee-black font-black text-[10px] tracking-widest rounded-full mb-8 shadow-2xl">
                        {t.freedom?.badge || 'AFTER'}
                    </div>
                    <h2 className="text-4xl md:text-7xl font-display font-black text-white mb-6 tracking-tighter drop-shadow-2xl"
                        dangerouslySetInnerHTML={{ __html: headline }}
                    />
                    <p className="text-lg md:text-2xl text-white/80 font-bold tracking-tight">
                        {t.freedom?.sub_copy || '무거운 짐 없이 가볍게, 서울의 낭만을 즐기세요. 💅✨'}
                    </p>
                </motion.div>
            </div>
        </section>
    );
};

export default LandingFreedomSection;
