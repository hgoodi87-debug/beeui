import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    ChevronLeft,
    ShoppingBag,
    Ticket,
    Settings,
    LogOut,
    MapPin,
    Clock,
    ChevronRight,
    Gift
} from "lucide-react";
import { auth, db } from "../firebaseApp";
import { doc, getDoc, collection, query, where, getDocs, orderBy } from "firebase/firestore";
import BookingHistoryTab from "./BookingHistoryTab";
import CouponBoxTab from "./CouponBoxTab";

interface MyPageProps {
    t: any;
    onClose: () => void;
}

const MyPage: React.FC<MyPageProps> = ({ t, onClose }) => {
    const [activeTab, setActiveTab] = useState<'BOOKING' | 'COUPON'>('BOOKING');
    const [userData, setUserData] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            const user = auth.currentUser;
            if (!user || user.isAnonymous) {
                onClose();
                return;
            }

            try {
                const userDoc = await getDoc(doc(db, "users", user.uid));
                if (userDoc.exists()) {
                    setUserData(userDoc.data());
                }
            } catch (error) {
                console.error("Error fetching user data:", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, [onClose]);

    const handleLogout = async () => {
        try {
            await auth.signOut();
            onClose();
        } catch (error) {
            console.error("Logout Error:", error);
        }
    };

    if (isLoading) {
        return (
            <div className="fixed inset-0 bg-white z-[200] flex items-center justify-center">
                <div className="w-10 h-10 border-4 border-bee-yellow border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="fixed inset-0 bg-[#F8F9FA] z-[200] flex flex-col overflow-hidden font-sans">
            {/* Header */}
            <header className="bg-white px-6 h-16 flex items-center justify-between border-b border-black/5 sticky top-0 z-10">
                <button title="Back" aria-label="Back" onClick={onClose} className="p-2 -ml-2 hover:bg-gray-50 rounded-full transition-colors">
                    <ChevronLeft className="w-6 h-6" />
                </button>
                <h1 className="text-sm font-black uppercase tracking-widest">{t.mypage || 'MY PAGE'}</h1>
                <button title="Logout" aria-label="Logout" onClick={handleLogout} className="p-2 -mr-2 text-black/20 hover:text-red-500 transition-colors">
                    <LogOut className="w-5 h-5" />
                </button>
            </header>

            <div className="flex-1 overflow-y-auto pb-10">
                {/* User Card */}
                <div className="px-6 py-8">
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-bee-black rounded-[2.5rem] p-8 text-white relative overflow-hidden shadow-2xl shadow-black/10"
                    >
                        {/* Background Pattern */}
                        <div className="absolute top-0 right-0 w-32 h-32 bg-bee-yellow/10 rounded-full -mr-16 -mt-16 blur-3xl" />

                        <div className="flex items-center gap-6 relative z-10">
                            <div className="w-20 h-20 bg-bee-yellow rounded-3xl flex items-center justify-center text-bee-black shadow-lg shadow-bee-yellow/20">
                                <i className="fa-solid fa-user text-3xl"></i>
                            </div>
                            <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                    <span className="px-2 py-0.5 bg-bee-yellow/20 text-bee-yellow text-[9px] font-black rounded-md uppercase tracking-tighter">Premium Member</span>
                                </div>
                                <h2 className="text-2xl font-black tracking-tight">{userData?.nickname || auth.currentUser?.displayName || 'Traveler'}</h2>
                                <p className="text-xs font-bold text-white/40">{auth.currentUser?.email}</p>
                            </div>
                        </div>

                        <div className="mt-8 grid grid-cols-2 gap-4 relative z-10">
                            <div className="bg-white/5 rounded-2xl p-4 border border-white/5 hover:bg-white/10 transition-colors cursor-pointer group">
                                <p className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-1">Mileage</p>
                                <div className="flex items-baseline gap-1">
                                    <span className="text-xl font-black text-bee-yellow">{userData?.points?.toLocaleString() || 0}</span>
                                    <span className="text-[10px] font-black text-white/40">bee</span>
                                </div>
                            </div>
                            <div className="bg-white/5 rounded-2xl p-4 border border-white/5 hover:bg-white/10 transition-colors cursor-pointer group">
                                <p className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-1">Coupons</p>
                                <div className="flex items-baseline gap-1">
                                    <span className="text-xl font-black text-bee-yellow">1</span>
                                    <span className="text-[10px] font-black text-white/40">pcs</span>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </div>

                {/* Tabs */}
                <div className="px-6 sticky top-16 bg-[#F8F9FA]/80 backdrop-blur-md z-10 py-4">
                    <div className="bg-white p-1.5 rounded-2xl flex gap-1 shadow-sm border border-black/5">
                        <button
                            onClick={() => setActiveTab('BOOKING')}
                            className={`flex-1 py-3 px-4 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'BOOKING' ? 'bg-bee-black text-bee-yellow shadow-lg shadow-black/10' : 'text-black/30 hover:text-black hover:bg-gray-50'}`}
                        >
                            Booking History
                        </button>
                        <button
                            onClick={() => setActiveTab('COUPON')}
                            className={`flex-1 py-3 px-4 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'COUPON' ? 'bg-bee-black text-bee-yellow shadow-lg shadow-black/10' : 'text-black/30 hover:text-black hover:bg-gray-50'}`}
                        >
                            Coupon Box
                        </button>
                    </div>
                </div>

                {/* Tab Content */}
                <div className="px-6 mt-2">
                    <AnimatePresence mode="wait">
                        {activeTab === 'BOOKING' ? (
                            <motion.div
                                key="booking-tab"
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 10 }}
                            >
                                <BookingHistoryTab t={t} />
                            </motion.div>
                        ) : (
                            <motion.div
                                key="coupon-tab"
                                initial={{ opacity: 0, x: 10 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -10 }}
                            >
                                <CouponBoxTab t={t} />
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </div>
    );
};

export default MyPage;
