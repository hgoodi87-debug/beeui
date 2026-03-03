
import React from "react";
import { motion } from "framer-motion";
import { QrCode, Coffee, Plane } from "lucide-react";

interface LandingHowItWorksProps {
    t: any;
}

const LandingHowItWorks: React.FC<LandingHowItWorksProps> = ({ t }) => {
    const steps = [
        {
            icon: <QrCode className="w-10 h-10" />,
            title: t.howitworks.step1.title,
            desc: t.howitworks.step1.desc,
            badge: "STEP 1. Drop",
            img: "https://firebasestorage.googleapis.com/v0/b/beeliber-main.firebasestorage.app/o/vc%2F%EB%A7%A1%EA%B8%B0.png?alt=media&token=6ed1959e-b28e-48f5-a07f-3ccf611bfdc9"
        },
        {
            icon: <Coffee className="w-10 h-10" />,
            title: t.howitworks.step2.title,
            desc: t.howitworks.step2.desc,
            badge: "STEP 2. Enjoy",
            img: "https://firebasestorage.googleapis.com/v0/b/beeliber-main.firebasestorage.app/o/vc%2F%EB%B0%98%ED%8F%AC%20%ED%95%9C%EA%B0%95%EA%B3%B5%EC%9B%90.jpeg?alt=media&token=96d6f70c-dde8-4a6e-ae90-7be885db1b91"
        },
        {
            icon: <Plane className="w-10 h-10" />,
            title: t.howitworks.step3.title,
            desc: t.howitworks.step3.desc,
            badge: "STEP 3. Meet",
            img: "https://firebasestorage.googleapis.com/v0/b/beeliber-main.firebasestorage.app/o/vc%2F%EA%B3%B5%ED%95%AD.png?alt=media&token=a3024250-0f39-44fe-a755-99777d5a55b7"
        }
    ];

    return (
        <section className="py-32 md:py-64 bg-bee-light/30 overflow-hidden relative">
            {/* Connection Vector Path (Background) */}
            <svg className="absolute top-1/2 left-0 w-full h-24 hidden lg:block opacity-10 pointer-events-none" viewBox="0 0 1200 100">
                <path d="M0,50 Q300,0 600,50 T1200,50" fill="none" stroke="currentColor" strokeWidth="2" strokeDasharray="10 10" className="text-bee-black" />
            </svg>

            <div className="max-w-7xl mx-auto px-6 relative z-10">
                <div className="text-center mb-24 md:mb-40">
                    <motion.span
                        initial={{ opacity: 0, y: 10 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="inline-block px-5 py-2 rounded-full bg-bee-yellow/10 text-[11px] font-black tracking-[0.3em] text-bee-yellow uppercase mb-8 font-outfit"
                    >
                        MAGIC PROCESS ✨
                    </motion.span>
                    <h2 className="text-5xl md:text-8xl font-display font-black tracking-tighter text-bee-black leading-[1.1] mb-10 break-keep">
                        {t.howitworks.headline}
                    </h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-12 md:gap-20">
                    {steps.map((step, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, y: 50 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: i * 0.2, duration: 0.8 }}
                            className="flex flex-col items-center text-center group"
                        >
                            {/* Image Container with Badge */}
                            <div className="relative w-full aspect-[4/5] rounded-[3rem] overflow-hidden mb-12 shadow-2xl">
                                <img
                                    src={step.img}
                                    alt={step.title}
                                    loading="lazy"
                                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-[2s]"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-bee-black/60 to-transparent" />
                                <div className="absolute top-8 left-8">
                                    <div className="px-5 py-2 bg-bee-yellow text-bee-black font-black text-[12px] tracking-widest rounded-2xl shadow-xl">
                                        {step.badge}
                                    </div>
                                </div>
                                <div className="absolute bottom-8 left-1/2 -translate-x-1/2 w-20 h-20 bg-white/20 backdrop-blur-3xl rounded-3xl flex items-center justify-center text-white border border-white/20 shadow-2xl group-hover:bg-bee-yellow group-hover:text-bee-black transition-all duration-500 scale-110">
                                    {step.icon}
                                </div>
                            </div>

                            <h3 className="text-3xl md:text-4xl font-display font-black text-bee-black mb-6 tracking-tighter">
                                {step.title}
                            </h3>
                            <p className="text-lg text-bee-black/80 font-bold font-outfit leading-relaxed break-keep max-w-[280px] whitespace-pre-line">
                                {step.desc}
                            </p>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default LandingHowItWorks;
