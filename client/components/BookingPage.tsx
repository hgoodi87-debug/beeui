
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
    ChevronLeft
} from 'lucide-react';
import { LocationOption, ServiceType, BookingState, BookingStatus, BagSizes, PriceSettings, StorageTier } from '../types';
import { StorageService } from '../services/storageService';
import { calculateStoragePrice, STORAGE_RATES } from '../utils/pricing';
import { formatKSTDate, isPastKSTTime } from '../utils/dateUtils';

interface BookingPageProps {
    t: any;
    lang: string;
    locations: LocationOption[];
    initialLocationId?: string;
    initialServiceType?: ServiceType;
    initialDate?: string;
    initialBagSizes?: { S: number, M: number, L: number, XL: number };
    onBack: () => void;
    onSuccess: (booking: BookingState) => void;
    user?: any;
}

const DEFAULT_DELIVERY_PRICES: PriceSettings = { S: 20000, M: 20000, L: 25000, XL: 29000 };

const BookingPage: React.FC<BookingPageProps> = ({
    t,
    lang,
    locations,
    initialLocationId,
    initialServiceType = ServiceType.STORAGE,
    initialDate,
    initialBagSizes,
    onBack,
    onSuccess,
    user
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

    const [booking, setBooking] = useState<Partial<BookingState>>({
        serviceType: initialServiceType,
        pickupLocation: initialLocationId || '',
        dropoffLocation: '',
        pickupDate: initialDate || defaultDate,
        pickupTime: initialServiceType === ServiceType.DELIVERY ? '09:00' : '10:00',
        dropoffDate: initialDate || defaultDate,
        deliveryTime: initialServiceType === ServiceType.DELIVERY ? '16:00' : '11:00',
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
        if (booking.serviceType === ServiceType.DELIVERY) {
            if (type === 'PICKUP') {
                return ['09:00', '10:00', '11:00', '12:00', '13:00'];
            } else {
                return ['16:00', '17:00', '18:00', '19:00', '20:00', '21:00'];
            }
        }

        // STORAGE Logic: Based on business hours
        const bhStr = location?.businessHours || '09:00-21:00';
        const { start, end } = parseBusinessHours(bhStr);
        const slots = [];
        for (let i = start; i <= end; i++) {
            slots.push(`${i.toString().padStart(2, '0')}:00`);
        }
        return slots;
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

    const [isSubmitting, setIsSubmitting] = useState(false);

    const pickupLoc = useMemo(() => locations.find(l => l.id === booking.pickupLocation), [locations, booking.pickupLocation]);
    const dropoffLoc = useMemo(() => locations.find(l => l.id === booking.dropoffLocation), [locations, booking.dropoffLocation]);

    const destinationLocations = useMemo(() =>
        locations.filter(l => l.isActive !== false && l.id !== booking.pickupLocation && l.supportsDelivery && l.isDestination !== false),
        [locations, booking.pickupLocation]
    );

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

        let base = 0;
        let breakdown = '';
        let durationText = '';

        if (booking.serviceType === ServiceType.DELIVERY) {
            base = (S * (deliveryPrices.S || 15000)) + (M * deliveryPrices.M) + (L * deliveryPrices.L) + (XL * deliveryPrices.XL);
        } else {
            // STORAGE: Dynamic Pricing
            const pickupDateTime = new Date(`${booking.pickupDate}T${booking.pickupTime}`);
            // Use dropoffDate/Time as retrieval time for storage
            // Note: BookingPage uses dropoffDate/Time inputs for retrieval in STORAGE mode too (UI changes labels)
            const retrievalDateTime = new Date(`${booking.dropoffDate || booking.pickupDate}T${booking.deliveryTime || '23:59'}`);

            if (!isNaN(pickupDateTime.getTime()) && !isNaN(retrievalDateTime.getTime())) {
                const result = calculateStoragePrice(pickupDateTime, retrievalDateTime, booking.bagSizes || { S: 0, M: 0, L: 0, XL: 0 }, lang);
                base = result.total;
                breakdown = result.breakdown;
                durationText = result.durationText;
            }
        }

        const originSurcharge = pickupLoc?.originSurcharge || 0;
        const destSurcharge = dropoffLoc?.destinationSurcharge || 0;

        let insuranceFee = 0;
        if (booking.agreedToPremium) {
            insuranceFee = 5000 * (booking.insuranceLevel || 1) * (booking.bags || 1);
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
    }, [booking.bagSizes, booking.agreedToPremium, booking.insuranceLevel, booking.bags, pickupLoc, dropoffLoc, deliveryPrices, storageTiers, booking.serviceType, booking.pickupDate, booking.pickupTime, booking.dropoffDate, booking.deliveryTime]);

    const handleBook = async () => {
        const tBooking = t.booking || {}; // Safety guard

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

        const finalBooking: BookingState = {
            ...booking as BookingState,
            id: booking.id || `BEE-${Date.now().toString().slice(-6)}`,
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
            language: lang.split('-')[0] // 'ko-KR' -> 'ko' 형식으로 저장
        };

        const channelMap: Record<string, any> = {
            kakao: 'KakaoTalk',
            line: 'Line',
            instagram: 'Instagram',
            whatsapp: 'WhatsApp',
            wechat: 'WeChat'
        };
        finalBooking.snsType = channelMap[booking.snsChannel || 'kakao'] || 'None';

        try {
            // Call parent success handler directly (App.tsx will handle saving if needed, but usually App.tsx expects the component to save?)
            // DetailedBooking usually didn't save? Wait, App.tsx's handleBookingSuccess DOES save. 
            // So we just pass the object up.
            await onSuccess(finalBooking);
        } catch (e) {
            console.error("Booking Error", e);
            alert("Booking Failed. Please try again.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const getLocName = (l: LocationOption | undefined) => {
        if (!l) return '';
        const currentLang = lang.split('-')[0]; // Handle 'zh-HK', 'en-US' etc.
        const dbLang = currentLang === 'zh' ? 'zh' : currentLang;

        if (currentLang === 'ko') return l.name;
        // Priority: name_lang -> name_en -> name
        return (l[`name_${dbLang}` as keyof LocationOption] as string) || l.name_en || l.name;
    };

    const tBooking = t.booking || {};

    return (
        <div className="w-full min-h-screen bg-white">
            {/* Header */}
            <div className="sticky top-0 bg-white/95 backdrop-blur-md border-b border-gray-100 px-6 py-4 flex justify-between items-center z-50">
                <div className="flex items-center gap-4">
                    <button
                        title="Back"
                        aria-label="Back"
                        onClick={onBack}
                        className="p-2 hover:bg-gray-100 rounded-full transition-colors text-bee-black"
                    >
                        <ChevronLeft size={24} />
                    </button>
                    <h2 className="text-xl font-black italic tracking-tighter flex items-center gap-2">
                        <span className="text-bee-yellow">BEE</span> RESERVATION
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
                                        className={`flex-1 py-2 rounded-lg text-xs font-black transition-all ${booking.serviceType === ServiceType.DELIVERY ? 'bg-bee-black text-bee-yellow shadow-md' : 'text-gray-400 hover:bg-gray-50'}`}
                                    >
                                        DELIVERY
                                    </button>
                                    <button
                                        onClick={() => setBooking(prev => ({ ...prev, serviceType: ServiceType.STORAGE }))}
                                        className={`flex-1 py-2 rounded-lg text-xs font-black transition-all ${booking.serviceType === ServiceType.STORAGE ? 'bg-bee-yellow text-bee-black shadow-md' : 'text-gray-400 hover:bg-gray-50'}`}
                                    >
                                        STORAGE
                                    </button>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-4">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{tBooking.from || 'From'}</label>
                                            <select
                                                title="Select Pickup Location"
                                                aria-label="Select Pickup Location"
                                                value={booking.pickupLocation}
                                                onChange={(e) => setBooking(prev => ({ ...prev, pickupLocation: e.target.value }))}
                                                className="w-full p-4 bg-white border-2 border-bee-yellow rounded-2xl font-bold text-sm outline-none"
                                            >
                                                <option value="" disabled>Select Location</option>
                                                {locations.filter(loc => loc.isActive !== false).map(loc => (
                                                    <option key={loc.id} value={loc.id}>{getLocName(loc)}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{tBooking.pickup_schedule || 'Pickup Schedule'}</label>
                                            <div className="flex gap-2">
                                                <input
                                                    type="date"
                                                    title="Pickup Date"
                                                    aria-label="Pickup Date"
                                                    value={booking.pickupDate}
                                                    onChange={e => setBooking(prev => ({ ...prev, pickupDate: e.target.value }))}
                                                    className="flex-1 p-4 bg-white border border-gray-100 rounded-2xl font-bold text-sm outline-none"
                                                />
                                                <select
                                                    title="Pickup Time"
                                                    aria-label="Pickup Time"
                                                    value={booking.pickupTime}
                                                    onChange={e => setBooking(prev => ({ ...prev, pickupTime: e.target.value }))}
                                                    className="w-32 bg-white border border-gray-100 rounded-2xl p-4 text-sm font-bold outline-none focus:border-bee-yellow"
                                                >
                                                    {generateTimeSlots(pickupLoc, 'PICKUP').map(h => {
                                                        const isPast = isPastKSTTime(booking.pickupDate || '', h);
                                                        return (
                                                            <option key={h} value={h} disabled={isPast} className={isPast ? "text-gray-300" : ""}>
                                                                {h} {isPast ? `(${t.booking?.slot_past || '마감'})` : ''}
                                                            </option>
                                                        );
                                                    })}
                                                </select>
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
                                                        <div className="flex-1 p-4 bg-gray-100 rounded-2xl font-bold text-sm text-gray-500 flex items-center gap-2">
                                                            <Calendar size={16} /> Same Day
                                                        </div>
                                                        <select
                                                            title="Delivery Time"
                                                            aria-label="Delivery Time"
                                                            value={booking.deliveryTime}
                                                            onChange={e => setBooking(prev => ({ ...prev, deliveryTime: e.target.value }))}
                                                            className="w-32 bg-white border border-gray-100 rounded-2xl p-4 text-sm font-bold outline-none focus:border-bee-yellow"
                                                        >
                                                            {generateTimeSlots(pickupLoc, 'DELIVERY').map(h => {
                                                                const isPast = isPastKSTTime(booking.pickupDate || '', h); // Delivery is same day
                                                                return (
                                                                    <option key={h} value={h} disabled={isPast} className={isPast ? "text-gray-300" : ""}>
                                                                        {h} {isPast ? `(${t.booking?.slot_past || '마감'})` : ''}
                                                                    </option>
                                                                );
                                                            })}
                                                        </select>
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
                                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{tBooking.dropoff_schedule || 'Retrieval Schedule'}</label>
                                                    <div className="flex gap-2">
                                                        <input
                                                            type="date"
                                                            title="Retrieval Date"
                                                            aria-label="Retrieval Date"
                                                            value={booking.dropoffDate}
                                                            onChange={e => setBooking(prev => ({ ...prev, dropoffDate: e.target.value }))}
                                                            className="flex-1 p-4 bg-white border border-gray-100 rounded-2xl font-bold text-sm outline-none focus:border-bee-yellow"
                                                        />
                                                        <select
                                                            title="Retrieval Time"
                                                            value={booking.deliveryTime}
                                                            onChange={e => setBooking(prev => ({ ...prev, deliveryTime: e.target.value }))}
                                                            className="w-32 bg-white border border-gray-100 rounded-2xl p-4 text-sm font-bold outline-none focus:border-bee-yellow"
                                                        >
                                                            {generateTimeSlots(pickupLoc, 'PICKUP').map(h => {
                                                                const isRetrievalPast = isPastKSTTime(booking.dropoffDate || '', h);
                                                                return (
                                                                    <option key={h} value={h} disabled={isRetrievalPast} className={isRetrievalPast ? "text-gray-300" : ""}>
                                                                        {h} {isRetrievalPast ? `(${t.booking?.slot_past || '마감'})` : ''}
                                                                    </option>
                                                                );
                                                            })}
                                                        </select>
                                                    </div>
                                                </div>
                                            </>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </section>

                        {/* Step 2: Bags */}
                        <section className="space-y-6">
                            <div className="flex items-center gap-4">
                                <div className="w-8 h-8 bg-bee-black text-bee-yellow rounded-full flex items-center justify-center text-xs font-black italic">02</div>
                                <h3 className="text-xl font-black italic uppercase tracking-tight">{tBooking.bags_label || 'Baggage Selection'}</h3>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {Object.entries(booking.bagSizes || {}).map(([size, count]) => {
                                    const isDelivery = booking.serviceType === ServiceType.DELIVERY;
                                    const unitPrice = isDelivery
                                        ? (deliveryPrices[size as keyof PriceSettings] || 0)
                                        : (STORAGE_RATES[size as keyof BagSizes]?.hours4 || 0);

                                    return (
                                        <div key={size} className="flex items-center justify-between p-4 border border-gray-100 rounded-2xl">
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 bg-gray-50 rounded-xl flex items-center justify-center">
                                                    <Package className="text-gray-400" size={24} />
                                                </div>
                                                <div>
                                                    <div className="text-[10px] text-gray-500 font-bold">
                                                        {size === 'S' ? (tBooking.size_s || 'S') :
                                                            size === 'M' ? (tBooking.size_m || 'M') :
                                                                size === 'L' ? (tBooking.size_l || 'L') :
                                                                    (tBooking.size_xl || 'XL')}
                                                    </div>
                                                    <div className="font-black text-lg">
                                                        {size}
                                                        <span className="text-xs text-bee-yellow ml-1 font-bold">
                                                            (₩{unitPrice.toLocaleString()}{!isDelivery && (lang.startsWith('ko') ? '/4시간~' : '/4h~')})
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <button
                                                    onClick={() => updateBagCount(size as keyof BagSizes, -1)}
                                                    className="w-8 h-8 rounded-full border border-gray-200 flex items-center justify-center hover:bg-gray-50 disabled:opacity-50 transition-colors"
                                                    disabled={count === 0}
                                                >
                                                    -
                                                </button>
                                                <span className="w-8 text-center font-black">{count}</span>
                                                <button
                                                    onClick={() => updateBagCount(size as keyof BagSizes, 1)}
                                                    className="w-8 h-8 rounded-full bg-bee-black text-bee-yellow flex items-center justify-center hover:bg-gray-800 transition-colors"
                                                >
                                                    +
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
                                <h3 className="text-xl font-black italic uppercase tracking-tight">{tBooking.contact_info || 'Contact Information'}</h3>
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
                                            placeholder="Your Name"
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
                                            placeholder="ID"
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
                                                const unitPrice = isDelivery
                                                    ? (deliveryPrices[size as keyof PriceSettings] || 0)
                                                    : (STORAGE_RATES[size as keyof BagSizes]?.hours4 || 0);

                                                return (
                                                    <div key={size} className="flex justify-between items-center text-[11px]">
                                                        <span className="text-white/70">{size} SIZE x {count}</span>
                                                        <span className="font-bold">₩{(unitPrice * count).toLocaleString()}</span>
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
