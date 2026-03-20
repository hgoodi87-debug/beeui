import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { StorageService } from '../services/storageService';
import LocationList from './locations/LocationList';
import LocationMap from './locations/LocationMap';
import BranchDetails from './locations/BranchDetails';
import SEO from './SEO';
import { LocationOption, ServiceType } from '../types';
import { useLocations } from '../src/domains/location/hooks/useLocations';
import { formatKSTDate, isAllSlotsPast, addDaysToDateStr, getFirstAvailableSlot, isPastKSTTime } from '../utils/dateUtils';
import { calculateDistance } from '../utils/locationUtils';


interface LocationsPageProps {
  onBack: () => void;
  onSelectLocation: (
    id: string,
    type: ServiceType,
    date?: string,
    returnDate?: string,
    bagCounts?: { S: number, M: number, L: number, XL: number }
  ) => void;
  t: any;
  lang: string;
  onLangChange: (lang: string) => void;
  user: any;
  initialLocationId?: string;
}

const LocationsPage: React.FC<LocationsPageProps> = ({
  onBack,
  onSelectLocation,
  t,
  lang,
  user,
  initialLocationId
}) => {
  const { data: rawLocations = [] } = useLocations();
  const [searchTerm, setSearchTerm] = useState('');
  const [searchAddress, setSearchAddress] = useState('');
  const [selectedBranch, setSelectedBranch] = useState<LocationOption | null>(null);
  const [currentService, setCurrentService] = useState<'SAME_DAY' | 'SCHEDULED' | 'STORAGE'>('STORAGE');
  const [bookingDate, setBookingDate] = useState(formatKSTDate());
  const [bookingTime, setBookingTime] = useState('09:00');
  const [returnDate, setReturnDate] = useState(formatKSTDate());
  const [returnTime, setReturnTime] = useState('11:00');
  const [baggageCounts, setBaggageCounts] = useState({ S: 0, M: 0, L: 0, XL: 0 });
  const [deliveryPrices, setDeliveryPrices] = useState<any>({ S: 20000, M: 20000, L: 25000, XL: 29000 });

  // [스봉이 수정] 훅은 항상 최상단에! 조건부 렌더링 내부에서 훅을 쓰면 리액트가 화낸답니다. 💅
  const handleBaggageChange = useCallback((size: string, delta: number) => {
    setBaggageCounts(prev => ({
      ...prev,
      [size]: Math.max(0, (prev[size as keyof typeof prev] as number || 0) + delta)
    }));
  }, []);

  // [스봉이 추가] 지점 및 서비스 타입에 따른 지능적 시간 설정 💅
  const DELIVERY_PICKUP_HOURS = ['09:00', '09:30', '10:00', '10:30', '11:00', '11:30', '12:00', '12:30', '13:00', '13:30'];
  const STORAGE_START_HOURS = ['09:00', '09:30', '10:00', '10:30', '11:00', '11:30', '12:00', '12:30', '13:00', '13:30', '14:00', '14:30', '15:00', '15:30', '16:00', '16:30', '17:00', '17:30', '18:00'];

  // [스봉이 추가] 지점 및 서비스 타입에 따른 지능적 시간 설정 💅
  useEffect(() => {
    const todayStr = formatKSTDate();
    const targetDate = bookingDate || todayStr;

    // 지점별 영업시간 파싱 헬퍼
    const getBH = () => {
      const bhStr = selectedBranch?.businessHours || '09:00-21:00';
      if (!bhStr || bhStr === '24시간' || bhStr === '24 Hours') return { start: 0, end: 24 };
      try {
        const parts = bhStr.split('-').map(p => p.trim());
        return { start: parseInt(parts[0].split(':')[0]), end: parseInt(parts[1].split(':')[0]) };
      } catch (e) { return { start: 9, end: 21 }; }
    };

    const { start, end } = getBH();
    const isDelivery = currentService !== 'STORAGE';

    // 동적 슬롯 생성 (유효성 검사용) - [스봉이] 배송은 13:30 마감, 보관은 영업시간 마감 30분 전까지! 💅
    let slots: string[] = [];
    const pickupStartLimit = isDelivery ? 13.5 : (end - 0.5);
    const pickupEndLoop = isDelivery ? 13 : end;

    for (let i = start; i <= pickupEndLoop; i++) {
      if (i < start) continue;
      slots.push(`${i.toString().padStart(2, '0')}:00`);
      if (i + 0.5 <= pickupStartLimit) {
        slots.push(`${i.toString().padStart(2, '0')}:30`);
      }
    }

    // [스봉이] 반납 시간(Return Time) 슬롯 생성 및 유효성 검사 💅
    // 배송은 16:00 시작, 21:00 마감! 보관은 영업시작시간부터! ✨
    const returnSlots: string[] = [];
    const rStart = isDelivery ? 16 : start;
    const rEnd = isDelivery ? Math.min(end, 21) : end;
    const rLimit = rEnd - 0.5;

    for (let h = rStart; h <= rEnd; h += 0.5) {
      if (h < start) continue;
      const hour = Math.floor(h);
      const min = Math.round((h % 1) * 60);
      const timeStr = `${hour.toString().padStart(2, '0')}:${min.toString().padStart(2, '0')}`;
      if (!returnSlots.includes(timeStr)) {
        returnSlots.push(timeStr);
      }
    }

    if (targetDate === todayStr) {
      if (isAllSlotsPast(todayStr, slots)) {
        const tomorrowStr = addDaysToDateStr(todayStr, 1);
        setBookingDate(tomorrowStr);
        setReturnDate(prev => (prev === todayStr || prev < tomorrowStr) ? tomorrowStr : prev);
        if (slots.length > 0) setBookingTime(slots[0]);
      } else {
        const firstSlot = getFirstAvailableSlot(todayStr, slots);
        if (firstSlot && (!bookingTime || isPastKSTTime(todayStr, bookingTime) || !slots.includes(bookingTime))) {
          setBookingTime(firstSlot);
        }
      }
    } else {
      if (slots.length > 0 && !slots.includes(bookingTime)) {
        setBookingTime(slots[0]);
      }
    }

    // [스봉이] 반납 시간도 깐깐하게 체크! 🙄
    const currentRDate = returnDate || todayStr;
    if (currentRDate === todayStr) {
      if (isAllSlotsPast(todayStr, returnSlots)) {
        const nextDay = addDaysToDateStr(todayStr, 1);
        setReturnDate(nextDay);
        setReturnTime(returnSlots[0] || '16:00');
      } else {
        const firstR = getFirstAvailableSlot(todayStr, returnSlots);
        if (!returnTime || isPastKSTTime(todayStr, returnTime) || !returnSlots.includes(returnTime)) {
          if (firstR) setReturnTime(firstR);
        }
      }
    } else {
      if (!returnSlots.includes(returnTime)) {
        setReturnTime(returnSlots[0] || '16:00');
      }
    }
  }, [currentService, bookingDate, returnDate, selectedBranch]);

  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);

  // 1. Get User Location & Prices on Mount + Caching Logic 🛰️
  // [스봉이 수정] 진입 시 캐시된 위치 로드 후 위치 수집 시작! 💅
  useEffect(() => {
    let mounted = true;
    const CACHE_KEY = 'beeliber_last_location';
    const CACHE_TTL = 3600000; // 1시간 (ms)

    // [스봉이] 캐시된 위치 먼저 확인해서 즉시 정렬되게! 💅
    const cached = localStorage.getItem(CACHE_KEY);
    if (cached) {
      try {
        const { lat, lng, timestamp } = JSON.parse(cached);
        if (Date.now() - timestamp < CACHE_TTL) {
          console.log("[스봉이] 캐시된 위치를 찾았어요! ✨", { lat, lng });
          setUserLocation({ lat, lng });
        }
      } catch (e) {
        console.warn("[스봉이] 캐시 데이터가 좀 이상하네요? 🙄", e);
      }
    }
    
    const fetchUserLocation = () => {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            if (mounted) {
              const newLoc = {
                lat: position.coords.latitude,
                lng: position.coords.longitude
              };
              console.log("[스봉이] 사용자 실시간 위치 수집 성공! 🐝✨", newLoc);
              setUserLocation(newLoc);
              
              // [스봉이] 신선한 위치 정보는 캐시에 저장! 💅
              localStorage.setItem(CACHE_KEY, JSON.stringify({
                ...newLoc,
                timestamp: Date.now()
              }));
            }
          },
          (error) => {
            console.warn("[스봉이] 위치 수집 실패.. 🙄", error);
          },
          { timeout: 10000, maximumAge: 300000, enableHighAccuracy: true } // maximumAge 5분으로 늘려 부하 절감
        );
      }
    };

    fetchUserLocation();

    // Fetch prices for BaggageCounter
    StorageService.getDeliveryPrices().then(prices => {
      if (mounted && prices) setDeliveryPrices(prices);
    }).catch(console.error);

    return () => { mounted = false; };
  }, []);

  const locations = useMemo(() => {
    let sortedData = [...rawLocations];
    if (userLocation && userLocation.lat && userLocation.lng) {
      console.log("[스봉이] 사용자 위치 기반 영롱한 정렬 시작 💅✨");
      sortedData = sortedData.map(loc => {
        // [스봉이] 위경도 데이터가 부실하면 정렬에서 밀어버려야죠 💅
        if (!loc || typeof loc.lat !== 'number' || typeof loc.lng !== 'number') {
          return { ...loc, distance: 99999 };
        }
        const dist = calculateDistance(userLocation.lat, userLocation.lng, loc.lat, loc.lng);
        return { ...loc, distance: dist };
      });

      sortedData.sort((a, b) => (a.distance || 0) - (b.distance || 0));
    }
    return sortedData;
  }, [rawLocations, userLocation]);


  // Handle Browser Back Button for Step-by-Step Navigation
  useEffect(() => {
    const handlePopState = (event: PopStateEvent) => {
      const state = event.state;
      if (state?.view === 'locations-list') {
        setSelectedBranch(null);
      } else if (!state || state.view === undefined) {
        onBack();
      } else if (state.view === 'locations-detail' && state.id) {
        const found = locations.find(l => l.id === state.id);
        if (found) setSelectedBranch(found);
      }
    };

    window.addEventListener('popstate', handlePopState);

    if (!window.history.state || window.history.state.view !== 'locations-list') {
      window.history.replaceState({ view: 'locations-list' }, "");
    }

    return () => window.removeEventListener('popstate', handlePopState);
  }, [locations, onBack]);

  // Sync selection with history
  const handleBranchSelect = useCallback((branch: LocationOption | null) => {
    if (branch) {
      if (window.history.state?.id !== branch.id) {
        window.history.pushState({ view: 'locations-detail', id: branch.id }, "");
      }
      setSelectedBranch(branch);
    } else {
      if (window.history.state?.view === 'locations-detail') {
        window.history.back();
      } else {
        setSelectedBranch(null);
      }
    }
  }, []);

  useEffect(() => {
    if (initialLocationId) {
      const target = locations.find(l => l.id === initialLocationId);
      if (target) {
        handleBranchSelect(target);
      }
    }
  }, [locations, initialLocationId, handleBranchSelect]);

  const filteredLocations = useMemo(() => {
    let result = locations;
    if (searchTerm) {
      result = result.filter(l =>
        l.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        l.address?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    if (currentService === 'STORAGE') {
      result = result.filter(l => l.supportsStorage);
    } else {
      result = result.filter(l => l.supportsDelivery);
    }
    // [스봉이] 활성화된 지점만 보여드려야죠? 🙄💅
    result = result.filter(l => l.isActive !== false);
    return result;
  }, [locations, searchTerm, currentService]);

  // [스봉이 수정] 버튼 클릭 시 지도가 이동하지 않는 버그 수정 💅
  // panToUserTrigger 카운터를 증가시켜 LocationMap이 명시적 요청을 구분할 수 있도록 함
  const [panToUserTrigger, setPanToUserTrigger] = React.useState(0);

  const findMyLocation = useCallback(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
          // 명시적 버튼 클릭 시 트리거 증가 → 지도가 강제로 이동함
          setPanToUserTrigger(prev => prev + 1);
        },
        (error) => console.warn("Geolocation Error:", error),
        { timeout: 5000, enableHighAccuracy: true }
      );
    }
  }, []);

  return (
    <div className="relative min-h-screen bg-slate-50 font-sans text-bee-black">
      <SEO
        title={t.seo?.locations_title || `Locations & Booking - Beeliber`}
        description={t.seo?.locations_desc || 'Find Beeliber luggage storage and delivery locations near you.'}
        keywords={t.seo?.keywords}
        lang={lang}
      />
      <div className="fixed inset-0 z-0 font-pretendard">
        {/* 1. Map as Full Background */}
        <div className="absolute inset-0 z-0">
          <LocationMap
            t={t}
            lang={lang}
            branches={filteredLocations}
            selectedBranch={selectedBranch}
            onLocationSelect={handleBranchSelect}
            currentService={currentService}
            userLocation={userLocation}
            searchAddress={searchTerm}
            panToUserTrigger={panToUserTrigger}
          />
        </div>

        {/* 2. Fullscreen UI Overlay - Filters (Top) & Horizontal Cards (Bottom) 💅 */}
        <div className="absolute top-0 left-0 bottom-0 z-10 pointer-events-none flex flex-col w-full h-full md:w-[420px] md:bg-transparent">
          <LocationList
            t={t}
            lang={lang}
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            onFindMyLocation={findMyLocation}
            filteredBranches={filteredLocations}
            selectedBranch={selectedBranch}
            onBranchClick={handleBranchSelect}
            currentService={currentService}
            onServiceChange={setCurrentService}
            onReset={() => {
              setSearchTerm('');
              handleBranchSelect(null);
            }}
            bookingDate={bookingDate}
            onDateChange={setBookingDate}
            bookingTime={bookingTime}
            onTimeChange={setBookingTime}
            returnDate={returnDate}
            onReturnDateChange={setReturnDate}
            returnTime={returnTime}
            onReturnTimeChange={setReturnTime}
            baggageCounts={baggageCounts}
            onBaggageChange={handleBaggageChange}
            deliveryPrices={deliveryPrices}
            onBack={onBack}
          />
        </div>

        <AnimatePresence>
          {selectedBranch && (
            <div className="absolute inset-0 z-50 pointer-events-none flex items-end md:items-center justify-center">
              <div className="pointer-events-auto w-full md:max-w-2xl px-2 md:px-0">
                <BranchDetails
                  selectedBranch={selectedBranch}
                  onClose={() => handleBranchSelect(null)}
                  currentService={currentService}
                  onBook={(type) => {
                    if (!selectedBranch.id) return;
                    onSelectLocation(
                      selectedBranch.id,
                      type as ServiceType,
                      `${bookingDate} ${bookingTime}`,
                      `${returnDate} ${returnTime}`,
                      baggageCounts
                    );
                  }}
                  bookingDate={bookingDate}
                  onDateChange={setBookingDate}
                  baggageCounts={baggageCounts as any}
                  onBaggageChange={handleBaggageChange}
                  t={t}
                  lang={lang}
                />
              </div>
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default LocationsPage;
