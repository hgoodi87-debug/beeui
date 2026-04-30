
import React, { useState, useMemo, useEffect, useRef } from 'react';
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
    ChevronLeft,
    RefreshCcw
} from 'lucide-react';
import { LocationOption, LocationType, ServiceType, BookingState, BookingStatus, BagSizes, PriceSettings, StorageTier } from '../types';
import { StorageService } from '../services/storageService';
import { supabaseGet } from '../services/supabaseClient';
import { getAdParams, inferChannelFromReferrer } from '../src/utils/gads';
import { createTossPaymentSession, isTossPaymentsEnabled, isTossPaymentsFlowEnabled, isTossPaymentsMockMode, requestTossCardPayment } from '../services/tossPaymentsService';
import { isPayPalEnabled, loadPayPalSDK, createPayPalOrder, capturePayPalOrder, krwToUsd, warmPayPalFunction, fetchExchangeRate, getCachedRate } from '../services/paypalService';
import { formatKSTDate, isPastKSTTime, getFirstAvailableSlot, isAllSlotsPast, addDaysToDateStr, add2MonthsToDateStr } from '../utils/dateUtils';
import { COUNTRY_NAMES } from '../src/constants/countries';
import { calculateDeliveryStoragePrice, STORAGE_RATES, calculateStoragePrice } from '../utils/pricing';
import {
    BagCategoryId,
    DEFAULT_DELIVERY_PRICES,
    buildCategoryBagSizes,
    createEmptyBagSizes,
    getBagCategoryDescription,
    getBagCategoriesForService,
    getBagCategoryCount,
    getBagCategoryLabel,
    getStoragePriceForCategory,
    getTotalBags,
    getBagCategoryVisualMeta,
    hasStandaloneHandBagDeliverySelection,
    sanitizeBagSizes,
    sanitizeDeliveryBagSizes,
    updateBagCategoryCount,
} from '../src/domains/booking/bagCategoryUtils';

interface BookingPageProps {
    t: any;
    lang: string;
    locations: LocationOption[];
    initialLocationId?: string;
    initialServiceType?: ServiceType;
    initialDate?: string;
    initialReturnDate?: string;
    initialBagSizes?: BagSizes;
    onBack: () => void;
    onSuccess: (booking: BookingState) => void | Promise<void>;
    user?: any;
    customerBranchId?: string;
    customerBranchRates?: { delivery: number; storage: number };
}

// VITE_DIRECT_BOOKING_MODE=true 이면 현금 직접 예약 모드 (Toss 결제 비활성화)
// Toss 실배포 전환 시 이 환경변수를 false 또는 제거하세요.
const TEMP_DIRECT_BOOKING_MODE = import.meta.env.VITE_DIRECT_BOOKING_MODE !== 'false';

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
    const isTossPaymentFlowEnabled = !TEMP_DIRECT_BOOKING_MODE && isTossPaymentsFlowEnabled();
    const isMockPaymentMode = isTossPaymentFlowEnabled && isTossPaymentsMockMode();
    const isDirectBookingMode = !isTossPaymentFlowEnabled;
    const isMember = !!user && !user.isAnonymous;
    const defaultDate = formatKSTDate();
    const defaultInitialBagSizes = React.useMemo<BagSizes>(() => ({
        ...createEmptyBagSizes(),
        carrier: 1,
    }), []);
    const normalizedInitialBagSizes = initialServiceType === ServiceType.DELIVERY
        ? sanitizeDeliveryBagSizes(initialBagSizes || defaultInitialBagSizes)
        : sanitizeBagSizes(initialBagSizes || defaultInitialBagSizes);

    const [usdRate, setUsdRate] = useState<number>(getCachedRate());
    useEffect(() => { fetchExchangeRate().then(setUsdRate); }, []);

    const [deliveryPrices, setDeliveryPrices] = useState<PriceSettings>(DEFAULT_DELIVERY_PRICES);
    const [storageTiers, setStorageTiers] = useState<StorageTier[]>([]);

    // [스봉이] 메타 광고 트래킹: 예약 페이지 진입 (AddToCart) 💅✨
    useEffect(() => {
        import('../services/trackingService').then(({ TrackingService }) => {
            TrackingService.addToCart();
        });
    }, []);

    // 💅 Coupon State
    const [couponInput, setCouponInput] = useState('');
    const [appliedCoupon, setAppliedCoupon] = useState<{ code: string; amount: number; type: 'fixed' | 'percent' } | null>(null);
    const [couponMessage, setCouponMessage] = useState<{ type: 'error' | 'success', text: string } | null>(null);

    // 💳 결제 수단 선택 상태 — 목업 디자인 이식
    // 'card' = Toss 카드 결제 / 'paypal' = PayPal 결제
    // 기본값: PayPal 활성화돼 있으면 paypal, 아니면 card (기존 동작 보존)
    const [paymentMethod, setPaymentMethod] = useState<'card' | 'paypal'>(() => {
        try {
            return isPayPalEnabled() ? 'paypal' : 'card';
        } catch {
            return 'card';
        }
    });

    const parseKstDateTime = React.useCallback((dateStr?: string, timeStr?: string, fallbackTime: string = '00:00') => {
        if (!dateStr) return null;
        const safeTime = (timeStr || fallbackTime || '00:00').slice(0, 5);
        const parsed = new Date(`${dateStr}T${safeTime}:00+09:00`);
        return Number.isNaN(parsed.getTime()) ? null : parsed;
    }, []);

    const pickupDateInputRef = React.useRef<HTMLInputElement | null>(null);
    const deliveryDateInputRef = React.useRef<HTMLInputElement | null>(null);
    const retrievalDateInputRef = React.useRef<HTMLInputElement | null>(null);

    const openDatePicker = React.useCallback((inputRef: React.RefObject<HTMLInputElement | null>) => {
        const input = inputRef.current;
        if (!input) return;

        // 이미 포커스된 상태이면 picker가 열려있거나 방금 닫힌 것 — 재호출 방지
        if (document.activeElement === input) return;

        if (typeof input.showPicker === 'function') {
            input.showPicker();
            return;
        }

        input.focus({ preventScroll: true });
        input.click();
    }, []);

    const handleDateFieldKeyDown = React.useCallback((event: React.KeyboardEvent<HTMLDivElement>, inputRef: React.RefObject<HTMLInputElement | null>) => {
        if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            openDatePicker(inputRef);
        }
    }, [openDatePicker]);

    const handleApplyCoupon = () => {
        if (!couponInput) return;
        const code = couponInput.toUpperCase().trim();
        if (code === 'PROMO2026') {
            setAppliedCoupon({ code, amount: 2026, type: 'fixed' });
            setCouponMessage({ type: 'success', text: '프로모션 코드가 적용되었습니다. 💅✨' });
        } else if (code === 'WELCOME5000') {
            setAppliedCoupon({ code, amount: 5000, type: 'fixed' });
            setCouponMessage({ type: 'success', text: '웰컴 혜택이 적용되었습니다. 🎉' });
        } else if (code === 'BEE10') {
            setAppliedCoupon({ code, amount: 10, type: 'percent' });
            setCouponMessage({ type: 'success', text: '10% 보너스 혜택이 적용되었습니다. 🐝' });
        } else {
            setAppliedCoupon(null);
            setCouponMessage({ type: 'error', text: '유효하지 않거나 만료된 코드입니다. 🙄' });
        }
    };

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
        bagSizes: normalizedInitialBagSizes,
        bags: getTotalBags(normalizedInitialBagSizes),
        userName: isMember ? (user.displayName || user.email?.split('@')[0] || 'Member') : '',
        userEmail: isMember ? (user.email || '') : '',
        snsChannel: 'kakao',
        snsId: isMember ? 'Google Login' : '',
        agreedToTerms: false,
        agreedToPrivacy: false,
        agreedToHighValue: false,
        agreedToPremium: false,
        insuranceLevel: 1,
        insuranceBagCount: 0,
        country: 'KR'
    });

    const [isCountryManuallySet, setIsCountryManuallySet] = useState(false);

    // 🕵️‍♀️ [스봉이] 언어에 따라 국가를 자동으로 매칭해주는 천재적인 로직입니다! 💅✨
    useEffect(() => {
        if (isCountryManuallySet) return; // 사용자 선택이 우선이죠! 🙄

        let autoCountry = 'TW';
        if (lang === 'ko') autoCountry = 'KR';
        else if (lang === 'ja') autoCountry = 'JP';
        else if (lang === 'zh' || lang === 'zh-CN') autoCountry = 'CN';
        else if (lang === 'zh-HK') autoCountry = 'HK';
        else if (lang === 'zh-TW') autoCountry = 'TW';

        setBooking(prev => ({ ...prev, country: autoCountry }));
    }, [lang, isCountryManuallySet]);


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
    const [showDupeConfirm, setShowDupeConfirm] = useState(false);
    const pendingBookingRef = useRef<BookingState | null>(null);
    const paypalContainerRef = useRef<HTMLDivElement>(null);
    const paypalRenderedRef = useRef(false);
    const latestPayPalCtxRef = useRef<{ priceTotal: number; serviceType: ServiceType; finalBooking: any; lang: string } | null>(null);
    const validatedPayPalBookingRef = useRef<BookingState | null>(null);
    const [paypalLoadError, setPaypalLoadError] = useState(false);
    const [paypalValidationMsg, setPaypalValidationMsg] = useState('');

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
        if (user) {
            // [스봉이] 익명이든 구글 로그인이든 '주인님 ID'는 무조건 챙깁니다! 🛡️
            setBooking(prev => ({
                ...prev,
                userId: user.uid,
                userName: prev.userName || user.displayName || user.email?.split('@')[0] || 'Member',
                userEmail: prev.userEmail || user.email || '',
                snsId: prev.snsId || (user.isAnonymous ? 'Guest' : 'Login User')
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

    useEffect(() => {
        if (booking.serviceType !== ServiceType.DELIVERY || !booking.bagSizes?.strollerBicycle) return;
        setBooking(prev => ({
            ...prev,
            bagSizes: sanitizeDeliveryBagSizes(prev.bagSizes),
            bags: getTotalBags(sanitizeDeliveryBagSizes(prev.bagSizes))
        }));
    }, [booking.serviceType, booking.bagSizes?.strollerBicycle]);

    const visibleBagCategories = useMemo(
        () => getBagCategoriesForService(booking.serviceType || ServiceType.STORAGE),
        [booking.serviceType]
    );

    const baseStoragePrices: PriceSettings = useMemo(() => ({
        handBag: STORAGE_RATES.handBag.hours4,
        carrier: STORAGE_RATES.carrier.hours4,
        strollerBicycle: STORAGE_RATES.strollerBicycle.hours4,
    }), []);

    const updateBagCount = (categoryId: BagCategoryId, delta: number) => {
        setBooking(prev => {
            const currentService = prev.serviceType || ServiceType.STORAGE;
            const nextBagSizes = updateBagCategoryCount(
                prev.bagSizes || createEmptyBagSizes(),
                categoryId,
                delta
            );
            const normalizedBagSizes = currentService === ServiceType.DELIVERY
                ? sanitizeDeliveryBagSizes(nextBagSizes)
                : nextBagSizes;

            return {
                ...prev,
                bagSizes: normalizedBagSizes,
                bags: getTotalBags(normalizedBagSizes)
            };
        });
    };

    const priceDetails = useMemo(() => {
        const normalizedBagSizes = booking.serviceType === ServiceType.DELIVERY
            ? sanitizeDeliveryBagSizes(booking.bagSizes)
            : sanitizeBagSizes(booking.bagSizes);
        const { handBag = 0, carrier = 0, strollerBicycle = 0 } = normalizedBagSizes;
        const isDelivery = booking.serviceType === ServiceType.DELIVERY;
        const originSurcharge = isDelivery ? (pickupLoc?.originSurcharge || 0) : 0;
        const destSurcharge = isDelivery ? (dropoffLoc?.destinationSurcharge || 0) : 0;

        let base = 0;
        let storageFee = 0;
        let breakdown = '';
        let durationText = '';

        if (isDelivery) {
            const deliveryBase = (handBag * (deliveryPrices.handBag || DEFAULT_DELIVERY_PRICES.handBag)) + (carrier * (deliveryPrices.carrier || DEFAULT_DELIVERY_PRICES.carrier));
            const deliveryStorage = calculateDeliveryStoragePrice(
                booking.pickupDate || '',
                booking.dropoffDate || booking.pickupDate || '',
                normalizedBagSizes,
                lang
            );
            storageFee = deliveryStorage.total;
            if (deliveryStorage.storageDays > 0) {
                durationText = deliveryStorage.durationText;
                breakdown = lang.startsWith('ko')
                    ? `기본배송 + 선보관 ${deliveryStorage.storageDays}일`
                    : `Base delivery + ${deliveryStorage.storageDays}d pre-delivery storage`;
            }

            base = deliveryBase + storageFee;
        } else {
            // STORAGE: Dynamic Pricing
            const pickupDateTime = parseKstDateTime(booking.pickupDate, booking.pickupTime);
            const retrievalDateTime = parseKstDateTime(booking.dropoffDate || booking.pickupDate, booking.deliveryTime, '23:59');

            if (pickupDateTime && retrievalDateTime) {
                const result = calculateStoragePrice(
                    pickupDateTime,
                    retrievalDateTime,
                    normalizedBagSizes,
                    lang,
                    { businessHours: pickupLoc?.businessHours }
                );
                base = result.total;
                breakdown = result.breakdown;
                durationText = result.durationText;

                // If total is 0 but bags are selected, show minimum (4h) price as preview 💅
                if (base === 0 && getTotalBags(normalizedBagSizes) > 0) {
                    base = (handBag * STORAGE_RATES.handBag.hours4) + (carrier * STORAGE_RATES.carrier.hours4) + (strollerBicycle * STORAGE_RATES.strollerBicycle.hours4);
                    durationText = lang.startsWith('ko') ? '기본 4시간 예상' : 'Est. 4h base';
                }
            }
        }

        const totalBags = getTotalBags(normalizedBagSizes);

        let insuranceFee = 0;
        if (booking.agreedToPremium) {
            insuranceFee = 5000 * (booking.insuranceLevel || 1) * Math.max(1, totalBags);
        }

        let subtotal = base + originSurcharge + destSurcharge + insuranceFee;
        let discount = 0;

        if (appliedCoupon) {
            if (appliedCoupon.type === 'fixed') {
                discount = appliedCoupon.amount;
            } else if (appliedCoupon.type === 'percent') {
                discount = Math.floor(subtotal * (appliedCoupon.amount / 100));
            }
        }

        // Guard against negative total
        if (discount > subtotal) discount = subtotal;

        return {
            base,
            originSurcharge,
            destSurcharge,
            insuranceFee,
            discount,
            total: subtotal - discount,
            breakdown,
            durationText
        };
    }, [booking.bagSizes, booking.agreedToPremium, booking.insuranceLevel, pickupLoc, dropoffLoc, deliveryPrices, storageTiers, booking.serviceType, booking.pickupDate, booking.pickupTime, booking.dropoffDate, booking.deliveryTime, lang, appliedCoupon, parseKstDateTime]);

    const tBooking = t.booking || {};
    const tVoucher = t.booking_voucher || {};
    const getCompactScheduleDate = React.useCallback((dateStr: string) => {
        if (!dateStr) {
            return lang.startsWith('ko') ? '날짜 선택' : 'Select date';
        }

        const cleanDateStr = dateStr.includes(' ') ? dateStr.split(' ')[0] : dateStr;
        const date = new Date(cleanDateStr);
        if (isNaN(date.getTime())) return dateStr;

        if (lang.startsWith('ko')) {
            const weekdayMap = ['일', '월', '화', '수', '목', '금', '토'];
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');
            return `${month}.${day} ${weekdayMap[date.getDay()]}`;
        }

        return new Intl.DateTimeFormat(lang === 'ja' ? 'ja-JP' : 'en-US', {
            month: 'short',
            day: 'numeric',
        }).format(date);
    }, [lang]);

    const isValidEmail = (email: string) =>
        /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim());

    const normalizeContactValue = (value?: string) => String(value || '').trim();

    const validateBookingDraft = (draft: Partial<BookingState>): { ok: true; booking: BookingState; email: string } | { ok: false; message: string } => {
        if (!draft.pickupLocation) {
            return { ok: false, message: tBooking.select_storage || 'Please select a location.' };
        }

        const normalizedBagSizes = draft.serviceType === ServiceType.DELIVERY
            ? sanitizeDeliveryBagSizes(draft.bagSizes)
            : sanitizeBagSizes(draft.bagSizes);
        const totalBags = getTotalBags(normalizedBagSizes);
        if (totalBags <= 0) {
            return { ok: false, message: lang.startsWith('ko') ? '짐을 1개 이상 선택해 주세요.' : 'Please select at least one bag.' };
        }

        const normalizedUserName = normalizeContactValue(draft.userName);
        const normalizedUserEmail = normalizeContactValue(draft.userEmail || user?.email).toLowerCase();
        const normalizedSnsId = normalizeContactValue(draft.snsId);

        if (!isMember && (!normalizedUserName || !normalizedUserEmail || !normalizedSnsId)) {
            return { ok: false, message: tBooking.alert_fill_info || 'Please fill in your information.' };
        }
        if (normalizedUserEmail && !isValidEmail(normalizedUserEmail)) {
            return { ok: false, message: lang.startsWith('ko') ? '이메일 형식을 확인해 주세요.' : 'Please enter a valid email address.' };
        }
        if (!isMember && normalizedSnsId.length < 2) {
            return { ok: false, message: lang.startsWith('ko') ? '연락 가능한 SNS ID를 입력해 주세요.' : 'Please enter a reachable SNS ID.' };
        }
        if (!draft.agreedToTerms || !draft.agreedToPrivacy || !draft.agreedToHighValue) {
            return { ok: false, message: tBooking.alert_agree_terms || 'Please agree to the terms.' };
        }
        if (draft.serviceType === ServiceType.DELIVERY && !draft.dropoffLocation) {
            return { ok: false, message: tBooking.select_dest || 'Please select a destination.' };
        }
        if (draft.serviceType === ServiceType.DELIVERY && hasStandaloneHandBagDeliverySelection(normalizedBagSizes)) {
            return {
                ok: false,
                message: lang.startsWith('ko')
                    ? '배송은 쇼핑백, 손가방만 단독으로 접수할 수 없어요. 캐리어를 1개 이상 함께 선택해 주세요.'
                    : 'Delivery cannot be booked with only shopping bags or handbags. Please add at least one suitcase.'
            };
        }

        return {
            ok: true,
            email: normalizedUserEmail,
            booking: {
                ...draft as BookingState,
                userName: normalizedUserName || draft.userName || '',
                userEmail: normalizedUserEmail,
                snsId: normalizedSnsId || draft.snsId || '',
                bagSizes: normalizedBagSizes,
                bags: totalBags,
            },
        };
    };

    const handleBook = async () => {
        const validation = validateBookingDraft(booking);
        if (!validation.ok) {
            alert(validation.message);
            return;
        }

        // 단시간 중복 예약 감지 (10분 이내 동일 이메일+날짜+지점)
        const email = validation.email;
        if (email && booking.pickupDate && pickupLoc?.supabaseId) {
            try {
                const since = new Date(Date.now() - 10 * 60 * 1000).toISOString();
                const rows = await supabaseGet<Array<Record<string, unknown>>>(
                    `booking_details?user_email=eq.${encodeURIComponent(email)}&pickup_date=eq.${booking.pickupDate}&pickup_location_id=eq.${encodeURIComponent(pickupLoc.supabaseId)}&created_at=gte.${encodeURIComponent(since)}&select=id,reservation_code,created_at&limit=1`
                );
                if (Array.isArray(rows) && rows.length > 0) {
                    pendingBookingRef.current = validation.booking;
                    setShowDupeConfirm(true);
                    return;
                }
            } catch {
                // 조회 실패 시 그냥 진행
            }
        }

        await proceedBooking(validation.booking);
    };

    // 중복 확인 후 실제 예약 진행
    const proceedBooking = async (bookingState: BookingState) => {
        setShowDupeConfirm(false);
        setIsSubmitting(true);
        const booking = bookingState;
        const finalBooking: BookingState = {
            ...booking as BookingState,
            pickupLoc: pickupLoc,
            returnLoc: booking.serviceType === ServiceType.DELIVERY ? dropoffLoc : undefined,
            price: priceDetails.base + priceDetails.originSurcharge + priceDetails.destSurcharge + priceDetails.insuranceFee,
            insuranceFee: priceDetails.insuranceFee,
            promoCode: appliedCoupon?.code,
            discountCode: appliedCoupon?.code,
            discountAmount: priceDetails.discount,
            finalPrice: priceDetails.total,
            status: BookingStatus.PENDING,
            createdAt: new Date().toISOString(),
            bags: getTotalBags(booking.serviceType === ServiceType.DELIVERY ? sanitizeDeliveryBagSizes(booking.bagSizes) : sanitizeBagSizes(booking.bagSizes)),
            pickupLocation: booking.pickupLocation || '',
            dropoffLocation: booking.dropoffLocation || '',
            pickupDate: booking.pickupDate || '',
            pickupTime: booking.pickupTime || '',
            dropoffDate: booking.dropoffDate || '',
            deliveryTime: booking.deliveryTime || '',
            bagSizes: booking.serviceType === ServiceType.DELIVERY ? sanitizeDeliveryBagSizes(booking.bagSizes) : sanitizeBagSizes(booking.bagSizes),
            language: lang,
            branchId: customerBranchId,
            branchCommissionRates: customerBranchRates,
            paymentMethod: isDirectBookingMode ? 'cash' : 'card',
            paymentStatus: priceDetails.total > 0 ? 'pending' : 'paid',
            paymentProvider: isDirectBookingMode ? 'manual' : 'toss',
            // 어느 채널에서 왔는지 — localStorage에 captureAdParams()가 저장해둔 값 (14일 TTL)
            ...(() => {
                const a = getAdParams();
                // UTM 없으면 referrer로 채널 자동 추론
                const utmSource = a.utm_source || (a._referrer ? inferChannelFromReferrer(a._referrer) : undefined);
                const utmMedium = a.utm_medium || (a._referrer ? 'referrer' : undefined);
                return {
                    utmSource,
                    utmMedium,
                    utmCampaign: a.utm_campaign || undefined,
                    utmContent: a.utm_content || undefined,
                    utmTerm: a.utm_term || undefined,
                };
            })(),
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
            prefetchBookingSuccess();

            if (booking.serviceType === ServiceType.DELIVERY && hasStandaloneHandBagDeliverySelection(booking.bagSizes)) {
                throw new Error('배송은 쇼핑백, 손가방만 단독으로 접수할 수 없어요. 캐리어를 1개 이상 함께 선택해 주세요.');
            }

            if (!isTossPaymentFlowEnabled) {
                await onSuccess(JSON.parse(JSON.stringify(finalBooking)) as BookingState);
                return;
            }

            const session = await createTossPaymentSession(finalBooking);
            const serverBooking = JSON.parse(JSON.stringify(session.booking)) as BookingState;

            if (!session.requiresPayment) {
                await onSuccess(serverBooking);
                return;
            }

            if (!isTossPaymentsEnabled()) {
                throw new Error('토스페이먼츠 클라이언트 키가 아직 설정되지 않았습니다. 결제 연동 환경변수를 먼저 넣어주세요.');
            }

            await requestTossCardPayment({
                orderId: session.orderId || '',
                orderName: session.orderName || 'Beeliber Reservation',
                amount: session.amount,
                customerKey: session.customerKey || '',
                customerName: serverBooking.userName,
                customerEmail: serverBooking.userEmail,
            });
        } catch (e) {
            console.error("Booking Error", e);
            alert(e instanceof Error ? e.message : "Booking Failed. Please try again.");
        } finally {
            setIsSubmitting(false);
        }
    };

    // PayPal 버튼 초기화 — priceDetails.total > 0 일 때만 컨테이너 div가 DOM에 존재
    useEffect(() => {
        if (!isPayPalEnabled() || priceDetails.total <= 0) return;

        // Edge Function 콜드 스타트 예방: SDK 로딩과 동시에 ping 발송
        warmPayPalFunction();

        loadPayPalSDK(lang).then(() => {
            if (paypalRenderedRef.current || !paypalContainerRef.current) return;

            const buttonsConfig = {
                style: { layout: 'vertical' as const, color: 'gold' as const, shape: 'rect' as const, label: 'paypal' as const, height: 48 },
                createOrder: async () => {
                    // latestPayPalCtxRef는 매 렌더마다 갱신 — stale closure 없음
                    const ctx = latestPayPalCtxRef.current;
                    if (!ctx || ctx.priceTotal <= 0) throw new Error('결제 금액이 없습니다.');
                    const fb = ctx.finalBooking;
                    const validation = validateBookingDraft(fb);
                    if (!validation.ok) {
                        setPaypalValidationMsg(validation.message);
                        throw new Error('폼 검증 실패');
                    }
                    validatedPayPalBookingRef.current = validation.booking;
                    ctx.finalBooking = validation.booking;
                    setPaypalValidationMsg('');
                    const desc = ctx.serviceType === 'DELIVERY' ? 'Beeliber Airport Delivery' : 'Beeliber Luggage Storage';
                    return createPayPalOrder(ctx.priceTotal, desc);
                },
                onApprove: async (data: { orderID: string }) => {
                    setIsSubmitting(true);
                    try {
                        const capture = await capturePayPalOrder(data.orderID);
                        const ctx = latestPayPalCtxRef.current;
                        if (!ctx?.finalBooking) throw new Error('예약 정보가 없습니다.');
                        const payableBooking = validatedPayPalBookingRef.current || ctx.finalBooking;
                        await onSuccess({
                            ...payableBooking,
                            paymentMethod: 'paypal',
                            paymentStatus: 'paid',
                            paymentProvider: 'paypal',
                            paymentOrderId: data.orderID,
                            paymentKey: capture.captureId,
                            paymentApprovedAt: capture.paidAt,
                        });
                    } catch (e) {
                        alert(e instanceof Error ? e.message : 'PayPal 결제 처리 실패');
                    } finally {
                        setIsSubmitting(false);
                    }
                },
                onCancel: () => {
                    const cancelLang = latestPayPalCtxRef.current?.lang ?? 'en';
                    const msgs: Record<string, string> = {
                        ko: '결제가 취소되었습니다.\n예약이 완료되지 않았습니다. 다시 시도하려면 아래 PayPal 버튼을 눌러주세요.',
                        en: 'Payment was cancelled.\nYour booking is not confirmed. Please press the PayPal button again to retry.',
                        zh: '付款已取消。\n您的预订尚未完成，请再次点击 PayPal 按钮重试。',
                        'zh-TW': '付款已取消。\n您的預訂尚未完成，請再次點擊 PayPal 按鈕重試。',
                        'zh-HK': '付款已取消。\n您嘅預訂尚未完成，請再次按 PayPal 按鈕重試。',
                        ja: '支払いがキャンセルされました。\n予約が完了していません。もう一度 PayPal ボタンを押してください。',
                    };
                    alert(msgs[cancelLang] ?? msgs['en']);
                },
                onError: (err: any) => {
                    console.error('[PayPal] onError:', err);
                    const msg = err?.message || String(err);
                    // 폼 검증 오류는 버튼 유지 — alert는 createOrder에서 이미 처리됨
                    if (msg === '폼 검증 실패' || msg === '결제 금액이 없습니다.') return;
                    setPaypalLoadError(true);
                },
            };

            const buttons = window.paypal.Buttons(buttonsConfig);

            // isEligible() 이 false 면 현재 계정/지역에서 Buttons 위젯 사용 불가
            if (typeof buttons.isEligible === 'function' && !buttons.isEligible()) {
                console.error('[PayPal] Buttons.isEligible() = false — 계정 승인 상태 또는 지역 제한 확인 필요');
                setPaypalLoadError(true);
                return;
            }

            paypalContainerRef.current.innerHTML = '';
            paypalRenderedRef.current = true;

            buttons.render(paypalContainerRef.current).catch((e: any) => {
                console.error('[PayPal] render() 실패:', e);
                paypalRenderedRef.current = false;
                setPaypalLoadError(true);
            });
        }).catch((e) => {
            console.error('[PayPal] SDK load failed:', e);
            setPaypalLoadError(true);
        });
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [priceDetails.total]);

    // PayPal 버튼에 최신 컨텍스트 주입 (ref 업데이트 — 리렌더 없음)
    useEffect(() => {
        if (!isPayPalEnabled()) return;
        const pickupLoc_ = pickupLoc;
        const dropoffLoc_ = booking.serviceType === ServiceType.DELIVERY ? dropoffLoc : undefined;
        latestPayPalCtxRef.current = {
            priceTotal: priceDetails.total,
            serviceType: booking.serviceType || ServiceType.STORAGE,
            lang,
            finalBooking: {
                ...booking,
                pickupLoc: pickupLoc_,
                returnLoc: dropoffLoc_,
                price: priceDetails.base + priceDetails.originSurcharge + priceDetails.destSurcharge + priceDetails.insuranceFee,
                promoCode: appliedCoupon?.code,
                discountCode: appliedCoupon?.code,
                discountAmount: priceDetails.discount,
                finalPrice: priceDetails.total,
                status: BookingStatus.PENDING,
                createdAt: new Date().toISOString(),
                language: lang,
            },
        };
    });

    const getLocName = (l: LocationOption | undefined) => {
        if (!l) return '';
        // 'zh', 'zh-HK', 'zh-TW' 지원을 위한 개선
        const dbLang = (lang === 'zh' || lang === 'zh-HK' || lang === 'zh-TW') ? 'zh' : lang;

        if (lang === 'ko' || lang === 'ko-KR') return l.name;
        // Priority: name_lang -> name_en -> name
        return (l[`name_${dbLang}` as keyof LocationOption] as string) || l.name_en || l.name;
    };

    const reservationSteps = lang.startsWith('ko')
        ? ['일정', '가방', '예약자', '결제']
        : ['Schedule', 'Bags', 'Guest', 'Payment'];
    const bookingIntro = lang.startsWith('ko')
        ? {
            eyebrow: '예약 정보 입력',
            title: '예약자 정보를 입력해주세요',
            desc: '선택한 일정과 수하물을 확인하고, 연락 가능한 정보를 입력하면 결제로 이어집니다.',
        }
        : {
            eyebrow: 'Reservation details',
            title: 'Enter guest information',
            desc: 'Review your schedule and bags, then add contact details before checkout.',
        };


    return (
        <div className="renewal-screen w-full min-h-screen bg-[#FAFAF8]">
            {/* 중복 예약 확인 다이얼로그 */}
            <AnimatePresence>
                {showDupeConfirm && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm"
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="bg-white rounded-3xl shadow-2xl max-w-sm w-full p-8"
                        >
                            <div className="text-center mb-6">
                                <div className="w-14 h-14 rounded-full bg-bee-yellow/20 flex items-center justify-center mx-auto mb-4">
                                    <AlertCircle size={28} className="text-bee-black" />
                                </div>
                                <h3 className="text-lg font-black text-bee-black leading-snug break-keep">
                                    방금 예약을 하셨는데<br />추가로 예약하시는 건가요?
                                </h3>
                                <p className="text-sm text-gray-500 mt-2 break-keep">
                                    동일한 날짜·지점으로 최근 예약이 확인되었어요.
                                </p>
                            </div>
                            <div className="flex gap-3">
                                <button
                                    onClick={() => {
                                        setShowDupeConfirm(false);
                                        pendingBookingRef.current = null;
                                        onBack();
                                    }}
                                    className="flex-1 py-3.5 rounded-2xl bg-gray-100 text-bee-black font-black text-sm hover:bg-gray-200 transition-colors"
                                >
                                    아니요
                                </button>
                                <button
                                    onClick={() => {
                                        const b = pendingBookingRef.current;
                                        pendingBookingRef.current = null;
                                        if (b) proceedBooking(b);
                                    }}
                                    className="flex-1 py-3.5 rounded-2xl bg-bee-yellow text-bee-black font-black text-sm hover:bg-bee-yellow/80 transition-colors"
                                >
                                    네, 추가 예약
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Header */}
            <div className="renewal-sc-header md:hidden">
                <button
                    title={t.common?.back || "Back"}
                    aria-label={t.common?.back || "Back"}
                    onClick={onBack}
                    className="renewal-back"
                >
                    <ChevronLeft size={24} />
                </button>
                <div className="renewal-title">{lang === 'ko' ? '예약자 정보' : 'Guest information'}</div>
            </div>

            <div className="sticky top-0 z-50 hidden border-b border-gray-200 bg-white/95 px-4 py-3 backdrop-blur-md md:block md:px-6">
                <div className="mx-auto flex max-w-6xl items-center justify-between gap-4">
                    <div className="flex min-w-0 items-center gap-3">
                    <button
                        title={t.common?.back || "Back"}
                        aria-label={t.common?.back || "Back"}
                        onClick={onBack}
                        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-bee-black transition-colors hover:bg-gray-100"
                    >
                        <ChevronLeft size={24} />
                    </button>
                        <h2 className="flex min-w-0 items-center gap-2 truncate text-lg font-black tracking-normal text-bee-black md:text-xl">
                        <span className="text-bee-yellow">beeliber</span>{' '}
                        {lang === 'ko' ? '예약' : lang === 'ja' ? '予約' : lang.startsWith('zh') ? '預約' : 'Booking'}
                    </h2>
                    </div>
                    <div className="hidden items-center gap-2 rounded-full border border-gray-200 bg-white px-3 py-2 text-[10px] font-black uppercase tracking-[0.18em] text-gray-500 sm:flex">
                        <span className="h-2 w-2 rounded-full bg-bee-yellow" />
                        {lang.startsWith('ko') ? '예약 진행 중' : 'Booking in progress'}
                    </div>
                </div>
            </div>

            <div className="mx-auto px-0 py-0 md:px-6 md:py-8">
                <div className="hidden mb-5 rounded-[20px] border border-gray-200 bg-white p-5 shadow-sm md:p-6">
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">
                        {bookingIntro.eyebrow}
                    </p>
                    <div className="mt-3 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
                        <div>
                            <h1 className="text-2xl font-black tracking-normal text-bee-black md:text-4xl">
                                {bookingIntro.title}
                            </h1>
                            <p className="mt-2 max-w-2xl text-sm font-bold leading-relaxed text-gray-500">
                                {bookingIntro.desc}
                            </p>
                        </div>
                        <div className="inline-flex w-fit items-center gap-2 rounded-full bg-bee-black px-4 py-2 text-[11px] font-black uppercase tracking-normal text-bee-yellow">
                            <span className="h-2 w-2 rounded-full bg-bee-yellow" />
                            {booking.serviceType === ServiceType.DELIVERY ? (t.booking?.delivery || 'Delivery') : (t.booking?.storage || 'Storage')}
                        </div>
                    </div>
                </div>
                <div className="renewal-booking-dw">
                    <div className="renewal-dw-header">
                        <div className="renewal-dw-steps">
                            <span className="renewal-dw-step done">① 일정 &amp; 가방</span>
                            <span className="renewal-dw-arrow">›</span>
                            <span className="renewal-dw-step done">② 지점 선택</span>
                            <span className="renewal-dw-arrow">›</span>
                            <span className="renewal-dw-step active">③ 결제</span>
                        </div>
                        <button onClick={onBack} className="text-white/60 hover:text-white">✕</button>
                    </div>

                <div className="renewal-dw-cols">

                    {/* Left Column: Input Forms */}
                    <div className="renewal-dw-left space-y-8">
                        <div className="md:hidden">
                            <div className="renewal-progress">
                                <div className="dot done" />
                                <div className="dot done" />
                                <div className="dot active" />
                                <div className="dot" />
                            </div>
                            <div className="renewal-step-head">
                                <h2>예약자 정보를<br />입력해주세요</h2>
                                <p>예약 확인 메일을 받을 정보예요.</p>
                            </div>
                        </div>
                        {/* Step 1: Locations & Schedule */}
                        <section className="hidden space-y-6">
                            <div className="flex items-center gap-4">
                                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-bee-black text-xs font-black text-bee-yellow">01</div>
                                <h3 className="text-xl font-black uppercase tracking-normal text-bee-black">{tBooking.schedule_info || 'Schedule & Locations'}</h3>
                            </div>

                            <div className="rounded-[20px] border border-gray-200 bg-white p-4 shadow-sm sm:p-5 xl:p-6">
                                {/* Service Type Toggle - Modified Position */}
                                <div className="mx-auto mb-5 flex max-w-sm rounded-2xl border border-gray-200 bg-gray-50 p-1">
                                    <button
                                        onClick={() => setBooking(prev => {
                                            const nextBagSizes = sanitizeDeliveryBagSizes(prev.bagSizes);
                                            return { ...prev, serviceType: ServiceType.DELIVERY, bagSizes: nextBagSizes, bags: getTotalBags(nextBagSizes) };
                                        })}
                                        className={`flex-1 rounded-xl py-3 text-xs font-black transition-all ${booking.serviceType === ServiceType.DELIVERY ? 'bg-bee-black text-bee-yellow shadow-md' : 'text-gray-500 hover:bg-white'}`}
                                    >
                                        {t.booking?.delivery || 'DELIVERY'}
                                    </button>
                                    <button
                                        onClick={() => setBooking(prev => ({ ...prev, serviceType: ServiceType.STORAGE }))}
                                        className={`flex-1 rounded-xl py-3 text-xs font-black transition-all ${booking.serviceType === ServiceType.STORAGE ? 'bg-bee-yellow text-bee-black shadow-md' : 'text-gray-500 hover:bg-white'}`}
                                    >
                                        {t.booking?.storage || 'STORAGE'}
                                    </button>
                                </div>

                                <div className="grid grid-cols-1 gap-4 xl:grid-cols-2 xl:items-stretch">
                                    <div className="h-full">
                                        <div className="h-full space-y-4 rounded-[18px] border border-gray-200 bg-[#FAFAF8] p-4">
                                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{booking.serviceType === ServiceType.DELIVERY ? tBooking.from : tBooking.select_storage}</label>
                                            <select
                                                title="Select Pickup Location"
                                                aria-label="Select Pickup Location"
                                                value={booking.pickupLocation}
                                                onChange={(e) => setBooking(prev => ({ ...prev, pickupLocation: e.target.value }))}
                                                className="w-full rounded-[1.45rem] border-2 border-bee-yellow bg-white px-5 py-3.5 font-bold text-sm outline-none transition-colors focus:border-bee-yellow"
                                            >
                                                <option value="">{booking.serviceType === ServiceType.DELIVERY ? tBooking.select_origin : tBooking.select_storage}</option>
                                                {originLocations.map(loc => (
                                                    <option key={loc.id} value={loc.id}>{getLocName(loc)}</option>
                                                ))}
                                            </select>

                                            <div className="rounded-[1.55rem] border border-gray-100 bg-gray-50/90 p-3.5 sm:p-4">
                                                <div className="mb-3 flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.22em] text-gray-400">
                                                    <Calendar size={14} />
                                                    <span>{tBooking.pickup_schedule || 'Pickup Schedule'}</span>
                                                </div>
                                                <div className="grid grid-cols-1 sm:grid-cols-[minmax(0,1.85fr)_94px] md:grid-cols-[minmax(0,2.15fr)_98px] gap-3">
                                                    <div
                                                        role="button"
                                                        tabIndex={0}
                                                        onClick={() => openDatePicker(pickupDateInputRef)}
                                                        onKeyDown={(event) => handleDateFieldKeyDown(event, pickupDateInputRef)}
                                                        className="relative min-w-0 cursor-pointer"
                                                    >
                                                        <input
                                                            ref={pickupDateInputRef}
                                                            type="date"
                                                            aria-label="Pickup Date"
                                                            value={booking.pickupDate?.split(' ')[0]}
                                                            min={formatKSTDate()}
                                                            max={add2MonthsToDateStr(formatKSTDate())}
                                                            onChange={e => setBooking(prev => ({ ...prev, pickupDate: e.target.value }))}
                                                            className="absolute inset-0 h-14 sm:h-[3.75rem] w-full rounded-[1.35rem] opacity-0 pointer-events-none outline-none appearance-none [&::-webkit-calendar-picker-indicator]:hidden [&::-webkit-calendar-picker-indicator]:opacity-0"
                                                        />
                                                        <div className="pointer-events-none relative flex h-14 sm:h-[3.75rem] items-center rounded-[1.35rem] border border-white bg-white pl-4 pr-11 sm:pl-5 sm:pr-12 text-bee-black transition-all">
                                                            <span className="block min-w-0 flex-1 whitespace-nowrap text-[12px] sm:text-[13px] md:text-[14px] font-black leading-none tracking-[-0.02em]">
                                                                {getCompactScheduleDate(booking.pickupDate || '')}
                                                            </span>
                                                            <Calendar className="absolute right-4 top-1/2 h-4 w-4 shrink-0 -translate-y-1/2 text-gray-400" />
                                                        </div>
                                                    </div>
                                                    <div className="relative">
                                                        <select
                                                            title="Pickup Time"
                                                            aria-label="Pickup Time"
                                                            value={booking.pickupTime}
                                                            onChange={e => setBooking(prev => ({ ...prev, pickupTime: e.target.value }))}
                                                            className="h-14 sm:h-[3.75rem] w-full rounded-[1.35rem] border border-white bg-white px-4 pr-10 text-[0.92rem] sm:text-[0.96rem] md:text-[0.98rem] font-black text-bee-black outline-none transition-all focus:border-bee-yellow focus:ring-2 focus:ring-bee-yellow/25 appearance-none cursor-pointer"
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
                                                            <Clock size={18} />
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="h-full">
                                        {booking.serviceType === ServiceType.DELIVERY ? (
                                            <div className="h-full space-y-4 rounded-[18px] border border-gray-200 bg-[#FAFAF8] p-4">
                                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{tBooking.to || 'To'}</label>
                                                    <select
                                                        title="Select Dropoff Location"
                                                        aria-label="Select Dropoff Location"
                                                        value={booking.dropoffLocation}
                                                        onChange={e => setBooking(prev => ({ ...prev, dropoffLocation: e.target.value }))}
                                                        className="w-full rounded-[1.45rem] border border-gray-200 bg-white px-5 py-3.5 font-bold text-sm outline-none transition-colors focus:border-bee-yellow"
                                                    >
                                                        <option value="">{tBooking.select_dest || 'Select Destination'}</option>
                                                        {destinationLocations.map(loc => (
                                                            <option key={loc.id} value={loc.id}>
                                                                {getLocName(loc)} {loc.destinationSurcharge ? `(+₩${loc.destinationSurcharge.toLocaleString()})` : ''}
                                                            </option>
                                                        ))}
                                                    </select>
                                                <div className="rounded-[1.55rem] border border-gray-100 bg-gray-50/90 p-3.5 sm:p-4">
                                                    <div className="mb-3 flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.22em] text-gray-400">
                                                        <Calendar size={14} />
                                                        <span>{tBooking.delivery_schedule || 'Delivery Schedule'}</span>
                                                    </div>
                                                <div className="grid grid-cols-1 sm:grid-cols-[minmax(0,1.85fr)_94px] md:grid-cols-[minmax(0,2.15fr)_98px] gap-3">
                                                    <div
                                                        role="button"
                                                        tabIndex={0}
                                                        onClick={() => openDatePicker(deliveryDateInputRef)}
                                                        onKeyDown={(event) => handleDateFieldKeyDown(event, deliveryDateInputRef)}
                                                        className="relative min-w-0 cursor-pointer"
                                                    >
                                                        <input
                                                            ref={deliveryDateInputRef}
                                                            type="date"
                                                            aria-label="Delivery Date"
                                                            value={booking.dropoffDate}
                                                            min={booking.pickupDate}
                                                            max={add2MonthsToDateStr(formatKSTDate())}
                                                            onChange={e => setBooking(prev => ({ ...prev, dropoffDate: e.target.value }))}
                                                            className="absolute inset-0 h-14 sm:h-[3.75rem] w-full rounded-[1.35rem] opacity-0 pointer-events-none outline-none appearance-none [&::-webkit-calendar-picker-indicator]:hidden [&::-webkit-calendar-picker-indicator]:opacity-0"
                                                        />
                                                        <div className="pointer-events-none relative flex h-14 sm:h-[3.75rem] items-center rounded-[1.35rem] border border-white bg-white pl-4 pr-11 sm:pl-5 sm:pr-12 text-bee-black transition-all">
                                                                <span className="block min-w-0 flex-1 whitespace-nowrap text-[12px] sm:text-[13px] md:text-[14px] font-black leading-none tracking-[-0.02em]">
                                                                    {getCompactScheduleDate(booking.dropoffDate || '')}
                                                                </span>
                                                                <Calendar className="absolute right-4 top-1/2 h-4 w-4 shrink-0 -translate-y-1/2 text-gray-400" />
                                                            </div>
                                                        </div>
                                                        <div className="relative">
                                                            <select
                                                                title="Delivery Time"
                                                                aria-label="Delivery Time"
                                                                value={booking.deliveryTime}
                                                                onChange={e => setBooking(prev => ({ ...prev, deliveryTime: e.target.value }))}
                                                                className="h-14 sm:h-[3.75rem] w-full rounded-[1.35rem] border border-white bg-white px-4 pr-10 text-[0.92rem] sm:text-[0.96rem] md:text-[0.98rem] font-black text-bee-black outline-none transition-all focus:border-bee-yellow focus:ring-2 focus:ring-bee-yellow/25 appearance-none cursor-pointer"
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
                                                                <Clock size={18} />
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                                {booking.deliveryTime && (
                                                    <p className="text-[11px] font-bold text-red-500 leading-relaxed mt-1">
                                                        ⚠️ {tBooking.delivery_time_warning || '픽업시간보다 늦으실 경우 30분에 5천원씩 비용이 발생합니다. 신중하게 선택 부탁드리겠습니다.'}
                                                    </p>
                                                )}
                                            </div>
                                        ) : (
                                            <div className="h-full space-y-4 rounded-[18px] border border-gray-200 bg-[#FAFAF8] p-4">
                                                <div className="space-y-4 rounded-[18px] border border-bee-yellow/30 bg-white p-4 shadow-sm sm:p-5">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-10 h-10 bg-bee-yellow/10 rounded-2xl flex items-center justify-center">
                                                            <Info className="text-bee-yellow" size={20} />
                                                        </div>
                                                        <h4 className="font-black italic uppercase tracking-wider text-gray-900">{tVoucher.storage_notice_title || tBooking.storage_notice_title || 'STORAGE NOTICE'}</h4>
                                                    </div>
                                                    <p className="text-xs sm:text-sm font-bold text-gray-500 leading-relaxed">
                                                        {tVoucher.storage_notice_desc || tBooking.storage_notice_desc || 'Pick the start and return schedule, and storage time will be calculated automatically.'}
                                                    </p>
                                                </div>
                                                <div className="rounded-[1.55rem] border border-gray-100 bg-gray-50/90 p-3.5 sm:p-4">
                                                    <div className="mb-3 flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.22em] text-gray-400">
                                                        <Calendar size={14} />
                                                        <span>{tBooking.dropoff_schedule || tBooking.return_schedule_label || 'Retrieval Schedule'}</span>
                                                    </div>
                                                    <div className="grid grid-cols-1 sm:grid-cols-[minmax(0,1.85fr)_94px] md:grid-cols-[minmax(0,2.15fr)_98px] gap-3">
                                                        <div
                                                            role="button"
                                                            tabIndex={0}
                                                            onClick={() => openDatePicker(retrievalDateInputRef)}
                                                            onKeyDown={(event) => handleDateFieldKeyDown(event, retrievalDateInputRef)}
                                                            className="relative min-w-0 cursor-pointer"
                                                        >
                                                            <input
                                                                ref={retrievalDateInputRef}
                                                                type="date"
                                                                aria-label="Drop-off Date"
                                                                value={booking.dropoffDate?.split(' ')[0]}
                                                                min={booking.pickupDate || formatKSTDate()}
                                                                max={add2MonthsToDateStr(formatKSTDate())}
                                                                onChange={e => setBooking(prev => ({ ...prev, dropoffDate: e.target.value }))}
                                                                className="absolute inset-0 h-14 sm:h-[3.75rem] w-full rounded-[1.35rem] opacity-0 pointer-events-none outline-none appearance-none [&::-webkit-calendar-picker-indicator]:hidden [&::-webkit-calendar-picker-indicator]:opacity-0"
                                                            />
                                                            <div className="pointer-events-none relative flex h-14 sm:h-[3.75rem] items-center rounded-[1.35rem] border border-white bg-white pl-4 pr-11 sm:pl-5 sm:pr-12 text-bee-black transition-all">
                                                                <span className="block min-w-0 flex-1 whitespace-nowrap text-[12px] sm:text-[13px] md:text-[14px] font-black leading-none tracking-[-0.02em]">
                                                                    {getCompactScheduleDate(booking.dropoffDate || '')}
                                                                </span>
                                                                <Calendar className="absolute right-4 top-1/2 h-4 w-4 shrink-0 -translate-y-1/2 text-gray-400" />
                                                            </div>
                                                        </div>
                                                        <div className="relative">
                                                            <select
                                                                title="Retrieval Time"
                                                                aria-label="Retrieval Time"
                                                                value={booking.deliveryTime}
                                                                onChange={e => setBooking(prev => ({ ...prev, deliveryTime: e.target.value }))}
                                                                className="h-14 sm:h-[3.75rem] w-full rounded-[1.35rem] border border-white bg-white px-4 pr-10 text-[0.92rem] sm:text-[0.96rem] md:text-[0.98rem] font-black text-bee-black outline-none transition-all focus:border-bee-yellow focus:ring-2 focus:ring-bee-yellow/25 appearance-none cursor-pointer"
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
                                                                <Clock size={18} />
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
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
                                                <div className="flex items-start gap-4 rounded-[18px] border border-bee-yellow/30 bg-bee-yellow/10 p-4 shadow-sm">
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
                        <section className="hidden space-y-6">
                            <div className="flex items-center gap-4">
                                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-bee-black text-xs font-black text-bee-yellow">02</div>
                                <h3 className="text-xl font-black uppercase tracking-normal text-bee-black">{tBooking.bags_label || 'Baggage Selection'}</h3>
                            </div>

                            <div className={`grid gap-4 ${booking.serviceType === ServiceType.DELIVERY ? 'grid-cols-1 lg:grid-cols-2' : 'grid-cols-1 md:grid-cols-2 xl:grid-cols-3'}`}>
                                {visibleBagCategories.map((category) => {
                                    const count = getBagCategoryCount(booking.bagSizes, category.id);
                                    const isDelivery = booking.serviceType === ServiceType.DELIVERY;
                                    const unitPrice = isDelivery
                                        ? getStoragePriceForCategory(deliveryPrices, category.id)
                                        : getStoragePriceForCategory(baseStoragePrices, category.id);
                                    const visual = getBagCategoryVisualMeta(category.id);
                                    const label = getBagCategoryLabel(category.id, lang);
                                    const description = getBagCategoryDescription(category.id, lang, booking.serviceType || ServiceType.STORAGE);

                                    return (
                                        <div key={category.id} className="h-full w-full min-w-0 overflow-hidden rounded-[18px] border border-gray-200 bg-white shadow-sm transition-all hover:-translate-y-0.5 hover:border-bee-yellow/70 hover:shadow-lg">
                                            <div className="flex h-full flex-col gap-2.5 p-3 sm:p-3.5">
                                                <div className="flex min-h-[5.6rem] items-start justify-between gap-2.5 sm:min-h-[6.2rem]">
                                                    <div className="min-w-0 flex-1">
                                                        <div className="text-[9px] font-black uppercase tracking-[0.14em] text-gray-400 whitespace-nowrap">
                                                            {isDelivery ? (lang.startsWith('ko') ? '배송 품목' : 'Delivery item') : (lang.startsWith('ko') ? '보관 품목' : 'Storage item')}
                                                        </div>
                                                        <div className="mt-1 text-[1.2rem] sm:text-[1.35rem] font-black leading-tight text-bee-black break-keep">
                                                            {label}
                                                        </div>
                                                    </div>
                                                    <div className={`shrink-0 rounded-[1.15rem] px-3 py-2 text-center min-w-[5.25rem] ${visual.chipClassName}`}>
                                                        <div className="text-[9px] font-black uppercase tracking-[0.1em] opacity-70 whitespace-nowrap">
                                                            {lang.startsWith('ko') ? '선택 수량' : 'Selected'}
                                                        </div>
                                                        <div className="mt-1 text-[1.8rem] font-black leading-none">{count}</div>
                                                    </div>
                                                </div>

                                                <div className="flex min-h-[4.8rem] items-center gap-2.5 sm:min-h-[5.1rem]">
                                                    <div className={`flex h-[7.2rem] w-[7.2rem] shrink-0 items-center justify-center rounded-[1.2rem] bg-gradient-to-br ${visual.accentClassName}`}>
                                                        <img
                                                            src={visual.imageSrc}
                                                            alt={label}
                                                            className="h-[6.5rem] w-[6.5rem] sm:h-[6.7rem] sm:w-[6.7rem] object-contain"
                                                            loading="lazy"
                                                        />
                                                    </div>

                                                    <p
                                                        className="min-w-0 flex-1 text-[9.5px] sm:text-[10px] font-semibold leading-[1.35] text-gray-500 break-keep"
                                                        style={{
                                                            display: '-webkit-box',
                                                            WebkitLineClamp: 4,
                                                            WebkitBoxOrient: 'vertical',
                                                            overflow: 'hidden',
                                                        }}
                                                    >
                                                        {description}
                                                    </p>
                                                </div>

                                                <div className="mt-auto rounded-[1.15rem] bg-gray-50/85 px-2.5 py-2.5">
                                                    <div className="flex flex-col gap-2.5">
                                                        <div className="min-w-0">
                                                            <div className="text-[8px] sm:text-[9px] font-black uppercase tracking-[0.12em] text-gray-400 whitespace-nowrap">
                                                                {isDelivery ? (lang.startsWith('ko') ? '1회 배송 기준' : 'Per delivery') : (lang.startsWith('ko') ? '기본 4시간 요금' : 'Base 4h price')}
                                                            </div>
                                                            <div className="mt-1 text-[1.15rem] sm:text-[1.35rem] font-black leading-none text-bee-yellow whitespace-nowrap">
                                                                {lang === 'ko'
                                                                    ? `₩${unitPrice.toLocaleString()}`
                                                                    : `USD $${krwToUsd(unitPrice, usdRate)}`}
                                                            </div>
                                                            {unitPrice > 0 && (
                                                                <div className="text-[8px] font-bold text-gray-400 mt-0.5">
                                                                    {lang === 'ko'
                                                                        ? `약 USD $${krwToUsd(unitPrice, usdRate)}`
                                                                        : `≈ ₩${unitPrice.toLocaleString()}`}
                                                                </div>
                                                            )}
                                                            <div className="mt-1.5 text-[9px] sm:text-[10px] font-bold leading-[1.45] text-gray-500 break-keep">
                                                                {isDelivery
                                                                    ? (lang.startsWith('ko') ? '결제는 예약 단계에서 바로 반영됩니다.' : 'Added to your delivery total instantly.')
                                                                    : (lang.startsWith('ko') ? '4시간 이후부터는 1시간 단위로 추가 계산됩니다.' : 'After 4 hours, pricing adds in 1-hour increments.')}
                                                            </div>
                                                        </div>

                                                        <div className="flex items-center justify-center">
                                                            <div className="flex shrink-0 items-center gap-1.5 rounded-full bg-white px-1.5 py-1.5 shadow-sm">
                                                            <button
                                                                title="Decrease"
                                                                aria-label="Decrease"
                                                                onClick={() => updateBagCount(category.id, -1)}
                                                                className="flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-500 transition-colors hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-45"
                                                                disabled={count === 0}
                                                            >
                                                                <i className="fa-solid fa-minus text-[10px]"></i>
                                                            </button>
                                                            <span className="w-6 sm:w-7 text-center text-[1.5rem] sm:text-[1.65rem] font-black text-bee-black">{count}</span>
                                                            <button
                                                                title="Increase"
                                                                aria-label="Increase"
                                                                onClick={() => updateBagCount(category.id, 1)}
                                                                className="flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-full bg-bee-black text-bee-yellow transition-colors shadow-sm hover:bg-gray-800 disabled:bg-gray-200 disabled:text-gray-400"
                                                            >
                                                                <i className="fa-solid fa-plus text-[10px] sm:text-[11px]"></i>
                                                            </button>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                            {booking.serviceType === ServiceType.DELIVERY && (
                                <div className="space-y-1">
                                    <p className="text-[11px] font-bold text-red-500">
                                        배송은 쇼핑백, 손가방과 캐리어만 접수 가능합니다.
                                    </p>
                                    <p className="text-[11px] font-bold text-red-500">
                                        쇼핑백, 손가방 단독 배송은 불가하고 캐리어를 1개 이상 함께 선택해야 합니다.
                                    </p>
                                </div>
                            )}
                        </section>

                        {/* Step 3: User Info */}
                        <section id="reserve-user" className="space-y-6">
                            <div className="hidden md:flex items-center gap-4">
                                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-bee-black text-xs font-black text-bee-yellow">01</div>
                                <h3 className="text-xl font-black uppercase tracking-normal text-bee-black">{tBooking.contact_info_title || tBooking.contact_info || 'Contact Information'}</h3>
                            </div>

                            <div className="renewal-user-card space-y-4 rounded-[20px] border border-gray-200 bg-white p-5 shadow-sm md:p-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="renewal-form-field space-y-2">
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{tBooking.name || 'Name'}</label>
                                        <input
                                            type="text"
                                            title="Your Name"
                                            aria-label="Your Name"
                                            value={booking.userName}
                                            onFocus={() => {
                                                if (!window._initiatedCheckout) {
                                                    import('../services/trackingService').then(({ TrackingService }) => {
                                                        TrackingService.initiateCheckout();
                                                        window._initiatedCheckout = true;
                                                    });
                                                }
                                            }}
                                            onChange={e => setBooking(prev => ({ ...prev, userName: e.target.value }))}
                                            placeholder={tBooking.name || "Your Name"}
                                            className="w-full p-4 bg-gray-50 rounded-2xl font-bold text-sm outline-none focus:bg-white focus:ring-2 focus:ring-bee-yellow/50 transition-all"
                                        />
                                    </div>
                                    <div className="renewal-form-field space-y-2">
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{tBooking.email || 'Email'}</label>
                                        <input
                                            type="email"
                                            title="Your Email"
                                            aria-label="Your Email"
                                            value={booking.userEmail}
                                            onFocus={() => {
                                                if (!window._initiatedCheckout) {
                                                    import('../services/trackingService').then(({ TrackingService }) => {
                                                        TrackingService.initiateCheckout();
                                                        window._initiatedCheckout = true;
                                                    });
                                                }
                                            }}
                                            onChange={e => setBooking(prev => ({ ...prev, userEmail: e.target.value }))}
                                            placeholder="email@example.com"
                                            className="w-full p-4 bg-gray-50 rounded-2xl font-bold text-sm outline-none focus:bg-white focus:ring-2 focus:ring-bee-yellow/50 transition-all"
                                        />
                                    </div>
                                </div>
                                <div className="renewal-form-field space-y-2">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{tBooking.sns || 'SNS'}</label>
                                    <div className="renewal-sns-row" style={{ display: 'grid', gridTemplateColumns: '1fr 110px', gap: '7px' }}>
                                        <input
                                            type="text"
                                            title="SNS ID"
                                            aria-label="SNS ID"
                                            value={booking.snsId}
                                            onChange={e => setBooking(prev => ({ ...prev, snsId: e.target.value }))}
                                            placeholder={tBooking.snsId || "ID"}
                                            className="w-full p-4 bg-gray-50 rounded-2xl font-bold text-sm outline-none focus:bg-white focus:ring-2 focus:ring-bee-yellow/50 transition-all"
                                        />
                                        <select
                                            title="SNS Channel"
                                            aria-label="SNS Channel"
                                            value={booking.snsChannel}
                                            onChange={e => setBooking(prev => ({ ...prev, snsChannel: e.target.value }))}
                                            className="w-full p-4 bg-gray-50 rounded-2xl font-bold text-sm outline-none focus:bg-white focus:ring-2 focus:ring-bee-yellow/50 transition-all"
                                        >
                                            <option value="instagram">Instagram</option>
                                            <option value="wechat">WeChat</option>
                                            <option value="line">LINE</option>
                                            <option value="kakao">KakaoTalk</option>
                                            <option value="whatsapp">WhatsApp</option>
                                        </select>
                                    </div>
                                </div>

                                {/* [스봉리포트 전용] 국가 선택 필드 추가 🌏💅 */}
                                <div className="renewal-form-field space-y-2 pt-2">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                                        {lang === 'ko' ? '거주 국가 (리포트용)' : 'Country of Residence'}
                                    </label>
                                    <div className="relative">
                                        <select
                                            title="Country Selection"
                                            value={booking.country}
                                            onChange={e => setBooking(prev => ({ ...prev, country: e.target.value }))}
                                            className="w-full p-4 bg-gray-50 rounded-2xl font-bold text-sm outline-none focus:bg-white focus:ring-2 focus:ring-bee-yellow/50 transition-all appearance-none cursor-pointer"
                                        >
                                            {Object.entries(COUNTRY_NAMES).map(([code, name]) => (
                                                <option key={code} value={code}>{name}</option>
                                            ))}
                                        </select>
                                        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                                            <i className="fa-solid fa-chevron-down text-xs"></i>
                                        </div>
                                    </div>
                                </div>

                            </div>
                        </section>
                    </div>

                    {/* Right Column: Summary & Checkout */}
                    <div id="reserve-2" className="renewal-dw-right">
                        <div className="md:sticky md:top-24 space-y-4">
                            <div className="renewal-checkout-card relative overflow-hidden rounded-[20px] bg-bee-black p-6 text-white shadow-2xl ring-1 ring-white/10 md:p-7">
                                <h3 className="mb-7 flex items-center gap-3 text-xl font-black uppercase tracking-normal">
                                    <span className="w-2 h-2 bg-bee-yellow rounded-full animate-pulse" />
                                    {tBooking.booking_summary || 'BOOKING SUMMARY'}
                                </h3>

                                <div className="space-y-6">
                                    <div className="flex justify-between items-center group">
                                        <span className="text-gray-400 text-xs font-bold uppercase tracking-widest group-hover:text-bee-yellow transition-colors">{tBooking.service_type || 'Service Type'}</span>
                                        <span className="text-bee-yellow font-black italic uppercase tracking-wider bg-white/5 px-3 py-1 rounded-lg">
                                            {booking.serviceType === ServiceType.DELIVERY ? (t.booking?.delivery || 'DELIVERY') : (t.booking?.storage || 'STORAGE')}
                                        </span>
                                    </div>
                                    <div className="flex justify-between items-center group">
                                        <span className="text-gray-400 text-xs font-bold uppercase tracking-widest group-hover:text-bee-yellow transition-colors">{tBooking.baggage_count || 'Baggage Count'}</span>
                                        <span className="font-black text-lg">{booking.bags}</span>
                                    </div>
                                    {booking.serviceType !== ServiceType.DELIVERY && (
                                        <div className="flex justify-between items-center group">
                                            <span className="text-gray-400 text-xs font-bold uppercase tracking-widest group-hover:text-bee-yellow transition-colors">{tBooking.duration || 'Duration'}</span>
                                            <span className="font-black text-lg text-bee-yellow">
                                                {priceDetails.durationText || '-'}
                                            </span>
                                        </div>
                                    )}
                                    <div className="h-px bg-white/10 my-2" />
                                    <div className="flex justify-between items-end group">
                                        <span className="text-gray-400 text-xs font-black uppercase tracking-[0.2em] group-hover:text-bee-yellow transition-colors">{tBooking.final_total || 'TOTAL'}</span>
                                        <div className="text-right">
                                            {lang === 'ko' ? (
                                                <>
                                                    <div className="flex items-baseline gap-2 justify-end">
                                                        <span className="text-bee-yellow font-black italic text-3xl">₩</span>
                                                        <span className="text-4xl font-black italic tracking-tighter tabular-nums">{priceDetails.total.toLocaleString()}</span>
                                                    </div>
                                                    {priceDetails.total > 0 && (
                                                        <p className="text-[10px] text-gray-400 font-bold mt-0.5">
                                                            약 USD ${krwToUsd(priceDetails.total, usdRate)}
                                                        </p>
                                                    )}
                                                </>
                                            ) : (
                                                <>
                                                    <div className="flex items-baseline gap-2 justify-end">
                                                        <span className="text-bee-yellow font-black italic text-3xl">$</span>
                                                        <span className="text-4xl font-black italic tracking-tighter tabular-nums">{krwToUsd(priceDetails.total, usdRate)}</span>
                                                    </div>
                                                    {priceDetails.total > 0 && (
                                                        <p className="text-[10px] text-gray-400 font-bold mt-0.5">
                                                            {({ 'zh-TW': '約', 'zh-HK': '約', zh: '约', ja: '約', en: '≈' } as Record<string, string>)[lang] ?? '≈'} ₩{priceDetails.total.toLocaleString()}
                                                        </p>
                                                    )}
                                                </>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* 💅 Coupon Input */}
                                <div className="pt-2 pb-4 border-b border-white/10 space-y-2">
                                    <div className="flex gap-2">
                                        <input
                                            type="text"
                                            title="Promo Code"
                                            aria-label="Promo Code"
                                            value={couponInput}
                                            onChange={e => {
                                                setCouponInput(e.target.value.toUpperCase());
                                                if (couponMessage) setCouponMessage(null);
                                            }}
                                            placeholder={tBooking.enter_coupon || "Enter promo code"}
                                            className="flex-1 bg-white/10 text-white placeholder-white/40 px-3 py-2 rounded-xl text-xs font-bold outline-none focus:ring-1 focus:ring-bee-yellow transition-all uppercase"
                                        />
                                        <button
                                            title="Apply Promo Code"
                                            onClick={handleApplyCoupon}
                                            className="px-4 py-2 bg-white/20 hover:bg-bee-yellow hover:text-bee-black rounded-xl text-xs font-black transition-all whitespace-nowrap"
                                        >
                                            {tBooking.apply || 'Apply'}
                                        </button>
                                    </div>
                                    <AnimatePresence>
                                        {couponMessage && (
                                            <motion.p
                                                initial={{ opacity: 0, height: 0 }}
                                                animate={{ opacity: 1, height: 'auto' }}
                                                className={`text-[10px] font-bold px-1 ${couponMessage.type === 'error' ? 'text-red-400' : 'text-bee-yellow'}`}
                                            >
                                                {couponMessage.text}
                                            </motion.p>
                                        )}
                                    </AnimatePresence>
                                </div>

                                <div className="mt-8 space-y-3 relative z-10">
                                    <label className="renewal-agree-row flex items-center gap-4 group cursor-pointer">
                                        <div className="relative w-5 h-5 flex-shrink-0">
                                            <input
                                                type="checkbox"
                                                checked={booking.agreedToTerms}
                                                onChange={e => setBooking(prev => ({ ...prev, agreedToTerms: e.target.checked }))}
                                                className="w-5 h-5 rounded-lg border-2 border-gray-200 checked:bg-bee-black transition-all appearance-none cursor-pointer"
                                            />
                                            <div className={`absolute inset-0 flex items-center justify-center pointer-events-none ${booking.agreedToTerms ? 'text-bee-yellow' : 'hidden'}`}>
                                                <CheckCircle2 size={12} strokeWidth={4} />
                                            </div>
                                        </div>
                                        <span className="text-sm font-bold leading-relaxed text-white/75">
                                            {tBooking.terms_agree_1 || '[Req] Agree to Terms of Service'}
                                            <button onClick={(e) => { e.preventDefault(); window.open('/terms', '_blank'); }} className="ml-2 text-bee-yellow font-black underline underline-offset-4 decoration-bee-yellow decoration-2">
                                                {tBooking.terms_link || 'Link'}
                                            </button>
                                        </span>
                                    </label>

                                    <label className="renewal-agree-row flex items-center gap-4 group cursor-pointer">
                                        <div className="relative w-5 h-5 flex-shrink-0">
                                            <input
                                                type="checkbox"
                                                checked={booking.agreedToPrivacy}
                                                onChange={e => setBooking(prev => ({ ...prev, agreedToPrivacy: e.target.checked }))}
                                                className="w-5 h-5 rounded-lg border-2 border-gray-200 checked:bg-bee-black transition-all appearance-none cursor-pointer"
                                            />
                                            <div className={`absolute inset-0 flex items-center justify-center pointer-events-none ${booking.agreedToPrivacy ? 'text-bee-yellow' : 'hidden'}`}>
                                                <CheckCircle2 size={12} strokeWidth={4} />
                                            </div>
                                        </div>
                                        <span className="text-sm font-bold leading-relaxed text-white/75">
                                            {tBooking.terms_agree_2 || '[Req] Agree to Privacy Policy'}
                                            <button onClick={(e) => { e.preventDefault(); window.open('/privacy-policy', '_blank'); }} className="ml-2 text-bee-yellow font-black underline underline-offset-4 decoration-bee-yellow decoration-2">
                                                {tBooking.terms_link || 'Link'}
                                            </button>
                                        </span>
                                    </label>

                                    <label className="renewal-agree-row flex items-center gap-4 group cursor-pointer">
                                        <div className="relative w-5 h-5 flex-shrink-0">
                                            <input
                                                type="checkbox"
                                                checked={booking.agreedToHighValue}
                                                onChange={e => setBooking(prev => ({ ...prev, agreedToHighValue: e.target.checked }))}
                                                className="w-5 h-5 rounded-lg border-2 border-gray-200 checked:bg-bee-black transition-all appearance-none cursor-pointer"
                                            />
                                            <div className={`absolute inset-0 flex items-center justify-center pointer-events-none ${booking.agreedToHighValue ? 'text-bee-yellow' : 'hidden'}`}>
                                                <CheckCircle2 size={12} strokeWidth={4} />
                                            </div>
                                        </div>
                                        <span className="text-sm font-bold leading-relaxed text-white/75">{tBooking.terms_agree_3 || '[Req] Prohibited High-Value Items Policy'}</span>
                                    </label>
                                </div>

                                {/* Prohibited Items Warning */}
                                <div className="mt-8 p-6 bg-gray-50 rounded-[2rem] border border-gray-100 italic">
                                    <div className="flex items-center gap-2 mb-4">
                                        <AlertCircle className="text-bee-yellow" size={16} />
                                        <span className="text-xs font-black uppercase tracking-widest text-bee-black">{tBooking.prohibited_items_title || 'Prohibited Items & Liability Policy'}</span>
                                    </div>
                                    <ul className="space-y-2 text-[11px] font-bold text-gray-500">
                                        <li>• {tBooking.prohibited_item_1 || 'Cash, Securities, Jewelry (Over ₩500k per item)'}</li>
                                        <li>• {tBooking.prohibited_item_2 || 'Art, Antiques, Rare Collectibles'}</li>
                                        <li>• {tBooking.prohibited_item_3 || 'Explosive/Flammable/Volatile materials'}</li>
                                        <li>• {tBooking.prohibited_item_4 || 'Animals, Remains, Perishable goods, Waste'}</li>
                                        <li>• {tBooking.prohibited_item_5 || 'Electronics & Precision Devices'}</li>
                                        <li>• {tBooking.prohibited_item_6 || 'Illegal items, Weapons, Dangerous goods'}</li>
                                        <li className="pt-2 text-bee-black font-black">{tBooking.prohibited_item_note || '* Items found may result in limited service or return.'}</li>
                                    </ul>
                                </div>

                                {/* ============ 결제 수단 (목업 이식) ============ */}
                                {/* total > 0 이고 결제 모드일 때만 결제 수단 선택 */}
                                {priceDetails.total > 0 && !isDirectBookingMode && (
                                    <div className="mt-8 rounded-[1.5rem] bg-white border border-gray-100 px-5 py-4 shadow-sm">
                                        <div className="text-xs font-black text-bee-black uppercase tracking-widest mb-2">
                                            {({
                                                ko: '지불 방법',
                                                'zh-TW': '付款方式',
                                                'zh-HK': '付款方式',
                                                zh: '支付方式',
                                                ja: 'お支払い方法',
                                                en: 'Payment Method',
                                            } as Record<string, string>)[lang] ?? 'Payment Method'}
                                        </div>

                                        {/* Toss / 카드 옵션 — Toss 활성화 시에만 (PayPal 없는 환경) */}
                                        {!isPayPalEnabled() && (
                                            <label
                                                className="flex items-center gap-3 py-3 cursor-pointer border-b border-gray-100 last:border-b-0"
                                                onClick={() => setPaymentMethod('card')}
                                            >
                                                <span className="w-10 h-7 flex-shrink-0 flex items-center justify-center rounded-md overflow-hidden">
                                                    <svg width="32" height="20" viewBox="0 0 40 26" fill="none">
                                                        <rect width="40" height="26" rx="4" fill="#1A1F71" />
                                                        <rect y="6" width="40" height="7" fill="#F7B600" />
                                                        <rect x="3" y="16" width="10" height="6" rx="1" fill="#fff" opacity=".8" />
                                                    </svg>
                                                </span>
                                                <span className="flex-1 text-sm font-black text-bee-black leading-tight">
                                                    {lang.startsWith('ko') ? '체크 / 신용카드' : 'Credit / Debit Card'}
                                                    <span className="block text-[10px] font-bold text-gray-400 mt-0.5">Visa · Mastercard · UnionPay</span>
                                                </span>
                                                <span className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${paymentMethod === 'card' ? 'border-bee-yellow' : 'border-gray-300'}`}>
                                                    {paymentMethod === 'card' && <span className="w-2.5 h-2.5 rounded-full bg-bee-yellow" />}
                                                </span>
                                            </label>
                                        )}

                                        {/* PayPal 옵션 — PayPal 활성화 시에만 */}
                                        {isPayPalEnabled() && (
                                            <label
                                                className="flex items-center gap-3 py-3 cursor-pointer border-b border-gray-100 last:border-b-0"
                                                onClick={() => setPaymentMethod('paypal')}
                                            >
                                                <span className="w-10 h-7 flex-shrink-0 flex items-center justify-center rounded-md overflow-hidden border border-gray-200">
                                                    <svg width="34" height="22" viewBox="0 0 50 32" fill="none">
                                                        <rect width="50" height="32" rx="4" fill="#fff" />
                                                        <text x="6" y="22" fontFamily="Arial" fontWeight="800" fontSize="14" fill="#003087">Pay</text>
                                                        <text x="22" y="22" fontFamily="Arial" fontWeight="800" fontSize="14" fill="#009CDE">Pal</text>
                                                    </svg>
                                                </span>
                                                <span className="flex-1 text-sm font-black text-bee-black">PayPal</span>
                                                <span className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${paymentMethod === 'paypal' ? 'border-bee-yellow' : 'border-gray-300'}`}>
                                                    {paymentMethod === 'paypal' && <span className="w-2.5 h-2.5 rounded-full bg-bee-yellow" />}
                                                </span>
                                            </label>
                                        )}
                                    </div>
                                )}

                                {/* ============ 결제 트리거 (PayPal vs 카드/Direct) ============ */}
                                {/* PayPal 결제 — paymentMethod가 paypal일 때 PayPal 버튼 컨테이너 노출 */}
                                {isPayPalEnabled() && priceDetails.total > 0 && paymentMethod === 'paypal' ? (
                                    <div className="mt-6">
                                        <p className="text-center text-xs font-black text-gray-500 mb-1">
                                            {({
                                                ko: '아래 버튼으로 결제 후 예약이 확정됩니다',
                                                'zh-TW': '請點擊下方按鈕完成付款以確認預訂',
                                                'zh-HK': '請點擊下方按鈕完成付款以確認預訂',
                                                zh: '请点击下方按钮完成付款以确认预订',
                                                ja: '下のボタンでお支払いいただくと予約が確定されます',
                                                en: 'Pay below to confirm your booking',
                                            } as Record<string, string>)[lang] ?? 'Pay below to confirm your booking'}
                                        </p>
                                        <div className="text-center text-[11px] text-gray-400 font-bold mb-3">
                                            {({
                                                ko: `USD $${krwToUsd(priceDetails.total, usdRate)} (≈ ₩${priceDetails.total.toLocaleString()} 원)`,
                                                'zh-TW': `USD $${krwToUsd(priceDetails.total, usdRate)}（約 ₩${priceDetails.total.toLocaleString()} 韓元）`,
                                                'zh-HK': `USD $${krwToUsd(priceDetails.total, usdRate)}（約 ₩${priceDetails.total.toLocaleString()} 韓元）`,
                                                zh: `USD $${krwToUsd(priceDetails.total, usdRate)}（约 ₩${priceDetails.total.toLocaleString()} 韩元）`,
                                                ja: `USD $${krwToUsd(priceDetails.total, usdRate)}（約 ₩${priceDetails.total.toLocaleString()} ウォン）`,
                                                en: `USD $${krwToUsd(priceDetails.total, usdRate)} (≈ ₩${priceDetails.total.toLocaleString()} KRW)`,
                                            } as Record<string, string>)[lang] ?? `USD $${krwToUsd(priceDetails.total, usdRate)} (≈ ₩${priceDetails.total.toLocaleString()} KRW)`}
                                        </div>
                                        {paypalValidationMsg && (
                                            <p className="text-xs text-red-500 font-bold text-center mb-2">
                                                {paypalValidationMsg}
                                            </p>
                                        )}
                                        {paypalLoadError ? (
                                            <p className="text-xs text-red-500 font-bold text-center py-3">
                                                {({
                                                    ko: 'PayPal 결제를 불러오지 못했습니다. 페이지를 새로고침해 주세요.',
                                                    'zh-TW': '無法載入 PayPal 付款。請重新整理頁面。',
                                                    'zh-HK': '無法載入 PayPal 付款。請重新載入頁面。',
                                                    zh: '无法加载 PayPal 付款。请刷新页面。',
                                                    ja: 'PayPalの読み込みに失敗しました。ページを更新してください。',
                                                    en: 'PayPal failed to load. Please refresh the page.',
                                                } as Record<string, string>)[lang] ?? 'PayPal failed to load. Please refresh the page.'}
                                            </p>
                                        ) : (
                                            <div ref={paypalContainerRef} id="paypal-button-container" />
                                        )}
                                    </div>
                                ) : (
                                    /* Toss 카드 결제 / Direct 예약 — 목업 스타일 풀 가로폭 결제 버튼 */
                                    <button
                                        onClick={handleBook}
                                        disabled={isSubmitting}
                                        className="renewal-pay-button mt-6 flex h-[58px] w-full items-center justify-between gap-3 rounded-full bg-bee-black px-7 text-white shadow-xl transition-all hover:bg-[#2a2a2a] active:scale-[0.98] disabled:cursor-not-allowed disabled:bg-gray-300 disabled:text-gray-500"
                                    >
                                        {isSubmitting ? (
                                            <span className="mx-auto flex items-center gap-2">
                                                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                                                <span className="text-sm font-black">{tBooking.processing || 'Processing'}</span>
                                            </span>
                                        ) : isDirectBookingMode ? (
                                            <>
                                                <span className="text-lg font-black tracking-tight tabular-nums">
                                                    {lang === 'ko' ? `₩${priceDetails.total.toLocaleString()}` : `$${krwToUsd(priceDetails.total, usdRate)}`}
                                                </span>
                                                <span className="text-sm font-black uppercase tracking-wider flex items-center gap-1.5">
                                                    {lang.startsWith('ko') ? '예약 확정하기' : 'Confirm booking'}
                                                    <ArrowRight size={16} />
                                                </span>
                                            </>
                                        ) : (
                                            <>
                                                <span className="text-lg font-black tracking-tight tabular-nums">
                                                    {lang === 'ko' ? `₩${priceDetails.total.toLocaleString()}` : `$${krwToUsd(priceDetails.total, usdRate)}`}
                                                </span>
                                                <span className="text-sm font-black uppercase tracking-wider flex items-center gap-1.5">
                                                    {tBooking.pay_now || (lang.startsWith('ko') ? '결제하기' : 'Pay now')}
                                                    <ArrowRight size={16} />
                                                </span>
                                            </>
                                        )}
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>

                </div>
            </div>
            </div>
        </div>
    );
};

export default BookingPage;
