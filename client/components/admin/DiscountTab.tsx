import React, { useState, useEffect } from 'react';
import { DiscountCode } from '../../types';
import { StorageService } from '../../services/storageService';

const DiscountTab: React.FC = () => {
    const [codes, setCodes] = useState<DiscountCode[]>([]);
    const [form, setForm] = useState<Partial<DiscountCode>>({
        code: '',
        amountPerBag: 0,
        description: '',
        isActive: true,
        allowedService: 'ALL'
    });
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        const unsub = StorageService.subscribeDiscountCodes(setCodes);
        return () => unsub();
    }, []);

    const handleSave = async () => {
        if (!form.code || form.amountPerBag === undefined) {
            alert('코드와 할인 금액을 입력해주세요.');
            return;
        }

        setIsSaving(true);
        try {
            await StorageService.saveDiscountCode({
                ...form,
                code: form.code.toUpperCase().trim(),
                allowedService: form.allowedService || 'ALL'
            } as DiscountCode);
            setForm({ code: '', amountPerBag: 0, description: '', isActive: true, allowedService: 'ALL' });
            alert('할인 코드가 저장되었습니다.');
        } catch (e) {
            console.error(e);
            alert('저장 실패');
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('정말로 이 할인 코드를 삭제하시겠습니까?')) return;
        try {
            await StorageService.deleteDiscountCode(id);
        } catch (e) {
            console.error(e);
            alert('삭제 실패');
        }
    };

    const toggleActive = async (code: DiscountCode) => {
        try {
            await StorageService.saveDiscountCode({ ...code, isActive: !code.isActive });
        } catch (e) {
            console.error(e);
        }
    };

    return (
        <div className="space-y-6 md:space-y-8 animate-fade-in-up">
            <h1 className="text-2xl md:text-3xl font-black tracking-tight">할인 코드 관리 (Promo Codes)</h1>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
                {/* 폼 섹션 */}
                <div className="bg-white p-6 md:p-8 rounded-[30px] md:rounded-[40px] shadow-sm border border-gray-100 h-fit space-y-6">
                    <h3 className="text-lg md:text-xl font-black flex items-center gap-3">
                        <span className="w-2 h-8 bg-bee-yellow rounded-full"></span>코드 생성/수정
                    </h3>
                    <div className="space-y-4">
                        <div>
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">할인 코드명 (UPPERCASE)</label>
                            <input
                                value={form.code}
                                onChange={e => setForm({ ...form, code: e.target.value.toUpperCase() })}
                                placeholder="예: WELCOME5000"
                                className="w-full bg-gray-50 p-3 rounded-xl font-bold border border-gray-100 focus:border-bee-yellow outline-none text-xs"
                            />
                        </div>
                        <div>
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">가방당 할인 금액 (₩)</label>
                            <input
                                type="number"
                                value={form.amountPerBag}
                                onChange={e => setForm({ ...form, amountPerBag: Number(e.target.value) })}
                                placeholder="예: 5000"
                                className="w-full bg-gray-50 p-3 rounded-xl font-bold border border-gray-100 focus:border-bee-yellow outline-none text-xs"
                            />
                        </div>
                        <div>
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">설명 (메모)</label>
                            <input
                                value={form.description}
                                onChange={e => setForm({ ...form, description: e.target.value })}
                                placeholder="예: 신규 고객 이벤트 할인"
                                className="w-full bg-gray-50 p-3 rounded-xl font-bold border border-gray-100 focus:border-bee-yellow outline-none text-xs"
                            />
                        </div>
                        <div>
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">적용 가능 서비스</label>
                            <div className="flex gap-2">
                                {['ALL', 'DELIVERY', 'STORAGE'].map((type) => (
                                    <button
                                        key={type}
                                        onClick={() => setForm({ ...form, allowedService: type as any })}
                                        className={`flex-1 py-3 rounded-xl text-xs font-bold border transition-colors ${form.allowedService === type
                                            ? 'bg-bee-black text-bee-yellow border-bee-black'
                                            : 'bg-gray-50 text-gray-400 border-gray-100 hover:border-gray-200'
                                            }`}
                                    >
                                        {type === 'ALL' ? '전체' : type === 'DELIVERY' ? '배송' : '보관'}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <label className="flex items-center gap-2 text-xs font-bold cursor-pointer bg-gray-50 p-3 rounded-xl hover:bg-gray-100">
                            <input
                                type="checkbox"
                                checked={form.isActive}
                                onChange={e => setForm({ ...form, isActive: e.target.checked })}
                            />
                            활성화 상태 (Active)
                        </label>
                        <button
                            onClick={handleSave}
                            disabled={isSaving}
                            className="w-full py-4 bg-bee-black text-bee-yellow font-black rounded-2xl mt-4 shadow-lg hover:scale-[1.02] transition-transform flex items-center justify-center gap-2"
                        >
                            {isSaving ? <i className="fa-solid fa-spinner animate-spin"></i> : <i className="fa-solid fa-plus"></i>}
                            코드 생성/저장
                        </button>
                    </div>
                </div>

                {/* 목록 섹션 */}
                <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4 auto-rows-min">
                    {codes.map(c => (
                        <div key={c.id} className={`bg-white p-6 rounded-[30px] border shadow-sm transition-all relative ${c.isActive ? 'border-gray-100' : 'border-gray-200 opacity-60'}`}>
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <div className="flex gap-2 mb-2">
                                        <span className={`px-2 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest ${c.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-400'}`}>
                                            {c.isActive ? 'Active' : 'Inactive'}
                                        </span>
                                        <span className={`px-2 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest ${c.allowedService === 'DELIVERY' ? 'bg-blue-100 text-blue-700' :
                                            c.allowedService === 'STORAGE' ? 'bg-orange-100 text-orange-700' :
                                                'bg-purple-100 text-purple-700'
                                            }`}>
                                            {c.allowedService || 'ALL'}
                                        </span>
                                    </div>
                                    <h4 className="text-xl font-black text-bee-black">{c.code}</h4>
                                </div>
                                <div className="flex gap-2">
                                    <button onClick={() => toggleActive(c)} className="w-8 h-8 bg-gray-50 text-gray-400 hover:text-bee-black rounded-full flex items-center justify-center transition-colors">
                                        <i className={`fa-solid ${c.isActive ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                                    </button>
                                    <button onClick={() => handleDelete(c.id!)} className="w-8 h-8 bg-gray-50 text-gray-300 hover:text-red-500 rounded-full flex items-center justify-center transition-colors">
                                        <i className="fa-solid fa-trash text-xs"></i>
                                    </button>
                                </div>
                            </div>
                            <div className="flex justify-between items-end">
                                <div>
                                    <p className="text-xs text-gray-400 font-medium mb-1">{c.description || 'No description'}</p>
                                    <p className="text-sm font-bold text-bee-grey">가방당 <span className="text-bee-black">₩{c.amountPerBag.toLocaleString()}</span> 할인</p>
                                </div>
                                <button
                                    onClick={() => setForm(c)}
                                    className="text-[10px] font-black uppercase text-bee-yellow bg-bee-black px-3 py-1.5 rounded-lg hover:scale-105 transition-all"
                                >
                                    Edit
                                </button>
                            </div>
                        </div>
                    ))}
                    {codes.length === 0 && (
                        <div className="col-span-full py-20 text-center text-gray-400 font-bold bg-white rounded-[40px] border border-gray-100">
                            등록된 할인 코드가 없습니다.
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default DiscountTab;
