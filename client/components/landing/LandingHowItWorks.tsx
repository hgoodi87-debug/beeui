
import React from "react";
import { motion } from "framer-motion";
import { Smartphone, MapPin, Truck, Hotel, ChevronRight } from "lucide-react";

interface LandingHowItWorksProps {
    t: any;
}

const LandingHowItWorks: React.FC<LandingHowItWorksProps> = ({ t }) => {
    const steps = [
        { icon: <Smartphone className="w-8 h-8" />, title: t.howitworks?.step1_title || "Book Online", desc: t.howitworks?.step1_desc || "Quick & easy booking in 1 min." },
        { icon: <MapPin className="w-8 h-8" />, title: t.howitworks?.step2_title || "Drop Off", desc: t.howitworks?.step2_desc || "Drop your bags at the station." },
        { icon: <Truck className="w-8 h-8" />, title: t.howitworks?.step3_title || "We Deliver", desc: t.howitworks?.step3_desc || "Real-time tracking of your bags." },
        { icon: <Hotel className="w-8 h-8" />, title: t.howitworks?.step4_title || "Pick Up", desc: t.howitworks?.step4_desc || "Meet your bags at your hotel." }
    ];

    return (
        <section className="py-24 md:py-48 bg-[#F8F9FA] overflow-hidden">
            <div className="max-w-7xl mx-auto px-6">
                <div className="text-center mb-24 md:mb-32">
                    <motion.span
                        initial={{ opacity: 0, y: 10 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="inline-block px-5 py-2 rounded-full bg-bee-yellow/10 text-[11px] font-black tracking-[0.3em] text-bee-yellow uppercase mb-8 font-outfit"
                    >
                        Success Flow 🚀
                    </motion.span>
                    <h2 className="text-5xl md:text-9xl font-display font-black tracking-tighter text-bee-black leading-[1.1] md:leading-none mb-10">
                        How it <span className="text-bee-yellow italic">Works</span>
                    </h2>
                    <p className="text-lg md:text-2xl text-bee-muted font-bold max-w-2xl mx-auto font-outfit break-keep">
                        {t.howitworks?.subtitle || "Smart luggage delivery from airport to hotel, and hotel to airport."}
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 relative">
                    {/* Connection Line (Desktop) */}
                    <div className="hidden lg:block absolute top-1/2 left-0 right-0 h-px bg-bee-black/5 -translate-y-16" />

                    {steps.map((step, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: i * 0.1, duration: 0.8, ease: "easeOut" }}
                            className="relative group"
                        >
                            <div className="bg-bee-light/30 rounded-[3rem] p-10 hover:bg-white hover:shadow-2xl transition-all duration-500 border border-transparent hover:border-bee-yellow/20 relative z-10 flex flex-col items-center text-center">
                                <div className="w-20 h-20 rounded-3xl bg-bee-black text-bee-yellow flex items-center justify-center mb-8 group-hover:scale-110 group-hover:rotate-6 transition-all duration-500 shadow-xl">
                                    {step.icon}
                                </div>
                                <div className="absolute top-6 right-8 text-5xl font-display font-black text-bee-yellow/20 group-hover:text-bee-yellow/40 transition-colors">
                                    0{i + 1}
                                </div>
                                <h3 className="text-2xl font-display font-black text-bee-black mb-4">
                                    {step.title}
                                </h3>
                                <p className="text-sm md:text-base text-bee-muted leading-relaxed md:leading-loose font-bold font-outfit break-keep">
                                    {step.desc}
                                </p>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default LandingHowItWorks;
