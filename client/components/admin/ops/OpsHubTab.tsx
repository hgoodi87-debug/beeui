import React from 'react';
import { LocationOption, LocationType, BookingState, BookingStatus } from '../../../types';
import { motion } from 'framer-motion';


interface OpsHubTabProps {
    locations: LocationOption[];
    bookings: BookingState[];
    todayKST: string;
    focusLocation: (loc: LocationOption) => void;
}

const OpsHubTab: React.FC<OpsHubTabProps> = ({
    locations, bookings, todayKST, focusLocation
}) => {
    return (
        <div className="space-y-6 md:space-y-8 animate-fade-in-up">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl md:text-3xl font-black tracking-tight text-bee-black">지점 운영 현황</h1>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Global Infrastructure Monitor • 실시간 거점 가동 모니터링</p>
                </div>
                <div className="flex gap-4">
                    <div className="bg-white px-6 py-3 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-end">
                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">글로벌 상태</span>
                        <span className="text-sm font-black text-emerald-500">모든 거점 정상 가동 ⚡</span>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                {locations
                    .filter(l => l.supportsDelivery && l.isActive !== false)
                    .sort((a, b) => a.name.localeCompare(b.name, 'ko'))
                    .map(loc => {
                        // 해당 지점의 실제 보관 부하량 계산 💅
                        // 1. 현재 '보관 중'인 예약
                        // 2. 또는 오늘 해당 지점으로 입고 완료된 예약
                        const storageBookings = bookings.filter(b => 
                            !b.isDeleted && 
                            b.status === BookingStatus.STORAGE && 
                            (b.pickupLocation === loc.id || b.dropoffLocation === loc.id)
                        );
                        
                        const currentLoad = storageBookings.length;
                        const maxCapacity = 50; // 거점별 보관 최대 용량 (기본값 50)
                        const loadPercentage = Math.min(100, Math.round((currentLoad / maxCapacity) * 100));
                        
                        return (
                        <div 
                            key={loc.id} 
                            onClick={() => focusLocation(loc)} 
                            className="bg-white p-8 rounded-[40px] border border-gray-100 shadow-sm hover:shadow-2xl hover:-translate-y-1 transition-all cursor-pointer group relative overflow-hidden"
                        >
                            {/* Status Glow */}
                            <div className="absolute top-0 right-0 w-24 h-24 bg-bee-yellow/5 rounded-full blur-2xl -mr-12 -mt-12 group-hover:bg-bee-yellow/20 transition-all"></div>
                            
                            <div className="flex justify-between items-start mb-6">
                                <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest ${loc.type === LocationType.AIRPORT ? 'bg-bee-black text-bee-yellow' : 'bg-gray-50 text-gray-400 border border-gray-100'}`}>
                                    {loc.type}
                                </span>
                                <div className="flex items-center gap-2">
                                    <span className={`w-2.5 h-2.5 rounded-full ${loadPercentage > 90 ? 'bg-red-500 animate-ping' : 'bg-green-500 animate-pulse'}`}></span>
                                    <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">
                                        {loadPercentage > 90 ? '과부하 주의' : '정상 운영 중'}
                                    </span>
                                </div>
                            </div>

                            <h4 className="text-xl font-black text-bee-black mb-1 group-hover:text-bee-yellow transition-colors">{loc.name}</h4>
                            <p className="text-[10px] font-bold text-gray-400 truncate mb-8">{loc.address}</p>
                            
                            <div className="space-y-4">
                                <div className="flex justify-between items-center">
                                    <span className="text-[10px] font-black text-gray-300 uppercase tracking-widest">거점 보관 부하량</span>
                                    <span className={`text-xs font-black ${loadPercentage > 80 ? 'text-red-500' : 'text-bee-black'}`}>{loadPercentage}%</span>
                                </div>
                                <div className="w-full h-1.5 bg-gray-50 rounded-full overflow-hidden border border-gray-100">
                                    <motion.div 
                                        className={`h-full ${
                                            loadPercentage > 80 ? 'bg-red-500' : 
                                            loadPercentage > 50 ? 'bg-orange-400' : 
                                            'bg-bee-yellow'
                                        }`} 
                                        initial={{ width: 0 }}
                                        animate={{ width: `${loadPercentage}%` }}
                                        transition={{ duration: 1, ease: "easeOut" }}
                                    />
                                </div>

                                <div className="flex gap-2 pt-2">
                                    <button 
                                        onClick={(e) => { e.stopPropagation(); focusLocation(loc); }}
                                        className="flex-1 py-3 bg-gray-50 hover:bg-bee-black hover:text-bee-yellow rounded-2xl text-[10px] font-black transition-all border border-gray-100 group-hover:border-bee-black"
                                    >
                                        상세 대시보드
                                    </button>
                                    <button 
                                        title="View Hub Map"
                                        className="px-4 py-3 bg-gray-50 hover:bg-bee-black hover:text-bee-yellow rounded-2xl text-[10px] font-black transition-all border border-gray-100 group-hover:border-bee-black"
                                    >
                                        <i className="fa-solid fa-location-arrow"></i>
                                    </button>
                                </div>
                            </div>
                        </div>
                    );
                })}
                
                {/* 신규 거점 확장 슬롯 */}
                <div className="bg-gray-50/50 rounded-[40px] border-2 border-dashed border-gray-200 flex flex-col items-center justify-center p-8 group hover:border-bee-yellow hover:bg-white transition-all cursor-pointer">
                    <div className="w-16 h-16 rounded-full border-2 border-dashed border-gray-300 flex items-center justify-center text-gray-300 group-hover:border-bee-yellow group-hover:text-bee-yellow group-hover:rotate-90 transition-all mb-4">
                        <i className="fa-solid fa-plus text-2xl"></i>
                    </div>
                    <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest group-hover:text-bee-yellow">신규 거점 네트워크 확장</p>
                </div>
            </div>
        </div>
    );
};

export default OpsHubTab;
