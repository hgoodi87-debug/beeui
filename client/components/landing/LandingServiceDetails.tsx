
import React from "react";
import { motion } from "framer-motion";
import { Truck, Hotel, UserCheck, ShieldCheck } from "lucide-react";

interface LandingServiceDetailsProps {
    t: any;
    onNavigate: (view: any) => void;
}

const LandingServiceDetails: React.FC<LandingServiceDetailsProps> = ({ t, onNavigate }) => {
    return (
        <section className="py-24 md:py-48 px-6 bg-white overflow-hidden">
            <div className="max-w-7xl mx-auto">
                {/* 1. Delivery Section */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center mb-40">
                    <motion.div
                        initial={{ opacity: 0, x: -30 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        className="relative group p-4 lg:pr-10"
                    >
                        <div className="aspect-square rounded-[4rem] overflow-hidden shadow-[0_50px_100px_rgba(0,0,0,0.1)] relative">
                            <img
                                src="https://firebasestorage.googleapis.com/v0/b/beeliber-main.firebasestorage.app/o/%EC%86%8C%EA%B0%9C%2F%EC%97%B0%EB%82%A8%EB%8F%99.png?alt=media&token=77e28e95-bc2f-4678-98a2-a2419f098064"
                                alt="Express Delivery"
                                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000"
                            />
                            <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-bee-black/80 via-bee-black/20 to-transparent" />
                            <div className="absolute bottom-12 left-12 flex items-center gap-6">
                                <div className="p-5 bg-bee-yellow rounded-3xl shadow-xl text-bee-black">
                                    <Truck className="w-8 h-8" />
                                </div>
                                <div className="text-white">
                                    <div className="text-sm font-black uppercase tracking-widest mb-1 font-outfit text-bee-yellow">Priority Service</div>
                                    <div className="text-3xl font-display font-black tracking-tighter italic">Express Delivery</div>
                                </div>
                            </div>
                        </div>
                        {/* Decorative background element */}
                        <div className="absolute -z-10 -top-10 -left-10 w-64 h-64 bg-bee-yellow/5 rounded-full blur-[100px]" />
                    </motion.div>

                    <div className="lg:pl-6">
                        <motion.span
                            initial={{ opacity: 0 }}
                            whileInView={{ opacity: 1 }}
                            className="inline-block px-5 py-2 rounded-full bg-bee-light text-[11px] font-black tracking-[0.25em] text-bee-black/50 uppercase mb-8 font-outfit"
                        >
                            Station to Hotel 🏨
                        </motion.span>
                        <h2 className="text-5xl md:text-8xl font-display font-black text-bee-black leading-[0.9] tracking-tighter mb-10 break-keep">
                            {t.servicedetails?.delivery_title || "Arrival Without"}<br />
                            <span className="text-bee-yellow italic drop-shadow-sm">{t.servicedetails?.delivery_accent || "The Burden"}</span>
                        </h2>
                        <p className="text-lg md:text-2xl text-bee-muted leading-relaxed mb-12 font-bold font-outfit break-keep opacity-80">
                            {t.servicedetails?.delivery_desc || "Leave your bags at the station arrival point. We'll deliver them straight to your hotel lobby. Your hands stay free for exploration."}
                        </p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-14">
                            {[
                                { label: "Safety First", icon: <ShieldCheck className="w-5 h-5 text-green-500" /> },
                                { label: "Real-time Tracking", icon: <Truck className="w-5 h-5 text-bee-yellow" /> }
                            ].map((feat, i) => (
                                <div key={i} className="flex items-center gap-4 bg-bee-light/30 p-5 rounded-3xl border border-bee-black/5 hover:border-bee-yellow/20 transition-all">
                                    <div className="w-10 h-10 bg-white rounded-2xl flex items-center justify-center shadow-sm">
                                        {feat.icon}
                                    </div>
                                    <span className="text-sm font-black text-bee-black font-outfit uppercase tracking-tight">{feat.label}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* 2. Hands-Free Section */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
                    <div className="order-2 lg:order-1 lg:pr-6 text-right flex flex-col items-end">
                        <motion.span
                            initial={{ opacity: 0 }}
                            whileInView={{ opacity: 1 }}
                            className="inline-block px-5 py-2 rounded-full bg-bee-yellow/10 text-[11px] font-black tracking-[0.25em] text-bee-yellow uppercase mb-8 font-outfit"
                        >
                            Hotel to Station 🚄
                        </motion.span>
                        <h2 className="text-5xl md:text-8xl font-display font-black text-bee-black leading-[0.9] tracking-tighter mb-10 break-keep">
                            {t.servicedetails?.handsfree_title || "Departure With"}<br />
                            <span className="text-bee-yellow italic drop-shadow-sm">{t.servicedetails?.handsfree_accent || "Perfect Grace"}</span>
                        </h2>
                        <p className="text-lg md:text-2xl text-bee-muted leading-relaxed mb-12 font-bold font-outfit break-keep opacity-80 max-w-xl">
                            {t.servicedetails?.handsfree_desc || "Last minute shopping in Myeongdong? Check out, leave your bags at the hotel reception, and pick them up at the station right before your flight."}
                        </p>
                        <div className="flex justify-end mb-14 w-full">
                            <button onClick={() => onNavigate('LOCATIONS')} className="px-12 py-5 bg-bee-black text-bee-yellow rounded-2xl font-black text-base hover:scale-105 active:scale-95 transition-all shadow-2xl font-outfit tracking-widest uppercase">
                                Book Now 💅
                            </button>
                        </div>
                    </div>

                    <motion.div
                        initial={{ opacity: 0, x: 30 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        className="order-1 lg:order-2 relative group p-4 lg:pl-10"
                    >
                        <div className="aspect-square rounded-[4rem] overflow-hidden shadow-[0_50px_100px_rgba(0,0,0,0.1)] relative">
                            <img
                                src="https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?auto=format&fit=crop&q=80&w=800"
                                alt="Hands-free"
                                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000"
                            />
                            <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-bee-black/80 via-bee-black/20 to-transparent" />
                            <div className="absolute bottom-12 right-12 flex items-center gap-6">
                                <div className="text-white text-right">
                                    <div className="text-sm font-black uppercase tracking-widest mb-1 font-outfit text-bee-yellow">Premium Experience</div>
                                    <div className="text-3xl font-display font-black tracking-tighter italic">Hands-Free Shopping</div>
                                </div>
                                <div className="p-5 bg-white rounded-3xl shadow-xl text-bee-black">
                                    {/* Hotel icon replaced with more abstract luxury icon if possible, but keeping Hotel for consistency */}
                                    <Hotel className="w-8 h-8" />
                                </div>
                            </div>
                        </div>
                        {/* Decorative background element */}
                        <div className="absolute -z-10 -bottom-10 -right-10 w-64 h-64 bg-bee-yellow/5 rounded-full blur-[100px]" />
                    </motion.div>
                </div>
            </div>
        </section>
    );
};

export default LandingServiceDetails;
