import React, { useEffect, useRef, useState } from 'react';

interface DwMiniMapProps {
    branches: any[];
    selectedId?: string;
    onSelect: (id: string) => void;
}

declare global {
    interface Window { L: any; }
}

const LEAFLET_CSS = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
const LEAFLET_JS = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';

const ensureLeaflet = (): Promise<void> =>
    new Promise((resolve, reject) => {
        if (typeof window === 'undefined') return reject(new Error('SSR'));
        if (window.L) return resolve();

        // CSS
        if (!document.querySelector(`link[href="${LEAFLET_CSS}"]`)) {
            const link = document.createElement('link');
            link.rel = 'stylesheet';
            link.href = LEAFLET_CSS;
            document.head.appendChild(link);
        }

        // JS
        const existing = document.querySelector(`script[src="${LEAFLET_JS}"]`) as HTMLScriptElement | null;
        if (existing) {
            existing.addEventListener('load', () => resolve());
            existing.addEventListener('error', () => reject(new Error('leaflet load fail')));
            if (window.L) resolve();
            return;
        }
        const s = document.createElement('script');
        s.src = LEAFLET_JS;
        s.async = true;
        s.onload = () => resolve();
        s.onerror = () => reject(new Error('leaflet error'));
        document.head.appendChild(s);
    });

/** 경량 OSM 지도 — Leaflet CDN, API 키 불필요 */
const DwMiniMap: React.FC<DwMiniMapProps> = ({ branches, selectedId, onSelect }) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const mapRef = useRef<any>(null);
    const markersRef = useRef<Map<string, any>>(new Map());
    const [ready, setReady] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let cancelled = false;
        ensureLeaflet()
            .then(() => {
                if (cancelled || !containerRef.current || !window.L) return;
                const L = window.L;
                const first = branches.find((b) => b.lat && b.lng);
                const center: [number, number] = first ? [first.lat, first.lng] : [37.5665, 126.978];
                mapRef.current = L.map(containerRef.current, {
                    center,
                    zoom: 13,
                    zoomControl: true,
                    attributionControl: false,
                    preferCanvas: true, // 다수 마커 시 canvas 가속
                });
                L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png', {
                    maxZoom: 19,
                    subdomains: 'abcd',
                }).addTo(mapRef.current);
                setReady(true);
            })
            .catch((e) => {
                console.warn('[DwMiniMap] leaflet 로드 실패', e);
                setError('지도를 불러올 수 없습니다');
            });
        return () => {
            cancelled = true;
            if (mapRef.current) {
                mapRef.current.remove();
                mapRef.current = null;
            }
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // 마커 동기화
    useEffect(() => {
        if (!ready || !mapRef.current || !window.L) return;
        const L = window.L;

        markersRef.current.forEach((m) => m.remove());
        markersRef.current.clear();

        const valid = branches.filter((b) => b?.lat && b?.lng && b?.id);
        if (valid.length === 0) return;

        valid.forEach((b) => {
            const isSel = b.id === selectedId;
            const size = isSel ? 28 : 22;
            const icon = L.divIcon({
                className: 'dw-mini-marker',
                html: `<div style="width:${size}px;height:${size}px;border-radius:50%;background:${isSel ? '#111' : '#FFC700'};border:2px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,0.3);display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:900;color:${isSel ? '#FFC700' : '#111'};">●</div>`,
                iconSize: [size, size],
                iconAnchor: [size / 2, size / 2],
            });
            const marker = L.marker([b.lat, b.lng], { icon }).addTo(mapRef.current);
            marker.on('click', () => onSelect(b.id));
            markersRef.current.set(b.id, marker);
        });

        if (valid.length >= 2) {
            const bounds = L.latLngBounds(valid.map((b) => [b.lat, b.lng]));
            mapRef.current.fitBounds(bounds, { padding: [40, 40] });
        } else {
            const only = valid[0];
            mapRef.current.setView([only.lat, only.lng], 14);
        }
    }, [ready, branches, selectedId, onSelect]);

    if (error) {
        return (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%', color: '#999', fontSize: 13, fontWeight: 700 }}>
                {error}
            </div>
        );
    }

    return <div ref={containerRef} style={{ width: '100%', height: '100%', background: '#F4F4F0' }} />;
};

export default React.memo(DwMiniMap);
