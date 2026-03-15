import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Sparkles, Navigation, X, ArrowRight, MapPin, Building2, Map as MapIcon, Info } from 'lucide-react';
import SEO from './SEO';
import { TRAVEL_TIPS, TravelTip } from '../src/constants/travelTips';
import { LOCATIONS } from '../constants';
import TipsMap from './tips/TipsMap';

// Distance calculation helper (Haversine formula)
const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371; // Radius of the earth in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
        Math.sin(dLat/2) * Math.sin(dLat/2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
        Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c; // Distance in km
};

const BottomSheet: React.FC<{ 
    item: any | null; 
    lang: string; 
    onClose: () => void;
    activeBranches: any[];
}> = ({ item, lang, onClose, activeBranches }) => {
    if (!item) return null;

    const isBranch = !!item.shortCode;
    const itemTitle = item.title as { [key: string]: string } | undefined;
    const itemDesc = item.desc as { [key: string]: string } | undefined;
    const itemContent = item.content as { [key: string]: string } | undefined;

    const title = isBranch ? (item[`name_${lang}`] || item.name) : (itemTitle?.[lang] || itemTitle?.['ko'] || '');
    const description = isBranch ? (item[`description_${lang}`] || item.description) : (itemDesc?.[lang] || itemDesc?.['ko'] || '');

    // Find nearest branch if the selected item is a landmark
    const nearestBranch = useMemo(() => {
        if (isBranch || !item.coordinates) return null;
        
        const sorted = [...activeBranches].map(branch => ({
            ...branch,
            distance: calculateDistance(
                item.coordinates.lat, 
                item.coordinates.lng,
                branch.lat,
                branch.lng
            )
        })).sort((a, b) => a.distance - b.distance);
        
        return sorted[0];
    }, [item, isBranch, activeBranches]);

    return (
        <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed inset-x-0 bottom-0 z-[200] max-w-4xl mx-auto"
        >
            <div className="bg-black/95 backdrop-blur-3xl border-t border-white/10 rounded-t-[3rem] p-8 md:p-12 shadow-[0_-20px_50px_rgba(0,0,0,0.5)]">
                <div className="w-16 h-1.5 bg-white/10 rounded-full mx-auto mb-8" />
                
                <button 
                    onClick={onClose}
                    aria-label="Close"
                    className="absolute top-8 right-8 w-12 h-12 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/10 transition-colors"
                >
                    <X size={20} />
                </button>

                <div className="flex flex-col md:flex-row gap-8 items-start">
                    <div className="flex-1">
                        <div className="inline-flex items-center gap-2 px-3 py-1 bg-bee-yellow/10 text-bee-yellow border border-bee-yellow/20 rounded-full mb-6">
                            {isBranch ? <Building2 size={12} /> : <MapPin size={12} />}
                            <span className="text-[10px] font-black uppercase tracking-widest">
                                {isBranch ? 'Beeliber Hub' : 'Seoul Landmark'}
                            </span>
                        </div>
                        
                        <h2 className="text-3xl md:text-5xl font-black mb-6 leading-tight italic uppercase tracking-tighter">
                            {title}
                        </h2>

                        <p className="text-lg text-white/60 font-medium leading-relaxed mb-8">
                            {description}
                        </p>

                        {!isBranch && nearestBranch && (
                            <motion.div 
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="p-6 bg-bee-yellow/5 border border-bee-yellow/20 rounded-[2rem] mb-8"
                            >
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="p-2 bg-bee-yellow text-bee-black rounded-lg">
                                        <Building2 size={16} />
                                    </div>
                                    <div>
                                        <h4 className="text-xs font-black uppercase tracking-widest text-bee-yellow">Recommended Hub</h4>
                                        <p className="text-sm font-bold">{nearestBranch[`name_${lang}`] || nearestBranch.name}</p>
                                    </div>
                                    <div className="ml-auto text-[10px] font-black bg-bee-yellow/20 text-bee-yellow px-2 py-1 rounded">
                                        {nearestBranch.distance.toFixed(1)}km Away
                                    </div>
                                </div>
                                <p className="text-xs text-white/40 leading-relaxed mb-4">
                                    맡겨진 짐은 이 지점에서 안전하게 보관됩니다. 명소를 즐기신 후 여기서 짐을 찾으시거나, 호텔로 바로 배송 신청하세요. 💅
                                </p>
                                <button 
                                    onClick={() => window.location.href = `/booking?branch=${nearestBranch.id}`}
                                    className="text-[10px] font-black text-bee-yellow uppercase border-b border-bee-yellow/30 pb-1 hover:border-bee-yellow transition-all"
                                >
                                    Select This Hub
                                </button>
                            </motion.div>
                        )}
                    </div>

                    <div className="w-full md:w-72 space-y-4">
                        <button 
                            onClick={() => window.location.href = isBranch ? `/booking?branch=${item.id}` : '/booking'}
                            className="w-full py-5 bg-bee-yellow text-bee-black rounded-2xl font-black uppercase tracking-widest text-xs flex items-center justify-center gap-3 hover:scale-[1.02] transition-transform active:scale-95"
                        >
                            {isBranch ? 'Drop Luggage Here' : 'Go Hands-free'} <ArrowRight size={16} />
                        </button>
                        
                        {isBranch && (
                            <div className="p-5 bg-white/5 rounded-2xl border border-white/10">
                                <div className="text-[10px] font-black text-white/30 uppercase tracking-widest mb-2">Business Hours</div>
                                <div className="text-sm font-bold text-bee-yellow">{item.businessHours || '09:00 - 21:00'}</div>
                            </div>
                        )}
                        
                        <div className="p-5 bg-white/5 rounded-2xl border border-white/5 flex items-center gap-4">
                            <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center">
                                <Info size={16} className="text-white/40" />
                            </div>
                            <div className="text-[10px] text-white/40 font-bold leading-tight">
                                Real-time availability checked by 스봉이 💅
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </motion.div>
    );
};

const TravelTips: React.FC<{ lang: string }> = ({ lang }) => {
    const navigate = useNavigate();
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);

    useEffect(() => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (pos) => setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
                (err) => console.warn("[스봉이] 위치 권한을 주시면 더 스마트한 안내가 가능해요 💅", err),
                { timeout: 10000 }
            );
        }
    }, []);

    const landmarks = TRAVEL_TIPS.filter(tip => tip.category === 'spot');
    const activeBranches = useMemo(() => LOCATIONS.filter(l => l.isActive !== false), []);

    const selectedItem = useMemo(() => {
        if (!selectedId) return null;
        return [...landmarks, ...activeBranches].find(i => i.id === selectedId);
    }, [selectedId, landmarks, activeBranches]);

    return (
        <div className="h-screen bg-black text-white selection:bg-bee-yellow selection:text-bee-black overflow-hidden flex flex-col">
            <SEO 
                title="지능형 서울 여행 가이드 | Beeliber Intelligence 💅"
                description="주변 핫플레이스와 비리버 지점을 지능적으로 연결합니다. 짐 걱정 없는 완벽한 서울 여행을 시작하세요."
                path="/tips"
            />

            {/* Premium Header Nav */}
            <nav className="fixed top-0 inset-x-0 z-[100] px-4 py-6 pointer-events-none">
                <div className="max-w-6xl mx-auto flex justify-between items-center pointer-events-auto">
                    <button onClick={() => navigate('/')} className="flex items-center gap-3 px-5 py-3 backdrop-blur-xl bg-black/50 border border-white/10 rounded-2xl group active:scale-95 transition-all">
                        <ChevronLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
                        <span className="text-[10px] font-black uppercase tracking-widest">Back</span>
                    </button>
                    
                    <div className="hidden md:flex items-center gap-6 px-8 py-3 backdrop-blur-xl bg-black/50 border border-white/10 rounded-2xl shadow-2xl">
                        <div className="flex items-center gap-2">
                            <MapIcon size={14} className="text-bee-yellow" />
                            <span className="text-[10px] font-black uppercase tracking-[0.2em]">Intelligence Hub</span>
                        </div>
                        <div className="w-px h-4 bg-white/10" />
                        <div className="flex items-center gap-1">
                            <span className="text-xl font-black italic">bee</span>
                            <span className="text-xl font-black italic text-bee-yellow">liber</span>
                        </div>
                    </div>

                    <div className="px-5 py-3 backdrop-blur-xl bg-bee-yellow/10 border border-bee-yellow/20 rounded-2xl">
                        <div className="flex items-center gap-2">
                            <Sparkles size={12} className="text-bee-yellow" />
                            <span className="text-[10px] font-black uppercase tracking-widest text-bee-yellow">Seoul Live</span>
                        </div>
                    </div>
                </div>
            </nav>

            {/* Main Interactive View */}
            <main className="flex-1 relative">
                <TipsMap 
                    lang={lang}
                    landmarks={landmarks}
                    branches={activeBranches}
                    selectedId={selectedId}
                    onSelect={(item) => setSelectedId(item.id)}
                    userLocation={userLocation}
                />

                {/* Left Floating Info Hub (Desktop Only) */}
                <div className="absolute top-28 left-6 z-10 hidden lg:block w-80 space-y-4">
                    <motion.div 
                        initial={{ x: -50, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        className="p-8 bg-black/60 backdrop-blur-2xl border border-white/10 rounded-[2.5rem] shadow-2xl"
                    >
                        <h1 className="text-4xl font-black italic leading-none mb-4 uppercase tracking-tighter">
                            Seoul <span className="text-bee-yellow">Compass</span> 💅
                        </h1>
                        <p className="text-xs font-bold text-white/40 leading-relaxed">
                            Discover the trendiest spots in Seoul and find the nearest Beeliber Hub to drop your heavy bags instantly. 
                        </p>
                    </motion.div>

                    <div className="flex flex-col gap-2">
                        {landmarks.slice(0, 5).map(spot => (
                            <button
                                key={spot.id}
                                onClick={() => setSelectedId(spot.id)}
                                className={`px-6 py-4 flex items-center justify-between bg-black/40 backdrop-blur-xl border rounded-[1.5rem] transition-all text-left ${selectedId === spot.id ? 'border-bee-yellow text-bee-yellow ring-2 ring-bee-yellow/20' : 'border-white/5 text-white/40 hover:border-white/20'}`}
                            >
                                <span className="text-[10px] font-black uppercase tracking-widest">{spot.title[lang] || spot.title['ko']}</span>
                                <Navigation size={12} className={selectedId === spot.id ? 'opacity-100' : 'opacity-20'} />
                            </button>
                        ))}
                    </div>
                </div>

                {/* Legend Overlay */}
                <div className="absolute bottom-12 left-1/2 -translate-x-1/2 z-10 flex gap-4 px-6 py-3 backdrop-blur-xl bg-black/50 border border-white/10 rounded-full shadow-2xl">
                    <div className="flex items-center gap-2 text-[9px] font-black uppercase tracking-widest text-white/60">
                        <div className="w-2 h-2 rounded-full bg-bee-yellow" /> Beeliber Hub
                    </div>
                    <div className="w-px h-3 bg-white/20" />
                    <div className="flex items-center gap-2 text-[9px] font-black uppercase tracking-widest text-white/60">
                        <div className="w-2 h-2 rounded-full bg-white border border-bee-yellow" /> Landmark
                    </div>
                </div>
            </main>

            {/* Bottom Sheet Intelligence */}
            <AnimatePresence>
                {selectedId && (
                    <>
                        <motion.div 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setSelectedId(null)}
                            className="fixed inset-0 z-[150] bg-black/40 backdrop-blur-sm md:hidden"
                        />
                        <BottomSheet 
                            item={selectedItem}
                            lang={lang}
                            onClose={() => setSelectedId(null)}
                            activeBranches={activeBranches}
                        />
                    </>
                )}
            </AnimatePresence>
        </div>
    );
};

export default TravelTips;
