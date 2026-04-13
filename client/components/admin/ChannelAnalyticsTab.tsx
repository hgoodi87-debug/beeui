/**
 * ChannelAnalyticsTab — 채널 어트리뷰션 상세 분석
 * UTM 데이터 + Referrer 추론 기반 채널별 예약·매출·전환 리포트
 */

import React, { useMemo, useState } from 'react';
import { BookingState, BookingStatus, ServiceType } from '../../types';
import {
    PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend,
    LineChart, Line, AreaChart, Area,
} from 'recharts';
import { normalizeChannel } from '../../src/utils/gads';

interface Props {
    bookings: BookingState[];
    startDate: string;
    endDate: string;
    onStartDateChange: (d: string) => void;
    onEndDateChange: (d: string) => void;
}

const CHANNEL_COLORS: Record<string, string> = {
    '샤오홍슈': '#FF2442',
    'Instagram': '#E1306C',
    'Threads': '#000000',
    'X': '#1DA1F2',
    'Facebook': '#1877F2',
    'Google 검색': '#4285F4',
    'Naver': '#03C75A',
    'paid_search': '#F59E0B',
    'paid_social': '#8B5CF6',
    'OTA': '#F97316',
    'email': '#6B7280',
    'offline': '#92400E',
    'direct': '#9CA3AF',
    'Direct': '#9CA3AF',
    '기타 유입': '#D1D5DB',
};

const PALETTE = ['#FACC15', '#3B82F6', '#FF2442', '#10B981', '#8B5CF6', '#F97316', '#EC4899', '#14B8A6', '#6366F1', '#84CC16'];

function getColor(channel: string, idx: number): string {
    return CHANNEL_COLORS[channel] ?? PALETTE[idx % PALETTE.length];
}

const CHANNEL_ICONS: Record<string, string> = {
    '샤오홍슈': 'fa-brands fa-xing',
    'Instagram': 'fa-brands fa-instagram',
    'Threads': 'fa-brands fa-threads',
    'X': 'fa-brands fa-x-twitter',
    'Google 검색': 'fa-brands fa-google',
    'Naver': 'fa-magnifying-glass',
    'paid_search': 'fa-solid fa-bullhorn',
    'paid_social': 'fa-solid fa-rectangle-ad',
    'OTA': 'fa-solid fa-plane',
    'direct': 'fa-solid fa-link-slash',
    'Direct': 'fa-solid fa-link-slash',
    'email': 'fa-solid fa-envelope',
    'offline': 'fa-solid fa-qrcode',
};

const fmt = (n: number) => `₩${n.toLocaleString()}`;

export default function ChannelAnalyticsTab({ bookings, startDate, endDate, onStartDateChange, onEndDateChange }: Props) {
    const [activeChannel, setActiveChannel] = useState<string | null>(null);
    const [sortKey, setSortKey] = useState<'count' | 'revenue' | 'aov'>('count');

    const validBookings = useMemo(() => {
        return bookings.filter(b => {
            if (!b.createdAt) return false;
            const d = b.createdAt.split('T')[0];
            return d >= startDate && d <= endDate && b.bookingStatus !== BookingStatus.CANCELLED;
        });
    }, [bookings, startDate, endDate]);

    const stats = useMemo(() => {
        // 채널 그룹별 집계
        const channelMap: Record<string, { channel: string; count: number; revenue: number; campaigns: Record<string, number> }> = {};
        let trackedCount = 0;

        validBookings.forEach(b => {
            const ch = normalizeChannel(b.utmSource, b.utmMedium);
            if (b.utmSource) trackedCount++;
            if (!channelMap[ch]) {
                channelMap[ch] = { channel: ch, count: 0, revenue: 0, campaigns: {} };
            }
            channelMap[ch].count++;
            channelMap[ch].revenue += b.finalPrice ?? 0;
            if (b.utmCampaign) {
                channelMap[ch].campaigns[b.utmCampaign] = (channelMap[ch].campaigns[b.utmCampaign] ?? 0) + 1;
            }
        });

        const channelList = Object.values(channelMap)
            .map(c => ({ ...c, aov: c.count > 0 ? Math.floor(c.revenue / c.count) : 0 }))
            .sort((a, b) => b[sortKey] - a[sortKey]);

        // 커버리지
        const coverageRate = validBookings.length > 0
            ? Math.round((trackedCount / validBookings.length) * 100)
            : 0;

        // 캠페인 상위 목록
        const campaignMap: Record<string, { campaign: string; channel: string; medium: string; count: number; revenue: number }> = {};
        validBookings.forEach(b => {
            if (!b.utmCampaign) return;
            const key = `${b.utmSource}__${b.utmCampaign}`;
            if (!campaignMap[key]) {
                campaignMap[key] = {
                    campaign: b.utmCampaign,
                    channel: normalizeChannel(b.utmSource, b.utmMedium),
                    medium: b.utmMedium || '-',
                    count: 0,
                    revenue: 0,
                };
            }
            campaignMap[key].count++;
            campaignMap[key].revenue += b.finalPrice ?? 0;
        });
        const campaigns = Object.values(campaignMap).sort((a, b) => b.count - a.count).slice(0, 20);

        // 일별 채널 트렌드 (최근 30일, 상위 5채널)
        const top5 = channelList.slice(0, 5).map(c => c.channel);
        const trendMap: Record<string, Record<string, number>> = {};
        validBookings.forEach(b => {
            const d = b.createdAt?.split('T')[0];
            if (!d) return;
            const ch = normalizeChannel(b.utmSource, b.utmMedium);
            if (!top5.includes(ch)) return;
            if (!trendMap[d]) trendMap[d] = {};
            trendMap[d][ch] = (trendMap[d][ch] ?? 0) + 1;
        });
        const trend = Object.entries(trendMap)
            .sort(([a], [b]) => a.localeCompare(b))
            .slice(-30)
            .map(([date, vals]) => ({ date: date.slice(5), ...vals }));

        // 선택 채널 예약 목록
        const filteredBookings = activeChannel
            ? validBookings.filter(b => normalizeChannel(b.utmSource, b.utmMedium) === activeChannel)
            : [];

        return { channelList, coverageRate, trackedCount, campaigns, trend, top5, filteredBookings };
    }, [validBookings, sortKey, activeChannel]);

    return (
        <div className="space-y-10 animate-fade-in-up pb-16">

            {/* 헤더 */}
            <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 bg-white/40 backdrop-blur-md p-8 rounded-[40px] border border-white/50 shadow-sm relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-8 opacity-5 text-bee-black group-hover:scale-110 transition-transform duration-1000">
                    <i className="fa-solid fa-route text-[120px]"></i>
                </div>
                <div className="space-y-3 relative z-10">
                    <span className="px-3 py-1 bg-bee-yellow text-bee-black text-[9px] font-black rounded-full tracking-widest uppercase shadow-lg shadow-bee-yellow/20">
                        Channel Attribution
                    </span>
                    <h1 className="text-3xl md:text-5xl font-black tracking-tighter text-white">
                        채널 <span className="text-bee-yellow font-serif italic">Analytics</span>
                    </h1>
                    <p className="text-sm font-bold text-gray-400">어디서 왔는지 알아야 더 잘 모실 수 있어요</p>
                </div>
                <div className="flex items-center gap-6 relative z-10">
                    <div className="text-right">
                        <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">UTM 커버리지</p>
                        <p className="text-3xl font-black text-bee-yellow font-mono">{stats.coverageRate}%</p>
                        <p className="text-xs text-gray-400 mt-1">{stats.trackedCount} / {validBookings.length} 예약</p>
                    </div>
                    <div className="bg-white/5 p-4 rounded-3xl border border-white/10 backdrop-blur-md">
                        <i className="fa-solid fa-satellite-dish text-bee-yellow text-xl"></i>
                    </div>
                </div>
            </div>

            {/* 날짜 필터 */}
            <div className="flex flex-wrap items-center gap-4 px-4 py-5 bg-white rounded-[28px] border border-gray-100 shadow-sm">
                <i className="fa-solid fa-calendar-range text-bee-yellow ml-2"></i>
                <span className="text-xs font-black text-gray-500 uppercase tracking-widest">기간</span>
                <input type="date" value={startDate} onChange={e => onStartDateChange(e.target.value)}
                    className="px-4 py-2 rounded-xl border border-gray-200 text-sm font-bold focus:ring-2 focus:ring-bee-yellow outline-none" />
                <span className="text-gray-300 font-black">—</span>
                <input type="date" value={endDate} onChange={e => onEndDateChange(e.target.value)}
                    className="px-4 py-2 rounded-xl border border-gray-200 text-sm font-bold focus:ring-2 focus:ring-bee-yellow outline-none" />
            </div>

            {validBookings.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-24 text-center bg-white rounded-[40px] border border-gray-100">
                    <i className="fa-solid fa-chart-network text-5xl text-gray-200 mb-6"></i>
                    <p className="font-black text-gray-400 text-lg">해당 기간 예약 데이터가 없습니다</p>
                </div>
            ) : (
                <>
                    {/* 채널 요약 카드 + 파이 차트 */}
                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">

                        {/* 파이 차트 */}
                        <div className="bg-white rounded-[32px] p-8 border border-gray-100 shadow-sm">
                            <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-6">채널별 예약 비율</p>
                            {stats.channelList.length === 0 ? (
                                <div className="flex flex-col items-center py-12 text-gray-300">
                                    <i className="fa-solid fa-chart-pie text-4xl mb-3"></i>
                                    <p className="text-sm font-bold">UTM 데이터 없음</p>
                                    <p className="text-xs mt-1">SNS 링크에 <code className="bg-gray-100 px-1 rounded">?utm_source=xiaohongshu</code> 를 붙이세요</p>
                                </div>
                            ) : (
                                <div className="flex flex-col md:flex-row items-center gap-6">
                                    <ResponsiveContainer width="100%" height={220}>
                                        <PieChart>
                                            <Pie data={stats.channelList} dataKey="count" nameKey="channel"
                                                cx="50%" cy="50%" innerRadius={55} outerRadius={90} paddingAngle={3}>
                                                {stats.channelList.map((c, i) => (
                                                    <Cell key={i} fill={getColor(c.channel, i)}
                                                        stroke={activeChannel === c.channel ? '#000' : 'transparent'}
                                                        strokeWidth={activeChannel === c.channel ? 3 : 0}
                                                        style={{ cursor: 'pointer' }}
                                                        onClick={() => setActiveChannel(prev => prev === c.channel ? null : c.channel)}
                                                    />
                                                ))}
                                            </Pie>
                                            <Tooltip formatter={(v: any) => [`${v}건`, '예약']}
                                                contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }} />
                                        </PieChart>
                                    </ResponsiveContainer>
                                    <div className="space-y-2 min-w-[140px]">
                                        {stats.channelList.slice(0, 8).map((c, i) => (
                                            <button key={c.channel} onClick={() => setActiveChannel(prev => prev === c.channel ? null : c.channel)}
                                                className={`w-full flex items-center gap-2 text-left px-3 py-2 rounded-xl transition-all text-xs font-bold ${activeChannel === c.channel ? 'bg-bee-yellow/20 ring-1 ring-bee-yellow' : 'hover:bg-gray-50'}`}>
                                                <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: getColor(c.channel, i) }} />
                                                <span className="flex-1 truncate">{c.channel}</span>
                                                <span className="text-gray-400 font-mono">{c.count}</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* 매출 바 차트 */}
                        <div className="bg-white rounded-[32px] p-8 border border-gray-100 shadow-sm">
                            <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-6">채널별 매출</p>
                            <ResponsiveContainer width="100%" height={220}>
                                <BarChart data={stats.channelList.slice(0, 8)} layout="vertical" margin={{ left: 8, right: 20 }}>
                                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f3f4f6" />
                                    <XAxis type="number" tick={{ fontSize: 10, fontWeight: 700 }}
                                        tickFormatter={v => v >= 10000 ? `${Math.floor(v / 10000)}만` : String(v)} />
                                    <YAxis type="category" dataKey="channel" width={80} tick={{ fontSize: 11, fontWeight: 700 }} />
                                    <Tooltip formatter={(v: any) => [fmt(v), '매출']}
                                        contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }} />
                                    <Bar dataKey="revenue" radius={[0, 8, 8, 0]}>
                                        {stats.channelList.slice(0, 8).map((c, i) => (
                                            <Cell key={i} fill={getColor(c.channel, i)} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* 채널 성과 테이블 */}
                    <div className="bg-white rounded-[32px] p-8 border border-gray-100 shadow-sm overflow-x-auto">
                        <div className="flex items-center justify-between mb-6">
                            <p className="text-xs font-black text-gray-400 uppercase tracking-widest">채널 성과 테이블</p>
                            <div className="flex gap-2">
                                {(['count', 'revenue', 'aov'] as const).map(k => (
                                    <button key={k} onClick={() => setSortKey(k)}
                                        className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all ${sortKey === k ? 'bg-bee-black text-bee-yellow' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}>
                                        {k === 'count' ? '예약수' : k === 'revenue' ? '매출' : '객단가'}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <table className="w-full min-w-[640px]">
                            <thead>
                                <tr className="border-b border-gray-100">
                                    <th className="text-left text-[10px] font-black text-gray-400 uppercase tracking-widest pb-3 pl-2">채널</th>
                                    <th className="text-right text-[10px] font-black text-gray-400 uppercase tracking-widest pb-3 pr-4">예약수</th>
                                    <th className="text-right text-[10px] font-black text-gray-400 uppercase tracking-widest pb-3 pr-4">비율</th>
                                    <th className="text-right text-[10px] font-black text-gray-400 uppercase tracking-widest pb-3 pr-4">총 매출</th>
                                    <th className="text-right text-[10px] font-black text-gray-400 uppercase tracking-widest pb-3 pr-2">평균 객단가</th>
                                </tr>
                            </thead>
                            <tbody>
                                {stats.channelList.map((c, i) => {
                                    const pct = validBookings.length > 0 ? Math.round((c.count / validBookings.length) * 100) : 0;
                                    return (
                                        <tr key={c.channel}
                                            onClick={() => setActiveChannel(prev => prev === c.channel ? null : c.channel)}
                                            className={`border-b border-gray-50 hover:bg-bee-yellow/5 transition-colors cursor-pointer ${activeChannel === c.channel ? 'bg-bee-yellow/10' : ''}`}>
                                            <td className="py-3.5 pl-2">
                                                <div className="flex items-center gap-3">
                                                    <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: getColor(c.channel, i) }} />
                                                    <i className={`${CHANNEL_ICONS[c.channel] ?? 'fa-solid fa-circle-dot'} text-gray-400 w-4 text-center text-sm`} />
                                                    <span className="font-black text-sm text-bee-black">{c.channel}</span>
                                                </div>
                                            </td>
                                            <td className="py-3.5 pr-4 text-right font-black text-sm">{c.count.toLocaleString()}</td>
                                            <td className="py-3.5 pr-4">
                                                <div className="flex items-center justify-end gap-2">
                                                    <div className="w-20 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                                        <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: getColor(c.channel, i) }} />
                                                    </div>
                                                    <span className="text-xs font-bold text-gray-500 w-8 text-right">{pct}%</span>
                                                </div>
                                            </td>
                                            <td className="py-3.5 pr-4 text-right font-bold text-sm text-gray-700">{fmt(c.revenue)}</td>
                                            <td className="py-3.5 pr-2 text-right font-bold text-sm text-gray-700">{fmt(c.aov)}</td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                            <tfoot>
                                <tr className="border-t-2 border-gray-200">
                                    <td className="pt-3 pl-2 text-xs font-black text-gray-500">합계</td>
                                    <td className="pt-3 pr-4 text-right font-black text-sm">{validBookings.length.toLocaleString()}</td>
                                    <td className="pt-3 pr-4 text-right text-xs font-bold text-gray-400">100%</td>
                                    <td className="pt-3 pr-4 text-right font-black text-sm">
                                        {fmt(stats.channelList.reduce((s, c) => s + c.revenue, 0))}
                                    </td>
                                    <td className="pt-3 pr-2 text-right font-bold text-sm text-gray-500">
                                        {validBookings.length > 0 ? fmt(Math.floor(stats.channelList.reduce((s, c) => s + c.revenue, 0) / validBookings.length)) : '-'}
                                    </td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>

                    {/* 일별 채널 트렌드 */}
                    {stats.trend.length > 1 && (
                        <div className="bg-white rounded-[32px] p-8 border border-gray-100 shadow-sm">
                            <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-6">일별 채널 트렌드 (상위 5채널, 최근 30일)</p>
                            <ResponsiveContainer width="100%" height={240}>
                                <AreaChart data={stats.trend} margin={{ left: -20 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                                    <XAxis dataKey="date" tick={{ fontSize: 10, fontWeight: 700 }} interval="preserveStartEnd" />
                                    <YAxis tick={{ fontSize: 10, fontWeight: 700 }} allowDecimals={false} />
                                    <Tooltip contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }} />
                                    <Legend wrapperStyle={{ fontSize: 11, fontWeight: 700 }} />
                                    {stats.top5.map((ch, i) => (
                                        <Area key={ch} type="monotone" dataKey={ch} stackId="1"
                                            stroke={getColor(ch, i)} fill={getColor(ch, i)} fillOpacity={0.4}
                                            strokeWidth={2} dot={false} />
                                    ))}
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    )}

                    {/* 캠페인 성과 테이블 */}
                    {stats.campaigns.length > 0 && (
                        <div className="bg-white rounded-[32px] p-8 border border-gray-100 shadow-sm overflow-x-auto">
                            <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-6">캠페인 성과</p>
                            <table className="w-full min-w-[560px]">
                                <thead>
                                    <tr className="border-b border-gray-100">
                                        <th className="text-left text-[10px] font-black text-gray-400 uppercase tracking-widest pb-3 pl-2">캠페인</th>
                                        <th className="text-left text-[10px] font-black text-gray-400 uppercase tracking-widest pb-3">채널</th>
                                        <th className="text-left text-[10px] font-black text-gray-400 uppercase tracking-widest pb-3">미디엄</th>
                                        <th className="text-right text-[10px] font-black text-gray-400 uppercase tracking-widest pb-3 pr-4">예약수</th>
                                        <th className="text-right text-[10px] font-black text-gray-400 uppercase tracking-widest pb-3 pr-2">매출</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {stats.campaigns.map((c, i) => (
                                        <tr key={i} className="border-b border-gray-50 hover:bg-gray-50/60">
                                            <td className="py-3 pl-2 font-black text-sm text-bee-black max-w-[200px] truncate">{c.campaign}</td>
                                            <td className="py-3 font-bold text-xs text-gray-600">{c.channel}</td>
                                            <td className="py-3 font-bold text-xs text-gray-400">{c.medium}</td>
                                            <td className="py-3 pr-4 text-right font-black text-sm">{c.count}</td>
                                            <td className="py-3 pr-2 text-right font-bold text-sm text-gray-700">{fmt(c.revenue)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {/* UTM 커버리지 가이드 */}
                    <div className="bg-white rounded-[32px] p-8 border border-gray-100 shadow-sm">
                        <div className="flex items-start justify-between mb-6">
                            <p className="text-xs font-black text-gray-400 uppercase tracking-widest">UTM 태깅 커버리지</p>
                            <span className={`px-3 py-1 rounded-full text-xs font-black ${stats.coverageRate >= 70 ? 'bg-emerald-50 text-emerald-600' : stats.coverageRate >= 40 ? 'bg-amber-50 text-amber-600' : 'bg-red-50 text-red-500'}`}>
                                {stats.coverageRate >= 70 ? '양호' : stats.coverageRate >= 40 ? '개선 필요' : '미흡'}
                            </span>
                        </div>
                        <div className="flex items-center gap-4 mb-6">
                            <div className="flex-1 h-4 bg-gray-100 rounded-full overflow-hidden">
                                <div className="h-full rounded-full bg-bee-yellow transition-all duration-700"
                                    style={{ width: `${stats.coverageRate}%` }} />
                            </div>
                            <span className="text-2xl font-black text-bee-black font-mono w-16 text-right">{stats.coverageRate}%</span>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                            <div className="bg-gray-50 rounded-2xl p-4">
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">UTM 추적됨</p>
                                <p className="text-2xl font-black text-bee-black">{stats.trackedCount}</p>
                                <p className="text-xs text-gray-400 mt-1">채널 파악 가능</p>
                            </div>
                            <div className="bg-gray-50 rounded-2xl p-4">
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">미추적</p>
                                <p className="text-2xl font-black text-gray-400">{validBookings.length - stats.trackedCount}</p>
                                <p className="text-xs text-gray-400 mt-1">채널 불명확</p>
                            </div>
                            <div className="bg-bee-yellow/5 rounded-2xl p-4 border border-bee-yellow/20">
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">추천 액션</p>
                                <p className="text-xs font-bold text-gray-600 leading-relaxed">
                                    샤오홍슈 링크에<br />
                                    <code className="bg-bee-yellow/20 px-1 rounded text-[10px]">?utm_source=xiaohongshu&utm_medium=organic_social</code><br />
                                    추가하면 커버리지 즉시 향상
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* 선택 채널 예약 목록 */}
                    {activeChannel && stats.filteredBookings.length > 0 && (
                        <div className="bg-white rounded-[32px] p-8 border border-bee-yellow/30 shadow-sm">
                            <div className="flex items-center justify-between mb-6">
                                <p className="text-xs font-black text-gray-400 uppercase tracking-widest">
                                    <span className="text-bee-black">{activeChannel}</span> 채널 예약 목록
                                    <span className="ml-2 px-2 py-0.5 bg-bee-yellow/20 text-bee-black rounded-lg text-[10px]">{stats.filteredBookings.length}건</span>
                                </p>
                                <button onClick={() => setActiveChannel(null)} className="text-gray-400 hover:text-gray-600 text-xs font-bold flex items-center gap-1">
                                    <i className="fa-solid fa-xmark" /> 닫기
                                </button>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full min-w-[600px] text-sm">
                                    <thead>
                                        <tr className="border-b border-gray-100">
                                            <th className="text-left text-[10px] font-black text-gray-400 uppercase tracking-widest pb-2 pl-1">예약번호</th>
                                            <th className="text-left text-[10px] font-black text-gray-400 uppercase tracking-widest pb-2">날짜</th>
                                            <th className="text-left text-[10px] font-black text-gray-400 uppercase tracking-widest pb-2">서비스</th>
                                            <th className="text-left text-[10px] font-black text-gray-400 uppercase tracking-widest pb-2">캠페인</th>
                                            <th className="text-right text-[10px] font-black text-gray-400 uppercase tracking-widest pb-2 pr-1">금액</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {stats.filteredBookings.slice(0, 30).map(b => (
                                            <tr key={b.id} className="border-b border-gray-50 hover:bg-gray-50">
                                                <td className="py-2.5 pl-1 font-mono text-xs text-gray-500">{b.id?.slice(-8)}</td>
                                                <td className="py-2.5 text-xs font-bold">{b.createdAt?.slice(0, 10)}</td>
                                                <td className="py-2.5 text-xs font-bold">
                                                    <span className={`px-2 py-0.5 rounded-lg ${b.serviceType === ServiceType.DELIVERY ? 'bg-blue-50 text-blue-600' : 'bg-emerald-50 text-emerald-600'}`}>
                                                        {b.serviceType === ServiceType.DELIVERY ? '배송' : '보관'}
                                                    </span>
                                                </td>
                                                <td className="py-2.5 text-xs text-gray-500">{b.utmCampaign || '-'}</td>
                                                <td className="py-2.5 pr-1 text-right font-black text-xs">{fmt(b.finalPrice ?? 0)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                                {stats.filteredBookings.length > 30 && (
                                    <p className="text-center text-xs text-gray-400 mt-4 font-bold">상위 30건 표시 중 (전체 {stats.filteredBookings.length}건)</p>
                                )}
                            </div>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}
