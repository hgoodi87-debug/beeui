import React, { useState } from 'react';
import { AdminUser, LocationOption, LocationType } from '../../../types';

interface OpsDriverHrTabProps {
    adminForm: Partial<AdminUser>;
    setAdminForm: (a: Partial<AdminUser>) => void;
    showAdminPassword: boolean;
    setShowAdminPassword: (b: boolean) => void;
    saveAdmin: () => void;
    admins: AdminUser[];
    deleteAdmin: (id: string) => void;
    isSaving: boolean;
    locations: LocationOption[];
    onlyDrivers?: boolean;
}

const OpsDriverHrTab: React.FC<OpsDriverHrTabProps> = ({
    adminForm, setAdminForm, showAdminPassword, setShowAdminPassword,
    saveAdmin, admins, deleteAdmin, isSaving, locations, onlyDrivers
}) => {
    const [filterBranch, setFilterBranch] = useState<string>('ALL');
    const [searchQ, setSearchQ] = useState('');
    const [activeCategory, setActiveCategory] = useState<string>(onlyDrivers ? 'DRIVER' : 'SUPER'); // 운영 콘솔이면 기사 먼저 💅
    const selectedBranchLocationId = React.useMemo(() => {
        if (!adminForm.branchId && !adminForm.branchCode) return '';

        const directMatch = locations.find((location) => location.id === adminForm.branchId);
        if (directMatch) return directMatch.id;

        const branchToken = String(adminForm.branchCode || adminForm.branchId || '').trim().toLowerCase();
        if (!branchToken) return '';

        return locations.find((location) =>
            String(location.branchCode || '').trim().toLowerCase() === branchToken
            || String(location.shortCode || '').trim().toLowerCase() === branchToken
        )?.id || '';
    }, [adminForm.branchCode, adminForm.branchId, locations]);

    const resolveBranchLabel = React.useCallback((admin: AdminUser) => {
        if (admin.branchName) return admin.branchName;

        const branchToken = String(admin.branchCode || admin.branchId || '').trim().toLowerCase();
        if (!branchToken) return '슈퍼관리자';

        const matchedLocation = locations.find((location) =>
            location.id === admin.branchId
            || String(location.branchCode || '').trim().toLowerCase() === branchToken
            || String(location.shortCode || '').trim().toLowerCase() === branchToken
        );

        return matchedLocation?.name || (admin.branchCode ? `${admin.branchCode} 지점` : '지점 정보 없음');
    }, [locations]);

    // 데이터 중복 완전 박멸: 복합 키(이름+직책+지점)를 사용한 "트리플 스캔" 🛡️ 💅
    const uniqueAdmins = Array.from(
        new Map(
            admins.map(admin => {
                const compositeKey = `${admin.name}-${admin.jobTitle}-${admin.branchId || admin.branchCode || 'SUPER'}`;
                return [compositeKey, admin];
            })
        ).values()
    );
    
    // 모든 관리자를 이름 기준 가나다순으로 정렬 후 분류 💄
    const sortedAdmins = uniqueAdmins.sort((a, b) => (a.name || '').localeCompare(b.name || '', 'ko'));

    const categories = [
        { id: 'SUPER', label: '슈퍼관리자', icon: 'fa-crown', filter: (a: AdminUser) => !(a.branchId || a.branchCode) },
        { id: 'HOTEL', label: '호텔', icon: 'fa-hotel', filter: (a: AdminUser) => (a.branchId || a.branchCode) && (a.jobTitle?.includes('호텔') || a.jobTitle?.toLowerCase().includes('hotel')) },
        { id: 'AIRBNB', label: '에어비엔비', icon: 'fa-house-user', filter: (a: AdminUser) => (a.branchId || a.branchCode) && (a.jobTitle?.includes('에어비엔비') || a.jobTitle?.toLowerCase().includes('airbnb')) },
        { id: 'DRIVER', label: '배송기사', icon: 'fa-truck-fast', filter: (a: AdminUser) => (a.branchId || a.branchCode) && (a.jobTitle?.includes('기사') || a.jobTitle?.includes('드라이버') || a.jobTitle?.toLowerCase().includes('driver')) },
        { id: 'PARTNER', label: '브랜치', icon: 'fa-handshake', filter: (a: AdminUser) => {
            if (!(a.branchId || a.branchCode)) return false;
            // 지점 소속이지만 기사/호텔 등 특정 역할이 아니면 '브랜치(매니저)'로 자동 분류 🧠
            const isSpecificType = (a.jobTitle?.includes('호텔') || a.jobTitle?.toLowerCase().includes('hotel')) ||
                                 (a.jobTitle?.includes('에어비엔비') || a.jobTitle?.toLowerCase().includes('airbnb')) ||
                                 (a.jobTitle?.includes('기사') || a.jobTitle?.includes('드라이버') || a.jobTitle?.toLowerCase().includes('driver'));
            return !isSpecificType;
        }},
        { id: 'OTHER', label: '기타 직원', icon: 'fa-user-tag', filter: (a: AdminUser) => {
            const hasBranch = Boolean(a.branchId || a.branchCode);
            const isHandled = !hasBranch || 
                             (hasBranch && (a.jobTitle?.includes('호텔') || a.jobTitle?.toLowerCase().includes('hotel'))) ||
                             (hasBranch && (a.jobTitle?.includes('에어비엔비') || a.jobTitle?.toLowerCase().includes('airbnb'))) ||
                             (hasBranch && (a.jobTitle?.includes('기사') || a.jobTitle?.includes('드라이버') || a.jobTitle?.toLowerCase().includes('driver'))) ||
                             hasBranch;
            return !isHandled;
        }},
    ];

    // 상호 배제 필터링: 이미 분류된 인원은 중복 표시 금지 🛡️
    const assignedIds = new Set<string>();
    const categorizedAdmins = categories.map(cat => {
        const list = sortedAdmins
            .filter(admin => !assignedIds.has(admin.id)) // 중복 차단 🧠
            .filter(cat.filter)
            .filter(admin => {
                if (filterBranch !== 'ALL' && admin.branchId !== filterBranch) return false;
                if (searchQ.trim()) {
                    const q = searchQ.toLowerCase();
                    if (!admin.name?.toLowerCase().includes(q) && !admin.id?.toLowerCase().includes(q)) return false;
                }
                return true;
            });
        
        list.forEach(admin => assignedIds.add(admin.id)); // 분류 확정 💄
        return { ...cat, list };
    }).filter(cat => cat.list.length > 0);

    const totalCount = categorizedAdmins.reduce((acc, cat) => acc + cat.list.length, 0);

    const displayCategories = activeCategory === 'ALL' 
        ? categorizedAdmins 
        : categorizedAdmins.filter(c => c.id === activeCategory);

    return (
        <div className="space-y-6 md:space-y-8 animate-fade-in-up">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl md:text-3xl font-black tracking-tight text-bee-black">{onlyDrivers ? '배송 기사 관리' : '인사 관리 (HR)'}</h1>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">
                        {onlyDrivers ? '운영 현장 배송 인력 계정 및 거점 최적화' : '현장 운전원 전용 인사보드 및 계정 제어'}
                    </p>
                </div>
                <div className="flex gap-4">
                    <div className="bg-white px-6 py-2 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-end">
                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">전체 인원 수</span>
                        <span className="text-sm font-black text-bee-black">{totalCount}명 관리 중</span>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
                {/* 기사 등록/수정 폼 */}
                <div className="bg-bee-black p-6 md:p-8 rounded-[30px] md:rounded-[40px] shadow-2xl space-y-6 lg:col-span-1 h-fit relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-bee-yellow/10 rounded-full blur-3xl -mr-10 -mt-10"></div>
                    <div className="relative z-10">
                        <h3 className="text-lg md:text-xl font-black text-white flex items-center gap-3 mb-6">
                            <i className="fa-solid fa-user-plus text-bee-yellow"></i>
                            {adminForm.id ? '기사 정보 수정' : '신규 기사 등록'}
                        </h3>
                        
                        <div className="space-y-4">
                            <div>
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">이름</label>
                                <input value={adminForm.name || ''} onChange={e => setAdminForm({ ...adminForm, name: e.target.value })} className="w-full bg-white/5 p-3 rounded-xl font-bold border border-white/10 focus:border-bee-yellow outline-none text-xs text-white" placeholder="성함 입력" />
                            </div>
                            <div>
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">직책/역할</label>
                                <input value={adminForm.jobTitle || '배송기사'} onChange={e => setAdminForm({ ...adminForm, jobTitle: e.target.value })} className="w-full bg-white/5 p-3 rounded-xl font-bold border border-white/10 focus:border-bee-yellow outline-none text-xs text-white" placeholder="예: 시니어 드라이버" />
                            </div>
                            <div>
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">담당 거점 (Hub)</label>
                                <select value={selectedBranchLocationId} onChange={e => {
                                    const nextLocation = locations.find((location) => location.id === e.target.value);
                                    setAdminForm({
                                        ...adminForm,
                                        branchId: nextLocation?.id || '',
                                        branchCode: nextLocation?.branchCode || nextLocation?.shortCode || '',
                                    });
                                }} className="w-full bg-white/5 p-3 rounded-xl font-bold border border-white/10 focus:border-bee-yellow outline-none text-xs text-white" title="담당 거점 선택">
                                    <option value="" className="bg-bee-black text-white">거점 미지정</option>
                                    {locations.filter(l => l.isActive).map(loc => <option key={loc.id} value={loc.id} className="bg-bee-black text-white">{loc.name}</option>)}
                                </select>
                            </div>
                            <div className="relative">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">접속 비밀번호</label>
                                <input type={showAdminPassword ? "text" : "password"} value={adminForm.password || ''} onChange={e => setAdminForm({ ...adminForm, password: e.target.value })} className="w-full bg-white/5 p-3 rounded-xl font-black border border-white/10 focus:border-bee-yellow outline-none text-xs text-white tracking-widest" placeholder="••••" />
                                <button type="button" onClick={() => setShowAdminPassword(!showAdminPassword)} className="absolute right-3 top-[34px] text-gray-500 hover:text-bee-yellow transition-colors" title={showAdminPassword ? "비밀번호 숨기기" : "비밀번호 보기"}>
                                    <i className={`fa-solid ${showAdminPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                                </button>
                            </div>
                        </div>

                        <div className="pt-6 space-y-3">
                            <button onClick={saveAdmin} disabled={isSaving} className={`w-full py-4 rounded-2xl font-black text-sm transition-all shadow-lg ${isSaving ? 'bg-white/10 text-gray-400 cursor-not-allowed' : 'bg-bee-yellow text-bee-black hover:scale-[1.02] active:scale-95'}`}>
                                {isSaving ? '처리 중...' : adminForm.id ? '수정 사항 저장 💅' : '배송기사 계정 생성 ✨'}
                            </button>
                            {adminForm.id && (
                                <button onClick={() => setAdminForm({})} className="w-full py-2 text-[10px] font-bold text-gray-500 hover:text-white transition-colors">
                                    신규 등록으로 전환
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                {/* 기사 목록 및 필터 */}
                <div className="lg:col-span-2 space-y-4">
                    <div className="bg-white rounded-[24px] p-4 border border-gray-100 shadow-sm space-y-3">
                        <div className="relative">
                            <i className="fa-solid fa-magnifying-glass absolute left-3 top-1/2 -translate-y-1/2 text-gray-300 text-xs"></i>
                            <input value={searchQ} onChange={e => setSearchQ(e.target.value)} placeholder="기사 이름 또는 ID 검색..." className="w-full bg-gray-50 pl-8 pr-4 py-2.5 rounded-xl text-xs font-bold border border-gray-100 focus:border-bee-black outline-none" />
                        </div>
                        {!onlyDrivers && (
                            <div className="flex gap-2 pb-1 overflow-x-auto no-scrollbar border-b border-gray-100 mb-2">
                                <button onClick={() => setActiveCategory('ALL')} className={`px-4 py-2 rounded-xl text-[10px] font-black shrink-0 transition-all ${activeCategory === 'ALL' ? 'bg-bee-black text-bee-yellow shadow-lg' : 'bg-gray-100 text-gray-400 hover:bg-gray-200'}`}>전체 역할 ({totalCount})</button>
                                {categories.map(cat => {
                                    const count = categorizedAdmins.find(c => c.id === cat.id)?.list.length || 0;
                                    return (
                                        <button key={cat.id} onClick={() => setActiveCategory(cat.id)} className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-[10px] font-black shrink-0 transition-all ${activeCategory === cat.id ? 'bg-bee-black text-bee-yellow shadow-lg' : 'bg-gray-100 text-gray-400 hover:bg-gray-200'}`}>
                                            <i className={`fa-solid ${cat.icon}`}></i> {cat.label} ({count})
                                        </button>
                                    );
                                })}
                            </div>
                        )}
                        {/* 지점 필터 버튼들 제거 💅 사장님 요청사항 수행 완료 */}
                    </div>

                    <div className="bg-white rounded-[24px] md:rounded-[30px] shadow-sm border border-gray-100 overflow-hidden">
                        {displayCategories.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-px bg-gray-50">
                                {displayCategories.map(category => (
                                    <React.Fragment key={category.id}>
                                        <div className="col-span-full bg-gray-50/80 px-4 py-2 flex items-center gap-2 border-b border-gray-100">
                                            <i className={`fa-solid ${category.icon} text-[10px] text-bee-yellow`}></i>
                                            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{category.label} ({category.list.length})</span>
                                        </div>
                                        {category.list.map(admin => (
                                            <div key={admin.id} className="bg-white p-4 md:px-5 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all group flex items-center justify-between">
                                                <div className="flex items-center gap-4 min-w-0">
                                                    <div className="w-10 h-10 md:w-12 md:h-12 rounded-2xl bg-gray-50 flex items-center justify-center shrink-0 group-hover:bg-bee-yellow group-hover:text-bee-black transition-colors">
                                                        <i className="fa-solid fa-id-badge text-gray-300"></i>
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center gap-2">
                                                            <h4 className="font-black text-sm md:text-base text-bee-black truncate">{admin.name}</h4>
                                                            <span className="text-[8px] md:text-[10px] font-black bg-gray-100 text-gray-500 px-2 py-0.5 rounded-lg truncate max-w-[60px] md:max-w-none">{admin.jobTitle}</span>
                                                        </div>
                                                        <div className="flex items-center gap-3 mt-1">
                                                            <span className="text-[9px] font-bold text-gray-400 truncate">ID: {admin.id}</span>
                                                            <span className="text-[8px] md:text-[10px] font-black text-bee-black px-1.5 py-0.5 bg-bee-yellow/20 rounded-lg truncate">
                                                                {resolveBranchLabel(admin)}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2 shrink-0">
                                                    <button onClick={() => setAdminForm(admin)} className="w-8 h-8 md:w-10 md:h-10 rounded-xl bg-gray-50 text-gray-400 hover:bg-bee-black hover:text-bee-yellow transition-all flex items-center justify-center" title="정보 수정">
                                                        <i className="fa-solid fa-user-pen text-[10px] md:text-xs"></i>
                                                    </button>
                                                    <button onClick={() => { if(window.confirm('정말 삭제하시겠습니까?')) deleteAdmin(admin.id); }} className="w-8 h-8 md:w-10 md:h-10 rounded-xl bg-gray-50 text-gray-400 hover:bg-red-500 hover:text-white transition-all flex items-center justify-center" title="삭제">
                                                        <i className="fa-solid fa-trash-can text-[10px] md:text-xs"></i>
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </React.Fragment>
                                ))}
                            </div>
                        ) : (
                            <div className="bg-white p-12 rounded-[30px] border border-dashed border-gray-200 text-center">
                                <p className="text-gray-400 font-bold">등록된 직원이 없습니다.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default OpsDriverHrTab;
