import React from 'react';
import { BookingState, BookingStatus, LocationOption } from '../../types';

interface OverviewTabProps {
    todayKST: string;
    bookings: BookingState[];
    locations: LocationOption[];
    setActiveTab: (tab: any) => void;
    setActiveStatusTab: (tab: any) => void;
    dailyStats: any[];
}


const OverviewTab: React.FC<OverviewTabProps> = ({
    todayKST,
    bookings,
    locations,
    setActiveTab,
    setActiveStatusTab,
    dailyStats
}) => {
    const todayBookings = bookings.filter(b => b.pickupDate === todayKST && !b.isDeleted);

    // Status Counts Separation
    const pendingDeliveryCount = bookings.filter(b => b.status === BookingStatus.PENDING && b.serviceType === 'DELIVERY' && !b.isDeleted).length;
    const pendingStorageCount = bookings.filter(b => b.status === BookingStatus.PENDING && b.serviceType === 'STORAGE' && !b.isDeleted).length;

    const inTransit = bookings.filter(b => b.status === BookingStatus.TRANSIT && !b.isDeleted).length;
    const inStorage = bookings.filter(b => b.status === BookingStatus.STORAGE && !b.isDeleted).length;


    const todayDelivery = todayBookings.filter(b => b.serviceType === 'DELIVERY');
    const todayStorage = todayBookings.filter(b => b.serviceType === 'STORAGE');
    const deliveryTotal = todayDelivery.reduce((sum, b) => sum + (b.finalPrice || 0), 0);
    const storageTotal = todayStorage.reduce((sum, b) => sum + (b.finalPrice || 0), 0);

    return (
        <div className="space-y-8 animate-fade-in-up">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-black tracking-tight">CEMS Dashboard</h1>
                <div className="text-xs font-bold text-gray-400 bg-white px-4 py-2 rounded-xl shadow-sm border border-gray-100 italic">
                    Cargo Express Management System v2.1
                </div>
            </div>

            {/* Main Status Cards Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* 1. Delivery Section */}
                <div className="bg-white p-8 rounded-[40px] shadow-sm border border-gray-100 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-bee-yellow/10 rounded-bl-[100px] -mr-10 -mt-10 transition-transform group-hover:scale-110"></div>
                    <h3 className="text-lg font-black mb-6 flex items-center gap-3 relative z-10">
                        <span className="w-2 h-6 bg-bee-yellow rounded-full"></span>
                        배송 서비스 현황 (Delivery)
                    </h3>

                    <div className="grid grid-cols-2 gap-4 relative z-10">
                        <div
                            onClick={() => {
                                setActiveTab('DELIVERY_BOOKINGS');
                                setActiveStatusTab('PENDING');
                            }}
                            className="bg-gray-50 hover:bg-bee-yellow/10 p-6 rounded-3xl cursor-pointer transition-all border border-gray-100 hover:border-bee-yellow/50"
                        >
                            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1">배송 대기 (Pending)</span>
                            <div className="flex items-center gap-3">
                                <h4 className="text-3xl font-black text-bee-black">{pendingDeliveryCount}</h4>
                                {pendingDeliveryCount > 0 && <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>}
                            </div>
                        </div>

                        <div
                            onClick={() => {
                                setActiveTab('DELIVERY_BOOKINGS');
                                setActiveStatusTab('ACTIVE');
                            }}
                            className="bg-gray-50 hover:bg-orange-50 p-6 rounded-3xl cursor-pointer transition-all border border-gray-100 hover:border-orange-200"
                        >
                            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1"> 이동중 (In Transit)</span>
                            <div className="flex items-center gap-3">
                                <h4 className="text-3xl font-black text-bee-black">{inTransit}</h4>
                                <i className="fa-solid fa-truck-fast text-orange-400/50"></i>
                            </div>
                        </div>
                    </div>
                </div>

                {/* 2. Storage Section */}
                <div className="bg-white p-8 rounded-[40px] shadow-sm border border-gray-100 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-bee-blue/5 rounded-bl-[100px] -mr-10 -mt-10 transition-transform group-hover:scale-110"></div>
                    <h3 className="text-lg font-black mb-6 flex items-center gap-3 relative z-10">
                        <span className="w-2 h-6 bg-bee-blue rounded-full"></span>
                        보관 서비스 현황 (Storage)
                    </h3>

                    <div className="grid grid-cols-2 gap-4 relative z-10">
                        <div
                            onClick={() => {
                                setActiveTab('STORAGE_BOOKINGS');
                                setActiveStatusTab('PENDING');
                            }}
                            className="bg-gray-50 hover:bg-blue-50 p-6 rounded-3xl cursor-pointer transition-all border border-gray-100 hover:border-blue-200"
                        >
                            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1">보관 대기 (Pending)</span>
                            <div className="flex items-center gap-3">
                                <h4 className="text-3xl font-black text-bee-black">{pendingStorageCount}</h4>
                                {pendingStorageCount > 0 && <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>}
                            </div>
                        </div>

                        <div
                            onClick={() => {
                                setActiveTab('STORAGE_BOOKINGS');
                                setActiveStatusTab('ACTIVE');
                            }}
                            className="bg-gray-50 hover:bg-purple-50 p-6 rounded-3xl cursor-pointer transition-all border border-gray-100 hover:border-purple-200"
                        >
                            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1">보관중 (Stored)</span>
                            <div className="flex items-center gap-3">
                                <h4 className="text-3xl font-black text-bee-black">{inStorage}</h4>
                                <i className="fa-solid fa-warehouse text-purple-400/50"></i>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Daily Revenue Summary */}
                <div className="bg-bee-black text-white p-8 rounded-[40px] shadow-lg shadow-bee-black/20 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-8 opacity-10">
                        <i className="fa-solid fa-coins text-9xl -mr-8 -mt-8"></i>
                    </div>
                    <h3 className="text-sm font-bold text-bee-yellow uppercase tracking-widest mb-2">Today's Revenue</h3>
                    <div className="text-4xl font-black mb-8">₩{(deliveryTotal + storageTotal).toLocaleString()}</div>

                    <div className="space-y-3">
                        <div className="flex justify-between text-sm">
                            <span className="text-gray-400">Delivery</span>
                            <span className="font-bold">₩{deliveryTotal.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-gray-400">Storage</span>
                            <span className="font-bold">₩{storageTotal.toLocaleString()}</span>
                        </div>
                        <hr className="border-white/10" />
                        <div className="flex justify-between text-sm">
                            <span className="text-gray-400">Total Bookings</span>
                            <span className="font-bold text-bee-yellow">{todayBookings.length} 건</span>
                        </div>
                    </div>
                </div>

                {/* Recent Daily Stats (Expanded) */}
                <div className="lg:col-span-2 bg-white p-8 rounded-[40px] shadow-sm border border-gray-100">
                    <h3 className="text-lg font-black mb-6 flex items-center gap-3">
                        <i className="fa-solid fa-chart-line text-gray-300"></i>
                        주간 매출 추이 (Weekly Trend)
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {dailyStats.slice(0, 4).map((s: any) => (
                            <div key={s.date} className="flex items-center justify-between p-5 bg-gray-50 rounded-2xl hover:bg-gray-100 transition-colors">
                                <div className="flex flex-col">
                                    <span className="font-bold text-xs text-gray-400 mb-1">{s.date}</span>
                                    <span className="font-black text-lg text-bee-black">₩{s.total.toLocaleString()}</span>
                                </div>
                                <span className="px-3 py-1 bg-white rounded-lg text-xs font-black shadow-sm border border-gray-100">{s.count} 건</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default OverviewTab;
