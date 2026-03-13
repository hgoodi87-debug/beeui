import React, { useState } from 'react';
import { AdminUser, LocationOption } from '../../types';

interface OpsDriverTabProps {
    admins: AdminUser[];
    locations: LocationOption[];
}

const OpsDriverTab: React.FC<OpsDriverTabProps> = ({
    admins,
    locations
}) => {
    const [searchQ, setSearchQ] = useState('');
    const [filterBranch, setFilterBranch] = useState<'ALL' | string>('ALL');

    const filteredAdmins = admins.filter(admin => {
        const matchesSearch = admin.name.toLowerCase().includes(searchQ.toLowerCase()) || 
                             admin.id.toLowerCase().includes(searchQ.toLowerCase());
        const matchesBranch = filterBranch === 'ALL' ? true : admin.branchId === filterBranch;
        return matchesSearch && matchesBranch;
    });

    return (
        <div className="space-y-6 md:space-y-8 animate-fade-in-up">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl md:text-3xl font-black tracking-tight text-bee-black">Driver Resources</h1>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">현장 운전원 가동 현황 및 실시간 위치 관제</p>
                </div>
                <div className="flex gap-4">
                    <div className="bg-white px-6 py-2 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-end">
                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Active On-Duty</span>
                        <span className="text-sm font-black text-green-500">{admins.filter(a => a.branchId).length} Active</span>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
                {/* 왼쪽: 배차 가능 상태 요약 */}
                <div className="bg-bee-black p-6 md:p-8 rounded-[30px] md:rounded-[40px] shadow-2xl space-y-6 lg:col-span-1 h-fit relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-bee-yellow/10 rounded-full blur-3xl -mr-10 -mt-10"></div>
                    <h3 className="text-lg md:text-xl font-black text-white flex items-center gap-3 relative z-10">
                        <i className="fa-solid fa-truck-ramp-box text-bee-yellow"></i>
                        Dispatch Status
                    </h3>
                    
                    <div className="space-y-4 relative z-10">
                        <div className="p-4 bg-white/5 rounded-2xl border border-white/10">
                            <span className="text-[10px] font-black text-gray-400 uppercase block mb-1">Available Now</span>
                            <div className="flex items-end justify-between">
                                <span className="text-2xl font-black text-white">8 명</span>
                                <span className="text-[10px] font-bold text-green-500">Wait in Hub</span>
                            </div>
                        </div>
                        <div className="p-4 bg-white/5 rounded-2xl border border-white/10">
                            <span className="text-[10px] font-black text-gray-400 uppercase block mb-1">On Delivery</span>
                            <div className="flex items-end justify-between">
                                <span className="text-2xl font-black text-white">4 명</span>
                                <span className="text-[10px] font-bold text-orange-500">In Transit</span>
                            </div>
                        </div>
                    </div>

                    <button className="w-full py-4 bg-bee-yellow text-bee-black rounded-2xl font-black text-sm hover:scale-[1.02] active:scale-95 transition-all shadow-lg relative z-10">
                        Emergency Dispatch Alert
                    </button>
                </div>

                {/* 오른쪽: 필터 + 직원 목록 */}
                <div className="lg:col-span-2 space-y-4">
                    <div className="bg-white rounded-[24px] p-4 border border-gray-100 shadow-sm space-y-3">
                        <div className="relative">
                            <i className="fa-solid fa-magnifying-glass absolute left-3 top-1/2 -translate-y-1/2 text-gray-300 text-xs"></i>
                            <input value={searchQ} onChange={e => setSearchQ(e.target.value)} placeholder="직원 이름 또는 아이디 검색..." className="w-full bg-gray-50 pl-8 pr-4 py-2.5 rounded-xl text-xs font-bold border border-gray-100 focus:border-bee-black outline-none" />
                        </div>
                        <div className="flex gap-2">
                            <button onClick={() => setFilterBranch('ALL')} className={`px-4 py-2 rounded-xl text-[10px] font-black transition-all ${filterBranch === 'ALL' ? 'bg-bee-black text-bee-yellow shadow-lg' : 'bg-gray-100 text-gray-400 hover:bg-gray-200'}`}>전체</button>
                            {locations.filter(l => l.isActive !== false).map(loc => (
                                <button key={loc.id} onClick={() => setFilterBranch(loc.id)} className={`px-4 py-2 rounded-xl text-[10px] font-black transition-all ${filterBranch === loc.id ? 'bg-bee-black text-bee-yellow shadow-lg' : 'bg-gray-100 text-gray-400 hover:bg-gray-200'}`}>{loc.name}</button>
                            ))}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 gap-3">
                        {filteredAdmins.map(admin => (
                            <div key={admin.id} className="bg-white p-4 md:px-6 rounded-[24px] border border-gray-100 shadow-sm hover:shadow-md transition-all group flex flex-col sm:flex-row items-center gap-4">
                                <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center shrink-0">
                                    <i className="fa-solid fa-user-tie text-gray-300"></i>
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                        <h4 className="font-black text-sm text-bee-black truncate">{admin.name}</h4>
                                        <span className="text-[10px] font-black bg-gray-100 text-gray-500 px-2 py-0.5 rounded-lg">{admin.jobTitle || '기사'}</span>
                                    </div>
                                    <div className="flex items-center gap-2 mt-1">
                                        <span className="text-[10px] font-bold text-gray-400">ID: {admin.id}</span>
                                        <div className="w-1 h-1 bg-gray-300 rounded-full"></div>
                                        <span className={`text-[10px] font-black ${admin.branchId ? 'text-bee-black' : 'text-gray-400'}`}>
                                            {admin.branchId ? (locations.find(l => l.id === admin.branchId)?.name || admin.branchId) : '전체(슈퍼)'}
                                        </span>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button className="w-24 h-10 rounded-xl bg-gray-50 text-gray-400 hover:bg-bee-black hover:text-bee-yellow transition-all flex items-center justify-center gap-2 px-3" title="현재 위치 확인">
                                        <i className="fa-solid fa-location-crosshairs text-xs"></i>
                                        <span className="text-[10px] font-black uppercase tracking-tighter">Locate</span>
                                    </button>
                                    <button className="w-10 h-10 rounded-xl bg-gray-50 text-gray-400 hover:bg-bee-black hover:text-white transition-all flex items-center justify-center" title="통화 연결">
                                        <i className="fa-solid fa-phone text-xs"></i>
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default OpsDriverTab;
