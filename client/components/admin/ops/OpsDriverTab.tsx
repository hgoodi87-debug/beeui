import React, { useState } from 'react';
import { AdminUser, LocationOption, BookingState, BookingStatus } from '../../../types';

interface OpsDriverTabProps {
    admins: AdminUser[];
    locations: LocationOption[];
    bookings: BookingState[];
}

const OpsDriverTab: React.FC<OpsDriverTabProps> = ({
    admins,
    locations,
    bookings
}) => {
    const [searchQ, setSearchQ] = useState('');
    const [filterBranch, setFilterBranch] = useState<'ALL' | string>('ALL');

    const driverAdmins = admins.filter(a => 
        a.jobTitle?.includes('드라이버') || a.jobTitle?.includes('기사')
    );

    const filteredAdmins = driverAdmins.filter(admin => {
        const matchesSearch = admin.name.toLowerCase().includes(searchQ.toLowerCase()) || 
                             admin.id.toLowerCase().includes(searchQ.toLowerCase());
        const matchesBranch = filterBranch === 'ALL' ? true : admin.branchId === filterBranch;
        return matchesSearch && matchesBranch;
    });

    // 동적 수치 계산
    const onRouteCount = bookings.filter(b => b.status === BookingStatus.TRANSIT && !b.isDeleted).length;
    const standbyCount = Math.max(0, driverAdmins.length - onRouteCount);

    return (
        <div className="space-y-6 md:space-y-8 animate-fade-in-up">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl md:text-3xl font-black tracking-tight text-bee-black">드라이버 실시간 관제</h1>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">현장 드라이버 가동 현황 및 실시간 위치 트래킹</p>
                </div>
                <div className="flex gap-4">
                    <div className="bg-white px-6 py-3 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-end">
                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">활동 중인 기사</span>
                        <span className="text-sm font-black text-emerald-500">{driverAdmins.length}명 등록됨</span>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
                {/* 배차 가능 상태 요약 */}
                <div className="bg-bee-black p-8 rounded-[40px] shadow-2xl space-y-8 lg:col-span-1 h-fit relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-bee-yellow/10 rounded-full blur-3xl -mr-10 -mt-10"></div>
                    <h3 className="text-xl font-black text-white flex items-center gap-3 relative z-10">
                        <i className="fa-solid fa-truck-ramp-box text-bee-yellow"></i>
                        배차 현황 요약
                    </h3>
                    
                    <div className="space-y-4 relative z-10">
                        <div className="p-5 bg-white/5 rounded-[24px] border border-white/10 group hover:bg-white/10 transition-colors">
                            <span className="text-[10px] font-black text-gray-500 uppercase block mb-2 tracking-widest">즉시 배차 가능</span>
                            <div className="flex items-end justify-between">
                                <span className="text-3xl font-black text-white">{standbyCount} <span className="text-sm text-gray-500 ml-1">명</span></span>
                                <span className="text-[10px] font-black text-bee-yellow bg-bee-yellow/10 px-3 py-1 rounded-full uppercase">대기 중</span>
                            </div>
                        </div>
                        <div className="p-5 bg-white/5 rounded-[24px] border border-white/10 group hover:bg-white/10 transition-colors">
                            <span className="text-[10px] font-black text-gray-500 uppercase block mb-2 tracking-widest">현재 배송 운행</span>
                            <div className="flex items-end justify-between">
                                <span className="text-3xl font-black text-white">{onRouteCount} <span className="text-sm text-gray-500 ml-1">명</span></span>
                                <span className="text-[10px] font-black text-orange-500 bg-orange-500/10 px-3 py-1 rounded-full uppercase">운행 중</span>
                            </div>
                        </div>
                    </div>

                    <button className="w-full py-4 bg-bee-yellow text-bee-black rounded-[20px] font-black text-sm hover:scale-[1.02] active:scale-95 transition-all shadow-xl shadow-bee-yellow/10 relative z-10">
                        긴급 배차 지시 (All Alert) 🚨
                    </button>
                </div>

                {/* 필터 + 드라이버 목록 */}
                <div className="lg:col-span-2 space-y-4">
                    <div className="bg-white rounded-[30px] p-5 border border-gray-100 shadow-sm space-y-4">
                        <div className="relative group">
                            <i className="fa-solid fa-magnifying-glass absolute left-4 top-1/2 -translate-y-1/2 text-gray-300 text-xs group-focus-within:text-bee-yellow transition-colors"></i>
                            <input value={searchQ} onChange={e => setSearchQ(e.target.value)} placeholder="드라이버 이름 또는 ID 검색..." className="w-full bg-gray-50 pl-11 pr-4 py-3 rounded-2xl text-xs font-black border border-gray-100 focus:border-bee-black outline-none transition-all placeholder:text-gray-300" />
                        </div>
                        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
                            <button onClick={() => setFilterBranch('ALL')} className={`px-5 py-2.5 rounded-xl text-[10px] font-black shrink-0 transition-all ${filterBranch === 'ALL' ? 'bg-bee-black text-bee-yellow shadow-lg' : 'bg-gray-100 text-gray-400 hover:bg-gray-200'}`}>전체 거점</button>
                            {locations.filter(l => l.isActive !== false).map(loc => (
                                <button key={loc.id} onClick={() => setFilterBranch(loc.id)} className={`px-5 py-2.5 rounded-xl text-[10px] font-black shrink-0 transition-all ${filterBranch === loc.id ? 'bg-bee-black text-bee-yellow shadow-lg' : 'bg-gray-100 text-gray-400 hover:bg-gray-200'}`}>{loc.name}</button>
                            ))}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 gap-3">
                        {filteredAdmins.length > 0 ? filteredAdmins.map(admin => (
                            <div key={admin.id} className="bg-white p-5 md:px-7 rounded-[30px] border border-gray-100 shadow-sm hover:shadow-xl hover:-translate-y-0.5 transition-all group flex flex-col sm:flex-row items-center gap-5">
                                <div className="w-14 h-14 rounded-2xl bg-gray-50 flex items-center justify-center shrink-0 border border-gray-100 group-hover:bg-bee-black group-hover:text-bee-yellow group-hover:rotate-6 transition-all shadow-inner">
                                    <i className="fa-solid fa-id-card-clip text-xl text-gray-300 group-hover:text-bee-yellow"></i>
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-3">
                                        <h4 className="font-black text-base text-bee-black truncate">{admin.name}</h4>
                                        <span className="text-[10px] font-black bg-gray-50 text-gray-500 px-3 py-1 rounded-full border border-gray-100">{admin.jobTitle || '파트너 드라이버'}</span>
                                    </div>
                                    <div className="flex items-center gap-3 mt-2">
                                        <span className="text-[10px] font-bold text-gray-400">ID: {admin.id}</span>
                                        <div className="w-1 h-1 bg-gray-200 rounded-full"></div>
                                        <span className={`text-[10px] font-black px-3 py-0.5 rounded-lg ${admin.branchId ? 'bg-bee-yellow/10 text-bee-black' : 'bg-gray-100 text-gray-400'}`}>
                                            <i className="fa-solid fa-location-dot mr-1"></i>
                                            {admin.branchId ? (locations.find(l => l.id === admin.branchId)?.name || admin.branchId) : '전체(슈퍼)'}
                                        </span>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button className="h-12 px-5 rounded-2xl bg-gray-50 text-gray-400 hover:bg-bee-black hover:text-bee-yellow transition-all flex items-center justify-center gap-2 border border-transparent hover:border-bee-black shadow-none hover:shadow-lg shadow-bee-black/20" title="현재 위치 실시간 조회">
                                        <i className="fa-solid fa-location-crosshairs text-xs"></i>
                                        <span className="text-[10px] font-black uppercase tracking-widest">위치 조회</span>
                                    </button>
                                    <button className="w-12 h-12 rounded-2xl bg-gray-50 text-gray-400 hover:bg-bee-black hover:text-white transition-all flex items-center justify-center border border-transparent hover:border-bee-black" title="무전/전화 호출">
                                        <i className="fa-solid fa-phone text-xs"></i>
                                    </button>
                                </div>
                            </div>
                        )) : (
                            <div className="bg-white p-20 rounded-[40px] border-2 border-dashed border-gray-100 text-center">
                                <p className="text-gray-300 font-black">검색 조건에 맞는 드라이버가 없습니다. 🙄</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default OpsDriverTab;
