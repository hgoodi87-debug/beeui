import React, { useState, useEffect } from 'react';
import { BookingState, BookingStatus, LocationOption, ServiceType } from '../types';
import { StorageService } from '../services/storageService';
import { motion, AnimatePresence } from 'framer-motion';
import QRScanModal from './admin/QRScanModal';

interface StaffScanPageProps {
    onBack: () => void;
    adminName?: string;
    t: any;
    lang: string;
}

// URL에서 예약 ID를 즉시 읽는 헬퍼 (초기 상태값 계산용 — 렌더 전 실행)
const getUrlId = () => {
    const params = new URLSearchParams(window.location.search);
    return params.get('id') || params.get('scan') || null;
};

const StaffScanPage: React.FC<StaffScanPageProps> = ({ onBack, adminName, t, lang }) => {
    const scanText = t.staff_scan || {};
    // URL에 ?id= 있으면 바로 로딩, 없으면 스캐너 표시
    const [bookingId, setBookingId] = useState<string | null>(getUrlId);
    const [booking, setBooking] = useState<BookingState | null>(null);
    const [isLoading, setIsLoading] = useState(() => Boolean(getUrlId()));
    const [error, setError] = useState<string | null>(null);
    // URL에 ID 없으면 처음부터 스캐너 표시
    const [showScanner, setShowScanner] = useState(() => !getUrlId());
    const [locations, setLocations] = useState<LocationOption[]>([]);
    const [isUpdating, setIsUpdating] = useState(false);
    const [nametagInput, setNametagInput] = useState<string>('');
    const [nametagSaved, setNametagSaved] = useState(false);
    const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);

    const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
        setToast({ msg, type });
        setTimeout(() => setToast(null), 3000);
    };

    useEffect(() => {
        // 지점 정보 로드 (bookingId는 초기값으로 이미 설정됨)
        StorageService.getLocations().then(setLocations).catch(console.error);
    }, []);

    useEffect(() => {
        if (bookingId) {
            setShowScanner(false);
            loadBooking(bookingId);
        } else {
            setIsLoading(false);
            // URL에 ID 없으면 바로 카메라 스캐너 열기
            setShowScanner(true);
        }
    }, [bookingId]);

    const loadBooking = async (id: string) => {
        setIsLoading(true);
        try {
            // [스봉이] 전체 데이터 긁어오지 마세요! 💅 단일 문서만 보안 조회합니다. 🛡️
            const found = await StorageService.getBooking(id);

            if (found) {
                setBooking(found);
            } else {
                setError(scanText.booking_not_found || "예약 정보를 찾을 수 없습니다.");
            }
        } catch (err) {
            console.error(err);
            setError(scanText.load_error || "데이터 로드 중 오류가 발생했습니다.");
        } finally {
            setIsLoading(false);
        }
    };

    const getStatusLabel = (status: BookingStatus | string) => {
        const normalized = String(status || '').toLowerCase();
        return scanText.statuses?.[normalized] || status;
    };

    const getPaymentStatusLabel = (status?: string) => {
        const normalized = String(status || 'unknown').toLowerCase();
        return scanText.payment_statuses?.[normalized] || normalized;
    };

    const handleNametagSave = async () => {
        const num = parseInt(nametagInput, 10);
        if (isNaN(num) || num < 1 || num > 100) {
            showToast('네임태그 번호는 1~100 사이 숫자를 입력하세요.', 'error');
            return;
        }
        setIsUpdating(true);
        try {
            await StorageService.updateBooking(booking!.id!, { nametagId: num } as any);
            setBooking(prev => prev ? { ...prev, nametagId: num } : null);
            setNametagSaved(true);
            setTimeout(() => setNametagSaved(false), 3000);
        } catch (e) {
            showToast('네임태그 저장 실패: ' + String(e), 'error');
        } finally {
            setIsUpdating(false);
        }
    };

    // BookingStatus(한국어) → booking_details.ops_status(영문) 매핑
    const BOOKING_STATUS_TO_OPS: Record<string, string> = {
        [BookingStatus.STORAGE]: 'pickup_completed',
        [BookingStatus.TRANSIT]: 'in_transit',
        [BookingStatus.ARRIVED]: 'arrived_at_destination',
        [BookingStatus.COMPLETED]: 'handover_completed',
        [BookingStatus.CANCELLED]: 'cancelled',
    };

    const handleStatusUpdate = async (newStatus: BookingStatus) => {
        if (!booking) return;
        // confirm() 제거 — 모바일에서 네이티브 다이얼로그 차단. 버튼 자체가 명시적 액션임.

        setIsUpdating(true);
        try {
            const opsStatus = BOOKING_STATUS_TO_OPS[newStatus];
            await StorageService.updateBooking(booking.id!, opsStatus ? { opsStatus } : { status: newStatus });

            // 로컬 상태 즉시 업데이트
            setBooking(prev => prev ? { ...prev, status: newStatus } : null);
            showToast(scanText.changed || "상태가 변경되었습니다.");
        } catch (err) {
            console.error(err);
            showToast(scanText.failed || "상태 변경 실패", 'error');
        } finally {
            setIsUpdating(false);
        }
    };

    const getLocName = (id?: string) => {
        if (!id) return 'N/A';
        const loc = locations.find(l => l.id === id);
        if (!loc) return id;
        if (lang === 'ko') return loc.name;
        const fieldSuffix = lang.replace('-', '_').toLowerCase();
        const key = `name_${fieldSuffix}` as keyof LocationOption;
        return (loc[key] as string) || loc.name_zh || loc.name_en || loc.name;
    };

    // Status Badge Helper
    const getStatusBadge = (status: string) => {
        const styles: Record<string, string> = {
            [BookingStatus.PENDING]: 'bg-gray-100 text-gray-600',
            [BookingStatus.CONFIRMED]: 'bg-teal-100 text-teal-600',
            [BookingStatus.TRANSIT]: 'bg-blue-100 text-blue-600',
            [BookingStatus.STORAGE]: 'bg-purple-100 text-purple-600',
            [BookingStatus.ARRIVED]: 'bg-green-100 text-green-600',
            [BookingStatus.COMPLETED]: 'bg-gray-800 text-bee-yellow',
            [BookingStatus.CANCELLED]: 'bg-red-100 text-red-600',
        };
        return (
            <span className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider ${styles[status] || 'bg-gray-100 text-gray-400'}`}>
                {getStatusLabel(status)}
            </span>
        );
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-bee-black flex items-center justify-center">
                <div className="w-10 h-10 border-4 border-bee-yellow border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    // 카메라 스캐너 화면 — URL에 ID 없을 때 자동으로 표시됨
    if (showScanner) {
        return (
            <div className="min-h-screen bg-bee-black flex flex-col">
                <header className="px-6 py-4 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <button title="뒤로" onClick={onBack} className="w-11 h-11 bg-white/10 rounded-full flex items-center justify-center text-white active:scale-95 transition-transform">
                            <i className="fa-solid fa-chevron-left text-xs"></i>
                        </button>
                        <span className="font-black text-bee-yellow italic text-lg tracking-tight">Staff Mode</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                        <span className="text-[10px] font-bold text-gray-400">{adminName || 'Staff'}</span>
                    </div>
                </header>
                <QRScanModal
                    onDetect={(id) => setBookingId(id)}
                    onClose={onBack}
                    inline
                />
            </div>
        );
    }

    if (error || !booking) {
        return (
            <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6 text-center">
                <i className="fa-solid fa-circle-exclamation text-4xl text-bee-yellow mb-4"></i>
                <p className="text-gray-800 font-black text-lg mb-2">{error || (scanText.invalid_access || "잘못된 접근입니다.")}</p>
                <button
                    onClick={() => { setError(null); setBookingId(null); setShowScanner(true); }}
                    className="px-8 py-3 bg-bee-yellow text-bee-black rounded-2xl font-black text-sm shadow-lg active:scale-95 transition-all mb-3"
                >
                    <i className="fa-solid fa-qrcode mr-2"></i>다시 스캔하기
                </button>
                <button
                    onClick={onBack}
                    title="Go back"
                    className="px-8 py-3 bg-bee-black text-bee-yellow rounded-2xl font-black text-sm shadow-lg active:scale-95 transition-all"
                >
                    {scanText.admin_home || "돌아가기"}
                </button>
            </div>
        );
    }

    const canStartHandling =
        booking.status === BookingStatus.PENDING ||
        booking.status === BookingStatus.CONFIRMED;

    return (
        <div className="min-h-screen bg-[#fafafb] pb-32 font-sans">
            {/* Toast */}
            <AnimatePresence>
                {toast && (
                    <motion.div
                        initial={{ y: -60, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: -60, opacity: 0 }}
                        className={`fixed top-4 left-1/2 -translate-x-1/2 z-[100] px-5 py-3 rounded-2xl font-black text-sm shadow-2xl whitespace-nowrap ${
                            toast.type === 'error'
                                ? 'bg-red-500 text-white'
                                : 'bg-green-500 text-white'
                        }`}
                    >
                        {toast.type === 'success' ? '✓ ' : '✕ '}{toast.msg}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Header */}
            <header className="bg-bee-black px-6 py-4 flex justify-between items-center sticky top-0 z-50">
                <div className="flex items-center gap-3">
                    <button title={t.common?.back || "Back"} aria-label={t.common?.back || "Back"} onClick={onBack} className="w-11 h-11 bg-white/10 rounded-full flex items-center justify-center text-white active:scale-95 transition-transform">
                        <i className="fa-solid fa-chevron-left text-xs"></i>
                    </button>
                    <span className="font-black text-bee-yellow italic text-lg tracking-tight">{scanText.staff_mode || "Staff Mode"}</span>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => { setBooking(null); setBookingId(null); setError(null); setShowScanner(true); }}
                        className="px-3 py-1.5 bg-bee-yellow text-bee-black rounded-xl font-black text-[11px] flex items-center gap-1.5 active:scale-95 transition-all"
                    >
                        <i className="fa-solid fa-qrcode text-xs"></i>다시 스캔
                    </button>
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                        <span className="text-[10px] font-bold text-gray-400">{adminName || 'Staff'}</span>
                    </div>
                </div>
            </header>

            <main className="p-6 max-w-lg mx-auto space-y-6">
                {/* Status Card */}
                <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    className="bg-white rounded-[32px] p-6 shadow-xl border border-gray-100"
                >
                    <div className="flex justify-between items-start mb-4">
                        <div>
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">{scanText.current_status || "Current Status"}</p>
                            {getStatusBadge(booking.status)}
                        </div>
                        <div className="text-right">
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">{scanText.booking_id || "Booking ID"}</p>
                            <p className="text-xs font-black text-bee-black">{booking.id}</p>
                        </div>
                    </div>

                    <div className="pt-4 border-t border-gray-100">
                        <h2 className="text-2xl font-black text-bee-black mb-1">{booking.userName}</h2>
                        <p className="text-xs font-bold text-gray-400">{(booking.snsChannel || booking.snsType || 'kakao').toUpperCase()}: {booking.snsId}</p>
                    </div>
                </motion.div>

                {/* Route Info */}
                <motion.div
                    initial={{ y: 30, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.1 }}
                    className="bg-white rounded-[32px] p-6 shadow-xl border border-gray-100"
                >
                    <div className="flex items-center gap-4 mb-6">
                        <div className={`w-10 h-10 rounded-2xl flex items-center justify-center text-lg shadow-inner ${booking.serviceType === ServiceType.DELIVERY ? 'bg-bee-yellow text-bee-black' : 'bg-gray-100 text-gray-500'}`}>
                            <i className={`fa-solid ${booking.serviceType === ServiceType.DELIVERY ? 'fa-truck-fast' : 'fa-warehouse'}`}></i>
                        </div>
                        <div>
                            <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">{scanText.service_type || "Service Type"}</p>
                            <p className="text-base font-black text-bee-black">{booking.serviceType === ServiceType.DELIVERY ? t.booking?.delivery : t.booking?.storage}</p>
                        </div>
                    </div>

                    <div className="space-y-6 relative">
                        <div className="absolute left-[7px] top-2 bottom-2 w-0.5 bg-gray-100"></div>

                        <div className="relative pl-8">
                            <div className="absolute left-0 top-1.5 w-4 h-4 rounded-full border-4 border-white bg-bee-black shadow-sm"></div>
                            <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">{scanText.from || t.booking?.from || "From"}</p>
                            <p className="text-sm font-bold text-bee-black leading-tight mb-1">{getLocName(booking.pickupLocation)}</p>
                            <p className="text-xs text-gray-400">{booking.pickupDate} {booking.pickupTime}</p>
                        </div>

                        <div className="relative pl-8">
                            <div className="absolute left-0 top-1.5 w-4 h-4 rounded-full border-4 border-white bg-bee-yellow shadow-sm"></div>
                            <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">{scanText.to || t.booking?.to || "To"}</p>
                            <p className="text-sm font-bold text-bee-black leading-tight mb-1">
                                {booking.serviceType === ServiceType.DELIVERY
                                    ? (booking.dropoffLocation ? getLocName(booking.dropoffLocation) : booking.dropoffAddress)
                                    : `${getLocName(booking.pickupLocation)} (${t.booking_voucher?.storage || t.locations_page?.tag_storage || 'Storage'})`}
                            </p>
                            <p className="text-xs text-gray-400">{booking.dropoffDate} {booking.serviceType === ServiceType.DELIVERY ? booking.deliveryTime : ''}</p>
                        </div>
                    </div>
                </motion.div>

                {/* Nametag Card — 번호 있으면 크게, 없으면 입력 폼 */}
                <motion.div
                    initial={{ y: 30, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.12 }}
                    className="bg-bee-black rounded-[32px] overflow-hidden shadow-xl"
                >
                    {booking.serviceType !== ServiceType.DELIVERY ? (
                        <div className="p-6">
                            <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-3 text-center">
                                🧳 &nbsp;보관번호 (지점별 1~30, KST 일 단위)
                            </p>
                            {Array.isArray(booking.storageNumbers) && booking.storageNumbers.length > 0 ? (
                                <div className="bg-bee-yellow rounded-[24px] py-8 flex flex-col items-center justify-center mb-4 shadow-[0_10px_40px_rgba(255,191,0,0.4)]">
                                    <span className="text-[72px] font-black text-bee-black leading-none tracking-tighter">
                                        {(() => {
                                            const ns = booking.storageNumbers as number[];
                                            if (ns.length <= 4) return ns.join(',');
                                            const start = ns[0];
                                            const end = ns[ns.length - 1];
                                            return start === end ? String(start) : `${start}-${end}`;
                                        })()}
                                    </span>
                                    <span className="text-[11px] font-black text-bee-black/50 uppercase tracking-[0.3em] mt-1">STORAGE NO.</span>
                                </div>
                            ) : (
                                <div className="bg-white/10 rounded-[24px] py-8 px-5 text-center border border-white/10">
                                    <p className="text-sm font-black text-white">아직 보관번호가 배정되지 않았어요</p>
                                    <p className="text-[11px] font-bold text-gray-500 mt-2">
                                        결제완료 시점에 자동으로 배정됩니다.
                                    </p>
                                </div>
                            )}
                            <p className="text-[10px] text-gray-500 font-bold text-center">
                                고객 바우처(QR)에 보관번호가 크게 표시됩니다.
                            </p>
                        </div>
                    ) : booking.nametagId ? (
                        /* ── 태그 번호 배정됨: 대형 표시 ── */
                        <div className="p-6">
                            <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-3 text-center">
                                🏷️ &nbsp;배송 태그 번호
                            </p>
                            {/* 번호 대형 표시 */}
                            <div className="bg-bee-yellow rounded-[24px] py-8 flex flex-col items-center justify-center mb-4 shadow-[0_10px_40px_rgba(255,191,0,0.4)]">
                                <span className="text-[80px] font-black text-bee-black leading-none tracking-tighter">
                                    {booking.nametagId}
                                </span>
                                <span className="text-[11px] font-black text-bee-black/50 uppercase tracking-[0.3em] mt-1">TAG NO.</span>
                            </div>
                            <p className="text-[10px] text-gray-500 font-bold text-center mb-4">
                                위 번호 태그를 고객 짐에 부착하세요
                            </p>
                            {/* 번호 변경 (접혀있음 — 필요 시 입력) */}
                            <div className="flex gap-2">
                                <input
                                    type="number"
                                    min={1}
                                    max={100}
                                    value={nametagInput}
                                    onChange={e => setNametagInput(e.target.value)}
                                    onKeyDown={e => e.key === 'Enter' && handleNametagSave()}
                                    placeholder={`변경 시 입력 (현재: ${booking.nametagId}번)`}
                                    aria-label="태그 번호 변경"
                                    className="flex-1 bg-white/10 text-white font-bold text-center text-base rounded-2xl py-2.5 px-3 border border-white/10 focus:outline-none focus:border-bee-yellow placeholder-gray-600 text-sm"
                                />
                                <button
                                    onClick={handleNametagSave}
                                    disabled={isUpdating || !nametagInput}
                                    className="px-4 py-2.5 bg-white/10 text-white rounded-2xl font-black text-xs disabled:opacity-30 active:scale-95 transition-all border border-white/10"
                                >
                                    {isUpdating
                                        ? <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin inline-block"></span>
                                        : nametagSaved ? '✓' : '변경'}
                                </button>
                            </div>
                        </div>
                    ) : (
                        /* ── 태그 번호 미배정: 입력 폼 ── */
                        <div className="p-6">
                            <div className="flex items-center gap-3 mb-5">
                                <div className="w-10 h-10 rounded-2xl bg-bee-yellow flex items-center justify-center text-bee-black text-lg">🏷️</div>
                                <div>
                                    <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">배송 태그 번호</p>
                                    <p className="text-sm font-black text-white">번호를 배정해주세요</p>
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <input
                                    type="number"
                                    min={1}
                                    max={100}
                                    value={nametagInput}
                                    onChange={e => setNametagInput(e.target.value)}
                                    onKeyDown={e => e.key === 'Enter' && handleNametagSave()}
                                    placeholder="1 ~ 100"
                                    aria-label="태그 번호 (1~100)"
                                    className="flex-1 bg-white/10 text-white font-black text-center text-2xl rounded-2xl py-4 px-4 border border-white/20 focus:outline-none focus:border-bee-yellow placeholder-gray-600"
                                />
                                <button
                                    onClick={handleNametagSave}
                                    disabled={isUpdating || !nametagInput}
                                    className="px-6 py-4 bg-bee-yellow text-bee-black rounded-2xl font-black text-sm disabled:opacity-40 active:scale-95 transition-all"
                                >
                                    {isUpdating
                                        ? <span className="w-4 h-4 border-2 border-bee-black border-t-transparent rounded-full animate-spin inline-block"></span>
                                        : nametagSaved ? '✓ 저장됨' : '배정'}
                                </button>
                            </div>
                            <p className="text-[10px] text-gray-500 font-bold mt-3 text-center">
                                번호 배정 후 해당 태그를 고객 짐에 부착하세요
                            </p>
                        </div>
                    )}
                </motion.div>

                {/* Payment & Receipt Info */}
                <motion.div
                    initial={{ y: 35, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.17 }}
                    className="bg-white rounded-[32px] p-6 shadow-xl border border-gray-100"
                >
                    <div className="flex justify-between items-center mb-4">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center text-gray-400">
                                <i className="fa-solid fa-receipt"></i>
                            </div>
                            <span className="text-sm font-black text-bee-black">{scanText.payment_details || "Payment Details"}</span>
                        </div>
                        <span className={`px-2 py-1 rounded text-[10px] font-black uppercase tracking-wider ${booking.paymentStatus === 'paid' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                            {getPaymentStatusLabel(booking.paymentStatus)}
                        </span>
                    </div>

                    <div className="space-y-3 pt-3 border-t border-gray-100">
                        <div className="flex justify-between items-center">
                            <span className="text-xs font-bold text-gray-400">{scanText.method || "Method"}</span>
                            <span className="text-xs font-black text-bee-black uppercase">
                                {booking.paymentMethod || 'Card'}
                            </span>
                        </div>
                        {booking.discountAmount ? (
                            <div className="flex justify-between items-center">
                                <span className="text-xs font-bold text-gray-400">
                                    {(scanText.discount || 'Discount')} {booking.promoCode ? <span className="text-[9px] bg-red-50 text-red-500 px-1.5 py-0.5 rounded ml-1">{booking.promoCode}</span> : ''}
                                </span>
                                <span className="text-xs font-bold text-red-500">
                                    -{booking.discountAmount.toLocaleString()} KRW
                                </span>
                            </div>
                        ) : null}
                        <div className="flex justify-between items-center pt-2 border-t border-gray-50">
                            <span className="text-xs font-black text-gray-500">{scanText.total_amount || "Total Amount"}</span>
                            <span className="text-lg font-black text-blue-600">
                                {(booking.finalPrice ?? booking.price ?? 0).toLocaleString()} <span className="text-xs ml-1 text-gray-400">KRW</span>
                            </span>
                        </div>
                    </div>
                </motion.div>

                {/* Update Actions - Enhanced Workflow 💅 */}
                <motion.div
                    initial={{ y: 40, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.2 }}
                    className="space-y-4"
                >
                    <div className="flex items-center justify-between mb-2">
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">{scanText.update_status || "Update Status"}</p>
                        <span className="text-[9px] font-bold text-bee-yellow bg-bee-black px-2 py-0.5 rounded-full uppercase tracking-tighter">Staff Authorization Verified 🛡️</span>
                    </div>
                    
                    {/* 원터치 워크플로우 버튼 — PENDING / CONFIRMED 모두 대응 */}
                    {canStartHandling && (
                        <div className="space-y-3">
                            {booking.serviceType === ServiceType.STORAGE ? (
                                <button
                                    onClick={() => handleStatusUpdate(BookingStatus.STORAGE)}
                                    disabled={isUpdating}
                                    className="w-full py-5 bg-bee-yellow text-bee-black rounded-[24px] font-black text-base shadow-[0_10px_30px_rgba(255,191,0,0.3)] active:scale-[0.98] transition-all border-2 border-white flex flex-col items-center justify-center gap-1"
                                >
                                    <div className="flex items-center">
                                        {isUpdating
                                            ? <span className="w-5 h-5 border-2 border-bee-black border-t-transparent rounded-full animate-spin mr-2"></span>
                                            : <i className="fa-solid fa-box-archive mr-2 text-xl"></i>
                                        }
                                        {lang === 'ko' ? '짐 보관 시작하기' : 'Start Storage'}
                                    </div>
                                    <span className="text-[10px] opacity-70 font-bold uppercase tracking-tight">
                                        {booking.status} ➔ STORAGE
                                    </span>
                                </button>
                            ) : (
                                <button
                                    onClick={() => handleStatusUpdate(BookingStatus.TRANSIT)}
                                    disabled={isUpdating}
                                    className="w-full py-5 bg-bee-black text-bee-yellow rounded-[24px] font-black text-base shadow-[0_10px_30px_rgba(0,0,0,0.2)] active:scale-[0.98] transition-all border-2 border-bee-yellow/20 flex flex-col items-center justify-center gap-1"
                                >
                                    <div className="flex items-center">
                                        {isUpdating
                                            ? <span className="w-5 h-5 border-2 border-bee-yellow border-t-transparent rounded-full animate-spin mr-2"></span>
                                            : <i className="fa-solid fa-truck-fast mr-2 text-xl"></i>
                                        }
                                        {lang === 'ko' ? '배송 시작하기' : 'Start Delivery'}
                                    </div>
                                    <span className="text-[10px] opacity-70 font-bold uppercase tracking-tight">
                                        {booking.status} ➔ TRANSIT
                                    </span>
                                </button>
                            )}
                        </div>
                    )}

                    {booking.status === BookingStatus.TRANSIT && (
                        <button
                            onClick={() => handleStatusUpdate(BookingStatus.ARRIVED)}
                            disabled={isUpdating}
                            className="w-full py-5 bg-blue-600 text-white rounded-[24px] font-black text-base shadow-[0_10px_30px_rgba(37,99,235,0.3)] active:scale-[0.98] transition-all border-2 border-white/20 flex flex-col items-center justify-center gap-1"
                        >
                            <div className="flex items-center">
                                <i className="fa-solid fa-location-dot mr-2 text-xl"></i> {lang === 'ko' ? '도착 완료 (지점/호텔)' : 'Mark as Arrived'}
                            </div>
                            <span className="text-[10px] opacity-70 font-bold uppercase tracking-tight">Status Update: TRANSIT ➔ ARRIVED</span>
                        </button>
                    )}

                    {(booking.status === BookingStatus.STORAGE || booking.status === BookingStatus.ARRIVED) && (
                        <button
                            onClick={() => handleStatusUpdate(BookingStatus.COMPLETED)}
                            disabled={isUpdating}
                            className="w-full py-5 bg-green-500 text-white rounded-[24px] font-black text-base shadow-[0_10px_30px_rgba(34,197,94,0.3)] active:scale-[0.98] transition-all border-2 border-white/20 flex flex-col items-center justify-center gap-1"
                        >
                            <div className="flex items-center">
                                <i className="fa-solid fa-handshake mr-2 text-xl"></i> {lang === 'ko' ? '고객 수령 완료 (최종)' : 'Handover to Customer'}
                            </div>
                            <span className="text-[10px] opacity-70 font-bold uppercase tracking-tight">Final Step: Complete Reservation</span>
                        </button>
                    )}

                    {booking.status === BookingStatus.COMPLETED && (
                        <div className="w-full py-8 bg-gray-50 border-2 border-dashed border-gray-200 rounded-[24px] flex flex-col items-center justify-center text-gray-400 gap-2">
                            <i className="fa-solid fa-circle-check text-3xl opacity-20"></i>
                            <p className="font-black text-sm uppercase tracking-widest">{scanText.already_completed || 'Mission Accomplished'}</p>
                        </div>
                    )}

                    {/* Quick Payment Info Overlay 💅 */}
                    <div className="mt-8 bg-white/40 backdrop-blur-md border border-white/60 rounded-[32px] p-6 shadow-sm">
                        <div className="flex justify-between items-center">
                            <div className="space-y-1">
                                <p className="text-[9px] font-black text-gray-400 uppercase tracking-[0.2em]">{scanText.total_payment || 'Payment Summary'}</p>
                                <h4 className="text-xl font-black text-bee-black">
                                    {(booking.finalPrice ?? booking.price ?? 0).toLocaleString()} <span className="text-sm font-bold opacity-30">KRW</span>
                                </h4>
                            </div>
                            <div className={`px-4 py-2 rounded-2xl border-2 ${booking.paymentStatus === 'paid' ? 'bg-green-500/10 border-green-500/20 text-green-600' : 'bg-red-500/10 border-red-500/20 text-red-600'} flex flex-col items-end`}>
                                <span className="text-[10px] font-black uppercase tracking-tighter">
                                    {booking.paymentStatus === 'paid' ? 'Verified' : 'Unpaid'}
                                </span>
                                <span className="text-[8px] font-black opacity-60">
                                    {booking.paymentMethod?.toUpperCase() || 'CASH/CARD'}
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="pt-6 flex justify-center">
                        <button 
                            onClick={() => window.location.reload()}
                            className="text-[10px] font-black text-gray-400 hover:text-bee-black transition-colors uppercase tracking-[0.3em]"
                        >
                            <i className="fa-solid fa-rotate mr-2"></i> Refresh Data
                        </button>
                    </div>
                </motion.div>
            </main>

            {/* Floating Image Preview (if present) */}
            {(booking.imageUrl || booking.pickupImageUrl) && (
                <div className="fixed bottom-6 right-6">
                    <button title={scanText.preview_image || 'Preview Image'} aria-label={scanText.preview_image || 'Preview Image'} className="w-14 h-14 rounded-full bg-white shadow-2xl border border-gray-100 flex items-center justify-center text-bee-black" onClick={() => window.open(booking.imageUrl || booking.pickupImageUrl, '_blank')}>
                        <i className="fa-solid fa-image text-xl"></i>
                    </button>
                </div>
            )}
        </div>
    );
};

export default StaffScanPage;
