
import React, { useState, useMemo, useEffect } from 'react';
import { BookingState, ServiceType, BookingStatus, SnsType, BagSizes, LocationOption, PriceSettings, StorageTier, LocationType, DiscountCode } from '../types';
import { LOCATIONS as INITIAL_LOCATIONS } from '../constants';
import { StorageService } from '../services/storageService';
import { RecaptchaService } from '../services/recaptchaService';
import { calculateStoragePrice, STORAGE_RATES } from '../utils/pricing';
import { formatKSTDate, isPastKSTTime, getLocalizedDate, getFirstAvailableSlot, isAllSlotsPast, addDaysToDateStr } from '../utils/dateUtils';
import { Clock } from 'lucide-react';

interface BookingWidgetProps {
  lang: string;
  t: any;
  preSelectedBooking?: { id: string; type: 'STORAGE' | 'DELIVERY'; bagCounts?: { S: number; M: number; L: number; XL: number } } | null;
  onLocationsClick?: () => void;
  onTermsClick?: () => void;
  onPrivacyClick?: () => void;
  onFinalBookClick?: (action: () => void) => void;
  onSuccess?: (booking: any) => void;
  /** @deprecated use preSelectedBooking instead */
  initialBooking?: BookingState | null;
}

const DEFAULT_DELIVERY_PRICES: PriceSettings = { S: 20000, M: 20000, L: 25000, XL: 29000 };
const INITIAL_STORAGE_TIERS: StorageTier[] = [
  { id: 'st-4h', label: '4h', prices: { S: 2000, M: 3000, L: 5000, XL: 7000 } },
  { id: 'st-1d', label: '1d', prices: { S: 8000, M: 10000, L: 15000, XL: 20000 } },
  { id: 'st-week', label: '1w', prices: { S: 40000, M: 55000, L: 80000, XL: 110000 } }
];

const BookingWidget: React.FC<BookingWidgetProps> = ({ lang, t, preSelectedBooking, initialBooking, onTermsClick, onPrivacyClick, onFinalBookClick, onSuccess }) => {
  const [locations, setLocations] = useState<LocationOption[]>(INITIAL_LOCATIONS);
  const [deliveryPrices, setDeliveryPrices] = useState<PriceSettings>(DEFAULT_DELIVERY_PRICES);
  const [storageTiers, setStorageTiers] = useState<StorageTier[]>(INITIAL_STORAGE_TIERS);
  const [serviceType, setServiceType] = useState<ServiceType>(ServiceType.DELIVERY);
  const [currentStep, setCurrentStep] = useState(1);

  const [booking, setBooking] = useState<BookingState>({
    serviceType: ServiceType.DELIVERY, pickupLocation: '', pickupAddress: '', pickupAddressDetail: '',
    dropoffLocation: '', dropoffAddress: '', dropoffAddressDetail: '',
    pickupDate: formatKSTDate(), pickupTime: '09:00', deliveryTime: '16:00', dropoffDate: formatKSTDate(),
    bags: 0, bagSizes: { S: 0, M: 0, L: 0, XL: 0 }, selectedStorageTierId: INITIAL_STORAGE_TIERS[0].id,
    userName: '', userEmail: '', snsChannel: 'kakao', snsId: '',
    status: BookingStatus.PENDING, price: 0, createdAt: new Date().toISOString(),
    agreedToTerms: false, agreedToPrivacy: false, agreedToHighValue: false, agreedToPremium: false,
    insuranceLevel: 1, insuranceBagCount: 1,
    weightSurcharge5kg: 0, weightSurcharge10kg: 0
  });

  const [couponInput, setCouponInput] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<DiscountCode | null>(null);
  const [couponError, setCouponError] = useState('');
  const [isValidatingCoupon, setIsValidatingCoupon] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

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
      const bagCounts = preSelectedBooking.bagCounts || { S: 0, M: 0, L: 0, XL: 0 };
      setBooking(prev => ({
        ...prev,
        serviceType: bType,
        pickupLocation: preSelectedBooking.id,
        bagSizes: bagCounts,
        bags: Object.values(bagCounts).reduce((a, b) => a + b, 0)
      }));
    }
  }, [preSelectedBooking, initialBooking]);

  const selectedBranch = useMemo(() => {
    return locations.find(l => l.id === booking.pickupLocation);
  }, [booking.pickupLocation, locations]);

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

  const updateBagSize = (size: 'S' | 'M' | 'L' | 'XL', delta: number) => {
    const newCount = Math.max(0, booking.bagSizes[size] + delta);
    setBooking(prev => {
      const newSizes = { ...prev.bagSizes, [size]: newCount };
      return {
        ...prev,
        bagSizes: newSizes,
        bags: Object.values(newSizes).reduce((a, b) => a + b, 0)
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
      const base = (booking.bagSizes.S * (activePrices.S || 0)) +
        (booking.bagSizes.M * (activePrices.M || 0)) +
        (booking.bagSizes.L * (activePrices.L || 0)) +
        (booking.bagSizes.XL * (activePrices.XL || 0));
      const discount = appliedCoupon ? appliedCoupon.amountPerBag * booking.bags : 0;

      const subtotal = Math.max(0, base - discount);
      return {
        total: subtotal + originSurcharge + destSurcharge,
        discount,
        durationText: '',
        breakdown: '',
        originSurcharge,
        destSurcharge
      };
    } else {
      const start = new Date(`${booking.pickupDate}T${booking.pickupTime}`);
      const end = new Date(`${booking.dropoffDate}T${booking.deliveryTime}`);
      if (isNaN(start.getTime()) || isNaN(end.getTime())) return { total: 0, discount: 0, durationText: '', breakdown: '' };
      const result = calculateStoragePrice(start, end, booking.bagSizes, lang);
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
      const recaptchaToken = (await RecaptchaService.execute('BOOKING')) || undefined;
      const finalBooking = { ...booking, finalPrice: priceDetails.total, createdAt: new Date().toISOString(), recaptchaToken };
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
                <div className="grid grid-cols-2 gap-4">
                  {(['S', 'M', 'L', 'XL'] as const).map(size => (
                    <div key={size} className="p-6 bg-white border-2 border-gray-50 rounded-[32px] flex flex-col gap-4">
                      <span className="text-xl font-black">{size}</span>
                      <div className="flex items-center justify-between">
                        <button onClick={() => updateBagSize(size, -1)} className="w-10 h-10 rounded-xl bg-gray-100 font-bold">-</button>
                        <span className="text-xl font-black">{booking.bagSizes[size]}</span>
                        <button onClick={() => updateBagSize(size, 1)} className="w-10 h-10 rounded-xl bg-bee-black text-bee-yellow font-bold">+</button>
                      </div>
                    </div>
                  ))}
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
                  <input type="text" placeholder="Name" value={booking.userName} onChange={e => updateBooking('userName', e.target.value)} className="w-full p-4 rounded-2xl border-2 border-gray-100 font-bold" />
                  <input type="email" placeholder="Email" value={booking.userEmail} onChange={e => updateBooking('userEmail', e.target.value)} className="w-full p-4 rounded-2xl border-2 border-gray-100 font-bold" />
                  <div className="p-4 bg-gray-50 rounded-2xl flex flex-col gap-2">
                    <label className="flex gap-2 text-xs font-bold items-center"><input type="checkbox" checked={booking.agreedToTerms} onChange={e => updateBooking('agreedToTerms', e.target.checked)} /> Agree to Terms</label>
                    <label className="flex gap-2 text-xs font-bold items-center"><input type="checkbox" checked={booking.agreedToPrivacy} onChange={e => updateBooking('agreedToPrivacy', e.target.checked)} /> Agree to Privacy</label>
                    <label className="flex gap-2 text-xs font-bold items-center"><input type="checkbox" checked={booking.agreedToHighValue} onChange={e => updateBooking('agreedToHighValue', e.target.checked)} /> Agree to Policy</label>
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
