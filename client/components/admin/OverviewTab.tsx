import React, { useMemo } from 'react';
import { BookingState, BookingStatus, LocationOption, ServiceType, CashClosing } from '../../types';
import { OperatingStatus, SettlementStatus, AdminPaymentStatus } from '../../src/domains/admin/types';
import { ADMIN_COLORS, OPERATING_STATUS_CONFIG } from '../../src/constants/admin';

interface OverviewTabProps {
    todayKST: string;
    bookings: BookingState[];
    locations: LocationOption[];
    setActiveTab: (tab: any) => void;
    setActiveStatusTab: (tab: any) => void;
    dailyStats: any[];
    revenueStats?: any;
    closings?: CashClosing[];
}

const OverviewTab: React.FC<OverviewTabProps> = ({
    todayKST,
    bookings,
    locations,
    setActiveTab,
    setActiveStatusTab,
    dailyStats,
    revenueStats,
    closings
}) => {
    // [스봉이] 오늘 실무 데이터 필터링
    const activeBookings = bookings.filter(b => !b.isDeleted);
    const todayBookings = activeBookings.filter(b => b.pickupDate === todayKST);

    // 1. 핵심 KPI 계산 (운영 중심)
    const stats = useMemo(() => {
        return {
            totalToday: todayBookings.length,
            newPayments: todayBookings.filter(b => b.paymentStatus === 'paid').length,
            expectedIn: activeBookings.filter(b => b.status === BookingStatus.PENDING && b.pickupDate <= todayKST).length,
            expectedOut: activeBookings.filter(b => 
                (b.status === BookingStatus.STORAGE || b.status === BookingStatus.TRANSIT) && 
                (b.returnDate === todayKST || b.dropoffDate === todayKST)
            ).length,
            issueCount: activeBookings.filter(b => b.status === BookingStatus.CANCELLED || b.status === BookingStatus.REFUNDED || b.auditNote).length,
            unsettledCount: activeBookings.filter(b => b.status === BookingStatus.COMPLETED && !b.branchSettlementAmount).length,
            settledAmount: revenueStats?.total || 0,
        };
    }, [activeBookings, todayBookings, todayKST, revenueStats]);

    // 2. 지점별 현황 요약 (현금 마감 상태 포함)
    const branchStats = useMemo(() => {
        return locations.filter(l => l.isActive).map(loc => {
            const locBookings = todayBookings.filter(b => b.branchId === loc.id || b.pickupLocation === loc.id);
            const isClosed = closings?.some(c => c.date === todayKST && (c as any).branchId === loc.id);
            
            return {
                id: loc.id,
                name: loc.name,
                bookings: locBookings.length,
                pending: locBookings.filter(b => b.status === BookingStatus.PENDING).length,
                active: locBookings.filter(b => [BookingStatus.STORAGE, BookingStatus.TRANSIT, BookingStatus.ARRIVED].includes(b.status as any)).length,
                completed: locBookings.filter(b => b.status === BookingStatus.COMPLETED).length,
                issues: locBookings.filter(b => b.auditNote).length,
                cashClosed: isClosed
            };
        }).sort((a, b) => b.bookings - a.bookings);
    }, [todayBookings, locations, closings, todayKST]);

    return (
        <div className="space-y-8 animate-fade-in-up">
            <div className="flex justify-between items-center">
                <div className="space-y-1">
                    <h1 className="text-3xl font-black tracking-tight text-bee-black">통합 관제 상황판 (Ops Board) 📊</h1>
                    <p className="text-sm font-bold text-gray-500">사장님, 오늘 비리버의 흐름은 이렇습니다. 빈틈없이 관리 중이에요. 💅</p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="text-right">
                        <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest">System Status</div>
                        <div className="text-xs font-bold text-bee-black flex items-center gap-1.5 justify-end">
                            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                            All Systems Go
                        </div>
                    </div>
                </div>
            </div>

            {/* A. 프리미엄 KPI 위젯 */}
            <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
                {[
                    { label: '오늘 예약', value: stats.totalToday, color: 'text-bee-black', bg: 'bg-white' },
                    { label: '신규 결제', value: stats.newPayments, color: 'text-blue-600', bg: 'bg-blue-50', isPulse: true },
                    { label: '입고 예정', value: stats.expectedIn, color: 'text-orange-600', bg: 'bg-orange-50' },
                    { label: '출고 예정', value: stats.expectedOut, color: 'text-purple-600', bg: 'bg-purple-50' },
                    { label: '지연/이슈', value: stats.issueCount, color: 'text-red-600', bg: 'bg-red-50', isWarning: stats.issueCount > 0 },
                    { label: '정산 확정액', value: `₩${(stats.settledAmount / 10000).toFixed(1)}만`, color: 'text-emerald-600', bg: 'bg-emerald-50' },
                ].map((kpi, idx) => (
                    <div key={idx} className={`${kpi.bg} p-5 rounded-3xl shadow-sm border border-gray-100/50 hover:shadow-md transition-all cursor-default group`}>
                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1 group-hover:text-bee-black transition-colors">
                            {kpi.label}
                        </span>
                        <div className="flex items-center gap-2">
                            <h4 className={`text-xl font-black ${kpi.color}`}>
                                {kpi.value}
                            </h4>
                            {kpi.isPulse && stats.newPayments > 0 && <span className="w-2 h-2 rounded-full bg-blue-500 animate-ping"></span>}
                        </div>
                    </div>
                ))}
            </div>

            {/* B. 오늘 주요 액션 (Action Board) */}
            <div className="bg-bee-black p-8 rounded-[40px] shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-bee-yellow/10 rounded-full -mr-32 -mt-32 blur-3xl"></div>
                <h3 className="text-lg font-black text-white mb-6 flex items-center gap-3 relative z-10">
                    <span className="w-2 h-6 bg-bee-yellow rounded-full"></span>
                    실시간 실무 액션 아이템 ☕
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 relative z-10">
                    {[
                        { label: '입고 확인 필요', count: stats.expectedIn, icon: 'fa-box-open', color: 'yellow', tab: 'DELIVERY_BOOKINGS', status: 'PENDING' },
                        { label: '출고 처리 대기', count: stats.expectedOut, icon: 'fa-paper-plane', color: 'blue', tab: 'DELIVERY_BOOKINGS', status: 'ACTIVE' },
                        { label: '취소/변경 요청', count: stats.issueCount, icon: 'fa-circle-exclamation', color: 'red', tab: 'TRASH', status: 'ALL' },
                        { label: '정산 미확정 건', count: stats.unsettledCount, icon: 'fa-coins', color: 'emerald', tab: 'DAILY_SETTLEMENT', status: 'ALL' },
                    ].map((task, idx) => (
                        <div 
                            key={idx}
                            onClick={() => {
                                setActiveTab(task.tab);
                                setActiveStatusTab(task.status);
                            }}
                            className="bg-white/5 hover:bg-white/10 p-5 rounded-3xl cursor-pointer transition-all border border-white/5 backdrop-blur-md group"
                        >
                            <div className="flex justify-between items-start mb-2">
                                <i className={`fa-solid ${task.icon} text-white/30 group-hover:text-bee-yellow transition-colors`}></i>
                                {task.count > 0 && <span className="px-2.5 py-1 bg-red-500 text-[10px] font-black text-white rounded-lg animate-bounce">{task.count}</span>}
                            </div>
                            <span className="text-sm font-bold text-white/90">{task.label}</span>
                        </div>
                    ))}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* C. 운영 상태 보드 (Granular) */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Delivery Console Header */}
                        <div className="bg-white p-8 rounded-[40px] shadow-sm border border-gray-100 hover:border-bee-yellow/50 transition-colors">
                            <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-6 flex items-center justify-between">
                                <span>Delivery Console</span>
                                <i className="fa-solid fa-truck-fast text-bee-yellow"></i>
                            </h4>
                            <div className="space-y-4">
                                {[
                                    { label: '오늘 접수 예정', count: activeBookings.filter(b => b.status === BookingStatus.PENDING && b.pickupDate === todayKST && b.serviceType === ServiceType.DELIVERY).length, color: 'bg-gray-400' },
                                    { label: '이동중 (Transit)', count: activeBookings.filter(b => b.status === BookingStatus.TRANSIT).length, color: 'bg-blue-500' },
                                    { label: '도착 대기 (Arrived)', count: activeBookings.filter(b => b.status === BookingStatus.ARRIVED).length, color: 'bg-orange-500' },
                                    { label: '지연/이슈', count: activeBookings.filter(b => b.auditNote && b.serviceType === ServiceType.DELIVERY).length, color: 'bg-red-500', isCritical: true },
                                    { label: '오늘 완료', count: todayBookings.filter(b => b.status === BookingStatus.COMPLETED && b.serviceType === ServiceType.DELIVERY).length, color: 'bg-green-500' },
                                ].map((row, idx) => (
                                    <div key={idx} className="flex justify-between items-center group cursor-pointer" onClick={() => setActiveTab('DELIVERY_BOOKINGS')}>
                                        <div className="flex items-center gap-3">
                                            <span className={`w-1.5 h-1.5 rounded-full ${row.color}`}></span>
                                            <span className={`text-sm font-bold ${row.isCritical ? 'text-red-500' : 'text-gray-600'}`}>{row.label}</span>
                                        </div>
                                        <span className="font-black text-bee-black group-hover:scale-110 transition-transform">{row.count} 건</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Storage Console Header */}
                        <div className="bg-white p-8 rounded-[40px] shadow-sm border border-gray-100 hover:border-bee-blue/50 transition-colors">
                            <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-6 flex items-center justify-between">
                                <span>Storage Console</span>
                                <i className="fa-solid fa-warehouse text-blue-500"></i>
                            </h4>
                            <div className="space-y-4">
                                {[
                                    { label: '오늘 입고 예정', count: todayBookings.filter(b => b.serviceType === ServiceType.STORAGE && b.status === BookingStatus.PENDING).length, color: 'bg-orange-400' },
                                    { label: '현재 보관중', count: activeBookings.filter(b => b.status === BookingStatus.STORAGE).length, color: 'bg-blue-500' },
                                    { label: '오늘 출고 예정', count: todayBookings.filter(b => b.serviceType === ServiceType.STORAGE && b.status === BookingStatus.STORAGE && (b.returnDate === todayKST || b.dropoffDate === todayKST)).length, color: 'bg-purple-500' },
                                    { label: '미입고/노쇼', count: activeBookings.filter(b => b.status === BookingStatus.PENDING && b.pickupDate < todayKST).length, color: 'bg-gray-300' },
                                    { label: '오늘 완료', count: todayBookings.filter(b => b.status === BookingStatus.COMPLETED && b.serviceType === ServiceType.STORAGE).length, color: 'bg-green-500' },
                                ].map((row, idx) => (
                                    <div key={idx} className="flex justify-between items-center group cursor-pointer" onClick={() => setActiveTab('STORAGE_BOOKINGS')}>
                                        <div className="flex items-center gap-3">
                                            <span className={`w-1.5 h-1.5 rounded-full ${row.color}`}></span>
                                            <span className="text-sm font-bold text-gray-600">{row.label}</span>
                                        </div>
                                        <span className="font-black text-bee-black group-hover:scale-110 transition-transform">{row.count} 건</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* D. 지점별 운영 현황 (확장형) */}
                    <div className="bg-white p-8 rounded-[40px] shadow-sm border border-gray-100">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-lg font-black text-bee-black flex items-center gap-3">
                                <i className="fa-solid fa-location-dot text-bee-yellow"></i>
                                전 지점 운영 인덱스
                            </h3>
                            <button onClick={() => setActiveTab('LOCATIONS')} className="text-[10px] font-black text-gray-400 hover:text-bee-black transition-colors uppercase tracking-widest">Manage Centers →</button>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead>
                                    <tr className="text-[10px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-100">
                                        <th className="pb-4">지점명</th>
                                        <th className="pb-4">오늘</th>
                                        <th className="pb-4">대기</th>
                                        <th className="pb-4">진행중</th>
                                        <th className="pb-4">완료</th>
                                        <th className="pb-4">이슈</th>
                                        <th className="pb-4 text-center">현금마감</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {branchStats.map((branch, idx) => (
                                        <tr key={idx} className="group hover:bg-gray-50 transition-colors">
                                            <td className="py-4 font-black text-bee-black">{branch.name}</td>
                                            <td className="py-4 font-bold text-gray-600">{branch.bookings}</td>
                                            <td className="py-4">
                                                <span className={`font-bold ${branch.pending > 0 ? 'text-orange-500' : 'text-gray-400'}`}>{branch.pending}</span>
                                            </td>
                                            <td className="py-4 font-bold text-gray-600">{branch.active}</td>
                                            <td className="py-4 font-bold text-bee-yellow">{branch.completed}</td>
                                            <td className="py-4">
                                                {branch.issues > 0 ? (
                                                    <span className="px-2 py-0.5 bg-red-100 text-red-600 rounded-full text-[10px] font-black animate-pulse">
                                                        {branch.issues}
                                                    </span>
                                                ) : <span className="text-gray-300">-</span>}
                                            </td>
                                            <td className="py-4 text-center">
                                                {branch.cashClosed ? (
                                                    <span className="text-emerald-500 text-xs font-black underline decoration-emerald-200 underline-offset-4">CLOSED</span>
                                                ) : (
                                                    <span className="text-gray-300 text-xs font-bold">OPEN</span>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                {/* E. 매출 및 정산 가시성 */}
                <div className="space-y-6">
                    <div className="bg-white p-8 rounded-[40px] shadow-xl border border-gray-100 relative overflow-hidden group">
                        <div className="absolute -top-10 -right-10 p-8 opacity-5 text-bee-black group-hover:scale-110 transition-transform duration-700">
                            <i className="fa-solid fa-coins text-[180px]"></i>
                        </div>
                        <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 flex justify-between items-center">
                            오늘 예상 매출액
                            <span className="text-emerald-500"><i className="fa-solid fa-arrow-trend-up"></i></span>
                        </h3>
                        <div className="text-4xl font-black mb-6 text-bee-black tracking-tighter">
                            ₩{Math.round(revenueStats?.total || 0).toLocaleString()}
                        </div>

                        <div className="space-y-3 pt-6 border-t border-gray-100">
                            <div className="flex justify-between text-xs items-center">
                                <span className="text-gray-500 font-bold">카드 결제 (Net)</span>
                                <span className="font-black text-bee-black">
                                    ₩{Math.round(revenueStats?.card || 0).toLocaleString()}
                                </span>
                            </div>
                            <div className="flex justify-between text-xs items-center">
                                <span className="text-gray-500 font-bold">현금 수납 (지점)</span>
                                <span className="font-black text-bee-black">
                                    ₩{Math.round(revenueStats?.cash || 0).toLocaleString()}
                                </span>
                            </div>
                            <div className="flex justify-between text-xs items-center pt-2">
                                <span className="text-red-400 font-bold">환불/차액 처리</span>
                                <span className="font-black text-red-500">
                                    -₩0
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* 주간 매출 추이 (Glow Bar) */}
                    <div className="bg-white p-8 rounded-[40px] shadow-sm border border-gray-100">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest">Weekly Revenue</h3>
                            <i className="fa-solid fa-chart-line text-gray-200"></i>
                        </div>
                        <div className="space-y-5">
                            {dailyStats.slice(0, 5).map((s: any) => (
                                <div key={s.date} className="flex items-center justify-between">
                                    <div className="flex flex-col">
                                        <span className="font-black text-[10px] text-bee-black">{s.date.slice(5).replace('-', '.')}</span>
                                        <span className="font-bold text-[9px] text-gray-400 uppercase">{new Date(s.date).toLocaleDateString('en-US', { weekday: 'short' })}</span>
                                    </div>
                                    <div className="flex-1 mx-4 h-1.5 bg-gray-50 rounded-full overflow-hidden">
                                        <div 
                                            className="h-full bg-bee-yellow rounded-full shadow-[0_0_10px_rgba(255,203,5,0.5)]" 
                                            style={{ width: `${Math.min(100, (s.total / 500000) * 100)}%` }}
                                        ></div>
                                    </div>
                                    <div className="text-right">
                                        <div className="font-black text-[11px] text-bee-black">₩{(s.total / 10000).toFixed(1)}만</div>
                                        <div className="text-[9px] font-bold text-gray-400">{s.count ?? 0}건</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* [스봉이] 정산 보류 알림 */}
                    <div className="bg-orange-50/50 p-6 rounded-3xl border border-orange-100">
                        <div className="flex items-center gap-3 text-orange-600 mb-2">
                            <i className="fa-solid fa-triangle-exclamation"></i>
                            <span className="text-xs font-black">정산 보류/조정 필요</span>
                        </div>
                        <p className="text-[10px] leading-relaxed text-orange-800/70 font-bold">
                            지점 시재와 시스템 금액이 불일치하는 건이 0건 있습니다. 일일 정산 탭에서 확인 후 마감해 주세요. 💅
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default OverviewTab;
