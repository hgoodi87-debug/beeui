import React from "react";
import { motion } from "framer-motion";
import {
    Ticket,
    Gift,
    Clock,
    ChevronRight,
    Info,
    Sparkles
} from "lucide-react";

import { UserCoupon } from "../types";
import { StorageService } from "../services/storageService";

interface CouponBoxTabProps {
    t: any;
    uid: string;
}

const CouponBoxTab: React.FC<CouponBoxTabProps> = ({ t, uid }) => {
    const [coupons, setCoupons] = React.useState<UserCoupon[]>([]);
    const [isLoading, setIsLoading] = React.useState(true);

    React.useEffect(() => {
        const fetchCoupons = async () => {
            if (!uid) return;
            try {
                const data = await StorageService.getUserCoupons(uid);
                setCoupons(data);
            } catch (error) {
                console.error("Error fetching coupons:", error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchCoupons();
    }, [uid]);

    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-10">
                <div className="w-6 h-6 border-2 border-bee-yellow border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Active Coupons Section */}
            <div>
                <div className="flex items-center justify-between mb-4 px-2">
                    <h3 className="text-[10px] font-black text-black/30 uppercase tracking-[0.2em]">Active Coupons ({coupons.length})</h3>
                </div>

                {coupons.length === 0 ? (
                    <div className="text-center py-10 bg-white/30 rounded-3xl border border-dashed border-black/5">
                        <Ticket className="w-8 h-8 text-black/10 mx-auto mb-2" />
                        <p className="text-[10px] font-bold text-black/20 uppercase tracking-widest">No active coupons available</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {coupons.map((coupon, index) => {
                            const isExpiredSoon = new Date(coupon.expiryDate).getTime() - new Date().getTime() < 7 * 24 * 60 * 60 * 1000;
                            const dDay = Math.ceil((new Date(coupon.expiryDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));

                            return (
                                <motion.div
                                    key={coupon.id}
                                    initial={{ opacity: 0, scale: 0.95, y: 10 }}
                                    animate={{ opacity: 1, scale: 1, y: 0 }}
                                    whileHover={{ scale: 1.02, translateY: -5 }}
                                    whileTap={{ scale: 0.98 }}
                                    transition={{ delay: index * 0.1 }}
                                    className="relative bg-white rounded-3xl overflow-hidden border border-black/5 shadow-xl shadow-black/5 group cursor-pointer"
                                >
                                    <div className="absolute top-0 right-0 w-32 h-32 bg-bee-yellow/5 rounded-full -mr-16 -mt-16 blur-2xl" />

                                    <div className="flex h-32">
                                        <div className="w-1/3 bg-bee-black flex flex-col items-center justify-center p-4 relative">
                                            <div className="absolute top-1/2 -right-3 -translate-y-1/2 w-6 h-6 bg-[#F8F9FA] rounded-full border border-black/5" />
                                            <div className="text-center">
                                                <p className="text-[8px] font-black text-bee-yellow/40 uppercase tracking-widest mb-1">Benefit</p>
                                                <div className="flex items-baseline gap-0.5 justify-center">
                                                    <span className="text-2xl font-black text-bee-yellow tracking-tighter">{coupon.amountPerBag.toLocaleString()}</span>
                                                    <span className="text-[8px] font-black text-bee-yellow/60 tracking-tighter">won</span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex-1 p-5 flex flex-col justify-between">
                                            <div>
                                                <div className="flex items-center gap-2 mb-1">
                                                    <Sparkles className="w-3 h-3 text-bee-yellow" />
                                                    <span className="text-[9px] font-black text-bee-black uppercase tracking-widest">{coupon.code}</span>
                                                </div>
                                                <h4 className="text-sm font-black text-black">{coupon.description}</h4>
                                                <p className="text-[10px] font-bold text-black/30 mt-1">
                                                    Valid until: {new Date(coupon.expiryDate).toLocaleDateString()}
                                                </p>
                                            </div>

                                            <div className="flex items-center justify-between">
                                                <div className={`flex items-center gap-1 ${isExpiredSoon ? 'text-[#FF495C]' : 'text-black/30'}`}>
                                                    <Clock className="w-3 h-3" />
                                                    <span className="text-[9px] font-black uppercase tracking-widest">
                                                        {dDay > 0 ? `D-${dDay}` : 'Today'}
                                                    </span>
                                                </div>
                                                <div className="w-6 h-6 rounded-full bg-gray-50 flex items-center justify-center group-hover:bg-bee-yellow transition-colors">
                                                    <ChevronRight className="w-3 h-3 text-black/20 group-hover:text-bee-black" />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Info Card */}
            <div className="bg-white/50 border border-black/5 rounded-3xl p-6 mt-10">
                <div className="flex items-center gap-3 mb-4">
                    <div className="w-8 h-8 rounded-xl bg-gray-100 flex items-center justify-center">
                        <Info className="w-4 h-4 text-black/30" />
                    </div>
                    <h4 className="text-[10px] font-black uppercase tracking-widest text-black/40">Coupon Policy</h4>
                </div>
                <ul className="space-y-3">
                    <li className="flex gap-3">
                        <div className="w-1 h-1 rounded-full bg-bee-yellow mt-1.5 shrink-0" />
                        <p className="text-[10px] font-bold text-black/40 leading-relaxed">쿠폰은 예약 결제 단계에서 적용 가능합니다.</p>
                    </li>
                    <li className="flex gap-3">
                        <div className="w-1 h-1 rounded-full bg-bee-yellow mt-1.5 shrink-0" />
                        <p className="text-[10px] font-bold text-black/40 leading-relaxed">유효기간이 지난 쿠폰은 자동으로 소멸됩니다.</p>
                    </li>
                    <li className="flex gap-3">
                        <div className="w-1 h-1 rounded-full bg-bee-yellow mt-1.5 shrink-0" />
                        <p className="text-[10px] font-bold text-black/40 leading-relaxed">쿠폰 사용 시 포인트 적립이 제한될 수 있습니다.</p>
                    </li>
                </ul>
            </div>

            {/* Empty State / Bottom Text */}
            <div className="pt-10 pb-4 text-center">
                <Gift className="w-6 h-6 text-black/10 mx-auto mb-4" />
                <p className="text-[10px] font-black text-black/10 uppercase tracking-[0.3em]">Beeliber Rewards Program</p>
            </div>
        </div>
    );
};

export default CouponBoxTab;
