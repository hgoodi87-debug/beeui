
import React from "react";
import { motion } from "framer-motion";
import { Package, Luggage, Check } from "lucide-react";

interface LandingPricingProps {
    t: any;
    onNavigate: (view: any) => void;
    lang: string;
}

const LandingPricing: React.FC<LandingPricingProps> = ({ t, onNavigate, lang }) => {
    const prices = [
        {
            icon: <Luggage className="w-8 h-8" />,
            title: t.pricing.airport_hotel,
            price: t.pricing.price_standard,
            features: t.pricing.features_standard || ["All sizes up to 28\"", "Airport ↔ Hotel Delivery", "Real-time Tracking", "Basic Insurance"],
            popular: true
        },
        {
            icon: <Package className="w-8 h-8" />,
            title: t.pricing.extra_large,
            price: t.pricing.price_extra,
            features: t.pricing.features_extra || ["Over 28\", Golf Bags, etc.", "Heavy Duty Handling", "Same-day Delivery", "Global Insurance"],
            popular: false
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
                    <h2 className="text-4xl md:text-7xl font-display font-black tracking-tighter text-bee-black leading-[1.1] mb-8 break-keep whitespace-pre-line">
                        {t.pricing.headline}
                    </h2>
                    <p className="text-lg md:text-xl text-bee-black font-bold max-w-2xl mx-auto break-keep opacity-90 whitespace-pre-line px-4">
                        {t.pricing.desc}
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 max-w-5xl mx-auto">
                    {prices.map((item, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, scale: 0.9 }}
                            whileInView={{ opacity: 1, scale: 1 }}
                            viewport={{ once: true }}
                            transition={{ delay: i * 0.1 }}
                            className={`relative p-8 md:p-14 rounded-[3.5rem] border-2 transition-all duration-500 overflow-hidden shrink-0 flex flex-col ${item.popular ? 'border-bee-yellow bg-bee-light/30 shadow-2xl scale-105 z-10' : 'border-bee-yellow bg-white'
                                }`}
                        >
                            {item.popular && (
                                <div className="absolute top-8 right-8 px-4 py-1.5 bg-bee-yellow text-bee-black font-black text-[10px] tracking-widest rounded-full shadow-lg">
                                    {t.pricing?.most_popular_label || "BEST SELLER"}
                                </div>
                            )}

                            <div className={`w-14 h-14 md:w-16 md:h-16 rounded-2xl md:rounded-3xl flex items-center justify-center mb-8 md:mb-10 ${item.popular ? 'bg-bee-black text-bee-yellow' : 'bg-bee-light text-bee-black'}`}>
                                {item.icon}
                            </div>

                            <h3 className="text-xl md:text-3xl font-display font-black text-bee-black mb-4 tracking-tight">{item.title}</h3>
                            <div className="flex items-baseline flex-wrap gap-2 mb-8 md:mb-10">
                                <span className="text-4xl md:text-6xl font-display font-black tracking-tighter text-bee-black whitespace-nowrap">{item.price}</span>
                                <span className="text-bee-muted font-black text-[10px] md:text-xs uppercase tracking-widest">{t.pricing?.per_bag_label || "/ UNIT"}</span>
                            </div>

                            <ul className="space-y-3 md:space-y-4 mb-10 md:mb-12 flex-grow">
                                {item.features.map((feat: string, idx: number) => (
                                    <li key={idx} className="flex items-start gap-4 text-bee-muted font-bold font-outfit">
                                        <div className="w-5 h-5 md:w-6 md:h-6 rounded-full bg-bee-yellow/20 flex items-center justify-center shrink-0 mt-0.5">
                                            <Check className="w-3 h-3 md:w-3.5 md:h-3.5 text-bee-yellow" />
                                        </div>
                                        <span className="text-bee-black/70 text-sm md:text-base leading-snug">{feat}</span>
                                    </li>
                                ))}
                            </ul>

                            <motion.a
                                href={`/${lang}/locations`}
                                onClick={(e) => { e.preventDefault(); onNavigate('LOCATIONS'); }}
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                className={`w-full py-5 md:py-8 rounded-[1.5rem] md:rounded-[2rem] font-black text-lg md:text-2xl tracking-[0.1em] transition-all shadow-2xl flex items-center justify-center gap-3 cursor-pointer ${item.popular ? 'bg-bee-black text-bee-yellow hover:bg-bee-yellow hover:text-bee-black' : 'bg-bee-yellow text-bee-black hover:bg-bee-black hover:text-bee-yellow'
                                    }`}
                            >
                                {t.pricing?.choose_service_btn || "BOOK NOW"} <span className="text-xl md:text-3xl">➔</span>
                            </motion.a>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default LandingPricing;
