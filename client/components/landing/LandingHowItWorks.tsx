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
            duration: 0.8,
            ease: "circOut"
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
        <section className="py-24 md:py-48 bg-[#F8F8F5] overflow-hidden relative">
            {/* Background Texture & Soft Gradients for Premium Feel */}
            <div className="absolute top-0 left-0 w-full h-64 bg-gradient-to-b from-white to-transparent" />
            <div className="absolute top-0 right-1/4 w-[600px] h-[600px] bg-bee-yellow/5 rounded-full blur-[140px] pointer-events-none" />
            <div className="absolute bottom-0 left-1/4 w-[600px] h-[600px] bg-black/5 rounded-full blur-[140px] pointer-events-none" />

            <div className="max-w-7xl mx-auto px-6 relative z-10">
                <motion.div 
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, margin: "-100px" }}
                    variants={containerVariants}
                    className="text-center mb-20 md:mb-32 px-4"
                >
                    <motion.h2 
                        variants={itemVariants}
                        className="text-4xl md:text-8xl font-display font-black tracking-[-0.04em] text-bee-black leading-[1.05] mb-8 break-keep"
                    >
                        {t.howitworks.headline.split('\n').map((line: string, i: number) => (
                            <React.Fragment key={i}>
                                <span className={i === 0 ? "text-[#EBB200]" : "text-bee-black opacity-90"}>
                                    {line}
                                </span>
                                {i < t.howitworks.headline.split('\n').length - 1 && <br />}
                            </React.Fragment>
                        ))}
                    </motion.h2>
                    <motion.p 
                        variants={itemVariants}
                        className="text-black/30 text-xs md:text-base font-black tracking-[0.5em] uppercase"
                    >
                        {t.howitworks.subtitle || "The Beeliber Guide"}
                    </motion.p>
                </motion.div>

                {/* Timeline Layout (Desktop & Mobile) */}
                <div className="relative">
                    {/* Vertical Line (Desktop Only) - 차분하면서도 고급스러운 골드 라인 💅 */}
                    <div className="absolute left-1/2 top-12 bottom-12 w-[2px] bg-gradient-to-b from-bee-yellow via-bee-yellow/20 to-black/5 -translate-x-1/2 hidden md:block" />

                    {/* Step Cards Container: Desktop is Stacked, Mobile is Horizontal Scroll 🙄 */}
                    <div className="flex flex-row md:flex-col gap-6 md:gap-48 overflow-x-auto md:overflow-visible pb-12 md:pb-0 scrollbar-hide snap-x snap-mandatory px-4 md:px-0 -mx-4 md:mx-0 relative">
                        {steps.map((step, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, x: i % 2 === 0 ? -40 : 40 }}
                                whileInView={{ opacity: 1, x: 0 }}
                                viewport={{ once: true, margin: "-50px" }}
                                transition={{ duration: 1, ease: "circOut", delay: i * 0.1 }}
                                className={`flex flex-col md:flex-row items-center gap-6 md:gap-0 ${i % 2 === 0 ? 'md:flex-row' : 'md:flex-row-reverse'} relative min-w-[280px] md:min-w-0 snap-center first:ml-4 last:mr-4 md:first:ml-0 md:last:mr-0`}
                            >
                                {/* Content Side 💅 */}
                                <div className={`w-full md:w-1/2 flex ${i % 2 === 0 ? 'md:justify-end md:pr-24' : 'md:justify-start md:pl-24'}`}>
                                    <div className={`bg-white p-8 md:p-14 rounded-[2.5rem] md:rounded-[3.5rem] shadow-[0_20px_40px_-10px_rgba(0,0,0,0.05)] md:shadow-[0_32px_64px_-15px_rgba(0,0,0,0.06)] border border-black/5 max-w-lg w-full transition-all md:hover:translate-y-[-12px] md:hover:border-bee-yellow/50 duration-700 relative group overflow-hidden`}>
                                        {/* Hover Glow Effect 🙄 */}
                                        <div className="absolute -inset-1 bg-gradient-to-r from-bee-yellow/0 via-bee-yellow/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                                        
                                        <div className="flex flex-col gap-4 md:gap-6 relative z-10">
                                            {/* Step Badge (Mobile Icon Integrated for compactness) ✨ */}
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-1 h-1 rounded-full bg-bee-yellow animate-pulse" />
                                                    <span className="text-[10px] font-black tracking-[0.2em] text-bee-yellow uppercase italic">{step.badge}</span>
                                                </div>
                                                <div className="md:hidden w-10 h-10 rounded-2xl bg-bee-yellow/10 flex items-center justify-center text-bee-yellow">
                                                    {React.cloneElement(step.icon as React.ReactElement, { className: "w-5 h-5" } as any)}
                                                </div>
                                            </div>
                                            
                                            <h3 className="text-xl md:text-5xl font-display font-black text-bee-black tracking-tight leading-tight">{step.title}</h3>
                                            <p className="text-xs md:text-xl text-black/40 font-bold leading-relaxed break-keep">
                                                {step.desc}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* Center Icon (Desktop Only) - 화이트 배경에 맞춘 입체감 있는 디자인 💅 */}
                                <div className="hidden md:flex absolute left-1/2 -translate-x-1/2 w-28 h-28 rounded-full bg-white items-center justify-center text-bee-yellow shadow-[0_15px_40px_rgba(0,0,0,0.08)] z-20 border border-black/5 group-hover:scale-110 group-hover:border-bee-yellow group-hover:shadow-[0_20px_50px_rgba(255,191,0,0.2)] transition-all duration-700">
                                    <div className="absolute inset-0 rounded-full animate-ping bg-bee-yellow/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                                    {step.icon}
                                </div>

                                {/* Spacer for the other side on desktop 💅 */}
                                <div className="w-full md:w-1/2 hidden md:block" />
                            </motion.div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Bottom transition to dark section */}
            <div className="absolute bottom-0 left-0 w-full h-48 bg-gradient-to-t from-black/5 to-transparent pointer-events-none" />
        </section>
    );
};

export default LandingHowItWorks;
