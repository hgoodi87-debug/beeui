
import React from "react";
import { motion } from "framer-motion";
import { Package, Luggage, Check } from "lucide-react";

interface LandingPricingProps {
    t: any;
    onNavigate: (view: any) => void;
}

const LandingPricing: React.FC<LandingPricingProps> = ({ t, onNavigate }) => {
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
        <section className="py-32 md:py-64 bg-white overflow-hidden relative">
            {/* Decorative Background Elements */}
            <div className="absolute top-0 right-0 w-1/3 h-full bg-bee-light/50 -skew-x-12 translate-x-1/2" />
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-bee-yellow/10 rounded-full blur-[100px] -translate-x-1/2 translate-y-1/2" />
            <div className="absolute inset-0 opacity-[0.03] pointer-events-none noise-overlay" />

            <div className="max-w-7xl mx-auto px-6 relative z-10">
                <div className="text-center mb-24 md:mb-40">
                    <motion.span
                        initial={{ opacity: 0, y: 10 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        className="inline-block px-5 py-2 rounded-full bg-bee-light text-[11px] font-black tracking-[0.3em] text-bee-black/40 uppercase mb-8 font-outfit"
                    >
                        FLAT RATE 💰
                    </motion.span>
                    <h2 className="text-5xl md:text-8xl font-display font-black tracking-tighter text-bee-black leading-[1.1] mb-10 break-keep">
                        {t.pricing.headline}
                    </h2>
                    <p className="text-xl md:text-2xl text-bee-black font-bold max-w-2xl mx-auto break-keep opacity-90 whitespace-pre-line">
                        {t.pricing.desc}
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-12 max-w-5xl mx-auto">
                    {prices.map((item, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, scale: 0.9 }}
                            whileInView={{ opacity: 1, scale: 1 }}
                            viewport={{ once: true }}
                            transition={{ delay: i * 0.1 }}
                            className={`relative p-12 rounded-[4rem] border-2 transition-all duration-500 overflow-hidden ${item.popular ? 'border-bee-yellow bg-bee-light/30 shadow-2xl scale-105 z-10' : 'border-bee-yellow bg-white'
                                }`}
                        >
                            {item.popular && (
                                <div className="absolute top-10 right-10 px-4 py-1.5 bg-bee-yellow text-bee-black font-black text-[10px] tracking-widest rounded-full shadow-lg">
                                    MOST POPULAR
                                </div>
                            )}

                            <div className={`w-16 h-16 rounded-3xl flex items-center justify-center mb-10 ${item.popular ? 'bg-bee-black text-bee-yellow' : 'bg-bee-light text-bee-black'}`}>
                                {item.icon}
                            </div>

                            <h3 className="text-2xl md:text-3xl font-display font-black text-bee-black mb-4 tracking-tight">{item.title}</h3>
                            <div className="flex items-baseline gap-2 mb-10">
                                <span className="text-5xl md:text-7xl font-display font-black tracking-tighter text-bee-black">{item.price}</span>
                                <span className="text-bee-muted font-black text-sm uppercase tracking-widest">/ Bag</span>
                            </div>

                            <ul className="space-y-4 mb-12">
                                {item.features.map((feat: string, idx: number) => (
                                    <li key={idx} className="flex items-center gap-4 text-bee-muted font-bold font-outfit">
                                        <div className="w-6 h-6 rounded-full bg-bee-yellow/20 flex items-center justify-center shrink-0">
                                            <Check className="w-3.5 h-3.5 text-bee-yellow" />
                                        </div>
                                        <span className="text-bee-black/70">{feat}</span>
                                    </li>
                                ))}
                            </ul>

                            <button
                                onClick={() => onNavigate('LOCATIONS')}
                                className={`w-full py-6 md:py-8 rounded-[2rem] font-black text-xl md:text-2xl tracking-[0.1em] transition-all shadow-2xl active:scale-95 flex items-center justify-center gap-3 ${item.popular ? 'bg-bee-black text-bee-yellow hover:bg-bee-yellow hover:text-bee-black' : 'bg-bee-yellow text-bee-black hover:bg-bee-black hover:text-bee-yellow'
                                    }`}
                            >
                                CHOOSE SERVICE <span className="text-2xl md:text-3xl">➔</span>
                            </button>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default LandingPricing;
