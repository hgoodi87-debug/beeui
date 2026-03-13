import React from 'react';
import { BookingState, BookingStatus, ServiceType, LocationOption } from '../../types';

interface OpsDeliveryListTabProps {
    bookings: BookingState[];
    locations: LocationOption[];
}

const OpsDeliveryListTab: React.FC<OpsDeliveryListTabProps> = ({
    bookings,
    locations
}) => {
    // 상태별 스타일 헬퍼 (인터페이스 단순화를 위해 내부 정의)
    const getStatusStyle = (s: BookingStatus) => {
        switch (s) {
            case BookingStatus.COMPLETED: return 'bg-green-50 text-green-600';
            case BookingStatus.IN_TRANSIT: return 'bg-blue-50 text-blue-600';
            case BookingStatus.PENDING: return 'bg-orange-50 text-orange-600';
            case BookingStatus.CANCELLED: return 'bg-red-50 text-red-600';
            default: return 'bg-gray-50 text-gray-600';
        }
    };

    return (
        <div className="space-y-6 md:space-y-8 animate-fade-in-up">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-2">
                <div className="flex-1">
                    <h1 className="text-2xl md:text-3xl font-black tracking-tight text-bee-black">
                        Active Delivery Jobs
                    </h1>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">실시간 배송 업무 모니터링 및 상태 제어</p>
                </div>
                <div className="flex items-center gap-2">
                    <div className="px-4 py-2 bg-white rounded-2xl border border-gray-100 shadow-sm flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                        <span className="text-[10px] font-black text-bee-black">LIVE FEED</span>
                    </div>
                </div>
            </div>

            <div className="bg-white/50 backdrop-blur-3xl p-2 md:p-10 rounded-[40px] shadow-lg border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-white/80 text-[10px] font-black uppercase text-gray-400 border-b border-gray-200">
                            <tr>
                                <th className="px-6 py-4">ID/이름</th>
                                <th className="px-6 py-4">서비스 경로</th>
                                <th className="px-6 py-4">상태 감시</th>
                                <th className="px-6 py-4 text-center">관제 액션</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {bookings.length > 0 ? bookings.map(b => (
                                <tr key={b.id} className="group hover:bg-white/80 transition-colors">
                                    <td className="px-6 py-5">
                                        <div className="flex flex-col">
                                            <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">{b.reservationCode || b.id}</span>
                                            <span className="font-black text-bee-black group-hover:text-bee-yellow transition-colors cursor-pointer">{b.userName}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-5">
                                        <div className="flex items-center gap-2">
                                            <span className="text-[11px] font-bold text-bee-black">{locations.find(l => l.id === b.pickupLocation)?.name || 'N/A'}</span>
                                            <i className="fa-solid fa-arrow-right text-bee-yellow text-[10px]"></i>
                                            <span className="text-[11px] font-bold text-bee-black">{locations.find(l => l.id === b.dropoffLocation)?.name || 'N/A'}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-5">
                                        <span className={`text-[10px] font-black py-1.5 px-3 rounded-xl ${getStatusStyle(b.status || BookingStatus.PENDING)}`}>
                                            {b.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-5">
                                        <div className="flex items-center justify-center gap-2">
                                            <button className="w-8 h-8 rounded-xl bg-gray-50 text-gray-400 hover:bg-bee-black hover:text-bee-yellow transition-all flex items-center justify-center">
                                                <i className="fa-solid fa-location-dot text-xs"></i>
                                            </button>
                                            <button className="w-8 h-8 rounded-xl bg-gray-50 text-gray-400 hover:bg-bee-black hover:text-white transition-all flex items-center justify-center">
                                                <i className="fa-solid fa-phone text-xs"></i>
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan={4} className="px-8 py-20 text-center text-gray-400 font-bold">
                                        활성 배송 업무가 없습니다.
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
