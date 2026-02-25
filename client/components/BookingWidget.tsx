
import React, { useState, useMemo, useEffect } from 'react';
import { BookingState, ServiceType, BookingStatus, SnsType, BagSizes, LocationOption, PriceSettings, StorageTier, LocationType, DiscountCode } from '../types';
import { LOCATIONS as INITIAL_LOCATIONS } from '../constants';
import { StorageService } from '../services/storageService';
import { RecaptchaService } from '../services/recaptchaService';
import { calculateStoragePrice, STORAGE_RATES } from '../utils/pricing';
import { formatKSTDate, isPastKSTTime, getLocalizedDate, getFirstAvailableSlot } from '../utils/dateUtils';

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

const DELIVERY_PICKUP_HOURS = ['09:00', '09:30', '10:00', '10:30', '11:00', '11:30', '12:00', '12:30', '13:00', '13:30'];
const DELIVERY_DROPOFF_HOURS = ['16:00', '16:30', '17:00', '17:30', '18:00', '18:30', '19:00', '19:30', '20:00', '20:30', '21:00'];
const STORAGE_START_HOURS = ['09:00', '09:30', '10:00', '10:30', '11:00', '11:30', '12:00', '12:30', '13:00', '13:30', '14:00', '14:30', '15:00', '15:30', '16:00', '16:30', '17:00', '17:30', '18:00'];
const STORAGE_END_HOURS = ['10:00', '10:30', '11:00', '11:30', '12:00', '12:30', '13:00', '13:30', '14:00', '14:30', '15:00', '15:30', '16:00', '16:30', '17:00', '17:30', '18:00', '18:30', '19:00', '19:30', '20:00', '20:30', '21:00'];

const getLocalISODate = (d: Date) => {
  const offset = d.getTimezoneOffset() * 60000;
  return new Date(d.getTime() - offset).toISOString().split('T')[0];
};

const getValidStartDate = () => {
  return formatKSTDate(); // formatKSTDate already handles 21:00 rollover logic if needed, or we just use current KST date.
};

const BookingWidget: React.FC<BookingWidgetProps> = ({ lang, t, preSelectedBooking, initialBooking, onTermsClick, onPrivacyClick, onFinalBookClick, onSuccess }) => {
  const [locations, setLocations] = useState<LocationOption[]>(INITIAL_LOCATIONS);
  const [deliveryPrices, setDeliveryPrices] = useState<PriceSettings>(DEFAULT_DELIVERY_PRICES);
  const [storageTiers, setStorageTiers] = useState<StorageTier[]>(INITIAL_STORAGE_TIERS);
  const [serviceType, setServiceType] = useState<ServiceType>(ServiceType.DELIVERY);
  const [currentStep, setCurrentStep] = useState(1);

  const [booking, setBooking] = useState<BookingState>({
    serviceType: ServiceType.DELIVERY, pickupLocation: '', pickupAddress: '', pickupAddressDetail: '',
    dropoffLocation: '', dropoffAddress: '', dropoffAddressDetail: '',
    pickupDate: getValidStartDate(), pickupTime: '09:00', deliveryTime: '16:00', dropoffDate: getValidStartDate(),
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

  const theme = useMemo(() => {
    return serviceType === ServiceType.DELIVERY
      ? { primary: 'bg-bee-yellow', text: 'text-bee-black', darkBg: 'bg-bee-black', darkText: 'text-bee-yellow', button: 'bg-bee-black text-bee-yellow', border: 'border-bee-yellow' }
      : { primary: 'bg-bee-black', text: 'text-white', darkBg: 'bg-bee-yellow', darkText: 'text-bee-black', button: 'bg-bee-yellow text-bee-black', border: 'border-bee-black' };
  }, [serviceType]);

  useEffect(() => {
    let isMounted = true;
    const loadData = async () => {
      try {
        const freshLocations = await StorageService.getLocations();
        if (isMounted) setLocations(freshLocations);
        const savedPrices = localStorage.getItem('beeliber_delivery_prices');
        if (savedPrices && isMounted) setDeliveryPrices(JSON.parse(savedPrices));
        const cloudTiers = await StorageService.getStorageTiers();
        if (cloudTiers && isMounted) setStorageTiers(cloudTiers);
      } catch (e) { console.error(e); }
    };
    loadData();
    return () => { isMounted = false; };
  }, []);

  // Sync with localStorage (only if not modification)
  useEffect(() => {
    if (isModification) return;
    const savedBooking = localStorage.getItem('beeliber_current_booking');
    if (savedBooking) {
      try {
        const parsed = JSON.parse(savedBooking);
        setBooking(prev => ({ ...prev, ...parsed }));
        if (parsed.serviceType) setServiceType(parsed.serviceType);
      } catch (e) { console.error(e); }
    }
  }, [isModification]);

  useEffect(() => {
    if (isModification) return;
    const toSave = {
      pickupLocation: booking.pickupLocation,
      dropoffLocation: booking.dropoffLocation,
      pickupDate: booking.pickupDate,
      pickupTime: booking.pickupTime,
      dropoffDate: booking.dropoffDate,
      deliveryTime: booking.deliveryTime,
      bagSizes: booking.bagSizes,
      bags: booking.bags,
      serviceType: serviceType
    };
    localStorage.setItem('beeliber_current_booking', JSON.stringify(toSave));
  }, [booking, serviceType, isModification]);

  useEffect(() => {
    if (initialBooking) {
      setBooking(initialBooking);
      setServiceType(initialBooking.serviceType);
    } else if (preSelectedBooking) {
      setServiceType(preSelectedBooking.type === 'STORAGE' ? ServiceType.STORAGE : ServiceType.DELIVERY);
      setBooking(prev => {
        const bagCounts = preSelectedBooking.bagCounts || { S: 0, M: 0, L: 0, XL: 0 };
        return {
          ...prev,
          serviceType: preSelectedBooking.type === 'STORAGE' ? ServiceType.STORAGE : ServiceType.DELIVERY,
          pickupLocation: preSelectedBooking.id,
          pickupTime: '09:00',
          deliveryTime: preSelectedBooking.type === 'STORAGE' ? '10:00' : '16:00',
          bagSizes: bagCounts,
          bags: Object.values(bagCounts).reduce((a, b) => a + b, 0)
        };
      });
    }
  }, [preSelectedBooking, initialBooking]);

  // Handle Smart Time Selection 💅✨
  useEffect(() => {
    // If it's today, find the first available slot
    const todayStr = formatKSTDate();
    if (booking.pickupDate === todayStr) {
      const slots = serviceType === ServiceType.DELIVERY ? DELIVERY_PICKUP_HOURS : STORAGE_START_HOURS;
      const firstSlot = getFirstAvailableSlot(todayStr, slots);
      if (firstSlot && firstSlot !== booking.pickupTime) {
        setBooking(prev => ({ ...prev, pickupTime: firstSlot }));
      }
    }
  }, [booking.pickupDate, serviceType]);

  useEffect(() => {
    const todayStr = formatKSTDate();
    if ((booking.dropoffDate === todayStr || (!booking.dropoffDate && booking.pickupDate === todayStr)) && serviceType === ServiceType.DELIVERY) {
      const firstSlot = getFirstAvailableSlot(booking.dropoffDate || todayStr, DELIVERY_DROPOFF_HOURS);
      if (firstSlot && firstSlot !== booking.deliveryTime) {
        setBooking(prev => ({ ...prev, deliveryTime: firstSlot }));
      }
    }
  }, [booking.dropoffDate, booking.pickupDate, serviceType]);

  const handleServiceTypeChange = (type: ServiceType) => {
    if (isModification) return; // Disable changing service type in modification mode
    setServiceType(type);
    setBooking(prev => ({ ...prev, serviceType: type, pickupTime: '09:00', deliveryTime: type === ServiceType.DELIVERY ? '16:00' : '10:00' }));
  };

  const updateBooking = (key: keyof BookingState, value: any) => {
    setBooking(prev => {
      const newState = { ...prev, [key]: value };
      if (key === 'pickupLocation') {
        const loc = locations.find(l => l.id === value);
        newState.pickupAddress = loc?.address || '';
      }
      if (key === 'dropoffLocation') {
        const loc = locations.find(l => l.id === value);
        newState.dropoffAddress = loc?.address || '';
      }
      if (key === 'pickupDate' && new Date(value) > new Date(newState.dropoffDate)) {
        newState.dropoffDate = value;
      }
      return newState;
    });
  };

  // Notify LocationsPage when pickup location changes
  useEffect(() => {
    if (booking.pickupLocation) {
      const event = new CustomEvent('beeliber:location_focus', {
        detail: { locationId: booking.pickupLocation }
      });
      window.dispatchEvent(event);
    }
  }, [booking.pickupLocation]);

  const updateBagSize = (size: 'S' | 'M' | 'L' | 'XL', delta: number) => {
    const currentCount = booking.bagSizes[size];
    const newCount = Math.max(0, currentCount + delta);
    setBooking(prev => {
      const newSizes = { ...prev.bagSizes, [size]: newCount };
      return {
        ...prev,
        bagSizes: newSizes,
        bags: (newSizes.S || 0) + (newSizes.M || 0) + (newSizes.L || 0) + (newSizes.XL || 0)
      };
    });
  };

  const originLocations = useMemo(() => locations.filter(l => (l.isActive !== false) && (serviceType === ServiceType.DELIVERY ? (l.supportsDelivery && l.isOrigin === true) : l.supportsStorage)), [locations, serviceType]);
  const destinationLocations = useMemo(() => locations.filter(l => (l.isActive !== false) && (serviceType === ServiceType.DELIVERY ? (l.supportsDelivery && l.id !== booking.pickupLocation && l.supportsDelivery && l.isDestination === true) : l.supportsStorage)), [locations, serviceType, booking.pickupLocation]);

  const priceDetails = useMemo(() => {
    const activePrices = serviceType === ServiceType.STORAGE ? (storageTiers.find(t => t.id === 'st-4h')?.prices || INITIAL_STORAGE_TIERS[0].prices) : deliveryPrices;
    if (serviceType === ServiceType.DELIVERY) {
      const deliveryBase = (booking.bagSizes.S * (activePrices.S || 0)) +
        (booking.bagSizes.M * (activePrices.M || 0)) +
        (booking.bagSizes.L * (activePrices.L || 0)) +
        (booking.bagSizes.XL * (activePrices.XL || 0));

      // Overnight Storage Fee calculation
      const pickupD = new Date(booking.pickupDate);
      const deliveryD = new Date(booking.dropoffDate);
      const diffDays = Math.max(0, Math.floor((deliveryD.getTime() - pickupD.getTime()) / (1000 * 60 * 60 * 24)));

      let storageFee = 0;
      if (diffDays > 0) {
        const dRate = storageTiers.find(t => t.id === 'st-1d')?.prices || INITIAL_STORAGE_TIERS[1].prices;
        storageFee = (booking.bagSizes.S * (dRate.S || 0)) +
          (booking.bagSizes.M * (dRate.M || 0)) +
          (booking.bagSizes.L * (dRate.L || 0)) +
          (booking.bagSizes.XL * (dRate.XL || 0));
        storageFee *= diffDays;
      }

      const base = deliveryBase + storageFee;

      const o = locations.find(l => l.id === booking.pickupLocation);
      const d = locations.find(l => l.id === booking.dropoffLocation);
      const originSurcharge = o?.originSurcharge || 0;
      const destSurcharge = d?.destinationSurcharge || 0;
      let premiumSurcharge = 0;
      if (booking.agreedToPremium && booking.bags > 0) {
        const avg = base / booking.bags;
        premiumSurcharge = Math.round(avg * (booking.insuranceLevel || 1) * (booking.insuranceBagCount || 1));
      }
      const weightSurcharge = ((booking.weightSurcharge5kg || 0) * 5000) + ((booking.weightSurcharge10kg || 0) * 10000);
      const discount = appliedCoupon ? appliedCoupon.amountPerBag * booking.bags : 0;

      const breakdown = diffDays > 0
        ? (lang === 'ko' ? `기본배송 + ${diffDays}일 보관료` : `Base delivery + ${diffDays}d storage`)
        : '';

      const durationText = diffDays > 0
        ? (lang === 'ko' ? `${diffDays}일 보관 포함` : `${diffDays}d storage incl.`)
        : '';

      return {
        base,
        originSurcharge,
        destSurcharge,
        premiumSurcharge,
        weightSurcharge,
        discount,
        breakdown,
        durationText,
        total: Math.max(0, base + originSurcharge + destSurcharge + premiumSurcharge + weightSurcharge - discount)
      };
    } else {
      const start = new Date(`${booking.pickupDate}T${booking.pickupTime}`);
      const end = new Date(`${booking.dropoffDate}T${booking.deliveryTime}`);

      if (isNaN(start.getTime()) || isNaN(end.getTime())) {
        return { base: 0, originSurcharge: 0, destSurcharge: 0, premiumSurcharge: 0, weightSurcharge: 0, discount: 0, total: 0, breakdown: '', durationText: '' };
      }

      const result = calculateStoragePrice(start, end, booking.bagSizes, lang);
      const base = result.total;
      const discount = appliedCoupon ? appliedCoupon.amountPerBag * booking.bags : 0;

      return {
        base,
        originSurcharge: 0,
        destSurcharge: 0,
        premiumSurcharge: 0,
        weightSurcharge: 0,
        discount,
        total: Math.max(0, base - discount),
        breakdown: result.breakdown,
        durationText: result.durationText
      };
    }
  }, [booking, serviceType, locations, storageTiers, deliveryPrices, appliedCoupon]);

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

  const handleFinalBook = async () => {
    if (!booking.userName || !booking.userEmail || !booking.snsId) { alert(t.booking.alert_fill_info); return; }
    if (!booking.agreedToTerms || !booking.agreedToPrivacy || !booking.agreedToHighValue) { alert(t.booking.alert_agree_terms); return; }
    setIsSubmitting(true);
    try {
      // Recaptcha check (skip for modification if trusted, but let's keep it safe)
      const recaptchaToken = await RecaptchaService.execute('BOOKING');

      if (isModification && initialBooking?.id) {
        // Update existing booking
        const updates = {
          ...booking,
          finalPrice: priceDetails.total,
          updatedAt: new Date().toISOString() // Assuming you might want to track updates
        };
        // We reuse saveBooking but really we should use updateBooking or check if saveBooking handles updates (it does merge)
        // But for clarity let's use check existing logic or update strictly.
        // StorageService.saveBooking usually uses setDoc with merge, so it's fine.
        // Let's verify StorageService.saveBooking implementation first or use updateBooking.
        // The user mentioned checking `StorageService.updateBooking`.
        await StorageService.updateBooking(initialBooking.id, updates);
      } else {
        // New Booking
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

        const newBooking = {
          ...booking,
          id: generatedCode,
          reservationCode: generatedCode,
          status: BookingStatus.CONFIRMED,
          createdAt: new Date().toISOString(),
          finalPrice: priceDetails.total,
          language: lang,
          recaptchaToken: recaptchaToken || undefined
        };
        await StorageService.saveBooking(newBooking);
      }

      localStorage.removeItem('beeliber_current_booking');
      if (onSuccess) {
        // Return updated booking
        onSuccess({ ...booking, finalPrice: priceDetails.total });
      } else {
        setIsSuccess(true);
      }
    } catch (e) { alert(t.booking.error_processing); console.error(e); } finally { setIsSubmitting(false); }
  };

  const getLocName = (l: LocationOption) => {
    if (t.location_names && t.location_names[l.id]) return t.location_names[l.id];
    return lang === 'ko' ? l.name : (l.name_en || l.name);
  };

  const steps = [
    { id: 1, label: t.booking?.pickup_schedule_label || t.booking?.delivery_schedule_label || 'Schedule' },
    { id: 2, label: t.booking?.bags_label || 'Bags' },
    { id: 3, label: t.booking?.coupon_title || 'Coupon' },
    { id: 4, label: t.booking?.contact_info_title || 'Info' },
    { id: 5, label: t.booking?.confirm || 'Confirm' }
  ];

  const nextStep = () => {
    if (currentStep === 1) {
      if (!booking.pickupLocation) { alert(serviceType === ServiceType.DELIVERY ? t.booking.select_origin : t.booking.select_storage); return; }
      if (serviceType === ServiceType.DELIVERY && !booking.dropoffLocation) { alert(t.booking.select_dest); return; }
    }
    if (currentStep === 2 && booking.bags === 0) { alert(t.booking.alert_no_bags || "Select bags"); return; }
    setCurrentStep(prev => prev + 1);
  };

  const prevStep = () => setCurrentStep(prev => prev - 1);

  return (
    <div id="booking" className="max-w-4xl mx-auto px-4 md:px-0 py-10">
      <div className="bg-white rounded-[40px] shadow-2xl border border-gray-100 overflow-hidden">
        {/* Step Progress */}
        <div className="flex bg-gray-50 border-b border-gray-100 items-center justify-between px-8 py-6">
          <div className="flex gap-2">
            {steps.map(s => (
              <div key={s.id} className={`h-1.5 rounded-full transition-all duration-500 ${currentStep >= s.id ? 'w-8 bg-bee-yellow' : 'w-4 bg-gray-200'}`} />
            ))}
          </div>
          <span className="text-[10px] font-black text-bee-black uppercase tracking-widest">{currentStep} / {steps.length} {steps[currentStep - 1].label}</span>
        </div>

        {/* Service Type Switcher (Only on Step 1) */}
        {currentStep === 1 && (
          <div className="flex p-2 bg-white">
            <button onClick={() => handleServiceTypeChange(ServiceType.DELIVERY)} className={`flex-1 py-4 rounded-2xl font-black text-xs md:text-sm uppercase tracking-widest transition-all gap-2 flex items-center justify-center ${serviceType === ServiceType.DELIVERY ? 'bg-bee-yellow text-bee-black shadow-md' : 'text-gray-400'}`}>
              <i className="fa-solid fa-truck-fast"></i> {t.booking.delivery}
            </button>
            <button onClick={() => handleServiceTypeChange(ServiceType.STORAGE)} className={`flex-1 py-4 rounded-2xl font-black text-xs md:text-sm uppercase tracking-widest transition-all gap-2 flex items-center justify-center ${serviceType === ServiceType.STORAGE ? 'bg-bee-black text-bee-yellow shadow-md' : 'text-gray-400'}`}>
              <i className="fa-solid fa-box-archive"></i> {t.booking.storage}
            </button>
          </div>
        )}

        <div className="p-8 md:p-12 min-h-[400px]">
          {isSuccess ? (
            <div className="text-center py-10 animate-fade-in">
              <div className="w-20 h-20 bg-green-500 text-white rounded-full flex items-center justify-center mx-auto mb-6 text-3xl shadow-xl animate-bounce"><i className="fa-solid fa-check"></i></div>
              <h3 className="text-3xl font-black text-bee-black">{t.booking.success}</h3>
              <p className="text-gray-500 mt-4">{t.booking.successSub}</p>
              <button onClick={() => { setIsSuccess(false); setCurrentStep(1); }} className="mt-8 px-12 py-4 bg-bee-black text-bee-yellow font-black rounded-2xl">OK</button>
            </div>
          ) : (
            <div className="space-y-8 animate-fade-in-right">
              {currentStep === 1 && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{serviceType === ServiceType.DELIVERY ? t.booking.from : t.booking.select_storage}</label>
                      <select title="Pickup Location" value={booking.pickupLocation} onChange={e => updateBooking('pickupLocation', e.target.value)} className="w-full bg-gray-50 border-2 border-gray-100 rounded-2xl p-4 text-sm font-bold outline-none focus:border-bee-yellow appearance-none">
                        <option value="" disabled>{t.booking.select_origin}</option>
                        {originLocations.map(l => <option key={l.id} value={l.id}>{getLocName(l)}</option>)}
                      </select>
                    </div>
                    {serviceType === ServiceType.DELIVERY && (
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{t.booking.to}</label>
                        <select title="Drop-off Location" value={booking.dropoffLocation} onChange={e => updateBooking('dropoffLocation', e.target.value)} className="w-full bg-gray-50 border-2 border-gray-100 rounded-2xl p-4 text-sm font-bold outline-none focus:border-bee-yellow appearance-none">
                          <option value="" disabled>{t.booking.select_dest}</option>
                          {destinationLocations.map(l => <option key={l.id} value={l.id}>{getLocName(l)}</option>)}
                        </select>
                      </div>
                    )}
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{t.booking.pickup_schedule}</label>
                      <div className="flex flex-col gap-2">
                        <div className="flex gap-2">
                          <div className="flex-1 relative">
                            <input
                              type="date"
                              title="Pickup Date"
                              value={booking.pickupDate}
                              min={getValidStartDate()}
                              onChange={e => updateBooking('pickupDate', e.target.value)}
                              className="w-full bg-gray-50 border-2 border-gray-100 rounded-2xl p-4 text-sm font-bold outline-none text-transparent"
                            />
                            <div className="absolute inset-0 flex items-center px-4 pointer-events-none font-bold text-sm text-gray-900">
                              {getLocalizedDate(booking.pickupDate || '', lang)}
                            </div>
                          </div>
                          <div className="grid grid-cols-4 gap-2">
                            {(serviceType === ServiceType.DELIVERY ? DELIVERY_PICKUP_HOURS : STORAGE_START_HOURS).map(h => {
                              const isPast = isPastKSTTime(booking.pickupDate || '', h);
                              const isSelected = booking.pickupTime === h;
                              return (
                                <button
                                  key={h}
                                  type="button"
                                  disabled={isPast}
                                  onClick={() => updateBooking('pickupTime', h)}
                                  className={`py-2 px-1 rounded-xl text-[11px] font-black transition-all border ${isSelected
                                      ? 'bg-bee-black text-bee-yellow border-bee-black shadow-md'
                                      : isPast
                                        ? 'bg-gray-50 text-gray-200 border-gray-100 cursor-not-allowed'
                                        : 'bg-white text-gray-600 border-gray-200 hover:border-bee-yellow hover:text-bee-black'
                                    }`}
                                >
                                  {h}
                                  {isPast && <span className="block text-[8px] opacity-60">{t.booking?.slot_past || '마감'}</span>}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                        {new Date().getHours() >= 14 && (
                          <p className="text-[10px] text-red-500 font-bold ml-1">
                            <i className="fa-solid fa-clock mr-1"></i>
                            {t.booking.msg_same_day_limit}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{serviceType === ServiceType.DELIVERY ? t.booking.delivery_schedule : (t.booking.return_schedule || 'Retrieval')}</label>
                      <div className="flex gap-2">
                        <div className="flex-1 relative">
                          <input
                            type="date"
                            title="Drop-off Date"
                            value={booking.dropoffDate}
                            min={booking.pickupDate}
                            onChange={e => updateBooking('dropoffDate', e.target.value)}
                            className="w-full bg-gray-50 border-2 border-gray-100 rounded-2xl p-4 text-sm font-bold outline-none text-transparent"
                          />
                          <div className="absolute inset-0 flex items-center px-4 pointer-events-none font-bold text-sm text-gray-900">
                            {getLocalizedDate(booking.dropoffDate || '', lang)}
                          </div>
                        </div>
                        <div className="grid grid-cols-4 gap-2">
                          {(serviceType === ServiceType.DELIVERY ? DELIVERY_DROPOFF_HOURS : STORAGE_END_HOURS).map(h => {
                            const isPast = isPastKSTTime(booking.dropoffDate || booking.pickupDate || '', h);
                            const isSelected = booking.deliveryTime === h;
                            return (
                              <button
                                key={h}
                                type="button"
                                disabled={isPast}
                                onClick={() => updateBooking('deliveryTime', h)}
                                className={`py-2 px-1 rounded-xl text-[11px] font-black transition-all border ${isSelected
                                  ? 'bg-bee-black text-bee-yellow border-bee-black shadow-md'
                                  : isPast
                                    ? 'bg-gray-50 text-gray-200 border-gray-100 cursor-not-allowed'
                                    : 'bg-white text-gray-600 border-gray-200 hover:border-bee-yellow hover:text-bee-black'
                                  }`}
                              >
                                {h}
                                {isPast && <span className="block text-[8px] opacity-60">{t.booking?.slot_past || '마감'}</span>}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {currentStep === 2 && (
                <div className="space-y-6">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{t.booking?.bags_selection_title || "Select Bags"}</label>
                  <div className="grid grid-cols-2 gap-4">
                    {(['S', 'M', 'L', 'XL'] as const).map(size => {
                      const priceKey = size.toLowerCase() as keyof PriceSettings;
                      const price = serviceType === ServiceType.STORAGE
                        ? (storageTiers.find(t => t.id === 'st-4h')?.prices[priceKey] || 0)
                        : deliveryPrices[priceKey];

                      return (
                        <div key={size} className={`p-4 rounded-3xl border-2 transition-all flex flex-col gap-3 shadow-sm ${booking.bagSizes[size] > 0 ? 'border-bee-yellow bg-yellow-50/30' : 'border-gray-50 bg-white'}`}>
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-gray-50 rounded-lg flex items-center justify-center shrink-0">
                              <i className="fa-solid fa-box text-gray-400 text-xs"></i>
                            </div>
                            <div className="min-w-0">
                              <div className="text-[8px] font-black text-gray-400 uppercase truncate leading-none mb-1 opacity-80">
                                {size === 'S' && (lang.startsWith('ko') ? '기내용/소형백' : 'Cabin/Small')}
                                {size === 'M' && (lang.startsWith('ko') ? '작은 캐리어' : 'Carry-on Bag')}
                                {size === 'L' && (lang.startsWith('ko') ? '위탁 수하물' : 'Checked Bag')}
                                {size === 'XL' && (lang.startsWith('ko') ? '대형/특입' : 'Extra Large')}
                              </div>
                              <div className="flex flex-col gap-0.5">
                                <span className="text-lg font-black leading-none">{size}</span>
                                <span className="text-[10px] font-bold text-bee-yellow leading-tight">₩{(price || 0).toLocaleString()}</span>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center justify-between pt-2 border-t border-gray-100/50">
                            <button title="Decrease Bag Count" aria-label="Decrease Bag Count" onClick={() => updateBagSize(size, -1)} className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors"><i className="fa-solid fa-minus text-[10px]"></i></button>
                            <span className="font-black text-base">{booking.bagSizes[size]}</span>
                            <button title="Increase Bag Count" aria-label="Increase Bag Count" onClick={() => updateBagSize(size, 1)} className="w-8 h-8 rounded-lg bg-bee-black text-bee-yellow flex items-center justify-center hover:bg-gray-800 shadow-md transition-colors"><i className="fa-solid fa-plus text-[10px]"></i></button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {currentStep === 3 && (
                <div className="space-y-6">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{t.booking?.coupon_title || 'Discount Coupon'}</label>
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
                          {appliedCoupon.code} applied! (-₩{priceDetails.discount.toLocaleString()})
                        </p>
                      )}
                    </div>
                    <button
                      onClick={handleApplyCoupon}
                      disabled={isValidatingCoupon || !couponInput.trim()}
                      className={`px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all ${isValidatingCoupon || !couponInput.trim() ? 'bg-gray-200 text-gray-400' : 'bg-bee-black text-bee-yellow hover:bg-gray-800 shadow-md'
                        }`}
                    >
                      {isValidatingCoupon ? <i className="fa-solid fa-spinner animate-spin"></i> : (t.booking?.apply || 'Apply')}
                    </button>
                  </div>
                </div>
              )}

              {currentStep === 4 && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{t.booking.name}</label>
                      <input type="text" value={booking.userName} onChange={e => updateBooking('userName', e.target.value)} className="w-full bg-gray-50 border-2 border-gray-100 rounded-2xl p-4 text-sm font-bold outline-none focus:border-bee-yellow" placeholder={t.booking.name_placeholder} />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{t.booking.email}</label>
                      <input type="email" value={booking.userEmail} onChange={e => updateBooking('userEmail', e.target.value)} className="w-full bg-gray-50 border-2 border-gray-100 rounded-2xl p-4 text-sm font-bold outline-none focus:border-bee-yellow" placeholder={t.booking.email_placeholder} />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{t.booking.sns}</label>
                      <select title="SNS Channel" value={booking.snsChannel} onChange={e => updateBooking('snsChannel', e.target.value)} className="w-full bg-gray-50 border-2 border-gray-100 rounded-2xl p-4 text-sm font-bold outline-none focus:border-bee-yellow bg-white">
                        <option value="kakao">Kakao</option>
                        <option value="line">LINE</option>
                        <option value="whatsapp">WhatsApp</option>
                        <option value="instagram">Instagram</option>
                        <option value="wechat">WeChat</option>
                        <option value="other">Other</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{t.booking.snsId}</label>
                      <input type="text" value={booking.snsId} onChange={e => updateBooking('snsId', e.target.value)} className="w-full bg-gray-50 border-2 border-gray-100 rounded-2xl p-4 text-sm font-bold outline-none focus:border-bee-yellow" placeholder={t.booking.kakao_id_placeholder || "ID"} />
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div className="p-4 bg-gray-50 rounded-2xl space-y-3">
                      <label className="flex items-start gap-3 cursor-pointer group">
                        <input type="checkbox" checked={booking.agreedToTerms} onChange={e => updateBooking('agreedToTerms', e.target.checked)} className="mt-1 w-4 h-4 accent-bee-black" />
                        <div className="flex-1">
                          <span className="text-[10px] font-bold text-gray-500 leading-tight">
                            {(t.terms?.agree_format || "{link}에 동의합니다").split('{link}').map((part: string, i: number) => (
                              i === 1 ? (
                                <span key={i} className="underline cursor-pointer hover:text-bee-black" onClick={(e) => { e.preventDefault(); if (onTermsClick) onTermsClick(); else window.open('/terms', '_blank'); }}>
                                  {t.terms?.link_usage || "이용 약관"}
                                </span>
                              ) : <span key={i}>{part}</span>
                            ))}
                          </span>
                        </div>
                      </label>
                      <label className="flex items-start gap-3 cursor-pointer group">
                        <input type="checkbox" checked={booking.agreedToPrivacy} onChange={e => updateBooking('agreedToPrivacy', e.target.checked)} className="mt-1 w-4 h-4 accent-bee-black" />
                        <div className="flex-1">
                          <span className="text-[10px] font-bold text-gray-500 leading-tight">
                            {(t.terms?.agree_format || "{link}에 동의합니다").split('{link}').map((part: string, i: number) => (
                              i === 1 ? (
                                <span key={i} className="underline cursor-pointer hover:text-bee-black" onClick={(e) => { e.preventDefault(); if (onPrivacyClick) onPrivacyClick(); else window.open('/privacy', '_blank'); }}>
                                  {t.terms?.link_privacy || "개인정보 처리방침"}
                                </span>
                              ) : <span key={i}>{part}</span>
                            ))}
                          </span>
                        </div>
                      </label>
                      <label className="flex items-start gap-3 cursor-pointer group">
                        <input type="checkbox" checked={booking.agreedToHighValue} onChange={e => updateBooking('agreedToHighValue', e.target.checked)} className="mt-1 w-4 h-4 accent-bee-black" />
                        <div className="flex-1">
                          <span className="text-[10px] font-bold text-gray-500 leading-tight">
                            {(t.terms?.agree_format || "{link}에 동의합니다").split('{link}').map((part: string, i: number) => (
                              i === 1 ? (
                                <span key={i} className="underline cursor-pointer hover:text-bee-black" onClick={(e) => { e.preventDefault(); window.open('/terms#insurance', '_blank'); }}>
                                  {t.terms?.link_insurance || "고가 물품 및 보상 규정"}
                                </span>
                              ) : <span key={i}>{part}</span>
                            ))}
                          </span>
                        </div>
                      </label>
                    </div>

                    <div className="p-4 bg-yellow-50/50 border border-yellow-100 rounded-2xl space-y-3">
                      <label className="flex items-start gap-3 cursor-pointer group">
                        <input type="checkbox" checked={booking.agreedToPremium} onChange={e => updateBooking('agreedToPremium', e.target.checked)} className="mt-1 w-4 h-4 accent-bee-black" />
                        <div className="flex-1">
                          <span className="text-[10px] font-bold text-bee-black leading-tight">{t.booking.agree_premium_checklist}</span>
                          <p className="text-[8px] text-gray-400 mt-0.5">{t.booking.premium_note}</p>
                        </div>
                      </label>

                      {(t.booking.restricted_items && t.booking.restricted_items.length > 0) && (
                        <div className="pl-7 space-y-1.5 opacity-80">
                          <p className="text-[8px] font-black text-bee-black uppercase tracking-wider mb-2">{t.booking.restricted_items_title}</p>
                          {t.booking.restricted_items.map((item: string, idx: number) => (
                            <div key={idx} className="flex items-center gap-2">
                              <div className="w-1 h-1 rounded-full bg-bee-yellow" />
                              <span className="text-[9px] font-bold text-gray-500">{item}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {(currentStep === 5) && (
                <div className="space-y-8 text-center md:text-left">
                  <div className="bg-gray-50 rounded-3xl p-8 space-y-6">
                    <div className="flex justify-between items-center pb-4 border-b border-gray-200">
                      <span className="text-xs font-black text-gray-400 uppercase">{t.booking?.service_label || 'Service'}</span>
                      <span className="text-sm font-black px-4 py-1.5 bg-bee-yellow rounded-full">{serviceType === ServiceType.DELIVERY ? t.booking.delivery : t.booking.storage}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-8">
                      <div><span className="text-[10px] font-black text-gray-400 uppercase block mb-1">{t.booking?.pickup_schedule_label || 'Pickup'}</span><p className="text-base font-black">{getLocalizedDate(booking.pickupDate || '', lang)} {booking.pickupTime}</p></div>
                      <div><span className="text-[10px] font-black text-gray-400 uppercase block mb-1">{serviceType === ServiceType.DELIVERY ? (t.booking?.delivery_schedule_label || 'Delivery') : (t.booking?.return_schedule_label || 'Retrieval')}</span><p className="text-base font-black">{getLocalizedDate(booking.dropoffDate || '', lang)} {booking.deliveryTime}</p></div>
                    </div>
                    <div className="pt-4 border-t border-gray-200">
                      <span className="text-[10px] font-black text-gray-400 uppercase block mb-1">{t.booking.destination_label || 'Destination'}</span>
                      <p className="text-sm font-black">{getLocName(locations.find(l => l.id === booking.pickupLocation) || locations[0])}</p>
                    </div>
                    <div className="pt-4 border-t border-gray-200">
                      <span className="text-[10px] font-black text-gray-400 uppercase block mb-1">{t.booking.bags_label || 'Bags'}</span>
                      <div className="flex flex-wrap gap-2 mt-1">{(['S', 'M', 'L', 'XL'] as const).map(s => booking.bagSizes[s] > 0 && <span key={s} className="bg-white border border-gray-200 px-3 py-1 rounded-lg text-xs font-bold">{s} x {booking.bagSizes[s]}</span>)}</div>
                    </div>
                  </div>
                  <div className="flex justify-between items-center px-4">
                    <span className="text-sm font-black text-gray-400 uppercase">{t.booking?.total_label || 'Total Amount'}</span>
                    <div className="text-right">
                      <span className="block text-4xl font-black text-bee-black">₩{priceDetails.total.toLocaleString()}</span>
                      {priceDetails.durationText && (
                        <span className="block text-xs text-bee-black font-bold mt-1">
                          {priceDetails.durationText}
                          {priceDetails.breakdown && <span className="block text-[10px] text-gray-400 font-normal">{priceDetails.breakdown}</span>}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer Nav */}
        {!isSuccess && (
          <div className="p-8 bg-gray-50 border-t border-gray-100 flex gap-4">
            {currentStep > 1 && <button title="Previous Step" aria-label="Previous Step" onClick={prevStep} className="px-8 py-4 bg-white border-2 border-gray-100 rounded-2xl font-black text-gray-400 hover:text-bee-black transition-all"><i className="fa-solid fa-arrow-left"></i></button>}
            {currentStep < 5 ? (
              <button onClick={nextStep} className="flex-1 py-4 bg-bee-black text-bee-yellow rounded-2xl font-black text-sm uppercase tracking-widest shadow-lg hover:bg-gray-800 transition-all flex items-center justify-center gap-2">
                {t.booking.next || 'Next'} <i className="fa-solid fa-arrow-right"></i>
              </button>
            ) : (
              <button
                onClick={handleFinalBook}
                disabled={isSubmitting || !booking.agreedToTerms || !booking.agreedToPrivacy || !booking.agreedToHighValue}
                className={`flex-1 py-4 rounded-2xl font-black text-sm uppercase tracking-widest shadow-xl transition-all flex items-center justify-center gap-2 ${isSubmitting || !booking.agreedToTerms || !booking.agreedToPrivacy || !booking.agreedToHighValue ? 'bg-gray-200 text-gray-400' : 'bg-bee-black text-bee-yellow hover:bg-gray-800'}`}
              >
                {isSubmitting ? <i className="fa-solid fa-spinner animate-spin"></i> : <i className="fa-solid fa-check-double"></i>}
                {isModification ? (t.booking.update || 'Update Booking') : t.booking.book_now}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default BookingWidget;
