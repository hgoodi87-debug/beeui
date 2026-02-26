
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
    ChevronRight,
    Search,
    Ticket
} from 'lucide-react';
import { LocationOption, ServiceType, BookingState, BookingStatus, BagSizes, PriceSettings, StorageTier, DiscountCode } from '../types';
import { StorageService } from '../services/storageService';
import { formatKSTDate, isPastKSTTime, getLocalizedDate, getFirstAvailableSlot, generateTimeSlots, calculateDaysDifference } from '../utils/dateUtils';

interface BookingDetailedProps {
    t: any;
    lang: string;
    selectedLocation: LocationOption;
    locations: LocationOption[];
    serviceType: ServiceType;
    initialDate: string;
    initialBags: BagSizes;
    onClose: () => void;
    onSuccess: (booking: BookingState) => void;
    user?: any; // Add user prop
}

const DEFAULT_DELIVERY_PRICES: PriceSettings = { S: 20000, M: 20000, L: 25000, XL: 29000 };

const BookingDetailed: React.FC<BookingDetailedProps> = ({
    t,
    lang,
    selectedLocation,
    locations,
    serviceType,
    initialDate,
    initialBags,
    onClose,
    onSuccess,
    user
}) => {
    const isMember = !!user && !user.isAnonymous;

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
                console.error("Failed to fetch prices in BookingDetailed", error);
            }
        };
        fetchPrices();
    }, []);

    const [booking, setBooking] = useState<Partial<BookingState>>({
        serviceType,
        pickupLocation: selectedLocation.id,
        dropoffLocation: '',
        pickupDate: initialDate,
        pickupTime: serviceType === ServiceType.DELIVERY ? '09:00' : '10:00',
        dropoffDate: initialDate,
        deliveryTime: serviceType === ServiceType.DELIVERY ? '16:00' : '11:00',
        bagSizes: initialBags,
        bags: (initialBags.S || 0) + (initialBags.M || 0) + (initialBags.L || 0) + (initialBags.XL || 0),
        userName: isMember ? (user.displayName || user.email?.split('@')[0] || 'Member') : '',
        userEmail: isMember ? (user.email || '') : '',
        snsChannel: 'kakao',
        snsId: isMember ? 'Google Login' : '',
        agreedToTerms: false,
        agreedToPrivacy: false,
        agreedToHighValue: false,
        agreedToPremium: false,
        insuranceLevel: 1,
        insuranceBagCount: (initialBags.S || 0) + (initialBags.M || 0) + (initialBags.L || 0) + (initialBags.XL || 0)
    });

    const [couponInput, setCouponInput] = useState('');
    const [appliedCoupon, setAppliedCoupon] = useState<DiscountCode | null>(null);
    const [couponError, setCouponError] = useState('');
    const [isValidatingCoupon, setIsValidatingCoupon] = useState(false);

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

    const getSlotsForType = (location: LocationOption | undefined, type: 'PICKUP' | 'DELIVERY') => {
        if (serviceType === ServiceType.DELIVERY) {
            if (type === 'PICKUP') {
                return generateTimeSlots(9, 14, 30); // 09:00 - 14:00 (마지막 슬롯 13:30)
            } else {
                return generateTimeSlots(16, 21, 30); // 16:00 - 21:00
            }
        }

        // STORAGE Logic: Based on business hours
        const bhStr = location?.businessHours || '09:00-21:00';
        const { start, end } = parseBusinessHours(bhStr);
        return generateTimeSlots(start, end, 30);
    };

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

    const pickupLoc = useMemo(() => locations.find(l => l.id === booking.pickupLocation), [locations, booking.pickupLocation]);
    const dropoffLoc = useMemo(() => locations.find(l => l.id === booking.dropoffLocation), [locations, booking.dropoffLocation]);

    // Handle Smart Time Selection 💅✨
    useEffect(() => {
        // If it's today, find the first available slot
        const todayStr = formatKSTDate();
        if (booking.pickupDate === todayStr) {
            const slots = getSlotsForType(pickupLoc, 'PICKUP');
            const firstSlot = getFirstAvailableSlot(todayStr, slots);
            if (firstSlot && firstSlot !== booking.pickupTime) {
                setBooking(prev => ({ ...prev, pickupTime: firstSlot }));
            }
        }
    }, [booking.pickupDate, pickupLoc, booking.serviceType]);

    useEffect(() => {
        const todayStr = formatKSTDate();
        const dropoffDate = booking.dropoffDate || todayStr;
        if ((dropoffDate === todayStr) && booking.serviceType === ServiceType.DELIVERY) {
            const slots = getSlotsForType(pickupLoc, 'DELIVERY');
            const firstSlot = getFirstAvailableSlot(dropoffDate, slots);
            if (firstSlot && firstSlot !== booking.deliveryTime) {
                setBooking(prev => ({ ...prev, deliveryTime: firstSlot }));
            }
        }
    }, [booking.dropoffDate, booking.pickupDate, pickupLoc, booking.serviceType]);

    const [isSubmitting, setIsSubmitting] = useState(false);

    const destinationLocations = useMemo(() =>
        locations.filter(l => l.isActive !== false && l.id !== booking.pickupLocation && l.supportsDelivery && l.isDestination === true),
        [locations, booking.pickupLocation]
    );

    const priceDetails = useMemo(() => {
        const { S = 0, M = 0, L = 0, XL = 0 } = booking.bagSizes || {};

        let base = 0;
        let storageFee = 0;
        if (serviceType === ServiceType.DELIVERY) {
            base = (S * (deliveryPrices.S || 15000)) + (M * deliveryPrices.M) + (L * deliveryPrices.L) + (XL * deliveryPrices.XL);

            // [스봉이 수지타산 로직] 배송인데 날짜가 다르면 보관료 추가 💰💅
            const daysDiff = calculateDaysDifference(booking.pickupDate || '', booking.dropoffDate || booking.pickupDate || '');
            if (daysDiff > 0) {
                const day1Tier = storageTiers.find(t => t.id === 'st-1d') || storageTiers[0];
                const day1Prices = day1Tier?.prices || { S: 2000, M: 3000, L: 5000, XL: 7000 };
                storageFee = daysDiff * ((S * (day1Prices.S || 2000)) + (M * day1Prices.M) + (L * day1Prices.L) + (XL * day1Prices.XL));
            }
        } else {
            // Storage calculation
            const selectedTierId = booking.selectedStorageTierId || 'st-1d';
            const tier = storageTiers.find(t => t.id === selectedTierId) || storageTiers[0];
            if (tier && tier.prices) {
                base = ((S || 0) * (tier.prices.S || 2000)) + ((M || 0) * (tier.prices.M || 0)) + ((L || 0) * (tier.prices.L || 0)) + ((XL || 0) * (tier.prices.XL || 0));
            } else {
                base = ((S || 0) * 2000) + ((M || 0) * 3000) + ((L || 0) * 5000) + ((XL || 0) * 7000);
            }
        }

        const originSurcharge = pickupLoc?.originSurcharge || 0;
        const destSurcharge = dropoffLoc?.destinationSurcharge || 0;

        let insuranceFee = 0;
        if (booking.agreedToPremium) {
            insuranceFee = 5000 * (booking.insuranceLevel || 1) * (booking.bags || 1);
        }

        const discountAmount = appliedCoupon ? (appliedCoupon.amountPerBag * (booking.bags || 0)) : 0;

        return {
            base,
            storageFee,
            originSurcharge,
            destSurcharge,
            insuranceFee,
            discountAmount,
            total: Math.max(0, base + storageFee + originSurcharge + destSurcharge + insuranceFee - discountAmount)
        };
    }, [booking.bagSizes, booking.agreedToPremium, booking.insuranceLevel, booking.bags, pickupLoc, dropoffLoc, deliveryPrices, storageTiers, serviceType, booking.selectedStorageTierId, appliedCoupon]);

    const handleApplyCoupon = async () => {
        if (!couponInput.trim()) return;
        setIsValidatingCoupon(true);
        setCouponError('');
        try {
            const coupon = await StorageService.validateDiscountCode(couponInput.trim());
            if (!coupon) {
                setCouponError(lang === 'ko' ? '유효하지 않은 쿠폰 코드입니다.' : 'Invalid coupon code.');
                setAppliedCoupon(null);
                return;
            }

            // Service Type Validation
            if (coupon.allowedService && coupon.allowedService !== 'ALL') {
                if (coupon.allowedService !== serviceType) {
                    const serviceName = coupon.allowedService === 'DELIVERY'
                        ? (lang === 'ko' ? '배송' : 'Delivery')
                        : (lang === 'ko' ? '보관' : 'Storage');
                    setCouponError(lang === 'ko'
                        ? `이 쿠폰은 ${serviceName} 서비스 전용입니다.`
                        : `This coupon is valid for ${serviceName} service only.`);
                    setAppliedCoupon(null);
                    return;
                }
            }

            setAppliedCoupon(coupon);
            setCouponError('');
        } catch (e) {
            setCouponError(lang === 'ko' ? '쿠폰 확인 중 오류가 발생했습니다.' : 'Error validating coupon.');
        } finally {
            setIsValidatingCoupon(false);
        }
    };

    const handleBook = async () => {
        if (!isMember) {
            if (!booking.userName || !booking.userEmail || !booking.snsId) {
                alert(t.booking?.alert_fill_info || 'Please fill in your information.');
                return;
            }
        }
        if (!booking.agreedToTerms || !booking.agreedToPrivacy || !booking.agreedToHighValue) {
            alert(t.booking?.alert_agree_terms || 'Please agree to the terms.');
            return;
        }
        if (serviceType === ServiceType.DELIVERY && !booking.dropoffLocation) {
            alert(t.booking?.select_dest || 'Please select a destination.');
            return;
        }

        setIsSubmitting(true);

        // 💅 Custom Reservation Code Generation
        // Delivery: [OriginShort]-[DestShort]-[Random4] (e.g. MYN-IN1T-1234)
        // Storage: [BranchShort]-[Random4] (e.g. MYN-5678)
        const generateShortCode = () => {
            const random4 = Math.floor(1000 + Math.random() * 9000).toString();

            if (serviceType === ServiceType.DELIVERY) {
                const origin = locations.find(l => l.id === booking.pickupLocation);
                const dest = locations.find(l => l.id === booking.dropoffLocation);
                const originCode = origin?.shortCode || booking.pickupLocation || 'UNK';
                const destCode = dest?.shortCode || booking.dropoffLocation || 'UNK';
                return `${originCode}-${destCode}-${random4}`;
            } else {
                const storageLoc = locations.find(l => l.id === booking.pickupLocation);
                const locCode = storageLoc?.shortCode || booking.pickupLocation || 'UNK';
                return `${locCode}-${random4}`;
            }
        };

        const generatedCode = generateShortCode();

        // Construct valid BookingState with all mandatory fields
        const finalBooking: BookingState = {
            ...booking as BookingState,
            id: booking.id || generatedCode,
            reservationCode: generatedCode,
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
            bagSizes: booking.bagSizes || { S: 0, M: 0, L: 0, XL: 0 }
        };

        // Mapping snsChannel to snsType (Backend/Success page expectations)
        const channelMap: Record<string, any> = {
            kakao: 'KakaoTalk',
            line: 'Line',
            instagram: 'Instagram',
            whatsapp: 'WhatsApp',
            wechat: 'WeChat'
        };
        finalBooking.snsType = channelMap[booking.snsChannel || 'kakao'] || 'None';

        setTimeout(() => {
            onSuccess(finalBooking);
            setIsSubmitting(false);
        }, 1500);
    };

    const getLocName = (l: LocationOption | undefined) => {
        if (!l) return '';
        const dbLang = (lang === 'zh' || lang === 'zh-HK' || lang === 'zh-TW') ? 'zh' : lang.split('-')[0];

        if (lang === 'ko' || lang === 'ko-KR') return l.name;
        // Priority: name_lang -> location_names (translations) -> name_en -> name
        return (l[`name_${dbLang}` as keyof LocationOption] as string) || (t.location_names && t.location_names[l.id]) || l.name_en || l.name;
    };

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[5000] bg-white overflow-y-auto no-scrollbar"
        >
            {/* Header */}
            {/* Simple Slim Header */}
            <div className="sticky top-0 bg-white/95 backdrop-blur-md border-b border-gray-100 px-6 py-4 flex justify-between items-center z-50">
                <h2 className="text-lg font-black italic tracking-tighter flex items-center gap-2">
                    <span className="text-bee-yellow">BEE</span> RESERVATION
                </h2>
                <button title={t.booking?.aria_close || "Close"} aria-label={t.booking?.aria_close || "Close"} onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-400">
                    <X size={20} />
                </button>
            </div>

            <div className="max-w-7xl mx-auto px-8 py-12">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">

                    {/* Left Column: Input Forms */}
                    <div className="lg:col-span-7 space-y-10">
                        {/* Step 1: Locations & Schedule */}
                        <section className="space-y-6">
                            <div className="flex items-center gap-4">
                                <div className="w-8 h-8 bg-bee-black text-bee-yellow rounded-full flex items-center justify-center text-xs font-black italic">01</div>
                                <h3 className="text-xl font-black italic uppercase tracking-tight">{t.booking?.schedule_info || 'Schedule & Locations'}</h3>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-8 bg-gray-50 rounded-[2.5rem] border border-gray-100">
                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{t.booking?.from || 'From'}</label>
                                        <div className="p-4 bg-white border-2 border-bee-yellow rounded-2xl font-bold text-sm flex items-center gap-3">
                                            <MapPin size={16} className="text-bee-yellow" />
                                            {getLocName(pickupLoc)}
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{t.booking?.pickup_schedule || 'Pickup Schedule'}</label>
                                        <div className="flex gap-2">
                                            <div className="flex-1 p-4 bg-white border border-gray-100 rounded-2xl font-bold text-sm flex items-center gap-3">
                                                <Calendar size={16} className="text-gray-400" />
                                                <input
                                                    type="date"
                                                    title="Pickup Date"
                                                    value={booking.pickupDate}
                                                    min={formatKSTDate()}
                                                    onChange={e => setBooking(prev => ({ ...prev, pickupDate: e.target.value }))}
                                                    className="w-full p-4 bg-gray-50 border-2 border-gray-100 rounded-2xl text-sm font-bold outline-none focus:border-bee-yellow"
                                                />
                                            </div>
                                            <div className="flex-1 relative">
                                                <select
                                                    title="Pickup Time"
                                                    value={booking.pickupTime}
                                                    onChange={e => setBooking(prev => ({ ...prev, pickupTime: e.target.value }))}
                                                    className="w-full bg-white border border-gray-100 rounded-2xl p-4 text-sm font-bold outline-none focus:border-bee-yellow appearance-none cursor-pointer pr-10"
                                                    disabled={!booking.pickupDate}
                                                >
                                                    {getSlotsForType(pickupLoc, 'PICKUP').map(h => {
                                                        const isPast = isPastKSTTime(booking.pickupDate || '', h);
                                                        return (
                                                            <option key={h} value={h} disabled={isPast} className={isPast ? "text-gray-300" : ""}>
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
                                    {serviceType === ServiceType.DELIVERY ? (
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{t.booking?.to || 'To'}</label>
                                            <select
                                                title="Drop-off/Delivery Location"
                                                value={booking.dropoffLocation}
                                                onChange={e => setBooking(prev => ({ ...prev, dropoffLocation: e.target.value }))}
                                                className="w-full bg-white border border-gray-100 rounded-2xl p-4 text-sm font-bold shadow-sm outline-none focus:border-bee-yellow"
                                            >
                                                <option value="">{t.booking?.select_dest || 'Select Destination'}</option>
                                                {destinationLocations.map(l => <option key={l.id} value={l.id}>{getLocName(l)}</option>)}
                                            </select>
                                        </div>
                                    ) : (
                                        <div className="space-y-2 text-center flex flex-col items-center justify-center h-full">
                                            <div className="p-4 bg-blue-50 text-blue-500 rounded-2xl w-full">
                                                <Vault className="mx-auto mb-2" />
                                                <span className="text-[10px] font-black uppercase tracking-widest">Storage Service Only</span>
                                            </div>
                                        </div>
                                    )}
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{serviceType === ServiceType.DELIVERY ? (t.booking?.delivery_schedule || 'Delivery Schedule') : (t.booking?.return_schedule || 'Retrieval')}</label>
                                        <div className="flex gap-2">
                                            <div className="flex-1 relative">
                                                <input
                                                    type="date"
                                                    title="Drop-off Date"
                                                    value={booking.dropoffDate?.split(' ')[0]}
                                                    min={booking.pickupDate?.split(' ')[0] || formatKSTDate()}
                                                    onChange={e => setBooking(prev => ({ ...prev, dropoffDate: e.target.value }))}
                                                    className="w-full p-4 bg-white border border-gray-100 rounded-2xl font-bold text-sm outline-none text-transparent"
                                                />
                                                <div className="absolute inset-0 flex items-center px-4 pointer-events-none font-bold text-sm text-gray-900">
                                                    {getLocalizedDate(booking.dropoffDate || '', lang)}
                                                </div>
                                            </div>
                                            <div className="flex-1 relative">
                                                <select
                                                    title="Drop-off/Delivery Time"
                                                    value={booking.deliveryTime}
                                                    onChange={e => setBooking(prev => ({ ...prev, deliveryTime: e.target.value }))}
                                                    className="w-full bg-white border border-gray-100 rounded-2xl p-4 text-sm font-bold outline-none focus:border-bee-yellow appearance-none cursor-pointer pr-10"
                                                >
                                                    {getSlotsForType(dropoffLoc, 'DELIVERY').map(h => {
                                                        const isPast = isPastKSTTime(booking.dropoffDate || booking.pickupDate || '', h);
                                                        return (
                                                            <option key={h} value={h} disabled={isPast} className={isPast ? "text-gray-300" : ""}>
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
                            </div>
                        </section>

                        {/* Step 2: Customer Info */}
                        {!isMember && (
                            <section className="space-y-6">
                                <div className="flex items-center gap-4">
                                    <div className="w-8 h-8 bg-bee-black text-bee-yellow rounded-full flex items-center justify-center text-xs font-black italic">02</div>
                                    <h3 className="text-xl font-black italic uppercase tracking-tight">{t.booking?.contact_info_title || 'Contact Information'}</h3>
                                </div>

                                <div className="p-10 bg-white border-2 border-gray-100 rounded-[2.5rem] space-y-8">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{t.booking?.name || 'Full Name'}</label>
                                            <input
                                                type="text"
                                                value={booking.userName}
                                                onChange={e => setBooking(prev => ({ ...prev, userName: e.target.value }))}
                                                placeholder="Enter your name"
                                                title={t.booking?.aria_name_input || "Full Name Input"}
                                                className="w-full bg-gray-50 border-none rounded-2xl p-5 text-sm font-bold focus:ring-2 focus:ring-bee-yellow outline-none"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{t.booking?.email || 'Email Address'}</label>
                                            <input
                                                type="email"
                                                value={booking.userEmail}
                                                onChange={e => setBooking(prev => ({ ...prev, userEmail: e.target.value }))}
                                                placeholder="email@example.com"
                                                className="w-full bg-gray-50 border-none rounded-2xl p-5 text-sm font-bold focus:ring-2 focus:ring-bee-yellow outline-none"
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{t.booking?.sns || 'SNS Channel'}</label>
                                            <div className="flex gap-2">
                                                {['kakao', 'line', 'whatsapp', 'wechat'].map(ch => (
                                                    <button
                                                        key={ch}
                                                        onClick={() => setBooking(prev => ({ ...prev, snsChannel: ch as any }))}
                                                        title={`${ch} channel`}
                                                        aria-label={`${ch} channel`}
                                                        className={`flex-1 py-4 rounded-2xl border-2 transition-all text-[10px] font-bold uppercase tracking-widest ${booking.snsChannel === ch ? 'border-bee-yellow bg-bee-yellow/5 text-bee-black' : 'border-gray-50 text-gray-400 hover:border-gray-200'}`}
                                                    >
                                                        {ch}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{t.booking?.snsId || 'SNS ID'}</label>
                                            <input
                                                type="text"
                                                value={booking.snsId}
                                                onChange={e => setBooking(prev => ({ ...prev, snsId: e.target.value }))}
                                                placeholder="ID / Mobile number"
                                                className="w-full bg-gray-50 border-none rounded-2xl p-5 text-sm font-bold focus:ring-2 focus:ring-bee-yellow outline-none"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </section>
                        )}

                        {/* Step 4: Discount Coupon */}
                        <section className="space-y-6">
                            <div className="flex items-center gap-4">
                                <div className="w-8 h-8 bg-bee-black text-bee-yellow rounded-full flex items-center justify-center text-xs font-black italic">0{isMember ? '02' : '03'}</div>
                                <h3 className="text-xl font-black italic uppercase tracking-tight">{t.booking?.coupon_title || 'Discount Coupon'}</h3>
                            </div>

                            <div className="p-8 bg-gray-50 rounded-[2.5rem] border border-gray-100 flex flex-col md:flex-row gap-4">
                                <div className="flex-1 relative">
                                    <input
                                        type="text"
                                        value={couponInput}
                                        onChange={e => setCouponInput(e.target.value.toUpperCase())}
                                        placeholder={t.booking?.coupon_placeholder || 'Enter coupon code'}
                                        className="w-full bg-white border border-gray-100 rounded-2xl p-4 text-sm font-bold shadow-sm outline-none focus:border-bee-yellow"
                                    />
                                    {couponError && <p className="text-[10px] text-red-500 font-bold mt-1 ml-1">{couponError}</p>}
                                    {appliedCoupon && !couponError && (
                                        <p className="text-[10px] text-green-500 font-bold mt-1 ml-1">
                                            {appliedCoupon.code} applied! (-₩{priceDetails.discountAmount.toLocaleString()})
                                        </p>
                                    )}
                                </div>
                                <button
                                    onClick={handleApplyCoupon}
                                    disabled={isValidatingCoupon || !couponInput.trim()}
                                    className={`px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all ${isValidatingCoupon || !couponInput.trim() ? 'bg-gray-200 text-gray-400' : 'bg-bee-black text-bee-yellow hover:bg-gray-800 shadow-md'
                                        }`}
                                >
                                    {isValidatingCoupon ? <Clock size={16} className="animate-spin" /> : (t.booking?.apply || 'Apply')}
                                </button>
                            </div>
                        </section>

                        {/* Step 5: Agreements */}
                        <section className="space-y-6">
                            <div className="p-8 bg-gray-50 rounded-[2.5rem] border border-gray-100 space-y-4">
                                <label className="flex items-center gap-4 cursor-pointer group">
                                    <input
                                        type="checkbox"
                                        checked={booking.agreedToTerms}
                                        onChange={e => setBooking(prev => ({ ...prev, agreedToTerms: e.target.checked }))}
                                        className="w-5 h-5 accent-bee-black"
                                    />
                                    <span className="text-xs font-bold text-gray-600 group-hover:text-bee-black transition-colors">{t.booking?.agree_terms || 'I agree to the Terms of Service'} <span className="underline ml-2 text-gray-400 text-[10px]">READ</span></span>
                                </label>
                                <label className="flex items-center gap-4 cursor-pointer group">
                                    <input
                                        type="checkbox"
                                        checked={booking.agreedToPrivacy}
                                        onChange={e => setBooking(prev => ({ ...prev, agreedToPrivacy: e.target.checked }))}
                                        className="w-5 h-5 accent-bee-black"
                                    />
                                    <span className="text-xs font-bold text-gray-600 group-hover:text-bee-black transition-colors">{t.booking?.agree_privacy || 'I agree to the Privacy Policy'} <span className="underline ml-2 text-gray-400 text-[10px]">READ</span></span>
                                </label>
                                <label className="flex items-center gap-4 cursor-pointer group">
                                    <input
                                        type="checkbox"
                                        checked={booking.agreedToHighValue}
                                        onChange={e => setBooking(prev => ({ ...prev, agreedToHighValue: e.target.checked }))}
                                        className="w-5 h-5 accent-bee-black"
                                    />
                                    <span className="text-xs font-bold text-gray-600 group-hover:text-bee-black transition-colors">{t.booking?.agree_high_value || 'I confirm there are no high-value items'} <span className="underline ml-2 text-gray-400 text-[10px]">REQUIRED</span></span>
                                </label>

                                <div className="pt-4 mt-4 border-t border-gray-200">
                                    <label className="flex items-start gap-4 cursor-pointer group">
                                        <input
                                            type="checkbox"
                                            checked={booking.agreedToPremium}
                                            onChange={e => setBooking(prev => ({ ...prev, agreedToPremium: e.target.checked }))}
                                            className="mt-1 w-5 h-5 accent-bee-black"
                                        />
                                        <div>
                                            <span className="text-xs font-black text-bee-black block">{t.booking?.insurance_title || 'Premium Baggage Insurance (+₩5,000)'}</span>
                                            <p className="text-[10px] font-bold text-gray-400 leading-relaxed mt-1">Protect your precious baggage against loss or damage up to ₩1,000,000 per bag.</p>
                                        </div>
                                    </label>
                                </div>
                            </div>
                        </section>
                    </div>

                    {/* Right Column: Order Summary */}
                    <div className="lg:col-span-5 relative">
                        <div className="sticky top-32 space-y-8">
                            <div className="bg-bee-black text-white rounded-[3rem] p-10 shadow-2xl overflow-hidden relative">
                                <div className="absolute top-0 right-0 w-40 h-40 bg-bee-yellow/10 rounded-bl-full blur-3xl" />

                                <h3 className="text-2xl font-black italic italic mb-8 tracking-tighter flex items-center gap-3">
                                    <CheckCircle2 className="text-bee-yellow" /> ORDER SUMMARY
                                </h3>

                                <div className="space-y-6">
                                    {/* Detailed Flow */}
                                    <div className="bg-gray-50 rounded-2xl p-4 border-2 border-gray-100 mb-6">
                                        <h4 className="text-[10px] font-black uppercase text-gray-400 tracking-wider mb-3 px-1">{t.booking?.order_summary || 'Order Summary'}</h4>
                                        <div className="space-y-3">
                                            <div className="flex justify-between items-start gap-4">
                                                <div className="flex-1">
                                                    <div className="text-[10px] uppercase font-black text-gray-500 tracking-widest">{serviceType === ServiceType.DELIVERY ? (t.booking?.pickup || 'Pickup') : (t.booking?.from || 'Drop-off')}</div>
                                                    <div className="text-sm font-black flex justify-between">
                                                        <span>{getLocName(pickupLoc)}</span>
                                                        <span className="text-bee-yellow italic">{booking.pickupTime}</span>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="border-t border-dashed border-gray-200"></div>

                                            <div className="flex justify-between items-start gap-4">
                                                <div className="flex-1">
                                                    <div className="text-[10px] uppercase font-black text-gray-500 tracking-widest">{serviceType === ServiceType.DELIVERY ? (t.booking?.delivery || 'Delivery') : (t.booking?.to || 'Retrieval')}</div>
                                                    <div className="text-sm font-black flex justify-between">
                                                        <span>{serviceType === ServiceType.STORAGE ? (t.booking?.storage_only || 'Storage Service Only') : getLocName(dropoffLoc)}</span>
                                                        <span className="text-bee-yellow italic">{booking.deliveryTime}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="mb-6">
                                        <div className="flex justify-between items-center mb-1">
                                            <span className="text-xs font-black text-gray-500 uppercase tracking-wider">{t.booking?.total_amount || 'Total Amount'}</span>
                                            <span className="text-2xl font-black text-bee-yellow italic">
                                                ₩{priceDetails.total.toLocaleString()}
                                            </span>
                                        </div>
                                        <p className="text-[10px] text-gray-400 leading-tight">
                                            {t.booking?.total_price_sub_delivery || 'Includes all surcharges and fees.'}
                                        </p>
                                    </div>

                                    <motion.button
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                        className={`w-full py-5 rounded-2xl font-black text-lg tracking-tight shadow-xl shadow-bee-yellow/20 flex items-center justify-center gap-2 ${isSubmitting ? 'bg-gray-200 text-gray-400 cursor-not-allowed' : 'bg-bee-yellow text-black'
                                            }`}
                                        onClick={handleBook}
                                        disabled={isSubmitting}
                                    >
                                        {isSubmitting ? (t.booking?.processing || 'Processing...') : (t.booking?.submit || 'Confirm Reservation')}
                                        {!isSubmitting && <ChevronRight className="w-6 h-6" />}
                                    </motion.button>
                                    {/* Price Breakdown */}
                                    <div className="pt-8 mt-8 border-t border-white/10 space-y-4">
                                        <div className="flex justify-between items-center text-xs font-bold">
                                            <div className="flex items-center gap-2 text-gray-400"><Package size={14} /> {t.booking?.base_fare || 'Baggage Fare'}</div>
                                            <div className="text-white">₩{priceDetails.base.toLocaleString()}</div>
                                        </div>
                                        {priceDetails.discountAmount > 0 && (
                                            <div className="flex justify-between items-center text-xs font-bold">
                                                <div className="flex items-center gap-2 text-green-400"><Ticket size={14} /> {t.booking?.discount || 'Discount'}</div>
                                                <div className="text-green-400">-₩{priceDetails.discountAmount.toLocaleString()}</div>
                                            </div>
                                        )}
                                        {(priceDetails.originSurcharge > 0 || priceDetails.destSurcharge > 0) && (
                                            <div className="flex justify-between items-center text-xs font-bold">
                                                <div className="flex items-center gap-2 text-gray-400"><MapPin size={14} /> {t.booking?.location_surcharge || 'Location Surcharge'}</div>
                                                <div className="text-white">₩{(priceDetails.originSurcharge + priceDetails.destSurcharge).toLocaleString()}</div>
                                            </div>
                                        )}
                                        {priceDetails.storageFee > 0 && (
                                            <div className="flex justify-between items-center text-xs font-bold">
                                                <div className="flex items-center gap-2 text-gray-400"><Vault size={14} /> {t.booking?.extra_storage || 'Extra Storage'}</div>
                                                <div className="text-white">₩{priceDetails.storageFee.toLocaleString()}</div>
                                            </div>
                                        )}
                                        {priceDetails.insuranceFee > 0 && (
                                            <div className="flex justify-between items-center text-xs font-bold">
                                                <div className="flex items-center gap-2 text-bee-yellow font-black"><ShieldCheck size={14} /> {t.booking?.insurance || 'Safety Insurance'}</div>
                                                <div className="text-bee-yellow">₩{priceDetails.insuranceFee.toLocaleString()}</div>
                                            </div>
                                        )}

                                        <div className="pt-6 mt-6 border-t border-white/10 flex justify-between items-center">
                                            <div className="text-sm font-black italic uppercase tracking-widest text-gray-400">Total Amount</div>
                                            <div className="text-4xl font-black text-bee-yellow italic">₩{priceDetails.total.toLocaleString()}</div>
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-8 p-4 bg-white/5 rounded-2xl flex items-start gap-4">
                                    <Info size={16} className="text-bee-yellow mt-0.5" />
                                    <p className="text-[10px] font-bold text-gray-400 leading-normal">Your reservation will be confirmed immediately. Payment is handled safely upon pickup or drop-off according to our premium protocols.</p>
                                </div>
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </motion.div >
    );
};

export default BookingDetailed;

