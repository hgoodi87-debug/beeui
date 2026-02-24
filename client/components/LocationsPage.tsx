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

  return (
    <div className="flex flex-col h-screen bg-gray-50 overflow-hidden font-pretendard">
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="flex items-center space-x-4 mb-8">
            <button onClick={onBack} title={t?.common?.back || '뒤로가기'} className="p-2 bg-white rounded-full shadow-sm hover:shadow-md transition-shadow">
              <i className="fa-solid fa-arrow-left text-gray-400"></i>
            </button>
            <h1 className="text-2xl font-black text-gray-900">{t?.locations_page?.title || '빌리버 거점 안내'}</h1>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="space-y-6">
              <div className="bg-white rounded-[40px] shadow-sm border border-gray-100 overflow-hidden h-auto">
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
                />
              </div>
            </div>

            <div className="h-[400px] lg:h-[calc(100vh-200px)] sticky top-8">
              <div className="w-full h-full bg-white rounded-[40px] shadow-sm border border-gray-100 overflow-hidden">
                <LocationMap
                  t={t}
                  lang={lang}
                  branches={filteredLocations}
                  selectedBranch={selectedBranch}
                  onLocationSelect={handleBranchSelect}
                  currentService={currentService}
                  userLocation={userLocation}
                  searchAddress={searchTerm}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {selectedBranch && (
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
        )}
      </AnimatePresence>
    </div>
  );
};

export default LocationsPage;
