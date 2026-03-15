
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, Sparkles, Compass, Star, ChevronLeft, ArrowRight, ShieldCheck, Clock, Navigation } from 'lucide-react';
import { SEO_LOCATIONS, SeoLocation } from '../src/constants/seoLocations';
import { TRAVEL_TIPS } from '../src/constants/travelTips';
import { LOCATIONS } from '../constants';
import SEO from './SEO';
import TipsMap from './tips/TipsMap';

const BranchTipsPage: React.FC<{ lang: string; t: any }> = ({ lang, t }) => {
    const { slug } = useParams<{ slug: string }>();
    const navigate = useNavigate();
    const [seoData, setSeoData] = useState<SeoLocation | null>(null);
    const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);

    useEffect(() => {
        const data = SEO_LOCATIONS.find(loc => loc.slug === slug);
        if (data) {
            setSeoData(data);
        } else {
            navigate('/tips', { replace: true });
        }
        window.scrollTo(0, 0);

        // [스봉이] 사용자의 실시간 위치 파악 시작! 🛰️💅
        if ("geolocation" in navigator) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    setUserLocation({
                        lat: position.coords.latitude,
                        lng: position.coords.longitude
                    });
                    console.log("[스봉이] 사용자 위치 수신 성공! ✨");
                },
                (error) => {
                    console.warn("[스봉이] 위치 권한이 거부되었거나 오류가 발생했어요. 🙄", error);
                }
            );
        }
    }, [slug, navigate]);

    if (!seoData) return null;

    const l = (data: any) => data[lang] || data['ko'];

    return (
        <div className="min-h-screen bg-black text-white selection:bg-bee-yellow selection:text-bee-black">
            <SEO 
                title={`${l(seoData.titles)} | Travel Tips 💅`}
                description={l(seoData.descriptions)}
                keywords={l(seoData.keywords)}
                lang={lang}
                path={`/tips/${slug}`}
            />

            {/* Premium Navigation */}
            <nav className="fixed top-0 inset-x-0 z-[100] px-4 py-4">
                <div className="max-w-4xl mx-auto flex justify-between items-center backdrop-blur-xl bg-white/5 border border-white/10 rounded-full px-6 py-2 shadow-2xl">
                    <button onClick={() => navigate(-1)} className="flex items-center gap-2 group">
                        <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center group-hover:bg-bee-yellow group-hover:text-bee-black transition-all">
                            <ChevronLeft size={18} />
                        </div>
                        <span className="text-[10px] font-black uppercase tracking-widest hidden sm:block">Back</span>
                    </button>
                    
                    <div className="flex items-center gap-1">
                        <span className="text-xl font-black italic">bee</span>
                        <span className="text-xl font-black italic text-bee-yellow">liber</span>
                    </div>

                    <button 
                        onClick={() => navigate('/')}
                        className="px-5 py-2 bg-bee-yellow text-bee-black text-[10px] font-black uppercase tracking-wider rounded-full hover:scale-105 active:scale-95 transition-all"
                    >
                        Book Now
                    </button>
                </div>
            </nav>

            <main className="max-w-4xl mx-auto px-6 pt-32 pb-40">
                {/* Header Section */}
                <header className="mb-20 text-center">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="inline-flex items-center gap-2 px-4 py-1.5 bg-bee-yellow/10 text-bee-yellow border border-bee-yellow/20 rounded-full mb-8"
                    >
                        <Sparkles size={12} className="fill-bee-yellow" />
                        <span className="text-[10px] font-black uppercase tracking-[0.2em]">Local Curation for {slug}</span>
                    </motion.div>

                    <motion.h1 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="text-4xl md:text-7xl font-black mb-10 tracking-tighter leading-tight uppercase italic"
                    >
                        Discover <span className="text-bee-yellow">Hidden Gems</span> 💅
                    </motion.h1>

                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="text-white/60 font-medium text-lg max-w-2xl mx-auto leading-relaxed"
                    >
                        {l(seoData.intros)}
                    </motion.p>
                </header>

                {/* [스봉이] 프리미엄 지도 섹션 💅✨ */}
                <motion.section 
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="mb-32"
                >
                    <div className="flex items-center gap-4 mb-8">
                        <h2 className="text-xs font-black uppercase tracking-[0.3em] text-bee-yellow italic">Interactive Discovery Map</h2>
                        <div className="h-px flex-1 bg-bee-yellow/20" />
                    </div>
                    <TipsMap location={seoData} userLocation={userLocation} lang={lang} />
                </motion.section>

                {/* Hotspots Section */}
                <section className="mb-32">
                    <div className="flex items-center gap-4 mb-12">
                        <div className="h-px flex-1 bg-white/10" />
                        <h2 className="text-xs font-black uppercase tracking-[0.3em] text-white/40 italic">Must-Visit Spots</h2>
                        <div className="h-px flex-1 bg-white/10" />
                    </div>

                    <div className="grid grid-cols-1 gap-6">
                        {seoData.touristSpots.map((spot, idx) => (
                            <motion.div
                                key={spot.id}
                                initial={{ opacity: 0, x: -20 }}
                                whileInView={{ opacity: 1, x: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: idx * 0.1 }}
                                className="group relative flex flex-col md:flex-row items-center gap-8 p-10 bg-white/5 border border-white/10 rounded-[3rem] hover:bg-white/10 hover:border-bee-yellow/30 transition-all"
                            >
                                <div className="w-20 h-20 rounded-3xl bg-white/10 flex items-center justify-center shrink-0 group-hover:rotate-12 transition-transform">
                                    {spot.category === 'landmark' ? <Star className="text-orange-400 fill-orange-400" size={36} /> : <Compass className="text-blue-400" size={36} />}
                                </div>
                                <div className="flex-1 text-center md:text-left">
                                    <h4 className="text-2xl md:text-3xl font-black mb-4 group-hover:text-bee-yellow transition-colors">{l(spot.name)}</h4>
                                    <p className="text-white/40 font-bold leading-relaxed text-lg italic">"{l(spot.description)}"</p>
                                </div>
                                <div className="hidden md:block">
                                    <div className="w-14 h-14 rounded-full border border-white/10 flex items-center justify-center group-hover:bg-bee-yellow group-hover:text-bee-black transition-all">
                                        <ArrowRight size={24} />
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </section>

                {/* Related Tips Section */}
                {seoData.relatedTipIds && (
                    <section className="mb-32">
                        <h3 className="text-3xl font-black mb-12 italic uppercase underline decoration-bee-yellow decoration-4 underline-offset-8">Beeliber's Guide 💅</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            {TRAVEL_TIPS.filter(tip => seoData.relatedTipIds?.includes(tip.id)).map((tip, i) => (
                                <motion.div
                                    key={tip.id}
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    whileInView={{ opacity: 1, scale: 1 }}
                                    viewport={{ once: true }}
                                    transition={{ delay: i * 0.1 }}
                                    className="p-10 bg-white/5 border border-white/10 rounded-[3rem] hover:bg-white/[0.08] transition-all relative overflow-hidden group"
                                >
                                    <div className="absolute top-0 right-0 p-8 text-white/5 group-hover:text-bee-yellow/20 transition-colors">
                                        <ShieldCheck size={48} />
                                    </div>
                                    <div className="mb-6 flex items-center gap-2 text-[10px] font-black text-bee-yellow opacity-60 uppercase tracking-widest">
                                        <span className="w-1.5 h-1.5 rounded-full bg-bee-yellow" />
                                        {tip.category} Guide
                                    </div>
                                    <h4 className="text-2xl font-black mb-4 pr-10">{l(tip.title)}</h4>
                                    <p className="text-white/30 font-bold mb-8 leading-relaxed italic">{l(tip.desc)}</p>
                                    <button className="flex items-center gap-2 text-white/60 hover:text-bee-yellow text-xs font-black uppercase tracking-widest transition-colors">
                                        Learn More <ArrowRight size={14} />
                                    </button>
                                </motion.div>
                            ))}
                        </div>
                    </section>
                )}

                {/* Local FAQ Section */}
                {seoData.faqs.length > 0 && (
                    <section>
                        <div className="bg-white/5 border border-white/10 rounded-[4rem] p-12 md:p-20">
                            <h3 className="text-3xl font-black mb-16 text-center uppercase tracking-widest">Localized <span className="text-bee-yellow">FAQ</span> 🍯</h3>
                            <div className="space-y-10 max-w-2xl mx-auto">
                                {seoData.faqs.map((faq, idx) => (
                                    <motion.div 
                                        key={idx}
                                        initial={{ opacity: 0 }}
                                        whileInView={{ opacity: 1 }}
                                        viewport={{ once: true }}
                                        className="relative pl-12"
                                    >
                                        <div className="absolute left-0 top-0 text-3xl font-black text-bee-yellow opacity-40 italic">Q.</div>
                                        <h4 className="text-xl font-black mb-4 leading-tight">{faq.question}</h4>
                                        <p className="text-white/40 font-bold border-l-2 border-bee-yellow/20 pl-6 leading-relaxed">
                                            {l(faq.answer)}
                                        </p>
                                    </motion.div>
                                ))}
                            </div>
                        </div>
                    </section>
                )}

                {/* Return Home CTA */}
                <section className="mt-40 text-center">
                    <button 
                        onClick={() => navigate('/')}
                        className="group inline-flex items-center gap-4 px-12 py-6 bg-bee-yellow text-bee-black font-black rounded-full hover:scale-105 active:scale-95 transition-all shadow-xl shadow-bee-yellow/20"
                    >
                        <Navigation size={20} className="fill-bee-black" />
                        START YOUR JOURNEY NOW 💅
                        <ArrowRight className="group-hover:translate-x-2 transition-transform" size={20} />
                    </button>
                </section>
            </main>
        </div>
    );
};

export default BranchTipsPage;
