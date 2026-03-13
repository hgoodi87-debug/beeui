import React from 'react';
import { BookingState, BookingStatus, ServiceType, LocationOption } from '../../../types';

interface OpsDeliveryListTabProps {
    bookings: BookingState[];
    locations: LocationOption[];
    todayKST: string;
}

const OpsDeliveryListTab: React.FC<OpsDeliveryListTabProps> = ({
    bookings,
    locations,
    todayKST
}) => {
    // 필터링: 오늘 날짜 + 배송 서비스(STORAGE 단독 제외) + 유효한 상태(취소/완료/환불 제외)
    const activeDeliveryBookings = bookings.filter(b => {
        const isToday = b.pickupDate === todayKST;
        const isNotFinalStatus = 
            b.status !== BookingStatus.COMPLETED && 
            b.status !== BookingStatus.CANCELLED && 
            b.status !== BookingStatus.REFUNDED;
        // 서비스 타입 체크: 배송이 포함된 경우 (STORAGE 단독이 아닌 모든 경우)
        const isDeliveryService = b.serviceType !== ServiceType.STORAGE; 
        
        return isToday && isNotFinalStatus && isDeliveryService;
    });

    const getStatusStyle = (s: BookingStatus) => {
        switch (s) {
            case BookingStatus.COMPLETED: return 'bg-gray-100 text-gray-500 border-gray-200';
            case BookingStatus.TRANSIT: return 'bg-blue-50 text-blue-600 border-blue-100';
            case BookingStatus.PENDING: return 'bg-amber-50 text-amber-600 border-amber-100';
            case BookingStatus.CANCELLED: return 'bg-red-50 text-red-600 border-red-100';
            case BookingStatus.REFUNDED: return 'bg-purple-50 text-purple-600 border-purple-100';
            default: return 'bg-gray-50 text-gray-600 border-gray-100';
        }
    };

    const getStatusLabel = (s: BookingStatus) => {
        switch (s) {
            case BookingStatus.COMPLETED: return '처리 완료';
            case BookingStatus.TRANSIT: return '배송 중';
            case BookingStatus.PENDING: return '배송 대기';
            case BookingStatus.CANCELLED: return '취소됨';
            case BookingStatus.REFUNDED: return '환불 완료';
            case BookingStatus.ARRIVED: return '도착 완료';
            case BookingStatus.STORAGE: return '보관 중';
            default: return s;
        }
    };

    return (
        <div className="space-y-6 md:space-y-8 animate-fade-in-up">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-2">
                <div className="flex-1">
                    <h1 className="text-2xl md:text-3xl font-black tracking-tight text-bee-black">
                        오늘의 실시간 배송 현황
                    </h1>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Active Delivery Pipeline • {todayKST} 기준</p>
                </div>
                <div className="flex items-center gap-2">
                    <div className="px-6 py-3 bg-white rounded-2xl border border-gray-100 shadow-sm flex items-center gap-3">
                        <span className="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse"></span>
                        <span className="text-[10px] font-black text-bee-black tracking-widest uppercase">실시간 모니터링 중</span>
                    </div>
                </div>
            </div>

            <div className="bg-white p-2 md:p-6 rounded-[40px] shadow-xl border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto no-scrollbar">
                    <table className="w-full text-left border-separate border-spacing-y-2">
                        <thead className="text-[10px] font-black uppercase text-gray-400">
                            <tr>
                                <th className="px-6 py-4">ID / 예약자</th>
                                <th className="px-6 py-4">배송 경로</th>
                                <th className="px-6 py-4 text-center">현재 상태</th>
                                <th className="px-6 py-4 text-right pr-10">관제 액션</th>
                            </tr>
                        </thead>
                        <tbody>
                            {activeDeliveryBookings.length > 0 ? activeDeliveryBookings.map(b => (
                                <tr key={b.id} className="group transition-all duration-300">
                                    <td className="px-6 py-5 bg-gray-50/50 rounded-l-3xl group-hover:bg-bee-black group-hover:text-white transition-colors">
                                        <div className="flex flex-col">
                                            <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1 group-hover:text-bee-yellow/60">#{b.reservationCode || b.id?.slice(-8).toUpperCase()}</span>
                                            <span className="font-black text-bee-black group-hover:text-white transition-colors">{b.userName}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-5 bg-gray-50/50 group-hover:bg-bee-black group-hover:text-white transition-colors">
                                        <div className="flex items-center gap-3">
                                            <span className="text-[11px] font-black">{locations.find(l => l.id === b.pickupLocation)?.name || '출발지'}</span>
                                            <i className="fa-solid fa-arrow-right-long text-bee-yellow text-[10px] group-hover:translate-x-1 transition-transform"></i>
                                            <span className="text-[11px] font-black">{locations.find(l => l.id === b.dropoffLocation)?.name || '도착지'}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-5 bg-gray-50/50 group-hover:bg-bee-black text-center transition-colors">
                                        <span className={`text-[9px] font-black py-1.5 px-4 rounded-full border transition-all ${getStatusStyle(b.status || BookingStatus.PENDING)} group-hover:border-white/20 group-hover:bg-white/10 group-hover:text-bee-yellow`}>
                                            {getStatusLabel(b.status || BookingStatus.PENDING)}
                                        </span>
                                    </td>
                                    <td className="px-6 py-5 bg-gray-50/50 rounded-r-3xl group-hover:bg-bee-black text-right pr-6 transition-colors">
                                        <div className="flex items-center justify-end gap-2">
                                            <button className="w-10 h-10 rounded-xl bg-white border border-gray-100 text-gray-400 hover:bg-bee-yellow hover:text-bee-black hover:scale-110 hover:rotate-6 transition-all shadow-sm flex items-center justify-center" title="위치 확인">
                                                <i className="fa-solid fa-location-dot text-xs"></i>
                                            </button>
                                            <button className="w-10 h-10 rounded-xl bg-white border border-gray-100 text-gray-400 hover:bg-bee-black hover:text-bee-yellow hover:scale-110 hover:-rotate-6 transition-all shadow-sm flex items-center justify-center" title="기사님 호출">
                                                <i className="fa-solid fa-phone text-xs"></i>
                                            </button>
                                            <button className="px-5 py-2.5 bg-bee-black text-bee-yellow group-hover:bg-bee-yellow group-hover:text-bee-black rounded-xl text-[10px] font-black transition-all hover:scale-105 active:scale-95 shadow-lg shadow-bee-black/10">
                                                상세 보기
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan={4} className="px-8 py-20 text-center text-gray-300 font-bold bg-gray-50/30 rounded-[30px] border-2 border-dashed border-gray-100">
                                        오늘 운용 중인 배송 업무가 없습니다. ☕
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default OpsDeliveryListTab;
