
import React from "react";
import { motion } from "framer-motion";

interface LandingHowItWorksProps {
    t: any;
}

const LandingHowItWorks: React.FC<LandingHowItWorksProps> = ({ t }) => {
    const steps = [
        { icon: 'fa-calendar-check', title: t.services_page?.how_steps?.[0] || 'Booking', desc: t.services_page?.how_step_descs?.[0] || 'Select date and location easily.' },
        { icon: 'fa-suitcase-rolling', title: t.services_page?.how_steps?.[1] || 'Drop / Pickup', desc: t.services_page?.how_step_descs?.[1] || 'Hand over your bags at the spot.' },
        { icon: 'fa-paper-plane', title: t.services_page?.how_steps?.[2] || 'Explore', desc: t.services_page?.how_step_descs?.[2] || 'Enjoy your trip without burden.' }
    ];

    return (
        <section className="py-24 bg-gray-50">
            <div className="max-w-7xl mx-auto px-6">
                <div className="text-center mb-16">
                    <h2 className="text-3xl md:text-4xl font-black mb-4">{t.services_page?.how_title || 'How it works'}</h2>
                    <p className="text-gray-500">{t.services_page?.how_desc_simple || 'Three simple steps to travel hands-free.'}</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {steps.map((item, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.6, ease: "easeOut", delay: i * 0.1 }}
                            className="bg-white p-10 rounded-[2rem] shadow-sm hover:shadow-xl hover:-translate-y-2 transition-all duration-300 text-center group"
                        >
                            <div className="w-20 h-20 mx-auto bg-yellow-50 rounded-full flex items-center justify-center text-3xl text-bee-yellow mb-6 group-hover:bg-bee-yellow group-hover:text-bee-black transition-colors">
                                <i className={`fa-solid ${item.icon}`}></i>
                            </div>
                            <h3 className="text-xl font-black mb-3">{item.title}</h3>
                            <p className="text-gray-400 font-medium leading-relaxed">{item.desc}</p>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default LandingHowItWorks;
