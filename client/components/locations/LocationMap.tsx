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
    // [스봉이 추가] 쬴명적 '내 위치' 지도 이동 트리거 폄로트 💅
    panToUserTrigger?: number;
}

declare global {
    interface Window {
        naver: any;
    }
}

// [스봉이] 지도 컴포넌트 안정화 (React.memo 적용) 💅
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

    // [스봉이 추가] 주소 검색 및 지도 이동 로직 💅
    useEffect(() => {
        if (!searchAddress || !mapRef.current || !window.naver || !window.naver.maps || !window.naver.maps.Service || !isMapReady) return;

        console.log(`[스봉이] 주소 검색 시작: ${searchAddress} 💅`);

        window.naver.maps.Service.geocode({
            query: searchAddress
        }, (status: any, response: any) => {
            if (status !== window.naver.maps.Service.Status.OK) {
                console.error("[스봉이] 주소 검색 실패! 또는 검색 결과 없음. 🙄", status);
                return;
            }

            const result = response.v2.addresses[0];
            if (!result) return;

            const latLng = new window.naver.maps.LatLng(result.y, result.x);

            console.log(`[스봉이] 검색 성공! 이동합니다: ${result.roadAddress} ✨`);
            mapRef.current.panTo(latLng);
            mapRef.current.setZoom(15);

            // 검색 지점 표시 (기존 검색 마커 있으면 제거)
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
    }, [searchAddress, isMapReady]);

    // [스봉이 추가] '내 위치' 버튼 명시적 클릭 시 지도를 강제이동하는 Effect 💅
    useEffect(() => {
        if (!panToUserTrigger || panToUserTrigger === prevPanTrigger.current) return;
        prevPanTrigger.current = panToUserTrigger;

        if (!mapRef.current || !window.naver || !isMapReady || !userLocation) return;

        console.log("[스봉이] 내 위치 버튼 클릭! 지도 정중앙으로 이동! 💅");
        mapRef.current.setZoom(16, false);
        const userLatLon = new window.naver.maps.LatLng(userLocation.lat, userLocation.lng);
        mapRef.current.panTo(userLatLon);
    }, [panToUserTrigger, isMapReady, userLocation]);


    const updateMarkers = useCallback(() => {
        if (!mapRef.current || !window.naver || !window.naver.maps || !isMapReady) {
            console.log("[스봉이] Map or Naver SDK not ready for markers... 🐢");
            return;
        }

        // [스봉이] 마커 업데이트 전 기존 마커 제거
        markersRef.current.forEach(m => m.setMap(null));
        markersRef.current = [];

        console.log(`[스봉이] Drawing ${branches.length} markers... 📍`);

        // 1. Branch Markers
        branches.forEach(branch => {
            const isSelected = selectedBranch?.id === branch.id;
            const serviceKey = currentService === 'STORAGE' ? 'STORAGE' : 'DELIVERY';
            const isActive = branch.isActive !== false;

            const isAirport = branch.type === 'AIRPORT';
            // [스봉이 수정] 일반 지점은 빨간 핀(Absolute_Bee_v21.svg)으로 교체 💅
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
                    // [스봉이 정밀 수정] SVG ViewBox(60x100)의 핀 끝점(30, 95)에 정확히 앵커를 꽂습니다. 60:100 비율 유지! ✨
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

    // [스봉이 수정] 지점 선택 시 지도 이동 로직 - 마커가 화면 정중앙에 오도록 직접 panTo 💅
    useEffect(() => {
        if (selectedBranch && selectedBranch.lat && selectedBranch.lng && mapRef.current && isMapReady) {
            console.log("Auto-centering on selected branch:", selectedBranch.name);
            const moveLatLon = new window.naver.maps.LatLng(selectedBranch.lat, selectedBranch.lng);
            mapRef.current.setZoom(16, false);
            mapRef.current.panTo(moveLatLon);
        }
    }, [selectedBranch, isMapReady]);

    // [스봉이] 사용자 위치 마커 관리 및 최초 센터링 전담 Effect
    useEffect(() => {
        if (!mapRef.current || !window.naver || !isMapReady || !userLocation) {
            return;
        }

        // 1. 사용자 마커(내 위치) 생성 및 위치 업데이트
        if (userMarkerRef.current) {
            userMarkerRef.current.setPosition(new window.naver.maps.LatLng(userLocation.lat, userLocation.lng));
        } else {
            console.log("[스봉이] Creating sleek 'ME' marker... 💅✨");
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
                    anchor: new window.naver.maps.Point(22, 28) // 'ME' 쉴드와 꼬리 부분 중앙 앵커 💅
                },
                zIndex: 200
            });
        }

        // 2. 최초 사용자 위치 센터링 - 마커가 정중앙에 오도록 직접 panTo 💅
        if (!hasInitialCentered.current && !selectedBranch) {
            console.log("[스봉이] Smooth centering on user location... 🐝✨");
            mapRef.current.setZoom(14, false);
            const userLatLon = new window.naver.maps.LatLng(userLocation.lat, userLocation.lng);
            mapRef.current.panTo(userLatLon);
            hasInitialCentered.current = true;
        }
    }, [userLocation, isMapReady, selectedBranch]);

    // [스봉이] 공식 문서 학습 기반 Map 초기화 로직 (고급스럽게~ 💅)
    // Ref: https://navermaps.github.io/maps.js.ncp/docs/naver.maps.html#.MapOptions
    const initMap = useCallback(() => {
        if (!mapContainerRef.current || !window.naver || !window.naver.maps) {
            console.log("[스봉이] Naver SDK or Container not ready... 🐢");
            return;
        }

        if (mapRef.current) {
            console.log("[스봉이] Map already exists, skipping init. 💅");
            return;
        }

        const initialCenter = userLocation
            ? new window.naver.maps.LatLng(userLocation.lat, userLocation.lng)
            : new window.naver.maps.LatLng(37.5665, 126.9780);

        const mapOptions = {
            center: initialCenter,
            zoom: userLocation ? 14 : 12,
            minZoom: 10,

            // [UI 정비] 군더더기 없는 프리미엄 레이아웃 💅
            mapTypeControl: false,
            zoomControl: false,
            logoControl: true,
            logoControlOptions: {
                position: window.naver.maps.Position.BOTTOM_RIGHT
            },
            scaleControl: false,
            mapDataControl: false,

            background: '#F8F9FA',
            // [스봉이 정밀 복구] GL 엔진과 스타일 ID가 찰떡같이 붙도록 둘 다 설정해 드릴게요! 💅
            gl: true,
            mapTypeId: window.naver.maps.MapTypeId.NORMAL,
            /* @ts-ignore */
            customStyleId: "372d23ff-f7ac-40b3-a900-e4c4545a31e1",
            /* @ts-ignore */
            mapStyleId: "372d23ff-f7ac-40b3-a900-e4c4545a31e1"
        };

        console.log("[스봉이] Naver Map SDK Detected. GL Engine & Custom Style Loading... ✨💅");

        try {
            mapRef.current = new window.naver.maps.Map(mapContainerRef.current, mapOptions);

            window.naver.maps.Event.addListener(mapRef.current, 'click', () => {
                onLocationSelect(null);
            });

            window.naver.maps.Event.addListener(mapRef.current, 'idle', () => {
                setIsMapReady(true);
                console.log("[스봉이] Map is Idle and Ready. 📍");
            });
        } catch (error) {
            console.error("[스봉이] 지도 초기화 중 대참사 발생! 🚨", error);
        }
    }, [onLocationSelect]); // userLocation 의존성 제거 (init 시에만 사용) 💅

    // [스봉이 수정] Naver 지도 다국어 동적 로더 (정교하게 개선 💅)
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
        // [스봉이 수정] 공식 가이드라인에 따라 ncpKeyId를 사용하고 스타일 ID 파라미터까지 완벽하게 전송! 💅
        const url = `https://oapi.map.naver.com/openapi/v3/maps.js?ncpKeyId=${clientId}&submodules=geocoder,gl&mapStyleId=${targetStyleId}&language=${naverLang}&callback=${callbackName}`;

        const loadScript = () => {
            const existingScript = document.getElementById(scriptId) as HTMLScriptElement;

            // [스봉이 임무 완수] 이미 똑같은 설정으로 로드된 스크립트가 있는지 꼼꼼하게 체크! 💅
            if (existingScript) {
                if (existingScript.src.includes(clientId) &&
                    existingScript.src.includes(`language=${naverLang}`) &&
                    (existingScript.src.includes(`mapStyleId=${targetStyleId}`) || existingScript.src.includes(`ncpKeyId=${clientId}`))) {
                    console.log("[스봉이] Naver Map SDK already loaded with correct params. Skipping reload. ☕");
                    if (window.naver && window.naver.maps) {
                        initMap();
                    }
                    return;
                }
                // 설정이 다르면 과감하게 제거하고 새로 깔아야죠!
                existingScript.remove();
                if ((window as any)[callbackName]) delete (window as any)[callbackName];
            }

            // 글로벌 콜백 등록 (네이버 인증 후 실행됨 💅)
            (window as any)[callbackName] = () => {
                console.log(`[스봉이] Naver Map SDK (${naverLang}) Authenticated & Loaded! ✨`);
                initMap();
            };

            const newScript = document.createElement('script');
            newScript.id = scriptId;
            newScript.type = 'text/javascript';
            newScript.src = url;
            newScript.async = true;
            document.head.appendChild(newScript);
        };

        loadScript();
    }, [lang, initMap]);

    // [스봉이] 마커 업데이트 - 지도가 정말로 준비되었을 때만! 💅
    useEffect(() => {
        let timer: any;
        if (isMapReady && mapRef.current && window.naver && window.naver.maps) {
            // 미세한 타이밍 이슈 방지를 위해 100ms 지연 💅
            timer = setTimeout(() => {
                updateMarkers();
            }, 100);
        }
        return () => clearTimeout(timer);
    }, [isMapReady, updateMarkers]);

    return (
        <div className="relative w-full h-full bg-gray-50 min-h-[400px]">
            <div ref={mapContainerRef} className="w-full h-full" id="naver-map-element" />

            {/* Map UI Overlays */}
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
