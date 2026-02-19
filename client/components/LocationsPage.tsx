import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { StorageService } from '../services/storageService';
import LocationList from './locations/LocationList';
import LocationMap from './locations/LocationMap';
import BranchDetails from './locations/BranchDetails';
import { LocationOption } from '../types';

interface LocationsPageProps {
  onBack: () => void;
  onSelectLocation: (id: string, type: 'STORAGE' | 'DELIVERY', date?: string, returnDate?: string, bagCounts?: any) => void;
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
  const [locations, setLocations] = useState<LocationOption[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchAddress, setSearchAddress] = useState('');
  const [selectedBranch, setSelectedBranch] = useState<LocationOption | null>(null);
  const [currentService, setCurrentService] = useState<'SAME_DAY' | 'SCHEDULED' | 'STORAGE'>('STORAGE');
  const [bookingDate, setBookingDate] = useState(() => {
    const d = new Date();
    const kst = new Date(d.getTime() + (9 * 60 * 60000) + (d.getTimezoneOffset() * 60000));
    return kst.toISOString().split('T')[0];
  });
  const [bookingTime, setBookingTime] = useState('09:00');
  const [returnDate, setReturnDate] = useState(() => {
    const d = new Date();
    const kst = new Date(d.getTime() + (9 * 60 * 60000) + (d.getTimezoneOffset() * 60000));
    return kst.toISOString().split('T')[0];
  });
  const [returnTime, setReturnTime] = useState('11:00');
  const [baggageCounts, setBaggageCounts] = useState({ S: 0, M: 0, L: 0, XL: 0 });
  const [deliveryPrices, setDeliveryPrices] = useState<any>({ S: 20000, M: 20000, L: 25000, XL: 29000 });

  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);

  // Helper: Calculate distance between two coordinates (Haversine formula)
  const calculateDistance = (lat1: number, lng1: number, lat2: number, lng2: number) => {
    const R = 6371; // Radius of the earth in km
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lng2 - lng1) * (Math.PI / 180);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; // Distance in km
  };

  // 1. Get User Location & Prices on Mount
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
        },
        (error) => {
          console.log("GPS access denied or error:", error);
        }
      );
    }

    // Fetch prices for BaggageCounter
    StorageService.getDeliveryPrices().then(prices => {
      if (prices) setDeliveryPrices(prices);
    }).catch(console.error);
  }, []);

  // Handle Browser Back Button for Step-by-Step Navigation
  useEffect(() => {
    const handlePopState = (event: PopStateEvent) => {
      const state = event.state;
      if (state?.view === 'locations-list') {
        setSelectedBranch(null);
      } else if (!state || state.view === undefined) {
        // If we go back past our initial page state, exit the locations page
        onBack();
      } else if (state.view === 'locations-detail' && state.id) {
        // This might happen if user goes "forward" or we manually handle detailed states
        const found = locations.find(l => l.id === state.id);
        if (found) setSelectedBranch(found);
      }
    };

    window.addEventListener('popstate', handlePopState);

    // Initial state push for the locations page itself if not already set
    if (!window.history.state || window.history.state.view !== 'locations-list') {
      window.history.replaceState({ view: 'locations-list' }, "");
    }

    return () => window.removeEventListener('popstate', handlePopState);
  }, [locations, onBack]);



  // Sync selection with history
  const handleBranchSelect = (branch: LocationOption | null) => {
    if (branch) {
      // Selecting a branch - push new state if not already in detail view for THIS branch
      if (window.history.state?.id !== branch.id) {
        window.history.pushState({ view: 'locations-detail', id: branch.id }, "");
      }
      setSelectedBranch(branch);
    } else {
      // Closing detail view
      if (window.history.state?.view === 'locations-detail') {
        window.history.back();
      } else {
        setSelectedBranch(null);
      }
    }
  };

  useEffect(() => {
    StorageService.getLocations().then(data => {
      let sortedData = [...data];

      // If we have user location, sort by distance
      if (userLocation) {
        sortedData.sort((a, b) => {
          if (!a.lat || !a.lng) return 1;
          if (!b.lat || !b.lng) return -1;
          const distA = calculateDistance(userLocation.lat, userLocation.lng, a.lat, a.lng);
          const distB = calculateDistance(userLocation.lat, userLocation.lng, b.lat, b.lng);
          return distA - distB;
        });
      }

      setLocations(sortedData);

      // Selection Logic: [스봉이 수정] 사장님 지시로 자동 선택 제거하고 하단 리스트(나열)에 집중
      if (initialLocationId) {
        const target = sortedData.find(l => l.id === initialLocationId);
        if (target) {
          setSelectedBranch(target);
          window.history.replaceState({ view: 'locations-detail', id: target.id }, "");
        }
      }
      // GPS 기반 자동 선택 로직 제거됨. 이제 고객 위치 중심 지도와 하단 리스트가 기본입니다.

    }).catch(console.error);
  }, [initialLocationId, userLocation]);

  const filteredLocations = useMemo(() => {
    let result = locations;
    if (searchTerm) {
      const lower = searchTerm.toLowerCase();
      result = result.filter(l =>
        (l.name && l.name.toLowerCase().includes(lower)) ||
        (l.address && l.address.toLowerCase().includes(lower)) ||
        (l.name_en && l.name_en.toLowerCase().includes(lower)) ||
        (l.address_en && l.address_en.toLowerCase().includes(lower)) ||
        (l.name_ja && l.name_ja.toLowerCase().includes(lower)) ||
        (l.address_ja && l.address_ja.toLowerCase().includes(lower)) ||
        (l.name_zh && l.name_zh.toLowerCase().includes(lower)) ||
        (l.address_zh && l.address_zh.toLowerCase().includes(lower)) ||
        (l.name_zh_tw && l.name_zh_tw.toLowerCase().includes(lower)) ||
        (l.address_zh_tw && l.address_zh_tw.toLowerCase().includes(lower)) ||
        (l.name_zh_hk && l.name_zh_hk.toLowerCase().includes(lower)) ||
        (l.address_zh_hk && l.address_zh_hk.toLowerCase().includes(lower))
      );
    }

    // Filter by service
    if (currentService === 'STORAGE') {
      result = result.filter(l => l.supportsStorage && (l.isActive ?? true));
    } else {
      // [스봉이] 사장님 지침: 배송(출발) 체크된 지점만 표시 (Delivery Start Points)
      result = result.filter(l => l.supportsDelivery && (l.isOrigin ?? false) && (l.isActive ?? true));
    }

    return result;
  }, [locations, searchTerm, currentService]);

  const handleBaggageChange = (size: 'S' | 'M' | 'L' | 'XL', delta: number) => {
    setBaggageCounts(prev => ({
      ...prev,
      [size]: Math.max(0, prev[size] + delta)
    }));
  };

  const handleBook = (type: 'DELIVERY' | 'STORAGE') => {
    if (selectedBranch) {
      const combinedPickup = `${bookingDate} ${bookingTime}`;
      const combinedReturn = `${returnDate} ${returnTime}`;
      onSelectLocation(selectedBranch.id, type, combinedPickup, combinedReturn, baggageCounts);
    }
  };

  return (
    <div className="relative w-full h-[100dvh] bg-white flex flex-col md:flex-row overflow-hidden font-sans">
      {/* Sidebar Section - [스봉이 수정] 모바일에서 지점 선택 시 사이드바를 완전히 제거하여 지도/정보에 집중 */}
      {/* Sidebar Section - [스봉이 수정] 모바일에서 지점 선택 시 사이드바를 완전히 제거하여 지도/정보에 집중 */}
      <div
        className={`absolute inset-0 md:static pointer-events-none md:pointer-events-auto w-full md:w-[480px] lg:w-[520px] h-full flex flex-col z-[70] transition-all duration-500 flex`}
      >
        <LocationList
          t={t}
          lang={lang}
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          filteredBranches={filteredLocations}
          selectedBranch={selectedBranch}
          onBranchClick={handleBranchSelect}
          currentService={currentService}
          onServiceChange={setCurrentService}
          onReset={onBack}
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
        />
      </div>

      {/* Main Content Area (Map + Desktop Detail Overlay) */}
      <div className="flex-1 relative h-full">
        <LocationMap
          key="location-map-static-instance"
          t={t}
          lang={lang}
          branches={filteredLocations}
          selectedBranch={selectedBranch}
          onLocationSelect={handleBranchSelect}
          currentService={currentService}
          userLocation={userLocation}
          searchAddress={searchAddress}
        />

        {/* Branch Details Overlay - [사장님 요청] 모바일 최적화 바텀 시트 */}
        <AnimatePresence>
          {selectedBranch && (
            <div className="fixed md:absolute inset-x-0 bottom-0 md:bottom-auto md:top-1/2 md:right-10 md:left-auto md:-translate-y-1/2 md:w-[480px] z-[100] md:z-50 select-none">
              <BranchDetails
                t={t}
                lang={lang}
                selectedBranch={selectedBranch}
                onClose={() => handleBranchSelect(null)}
                currentService={currentService}
                onBook={handleBook}
                bookingDate={bookingDate}
                onDateChange={setBookingDate}
                baggageCounts={baggageCounts}
                onBaggageChange={handleBaggageChange}
              />
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default LocationsPage;
