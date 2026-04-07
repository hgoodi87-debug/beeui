
import React, { useMemo } from 'react';
import { BookingState, BookingStatus, LocationOption, ServiceType } from '../../types';
import { COUNTRY_NAMES } from '../../src/constants/countries';
import { motion, AnimatePresence } from 'framer-motion';
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
    locations?: LocationOption[];
    startDate: string;
    endDate: string;
    onStartDateChange: (date: string) => void;
    onEndDateChange: (date: string) => void;
}

const COLORS = ['#FACC15', '#3B82F6', '#10B981', '#F87171', '#A78BFA', '#FB923C', '#2DD4BF'];

const ReportsTab: React.FC<ReportsTabProps> = ({
    bookings,
    locations = [],
    startDate,
    endDate,
    onStartDateChange,
    onEndDateChange
}) => {
    const stats = useMemo(() => {
        const isReportableBooking = (booking: BookingState) => {
            if (booking.isDeleted) return false;
            if (booking.status === BookingStatus.CANCELLED) return false;
            if (booking.status === BookingStatus.REFUNDED) return false;
            return true;
        };

        const daily: Record<string, any> = {};
        const monthly: Record<string, any> = {};
        const yearly: Record<string, any> = {};
        const serviceDistribution = {
            storage: { name: 'Storage 📦', value: 0 },
            delivery: { name: 'Delivery 🚚', value: 0 }
        };
        const countryStats: Record<string, number> = {};
        const methodStats: Record<string, number> = {};

        // [스봉이] 선택된 기간이 있으면 필터링해서 분석해 드려야죠 💅
        const start = startDate ? new Date(startDate) : null;
        const end = endDate ? new Date(endDate) : null;
        if (end) end.setHours(23, 59, 59, 999);

        const validBookings = bookings.filter(b => {
            if (!isReportableBooking(b)) return false;
            if (!start || !end) return true;
            const d = new Date(b.pickupDate || b.createdAt || '');
            return d >= start && d <= end;
        });

        const sortedBookings = [...validBookings].sort((a, b) => (a.pickupDate || '').localeCompare(b.pickupDate || ''));

        let cumulativeRevenue = 0;
        let cumulativeCount = 0;

        sortedBookings.forEach(b => {
            const dateStr = b.pickupDate || b.createdAt?.split('T')[0] || 'Unknown';
            if (dateStr === 'Unknown') return;

            const [y, m] = dateStr.split('-');
            const monthKey = `${y}-${m}`;
            const yearKey = y;

            const price = b.settlementHardCopyAmount ?? b.finalPrice ?? 0;
            cumulativeRevenue += price;
            cumulativeCount += 1;

            // Daily Aggregation
            if (!daily[dateStr]) {
                daily[dateStr] = { date: dateStr, displayDate: dateStr.slice(5), revenue: 0, count: 0, cumulative: cumulativeRevenue };
            }
            daily[dateStr].revenue += price;
            daily[dateStr].count += 1;

            // Monthly Aggregation
            if (!monthly[monthKey]) {
                monthly[monthKey] = { month: monthKey, revenue: 0, count: 0, cumulative: cumulativeRevenue };
            }
            monthly[monthKey].revenue += price;
            monthly[monthKey].count += 1;

            // Yearly Aggregation
            if (!yearly[yearKey]) {
                yearly[yearKey] = { year: yearKey, revenue: 0, count: 0 };
            }
            yearly[yearKey].revenue += price;
            yearly[yearKey].count += 1;

            // Distributions
            if (b.serviceType === ServiceType.STORAGE) serviceDistribution.storage.value += price;
            else serviceDistribution.delivery.value += price;

            const cCode = b.country || 'OTHER';
            countryStats[cCode] = (countryStats[cCode] || 0) + 1;

            const method = b.paymentMethod || 'other';
            methodStats[method] = (methodStats[method] || 0) + 1;
        });

        const monthlyList = Object.values(monthly).sort((a: any, b: any) => a.month.localeCompare(b.month));
        
        // [스봉이] 성장률 계산도 필터링된 범위 안에서 똑똑하게! 💅
        const currentMonth = new Date().toISOString().slice(0, 7);
        const prevMonthDate = new Date();
        prevMonthDate.setMonth(prevMonthDate.getMonth() - 1);
        const prevMonth = prevMonthDate.toISOString().slice(0, 7);

        const currentMonthData = monthly[currentMonth] || { revenue: 0, count: 0 };
        const prevMonthData = monthly[prevMonth] || { revenue: 0, count: 0 };

        // Calculate Growth Rates
        const revenueGrowth = prevMonthData.revenue > 0 
            ? ((currentMonthData.revenue - prevMonthData.revenue) / prevMonthData.revenue) * 100 
            : 0;
        
        const countGrowth = prevMonthData.count > 0 
            ? ((currentMonthData.count - prevMonthData.count) / prevMonthData.count) * 100 
            : 0;

        const totalCountryCount = Object.values(countryStats).reduce((a, b) => a + b, 0);

        // 지점별 커미션 집계
        const branchCommissionMap: Record<string, { name: string; total: number; delivery: number; storage: number; deliveryCount: number; storageCount: number; commDeliveryRate: number; commStorageRate: number }> = {};
        validBookings.filter(b => b.status === BookingStatus.COMPLETED).forEach(b => {
            const bName = b.branchName || '본사/직접';
            if (!branchCommissionMap[bName]) {
                const loc = locations.find(l => l.id === b.branchId || l.name === bName || l.shortCode === b.branchCode);
                branchCommissionMap[bName] = {
                    name: bName,
                    total: 0, delivery: 0, storage: 0,
                    deliveryCount: 0, storageCount: 0,
                    commDeliveryRate: loc?.commissionRates?.delivery ?? 0,
                    commStorageRate: loc?.commissionRates?.storage ?? 0,
                };
            }
            const entry = branchCommissionMap[bName];
            const price = b.settlementHardCopyAmount ?? b.finalPrice ?? 0;
            const isDelivery = b.serviceType === ServiceType.DELIVERY;
            const commRate = isDelivery ? entry.commDeliveryRate : entry.commStorageRate;
            const commAmt = Math.floor(price * (commRate / 100));
            entry.total += commAmt;
            if (isDelivery) { entry.delivery += commAmt; entry.deliveryCount += 1; }
            else { entry.storage += commAmt; entry.storageCount += 1; }
        });
        const branchCommission = Object.values(branchCommissionMap).sort((a, b) => b.total - a.total);

        return {
            daily: Object.values(daily).sort((a: any, b: any) => a.date.localeCompare(b.date)).slice(-31), // 넉넉하게 31일치 💅
            monthly: monthlyList,
            yearly: Object.values(yearly).sort((a: any, b: any) => a.year.localeCompare(b.year)),
            serviceDistribution: Object.values(serviceDistribution),
            countryDistribution: Object.entries(countryStats)
                .map(([code, value]) => ({
                    name: COUNTRY_NAMES[code] || code,
                    value,
                    percent: totalCountryCount > 0 ? Math.round((value / totalCountryCount) * 100) : 0
                }))
                .sort((a, b) => b.value - a.value),
            paymentDistribution: Object.entries(methodStats).map(([name, value]) => ({ name: name.toUpperCase(), value })),
            lifetimeRevenue: cumulativeRevenue,
            lifetimeCount: cumulativeCount,
            currentMonthRevenue: currentMonthData.revenue,
            currentMonthCount: currentMonthData.count,
            revenueGrowth,
            countGrowth,
            avgOrderValue: cumulativeCount > 0 ? Math.floor(cumulativeRevenue / cumulativeCount) : 0,
            activeDays: Object.keys(daily).length,
            totalCountryCount,
            branchCommission,
        };

    }, [bookings, locations, startDate, endDate]);

    return (
        <div className="space-y-10 md:space-y-12 animate-fade-in-up pb-10">
            {/* [스봉이] 분석 리포트 헤더 - 본부장님 센스에 맞춰서 우아하게 꾸며봤어요 💅 */}
            <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 bg-white/40 backdrop-blur-md p-8 rounded-[40px] border border-white/50 shadow-sm relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-8 opacity-5 text-bee-black group-hover:scale-110 transition-transform duration-1000">
                    <i className="fa-solid fa-chart-mixed text-[120px]"></i>
                </div>
                
                <div className="space-y-3 relative z-10">
                    <div className="flex items-center gap-2">
                        <span className="px-3 py-1 bg-bee-yellow text-bee-black text-[9px] font-black rounded-full tracking-widest uppercase shadow-lg shadow-bee-yellow/20">Business Intelligence</span>
                        <div className="flex gap-1">
                            <div className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse"></div>
                            <div className="w-1 h-1 rounded-full bg-emerald-500/50"></div>
                        </div>
                    </div>
                    <h1 className="text-3xl md:text-5xl font-black tracking-tighter text-white">
                        Beeliber <span className="text-bee-yellow font-serif italic">Reports</span>
                    </h1>
                    <p className="text-sm font-bold text-gray-400">데이터로 파악하는 비리버의 어제와 오늘, 그리고 내일 🚀</p>
                </div>
                <div className="flex items-center gap-6 relative z-10">
                    <div className="text-right">
                        <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">Lifetime Impact</p>
                        <p className="text-2xl font-black text-bee-yellow font-mono">₩{stats.lifetimeRevenue.toLocaleString()}</p>
                    </div>
                    <div className="bg-white/5 p-4 rounded-3xl border border-white/10 backdrop-blur-md">
                        <i className="fa-solid fa-wand-magic-sparkles text-bee-yellow text-xl"></i>
                    </div>
                </div>
            </div>

            {/* [스봉이] 사장님 피드백대로 날짜 필터 깔끔하게 넣어드렸어요 💅 */}
            <div className="flex flex-wrap items-center gap-4 px-4 py-6 bg-white rounded-[32px] border border-gray-100 shadow-sm">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-bee-black flex items-center justify-center text-bee-yellow shadow-lg">
                        <i className="fa-solid fa-calendar-range text-xs"></i>
                    </div>
                    <span className="text-xs font-black text-gray-500 uppercase tracking-widest">조회 기간 설정</span>
                </div>
                <div className="flex items-center gap-2">
                    <input 
                        type="date" 
                        value={startDate}
                        onChange={(e) => onStartDateChange(e.target.value)}
                        className="px-4 py-2 bg-gray-50 border border-gray-100 rounded-xl text-xs font-bold text-bee-black focus:border-bee-yellow outline-none transition-all cursor-pointer"
                    />
                    <span className="text-gray-300 font-black">~</span>
                    <input 
                        type="date" 
                        value={endDate}
                        onChange={(e) => onEndDateChange(e.target.value)}
                        className="px-4 py-2 bg-gray-50 border border-gray-100 rounded-xl text-xs font-bold text-bee-black focus:border-bee-yellow outline-none transition-all cursor-pointer"
                    />
                </div>
                <div className="ml-auto hidden md:block">
                    <span className="text-[10px] font-bold text-gray-300 italic">※ 선택하신 기간의 데이터가 실시간으로 분석됩니다. 💅</span>
                </div>
            </div>
            <section className="space-y-6">
                <div className="flex items-center gap-3 px-2">
                    <div className="w-8 h-8 rounded-xl bg-blue-500 flex items-center justify-center text-white shadow-lg shadow-blue-500/20">
                        <i className="fa-solid fa-bolt text-xs"></i>
                    </div>
                    <h2 className="text-xl font-black text-bee-black uppercase tracking-tight">Executive Summary</h2>
                </div>

                <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                    <div className="bg-white p-6 rounded-[32px] border border-gray-100 shadow-sm hover:translate-y-[-4px] transition-all group relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-6 opacity-[0.03] group-hover:scale-125 transition-transform duration-700">
                             <i className="fa-solid fa-calendar-check text-5xl"></i>
                        </div>
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">당월 실적 (MTD)</p>
                        <h3 className="text-2xl font-black text-bee-black italic">₩{stats.currentMonthRevenue.toLocaleString()}</h3>
                        <div className={`mt-3 flex items-center gap-1.5 text-[10px] font-bold ${stats.revenueGrowth >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                            <i className={`fa-solid ${stats.revenueGrowth >= 0 ? 'fa-arrow-trend-up' : 'fa-arrow-trend-down'}`}></i>
                            {Math.abs(stats.revenueGrowth).toFixed(1)}% <span className="text-gray-300">vs prev month</span>
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-[32px] border border-gray-100 shadow-sm hover:translate-y-[-4px] transition-all group relative overflow-hidden">
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">평균 주문가 (AOV)</p>
                        <h3 className="text-2xl font-black text-blue-500 italic">₩{stats.avgOrderValue.toLocaleString()}</h3>
                        <p className="mt-3 text-[10px] font-bold text-gray-300">Total Bookings: {stats.lifetimeCount.toLocaleString()}건</p>
                    </div>
                    <div className="bg-white p-6 rounded-[32px] border border-gray-100 shadow-sm hover:translate-y-[-4px] transition-all group relative overflow-hidden">
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">성장률 (Orders)</p>
                        <h3 className={`text-2xl font-black italic ${stats.countGrowth >= 0 ? 'text-emerald-500' : 'text-orange-500'}`}>
                            {stats.countGrowth >= 0 ? '+' : ''}{stats.countGrowth.toFixed(1)}%
                        </h3>
                        <div className="mt-3 w-full h-1 bg-gray-50 rounded-full overflow-hidden">
                            <div className="bg-emerald-500 h-full w-[70%]" style={{ width: `${Math.min(100, Math.max(0, 50 + stats.countGrowth))}%` }}></div>
                        </div>
                    </div>
                </div>
            </section>

            {/* 📊 Financial Analysis Section */}
            <section className="space-y-6">
                <div className="flex items-center justify-between px-2">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl bg-orange-500 flex items-center justify-center text-white shadow-lg shadow-orange-500/20">
                            <i className="fa-solid fa-coins text-xs"></i>
                        </div>
                        <h2 className="text-xl font-black text-bee-black uppercase tracking-tight">Financial Matrix</h2>
                    </div>
                    <div className="flex gap-2">
                        <span className="px-3 py-1 bg-gray-50 text-[9px] font-black text-gray-400 rounded-lg border border-gray-100 uppercase italic">Revenue Growth</span>
                        <span className="px-3 py-1 bg-gray-50 text-[9px] font-black text-gray-400 rounded-lg border border-gray-100 uppercase italic">Profit Margin</span>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="bg-white p-8 rounded-[40px] border border-gray-100 shadow-sm space-y-6">
                        <div className="flex justify-between items-center">
                            <h4 className="text-sm font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                                <span className="w-1.5 h-3 bg-bee-yellow rounded-full"></span> 매출 트렌드 분석
                            </h4>
                            <div className="flex items-center gap-4">
                                <div className="flex items-center gap-1.5">
                                    <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                                    <span className="text-[9px] font-black text-gray-300">Daily Revenue</span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <div className="w-2 h-2 rounded-full bg-bee-yellow"></div>
                                    <span className="text-[9px] font-black text-gray-300">Cumulative</span>
                                </div>
                            </div>
                        </div>
                        <div className="h-[350px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={stats.daily}>
                                    <defs>
                                        <linearGradient id="colorRevue" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.1} />
                                            <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                                        </linearGradient>
                                        <linearGradient id="colorCumul" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#FACC15" stopOpacity={0.1} />
                                            <stop offset="95%" stopColor="#FACC15" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#FAFAFA" />
                                    <XAxis dataKey="displayDate" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 900, fill: '#D1D5DB' }} />
                                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 900, fill: '#D1D5DB' }} />
                                    <Tooltip
                                        contentStyle={{ borderRadius: '24px', border: 'none', boxShadow: '0 25px 50px -12px rgb(0 0 0 / 0.1)', padding: '20px' }}
                                        itemStyle={{ fontWeight: 900, fontSize: '13px' }}
                                    />
                                    <Area type="monotone" dataKey="revenue" stroke="#3B82F6" strokeWidth={4} fill="url(#colorRevue)" />
                                    <Area type="monotone" dataKey="cumulative" stroke="#FACC15" strokeWidth={4} fill="url(#colorCumul)" opacity={0.3} />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    <div className="bg-white p-8 rounded-[40px] border border-gray-100 shadow-sm space-y-8 flex flex-col justify-center">
                        <div className="space-y-1 text-center">
                            <h4 className="text-sm font-black text-bee-black">서비스 포인터 점유율</h4>
                            <p className="text-[10px] font-bold text-gray-300 uppercase italic tracking-widest">Revenue distribution by Category</p>
                        </div>
                        <div className="h-[280px] w-full relative">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={stats.serviceDistribution}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={80}
                                        outerRadius={110}
                                        paddingAngle={10}
                                        dataKey="value"
                                        cornerRadius={15}
                                    >
                                        {stats.serviceDistribution.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={index === 0 ? '#FACC15' : '#3B82F6'} />
                                        ))}
                                    </Pie>
                                    <Tooltip formatter={(value: any) => `₩${value.toLocaleString()}`} contentStyle={{ borderRadius: '20px', border: 'none' }} />
                                </PieChart>
                            </ResponsiveContainer>
                            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center">
                                <span className="text-[10px] font-black text-gray-300 uppercase">Top Service</span>
                                <span className="text-lg font-black text-bee-black">{stats.serviceDistribution[0]?.name.split(' ')[0]}</span>
                            </div>
                        </div>
                        <div className="flex justify-center gap-10">
                            {stats.serviceDistribution.map((item, idx) => (
                                <div key={item.name} className="flex flex-col items-center gap-1">
                                    <div className="flex items-center gap-2">
                                        <div className="w-2 h-2 rounded-full" style={{ background: idx === 0 ? '#FACC15' : '#3B82F6' }}></div>
                                        <span className="text-xs font-black text-bee-black">{item.name}</span>
                                    </div>
                                    <span className="text-[10px] font-bold text-gray-400 font-mono">₩{item.value.toLocaleString()}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            {/* 🌏 Market Intelligence Section */}
            <section className="space-y-6">
                <div className="flex items-center gap-3 px-2">
                    <div className="w-8 h-8 rounded-xl bg-purple-500 flex items-center justify-center text-white shadow-lg shadow-purple-500/20">
                        <i className="fa-solid fa-earth-asia text-xs"></i>
                    </div>
                    <h2 className="text-xl font-black text-bee-black uppercase tracking-tight">Market Intelligence</h2>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2 bg-white p-8 rounded-[40px] border border-gray-100 shadow-sm space-y-8">
                        <div className="flex justify-between items-center">
                            <h4 className="text-sm font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                                <span className="w-1.5 h-3 bg-purple-400 rounded-full"></span> 글로벌 지배력 (Global Reach)
                            </h4>
                            <span className="text-[9px] font-black text-gray-300 uppercase italic">Based on {stats.totalCountryCount} Registrations</span>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
                            <div className="h-[250px] relative">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={stats.countryDistribution}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={75}
                                            outerRadius={105}
                                            paddingAngle={8}
                                            dataKey="value"
                                            cornerRadius={12}
                                        >
                                            {stats.countryDistribution.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={COLORS[(index + 3) % COLORS.length]} />
                                            ))}
                                        </Pie>
                                    </PieChart>
                                </ResponsiveContainer>
                                <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-center">
                                    <span className="text-[9px] font-black text-gray-300 uppercase">Primary</span>
                                    <p className="text-base font-black text-bee-black">{stats.countryDistribution[0]?.name.split(' ')[0]}</p>
                                </div>
                            </div>

                            <div className="space-y-4">
                                {stats.countryDistribution.slice(0, 5).map((item, idx) => (
                                    <div key={item.name} className="space-y-1.5 group cursor-default">
                                        <div className="flex justify-between items-end">
                                            <span className="text-xs font-black text-bee-black flex items-center gap-2 group-hover:translate-x-1 transition-transform">
                                                <div className="w-2 h-2 rounded-full" style={{ background: COLORS[(idx + 3) % COLORS.length] }}></div>
                                                {item.name}
                                            </span>
                                            <div className="text-right">
                                                <span className="text-[10px] font-black text-gray-700">{item.percent}%</span>
                                            </div>
                                        </div>
                                        <div className="w-full h-1 bg-gray-50 rounded-full overflow-hidden">
                                            <motion.div 
                                                initial={{ width: 0 }}
                                                animate={{ width: `${item.percent}%` }}
                                                className="h-full rounded-full"
                                                style={{ background: COLORS[(idx + 3) % COLORS.length] }}
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="bg-white p-8 rounded-[40px] border border-gray-100 shadow-sm flex flex-col justify-between group">
                        <div className="space-y-1">
                            <h4 className="text-sm font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                                <span className="w-1.5 h-3 bg-emerald-400 rounded-full"></span> 결제 수단 선호도
                            </h4>
                            <p className="text-[10px] font-bold text-gray-300 italic">Payment Method Trends</p>
                        </div>
                        
                        <div className="space-y-4 py-8">
                            {stats.paymentDistribution.sort((a, b) => b.value - a.value).map((p, idx) => (
                                <div key={p.name} className="flex items-center justify-between p-4 bg-gray-50/50 rounded-2xl group-hover:bg-gray-50 transition-colors">
                                    <div className="flex items-center gap-3">
                                        <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs font-black ${
                                            idx === 0 ? 'bg-bee-black text-bee-yellow' : 'bg-white text-gray-400 border border-gray-100'
                                        }`}>
                                            {p.name.slice(0, 2)}
                                        </div>
                                        <span className="text-xs font-black text-bee-black uppercase tracking-tight">{p.name}</span>
                                    </div>
                                    <span className="text-sm font-black text-bee-black font-mono">{p.value}건</span>
                                </div>
                            ))}
                        </div>

                        <button
                            type="button"
                            onClick={() => {
                                const csvRows = ['결제수단,건수'];
                                stats.paymentDistribution.sort((a: any, b: any) => b.value - a.value).forEach((p: any) => {
                                    csvRows.push(`${p.name},${p.value}`);
                                });
                                const blob = new Blob(['\uFEFF' + csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
                                const url = URL.createObjectURL(blob);
                                const a = document.createElement('a');
                                a.href = url;
                                a.download = `channel-report-${startDate}-${endDate}.csv`;
                                a.click();
                                URL.revokeObjectURL(url);
                            }}
                            className="w-full py-4 bg-bee-black text-[10px] font-black text-white uppercase tracking-widest rounded-2xl border border-bee-black hover:bg-bee-yellow hover:text-bee-black hover:border-bee-yellow transition-all shadow-lg"
                        >
                            <i className="fa-solid fa-download mr-2"></i> Channel Report CSV
                        </button>
                    </div>
                </div>
            </section>

            {/* 🏪 Branch Commission Section */}
            {stats.branchCommission.length > 0 && (
                <section className="space-y-6">
                    <div className="flex items-center gap-3 px-2">
                        <div className="w-8 h-8 rounded-xl bg-emerald-500 flex items-center justify-center text-white shadow-lg shadow-emerald-500/20">
                            <i className="fa-solid fa-store text-xs"></i>
                        </div>
                        <h2 className="text-xl font-black text-bee-black uppercase tracking-tight">Branch Commission</h2>
                        <span className="px-3 py-1 bg-gray-50 text-[9px] font-black text-gray-400 rounded-lg border border-gray-100 uppercase italic">완료 예약 기준</span>
                    </div>

                    <div className="bg-white rounded-[40px] border border-gray-100 shadow-sm overflow-hidden">
                        <table className="w-full text-left">
                            <thead className="bg-gray-50/50 text-[10px] font-black uppercase text-gray-400 tracking-widest border-b border-gray-50">
                                <tr>
                                    <th className="px-8 py-5">지점명</th>
                                    <th className="px-8 py-5 text-center">배송 요율</th>
                                    <th className="px-8 py-5 text-center">보관 요율</th>
                                    <th className="px-8 py-5 text-right">배송 정산</th>
                                    <th className="px-8 py-5 text-right">보관 정산</th>
                                    <th className="px-8 py-5 text-right font-black text-bee-black">총 커미션</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {stats.branchCommission.map((b, idx) => (
                                    <tr key={b.name} className="hover:bg-gray-50/50 transition-colors group">
                                        <td className="px-8 py-5">
                                            <div className="flex items-center gap-3">
                                                <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-[10px] font-black ${idx === 0 ? 'bg-bee-black text-bee-yellow' : 'bg-gray-100 text-gray-500'}`}>
                                                    {idx + 1}
                                                </div>
                                                <div>
                                                    <div className="font-black text-bee-black text-sm">{b.name}</div>
                                                    <div className="text-[9px] font-bold text-gray-400">{b.deliveryCount + b.storageCount}건 완료</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-8 py-5 text-center">
                                            <span className="px-2.5 py-1 bg-blue-50 text-blue-600 rounded-lg text-[10px] font-black">
                                                {b.commDeliveryRate}%
                                                <span className="text-blue-300 ml-1">({b.deliveryCount}건)</span>
                                            </span>
                                        </td>
                                        <td className="px-8 py-5 text-center">
                                            <span className="px-2.5 py-1 bg-green-50 text-green-600 rounded-lg text-[10px] font-black">
                                                {b.commStorageRate}%
                                                <span className="text-green-300 ml-1">({b.storageCount}건)</span>
                                            </span>
                                        </td>
                                        <td className="px-8 py-5 text-right font-bold text-blue-500 text-sm tabular-nums">₩{b.delivery.toLocaleString()}</td>
                                        <td className="px-8 py-5 text-right font-bold text-green-500 text-sm tabular-nums">₩{b.storage.toLocaleString()}</td>
                                        <td className="px-8 py-5 text-right">
                                            <div className="font-black text-bee-black text-base tabular-nums">₩{b.total.toLocaleString()}</div>
                                        </td>
                                    </tr>
                                ))}
                                <tr className="bg-gray-50/80 border-t-2 border-gray-200">
                                    <td colSpan={5} className="px-8 py-4 font-black text-gray-600 text-xs uppercase tracking-widest">합계</td>
                                    <td className="px-8 py-4 text-right font-black text-bee-black text-lg tabular-nums">
                                        ₩{stats.branchCommission.reduce((s, b) => s + b.total, 0).toLocaleString()}
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </section>
            )}

            {/* 🗓️ Detailed Historical Timeline Section */}
            <section className="space-y-6">
                 <div className="flex items-center gap-3 px-2">
                    <div className="w-8 h-8 rounded-xl bg-gray-800 flex items-center justify-center text-white shadow-lg">
                        <i className="fa-solid fa-list-check text-xs"></i>
                    </div>
                    <h2 className="text-xl font-black text-bee-black uppercase tracking-tight">Historical Data Timeline</h2>
                </div>

                <div className="bg-white rounded-[40px] border border-gray-100 shadow-sm overflow-hidden">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50/50 text-[10px] font-black uppercase text-gray-400 tracking-widest border-b border-gray-50">
                            <tr>
                                <th className="px-10 py-6">정산월 <span className="text-[8px] font-serif italic normal-case ml-1 tracking-normal">Month</span></th>
                                <th className="px-10 py-6 text-center">건수 <span className="text-[8px] font-serif italic normal-case ml-1 tracking-normal">Orders</span></th>
                                <th className="px-10 py-6 text-right">월간 매출 <span className="text-[8px] font-serif italic normal-case ml-1 tracking-normal">Monthly</span></th>
                                <th className="px-10 py-6 text-right">누적 기여도 <span className="text-[8px] font-serif italic normal-case ml-1 tracking-normal">Cumulative</span></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {[...(stats.monthly || [])].reverse().map(s => (
                                <tr key={s.month} className="hover:bg-gray-50/50 transition-colors group">
                                    <td className="px-10 py-6 font-black text-bee-black text-sm">{s.month}</td>
                                    <td className="px-10 py-6 text-center">
                                        <span className="px-3 py-1 bg-gray-100 rounded-full text-[10px] font-black text-gray-400 group-hover:bg-bee-black group-hover:text-bee-yellow transition-all">
                                            {s.count.toLocaleString()} 건
                                        </span>
                                    </td>
                                    <td className="px-10 py-6 text-right font-black text-bee-black text-sm tabular-nums">
                                        ₩{s.revenue.toLocaleString()}
                                    </td>
                                    <td className="px-10 py-6 text-right">
                                        <div className="flex flex-col items-end">
                                            <span className="text-xs font-black text-blue-500 font-mono tracking-tighter italic">
                                                ₩{s.cumulative.toLocaleString()}
                                            </span>
                                            <div className="w-20 h-0.5 bg-gray-100 mt-1.5 overflow-hidden">
                                                <div className="h-full bg-blue-500/30" style={{ width: `${Math.min(100, (s.cumulative / stats.lifetimeRevenue) * 100)}%` }}></div>
                                            </div>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </section>
        </div>
    );
};

export default ReportsTab;
