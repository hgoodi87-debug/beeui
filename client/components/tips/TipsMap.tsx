import React, { useEffect, useRef, useCallback } from "react";
import { motion } from "framer-motion";

interface TipsMapProps {
    lang: string;
    landmarks: any[];
    branches: any[];
    selectedId: string | null;
    onSelect: (item: any) => void;
    userLocation: { lat: number; lng: number } | null;
}

declare global {
    interface Window {
        naver: any;
    }
}

const TipsMap: React.FC<TipsMapProps> = React.memo(({
    lang, landmarks, branches, selectedId, onSelect, userLocation
}) => {
    const mapRef = useRef<any>(null);
    const markersRef = useRef<any[]>([]);
    const mapContainerRef = useRef<HTMLDivElement>(null);
    const [isMapReady, setIsMapReady] = React.useState(false);
    const hasInitialCentered = useRef(false);

    const updateMarkers = useCallback(() => {
        if (!mapRef.current || !window.naver || !window.naver.maps || !isMapReady) return;

        markersRef.current.forEach(m => m.setMap(null));
        markersRef.current = [];

        // 1. Landmark Markers (Spot)
        landmarks.forEach(spot => {
            if (!spot.coordinates) return;
            const isSelected = selectedId === spot.id;
            
            const content = `
                <div style="cursor: pointer; transform: scale(${isSelected ? 1.2 : 1}); transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);">
                    <div style="background: ${isSelected ? '#ffcb05' : 'rgba(0,0,0,0.8)'}; padding: 6px 14px; border-radius: 20px; border: 2px solid ${isSelected ? '#000' : '#ffcb05'}; box-shadow: 0 4px 15px rgba(0,0,0,0.4); white-space: nowrap;">
                        <span style="font-size: 11px; font-weight: 900; color: ${isSelected ? '#000' : '#fff'}; uppercase">${spot.title[lang] || spot.title['ko']}</span>
                    </div>
                    <div style="width: 2px; height: 8px; background: ${isSelected ? '#000' : '#ffcb05'}; margin: 0 auto; margin-top: -2px;"></div>
                </div>
            `;

            const marker = new window.naver.maps.Marker({
                position: new window.naver.maps.LatLng(spot.coordinates.lat, spot.coordinates.lng),
                map: mapRef.current,
                icon: {
                    content: content,
                    anchor: new window.naver.maps.Point(40, 30)
                },
                zIndex: isSelected ? 200 : 100
            });

            window.naver.maps.Event.addListener(marker, 'click', () => onSelect(spot));
            markersRef.current.push(marker);
        });

        // 2. Beeliber Branch Markers (Bee)
        branches.forEach(branch => {
            if (!branch.lat || !branch.lng) return;
            const isSelected = selectedId === branch.id;
            const isAirport = branch.type === 'AIRPORT';
            const markerFileName = isAirport ? 'Absolute_Airport_v22.svg' : 'Absolute_Bee_v21.svg';
            const markerUrl = `${window.location.origin}/images/markers/${markerFileName}`;

            const content = `
                <div style="cursor: pointer; opacity: ${isSelected ? 1 : 0.8}; transform: scale(${isSelected ? 1.1 : 0.9}); transition: all 0.3s;">
                    <img src="${markerUrl}" style="width: 48px; height: 80px; display: block; filter: ${isSelected ? 'drop-shadow(0 10px 15px rgba(0,0,0,0.5))' : 'none'};" />
                </div>
            `;

            const marker = new window.naver.maps.Marker({
                position: new window.naver.maps.LatLng(branch.lat, branch.lng),
                map: mapRef.current,
                icon: {
                    content: content,
                    anchor: new window.naver.maps.Point(24, 76)
                },
                zIndex: isSelected ? 300 : 150
            });

            window.naver.maps.Event.addListener(marker, 'click', () => onSelect(branch));
            markersRef.current.push(marker);
        });

        // 3. User Location Marker
        if (userLocation) {
            const travelerContent = `
                <div style="background: #fff; padding: 4px 10px; border-radius: 20px; border: 2px solid #ffcb05; box-shadow: 0 4px 10px rgba(0,0,0,0.3); animation: bounce 2s infinite;">
                    <span style="font-size: 10px; font-weight: 900; color: #000;">ME</span>
                </div>
            `;
            const userMarker = new window.naver.maps.Marker({
                position: new window.naver.maps.LatLng(userLocation.lat, userLocation.lng),
                map: mapRef.current,
                icon: {
                    content: travelerContent,
                    anchor: new window.naver.maps.Point(20, 20)
                },
                zIndex: 400
            });
            markersRef.current.push(userMarker);
        }
    }, [landmarks, branches, selectedId, lang, onSelect, userLocation, isMapReady]);

    const initMap = useCallback(() => {
        if (!mapContainerRef.current || !window.naver || !window.naver.maps || mapRef.current) return;

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
            background: '#000000',
            gl: true,
            customStyleId: "372d23ff-f7ac-40b3-a900-e4c4545a31e1"
        };

        mapRef.current = new window.naver.maps.Map(mapContainerRef.current, mapOptions);

        window.naver.maps.Event.addListener(mapRef.current, 'idle', () => {
            setIsMapReady(true);
        });
    }, [userLocation]);

    useEffect(() => {
        const clientId = import.meta.env.VITE_NAVER_MAP_CLIENT_ID || 'zbepfoglvy';
        const callbackName = 'initTipsMap';
        const url = `https://oapi.map.naver.com/openapi/v3/maps.js?ncpKeyId=${clientId}&submodules=geocoder,gl&callback=${callbackName}`;

        if (!(window as any).naver) {
            (window as any)[callbackName] = () => initMap();
            const script = document.createElement('script');
            script.src = url;
            script.async = true;
            document.head.appendChild(script);
        } else {
            initMap();
        }
    }, [initMap]);

    useEffect(() => {
        if (isMapReady) updateMarkers();
    }, [isMapReady, updateMarkers]);

    useEffect(() => {
        if (selectedId && mapRef.current) {
            const selectedItem = [...landmarks, ...branches].find(i => i.id === selectedId);
            if (selectedItem) {
                const lat = selectedItem.lat || selectedItem.coordinates?.lat;
                const lng = selectedItem.lng || selectedItem.coordinates?.lng;
                if (lat && lng) {
                    mapRef.current.panTo(new window.naver.maps.LatLng(lat, lng));
                    mapRef.current.setZoom(15);
                }
            }
        }
    }, [selectedId, landmarks, branches]);

    return (
        <div className="w-full h-full relative overflow-hidden bg-black">
            <div ref={mapContainerRef} className="w-full h-full opacity-80" />
            <div className="absolute inset-0 pointer-events-none bg-gradient-to-t from-black via-transparent to-black opacity-40" />
        </div>
    );
});

export default TipsMap;
