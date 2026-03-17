import React from 'react';
import { motion } from 'framer-motion';
import {
    X,
    Smartphone,
    Truck,
    Hotel,
    ShieldCheck,
    Clock,
    MapPin,
    Navigation,
    Sparkles,
    Compass,
    Star,
    BookOpen,
    ArrowRight,
    ChevronRight,
    Phone
} from "lucide-react";
import { LocationOption, ServiceType } from "../../types";
import BaggageCounter from './BaggageCounter';
import { SEO_LOCATIONS } from '../../src/constants/seoLocations';

interface BranchDetailsProps {
    t: any;
    lang: string;
    selectedBranch: LocationOption;
    onClose: () => void;
    currentService: 'SAME_DAY' | 'SCHEDULED' | 'STORAGE';
    onBook: (type: 'DELIVERY' | 'STORAGE') => void;
    bookingDate: string;
    onDateChange: (date: string) => void;
    baggageCounts: { S: number, M: number, L: number, XL: number };
    onBaggageChange: (size: 'S' | 'M' | 'L' | 'XL', delta: number) => void;
}

const BranchDetails: React.FC<BranchDetailsProps> = ({
    t, lang, selectedBranch, onClose, currentService, onBook, bookingDate, onDateChange, baggageCounts, onBaggageChange
}) => {
    if (!selectedBranch) return null;

    // Check service support directly from boolean flags
    const serviceKey = currentService === 'STORAGE' ? 'STORAGE' : 'DELIVERY';
    // [스봉이 수정] 지점 활성화 여부는 branch.isActive를 우선적으로 봐야죠! 💅
    const isActive = selectedBranch.isActive !== false;

    // Multilingual data access helper
    const getName = () => {
        if (lang === 'ko') return selectedBranch.name;
        const fieldSuffix = lang.replace('-', '_').toLowerCase();
        const key = `name_${fieldSuffix}` as keyof LocationOption;
        return (selectedBranch[key] as string) || selectedBranch.name_zh || selectedBranch.name_en || selectedBranch.name;
    };

    const getAddress = () => {
        if (lang === 'ko') return selectedBranch.address;
        const fieldSuffix = lang.replace('-', '_').toLowerCase();
        const key = `address_${fieldSuffix}` as keyof LocationOption;
        return (selectedBranch[key] as string) || selectedBranch.address_zh || selectedBranch.address_en || selectedBranch.address;
    };

    const getHours = () => {
        if (lang === 'ko') return selectedBranch.businessHours || '09:00 - 21:00';
        const fieldSuffix = lang.replace('-', '_').toLowerCase();
        const key = `businessHours_${fieldSuffix}` as keyof LocationOption;
        return (selectedBranch[key] as string) || selectedBranch.businessHours_zh || selectedBranch.businessHours_en || selectedBranch.businessHours || '09:00 - 21:00';
    };

    const handleGetDirections = () => {
        const address = getAddress();
        if (address) {
            window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`, '_blank');
        }
    };

    // 💅 [스봉이] 주변 관광지 가져오기 (지점 ID 기반 매칭)
    const seoLocation = SEO_LOCATIONS.find(loc => loc.relatedBranchIds.includes(selectedBranch.id));
    const nearbySpots = seoLocation?.touristSpots || [];

    return (
        <motion.div
            initial={{ y: '100%', opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: '100%', opacity: 0 }}
            transition={{ type: 'spring', damping: 30, stiffness: 250 }}
            className="fixed md:relative bottom-0 left-0 right-0 md:inset-auto z-[100] h-auto max-h-[95vh] bg-white/40 backdrop-blur-3xl md:backdrop-blur-none border-t border-white/20 md:border-none rounded-t-[2rem] md:rounded-[3rem] overflow-hidden flex flex-col pointer-events-auto"
        >
            <div className="bg-white/95 rounded-t-[2rem] md:rounded-[3rem] shadow-[0_-10px_40px_rgba(0,0,0,0.1)] md:shadow-2xl p-4 md:p-10 border-t md:border border-white/20 h-auto overflow-y-auto no-scrollbar backdrop-blur-3xl flex flex-col relative overflow-hidden">
                {/* Accent Background Shine */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[150%] h-32 bg-gradient-to-b from-bee-yellow/10 to-transparent pointer-events-none" />

                {/* Mobile Handle Bar */}
                <div className="w-full flex justify-center mb-4 md:hidden">
                    <div className="w-16 h-1 bg-gray-200/50 rounded-full" />
                </div>

                {/* Header - [스봉이 수정] 사장님 요청대로 중앙 정렬 및 몬세라트 💅 */}
                <div className="relative flex flex-col items-center mb-2 mt-2">
                    <div className="flex items-center gap-2 mb-2">
                        <span className="px-3 py-0.5 bg-bee-black text-bee-yellow text-[9px] md:text-[12px] font-black italic uppercase tracking-[0.2em] rounded-full shadow-lg font-montserrat">
                            {currentService !== 'STORAGE' ? 'Branch Info' : 'Storage Hub'}
                        </span>
                    </div>
                    <h2
                        onClick={handleGetDirections}
                        className="text-xl md:text-5xl font-black italic tracking-[-0.05em] leading-tight text-gray-900 text-center cursor-pointer hover:text-bee-yellow transition-all font-montserrat"
                        title={t.locations_page?.btn_get_directions || 'Get Directions'}
                    >
                        {getName()}
                    </h2>

                    <motion.button
                        whileHover={{ scale: 1.1, rotate: 90, backgroundColor: '#000', color: '#fff' }}
                        whileTap={{ scale: 0.9 }}
                        onClick={onClose}
                        className="absolute -top-2 -right-1 md:-top-4 md:-right-4 w-9 h-9 md:w-12 md:h-12 rounded-full bg-white/50 backdrop-blur-md flex items-center justify-center transition-all outline-none z-10 shadow-xl border border-white/50"
                    >
                        <X className="w-5 h-5 md:w-6 md:h-6" />
                    </motion.button>
                </div>

                {/* Info & Image Section - [스봉이 수정] 프리미엄 쉐입 💅 */}
                <div className="flex flex-row items-center gap-4 md:gap-12 py-3 md:py-12">
                    {/* Info List */}
                    <div className="flex-1 space-y-4">
                        {/* Address */}
                        <div className="flex items-start gap-3 group">
                            <div className="w-8 h-8 md:w-12 md:h-12 rounded-xl md:rounded-2xl bg-white shadow-md md:shadow-xl flex items-center justify-center group-hover:bg-bee-yellow transition-all shrink-0 border border-gray-50">
                                <MapPin className="w-4 h-4 md:w-5 md:h-5 text-gray-300 group-hover:text-bee-black" />
                            </div>
                            <div>
                                <div className="text-[8px] md:text-[11px] font-black text-gray-300 uppercase tracking-[0.15em] mb-0.5 font-montserrat">Address</div>
                                <div className="text-[11px] md:text-[18px] font-bold text-gray-600 leading-tight group-hover:text-gray-900 transition-colors line-clamp-2">{getAddress()}</div>
                            </div>
                        </div>

                        {/* Hours */}
                        <div className="flex items-start gap-3 group">
                            <div className="w-8 h-8 md:w-12 md:h-12 rounded-xl md:rounded-2xl bg-white shadow-md md:shadow-xl flex items-center justify-center group-hover:bg-bee-yellow transition-all shrink-0 border border-gray-50">
                                <Clock className="w-4 h-4 md:w-5 md:h-5 text-gray-300 group-hover:text-bee-black" />
                            </div>
                            <div>
                                <div className="text-[8px] md:text-[11px] font-black text-gray-300 uppercase tracking-[0.15em] mb-0.5 font-montserrat">Hours</div>
                                <div className="text-[11px] md:text-[18px] font-bold text-gray-600 leading-tight group-hover:text-gray-900 transition-colors">{getHours()}</div>
                            </div>
                        </div>
                    </div>

                    {/* Branch Image - Compact for Mobile + Loading Optimization 💅 */}
                    {selectedBranch.imageUrl && (
                        <div className="w-20 h-20 md:w-64 md:h-64 shrink-0 rounded-[1.5rem] md:rounded-[6rem] overflow-hidden shadow-lg md:shadow-[0_20px_50px_rgba(0,0,0,0.2)] border-2 md:border-8 border-white bg-gray-50/50 group relative">
                            <img
                                src={selectedBranch.imageUrl}
                                alt={getName()}
                                fetchPriority="high"
                                decoding="async"
                                className="w-full h-full object-cover transition-transform duration-[1.5s] group-hover:scale-125"
                                onError={(e) => {
                                    const target = e.currentTarget as HTMLImageElement;
                                    if (target && target.parentElement) {
                                        target.style.display = 'none';
                                        target.parentElement.style.display = 'none';
                                    }
                                }}
                            />
                        </div>
                    )}
                </div>

                {/* Nearby Hotspots Section - 💅 [스봉이] 사장님, 여기 분위기 좀 보실래요? ✨ */}
                {nearbySpots.length > 0 && (
                    <div className="mb-6 md:mb-10 px-1">
                        <div className="flex items-center gap-2 mb-4">
                            <Sparkles className="w-3.5 h-3.5 md:w-5 md:h-5 text-bee-yellow fill-bee-yellow" />
                            <span className="text-[10px] md:text-[14px] font-black italic uppercase tracking-[0.1em] text-bee-black font-montserrat">
                                {lang === 'ko' ? '주변 추천 명소' : 'Nearby Hotspots'}
                            </span>
                        </div>
                        <div className="grid grid-cols-1 gap-2 md:gap-3">
                            {nearbySpots.map((spot, idx) => (
                                <motion.div
                                    key={spot.id}
                                    initial={{ opacity: 0, x: -10 }}
                                    whileInView={{ opacity: 1, x: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ delay: 0.1 * idx }}
                                    className="group/spot p-3 md:p-5 rounded-2xl md:rounded-[2rem] bg-gray-50/50 border border-gray-100 hover:border-bee-yellow transition-all flex items-start gap-3 md:gap-5"
                                >
                                    <div className="w-8 h-8 md:w-12 md:h-12 rounded-xl bg-white shadow-sm flex items-center justify-center shrink-0 group-hover/spot:rotate-12 transition-transform">
                                        {spot.category === 'landmark' ? <Star className="w-4 h-4 md:w-5 md:h-5 text-orange-400" /> : <Compass className="w-4 h-4 md:w-5 md:h-5 text-blue-400" />}
                                    </div>
                                    <div className="flex-1 min-w-0 text-left">
                                        <h4 className="text-[12px] md:text-[18px] font-black text-gray-900 mb-0.5 md:mb-1">
                                            {(spot.name as any)[lang] || spot.name.ko}
                                        </h4>
                                        <p className="text-[10px] md:text-[14px] text-gray-500 leading-snug line-clamp-2">
                                            {(spot.description as any)[lang] || spot.description.ko}
                                        </p>
                                    </div>
                                    <ChevronRight className="w-4 h-4 md:w-6 md:h-6 text-gray-200 group-hover/spot:text-bee-yellow transition-colors self-center" />
                                </motion.div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Actions Section - [스봉이] 스포츠카 시트처럼 쫀쫀하게! 💅 */}
                <div className="flex flex-row gap-2 pt-3 md:pt-8 border-t border-gray-100">
                    <motion.button
                        whileHover={isActive ? { scale: 1.02, y: -2 } : {}}
                        whileTap={isActive ? { scale: 0.98 } : {}}
                        onClick={() => onBook(serviceKey)}
                        disabled={!isActive}
                        className={`flex-[3] py-3.5 md:py-8 rounded-full flex items-center justify-center gap-2 text-[12px] md:text-[20px] font-black italic uppercase tracking-[0.05em] transition-all shadow-xl font-montserrat ${isActive
                            ? 'bg-bee-black text-bee-yellow hover:bg-bee-black/90'
                            : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                            }`}
                    >
                        <span>{t.locations_page?.info_card_book || 'RESERVE'}</span>
                        <ArrowRight className="w-4 h-4 md:w-8 md:h-8" />
                    </motion.button>

                    {/* Secondary: Get Directions */}
                    <motion.button
                        whileHover={{ scale: 1.02, backgroundColor: '#f9fafb' }}
                        whileTap={{ scale: 0.98 }}
                        onClick={handleGetDirections}
                        className="flex-1 py-3.5 md:py-8 rounded-full flex items-center justify-center gap-2 text-[9px] md:text-[15px] font-black italic uppercase tracking-[0.05em] text-gray-400 border border-gray-100 hover:border-bee-yellow transition-all font-montserrat"
                    >
                        <Navigation className="w-3.5 h-3.5 md:w-6 md:h-6" />
                        <span className="hidden xs:inline">GO</span>
                    </motion.button>
                </div>

                {/* 💅 [스봉이] 사장님이 지점 상세 가이드를 못 찾으실까 봐 링크를 딱! 심어드렸어요. ✨ */}
                <div className="mt-10 pt-8 border-t border-gray-100 flex flex-col gap-4">
                    {seoLocation && (
                        <motion.button
                            initial={{ opacity: 0, x: -10 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            onClick={() => {
                                window.location.href = `/tips/${seoLocation.slug}`;
                            }}
                            className="w-full py-5 bg-bee-yellow text-bee-black border border-bee-yellow rounded-[2rem] flex items-center justify-center gap-3 group hover:bg-bee-black hover:text-bee-yellow hover:border-bee-black transition-all shadow-xl shadow-bee-yellow/20"
                        >
                            <Navigation className="w-5 h-5 fill-current" />
                            <span className="text-sm font-black uppercase tracking-[0.1em]">{lang === 'ko' ? '인터랙티브 팁스 지도 탐색 💅' : 'Explore with Smart Tips Map 💅'}</span>
                            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                        </motion.button>
                    )}

                    <button
                        onClick={() => {
                            const slug = selectedBranch.name.toLowerCase().replace(/\s+/g, '-');
                            window.location.href = `/storage/${slug}`;
                        }}
                        className="w-full py-4 bg-gray-50 border border-gray-200 rounded-2xl flex items-center justify-center gap-3 group hover:bg-bee-black hover:text-white hover:border-bee-black transition-all"
                    >
                        <BookOpen className="w-4 h-4" />
                        <span className="text-xs font-black uppercase tracking-widest text-gray-400 group-hover:text-white">{lang === 'ko' ? '이 지점의 전체 가이드 보기' : 'View Full Guide for this Branch'}</span>
                        <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
                    </button>
                </div>

                {!isActive && (
                    <p className="text-center text-[10px] font-bold text-red-500 mt-2">
                        {t.locations_page?.currently_closed || 'Currently closed at this branch.'}
                    </p>
                )}
            </div>
        </motion.div>
    );
};

export default React.memo(BranchDetails);
