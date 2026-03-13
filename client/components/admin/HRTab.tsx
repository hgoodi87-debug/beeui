import React from 'react';
import { AdminUser, LocationOption, LocationType } from '../../types';

interface HRTabProps {
    adminForm: Partial<AdminUser>;
    setAdminForm: (a: Partial<AdminUser>) => void;
    showAdminPassword: boolean;
    setShowAdminPassword: (b: boolean) => void;
    saveAdmin: () => void;
    admins: AdminUser[];
    deleteAdmin: (id: string) => void;
    isSaving: boolean;
    locations: LocationOption[];
}

const HRTab: React.FC<HRTabProps> = ({
    adminForm, setAdminForm, showAdminPassword, setShowAdminPassword,
    saveAdmin, admins, deleteAdmin, isSaving, locations
}) => {
    const [filterBranch, setFilterBranch] = React.useState<string>('ALL');
    const [searchQ, setSearchQ] = React.useState('');
    const [activeCategory, setActiveCategory] = React.useState<string>('SUPER'); // 기본값: 슈퍼관리자 먼저 보여주기 💅

    const branchLocations = locations.filter(loc => loc.type !== LocationType.AIRPORT && loc.isActive);

    // 데이터 중복 완전 박멸: 이름 + 직책 + 지점ID를 조합한 복합 키로 유니크 처리 🛡️
    // 단순 ID 중복뿐만 아니라 동일인이 여러 번 등록된 경우까지 싹 잡아냅니다. 💅
    const uniqueAdmins = Array.from(
        new Map(
            admins.map(admin => {
                const compositeKey = `${admin.name}-${admin.jobTitle}-${admin.branchId || 'SUPER'}`;
                return [compositeKey, admin];
            })
        ).values()
    );

    const filteredAdmins = uniqueAdmins.filter(admin => {
        if (filterBranch !== 'ALL') {
            if (filterBranch === 'SUPER' && admin.branchId) return false;
            if (filterBranch !== 'SUPER' && admin.branchId !== filterBranch) return false;
        }
        if (searchQ.trim()) {
            const q = searchQ.toLowerCase();
            if (!admin.name?.toLowerCase().includes(q) && !admin.jobTitle?.toLowerCase().includes(q)) return false;
        }
        return true;
    }).sort((a, b) => (a.name || '').localeCompare(b.name || '', 'ko'));

    // 카테고리별 분류 로직 💄
    const categories = [
        { id: 'SUPER', label: '슈퍼관리자', icon: 'fa-crown', filter: (a: AdminUser) => !a.branchId },
        { id: 'HOTEL', label: '호텔', icon: 'fa-hotel', filter: (a: AdminUser) => a.branchId && (a.jobTitle?.includes('호텔') || a.jobTitle?.toLowerCase().includes('hotel')) },
        { id: 'AIRBNB', label: '에어비엔비', icon: 'fa-house-user', filter: (a: AdminUser) => a.branchId && (a.jobTitle?.includes('에어비엔비') || a.jobTitle?.toLowerCase().includes('airbnb')) },
        { id: 'DRIVER', label: '배송기사', icon: 'fa-truck-fast', filter: (a: AdminUser) => a.branchId && (a.jobTitle?.includes('기사') || a.jobTitle?.includes('드라이버') || a.jobTitle?.toLowerCase().includes('driver')) },
        { id: 'PARTNER', label: '브랜치', icon: 'fa-handshake', filter: (a: AdminUser) => {
            if (!a.branchId) return false;
            // 지점 소속 중 특정 역할(호텔/기사 등)이 아닌 경우만 '브랜치'로 분류 🧠
            const isSpecificType = (a.jobTitle?.includes('호텔') || a.jobTitle?.toLowerCase().includes('hotel')) ||
                                 (a.jobTitle?.includes('에어비엔비') || a.jobTitle?.toLowerCase().includes('airbnb')) ||
                                 (a.jobTitle?.includes('기사') || a.jobTitle?.includes('드라이버') || a.jobTitle?.toLowerCase().includes('driver'));
            return !isSpecificType;
        }},
        { id: 'OTHER', label: '기타 직원', icon: 'fa-user-tag', filter: (a: AdminUser) => {
            // 모든 카테고리에 해당하지 않는 경우 (방어 코드) 💄
            const isHandled = !a.branchId || 
                             (a.branchId && (a.jobTitle?.includes('호텔') || a.jobTitle?.toLowerCase().includes('hotel'))) ||
                             (a.branchId && (a.jobTitle?.includes('에어비엔비') || a.jobTitle?.toLowerCase().includes('airbnb'))) ||
                             (a.branchId && (a.jobTitle?.includes('기사') || a.jobTitle?.includes('드라이버') || a.jobTitle?.toLowerCase().includes('driver'))) ||
                             (a.branchId); // 브랜치 매니저 포함
            return !isHandled;
        }},
    ];

    // 상호 배제 필터링: 이미 한 카테고리에 할당된 직원은 다음 카테고리에서 제외 🛡️
    const assignedIds = new Set<string>();
    const categorizedAdmins = categories.map(cat => {
        const list = filteredAdmins
            .filter(admin => !assignedIds.has(admin.id)) // 이미 할당된 ID 제외 🧠
            .filter(cat.filter);
        
        list.forEach(admin => assignedIds.add(admin.id)); // 이번에 할당된 ID 기록 💄
        return { ...cat, list };
    }).filter(cat => cat.list.length > 0);

    const displayCategories = activeCategory === 'ALL' 
        ? categorizedAdmins 
        : categorizedAdmins.filter(c => c.id === activeCategory);

    const totalCount = categorizedAdmins.reduce((acc, cat) => acc + cat.list.length, 0);

    return (
        <div className="space-y-6 md:space-y-8 animate-fade-in-up">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <h1 className="text-2xl md:text-3xl font-black tracking-tight">직원(관리자) 계정 관리</h1>
                <span className="text-xs font-black text-gray-400">{totalCount} / {admins.length} 명</span>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
                {/* 왼쪽: 등록/수정 폼 */}
                <div className="bg-white p-6 md:p-8 rounded-[30px] md:rounded-[40px] shadow-sm border border-gray-100 space-y-6 lg:col-span-1 h-fit">
                    <div className="flex justify-between items-center">
                        <h3 className="text-lg md:text-xl font-black flex items-center gap-3">
                            <span className="w-2 h-8 bg-bee-black rounded-full"></span>
                            {adminForm.id ? '수정' : '등록'}
                        </h3>
                    </div>
                    <div className="space-y-4">
                        <div>
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">이름</label>
                            <input value={adminForm.name || ''} onChange={e => setAdminForm({ ...adminForm, name: e.target.value })} className="w-full bg-gray-50 p-3 rounded-xl font-bold border border-gray-100 focus:border-bee-black outline-none text-xs" placeholder="홍길동" />
                        </div>
                        <div>
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">직책</label>
                            <input value={adminForm.jobTitle || ''} onChange={e => setAdminForm({ ...adminForm, jobTitle: e.target.value })} className="w-full bg-gray-50 p-3 rounded-xl font-bold border border-gray-100 focus:border-bee-black outline-none text-xs" placeholder="Manager" />
                        </div>
                        <div>
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">소속 지점 (선택)</label>
                            <select value={adminForm.branchId || ''} onChange={e => setAdminForm({ ...adminForm, branchId: e.target.value })} className="w-full bg-gray-50 p-3 rounded-xl font-bold border border-gray-100 focus:border-bee-black outline-none text-xs" title="소속 지점 선택" aria-label="소속 지점 선택">
                                <option value="">전체 관리자 (슈퍼)</option>
                                {branchLocations.map(loc => <option key={loc.id} value={loc.id}>{loc.name}</option>)}
                            </select>
                        </div>
                        <div className="relative">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">비밀번호</label>
                            <input type={showAdminPassword ? "text" : "password"} value={adminForm.password || ''} onChange={e => setAdminForm({ ...adminForm, password: e.target.value })} className="w-full bg-gray-50 p-3 rounded-xl font-black border border-gray-100 focus:border-bee-black outline-none text-xs tracking-widest" placeholder="••••" />
                            <button type="button" onClick={() => setShowAdminPassword(!showAdminPassword)} className="absolute right-3 top-[34px] text-gray-300 hover:text-bee-black transition-colors" title={showAdminPassword ? "비밀번호 숨기기" : "비밀번호 보기"} aria-label={showAdminPassword ? "비밀번호 숨기기" : "비밀번호 보기"}>
                                <i className={`fa-solid ${showAdminPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                            </button>
                        </div>
                    </div>
                    <button onClick={saveAdmin} disabled={isSaving} className={`w-full py-4 rounded-2xl font-black text-sm transition-all shadow-lg ${isSaving ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-bee-yellow text-bee-black shadow-yellow-100 hover:scale-[1.02] active:scale-95'}`}>
                        {isSaving ? '저장 중...' : adminForm.id ? '수정 완료 💅' : '관리자 추가 ✨'}
                    </button>
                    {(adminForm.id || adminForm.name || adminForm.jobTitle || adminForm.password) && (
                        <button onClick={() => { setAdminForm({ name: '', jobTitle: '', password: '' }); setShowAdminPassword(false); }} className="w-full py-4 text-xs font-bold text-gray-400 hover:text-bee-black transition-colors">
                            {adminForm.id ? '취소하고 새로 등록하기' : '입력 내용 초기화 폼 🧹'}
                        </button>
                    )}
                </div>

                {/* 오른쪽: 필터 + 직원 목록 */}
                <div className="lg:col-span-2 space-y-4">
                    {/* ─── 필터 바 💅 ─── */}
                    <div className="bg-white rounded-[24px] p-4 border border-gray-100 shadow-sm space-y-3">
                        {/* 검색 */}
                        <div className="relative">
                            <i className="fa-solid fa-magnifying-glass absolute left-3 top-1/2 -translate-y-1/2 text-gray-300 text-xs"></i>
                            <input value={searchQ} onChange={e => setSearchQ(e.target.value)} placeholder="이름 또는 직책 검색..." className="w-full bg-gray-50 pl-8 pr-4 py-2.5 rounded-xl text-xs font-bold border border-gray-100 focus:border-bee-yellow outline-none" />
                        </div>
                        {/* 카테고리 탭 💅 */}
                        <div className="flex flex-wrap gap-2 items-center mb-2 pb-2 border-b border-gray-100">
                            <button onClick={() => setActiveCategory('ALL')} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-black transition-all ${activeCategory === 'ALL' ? 'bg-bee-black text-bee-yellow shadow-sm' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}>
                                전체 역할 ({totalCount})
                            </button>
                            {categories.map(cat => {
                                const count = categorizedAdmins.find(c => c.id === cat.id)?.list.length || 0;
                                return (
                                    <button key={cat.id} onClick={() => setActiveCategory(cat.id)} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-black transition-all ${activeCategory === cat.id ? 'bg-bee-black text-bee-yellow shadow-sm' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}>
                                        <i className={`fa-solid ${cat.icon} text-[9px]`}></i> {cat.label} ({count})
                                    </button>
                                );
                            })}
                        </div>
                        {/* 지점 필터 */}
                        {/* 지점 필터 버튼들 제거 💅 사장님 요청사항 수행 완료 */}
                        <div className="text-[10px] font-black text-gray-400">{displayCategories.reduce((acc, cat) => acc + cat.list.length, 0)}명 목록에 표시됨</div>
                    </div>

                    {/* 직원 목록 */}
                    <div className="bg-white rounded-[24px] md:rounded-[30px] shadow-sm border border-gray-100 overflow-hidden">
                        {displayCategories.length === 0 ? (
                            <div className="py-16 text-center text-gray-400 font-bold">
                                <i className="fa-solid fa-user-slash text-2xl mb-3 text-gray-200 block"></i>
                                조건에 맞는 직원이 없습니다.
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-gray-50 border-t border-gray-50">
                                {displayCategories.map(category => (
                                    <React.Fragment key={category.id}>
                                        <div className="col-span-full bg-gray-50/80 px-6 py-2 border-y border-gray-100 flex items-center gap-2">
                                            <i className={`fa-solid ${category.icon} text-[10px] text-bee-yellow`}></i>
                                            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{category.label} ({category.list.length})</span>
                                        </div>
                                        {category.list.map(admin => (
                                            <div key={admin.id} className="p-4 md:p-5 flex items-center justify-between bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all group">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-10 h-10 md:w-12 md:h-12 rounded-2xl bg-gray-100 flex items-center justify-center font-black italic text-gray-300 group-hover:bg-bee-yellow group-hover:text-bee-black transition-colors shrink-0">
                                                        {admin.name?.slice(0, 1)}
                                                    </div>
                                                    <div className="min-w-0">
                                                        <h4 className="font-black text-base md:text-lg text-bee-black truncate">{admin.name}</h4>
                                                        <div className="flex items-center gap-2 flex-wrap">
                                                            <p className="text-[10px] md:text-xs font-bold text-gray-400 truncate max-w-[80px] md:max-w-none">{admin.jobTitle}</p>
                                                            {admin.branchId ? (
                                                                <>
                                                                    <span className="text-[10px] text-gray-300">•</span>
                                                                    <span className="text-[8px] md:text-[10px] font-black text-bee-yellow bg-bee-black px-1.5 py-0.5 rounded-md truncate">
                                                                        {locations.find(l => l.id === admin.branchId)?.name || '지점 정보 없음'}
                                                                    </span>
                                                                </>
                                                            ) : (
                                                                <span className="text-[8px] md:text-[10px] font-black text-purple-600 bg-purple-50 px-1.5 py-0.5 rounded-md">슈퍼관리자</span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2 shrink-0">
                                                    <button onClick={() => setAdminForm(admin)} className="w-8 h-8 md:w-10 md:h-10 rounded-xl bg-gray-50 text-gray-400 hover:bg-bee-black hover:text-white transition-all flex items-center justify-center" title="관리자 정보 수정" aria-label="관리자 정보 수정">
                                                        <i className="fa-solid fa-pen-to-square text-[10px] md:text-xs"></i>
                                                    </button>
                                                    <button onClick={() => { if (window.confirm('정말 삭제하시겠습니까?')) deleteAdmin(admin.id); }} className="w-8 h-8 md:w-10 md:h-10 rounded-xl bg-gray-50 text-gray-400 hover:bg-red-500 hover:text-white transition-all flex items-center justify-center" title="관리자 계정 삭제" aria-label="관리자 계정 삭제">
                                                        <i className="fa-solid fa-trash-can text-[10px] md:text-xs"></i>
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </React.Fragment>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default HRTab;
