import React from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Search, MapPin, LocateFixed, Plane, Store, Calendar, Clock, Wallet, Luggage, Handshake, ArrowRight, X, ChevronLeft, ChevronRight } from "lucide-react";
import BaggageCounter from './BaggageCounter';
import { generateTimeSlots, isPastKSTTime, getFirstAvailableSlot, formatKSTDate } from '../../utils/dateUtils';
import { formatDistance } from '../../utils/locationUtils';
import { BagCategoryId } from '../../src/domains/booking/bagCategoryUtils';
import { BagSizes } from '../../types';


interface LocationListProps {
    t: any;
    lang: string;
    searchTerm: string;
    onSearchChange: (val: string) => void;
    onSearchSubmit?: (val: string) => void;
    filteredBranches: any[];
    totalBranchCount?: number;
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
    baggageCounts: BagSizes;
    onBaggageChange: (categoryId: BagCategoryId, delta: number) => void;
    deliveryPrices?: any;
    onBack?: () => void;
    onFindMyLocation?: () => void;
}

const LocationList: React.FC<LocationListProps> = ({
    t, lang, searchTerm, onSearchChange, onSearchSubmit, filteredBranches, totalBranchCount, selectedBranch, onBranchClick, currentService, onServiceChange, onReset,
    bookingDate, onDateChange, bookingTime, onTimeChange,
    returnDate, onReturnDateChange, returnTime, onReturnTimeChange,
    baggageCounts, onBaggageChange,
    deliveryPrices,
    onBack,
    onFindMyLocation
}) => {
    const INITIAL_BRANCH_RENDER_COUNT = 8;
    const SEARCH_BRANCH_RENDER_COUNT = 16;
    const BRANCH_RENDER_BATCH_SIZE = 10;
    const BRANCH_RENDER_INTERVAL_MS = 70;
    const [activeStep, setActiveStep] = React.useState<'BAGGAGE' | 'PICKUP_DATE' | 'PICKUP_TIME' | 'RETURN_DATE' | 'RETURN_TIME' | null>(null);
    const [visibleBranchCount, setVisibleBranchCount] = React.useState(INITIAL_BRANCH_RENDER_COUNT);

    const isDelivery = currentService === 'SAME_DAY' || currentService === 'SCHEDULED';
    const normalizedSearchTerm = searchTerm.trim();
    const hiddenBranchCount = Math.max((totalBranchCount || filteredBranches.length) - filteredBranches.length, 0);
    const selectedBranchIndex = React.useMemo(
        () => filteredBranches.findIndex((branch) => branch.id === selectedBranch?.id),
        [filteredBranches, selectedBranch?.id]
    );
    const visibleBranches = React.useMemo(() => {
        const minimumCount = selectedBranchIndex >= 0 ? selectedBranchIndex + 1 : 0;
        const safeCount = Math.max(visibleBranchCount, minimumCount);
        return filteredBranches.slice(0, safeCount);
    }, [filteredBranches, visibleBranchCount, selectedBranchIndex]);

    React.useEffect(() => {
        const minimumVisibleCount = normalizedSearchTerm ? SEARCH_BRANCH_RENDER_COUNT : INITIAL_BRANCH_RENDER_COUNT;
        const nextVisibleCount = Math.min(
            filteredBranches.length,
            Math.max(minimumVisibleCount, selectedBranchIndex >= 0 ? selectedBranchIndex + 1 : 0)
        );

        React.startTransition(() => {
            setVisibleBranchCount(nextVisibleCount);
        });

        if (filteredBranches.length <= nextVisibleCount) {
            return;
        }

        let cancelled = false;
        let timerId: number | null = null;

        const pump = () => {
            timerId = window.setTimeout(() => {
                if (cancelled) return;

                React.startTransition(() => {
                    setVisibleBranchCount((prev) => {
                        const next = Math.min(
                            filteredBranches.length,
                            Math.max(prev + BRANCH_RENDER_BATCH_SIZE, selectedBranchIndex >= 0 ? selectedBranchIndex + 1 : 0)
                        );

                        if (next < filteredBranches.length && !cancelled) {
                            pump();
                        }

                        return next;
                    });
                });
            }, BRANCH_RENDER_INTERVAL_MS);
        };

        pump();

        return () => {
            cancelled = true;
            if (timerId) {
                window.clearTimeout(timerId);
            }
        };
    }, [filteredBranches, normalizedSearchTerm, selectedBranchIndex]);

    // [스봉이] 영업시간 파싱 및 동적 슬롯 생성 💅
    const bh = React.useMemo(() => {
        const bhStr = selectedBranch?.businessHours || '09:00-21:00';
        if (!bhStr || bhStr === '24시간' || bhStr === '24 Hours') return { start: 0, end: 24 };
        try {
            const parts = bhStr.split('-').map((p: string) => p.trim());
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
    const formatToMMDD = React.useCallback((dateStr: string | undefined) => {
        if (!dateStr || dateStr === '--.--') return '--.--';
        const match = dateStr.match(/(\d{4})-(\d{2})-(\d{2})/);
        if (match) return `${match[2]}.${match[3]}`;
        return dateStr;
    }, []);

    return (
        <div className="flex flex-col h-full overflow-hidden md:pointer-events-auto select-none pointer-events-none md:border-r md:weightless-glass relative z-20">
            {/* Header / Search Area - Floating Card Design on Mobile, Sticky Header on PC 💅 */}
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex-none overflow-hidden pointer-events-auto p-4 md:p-6 bg-white/80 md:backdrop-blur-3xl shadow-2xl md:shadow-none border-b border-white/20 rounded-b-[2.5rem] md:rounded-b-none relative z-30"
            >
                <div onClick={onBack} className="inline-flex items-center gap-2 md:gap-3 mb-3 md:mb-5 cursor-pointer group px-1">
                    <div className="flex items-center justify-center w-7 h-7 md:w-8 md:h-8 rounded-full bg-gray-100 group-hover:bg-bee-yellow transition-all shadow-sm">
                        <ChevronLeft className="w-4 h-4 md:w-5 md:h-5 text-gray-900" />
                    </div>
                    <div className="flex flex-col">
                        <h1 className="text-xl md:text-3xl font-black italic tracking-[-0.08em] uppercase text-gray-900 leading-none font-montserrat">
                            {t.locations_page?.sidebar_subtitle || 'Service Points'}
                        </h1>
                    </div>
                </div>

                <div className="flex flex-col gap-3 md:gap-5">
                    {/* [스봉이] 본부장님 안목에 맞춘 '슬림 & 스마트 & 와이드' 필터바 💅 */}
                    <div className="flex flex-wrap items-stretch gap-2 md:gap-4 overflow-x-visible no-scrollbar pb-1 md:pb-0 w-full">
                        {/* 서비스 선택 (배송/보관) - 슬림하게 다이어트! */}
                        <div className="flex-1 flex bg-gray-100/60 p-1 md:p-1 rounded-full border border-gray-100 shadow-inner min-w-[110px] md:min-w-[120px]">
                            {(['DELIVERY', 'STORAGE'] as const).map((type) => {
                                const isCurrent = type === 'DELIVERY' ? (currentService === 'SAME_DAY' || currentService === 'SCHEDULED') : currentService === 'STORAGE';
                                return (
                                    <button
                                        key={type}
                                        onClick={(e) => { e.stopPropagation(); onServiceChange(type === 'DELIVERY' ? 'SAME_DAY' : 'STORAGE'); }}
                                        className={`flex-1 px-1.5 md:px-3 py-2 md:py-2.5 rounded-full text-[10px] md:text-[13px] font-black italic tracking-tighter uppercase transition-all relative z-10 font-montserrat ${isCurrent ? 'text-bee-black' : 'text-gray-400'}`}
                                    >
                                        <span className="relative z-10">{type === 'DELIVERY' ? (t.locations_page?.badge_delivery || 'DEL') : (t.locations_page?.badge_storage || 'STO')}</span>
                                        {isCurrent && <motion.div layoutId="service-bg-premium-v1" className="absolute inset-0 bg-bee-yellow rounded-full shadow-lg" />}
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
                            aria-label={lang.startsWith('ko') ? '가방 선택 열기' : 'Open baggage selector'}
                            className={`flex flex-col md:flex-row items-center justify-center gap-0.5 md:gap-1.5 px-2.5 md:px-3 py-1.5 md:py-2 rounded-full border transition-all duration-300 shadow-md min-w-[45px] md:min-w-[60px] ${activeStep === 'BAGGAGE' ? 'bg-bee-black border-bee-black text-bee-yellow' : 'bg-white border-gray-200 text-gray-900 hover:border-bee-yellow'}`}
                        >
                            <Luggage className={`w-3.5 h-3.5 md:w-4 md:h-4 ${activeStep === 'BAGGAGE' ? 'text-bee-yellow' : 'text-gray-400'}`} />
                            <span className="text-[11px] md:text-[14px] font-[1000] italic tracking-tighter leading-none">
                                {baggageCounts ? Object.values(baggageCounts as unknown as Record<string, number>).reduce((a, b) => (a || 0) + (b || 0), 0) : 0}
                            </span>
                        </button>

                        {/* 날짜 & 시간 선택 (맡기기/찾기) - 슬림 와이드 & 스마트 정보 노출 💅 */}
                        <div className="flex-[4] flex items-center gap-1.5 md:gap-2 bg-white/80 backdrop-blur-md rounded-full border border-white/50 shadow-xl px-3 md:px-4 py-2 md:py-2 shrink-0 transition-all justify-between min-w-[220px] flex-wrap md:flex-nowrap">
                            <button onClick={(e) => {
                                e.stopPropagation();
                                const next = activeStep === 'PICKUP_DATE' ? null : 'PICKUP_DATE';
                                setActiveStep(next);
                            }} className="flex-1 flex items-center gap-2 md:gap-2 shrink-0 py-1.5 md:py-1.5 hover:bg-black/5 rounded-2xl transition-all justify-center">
                                <div className="bg-bee-yellow text-bee-black text-[9px] md:text-[10px] font-black px-2 md:px-3 h-6 md:h-7 flex items-center justify-center rounded-full uppercase tracking-tighter shrink-0 shadow-md border border-bee-black/5 whitespace-nowrap font-montserrat">
                                    {lang === 'ko' ? (isDelivery ? '보내는날' : '맡기는 날') : (t.locations_page?.badge_pick?.slice(0, 1) || 'P')}
                                </div>
                                <div className="flex items-baseline gap-1.5 md:gap-2">
                                    <span className="text-[14px] md:text-[17px] font-black text-gray-900 italic tracking-tighter whitespace-nowrap font-montserrat">{formatToMMDD(bookingDate)}</span>
                                    <span className="text-[9px] md:text-[11px] font-black text-bee-black/40 italic tracking-tighter font-montserrat">{bookingTime || '--:--'}</span>
                                </div>
                            </button>
                            <div className="w-[1.5px] md:w-[1.5px] h-8 md:h-10 bg-gray-100 shrink-0" />
                            <button onClick={(e) => {
                                e.stopPropagation();
                                const next = activeStep === 'RETURN_DATE' ? null : 'RETURN_DATE';
                                setActiveStep(next);
                            }} className="flex-1 flex items-center gap-2 md:gap-2 shrink-0 py-1.5 md:py-1.5 hover:bg-black/5 rounded-2xl transition-all justify-center">
                                <div className="bg-gray-100 text-gray-400 text-[9px] md:text-[10px] font-black px-2 md:px-3 h-6 md:h-7 flex items-center justify-center rounded-full uppercase tracking-tighter shrink-0 shadow-md border border-gray-200 whitespace-nowrap font-montserrat">
                                    {lang === 'ko' ? (isDelivery ? '받는날' : '찾는 날') : (t.locations_page?.badge_ret?.slice(0, 1) || 'R')}
                                </div>
                                <div className="flex items-baseline gap-1.5 md:gap-2">
                                    <span className="text-[14px] md:text-[17px] font-black text-gray-900 italic tracking-tighter whitespace-nowrap font-montserrat">{formatToMMDD(returnDate)}</span>
                                    <span className="text-[9px] md:text-[11px] font-black text-gray-400/60 italic tracking-tighter font-montserrat">{returnTime || '--:--'}</span>
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
                            className="flex items-center gap-1.5 md:gap-2 px-4 py-3 md:py-2.5 bg-white border border-gray-100 rounded-full shadow-lg hover:shadow-xl transition-all shrink-0 active:scale-95 pointer-events-auto"
                        >
                            <div className="w-5 h-5 md:w-6 md:h-6 flex items-center justify-center rounded-full bg-blue-50 text-blue-500 shadow-sm">
                                <LocateFixed className="w-3 md:w-3.5 h-3 md:h-3.5 fill-current" />
                            </div>
                            <span className="text-[11px] md:text-[13px] font-black text-gray-900 tracking-[-0.05em] whitespace-nowrap font-montserrat italic uppercase">
                                {t.locations_page?.find_my_location_short || '내 위치'}
                            </span>
                        </button>
                    </div>

                    {/* Date/Time Accordion / Baggage Side Sheet 💅 */}
                    {activeStep === 'BAGGAGE' && typeof document !== 'undefined' && createPortal(
                        <motion.div
                            key="baggage-sheet-portal"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 z-[9999] flex justify-end pointer-events-none"
                        >
                                <motion.div
                                    initial={{ x: "100%" }}
                                    animate={{ x: 0 }}
                                    exit={{ x: "100%" }}
                                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                                    className="pointer-events-auto relative h-full w-full max-w-[420px] overflow-y-auto bg-white shadow-[-12px_0_50px_rgba(0,0,0,0.12)] backdrop-blur-3xl border-l border-gray-100"
                                >
                                <div className="absolute left-0 top-1/2 -translate-x-full -translate-y-1/2 hidden md:flex">
                                    <button
                                        title="닫기"
                                        onClick={() => setActiveStep(null)}
                                        className="group h-14 w-8 flex items-center justify-center rounded-l-2xl bg-white border border-r-0 border-gray-100 shadow-[-4px_0_12px_rgba(0,0,0,0.05)] text-gray-400 hover:text-bee-black transition-all"
                                    >
                                        <ChevronRight className="h-5 w-5" />
                                    </button>
                                </div>

                                <div className="sticky top-0 z-10 flex items-center justify-between border-b border-gray-100 bg-white/95 px-6 py-5 backdrop-blur-md">
                                    <div className="flex flex-col">
                                        <h3 className="text-[16px] font-black italic tracking-tighter text-gray-900 uppercase font-montserrat">
                                            {t.booking?.bags_selection_title || 'Select Baggage'}
                                        </h3>
                                        <p className="text-[9px] font-black text-bee-black/30 uppercase tracking-widest leading-none mt-1 font-montserrat">Premium Luggage Care</p>
                                    </div>
                                    <button title="닫기" onClick={() => setActiveStep(null)} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                                        <X size={20} className="text-gray-900" />
                                    </button>
                                </div>
                                <div className="p-2.5 sm:p-3">
                                    <div className="rounded-[1.1rem] border border-gray-100 bg-gray-50/50 p-2 shadow-sm">
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
                                </div>
                            </motion.div>
                        </motion.div>,
                        document.body
                    )}

                    <AnimatePresence>
                        {activeStep && activeStep !== 'BAGGAGE' && (
                            <motion.div
                                key="datetime-accordion"
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: "auto", opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                className="mt-4 bg-gray-50/50 rounded-[2rem] border border-gray-100 overflow-hidden relative z-50"
                            >
                                <div className="p-6">
                                    <div className="flex items-center justify-between mb-4">
                                        <h3 className="text-sm font-black italic tracking-tighter text-gray-900">
                                            {activeStep === 'PICKUP_DATE' ? (t.booking?.pickup_schedule || 'Select Pickup Date') :
                                                activeStep === 'PICKUP_TIME' ? (t.booking?.select_time || 'Select Pickup Time') :
                                                    activeStep === 'RETURN_DATE' ? (t.booking?.delivery_schedule || 'Select Return Date') : (t.booking?.select_time || 'Select Return Time')}
                                        </h3>
                                        <button title="닫기" onClick={() => setActiveStep(null)}><X size={16} className="text-gray-400" /></button>
                                    </div>

                                    {activeStep.includes('DATE') ? (
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
                                            isDelivery={isDelivery}
                                            bh={bh}
                                            timeSlotsOrig={timeSlotsOrig}
                                            currentService={currentService}
                                        />
                                    ) : (
                                        <div className="max-h-[250px] overflow-y-auto no-scrollbar grid grid-cols-2 gap-2 p-1">
                                            {timeSlotsOrig.map((h) => {
                                                const isPast = activeStep === 'PICKUP_TIME' ? isPastKSTTime(bookingDate || '', h) : (isPastKSTTime(returnDate || '', h) || (returnDate === bookingDate && h <= (bookingTime || '')));
                                                const isSelected = activeStep === 'PICKUP_TIME' ? bookingTime === h : returnTime === h;

                                                const isPickupStep = activeStep.includes('PICKUP');
                                                const pickupLimit = isDelivery ? 13.5 : (bh.end - 0.5);
                                                const returnStart = isDelivery ? 16 : bh.start;
                                                const returnLimit = isDelivery ? Math.min(21, bh.end) : (bh.end - 0.5);

                                                const [hour, min] = h.split(':').map(Number);
                                                const timeVal = hour + min / 60;

                                                let serviceOk = false;
                                                if (isPickupStep) {
                                                    serviceOk = timeVal >= bh.start && timeVal <= pickupLimit;
                                                } else {
                                                    serviceOk = timeVal >= returnStart && timeVal <= returnLimit;
                                                }

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

            <AnimatePresence>
                {activeStep === 'BAGGAGE' && typeof document !== 'undefined' && createPortal(
                    <motion.div
                        key="baggage-sheet-portal"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[9999] flex justify-end pointer-events-none"
                    >
                    <motion.div
                        initial={{ x: "100%" }}
                        animate={{ x: 0 }}
                        exit={{ x: "100%" }}
                        transition={{ type: "spring", stiffness: 300, damping: 30 }}
                        className="pointer-events-auto relative h-full w-full max-w-[420px] overflow-y-auto bg-white shadow-[-12px_0_50px_rgba(0,0,0,0.12)] backdrop-blur-3xl border-l border-gray-100 no-scrollbar"
                    >
                            <div className="absolute left-0 top-1/2 -translate-x-full -translate-y-1/2 hidden md:flex">
                                <button
                                    title="닫기"
                                    onClick={() => setActiveStep(null)}
                                    className="group h-14 w-8 flex items-center justify-center rounded-l-2xl bg-white border border-r-0 border-gray-100 shadow-[-4px_0_12px_rgba(0,0,0,0.05)] text-gray-400 hover:text-bee-black transition-all"
                                >
                                    <ChevronRight className="h-5 w-5" />
                                </button>
                            </div>

                            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-gray-100 bg-white/95 px-6 py-5 backdrop-blur-md">
                                <div className="flex flex-col">
                                    <h3 className="text-[16px] font-black italic tracking-tighter text-gray-900 uppercase font-montserrat">
                                        {t.booking?.bags_selection_title || 'Select Baggage'}
                                    </h3>
                                    <p className="text-[9px] font-black text-bee-black/30 uppercase tracking-widest leading-none mt-1 font-montserrat">Premium Luggage Care</p>
                                </div>
                                <button title="닫기" onClick={() => setActiveStep(null)} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                                    <X size={20} className="text-gray-900" />
                                </button>
                            </div>
                            <div className="p-2.5 sm:p-3">
                                <div className="rounded-[1.1rem] border border-gray-100 bg-gray-50/50 p-2 shadow-sm">
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
                            </div>
                        </motion.div>
                    </motion.div>,
                    document.body
                )}
            </AnimatePresence>

            {/* List Area - Horizontal Cards on Mobile, Vertical Scroll on PC 💅 */}
            <div className="flex-none md:flex-1 pointer-events-auto bg-transparent border-none mt-auto md:mt-0 h-auto md:h-full w-full max-w-full relative z-20 pb-6 md:pb-0 md:overflow-hidden">
                <div className="flex flex-row md:flex-col overflow-x-auto md:overflow-y-auto no-scrollbar snap-x snap-mandatory gap-3 md:gap-4 px-4 md:px-6 pt-2 md:pt-4 pb-4 md:h-full">
                    {visibleBranches.map((branch, index) => {
                        const isSelected = selectedBranch?.id === branch.id;
                        const isActive = branch.isActive !== false;

                        // [스봉이] 가장 가까운 지점 찾기 (정렬된 상태라면 index 0)
                        const isClosest = index === 0 && branch && branch.distance !== undefined && branch.distance < 5; // 5km 이내면 가깝다고 해줄게요 💅

                        return (
                            <motion.button
                                key={branch.id}
                                layout
                                whileHover={{ x: 6, scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={() => onBranchClick(branch)}
                                className={`group flex flex-row items-center gap-3 md:gap-5 p-2 md:p-5 rounded-[1.8rem] md:rounded-[2.5rem] text-left transition-all relative shrink-0 snap-center md:snap-start w-[140px] md:w-full md:mx-auto shadow-xl border border-white/20 ${isSelected ? 'bg-white ring-4 ring-bee-yellow/50 shadow-2xl scale-[1.02]' : 'bg-white/40 backdrop-blur-md hover:bg-white hover:shadow-2xl'}`}
                            >
                                {isClosest && (
                                    <div className="absolute -top-2 -left-2 z-30 bg-bee-black text-bee-yellow text-[8px] md:text-[10px] font-black px-2 py-1 rounded-lg shadow-lg border border-bee-yellow/30 animate-bounce font-montserrat italic uppercase tracking-tighter">
                                        Closest ✨
                                    </div>
                                )}

                                <div className="flex-1 flex flex-col items-start gap-1 md:gap-2.5 min-w-0">
                                    <div className="text-[12px] md:text-[20px] font-black tracking-[-0.05em] whitespace-nowrap overflow-hidden text-ellipsis w-full text-gray-900 group-hover:text-bee-black transition-colors">
                                        {(() => {
                                            if (lang === 'ko') return branch.name;
                                            const lk = lang.replace('-', '_').toLowerCase();
                                            if (branch[`name_${lk}`]) return branch[`name_${lk}`];
                                            if (lk.startsWith('zh') && branch.name_zh) return branch.name_zh;
                                            return branch.name_en || branch.name;
                                        })()}
                                    </div>

                                    <div className="flex items-center gap-1.5">
                                        <div className={`px-2 py-0.5 rounded-full text-[7px] md:text-[10px] font-black uppercase tracking-wider w-fit border shadow-sm ${isActive ? 'bg-[#E3F6ED] text-[#13A35E] border-[#13A35E]/20' : 'bg-red-50 text-red-600 border-red-200'}`}>
                                            {isActive ? 'ACTIVE' : 'CLOSE'}
                                        </div>
                                        {branch.distance !== undefined && (
                                            <div className="text-[8px] md:text-[12px] font-black text-blue-500 italic font-montserrat">
                                                {formatDistance(branch.distance, lang)}
                                            </div>
                                        )}
                                    </div>

                                    <div className="flex flex-wrap items-center gap-1.5 mt-1">
                                        {branch.supportsDelivery && (
                                            <span className="px-1.5 py-0.5 rounded-full text-[7px] md:text-[11px] font-black uppercase tracking-tighter bg-bee-black text-bee-yellow shadow-md whitespace-nowrap font-montserrat italic">
                                                {t.locations_page?.service_delivery || 'DEL'}
                                            </span>
                                        )}
                                        {branch.supportsStorage && (
                                            <span className="px-1.5 py-0.5 rounded-full text-[7px] md:text-[11px] font-black uppercase tracking-tighter bg-bee-yellow text-bee-black shadow-md whitespace-nowrap font-montserrat italic">
                                                {t.locations_page?.service_storage || 'STO'}
                                            </span>
                                        )}
                                    </div>
                                </div>

                                <div className="relative w-12 h-12 md:w-24 md:h-24 shrink-0 rounded-[1.2rem] md:rounded-[2rem] overflow-hidden shadow-2xl border-2 border-white/50 bg-gray-100/50 backdrop-blur-sm">
                                    {branch.imageUrl ? (
                                        <img
                                            src={branch.imageUrl}
                                            alt={`${branch.name} 빌리버 짐보관 배송 지점`}
                                            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-125"
                                            onError={(e) => {
                                                (e.currentTarget as HTMLImageElement).src = 'https://images.unsplash.com/photo-1580978640103-ba69fa7a9003?q=80&w=2670&auto=format&fit=crop';
                                            }}
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center bg-gray-50 text-gray-200">
                                            <Store className="w-6 h-6 md:w-10 md:h-10" />
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

                {filteredBranches.length > 0 && hiddenBranchCount > 0 && (
                    <div className="px-4 md:px-6 pt-1">
                        <div className="inline-flex items-center gap-2 px-3 py-2 rounded-full bg-white/70 backdrop-blur-md border border-white/40 shadow-sm text-[10px] md:text-[11px] font-black text-gray-500 uppercase tracking-[0.08em]">
                            <span className="w-1.5 h-1.5 rounded-full bg-bee-yellow" />
                            {lang === 'ko'
                                ? `가까운 3개 지점만 표시 중 · ${hiddenBranchCount}개는 지도에서 확인`
                                : `Showing nearest 3 · ${hiddenBranchCount} more on map`}
                        </div>
                    </div>
                )}

                {visibleBranches.length > 0 && visibleBranches.length < filteredBranches.length && (
                    <div className="px-4 md:px-6 pt-1">
                        <div className="inline-flex items-center gap-2 px-3 py-2 rounded-full bg-white/70 backdrop-blur-md border border-white/40 shadow-sm text-[10px] md:text-[11px] font-black text-gray-500 uppercase tracking-[0.12em]">
                            <span className="w-1.5 h-1.5 rounded-full bg-bee-yellow animate-pulse" />
                            {lang === 'ko'
                                ? `지점 ${visibleBranches.length}/${filteredBranches.length} 불러오는 중`
                                : `Loading ${visibleBranches.length}/${filteredBranches.length}`}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

// [스봉이] 캘린더 뷰는 밖으로 빼야 성능이 영롱해집니다 💅
const CalendarView = ({
    selectedDate,
    onSelect,
    minDate,
    lang,
    isDelivery,
    bh,
    timeSlotsOrig,
    currentService
}: {
    selectedDate: string;
    onSelect: (date: string) => void;
    minDate?: string;
    lang: string;
    isDelivery: boolean;
    bh: { start: number; end: number };
    timeSlotsOrig: string[];
    currentService: string;
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
                            const pickupLimit = isDelivery ? 13.5 : (bh.end - 1);
                            const pickupSlots = timeSlotsOrig.filter(h => {
                                const [hour, min] = h.split(':').map(Number);
                                const timeVal = hour + min / 60;
                                return timeVal >= bh.start && timeVal <= pickupLimit;
                            });
                            const hasPickup = !!getFirstAvailableSlot(dStr, pickupSlots);

                            let hasReturn = true;
                            if (currentService === 'SAME_DAY') {
                                const returnStart = 16;
                                const returnLimit = bh.end - 0.5;
                                const returnSlots = timeSlotsOrig.filter(h => {
                                    const [hour, min] = h.split(':').map(Number);
                                    const timeVal = hour + min / 60;
                                    return timeVal >= returnStart && timeVal <= returnLimit;
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

export default React.memo(LocationList);
