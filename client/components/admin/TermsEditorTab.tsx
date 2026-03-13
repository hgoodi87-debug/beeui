import React, { useState, useEffect } from 'react';
import { TermsPolicyData } from '../../types';
import { StorageService } from '../../services/storageService';

const TermsEditorTab: React.FC = () => {
    const [termsForm, setTermsForm] = useState<TermsPolicyData>({
        title: '서비스 이용약관',
        last_updated: '',
        intro: '',
        content: []
    });
    const [isSaving, setIsSaving] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchTerms = async () => {
            setIsLoading(true);
            try {
                const savedTerms = await StorageService.getTermsPolicy();
                if (savedTerms) setTermsForm(savedTerms);
            } catch (err) {
                console.error('Failed to load Terms Policy:', err);
            } finally {
                setIsLoading(false);
            }
        };
        fetchTerms();
    }, []);

    const saveTerms = async () => {
        setIsSaving(true);
        try {
            await StorageService.saveTermsPolicy(termsForm);
            alert('이용약관이 저장되었습니다.');
        } catch (e) {
            console.error(e);
            alert('저장 실패!');
        } finally {
            setIsSaving(false);
        }
    };

    const addTermsArticle = () => {
        setTermsForm(prev => ({
            ...prev,
            content: [...prev.content, { title: '', text: '' }]
        }));
    };

    const updateTermsArticle = (idx: number, field: 'title' | 'text', val: string) => {
        setTermsForm(prev => {
            const newContent = [...prev.content];
            newContent[idx] = { ...newContent[idx], [field]: val };
            return { ...prev, content: newContent };
        });
    };

    const removeTermsArticle = (idx: number) => {
        setTermsForm(prev => ({
            ...prev,
            content: prev.content.filter((_, i) => i !== idx)
        }));
    };

    if (isLoading) {
        return <div className="p-8 text-center text-gray-500 font-bold"><i className="fa-solid fa-spinner animate-spin mr-2"></i> 데이터를 불러오는 중...</div>;
    }

    return (
        <div className="space-y-6 md:space-y-8 animate-fade-in-up">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl md:text-3xl font-black tracking-tight">서비스 이용약관 수정</h1>
                <button onClick={saveTerms} disabled={isSaving} className="px-6 py-3 bg-bee-black text-bee-yellow font-black rounded-xl shadow-lg hover:scale-105 transition-all disabled:opacity-50">
                    {isSaving ? <i className="fa-solid fa-spinner animate-spin mr-2"></i> : <i className="fa-solid fa-floppy-disk mr-2"></i>}
                    저장 (Publish)
                </button>
            </div>

            <div className="bg-white p-6 md:p-8 rounded-[30px] shadow-sm border border-gray-100 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">제목</label>
                        <input
                            value={termsForm.title}
                            onChange={e => setTermsForm({ ...termsForm, title: e.target.value })}
                            className="w-full bg-gray-50 p-3 rounded-xl font-bold border border-gray-100 focus:border-bee-black outline-none"
                        />
                    </div>
                    <div>
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">최종 수정일 문구</label>
                        <input
                            value={termsForm.last_updated}
                            onChange={e => setTermsForm({ ...termsForm, last_updated: e.target.value })}
                            className="w-full bg-gray-50 p-3 rounded-xl font-bold border border-gray-100 focus:border-bee-black outline-none"
                        />
                    </div>
                </div>

                <div className="space-y-4">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">약관 조항 (Articles)</label>
                    {termsForm.content.map((item, idx) => (
                        <div key={idx} className="bg-gray-50 p-4 rounded-2xl border border-gray-100 relative group">
                            <button onClick={() => removeTermsArticle(idx)} className="absolute top-2 right-2 w-8 h-8 bg-white text-red-400 hover:text-red-600 rounded-full flex items-center justify-center shadow-sm opacity-0 group-hover:opacity-100 transition-all">
                                <i className="fa-solid fa-trash"></i>
                            </button>
                            <input
                                value={item.title}
                                onChange={e => updateTermsArticle(idx, 'title', e.target.value)}
                                placeholder="조항 제목 (예: 제1조 목적)"
                                className="w-full bg-transparent font-black text-lg mb-2 outline-none placeholder-gray-300"
                            />
                            <textarea
                                value={item.text}
                                onChange={e => updateTermsArticle(idx, 'text', e.target.value)}
                                placeholder="조항 내용을 입력하세요..."
                                className="w-full bg-white p-3 rounded-xl text-sm leading-relaxed border border-gray-200 outline-none h-32 resize-y"
                            />
                        </div>
                    ))}
                    <button onClick={addTermsArticle} className="w-full py-3 border-2 border-dashed border-gray-200 text-gray-400 font-bold rounded-2xl hover:border-bee-black hover:text-bee-black transition-all">
                        <i className="fa-solid fa-plus mr-2"></i> 조항 추가
                    </button>
                </div>
            </div>
        </div>
    );
};

export default TermsEditorTab;
