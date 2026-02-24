
import React, { useMemo } from 'react';
import { BookingState, BookingStatus, ServiceType } from '../../types';

interface ReportsTabProps {
    bookings: BookingState[];
}

const ReportsTab: React.FC<ReportsTabProps> = ({ bookings }) => {
    // Current Year/Month
    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth() + 1;

    const stats = useMemo(() => {
        const daily: Record<string, any> = {};
        const monthly: Record<string, any> = {};
        const yearly: Record<string, any> = {};

        bookings.forEach(b => {
            if (b.isDeleted) return;
            const dateStr = b.pickupDate || b.createdAt?.split('T')[0] || 'Unknown';
            if (dateStr === 'Unknown') return;

            const [y, m, d] = dateStr.split('-');
            const monthKey = `${y}-${m}`;
            const yearKey = y;

            // Initialize Daily
            if (!daily[dateStr]) {
                daily[dateStr] = { date: dateStr, success: { count: 0, sum: 0 }, cancelled: { count: 0, sum: 0 }, refunded: { count: 0, sum: 0 } };
            }
            // Initialize Monthly
            if (!monthly[monthKey]) {
                monthly[monthKey] = { month: monthKey, success: { count: 0, sum: 0 }, cancelled: { count: 0, sum: 0 }, refunded: { count: 0, sum: 0 } };
            }
            // Initialize Yearly
            if (!yearly[yearKey]) {
                yearly[yearKey] = { year: yearKey, success: { count: 0, sum: 0 }, cancelled: { count: 0, sum: 0 }, refunded: { count: 0, sum: 0 } };
            }

            const price = b.finalPrice || 0;

            if (b.status === BookingStatus.COMPLETED) {
                daily[dateStr].success.count++;
                daily[dateStr].success.sum += price;
                monthly[monthKey].success.count++;
                monthly[monthKey].success.sum += price;
                yearly[yearKey].success.count++;
                yearly[yearKey].success.sum += price;
            } else if (b.status === BookingStatus.CANCELLED) {
                daily[dateStr].cancelled.count++;
                daily[dateStr].cancelled.sum += price;
                monthly[monthKey].cancelled.count++;
                monthly[monthKey].cancelled.sum += price;
                yearly[yearKey].cancelled.count++;
                yearly[yearKey].cancelled.sum += price;
            } else if (b.status === BookingStatus.REFUNDED) {
                daily[dateStr].refunded.count++;
                daily[dateStr].refunded.sum += price;
                monthly[monthKey].refunded.count++;
                monthly[monthKey].refunded.sum += price;
                yearly[yearKey].refunded.count++;
                yearly[yearKey].refunded.sum += price;
            }
        });

        return {
            daily: Object.values(daily).sort((a, b) => b.date.localeCompare(a.date)),
            monthly: Object.values(monthly).sort((a, b) => b.month.localeCompare(a.month)),
            yearly: Object.values(yearly).sort((a, b) => b.year.localeCompare(a.year))
        };
    }, [bookings]);

    return (
        <div className="space-y-8 animate-fade-in-up">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-black tracking-tight">예약 실적 리포트 (Reports)</h1>
                <div className="text-xs font-bold text-gray-400 bg-white px-4 py-2 rounded-xl border border-gray-100 italic">
                    Daily & Monthly Analytics
                </div>
            </div>

            {/* Yearly Summary */}
            <div className="bg-white p-8 rounded-[40px] shadow-sm border border-gray-100">
                <h3 className="text-lg font-black mb-6 flex items-center gap-3">
                    <span className="w-2 h-6 bg-bee-black rounded-full"></span>
                    연간 요약 (Yearly Summary)
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {stats.yearly.map(y => (
                        <div key={y.year} className="p-6 bg-gray-50 text-bee-black rounded-3xl border border-gray-100">
                            <div className="flex justify-between items-center mb-4">
                                <span className="text-lg font-black">{y.year}년</span>
                                <i className="fa-solid fa-ranking-star text-bee-yellow"></i>
                            </div>
                            <div className="space-y-4">
                                <div className="flex justify-between items-end">
                                    <span className="text-[10px] font-black uppercase text-gray-400">총 성공 매출</span>
                                    <div className="text-right">
                                        <p className="text-xl font-black italic">₩{y.success.sum.toLocaleString()}</p>
                                        <p className="text-[10px] font-bold text-gray-400">{y.success.count}건</p>
                                    </div>
                                </div>
                                <div className="pt-4 border-t border-gray-200 grid grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-[9px] font-black uppercase text-gray-400 mb-1">취소 (₩)</p>
                                        <p className="text-sm font-black italic text-gray-600">₩{(y.cancelled.sum / 1000).toFixed(0)}k</p>
                                    </div>
                                    <div>
                                        <p className="text-[9px] font-black uppercase text-gray-400 mb-1">환불 (₩)</p>
                                        <p className="text-sm font-black italic text-gray-600">₩{(y.refunded.sum / 1000).toFixed(0)}k</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Monthly Summary & Daily Trends */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="bg-white p-8 rounded-[40px] shadow-sm border border-gray-100">
                    <h3 className="text-lg font-black mb-6 flex items-center gap-3">
                        <span className="w-2 h-6 bg-bee-yellow rounded-full"></span>
                        월간 요약 (Monthly Summary)
                    </h3>
                    <div className="space-y-4">
                        {stats.monthly.map(m => (
                            <div key={m.month} className="p-5 bg-gray-50 rounded-3xl border border-gray-100">
                                <div className="flex justify-between items-center mb-4">
                                    <span className="text-sm font-black text-bee-black">{m.month}</span>
                                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Monthly Performance</span>
                                </div>
                                <div className="grid grid-cols-3 gap-4">
                                    <div className="text-center">
                                        <p className="text-[9px] font-black text-green-600 uppercase mb-1">성공 (Success)</p>
                                        <p className="text-sm font-black italic">₩{m.success.sum.toLocaleString()}</p>
                                        <p className="text-[10px] font-bold text-gray-400">{m.success.count}건</p>
                                    </div>
                                    <div className="text-center">
                                        <p className="text-[9px] font-black text-red-400 uppercase mb-1">취소 (Cancel)</p>
                                        <p className="text-sm font-black italic">₩{m.cancelled.sum.toLocaleString()}</p>
                                        <p className="text-[10px] font-bold text-gray-400">{m.cancelled.count}건</p>
                                    </div>
                                    <div className="text-center">
                                        <p className="text-[9px] font-black text-orange-400 uppercase mb-1">환불 (Refund)</p>
                                        <p className="text-sm font-black italic">₩{m.refunded.sum.toLocaleString()}</p>
                                        <p className="text-[10px] font-bold text-gray-400">{m.refunded.count}건</p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="bg-white p-8 rounded-[40px] shadow-sm border border-gray-100">
                    <h3 className="text-lg font-black mb-6 flex items-center gap-3">
                        <span className="w-2 h-6 bg-bee-blue rounded-full"></span>
                        일간 추이 (Daily Trends)
                    </h3>
                    <div className="max-h-[500px] overflow-y-auto custom-scrollbar pr-2">
                        {stats.daily.length > 0 ? (
                            <table className="w-full text-left">
                                <thead className="sticky top-0 bg-white text-[10px] font-black uppercase text-gray-400 border-b border-gray-50 pb-4 block">
                                    <tr className="flex">
                                        <th className="w-1/4">날짜</th>
                                        <th className="w-1/4 text-center">성공</th>
                                        <th className="w-1/4 text-center text-red-400">취소</th>
                                        <th className="w-1/4 text-center text-orange-400">환불</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50 block mt-4">
                                    {stats.daily.map(d => (
                                        <tr key={d.date} className="flex py-4 items-center hover:bg-gray-50 rounded-2xl transition-all border-b border-transparent hover:border-gray-100 px-2">
                                            <td className="w-1/4 font-black text-xs text-gray-400">{d.date.slice(5)}</td>
                                            <td className="w-1/4 text-center">
                                                {d.success.count > 0 ? (
                                                    <div className="group relative">
                                                        <p className="font-black text-xs text-bee-black">₩{(d.success.sum / 1000).toFixed(0)}k</p>
                                                        <p className="text-[10px] font-bold text-gray-300">({d.success.count})</p>
                                                    </div>
                                                ) : <span className="text-gray-200">-</span>}
                                            </td>
                                            <td className="w-1/4 text-center">
                                                {d.cancelled.count > 0 ? (
                                                    <div>
                                                        <p className="font-black text-xs text-red-400">₩{(d.cancelled.sum / 1000).toFixed(0)}k</p>
                                                        <p className="text-[10px] font-bold text-red-100">({d.cancelled.count})</p>
                                                    </div>
                                                ) : <span className="text-gray-200">-</span>}
                                            </td>
                                            <td className="w-1/4 text-center">
                                                {d.refunded.count > 0 ? (
                                                    <div>
                                                        <p className="font-black text-xs text-orange-400">₩{(d.refunded.sum / 1000).toFixed(0)}k</p>
                                                        <p className="text-[10px] font-bold text-orange-100">({d.refunded.count})</p>
                                                    </div>
                                                ) : <span className="text-gray-200">-</span>}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        ) : (
                            <div className="flex flex-col items-center justify-center py-20 text-gray-300">
                                <i className="fa-solid fa-chart-line text-4xl mb-4"></i>
                                <p className="text-xs font-black">집계된 데이터가 없습니다.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ReportsTab;
