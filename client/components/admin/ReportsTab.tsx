
import React, { useMemo } from 'react';
import { BookingState, BookingStatus, ServiceType } from '../../types';
import {
    LineChart,
    Line,
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
    Legend
} from 'recharts';

interface ReportsTabProps {
    bookings: BookingState[];
}

const COLORS = ['#FACC15', '#3B82F6', '#10B981', '#F87171'];

const ReportsTab: React.FC<ReportsTabProps> = ({ bookings }) => {
    const stats = useMemo(() => {
        const daily: Record<string, any> = {};
        const monthly: Record<string, any> = {};
        const yearly: Record<string, any> = {};
        const serviceDistribution = {
            storage: { name: '보관 서비스', value: 0 },
            delivery: { name: '배송 서비스', value: 0 }
        };

        // Aggregating all data first for lifetime and cumulative
        const sortedBookings = [...bookings]
            .filter(b => !b.isDeleted && b.status === BookingStatus.COMPLETED)
            .sort((a, b) => (a.pickupDate || '').localeCompare(b.pickupDate || ''));

        let cumulativeRevenue = 0;

        sortedBookings.forEach(b => {
            const dateStr = b.pickupDate || b.createdAt?.split('T')[0] || 'Unknown';
            if (dateStr === 'Unknown') return;

            const [y, m, d] = dateStr.split('-');
            const monthKey = `${y}-${m}`;
            const yearKey = y;

            const price = b.finalPrice || 0;
            cumulativeRevenue += price;

            if (!daily[dateStr]) {
                daily[dateStr] = {
                    date: dateStr,
                    displayDate: dateStr.slice(5),
                    revenue: 0,
                    count: 0,
                    cumulative: cumulativeRevenue,
                    success: { count: 0, sum: 0 }
                };
            } else {
                daily[dateStr].cumulative = cumulativeRevenue;
            }

            daily[dateStr].success.count++;
            daily[dateStr].success.sum += price;
            daily[dateStr].revenue += price;
            daily[dateStr].count++;

            if (!monthly[monthKey]) {
                monthly[monthKey] = { month: monthKey, success: { count: 0, sum: 0 }, sum: 0, cumulative: cumulativeRevenue };
            } else {
                monthly[monthKey].cumulative = cumulativeRevenue;
            }
            monthly[monthKey].success.count++;
            monthly[monthKey].success.sum += price;
            monthly[monthKey].sum += price;

            if (!yearly[yearKey]) {
                yearly[yearKey] = { year: yearKey, success: { count: 0, sum: 0 }, sum: 0, cumulative: cumulativeRevenue };
            } else {
                yearly[yearKey].cumulative = cumulativeRevenue;
            }
            yearly[yearKey].success.count++;
            yearly[yearKey].success.sum += price;
            yearly[yearKey].sum += price;

            if (b.serviceType === ServiceType.STORAGE) serviceDistribution.storage.value += price;
            else serviceDistribution.delivery.value += price;
        });

        const dailyList = Object.values(daily).sort((a: any, b: any) => a.date.localeCompare(b.date));
        const cumulativeDays = dailyList.slice(-30);
        const monthlyList = Object.values(monthly).sort((a: any, b: any) => a.month.localeCompare(b.month));
        const yearlyList = Object.values(yearly).sort((a: any, b: any) => a.year.localeCompare(b.year));

        const lifetimeRevenue = cumulativeRevenue;
        const lifetimeCount = sortedBookings.length;
        const currentMonth = new Date().toISOString().slice(0, 7);
        const currentMonthStats = monthly[currentMonth] || { sum: 0, success: { count: 0 } };

        return {
            daily: dailyList.slice(-14),
            cumulativeDays,
            monthly: monthlyList,
            yearly: yearlyList,
            serviceDistribution: Object.values(serviceDistribution),
            lifetimeRevenue,
            lifetimeCount,
            currentMonthRevenue: currentMonthStats.sum,
            currentMonthCount: currentMonthStats.success.count,
            monthlyAvgRevenue: monthlyList.length > 0 ? Math.floor(lifetimeRevenue / monthlyList.length) : 0
        };
    }, [bookings]);

    return (
        <div className="space-y-6 md:space-y-8 animate-fade-in-up">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 bg-white p-6 rounded-[32px] border border-gray-100 shadow-sm overflow-hidden group">
                <div className="space-y-1 relative z-10">
                    <h1 className="text-xl md:text-2xl font-black tracking-tight">실적 리포트 <span className="text-bee-yellow italic">Performance</span></h1>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">Strategic Insights & Growth Matrix 💹</p>
                </div>
                <div className="flex items-center gap-1.5 px-3 py-1 bg-bee-yellow/10 text-bee-yellow rounded-lg text-[9px] font-black uppercase italic">
                    <i className="fa-solid fa-sparkles"></i> AI 인텔리전스 분석 적용됨
                </div>
            </div>

            {/* Statistical Widgets */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                <div className="bg-white p-5 rounded-[28px] border border-gray-100 shadow-sm flex flex-col justify-between group hover:border-bee-yellow transition-all">
                    <div>
                        <p className="text-[9px] font-black text-gray-300 uppercase tracking-widest mb-1.5 line-clamp-1">누적 총 매출</p>
                        <h3 className="text-xl font-black italic text-bee-black">₩{(stats.lifetimeRevenue || 0).toLocaleString()}</h3>
                    </div>
                    <div className="mt-3">
                        <span className="px-2 py-0.5 bg-bee-yellow/10 rounded-md text-[8px] font-black text-bee-yellow tracking-tighter">총 {(stats.lifetimeCount || 0)}건의 판매 실적</span>
                    </div>
                </div>

                <div className="bg-white p-5 rounded-[28px] border border-gray-100 shadow-sm flex flex-col justify-between group hover:border-blue-400 transition-all">
                    <div>
                        <p className="text-[9px] font-black text-gray-300 uppercase tracking-widest mb-1.5 line-clamp-1">올해 총 매출 ({stats.yearly[stats.yearly.length - 1]?.year || '2024'}년)</p>
                        <h3 className="text-xl font-black italic text-blue-500">₩{(stats.yearly[stats.yearly.length - 1]?.sum || 0).toLocaleString()}</h3>
                    </div>
                    <p className="text-[8px] font-black text-gray-300 mt-2 uppercase tracking-tighter italic text-center">지속적인 성장세 유지 중</p>
                </div>

                <div className="bg-bee-black p-5 rounded-[28px] shadow-lg flex flex-col justify-between group/card hover:-translate-y-1 transition-all">
                    <div>
                        <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest mb-1.5">월평균 매출액</p>
                        <h3 className="text-xl font-black italic text-bee-yellow">₩{(stats.monthlyAvgRevenue || 0).toLocaleString()}</h3>
                    </div>
                    <div className="mt-3 flex items-center gap-2">
                        <div className="w-8 h-1 bg-gray-700 rounded-full overflow-hidden">
                            <div className="bg-bee-yellow h-full w-[85%]"></div>
                        </div>
                        <span className="text-[8px] font-black text-gray-500 italic">우수 실적 지표</span>
                    </div>
                </div>

                <div className="bg-white p-5 rounded-[28px] border border-gray-100 shadow-sm flex flex-col justify-between group hover:border-emerald-400 transition-all">
                    <div>
                        <p className="text-[9px] font-black text-gray-300 uppercase tracking-widest mb-1.5">이번 달 실적</p>
                        <h3 className="text-xl font-black italic text-emerald-500">₩{(stats.currentMonthRevenue || 0).toLocaleString()}</h3>
                    </div>
                    <div className="mt-3 pt-2 border-t border-gray-50">
                        <p className="text-[8px] font-black text-gray-300 uppercase tracking-tighter">처리량: {(stats.currentMonthCount || 0)} 건</p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Main Revenue Growth Chart */}
                <div className="bg-white p-6 md:p-8 rounded-[40px] border border-gray-100 shadow-sm space-y-6">
                    <div className="flex justify-between items-center">
                        <h3 className="text-lg font-black flex items-center gap-2"><i className="fa-solid fa-chart-line text-blue-500"></i> 매출 성장 곡선</h3>
                        <span className="text-[10px] font-black text-gray-300 uppercase">최근 30일 기준</span>
                    </div>
                    <div className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={stats.cumulativeDays}>
                                <defs>
                                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#FACC15" stopOpacity={0.1} />
                                        <stop offset="95%" stopColor="#FACC15" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F3F4F6" />
                                <XAxis dataKey="displayDate" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 900, fill: '#9CA3AF' }} />
                                <YAxis yAxisId="left" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 900, fill: '#9CA3AF' }} />
                                <YAxis yAxisId="right" orientation="right" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 900, fill: '#FACC15' }} />
                                <Tooltip
                                    contentStyle={{ borderRadius: '24px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)', padding: '16px' }}
                                    itemStyle={{ fontWeight: 900, fontSize: '12px' }}
                                />
                                <Area yAxisId="left" type="monotone" dataKey="revenue" stroke="#3B82F6" strokeWidth={3} fillOpacity={0} />
                                <Area yAxisId="right" type="monotone" dataKey="cumulative" stroke="#FACC15" strokeWidth={4} fill="url(#colorRevenue)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Service Type distribution */}
                <div className="bg-white p-6 md:p-8 rounded-[40px] border border-gray-100 shadow-sm space-y-6 text-center">
                    <h3 className="text-lg font-black flex items-center gap-2 justify-center"><i className="fa-solid fa-chart-pie text-emerald-500"></i> 서비스 타입별 비중</h3>
                    <div className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={stats.serviceDistribution}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={100}
                                    paddingAngle={5}
                                    dataKey="value"
                                    cornerRadius={10}
                                >
                                    {stats.serviceDistribution.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip />
                                <Legend verticalAlign="bottom" height={36} />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ReportsTab;
