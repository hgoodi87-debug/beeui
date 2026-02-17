
import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, MapPin, Navigation, Plane, Store, Calendar, Wallet, Luggage, Handshake } from "lucide-react";
import BaggageCounter from './BaggageCounter';

interface LocationListProps {
    t: any;
    lang: string;
    searchTerm: string;
    onSearchChange: (val: string) => void;
    filteredBranches: any[];
    selectedBranch: any;
    onBranchClick: (branch: any) => void;
    currentService: 'SAME_DAY' | 'SCHEDULED' | 'STORAGE';
    onServiceChange: (service: 'SAME_DAY' | 'SCHEDULED' | 'STORAGE') => void;
    onReset: () => void;
    bookingDate?: string;
    onDateChange?: (date: string) => void;
    bookingTime?: string;
    onTimeChange?: (time: string) => void;
    baggageCounts: any;
    onBaggageChange: (size: 'S' | 'M' | 'L' | 'XL', delta: number) => void;
    selectedCategory?: 'ALL' | 'AIRPORT' | 'PARTNER';
    onCategoryChange?: (category: 'ALL' | 'AIRPORT' | 'PARTNER') => void;
}

const LocationList: React.FC<LocationListProps> = ({
    t, lang, searchTerm, onSearchChange, filteredBranches, selectedBranch, onBranchClick, currentService, onServiceChange, onReset,
    bookingDate, onDateChange, bookingTime, onTimeChange, baggageCounts, onBaggageChange,
    selectedCategory = 'ALL', onCategoryChange
}) => {
    const [isBaggagePopupOpen, setIsBaggagePopupOpen] = React.useState(false);

    return (
        <div className="flex flex-col h-full bg-transparent md:bg-white/80 md:backdrop-blur-2xl border-r border-gray-100/50 shadow-[20px_0_50px_rgba(0,0,0,0.02)] relative z-20 overflow-hidden pointer-events-none md:pointer-events-auto select-none">
            {/* Header / Search Area - Mobile: Top Card */}
            <div className="p-4 md:p-6 bg-white shrink-0 rounded-b-3xl md:rounded-none shadow-xl md:shadow-none pointer-events-auto">
                <div onClick={onReset} className="inline-flex items-center gap-3 mb-6 md:mb-8 cursor-pointer group">
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gray-50 group-hover:bg-bee-yellow transition-colors md:hidden">
                        <i className="fa-solid fa-chevron-left text-xs text-gray-900"></i>
                    </div>
                    <div className="flex flex-col">
                        <span className="text-[8px] font-black tracking-[0.3em] text-bee-yellow uppercase leading-tight mb-0.5">
                            {t.locations_page?.sidebar_title || 'Global Network'}
                        </span>
                        <h1 className="text-base md:text-3xl font-black tracking-tighter text-gray-900 leading-tight">
                            {t.locations_page?.sidebar_subtitle || 'Service Points'}
                        </h1>
                    </div>
                </div>

                {/* Header Controls - [스봉이 수정] 사장님 요청: 전 부 다 한 줄 에 💅 */}
                <div className="flex items-center gap-1.5 mb-4 md:mb-6 overflow-x-auto no-scrollbar py-1">
                    {/* 1. Service Switcher (Very Compact) */}
                    <div className="flex bg-gray-100 p-0.5 rounded-xl shrink-0">
                        {['DELIVERY', 'STORAGE'].map((type) => {
                            const isCurrent = type === 'DELIVERY' ? (currentService === 'SAME_DAY' || currentService === 'SCHEDULED') : currentService === 'STORAGE';
                            return (
                                <button
                                    key={type}
                                    onClick={() => onServiceChange(type === 'DELIVERY' ? 'SAME_DAY' : 'STORAGE')}
                                    className={`px-3 py-2 rounded-lg text-[9px] font-black tracking-tight uppercase transition-all relative z-10 ${isCurrent ? 'text-bee-black' : 'text-gray-400'}`}
                                >
                                    <span className="relative z-10">
                                        {type === 'DELIVERY' ? (t.locations_page?.badge_delivery || 'DEL') : (t.locations_page?.badge_storage || 'STG')}
                                    </span>
                                    {isCurrent && (
                                        <motion.div layoutId="service-bg-compact" className="absolute inset-0 bg-bee-yellow rounded-lg shadow-sm" />
                                    )}
                                </button>
                            );
                        })}
                    </div>

                    {/* 2. Date & Time Combined (Compact) */}
                    <div className="flex-1 flex items-center gap-1 bg-gray-100 p-1 rounded-xl min-w-[140px]">
                        <div className="relative flex-1">
                            <Calendar className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-400" />
                            <input
                                type="date"
                                value={bookingDate}
                                onChange={(e) => onDateChange(e.target.value)}
                                className="w-full pl-6 pr-1 py-1.5 bg-transparent text-[10px] font-black text-gray-900 outline-none cursor-pointer"
                            />
                        </div>
                        <div className="w-[1px] h-3 bg-gray-200" />
                        <select
                            value={bookingTime || '09:00'}
                            onChange={(e) => onTimeChange?.(e.target.value)}
                            className="bg-transparent text-[10px] font-black text-gray-900 outline-none cursor-pointer px-1 py-1.5"
                        >
                            {(currentService === 'STORAGE' ? ['09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00'] : ['09:00', '10:00', '11:00', '12:00', '13:00']).map(h => (
                                <option key={h} value={h}>{h}</option>
                            ))}
                        </select>
                    </div>

                    {/* 3. Baggage Counter (Compact) */}
                    <div className="relative shrink-0">
                        <button
                            onClick={() => setIsBaggagePopupOpen(!isBaggagePopupOpen)}
                            className="px-3 py-2 flex items-center gap-1.5 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors border border-gray-100"
                        >
                            <Luggage className="w-3.5 h-3.5 text-gray-500" />
                            <span className="text-[10px] font-black text-gray-900">
                                {Object.values(baggageCounts as Record<string, number>).reduce((a, b) => a + b, 0)}
                            </span>
                        </button>

                        <AnimatePresence>
                            {isBaggagePopupOpen && (
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.95, y: 10 }}
                                    animate={{ opacity: 1, scale: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.95, y: 10 }}
                                    className="fixed md:absolute top-[180px] md:top-full right-4 md:right-0 mt-2 w-[280px] md:w-80 bg-white rounded-[2rem] shadow-2xl border border-gray-100 p-6 z-[100]"
                                >
                                    <BaggageCounter
                                        t={t}
                                        baggageCounts={baggageCounts}
                                        onCountChange={onBaggageChange}
                                        onConfirm={() => setIsBaggagePopupOpen(false)}
                                    />
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>

                <div className="relative group hidden md:block">
                    <div className="absolute inset-0 bg-bee-yellow/5 rounded-2xl blur-xl group-focus-within:bg-bee-yellow/10 transition-all opacity-0 group-focus-within:opacity-100" />
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-bee-yellow transition-colors relative z-10" />
                    <input
                        type="text"
                        placeholder={t.locations_page?.search_placeholder || "Find a branch..."}
                        value={searchTerm}
                        onChange={(e) => onSearchChange(e.target.value)}
                        className="w-full pl-12 pr-4 py-3 md:py-4 bg-gray-50/50 border border-gray-100/80 rounded-2xl text-xs md:text-sm font-bold focus:outline-none focus:ring-4 focus:ring-bee-yellow/10 focus:border-bee-yellow transition-all shadow-inner relative z-10 backdrop-blur-sm"
                    />
                </div>
            </div>

            {/* Category Filter Bar - [스봉이 수정] 사장님 요청: 전체 / 공항 / 파트너 💅 */}
            <div className="px-4 md:px-6 py-2 bg-white/50 backdrop-blur-sm border-b border-gray-100/50 shrink-0 overflow-x-auto no-scrollbar pointer-events-auto">
                <div className="flex gap-2">
                    {[
                        { id: 'ALL', label: t.locations_page?.filter_all || '전체' },
                        { id: 'AIRPORT', label: t.locations_page?.filter_airport || '공항' },
                        { id: 'PARTNER', label: t.locations_page?.filter_partner || '지점 파트너스' }
                    ].map((cat) => (
                        <button
                            key={cat.id}
                            onClick={() => onCategoryChange?.(cat.id as any)}
                            className={`px-4 py-1.5 rounded-full text-[10px] md:text-xs font-black transition-all whitespace-nowrap ${selectedCategory === cat.id
                                ? 'bg-black text-white shadow-lg scale-105'
                                : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
                                }`}
                        >
                            {cat.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* List Area - Mobile: Bottom Sheet / Carousel */}
            <div className="flex-none md:flex-1 md:overflow-y-auto no-scrollbar p-3 md:p-6 md:space-y-4 pointer-events-auto bg-transparent md:bg-transparent mt-auto md:mt-0 h-auto md:h-auto flex flex-row md:flex-col overflow-x-auto md:overflow-x-hidden snap-x snap-mandatory md:snap-none gap-3 md:gap-0 items-end justify-center md:items-stretch pb-6 md:pb-6">
                <div className="text-[10px] items-center gap-2 font-black text-gray-400 uppercase tracking-widest mb-2 flex hidden md:flex">
                    <MapPin className="w-3 h-3" />
                    <span>{filteredBranches.length} {t.locations_page?.found_units || 'Locations Available'}</span>
                </div>

                {filteredBranches.map((branch) => {
                    const isSelected = selectedBranch?.id === branch.id;
                    const isActive = branch.services?.[currentService]?.isActive ?? true;

                    return (
                        <motion.button
                            key={branch.id}
                            layout
                            whileHover={{ y: -4, scale: 1.01 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => onBranchClick(branch)}
                            className={`w-[130px] md:w-full p-2 md:p-6 rounded-[0.8rem] md:rounded-[2rem] text-left border transition-all relative group overflow-hidden snap-start shrink-0 shadow-lg md:shadow-none bg-white border-gray-100 ${isSelected
                                ? 'border-black shadow-[0_10px_20px_rgba(0,0,0,0.15)] ring-2 ring-black'
                                : 'hover:border-bee-yellow/50'
                                }`}
                        >
                            <div className="flex flex-col md:flex-row items-center md:items-start gap-2 md:gap-4 mb-0 md:mb-3 text-center md:text-left">
                                <div className={`w-9 h-9 md:w-10 md:h-10 rounded-full md:rounded-2xl flex items-center justify-center shrink-0 shadow-sm transition-all ${isSelected ? 'bg-bee-yellow text-black scale-110 shadow-bee-yellow/20' : 'bg-gray-50 text-gray-400'}`}>
                                    {branch.isPartner ? (
                                        <Handshake className="w-4 h-4 md:w-5 md:h-5 text-bee-black" />
                                    ) : branch.type === 'AIRPORT' ? (
                                        <Plane className="w-4 h-4 md:w-5 md:h-5" />
                                    ) : null}
                                </div>
                                <div className="flex-1 w-full flex flex-col items-center md:items-start">
                                    <div className="flex flex-col md:flex-row items-center md:items-start justify-between gap-1 w-full mb-1">
                                        <div className={`text-[11px] md:text-base font-black tracking-tight leading-tight line-clamp-1 ${isSelected ? 'text-gray-900' : 'text-gray-900'}`}>
                                            {lang === 'ko' ? (branch.name || '') : ((branch as any)[`name_${lang}`] || branch.name_en || branch.name || '')}
                                        </div>
                                        <div className={`px-1.5 py-0.5 rounded-full md:rounded-lg text-[6px] md:text-[8px] font-black uppercase tracking-tighter ${isActive ? 'bg-green-500/10 text-green-600' : 'bg-red-500/10 text-red-600'
                                            }`}>
                                            {isActive ? 'Active' : 'Close'}
                                        </div>
                                    </div>

                                    <div className={`text-[8px] md:text-[10px] font-bold leading-tight mb-2 line-clamp-1 opacity-80 ${isSelected ? 'text-gray-600' : 'text-gray-400'}`}>
                                        {lang === 'ko' ? (branch.address || '') : ((branch as any)[`address_${lang}`] || branch.address_en || branch.address || '')}
                                    </div>

                                    {/* Service Badges - Centered for mobile */}
                                    <div className="flex gap-1 justify-center md:justify-start overflow-hidden">
                                        {branch.supportsDelivery && (
                                            <span className={`px-1.5 py-0.5 rounded-full text-[6px] md:text-[9px] font-black border ${isSelected ? 'bg-black text-white border-black' : 'bg-gray-50 text-gray-400 border-gray-100'}`}>
                                                {t.locations_page?.service_delivery || '배송'}
                                            </span>
                                        )}
                                        {branch.supportsStorage && (
                                            <span className={`px-1.5 py-0.5 rounded-full text-[6px] md:text-[9px] font-black border ${isSelected ? 'bg-black text-white border-black' : 'bg-gray-50 text-gray-400 border-gray-100'}`}>
                                                {t.locations_page?.service_storage || '보관'}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Accent Decoration */}
                            {isSelected && (
                                <motion.div className="absolute top-0 right-0 w-24 h-24 bg-bee-yellow/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl" />
                            )}
                        </motion.button>
                    );
                })}

                {filteredBranches.length === 0 && (
                    <div className="py-20 text-center flex flex-col items-center">
                        <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                            <i className="fa-solid fa-ghost text-gray-200 text-xl"></i>
                        </div>
                        <p className="text-gray-400 font-bold text-sm tracking-tight">{t.locations_page?.no_results || 'No branches found.'}</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default LocationList;
