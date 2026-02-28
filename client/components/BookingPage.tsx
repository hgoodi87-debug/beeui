
import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    X,
    MapPin,
    Clock,
    Truck,
    Vault,
    ShieldCheck,
    Calendar,
    ArrowRight,
    Info,
    CheckCircle2,
    AlertCircle,
    Package,
    ChevronLeft,
    RefreshCcw
} from 'lucide-react';
import { LocationOption, LocationType, ServiceType, BookingState, BookingStatus, BagSizes, PriceSettings, StorageTier } from '../types';
import { StorageService } from '../services/storageService';
import { formatKSTDate, isPastKSTTime, getLocalizedDate, getFirstAvailableSlot, isAllSlotsPast, addDaysToDateStr } from '../utils/dateUtils';
import { STORAGE_RATES, calculateStoragePrice } from '../utils/pricing';

interface BookingPageProps {
    t: any;
    lang: string;
    locations: LocationOption[];
    initialLocationId?: string;
    initialServiceType?: ServiceType;
    initialDate?: string;
    initialReturnDate?: string;
    initialBagSizes?: { S: number, M: number, L: number, XL: number };
    onBack: () => void;
    onSuccess: (booking: BookingState) => void;
    user?: any;
    customerBranchId?: string;
    customerBranchRates?: { delivery: number; storage: number };
}

const DEFAULT_DELIVERY_PRICES: PriceSettings = { S: 20000, M: 20000, L: 25000, XL: 29000 };

const BookingPage: React.FC<BookingPageProps> = ({
    t,
    lang,
    locations,
    initialLocationId,
    initialServiceType = ServiceType.STORAGE,
    initialDate,
    initialReturnDate,
    initialBagSizes,
    onBack,
    onSuccess,
    user,
    customerBranchId,
    customerBranchRates
}) => {
    const isMember = !!user && !user.isAnonymous;
    const defaultDate = formatKSTDate();

    const [deliveryPrices, setDeliveryPrices] = useState<PriceSettings>(DEFAULT_DELIVERY_PRICES);
    const [storageTiers, setStorageTiers] = useState<StorageTier[]>([]);

    // Fetch prices from Firestore on mount
    useEffect(() => {
        const fetchPrices = async () => {
            try {
                const [dPrices, sTiers] = await Promise.all([
                    StorageService.getDeliveryPrices(),
                    StorageService.getStorageTiers()
                ]);
                if (dPrices) setDeliveryPrices(dPrices);
                if (sTiers) setStorageTiers(sTiers);
            } catch (error) {
                console.error("Failed to fetch prices in BookingPage", error);
            }
        };
        fetchPrices();
    }, []);

    // Parse initial input (Format: "YYYY-MM-DD HH:mm") 💅
    const [initPickupDate, initPickupTime] = initialDate?.split(' ') || [initialDate, ''];
    const [initReturnDate, initReturnTime] = initialReturnDate?.split(' ') || [initialReturnDate, ''];

    const [booking, setBooking] = useState<Partial<BookingState>>({
        serviceType: initialServiceType,
        pickupLocation: initialLocationId || '',
        dropoffLocation: '',
        pickupDate: initPickupDate || defaultDate,
        pickupTime: initPickupTime || (initialServiceType === ServiceType.DELIVERY ? '09:00' : '10:00'),
        dropoffDate: initReturnDate || initPickupDate || defaultDate,
        deliveryTime: initReturnTime || (initialServiceType === ServiceType.DELIVERY ? '16:00' : '14:00'),
        bagSizes: initialBagSizes || { S: 0, M: 0, L: 0, XL: 0 },
        bags: initialBagSizes ? Object.values(initialBagSizes).reduce((a, b) => a + b, 0) : 0,
        userName: isMember ? (user.displayName || user.email?.split('@')[0] || 'Member') : '',
        userEmail: isMember ? (user.email || '') : '',
        snsChannel: 'kakao',
        snsId: isMember ? 'Google Login' : '',
        agreedToTerms: false,
        agreedToPrivacy: false,
        agreedToHighValue: false,
        agreedToPremium: false,
        insuranceLevel: 1,
        insuranceBagCount: 0
    });

    const parseBusinessHours = (hoursStr: string) => {
        if (!hoursStr || hoursStr === '24시간' || hoursStr === '24 Hours') return { start: 0, end: 24 };
        try {
            const parts = hoursStr.split('-').map(p => p.trim());
            if (parts.length !== 2) return { start: 9, end: 21 }; // Default
            const startStr = parts[0].split(':');
            const endStr = parts[1].split(':');
            return {
                start: parseInt(startStr[0]),
                end: parseInt(endStr[0])
            };
        } catch (e) {
            return { start: 9, end: 21 };
        }
    };

    const generateTimeSlots = (location: LocationOption | undefined, type: 'PICKUP' | 'DELIVERY') => {
        const bhStr = location?.businessHours || '09:00-21:00';
        const { start, end } = parseBusinessHours(bhStr);

        if (booking.serviceType === ServiceType.DELIVERY) {
            const slots = [];
            if (type === 'PICKUP') {
                // Pickup: 09:00 ~ 13:30 (Max 13:30) 💅
                const pickupEnd = 13.5;
                for (let i = start; i <= 13; i++) {
                    if (i < start) continue;
                    slots.push(`${i.toString().padStart(2, '0')}:00`);
                    if (i + 0.5 <= pickupEnd) {
                        slots.push(`${i.toString().padStart(2, '0')}:30`);
                    }
                }
            } else {
                // Delivery: 16:00 ~ 21:00 (Max 21:00 or Business End) 💅
                const deliveryStart = 16;
                const deliveryEnd = Math.min(end, 21);
                for (let i = deliveryStart; i <= deliveryEnd; i++) {
                    slots.push(`${i.toString().padStart(2, '0')}:00`);
                    if (i < deliveryEnd) {
                        slots.push(`${i.toString().padStart(2, '0')}:30`);
                    }
                }
            }
            return slots;
        }

        // STORAGE Logic: Based on business hours with 30min intervals
        const slots = [];
        for (let i = start; i < end; i++) {
            slots.push(`${i.toString().padStart(2, '0')}:00`);
            slots.push(`${i.toString().padStart(2, '0')}:30`);
        }
        slots.push(`${end.toString().padStart(2, '0')}:00`);
        return slots;
    };

    const [isSubmitting, setIsSubmitting] = useState(false);

    // 💅 BookingSuccess 첩크 미리 로딩 (lazy 플리커 방지)
    const prefetchBookingSuccess = () => {
        import('../components/BookingSuccess').catch(() => {
            // prefetch 실패해도 문제없음
        });
    };

    const pickupLoc = useMemo(() => locations.find(l => l.id === booking.pickupLocation), [locations, booking.pickupLocation]);
    const dropoffLoc = useMemo(() => locations.find(l => l.id === booking.dropoffLocation), [locations, booking.dropoffLocation]);

    // [스봉이] 공항 지각 안내 (인라인 알림으로 변경) 💅✨
    const isAirportSelection = useMemo(() => {
        const retrievalLoc = booking.serviceType === ServiceType.DELIVERY ? dropoffLoc : pickupLoc;
        return !!(retrievalLoc && (retrievalLoc.type === LocationType.AIRPORT || retrievalLoc.name?.includes('공항') || retrievalLoc.name_en?.toLowerCase().includes('airport')));
    }, [booking.serviceType, pickupLoc, dropoffLoc]);

    const originLocations = useMemo(() =>
        locations.filter(l => (l.isActive !== false) && (booking.serviceType === ServiceType.DELIVERY ? (l.supportsDelivery && l.isOrigin !== false) : l.supportsStorage)),
        [locations, booking.serviceType]
    );

    const destinationLocations = useMemo(() =>
        locations.filter(l => l.isActive !== false && l.id !== booking.pickupLocation && l.supportsDelivery && l.isDestination === true),
        [locations, booking.pickupLocation]
    );

    useEffect(() => {
        if (user && !user.isAnonymous) {
            setBooking(prev => ({
                ...prev,
                userName: user.displayName || user.email?.split('@')[0] || 'Member',
                userEmail: user.email || '',
                snsId: 'Google Login'
            }));
        }
    }, [user]);

    // Handle Smart Time Selection 💅✨
    useEffect(() => {
        // If it's today, find the first available slot
        const todayStr = formatKSTDate();
        if (booking.pickupDate === todayStr) {
            const slots = generateTimeSlots(pickupLoc, 'PICKUP');
            if (isAllSlotsPast(todayStr, slots)) {
                const tomorrowStr = addDaysToDateStr(todayStr, 1);
                setBooking(prev => ({
                    ...prev,
                    pickupDate: tomorrowStr,
                    dropoffDate: (prev.dropoffDate === todayStr || (prev.dropoffDate || '') < tomorrowStr) ? tomorrowStr : prev.dropoffDate
                }));
            } else {
                const firstSlot = getFirstAvailableSlot(todayStr, slots);
                // [스봉이 수정] 이미 선택한 시간이 유효하면 첫 슬롯으로 강제 변경 금지! 💅 
                const isCurrentValid = booking.pickupTime && !isPastKSTTime(todayStr, booking.pickupTime) && slots.includes(booking.pickupTime);

                if (!isCurrentValid && firstSlot && firstSlot !== booking.pickupTime) {
                    setBooking(prev => ({ ...prev, pickupTime: firstSlot }));
                }
            }
        }
    }, [booking.pickupDate, pickupLoc, booking.serviceType]);

    useEffect(() => {
        const todayStr = formatKSTDate();
        if ((booking.dropoffDate === todayStr || (!booking.dropoffDate && booking.pickupDate === todayStr)) && booking.serviceType === ServiceType.DELIVERY) {
            const slots = generateTimeSlots(pickupLoc, 'DELIVERY');
            if (isAllSlotsPast(booking.dropoffDate || todayStr, slots)) {
                const tomorrowStr = addDaysToDateStr(booking.dropoffDate || todayStr, 1);
                setBooking(prev => ({ ...prev, dropoffDate: tomorrowStr }));
            } else {
                const firstSlot = getFirstAvailableSlot(booking.dropoffDate || todayStr, slots);
                // [스봉이 수정] 이미 선택한 시간이 유효하면(마감 안됐고 슬롯에 있으면) 그대로 유지! 💅
                const isCurrentValid = booking.deliveryTime && !isPastKSTTime(booking.dropoffDate || todayStr, booking.deliveryTime) && slots.includes(booking.deliveryTime);

                if (!isCurrentValid && firstSlot && firstSlot !== booking.deliveryTime) {
                    setBooking(prev => ({ ...prev, deliveryTime: firstSlot }));
                }
            }
        }

        // 💅 Storage: Ensure dropoffDate >= pickupDate AND Initialize Retrieval Time
        if (booking.serviceType === ServiceType.STORAGE) {
            const pDate = booking.pickupDate || todayStr;
            if (!booking.dropoffDate || booking.dropoffDate < pDate) {
                setBooking(prev => ({ ...prev, dropoffDate: pDate }));
            }

            // If dropoff date is same as pickup date, check if deliveryTime is before pickupTime
            if (booking.dropoffDate === pDate && booking.pickupTime) {
                if (!booking.deliveryTime || booking.deliveryTime <= booking.pickupTime) {
                    const slots = generateTimeSlots(pickupLoc, 'PICKUP');
                    const nextSlotIdx = slots.indexOf(booking.pickupTime) + 1;
                    if (nextSlotIdx > 0 && nextSlotIdx < slots.length) {
                        setBooking(prev => ({ ...prev, deliveryTime: slots[nextSlotIdx] }));
                    } else {
                        // if no next slot today, shift dropoff date to tomorrow
                        setBooking(prev => ({ ...prev, dropoffDate: addDaysToDateStr(pDate, 1), deliveryTime: slots[0] || '10:00' }));
                    }
                }
            } else if (!booking.deliveryTime) {
                setBooking(prev => ({ ...prev, deliveryTime: '18:00' })); // Default to evening
            }
        }
    }, [booking.dropoffDate, booking.pickupDate, pickupLoc, booking.serviceType, booking.deliveryTime, booking.pickupTime]);

    const updateBagCount = (size: keyof BagSizes, delta: number) => {
        setBooking(prev => {
            const current = prev.bagSizes?.[size] || 0;
            const next = Math.max(0, current + delta);
            return {
                ...prev,
                bagSizes: {
                    ...prev.bagSizes!,
                    [size]: next
                }
            };
        });
    };

    const priceDetails = useMemo(() => {
        const { S = 0, M = 0, L = 0, XL = 0 } = booking.bagSizes || {};
        const originSurcharge = pickupLoc?.originSurcharge || 0;
        const destSurcharge = dropoffLoc?.destinationSurcharge || 0;

        let base = 0;
        let breakdown = '';
        let durationText = '';

        if (booking.serviceType === ServiceType.DELIVERY) {
            const deliveryBase = (S * (deliveryPrices.S || 15000)) + (M * deliveryPrices.M) + (L * deliveryPrices.L) + (XL * deliveryPrices.XL);

            // Overnight Storage Fee calculation
            const pickupD = new Date(booking.pickupDate || '');
            const deliveryD = new Date(booking.dropoffDate || booking.pickupDate || '');
            const diffDays = Math.max(0, Math.floor((deliveryD.getTime() - pickupD.getTime()) / (1000 * 60 * 60 * 24)));

            let storageFee = 0;
            if (diffDays > 0) {
                storageFee = (S * (STORAGE_RATES.S.day1)) + (M * STORAGE_RATES.M.day1) + (L * STORAGE_RATES.L.day1) + (XL * STORAGE_RATES.XL.day1);
                storageFee *= diffDays;
                durationText = lang.startsWith('ko') ? `${diffDays}일 보관 포함` : `${diffDays}d storage incl.`;
                breakdown = lang.startsWith('ko') ? `기본배송 + ${diffDays}일 보관료` : `Base delivery + ${diffDays}d storage`;
            }

            base = deliveryBase + storageFee;
        } else {
            // STORAGE: Dynamic Pricing
            const pickupDateTime = new Date(`${booking.pickupDate}T${booking.pickupTime}`);
            const retrievalDateTime = new Date(`${booking.dropoffDate || booking.pickupDate}T${booking.deliveryTime || '23:59'}`);

            if (!isNaN(pickupDateTime.getTime()) && !isNaN(retrievalDateTime.getTime())) {
                const result = calculateStoragePrice(pickupDateTime, retrievalDateTime, booking.bagSizes || { S: 0, M: 0, L: 0, XL: 0 }, lang);
                base = result.total;
                breakdown = result.breakdown;
                durationText = result.durationText;

                // If total is 0 but bags are selected, show minimum (4h) price as preview 💅
                if (base === 0 && (S + M + L + XL) > 0) {
                    base = (S * STORAGE_RATES.S.hours4) + (M * STORAGE_RATES.M.hours4) + (L * STORAGE_RATES.L.hours4) + (XL * STORAGE_RATES.XL.hours4);
                    durationText = lang.startsWith('ko') ? '기본 4시간 예상' : 'Est. 4h base';
                }
            }
        }

        const totalBags = S + M + L + XL;

        let insuranceFee = 0;
        if (booking.agreedToPremium) {
            insuranceFee = 5000 * (booking.insuranceLevel || 1) * Math.max(1, totalBags);
        }

        return {
            base,
            originSurcharge,
            destSurcharge,
            insuranceFee,
            total: base + originSurcharge + destSurcharge + insuranceFee,
            breakdown,
            durationText
        };
    }, [booking.bagSizes, booking.agreedToPremium, booking.insuranceLevel, pickupLoc, dropoffLoc, deliveryPrices, storageTiers, booking.serviceType, booking.pickupDate, booking.pickupTime, booking.dropoffDate, booking.deliveryTime]);

    const tBooking = t.booking || {};
    const handleBook = async () => {
        console.log("[BookingPage] handleBook triggered. Current state:", booking);

        if (!isMember) {
            if (!booking.userName || !booking.userEmail || !booking.snsId) {
                alert(tBooking.alert_fill_info || 'Please fill in your information.');
                return;
            }
        }
        if (!booking.agreedToTerms || !booking.agreedToPrivacy || !booking.agreedToHighValue) {
            alert(tBooking.alert_agree_terms || 'Please agree to the terms.');
            return;
        }
        if (booking.serviceType === ServiceType.DELIVERY && !booking.dropoffLocation) {
            alert(tBooking.select_dest || 'Please select a destination.');
            return;
        }

        setIsSubmitting(true);


        // 💅 Custom Reservation Code Generation
        // Delivery: [OriginShort]-[DestShort]-[Random4] (e.g. MYN-IN1T-1234)
        // Storage: [BranchShort]-[Random4] (e.g. MYN-5678)
        const generateShortCode = () => {
            const random4 = Math.floor(1000 + Math.random() * 9000).toString();

            if (booking.serviceType === ServiceType.DELIVERY) {
                const origin = originLocations.find(l => l.id === booking.pickupLocation);
                const dest = destinationLocations.find((l: LocationOption) => l.id === booking.dropoffLocation);
                const originCode = origin?.shortCode || booking.pickupLocation || 'UNK';
                const destCode = dest?.shortCode || booking.dropoffLocation || 'UNK';
                return `${originCode}-${destCode}-${random4}`;
            } else {
                const storageLoc = originLocations.find(l => l.id === booking.pickupLocation);
                const locCode = storageLoc?.shortCode || booking.pickupLocation || 'UNK';
                return `${locCode}-${random4}`;
            }
        };

        const generatedCode = generateShortCode();

        const finalBooking: BookingState = {
            ...booking as BookingState,
            id: booking.id || generatedCode,
            reservationCode: generatedCode,
            pickupLoc: pickupLoc, // Ensure full object is passed for voucher 💅
            returnLoc: booking.serviceType === ServiceType.DELIVERY ? dropoffLoc : undefined,
            price: priceDetails.total,
            finalPrice: priceDetails.total,
            status: BookingStatus.PENDING,
            createdAt: new Date().toISOString(),
            bags: (booking.bagSizes?.S || 0) + (booking.bagSizes?.M || 0) + (booking.bagSizes?.L || 0) + (booking.bagSizes?.XL || 0),
            pickupLocation: booking.pickupLocation || '',
            dropoffLocation: booking.dropoffLocation || '',
            pickupDate: booking.pickupDate || '',
            pickupTime: booking.pickupTime || '',
            dropoffDate: booking.dropoffDate || '',
            deliveryTime: booking.deliveryTime || '',
            bagSizes: booking.bagSizes || { S: 0, M: 0, L: 0, XL: 0 },
            language: lang, // 'ko', 'en', 'zh', 'zh-HK', 'zh-TW', etc 그대로 저장
            branchId: customerBranchId,
            branchCommissionRates: customerBranchRates
        };

        console.log("[BookingPage] Final booking data object created:", finalBooking);

        const channelMap: Record<string, any> = {
            kakao: 'KakaoTalk',
            line: 'Line',
            instagram: 'Instagram',
            whatsapp: 'WhatsApp',
            wechat: 'WeChat'
        };
        finalBooking.snsType = channelMap[booking.snsChannel || 'kakao'] || 'None';

        try {
            // 💅 데이터를 확실하게 클론해서 넘겼줍니다. (App.tsx에서 상태 업데이트가 꼬이지 않게!)
            const clonedBooking = JSON.parse(JSON.stringify(finalBooking));
            setIsSubmitting(false); // navigate 전에 스피너 해제
            onSuccess(clonedBooking);
        } catch (e) {
            console.error("Booking Error", e);
            alert("Booking Failed. Please try again.");
            setIsSubmitting(false);
        }
    };

    const getLocName = (l: LocationOption | undefined) => {
        if (!l) return '';
        // 'zh', 'zh-HK', 'zh-TW' 지원을 위한 개선
        const dbLang = (lang === 'zh' || lang === 'zh-HK' || lang === 'zh-TW') ? 'zh' : lang;

        if (lang === 'ko' || lang === 'ko-KR') return l.name;
        // Priority: name_lang -> name_en -> name
        return (l[`name_${dbLang}` as keyof LocationOption] as string) || l.name_en || l.name;
    };


    return (
        <div className="w-full min-h-screen bg-white">
            {/* Header */}
            <div className="sticky top-0 bg-white/95 backdrop-blur-md border-b border-gray-100 px-6 py-4 flex justify-between items-center z-50">
                <div className="flex items-center gap-4">
                    <button
                        title={t.common?.back || "Back"}
                        aria-label={t.common?.back || "Back"}
                        onClick={onBack}
                        className="p-2 hover:bg-gray-100 rounded-full transition-colors text-bee-black"
                    >
                        <ChevronLeft size={24} />
                    </button>
                    <h2 className="text-xl font-black italic tracking-tighter flex items-center gap-2">
                        <span className="text-bee-yellow">BEE</span> {t.bee_ai?.header || "RESERVATION"}
                    </h2>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 py-8 md:px-8 md:py-12">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">

                    {/* Left Column: Input Forms */}
                    <div className="lg:col-span-7 space-y-10">
                        {/* Step 1: Locations & Schedule */}
                        <section className="space-y-6">
                            <div className="flex items-center gap-4">
                                <div className="w-8 h-8 bg-bee-black text-bee-yellow rounded-full flex items-center justify-center text-xs font-black italic">01</div>
                                <h3 className="text-xl font-black italic uppercase tracking-tight">{tBooking.schedule_info || 'Schedule & Locations'}</h3>
                            </div>

                            <div className="p-8 bg-gray-50 rounded-[2.5rem] border border-gray-100">
                                {/* Service Type Toggle - Modified Position */}
                                <div className="flex bg-white rounded-xl p-1 border border-gray-200 mb-8 max-w-sm mx-auto">
                                    <button
                                        onClick={() => setBooking(prev => ({ ...prev, serviceType: ServiceType.DELIVERY }))}
                                        className={`flex-1 py-3 rounded-lg text-xs font-black transition-all ${booking.serviceType === ServiceType.DELIVERY ? 'bg-bee-black text-bee-yellow shadow-md' : 'text-gray-400 hover:bg-gray-50'}`}
                                    >
                                        {t.booking?.delivery || 'DELIVERY'}
                                    </button>
                                    <button
                                        onClick={() => setBooking(prev => ({ ...prev, serviceType: ServiceType.STORAGE }))}
                                        className={`flex-1 py-3 rounded-lg text-xs font-black transition-all ${booking.serviceType === ServiceType.STORAGE ? 'bg-bee-yellow text-bee-black shadow-md' : 'text-gray-400 hover:bg-gray-50'}`}
                                    >
                                        {t.booking?.storage || 'STORAGE'}
                                    </button>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-4">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{booking.serviceType === ServiceType.DELIVERY ? tBooking.from : tBooking.select_storage}</label>
                                            <select
                                                title="Select Pickup Location"
                                                aria-label="Select Pickup Location"
                                                value={booking.pickupLocation}
                                                onChange={(e) => setBooking(prev => ({ ...prev, pickupLocation: e.target.value }))}
                                                className="w-full p-4 bg-white border-2 border-bee-yellow rounded-2xl font-bold text-sm outline-none focus:border-bee-yellow"
                                            >
                                                <option value="">{booking.serviceType === ServiceType.DELIVERY ? tBooking.select_origin : tBooking.select_storage}</option>
                                                {originLocations.map(loc => (
                                                    <option key={loc.id} value={loc.id}>{getLocName(loc)}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{tBooking.pickup_schedule || 'Pickup Schedule'}</label>
                                            <div className="flex gap-2">
                                                <div className="flex-1 relative">
                                                    <input
                                                        type="date"
                                                        title="Pickup Date"
                                                        aria-label="Pickup Date"
                                                        value={booking.pickupDate?.split(' ')[0]}
                                                        min={formatKSTDate()}
                                                        onChange={e => setBooking(prev => ({ ...prev, pickupDate: e.target.value }))}
                                                        className="w-full p-4 bg-white border border-gray-100 rounded-2xl font-bold text-sm outline-none text-transparent"
                                                    />
                                                    <div className="absolute inset-0 flex items-center px-4 pointer-events-none font-bold text-sm text-gray-900">
                                                        {getLocalizedDate(booking.pickupDate || '', lang)}
                                                    </div>
                                                </div>
                                                <div className="flex-1 relative">
                                                    <select
                                                        title="Pickup Time"
                                                        aria-label="Pickup Time"
                                                        value={booking.pickupTime}
                                                        onChange={e => setBooking(prev => ({ ...prev, pickupTime: e.target.value }))}
                                                        className="w-full p-4 bg-white border border-gray-100 rounded-2xl font-bold text-sm outline-none focus:border-bee-yellow appearance-none cursor-pointer pr-10"
                                                    >
                                                        {generateTimeSlots(pickupLoc, 'PICKUP').map(h => {
                                                            const isPast = isPastKSTTime(booking.pickupDate || '', h);
                                                            return (
                                                                <option key={h} value={h} disabled={isPast}>
                                                                    {h} {isPast ? `(${t.booking?.slot_past || '마감'})` : ''}
                                                                </option>
                                                            );
                                                        })}
                                                    </select>
                                                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                                                        <Clock size={16} />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-4">


                                        {booking.serviceType === ServiceType.DELIVERY ? (
                                            <>
                                                <div className="space-y-2">
                                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{tBooking.to || 'To'}</label>
                                                    <select
                                                        title="Select Dropoff Location"
                                                        aria-label="Select Dropoff Location"
                                                        value={booking.dropoffLocation}
                                                        onChange={e => setBooking(prev => ({ ...prev, dropoffLocation: e.target.value }))}
                                                        className="w-full p-4 bg-white border border-gray-200 rounded-2xl font-bold text-sm outline-none focus:border-bee-yellow transition-colors"
                                                    >
                                                        <option value="">{tBooking.select_dest || 'Select Destination'}</option>
                                                        {destinationLocations.map(loc => (
                                                            <option key={loc.id} value={loc.id}>
                                                                {getLocName(loc)} {loc.destinationSurcharge ? `(+₩${loc.destinationSurcharge.toLocaleString()})` : ''}
                                                            </option>
                                                        ))}
                                                    </select>
                                                </div>
                                                <div className="space-y-2">
                                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{tBooking.delivery_schedule || 'Delivery Schedule'}</label>
                                                    <div className="flex gap-2">
                                                        <div className="flex-1 relative">
                                                            <input
                                                                type="date"
                                                                title="Delivery Date"
                                                                aria-label="Delivery Date"
                                                                value={booking.dropoffDate}
                                                                min={booking.pickupDate}
                                                                onChange={e => setBooking(prev => ({ ...prev, dropoffDate: e.target.value }))}
                                                                className="w-full p-4 bg-white border border-gray-100 rounded-2xl font-bold text-sm outline-none focus:border-bee-yellow text-transparent"
                                                            />
                                                            <div className="absolute inset-0 flex items-center px-4 pointer-events-none font-bold text-sm text-gray-900">
                                                                {getLocalizedDate(booking.dropoffDate || '', lang)}
                                                            </div>
                                                        </div>
                                                        <div className="flex-1 relative">
                                                            <select
                                                                title="Delivery Time"
                                                                aria-label="Delivery Time"
                                                                value={booking.deliveryTime}
                                                                onChange={e => setBooking(prev => ({ ...prev, deliveryTime: e.target.value }))}
                                                                className="w-full p-4 bg-white border border-gray-100 rounded-2xl font-bold text-sm outline-none focus:border-bee-yellow appearance-none cursor-pointer pr-10"
                                                            >
                                                                {generateTimeSlots(pickupLoc, 'DELIVERY').map(h => {
                                                                    const isPast = isPastKSTTime(booking.dropoffDate || '', h);
                                                                    return (
                                                                        <option key={h} value={h} disabled={isPast}>
                                                                            {h} {isPast ? `(${t.booking?.slot_past || '마감'})` : ''}
                                                                        </option>
                                                                    );
                                                                })}
                                                            </select>
                                                            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                                                                <Clock size={16} />
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </>
                                        ) : (
                                            <>
                                                <div className="space-y-2 invisible pointer-events-none select-none" aria-hidden="true">
                                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Duration</label>
                                                    <div className="w-full p-4 border border-transparent rounded-2xl font-bold text-sm">Spacer</div>
                                                </div>
                                                <div className="space-y-2">
                                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{tBooking.dropoff_schedule || tBooking.return_schedule_label || 'Retrieval Schedule'}</label>
                                                    <div className="flex gap-2">
                                                        <div className="flex-1 relative">
                                                            <input
                                                                type="date"
                                                                title="Drop-off Date"
                                                                aria-label="Drop-off Date"
                                                                value={booking.dropoffDate?.split(' ')[0]}
                                                                min={booking.pickupDate || formatKSTDate()}
                                                                onChange={e => setBooking(prev => ({ ...prev, dropoffDate: e.target.value }))}
                                                                className="w-full p-4 bg-white border border-gray-100 rounded-2xl font-bold text-sm outline-none text-transparent"
                                                            />
                                                            <div className="absolute inset-0 flex items-center px-4 pointer-events-none font-bold text-sm text-gray-900">
                                                                {getLocalizedDate(booking.dropoffDate || '', lang)}
                                                            </div>
                                                        </div>
                                                        <div className="flex-1 relative">
                                                            <select
                                                                title="Retrieval Time"
                                                                aria-label="Retrieval Time"
                                                                value={booking.deliveryTime}
                                                                onChange={e => setBooking(prev => ({ ...prev, deliveryTime: e.target.value }))}
                                                                className="w-full p-4 bg-white border border-gray-100 rounded-2xl font-bold text-sm outline-none focus:border-bee-yellow appearance-none cursor-pointer pr-10"
                                                            >
                                                                {generateTimeSlots(pickupLoc, 'PICKUP').map(h => {
                                                                    const isRetrievalPast = isPastKSTTime(booking.dropoffDate || '', h);
                                                                    const isBeforePickup = (booking.dropoffDate === booking.pickupDate) && (h <= (booking.pickupTime || '00:00'));
                                                                    const isDisabled = isRetrievalPast || isBeforePickup;
                                                                    return (
                                                                        <option key={h} value={h} disabled={isDisabled}>
                                                                            {h} {isRetrievalPast ? `(${t.booking?.slot_past || '마감'})` : ''}
                                                                        </option>
                                                                    );
                                                                })}
                                                            </select>
                                                            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                                                                <Clock size={16} />
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </>
                                        )}
                                    </div>

                                    {/* [스봉이] 공항 지각 인라인 안내 🐝 */}
                                    <AnimatePresence>
                                        {isAirportSelection && (
                                            <motion.div
                                                initial={{ opacity: 0, height: 0, marginTop: 0 }}
                                                animate={{ opacity: 1, height: 'auto', marginTop: 24 }}
                                                exit={{ opacity: 0, height: 0, marginTop: 0 }}
                                                className="overflow-hidden"
                                            >
                                                <div className="p-5 bg-bee-yellow/10 border border-bee-yellow/30 rounded-3xl flex items-start gap-4 shadow-sm">
                                                    <div className="w-10 h-10 bg-bee-yellow/20 rounded-full flex items-center justify-center shrink-0 shadow-inner">
                                                        <AlertCircle className="text-bee-yellow" size={20} />
                                                    </div>
                                                    <div>
                                                        <p className="text-[10px] font-black text-bee-black mb-1 italic uppercase tracking-widest opacity-60">Airport Notice</p>
                                                        <p className="text-xs font-bold text-bee-black leading-relaxed">
                                                            {t.booking?.airport_late_notice}
                                                        </p>
                                                    </div>
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            </div>
                        </section>

                        {/* Step 2: Bags */}
                        <section className="space-y-6">
                            <div className="flex items-center gap-4">
                                <div className="w-8 h-8 bg-bee-black text-bee-yellow rounded-full flex items-center justify-center text-xs font-black italic">02</div>
                                <h3 className="text-xl font-black italic uppercase tracking-tight">{tBooking.bags_label || 'Baggage Selection'}</h3>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                {Object.entries(booking.bagSizes || {}).map(([size, count]) => {
                                    const isDelivery = booking.serviceType === ServiceType.DELIVERY;
                                    const unitPrice = isDelivery
                                        ? (deliveryPrices[size as keyof PriceSettings] || 0)
                                        : (STORAGE_RATES[size as keyof BagSizes]?.hours4 || 0);

                                    return (
                                        <div key={size} className="flex flex-col p-4 border border-gray-100 rounded-2xl bg-white hover:border-bee-yellow transition-all gap-3 shadow-sm">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center shrink-0">
                                                    <Package className="text-gray-400" size={20} />
                                                </div>
                                                <div className="min-w-0">
                                                    <div className="text-[9px] text-gray-500 font-bold truncate mb-0.5 uppercase tracking-tighter opacity-80">
                                                        {size === 'S' && (lang.startsWith('ko') ? '기내용/소형백' : 'Cabin/Small')}
                                                        {size === 'M' && (lang.startsWith('ko') ? '작은 캐리어' : 'Carry-on Bag')}
                                                        {size === 'L' && (lang.startsWith('ko') ? '위탁 수하물' : 'Checked Bag')}
                                                        {size === 'XL' && (lang.startsWith('ko') ? '대형/특입' : 'Extra Large')}
                                                    </div>
                                                    <div className="flex flex-col gap-0.5">
                                                        <span className="font-black text-xl leading-none">{size}</span>
                                                        <span className="text-[10px] text-bee-yellow font-extrabold leading-tight">
                                                            (₩{unitPrice.toLocaleString()}{!isDelivery && (lang.startsWith('ko') ? '/4시간~' : '/4h~')})
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="flex items-center justify-between pt-2 border-t border-gray-50">
                                                <button
                                                    title="Decrease"
                                                    aria-label="Decrease"
                                                    onClick={() => updateBagCount(size as keyof BagSizes, -1)}
                                                    className="w-8 h-8 rounded-full border border-gray-200 flex items-center justify-center hover:bg-gray-50 disabled:opacity-50 transition-colors"
                                                    disabled={count === 0}
                                                >
                                                    <i className="fa-solid fa-minus text-[10px]"></i>
                                                </button>
                                                <span className="font-black text-base">{count}</span>
                                                <button
                                                    title="Increase"
                                                    aria-label="Increase"
                                                    onClick={() => updateBagCount(size as keyof BagSizes, 1)}
                                                    className="w-8 h-8 rounded-full bg-bee-black text-bee-yellow flex items-center justify-center hover:bg-gray-800 transition-colors shadow-sm"
                                                >
                                                    <i className="fa-solid fa-plus text-[10px]"></i>
                                                </button>
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        </section>

                        {/* Step 3: User Info */}
                        <section className="space-y-6">
                            <div className="flex items-center gap-4">
                                <div className="w-8 h-8 bg-bee-black text-bee-yellow rounded-full flex items-center justify-center text-xs font-black italic">03</div>
                                <h3 className="text-xl font-black italic uppercase tracking-tight">{tBooking.contact_info_title || tBooking.contact_info || 'Contact Information'}</h3>
                            </div>

                            <div className="p-8 bg-white border border-gray-100 rounded-[2.5rem] space-y-4 shadow-sm">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{tBooking.name || 'Name'}</label>
                                        <input
                                            type="text"
                                            title="Your Name"
                                            aria-label="Your Name"
                                            value={booking.userName}
                                            onChange={e => setBooking(prev => ({ ...prev, userName: e.target.value }))}
                                            placeholder={tBooking.name || "Your Name"}
                                            className="w-full p-4 bg-gray-50 rounded-2xl font-bold text-sm outline-none focus:bg-white focus:ring-2 focus:ring-bee-yellow/50 transition-all"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{tBooking.email || 'Email'}</label>
                                        <input
                                            type="email"
                                            title="Your Email"
                                            aria-label="Your Email"
                                            value={booking.userEmail}
                                            onChange={e => setBooking(prev => ({ ...prev, userEmail: e.target.value }))}
                                            placeholder="email@example.com"
                                            className="w-full p-4 bg-gray-50 rounded-2xl font-bold text-sm outline-none focus:bg-white focus:ring-2 focus:ring-bee-yellow/50 transition-all"
                                        />
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{tBooking.sns || 'SNS Channel'}</label>
                                        <select
                                            title="SNS Channel"
                                            aria-label="SNS Channel"
                                            value={booking.snsChannel}
                                            onChange={e => setBooking(prev => ({ ...prev, snsChannel: e.target.value }))}
                                            className="w-full p-4 bg-gray-50 rounded-2xl font-bold text-sm outline-none focus:bg-white focus:ring-2 focus:ring-bee-yellow/50 transition-all"
                                        >
                                            <option value="kakao">KakaoTalk</option>
                                            <option value="line">Line</option>
                                            <option value="whatsapp">WhatsApp</option>
                                            <option value="instagram">Instagram</option>
                                            <option value="wechat">WeChat</option>
                                        </select>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{tBooking.snsId || 'SNS ID'}</label>
                                        <input
                                            type="text"
                                            title="SNS ID"
                                            aria-label="SNS ID"
                                            value={booking.snsId}
                                            onChange={e => setBooking(prev => ({ ...prev, snsId: e.target.value }))}
                                            placeholder={tBooking.snsId || "ID"}
                                            className="w-full p-4 bg-gray-50 rounded-2xl font-bold text-sm outline-none focus:bg-white focus:ring-2 focus:ring-bee-yellow/50 transition-all"
                                        />
                                    </div>
                                </div>
                            </div>
                        </section>
                    </div>

                    {/* Right Column: Summary & Checkout */}
                    <div className="lg:col-span-5">
                        <div className="sticky top-24 space-y-4">
                            <div className="bg-bee-black text-white p-8 rounded-[2.5rem] shadow-2xl relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-bee-yellow rounded-full blur-3xl opacity-20 -mr-10 -mt-10"></div>

                                <h3 className="text-xl font-black italic uppercase tracking-tight mb-8 relative z-10">{tBooking.summary || 'Booking Summary'}</h3>

                                <div className="space-y-4 relative z-10">
                                    <div className="flex justify-between items-center py-2 border-b border-white/10">
                                        <span className="text-gray-400 font-bold text-xs uppercase">{tBooking.service_label || 'Service'}</span>
                                        <span className="font-bold text-bee-yellow">{booking.serviceType === ServiceType.DELIVERY ? (tBooking.delivery || 'Delivery') : (tBooking.storage || 'Storage')}</span>
                                    </div>

                                    {/* Detailed Bags Breakdown */}
                                    <div className="py-2 border-b border-white/10 space-y-2">
                                        <span className="text-gray-400 font-bold text-xs uppercase">{tBooking.bags_label || 'Bags'}</span>
                                        <div className="space-y-1">
                                            {Object.entries(booking.bagSizes || {}).map(([size, count]) => {
                                                if (count === 0) return null;
                                                const isDelivery = booking.serviceType === ServiceType.DELIVERY;
                                                let itemPrice = 0;

                                                if (isDelivery) {
                                                    const unitPrice = deliveryPrices[size as keyof PriceSettings] || 0;
                                                    itemPrice = unitPrice * count;
                                                } else {
                                                    // 💅 Recalculate accurate price for this bag type/count based on duration
                                                    const pickupDateTime = new Date(`${booking.pickupDate}T${booking.pickupTime}`);
                                                    const retrievalDateTime = new Date(`${booking.dropoffDate || booking.pickupDate}T${booking.deliveryTime || '23:59'}`);
                                                    if (!isNaN(pickupDateTime.getTime()) && !isNaN(retrievalDateTime.getTime())) {
                                                        // Calculate for specific bag size
                                                        const singleBagSizes = { S: 0, M: 0, L: 0, XL: 0, [size]: count };
                                                        const res = calculateStoragePrice(pickupDateTime, retrievalDateTime, singleBagSizes, lang);
                                                        itemPrice = res.total;

                                                        // Min price guard (if 0, fallback to 4h)
                                                        if (itemPrice === 0) {
                                                            const rate = STORAGE_RATES[size as keyof BagSizes]?.hours4 || 0;
                                                            itemPrice = rate * count;
                                                        }
                                                    }
                                                }

                                                return (
                                                    <div key={size} className="flex justify-between items-center text-[11px]">
                                                        <span className="text-white/70">{size} SIZE x {count}</span>
                                                        <span className="font-bold">₩{itemPrice.toLocaleString()}</span>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>

                                    {/* Surcharges & Insurance */}
                                    {(priceDetails.originSurcharge > 0 || priceDetails.destSurcharge > 0 || priceDetails.insuranceFee > 0) && (
                                        <div className="py-2 border-b border-white/10 space-y-2 text-[11px]">
                                            {priceDetails.originSurcharge > 0 && (
                                                <div className="flex justify-between items-center">
                                                    <span className="text-white/70">{tBooking.origin_surcharge || 'Origin Surcharge'}</span>
                                                    <span className="font-bold">+₩{priceDetails.originSurcharge.toLocaleString()}</span>
                                                </div>
                                            )}
                                            {priceDetails.destSurcharge > 0 && (
                                                <div className="flex justify-between items-center">
                                                    <span className="text-white/70">{tBooking.dest_surcharge || 'Destination Surcharge'}</span>
                                                    <span className="font-bold">+₩{priceDetails.destSurcharge.toLocaleString()}</span>
                                                </div>
                                            )}
                                            {priceDetails.insuranceFee > 0 && (
                                                <div className="flex justify-between items-center">
                                                    <span className="text-bee-yellow">{tBooking.insurance_fee || 'Premium Insurance'}</span>
                                                    <span className="font-bold text-bee-yellow">+₩{priceDetails.insuranceFee.toLocaleString()}</span>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    <div className="flex justify-between items-center py-4">
                                        <span className="text-gray-400 font-black text-sm uppercase">{tBooking.total_label || 'TOTAL'}</span>
                                        <div className="text-right">
                                            <span className="block font-black text-3xl italic">₩{priceDetails.total.toLocaleString()}</span>
                                            {priceDetails.durationText && (
                                                <span className="block text-xs text-bee-yellow font-bold mt-1">
                                                    {priceDetails.durationText}
                                                    {priceDetails.breakdown && <span className="block text-[10px] text-gray-400 font-normal">{priceDetails.breakdown}</span>}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-8 space-y-3 relative z-10">
                                    <label className="flex items-start gap-3 cursor-pointer group">
                                        <input title="Agree to Terms" type="checkbox" checked={booking.agreedToTerms} onChange={e => setBooking(prev => ({ ...prev, agreedToTerms: e.target.checked }))} className="w-5 h-5 mt-0.5 accent-bee-yellow rounded" />
                                        <div className="flex flex-col">
                                            <span className="text-xs text-white/80 group-hover:text-white transition-colors">
                                                {tBooking.agree_terms_simple || '[Required] Agree to Terms'}
                                                <button onClick={(e) => { e.preventDefault(); window.open('/terms', '_blank'); }} className="ml-1 text-bee-yellow hover:underline font-bold">
                                                    {tBooking.agree_terms_link || '[Link]'}
                                                </button>
                                            </span>
                                        </div>
                                    </label>
                                    <label className="flex items-start gap-3 cursor-pointer group">
                                        <input title="Agree to Privacy Policy" type="checkbox" checked={booking.agreedToPrivacy} onChange={e => setBooking(prev => ({ ...prev, agreedToPrivacy: e.target.checked }))} className="w-5 h-5 mt-0.5 accent-bee-yellow rounded" />
                                        <div className="flex flex-col">
                                            <span className="text-xs text-white/80 group-hover:text-white transition-colors">
                                                {tBooking.agree_privacy_simple || '[Required] Agree to Privacy Policy'}
                                                <button onClick={(e) => { e.preventDefault(); window.open('/privacy-policy', '_blank'); }} className="ml-1 text-bee-yellow hover:underline font-bold">
                                                    {tBooking.agree_privacy_link || '[Link]'}
                                                </button>
                                            </span>
                                        </div>
                                    </label>
                                    <label className="flex items-start gap-3 cursor-pointer group">
                                        <input title="Agree to High Value Item Policy" type="checkbox" checked={booking.agreedToHighValue} onChange={e => setBooking(prev => ({ ...prev, agreedToHighValue: e.target.checked }))} className="w-5 h-5 mt-0.5 accent-bee-yellow rounded" />
                                        <span className="text-xs text-white/80 group-hover:text-white transition-colors">{tBooking.agree_high_value_simple || '[Required] High Value Item Policy'}</span>
                                    </label>
                                </div>

                                {/* Restricted Items Checklist */}
                                <div className="mt-6 p-5 bg-white/5 rounded-2xl border border-white/10">
                                    <h4 className="text-[10px] font-black text-bee-yellow uppercase tracking-widest mb-3 flex items-center gap-2">
                                        <AlertCircle size={12} /> {tBooking.agree_premium_checklist || 'Restricted Items Checklist'}
                                    </h4>
                                    <ul className="space-y-2">
                                        {tBooking.restricted_items?.map((item: string, idx: number) => (
                                            <li key={idx} className="flex items-start gap-2 text-[10px] text-white/70 leading-tight">
                                                <div className="w-1 h-1 bg-bee-yellow rounded-full mt-1.5 flex-shrink-0" />
                                                {item}
                                            </li>
                                        ))}
                                    </ul>
                                    <p className="mt-3 text-[9px] text-white/50 italic">
                                        {tBooking.restricted_items_note}
                                    </p>
                                </div>

                                <button
                                    onClick={handleBook}
                                    onMouseEnter={prefetchBookingSuccess}
                                    onFocus={prefetchBookingSuccess}
                                    disabled={isSubmitting}
                                    className="w-full mt-8 py-4 bg-bee-yellow text-bee-black font-black text-lg rounded-2xl shadow-lg hover:bg-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                >
                                    {isSubmitting ? (
                                        <div className="w-5 h-5 border-2 border-bee-black border-t-transparent rounded-full animate-spin" />
                                    ) : (
                                        <>
                                            {tBooking.book_now || 'COMPLETE BOOKING'} <ArrowRight size={20} />
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>

                </div>
            </div>

        </div>
    );
};

export default BookingPage;
