
import React, { useState, useMemo, useEffect } from 'react';
import { BookingState, ServiceType, BookingStatus, SnsType, BagSizes, LocationOption, PriceSettings, StorageTier, LocationType, DiscountCode } from '../types';
import { LOCATIONS as INITIAL_LOCATIONS } from '../constants';
import { StorageService } from '../services/storageService';
import { RecaptchaService } from '../services/recaptchaService';
import { calculateDeliveryStoragePrice, calculateStoragePrice, STORAGE_RATES } from '../utils/pricing';
import { formatKSTDate, isPastKSTTime, getLocalizedDate, getFirstAvailableSlot, isAllSlotsPast, addDaysToDateStr } from '../utils/dateUtils';
import { Clock } from 'lucide-react';
import {
  BagCategoryId,
  DEFAULT_DELIVERY_PRICES,
  DEFAULT_STORAGE_TIERS as INITIAL_STORAGE_TIERS,
  createEmptyBagSizes,
  getBagCategoriesForService,
  getBagCategoryCount,
  getBagCategoryLabel,
  getStoragePriceForCategory,
  getTotalBags,
  hasStandaloneHandBagDeliverySelection,
  sanitizeBagSizes,
  sanitizeDeliveryBagSizes,
  updateBagCategoryCount,
} from '../src/domains/booking/bagCategoryUtils';

interface BookingWidgetProps {
  lang: string;
  t: any;
  preSelectedBooking?: { id: string; type: 'STORAGE' | 'DELIVERY'; bagCounts?: BagSizes } | null;
  onLocationsClick?: () => void;
  onTermsClick?: () => void;
  onPrivacyClick?: () => void;
  onFinalBookClick?: (action: () => void) => void;
  onSuccess?: (booking: any) => void;
  initialLocationId?: string; // 💅 [스봉이] 특정 지점 자동 선택을 위해 추가했어요!
  /** @deprecated use preSelectedBooking instead */
  initialBooking?: BookingState | null;
}

const BookingWidget: React.FC<BookingWidgetProps> = ({ lang, t, preSelectedBooking, initialBooking, onTermsClick, onPrivacyClick, onFinalBookClick, onSuccess, initialLocationId }) => {
  const [locations, setLocations] = useState<LocationOption[]>(INITIAL_LOCATIONS);
  const [deliveryPrices, setDeliveryPrices] = useState<PriceSettings>(DEFAULT_DELIVERY_PRICES);
  const [storageTiers, setStorageTiers] = useState<StorageTier[]>(INITIAL_STORAGE_TIERS);
  const [serviceType, setServiceType] = useState<ServiceType>(ServiceType.DELIVERY);
  const [currentStep, setCurrentStep] = useState(1);

  const [booking, setBooking] = useState<BookingState>({
    serviceType: ServiceType.DELIVERY, pickupLocation: '', pickupAddress: '', pickupAddressDetail: '',
    dropoffLocation: '', dropoffAddress: '', dropoffAddressDetail: '',
    pickupDate: formatKSTDate(), pickupTime: '09:00', deliveryTime: '16:00', dropoffDate: formatKSTDate(),
    bags: 0, bagSizes: createEmptyBagSizes(), selectedStorageTierId: INITIAL_STORAGE_TIERS[0].id,
    userName: '', userEmail: '', snsChannel: 'kakao', snsId: '',
    status: BookingStatus.PENDING, price: 0, createdAt: new Date().toISOString(),
    agreedToTerms: false, agreedToPrivacy: false, agreedToHighValue: false, agreedToPremium: false,
    insuranceLevel: 1, insuranceBagCount: 1,
    weightSurcharge5kg: 0, weightSurcharge10kg: 0,
    country: 'KR'
  });

  const [isCountryManuallySet, setIsCountryManuallySet] = useState(false);

  // 🕵️‍♀️ [스봉이] 위젯에서도 제 천재성은 빛이 납니다! 💅✨ 언어-국가 매칭!
  useEffect(() => {
    if (isCountryManuallySet) return;

    let autoCountry = 'US';
    if (lang === 'ko') autoCountry = 'KR';
    else if (lang === 'ja') autoCountry = 'JP';
    else if (lang === 'zh' || lang === 'zh-CN') autoCountry = 'CN';
    else if (lang === 'zh-HK') autoCountry = 'HK';
    else if (lang === 'zh-TW') autoCountry = 'TW';

    setBooking(prev => ({ ...prev, country: autoCountry }));
  }, [lang, isCountryManuallySet]);

  const [couponInput, setCouponInput] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<DiscountCode | null>(null);
  const [couponError, setCouponError] = useState('');
  const [isValidatingCoupon, setIsValidatingCoupon] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const tBooking = t.booking || {};
  const parseKstDateTime = (dateStr?: string, timeStr?: string, fallbackTime: string = '00:00') => {
    if (!dateStr) return null;
    const safeTime = (timeStr || fallbackTime || '00:00').slice(0, 5);
    const parsed = new Date(`${dateStr}T${safeTime}:00+09:00`);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  };

  const isModification = !!initialBooking;

  useEffect(() => {
    let isMounted = true;
    const loadData = async () => {
      try {
        const freshLocations = await StorageService.getLocations();
        if (isMounted) setLocations(freshLocations);
        const [dPrices, sTiers] = await Promise.all([
          StorageService.getDeliveryPrices(),
          StorageService.getStorageTiers()
        ]);
        if (dPrices && isMounted) setDeliveryPrices(dPrices);
        if (sTiers && isMounted) setStorageTiers(sTiers);
      } catch (e) { console.error(e); }
    };
    loadData();
    return () => { isMounted = false; };
  }, []);

  useEffect(() => {
    if (initialBooking) {
      setBooking(initialBooking);
      setServiceType(initialBooking.serviceType);
    } else if (preSelectedBooking) {
      const bType = preSelectedBooking.type === 'STORAGE' ? ServiceType.STORAGE : ServiceType.DELIVERY;
      setServiceType(bType);
      const bagCounts = bType === ServiceType.DELIVERY
        ? sanitizeDeliveryBagSizes(preSelectedBooking.bagCounts)
        : sanitizeBagSizes(preSelectedBooking.bagCounts);
      setBooking(prev => ({
        ...prev,
        serviceType: bType,
        pickupLocation: preSelectedBooking.id,
        bagSizes: bagCounts,
        bags: getTotalBags(bagCounts)
      }));
    } else if (initialLocationId) {
      setBooking(prev => ({ ...prev, pickupLocation: initialLocationId }));
    }
  }, [preSelectedBooking, initialBooking, initialLocationId]);

  useEffect(() => {
    if (serviceType !== ServiceType.DELIVERY || !booking.bagSizes.strollerBicycle) return;
    setBooking(prev => ({
      ...prev,
      bagSizes: sanitizeDeliveryBagSizes(prev.bagSizes),
      bags: getTotalBags(sanitizeDeliveryBagSizes(prev.bagSizes))
    }));
  }, [serviceType, booking.bagSizes.strollerBicycle]);

  const selectedBranch = useMemo(() => {
    return locations.find(l => l.id === booking.pickupLocation);
  }, [booking.pickupLocation, locations]);

  const visibleBagCategories = useMemo(() => getBagCategoriesForService(serviceType), [serviceType]);

  const baseStoragePrices: PriceSettings = useMemo(() => ({
    handBag: STORAGE_RATES.handBag.hours4,
    carrier: STORAGE_RATES.carrier.hours4,
    strollerBicycle: STORAGE_RATES.strollerBicycle.hours4,
  }), []);

  const parseBusinessHours = (hoursStr: string) => {
    if (!hoursStr || hoursStr === '24시간' || hoursStr === '24 Hours') return { start: 0, end: 24 };
    try {
      const parts = hoursStr.split('-').map(p => p.trim());
      if (parts.length !== 2) return { start: 9, end: 21 };
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

  const generateTimeSlots = (location: any, type: 'PICKUP' | 'DELIVERY' | 'STORAGE_START' | 'STORAGE_END') => {
    const bhStr = location?.businessHours || '09:00-21:00';
    const { start, end } = parseBusinessHours(bhStr);

    let slots: string[] = [];

    // [스봉이] 배송(DELIVERY) 픽업은 무조건 13:30 마감! 💅✨
    if (type === 'PICKUP') {
      const pickupEnd = Math.min(end, 14);
      for (let i = start; i < pickupEnd; i++) {
        slots.push(`${i.toString().padStart(2, '0')}:00`);
        if (i < 13 || i === 13) {
          slots.push(`${i.toString().padStart(2, '0')}:30`);
        }
      }
      return slots.filter(s => {
        const [h, m] = s.split(':').map(Number);
        const timeVal = h + m / 60;
        return timeVal >= start && timeVal <= 13.5;
      });
    }
    // [스봉이] 보관(STORAGE) 시작/종료는 지점 영업시간 내 마감 30분 전까지만 자유롭게! 💅✨
    else if (type === 'STORAGE_START' || type === 'STORAGE_END') {
      for (let i = start; i < end; i++) {
        slots.push(`${i.toString().padStart(2, '0')}:00`);
        if (i + 0.5 < end) {
          slots.push(`${i.toString().padStart(2, '0')}:30`);
        }
      }
      return slots;
    }
    // [스봉이] 배송(DELIVERY) 반납은 무조건 16:00 시작! 영업종료 30분 전 마감! 💅✨
    else {
      const deliveryStart = Math.max(start, 16);
      for (let i = deliveryStart; i < end; i++) {
        slots.push(`${i.toString().padStart(2, '0')}:00`);
        if (i + 0.5 < end) {
          slots.push(`${i.toString().padStart(2, '0')}:30`);
        }
      }
      return slots;
    }
  };

  useEffect(() => {
    const todayStr = formatKSTDate();
    if (booking.pickupDate === todayStr) {
      const slots = generateTimeSlots(selectedBranch, 'PICKUP');
      if (isAllSlotsPast(todayStr, slots)) {
        // 모든 슬롯이 지났거나 13:30 이후라면 다음날로 넘깁니다. 💅
        const tomorrowStr = addDaysToDateStr(todayStr, 1);
        setBooking(prev => ({
          ...prev,
          pickupDate: tomorrowStr,
          dropoffDate: (prev.dropoffDate === todayStr || (prev.dropoffDate || '') < tomorrowStr) ? tomorrowStr : prev.dropoffDate
        }));
      } else {
        const firstSlot = getFirstAvailableSlot(todayStr, slots);
        if (firstSlot && (!booking.pickupTime || !slots.includes(booking.pickupTime) || isPastKSTTime(todayStr, booking.pickupTime))) {
          setBooking(prev => ({ ...prev, pickupTime: firstSlot }));
        }
      }
    }
  }, [booking.pickupDate, selectedBranch, serviceType]);

  useEffect(() => {
    const todayStr = formatKSTDate();
    const isDelivery = serviceType === ServiceType.DELIVERY;
    const slots = generateTimeSlots(selectedBranch, isDelivery ? 'DELIVERY' : 'STORAGE_END');
    const targetRDate = booking.dropoffDate || todayStr;

    if (targetRDate === todayStr && isDelivery) {
      if (isAllSlotsPast(todayStr, slots)) {
        const tomorrowStr = addDaysToDateStr(todayStr, 1);
        setBooking(prev => ({ ...prev, dropoffDate: tomorrowStr }));
      } else {
        const firstSlot = getFirstAvailableSlot(todayStr, slots);
        if (firstSlot && (!booking.deliveryTime || !slots.includes(booking.deliveryTime) || isPastKSTTime(todayStr, booking.deliveryTime))) {
          setBooking(prev => ({ ...prev, deliveryTime: firstSlot }));
        }
      }
    } else if (serviceType === ServiceType.STORAGE) {
      const pDate = booking.pickupDate || todayStr;
      if (!booking.dropoffDate || booking.dropoffDate < pDate) {
        setBooking(prev => ({ ...prev, dropoffDate: pDate }));
      }
      if (booking.dropoffDate === pDate) {
        const rSlots = generateTimeSlots(selectedBranch, 'STORAGE_END');
        if (!booking.deliveryTime || !rSlots.includes(booking.deliveryTime) || (booking.pickupTime && booking.deliveryTime <= booking.pickupTime)) {
          const nextSlotIdx = rSlots.indexOf(booking.pickupTime || '') + 1;
          if (nextSlotIdx > 0 && nextSlotIdx < rSlots.length) {
            setBooking(prev => ({ ...prev, deliveryTime: rSlots[nextSlotIdx] }));
          } else {
            const nextDay = addDaysToDateStr(pDate, 1);
            setBooking(prev => ({ ...prev, dropoffDate: nextDay, deliveryTime: rSlots[0] || '10:00' }));
          }
        }
      }
    } else {
      if (slots.length > 0 && (!booking.deliveryTime || !slots.includes(booking.deliveryTime))) {
        setBooking(prev => ({ ...prev, deliveryTime: slots[0] }));
      }
    }
  }, [booking.dropoffDate, booking.pickupDate, serviceType, booking.pickupTime, selectedBranch]);

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
      setAppliedCoupon(coupon);
    } catch (e) {
      setCouponError(lang === 'ko' ? '오류가 발생했습니다.' : 'Error validating coupon.');
    } finally {
      setIsValidatingCoupon(false);
    }
  };

  const updateBooking = (key: keyof BookingState, value: any) => {
    setBooking(prev => ({ ...prev, [key]: value }));
  };

  const updateBagSize = (categoryId: BagCategoryId, delta: number) => {
    setBooking(prev => {
      const nextBagSizes = updateBagCategoryCount(prev.bagSizes || createEmptyBagSizes(), categoryId, delta);
      const normalizedBagSizes = serviceType === ServiceType.DELIVERY ? sanitizeDeliveryBagSizes(nextBagSizes) : nextBagSizes;
      return {
        ...prev,
        bagSizes: normalizedBagSizes,
        bags: getTotalBags(normalizedBagSizes)
      };
    });
  };

  const priceDetails = useMemo(() => {
    const isDelivery = serviceType === ServiceType.DELIVERY;

    // [스봉이] 보관(STORAGE)일 때는 배송 할증(공항 등)을 절대 더하지 않습니다! 💅
    const originSurcharge = isDelivery ? (selectedBranch?.originSurcharge || 0) : 0;
    const destLoc = isDelivery ? locations.find(l => l.id === booking.dropoffLocation) : null;
    const destSurcharge = isDelivery ? (destLoc?.destinationSurcharge || 0) : 0;

    if (isDelivery) {
      const activePrices = deliveryPrices;
      const deliveryBagSizes = sanitizeDeliveryBagSizes(booking.bagSizes);
      const deliveryBase = (deliveryBagSizes.handBag * (activePrices.handBag || 0)) +
        (deliveryBagSizes.carrier * (activePrices.carrier || 0));
      const deliveryStorage = calculateDeliveryStoragePrice(
        booking.pickupDate,
        booking.dropoffDate,
        deliveryBagSizes,
        lang
      );
      const storageFee = deliveryStorage.total;
      const deliveryBagCount = getTotalBags(deliveryBagSizes);
      const discount = appliedCoupon ? appliedCoupon.amountPerBag * deliveryBagCount : 0;
      const subtotal = Math.max(0, deliveryBase + storageFee - discount);
      return {
        total: subtotal + originSurcharge + destSurcharge,
        discount,
        durationText: deliveryStorage.durationText,
        breakdown: deliveryStorage.storageDays > 0
          ? (lang.startsWith('ko') ? `선보관 ${deliveryStorage.storageDays}일 요금 포함` : `${deliveryStorage.storageDays}d pre-delivery storage incl.`)
          : '',
        originSurcharge,
        destSurcharge
      };
    } else {
      const start = parseKstDateTime(booking.pickupDate, booking.pickupTime);
      const end = parseKstDateTime(booking.dropoffDate, booking.deliveryTime);
      if (!start || !end) return { total: 0, discount: 0, durationText: '', breakdown: '' };
      const result = calculateStoragePrice(start, end, booking.bagSizes, lang, { businessHours: selectedBranch?.businessHours });
      const discount = appliedCoupon ? appliedCoupon.amountPerBag * booking.bags : 0;
      return {
        total: Math.max(0, result.total - discount),
        discount,
        durationText: result.durationText,
        breakdown: result.breakdown,
        originSurcharge: 0,
        destSurcharge: 0
      };
    }
  }, [booking, serviceType, deliveryPrices, appliedCoupon, lang, selectedBranch, locations]);

  const handleFinalBook = async () => {
    setIsSubmitting(true);
    try {
      if (serviceType === ServiceType.DELIVERY && hasStandaloneHandBagDeliverySelection(booking.bagSizes)) {
        throw new Error('배송은 쇼핑백, 손가방만 단독으로 접수할 수 없어요. 캐리어를 1개 이상 함께 선택해 주세요.');
      }
      const recaptchaToken = (await RecaptchaService.execute('BOOKING')) || undefined;
      const sanitizedBagSizes = serviceType === ServiceType.DELIVERY ? sanitizeDeliveryBagSizes(booking.bagSizes) : sanitizeBagSizes(booking.bagSizes);
      const sanitizedBags = getTotalBags(sanitizedBagSizes);
      const finalBooking = {
        ...booking,
        pickupLoc: selectedBranch || undefined,
        returnLoc: serviceType === ServiceType.DELIVERY
          ? locations.find(l => l.id === booking.dropoffLocation) || undefined
          : undefined,
        bagSizes: sanitizedBagSizes,
        bags: sanitizedBags,
        finalPrice: priceDetails.total,
        createdAt: new Date().toISOString(),
        recaptchaToken
      };
      if (isModification && initialBooking?.id) {
        await StorageService.updateBooking(initialBooking.id, finalBooking as any);
      } else {
        await StorageService.saveBooking(finalBooking as any);
      }
      setIsSuccess(true);
      if (onSuccess) onSuccess(finalBooking);
    } catch (e) {
      alert(t.booking.error_processing);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getLocName = (l: LocationOption) => {
    return lang === 'ko' ? l.name : (l.name_en || l.name);
  };

  const originLocations = useMemo(() => locations.filter(l => l.isActive !== false && (serviceType === ServiceType.DELIVERY ? (l.supportsDelivery && l.isOrigin) : l.supportsStorage)), [locations, serviceType]);
  const destLocations = useMemo(() => locations.filter(l => l.isActive !== false && l.supportsDelivery && l.isDestination && l.id !== booking.pickupLocation), [locations, booking.pickupLocation]);

  const nextStep = () => setCurrentStep(prev => prev + 1);
  const prevStep = () => setCurrentStep(prev => prev - 1);

  return (
    <div className="max-w-4xl mx-auto px-4 md:px-0 py-10">
      <div className="bg-white rounded-[40px] shadow-2xl border border-gray-100 overflow-hidden">
        {/* Step Header */}
        <div className="flex bg-gray-50 border-b border-gray-100 items-center justify-between px-8 py-6">
          <div className="flex gap-2">
            {[1, 2, 3, 4, 5].map(s => <div key={s} className={`h-1.5 rounded-full transition-all ${currentStep >= s ? 'w-8 bg-bee-yellow' : 'w-4 bg-gray-200'}`} />)}
          </div>
          <span className="text-[10px] font-black uppercase tracking-widest">{currentStep} / 5</span>
        </div>

        <div className="p-8 md:p-12">
          {isSuccess ? (
            <div className="text-center py-10">
              <h3 className="text-3xl font-black">{t.booking.success}</h3>
              <button onClick={() => setIsSuccess(false)} className="mt-8 px-12 py-4 bg-bee-black text-bee-yellow font-black rounded-2xl">OK</button>
            </div>
          ) : (
            <div className="space-y-8">
              {currentStep === 1 && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{t.booking.from}</label>
                      <select
                        title="Pickup Branch"
                        value={booking.pickupLocation}
                        onChange={e => updateBooking('pickupLocation', e.target.value)}
                        className="w-full bg-gray-50 border-2 border-gray-100 rounded-2xl p-4 text-sm font-bold outline-none appearance-none"
                      >
                        <option value="">Select Branch</option>
                        {originLocations.map(l => <option key={l.id} value={l.id}>{getLocName(l)}</option>)}
                      </select>
                      {serviceType === ServiceType.DELIVERY && (
                        <div className="mt-2 space-y-1">
                          <p className="text-[10px] text-bee-yellow font-black uppercase tracking-wider animate-pulse">
                            * 배송은 반드시 지정된 서울 내 거점에 직접 방문하여 맡겨주셔야 합니다. 💅
                          </p>
                          <p className="text-[10px] text-red-500 font-black">
                            * 쇼핑백, 손가방 단독 배송은 불가하고 캐리어 1개 이상과 함께 예약해야 합니다.
                          </p>
                        </div>
                      )}
                    </div>
                    {serviceType === ServiceType.DELIVERY && (
                      <div>
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{t.booking.to}</label>
                        <select
                          title="Dropoff Location"
                          value={booking.dropoffLocation}
                          onChange={e => updateBooking('dropoffLocation', e.target.value)}
                          className="w-full bg-gray-50 border-2 border-gray-100 rounded-2xl p-4 text-sm font-bold outline-none appearance-none"
                        >
                          <option value="">Select Destination</option>
                          {destLocations.map(l => <option key={l.id} value={l.id}>{getLocName(l)}</option>)}
                        </select>
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{t.booking.pickup_schedule}</label>
                      <div className="flex gap-2">
                        <input
                          title="Pickup Date"
                          type="date"
                          value={booking.pickupDate}
                          min={formatKSTDate()}
                          onChange={e => updateBooking('pickupDate', e.target.value)}
                          className="flex-1 bg-white border-2 border-slate-100 rounded-2xl p-4 text-sm font-bold"
                        />
                        <div className="flex-1 relative">
                          <select
                            title="Pickup Time"
                            value={booking.pickupTime}
                            onChange={e => updateBooking('pickupTime', e.target.value)}
                            className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl py-4 pl-12 pr-6 text-sm font-bold text-slate-700 appearance-none cursor-pointer"
                          >
                            {generateTimeSlots(selectedBranch, serviceType === ServiceType.DELIVERY ? 'PICKUP' : 'STORAGE_START').map(h => (
                              <option key={h} value={h} disabled={isPastKSTTime(booking.pickupDate || '', h)}>{h}</option>
                            ))}
                          </select>
                          <Clock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                        </div>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{serviceType === ServiceType.DELIVERY ? t.booking.delivery_schedule : t.booking.return_schedule}</label>
                      <div className="flex gap-2">
                        <input
                          title="Dropoff/Return Date"
                          type="date"
                          value={booking.dropoffDate}
                          min={booking.pickupDate}
                          onChange={e => updateBooking('dropoffDate', e.target.value)}
                          className="flex-1 bg-white border-2 border-slate-100 rounded-2xl p-4 text-sm font-bold"
                        />
                        <div className="flex-1 relative">
                          <select
                            title="Dropoff/Return Time"
                            value={booking.deliveryTime}
                            onChange={e => updateBooking('deliveryTime', e.target.value)}
                            className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl py-4 pl-12 pr-6 text-sm font-bold text-slate-700 appearance-none cursor-pointer"
                          >
                            {generateTimeSlots(selectedBranch, serviceType === ServiceType.DELIVERY ? 'DELIVERY' : 'STORAGE_END').map(h => {
                              const isPast = isPastKSTTime(booking.dropoffDate || '', h);
                              const isBefore = serviceType === ServiceType.STORAGE && booking.dropoffDate === booking.pickupDate && h <= booking.pickupTime;
                              return <option key={h} value={h} disabled={isPast || isBefore}>{h}</option>;
                            })}
                          </select>
                          <Clock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {currentStep === 2 && (
                <div className={`grid gap-4 ${serviceType === ServiceType.DELIVERY ? 'grid-cols-2' : 'grid-cols-1 md:grid-cols-3'}`}>
                  {visibleBagCategories.map(category => {
                    const count = getBagCategoryCount(booking.bagSizes, category.id);
                    const unitPrice = serviceType === ServiceType.DELIVERY
                      ? getStoragePriceForCategory(deliveryPrices, category.id)
                      : getStoragePriceForCategory(baseStoragePrices, category.id);

                    return (
                    <div key={category.id} className="p-6 bg-white border-2 border-gray-50 rounded-[32px] flex flex-col gap-4">
                      <div className="flex flex-col gap-1">
                        <span className="text-[11px] font-black text-gray-500 tracking-tight">{getBagCategoryLabel(category.id, lang)}</span>
                        <div className="flex items-center justify-between gap-3">
                          <span className="text-xl font-black">{count}</span>
                          <span className="text-[11px] font-black text-bee-yellow">
                            ₩{unitPrice.toLocaleString()}{serviceType === ServiceType.STORAGE ? (lang.startsWith('ko') ? '/4시간~' : '/4h~') : ''}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <button onClick={() => updateBagSize(category.id, -1)} disabled={count === 0} className="w-10 h-10 rounded-xl bg-gray-100 font-bold disabled:opacity-50">-</button>
                        <span className="text-xl font-black">{count}</span>
                        <button onClick={() => updateBagSize(category.id, 1)} className="w-10 h-10 rounded-xl bg-bee-black text-bee-yellow font-bold disabled:bg-gray-200 disabled:text-gray-400">+</button>
                      </div>
                    </div>
                  )})}
                </div>
              )}

              {currentStep === 3 && (
                <div className="p-8 bg-gray-50 rounded-3xl space-y-4">
                  <input type="text" value={couponInput} onChange={e => setCouponInput(e.target.value.toUpperCase())} className="w-full p-4 rounded-2xl border-2 border-gray-100 font-bold" placeholder="Coupon Code" />
                  <button onClick={handleApplyCoupon} className="w-full py-4 bg-bee-black text-bee-yellow rounded-2xl font-black">Apply</button>
                </div>
              )}

              {currentStep === 4 && (
                <div className="space-y-4">
                  <input type="text" placeholder={t.booking.name || "Name"} value={booking.userName} onChange={e => updateBooking('userName', e.target.value)} className="w-full p-4 rounded-2xl border-2 border-gray-100 font-bold outline-none focus:border-bee-yellow transition-all" />
                  <input type="email" placeholder={t.booking.email || "Email"} value={booking.userEmail} onChange={e => updateBooking('userEmail', e.target.value)} className="w-full p-4 rounded-2xl border-2 border-gray-100 font-bold outline-none focus:border-bee-yellow transition-all" />
                  
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">{t.booking.country || "Country"}</label>
                    <select 
                      title={t.booking.country || "Country"}
                      value={booking.country || ''} 
                      onChange={e => {
                        updateBooking('country', e.target.value);
                        setIsCountryManuallySet(true); // 💅 수동 선택 완료! 이제 실장은 가만히 있을게요.
                      }}
                      className="w-full p-4 rounded-2xl border-2 border-gray-100 font-bold bg-white outline-none focus:border-bee-yellow transition-all"
                    >
                      <option value="">{t.booking.country_placeholder || "Select Country"}</option>
                      <option value="KR">Korea (대한민국)</option>
                      <option value="US">USA (미국)</option>
                      <option value="JP">Japan (일본)</option>
                      <option value="CN">China (중국)</option>
                      <option value="TW">Taiwan (대만)</option>
                      <option value="HK">Hong Kong (홍콩)</option>
                      <option value="SG">Singapore (싱가포르)</option>
                      <option value="TH">Thailand (태국)</option>
                      <option value="VN">Vietnam (베트남)</option>
                      <option value="MY">Malaysia (말레이시아)</option>
                      <option value="PH">Philippines (필리핀)</option>
                      <option value="ID">Indonesia (인도네시아)</option>
                      <option value="FR">France (프랑스)</option>
                      <option value="DE">Germany (독일)</option>
                      <option value="GB">UK (영국)</option>
                      <option value="OTHER">Other (기타)</option>
                    </select>
                  </div>

                  <div className="p-4 bg-gray-50 rounded-2xl flex flex-col gap-2">
                    <label className="flex gap-2 text-xs font-bold items-center"><input type="checkbox" checked={booking.agreedToTerms} onChange={e => updateBooking('agreedToTerms', e.target.checked)} /> {t.booking.agree_terms_simple || "Agree to Terms"}</label>
                    <label className="flex gap-2 text-xs font-bold items-center"><input type="checkbox" checked={booking.agreedToPrivacy} onChange={e => updateBooking('agreedToPrivacy', e.target.checked)} /> {t.booking.agree_privacy_simple || "Agree to Privacy"}</label>
                    <label className="flex gap-2 text-xs font-bold items-center"><input type="checkbox" checked={booking.agreedToHighValue} onChange={e => updateBooking('agreedToHighValue', e.target.checked)} /> {t.booking.agree_high_value_simple || "Agree to Policy"}</label>
                  </div>
                </div>
              )}

              {currentStep === 5 && (
                <div className="space-y-6">
                  <div className="bg-gray-50 p-8 rounded-[40px] space-y-4">
                    <div className="flex justify-between font-black"><span>Total</span><span className="text-2xl">₩{priceDetails.total.toLocaleString()}</span></div>
                    {priceDetails.durationText && <p className="text-xs font-bold text-gray-400">{priceDetails.durationText}</p>}
                  </div>
                </div>
              )}

              <div className="flex gap-4 pt-4">
                {currentStep > 1 && <button onClick={prevStep} className="px-8 py-4 bg-gray-100 rounded-2xl font-black">Back</button>}
                {currentStep < 5 ? (
                  <button onClick={nextStep} className="flex-1 py-4 bg-bee-black text-bee-yellow rounded-2xl font-black">Next</button>
                ) : (
                  <button onClick={handleFinalBook} disabled={isSubmitting} className="flex-1 py-4 bg-bee-black text-bee-yellow rounded-2xl font-black">
                    {isSubmitting ? 'Processing...' : t.booking.book_now}
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BookingWidget;
