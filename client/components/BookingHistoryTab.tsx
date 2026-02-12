import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
    ShoppingBag,
    MapPin,
    Clock,
    ChevronRight,
    Package,
    Calendar,
    AlertCircle
} from "lucide-react";
import { auth } from "../firebaseApp";
import { StorageService } from "../services/storageService";
import { LocationOption, LocationType, BookingState, ServiceType, BookingStatus } from '../types';

interface BookingHistoryTabProps {
    t: any;
}

const BookingHistoryTab: React.FC<BookingHistoryTabProps> = ({ t }) => {
    const [bookings, setBookings] = useState<BookingState[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchBookings = async () => {
            const email = auth.currentUser?.email;
            if (!email) {
                setIsLoading(false);
                return;
            }

            try {
                const data = await StorageService.searchBookingsByEmail(email);
                // Sort by date descending
                data.sort((a, b) => new Date(b.createdAt || '').getTime() - new Date(a.createdAt || '').getTime());
                setBookings(data);
            } catch (error) {
                console.error("Error fetching bookings:", error);
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
                <p className="text-[10px] font-black text-black/20 uppercase tracking-widest">Loading History...</p>
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
                    빌리버와 함께 스마트한 여행을 시작해보세요! 첫 예약 시 특별한 혜택이 기다리고 있습니다. ✨
                </p>
                <button
                    title="Book Now"
                    aria-label="Book Now"
                    className="mt-8 px-8 py-4 bg-bee-black text-bee-yellow rounded-2xl text-xs font-black uppercase tracking-widest shadow-lg shadow-black/10 hover:scale-105 active:scale-95 transition-all"
                >
                    Book Now
                </button>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between mb-4 px-2">
                <h3 className="text-[10px] font-black text-black/30 uppercase tracking-[0.2em]">All Bookings ({bookings.length})</h3>
                <button className="text-[10px] font-black text-bee-black hover:text-[#FF495C] transition-colors uppercase tracking-widest">Filter</button>
            </div>

            {bookings.map((booking, idx) => (
                <motion.div
                    key={booking.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    className="bg-white rounded-3xl p-6 border border-black/5 hover:border-bee-yellow/20 transition-all hover:shadow-xl hover:shadow-black/5 cursor-pointer group"
                >
                    <div className="flex items-start justify-between mb-6">
                        <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-2xl flex items-center justify-center ${booking.serviceType === 'DELIVERY' ? 'bg-blue-50 text-blue-500' : 'bg-green-50 text-green-500'}`}>
                                {booking.serviceType === 'DELIVERY' ? <Package className="w-5 h-5" /> : <ShoppingBag className="w-5 h-5" />}
                            </div>
                            <div>
                                <p className="text-[10px] font-black text-black/30 uppercase tracking-widest mb-0.5">{booking.serviceType}</p>
                                <h4 className="text-sm font-black text-black">{booking.id}</h4>
                            </div>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${booking.status === BookingStatus.COMPLETED ? 'bg-green-100 text-green-600' :
                            booking.status === BookingStatus.CANCELLED ? 'bg-red-100 text-red-600' :
                                'bg-bee-yellow/10 text-bee-black'
                            }`}>
                            {booking.status}
                        </span>
                    </div>

                    <div className="grid grid-cols-2 gap-4 py-4 border-y border-black/5">
                        <div className="space-y-1">
                            <div className="flex items-center gap-1.5 text-black/20">
                                <Calendar className="w-3 h-3" />
                                <span className="text-[9px] font-black uppercase tracking-widest">Schedule</span>
                            </div>
                            <p className="text-xs font-bold text-black">{booking.pickupDate} {booking.pickupTime}</p>
                        </div>
                        <div className="space-y-1">
                            <div className="flex items-center gap-1.5 text-black/20">
                                <MapPin className="w-3 h-3" />
                                <span className="text-[9px] font-black uppercase tracking-widest">Location</span>
                            </div>
                            <p className="text-xs font-bold text-black truncate">{booking.pickupLocation}</p>
                        </div>
                    </div>

                    <div className="mt-6 flex items-center justify-between">
                        <div className="flex -space-x-2">
                            {[...Array(Math.min(booking.bags || 0, 3))].map((_, i) => (
                                <div key={i} className="w-6 h-6 rounded-full bg-slate-100 border-2 border-white flex items-center justify-center">
                                    <Package className="w-3 h-3 text-black/20" />
                                </div>
                            ))}
                            {(booking.bags || 0) > 3 && (
                                <div className="w-6 h-6 rounded-full bg-slate-100 border-2 border-white flex items-center justify-center text-[8px] font-black text-black/30">
                                    +{(booking.bags || 0) - 3}
                                </div>
                            )}
                        </div>
                        <div className="flex items-center gap-1.5 text-bee-black group-hover:gap-3 transition-all cursor-pointer" title="View Booking Details" aria-label="View Booking Details">
                            <span className="text-[10px] font-black uppercase tracking-widest">Details</span>
                            <ChevronRight className="w-4 h-4" />
                        </div>
                    </div>
                </motion.div>
            ))}

            <div className="pt-8 pb-4 text-center">
                <p className="text-[10px] font-black text-black/10 uppercase tracking-[0.3em]">Beeliber Customer Care</p>
            </div>
        </div>
    );
};

export default BookingHistoryTab;
