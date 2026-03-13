
import React, { useState, useEffect } from 'react';
import { QnaData, QnaItem } from '../../types';
import { StorageService } from '../../services/storageService';
import { HelpCircle, Plus, Trash2, Save, Loader2, ListTree, MessageSquareQuote } from 'lucide-react';

const QnaEditorTab: React.FC = () => {
    const [qnaForm, setQnaForm] = useState<QnaData>({
        title: 'Q&A',
        subtitle: '자주 묻는 질문들을 확인해 보세요.',
        categories: { 
            general: '일반', 
            booking: '예약/결제', 
            safety: '안전/보험', 
            locations: '지점안내' 
        },
        items: []
    });
    const [isSaving, setIsSaving] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchQna = async () => {
            setIsLoading(true);
            try {
                const savedQna = await StorageService.getQnaPolicy();
                if (savedQna) setQnaForm(savedQna);
            } catch (err) {
                console.error('Failed to load Q&A:', err);
            } finally {
                setIsLoading(false);
            }
        };
        fetchQna();
    }, []);

    const saveQna = async () => {
        setIsSaving(true);
        try {
            await StorageService.saveQnaPolicy(qnaForm);
            alert('Q&A 정보가 데이터베이스에 저장되었습니다. ✨');
        } catch (e) {
            console.error(e);
            alert('저장 도중 사고가 발생했습니다! 🚨');
        } finally {
            setIsSaving(false);
        }
    };

    const addQnaItem = () => {
        setQnaForm(prev => ({
            ...prev,
            items: [{ question: '', answer: '', category: 'general' }, ...prev.items]
        }));
    };

    const updateQnaItem = (idx: number, field: keyof QnaItem, val: string) => {
        setQnaForm(prev => {
            const newItems = [...prev.items];
            newItems[idx] = { ...newItems[idx], [field]: val };
            return { ...prev, items: newItems };
        });
    };

    const removeQnaItem = (idx: number) => {
        if (!confirm('이 항목을 정말 삭제할까요? 💅')) return;
        setQnaForm(prev => ({
            ...prev,
            items: prev.items.filter((_, i) => i !== idx)
        }));
    };

    const updateCategory = (key: string, val: string) => {
        setQnaForm(prev => ({
            ...prev,
            categories: { ...prev.categories, [key]: val }
        }));
    };

    if (isLoading) {
        return (
            <div className="p-20 text-center text-bee-black font-black uppercase tracking-widest animate-pulse">
                <Loader2 className="animate-spin mx-auto mb-4" />
                데이터를 분석하는 중... 잠시만요 💅
            </div>
        );
    }

    return (
        <div className="space-y-6 md:space-y-8 animate-fade-in-up pb-20">
            {/* Header Area */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl md:text-4xl font-black tracking-tighter mb-2">Q&A Management</h1>
                    <p className="text-gray-400 font-bold text-xs uppercase tracking-[0.2em] ml-1">
                        고객들의 궁금증을 실시간으로 해결해 줄 깍쟁이 가이드를 편집하세요. 💅
                    </p>
                </div>
                <button 
                    onClick={saveQna} 
                    disabled={isSaving} 
                    className="flex items-center gap-2 px-8 py-4 bg-bee-black text-bee-yellow font-black rounded-2xl shadow-xl hover:scale-105 active:scale-95 transition-all disabled:opacity-50 group"
                >
                    {isSaving ? <Loader2 className="animate-spin" size={20} /> : <Save className="group-hover:rotate-12 transition-transform" size={20} />}
                    확정 도장 찍기 (Publish)
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column: Config */}
                <div className="lg:col-span-1 space-y-8">
                    <div className="bg-white p-8 rounded-[40px] shadow-sm border border-gray-100 space-y-8">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="w-10 h-10 bg-bee-yellow/10 rounded-xl flex items-center justify-center text-bee-black">
                                <HelpCircle size={20} />
                            </div>
                            <h2 className="text-xl font-black">Basic Info</h2>
                        </div>
                        
                        <div className="space-y-6">
                            <div>
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 mb-2 block">페이지 제목</label>
                                <input
                                    value={qnaForm.title}
                                    title="페이지 제목"
                                    onChange={e => setQnaForm({ ...qnaForm, title: e.target.value })}
                                    className="w-full bg-gray-50 p-4 rounded-2xl font-bold border border-transparent focus:border-bee-yellow focus:bg-white outline-none transition-all"
                                />
                            </div>
                            <div>
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 mb-2 block">서브 타이틀 (설명)</label>
                                <textarea
                                    value={qnaForm.subtitle}
                                    title="서브 타이틀 (설명)"
                                    onChange={e => setQnaForm({ ...qnaForm, subtitle: e.target.value })}
                                    className="w-full bg-gray-50 p-4 rounded-2xl font-bold border border-transparent focus:border-bee-yellow focus:bg-white outline-none transition-all h-24 resize-none"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="bg-white p-8 rounded-[40px] shadow-sm border border-gray-100 space-y-8">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="w-10 h-10 bg-bee-yellow/10 rounded-xl flex items-center justify-center text-bee-black">
                                <ListTree size={20} />
                            </div>
                            <h2 className="text-xl font-black">Categories</h2>
                        </div>
                        
                        <div className="space-y-4">
                            {Object.keys(qnaForm.categories).map((key) => (
                                <div key={key}>
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 mb-2 block">ID: {key}</label>
                                    <input
                                        value={qnaForm.categories[key]}
                                        title={`카테고리명: ${key}`}
                                        onChange={e => updateCategory(key, e.target.value)}
                                        className="w-full bg-gray-50 p-4 rounded-2xl font-bold border border-transparent focus:border-bee-yellow focus:bg-white outline-none transition-all"
                                    />
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Right Column: Q&A Items */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="flex justify-between items-center mb-2 px-2">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-bee-yellow/10 rounded-xl flex items-center justify-center text-bee-black">
                                <MessageSquareQuote size={20} />
                            </div>
                            <h2 className="text-xl font-black">Questions & Answers ({qnaForm.items.length})</h2>
                        </div>
                        <button 
                            onClick={addQnaItem} 
                            className="p-4 bg-bee-yellow text-bee-black rounded-2xl shadow-lg hover:scale-110 active:scale-95 transition-all flex items-center gap-2 font-black text-xs uppercase"
                        >
                            <Plus size={18} /> 새 질문 추가
                        </button>
                    </div>

                    <div className="space-y-4">
                        {qnaForm.items.map((item, idx) => (
                            <div key={idx} className="bg-white p-6 md:p-8 rounded-[40px] border border-gray-100 shadow-sm relative group animate-fade-in-up">
                                <button 
                                    onClick={() => removeQnaItem(idx)} 
                                    title="질문 삭제"
                                    className="absolute top-6 right-6 p-3 bg-red-50 text-red-400 hover:bg-red-500 hover:text-white rounded-xl transition-all opacity-0 group-hover:opacity-100"
                                >
                                    <Trash2 size={18} />
                                </button>
                                
                                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                                    <div className="md:col-span-1">
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 mb-2 block">카테고리 선택</label>
                                        <select
                                            value={item.category}
                                            title="카테고리 선택"
                                            onChange={e => updateQnaItem(idx, 'category', e.target.value)}
                                            className="w-full bg-gray-50 p-4 rounded-2xl font-bold border border-transparent focus:border-bee-yellow outline-none appearance-none cursor-pointer"
                                        >
                                            {Object.keys(qnaForm.categories).map(k => (
                                                <option key={k} value={k}>{qnaForm.categories[k]}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="md:col-span-3">
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 mb-2 block">질문 (Question)</label>
                                        <input
                                            value={item.question}
                                            onChange={e => updateQnaItem(idx, 'question', e.target.value)}
                                            placeholder="예: Beeliber는 어떤 도구인가요?"
                                            className="w-full bg-gray-50 p-4 rounded-2xl font-black text-lg border border-transparent focus:border-bee-yellow outline-none placeholder-gray-300 transition-all"
                                        />
                                    </div>
                                    <div className="md:col-span-4">
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 mb-2 block">답변 (Answer)</label>
                                        <textarea
                                            value={item.answer}
                                            onChange={e => updateQnaItem(idx, 'answer', e.target.value)}
                                            placeholder="상세한 답변 내용을 입력하세요..."
                                            className="w-full bg-gray-50 p-6 rounded-[32px] font-bold text-gray-600 border border-transparent focus:border-bee-yellow focus:bg-white outline-none h-40 resize-y transition-all leading-relaxed"
                                        />
                                    </div>
                                </div>
                            </div>
                        ))}
                        
                        {qnaForm.items.length === 0 && (
                            <div className="py-20 bg-white rounded-[48px] border-2 border-dashed border-gray-100 text-center">
                                <HelpCircle size={48} className="mx-auto text-gray-200 mb-4" />
                                <p className="text-gray-400 font-bold">아직 질문이 없습니다. 첫 번째 질문을 등록해 보세요! ✨</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default QnaEditorTab;
