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
}

declare global {
    interface Window {
        naver: any;
    }
}

const LocationMap: React.FC<LocationMapProps> = ({
    t, lang, branches, selectedBranch, onLocationSelect, currentService, userLocation, searchAddress
}) => {
    const mapRef = useRef<any>(null);
    const markersRef = useRef<any[]>([]);
    const userMarkerRef = useRef<any>(null);
    const mapContainerRef = useRef<HTMLDivElement>(null);
    const [isMapReady, setIsMapReady] = React.useState(false);
    const hasInitialCentered = useRef(false);
    const searchMarkerRef = useRef<any>(null);

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

    // [스봉이 수정] userLocation fetch 로직 제거 (부모 컴포넌트에서 전달받음)

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
            const isActive = branch.services?.[serviceKey]?.isActive ?? true;

            const isAirport = branch.type === 'AIRPORT';
            const markerFileName = isAirport ? 'Absolute_Airport_v22.svg' : 'Absolute_Logo_v25.svg';
            const markerUrl = `${window.location.origin}/images/markers/${markerFileName}`;

            const markerOpacity = isActive ? 1 : 0.5;

            const content = `
                <div class="marker-container" style="position: relative; display: flex; flex-direction: column; align-items: center; cursor: pointer; transform: ${isSelected ? 'scale(1.2)' : 'scale(1)'}; opacity: ${markerOpacity};">
                    <img src="${markerUrl}" 
                        style="width: ${isSelected ? '100px' : '80px'}; height: ${isSelected ? '100px' : '80px'}; display: block; filter: ${isSelected ? 'drop-shadow(0 0 10px rgba(255, 203, 5, 0.4))' : 'none'}; transition: all 0.3s ease;"
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
                    anchor: new window.naver.maps.Point(isSelected ? 50 : 40, isSelected ? 92 : 72)
                },
                zIndex: isSelected ? 100 : 10
            });

            window.naver.maps.Event.addListener(marker, 'click', () => {
                onLocationSelect(branch);
            });

            markersRef.current.push(marker);
        });
    }, [branches, selectedBranch, currentService, lang, onLocationSelect, isMapReady]);

    // [스봉이 수정] 지점 선택 시 지도 이동 로직 전담 ( panTo로 부드럽게~ 💅 )
    useEffect(() => {
        if (selectedBranch && selectedBranch.lat && selectedBranch.lng && mapRef.current && isMapReady) {
            console.log("Auto-centering on selected branch:", selectedBranch.name);
            const moveLatLon = new window.naver.maps.LatLng(selectedBranch.lat, selectedBranch.lng);
            mapRef.current.panTo(moveLatLon);
            mapRef.current.setZoom(16, true);
        }
    }, [selectedBranch, isMapReady]);

    // [스봉이] 사용자 위치 마커 관리 및 최초 센터링 전담 Effect
    useEffect(() => {
        if (!mapRef.current || !window.naver || !isMapReady || !userLocation) {
            return;
        }

        // 1. 사용자 마커(꿀벌) 생성 및 위치 업데이트
        if (userMarkerRef.current) {
            userMarkerRef.current.setPosition(new window.naver.maps.LatLng(userLocation.lat, userLocation.lng));
        } else {
            console.log("[스봉이] Creating user marker... 🐝");
            const beeUrl = `${window.location.origin}/images/markers/Absolute_Bee_v21.svg`;
            const beeContent = `
                <div style="position: relative; display: flex; flex-direction: column; align-items: center;">
                    <img src="${beeUrl}" style="width: 52px; height: 52px; filter: drop-shadow(0 4px 6px rgba(0,0,0,0.3)); animation: bounce 2s infinite;" alt="Me" />
                    <div style="background: #ffffff; padding: 2px 10px; border-radius: 20px; border: 1.5px solid #ffcb05; margin-top: -8px; box-shadow: 0 4px 10px rgba(0,0,0,0.15); z-index: 10;">
                        <span style="font-size: 11px; font-weight: 900; color: #000; letter-spacing: -0.02em;">ME</span>
                    </div>
                </div>
            `;
            userMarkerRef.current = new window.naver.maps.Marker({
                position: new window.naver.maps.LatLng(userLocation.lat, userLocation.lng),
                map: mapRef.current,
                icon: {
                    content: beeContent,
                    anchor: new window.naver.maps.Point(26, 44)
                },
                zIndex: 200
            });
        }

        // 2. 최초 사용자 위치 센터링 (사장님 요청: 접속 시 무조건 내 위치로!)
        // selectedBranch가 없을 때만 자동 센터링하여 사용자의 선택을 존중합니다.
        if (!hasInitialCentered.current && !selectedBranch) {
            console.log("[스봉이] Force centering on user location... 🐝✨");
            mapRef.current.setCenter(new window.naver.maps.LatLng(userLocation.lat, userLocation.lng));
            mapRef.current.setZoom(14, true);
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

        setIsMapReady(false); // [스봉이] 초기화 시작 시 상태 리셋 💅

        if (mapRef.current) return; // 중복 방지

        const mapOptions = {
            center: userLocation
                ? new window.naver.maps.LatLng(userLocation.lat, userLocation.lng)
                : new window.naver.maps.LatLng(37.5665, 126.9780),
            zoom: userLocation ? 14 : 12,
            minZoom: 10,

            // [UI 정비] 군더더기 없는 프리미엄 레이아웃 💅
            mapTypeControl: false,
            zoomControl: false,
            logoControl: true, // 법적 필수 노출
            logoControlOptions: {
                position: window.naver.maps.Position.BOTTOM_RIGHT
            },
            scaleControl: false,
            mapDataControl: false,

            // [GL 엔진 & 스타일] 사장님이 강조하신 커스텀 스타일 완벽 이식 🔥
            // gl: true일 때 customStyleId가 효력을 발휘합니다.
            /* @ts-ignore */
            gl: true,
            /* @ts-ignore */
            customStyleId: '372d23ff-f7ac-40b3-a900-e4c4545a31e1',
            mapTypeId: window.naver.maps.MapTypeId.NORMAL,

            // [UX] 부드러운 성능 보강
            tileTransition: true,
            tileDuration: 500
        };

        console.log("[스봉이] Naver Map SDK Detected. GL Engine & Custom Style Loading... ✨💅");

        try {
            mapRef.current = new window.naver.maps.Map(mapContainerRef.current, mapOptions);

            window.naver.maps.Event.addListener(mapRef.current, 'click', () => {
                onLocationSelect(null);
            });

            // 지도가 준비됐을 때 (idle 이벤트) 마커 등 후속 작업 진행
            window.naver.maps.Event.addListener(mapRef.current, 'idle', () => {
                setIsMapReady(true);
            });
        } catch (error) {
            console.error("[스봉이] 지도 초기화 중 사고 발생! 🚨", error);
        }
    }, [userLocation, onLocationSelect]); // userLocation 변경 시 초기 위치 반영을 위해 dependency 유지 (최초 1회만 되도록 로직 보강됨)

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

        console.log(`[스봉이] Naver Map Lang Syncing... Target: ${naverLang} 💅`);

        const scriptId = 'naver-map-sdk'; // index.html과 동일한 ID 사용
        const url = `https://oapi.map.naver.com/openapi/v3/maps.js?ncpKeyId=f3gsmqhjcn&submodules=geocoder,gl,mapstyle&language=${naverLang}&mapStyleId=372d23ff-f7ac-40b3-a900-e4c4545a31e1&ver=202602181600`;

        const initOrReload = () => {
            // 이미 SDK가 있고 언어도 맞다면 재로드하지 않음 (단, URL에 언어 파라미터가 포함되어 있어야 함)
            const script = document.getElementById(scriptId) as HTMLScriptElement;
            if (window.naver && window.naver.maps && script && script.src.includes(`language=${naverLang}`)) {
                console.log(`[스봉이] SDK already matches language (${naverLang}), directly init. ✨`);
                initMap();
                return;
            }

            // 언어가 다르거나 SDK가 없으면 교체
            console.log(`[스봉이] Updating Map SDK for language: ${naverLang} 🧹`);

            if (script) script.remove();

            // 주의: window.naver를 완전히 delete하면 다른 곳에서 참조 오류가 날 수 있으므로 
            // 새로운 스크립트 로드 후 자연스럽게 덮어씌워지게 합니다.

            const newScript = document.createElement('script');
            newScript.id = scriptId;
            newScript.type = 'text/javascript';
            newScript.src = url;
            newScript.async = true;

            newScript.onload = () => {
                console.log(`[스봉이] Naver Map SDK (${naverLang}) Freshly Loaded! ✨`);
                setTimeout(() => initMap(), 100);
            };

            document.head.appendChild(newScript);
        };

        initOrReload();
    }, [lang, initMap]);

    // Update Markers when Data Changes (Only if map is ready)
    useEffect(() => {
        if (isMapReady && mapRef.current) {
            updateMarkers();
        }
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

            {/* [스봉이] 내 위치 센터링 버튼 (프리미엄 💅 - 사장님 요청 위치 상향 조정) */}
            <div className="absolute top-[160px] md:top-6 right-6 z-[60] flex flex-col gap-3">
                <button
                    onClick={() => {
                        if (userLocation && mapRef.current) {
                            mapRef.current.setCenter(new window.naver.maps.LatLng(userLocation.lat, userLocation.lng));
                            mapRef.current.setZoom(15, true);
                        } else {
                            alert("GPS를 불러오는 중이거나 권한이 필요해요! 🐝");
                        }
                    }}
                    className="w-10 h-10 md:w-12 md:h-12 bg-white/95 backdrop-blur-xl border border-gray-200 shadow-2xl rounded-xl flex items-center justify-center text-bee-yellow hover:scale-110 active:scale-95 transition-all duration-300 group"
                    title="Find Me"
                >
                    <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5 md:w-5 md:h-5 stroke-[2.5]" stroke="currentColor">
                        <path d="M12 21V19M12 5V3M12 12L12.01 12M5 12H3M21 12H19M12 17C9.23858 17 7 14.7614 7 12C7 9.23858 9.23858 7 12 7C14.7614 7 17 9.23858 17 12C17 14.7614 14.7614 17 12 17Z" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    <div className="absolute top-full right-0 mt-2 bg-black/80 text-white text-[10px] font-bold px-3 py-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none shadow-xl">
                        MY LOCATION 🐝
                    </div>
                </button>
            </div>

        </div>
    );
};

export default LocationMap;
