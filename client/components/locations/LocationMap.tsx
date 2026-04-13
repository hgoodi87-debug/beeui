import React, { useEffect, useRef, useCallback } from "react";
import { motion } from "framer-motion";

interface LocationMapProps {
    t: any;
    lang: string;
    branches: any[];
    selectedBranch: any;
    onLocationSelect: (branch: any) => void;
    currentService: 'SAME_DAY' | 'SCHEDULED' | 'STORAGE';
    userLocation: { lat: number; lng: number } | null;
    searchAddress?: string;
    panToUserTrigger?: number;
}

declare global {
    interface Window {
        naver: any;
    }
}

const LocationMap: React.FC<LocationMapProps> = React.memo(({
    t, lang, branches, selectedBranch, onLocationSelect, currentService, userLocation, searchAddress, panToUserTrigger
}) => {
    const mapRef = useRef<any>(null);
    const markersRef = useRef<any[]>([]);
    const userMarkerRef = useRef<any>(null);
    const mapContainerRef = useRef<HTMLDivElement>(null);
    const [isMapReady, setIsMapReady] = React.useState(false);
    const hasInitialCentered = useRef(false);
    const searchMarkerRef = useRef<any>(null);
    const prevPanTrigger = useRef(panToUserTrigger ?? 0);

    useEffect(() => {
        // 검색어 지우면 마커 제거
        if (!searchAddress) {
            if (searchMarkerRef.current) {
                searchMarkerRef.current.setMap(null);
                searchMarkerRef.current = null;
            }
            return;
        }
        if (!mapRef.current || !window.naver?.maps || !isMapReady) return;

        // 1순위: 필터된 지점 중 좌표가 있는 첫 번째 지점으로 바로 이동
        const firstBranch = branches.find(b => b.lat && b.lng);
        if (firstBranch) {
            if (searchMarkerRef.current) {
                searchMarkerRef.current.setMap(null);
                searchMarkerRef.current = null;
            }
            const latLng = new window.naver.maps.LatLng(firstBranch.lat, firstBranch.lng);
            mapRef.current.panTo(latLng);
            mapRef.current.setZoom(15);
            return;
        }

        // 2순위: 매칭 지점 없을 때만 지오코더로 폴백
        if (!window.naver.maps.Service) return;

        window.naver.maps.Service.geocode({
            query: searchAddress
        }, (status: any, response: any) => {
            if (status !== window.naver.maps.Service.Status.OK) {
                console.error("[LocationMap] 주소 검색 실패:", status);
                return;
            }

            const result = response.v2.addresses[0];
            if (!result) return;

            const latLng = new window.naver.maps.LatLng(result.y, result.x);
            mapRef.current.panTo(latLng);
            mapRef.current.setZoom(15);

            if (searchMarkerRef.current) searchMarkerRef.current.setMap(null);

            searchMarkerRef.current = new window.naver.maps.Marker({
                position: latLng,
                map: mapRef.current,
                icon: {
                    content: `
                        <div style="background: rgba(255, 203, 5, 0.2); border: 2px solid #ffcb05; border-radius: 50%; width: 44px; height: 44px; display: flex; align-items: center; justify-content: center; animation: pulse 2s infinite;">
                            <div style="background: #ffcb05; width: 12px; height: 12px; border-radius: 50%; border: 2px solid white; box-shadow: 0 0 10px rgba(0,0,0,0.2);"></div>
                        </div>
                    `,
                    anchor: new window.naver.maps.Point(22, 22)
                },
                zIndex: 150
            });
        });
    }, [searchAddress, branches, isMapReady]);

    useEffect(() => {
        if (!panToUserTrigger || panToUserTrigger === prevPanTrigger.current) return;
        prevPanTrigger.current = panToUserTrigger;

        if (!mapRef.current || !window.naver || !isMapReady || !userLocation) return;

        mapRef.current.setZoom(16, false);
        const userLatLon = new window.naver.maps.LatLng(userLocation.lat, userLocation.lng);
        mapRef.current.panTo(userLatLon);
    }, [panToUserTrigger, isMapReady, userLocation]);

    const updateMarkers = useCallback(() => {
        if (!mapRef.current || !window.naver || !window.naver.maps || !isMapReady) return;

        markersRef.current.forEach(m => m.setMap(null));
        markersRef.current = [];

        branches.forEach(branch => {
            const isSelected = selectedBranch?.id === branch.id;
            const isActive = branch.isActive !== false;
            const isAirport = branch.type === 'AIRPORT';
            const markerFileName = isAirport ? 'Absolute_Airport_v22.svg' : 'Absolute_Bee_v21.svg';
            const markerUrl = `${window.location.origin}/images/markers/${markerFileName}`;
            const markerOpacity = isActive ? 1 : 0.5;

            const content = `
                <div class="marker-container" style="position: relative; display: flex; flex-direction: column; align-items: center; cursor: pointer; opacity: ${markerOpacity};">
                    <img src="${markerUrl}"
                        style="width: ${isSelected ? '60px' : '48px'}; height: ${isSelected ? '100px' : '80px'}; display: block; filter: ${isSelected ? 'drop-shadow(0 10px 15px rgba(0,0,0,0.3))' : 'none'}; transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);"
                        alt="marker"
                    />
                </div>
            `;

            if (!branch.lat || !branch.lng) return;
            if (!window.naver.maps || !window.naver.maps.Marker) return;

            const marker = new window.naver.maps.Marker({
                position: new window.naver.maps.LatLng(branch.lat, branch.lng),
                map: mapRef.current,
                icon: {
                    content: content,
                    anchor: new window.naver.maps.Point(isSelected ? 30 : 24, isSelected ? 95 : 76)
                },
                zIndex: isSelected ? 100 : 10
            });

            window.naver.maps.Event.addListener(marker, 'click', () => {
                onLocationSelect(branch);
            });

            markersRef.current.push(marker);
        });
    }, [branches, selectedBranch, currentService, lang, onLocationSelect, isMapReady]);

    useEffect(() => {
        if (selectedBranch && selectedBranch.lat && selectedBranch.lng && mapRef.current && isMapReady && window.naver?.maps) {
            const moveLatLon = new window.naver.maps.LatLng(selectedBranch.lat, selectedBranch.lng);
            mapRef.current.setZoom(16, false);
            mapRef.current.panTo(moveLatLon);
        }
    }, [selectedBranch, isMapReady]);

    useEffect(() => {
        if (!mapRef.current || !window.naver || !isMapReady || !userLocation) return;

        if (userMarkerRef.current) {
            userMarkerRef.current.setPosition(new window.naver.maps.LatLng(userLocation.lat, userLocation.lng));
        } else {
            const travelerContent = `
                <div style="position: relative; display: flex; flex-direction: column; align-items: center;">
                    <div style="background: #ffffff; padding: 4px 12px; border-radius: 20px; border: 2px solid #ffcb05; box-shadow: 0 4px 12px rgba(0,0,0,0.2); z-index: 10; animation: bounce 2s infinite;">
                        <span style="font-size: 13px; font-weight: 900; color: #000; letter-spacing: 0.05em;">ME</span>
                    </div>
                    <div style="width: 2px; height: 6px; background: #ffcb05; margin-top: -1px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);"></div>
                </div>
            `;
            userMarkerRef.current = new window.naver.maps.Marker({
                position: new window.naver.maps.LatLng(userLocation.lat, userLocation.lng),
                map: mapRef.current,
                icon: {
                    content: travelerContent,
                    anchor: new window.naver.maps.Point(22, 28)
                },
                zIndex: 200
            });
        }

        if (!hasInitialCentered.current && !selectedBranch) {
            mapRef.current.setZoom(14, false);
            const userLatLon = new window.naver.maps.LatLng(userLocation.lat, userLocation.lng);
            mapRef.current.panTo(userLatLon);
            hasInitialCentered.current = true;
        }
    }, [userLocation, isMapReady, selectedBranch]);

    const initMap = useCallback(() => {
        if (!mapContainerRef.current || !window.naver || !window.naver.maps) return;
        if (mapRef.current) return;

        const initialCenter = userLocation
            ? new window.naver.maps.LatLng(userLocation.lat, userLocation.lng)
            : new window.naver.maps.LatLng(37.5665, 126.9780);

        const mapOptions = {
            center: initialCenter,
            zoom: userLocation ? 14 : 12,
            minZoom: 10,
            mapTypeControl: false,
            zoomControl: false,
            logoControl: true,
            logoControlOptions: {
                position: window.naver.maps.Position.BOTTOM_RIGHT
            },
            scaleControl: false,
            mapDataControl: false,
            background: '#F8F9FA',
            gl: true,
            mapTypeId: window.naver.maps.MapTypeId.NORMAL,
            /* @ts-ignore */
            customStyleId: "372d23ff-f7ac-40b3-a900-e4c4545a31e1",
            /* @ts-ignore */
            mapStyleId: "372d23ff-f7ac-40b3-a900-e4c4545a31e1"
        };

        try {
            mapRef.current = new window.naver.maps.Map(mapContainerRef.current, mapOptions);

            window.naver.maps.Event.addListener(mapRef.current, 'click', () => {
                onLocationSelect(null);
            });

            window.naver.maps.Event.addListener(mapRef.current, 'idle', () => {
                setIsMapReady(true);
            });
        } catch (error) {
            console.error("[LocationMap] 지도 초기화 실패:", error);
        }
    }, [onLocationSelect]);

    useEffect(() => {
        const naverLang = {
            'ko': 'ko',
            'en': 'en',
            'ja': 'ja',
            'zh': 'zh',
            'zh-CN': 'zh',
            'zh-TW': 'zh',
            'zh-HK': 'zh'
        }[lang] || 'ko';

        const scriptId = 'naver-map-sdk';
        const clientId = import.meta.env.VITE_NAVER_MAP_CLIENT_ID || 'zbepfoglvy';
        const callbackName = 'initNaverMapAfterLoad';
        const targetStyleId = "372d23ff-f7ac-40b3-a900-e4c4545a31e1";
        const url = `https://oapi.map.naver.com/openapi/v3/maps.js?ncpKeyId=${clientId}&submodules=geocoder,gl&mapStyleId=${targetStyleId}&language=${naverLang}&callback=${callbackName}`;

        const loadScript = () => {
            const existingScript = document.getElementById(scriptId) as HTMLScriptElement;

            if (existingScript) {
                if (existingScript.src.includes(clientId) &&
                    existingScript.src.includes(`language=${naverLang}`) &&
                    (existingScript.src.includes(`mapStyleId=${targetStyleId}`) || existingScript.src.includes(`ncpKeyId=${clientId}`))) {
                    if (window.naver && window.naver.maps) initMap();
                    return;
                }
                existingScript.remove();
                if ((window as any)[callbackName]) delete (window as any)[callbackName];
            }

            (window as any)[callbackName] = () => { initMap(); };

            const newScript = document.createElement('script');
            newScript.id = scriptId;
            newScript.type = 'text/javascript';
            newScript.src = url;
            newScript.async = true;
            document.head.appendChild(newScript);
        };

        loadScript();
    }, [lang, initMap]);

    useEffect(() => {
        let timer: any;
        if (isMapReady && mapRef.current && window.naver && window.naver.maps) {
            timer = setTimeout(() => { updateMarkers(); }, 100);
        }
        return () => clearTimeout(timer);
    }, [isMapReady, updateMarkers]);

    return (
        <div className="relative w-full h-full bg-gray-50 min-h-[400px]">
            <div ref={mapContainerRef} className="w-full h-full" id="naver-map-element" />
            <div className="absolute top-6 left-6 z-10 hidden md:flex flex-col gap-2">
                <div className="px-4 py-2 bg-white/90 backdrop-blur-xl border border-gray-100 shadow-lg rounded-2xl flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-bee-yellow animate-pulse" />
                    <span className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em]">Real-time Status Active</span>
                </div>
            </div>
        </div>
    );
});

export default LocationMap;
