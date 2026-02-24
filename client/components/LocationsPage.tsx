import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { StorageService } from '../services/storageService';
import LocationList from './locations/LocationList';
import LocationMap from './locations/LocationMap';
import BranchDetails from './locations/BranchDetails';
import { LocationOption } from '../types';
import { useLocations } from '../src/domains/location/hooks/useLocations';

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
  const { data: rawLocations = [] } = useLocations();
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

  const locations = useMemo(() => {
    let sortedData = [...rawLocations];
    if (userLocation) {
      sortedData.sort((a, b) => {
        if (!a.lat || !a.lng) return 1;
        if (!b.lat || !b.lng) return -1;
        const distA = calculateDistance(userLocation.lat, userLocation.lng, a.lat, a.lng);
        const distB = calculateDistance(userLocation.lat, userLocation.lng, b.lat, b.lng);
        return distA - distB;
      });
    }
    return sortedData;
  }, [rawLocations, userLocation]);

  // 1. Get User Location & Prices on Mount
  // [스봉이 수정] 진입 시 무조건 내 위치부터 센터링 💅
  useEffect(() => {
    let mounted = true;
    if (navigator.geolocation && !initialLocationId) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          if (mounted) {
            console.log("[스봉이] Got user location on mount 🐝✨", position.coords);
            setUserLocation({
              lat: position.coords.latitude,
              lng: position.coords.longitude
            });
          }
        },
        (error) => {
          console.warn("Geolocation Error:", error);
        },
        { timeout: 5000, maximumAge: 60000, enableHighAccuracy: true } // Add proper options here
      );
    }

    // Fetch prices for BaggageCounter
    StorageService.getDeliveryPrices().then(prices => {
      if (mounted && prices) setDeliveryPrices(prices);
    }).catch(console.error);

    return () => { mounted = false; };
  }, [initialLocationId]);

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
    <div className="relative flex flex-col h-screen w-full bg-gray-50 overflow-hidden font-pretendard">
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
          onBaggageChange={(size, delta) => {
            setBaggageCounts(prev => ({
              ...prev,
              [size]: Math.max(0, (prev[size as keyof typeof prev] as number || 0) + delta)
            }));
          }}
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
                    type,
                    bookingDate,
                    returnDate,
                    baggageCounts
                  );
                }}
                bookingDate={bookingDate}
                onDateChange={setBookingDate}
                baggageCounts={baggageCounts as any}
                onBaggageChange={(size, delta) => {
                  setBaggageCounts((prev: any) => ({
                    ...prev,
                    [size]: Math.max(0, (prev[size] || 0) + delta)
                  }));
                }}
                t={t}
                lang={lang}
              />
            </div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default LocationsPage;
