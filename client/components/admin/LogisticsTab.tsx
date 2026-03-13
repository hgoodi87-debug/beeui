import React from 'react';
import { BookingState, BookingStatus, ServiceType, LocationOption, AdminTab } from '../../types';

interface LogisticsTabProps {
    activeTab: AdminTab;
    activeStatusTab: string;
    setActiveStatusTab: (s: string) => void;
    filteredBookings: BookingState[];
    isRefreshing: boolean;
    locations: LocationOption[];
    updateStatus: (id: string, s: BookingStatus) => void;
    getStatusStyle: (s: BookingStatus) => string;
    handleResendEmail: (b: BookingState) => void;
    sendingEmailId: string | null;
    handleRefund: (b: BookingState) => void;
    refundingId: string | null;
    handleRestore: (id: string) => void;
    handlePermanentDelete: (id: string) => void;
    handlePrintLabel: (b: BookingState) => void;
    handleSoftDelete: (id: string) => void;
    setSelectedBooking: (b: BookingState | null) => void;
    onAddManual?: () => void;
}

const LogisticsTab: React.FC<LogisticsTabProps> = ({
    activeTab,
    activeStatusTab,
    setActiveStatusTab,
    filteredBookings,
    isRefreshing,
    locations,
    updateStatus,
    getStatusStyle,
    handleResendEmail,
    sendingEmailId,
    handleRefund,
    refundingId,
    handleRestore,
    handlePermanentDelete,
    handlePrintLabel,
    handleSoftDelete,
    setSelectedBooking,
    onAddManual
}) => {
    return (
        <div className="space-y-6 md:space-y-8 animate-fade-in-up">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-2">
                <div className="flex-1">
                    <h1 className="text-2xl md:text-4xl font-black tracking-tight text-bee-black">
                        {activeTab === 'DELIVERY_BOOKINGS' ? '배송 예약 관리' : '보관 예약 관리'}
                    </h1>
                </div>

                <div className="flex-1 flex justify-start lg:justify-center">
                    <div className="flex bg-white/50 backdrop-blur-3xl p-1.5 rounded-2xl border border-gray-200 w-fit">
                        {(['ALL', 'PENDING', 'ACTIVE', 'COMPLETED'] as const).map(tab => (
                            <button
                                key={tab}
                                onClick={() => setActiveStatusTab(tab)}
                                className={`px-5 py-2.5 rounded-xl text-[10px] font-black transition-all ${activeStatusTab === tab ? 'bg-bee-yellow text-bee-black shadow-lg shadow-bee-yellow/20' : 'text-gray-500 hover:text-bee-black hover:bg-white/50'}`}
                            >
                                {tab === 'ALL' ? '전체' : tab === 'PENDING' ? '대기중' : tab === 'ACTIVE' ? '진행중' : '완료됨'}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="flex-1 flex justify-start lg:justify-end">
                    {onAddManual && (
                        <button
                            onClick={onAddManual}
                            className="px-6 py-3 bg-bee-yellow text-bee-black font-black rounded-2xl text-[11px] shadow-xl shadow-bee-yellow/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center gap-2 border-2 border-bee-yellow hover:bg-white/10 hover:text-bee-yellow hover:border-white/20"
                        >
                            <i className="fa-solid fa-plus text-[9px]"></i>
                            수동 예약 추가
                        </button>
                    )}
                </div>
            </div>

            <div className="bg-white/50 backdrop-blur-3xl p-2 md:p-10 rounded-[40px] shadow-lg border border-gray-200 overflow-hidden">
                <div className="hidden md:block overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-white/80 text-[10px] font-black uppercase text-gray-400 border-b border-gray-200">
                            <tr>
                                <th className="px-6 py-4">ID/이름</th>
                                <th className="px-6 py-4">{activeTab === 'STORAGE_BOOKINGS' ? '보관 지점' : '서비스 경로'}</th>
                                <th className="px-6 py-4">{activeTab === 'STORAGE_BOOKINGS' ? '보관 기간' : '날짜/수량'}</th>
                                <th className="px-6 py-4">결제/금액</th>
                                <th className="px-6 py-4">상태</th>
                                <th className="px-6 py-4 text-center">액션</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {filteredBookings.length > 0 ? filteredBookings.map(b => (
                                <tr key={b.id} className="group hover:bg-white/80 transition-colors">
                                    <td className="px-6 py-5">
                                        <div className="flex flex-col">
                                            <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">{b.reservationCode || b.id}</span>
                                            <span className="font-black text-bee-black group-hover:text-bee-yellow transition-colors cursor-pointer" onClick={() => { setSelectedBooking({ ...b }); }}>{b.userName}</span>
                                            <span className="text-[10px] text-gray-400 font-bold">{b.userEmail}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-5">
                                        {b.serviceType === ServiceType.DELIVERY ? (
                                            <div className="flex items-center gap-2">
                                                <div className="flex flex-col">
                                                    <span className="text-[9px] font-black text-gray-400 uppercase">출발</span>
                                                    <span className="text-[11px] font-bold text-bee-black truncate max-w-[100px]">{locations.find(l => l.id === b.pickupLocation)?.name || b.pickupLocation}</span>
                                                </div>
                                                <i className="fa-solid fa-arrow-right text-bee-yellow text-[10px]"></i>
                                                <div className="flex flex-col">
                                                    <span className="text-[9px] font-black text-gray-400 uppercase">도착</span>
                                                    <span className="text-[11px] font-bold text-bee-black truncate max-w-[100px]">{locations.find(l => l.id === b.dropoffLocation)?.name || b.dropoffLocation || '-'}</span>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="flex flex-col">
                                                <span className="text-[9px] font-black text-gray-400 uppercase">보관 지점</span>
                                                <span className="text-[11px] font-bold text-bee-black">{locations.find(l => l.id === b.pickupLocation)?.name || b.pickupLocation}</span>
                                            </div>
                                        )}
                                    </td>
                                    <td className="px-6 py-5">
                                        {b.serviceType === ServiceType.DELIVERY ? (
                                            <>
                                                <div className="text-[11px] font-bold text-bee-black">{b.pickupDate}</div>
                                                <div className="text-[10px] text-gray-400">가방 {b.bags}개</div>
                                            </>
                                        ) : (
                                            <>
                                                <div className="text-[11px] font-bold text-bee-black">{b.pickupDate} ~ {b.dropoffDate || b.pickupDate}</div>
                                                <div className="text-[10px] text-gray-400">{b.pickupTime} - {b.deliveryTime} | 가방 {b.bags}개</div>
                                            </>
                                        )}
                                    </td>
                                    <td className="px-6 py-5">
                                        <div className={`text-[10px] font-black uppercase mb-1 ${b.paymentStatus === 'paid' ? 'text-green-500' : 'text-red-400'}`}>
                                            {b.paymentStatus === 'paid' ? '결제 완료' : '미결제/취소'}
                                        </div>
                                        <div className="text-sm font-black text-bee-yellow tracking-tight">₩{(b.finalPrice || 0).toLocaleString()}</div>
                                    </td>
                                    <td className="px-6 py-5">
                                        <select
                                            value={b.status}
                                            onChange={e => updateStatus(b.id!, e.target.value as BookingStatus)}
                                            title="예약 상태 변경"
                                            className={`text-[10px] font-black py-2 px-3 rounded-xl border-none outline-none shadow-sm cursor-pointer appearance-none transition-all hover:scale-105 ${getStatusStyle(b.status || BookingStatus.PENDING)}`}
                                        >
                                            {Object.values(BookingStatus).map(s => <option key={s} value={s}>{s}</option>)}
                                        </select>
                                    </td>
                                    <td className="px-6 py-5">
                                        <div className="flex items-center justify-center gap-2">
                                            <button
                                                onClick={() => handleResendEmail(b)}
                                                disabled={sendingEmailId === b.id}
                                                className="w-8 h-8 rounded-full bg-gray-100 hover:bg-bee-black hover:text-bee-yellow text-gray-500 transition-all flex items-center justify-center"
                                                title="예약증 재발송"
                                            >
                                                {sendingEmailId === b.id ? <i className="fa-solid fa-spinner animate-spin"></i> : <i className="fa-solid fa-envelope"></i>}
                                            </button>
                                            <button
                                                onClick={() => handleRefund(b)}
                                                disabled={refundingId === b.id || b.status === BookingStatus.REFUNDED}
                                                className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${b.status === BookingStatus.REFUNDED
                                                    ? 'bg-red-50 text-red-200 cursor-not-allowed'
                                                    : 'bg-red-50 text-red-500 hover:bg-red-500 hover:text-white'
                                                    }`}
                                                title="결제 취소(환불)"
                                            >
                                                {refundingId === b.id ? <i className="fa-solid fa-spinner animate-spin"></i> : <i className="fa-solid fa-rotate-left"></i>}
                                            </button>

                                            <button
                                                onClick={() => handlePrintLabel(b)}
                                                className="w-8 h-8 rounded-full bg-gray-100 hover:bg-bee-black hover:text-bee-yellow text-gray-500 transition-all flex items-center justify-center"
                                                title="라벨 출력"
                                            >
                                                <i className="fa-solid fa-print"></i>
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan={7} className="px-8 py-20 text-center text-gray-400 font-bold">
                                        {isRefreshing ? '데이터를 불러오는 중입니다...' : (activeTab === 'TRASH' ? '휴지통이 비었습니다.' : '접수된 예약 내역이 없습니다.')}
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                <div className="md:hidden space-y-4">
                    {filteredBookings.length > 0 ? filteredBookings.map(b => (
                        <div key={b.id} className="bg-white/80 backdrop-blur-3xl p-5 rounded-[24px] border border-gray-200 shadow-sm flex flex-col gap-4">
                            <div className="flex justify-between items-start">
                                <div>
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{b.reservationCode || b.id}</span>
                                        <span className="text-[10px] font-bold text-gray-300">|</span>
                                        <span className="text-[10px] font-bold text-gray-400">{b.pickupDate}</span>
                                    </div>
                                    <h4 className="font-black text-lg text-bee-black group-hover:text-bee-yellow transition-colors cursor-pointer" onClick={() => { setSelectedBooking({ ...b }); }}>{b.userName}</h4>
                                </div>
                                <select
                                    value={b.status}
                                    onChange={e => updateStatus(b.id!, e.target.value as BookingStatus)}
                                    title="예약 상태 변경 (모바일)"
                                    className={`text-[10px] font-black py-1.5 px-3 rounded-xl border-none outline-none shadow-sm cursor-pointer appearance-none ${getStatusStyle(b.status || BookingStatus.PENDING)}`}
                                >
                                    {Object.values(BookingStatus).map(s => <option key={s} value={s}>{s}</option>)}
                                </select>
                            </div>

                            <div className="bg-gray-50/50 p-4 rounded-2xl">
                                {b.serviceType === ServiceType.DELIVERY ? (
                                    <div className="flex items-center gap-3">
                                        <div className="flex-1">
                                            <span className="text-[9px] font-black text-gray-400 uppercase block mb-1">출발</span>
                                            <span className="font-bold text-xs text-bee-black block truncate">{locations.find(l => l.id === b.pickupLocation)?.name || b.pickupLocation}</span>
                                        </div>
                                        <i className="fa-solid fa-arrow-right text-bee-yellow text-xs"></i>
                                        <div className="flex-1 text-right">
                                            <span className="text-[9px] font-black text-gray-400 uppercase block mb-1">도착</span>
                                            <span className="font-bold text-xs text-bee-black block truncate">{locations.find(l => l.id === b.dropoffLocation)?.name || b.dropoffLocation || '-'}</span>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="space-y-2">
                                        <div className="flex justify-between items-center">
                                            <span className="text-[9px] font-black text-gray-400 uppercase">보관 지점</span>
                                            <span className="font-bold text-xs text-bee-black">{locations.find(l => l.id === b.pickupLocation)?.name || b.pickupLocation}</span>
                                        </div>
                                        <div className="flex justify-between items-center border-t border-gray-200 pt-2">
                                            <span className="text-[9px] font-black text-gray-400 uppercase">기간</span>
                                            <span className="font-bold text-[10px] text-bee-black">{b.pickupDate} ~ {b.dropoffDate || b.pickupDate}</span>
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="flex items-center justify-between border-t border-gray-100 pt-3">
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => handleResendEmail(b)}
                                        disabled={sendingEmailId === b.id}
                                        className="w-8 h-8 rounded-full bg-gray-100 text-gray-500 hover:bg-bee-black hover:text-bee-yellow flex items-center justify-center transition-colors"
                                    >
                                        {sendingEmailId === b.id ? <i className="fa-solid fa-spinner animate-spin text-xs"></i> : <i className="fa-solid fa-envelope text-xs"></i>}
                                    </button>
                                    <button
                                        onClick={() => handleRefund(b)}
                                        disabled={refundingId === b.id || b.status === BookingStatus.REFUNDED}
                                        title="결제 취소(환불)"
                                        className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${b.status === BookingStatus.REFUNDED
                                            ? 'bg-red-50 text-red-300'
                                            : 'bg-red-50 text-red-500 hover:bg-red-100 hover:text-red-600'
                                            }`}
                                    >
                                        {refundingId === b.id ? <i className="fa-solid fa-spinner animate-spin text-xs"></i> : <i className="fa-solid fa-rotate-left text-xs"></i>}
                                    </button>

                                    <button title="라벨 출력" onClick={() => handlePrintLabel(b)} className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 transition-colors flex items-center justify-center">
                                        <i className="fa-solid fa-print text-xs"></i>
                                    </button>
                                </div>
                                <span className="font-black text-lg text-bee-black">₩{(b.finalPrice || 0).toLocaleString()}</span>
                            </div>
                        </div>
                    )) : (
                        <div className="bg-white/80 backdrop-blur-3xl p-10 rounded-[24px] text-center border border-gray-200 shadow-sm">
                            <i className="fa-solid fa-folder-open text-gray-300 text-3xl mb-3"></i>
                            <p className="text-xs font-bold text-gray-400">{activeTab === 'TRASH' ? '휴지통이 비었습니다.' : '예약 내역이 없습니다.'}</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default LogisticsTab;
