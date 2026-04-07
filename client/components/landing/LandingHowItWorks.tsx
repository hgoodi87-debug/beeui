import React from "react";
import { motion } from "framer-motion";
import { MapPin, Search as SearchIcon, Briefcase } from "lucide-react";

interface LandingHowItWorksProps {
    t: any;
}

const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            staggerChildren: 0.3,
            delayChildren: 0.2
        }
    }
};

const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
        opacity: 1,
        y: 0,
        transition: {
            duration: 0.8
        }
    }
};

const LandingHowItWorks: React.FC<LandingHowItWorksProps> = ({ t }) => {
    const steps = [
        {
            icon: <MapPin className="w-8 h-8" />,
            title: t.howitworks.step1.title,
            desc: t.howitworks.step1.desc,
            badge: t.howitworks.step1.badge,
            color: "bg-bee-yellow",
            textColor: "text-bee-black"
        },
        {
            icon: <SearchIcon className="w-8 h-8" />,
            title: t.howitworks.step2.title,
            desc: t.howitworks.step2.desc,
            badge: t.howitworks.step2.badge,
            color: "bg-bee-yellow",
            textColor: "text-bee-black"
        },
        {
            icon: <Briefcase className="w-8 h-8" />,
            title: t.howitworks.step3.title,
            desc: t.howitworks.step3.desc,
            badge: t.howitworks.step3.badge,
            color: "bg-bee-yellow",
            textColor: "text-bee-black"
        }
    ];

    return (
        <section className="py-10 md:py-20 bg-[#F8F8F5] overflow-hidden relative">
            {/* Background Texture & Soft Gradients for Premium Feel */}
            <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-white to-transparent" />
            <div className="absolute top-0 right-1/4 w-[400px] h-[400px] bg-bee-yellow/5 rounded-full blur-[100px] pointer-events-none" />
            <div className="absolute bottom-0 left-1/4 w-[400px] h-[400px] bg-black/5 rounded-full blur-[100px] pointer-events-none" />

            <div className="max-w-7xl mx-auto px-6 relative z-10">
                <motion.div 
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, margin: "-100px" }}
                    variants={containerVariants}
                    className="text-center mb-8 md:mb-12 px-4"
                >
                    <motion.h2 
                        variants={itemVariants}
                        className="text-2xl md:text-5xl font-display font-black tracking-[-0.04em] text-bee-black leading-[1.1] mb-3 md:mb-5 break-keep"
                    >
                        {t.howitworks.headline.split('\n').map((line: string, i: number) => (
                            <React.Fragment key={i}>
                                <span className={line.includes('Beeliber') || i === 0 ? "text-[#EBB200]" : "text-bee-black opacity-90"}>
                                    {line}
                                </span>
                                {i < t.howitworks.headline.split('\n').length - 1 && <br />}
                            </React.Fragment>
                        ))}
                    </motion.h2>
                    <motion.p 
                        variants={itemVariants}
                        className="text-black/30 text-[9px] md:text-xs font-black tracking-[0.3em] uppercase"
                    >
                        {t.howitworks.subtitle || "The Beeliber Guide"}
                    </motion.p>
                </motion.div>

                {/* Timeline Layout (Desktop & Mobile) */}
                <div className="relative">
                    {/* Vertical Line */}
                    <div className="absolute left-[16px] md:left-1/2 top-4 bottom-4 w-[1px] md:w-[2px] bg-gradient-to-b from-bee-yellow via-bee-yellow/20 to-transparent md:-translate-x-1/2" />

                    {/* Step Cards Container */}
                    <div className="flex flex-col gap-4 md:gap-10 relative">
                        {steps.map((step, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, y: 15 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true, margin: "-50px" }}
                                transition={{ duration: 0.6, ease: [0, 0.55, 0.45, 1], delay: i * 0.05 }}
                                className={`flex flex-row items-start md:items-center gap-4 md:gap-0 ${i % 2 === 0 ? 'md:flex-row' : 'md:flex-row-reverse'} relative`}
                            >
                                {/* Content Side */}
                                <div className={`w-full md:w-1/2 flex pl-8 md:pl-0 ${i % 2 === 0 ? 'md:justify-end md:pr-12' : 'md:justify-start md:pl-12'}`}>
                                    <div className={`bg-white p-3 md:p-6 rounded-[1rem] md:rounded-[1.5rem] shadow-[0_8px_20px_-6px_rgba(0,0,0,0.03)] border border-black/5 max-w-sm w-full md:hover:translate-y-[-3px] md:hover:border-bee-yellow/50 transition-all duration-500 relative group overflow-hidden`}>
                                        <div className="flex flex-col gap-2 md:gap-3 relative z-10">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-1.5">
                                                    <div className="w-1 h-1 rounded-full bg-bee-yellow animate-pulse" />
                                                    <span className="text-[8px] md:text-[9px] font-black tracking-[0.15em] text-bee-yellow uppercase italic">{step.badge}</span>
                                                </div>
                                                <div className="md:hidden w-6 h-6 rounded-lg bg-bee-yellow/10 flex items-center justify-center text-bee-yellow">
                                                    {React.cloneElement(step.icon as React.ReactElement, { className: "w-3 h-3" } as any)}
                                                </div>
                                            </div>
                                            
                                            <h3 className="text-sm md:text-xl font-display font-black text-bee-black tracking-tight leading-tight">{step.title}</h3>
                                            <p className="text-[9px] md:text-[14px] text-black/50 font-medium leading-relaxed break-keep">
                                                {step.desc}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* Center Icon */}
                                <div className="absolute left-1/2 -translate-x-1/2 hidden md:flex w-12 h-12 rounded-full bg-white items-center justify-center text-bee-yellow shadow-[0_8px_20px_rgba(0,0,0,0.05)] z-20 border border-black/5 group-hover:scale-110 transition-all duration-500">
                                    {React.cloneElement(step.icon as React.ReactElement, { className: "w-5 h-5" } as any)}
                                </div>
                                <div className="md:hidden absolute left-[10px] top-4 w-3 h-3 rounded-full bg-bee-yellow border-[2px] border-white shadow-sm z-20" />

                                {/* Spacer for desktop */}
                                <div className="w-full md:w-1/2 hidden md:block" />
                            </motion.div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Bottom transition */}
            <div className="absolute bottom-0 left-0 w-full h-24 bg-gradient-to-t from-black/5 to-transparent pointer-events-none" />
        </section>
    );
};

export default LandingHowItWorks;
