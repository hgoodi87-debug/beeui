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
    adminForm,
    setAdminForm,
    showAdminPassword,
    setShowAdminPassword,
    saveAdmin,
    admins,
    deleteAdmin,
    isSaving,
    locations
}) => {
    return (
        <div className="space-y-6 md:space-y-8 animate-fade-in-up">
            <h1 className="text-2xl md:text-3xl font-black tracking-tight mb-2">직원(관리자) 계정 관리</h1>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
                <div className="bg-white p-6 md:p-8 rounded-[30px] md:rounded-[40px] shadow-sm border border-gray-100 space-y-6 lg:col-span-1 h-fit">
                    <div className="flex justify-between items-center">
                        <h3 className="text-lg md:text-xl font-black flex items-center gap-3"><span className="w-2 h-8 bg-bee-black rounded-full"></span>{adminForm.id ? '수정' : '등록'}</h3>
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
                            <select
                                value={adminForm.branchId || ''}
                                onChange={e => setAdminForm({ ...adminForm, branchId: e.target.value })}
                                className="w-full bg-gray-50 p-3 rounded-xl font-bold border border-gray-100 focus:border-bee-black outline-none text-xs"
                                title="소속 지점 선택"
                                aria-label="소속 지점 선택"
                            >
                                <option value="">전체 관리자 (슈퍼)</option>
                                {locations
                                    .filter(loc => loc.type !== LocationType.AIRPORT && loc.isActive)
                                    .map(loc => (
                                        <option key={loc.id} value={loc.id}>{loc.name}</option>
                                    ))}
                            </select>
                        </div>
                        <div className="relative">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">비밀번호</label>
                            <input
                                type={showAdminPassword ? "text" : "password"}
                                value={adminForm.password || ''}
                                onChange={e => setAdminForm({ ...adminForm, password: e.target.value })}
                                className="w-full bg-gray-50 p-3 rounded-xl font-black border border-gray-100 focus:border-bee-black outline-none text-xs tracking-widest"
                                placeholder="••••"
                            />
                            <button
                                type="button"
                                onClick={() => setShowAdminPassword(!showAdminPassword)}
                                className="absolute right-3 top-[34px] text-gray-300 hover:text-bee-black transition-colors"
                                title={showAdminPassword ? "비밀번호 숨기기" : "비밀번호 보기"}
                                aria-label={showAdminPassword ? "비밀번호 숨기기" : "비밀번호 보기"}
                            >
                                <i className={`fa-solid ${showAdminPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                            </button>
                        </div>
                    </div>
                    <button
                        onClick={saveAdmin}
                        disabled={isSaving}
                        className={`w-full py-4 rounded-2xl font-black text-sm transition-all shadow-lg ${isSaving ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-bee-yellow text-bee-black shadow-yellow-100 hover:scale-[1.02] active:scale-95'}`}
                    >
                        {isSaving ? '저장 중...' : adminForm.id ? '수정 완료 💅' : '관리자 추가 ✨'}
                    </button>
                    {adminForm.id && (
                        <button
                            onClick={() => {
                                setAdminForm({});
                                setShowAdminPassword(false);
                            }}
                            className="w-full py-4 text-xs font-bold text-gray-400 hover:text-bee-black transition-colors"
                        >
                            취소하고 새로 등록하기
                        </button>
                    )}
                </div>

                <div className="bg-white rounded-[30px] md:rounded-[40px] shadow-sm border border-gray-100 overflow-hidden lg:col-span-2">
                    <div className="bg-gray-50/50 p-4 md:p-6 border-b border-gray-100">
                        <div className="flex justify-between items-end">
                            <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest">직원 명단</h3>
                            <div className="text-[10px] font-black text-bee-muted uppercase tracking-widest">{admins.length} Total</div>
                        </div>
                    </div>
                    <div className="divide-y divide-gray-50">
                        {admins.map(admin => (
                            <div key={admin.id} className="p-4 md:p-6 flex items-center justify-between hover:bg-gray-50/80 transition-colors group">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-2xl bg-gray-100 flex items-center justify-center font-black italic text-gray-300 group-hover:bg-bee-yellow group-hover:text-bee-black transition-colors">
                                        {admin.name?.slice(0, 1)}
                                    </div>
                                    <div>
                                        <h4 className="font-black text-lg text-bee-black">{admin.name}</h4>
                                        <div className="flex items-center gap-2">
                                            <p className="text-xs font-bold text-gray-400">{admin.jobTitle}</p>
                                            {admin.branchId && (
                                                <>
                                                    <span className="text-[10px] text-gray-300">•</span>
                                                    <span className="text-[10px] font-black text-bee-yellow bg-bee-black px-2 py-0.5 rounded-md">
                                                        {locations.find(l => l.id === admin.branchId)?.name || '지점 정보 없음'}
                                                    </span>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => setAdminForm(admin)}
                                        className="w-10 h-10 rounded-xl bg-gray-50 text-gray-400 hover:bg-bee-black hover:text-white transition-all flex items-center justify-center"
                                        title="관리자 정보 수정"
                                        aria-label="관리자 정보 수정"
                                    >
                                        <i className="fa-solid fa-pen-to-square text-xs"></i>
                                    </button>
                                    <button
                                        onClick={() => {
                                            if (window.confirm('정말 삭제하시겠습니까?')) {
                                                deleteAdmin(admin.id);
                                            }
                                        }}
                                        className="w-10 h-10 rounded-xl bg-gray-50 text-gray-400 hover:bg-red-500 hover:text-white transition-all flex items-center justify-center"
                                        title="관리자 계정 삭제"
                                        aria-label="관리자 계정 삭제"
                                    >
                                        <i className="fa-solid fa-trash-can text-xs"></i>
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

export default HRTab;
