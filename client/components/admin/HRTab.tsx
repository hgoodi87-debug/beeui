import React from 'react';
import { AdminUser } from '../../types';

interface HRTabProps {
    adminForm: Partial<AdminUser>;
    setAdminForm: (a: Partial<AdminUser>) => void;
    showAdminPassword: boolean;
    setShowAdminPassword: (b: boolean) => void;
    saveAdmin: () => void;
    admins: AdminUser[];
    deleteAdmin: (id: string) => void;
    isSaving: boolean;
}

const HRTab: React.FC<HRTabProps> = ({
    adminForm,
    setAdminForm,
    showAdminPassword,
    setShowAdminPassword,
    saveAdmin,
    admins,
    deleteAdmin,
    isSaving
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
                        <div className="relative">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">비밀번호</label>
                            <input
                                type={showAdminPassword ? "text" : "password"}
                                value={adminForm.password || ''}
                                onChange={e => setAdminForm({ ...adminForm, password: e.target.value })}
                                className="w-full bg-gray-50 p-3 rounded-xl font-bold border border-gray-100 focus:border-bee-black outline-none text-xs"
                            />
                            <button
                                onClick={() => setShowAdminPassword(!showAdminPassword)}
                                className="absolute right-3 top-9 text-gray-400 hover:text-bee-black"
                            >
                                <i className={`fa-solid ${showAdminPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                            </button>
                        </div>
                        <button
                            onClick={saveAdmin}
                            disabled={isSaving}
                            className="w-full py-4 bg-bee-black text-white font-black rounded-2xl shadow-lg hover:bg-gray-800 transition-colors disabled:opacity-50"
                        >
                            {isSaving ? <i className="fa-solid fa-spinner animate-spin"></i> : (adminForm.id ? '수정 저장' : '계정 생성')}
                        </button>
                    </div>
                </div>
                <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">
                    {admins.map(admin => (
                        <div key={admin.id} className="bg-white p-6 rounded-[24px] md:rounded-[30px] border border-gray-100 shadow-sm flex items-center justify-between group h-fit">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-2xl bg-gray-50 flex items-center justify-center text-bee-black font-black text-lg">
                                    {(admin.name || '?').charAt(0)}
                                </div>
                                <div>
                                    <h4 className="font-black text-lg text-bee-black">{admin.name}</h4>
                                    <p className="text-xs font-bold text-gray-400">{admin.jobTitle}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <button onClick={() => setAdminForm(admin)} className="w-9 h-9 rounded-full bg-gray-50 text-gray-400 hover:text-blue-500 hover:bg-blue-50 transition-all flex items-center justify-center"><i className="fa-solid fa-pen text-xs"></i></button>
                                <button onClick={() => deleteAdmin(admin.id)} className="w-9 h-9 rounded-full bg-gray-50 text-gray-400 hover:text-red-500 hover:bg-red-50 transition-all flex items-center justify-center"><i className="fa-solid fa-trash text-xs"></i></button>
                            </div>
                        </div>
                    ))}
                    {admins.length === 0 && (
                        <div className="col-span-full py-20 text-center text-gray-300 font-bold bg-white rounded-[40px] border border-gray-100">
                            등록된 관리자 계정이 없습니다.
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default HRTab;
