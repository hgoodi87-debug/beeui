import React, { useState } from 'react';
import { StorageService } from '../../services/storageService';

interface BranchStaffTabProps {
    staff: any[];
    branchId: string;
}

const BranchStaffTab: React.FC<BranchStaffTabProps> = ({ staff, branchId }) => {
    const [staffForm, setStaffForm] = useState<any>({});
    const [showPassword, setShowPassword] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    const handleSave = async () => {
        if (!staffForm.name || (!staffForm.id && !staffForm.password)) {
            alert('이름과 비밀번호는 필수입니다.');
            return;
        }
        setIsSaving(true);
        try {
            await StorageService.saveAdmin({
                ...staffForm,
                branchId,
                role: 'staff',
                createdAt: staffForm.createdAt || new Date().toISOString()
            } as any);
            alert('직원 정보가 저장되었습니다.');
            setStaffForm({});
            setShowPassword(false);
        } catch (e) {
            console.error(e);
            alert('저장 실패');
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('정말 삭제하시겠습니까?')) return;
        try {
            await StorageService.deleteAdmin(id);
        } catch (e) {
            console.error(e);
            alert('삭제 실패');
        }
    };

    return (
        <div className="p-6 md:p-8 space-y-8 animate-fade-in-up">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="space-y-6">
                    <div className="bg-gray-50 p-6 rounded-[30px] border border-gray-100 space-y-4">
                        <h3 className="text-sm font-black flex items-center gap-2">
                            <div className="w-1.5 h-4 bg-bee-black rounded-full" />
                            {staffForm.id ? '직원 수정' : '직원 등록'}
                        </h3>
                        <div className="space-y-3">
                            <div>
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">이름</label>
                                <input
                                    value={staffForm.name || ''}
                                    onChange={e => setStaffForm({ ...staffForm, name: e.target.value })}
                                    className="w-full bg-white p-3 rounded-xl font-bold border border-gray-100 focus:border-bee-black outline-none text-xs"
                                    placeholder="성함 입력"
                                />
                            </div>
                            <div>
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">직책</label>
                                <input
                                    value={staffForm.jobTitle || ''}
                                    onChange={e => setStaffForm({ ...staffForm, jobTitle: e.target.value })}
                                    className="w-full bg-white p-3 rounded-xl font-bold border border-gray-100 focus:border-bee-black outline-none text-xs"
                                    placeholder="Manager, Staff 등"
                                />
                            </div>
                            <div className="relative">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">비밀번호</label>
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    value={staffForm.password || ''}
                                    onChange={e => setStaffForm({ ...staffForm, password: e.target.value })}
                                    className="w-full bg-white p-3 rounded-xl font-black border border-gray-100 focus:border-bee-black outline-none text-xs tracking-widest"
                                    placeholder="••••"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-[34px] text-gray-300 hover:text-bee-black transition-colors"
                                    title="비밀번호 보기 토글"
                                    aria-label="비밀번호 보기 토글"
                                >
                                    <i className={`fa-solid ${showPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                                </button>
                            </div>
                        </div>
                        <button
                            onClick={handleSave}
                            disabled={isSaving}
                            className={`w-full py-4 rounded-2xl font-black text-xs transition-all shadow-lg ${isSaving ? 'bg-gray-100 text-gray-400' : 'bg-bee-black text-bee-yellow hover:scale-[1.02]'}`}
                        >
                            {isSaving ? '처리 중...' : staffForm.id ? '수정 완료' : '직원 추가'}
                        </button>
                        {staffForm.id && (
                            <button onClick={() => { setStaffForm({}); setShowPassword(false); }} className="w-full py-2 text-[10px] font-bold text-gray-400">
                                취소
                            </button>
                        )}
                    </div>
                </div>

                <div className="lg:col-span-2 space-y-3">
                    <div className="flex items-center justify-between px-2">
                        <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest">직원 명단 ({staff.length})</div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-2">
                        {staff.map(s => (
                            <div key={s.id} className="bg-white p-3 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between group hover:border-bee-yellow transition-all">
                                <div className="flex items-center gap-2.5">
                                    <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center font-black text-[10px] text-gray-300 group-hover:bg-bee-yellow group-hover:text-bee-black transition-colors">
                                        {s.name?.slice(0, 1)}
                                    </div>
                                    <div className="min-w-0">
                                        <div className="font-black text-bee-black text-xs truncate">{s.name}</div>
                                        <div className="text-[9px] font-bold text-gray-400 italic truncate">{s.jobTitle || 'Staff'}</div>
                                    </div>
                                </div>
                                <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity ml-2 shrink-0">
                                    <button onClick={() => setStaffForm(s)} className="p-1.5 text-gray-300 hover:text-bee-black" title="수정">
                                        <i className="fa-solid fa-pen-to-square text-[9px]"></i>
                                    </button>
                                    <button onClick={() => handleDelete(s.id)} className="p-1.5 text-gray-300 hover:text-red-500" title="삭제">
                                        <i className="fa-solid fa-trash-can text-[9px]"></i>
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                    {staff.length === 0 && (
                        <div className="py-10 text-center border-2 border-dashed border-gray-100 rounded-3xl text-[10px] font-bold text-gray-300">
                            등록된 직원이 없습니다.
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default BranchStaffTab;
