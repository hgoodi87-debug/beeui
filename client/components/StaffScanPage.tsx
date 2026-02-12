import React, { useState, useEffect } from 'react';
import { BookingState, BookingStatus, LocationOption, ServiceType } from '../types';
import { StorageService } from '../services/storageService';
import { motion, AnimatePresence } from 'framer-motion';

interface StaffScanPageProps {
    onBack: () => void;
    adminName?: string;
    t: any;
    lang: string;
}

const StaffScanPage: React.FC<StaffScanPageProps> = ({ onBack, adminName, t, lang }) => {
    const [bookingId, setBookingId] = useState<string | null>(null);
    const [booking, setBooking] = useState<BookingState | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [locations, setLocations] = useState<LocationOption[]>([]);
    const [isUpdating, setIsUpdating] = useState(false);

    useEffect(() => {
        // 1. URL에서 ID 파싱
        const params = new URLSearchParams(window.location.search);
        const id = params.get('id');
        setBookingId(id);

        // 2. 지점 정보 로드
        StorageService.getLocations().then(setLocations).catch(console.error);
    }, []);

    useEffect(() => {
        if (bookingId) {
            loadBooking(bookingId);
        } else {
            setIsLoading(false);
            setError("스캔된 예약 정보가 없습니다.");
        }
    }, [bookingId]);

    const loadBooking = async (id: string) => {
        setIsLoading(true);
        try {
            // 직접 ID로 문서 조회 (StorageService에 getBookingById가 없으므로 getBookings안에서 찾거나, 직접 구현 필요)
            // 여기서는 효율성을 위해 전체 로드 대신 getBookings를 사용하지만, 추후 최적화 가능
            // StorageService.getBookings는 전체를 가져오므로 비효율적일 수 있음. 
            // 하지만 현재 API 구조상 getDoc을 직접 쓰는게 나음. 
            // StorageService.getBooking(id)가 없으므로... 일단 getBookings에서 찾거나, 
            // AdminDashboard.tsx 처럼 실시간 구독 데이터를 쓰거나 해야함.
            // 하지만 여기는 단독 페이지이므로 직접 조회가 맞음.
            // -> StorageService에 getBooking이 없으므로, 임시로 getBookings() 사용 (데이터가 적다는 가정하에)
            // *개선*: StorageService에 getBooking(id) 추가하면 좋겠지만, 일단 기존 함수 활용.

            const allBookings = await StorageService.getBookings();
            const found = allBookings.find(b => b.id === id);

            if (found) {
                setBooking(found);
            } else {
                setError("예약 정보를 찾을 수 없습니다.");
            }
        } catch (err) {
            console.error(err);
            setError("데이터 로드 중 오류가 발생했습니다.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleStatusUpdate = async (newStatus: BookingStatus) => {
        if (!booking) return;
        if (!confirm(`상태를 '${newStatus}'(으)로 변경하시겠습니까?`)) return;

        setIsUpdating(true);
        try {
            await StorageService.updateBooking(booking.id!, { status: newStatus });

            // 로컬 상태 즉시 업데이트
            setBooking(prev => prev ? { ...prev, status: newStatus } : null);
            alert("상태가 변경되었습니다.");
        } catch (err) {
            console.error(err);
            alert("상태 변경 실패");
        } finally {
            setIsUpdating(false);
        }
    };

    const getLocName = (id?: string) => {
        if (!id) return 'N/A';
        const loc = locations.find(l => l.id === id);
        return loc ? (lang === 'ko' ? loc.name : loc.name_en || loc.name) : id;
    };

    // Status Badge Helper
    const getStatusBadge = (status: string) => {
        const styles: Record<string, string> = {
            [BookingStatus.PENDING]: 'bg-gray-100 text-gray-600',
            [BookingStatus.TRANSIT]: 'bg-blue-100 text-blue-600',
            [BookingStatus.STORAGE]: 'bg-purple-100 text-purple-600',
            [BookingStatus.ARRIVED]: 'bg-green-100 text-green-600',
            [BookingStatus.COMPLETED]: 'bg-gray-800 text-bee-yellow',
            [BookingStatus.CANCELLED]: 'bg-red-100 text-red-600',
        };
        return (
            <span className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider ${styles[status] || 'bg-gray-100 text-gray-400'}`}>
                {status}
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

    if (error || !booking) {
        return (
            <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6 text-center">
                <i className="fa-solid fa-circle-exclamation text-4xl text-gray-300 mb-4"></i>
                <p className="text-gray-600 font-bold mb-6">{error || "잘못된 접근입니다."}</p>
                <button onClick={onBack} className="px-6 py-3 bg-bee-black text-bee-yellow rounded-2xl font-black text-sm">
                    관리자 홈으로
                </button>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#fafafb] pb-32 font-sans">
            {/* Header */}
            <header className="bg-bee-black px-6 py-4 flex justify-between items-center sticky top-0 z-50">
                <div className="flex items-center gap-3">
                    <button title="Back" aria-label="Back" onClick={onBack} className="w-8 h-8 bg-white/10 rounded-full flex items-center justify-center text-white active:scale-95 transition-transform">
                        <i className="fa-solid fa-chevron-left text-xs"></i>
                    </button>
                    <span className="font-black text-bee-yellow italic text-lg tracking-tight">Staff Mode</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                    <span className="text-[10px] font-bold text-gray-400">{adminName || 'Staff'}</span>
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
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Current Status</p>
                            {getStatusBadge(booking.status)}
                        </div>
                        <div className="text-right">
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Booking ID</p>
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
                            <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Service Type</p>
                            <p className="text-base font-black text-bee-black">{booking.serviceType}</p>
                        </div>
                    </div>

                    <div className="space-y-6 relative">
                        <div className="absolute left-[7px] top-2 bottom-2 w-0.5 bg-gray-100"></div>

                        <div className="relative pl-8">
                            <div className="absolute left-0 top-1.5 w-4 h-4 rounded-full border-4 border-white bg-bee-black shadow-sm"></div>
                            <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">From</p>
                            <p className="text-sm font-bold text-bee-black leading-tight mb-1">{getLocName(booking.pickupLocation)}</p>
                            <p className="text-xs text-gray-400">{booking.pickupDate} {booking.pickupTime}</p>
                        </div>

                        <div className="relative pl-8">
                            <div className="absolute left-0 top-1.5 w-4 h-4 rounded-full border-4 border-white bg-bee-yellow shadow-sm"></div>
                            <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">To</p>
                            <p className="text-sm font-bold text-bee-black leading-tight mb-1">
                                {booking.serviceType === ServiceType.DELIVERY
                                    ? (booking.dropoffLocation ? getLocName(booking.dropoffLocation) : booking.dropoffAddress)
                                    : `${getLocName(booking.pickupLocation)} (Storage)`}
                            </p>
                            <p className="text-xs text-gray-400">{booking.dropoffDate} {booking.serviceType === ServiceType.DELIVERY ? booking.deliveryTime : ''}</p>
                        </div>
                    </div>
                </motion.div>

                {/* Update Actions */}
                <motion.div
                    initial={{ y: 40, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.2 }}
                >
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 ml-2">Update Status</p>
                    <div className="grid grid-cols-2 gap-3">
                        {booking.status === BookingStatus.PENDING && (
                            <button
                                onClick={() => handleStatusUpdate(BookingStatus.TRANSIT)}
                                disabled={isUpdating}
                                className="col-span-2 py-4 bg-bee-black text-bee-yellow rounded-2xl font-black text-sm shadow-lg active:scale-[0.98] transition-all"
                            >
                                <i className="fa-solid fa-box-open mr-2"></i> 픽업/입고 확인
                            </button>
                        )}

                        {booking.status === BookingStatus.TRANSIT && (
                            <>
                                <button
                                    onClick={() => handleStatusUpdate(BookingStatus.STORAGE)}
                                    disabled={isUpdating}
                                    className="py-4 bg-white border border-gray-200 text-bee-black rounded-2xl font-bold text-sm hover:border-bee-yellow transition-all"
                                >
                                    보관 중
                                </button>
                                <button
                                    onClick={() => handleStatusUpdate(BookingStatus.ARRIVED)}
                                    disabled={isUpdating}
                                    className="py-4 bg-bee-black text-bee-yellow rounded-2xl font-black text-sm shadow-lg active:scale-[0.98] transition-all"
                                >
                                    <i className="fa-solid fa-flag-checkered mr-2"></i> 배송/도착 완료
                                </button>
                            </>
                        )}

                        {(booking.status === BookingStatus.STORAGE || booking.status === BookingStatus.ARRIVED) && (
                            <button
                                onClick={() => handleStatusUpdate(BookingStatus.COMPLETED)}
                                disabled={isUpdating}
                                className="col-span-2 py-4 bg-green-500 text-white rounded-2xl font-black text-sm shadow-lg active:scale-[0.98] transition-all"
                            >
                                <i className="fa-solid fa-check mr-2"></i> 고객 수령 (완료 처리)
                            </button>
                        )}

                        {booking.status === BookingStatus.COMPLETED && (
                            <div className="col-span-2 py-4 bg-gray-100 text-gray-400 rounded-2xl font-bold text-sm text-center">
                                이미 완료된 예약입니다
                            </div>
                        )}
                    </div>
                </motion.div>
            </main>

            {/* Floating Image Preview (if present) */}
            {(booking.imageUrl || booking.pickupImageUrl) && (
                <div className="fixed bottom-6 right-6">
                    <button title="Preview Image" aria-label="Preview Image" className="w-14 h-14 rounded-full bg-white shadow-2xl border border-gray-100 flex items-center justify-center text-bee-black" onClick={() => window.open(booking.imageUrl || booking.pickupImageUrl, '_blank')}>
                        <i className="fa-solid fa-image text-xl"></i>
                    </button>
                </div>
            )}
        </div>
    );
};

export default StaffScanPage;
