import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, MapPin, LocateFixed, Plane, Store, Calendar, Clock, Wallet, Luggage, Handshake, ArrowRight, X, ChevronLeft, ChevronRight } from "lucide-react";
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
    onBack?: () => void;
    onFindMyLocation?: () => void;
}

const LocationList: React.FC<LocationListProps> = ({
    t, lang, searchTerm, onSearchChange, onSearchSubmit, filteredBranches, selectedBranch, onBranchClick, currentService, onServiceChange, onReset,
    bookingDate, onDateChange, bookingTime, onTimeChange,
    returnDate, onReturnDateChange, returnTime, onReturnTimeChange,
    baggageCounts, onBaggageChange,
    deliveryPrices,
    onBack,
    onFindMyLocation
}) => {
    const [activeStep, setActiveStep] = React.useState<'BAGGAGE' | 'PICKUP_DATE' | 'PICKUP_TIME' | 'RETURN_DATE' | 'RETURN_TIME' | null>(null);

    const isDelivery = currentService === 'SAME_DAY' || currentService === 'SCHEDULED';

    // [스봉이] 영업시간 파싱 및 동적 슬롯 생성 💅
    const bh = React.useMemo(() => {
        const bhStr = selectedBranch?.businessHours || '09:00-21:00';
        if (!bhStr || bhStr === '24시간' || bhStr === '24 Hours') return { start: 0, end: 24 };
        try {
            const parts = bhStr.split('-').map(p => p.trim());
            return { start: parseInt(parts[0].split(':')[0]), end: parseInt(parts[1].split(':')[0]) };
        } catch (e) { return { start: 9, end: 21 }; }
    }, [selectedBranch]);

    const timeSlotsOrig = React.useMemo(() => {
        const slots = [];
        for (let i = bh.start; i <= bh.end; i++) {
            slots.push(`${i.toString().padStart(2, '0')}:00`);
            if (i < bh.end) slots.push(`${i.toString().padStart(2, '0')}:30`);
        }
        return slots;
    }, [bh]);

    // [스봉이] 날짜 포맷팅 헬퍼 (YYYY-MM-DD -> MM.DD) 💅
    const formatToMMDD = (dateStr: string | undefined) => {
        if (!dateStr || dateStr === '--.--') return '--.--';
        // 숫자가 아닌 문자(공백 등)가 섞여있을 수 있으니 정규식으로 안전하게 추출 💅
        const match = dateStr.match(/(\d{4})-(\d{2})-(\d{2})/);
        if (match) {
            return `${match[2]}.${match[3]}`;
        }
        return dateStr;
    };

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
                (lang.toLowerCase() === 'zh' || lang.toLowerCase() === 'zh-tw' || lang.toLowerCase() === 'zh-hk') ? ['日', '一', '二', '三', '四', '五', '六'] :
                    ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

        const handlePrevMonth = (e: React.MouseEvent) => { e.stopPropagation(); setViewDate(new Date(year, month - 1, 1, 12, 0, 0)); };
        const handleNextMonth = (e: React.MouseEvent) => { e.stopPropagation(); setViewDate(new Date(year, month + 1, 1, 12, 0, 0)); };

        return (
            <div className="flex flex-col gap-3 bg-white p-4 rounded-[1.5rem] border border-gray-50 shadow-sm pointer-events-auto">
                <div className="flex items-center justify-between px-2">
                    <span className="text-xs font-black text-gray-900 italic tracking-tighter">
                        {lang === 'ko' ? `${year}년 ${month + 1}월` :
                            lang === 'ja' ? `${year}年 ${month + 1}月` :
                                (lang.toLowerCase() === 'zh' || lang.toLowerCase() === 'zh-tw' || lang.toLowerCase() === 'zh-hk') ? `${year}年 ${month + 1}月` :
                                    `${year}. ${String(month + 1).padStart(2, '0')}`}
                    </span>
                    <div className="flex items-center gap-1">
                        <button title="이전 달" onClick={handlePrevMonth} className="w-6 h-6 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"><ChevronLeft className="w-3.5 h-3.5" /></button>
                        <button title="다음 달" onClick={handleNextMonth} className="w-6 h-6 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"><ChevronRight className="w-3.5 h-3.5" /></button>
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
                                // [스봉이] 지점별 영업시간 반영하여 마감 여부 판단 💅
                                const pickupEndLimit = isDelivery ? Math.min(bh.end, 15) : (bh.end - 1);
                                const pickupSlots = timeSlotsOrig.filter(h => {
                                    const hour = parseInt(h.split(':')[0]);
                                    return hour >= bh.start && hour < pickupEndLimit;
                                });
                                const hasPickup = !!getFirstAvailableSlot(dStr, pickupSlots);

                                let hasReturn = true;
                                if (currentService === 'SAME_DAY') {
                                    const returnStartLimit = Math.max(bh.start, 16);
                                    const returnSlots = timeSlotsOrig.filter(h => {
                                        const hour = parseInt(h.split(':')[0]);
                                        return hour >= returnStartLimit && hour <= bh.end;
                                    });
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
        <div className="flex flex-col justify-between md:justify-start h-full bg-transparent relative z-20 overflow-hidden md:pointer-events-auto select-none pointer-events-none md:bg-white/90 md:backdrop-blur-xl md:shadow-2xl">
            {/* Header / Search Area - Floating Card Design on Mobile, Sticky Header on PC 💅 */}
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex-none overflow-hidden pointer-events-auto p-2 md:p-5 bg-white/95 backdrop-blur-xl shadow-2xl md:shadow-none border-b border-gray-100 rounded-b-[1.5rem] md:rounded-b-none relative z-30"
            >
                <div onClick={onBack} className="inline-flex items-center gap-2 md:gap-3 mb-3 md:mb-5 cursor-pointer group px-1">
                    <div className="flex items-center justify-center w-7 h-7 md:w-8 md:h-8 rounded-full bg-gray-100 group-hover:bg-bee-yellow transition-all shadow-sm">
                        <ChevronLeft className="w-4 h-4 md:w-5 md:h-5 text-gray-900" />
                    </div>
                    <div className="flex flex-col">
                        <h1 className="text-lg md:text-2xl font-[1000] tracking-tighter text-gray-900 leading-tight">
                            {t.locations_page?.sidebar_subtitle || 'Service Points'}
                        </h1>
                    </div>
                </div>

                <div className="flex flex-col gap-3 md:gap-5">
                    {/* [스봉이] 본부장님 안목에 맞춘 '슬림 & 스마트 & 와이드' 필터바 💅 */}
                    <div className="flex flex-wrap items-stretch gap-2 md:gap-4 overflow-x-visible no-scrollbar pb-1 md:pb-0 w-full">
                        {/* 서비스 선택 (배송/보관) - 슬림하게 다이어트! */}
                        <div className="flex-1 flex bg-gray-100/60 p-1 md:p-1 rounded-full border border-gray-100 shadow-inner min-w-[110px] md:min-w-[140px]">
                            {(['DELIVERY', 'STORAGE'] as const).map((type) => {
                                const isCurrent = type === 'DELIVERY' ? (currentService === 'SAME_DAY' || currentService === 'SCHEDULED') : currentService === 'STORAGE';
                                return (
                                    <button
                                        key={type}
                                        onClick={(e) => { e.stopPropagation(); onServiceChange(type === 'DELIVERY' ? 'SAME_DAY' : 'STORAGE'); }}
                                        className={`flex-1 px-1.5 md:px-4 py-1.5 md:py-2.5 rounded-full text-[10px] md:text-[13px] font-[1000] tracking-tighter uppercase transition-all relative z-10 ${isCurrent ? 'text-bee-black' : 'text-gray-400'}`}
                                    >
                                        <span className="relative z-10">{type === 'DELIVERY' ? (t.locations_page?.badge_delivery || 'DEL') : (t.locations_page?.badge_storage || 'STO')}</span>
                                        {isCurrent && <motion.div layoutId="service-bg-compact-v4" className="absolute inset-0 bg-bee-yellow rounded-full shadow-md" />}
                                    </button>
                                );
                            })}
                        </div>

                        {/* 가방 개수 선택 - 얇고 세련되게! */}
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                const next = activeStep === 'BAGGAGE' ? null : 'BAGGAGE';
                                setActiveStep(next);
                            }}
                            className={`flex flex-col md:flex-row items-center justify-center gap-0.5 md:gap-1.5 px-2.5 md:px-4 py-1.5 md:py-2 rounded-full border transition-all duration-300 shadow-md min-w-[45px] md:min-w-[70px] ${activeStep === 'BAGGAGE' ? 'bg-bee-black border-bee-black text-bee-yellow' : 'bg-white border-gray-200 text-gray-900 hover:border-bee-yellow'}`}
                        >
                            <Luggage className={`w-3.5 h-3.5 md:w-5 md:h-5 ${activeStep === 'BAGGAGE' ? 'text-bee-yellow' : 'text-gray-400'}`} />
                            <span className="text-[11px] md:text-[16px] font-[1000] italic tracking-tighter leading-none">{Object.values(baggageCounts as Record<string, number>).reduce((a, b) => a + b, 0)}</span>
                        </button>

                        {/* 날짜 & 시간 선택 (맡기기/찾기) - 슬림 와이드 & 스마트 정보 노출 💅 */}
                        <div className="flex-[3.5] flex items-center gap-1.5 md:gap-2 bg-white rounded-full border border-gray-100 shadow-lg px-2 md:px-4 py-1 md:py-1.5 shrink-0 transition-all justify-between min-w-[200px] flex-wrap md:flex-nowrap">
                            <button onClick={(e) => {
                                e.stopPropagation();
                                const next = activeStep === 'PICKUP_DATE' ? null : 'PICKUP_DATE';
                                setActiveStep(next);
                            }} className="flex-1 flex items-center gap-1 md:gap-2.5 shrink-0 py-1 md:py-1.5 hover:bg-gray-50 rounded-2xl transition-all justify-center">
                                <div className="bg-bee-yellow text-bee-black text-[8px] md:text-[11px] font-[1000] px-1.5 md:px-3 h-5 md:h-7 flex items-center justify-center rounded-full uppercase tracking-tighter shrink-0 shadow-sm border border-bee-black/5 whitespace-nowrap">
                                    {lang === 'ko' ? (isDelivery ? '보내는날' : '맡기는 날') : (t.locations_page?.badge_pick?.slice(0, 1) || 'P')}
                                </div>
                                <div className="flex items-baseline gap-1 md:gap-2">
                                    <span className="text-[12px] md:text-[16px] font-[1000] text-gray-900 italic tracking-tighter whitespace-nowrap">{formatToMMDD(bookingDate)}</span>
                                    <span className="text-[8px] md:text-[11px] font-[1000] text-bee-black/40 italic tracking-tighter">{bookingTime || '--:--'}</span>
                                </div>
                            </button>
                            <div className="w-[1.5px] md:w-[2px] h-6 md:h-10 bg-gray-100 shrink-0" />
                            <button onClick={(e) => {
                                e.stopPropagation();
                                const next = activeStep === 'RETURN_DATE' ? null : 'RETURN_DATE';
                                setActiveStep(next);
                            }} className="flex-1 flex items-center gap-1 md:gap-2.5 shrink-0 py-1 md:py-1.5 hover:bg-gray-50 rounded-2xl transition-all justify-center">
                                <div className="bg-gray-100 text-gray-400 text-[8px] md:text-[11px] font-[1000] px-1.5 md:px-3 h-5 md:h-7 flex items-center justify-center rounded-full uppercase tracking-tighter shrink-0 shadow-sm border border-gray-200 whitespace-nowrap">
                                    {lang === 'ko' ? (isDelivery ? '받는날' : '찾는 날') : (t.locations_page?.badge_ret?.slice(0, 1) || 'R')}
                                </div>
                                <div className="flex items-baseline gap-1 md:gap-2">
                                    <span className="text-[12px] md:text-[16px] font-[1000] text-gray-900 italic tracking-tighter whitespace-nowrap">{formatToMMDD(returnDate)}</span>
                                    <span className="text-[8px] md:text-[11px] font-[1000] text-gray-400/60 italic tracking-tighter">{returnTime || '--:--'}</span>
                                </div>
                            </button>
                        </div>
                    </div>

                    {/* 검색바 사이즈 축소 및 내 위치 버튼 통합 💅 */}
                    <div className="flex items-center gap-2 w-full">
                        <div className="relative flex-1">
                            <div className="absolute left-3.5 md:left-4 top-1/2 -translate-y-1/2 text-gray-400"><Search size={14} className="md:w-3.5 md:h-3.5" /></div>
                            <input
                                type="text"
                                placeholder={t.locations_page?.search_placeholder || "Search..."}
                                value={searchTerm}
                                onChange={(e) => onSearchChange(e.target.value)}
                                className="w-full pl-10 md:pl-9 pr-4 py-2.5 md:py-2.5 bg-gray-50 border border-gray-100 rounded-full text-[11px] md:text-[11px] font-[900] focus:outline-none focus:ring-2 focus:ring-bee-yellow/20 shadow-sm"
                            />
                        </div>
                        <button
                            onClick={(e) => { e.stopPropagation(); onFindMyLocation?.(); }}
                            className="flex items-center gap-1.5 px-3 py-2.5 md:py-2.5 bg-white border border-gray-100 rounded-full shadow-sm hover:bg-gray-50 transition-all shrink-0 active:scale-95 pointer-events-auto"
                        >
                            <div className="w-5 h-5 flex items-center justify-center rounded-full bg-blue-50 text-blue-500">
                                <LocateFixed className="w-3 h-3 fill-current" />
                            </div>
                            <span className="text-[11px] md:text-[12px] font-[1000] text-gray-900 tracking-tighter whitespace-nowrap">
                                {t.locations_page?.find_my_location_short || '내 위치'}
                            </span>
                        </button>
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
                                            {activeStep === 'BAGGAGE' ? (t.booking?.bags_selection_title || 'Select Baggage') :
                                                activeStep === 'PICKUP_DATE' ? (t.booking?.pickup_schedule || 'Select Pickup Date') :
                                                    activeStep === 'PICKUP_TIME' ? (t.booking?.select_time || 'Select Pickup Time') :
                                                        activeStep === 'RETURN_DATE' ? (t.booking?.delivery_schedule || 'Select Return Date') : (t.booking?.select_time || 'Select Return Time')}
                                        </h3>
                                        <button title="닫기" onClick={() => setActiveStep(null)}><X size={16} className="text-gray-400" /></button>
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

                                                // [스봉이] 서비스별/지점별 다이내믹 가드 💅
                                                const pickupEndLimit = isDelivery ? Math.min(bh.end, 15) : (bh.end - 1);
                                                const returnStartLimit = isDelivery ? Math.max(bh.start, 16) : bh.start;

                                                const serviceOk = activeStep.includes('PICKUP')
                                                    ? (parseInt(h.split(':')[0]) >= bh.start && h <= `${pickupEndLimit}:30`)
                                                    : (parseInt(h.split(':')[0]) >= returnStartLimit && parseInt(h.split(':')[0]) <= bh.end);

                                                if (!serviceOk) return null;
                                                return (
                                                    <button
                                                        key={h}
                                                        disabled={isPast}
                                                        onClick={() => {
                                                            if (activeStep === 'PICKUP_TIME') {
                                                                onTimeChange?.(h);
                                                                if (isDelivery || currentService === 'STORAGE') setActiveStep('RETURN_DATE');
                                                                else setActiveStep(null);
                                                            } else {
                                                                onReturnTimeChange?.(h);
                                                                setActiveStep(null);
                                                            }
                                                        }}
                                                        className={`py-3 px-4 rounded-xl text-[10px] font-black transition-all flex flex-col items-center justify-center gap-0.5 ${isPast ? 'bg-gray-50 text-gray-200 border-gray-50' : isSelected ? 'bg-bee-black text-bee-yellow' : 'bg-white border border-gray-100 hover:border-bee-yellow'}`}
                                                    >
                                                        <span>{h}</span>
                                                        {isPast && <span className="text-[7px] opacity-60">({lang === 'ko' ? '마감' : 'Closed'})</span>}
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

            {/* List Area - Horizontal Cards on Mobile, Vertical Scroll on PC 💅 */}
            <div className="flex-none md:flex-1 pointer-events-auto bg-transparent border-none mt-auto md:mt-0 h-auto md:h-full w-full max-w-full relative z-20 pb-6 md:pb-0 md:overflow-hidden">
                <div className="flex flex-row md:flex-col overflow-x-auto md:overflow-y-auto no-scrollbar snap-x snap-mandatory gap-3 md:gap-4 px-4 md:px-6 pt-2 md:pt-4 pb-4 md:h-full">
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
                                className={`group flex flex-row items-center gap-1.5 md:gap-3 p-1.5 md:p-3 rounded-[1.2rem] md:rounded-[1.4rem] text-left transition-all relative shrink-0 snap-center md:snap-start w-[115px] md:w-full md:max-w-[340px] md:mx-auto shadow-lg ${isSelected ? 'bg-white ring-4 ring-bee-yellow/50 shadow-xl' : 'bg-[#F2F2F6] hover:bg-white hover:shadow-xl'}`}
                            >
                                <div className="flex-1 flex flex-col items-start gap-0.5 md:gap-1.5 min-w-0">
                                    {/* 지점명 - 초소형 3열 최적화 */}
                                    <div className="text-[11px] md:text-[16px] font-[950] tracking-tighter md:tracking-tight whitespace-nowrap overflow-hidden text-ellipsis w-full text-gray-900 group-hover:text-bee-black transition-colors">
                                        {lang === 'ko' ? branch.name : (branch[`name_${lang.replace('-', '_').toLowerCase()}`] || branch.name_en || branch.name)}
                                    </div>

                                    {/* 상태 뱃지 - 더 작고 타이트하게 */}
                                    <div className={`px-1 py-0.5 rounded-full text-[6px] md:text-[9px] font-[800] uppercase tracking-wider w-fit ${isActive ? 'bg-[#E3F6ED] text-[#13A35E]' : 'bg-red-100 text-red-600'}`}>
                                        {isActive ? 'ACTIVE' : 'CLOSE'}
                                    </div>

                                    {/* 서비스 태그들 - 초미니 레이아웃 */}
                                    <div className="flex flex-wrap gap-0.5 mt-0.5">
                                        {branch.supportsDelivery && (
                                            <span className="px-1 py-0.5 rounded-full text-[6px] md:text-[9px] font-black uppercase tracking-tighter md:tracking-wider bg-white/90 text-gray-500 shadow-sm border border-black/5 whitespace-nowrap">
                                                {t.locations_page?.service_delivery || '배송'}
                                            </span>
                                        )}
                                        {branch.supportsStorage && (
                                            <span className="px-1 py-0.5 rounded-full text-[6px] md:text-[9px] font-black uppercase tracking-tighter md:tracking-wider bg-white/90 text-gray-500 shadow-sm border border-black/5 whitespace-nowrap">
                                                {t.locations_page?.service_storage || '보관'}
                                            </span>
                                        )}
                                    </div>
                                </div>

                                {/* 우측 이미지 - 초밀착 사이즈 💅 */}
                                <div className="relative w-10 h-10 md:w-16 md:h-16 shrink-0 rounded-[0.5rem] md:rounded-[0.9rem] overflow-hidden shadow-inner border-[1px] md:border-[1.5px] border-white/80 bg-gray-200">
                                    {branch.imageUrl ? (
                                        <img
                                            src={branch.imageUrl}
                                            alt={branch.name}
                                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-115"
                                            onError={(e) => {
                                                (e.currentTarget as HTMLImageElement).src = 'https://images.unsplash.com/photo-1580978640103-ba69fa7a9003?q=80&w=2670&auto=format&fit=crop';
                                            }}
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center bg-gray-100 text-gray-300">
                                            <i className="fa-solid fa-store text-sm md:text-xl"></i>
                                        </div>
                                    )}
                                </div>
                            </motion.button>
                        );
                    })}
                </div>

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
