import React from 'react';
import { BookingState, BookingStatus, LocationOption } from '../../types';

interface OpsDashboardTabProps {
    todayKST: string;
    bookings: BookingState[];
    locations: LocationOption[];
}


const OpsDashboardTab: React.FC<OpsDashboardTabProps> = ({
    todayKST,
    bookings,
    locations
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
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-bee-yellow rounded-2xl flex items-center justify-center text-bee-black shadow-lg shadow-bee-yellow/20">
                        <i className="fa-solid fa-tower-observation text-2xl"></i>
                    </div>
                    <div>
                        <h1 className="text-3xl font-black tracking-tight text-bee-black">Main Observation</h1>
                        <p className="text-xs font-bold text-gray-400">Beeliber Real-time Global Logistics Control</p>
                    </div>
                </div>
                <div className="flex gap-4">
                    <div className="bg-white px-6 py-2 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-end">
                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Active Drivers</span>
                        <span className="text-sm font-black text-bee-black">12 Available</span>
                    </div>
                    <div className="bg-white px-6 py-2 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-end">
                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Critical Issues</span>
                        <span className="text-sm font-black text-red-500">0 Alerts</span>
                    </div>
                </div>
            </div>

            {/* Live Infrastructure Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                <div className="bg-white p-6 rounded-[32px] border border-gray-100 shadow-sm relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-5 text-bee-black"><i className="fa-solid fa-box-open text-6xl"></i></div>
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2">Total Loadings</span>
                    <h4 className="text-3xl font-black text-bee-black">{todayBookings.length}</h4>
                    <p className="text-[10px] font-bold text-green-600 mt-2">✨ All Systems Normal</p>
                </div>
                <div className="bg-white p-6 rounded-[32px] border border-gray-100 shadow-sm relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-5 text-bee-black"><i className="fa-solid fa-truck-fast text-6xl"></i></div>
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2">In Transit</span>
                    <h4 className="text-3xl font-black text-bee-black">{inTransit}</h4>
                    <p className="text-[10px] font-bold text-orange-500 mt-2">🚚 Operational</p>
                </div>
                <div className="bg-white p-6 rounded-[32px] border border-gray-100 shadow-sm relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-5 text-bee-black"><i className="fa-solid fa-warehouse text-6xl"></i></div>
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2">Hub Storage</span>
                    <h4 className="text-3xl font-black text-bee-black">{inStorage}</h4>
                    <p className="text-[10px] font-bold text-blue-500 mt-2">🏠 Secure</p>
                </div>
                <div className="bg-white p-6 rounded-[32px] border border-gray-100 shadow-sm relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-5 text-bee-black"><i className="fa-solid fa-flag-checkered text-6xl"></i></div>
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2">Daily Handover</span>
                    <h4 className="text-3xl font-black text-bee-black">{bookings.filter(b => b.status === BookingStatus.COMPLETED && b.pickupDate === todayKST).length}</h4>
                    <p className="text-[10px] font-bold text-gray-400 mt-2">🎯 Target Achieving</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Live Operations Feed (Simplified placeholder) */}
                <div className="lg:col-span-2 bg-white p-8 rounded-[40px] shadow-sm border border-gray-100">
                    <div className="flex items-center justify-between mb-8">
                        <h3 className="text-lg font-black flex items-center gap-3">
                            <i className="fa-solid fa-signal text-green-500 animate-pulse"></i>
                            Recent Operational Logs
                        </h3>
                        <button className="text-[10px] font-black text-gray-400 uppercase tracking-widest hover:text-bee-black transition-colors">View All Logs</button>
                    </div>
                    
                    <div className="space-y-4">
                        {todayBookings.slice(0, 5).map(b => (
                            <div key={b.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl hover:bg-gray-100 transition-colors group">
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm border border-gray-100">
                                        <i className={`fa-solid ${b.serviceType === 'DELIVERY' ? 'fa-truck-fast text-orange-400' : 'fa-warehouse text-blue-400'}`}></i>
                                    </div>
                                    <div>
                                        <div className="text-xs font-black text-bee-black">{b.userName} - {b.id}</div>
                                        <div className="text-[10px] font-bold text-gray-400">
                                            {locations.find(l => l.id === b.pickupLocation)?.name || b.pickupLocation} → {locations.find(l => l.id === b.dropoffLocation)?.name || b.dropoffLocation || 'Hub'}
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4">
                                    <span className="text-[10px] font-black px-3 py-1 bg-white rounded-full border border-gray-100 text-gray-400">{b.status}</span>
                                    <div className="w-8 h-8 rounded-lg bg-gray-200 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                                        <i className="fa-solid fa-chevron-right text-xs"></i>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Hub Health Status */}
                <div className="bg-bee-black p-8 rounded-[40px] shadow-2xl relative overflow-hidden flex flex-col">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-bee-yellow/10 rounded-full blur-3xl -mr-10 -mt-10"></div>
                    <h3 className="text-lg font-black text-white mb-6 relative z-10 flex items-center gap-3">
                        <i className="fa-solid fa-server text-bee-yellow"></i>
                        Hub Infrastructure
                    </h3>
                    
                    <div className="flex-1 space-y-4 overflow-y-auto no-scrollbar relative z-10">
                        {locations.slice(0, 4).map(loc => (
                            <div key={loc.id} className="p-4 bg-white/5 border border-white/10 rounded-2xl flex flex-col gap-2">
                                <div className="flex justify-between items-center">
                                    <span className="text-xs font-black text-white">{loc.name}</span>
                                    <span className="w-2 h-2 rounded-full bg-green-500"></span>
                                </div>
                                <div className="flex items-center gap-4">
                                    <div className="flex-1 h-1 bg-white/10 rounded-full overflow-hidden">
                                        <div className="h-full bg-bee-yellow" style={{ width: `${Math.random() * 60 + 20}%` }}></div>
                                    </div>
                                    <span className="text-[8px] font-black text-gray-500 uppercase">Load 42%</span>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="mt-8 relative z-10">
                        <button className="w-full py-3 bg-bee-yellow text-bee-black rounded-xl text-xs font-black hover:bg-white transition-all shadow-lg shadow-bee-yellow/10">
                            Global Traffic Map
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default OpsDashboardTab;
