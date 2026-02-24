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

    const branchLocations = locations.filter(loc => loc.type !== LocationType.AIRPORT && loc.isActive);

    const filteredAdmins = admins.filter(admin => {
        if (filterBranch !== 'ALL') {
            if (filterBranch === 'SUPER' && admin.branchId) return false;
            if (filterBranch !== 'SUPER' && admin.branchId !== filterBranch) return false;
        }
        if (searchQ.trim()) {
            const q = searchQ.toLowerCase();
            if (!admin.name?.toLowerCase().includes(q) && !admin.jobTitle?.toLowerCase().includes(q)) return false;
        }
        return true;
    });

    return (
        <div className="space-y-6 md:space-y-8 animate-fade-in-up">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <h1 className="text-2xl md:text-3xl font-black tracking-tight">직원(관리자) 계정 관리</h1>
                <span className="text-xs font-black text-gray-400">{filteredAdmins.length} / {admins.length} 명</span>
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
                    {adminForm.id && (
                        <button onClick={() => { setAdminForm({}); setShowAdminPassword(false); }} className="w-full py-4 text-xs font-bold text-gray-400 hover:text-bee-black transition-colors">
                            취소하고 새로 등록하기
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
                        {/* 지점 필터 */}
                        <div className="flex flex-wrap gap-2 items-center">
                            <button onClick={() => setFilterBranch('ALL')} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-black transition-all ${filterBranch === 'ALL' ? 'bg-bee-black text-bee-yellow shadow-sm' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}>
                                <i className="fa-solid fa-users text-[9px]"></i> 전체
                            </button>
                            <button onClick={() => setFilterBranch('SUPER')} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-black transition-all ${filterBranch === 'SUPER' ? 'bg-bee-black text-bee-yellow shadow-sm' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}>
                                <i className="fa-solid fa-star text-[9px]"></i> 슈퍼관리자
                            </button>
                            {branchLocations.map(loc => (
                                <button key={loc.id} onClick={() => setFilterBranch(loc.id)} className={`px-3 py-1.5 rounded-full text-[10px] font-black transition-all ${filterBranch === loc.id ? 'bg-bee-yellow text-bee-black shadow-sm' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}>
                                    {loc.name}
                                </button>
                            ))}
                            {(filterBranch !== 'ALL' || searchQ) && (
                                <button onClick={() => { setFilterBranch('ALL'); setSearchQ(''); }} className="px-3 py-1.5 rounded-full text-[10px] font-black text-red-400 bg-red-50 hover:bg-red-100 transition-all ml-auto">
                                    <i className="fa-solid fa-xmark mr-1"></i>초기화
                                </button>
                            )}
                        </div>
                        <div className="text-[10px] font-black text-gray-400">{filteredAdmins.length}명 표시 중 / 전체 {admins.length}명</div>
                    </div>

                    {/* 직원 목록 */}
                    <div className="bg-white rounded-[24px] md:rounded-[30px] shadow-sm border border-gray-100 overflow-hidden">
                        {filteredAdmins.length === 0 ? (
                            <div className="py-16 text-center text-gray-400 font-bold">
                                <i className="fa-solid fa-user-slash text-2xl mb-3 text-gray-200 block"></i>
                                조건에 맞는 직원이 없습니다.
                            </div>
                        ) : (
                            <div className="divide-y divide-gray-50">
                                {filteredAdmins.map(admin => (
                                    <div key={admin.id} className="p-4 md:p-6 flex items-center justify-between hover:bg-gray-50/80 transition-colors group">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 rounded-2xl bg-gray-100 flex items-center justify-center font-black italic text-gray-300 group-hover:bg-bee-yellow group-hover:text-bee-black transition-colors">
                                                {admin.name?.slice(0, 1)}
                                            </div>
                                            <div>
                                                <h4 className="font-black text-lg text-bee-black">{admin.name}</h4>
                                                <div className="flex items-center gap-2 flex-wrap">
                                                    <p className="text-xs font-bold text-gray-400">{admin.jobTitle}</p>
                                                    {admin.branchId ? (
                                                        <>
                                                            <span className="text-[10px] text-gray-300">•</span>
                                                            <span className="text-[10px] font-black text-bee-yellow bg-bee-black px-2 py-0.5 rounded-md">
                                                                {locations.find(l => l.id === admin.branchId)?.name || '지점 정보 없음'}
                                                            </span>
                                                        </>
                                                    ) : (
                                                        <span className="text-[10px] font-black text-purple-600 bg-purple-50 px-2 py-0.5 rounded-md">슈퍼관리자</span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <button onClick={() => setAdminForm(admin)} className="w-10 h-10 rounded-xl bg-gray-50 text-gray-400 hover:bg-bee-black hover:text-white transition-all flex items-center justify-center" title="관리자 정보 수정" aria-label="관리자 정보 수정">
                                                <i className="fa-solid fa-pen-to-square text-xs"></i>
                                            </button>
                                            <button onClick={() => { if (window.confirm('정말 삭제하시겠습니까?')) deleteAdmin(admin.id); }} className="w-10 h-10 rounded-xl bg-gray-50 text-gray-400 hover:bg-red-500 hover:text-white transition-all flex items-center justify-center" title="관리자 계정 삭제" aria-label="관리자 계정 삭제">
                                                <i className="fa-solid fa-trash-can text-xs"></i>
                                            </button>
                                        </div>
                                    </div>
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
