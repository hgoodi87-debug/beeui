import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { BookOpen, Sparkles, Map, ChevronLeft, ArrowRight, X, Clock, MapPin, ShieldCheck, Navigation } from 'lucide-react';
import SEO from './SEO';
import { TRAVEL_TIPS, TravelTip } from '../src/constants/travelTips';
import { calculateDistance, formatDistance } from '../utils/locationUtils';

const DetailPanel: React.FC<{ tip: TravelTip | null; lang: string; onClose: () => void }> = ({ tip, lang, onClose }) => {
    if (!tip) return null;

    return (
        <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed inset-y-0 right-0 z-[200] w-full max-w-2xl bg-black/95 backdrop-blur-3xl border-l border-white/10 shadow-2xl p-8 md:p-12 overflow-y-auto"
        >
            <button 
                onClick={onClose}
                className="absolute top-8 right-8 w-12 h-12 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/10 transition-colors"
                title="Close Intelligence"
            >
                <X size={24} />
            </button>

            <div className="pt-20">
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-bee-yellow/10 text-bee-yellow border border-bee-yellow/20 rounded-full mb-8 text-[10px] font-black uppercase tracking-widest">
                    {tip.category === 'service' && <ShieldCheck size={12} />}
                    {tip.category === 'spot' && <MapPin size={12} />}
                    {tip.category === 'guide' && <Clock size={12} />}
                    {tip.category}
                </div>
                
                <h2 className="text-4xl md:text-5xl font-black mb-8 leading-tight italic uppercase tracking-tighter">
                    {tip.title[lang as keyof typeof tip.title] || tip.title['ko']}
                </h2>

                <div className="prose prose-invert max-w-none">
                    <p className="text-xl text-white/60 font-medium leading-relaxed mb-12">
                        {tip.desc[lang as keyof typeof tip.desc] || tip.desc['ko']}
                    </p>
                    
                    <div className="space-y-8 text-white/80 leading-relaxed text-lg">
                        {tip.content ? (
                            <p>{tip.content[lang as keyof typeof tip.content] || tip.content['ko']}</p>
                        ) : (
                            <div className="p-8 border border-dashed border-white/10 rounded-3xl text-center">
                                <Sparkles className="mx-auto mb-4 text-bee-yellow" />
                                <p className="text-sm font-bold opacity-40">More deep-dive content is being curated for this guide. ✨</p>
                            </div>
                        )}
                    </div>
                </div>

                <div className="mt-20">
                    <button 
                        onClick={() => window.location.href = '/booking'}
                        className="w-full py-6 bg-bee-yellow text-bee-black rounded-3xl font-black uppercase tracking-widest text-sm flex items-center justify-center gap-3 hover:scale-[1.02] transition-transform active:scale-95"
                    >
                        Try Beeliber Service <ArrowRight size={18} />
                    </button>
                </div>
            </div>
        </motion.div>
    );
};

const TravelTips: React.FC<{ lang: string }> = ({ lang }) => {
    const navigate = useNavigate();
    const [selectedTip, setSelectedTip] = useState<TravelTip | null>(null);
    const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);

    // 💅 [스봉이] 사장님의 위치를 마법처럼 감지하는 중...
    React.useEffect(() => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    setUserLocation({
                        lat: position.coords.latitude,
                        lng: position.coords.longitude
                    });
                },
                (error) => console.warn("[스봉이] 위치 감지 실패.. 🙄", error),
                { timeout: 10000 }
            );
        }
    }, []);

    const tips = React.useMemo(() => {
        let sorted = [...TRAVEL_TIPS];
        if (userLocation) {
            sorted = sorted.map(tip => {
                if (tip.coordinates) {
                    const dist = calculateDistance(userLocation.lat, userLocation.lng, tip.coordinates.lat, tip.coordinates.lng);
                    return { ...tip, distance: dist };
                }
                return { ...tip, distance: 9999 }; // 좌표 없는 건 뒤로! 💅
            });
            sorted.sort((a, b) => (a as any).distance - (b as any).distance);
        }
        return sorted;
    }, [userLocation]);

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1
            }
        }
    };

    const cardVariants = {
        hidden: { opacity: 0, y: 30 },
        visible: { opacity: 1, y: 0 }
    };

    return (
        <div className="min-h-screen bg-black text-white selection:bg-bee-yellow selection:text-bee-black">
            <SEO 
                title="서울 여행 팁 & 가이드 | Beeliber 핸즈프리 여행 💅"
                description="서울 여행의 질을 높여주는 짐 보관, 배송 팁부터 핫플레이스 가이드까지. Beeliber와 함께 가방 없이 자유롭게 여행하세요."
                path="/tips"
                ogType="article"
            />

            <nav className="fixed top-0 inset-x-0 z-[100] px-4 py-4">
                <div className="max-w-4xl mx-auto flex justify-between items-center backdrop-blur-xl bg-white/5 border border-white/10 rounded-full px-6 py-2 shadow-2xl">
                    <button onClick={() => navigate('/')} className="flex items-center gap-2 group">
                        <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center group-hover:bg-bee-yellow group-hover:text-bee-black transition-all">
                            <ChevronLeft size={18} />
                        </div>
                        <span className="text-[10px] font-black uppercase tracking-widest hidden sm:block">Beeliber</span>
                    </button>
                    <div className="flex items-center gap-1 cursor-pointer" onClick={() => navigate('/')}>
                        <span className="text-xl font-black italic">bee</span>
                        <span className="text-xl font-black italic text-bee-yellow">liber</span>
                    </div>
                    <button className="px-5 py-2 bg-bee-yellow/10 text-bee-yellow text-[10px] font-black uppercase tracking-wider rounded-full border border-bee-yellow/20">
                        Content Hub
                    </button>
                </div>
            </nav>

            <header className="pt-40 pb-20 px-6 text-center overflow-hidden">
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="inline-flex items-center gap-2 px-4 py-1.5 bg-bee-yellow/10 text-bee-yellow border border-bee-yellow/20 rounded-full mb-8"
                >
                    <Sparkles size={12} />
                    <span className="text-[10px] font-black uppercase tracking-[0.2em]">Travel Smarter</span>
                </motion.div>
                <motion.h1 
                    initial={{ y: 50, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    className="text-6xl md:text-8xl font-black mb-6 uppercase tracking-tighter leading-none italic"
                >
                    Seoul <span className="text-bee-yellow">Travel Tips</span> 💅
                </motion.h1>
                <motion.p 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3 }}
                    className="text-white/40 font-bold text-lg md:text-xl max-w-xl mx-auto"
                >
                    Beeliber curated guides for a premium, luggage-free experience in Korea.
                </motion.p>
            </header>

            <motion.main 
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                className="max-w-6xl mx-auto px-6 pb-40"
            >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {tips.map((tip) => (
                        <motion.article
                            key={tip.id}
                            variants={cardVariants}
                            whileHover={{ y: -10 }}
                            className="group p-10 bg-white/5 border border-white/10 rounded-[3rem] hover:bg-white/10 hover:border-bee-yellow/30 transition-all cursor-pointer relative overflow-hidden flex flex-col justify-between min-h-[400px]"
                            onClick={() => setSelectedTip(tip)}
                        >
                            <div className="absolute top-0 right-0 p-8 text-white/5 group-hover:text-bee-yellow/20 transition-colors pointer-events-none">
                                {tip.category === 'service' && <ShieldCheck size={120} />}
                                {tip.category === 'spot' && <MapPin size={120} />}
                                {tip.category === 'guide' && <Clock size={120} />}
                            </div>
                            
                            <div>
                                <div className="mb-6 flex items-center justify-between">
                                    <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-bee-yellow opacity-60 group-hover:opacity-100 transition-opacity">
                                        <span className="w-1.5 h-1.5 rounded-full bg-bee-yellow" />
                                        {tip.category}
                                    </div>
                                    {(tip as any).distance && (tip as any).distance < 1000 && (
                                        <div className="flex items-center gap-1.5 px-3 py-1 bg-white/5 rounded-full border border-white/10 group-hover:border-bee-yellow/50 transition-colors">
                                            <Navigation size={10} className="text-bee-yellow" />
                                            <span className="text-[10px] font-black text-white/60 group-hover:text-bee-yellow transition-colors">
                                                {formatDistance((tip as any).distance, lang)}
                                            </span>
                                        </div>
                                    )}
                                </div>
                                <h2 className="text-3xl font-black mb-4 pr-10 leading-tight group-hover:text-bee-yellow transition-colors">
                                    {tip.title[lang as keyof typeof tip.title] || tip.title['ko']}
                                </h2>
                                <p className="text-white/40 font-bold mb-8 leading-relaxed max-w-md">
                                    {tip.desc[lang as keyof typeof tip.desc] || tip.desc['ko']}
                                </p>
                            </div>

                            <div className="flex items-center gap-2 text-bee-yellow text-xs font-black uppercase tracking-widest mt-auto">
                                View Intelligence <ArrowRight size={14} className="group-hover:translate-x-2 transition-transform" />
                            </div>
                        </motion.article>
                    ))}
                    
                    {/* Coming Soon Card */}
                    <div className="p-10 border border-dashed border-white/10 rounded-[3rem] flex flex-col items-center justify-center text-center opacity-40">
                        <Map className="mb-6 text-white/20" size={48} />
                        <h3 className="font-black mb-3 uppercase tracking-[0.2em] text-sm italic">Expanding Intelligence</h3>
                        <p className="text-[11px] font-bold text-white/30 max-w-[200px]">We are constantly curating the most premium Seoul travel experiences for our guests.</p>
                    </div>
                </div>
            </motion.main>

            {/* Slide-over Detail Panel */}
            <AnimatePresence>
                {selectedTip && (
                    <>
                        <motion.div 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setSelectedTip(null)}
                            className="fixed inset-0 z-[150] bg-black/60 backdrop-blur-sm"
                        />
                        <DetailPanel 
                            tip={selectedTip} 
                            lang={lang} 
                            onClose={() => setSelectedTip(null)} 
                        />
                    </>
                )}
            </AnimatePresence>

            <footer className="py-20 border-t border-white/5 text-center">
                <p className="text-[10px] font-black uppercase tracking-[0.5em] text-white/20">
                    &copy; 2026 Beeliber Intelligence Hub. All rights reserved.
                </p>
            </footer>
        </div>
    );
};

export default TravelTips;
