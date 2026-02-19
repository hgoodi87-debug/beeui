
import React from "react";
import { motion } from "framer-motion";

interface LandingServiceDetailsProps {
    t: any;
    onNavigate: (view: any) => void;
}

const LandingServiceDetails: React.FC<LandingServiceDetailsProps> = ({ t, onNavigate }) => {
    return (
        <section className="py-32 px-6 bg-white">
            <div className="max-w-7xl mx-auto">
                {/* 1. Delivery Section */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center mb-32">
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6, ease: "easeOut" }}
                        className="order-1 h-[500px] rounded-[3rem] overflow-hidden relative shadow-2xl"
                    >
                        <img src="https://firebasestorage.googleapis.com/v0/b/beeliber-main.firebasestorage.app/o/%EC%86%8C%EA%B0%9C%2F%EB%B0%B0%EC%86%A1.png?alt=media&token=469984dc-4c0e-4276-8c31-9b56b4abd969" alt="Delivery Service" className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
                        <div className="absolute bottom-10 left-10 text-white">
                            <div className="font-bold text-bee-yellow mb-1">Fast & Safe</div>
                            <div className="text-2xl font-black">Airport Delivery</div>
                        </div>
                    </motion.div>
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6, ease: "easeOut" }}
                        className="order-2"
                    >
                        <span className="text-bee-yellow font-black text-sm uppercase tracking-widest mb-2 block">Service 01</span>
                        <h2 className="text-4xl md:text-5xl font-black mb-6 leading-tight">{t.services_page?.delivery_section?.title || 'Delivery'} <br /> <span className="text-gray-200">{t.services_page?.delivery_section?.subtitle || 'between Airport & Hotel'}</span></h2>
                        <p className="text-lg text-gray-500 mb-8 leading-relaxed break-keep">
                            {t.services_page?.delivery_section?.desc || "Don't waste your first and last day dragging luggage. We deliver your bags safely from Incheon/Gimpo Airport to your accommodation (and vice versa) within the same day."}
                        </p>
                        <ul className="space-y-4 mb-10">
                            <li className="flex items-center gap-4 text-lg font-bold">
                                <div className="w-8 h-8 rounded-full bg-green-50 text-green-500 flex items-center justify-center"><i className="fa-solid fa-check"></i></div>
                                {t.services_page?.delivery_section?.features?.[0] || 'Same-day Arrival'}
                            </li>
                            <li className="flex items-center gap-4 text-lg font-bold">
                                <div className="w-8 h-8 rounded-full bg-green-50 text-green-500 flex items-center justify-center"><i className="fa-solid fa-check"></i></div>
                                {t.services_page?.delivery_section?.features?.[1] || 'Photo Verification'}
                            </li>
                            <li className="flex items-center gap-4 text-lg font-bold">
                                <div className="w-8 h-8 rounded-full bg-green-50 text-green-500 flex items-center justify-center"><i className="fa-solid fa-check"></i></div>
                                {t.services_page?.delivery_section?.features?.[2] || 'Insurance Coverage'}
                            </li>
                        </ul>
                        <button onClick={() => onNavigate('LOCATIONS')} className="bg-bee-black text-white px-8 py-4 rounded-xl font-bold hover:bg-gray-800 transition-colors">
                            {t.services_page?.delivery_section?.btn || 'Book Delivery'}
                        </button>
                    </motion.div>
                </div>

                {/* 2. Storage Section */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6, ease: "easeOut" }}
                    >
                        <span className="text-bee-yellow font-black text-sm uppercase tracking-widest mb-2 block">Service 02</span>
                        <h2 className="text-4xl md:text-5xl font-black mb-6 leading-tight">{t.services_page?.storage_section?.title || 'Storage'} <br /> <span className="text-gray-200">{t.services_page?.storage_section?.subtitle || 'at Prime Locations'}</span></h2>
                        <p className="text-lg text-gray-500 mb-8 leading-relaxed break-keep">
                            {t.services_page?.storage_section?.desc || "Need to store your bags for a few hours? Use our secure storages located at key spots like Hongdae and Seoul Station. Book online, drop off, and exploring freely."}
                        </p>
                        <ul className="space-y-4 mb-10">
                            <li className="flex items-center gap-4 text-lg font-bold">
                                <div className="w-8 h-8 rounded-full bg-blue-50 text-[#3B82F6] flex items-center justify-center"><i className="fa-solid fa-location-dot"></i></div>
                                {t.services_page?.storage_section?.features?.[0] || 'Near Subway Stations'}
                            </li>
                            <li className="flex items-center gap-4 text-lg font-bold">
                                <div className="w-8 h-8 rounded-full bg-blue-50 text-[#3B82F6] flex items-center justify-center"><i className="fa-solid fa-clock"></i></div>
                                {t.services_page?.storage_section?.features?.[1] || 'Real-time Booking'}
                            </li>
                            <li className="flex items-center gap-4 text-lg font-bold">
                                <div className="w-8 h-8 rounded-full bg-blue-50 text-[#3B82F6] flex items-center justify-center"><i className="fa-solid fa-shield-halved"></i></div>
                                {t.services_page?.storage_section?.features?.[2] || 'CCTV Monitoring'}
                            </li>
                        </ul>
                        <button onClick={() => onNavigate('LOCATIONS')} className="bg-white text-bee-black border-2 border-bee-black px-8 py-4 rounded-xl font-bold hover:bg-bee-black hover:text-bee-yellow transition-colors">
                            {t.services_page?.storage_section?.btn || 'Book Storage'}
                        </button>
                    </motion.div>
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6, ease: "easeOut" }}
                        className="h-[500px] rounded-[3rem] overflow-hidden relative shadow-2xl"
                    >
                        <img src="https://firebasestorage.googleapis.com/v0/b/beeliber-main.firebasestorage.app/o/%EC%86%8C%EA%B0%9C%2F%EB%B3%B4%EA%B4%80.png?alt=media&token=fa3d8687-c743-44eb-8e91-97b111eb12ee" alt="Storage Service" className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
                        <div className="absolute bottom-10 left-10 text-white">
                            <div className="font-bold text-bee-yellow mb-1">Convenient</div>
                            <div className="text-2xl font-black">Secure Storage</div>
                        </div>
                    </motion.div>
                </div>
            </div>
        </section>
    );
};

export default LandingServiceDetails;
