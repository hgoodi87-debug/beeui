
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { LocationOption, LocationType, BookingState, ServiceType } from '../types';
import { LOCATIONS as INITIAL_LOCATIONS } from '../constants';
import { StorageService } from '../services/storageService';
import { translateText } from '../services/geminiService';
import { getKSTDate, formatKSTDate, getKSTHours } from '../utils/dateUtils';
import {
  ChevronRight,
  MapPin,
  PhoneCall,
  Navigation,
  Clock,
  Search,
  Crosshair,
  ArrowLeft,
  Smartphone,
  ShieldCheck,
  Plane,
  Building2,
  Globe,
  Vault,
  Info,
  MessageCircle,
  X,
  Calendar,
  Briefcase,
  Package,
  Truck,
  Clock2
} from 'lucide-react';

import SidebarBooking from './SidebarBooking';
import BookingDetailed from './BookingDetailed';

interface LocationsPageProps {
  onBack: () => void;
  onSelectLocation?: (id: string, type: 'STORAGE' | 'DELIVERY', date?: string, bagCounts?: { S: number, M: number, L: number, XL: number }) => void;
  onSuccess?: (booking: BookingState) => void;
  t: any;
  lang: string;
  onLangChange?: (lang: string) => void;
  user?: any;
  initialLocationId?: string;
}

declare global {
  interface Window {
    naver: any;
    initBeeliberMap: () => void;
    navermap_authFailure: () => void;
  }
}

const LocationsPage: React.FC<LocationsPageProps> = ({ onBack, onSelectLocation, t, lang, onSuccess, onLangChange, user, initialLocationId }) => {
  // Defensive check for translation
  if (!t || !t.locations_page) {
    console.error("LocationsPage: Missing translations", { lang, t });
    return <div className="p-10 text-center">Loading resources...</div>;
  }

  // Safe access helper
  const safeT = (key: string, fallback: string) => {
    return t.locations_page?.[key] || fallback;
  };

  const [locations, setLocations] = useState<LocationOption[]>([]);
  const [selectedLocation, setSelectedLocation] = useState<LocationOption | null>(null);
  const [selectedServiceType, setSelectedServiceType] = useState<string>('DELIVERY');
  const [viewStep, setViewStep] = useState<'LIST' | 'DETAIL' | 'BOOKING'>('LIST');
  const [activeFilter, setActiveFilter] = useState<'ALL' | 'AIRPORT' | 'CITY'>('ALL');

  useEffect(() => {
    StorageService.getLocations().then(locs => {
      setLocations(locs);
      if (initialLocationId) {
        const found = locs.find(l => l.id === initialLocationId);
        if (found) {
          setSelectedLocation(found);
          if (window.innerWidth < 768) {
            setViewStep('DETAIL');
          }
        }
      }
    }).catch(console.error);
    console.log("[LocationsPage] Mounted", { lang, initialLocationId });
  }, []);

  // Search State
  const [searchKeyword, setSearchKeyword] = useState('');
  const [isSearching, setIsSearching] = useState(false);

  // New Global States for Overhaul
  const getInitialDate = () => {
    const kstNow = getKSTDate();
    return formatKSTDate(kstNow);
  };

  const [bookingDate, setBookingDate] = useState(getInitialDate());
  const [arrivalDate, setArrivalDate] = useState(getInitialDate());
  const [bagSizes, setBagSizes] = useState({ S: 0, M: 0, L: 0, XL: 0 });
  const [isBagPopupOpen, setIsBagPopupOpen] = useState(false);

  // Service Status Logic (Real-time)
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  const serviceStatus = useMemo(() => {
    const kstNow = getKSTDate(now);
    const hours = kstNow.getHours();
    const todayKST = formatKSTDate(kstNow);
    const isToday = bookingDate === todayKST;

    const canTodayDelivery = isToday && hours < 14;
    const canTomorrowDelivery = !isToday || (isToday && hours >= 14);
    const canStorage = isToday ? hours < 21 : true;

    return {
      sameDay: canTodayDelivery,
      scheduled: true,
      storage: canStorage
    };
  }, [now, bookingDate]);

  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const myLocationMarkerRef = useRef<any>(null);
  const sliderRef = useRef<HTMLDivElement>(null);
  const [isMapError, setIsMapError] = useState(false);
  const [mapErrorReason, setMapErrorReason] = useState<string | null>(null);

  // Load Locations
  useEffect(() => {
    let isMounted = true;
    const loadData = async () => {
      if (locations.length === 0) setLocations(INITIAL_LOCATIONS);
      try {
        const fresh = await StorageService.getLocations();
        if (isMounted && fresh && fresh.length > 0) setLocations(fresh);
      } catch (e) { console.error("Location fetch failed", e); }
    };
    loadData();
    return () => { isMounted = false; };
  }, []);

  // Naver Maps Script Loader
  useEffect(() => {
    let isMounted = true;

    const loadScript = () => {
      // Check if script or naver object already exists
      if (window.naver && window.naver.maps) {
        if (!mapInstance.current) {
          initMap();
        }
        return;
      }

      const scriptId = 'naver-map-script';
      const existingScript = document.getElementById(scriptId);

      // If script exists but naver is missing, it might have failed or still loading
      if (existingScript && !(window as any).naver) {
        existingScript.remove();
        // continue to create new script
      } else if (window.naver && window.naver.maps) {
        if (isMounted) initMap();
        return;
      }


      let naverLang = 'ko';
      if (lang.startsWith('en')) naverLang = 'en';
      else if (lang.startsWith('ja')) naverLang = 'ja';
      else if (lang.startsWith('zh')) naverLang = 'zh';

      const script = document.createElement('script');
      script.id = scriptId;
      script.type = 'text/javascript';

      // 10s Timeout
      const timeoutId = setTimeout(() => {
        if (isMounted && !window.naver) {
          const msg = "Map Load Timeout (10s) - Network too slow or blocked?";
          setIsMapError(true);
          setMapErrorReason(msg);
        }
      }, 10000);

      window.initBeeliberMap = () => {
        clearTimeout(timeoutId);
        if (isMounted) initMap();
      };

      window.navermap_authFailure = () => {
        clearTimeout(timeoutId);
        const msg = "Auth Failure Callback Triggered";
        // Only alert if it's a real auth failure (not just a race condition)
        if (isMounted) {
          // Check if localhost/domain is the issue
          console.error("Naver Map Auth Failure. Please check Client ID and Web Service URL in NCP Console.");
          setIsMapError(true);
          setMapErrorReason("지도 인증에 실패했습니다. (도메인 등록 확인 필요)");
        }
      };

      // [스봉이 실장] 사장님! ncpKeyId로 다시 모십니다. 명품 스타일 연동의 정석 가이드를 따릅니다.
      const customStyleId = '372d23ff-f7ac-40b3-a900-e4c4545a31e1';
      script.src = `https://oapi.map.naver.com/openapi/v3/maps.js?ncpKeyId=f3gsmqhjcn&submodules=geocoder,gl&language=${naverLang}&callback=initBeeliberMap`;
      script.async = true;
      script.defer = true;

      script.onload = () => {
      };

      script.onerror = () => {
        clearTimeout(timeoutId);
        const msg = "Script onerror event fired (Network Failed)";
        if (isMounted) {
          setIsMapError(true);
          setMapErrorReason(msg);
        }
      };

      document.head.appendChild(script);
    };

    loadScript();

    return () => {
      isMounted = false;
      // Do NOT remove script on unmount/lang change to prevent auth spam/flicker
      // delete (window as any).initBeeliberMap; 
    };
  }, []); // Run once on mount, ignore lang changes for script loading to prevent reload loop

  const initMap = () => {
    if (!mapRef.current) {
      return;
    }
    if (!window.naver?.maps?.Map || !window.naver?.maps?.LatLng) {
      const msg = "Error: window.naver.maps.Map/LatLng missing";
      console.error(msg);
      setIsMapError(true);
      setMapErrorReason(msg);
      return;
    }

    // Always clear container to ensure fresh canvas
    mapRef.current.innerHTML = '';
    if (mapInstance.current) {
      try {
        mapInstance.current.destroy && mapInstance.current.destroy();
      } catch (e) { }
      mapInstance.current = null;
    }

    const customStyleId = '372d23ff-f7ac-40b3-a900-e4c4545a31e1';

    try {
      const isGLSupported = (window as any).naver.maps.isGLSupported ? (window as any).naver.maps.isGLSupported() : 'unknown';

      // [전직원 정예 멤버 합의안] navermaps.github.io 공식 가이드 기반 최후의 정석 세팅
      const mapOptions: any = {
        center: new window.naver.maps.LatLng(37.5665, 126.9780),
        zoom: 11,
        customStyleId: customStyleId,
        gl: true, // 벡터 지도 및 커스텀 스타일 활성화
        logoControl: true,
        scaleControl: false,
        mapDataControl: false,
        zoomControl: false,
        minZoom: 6,
        maxZoom: 21,
        disableKineticPan: false
      };

      mapInstance.current = new window.naver.maps.Map(mapRef.current, mapOptions);

      try {
        const isGLSupported = (window as any).naver.maps.isGLSupported && (window as any).naver.maps.isGLSupported();
        const activeStyleId = mapInstance.current.getOptions('customStyleId');
        const activeRenderer = mapInstance.current.getOptions('gl') ? 'WebGL' : 'Canvas';

        window.naver.maps.Event.once(mapInstance.current, 'init', () => {
        });

      } catch (e: any) {
      }
    } catch (glError: any) {
      try {
        // Fallback to standard map if GL/MapId fails
        mapRef.current.innerHTML = '';
        mapInstance.current = new window.naver.maps.Map(mapRef.current, {
          center: new window.naver.maps.LatLng(37.5665, 126.9780),
          zoom: 11,
          logoControl: true,
          zoomControl: true
        });
      } catch (stdError: any) {
        const msg = `CRITICAL: Both GL and Standard Initialization failed: ${stdError.message}`;
        console.error(msg, stdError);
        setIsMapError(true);
        setMapErrorReason(msg);
      }
    }

    handleMyLocation();
  };

  const createMyLocationMarker = (lat: number, lng: number) => {
    if (!mapInstance.current || !window.naver?.maps?.Marker || !window.naver?.maps?.LatLng) return;

    if (myLocationMarkerRef.current) {
      myLocationMarkerRef.current.setMap(null);
    }

    const content = `
      <div style="position: relative; width: 48px; height: 80px; display: flex; flex-direction: column; align-items: center; justify-content: flex-end;">
        <div style="position: absolute; top: 0; background: #1a1a1a; color: #ffcb05; padding: 3px 8px; border-radius: 20px; font-size: 8.5px; font-weight: 950; white-space: nowrap; box-shadow: 0 4px 10px rgba(0,0,0,0.2); border: 1.2px solid #ffcb05; z-index: 10; font-family: 'Pretendard', sans-serif; letter-spacing: 0.5px; animation: bounce 2s infinite;">
          ${t.locations_page.user_marker || 'Customer Location'} 💅✨
        </div>
        <img src="/images/markers/Absolute_Bee_v21.svg?v=${Date.now()}" style="width: 48px; height: 75px;" alt="User Location" />
      </div>
    `;

    myLocationMarkerRef.current = new window.naver.maps.Marker({
      position: new window.naver.maps.LatLng(lat, lng),
      map: mapInstance.current,
      icon: {
        content: content,
        size: new window.naver.maps.Size(48, 80),
        anchor: new window.naver.maps.Point(24, 75)
      },
      zIndex: 1000
    });
  };

  const clearMarkers = () => {
    markersRef.current.forEach(m => m.setMap(null));
    markersRef.current = [];
  };

  // Markers Update
  useEffect(() => {
    if (!mapInstance.current || !window.naver?.maps?.LatLng || !window.naver?.maps?.Marker) return;
    clearMarkers();

    const filtered = locations.filter(l => {
      if (l.isActive === false) return false;
      if (activeFilter === 'ALL') return true;
      if (activeFilter === 'AIRPORT') return l.type === LocationType.AIRPORT;
      return l.type !== LocationType.AIRPORT;
    });

    filtered.forEach(loc => {
      if (!window.naver?.maps?.LatLng) return;
      const point = new (window.naver.maps.LatLng as any)(loc.lat || 37.5, loc.lng || 127.0);
      const isAirport = loc.type === LocationType.AIRPORT;
      const isActive = selectedLocation?.id === loc.id;

      // ULTRA-PRECISION SIZES v34.0 (Softer Precision Grounding)
      const airportW = 42, airportH = 60;
      const storeW = 84, storeH = 49;

      // Dynamic Service Badge Logic (Pills floating ABOVE the marker)
      const services = loc.availableServices || [];
      const badgeList: string[] = [];

      const renderBadge = (color: string, icon: string, label: string) => `
        <div style="
          background: ${isActive ? color : '#ffffff'};
          padding: 2px 6px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          gap: 3px;
          border: 1px solid ${color};
          color: ${isActive ? '#ffffff' : color};
          font-family: 'Pretendard', sans-serif;
          font-weight: 900;
          font-size: 8.5px;
          white-space: nowrap;
          box-shadow: 0 2px 6px rgba(0,0,0,0.1);
          margin-bottom: 2px;
          pointer-events: none;
        ">
          <i class="${icon}" style="font-size: 8px;"></i>
          <span>${label}</span>
        </div>
      `;

      if (isAirport) {
        badgeList.push(renderBadge('#3B82F6', 'fa-solid fa-plane-up', t.locations_page.service_delivery || 'Delivery'));
      } else {
        if (services.includes('짐 보관')) badgeList.push(renderBadge('#FFCB05', 'fa-solid fa-vault', t.locations_page.service_storage || 'Storage'));
        if (services.includes('짐 배송')) badgeList.push(renderBadge('#3B82F6', 'fa-solid fa-truck-fast', t.locations_page.service_delivery || 'Delivery'));
        if (services.includes('환전')) badgeList.push(renderBadge('#10B981', 'fa-solid fa-money-bill-transfer', t.locations_page.service_exchange || 'Exchange'));
      }

      // Fallback
      if (!isAirport && badgeList.length === 0) {
        if (loc.supportsStorage) badgeList.push(renderBadge('#FFCB05', 'fa-solid fa-vault', t.locations_page.service_storage || 'Storage'));
        if (loc.supportsDelivery) badgeList.push(renderBadge('#3B82F6', 'fa-solid fa-truck-fast', t.locations_page.service_delivery || 'Delivery'));
      }

      const badgeContainer = `
        <div style="display: flex; flex-direction: column; align-items: center; position: absolute; bottom: 100%; left: 50%; transform: translateX(-50%); margin-bottom: 0px; pointer-events: none; z-index: 10;">
          ${badgeList.join('')}
        </div>
      `;

      let content = '';
      if (isAirport) {
        content = `
          <div style="position: relative; width: ${airportW}px; height: ${airportH}px; display: flex; flex-direction: column; align-items: center; cursor: pointer; transition: all 0.2s ease;">
            <style>
              @keyframes planeTakeoffMini {
                0% { transform: translateY(0); }
                50% { transform: translateY(-3px); }
                100% { transform: translateY(0); }
              }
              .airport-marker-active { animation: planeTakeoffMini 2s infinite ease-in-out; }
            </style>
            ${badgeContainer}
            <div class="${isActive ? 'airport-marker-active' : ''}" style="transform: ${isActive ? 'scale(1.1)' : 'scale(1)'};">
              <img src="/images/markers/Absolute_Airport_v22.svg?v=${Date.now()}" style="width: ${airportW}px; height: ${airportH}px; filter: ${isActive ? 'drop-shadow(0 0 10px rgba(0,0,255,0.4))' : 'none'};" alt="${getLocData(loc).name}" />
            </div>
            ${isActive ? `
              <div style="position: absolute; top: calc(100% + 2px); left: 50%; transform: translateX(-50%); background: #0000FF; color: #ffffff; padding: 2px 6px; border-radius: 6px; font-size: 8.5px; font-weight: 950; white-space: nowrap; border: 1px solid white; z-index: 20; box-shadow: 0 4px 10px rgba(0,0,0,0.2);">
                ${getLocData(loc).name}
              </div>
            ` : ''}
          </div>
        `;
      } else {
        // Black Capsule Logo Branch Marker v34.0 (Softer Precision)
        content = `
          <div style="position: relative; width: ${storeW}px; height: ${storeH}px; display: flex; flex-direction: column; align-items: center; justify-content: flex-end; cursor: pointer; transition: all 0.2s ease-out; transform: ${isActive ? 'scale(1.05)' : 'scale(1)'};">
            ${badgeContainer}
            <img src="/images/markers/Absolute_Logo_v25.svg?v=${Date.now()}" style="width: ${storeW}px; height: ${storeH}px; filter: ${isActive ? 'drop-shadow(0 0 15px rgba(255,203,5,0.4))' : 'drop-shadow(0 4px 8px rgba(0,0,0,0.3))'}; pointer-events: none;" alt="${getLocData(loc).name}" />
            ${isActive ? `
              <div style="position: absolute; top: calc(100% + 4px); left: 50%; transform: translateX(-50%); background: #1a1a1a; color: #ffcb05; padding: 3px 10px; border-radius: 8px; font-size: 9px; font-weight: 950; white-space: nowrap; box-shadow: 0 4px 12px rgba(0,0,0,0.3); border: 1.5px solid #ffcb05; z-index: 20;">
                ${getLocData(loc).name}
              </div>
            ` : ''}
          </div>
        `;
      }

      if (!window.naver?.maps?.Marker || !window.naver?.maps?.Point || !window.naver?.maps?.Event) return;
      const marker = new (window.naver.maps.Marker as any)({
        position: point,
        icon: {
          content: content,
          size: new (window.naver.maps.Size as any)(120, 160), // Keep canvas large for badges
          anchor: new (window.naver.maps.Point as any)(isAirport ? airportW / 2 : storeW / 2, isAirport ? airportH : storeH)
        },
        map: mapInstance.current,
        zIndex: isActive ? 100 : 1
      });

      window.naver.maps.Event.addListener(marker, "click", () => handleLocSelect(loc, true));
      markersRef.current.push(marker);
    });
  }, [locations, activeFilter, selectedLocation]);

  const handleLocSelect = (loc: LocationOption, fromMap: boolean = false) => {
    setSelectedLocation(loc);
    setSelectedServiceType('');
    setViewStep('DETAIL');
    if (mapInstance.current && loc.lat && loc.lng && window.naver?.maps?.LatLng) {
      mapInstance.current.panTo(new (window.naver.maps.LatLng as any)(loc.lat, loc.lng));
      if (fromMap && window.innerWidth < 768) {
        const el = document.getElementById(`mobile-loc-card-${loc.id}`);
        if (el && sliderRef.current) {
          sliderRef.current.scrollTo({ left: el.offsetLeft - 24, behavior: 'smooth' });
        }
      }
    }
  };

  const handleBackStep = () => {
    if (viewStep === 'BOOKING') {
      setViewStep('DETAIL');
      setSelectedServiceType('');
    } else if (viewStep === 'DETAIL') {
      setViewStep('LIST');
      setSelectedLocation(null);
    } else {
      onBack();
    }
  };

  const handleMyLocation = () => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition((pos) => {
      const { latitude, longitude } = pos.coords;
      if (mapInstance.current && window.naver?.maps?.LatLng) {
        mapInstance.current.setCenter(new (window.naver.maps.LatLng as any)(latitude, longitude));
        mapInstance.current.setZoom(15);
        createMyLocationMarker(latitude, longitude);
      }
    });
  };

  const getLocData = (l: LocationOption) => {
    const currentLang = (lang || 'ko').split('-')[0].toLowerCase();
    const dbLang = currentLang === 'zh' ? 'zh' : currentLang;

    // Korean: Use default fields directly
    if (currentLang === 'ko') {
      return {
        name: l.name,
        desc: l.description,
        guide: l.pickupGuide,
        address: l.address,
        hours: l.businessHours || "09:00 - 21:00"
      };
    }

    // Other Languages: Try to find localized fields
    const lName = ((l as any)[`name_${dbLang}`] as string) || l.name_en || l.name;
    const lDesc = ((l as any)[`description_${dbLang}`] as string) || l.description_en || l.description;
    const lGuide = ((l as any)[`pickupGuide_${dbLang}`] as string) || l.pickupGuide_en || l.pickupGuide;
    const lAddr = ((l as any)[`address_${dbLang}`] as string) || l.address_en || l.address;
    const lHours = ((l as any)[`businessHours_${dbLang}`] as string) || l.businessHours_en || l.businessHours || "09:00 - 21:00";

    return { name: lName, desc: lDesc, guide: lGuide, address: lAddr, hours: lHours };
  };

  const filteredLocations = locations.filter(l => {
    // Only show active locations (isActive defaults to true if undefined)
    if (l.isActive === false) return false;

    if (activeFilter === 'ALL') return true;
    if (activeFilter === 'AIRPORT') return l.type === LocationType.AIRPORT;
    return l.type !== LocationType.AIRPORT;
  });

  const handlePoiSearch = async () => {
    if (!searchKeyword.trim() || !window.naver?.maps?.Service) return;
    setIsSearching(true);
    window.naver.maps.Service.geocode({ query: searchKeyword }, (status: any, response: any) => {
      if (status === window.naver.maps.Service.Status.OK) {
        const addr = response.v2.addresses[0];
        if (addr && mapInstance.current && window.naver?.maps?.LatLng) {
          const point = new (window.naver.maps.LatLng as any)(addr.y, addr.x);
          mapInstance.current.setCenter(point);
          mapInstance.current.setZoom(15);
        }
      }
      setIsSearching(false);
    });
  };

  return (
    <div className="h-screen flex flex-col bg-white overflow-hidden relative">
      {/* Header */}
      <nav className="flex-shrink-0 border-b border-gray-100 px-6 py-4 flex justify-between items-center bg-white/95 backdrop-blur-md z-[1000] shadow-sm">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-1 cursor-pointer group" onClick={onBack}>
            <span className="text-xl font-black italic text-bee-yellow group-hover:scale-110 transition-transform">bee</span>
            <span className="text-xl font-black text-bee-black group-hover:translate-x-1 transition-transform">liber</span>
          </div>
          <div className="hidden md:block h-6 w-px bg-gray-200"></div>
          <h1 className="hidden md:block text-sm font-black text-bee-black uppercase tracking-[0.2em]">{t.locations_page.title || 'Locations'}</h1>
        </div>

        <div className="flex items-center gap-4">
          <button onClick={handleBackStep} className="text-[10px] md:text-xs font-black uppercase tracking-widest flex items-center gap-2 text-bee-grey hover:text-bee-black transition-all bg-gray-50 px-4 py-2 rounded-xl border border-black/5">
            <ArrowLeft className="w-3 h-3" /> {viewStep === 'LIST' ? (t.locations_page.back || 'BACK') : 'PREV'}
          </button>
        </div>
      </nav>

      <div className="flex-1 flex flex-col md:flex-row overflow-hidden relative">
        {/* PC Sidebar */}
        <aside className="hidden md:flex flex-col w-[400px] border-r border-gray-100 bg-[#fafafb] z-[200] h-full overflow-hidden">
          <AnimatePresence mode="wait">
            {viewStep === 'LIST' && (
              <motion.div
                key="list"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="h-full flex flex-col p-8"
              >
                <div className="mb-8">
                  <h2 className="text-2xl font-black italic mb-2 tracking-tight">{t.locations_page.sidebar_title || 'GLOBAL NETWORK'}</h2>
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{t.locations_page.sidebar_subtitle || 'Premium Service Points'}</p>
                </div>

                {/* Smart Controls & Badges */}
                <div className="space-y-4 mb-8">
                  {/* Service Status Badges */}
                  <div className="flex gap-2">
                    <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-[9px] font-black tracking-widest transition-all ${serviceStatus.sameDay ? 'bg-bee-yellow border-bee-yellow text-bee-black' : 'bg-gray-100 border-gray-200 text-gray-400'}`}>
                      <Truck size={10} /> {t.locations_page.badge_same_day || 'SAME-DAY DELIVERY'}
                    </div>
                    <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-[9px] font-black tracking-widest transition-all ${serviceStatus.scheduled ? 'bg-bee-black border-bee-black text-bee-yellow' : 'bg-gray-100 border-gray-200 text-gray-400'}`}>
                      <Calendar size={10} /> {t.locations_page.badge_scheduled || 'SCHEDULED'}
                    </div>
                    <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-[9px] font-black tracking-widest transition-all ${serviceStatus.storage ? 'bg-blue-500 border-blue-500 text-white' : 'bg-gray-100 border-gray-200 text-gray-400'}`}>
                      <Vault size={10} /> {t.locations_page.badge_storage || 'STORAGE'}
                    </div>
                  </div>

                  {/* Date & Baggage Bar */}
                  <div className="flex gap-2 items-center">
                    <div className="flex-1 relative">
                      <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-bee-yellow w-4 h-4 pointer-events-none" />
                      <input
                        type="date"
                        title="Booking Date"
                        value={bookingDate}
                        min={now.toISOString().split('T')[0]}
                        onChange={(e) => setBookingDate(e.target.value)}
                        className="w-full bg-white border-2 border-gray-100 rounded-2xl py-3 pl-12 pr-4 text-sm font-black focus:border-bee-yellow transition-all outline-none shadow-sm"
                      />
                    </div>

                    <div className="relative">
                      <button
                        title={t.locations_page.aria_manage_baggage || "Manage Baggage"}
                        aria-label={t.locations_page.aria_manage_baggage || "Manage Baggage"}
                        onClick={() => setIsBagPopupOpen(!isBagPopupOpen)}
                        className={`p-3 rounded-2xl border-2 transition-all flex items-center gap-2 shadow-sm ${isBagPopupOpen ? 'border-bee-yellow bg-bee-yellow/10' : 'border-gray-100 bg-white hover:border-bee-yellow'}`}
                      >
                        <Briefcase className="w-5 h-5 text-bee-black" />
                        <span className="text-sm font-black">{(bagSizes.S + bagSizes.M + bagSizes.L + bagSizes.XL) || 0}</span>
                      </button>

                      <AnimatePresence>
                        {isBagPopupOpen && (
                          <motion.div
                            initial={{ opacity: 0, y: 10, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 10, scale: 0.95 }}
                            className="absolute top-full right-0 mt-4 w-[280px] bg-white rounded-3xl shadow-2xl border border-gray-100 p-6 z-[2000] space-y-4"
                          >
                            <div className="flex justify-between items-center mb-2">
                              <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Select Baggage</h4>
                              <button title="Close Bag Selection" aria-label="Close Bag Selection" onClick={() => setIsBagPopupOpen(false)} className="text-gray-400 hover:text-bee-black"><X size={14} /></button>
                            </div>

                            {(['S', 'M', 'L', 'XL'] as const).map(size => (
                              <div key={size} className="flex items-center justify-between p-3 bg-gray-50 rounded-2xl">
                                <div>
                                  <div className="text-xs font-black text-bee-black">{size} SIZE</div>
                                  <div className="text-[8px] font-bold text-gray-400 uppercase">
                                    {size === 'S' ? t.locations_page.bag_size_s_desc : size === 'M' ? t.locations_page.bag_size_m_desc : size === 'L' ? t.locations_page.bag_size_l_desc : t.locations_page.bag_size_xl_desc}
                                  </div>
                                </div>
                                <div className="flex items-center gap-3">
                                  <button
                                    title="Decrease Count"
                                    aria-label="Decrease Count"
                                    onClick={() => setBagSizes(prev => ({ ...prev, [size]: Math.max(0, prev[size] - 1) }))}
                                    className="w-8 h-8 rounded-lg bg-white border border-gray-200 flex items-center justify-center hover:bg-gray-100"
                                  >
                                    <span className="font-black">-</span>
                                  </button>
                                  <span className="w-4 text-center text-sm font-black">{bagSizes[size]}</span>
                                  <button
                                    title={t.locations_page.aria_increase_count || "Increase Count"}
                                    aria-label={t.locations_page.aria_increase_count || "Increase Count"}
                                    onClick={() => setBagSizes(prev => ({ ...prev, [size]: prev[size] + 1 }))}
                                    className="w-8 h-8 rounded-lg bg-bee-black text-bee-yellow flex items-center justify-center hover:bg-gray-800 shadow-md"
                                  >
                                    <span className="font-black">+</span>
                                  </button>
                                </div>
                              </div>
                            ))}

                            <button
                              onClick={() => setIsBagPopupOpen(false)}
                              className="w-full py-4 bg-bee-yellow text-bee-black rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg hover:scale-[1.02] transition-transform"
                            >
                              {t.locations_page.btn_apply}
                            </button>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto no-scrollbar scroll-smooth pr-2">
                  <div className="space-y-4 pb-8">
                    {filteredLocations.map(loc => {
                      const { name, address } = getLocData(loc);
                      const isSelected = selectedLocation?.id === loc.id;
                      return (
                        <div
                          key={loc.id}
                          onClick={() => handleLocSelect(loc)}
                          className={`group p-5 bg-white border-2 rounded-[2.5rem] transition-all cursor-pointer relative overflow-hidden ${isSelected ? 'border-bee-yellow shadow-xl' : 'border-gray-50 hover:border-gray-200 hover:shadow-lg'}`}
                        >
                          {isSelected && <div className="absolute top-0 right-0 w-24 h-24 bg-bee-yellow/10 rounded-bl-full pointer-events-none" />}
                          <div className="flex justify-between items-start mb-3">
                            <div className="flex items-center gap-3">
                              <div className={`p-3 rounded-2xl transition-colors ${isSelected ? 'bg-bee-yellow text-bee-black' : 'bg-gray-50 text-gray-400 group-hover:bg-bee-yellow/20 group-hover:text-bee-yellow'}`}>
                                {loc.type === LocationType.AIRPORT ? <Plane size={18} /> : <Building2 size={18} />}
                              </div>
                              <div>
                                <h4 className="font-black text-base text-bee-black leading-tight mb-1">{name}</h4>
                                <div className="flex gap-1.5">
                                  {loc.supportsDelivery && (
                                    <div className={`p - 1 rounded - md ${isSelected ? 'bg-bee-black/10 text-bee-black' : 'bg-blue-50 text-blue-500'} `} title="Delivery">
                                      <Truck size={10} />
                                    </div>
                                  )}
                                  {loc.supportsStorage && (
                                    <div className={`p - 1 rounded - md ${isSelected ? 'bg-bee-black/10 text-bee-black' : 'bg-orange-50 text-orange-500'} `} title="Storage">
                                      <Briefcase size={10} />
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                            {isSelected && <div className="w-2 h-2 rounded-full bg-bee-yellow animate-pulse" />}
                          </div>

                          <div className="flex items-center gap-2 text-[10px] font-bold text-gray-400 mb-4 group-hover:text-gray-600 transition-colors">
                            <MapPin size={10} />
                            <span className="truncate">{address}</span>
                          </div>

                          <div className="flex gap-2">
                            {loc.supportsDelivery && (
                              <div className="flex items-center gap-1 px-2.5 py-1 bg-gray-50 rounded-lg text-[8px] font-black text-gray-400">
                                <Truck size={10} /> {t.locations_page.tag_delivery}
                              </div>
                            )}
                            {loc.supportsStorage && (
                              <div className="flex items-center gap-1 px-2.5 py-1 bg-gray-50 rounded-lg text-[8px] font-black text-gray-400">
                                <Vault size={10} /> {t.locations_page.tag_storage}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </motion.div>
            )}

            {viewStep === 'DETAIL' && selectedLocation && (
              <motion.div
                key="detail"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="h-full flex flex-col p-8 bg-white"
              >
                <button onClick={() => setViewStep('LIST')} className="mb-6 flex items-center gap-2 text-[10px] font-black text-gray-400 hover:text-bee-black transition-all">
                  <ArrowLeft size={12} /> {t.locations_page.label_back_to_list}
                </button>

                <div className="relative aspect-square w-full rounded-[2.5rem] overflow-hidden mb-8 shadow-xl">
                  <img src={selectedLocation.imageUrl || "/api/placeholder/400/300"} alt={getLocData(selectedLocation).name} className="w-full h-full object-cover" />
                </div>

                <div className="flex-1 overflow-y-auto no-scrollbar">
                  <h2 className="text-3xl font-black italic mb-2 tracking-tighter">{getLocData(selectedLocation).name}</h2>
                  <div className="flex gap-2 mb-6">
                    {selectedLocation.supportsDelivery && (
                      <span className="bg-bee-black text-bee-yellow text-[9px] font-black px-3 py-1.5 rounded-xl shadow-lg flex items-center gap-1.5 uppercase tracking-widest">
                        <Truck size={10} /> {t.locations_page.tag_delivery}
                      </span>
                    )}
                    {selectedLocation.supportsStorage && (
                      <span className="bg-white text-bee-black border border-gray-100 text-[9px] font-black px-3 py-1.5 rounded-xl shadow-md flex items-center gap-1.5 uppercase tracking-widest">
                        <Briefcase size={10} /> {t.locations_page.tag_storage}
                      </span>
                    )}
                  </div>
                  <div className="space-y-6 mb-8">
                    <div className="flex gap-4">
                      <div className="mt-1"><MapPin size={16} className="text-bee-yellow" /></div>
                      <div>
                        <h5 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">{t.locations_page.label_address}</h5>
                        <p className="text-xs font-bold text-bee-black leading-relaxed">{getLocData(selectedLocation).address}</p>
                      </div>
                    </div>
                    <div className="flex gap-4">
                      <div className="mt-1"><Clock size={16} className="text-bee-yellow" /></div>
                      <div>
                        <h5 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">{t.locations_page.label_hours}</h5>
                        <p className="text-xs font-bold text-bee-black">{getLocData(selectedLocation).hours}</p>
                      </div>
                    </div>
                    <div className="flex gap-4">
                      <div className="mt-1"><Info size={16} className="text-bee-yellow" /></div>
                      <div>
                        <h5 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">{t.locations_page.label_guide}</h5>
                        <p className="text-xs font-bold text-bee-grey leading-relaxed italic">{getLocData(selectedLocation).guide}</p>
                      </div>
                    </div>
                    <div className="flex gap-4">
                      <div className="mt-1"><Vault size={16} className="text-bee-yellow" /></div>
                      <div>
                        <h5 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">{t.locations_page.label_facilities}</h5>
                        <div className="flex flex-wrap gap-2 mt-2">
                          {(selectedLocation.availableServices && selectedLocation.availableServices.length > 0) ? (
                            selectedLocation.availableServices.map((service: string) => (
                              <span key={service} className="px-3 py-1 bg-bee-yellow/10 rounded-lg text-[9px] font-black text-bee-black border border-bee-yellow/20 shadow-sm">
                                {service}
                              </span>
                            ))
                          ) : (
                            <span className="text-[9px] font-bold text-gray-300 italic">{t.locations_page.msg_no_extra_facilities || 'No additional facilities'}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-2 pt-6 border-t border-gray-100">
                  <button
                    onClick={() => {
                      let typeToUse = selectedServiceType;
                      if (!selectedLocation.supportsDelivery && selectedLocation.supportsStorage) typeToUse = 'STORAGE';
                      if (!selectedLocation.supportsStorage && selectedLocation.supportsDelivery) typeToUse = 'DELIVERY';

                      if (onSelectLocation) {
                        onSelectLocation(selectedLocation.id, typeToUse as 'STORAGE' | 'DELIVERY', bookingDate, bagSizes);
                      } else {
                        setSelectedServiceType(typeToUse);
                        setViewStep('BOOKING');
                      }
                    }}
                    className="w-full py-4 bg-bee-black text-bee-yellow text-xs font-black rounded-2xl shadow-xl hover:scale-[1.02] active:scale-95 transition-all"
                  >
                    {t.locations_page.reservation_title || 'Book Now'}
                  </button>

                  <button
                    onClick={() => {
                      if (selectedLocation.lat && selectedLocation.lng) {
                        const url = `https://www.google.com/maps/dir/?api=1&destination=${selectedLocation.lat},${selectedLocation.lng}`;
                        window.open(url, '_blank');
                      }
                    }}
                    className="w-full py-3 bg-white border border-gray-200 text-gray-400 text-[10px] font-bold rounded-xl flex items-center justify-center gap-2 hover:bg-gray-50 transition-all shadow-sm"
                  >
                    <i className="fa-solid fa-location-arrow text-[10px]"></i>
                    {t.locations_page.btn_get_directions}
                  </button >
                </div >
              </motion.div >
            )}

            {
              viewStep === 'BOOKING' && selectedLocation && (
                <BookingDetailed
                  t={t}
                  lang={lang}
                  selectedLocation={selectedLocation}
                  locations={locations}
                  serviceType={selectedServiceType as ServiceType}
                  initialDate={bookingDate}
                  initialBags={bagSizes}
                  onClose={() => setViewStep('DETAIL')}
                  onSuccess={(b) => {
                    if (onSuccess) onSuccess(b);
                    setViewStep('LIST');
                    alert(t.locations_page.msg_booking_confirmed);
                  }}
                  user={user}
                />
              )
            }
          </AnimatePresence >
        </aside >

        {/* Map Container */}
        < section className="flex-1 relative order-1 md:order-2 h-full min-h-[450px] w-full bg-[#333]" >
          <div
            ref={mapRef}
            id="beeliber-naver-map"
            className="w-full h-full absolute inset-0 min-h-[450px] bg-[#444] z-[1]"
          />


          {/* Map Error Fallback */}
          {
            isMapError && (
              <div className="absolute inset-0 z-50 bg-gray-50 flex flex-col items-center justify-center text-center p-8">
                <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mb-4">
                  <MapPin className="text-red-500" size={32} />
                </div>
                <h3 className="text-xl font-black text-bee-black mb-2">{t.locations_page.label_map_error}</h3>
                <p className="text-sm text-gray-500 font-bold mb-2 max-w-xs">
                  {t.locations_page.msg_map_load_error}
                </p>
                {mapErrorReason && (
                  <div className="mb-4 p-3 bg-red-50 border border-red-100 rounded-lg max-w-md w-full text-left">
                    <p className="text-[10px] font-black text-red-500 uppercase tracking-widest mb-1">{t.locations_page.msg_error_reason}</p>
                    <p className="text-xs font-mono text-red-600 break-all">{mapErrorReason}</p>
                  </div>
                )}

                <button
                  onClick={() => window.location.reload()}
                  className="px-6 py-3 bg-bee-black text-bee-yellow rounded-xl font-black text-xs uppercase tracking-widest shadow-lg hover:scale-105 transition-transform"
                >
                  {t.locations_page.btn_reload_page}
                </button>
              </div>
            )
          }

          {/* Roadview Container Overlay */}
          <div id="roadview-container" className="absolute inset-0 z-[2000] bg-black hidden">
            <button
              title="Close Roadview"
              aria-label="Close Roadview"
              onClick={() => {
                const pano = document.getElementById('roadview-container');
                if (pano) pano.classList.add('hidden');
              }}
              className="absolute top-6 right-6 z-[2001] w-12 h-12 bg-white/20 backdrop-blur-md text-white rounded-full flex items-center justify-center hover:bg-white/40 transition-all border border-white/30"
            >
              <X size={24} />
            </button>
            <div className="absolute top-6 left-6 z-[2001] bg-bee-black/60 backdrop-blur-md px-4 py-2 rounded-xl border border-white/20 flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              <span className="text-[10px] font-black text-white uppercase tracking-widest">{t.locations_page.msg_live_preview}</span>
            </div>
          </div>

          {/* Mobile Overlay: Smart Control (Date & Bags) */}
          <div className="md:hidden absolute top-6 left-6 right-6 z-[300] space-y-3">
            <div className="bg-white/95 backdrop-blur-xl border border-gray-100 rounded-3xl shadow-2xl flex items-center px-4 py-3 gap-3">
              <Search className="w-4 h-4 text-bee-black" />
              <input
                type="text"
                placeholder={t.locations_page.label_search_placeholder}
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handlePoiSearch()}
                className="flex-1 bg-transparent border-none outline-none font-bold text-sm"
              />
              <button title="My Location" aria-label="My Location" onClick={handleMyLocation} className="p-2 bg-gray-50 rounded-lg text-gray-400"><Crosshair size={14} /></button>
            </div>

            {/* Smart Control Bar */}
            <div className="flex gap-2 overflow-x-auto no-scrollbar py-1 justify-center">
              {/* Service Toggle (Moved to front as requested) */}
              <button
                onClick={() => setSelectedServiceType(selectedServiceType === 'DELIVERY' ? 'STORAGE' : 'DELIVERY')}
                className="flex-shrink-0 bg-bee-black text-bee-yellow border border-bee-black rounded-2xl px-4 py-2.5 shadow-lg flex items-center gap-2"
              >
                {selectedServiceType === 'DELIVERY' ? <Truck size={12} /> : <Vault size={12} />}
                <span className="text-[10px] font-black uppercase tracking-wider">{selectedServiceType ? (selectedServiceType === 'DELIVERY' ? t.locations_page.tag_delivery : t.locations_page.tag_storage) : t.locations_page.label_service_default}</span>
              </button>

              {/* Date Selector */}
              <div className="flex-shrink-0 relative group">
                <div className="bg-white/90 backdrop-blur-md border border-gray-100 rounded-2xl px-4 py-2.5 shadow-lg flex items-center gap-2">
                  <Calendar size={12} className="text-bee-yellow" />
                  <input
                    type="date"
                    title="Booking Date"
                    value={bookingDate}
                    min={now.toISOString().split('T')[0]}
                    onChange={(e) => setBookingDate(e.target.value)}
                    className="bg-transparent border-none outline-none text-[10px] font-black w-24"
                  />
                </div>
              </div>

              {/* Bag Counter */}
              <button
                onClick={() => setIsBagPopupOpen(!isBagPopupOpen)}
                className={`flex-shrink-0 bg-white/90 backdrop-blur-md border transition-all rounded-2xl px-4 py-2.5 shadow-lg flex items-center gap-2 ${isBagPopupOpen ? 'border-bee-yellow' : 'border-gray-100'}`}
              >
                <Briefcase size={12} className="text-bee-black" />
                <span className="text-[10px] font-black">{(bagSizes.S + bagSizes.M + bagSizes.L + bagSizes.XL) || 0} {t.locations_page.label_bag_count_suffix}</span>
              </button>
            </div>

            {/* Arrival Date for Delivery (if applicable) */}
            {selectedServiceType === 'DELIVERY' && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-bee-yellow/10 backdrop-blur-md border border-bee-yellow/20 rounded-2xl px-4 py-2 flex items-center justify-between"
              >
                <div className="flex items-center gap-2">
                  <Clock2 size={12} className="text-bee-yellow" />
                  <span className="text-[9px] font-black text-bee-black">{t.locations_page.label_arrival_date}</span>
                </div>
                <input
                  type="date"
                  title="Arrival Date"
                  value={arrivalDate}
                  min={bookingDate}
                  onChange={(e) => setArrivalDate(e.target.value)}
                  className="bg-transparent border-none outline-none text-[10px] font-black text-bee-black w-24 text-right"
                />
              </motion.div>
            )}

            {/* Bag Counter Popup (Mobile Inline) */}
            <AnimatePresence>
              {isBagPopupOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="bg-white/95 backdrop-blur-xl border border-bee-yellow/20 rounded-3xl p-5 shadow-2xl space-y-4"
                >
                  <div className="flex justify-between items-center border-b border-gray-100 pb-3">
                    <span className="text-[10px] font-black italic uppercase">{t.locations_page.label_baggage_select}</span>
                    <button title="Close" aria-label="Close" onClick={() => setIsBagPopupOpen(false)} className="text-gray-400 p-1"><X size={14} /></button>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    {(['S', 'M', 'L', 'XL'] as const).map(size => (
                      <div key={size} className="bg-gray-50 rounded-2xl p-4 flex flex-col items-center gap-3 border border-gray-100 hover:border-bee-yellow/50 transition-colors">
                        <div className="text-center">
                          <div className="text-[11px] font-black text-bee-black">{size} SIZE</div>
                          <div className="text-[7px] font-bold text-gray-400 uppercase leading-tight mt-0.5">
                            {size === 'S' ? t.locations_page.bag_size_s_desc : size === 'M' ? t.locations_page.bag_size_m_desc : size === 'L' ? t.locations_page.bag_size_l_desc : t.locations_page.bag_size_xl_desc}
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <button
                            onClick={() => setBagSizes(prev => ({ ...prev, [size]: Math.max(0, prev[size] - 1) }))}
                            className="w-7 h-7 rounded-full bg-white shadow-sm flex items-center justify-center text-sm font-black active:scale-95 transition-transform"
                          >
                            -
                          </button>
                          <span className="text-sm font-black min-w-[12px] text-center">{bagSizes[size]}</span>
                          <button
                            onClick={() => setBagSizes(prev => ({ ...prev, [size]: prev[size] + 1 }))}
                            className="w-7 h-7 rounded-full bg-bee-yellow shadow-md flex items-center justify-center text-sm font-black active:scale-95 transition-transform"
                          >
                            +
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Mobile Step Views */}
          <div className="md:hidden absolute bottom-8 left-0 right-0 z-[300] px-6">
            <AnimatePresence mode="wait">
              {viewStep === 'LIST' && (
                <motion.div
                  key="mobile-list"
                  initial={{ opacity: 0, y: 50 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="bg-white/95 backdrop-blur-md rounded-[2.5rem] p-6 shadow-2xl overflow-y-auto max-h-[50vh] no-scrollbar"
                >
                  <div className="flex gap-2 overflow-x-auto no-scrollbar py-2 px-1 snap-x">
                    {filteredLocations.map(loc => {
                      const { name } = getLocData(loc);
                      const isActive = selectedLocation?.id === loc.id;
                      return (
                        <motion.button
                          title="View Detail"
                          aria-label="View Detail"
                          key={loc.id}
                          id={`mobile-loc-card-${loc.id}`}
                          onClick={() => handleLocSelect(loc)}
                          whileTap={{ scale: 0.98 }}
                          className={`
                            flex-shrink-0 w-[calc(33.33%-8px)] snap-start p-4 bg-white rounded-3xl transition-all duration-300 flex flex-col items-center text-center
                            ${isActive ? 'border-2 border-bee-yellow ring-4 ring-bee-yellow/10' : 'border border-gray-100'}
                          `}
                        >
                          <div className="flex justify-between w-full items-start mb-2">
                            <div className={`${isActive ? 'text-bee-yellow' : 'text-gray-400'}`}>
                              {loc.type === LocationType.AIRPORT ? <Plane size={12} /> : <Building2 size={12} />}
                            </div>
                          </div>
                          <h4 className="font-black text-[10px] text-bee-black mb-1 leading-tight w-full px-1 break-keep">{name}</h4>
                          <div className="flex gap-1 mb-2">
                            {loc.supportsDelivery && (
                              <div className={`p-1 rounded-lg ${isActive ? 'bg-bee-black/10 text-bee-black' : 'bg-blue-50 text-blue-500'}`}>
                                <Truck size={10} />
                              </div>
                            )}
                            {loc.supportsStorage && (
                              <div className={`p-1 rounded-lg ${isActive ? 'bg-bee-black/10 text-bee-black' : 'bg-orange-50 text-orange-500'}`}>
                                <Briefcase size={10} />
                              </div>
                            )}
                          </div>
                          <div className="text-[9px] font-black text-bee-yellow flex items-center gap-1 mt-auto whitespace-nowrap">
                            {t.locations_page.view_details} <ChevronRight size={10} />
                          </div>
                        </motion.button>
                      );
                    })}
                  </div>
                </motion.div>
              )}

              {(viewStep === 'DETAIL' || viewStep === 'BOOKING') && selectedLocation && (
                <motion.div
                  key="mobile-overlay"
                  initial={{ opacity: 0, y: 100 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 100 }}
                  className="bg-white rounded-[2.5rem] shadow-2xl overflow-hidden max-h-[80vh] flex flex-col"
                >
                  <div className="flex-1 overflow-y-auto no-scrollbar p-8">
                    {viewStep === 'DETAIL' ? (
                      <div>
                        <div className="flex justify-between items-center mb-6">
                          <button title="Close Detail" aria-label="Close Detail" onClick={() => setViewStep('LIST')} className="p-2 bg-gray-100 rounded-full"><X size={16} /></button>
                          <div className="flex gap-2">
                            {selectedLocation.supportsDelivery && <Truck size={14} className="text-blue-500" />}
                            {selectedLocation.supportsStorage && <Briefcase size={14} className="text-orange-500" />}
                          </div>
                        </div>
                        {/* Mobile Branch Image */}
                        <div className="relative aspect-square w-full rounded-3xl overflow-hidden mb-6 shadow-lg">
                          <img src={selectedLocation.imageUrl || "/api/placeholder/400/300"} alt={getLocData(selectedLocation).name} className="w-full h-full object-cover" />
                        </div>
                        <h2 className="text-2xl font-black mb-2 italic">{getLocData(selectedLocation).name}</h2>
                        <div className="flex gap-2 mb-4">
                          {selectedLocation.supportsDelivery && (
                            <div className="flex items-center gap-1.5 px-3 py-1 bg-blue-50 text-blue-500 rounded-full text-[9px] font-black">
                              <Truck size={10} /> {t.locations_page.tag_delivery}
                            </div>
                          )}
                          {selectedLocation.supportsStorage && (
                            <div className="flex items-center gap-1.5 px-3 py-1 bg-orange-50 text-orange-500 rounded-full text-[9px] font-black">
                              <Briefcase size={10} /> {t.locations_page.tag_storage}
                            </div>
                          )}
                        </div>
                        <div className="space-y-4 mb-8">
                          <div className="flex gap-3">
                            <MapPin size={14} className="text-bee-yellow mt-0.5" />
                            <p className="text-xs font-bold leading-relaxed">{getLocData(selectedLocation).address}</p>
                          </div>
                          <div className="flex gap-3">
                            <Clock size={14} className="text-bee-yellow mt-0.5" />
                            <p className="text-xs font-bold">{getLocData(selectedLocation).hours}</p>
                          </div>
                        </div>
                        <div className="flex flex-col gap-2 mb-8">
                          <button
                            title="Reserve"
                            aria-label="Reserve"
                            onClick={() => {
                              let typeToUse = selectedServiceType;
                              if (!selectedLocation.supportsDelivery && selectedLocation.supportsStorage) typeToUse = 'STORAGE';
                              if (!selectedLocation.supportsStorage && selectedLocation.supportsDelivery) typeToUse = 'DELIVERY';

                              if (onSelectLocation) {
                                onSelectLocation(selectedLocation.id, typeToUse as 'STORAGE' | 'DELIVERY', bookingDate, bagSizes);
                              } else {
                                setSelectedServiceType(typeToUse);
                                setViewStep('BOOKING');
                              }
                            }}
                            className="w-full py-4 bg-bee-black text-bee-yellow text-xs font-black rounded-2xl shadow-xl active:scale-95 transition-all"
                          >
                            {t.locations_page.reservation_title || 'Book Now'}
                          </button>

                          <button
                            onClick={() => {
                              if (selectedLocation.lat && selectedLocation.lng) {
                                const url = `https://www.google.com/maps/dir/?api=1&destination=${selectedLocation.lat},${selectedLocation.lng}`;
                                window.open(url, '_blank');
                              }
                            }}
                            className="w-full py-3 bg-white border border-gray-200 text-gray-400 text-[10px] font-bold rounded-xl flex items-center justify-center gap-2 active:scale-95 transition-all shadow-sm"
                          >
                            <i className="fa-solid fa-location-arrow text-[9px]"></i>
                            {t.locations_page.btn_get_directions}
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="h-full">
                        <div className="flex items-center gap-2 mb-4">
                          <button title="Back to Detail" aria-label="Back to Detail" onClick={() => setViewStep('DETAIL')} className="p-2 bg-gray-100 rounded-full"><ArrowLeft size={16} /></button>
                          <h4 className="text-xs font-black italic uppercase">{t.locations_page.reservation_title}</h4>
                        </div>
                        {/* Replace SidebarBooking with BookingDetailed for consistency */}
                        <BookingDetailed
                          t={t}
                          lang={lang}
                          selectedLocation={selectedLocation}
                          locations={locations}
                          serviceType={selectedServiceType as ServiceType}
                          initialDate={bookingDate}
                          initialBags={bagSizes}
                          onClose={() => setViewStep('DETAIL')}
                          onSuccess={(b) => {
                            if (onSuccess) onSuccess(b);
                            setViewStep('LIST');
                            alert(t.locations_page.msg_booking_confirmed);
                          }}
                          user={user}
                        />
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Desktop Indicator */}
          {
            selectedLocation && (
              <div className="hidden md:block absolute bottom-8 left-1/2 -translate-x-1/2 z-40">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-bee-black text-bee-yellow px-8 py-3 rounded-full shadow-2xl font-black italic tracking-widest text-[10px] flex items-center gap-4 border border-bee-yellow/20"
                >
                  <div className="w-2 h-2 rounded-full bg-bee-yellow animate-pulse"></div>
                  <span className="max-w-[150px] break-keep">{getLocData(selectedLocation).name}</span>
                  <ChevronRight className="w-4 h-4 opacity-30" />
                  <span className="opacity-70">
                    {viewStep === 'DETAIL' ? (t.locations_page.label_viewing_branch) : (t.locations_page.label_reserving_now)}
                  </span>
                </motion.div>
              </div>
            )
          }
        </section >
      </div >

      {/* No Bee Bot Floating Button as requested */}
    </div >
  );
};

export default LocationsPage;
