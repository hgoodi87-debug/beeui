
import React from "react";
import { motion } from "framer-motion";
import { Check } from "lucide-react";

interface LandingPricingProps {
    t: any;
    onNavigate: (view: any) => void;
    lang: string;
}

const LandingPricing: React.FC<LandingPricingProps> = ({ t, onNavigate, lang }) => {
    const prices = [
        {
            image: "/images/bags/carrier-photo.png",
            imageWebp: "/images/bags/carrier-photo.webp",
            title: t.pricing.airport_hotel,
            price: t.pricing.price_standard,
            unit: t.pricing?.unit_standard || t.pricing?.per_bag_label || "/ UNIT",
            features: t.pricing.features_standard || ["All sizes up to 28\"", "Airport ↔ Hotel Delivery", "Real-time Tracking", "Basic Insurance"],
            popular: true,
            badge: t.pricing?.most_popular_label || "BEST",
            btn: t.pricing?.btn_storage || "보관하기",
        },
        {
            image: "/images/bee-mascot-nobg.png",
            imageWebp: "/images/bee-mascot-nobg.webp",
            title: t.pricing.extra_large,
            price: t.pricing.price_extra,
            unit: t.pricing?.unit_extra || t.pricing?.per_bag_label || "/ UNIT",
            features: t.pricing.features_extra || ["Over 28\", Golf Bags, etc.", "Heavy Duty Handling", "Same-day Delivery", "Global Insurance"],
            popular: false,
            badge: null,
            btn: t.pricing?.btn_delivery || "배송하기",
        }
    ];

    return (
        <section className="py-16 md:py-24 bg-white overflow-hidden relative">
            {/* Decorative Background Elements */}
            <div className="absolute top-0 right-0 w-1/3 h-full bg-bee-light/50 -skew-x-12 translate-x-1/2" />
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-bee-yellow/10 rounded-full blur-[100px] -translate-x-1/2 translate-y-1/2" />
            <div className="absolute inset-0 opacity-[0.03] pointer-events-none noise-overlay" />

            <div className="max-w-7xl mx-auto px-6 relative z-10">
                <div className="text-center mb-12 md:mb-20">
                    <motion.span
                        initial={{ opacity: 0, y: 10 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        className="inline-block px-5 py-2 rounded-full bg-bee-light text-[11px] font-black tracking-[0.3em] text-bee-black/40 uppercase mb-8 font-outfit"
                    >
                        {t.pricing?.flat_rate_label || "UNIT PRICE"}
                    </motion.span>
                    <h2 className="text-3xl md:text-7xl font-display font-black tracking-tighter text-bee-black leading-[1.1] mb-8 break-keep whitespace-pre-line">
                        {t.pricing.headline}
                    </h2>
                    <p className="text-lg md:text-xl text-bee-black font-bold max-w-2xl mx-auto break-keep opacity-90 whitespace-pre-line px-4">
                        {t.pricing.desc}
                    </p>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-2 gap-3 md:gap-12 max-w-5xl mx-auto">
                    {prices.map((item, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, scale: 0.9 }}
                            whileInView={{ opacity: 1, scale: 1 }}
                            viewport={{ once: true }}
                            transition={{ delay: i * 0.1 }}
                            className={`relative p-5 md:p-14 rounded-[2rem] md:rounded-[3.5rem] border-2 transition-all duration-500 overflow-hidden shrink-0 flex flex-col ${item.popular ? 'border-bee-yellow bg-bee-light/30 shadow-2xl md:scale-105 z-10' : 'border-bee-yellow bg-white'
                                }`}
                        >
                            {/* 단일 배지 */}
                            {item.badge && (
                                <div className="absolute top-4 right-4 md:top-8 md:right-8">
                                    <span className="px-2 py-0.5 md:px-4 md:py-1.5 bg-bee-yellow text-bee-black font-black text-[7px] md:text-[10px] tracking-wider rounded-full shadow-lg uppercase whitespace-nowrap">
                                        {item.badge}
                                    </span>
                                </div>
                            )}

                            {/* 품목 이미지 */}
                            <div className="mb-4 md:mb-8 flex items-center justify-start">
                                <picture>
                                    <source srcSet={item.imageWebp} type="image/webp" />
                                    <img
                                        src={item.image}
                                        alt={item.title}
                                        className={`object-contain ${i === 1 ? 'w-20 h-20 md:w-36 md:h-36 drop-shadow-lg' : 'w-16 h-16 md:w-28 md:h-28 drop-shadow-md'}`}
                                    />
                                </picture>
                            </div>

                            <h3 className="text-sm md:text-3xl font-display font-black text-bee-black mb-2 md:mb-4 tracking-tight leading-tight">{item.title}</h3>
                            <div className="flex items-baseline flex-wrap gap-1 mb-4 md:mb-10">
                                <span className="text-xl md:text-6xl font-display font-black tracking-tighter text-bee-black whitespace-nowrap">{item.price}</span>
                                <span className="text-bee-muted font-black text-[8px] md:text-xs uppercase tracking-[0.05em] md:tracking-widest">{item.unit}</span>
                            </div>

                            <ul className="space-y-2 md:space-y-4 mb-6 md:mb-12 flex-grow overflow-hidden">
                                {item.features.map((feat: string, idx: number) => (
                                    <li key={idx} className="flex items-start gap-2 md:gap-4 text-bee-muted font-bold font-outfit">
                                        <div className="w-4 h-4 md:w-6 md:h-6 rounded-full bg-bee-yellow/20 flex items-center justify-center shrink-0 mt-0.5">
                                            <Check className="w-2.5 h-2.5 md:w-3.5 md:h-3.5 text-bee-yellow" />
                                        </div>
                                        <span className="text-bee-black/70 text-[10px] md:text-base leading-snug break-keep">{feat}</span>
                                    </li>
                                ))}
                            </ul>

                            <motion.a
                                href={`/${lang}/locations`}
                                onClick={(e) => { e.preventDefault(); onNavigate('LOCATIONS'); }}
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                className={`w-full py-3 md:py-8 rounded-xl md:rounded-[2rem] font-black text-[10px] md:text-2xl tracking-[0.05em] md:tracking-[0.1em] transition-all shadow-xl flex items-center justify-center gap-1.5 md:gap-3 cursor-pointer ${item.popular ? 'bg-bee-black text-bee-yellow hover:bg-bee-yellow hover:text-bee-black' : 'bg-bee-yellow text-bee-black hover:bg-bee-black hover:text-bee-yellow'
                                    }`}
                            >
                                {item.btn} <span className="text-xs md:text-3xl">➔</span>
                            </motion.a>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default LandingPricing;
