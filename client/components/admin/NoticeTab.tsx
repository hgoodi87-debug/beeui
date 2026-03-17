import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { SystemNotice } from '../../types';

interface NoticeTabProps {
    notices: SystemNotice[];
    noticeForm: Partial<SystemNotice>;
    setNoticeForm: (f: Partial<SystemNotice>) => void;
    handleNoticeImageUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
    saveNotice: () => void;
    deleteNotice: (id: string) => void;
    isSaving: boolean;
}

const CATEGORY_MAP = {
    NOTICE: { label: '공지', color: 'bg-blue-500' },
    NEWS: { label: '뉴스', color: 'bg-emerald-500' },
    EVENT: { label: '이벤트', color: 'bg-purple-500' },
    FAQ: { label: 'FAQ', color: 'bg-orange-500' }
};

const NoticeTab: React.FC<NoticeTabProps> = ({
    notices,
    noticeForm,
    setNoticeForm,
    handleNoticeImageUpload,
    saveNotice,
    deleteNotice,
    isSaving
}) => {
    const [isPanelOpen, setIsPanelOpen] = useState(false);
    const [filter, setFilter] = useState<'ALL' | 'NOTICE' | 'NEWS' | 'EVENT' | 'FAQ'>('ALL');

    const filteredNotices = notices.filter(n => filter === 'ALL' || n.category === filter);

    const handleEdit = (notice: SystemNotice) => {
        setNoticeForm(notice);
        setIsPanelOpen(true);
    };

    const handleCreateNew = () => {
        setNoticeForm({
            title: '',
            category: 'NOTICE',
            isActive: true,
            imageUrl: '',
            content: ''
        });
        setIsPanelOpen(true);
    };

    return (
        <div className="space-y-8 animate-fade-in-up relative">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black tracking-tight mb-2">컨텐츠 및 공지 관리 👥📢</h1>
                    <p className="text-gray-500 text-sm font-bold">시스템 전반의 공지사항 및 운영 컨텐츠를 통합 관리합니다. 💅</p>
                </div>
                <button
                    onClick={handleCreateNew}
                    className="px-8 py-4 bg-bee-black text-white font-black rounded-2xl shadow-xl hover:scale-105 transition-all flex items-center gap-3"
                >
                    <i className="fa-solid fa-plus"></i> 신규 컨텐츠 등록
                </button>
            </div>

            {/* 필터 섹션 */}
            <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2">
                {['ALL', 'NOTICE', 'NEWS', 'EVENT', 'FAQ'].map((cat) => (
                    <button
                        key={cat}
                        onClick={() => setFilter(cat as any)}
                        className={`px-6 py-2.5 rounded-full text-xs font-black transition-all whitespace-nowrap ${
                            filter === cat 
                            ? 'bg-bee-black text-bee-yellow shadow-lg' 
                            : 'bg-white text-gray-400 hover:text-bee-black border border-gray-100'
                        }`}
                    >
                        {cat === 'ALL' ? '전체 보기' : CATEGORY_MAP[cat as keyof typeof CATEGORY_MAP].label}
                    </button>
                ))}
            </div>

            {/* 목록 섹션 */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                <AnimatePresence mode="popLayout">
                    {filteredNotices.map((notice) => (
                        <motion.div
                            key={notice.id}
                            layout
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            className="bg-white rounded-[32px] overflow-hidden shadow-sm border border-gray-100 hover:shadow-xl transition-all group flex flex-col h-[400px]"
                        >
                            <div className="relative h-48 overflow-hidden bg-gray-50">
                                {notice.imageUrl ? (
                                    <img src={notice.imageUrl} alt={notice.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-gray-300">
                                        <i className="fa-solid fa-image text-4xl"></i>
                                    </div>
                                )}
                                <div className={`absolute top-4 left-4 px-3 py-1 rounded-full text-[10px] font-black text-white ${CATEGORY_MAP[notice.category]?.color || 'bg-gray-400'} uppercase tracking-widest`}>
                                    {CATEGORY_MAP[notice.category]?.label || notice.category}
                                </div>
                                <div className={`absolute top-4 right-4 w-3 h-3 rounded-full ${notice.isActive ? 'bg-green-500 shadow-[0_0_12px_rgba(34,197,94,0.6)]' : 'bg-gray-300'} border-2 border-white`}></div>
                            </div>

                            <div className="p-6 flex-1 flex flex-col">
                                <h3 className="text-lg font-black text-bee-black mb-2 line-clamp-1">{notice.title}</h3>
                                <p className="text-gray-500 text-sm font-medium line-clamp-3 mb-4 flex-1">{notice.content}</p>
                                
                                <div className="flex items-center justify-between pt-4 border-t border-gray-50 mt-auto">
                                    <span className="text-[10px] font-bold text-gray-300">{notice.createdAt?.split('T')[0] || '날짜 없음'}</span>
                                    <div className="flex gap-2">
                                        <button 
                                            onClick={() => handleEdit(notice)}
                                            className="w-10 h-10 rounded-xl bg-gray-50 text-gray-500 hover:bg-bee-black hover:text-bee-yellow transition-all flex items-center justify-center"
                                            title="컨텐츠 수정하기"
                                        >
                                            <i className="fa-solid fa-pen-to-square"></i>
                                        </button>
                                        <button 
                                            onClick={() => deleteNotice(notice.id!)}
                                            className="w-10 h-10 rounded-xl bg-gray-50 text-gray-400 hover:bg-red-500 hover:text-white transition-all flex items-center justify-center"
                                            title="컨텐츠 삭제하기"
                                        >
                                            <i className="fa-solid fa-trash-can"></i>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </AnimatePresence>

                {filteredNotices.length === 0 && (
                    <div className="col-span-full py-20 bg-white/50 border-2 border-dashed border-gray-200 rounded-[40px] flex flex-col items-center justify-center text-gray-400">
                        <i className="fa-solid fa-box-open text-4xl mb-4"></i>
                        <p className="font-bold">등록된 컨텐츠가 없습니다. 신규 등록을 시작해 보세요! 💅</p>
                    </div>
                )}
            </div>

            {/* Slide-over Editor Panel */}
            <AnimatePresence>
                {isPanelOpen && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsPanelOpen(false)}
                            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100]"
                        />
                        <motion.div
                            initial={{ x: '100%' }}
                            animate={{ x: 0 }}
                            exit={{ x: '100%' }}
                            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                            className="fixed inset-y-0 right-0 w-full max-w-2xl bg-white shadow-2xl z-[101] flex flex-col"
                        >
                            <div className="p-8 border-b border-gray-100 flex items-center justify-between bg-white sticky top-0 z-10">
                                <div>
                                    <h2 className="text-2xl font-black text-bee-black">컨텐츠 편집기 ✍️</h2>
                                    <p className="text-xs font-bold text-gray-400 mt-1 uppercase tracking-widest">Notice & Contents Editor</p>
                                </div>
                                <button
                                    onClick={() => setIsPanelOpen(false)}
                                    className="w-12 h-12 bg-gray-50 hover:bg-gray-100 rounded-2xl flex items-center justify-center transition-all"
                                    title="편집기 닫기"
                                >
                                    <i className="fa-solid fa-xmark text-xl text-gray-400"></i>
                                </button>
                            </div>

                            <div className="flex-1 overflow-y-auto p-8 space-y-8 no-scrollbar">
                                {/* 활성화 토글 */}
                                <div className="flex items-center justify-between p-6 bg-gray-50 rounded-[24px]">
                                    <div>
                                        <h4 className="font-black text-bee-black">게시 상태</h4>
                                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">Active Status</p>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <span className={`text-[10px] font-black ${noticeForm.isActive ? 'text-green-500' : 'text-gray-400'}`}>
                                            {noticeForm.isActive ? '게시 중 (ON)' : '비활성 (OFF)'}
                                        </span>
                                        <div
                                            onClick={() => setNoticeForm({ ...noticeForm, isActive: !noticeForm.isActive })}
                                            className={`w-14 h-8 rounded-full p-1 cursor-pointer transition-colors duration-300 flex items-center ${noticeForm.isActive ? 'bg-green-500 justify-end' : 'bg-gray-300 justify-start'}`}
                                        >
                                            <div className="w-6 h-6 rounded-full bg-white shadow-lg shadow-black/10"></div>
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">카테고리</label>
                                        <select
                                            value={noticeForm.category}
                                            onChange={e => setNoticeForm({ ...noticeForm, category: e.target.value as any })}
                                            title="컨텐츠 카테고리 선택"
                                            className="w-full bg-gray-50 p-4 rounded-2xl font-bold border-2 border-transparent focus:border-bee-yellow outline-none text-sm cursor-pointer transition-all"
                                        >
                                            {Object.entries(CATEGORY_MAP).map(([key, value]) => (
                                                <option key={key} value={key}>{value.label}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">제목</label>
                                        <input
                                            value={noticeForm.title}
                                            onChange={e => setNoticeForm({ ...noticeForm, title: e.target.value })}
                                            placeholder="공지사항 제목을 입력하세요..."
                                            title="컨텐츠 제목 입력"
                                            className="w-full bg-gray-50 p-4 rounded-2xl font-bold border-2 border-transparent focus:border-bee-yellow outline-none text-sm transition-all"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">대표 이미지</label>
                                    <div className="relative group border-2 border-dashed border-gray-100 rounded-[32px] p-2 transition-all hover:border-bee-yellow bg-gray-50/30">
                                        {noticeForm.imageUrl ? (
                                            <div className="relative h-64 rounded-[24px] overflow-hidden group">
                                                <img src={noticeForm.imageUrl} alt="Notice" className="w-full h-full object-cover" />
                                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                                    <label className="cursor-pointer px-4 py-2 bg-white rounded-xl text-xs font-black shadow-xl hover:scale-105 transition-transform">
                                                        변경
                                                        <input type="file" accept="image/*" className="hidden" onChange={handleNoticeImageUpload} />
                                                    </label>
                                                    <button 
                                                        onClick={() => setNoticeForm({ ...noticeForm, imageUrl: '' })}
                                                        className="px-4 py-2 bg-red-500 text-white rounded-xl text-xs font-black shadow-xl hover:scale-105 transition-transform"
                                                    >
                                                        삭제
                                                    </button>
                                                </div>
                                            </div>
                                        ) : (
                                            <label className="flex flex-col items-center justify-center h-64 cursor-pointer">
                                                <div className="w-16 h-16 bg-white rounded-2xl shadow-sm flex items-center justify-center text-gray-300 mb-4 group-hover:text-bee-yellow transition-colors">
                                                    <i className="fa-solid fa-cloud-arrow-up text-2xl"></i>
                                                </div>
                                                <p className="text-xs font-black text-gray-400">클릭하거나 이미지를 드래그하여 업로드 💅</p>
                                                <input type="file" accept="image/*" className="hidden" onChange={handleNoticeImageUpload} />
                                            </label>
                                        )}
                                    </div>
                                    <input
                                        value={noticeForm.imageUrl}
                                        onChange={e => setNoticeForm({ ...noticeForm, imageUrl: e.target.value })}
                                        placeholder="또는 이미지 주소(HTTPS)를 직접 입력하세요..."
                                        title="이미지 직접 URL 입력"
                                        className="w-full bg-gray-50 p-4 rounded-2xl font-medium border border-gray-100 outline-none text-[10px] text-gray-400"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <div className="flex items-center justify-between mb-2 px-1">
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">상세 내용</label>
                                        <span className="text-[9px] font-bold text-gray-300">내용은 정성껏 작성해 주세요. 🙄</span>
                                    </div>
                                    <textarea
                                        value={noticeForm.content}
                                        onChange={e => setNoticeForm({ ...noticeForm, content: e.target.value })}
                                        placeholder="고객들에게 전달할 내용을 입력하세요..."
                                        title="상세 컨텐츠 내용 입력"
                                        className="w-full h-80 bg-gray-50 p-6 rounded-[28px] font-medium border-2 border-transparent focus:border-bee-yellow outline-none text-sm resize-none transition-all leading-relaxed"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">랜딩 URL (선택)</label>
                                        <input
                                            value={noticeForm.linkUrl || ''}
                                            onChange={e => setNoticeForm({ ...noticeForm, linkUrl: e.target.value })}
                                            placeholder="https://..."
                                            title="랜딩 URL 입력"
                                            className="w-full bg-gray-50 p-4 rounded-2xl font-bold border-2 border-transparent focus:border-bee-yellow outline-none text-xs transition-all"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">게시 기간 (선택)</label>
                                        <div className="flex items-center gap-2">
                                            <input
                                                type="date"
                                                value={noticeForm.startDate || ''}
                                                onChange={e => setNoticeForm({ ...noticeForm, startDate: e.target.value })}
                                                title="게시 시작일"
                                                className="flex-1 bg-gray-50 p-4 rounded-xl font-bold border-transparent outline-none text-[10px]"
                                            />
                                            <span className="text-gray-300 font-black">~</span>
                                            <input
                                                type="date"
                                                value={noticeForm.endDate || ''}
                                                onChange={e => setNoticeForm({ ...noticeForm, endDate: e.target.value })}
                                                title="게시 종료일"
                                                className="flex-1 bg-gray-50 p-4 rounded-xl font-bold border-transparent outline-none text-[10px]"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="p-8 border-t border-gray-100 bg-gray-50/50 flex gap-4">
                                <button
                                    onClick={() => setIsPanelOpen(false)}
                                    className="flex-1 px-8 py-4 bg-white border border-gray-200 text-gray-500 font-black rounded-2xl hover:bg-gray-100 transition-all"
                                >
                                    취소
                                </button>
                                <button
                                    onClick={async () => {
                                        await saveNotice();
                                        setIsPanelOpen(false);
                                    }}
                                    disabled={isSaving}
                                    className="flex-[2] px-8 py-4 bg-bee-black text-white font-black rounded-2xl shadow-xl shadow-bee-black/10 hover:translate-y-[-2px] active:translate-y-0 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                                >
                                    {isSaving ? (
                                        <i className="fa-solid fa-circle-notch animate-spin"></i>
                                    ) : (
                                        <i className="fa-solid fa-check"></i>
                                    )}
                                    컨텐츠 게시하기
                                </button>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
};

export default NoticeTab;
