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
    t: any;
}

const OverviewTab: React.FC<OverviewTabProps> = ({
    todayKST,
    bookings,
    locations,
    setActiveTab,
    setActiveStatusTab,
    dailyStats,
    revenueStats,
    closings,
    t
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
            unsettledCount: activeBookings.filter(b => b.status === BookingStatus.COMPLETED && b.settlementStatus !== 'CONFIRMED').length,
            settledAmount: revenueStats?.total || 0,
        };
    }, [activeBookings, todayBookings, todayKST, revenueStats]);

    // 2. 지점별 현황 요약 (현금 마감 상태 포함 & 매출순 정렬 🔝)
    const branchStats = useMemo(() => {
        return locations.filter(l => l.isActive).map(loc => {
            const locBookings = todayBookings.filter(b => b.branchId === loc.id || b.pickupLocation === loc.id);
            const isClosed = closings?.some(c => c.date === todayKST && (c as any).branchId === loc.id);
            const todayRevenue = locBookings.reduce((sum, b) => sum + (b.finalPrice || 0), 0);
            
            return {
                id: loc.id,
                name: loc.name,
                bookings: locBookings.length,
                revenue: todayRevenue,
                pending: locBookings.filter(b => b.status === BookingStatus.PENDING).length,
                active: locBookings.filter(b => [BookingStatus.STORAGE, BookingStatus.TRANSIT, BookingStatus.ARRIVED].includes(b.status as any)).length,
                completed: locBookings.filter(b => b.status === BookingStatus.COMPLETED).length,
                issues: locBookings.filter(b => b.auditNote).length,
                cashClosed: isClosed
            };
        }).sort((a, b) => b.revenue - a.revenue); // [스봉이] 사장님 요청대로 매출순으로 정렬해 드렸어요 💅
    }, [todayBookings, locations, closings, todayKST]);

    return (
        <div className="space-y-8 animate-fade-in-up">
            <div className="flex justify-between items-center">
                <div className="space-y-1">
                    <h1 className="text-3xl font-black tracking-tight text-bee-black">{t.admin?.header?.dashboard || '통합 관제 상황판 (Ops Board)'} 📊</h1>
                    <p className="text-sm font-bold text-gray-500">사장님, 오늘 비리버의 흐름은 이렇습니다. 빈틈없이 관리 중이에요. 💅</p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="text-right">
                        <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest">운영 상태 모니터링</div>
                        <div className="text-xs font-bold text-bee-black flex items-center gap-1.5 justify-end">
                            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                            정상 가동 중
                        </div>
                    </div>
                </div>
            </div>

            {/* A. 프리미엄 KPI 위젯 - [스봉이] 모바일 가독성 및 줄바꿈 최적화 💅 */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 md:gap-4">
                {[
                    { label: '오늘 전체 가동', value: stats.totalToday, color: 'text-bee-black', bg: 'bg-white' },
                    { label: '입고 확인 대기', value: stats.expectedIn, color: 'text-orange-600', bg: 'bg-orange-50', isPulse: stats.expectedIn > 0 },
                    { label: '출고 처리 대기', value: stats.expectedOut, color: 'text-blue-600', bg: 'bg-blue-50' },
                    { label: '미조치 이슈', value: stats.issueCount, color: 'text-red-600', bg: 'bg-red-50', isWarning: stats.issueCount > 0 },
                    { label: '정산 미확정', value: stats.unsettledCount, color: 'text-purple-600', bg: 'bg-purple-50' },
                    { label: '오늘 결제 완료', value: stats.newPayments, color: 'text-emerald-600', bg: 'bg-emerald-50' },
                ].map((kpi, idx) => (
                    <div key={idx} className={`${kpi.bg} p-4 md:p-5 rounded-3xl shadow-sm border border-gray-100/50 hover:shadow-md transition-all cursor-default group flex flex-col justify-between min-h-[90px] md:min-h-[110px]`}>
                        <span className="text-[9px] md:text-[10px] font-black text-gray-400 uppercase tracking-tight md:tracking-widest block mb-1 group-hover:text-bee-black transition-colors whitespace-nowrap overflow-hidden text-ellipsis">
                            {kpi.label}
                        </span>
                        <div className="flex items-center gap-2">
                            <h4 className={`text-xl md:text-2xl font-black ${kpi.color} tabular-nums`}>
                                {kpi.value.toLocaleString()}
                            </h4>
                            {kpi.isPulse && <span className="w-1.5 h-1.5 md:w-2 md:h-2 rounded-full bg-orange-500 animate-ping"></span>}
                        </div>
                    </div>
                ))}
            </div>

            {/* B. 오늘 주요 액션 (Action Board) - 사장님, 기운 내서 이것부터 하세요! 💅 */}
            <div className="bg-bee-black p-8 rounded-[40px] shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-bee-yellow/10 rounded-full -mr-32 -mt-32 blur-3xl"></div>
                <h3 className="text-lg font-black text-white mb-6 flex items-center gap-3 relative z-10">
                    <span className="w-2 h-6 bg-bee-yellow rounded-full"></span>
                    실물 운영 우선순위 (Priority P0) ☕
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 relative z-10">
                    {[
                        { label: '당일 입고/집하 확인', count: stats.expectedIn, icon: 'fa-box-open', color: 'yellow', tab: 'DELIVERY_BOOKINGS', status: 'PENDING' },
                        { label: '당일 출고/배송 처리', count: stats.expectedOut, icon: 'fa-paper-plane', color: 'blue', tab: 'DELIVERY_BOOKINGS', status: 'ACTIVE' },
                        { label: '긴급 이슈 대응', count: stats.issueCount, icon: 'fa-circle-exclamation', color: 'red', tab: 'DELIVERY_BOOKINGS', status: 'ISSUE' },
                        { label: '미정산 건 금융 대조', count: stats.unsettledCount, icon: 'fa-coins', color: 'emerald', tab: 'FINANCIAL_COMPARISON', status: 'ALL' },
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

            {/* C. 운영 상태 보드 & 지점별 현황 - 전체 너비로 시원하게! 💅 */}
            <div className="space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Delivery Console Header */}
                    <div className="bg-white p-8 rounded-[40px] shadow-sm border border-gray-100 hover:border-bee-yellow/50 transition-colors">
                        <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-6 flex items-center justify-between">
                            <span>Delivery Status Console</span>
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
                            <span>Storage Status Console</span>
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

                {/* D. 지점별 운영 인덱스 - 실시간 집계 강조 💅 */}
                <div className="bg-white p-8 rounded-[40px] shadow-sm border border-gray-100">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-lg font-black text-bee-black flex items-center gap-3">
                            <i className="fa-solid fa-ranking-star text-bee-yellow"></i>
                            전 지점 매출 순위 및 운영 인덱스
                        </h3>
                        <button onClick={() => setActiveTab('LOCATIONS')} className="text-[10px] font-black text-gray-400 hover:text-bee-black transition-colors uppercase tracking-widest">Manage Centers →</button>
                    </div>
                    <div className="overflow-x-auto no-scrollbar -mx-4 px-4 md:mx-0 md:px-0">
                        <table className="w-full text-left min-w-[700px] md:min-w-full">
                            <thead>
                                <tr className="text-[9px] md:text-[10px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-100">
                                    <th className="pb-4 sticky left-0 bg-white group-hover:bg-gray-50 transition-colors z-10">지점명</th>
                                    <th className="pb-4">오늘 매출</th>
                                    <th className="pb-4">오늘 전체</th>
                                    <th className="pb-4">입고대기</th>
                                    <th className="pb-4">보관/진행</th>
                                    <th className="pb-4">완료</th>
                                    <th className="pb-4">이슈</th>
                                    <th className="pb-4 text-center">시재마감</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {branchStats.map((branch, idx) => (
                                    <tr key={idx} className="group hover:bg-gray-50 transition-colors">
                                        <td className="py-4 font-black text-bee-black sticky left-0 bg-white group-hover:bg-gray-50 transition-colors z-10">
                                            <div className="flex items-center gap-2">
                                                <span className="w-1 h-3 bg-bee-yellow rounded-full"></span>
                                                <span className="whitespace-nowrap">{branch.name}</span>
                                            </div>
                                        </td>
                                        <td className="py-4 font-black text-emerald-600 tabular-nums">₩{branch.revenue.toLocaleString()}</td>
                                        <td className="py-4 font-bold text-gray-600 tabular-nums">{branch.bookings}건</td>
                                        <td className="py-4">
                                            <span className={`font-black tabular-nums border px-1.5 py-0.5 rounded-md ${branch.pending > 0 ? 'bg-orange-50 text-orange-500 border-orange-100' : 'text-gray-300 border-transparent'}`}>{branch.pending}</span>
                                        </td>
                                        <td className="py-4 font-bold text-gray-600 tabular-nums">{branch.active}</td>
                                        <td className="py-4 font-bold text-bee-yellow tabular-nums">{branch.completed}</td>
                                        <td className="py-4">
                                            {branch.issues > 0 ? (
                                                <span className="px-2 py-0.5 bg-red-100 text-red-600 rounded-full text-[10px] font-black animate-pulse">
                                                    {branch.issues}
                                                </span>
                                            ) : <span className="text-gray-300">-</span>}
                                        </td>
                                        <td className="py-4 text-center">
                                            {branch.cashClosed ? (
                                                <span className="text-emerald-500 text-[10px] font-black underline decoration-emerald-200 underline-offset-4">CLOSED</span>
                                            ) : (
                                                <span className="text-gray-300 text-[10px] font-bold">OPEN</span>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* E. 매출 및 정산 가시성 - 운영 방해 안 되게 하단으로 얌전히 내려왔어요 💅 */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 pt-8 border-t border-gray-100">
                <div className="bg-white p-8 rounded-[40px] shadow-xl border border-gray-100 relative overflow-hidden group">
                    <div className="absolute -top-10 -right-10 p-8 opacity-5 text-bee-black group-hover:scale-110 transition-transform duration-700">
                        <i className="fa-solid fa-coins text-[180px]"></i>
                    </div>
                    <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 flex justify-between items-center">
                        오늘 예상 총 매출액
                        <span className="text-emerald-500"><i className="fa-solid fa-arrow-trend-up"></i></span>
                    </h3>
                    <div className="text-4xl font-black mb-6 text-bee-black tracking-tighter">
                        ₩{Math.round(revenueStats?.total || 0).toLocaleString()}
                    </div>

                    <div className="space-y-3 pt-6 border-t border-gray-100">
                        <div className="flex justify-between text-xs items-center">
                            <span className="text-gray-500 font-bold">온라인 결제 (카드/페이)</span>
                            <span className="font-black text-bee-black">
                                ₩{Math.round(revenueStats?.card || 0).toLocaleString()}
                            </span>
                        </div>
                        <div className="flex justify-between text-xs items-center">
                            <span className="text-gray-500 font-bold">오프라인 현금 (지점 수납)</span>
                            <span className="font-black text-bee-black">
                                ₩{Math.round(revenueStats?.cash || 0).toLocaleString()}
                            </span>
                        </div>
                        <div className="flex justify-between text-xs items-center pt-2">
                            <span className="text-red-400 font-bold">조정 및 환불 처리</span>
                            <span className="font-black text-red-500">
                                -₩0
                            </span>
                        </div>
                    </div>
                </div>

                {/* 주간 매출 추이 */}
                <div className="bg-white p-8 rounded-[40px] shadow-sm border border-gray-100">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest">Weekly Revenue Trend</h3>
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
                                        style={{ width: `${Math.min(100, (s.total / 1000000) * 100)}%` }}
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

                {/* 정산 안내 및 링크 */}
                <div className="bg-gray-900 p-8 rounded-[40px] shadow-2xl flex flex-col justify-between">
                    <div>
                        <div className="flex items-center gap-3 text-bee-yellow mb-4">
                            <i className="fa-solid fa-vault text-xl"></i>
                            <span className="text-sm font-black uppercase tracking-widest">Settlement Center</span>
                        </div>
                        <p className="text-xs font-bold text-gray-400 leading-relaxed mb-6">
                            보관 지점별 수수료 정산 및 일일 현금 마감 현황을 관리합니다. 정확한 금융 대조를 위해 매일 마감을 권장드려요. 💅
                        </p>
                    </div>
                    <button 
                        onClick={() => setActiveTab('DAILY_SETTLEMENT')}
                        className="w-full py-4 bg-bee-yellow text-bee-black font-black rounded-2xl text-xs hover:scale-[1.02] active:scale-95 transition-all shadow-xl shadow-bee-yellow/20"
                    >
                        정산/마감판 바로가기 →
                    </button>
                </div>
            </div>

            {/* F. 긴급 공지 또는 알림 영역 */}
            <div className="bg-orange-50/50 p-6 rounded-3xl border border-orange-100">
                <div className="flex items-center gap-3 text-orange-600 mb-2">
                    <i className="fa-solid fa-triangle-exclamation"></i>
                    <span className="text-xs font-black">운영 및 정산 특이사항</span>
                </div>
                <p className="text-[10px] leading-relaxed text-orange-800/70 font-bold">
                    지점별 현금 시재와 시스템 금액 불일치 건은 '정산판'에서 즉시 조정 가능합니다. 사장님, 꼼꼼하게 봐주세요! 💅
                </p>
            </div>
        </div>
    );
};

export default OverviewTab;
