import React from 'react';
import { PrivacyPolicyData } from '../../types';

interface PrivacyEditorTabProps {
    privacyForm: PrivacyPolicyData;
    setPrivacyForm: (p: PrivacyPolicyData) => void;
    savePrivacy: () => void;
    addPrivacyArticle: () => void;
    updatePrivacyArticle: (idx: number, field: string, val: string) => void;
    removePrivacyArticle: (idx: number) => void;
    isSaving: boolean;
}

const PrivacyEditorTab: React.FC<PrivacyEditorTabProps> = ({
    privacyForm,
    setPrivacyForm,
    savePrivacy,
    addPrivacyArticle,
    updatePrivacyArticle,
    removePrivacyArticle,
    isSaving
}) => {
    return (
        <div className="space-y-6 md:space-y-8 animate-fade-in-up">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl md:text-3xl font-black tracking-tight">개인정보처리방침 수정</h1>
                <button onClick={savePrivacy} disabled={isSaving} className="px-6 py-3 bg-bee-black text-bee-yellow font-black rounded-xl shadow-lg hover:scale-105 transition-all disabled:opacity-50">
                    {isSaving ? <i className="fa-solid fa-spinner animate-spin mr-2"></i> : <i className="fa-solid fa-floppy-disk mr-2"></i>}
                    저장 (Publish)
                </button>
            </div>

            <div className="bg-white p-6 md:p-8 rounded-[30px] shadow-sm border border-gray-100 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">제목</label>
                        <input
                            value={privacyForm.title}
                            onChange={e => setPrivacyForm({ ...privacyForm, title: e.target.value })}
                            className="w-full bg-gray-50 p-3 rounded-xl font-bold border border-gray-100 focus:border-bee-black outline-none"
                        />
                    </div>
                    <div>
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">최종 수정일 문구</label>
                        <input
                            value={privacyForm.last_updated}
                            onChange={e => setPrivacyForm({ ...privacyForm, last_updated: e.target.value })}
                            className="w-full bg-gray-50 p-3 rounded-xl font-bold border border-gray-100 focus:border-bee-black outline-none"
                        />
                    </div>
                </div>

                <div className="space-y-4">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">본문 항목 (Articles)</label>
                    {privacyForm.content.map((item, idx) => (
                        <div key={idx} className="bg-gray-50 p-4 rounded-2xl border border-gray-100 relative group">
                            <button onClick={() => removePrivacyArticle(idx)} className="absolute top-2 right-2 w-8 h-8 bg-white text-red-400 hover:text-red-600 rounded-full flex items-center justify-center shadow-sm opacity-0 group-hover:opacity-100 transition-all">
                                <i className="fa-solid fa-trash"></i>
                            </button>
                            <input
                                value={item.title}
                                onChange={e => updatePrivacyArticle(idx, 'title', e.target.value)}
                                placeholder="항목 제목 (예: 제1조 목적)"
                                className="w-full bg-transparent font-black text-lg mb-2 outline-none placeholder-gray-300"
                            />
                            <textarea
                                value={item.text}
                                onChange={e => updatePrivacyArticle(idx, 'text', e.target.value)}
                                placeholder="항목 내용을 입력하세요..."
                                className="w-full bg-white p-3 rounded-xl text-sm leading-relaxed border border-gray-200 outline-none h-32 resize-y"
                            />
                        </div>
                    ))}
                    <button onClick={addPrivacyArticle} className="w-full py-3 border-2 border-dashed border-gray-200 text-gray-400 font-bold rounded-2xl hover:border-bee-black hover:text-bee-black transition-all">
                        <i className="fa-solid fa-plus mr-2"></i> 항목 추가
                    </button>
                </div>
            </div>
        </div>
    );
};

export default PrivacyEditorTab;
