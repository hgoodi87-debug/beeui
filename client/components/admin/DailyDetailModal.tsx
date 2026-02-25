import React from 'react';
import { BookingState, BookingStatus, Expenditure } from '../../types';

interface DailyDetailModalProps {
    selectedDetailDate: string | null;
    setSelectedDetailDate: (date: string | null) => void;
    bookings: BookingState[];
    expenditures: Expenditure[];
    setSelectedBooking: (booking: BookingState | null) => void;
}

const DailyDetailModal: React.FC<DailyDetailModalProps> = ({
    selectedDetailDate,
    setSelectedDetailDate,
    bookings,
    expenditures,
    setSelectedBooking
}) => {
    if (!selectedDetailDate) return null;

    const dayBookings = bookings.filter(b => b.pickupDate === selectedDetailDate && !b.isDeleted && b.status !== BookingStatus.CANCELLED && b.status !== BookingStatus.REFUNDED);
    const dayExps = expenditures.filter(e => e.date === selectedDetailDate);

    const totalRev = dayBookings.reduce((sum, b) => sum + (b.finalPrice || 0), 0);
    const totalExp = dayExps.reduce((sum, e) => sum + (e.amount || 0), 0);

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
            <div className="bg-white w-full max-w-4xl rounded-[40px] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
                <div className="bg-white/80 backdrop-blur-3xl border-b border-gray-200 p-8 flex justify-between items-center text-bee-black">
                    <div>
                        <h2 className="text-2xl font-black">{selectedDetailDate} 상세 정산 내역</h2>
                        <p className="text-gray-500 text-xs font-bold mt-1">Daily Revenue & Expenditure Details</p>
                    </div>
                    <button title="닫기" aria-label="닫기" onClick={() => setSelectedDetailDate(null)} className="w-12 h-12 rounded-2xl bg-gray-100 text-gray-400 hover:bg-gray-200 hover:text-bee-black flex items-center justify-center transition-all">
                        <i className="fa-solid fa-xmark text-xl"></i>
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-6 md:p-10 custom-scrollbar">
                    <div className="grid grid-cols-2 gap-4 mb-8">
                        <div className="bg-blue-50 p-6 rounded-3xl border border-blue-100">
                            <span className="text-[10px] font-black text-blue-400 uppercase tracking-widest block mb-1">총 매출 (Revenue)</span>
                            <span className="text-2xl font-black text-blue-700">₩{totalRev.toLocaleString()}</span>
                        </div>
                        <div className="bg-red-50 p-6 rounded-3xl border border-red-100">
                            <span className="text-[10px] font-black text-red-400 uppercase tracking-widest block mb-1">총 지출 (Expenditure)</span>
                            <span className="text-2xl font-black text-red-700">₩{totalExp.toLocaleString()}</span>
                        </div>
                    </div>

                    <div className="space-y-8">
                        <section>
                            <h3 className="text-lg font-black mb-4 flex items-center gap-2">
                                <span className="w-2 h-6 bg-blue-500 rounded-full"></span>
                                매출 내역 ({dayBookings.length}건)
                            </h3>
                            <div className="bg-gray-50 rounded-3xl overflow-hidden border border-gray-100">
                                <table className="w-full text-left text-xs">
                                    <thead className="bg-white border-b text-[10px] font-black text-gray-400 uppercase">
                                        <tr>
                                            <th className="px-6 py-4">ID/이름</th>
                                            <th className="px-6 py-4">서비스/경로</th>
                                            <th className="px-6 py-4">결제수단</th>
                                            <th className="px-6 py-4 text-right">금액</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {dayBookings.map(b => (
                                            <tr
                                                key={b.id}
                                                className="hover:bg-white transition-colors cursor-pointer group"
                                                onClick={() => {
                                                    setSelectedBooking({ ...b });
                                                    setSelectedDetailDate(null);
                                                }}
                                            >
                                                <td className="px-6 py-4">
                                                    <div className="font-black text-bee-black flex items-center gap-2">
                                                        {b.userName}
                                                        <i className="fa-solid fa-magnifying-glass text-[10px] text-gray-300 opacity-0 group-hover:opacity-100 transition-opacity"></i>
                                                    </div>
                                                    <div className="text-[10px] text-gray-400">{b.reservationCode || b.id}</div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="font-bold">{b.serviceType}</div>
                                                    <div className="text-[10px] text-gray-400 truncate max-w-[150px]">{b.pickupLocation} &rarr; {b.dropoffLocation}</div>
                                                </td>
                                                <td className="px-6 py-4 uppercase font-black text-[10px] text-gray-500">{b.paymentMethod || 'Credit'}</td>
                                                <td className="px-6 py-4 text-right font-black text-blue-600">₩{(b.finalPrice || 0).toLocaleString()}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </section>

                        <section>
                            <h3 className="text-lg font-black mb-4 flex items-center gap-2">
                                <span className="w-2 h-6 bg-red-500 rounded-full"></span>
                                지출 내역 ({dayExps.length}건)
                            </h3>
                            {dayExps.length > 0 ? (
                                <div className="bg-gray-50 rounded-3xl overflow-hidden border border-gray-100">
                                    <table className="w-full text-left text-xs">
                                        <thead className="bg-white border-b text-[10px] font-black text-gray-400 uppercase">
                                            <tr>
                                                <th className="px-6 py-4">항목</th>
                                                <th className="px-6 py-4">상세내용</th>
                                                <th className="px-6 py-4 text-right">금액</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100">
                                            {dayExps.map(e => (
                                                <tr key={e.id} className="hover:bg-white transition-colors">
                                                    <td className="px-6 py-4 font-black">{e.category}</td>
                                                    <td className="px-6 py-4 text-gray-500">{e.description}</td>
                                                    <td className="px-6 py-4 text-right font-black text-red-600">₩{(e.amount || 0).toLocaleString()}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            ) : (
                                <div className="text-center py-10 text-gray-400 font-bold bg-gray-50 rounded-3xl">지출 내역이 없습니다.</div>
                            )}
                        </section>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DailyDetailModal;
