import { BookingState, BookingStatus, LocationOption, AdminUser } from '../../../types';
import { motion } from 'framer-motion';


interface OpsDashboardTabProps {
    todayKST: string;
    bookings: BookingState[];
    locations: LocationOption[];
    admins: AdminUser[];
    onTabChange?: (tab: string) => void;
}


const OpsDashboardTab: React.FC<OpsDashboardTabProps> = ({
    todayKST,
    bookings,
    locations,
    admins,
    onTabChange
}) => {
    const todayBookings = bookings.filter(b => b.pickupDate === todayKST && !b.isDeleted);
    const driverAdmins = admins.filter(a => a.jobTitle?.includes('드라이버') || a.jobTitle?.includes('기사'));

    // Status Counts Separation
    const inTransit = bookings.filter(b => b.status === BookingStatus.TRANSIT && !b.isDeleted).length;
    const inStorage = bookings.filter(b => b.status === BookingStatus.STORAGE && !b.isDeleted).length;

    return (
        <div className="space-y-8 animate-fade-in-up">
            <div className="flex justify-between items-center">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-bee-yellow rounded-2xl flex items-center justify-center text-bee-black shadow-lg shadow-bee-yellow/20">
                        <i className="fa-solid fa-tower-observation text-2xl"></i>
                    </div>
                    <div>
                        <h1 className="text-3xl font-black tracking-tight text-bee-black">통합 관제 대시보드</h1>
                        <p className="text-xs font-bold text-gray-400">빌리버 실시간 물류 관제 시스템 (Global Control)</p>
                    </div>
                </div>
                <div className="flex gap-4">
                    <div className="bg-white px-6 py-2 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-end">
                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">활동 중인 기사</span>
                        <span className="text-sm font-black text-bee-black">{driverAdmins.length}명 대기 중</span>
                    </div>
                    <div className="bg-white px-6 py-2 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-end">
                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">긴급 장애 이슈</span>
                        <span className="text-sm font-black text-red-500">0건 알림</span>
                    </div>
                </div>
            </div>

            {/* Live Infrastructure Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                <div className="bg-white p-6 rounded-[32px] border border-gray-100 shadow-sm relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-5 text-bee-black"><i className="fa-solid fa-box-open text-6xl"></i></div>
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2">오늘의 총 배송량</span>
                    <h4 className="text-3xl font-black text-bee-black">{todayBookings.length}</h4>
                    <p className="text-[10px] font-bold text-green-600 mt-2">✨ 모든 시스템 정상 작동 중</p>
                </div>
                <div className="bg-white p-6 rounded-[32px] border border-gray-100 shadow-sm relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-5 text-bee-black"><i className="fa-solid fa-truck-fast text-6xl"></i></div>
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2">배송 진행 중</span>
                    <h4 className="text-3xl font-black text-bee-black">{inTransit}</h4>
                    <p className="text-[10px] font-bold text-orange-500 mt-2">🚚 실시간 운영 중</p>
                </div>
                <div className="bg-white p-6 rounded-[32px] border border-gray-100 shadow-sm relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-5 text-bee-black"><i className="fa-solid fa-warehouse text-6xl"></i></div>
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2">거점 보관 중</span>
                    <h4 className="text-3xl font-black text-bee-black">{inStorage}</h4>
                    <p className="text-[10px] font-bold text-blue-500 mt-2">🏠 안전하게 보관됨</p>
                </div>
                <div className="bg-white p-6 rounded-[32px] border border-gray-100 shadow-sm relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-5 text-bee-black"><i className="fa-solid fa-flag-checkered text-6xl"></i></div>
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2">오늘의 완료 건수</span>
                    <h4 className="text-3xl font-black text-bee-black">{bookings.filter(b => b.status === BookingStatus.COMPLETED && b.pickupDate === todayKST).length}</h4>
                    <p className="text-[10px] font-bold text-gray-400 mt-2">🎯 목표 달성 중</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Live Operations Feed (Simplified placeholder) */}
                <div className="lg:col-span-2 bg-white p-8 rounded-[40px] shadow-sm border border-gray-100">
                    <div className="flex items-center justify-between mb-8">
                        <h3 className="text-lg font-black flex items-center gap-3">
                            <i className="fa-solid fa-signal text-green-500 animate-pulse"></i>
                            최근 운영 로그
                        </h3>
                        <button className="text-[10px] font-black text-gray-400 uppercase tracking-widest hover:text-bee-black transition-colors">전체 로그 보기</button>
                    </div>
                    
                    <div className="space-y-4">
                        {todayBookings.slice(0, 5).map(b => (
                            <div key={b.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl hover:bg-gray-100 transition-colors group">
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm border border-gray-100">
                                        <i className={`fa-solid ${b.serviceType === 'DELIVERY' ? 'fa-truck-fast text-orange-400' : 'fa-warehouse text-blue-400'}`}></i>
                                    </div>
                                    <div>
                                        <div className="text-xs font-black text-bee-black">{b.userName} - {b.id?.slice(-8).toUpperCase()}</div>
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
                        거점 인프라 현황
                    </h3>
                    
                    <div className="flex-1 space-y-4 overflow-y-auto no-scrollbar relative z-10">
                        {locations
                            .filter(l => l.supportsDelivery)
                            .slice(0, 4)
                            .map(loc => {
                                // 오늘 활성 예약(배송 중, 보관 중, 오늘 픽업 예정) 기준 부하 측정 💅
                                const activeHubBookings = bookings.filter(b => 
                                    !b.isDeleted && 
                                    [BookingStatus.TRANSIT, BookingStatus.STORAGE, BookingStatus.PENDING].includes(b.status as BookingStatus) &&
                                    (b.pickupLocation === loc.id || b.dropoffLocation === loc.id) &&
                                    (b.pickupDate === todayKST || b.status === BookingStatus.STORAGE)
                                );
                                
                                const hubLoad = activeHubBookings.length;
                                const maxCapacity = 30; // 가상의 거점 최대 수용량 (추후 DB 확장 가능)
                                const loadPercentage = Math.min(100, (hubLoad / maxCapacity) * 100);
                                
                                return (
                                    <div key={loc.id} className="p-4 bg-white/5 border border-white/10 rounded-2xl flex flex-col gap-2">
                                        <div className="flex justify-between items-center">
                                            <div className="flex items-center gap-2">
                                                <span className="text-xs font-black text-white">{loc.name}</span>
                                                <span className={`text-[8px] font-black px-1.5 py-0.5 rounded-md ${
                                                    loadPercentage > 80 ? 'bg-red-500 text-white' : 
                                                    loadPercentage > 30 ? 'bg-green-500 text-white' : 
                                                    'bg-gray-600 text-gray-300'
                                                }`}>
                                                    {loadPercentage > 80 ? 'OVERLOAD' : loadPercentage > 30 ? 'OPTIMAL' : 'FREE'}
                                                </span>
                                            </div>
                                            <span className={`w-2 h-2 rounded-full ${loadPercentage > 80 ? 'bg-red-500 animate-pulse' : 'bg-green-500'}`}></span>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <div className="flex-1 h-1 bg-white/10 rounded-full overflow-hidden">
                                                <motion.div 
                                                    className={`h-full ${loadPercentage > 80 ? 'bg-red-500' : loadPercentage > 50 ? 'bg-orange-400' : 'bg-bee-yellow'}`}
                                                    initial={{ width: 0 }}
                                                    animate={{ width: `${loadPercentage}%` }}
                                                    transition={{ duration: 1, ease: "easeOut" }}
                                                />
                                            </div>
                                            <span className="text-[8px] font-black text-gray-500 uppercase">부하율 {Math.round(loadPercentage)}%</span>
                                        </div>


                                    </div>
                                );
                            })}
                    </div>

                    <div className="mt-8 relative z-10">
                        <button 
                            onClick={() => onTabChange?.('DRIVERS')}
                            className="w-full py-3 bg-bee-yellow text-bee-black rounded-xl text-xs font-black hover:bg-white transition-all shadow-lg shadow-bee-yellow/10"
                        >
                            전체 트래픽 맵 보기
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default OpsDashboardTab;
