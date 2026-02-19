import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, MapPin, Navigation, Plane, Store, Calendar, Clock, Wallet, Luggage, Handshake, ArrowRight, X, ChevronLeft, ChevronRight } from "lucide-react";
import BaggageCounter from './BaggageCounter';
import { generateTimeSlots, isPastKSTTime, getFirstAvailableSlot, formatKSTDate } from '../../utils/dateUtils';

interface LocationListProps {
    t: any;
    lang: string;
    searchTerm: string;
    onSearchChange: (val: string) => void;
    onSearchSubmit?: (val: string) => void;
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
    returnDate?: string;
    onReturnDateChange?: (date: string) => void;
    returnTime?: string;
    onReturnTimeChange?: (time: string) => void;
    baggageCounts: any;
    onBaggageChange: (size: 'S' | 'M' | 'L' | 'XL', delta: number) => void;
    deliveryPrices?: any;
}

const LocationList: React.FC<LocationListProps> = ({
    t, lang, searchTerm, onSearchChange, onSearchSubmit, filteredBranches, selectedBranch, onBranchClick, currentService, onServiceChange, onReset,
    bookingDate, onDateChange, bookingTime, onTimeChange,
    returnDate, onReturnDateChange, returnTime, onReturnTimeChange,
    baggageCounts, onBaggageChange,
    deliveryPrices
}) => {
    const [activeStep, setActiveStep] = React.useState<'BAGGAGE' | 'PICKUP_DATE' | 'PICKUP_TIME' | 'RETURN_DATE' | 'RETURN_TIME' | null>(null);

    const isDelivery = currentService === 'SAME_DAY' || currentService === 'SCHEDULED';
    const timeSlotsOrig = React.useMemo(() => generateTimeSlots(9, 21, 30), []);

    const CalendarView = ({
        selectedDate,
        onSelect,
        minDate,
        lang
    }: {
        selectedDate: string;
        onSelect: (date: string) => void;
        minDate?: string;
        lang: string;
    }) => {
        const [viewDate, setViewDate] = React.useState(() => {
            const d = selectedDate ? new Date(selectedDate) : new Date();
            return new Date(d.getFullYear(), d.getMonth(), 1, 12, 0, 0);
        });

        const year = viewDate.getFullYear();
        const month = viewDate.getMonth();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const firstDayOfMonth = new Date(year, month, 1).getDay();
        const days = [];
        for (let i = 0; i < firstDayOfMonth; i++) days.push(null);
        for (let i = 1; i <= daysInMonth; i++) days.push(i);
        const weekDays = lang === 'ko' ? ['일', '월', '화', '수', '목', '금', '토'] :
            lang === 'ja' ? ['日', '月', '화', '水', '木', '金', '土'] :
                (lang === 'zh' || lang === 'zh-tw' || lang === 'zh-hk') ? ['日', '一', '二', '三', '四', '五', '六'] :
                    ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

        const handlePrevMonth = (e: React.MouseEvent) => { e.stopPropagation(); setViewDate(new Date(year, month - 1, 1, 12, 0, 0)); };
        const handleNextMonth = (e: React.MouseEvent) => { e.stopPropagation(); setViewDate(new Date(year, month + 1, 1, 12, 0, 0)); };

        return (
            <div className="flex flex-col gap-3 bg-white p-4 rounded-[1.5rem] border border-gray-50 shadow-sm pointer-events-auto">
                <div className="flex items-center justify-between px-2">
                    <span className="text-xs font-black text-gray-900 italic tracking-tighter">
                        {lang === 'ko' ? `${year}년 ${month + 1}월` :
                            lang === 'ja' ? `${year}年 ${month + 1}月` :
                                (lang === 'zh' || lang === 'zh-tw' || lang === 'zh-hk') ? `${year}年 ${month + 1}月` :
                                    `${year}. ${String(month + 1).padStart(2, '0')}`}
                    </span>
                    <div className="flex items-center gap-1">
                        <button onClick={handlePrevMonth} className="w-6 h-6 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"><ChevronLeft className="w-3.5 h-3.5" /></button>
                        <button onClick={handleNextMonth} className="w-6 h-6 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"><ChevronRight className="w-3.5 h-3.5" /></button>
                    </div>
                </div>
                <div className="grid grid-cols-7 gap-0.5">
                    {weekDays.map(d => (
                        <div key={d} className="text-[8px] font-black text-gray-300 text-center py-1 uppercase tracking-tighter">{d}</div>
                    ))}
                    {days.map((day, idx) => {
                        if (day === null) return <div key={`empty-${idx}`} />;
                        const d = new Date(year, month, day, 12, 0, 0);
                        const dStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
                        const isSelected = selectedDate === dStr;
                        const disabled = (() => {
                            const nowKST = formatKSTDate();
                            if (minDate && dStr < minDate) return true;
                            if (dStr < nowKST) return true;

                            if (dStr === nowKST) {
                                const pickupSlots = timeSlotsOrig.filter(h => !isDelivery || (h >= '09:00' && h <= '13:30'));
                                const hasPickup = !!getFirstAvailableSlot(dStr, pickupSlots);

                                let hasReturn = true;
                                if (currentService === 'SAME_DAY') {
                                    const returnSlots = timeSlotsOrig.filter(h => h >= '16:00' && h <= '21:00');
                                    hasReturn = !!getFirstAvailableSlot(dStr, returnSlots);
                                }

                                if (!hasPickup || !hasReturn) return true;
                            }
                            return false;
                        })();
                        return (
                            <button
                                key={day}
                                disabled={disabled}
                                onClick={() => onSelect(dStr)}
                                className={`aspect-square flex items-center justify-center rounded-lg text-[10px] font-black transition-all ${disabled ? 'text-gray-100 cursor-not-allowed' :
                                    isSelected ? 'bg-bee-yellow text-bee-black shadow-md scale-105' :
                                        'hover:bg-gray-50 text-gray-600'
                                    }`}
                            >
                                {day}
                            </button>
                        );
                    })}
                </div>
            </div>
        );
    };

    return (
        <div className="flex flex-col h-full bg-transparent relative z-20 overflow-hidden md:pointer-events-auto select-none pointer-events-none">
            {/* Header / Search Area - Floating Card Design 💅 */}
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="overflow-hidden pointer-events-auto p-3 md:p-8 bg-white/95 backdrop-blur-xl shadow-2xl border-b border-gray-100 rounded-b-[1.5rem] md:rounded-b-[2.5rem] relative z-30"
            >
                <div onClick={onReset} className="inline-flex items-center gap-2 md:gap-3 mb-3 md:mb-8 cursor-pointer group px-1">
                    <div className="flex items-center justify-center w-7 h-7 md:w-8 md:h-8 rounded-full bg-gray-100 group-hover:bg-bee-yellow transition-all shadow-sm">
                        <ChevronLeft className="w-4 h-4 md:w-5 md:h-5 text-gray-900" />
                    </div>
                    <div className="flex flex-col">
                        <h1 className="text-lg md:text-3xl font-[1000] tracking-tighter text-gray-900 leading-tight">
                            {t.locations_page?.sidebar_subtitle || 'Service Points'}
                        </h1>
                    </div>
                </div>

                <div className="flex flex-col gap-3 md:gap-4">
                    {/* [스봉이] 사장님이 좋아하시는 그 '일렬 횡대' 레이아웃 💅 서비스, 가방, 날짜를 한 줄에! */}
                    <div className="flex items-center gap-1 overflow-x-auto no-scrollbar pb-1.5 md:pb-0">
                        {/* 서비스 선택 (배송/보관) */}
                        <div className="flex bg-gray-100/60 p-1 md:p-1.5 rounded-full border border-gray-100 shadow-inner shrink-0">
                            {(['DELIVERY', 'STORAGE'] as const).map((type) => {
                                const isCurrent = type === 'DELIVERY' ? (currentService === 'SAME_DAY' || currentService === 'SCHEDULED') : currentService === 'STORAGE';
                                return (
                                    <button
                                        key={type}
                                        onClick={(e) => { e.stopPropagation(); onServiceChange(type === 'DELIVERY' ? 'SAME_DAY' : 'STORAGE'); }}
                                        className={`px-1.5 md:px-4 py-1.5 md:py-2 rounded-full text-[9px] md:text-[11px] font-black tracking-tighter uppercase transition-all relative z-10 ${isCurrent ? 'text-bee-black' : 'text-gray-400'}`}
                                    >
                                        <span className="relative z-10">{type === 'DELIVERY' ? (t.locations_page?.badge_delivery || 'DEL') : (t.locations_page?.badge_storage || 'STO')}</span>
                                        {isCurrent && <motion.div layoutId="service-bg-compact-v4" className="absolute inset-0 bg-bee-yellow rounded-full shadow-sm" />}
                                    </button>
                                );
                            })}
                        </div>

                        {/* 가방 개수 선택 */}
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                const next = activeStep === 'BAGGAGE' ? null : 'BAGGAGE';
                                setActiveStep(next);
                            }}
                            className={`flex items-center gap-1 px-2 py-1.5 rounded-full border transition-all duration-300 shadow-sm shrink-0 ${activeStep === 'BAGGAGE' ? 'bg-bee-black border-bee-black text-bee-yellow' : 'bg-white border-gray-200 text-gray-900'}`}
                        >
                            <Luggage className={`w-3 h-3 ${activeStep === 'BAGGAGE' ? 'text-bee-yellow' : 'text-gray-400'}`} />
                            <span className="text-[10px] font-black italic tracking-tighter">{Object.values(baggageCounts as Record<string, number>).reduce((a, b) => a + b, 0)}</span>
                        </button>

                        {/* 날짜 선택 (맡기기/찾기) - 한 줄에 안착! 💅 */}
                        <div className="flex items-center gap-1 bg-white rounded-full border border-gray-100 shadow-sm px-1.5 py-1.5 shrink-0">
                            <button onClick={(e) => {
                                e.stopPropagation();
                                const next = activeStep === 'PICKUP_DATE' ? null : 'PICKUP_DATE';
                                setActiveStep(next);
                            }} className="flex items-center gap-1 shrink-0">
                                <div className="bg-bee-yellow text-bee-black text-[7px] font-black px-1 py-0.5 rounded-full uppercase tracking-tighter shrink-0">{t.locations_page?.badge_pick || 'PICK'}</div>
                                <span className="text-[9px] md:text-[11px] font-black text-gray-900 italic tracking-tighter whitespace-nowrap">{bookingDate || '--.--'}</span>
                            </button>
                            <div className="w-[1px] h-2 bg-gray-200 shrink-0" />
                            <button onClick={(e) => {
                                e.stopPropagation();
                                const next = activeStep === 'RETURN_DATE' ? null : 'RETURN_DATE';
                                setActiveStep(next);
                            }} className="flex items-center gap-1 shrink-0">
                                <div className="bg-gray-100 text-gray-400 text-[7px] font-black px-1 py-0.5 rounded-full uppercase tracking-tighter shrink-0">{t.locations_page?.badge_ret || 'RET'}</div>
                                <span className="text-[9px] md:text-[11px] font-black text-gray-900 italic tracking-tighter whitespace-nowrap">{returnDate || '--.--'}</span>
                            </button>
                        </div>
                    </div>

                    {/* 검색바는 하단에 깔끔하게 독채로 💅 */}
                    <div className="relative w-full">
                        <div className="absolute left-3.5 md:left-4 top-1/2 -translate-y-1/2 text-gray-400"><Search size={14} className="md:w-4 md:h-4" /></div>
                        <input
                            type="text"
                            placeholder={t.locations_page?.search_placeholder || "Search location..."}
                            value={searchTerm}
                            onChange={(e) => onSearchChange(e.target.value)}
                            className="w-full pl-10 md:pl-11 pr-4 py-2.5 md:py-3 bg-gray-50 border border-gray-100 rounded-full text-[11px] md:text-xs font-bold focus:outline-none focus:ring-2 focus:ring-bee-yellow/20 shadow-sm"
                        />
                    </div>

                    {/* Date/Time Accordion - 날짜는 이전처럼 팝업 말고 레이아웃 내에서! 💅 */}
                    <AnimatePresence>
                        {activeStep && (
                            <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: "auto", opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                className="mt-4 bg-gray-50/50 rounded-[2rem] border border-gray-100 overflow-hidden relative z-50"
                            >
                                <div className="p-6">
                                    <div className="flex items-center justify-between mb-4">
                                        <h3 className="text-sm font-black italic tracking-tighter text-gray-900">
                                            {activeStep === 'BAGGAGE' ? 'Select Baggage' :
                                                activeStep === 'PICKUP_DATE' ? 'Select Pickup Date' :
                                                    activeStep === 'PICKUP_TIME' ? 'Select Pickup Time' :
                                                        activeStep === 'RETURN_DATE' ? 'Select Return Date' : 'Select Return Time'}
                                        </h3>
                                        <button onClick={() => setActiveStep(null)}><X size={16} className="text-gray-400" /></button>
                                    </div>

                                    {activeStep === 'BAGGAGE' ? (
                                        <div className="bg-white p-2 md:p-4 rounded-[1.5rem] border border-gray-50 shadow-sm">
                                            <BaggageCounter
                                                t={t}
                                                lang={lang}
                                                baggageCounts={baggageCounts}
                                                onCountChange={onBaggageChange}
                                                onConfirm={() => setActiveStep('PICKUP_DATE')}
                                                deliveryPrices={deliveryPrices}
                                                currentService={currentService}
                                            />
                                        </div>
                                    ) : activeStep.includes('DATE') ? (
                                        <CalendarView
                                            selectedDate={activeStep === 'PICKUP_DATE' ? (bookingDate || '') : (returnDate || '')}
                                            minDate={activeStep === 'PICKUP_DATE' ? formatKSTDate() : (bookingDate || formatKSTDate())}
                                            onSelect={(d) => {
                                                if (activeStep === 'PICKUP_DATE') {
                                                    onDateChange?.(d);
                                                    if (!returnDate || returnDate < d) {
                                                        onReturnDateChange?.(d);
                                                    }
                                                    setActiveStep('PICKUP_TIME');
                                                } else {
                                                    onReturnDateChange?.(d);
                                                    setActiveStep('RETURN_TIME');
                                                }
                                            }}
                                            lang={lang}
                                        />
                                    ) : (
                                        <div className="max-h-[250px] overflow-y-auto no-scrollbar grid grid-cols-2 gap-2 p-1">
                                            {timeSlotsOrig.map((h) => {
                                                const isPast = activeStep === 'PICKUP_TIME' ? isPastKSTTime(bookingDate || '', h) : (isPastKSTTime(returnDate || '', h) || (returnDate === bookingDate && h <= (bookingTime || '')));
                                                const isSelected = activeStep === 'PICKUP_TIME' ? bookingTime === h : returnTime === h;
                                                const serviceOk = !isDelivery || (activeStep === 'PICKUP_TIME' ? (h >= '09:00' && h <= '13:30') : (h >= '16:00' && h <= '21:00'));
                                                if (!serviceOk) return null;
                                                return (
                                                    <button
                                                        key={h}
                                                        disabled={isPast}
                                                        onClick={() => {
                                                            if (activeStep === 'PICKUP_TIME') {
                                                                onTimeChange?.(h);
                                                                if (isDelivery) setActiveStep('RETURN_DATE');
                                                                else setActiveStep(null);
                                                            } else {
                                                                onReturnTimeChange?.(h);
                                                                setActiveStep(null);
                                                            }
                                                        }}
                                                        className={`py-3 px-4 rounded-xl text-[11px] font-black transition-all ${isPast ? 'opacity-20' : isSelected ? 'bg-bee-black text-bee-yellow' : 'bg-white border border-gray-100 hover:border-bee-yellow'}`}
                                                    >
                                                        {h}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </motion.div>

            {/* List Area - Floating Cards at the Bottom 💅 */}
            <div className="flex-none md:flex-1 md:overflow-y-auto no-scrollbar p-3 md:p-6 md:space-y-4 pointer-events-auto bg-transparent border-none mt-auto h-auto flex flex-row md:flex-col overflow-x-auto md:overflow-x-hidden snap-x snap-mandatory md:snap-none gap-3 md:gap-4 pb-12">
                <AnimatePresence>
                    {!activeStep && (
                        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="text-[10px] items-center gap-2 font-black text-white bg-bee-black/30 backdrop-blur-sm px-3 py-1 rounded-full uppercase tracking-widest mb-2 hidden md:flex w-fit">
                            <MapPin className="w-3 h-3" />
                            <span>{filteredBranches.length} {t.locations_page?.found_units || 'Locations'}</span>
                        </motion.div>
                    )}
                </AnimatePresence>

                {filteredBranches.map((branch) => {
                    const isSelected = selectedBranch?.id === branch.id;
                    const isActive = branch.services?.[currentService]?.isActive ?? true;

                    return (
                        <motion.button
                            key={branch.id}
                            layout
                            whileHover={{ y: -4, scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => onBranchClick(branch)}
                            className={`w-[130px] md:w-full p-2 md:p-6 rounded-[1rem] md:rounded-[2rem] text-left border transition-all relative group overflow-hidden shrink-0 shadow-2xl backdrop-blur-xl ${isSelected ? 'bg-bee-yellow border-bee-yellow ring-4 ring-white/50' : 'bg-white/90 border-white/50'}`}
                        >
                            <div className="flex flex-col md:flex-row items-center md:items-start gap-2 md:gap-4 mb-1 md:mb-3">
                                <div className={`w-8 h-8 md:w-10 md:h-10 rounded-full md:rounded-2xl flex items-center justify-center shrink-0 shadow-sm ${isSelected ? 'bg-bee-black text-bee-yellow' : 'bg-gray-50 text-gray-400'}`}>
                                    {branch.isPartner ? <Handshake className="w-4 h-4 md:w-5 md:h-5" /> : branch.type === 'AIRPORT' ? <Plane className="w-4 h-4 md:w-5 md:h-5" /> : <Store className="w-4 h-4 md:w-5 md:h-5" />}
                                </div>
                                <div className="flex-1 w-full text-center md:text-left">
                                    <div className="text-[11px] md:text-base font-black tracking-tighter leading-tight line-clamp-1 mb-1">{lang === 'ko' ? branch.name : (branch[`name_${lang.replace('-', '_').toLowerCase()}`] || branch.name_en || branch.name)}</div>
                                    <div className={`px-1.5 py-0.5 rounded-full text-[6px] md:text-[8px] font-black uppercase tracking-tighter w-fit mx-auto md:ml-0 ${isActive ? 'bg-green-500/10 text-green-600' : 'bg-red-500/10 text-red-600'}`}>{isActive ? 'Active' : 'Close'}</div>
                                </div>
                            </div>
                            <div className="hidden md:block text-[9px] font-bold text-gray-400 line-clamp-1 mb-3">{lang === 'ko' ? branch.address : (branch[`address_${lang.replace('-', '_').toLowerCase()}`] || branch.address_en || branch.address)}</div>
                            <div className="flex gap-1 justify-center md:justify-start">
                                {branch.supportsDelivery && <span className={`px-1.5 py-0.5 rounded-full text-[6px] md:text-[8px] font-black border ${isSelected ? 'border-bee-black/20 bg-bee-black/10' : 'border-gray-100 bg-gray-50 text-gray-400'}`}>{t.locations_page?.service_delivery || 'DELIVERY'}</span>}
                                {branch.supportsStorage && <span className={`px-1.5 py-0.5 rounded-full text-[6px] md:text-[8px] font-black border ${isSelected ? 'border-bee-black/20 bg-bee-black/10' : 'border-gray-100 bg-gray-50 text-gray-400'}`}>{t.locations_page?.service_storage || 'STORAGE'}</span>}
                            </div>
                        </motion.button>
                    );
                })}

                {filteredBranches.length === 0 && (
                    <div className="py-10 text-center flex flex-col items-center w-full bg-white/50 backdrop-blur-sm rounded-[2rem]">
                        <p className="text-gray-400 font-bold text-sm tracking-tight">{t.locations_page?.no_results || 'No branches found.'}</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default LocationList;
