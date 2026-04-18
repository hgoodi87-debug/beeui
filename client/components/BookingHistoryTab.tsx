import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
    ShoppingBag,
    MapPin,
    Package,
    Calendar,
} from "lucide-react";
import { auth, getActiveCustomerAccessToken } from "../firebaseApp";
import { supabaseGet } from "../services/supabaseClient";

interface BookingRow {
    id: string;
    reservation_code: string | null;
    user_name: string | null;
    service_type: string | null;
    pickup_date: string | null;
    pickup_time: string | null;
    pickup_location: string | null;
    dropoff_location: string | null;
    final_price: number | null;
    bags: number | null;
    settlement_status: string | null;
    ops_status: string | null;
    created_at: string;
}

const STATUS_LABEL: Record<string, string> = {
    PENDING: '접수 대기',
    CONFIRMED: '확정',
    PAID_OUT: '정산 완료',
    MONTHLY_INCLUDED: '월 정산',
    ON_HOLD: '보류',
    CANCELLED: '취소',
    REFUNDED: '환불',
    DELETED: '삭제됨',
};

const STATUS_COLOR: Record<string, string> = {
    PENDING: 'bg-amber-100 text-amber-700',
    CONFIRMED: 'bg-green-100 text-green-600',
    PAID_OUT: 'bg-blue-100 text-blue-700',
    CANCELLED: 'bg-red-100 text-red-500',
    REFUNDED: 'bg-gray-100 text-gray-400',
};

interface BookingHistoryTabProps {
    t: any;
}

const BookingHistoryTab: React.FC<BookingHistoryTabProps> = ({ t }) => {
    const [bookings, setBookings] = useState<BookingRow[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [hasError, setHasError] = useState(false);

    useEffect(() => {
        const fetchBookings = async () => {
            const email = auth.currentUser?.email;
            if (!email) { setIsLoading(false); return; }

            try {
                const token = await getActiveCustomerAccessToken();
                const encoded = encodeURIComponent(email);
                const data = await supabaseGet<BookingRow[]>(
                    `booking_details?user_email=eq.${encoded}&settlement_status=neq.DELETED&order=created_at.desc&limit=50&select=id,reservation_code,user_name,service_type,pickup_date,pickup_time,pickup_location,dropoff_location,final_price,bags,settlement_status,ops_status,created_at`,
                    token,
                );
                data.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
                setBookings(data);
            } catch (error) {
                console.error("[BookingHistoryTab] fetch error:", error);
                setHasError(true);
            } finally {
                setIsLoading(false);
            }
        };

        fetchBookings();
    }, []);

    if (isLoading) {
        return (
            <div className="py-20 flex flex-col items-center justify-center gap-4">
                <div className="w-8 h-8 border-3 border-bee-yellow border-t-transparent rounded-full animate-spin" />
                <p className="text-[10px] font-black text-black/20 uppercase tracking-widest">Loading...</p>
            </div>
        );
    }

    if (hasError) {
        return (
            <div className="py-16 flex flex-col items-center text-center px-6 gap-4">
                <p className="text-sm font-bold text-red-500">예약 내역을 불러오지 못했습니다.</p>
                <button
                    onClick={() => { setHasError(false); setIsLoading(true); }}
                    className="px-4 py-2 bg-bee-yellow text-bee-black rounded-xl font-black text-xs"
                >
                    다시 시도
                </button>
            </div>
        );
    }

    if (bookings.length === 0) {
        return (
            <div className="py-20 flex flex-col items-center justify-center text-center px-10">
                <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-6">
                    <ShoppingBag className="w-8 h-8 text-black/10" />
                </div>
                <h3 className="text-lg font-black text-black mb-2">예약 내역이 없어요</h3>
                <p className="text-xs font-bold text-black/30 break-keep">
                    빌리버와 함께 스마트한 여행을 시작해보세요! ✨
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between mb-4 px-2">
                <h3 className="text-[10px] font-black text-black/30 uppercase tracking-[0.2em]">
                    All Bookings ({bookings.length})
                </h3>
            </div>

            {bookings.map((b, idx) => {
                const isDelivery = b.service_type === 'DELIVERY';
                const statusKey = b.settlement_status ?? 'PENDING';

                return (
                    <motion.div
                        key={b.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.04 }}
                        className="bg-white rounded-3xl p-6 border border-black/5 hover:border-bee-yellow/20 transition-all hover:shadow-xl hover:shadow-black/5"
                    >
                        {/* 상단: 서비스 타입 + 상태 */}
                        <div className="flex items-start justify-between mb-5">
                            <div className="flex items-center gap-3">
                                <div className={`w-10 h-10 rounded-2xl flex items-center justify-center ${isDelivery ? 'bg-blue-50 text-blue-500' : 'bg-green-50 text-green-500'}`}>
                                    {isDelivery ? <Package className="w-5 h-5" /> : <ShoppingBag className="w-5 h-5" />}
                                </div>
                                <div>
                                    <p className="text-[10px] font-black text-black/30 uppercase tracking-widest mb-0.5">
                                        {isDelivery ? 'DELIVERY' : 'STORAGE'}
                                    </p>
                                    <h4 className="text-sm font-black text-black">
                                        {b.reservation_code ? `#${b.reservation_code}` : b.id.slice(0, 8)}
                                    </h4>
                                </div>
                            </div>
                            <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${STATUS_COLOR[statusKey] ?? 'bg-gray-100 text-gray-400'}`}>
                                {STATUS_LABEL[statusKey] ?? statusKey}
                            </span>
                        </div>

                        {/* 일자 + 장소 */}
                        <div className="grid grid-cols-2 gap-4 py-4 border-y border-black/5">
                            {b.pickup_date && (
                                <div className="space-y-1">
                                    <div className="flex items-center gap-1.5 text-black/20">
                                        <Calendar className="w-3 h-3" />
                                        <span className="text-[9px] font-black uppercase tracking-widest">Date</span>
                                    </div>
                                    <p className="text-xs font-bold text-black">
                                        {b.pickup_date}
                                        {b.pickup_time ? ` ${b.pickup_time.slice(0, 5)}` : ''}
                                    </p>
                                </div>
                            )}
                            {(b.pickup_location || b.dropoff_location) && (
                                <div className="space-y-1">
                                    <div className="flex items-center gap-1.5 text-black/20">
                                        <MapPin className="w-3 h-3" />
                                        <span className="text-[9px] font-black uppercase tracking-widest">Location</span>
                                    </div>
                                    <p className="text-xs font-bold text-black truncate">
                                        {isDelivery ? (b.dropoff_location ?? b.pickup_location) : b.pickup_location}
                                    </p>
                                </div>
                            )}
                        </div>

                        {/* 하단: 가방 수 + 금액 */}
                        <div className="mt-4 flex items-center justify-between">
                            <div className="flex -space-x-2">
                                {[...Array(Math.min(b.bags ?? 0, 3))].map((_, i) => (
                                    <div key={i} className="w-6 h-6 rounded-full bg-slate-100 border-2 border-white flex items-center justify-center">
                                        <Package className="w-3 h-3 text-black/20" />
                                    </div>
                                ))}
                                {(b.bags ?? 0) > 3 && (
                                    <div className="w-6 h-6 rounded-full bg-slate-100 border-2 border-white flex items-center justify-center text-[8px] font-black text-black/30">
                                        +{(b.bags ?? 0) - 3}
                                    </div>
                                )}
                            </div>
                            {b.final_price != null && b.final_price > 0 && (
                                <span className="font-black text-bee-black text-sm tabular-nums">
                                    ₩{b.final_price.toLocaleString()}
                                </span>
                            )}
                        </div>
                    </motion.div>
                );
            })}

            <div className="pt-8 pb-4 text-center">
                <p className="text-[10px] font-black text-black/10 uppercase tracking-[0.3em]">Beeliber Customer Care</p>
            </div>
        </div>
    );
};

export default BookingHistoryTab;
