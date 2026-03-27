
import React from "react";
import { motion } from "framer-motion";

interface LandingFreedomSectionProps {
    t: any;
}

const LandingFreedomSection: React.FC<LandingFreedomSectionProps> = ({ t }) => {
    return (
        <section className="relative h-[60vh] md:h-[80vh] flex items-center justify-center overflow-hidden bg-black">
            <div className="absolute inset-0 z-0">
                <img
                    src="/images/landing/freedom-riverside-night.jpeg"
                    alt="짐 없이 서울의 밤을 바라보는 자유로운 여행자"
                    className="w-full h-full object-cover brightness-[0.68] contrast-[1.08]"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-black/35" />
                <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-transparent to-black/45" />
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
                        dangerouslySetInnerHTML={{ __html: t.freedom?.headline || '짐은 빌리버에게.<br /><span class="text-bee-yellow">지금 이 자유,</span> ₩4,000부터.' }} 
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
