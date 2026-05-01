import React, { lazy, Suspense, useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ServiceType } from '../types';

const DwMiniMap = lazy(() => import('./DwMiniMap'));

/**
 * 데스크탑 예약 위젯 (목업 dwModal 이식)
 * - 3-step 흐름: 일정&가방 → 지점선택 → 결제
 * - 모바일은 BookingFlowModal 미노출 (md:이상 only)
 * - 결제 로직: 추후 PayPal/Toss 연결 (현재 onSuccess 콜백으로 위임)
 */

interface MockupBookingFlowProps {
    open: boolean;
    onClose: () => void;
    locations: any[];
    initialServiceType?: ServiceType;
    initialLocationId?: string;
    onSuccess: (booking: any) => void | Promise<void>;
    user?: any;
    lang?: string;
}

type LangKey = 'ko' | 'en' | 'ja' | 'zh' | 'zh-TW' | 'zh-HK';

// 다국어 지역 키워드 — 검색·필터·표시에 모두 사용
interface RegionKeyword {
    id: string;
    ko: string;
    en: string;
    ja: string;
    zh: string;     // 간체
    zhTW?: string;  // 번체 (없으면 zh 사용)
}

const REGION_KEYWORDS: RegionKeyword[] = [
    { id: 'hongdae',    ko: '홍대',   en: 'Hongdae',    ja: '弘大',   zh: '弘大' },
    { id: 'myeongdong', ko: '명동',   en: 'Myeongdong', ja: '明洞',   zh: '明洞' },
    { id: 'gangnam',    ko: '강남',   en: 'Gangnam',    ja: '江南',   zh: '江南' },
    { id: 'itaewon',    ko: '이태원', en: 'Itaewon',    ja: '梨泰院', zh: '梨泰院' },
    { id: 'jongno',     ko: '종로',   en: 'Jongno',     ja: '鍾路',   zh: '钟路', zhTW: '鍾路' },
    { id: 'seongsu',    ko: '성수',   en: 'Seongsu',    ja: '聖水',   zh: '圣水', zhTW: '聖水' },
    { id: 'dongdaemun', ko: '동대문', en: 'Dongdaemun', ja: '東大門', zh: '东大门', zhTW: '東大門' },
    { id: 'yongsan',    ko: '용산',   en: 'Yongsan',    ja: '龍山',   zh: '龙山', zhTW: '龍山' },
    { id: 'haeundae',   ko: '해운대', en: 'Haeundae',   ja: '海雲台', zh: '海云台', zhTW: '海雲台' },
    { id: 'gimhae',     ko: '김해',   en: 'Gimhae',     ja: '金海',   zh: '金海' },
    { id: 'jamsil',     ko: '잠실',   en: 'Jamsil',     ja: '蚕室',   zh: '蚕室', zhTW: '蠶室' },
    { id: 'sinchon',    ko: '신촌',   en: 'Sinchon',    ja: '新村',   zh: '新村' },
    { id: 'apgujeong',  ko: '압구정', en: 'Apgujeong',  ja: '狎鴎亭', zh: '狎鸥亭', zhTW: '狎鷗亭' },
    { id: 'gwanghwamun', ko: '광화문', en: 'Gwanghwamun', ja: '光化門', zh: '光化门', zhTW: '光化門' },
    { id: 'seoul-stn',  ko: '서울역', en: 'Seoul Station', ja: 'ソウル駅', zh: '首尔站', zhTW: '首爾站' },
];

// 추천 지역 ID (1단계 하단 노출 순서)
const RECOMMENDED_REGION_IDS = ['hongdae', 'myeongdong', 'gangnam', 'itaewon', 'dongdaemun', 'yongsan', 'haeundae', 'gimhae'];

// 언어 정규화
const normalizeLang = (lang?: string): LangKey => {
    if (!lang) return 'ko';
    const l = lang.toLowerCase();
    if (l === 'zh-tw' || l === 'zh-hant' || l === 'zh-hk') return 'zh-TW';
    if (l.startsWith('zh')) return 'zh';
    if (l.startsWith('ja')) return 'ja';
    if (l.startsWith('en')) return 'en';
    return 'ko';
};

const getRegionLabel = (r: RegionKeyword, lang: LangKey): string => {
    if (lang === 'zh-TW' || lang === 'zh-HK') return r.zhTW || r.zh;
    if (lang === 'zh') return r.zh;
    if (lang === 'ja') return r.ja;
    if (lang === 'en') return r.en;
    return r.ko;
};

// 지점 썸네일 없을 때 순환 사용할 operations 이미지
const FALLBACK_THUMBS = [
    '/images/operations/storage_new_v2.webp',
    '/images/operations/cafe_new_v2.webp',
    '/images/operations/op1_v5.webp',
    '/images/operations/op2_v5.webp',
    '/images/operations/hanok_real_v5.webp',
    '/images/operations/ddp_v5.webp',
    '/images/operations/cafe_v5.webp',
    '/images/operations/luggage_v3.webp',
];

// 지점 데이터 없을 때 보여줄 데모 카드
const DEMO_BRANCHES = [
    { id: '__demo_1', name: '홍대 빌리버', address: '서울 마포구 홍익로 23', businessHours: '08:00 – 22:00', lat: 37.5563, lng: 126.9222, image: '/images/operations/storage_new_v2.webp' },
    { id: '__demo_2', name: '명동 빌리버', address: '서울 중구 명동길 74', businessHours: '09:00 – 22:00', lat: 37.5636, lng: 126.9826, image: '/images/operations/cafe_new_v2.webp' },
    { id: '__demo_3', name: '강남 빌리버', address: '서울 강남구 강남대로 396', businessHours: '08:00 – 22:00', lat: 37.5012, lng: 127.0253, image: '/images/operations/op1_v5.webp' },
    { id: '__demo_4', name: '이태원 빌리버', address: '서울 용산구 이태원로 177', businessHours: '09:00 – 21:00', lat: 37.5349, lng: 126.9942, image: '/images/operations/hanok_real_v5.webp' },
    { id: '__demo_5', name: '인사동 빌리버', address: '서울 종로구 인사동길 35', businessHours: '09:00 – 21:00', lat: 37.5743, lng: 126.9855, image: '/images/operations/ddp_v5.webp' },
];

// 키워드의 모든 언어 표기 + id를 한 문자열로 (검색 매칭용)
const regionHaystack = (r: RegionKeyword): string =>
    [r.id, r.ko, r.en, r.ja, r.zh, r.zhTW].filter(Boolean).join(' ').toLowerCase();

type Svc = 'storage' | 'delivery';
type Step = 1 | 2 | 3 | 4;
type BagKey = 'hand' | 'carrier' | 'special';

// 보관 가격 정책 (4시간 기본 + 시간당 + 일자 cap)
const STORAGE_PRICING: Record<BagKey, { base4h: number; perHour: number; perDay: number; label: string; icon: string; sub: string }> = {
    hand:    { base4h: 4000,  perHour: 1000, perDay: 8000,  label: '쇼핑백 / 손가방', icon: '🛍️', sub: '4시간 4,000원 · +시간당 1,000원 · 1일 최대 8,000원' },
    carrier: { base4h: 5000,  perHour: 1000, perDay: 10000, label: '캐리어',          icon: '🧳', sub: '4시간 5,000원 · +시간당 1,000원 · 1일 최대 10,000원' },
    special: { base4h: 10000, perHour: 2500, perDay: 14000, label: '유모차 / 자전거', icon: '🚲', sub: '4시간 10,000원 · +시간당 2,500원 · 1일 최대 14,000원' },
};

// 배송 가격 (특수화물 없음)
const DELIVERY_PRICING: Record<Exclude<BagKey, 'special'>, { perItem: number; label: string; icon: string }> = {
    hand:    { perItem: 10000, label: '쇼핑백 / 손가방', icon: '🛍️' },
    carrier: { perItem: 25000, label: '캐리어',          icon: '🧳' },
};

const today = () => new Date().toISOString().slice(0, 10);

// 30분 단위 (07:00 ~ 22:00)
const TIME_OPTIONS = Array.from({ length: 31 }, (_, i) => {
    const total = 7 * 60 + i * 30;
    const h = Math.floor(total / 60);
    const m = total % 60;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
});

const fmtKRW = (n: number) => `₩${n.toLocaleString('ko-KR')}`;

// 보관 가격 계산: 하루(24h) 단위로 끊어서 4시간 기본 + 시간당, 1일 cap 적용
const calcStoragePrice = (hours: number, type: BagKey): number => {
    if (hours <= 0) return 0;
    const { base4h, perHour, perDay } = STORAGE_PRICING[type];
    let total = 0;
    let remaining = hours;
    while (remaining > 0) {
        const segment = Math.min(remaining, 24);
        let segPrice: number;
        if (segment <= 4) segPrice = base4h;
        else segPrice = Math.min(base4h + Math.ceil(segment - 4) * perHour, perDay);
        total += segPrice;
        remaining -= 24;
    }
    return total;
};

// 지점의 모든 언어 필드를 합친 검색용 문자열
const locHaystack = (loc: any): string => {
    if (!loc) return '';
    return [
        loc.address, loc.address_en, loc.address_ja, loc.address_zh, loc.address_zh_tw,
        loc.name, loc.name_ko, loc.name_en, loc.name_ja, loc.name_zh, loc.name_zh_tw,
        loc.area, loc.district, loc.region,
        loc.translations?.ko?.name, loc.translations?.en?.name, loc.translations?.ja?.name, loc.translations?.zh?.name, loc.translations?.zhTW?.name,
        loc.translations?.ko?.address, loc.translations?.en?.address, loc.translations?.ja?.address, loc.translations?.zh?.address, loc.translations?.zh_tw?.address,
    ].filter(Boolean).join(' ').toLowerCase();
};

// 지점이 어떤 region 키워드에 매칭되는지 → region.id 반환 (없으면 null)
const matchLocRegion = (loc: any): string | null => {
    const hay = locHaystack(loc);
    if (!hay) return null;
    // explicit field 우선
    const explicit = (loc.area || loc.district || loc.region || '').toLowerCase();
    for (const r of REGION_KEYWORDS) {
        if (explicit && (explicit.includes(r.ko.toLowerCase()) || explicit.includes(r.en.toLowerCase()))) return r.id;
    }
    for (const r of REGION_KEYWORDS) {
        const tokens = [r.ko, r.en.toLowerCase(), r.ja, r.zh, r.zhTW].filter(Boolean) as string[];
        for (const t of tokens) {
            if (hay.includes(t.toLowerCase())) return r.id;
        }
    }
    return null;
};

const MockupBookingFlow: React.FC<MockupBookingFlowProps> = ({
    open,
    onClose,
    locations,
    initialServiceType,
    initialLocationId,
    onSuccess,
    user,
    lang,
}) => {
    const langKey = normalizeLang(lang);
    const [step, setStep] = useState<Step>(1);
    const [svc, setSvc] = useState<Svc>(
        initialServiceType === ServiceType.DELIVERY ? 'delivery' : 'storage'
    );
    const [dropDate, setDropDate] = useState(today());
    const [dropTime, setDropTime] = useState('10:00');
    const [pickDate, setPickDate] = useState(today());
    const [pickTime, setPickTime] = useState('18:00');
    const [qty, setQty] = useState<{ hand: number; carrier: number; special: number }>({ hand: 0, carrier: 1, special: 0 });
    const [region, setRegion] = useState<string>('');
    const [regionSearch, setRegionSearch] = useState('');
    const [branchId, setBranchId] = useState<string | undefined>(initialLocationId);
    const [detailBranch, setDetailBranch] = useState<any | null>(null); // 상세 패널 표시용
    const [name, setName] = useState(user?.displayName || '');
    const [email, setEmail] = useState(user?.email || '');
    const [snsId, setSnsId] = useState('');
    const [snsType, setSnsType] = useState('instagram');
    const [agreeTerms, setAgreeTerms] = useState(false);
    const [agreePrivacy, setAgreePrivacy] = useState(false);
    const [agreeNoValuables, setAgreeNoValuables] = useState(false);
    const [pay, setPay] = useState<'card' | 'paypal'>('card');
    const [submitting, setSubmitting] = useState(false);
    const [completedBooking, setCompletedBooking] = useState<any | null>(null);

    // 모달 열릴 때 step 리셋
    useEffect(() => {
        if (open) {
            setStep(1);
            setSubmitting(false);
        }
    }, [open]);

    // 가방 합계 (서비스에 따라)
    const totalBags = svc === 'storage'
        ? qty.hand + qty.carrier + qty.special
        : qty.hand + qty.carrier;

    // 시간/일수 계산 (drop+dropTime ~ pick+pickTime)
    const { hours, days, displayDays } = useMemo(() => {
        try {
            const d1 = new Date(`${dropDate}T${dropTime}:00`);
            const d2 = new Date(`${pickDate}T${pickTime}:00`);
            const diffMs = d2.getTime() - d1.getTime();
            const h = Math.max(0, diffMs / (1000 * 60 * 60));
            // 표시용 일수 (24h 기준 올림)
            const dd = Math.max(1, Math.ceil(h / 24) || 1);
            return { hours: h, days: dd, displayDays: dd };
        } catch {
            return { hours: 0, days: 1, displayDays: 1 };
        }
    }, [dropDate, dropTime, pickDate, pickTime]);

    // 보관/배송 별 가격 라인
    const priceLines = useMemo(() => {
        const lines: { key: BagKey; label: string; qty: number; unit: number; total: number; note: string }[] = [];
        if (svc === 'storage') {
            (['hand', 'carrier', 'special'] as BagKey[]).forEach((k) => {
                const q = qty[k];
                if (q <= 0) return;
                const unit = calcStoragePrice(hours, k);
                lines.push({
                    key: k,
                    label: STORAGE_PRICING[k].label,
                    qty: q,
                    unit,
                    total: unit * q,
                    note: hours > 0 ? `${q}개 × ${fmtKRW(unit)}` : `${q}개`,
                });
            });
        } else {
            (['hand', 'carrier'] as Exclude<BagKey, 'special'>[]).forEach((k) => {
                const q = qty[k];
                if (q <= 0) return;
                const unit = DELIVERY_PRICING[k].perItem;
                lines.push({
                    key: k,
                    label: DELIVERY_PRICING[k].label,
                    qty: q,
                    unit,
                    total: unit * q,
                    note: `${q}개 × ${fmtKRW(unit)}`,
                });
            });
        }
        return lines;
    }, [svc, qty, hours]);

    const subtotal = useMemo(() => priceLines.reduce((s, l) => s + l.total, 0), [priceLines]);

    // 추천 지역 (다국어): 실제 데이터에 매칭되는 지역 + 기본 추천 합집합
    const recommendedRegions = useMemo(() => {
        const matched = new Set<string>();
        locations.forEach((loc: any) => {
            const id = matchLocRegion(loc);
            if (id) matched.add(id);
        });
        // 추천 ID 우선 + 매칭된 ID 추가
        const ordered: RegionKeyword[] = [];
        const seen = new Set<string>();
        for (const id of RECOMMENDED_REGION_IDS) {
            if (seen.has(id)) continue;
            const r = REGION_KEYWORDS.find((x) => x.id === id);
            if (r) {
                ordered.push(r);
                seen.add(id);
            }
        }
        // 추천에 없지만 데이터에 있는 지역 추가
        matched.forEach((id) => {
            if (seen.has(id)) return;
            const r = REGION_KEYWORDS.find((x) => x.id === id);
            if (r) {
                ordered.push(r);
                seen.add(id);
            }
        });
        return ordered;
    }, [locations]);

    // 검색어로 지역 후보 필터 (다국어 입력 모두 매칭)
    const filteredRegions = useMemo(() => {
        if (!regionSearch.trim()) return recommendedRegions;
        const q = regionSearch.trim().toLowerCase();
        return REGION_KEYWORDS.filter((r) => regionHaystack(r).includes(q));
    }, [recommendedRegions, regionSearch]);

    // 지점 필터: ① 지역(region.id) 선택 시 해당 지역 매칭 ② 검색어가 있으면 주소/이름 매칭 ③ 둘 다 없으면 전체
    const branches = useMemo(() => {
        let list = locations || [];
        const q = regionSearch.trim().toLowerCase();
        if (region) {
            list = list.filter((loc: any) => matchLocRegion(loc) === region);
        } else if (q) {
            list = list.filter((loc: any) => locHaystack(loc).includes(q));
        }
        return list;
    }, [locations, region, regionSearch]);

    const selectedBranch = useMemo(
        () => branches.find((b: any) => b.id === branchId)
            || locations?.find((b: any) => b.id === branchId)
            || DEMO_BRANCHES.find((b: any) => b.id === branchId),
        [branches, locations, branchId]
    );

    // ESC 닫기
    useEffect(() => {
        if (!open) return;
        const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
        document.addEventListener('keydown', onKey);
        return () => document.removeEventListener('keydown', onKey);
    }, [open, onClose]);

    // body scroll lock
    useEffect(() => {
        if (!open) return;
        const orig = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        return () => {
            document.body.style.overflow = orig;
        };
    }, [open]);

    const changeQty = (key: BagKey, delta: number) => {
        setQty((q) => ({ ...q, [key]: Math.max(0, q[key] + delta) }));
    };

    const canStep1Next = totalBags > 0 && dropDate && pickDate;
    const canStep2Next = !!branchId;
    const canPay = name.trim() && email.trim() && agreeTerms && agreePrivacy && agreeNoValuables;

    const handlePay = async () => {
        if (!canPay || submitting) return;
        setSubmitting(true);
        const booking = {
            id: `BL-${Date.now().toString(36).toUpperCase()}`,
            reservationCode: `BL${Date.now().toString().slice(-6)}`,
            serviceType: svc === 'storage' ? ServiceType.STORAGE : ServiceType.DELIVERY,
            pickupLocation: branchId,
            pickupLocationId: branchId,
            date: `${dropDate} ${dropTime}`,
            returnDate: `${pickDate} ${pickTime}`,
            bagCounts: {
                carrier: qty.carrier,
                hand_bag: qty.hand,
                stroller_bicycle: svc === 'storage' ? qty.special : 0,
                total: totalBags,
            },
            durationHours: hours,
            durationDays: displayDays,
            userName: name,
            userEmail: email,
            snsId,
            snsType,
            paymentMethod: pay,
            totalPrice: subtotal,
            finalPrice: subtotal,
            createdAt: new Date().toISOString(),
        };
        try {
            await onSuccess(booking);
            setCompletedBooking(booking);
            setSubmitting(false);
            setStep(4);
        } catch (e) {
            console.error('[MockupBookingFlow] payment failed', e);
            setSubmitting(false);
        }
    };


    if (!open) return null;

    return (
        <>
        <AnimatePresence>
            <motion.div
                key="dw-backdrop"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.18 }}
                className="fixed inset-0 z-[200] hidden md:flex items-center justify-center"
                style={{ background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(3px)' }}
                onClick={onClose}
            >
                <motion.div
                    initial={{ opacity: 0, scale: 0.96, y: 12 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.96, y: 12 }}
                    transition={{ duration: 0.22, ease: 'easeOut' }}
                    className="dw-modal-card"
                    style={{ transform: 'translateZ(0)', position: 'relative' }}
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* 헤더 */}
                    <div className="dw-header">
                        <div className="dw-steps">
                            <span className={`dw-step ${step === 1 ? 'active' : step > 1 ? 'done' : ''}`}>① 일정 &amp; 가방</span>
                            <span className="dw-step-arrow">›</span>
                            <span className={`dw-step ${step === 2 ? 'active' : step > 2 ? 'done' : ''}`}>② 지점 선택</span>
                            <span className="dw-step-arrow">›</span>
                            <span className={`dw-step ${step === 3 ? 'active' : step > 3 ? 'done' : ''}`}>③ 결제</span>
                            <span className="dw-step-arrow">›</span>
                            <span className={`dw-step ${step === 4 ? 'active' : ''}`}>④ 완료</span>
                        </div>
                        <button className="dw-close-btn" onClick={onClose} aria-label="닫기">✕</button>
                    </div>

                    {/* STEP 1 */}
                    {step === 1 && (
                        <div className="dw-body">
                            <div className="dw-cols">
                                {/* 왼쪽 */}
                                <div className="dw-left">
                                    <div className="dw-section-label">서비스</div>
                                    <div className="dw-svc-tabs">
                                        <button
                                            className={`dw-svc-tab ${svc === 'storage' ? 'active' : ''}`}
                                            onClick={() => setSvc('storage')}
                                        >
                                            🧳 짐 보관
                                        </button>
                                        <button
                                            className={`dw-svc-tab ${svc === 'delivery' ? 'active' : ''}`}
                                            onClick={() => setSvc('delivery')}
                                        >
                                            ✈️ 공항 배송
                                        </button>
                                    </div>

                                    <div className="dw-section-label" style={{ marginTop: 20 }}>이용 시간</div>
                                    <div className="dw-time-row">
                                        <div className="dw-time-col">
                                            <div className="dw-time-label">맡기는 날짜</div>
                                            <div className="dw-chip">
                                                <input type="date" value={dropDate} onChange={(e) => setDropDate(e.target.value)} />
                                            </div>
                                        </div>
                                        <div className="dw-time-col">
                                            <div className="dw-time-label">맡기는 시간</div>
                                            <div className="dw-chip">
                                                <select value={dropTime} onChange={(e) => setDropTime(e.target.value)}>
                                                    {TIME_OPTIONS.map((t) => <option key={t} value={t}>{t}</option>)}
                                                </select>
                                            </div>
                                        </div>
                                        <div className="dw-time-col">
                                            <div className="dw-time-label">찾는 날짜</div>
                                            <div className="dw-chip">
                                                <input type="date" value={pickDate} onChange={(e) => setPickDate(e.target.value)} />
                                            </div>
                                        </div>
                                        <div className="dw-time-col">
                                            <div className="dw-time-label">찾는 시간</div>
                                            <div className="dw-chip">
                                                <select value={pickTime} onChange={(e) => setPickTime(e.target.value)}>
                                                    {TIME_OPTIONS.map((t) => <option key={t} value={t}>{t}</option>)}
                                                </select>
                                            </div>
                                        </div>
                                    </div>

                                    <>
                                            <div className="dw-section-label" style={{ marginTop: 20 }}>
                                                {{ ko: '지역 / 주소 검색', en: 'Search area / address', ja: 'エリア / 住所検索', zh: '地区 / 地址搜索', 'zh-TW': '地區 / 地址搜尋', 'zh-HK': '地區 / 地址搜尋' }[langKey]}
                                            </div>
                                            <div className="dw-region-search-wrap">
                                                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                                                    <circle cx="11" cy="11" r="7" />
                                                    <line x1="21" y1="21" x2="16.65" y2="16.65" />
                                                </svg>
                                                <input
                                                    type="text"
                                                    className="dw-region-search"
                                                    placeholder={{
                                                        ko: '지역·주소 검색 (예: 홍대, 명동, 동대문…)',
                                                        en: 'Search area/address (e.g. Hongdae, Myeongdong)',
                                                        ja: 'エリア/住所検索（例: 弘大、明洞）',
                                                        zh: '搜索地区/地址（如：弘大、明洞）',
                                                        'zh-TW': '搜尋地區/地址（如：弘大、明洞）',
                                                        'zh-HK': '搜尋地區/地址（如：弘大、明洞）',
                                                    }[langKey]}
                                                    value={regionSearch}
                                                    onChange={(e) => { setRegionSearch(e.target.value); setRegion(''); }}
                                                />
                                                {regionSearch && (
                                                    <button
                                                        onClick={() => setRegionSearch('')}
                                                        style={{ marginLeft: 6, background: 'transparent', border: 'none', color: '#999', cursor: 'pointer', fontSize: 14 }}
                                                        aria-label="clear"
                                                    >
                                                        ✕
                                                    </button>
                                                )}
                                            </div>
                                            <div style={{ fontSize: 11, color: '#888', marginTop: 6, marginBottom: 4 }}>
                                                {{ ko: '추천 지역', en: 'Popular areas', ja: '人気エリア', zh: '推荐地区', 'zh-TW': '推薦地區', 'zh-HK': '推薦地區' }[langKey]}
                                            </div>
                                            <div className="dw-region-tabs">
                                                <button
                                                    className={`dw-region-tab ${region === '' && !regionSearch ? 'active' : ''}`}
                                                    onClick={() => { setRegion(''); setRegionSearch(''); }}
                                                >
                                                    {{ ko: '전체', en: 'All', ja: '全て', zh: '全部', 'zh-TW': '全部', 'zh-HK': '全部' }[langKey]}
                                                </button>
                                                {filteredRegions.map((r) => (
                                                    <button
                                                        key={r.id}
                                                        className={`dw-region-tab ${region === r.id ? 'active' : ''}`}
                                                        onClick={() => { setRegion(r.id); setRegionSearch(''); }}
                                                    >
                                                        {getRegionLabel(r, langKey)}
                                                    </button>
                                                ))}
                                                {filteredRegions.length === 0 && (
                                                    <span style={{ fontSize: 12, color: '#999', padding: '6px 4px' }}>
                                                        {{ ko: '검색 결과가 없습니다', en: 'No matches', ja: '結果なし', zh: '无结果', 'zh-TW': '無結果', 'zh-HK': '無結果' }[langKey]}
                                                    </span>
                                                )}
                                            </div>
                                    </>
                                </div>

                                {/* 오른쪽: 가방 */}
                                <div className="dw-right">
                                    <div className="dw-section-label">가방 종류 &amp; 수량</div>

                                    {/* 가방 선택 — 가격 없이 컴팩트 */}
                                    <div className="dw-bag-list" style={{ gap: 6 }}>
                                        {(svc === 'storage'
                                            ? (['hand', 'carrier', 'special'] as BagKey[])
                                            : (['hand', 'carrier'] as BagKey[])
                                        ).map((k) => {
                                            const label = svc === 'storage'
                                                ? STORAGE_PRICING[k].label
                                                : DELIVERY_PRICING[k as Exclude<BagKey, 'special'>].label;
                                            const icon = svc === 'storage'
                                                ? STORAGE_PRICING[k].icon
                                                : DELIVERY_PRICING[k as Exclude<BagKey, 'special'>].icon;
                                            return (
                                                <div className="dw-bag-row" key={k} style={{ padding: '6px 0' }}>
                                                    <span className="dw-bag-ic" style={{ fontSize: 18 }}>{icon}</span>
                                                    <div className="dw-bag-nm" style={{ flex: 1, fontSize: 13, fontWeight: 600 }}>{label}</div>
                                                    <div className="dw-counter">
                                                        <button onClick={() => changeQty(k, -1)}>−</button>
                                                        <span>{qty[k]}</span>
                                                        <button className="plus" onClick={() => changeQty(k, 1)}>+</button>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>

                                    {/* 요금 안내 (보관) — 컴팩트 */}
                                    {svc === 'storage' && (
                                        <div style={{
                                            marginTop: 8,
                                            background: '#FFF8E1',
                                            border: '1px solid #FFE082',
                                            borderRadius: 7,
                                            padding: '7px 10px',
                                            fontSize: 11,
                                            color: '#5C4A00',
                                            lineHeight: 1.6,
                                        }}>
                                            <div style={{ fontWeight: 800, marginBottom: 2, fontSize: 11.5 }}>
                                                💡 보관 요금 {hours > 0 ? `· ${hours.toFixed(hours % 1 === 0 ? 0 : 1)}h / ${displayDays}일` : ''}
                                            </div>
                                            <div>쇼핑백/손가방 4h 4,000 · +1h 1,000 · 1일 8,000</div>
                                            <div>캐리어 4h 5,000 · +1h 1,000 · 1일 10,000</div>
                                            <div>유모차/자전거 4h 10,000 · +1h 2,500 · 1일 14,000</div>
                                        </div>
                                    )}

                                    {/* 명세 + 소계 */}
                                    <div style={{ marginTop: 8, borderTop: '1px solid #EEE', paddingTop: 8 }}>
                                        {priceLines.map((l) => (
                                            <div key={l.key} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, padding: '2px 0', color: '#555' }}>
                                                <span>{l.label} <span style={{ color: '#AAA' }}>{l.note}</span></span>
                                                <span style={{ fontWeight: 700 }}>{fmtKRW(l.total)}</span>
                                            </div>
                                        ))}
                                        <div className="dw-subtotal" style={{ marginTop: 6 }}>
                                            <span>소계 {svc === 'storage' ? `(${displayDays}일/${hours.toFixed(0)}h)` : `(${totalBags}개)`}</span>
                                            <span className="dw-subtotal-amt">{fmtKRW(subtotal)}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="dw-footer">
                                <div className="dw-footer-hint">
                                    {totalBags === 0 ? '가방을 1개 이상 선택해주세요' : ''}
                                </div>
                                <button
                                    className="dw-btn-next"
                                    disabled={!canStep1Next}
                                    onClick={() => setStep(2)}
                                >
                                    지점 찾기 →
                                </button>
                            </div>
                        </div>
                    )}

                    {/* STEP 2 */}
                    {step === 2 && (
                        <div className="dw-body">
                            <div className="dw-map-layout">
                                <div className="dw-map-panel">
                                    <Suspense fallback={<div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%', color: '#999', fontSize: 13 }}>지도 로딩 중…</div>}>
                                        <DwMiniMap
                                            branches={branches.length > 0 ? branches : DEMO_BRANCHES}
                                            selectedId={branchId}
                                            onSelect={setBranchId}
                                        />
                                    </Suspense>
                                </div>
                                <div className="dw-branch-panel">
                                    <div className="dw-branch-head">
                                        <strong>
                                            {region
                                                ? getRegionLabel(REGION_KEYWORDS.find((r) => r.id === region) || REGION_KEYWORDS[0], langKey)
                                                : (regionSearch.trim() || ({ ko: '전체', en: 'All', ja: '全て', zh: '全部', 'zh-TW': '全部', 'zh-HK': '全部' }[langKey]))}
                                        </strong>
                                        {' · '}
                                        <strong>{branches.length}</strong>
                                        {{ ko: '곳', en: ' places', ja: '件', zh: '处', 'zh-TW': '處', 'zh-HK': '處' }[langKey]}
                                    </div>
                                    {/* 지점 목록 */}
                                    <div className="dw-branch-list">
                                        {(branches.length > 0 ? branches : DEMO_BRANCHES).map((b: any, idx: number) => {
                                            const thumb = b.thumbnailUrl || b.imageUrl || b.image
                                                || FALLBACK_THUMBS[idx % FALLBACK_THUMBS.length];
                                            const isDemo = branches.length === 0;
                                            const isSelected = branchId === b.id;
                                            return (
                                                <div
                                                    key={b.id}
                                                    className={`dw-branch-card ${isSelected ? 'selected' : ''}`}
                                                    onClick={(e) => { e.stopPropagation(); console.log('[branch-card] click', b?.name); setDetailBranch(b); }}
                                                    style={{ cursor: 'pointer' }}
                                                >
                                                    <img
                                                        className="dw-branch-thumb"
                                                        src={thumb}
                                                        alt={b.name}
                                                        style={{ objectFit: 'cover' }}
                                                        onError={(e) => { (e.currentTarget as HTMLImageElement).src = FALLBACK_THUMBS[0]; }}
                                                    />
                                                    <div className="dw-branch-info">
                                                        <div className="dw-branch-nm">
                                                            {b.name}
                                                            {isDemo && <span style={{ marginLeft: 6, fontSize: 10, color: '#FFC700', fontWeight: 700, background: '#FFF8E1', borderRadius: 4, padding: '1px 5px' }}>예시</span>}
                                                            {isSelected && <span style={{ marginLeft: 6, fontSize: 10, color: '#fff', fontWeight: 700, background: '#111', borderRadius: 4, padding: '1px 5px' }}>✓ 선택됨</span>}
                                                        </div>
                                                        {(b.businessHours || b.open_time) && (
                                                            <div className="dw-branch-meta">🕐 {b.businessHours || `${b.open_time} – ${b.close_time}`}</div>
                                                        )}
                                                        {b.address && <div className="dw-branch-addr">📍 {b.address}</div>}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>
                            <div className="dw-footer">
                                <button className="dw-btn-prev" onClick={() => setStep(1)}>← 이전</button>
                                <div style={{ flex: 1 }} />
                                <button className="dw-btn-next" disabled={!canStep2Next} onClick={() => setStep(3)}>
                                    다음 →
                                </button>
                            </div>
                        </div>
                    )}

                    {/* STEP 3 */}
                    {step === 3 && (
                        <div className="dw-body">
                            <div className="dw-cols dw-cols-3">
                                {/* 왼쪽: 정보 */}
                                <div className="dw-left">
                                    <div className="dw-section-label">예약자 정보</div>
                                    <div className="dw-field">
                                        <label>이름</label>
                                        <input className="dw-input" value={name} onChange={(e) => setName(e.target.value)} placeholder="홍길동" />
                                    </div>
                                    <div className="dw-field">
                                        <label>이메일</label>
                                        <input className="dw-input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="example@mail.com" />
                                    </div>
                                    <div className="dw-field">
                                        <label>연락처 (SNS)</label>
                                        <div style={{ display: 'flex', gap: 8 }}>
                                            <input className="dw-input" style={{ flex: 1 }} value={snsId} onChange={(e) => setSnsId(e.target.value)} placeholder="아이디" />
                                            <select className="dw-input" style={{ flex: '0 0 130px' }} value={snsType} onChange={(e) => setSnsType(e.target.value)}>
                                                <option value="instagram">Instagram</option>
                                                <option value="wechat">WeChat</option>
                                                <option value="line">LINE</option>
                                                <option value="kakao">KakaoTalk</option>
                                                <option value="whatsapp">WhatsApp</option>
                                            </select>
                                        </div>
                                    </div>
                                    <div className="dw-agree-group">
                                        <label className="dw-agree">
                                            <input type="checkbox" checked={agreeTerms} onChange={(e) => setAgreeTerms(e.target.checked)} />
                                            <span>서비스 이용약관 동의 (필수)</span>
                                        </label>
                                        <label className="dw-agree">
                                            <input type="checkbox" checked={agreePrivacy} onChange={(e) => setAgreePrivacy(e.target.checked)} />
                                            <span>개인정보 수집 및 이용 동의 (필수)</span>
                                        </label>
                                        <label className="dw-agree">
                                            <input type="checkbox" checked={agreeNoValuables} onChange={(e) => setAgreeNoValuables(e.target.checked)} />
                                            <span>고가·귀중품(현금, 귀금속, 전자기기 등) 보관 불가 방침 확인 (필수)</span>
                                        </label>
                                    </div>
                                </div>

                                {/* 오른쪽: 요약 + 결제 */}
                                <div className="dw-right">
                                    <div className="dw-section-label">예약 요약</div>
                                    <div className="dw-summary-card">
                                        <div className="dw-sum-row">
                                            <span>지점</span>
                                            <span style={{ maxWidth: 140, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{selectedBranch?.name || '-'}</span>
                                        </div>
                                        <div className="dw-sum-row">
                                            <span>맡기기</span>
                                            <span>{dropDate} {dropTime}</span>
                                        </div>
                                        <div className="dw-sum-row">
                                            <span>찾기</span>
                                            <span>{pickDate} {pickTime}</span>
                                        </div>
                                        <div className="dw-sum-row">
                                            <span>가방</span>
                                            <span style={{ display: 'flex', flexWrap: 'wrap', gap: 4, justifyContent: 'flex-end' }}>
                                                {qty.carrier > 0 && <span style={{ background: '#f5f5f5', borderRadius: 6, padding: '1px 7px', fontSize: 11 }}>캐리어 ×{qty.carrier}</span>}
                                                {qty.hand > 0 && <span style={{ background: '#f5f5f5', borderRadius: 6, padding: '1px 7px', fontSize: 11 }}>핸드백 ×{qty.hand}</span>}
                                                {svc === 'storage' && qty.special > 0 && <span style={{ background: '#f5f5f5', borderRadius: 6, padding: '1px 7px', fontSize: 11 }}>특수 ×{qty.special}</span>}
                                            </span>
                                        </div>
                                        <div className="dw-sum-divider" />
                                        <div className="dw-sum-row dw-sum-total">
                                            <span>총 금액</span>
                                            <span>{fmtKRW(subtotal)}</span>
                                        </div>
                                    </div>

                                    <div className="dw-section-label" style={{ marginTop: 16 }}>결제 수단</div>
                                    <div className="dw-pay-opts">
                                        <label className="dw-pay-opt">
                                            <input type="radio" name="dw-pay" checked={pay === 'card'} onChange={() => setPay('card')} />
                                            <span className="dw-pay-inner">
                                                <svg width="24" height="16" viewBox="0 0 40 26" fill="none">
                                                    <rect width="40" height="26" rx="4" fill="#1A1F71" />
                                                    <rect y="6" width="40" height="7" fill="#F7B600" />
                                                    <rect x="3" y="16" width="10" height="6" rx="1" fill="#fff" opacity=".8" />
                                                </svg>
                                                카드
                                            </span>
                                        </label>
                                        <label className="dw-pay-opt">
                                            <input type="radio" name="dw-pay" checked={pay === 'paypal'} onChange={() => setPay('paypal')} />
                                            <span className="dw-pay-inner">
                                                <svg width="24" height="16" viewBox="0 0 50 32" fill="none">
                                                    <rect width="50" height="32" rx="4" fill="#fff" />
                                                    <text x="6" y="22" fontFamily="Arial" fontWeight="800" fontSize="14" fill="#003087">Pay</text>
                                                    <text x="22" y="22" fontFamily="Arial" fontWeight="800" fontSize="14" fill="#009CDE">Pal</text>
                                                </svg>
                                                PayPal
                                            </span>
                                        </label>
                                    </div>
                                </div>
                            </div>

                            <div className="dw-footer">
                                <button className="dw-btn-prev" onClick={() => setStep(2)}>← 이전</button>
                                <div style={{ flex: 1 }} />
                                <button
                                    className="dw-btn-pay"
                                    disabled={!canPay || submitting}
                                    onClick={handlePay}
                                >
                                    <span style={{ marginRight: 8 }}>{fmtKRW(subtotal)}</span>
                                    {submitting ? '처리 중…' : '결제하기'}
                                </button>
                            </div>
                        </div>
                    )}

                    {/* STEP 4 — 예약 완료 바우처 (2열 고정 레이아웃) */}
                    {step === 4 && completedBooking && (
                        <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1fr 1fr', minHeight: 0, overflow: 'hidden' }}>

                            {/* 좌: 브랜드 + QR */}
                            <div style={{ background: '#111', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '32px 28px', gap: 20 }}>
                                {/* 체크 + 타이틀 */}
                                <div style={{ textAlign: 'center' }}>
                                    <div style={{ width: 56, height: 56, borderRadius: 16, background: '#FFC700', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px', boxShadow: '0 8px 20px rgba(255,199,0,0.4)' }}>
                                        <span style={{ fontSize: 26, color: '#111', fontWeight: 900 }}>✓</span>
                                    </div>
                                    <h2 style={{ fontSize: 22, fontWeight: 900, color: '#fff', margin: 0, letterSpacing: '-0.02em' }}>예약 완료!</h2>
                                    <p style={{ fontSize: 9, fontWeight: 900, color: 'rgba(255,199,0,0.6)', letterSpacing: '0.28em', textTransform: 'uppercase', margin: '6px 0 0' }}>
                                        CONFIRMED · BEELIBER
                                    </p>
                                </div>

                                {/* QR */}
                                <div style={{ background: '#fff', borderRadius: 20, padding: 12, width: 160, height: 160, boxShadow: '0 0 0 6px rgba(255,199,0,0.15)' }}>
                                    <img
                                        src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(completedBooking.reservationCode)}`}
                                        alt="QR"
                                        style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                                    />
                                </div>

                                <div style={{ textAlign: 'center' }}>
                                    <p style={{ fontSize: 10.5, fontWeight: 900, color: '#fff', letterSpacing: '0.06em', margin: 0 }}>직원에게 제시하세요</p>
                                    <p style={{ fontSize: 9, fontWeight: 700, color: 'rgba(255,255,255,0.45)', marginTop: 4, lineHeight: 1.5 }}>
                                        지점 방문 시 QR 스캔으로<br />예약이 자동 확인됩니다
                                    </p>
                                </div>

                                {/* 브랜드 */}
                                <div style={{ marginTop: 4 }}>
                                    <span style={{ fontSize: 18, fontWeight: 900, fontStyle: 'italic', color: '#FFC700' }}>bee</span>
                                    <span style={{ fontSize: 18, fontWeight: 900, color: '#fff' }}>liber</span>
                                </div>
                            </div>

                            {/* 우: 예약 정보 + 버튼 */}
                            <div style={{ display: 'flex', flexDirection: 'column', background: '#fafaf8', overflow: 'hidden' }}>
                                <div style={{ flex: 1, overflowY: 'auto', padding: '24px 24px 0' }}>

                                    {/* 예약번호 */}
                                    <div style={{ marginBottom: 16, padding: '12px 14px', background: '#fff', borderRadius: 12, border: '1px solid #ebebeb' }}>
                                        <p style={{ fontSize: 8.5, fontWeight: 900, color: '#9ca3af', letterSpacing: '0.2em', textTransform: 'uppercase', margin: '0 0 3px' }}>RESERVATION ID</p>
                                        <p style={{ fontSize: 14, fontWeight: 900, color: '#111', margin: 0 }}>{completedBooking.reservationCode}</p>
                                        <p style={{ fontSize: 10, fontWeight: 700, color: '#bbb', margin: '3px 0 0' }}>{new Date(completedBooking.createdAt).toLocaleDateString('ko-KR')} 발급</p>
                                    </div>

                                    {/* 일정 */}
                                    <div style={{ marginBottom: 12, padding: '12px 14px', background: '#fff', borderRadius: 12, border: '1px solid #ebebeb' }}>
                                        <div style={{ display: 'flex', gap: 12, marginBottom: 10 }}>
                                            <div style={{ flex: 1 }}>
                                                <p style={{ fontSize: 8.5, fontWeight: 900, color: '#9ca3af', letterSpacing: '0.18em', textTransform: 'uppercase', margin: '0 0 3px' }}>맡기기</p>
                                                <p style={{ fontSize: 12, fontWeight: 800, color: '#111', margin: 0 }}>{completedBooking.date}</p>
                                            </div>
                                            <div style={{ flex: 1 }}>
                                                <p style={{ fontSize: 8.5, fontWeight: 900, color: '#9ca3af', letterSpacing: '0.18em', textTransform: 'uppercase', margin: '0 0 3px' }}>{svc === 'delivery' ? '배송' : '찾기'}</p>
                                                <p style={{ fontSize: 12, fontWeight: 800, color: '#111', margin: 0 }}>{completedBooking.returnDate}</p>
                                            </div>
                                        </div>
                                        <div style={{ borderTop: '1px dashed #ebebeb', paddingTop: 10 }}>
                                            <p style={{ fontSize: 8.5, fontWeight: 900, color: '#9ca3af', letterSpacing: '0.18em', textTransform: 'uppercase', margin: '0 0 3px' }}>지점</p>
                                            <p style={{ fontSize: 13, fontWeight: 900, color: '#111', margin: 0 }}>{selectedBranch?.name || branchId}</p>
                                        </div>
                                    </div>

                                    {/* 가방 + 금액 */}
                                    <div style={{ marginBottom: 12, padding: '12px 14px', background: '#fff', borderRadius: 12, border: '1px solid #ebebeb', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                                        <div>
                                            <p style={{ fontSize: 8.5, fontWeight: 900, color: '#9ca3af', letterSpacing: '0.18em', textTransform: 'uppercase', margin: '0 0 6px' }}>BAGS</p>
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                                                {qty.carrier > 0 && <span style={{ fontSize: 11, fontWeight: 800, color: '#111' }}>캐리어 ×{qty.carrier}</span>}
                                                {qty.hand > 0 && <span style={{ fontSize: 11, fontWeight: 800, color: '#111' }}>핸드백 ×{qty.hand}</span>}
                                                {qty.special > 0 && <span style={{ fontSize: 11, fontWeight: 800, color: '#111' }}>특수 ×{qty.special}</span>}
                                            </div>
                                        </div>
                                        <div style={{ textAlign: 'right' }}>
                                            <p style={{ fontSize: 8.5, fontWeight: 900, color: '#9ca3af', letterSpacing: '0.18em', textTransform: 'uppercase', margin: '0 0 6px' }}>TOTAL</p>
                                            <p style={{ fontSize: 20, fontWeight: 900, fontStyle: 'italic', color: '#111', margin: 0, lineHeight: 1 }}>{fmtKRW(completedBooking.finalPrice)}</p>
                                            <p style={{ fontSize: 8, fontWeight: 700, color: '#d1d5db', textTransform: 'uppercase', margin: '3px 0 0' }}>VAT INCLUDED</p>
                                        </div>
                                    </div>

                                    {/* 사용자 */}
                                    <div style={{ marginBottom: 16, padding: '10px 14px', background: '#111', borderRadius: 12, display: 'flex', alignItems: 'center', gap: 10 }}>
                                        <div style={{ width: 32, height: 32, background: '#FFC700', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, flexShrink: 0 }}>👤</div>
                                        <div style={{ minWidth: 0 }}>
                                            <p style={{ fontSize: 12, fontWeight: 900, color: '#fff', fontStyle: 'italic', margin: 0 }}>{completedBooking.userName}</p>
                                            <p style={{ fontSize: 9, fontWeight: 700, color: '#FFC700', margin: '2px 0 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{completedBooking.userEmail}</p>
                                        </div>
                                    </div>
                                </div>

                                {/* 버튼 — 하단 고정 */}
                                <div style={{ padding: '12px 24px 20px', borderTop: '1px solid #ebebeb', display: 'flex', gap: 8, background: '#fafaf8', flexShrink: 0 }}>
                                    <button
                                        onClick={() => window.print()}
                                        style={{ flex: 1, padding: '11px', background: '#FFC700', color: '#111', border: 'none', borderRadius: 12, fontWeight: 900, fontSize: 13, cursor: 'pointer' }}
                                    >
                                        💾 저장
                                    </button>
                                    <button
                                        onClick={onClose}
                                        style={{ flex: 1, padding: '11px', background: '#111', color: '#FFC700', border: 'none', borderRadius: 12, fontWeight: 900, fontSize: 13, cursor: 'pointer' }}
                                    >
                                        🏠 홈으로
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </motion.div>
            </motion.div>
        </AnimatePresence>

        {/* ── 지점 상세 팝업 — body에 portal로 마운트 (fixed overlay) ── */}
        {detailBranch && createPortal(
            <div
                style={{
                    position: 'fixed', inset: 0, zIndex: 9000,
                    background: 'rgba(0,0,0,0.35)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    animation: 'dwFadeIn 0.15s ease',
                }}
                onClick={(e) => { e.stopPropagation(); setDetailBranch(null); }}
            >
                    <div
                        style={{
                            position: 'relative', background: '#fff', borderRadius: 16,
                            width: 400, overflow: 'hidden',
                            boxShadow: '0 16px 48px rgba(0,0,0,0.22)',
                            animation: 'dwPopIn 0.18s ease',
                        }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* 닫기 버튼 */}
                        <button
                            onClick={() => setDetailBranch(null)}
                            style={{
                                position: 'absolute', top: 10, right: 10, zIndex: 2,
                                background: 'rgba(0,0,0,0.45)', border: 'none', color: '#fff',
                                width: 28, height: 28, borderRadius: '50%', fontSize: 13,
                                cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                            }}
                        >✕</button>

                        {/* 이미지 */}
                        {(() => {
                            const img = detailBranch.thumbnailUrl || detailBranch.imageUrl || detailBranch.image;
                            return img ? (
                                <img
                                    src={img}
                                    alt={detailBranch.name}
                                    style={{ width: '100%', height: 240, objectFit: 'cover', display: 'block' }}
                                    onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
                                />
                            ) : (
                                <div style={{
                                    width: '100%', height: 200, display: 'flex',
                                    alignItems: 'center', justifyContent: 'center',
                                    background: 'linear-gradient(135deg, #FFF8D6 0%, #FFF3B0 100%)',
                                    fontSize: 36,
                                }}>🏪</div>
                            );
                        })()}

                        {/* 본문 */}
                        <div style={{ padding: 16 }}>
                            <div style={{ fontSize: 16, fontWeight: 900, marginBottom: 4, letterSpacing: '-0.02em', color: '#111' }}>
                                {detailBranch.name}
                            </div>
                            {detailBranch.address && (
                                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12.5, color: '#555', marginBottom: 2 }}>
                                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M12 21s7-6.5 7-12a7 7 0 10-14 0c0 5.5 7 12 7 12z"/><circle cx="12" cy="10" r="2.5"/>
                                    </svg>
                                    <span>{detailBranch.address}</span>
                                </div>
                            )}
                            {(detailBranch.businessHours || detailBranch.open_time) && (
                                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12.5, color: '#555', marginBottom: 2 }}>
                                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>
                                    </svg>
                                    <span>{detailBranch.businessHours || `${detailBranch.open_time} – ${detailBranch.close_time}`}</span>
                                </div>
                            )}
                            {detailBranch.rating && (
                                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12.5, color: '#555', marginBottom: 2 }}>
                                    <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
                                        <path d="M12 2l2.9 6.9 7.1.6-5.4 4.7 1.6 7.2L12 17.8 5.8 21.4l1.6-7.2L2 9.5l7.1-.6z"/>
                                    </svg>
                                    <span>{detailBranch.rating} · {detailBranch.phone || ''}</span>
                                </div>
                            )}
                            <button
                                style={{
                                    marginTop: 16, width: '100%', height: 42, borderRadius: 10,
                                    background: '#111', color: '#FFC700', fontSize: 14, fontWeight: 800,
                                    border: 'none', cursor: 'pointer', transition: 'background .15s',
                                }}
                                onClick={() => { setBranchId(detailBranch.id); setDetailBranch(null); setStep(3); }}
                                onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = '#2a2a2a'; }}
                                onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = '#111'; }}
                            >
                                이 지점에서 예약하기 →
                            </button>
                        </div>
                    </div>
                </div>,
                document.body
            )}
        </>
    );
};

export default MockupBookingFlow;
