import React, { useState, useEffect, useCallback } from 'react';
import {
    AreaChart, Area,
    BarChart, Bar,
    LineChart, Line,
    XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell, Legend,
} from 'recharts';
import { resolveSupabaseEndpoint } from '../../services/supabaseRuntime';

// ─── 색상 팔레트 (ReportsTab 동일) ────────────────────────────
const COLORS = ['#FACC15', '#3B82F6', '#10B981', '#F87171', '#A78BFA', '#FB923C', '#2DD4BF'];

// ─── Supabase Edge Function URL 해석 ──────────────────────────
function fnUrl(name: string, params?: Record<string, string>): string {
    const base = resolveSupabaseEndpoint(undefined, `/functions/v1/${name}`);
    if (!params) return base;
    const q = new URLSearchParams(params);
    return `${base}?${q}`;
}

// ─── 공통 fetch ───────────────────────────────────────────────
async function callFn(name: string, days: number) {
    const res = await fetch(fnUrl(name, { days: String(days) }), {
        headers: { 'Content-Type': 'application/json' },
    });
    if (!res.ok) throw new Error(`${name} 호출 실패 (${res.status})`);
    const data = await res.json();
    if (data.error) throw new Error(data.error);
    return data;
}

// ─── KPI 카드 ──────────────────────────────────────────────────
function KpiCard({ label, value, sub, color = '#FACC15' }: { label: string; value: string; sub?: string; color?: string }) {
    return (
        <div className="bg-white rounded-[24px] border border-gray-100 shadow-sm p-6 flex flex-col gap-1">
            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{label}</span>
            <span className="text-3xl font-black text-bee-black tabular-nums" style={{ color }}>{value}</span>
            {sub && <span className="text-xs text-gray-400 font-bold">{sub}</span>}
        </div>
    );
}

// ─── 빈 상태 ──────────────────────────────────────────────────
function EmptyState({ icon, msg, hint }: { icon: string; msg: string; hint?: string }) {
    return (
        <div className="bg-white rounded-[32px] border border-gray-100 shadow-sm p-12 text-center">
            <div className="text-4xl mb-4">{icon}</div>
            <p className="font-black text-gray-400 text-sm">{msg}</p>
            {hint && <p className="text-xs text-gray-300 mt-2">{hint}</p>}
        </div>
    );
}

// ─── 섹션 헤더 ────────────────────────────────────────────────
function SectionHeader({ icon, title, color = '#1f2937' }: { icon: string; title: string; color?: string }) {
    return (
        <div className="flex items-center gap-3 px-2">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center text-white shadow-lg" style={{ backgroundColor: color }}>
                <i className={`fa-solid ${icon} text-xs`}></i>
            </div>
            <h2 className="text-xl font-black text-bee-black uppercase tracking-tight">{title}</h2>
        </div>
    );
}

function fmtNum(n: number) { return n.toLocaleString(); }
function fmtDur(s: number) {
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}분 ${sec}초`;
}

// ─── GA4 탭 ───────────────────────────────────────────────────
function GA4Panel({ days }: { days: number }) {
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        setLoading(true);
        setError(null);
        callFn('google-analytics', days)
            .then(setData)
            .catch((e) => setError(e.message))
            .finally(() => setLoading(false));
    }, [days]);

    if (loading) return <div className="flex items-center justify-center h-40 text-gray-400 font-bold text-sm">GA4 데이터 로딩 중...</div>;
    if (error) return <EmptyState icon="⚠️" msg="GA4 연동 오류" hint={error} />;
    if (!data) return null;

    const { kpi, daily, channels, countries, pages } = data;

    return (
        <div className="space-y-8">
            {/* KPI 카드 */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                <KpiCard label="세션" value={fmtNum(kpi.sessions)} color="#FACC15" />
                <KpiCard label="활성 사용자" value={fmtNum(kpi.activeUsers)} color="#3B82F6" />
                <KpiCard label="신규 사용자" value={fmtNum(kpi.newUsers)} color="#10B981" />
                <KpiCard label="페이지뷰" value={fmtNum(kpi.pageViews)} color="#A78BFA" />
                <KpiCard label="이탈률" value={`${kpi.bounceRate}%`} color="#F87171" />
                <KpiCard label="평균 세션" value={fmtDur(kpi.avgSessionDuration)} />
            </div>

            {/* 일별 세션 트렌드 */}
            <div className="bg-white rounded-[32px] border border-gray-100 shadow-sm p-8">
                <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-6">일별 세션 / 사용자</p>
                <ResponsiveContainer width="100%" height={200}>
                    <AreaChart data={daily} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
                        <defs>
                            <linearGradient id="gaSessions" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#FACC15" stopOpacity={0.3} />
                                <stop offset="95%" stopColor="#FACC15" stopOpacity={0} />
                            </linearGradient>
                            <linearGradient id="gaUsers" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3} />
                                <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                        <XAxis dataKey="date" tick={{ fontSize: 10, fontWeight: 700 }} tickFormatter={(v) => v.slice(5)} />
                        <YAxis tick={{ fontSize: 10 }} />
                        <Tooltip contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.08)', fontSize: 12, fontWeight: 700 }} />
                        <Area type="monotone" dataKey="sessions" stroke="#FACC15" fill="url(#gaSessions)" strokeWidth={2} name="세션" />
                        <Area type="monotone" dataKey="activeUsers" stroke="#3B82F6" fill="url(#gaUsers)" strokeWidth={2} name="사용자" />
                    </AreaChart>
                </ResponsiveContainer>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* 채널별 도넛 */}
                <div className="bg-white rounded-[32px] border border-gray-100 shadow-sm p-8">
                    <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-6">채널별 세션</p>
                    <ResponsiveContainer width="100%" height={220}>
                        <PieChart>
                            <Pie data={channels} dataKey="sessions" nameKey="channel" cx="50%" cy="50%" innerRadius={55} outerRadius={90} paddingAngle={3}>
                                {channels.map((_: any, i: number) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                            </Pie>
                            <Tooltip formatter={(v: any, n: any) => [`${fmtNum(v)}`, n]} contentStyle={{ borderRadius: 12, border: 'none', fontSize: 12, fontWeight: 700 }} />
                            <Legend iconType="circle" iconSize={8} formatter={(v) => <span className="text-xs font-bold text-gray-600">{v}</span>} />
                        </PieChart>
                    </ResponsiveContainer>
                </div>

                {/* 국가별 */}
                <div className="bg-white rounded-[32px] border border-gray-100 shadow-sm overflow-hidden">
                    <div className="px-8 py-6 border-b border-gray-50">
                        <p className="text-xs font-black text-gray-400 uppercase tracking-widest">국가별 세션 Top 10</p>
                    </div>
                    <div className="divide-y divide-gray-50">
                        {countries.slice(0, 8).map((c: any, i: number) => (
                            <div key={c.country} className="flex items-center px-8 py-3.5 hover:bg-gray-50/50">
                                <span className="text-[10px] font-black text-gray-300 w-5">{i + 1}</span>
                                <span className="font-bold text-bee-black text-sm flex-1">{c.country}</span>
                                <span className="text-xs font-black text-gray-500 tabular-nums">{fmtNum(c.sessions)}세션</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* 페이지별 */}
            <div className="bg-white rounded-[32px] border border-gray-100 shadow-sm overflow-hidden">
                <div className="px-8 py-6 border-b border-gray-50">
                    <p className="text-xs font-black text-gray-400 uppercase tracking-widest">페이지별 조회 Top 15</p>
                </div>
                <table className="w-full text-left">
                    <thead className="bg-gray-50/50 text-[10px] font-black uppercase text-gray-400 tracking-widest">
                        <tr>
                            <th className="px-8 py-4">페이지</th>
                            <th className="px-8 py-4 text-right">페이지뷰</th>
                            <th className="px-8 py-4 text-right">세션</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                        {pages.map((p: any) => (
                            <tr key={p.path} className="hover:bg-gray-50/50">
                                <td className="px-8 py-3 font-mono text-xs text-bee-black truncate max-w-[320px]">{p.path}</td>
                                <td className="px-8 py-3 text-right font-black text-sm tabular-nums">{fmtNum(p.views)}</td>
                                <td className="px-8 py-3 text-right text-xs font-bold text-gray-400 tabular-nums">{fmtNum(p.sessions)}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

// ─── GSC 탭 ───────────────────────────────────────────────────
function GSCPanel({ days }: { days: number }) {
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        setLoading(true);
        setError(null);
        callFn('google-search-console', days)
            .then(setData)
            .catch((e) => setError(e.message))
            .finally(() => setLoading(false));
    }, [days]);

    if (loading) return <div className="flex items-center justify-center h-40 text-gray-400 font-bold text-sm">Search Console 데이터 로딩 중...</div>;
    if (error) return <EmptyState icon="⚠️" msg="Search Console 연동 오류" hint={error} />;
    if (!data) return null;

    const { kpi, daily, queries, pages, countries, devices } = data;

    return (
        <div className="space-y-8">
            {/* KPI 카드 */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <KpiCard label="총 클릭" value={fmtNum(kpi.clicks)} color="#10B981" />
                <KpiCard label="총 노출" value={fmtNum(kpi.impressions)} color="#3B82F6" />
                <KpiCard label="평균 CTR" value={`${kpi.ctr}%`} color="#FACC15" />
                <KpiCard label="평균 순위" value={`${kpi.position}위`} color="#A78BFA" />
            </div>

            {/* 일별 클릭/노출 */}
            <div className="bg-white rounded-[32px] border border-gray-100 shadow-sm p-8">
                <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-6">일별 클릭 / 노출</p>
                <ResponsiveContainer width="100%" height={200}>
                    <LineChart data={daily} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                        <XAxis dataKey="date" tick={{ fontSize: 10, fontWeight: 700 }} tickFormatter={(v) => v.slice(5)} />
                        <YAxis yAxisId="left" tick={{ fontSize: 10 }} />
                        <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 10 }} />
                        <Tooltip contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.08)', fontSize: 12, fontWeight: 700 }} />
                        <Line yAxisId="left" type="monotone" dataKey="clicks" stroke="#10B981" strokeWidth={2} dot={false} name="클릭" />
                        <Line yAxisId="right" type="monotone" dataKey="impressions" stroke="#3B82F6" strokeWidth={2} dot={false} name="노출" />
                    </LineChart>
                </ResponsiveContainer>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* 검색어 Top 25 */}
                <div className="bg-white rounded-[32px] border border-gray-100 shadow-sm overflow-hidden">
                    <div className="px-8 py-6 border-b border-gray-50">
                        <p className="text-xs font-black text-gray-400 uppercase tracking-widest">검색어 Top 25</p>
                    </div>
                    <table className="w-full text-left">
                        <thead className="bg-gray-50/50 text-[10px] font-black uppercase text-gray-400 tracking-widest">
                            <tr>
                                <th className="px-7 py-3">검색어</th>
                                <th className="px-7 py-3 text-center">클릭</th>
                                <th className="px-7 py-3 text-center">노출</th>
                                <th className="px-7 py-3 text-right">순위</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {queries.map((q: any) => (
                                <tr key={q.key} className="hover:bg-gray-50/50 group">
                                    <td className="px-7 py-2.5 font-bold text-bee-black text-xs max-w-[180px] truncate">{q.key}</td>
                                    <td className="px-7 py-2.5 text-center">
                                        <span className="text-xs font-black text-bee-black group-hover:text-bee-yellow transition-colors">{fmtNum(q.clicks)}</span>
                                    </td>
                                    <td className="px-7 py-2.5 text-center text-xs font-bold text-gray-400 tabular-nums">{fmtNum(q.impressions)}</td>
                                    <td className="px-7 py-2.5 text-right text-xs font-bold text-gray-500 tabular-nums">{q.position}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* 페이지 Top 25 */}
                <div className="bg-white rounded-[32px] border border-gray-100 shadow-sm overflow-hidden">
                    <div className="px-8 py-6 border-b border-gray-50">
                        <p className="text-xs font-black text-gray-400 uppercase tracking-widest">페이지 Top 25</p>
                    </div>
                    <table className="w-full text-left">
                        <thead className="bg-gray-50/50 text-[10px] font-black uppercase text-gray-400 tracking-widest">
                            <tr>
                                <th className="px-7 py-3">URL</th>
                                <th className="px-7 py-3 text-center">클릭</th>
                                <th className="px-7 py-3 text-right">CTR</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {pages.map((p: any) => (
                                <tr key={p.key} className="hover:bg-gray-50/50">
                                    <td className="px-7 py-2.5 font-mono text-[10px] text-bee-black max-w-[200px] truncate">{p.key.replace(/^https?:\/\/[^/]+/, '')}</td>
                                    <td className="px-7 py-2.5 text-center font-black text-xs">{fmtNum(p.clicks)}</td>
                                    <td className="px-7 py-2.5 text-right text-xs font-bold text-gray-400">{p.ctr}%</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* 기기/국가 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white rounded-[32px] border border-gray-100 shadow-sm p-8">
                    <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-6">기기별 클릭</p>
                    <ResponsiveContainer width="100%" height={160}>
                        <BarChart data={devices} layout="vertical" margin={{ left: 0, right: 16 }}>
                            <XAxis type="number" tick={{ fontSize: 10 }} />
                            <YAxis type="category" dataKey="key" tick={{ fontSize: 11, fontWeight: 700 }} width={60} />
                            <Tooltip contentStyle={{ borderRadius: 12, border: 'none', fontSize: 12, fontWeight: 700 }} />
                            <Bar dataKey="clicks" fill="#FACC15" radius={[0, 6, 6, 0]} name="클릭" />
                        </BarChart>
                    </ResponsiveContainer>
                </div>

                <div className="bg-white rounded-[32px] border border-gray-100 shadow-sm overflow-hidden">
                    <div className="px-8 py-6 border-b border-gray-50">
                        <p className="text-xs font-black text-gray-400 uppercase tracking-widest">국가별 클릭</p>
                    </div>
                    <div className="divide-y divide-gray-50">
                        {countries.slice(0, 7).map((c: any, i: number) => (
                            <div key={c.key} className="flex items-center px-8 py-3 hover:bg-gray-50/50">
                                <span className="text-[10px] font-black text-gray-300 w-5">{i + 1}</span>
                                <span className="font-bold text-bee-black text-sm flex-1 uppercase">{c.key}</span>
                                <span className="text-xs font-black text-gray-500 tabular-nums mr-4">{fmtNum(c.clicks)}클릭</span>
                                <span className="text-[10px] font-bold text-gray-300">{c.ctr}%</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}

// ─── 메인 컴포넌트 ─────────────────────────────────────────────
type ActivePanel = 'ga4' | 'gsc';

const GoogleAnalyticsTab: React.FC = () => {
    const [activePanel, setActivePanel] = useState<ActivePanel>('ga4');
    const [days, setDays] = useState(30);

    const tabBtn = (id: ActivePanel, label: string, icon: string) => (
        <button
            onClick={() => setActivePanel(id)}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl font-black text-sm transition-all ${
                activePanel === id
                    ? 'bg-bee-yellow text-bee-black shadow-sm'
                    : 'text-gray-400 hover:text-bee-black hover:bg-gray-100'
            }`}
        >
            <i className={`fa-solid ${icon} text-xs`}></i>
            {label}
        </button>
    );

    return (
        <div className="space-y-8 animate-fade-in-up pb-10">
            {/* 헤더 */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white/40 backdrop-blur-md p-8 rounded-[40px] border border-white/50 shadow-sm">
                <div>
                    <h1 className="text-2xl font-black text-bee-black">구글 데이터 센터</h1>
                    <p className="text-sm text-gray-400 font-bold mt-1">Analytics · Search Console 통합 조회</p>
                </div>
                <div className="flex items-center gap-3">
                    {/* 기간 선택 */}
                    <select
                        value={days}
                        onChange={(e) => setDays(Number(e.target.value))}
                        className="bg-gray-100 border-none rounded-2xl px-4 py-2.5 text-sm font-black text-bee-black focus:ring-2 focus:ring-bee-yellow outline-none"
                    >
                        <option value={7}>최근 7일</option>
                        <option value={14}>최근 14일</option>
                        <option value={30}>최근 30일</option>
                        <option value={60}>최근 60일</option>
                        <option value={90}>최근 90일</option>
                    </select>
                </div>
            </div>

            {/* 탭 전환 */}
            <div className="flex gap-2 bg-white/60 backdrop-blur-sm p-2 rounded-[20px] border border-white/50 shadow-sm w-fit">
                {tabBtn('ga4', 'Google Analytics', 'fa-chart-area')}
                {tabBtn('gsc', 'Search Console', 'fa-magnifying-glass-chart')}
            </div>

            {/* GA4 */}
            {activePanel === 'ga4' && (
                <section className="space-y-6">
                    <SectionHeader icon="fa-chart-area" title="Google Analytics 4" color="#ea4335" />
                    <GA4Panel days={days} />
                </section>
            )}

            {/* GSC */}
            {activePanel === 'gsc' && (
                <section className="space-y-6">
                    <SectionHeader icon="fa-magnifying-glass-chart" title="Google Search Console" color="#4285f4" />
                    <GSCPanel days={days} />
                </section>
            )}
        </div>
    );
};

export default GoogleAnalyticsTab;
