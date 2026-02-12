import React from 'react';
import { SystemNotice } from '../../types';

interface NoticeTabProps {
    notice: SystemNotice;
    setNotice: (n: SystemNotice) => void;
    handleNoticeImageUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
    saveNotice: () => void;
}

const NoticeTab: React.FC<NoticeTabProps> = ({
    notice,
    setNotice,
    handleNoticeImageUpload,
    saveNotice
}) => {
    return (
        <div className="space-y-6 md:space-y-8 animate-fade-in-up">
            <h1 className="text-2xl md:text-3xl font-black tracking-tight mb-2">공지사항 팝업 관리</h1>
            <div className="bg-white p-6 md:p-10 rounded-[30px] md:rounded-[40px] shadow-sm border border-gray-100">
                <div className="flex items-center gap-4 mb-8">
                    <h3 className="text-lg md:text-xl font-black flex items-center gap-3"><span className="w-2 h-8 bg-red-500 rounded-full"></span>팝업 설정</h3>
                    <div
                        onClick={() => setNotice({ ...notice, isActive: !notice.isActive })}
                        className={`w-14 h-8 rounded-full p-1 cursor-pointer transition-colors duration-300 flex items-center ${notice.isActive ? 'bg-red-500 justify-end' : 'bg-gray-200 justify-start'}`}
                    >
                        <div className="w-6 h-6 rounded-full bg-white shadow-md"></div>
                    </div>
                    <span className="text-xs font-bold text-gray-500">{notice.isActive ? 'ON' : 'OFF'}</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-4">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">공지 이미지 (URL 또는 업로드)</label>
                        <input
                            value={notice.imageUrl}
                            onChange={e => setNotice({ ...notice, imageUrl: e.target.value })}
                            placeholder="https://..."
                            className="w-full bg-gray-50 p-4 rounded-2xl font-bold border-2 border-transparent focus:border-red-500 outline-none text-xs"
                        />
                        <label className="cursor-pointer bg-gray-100 px-4 py-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 hover:bg-gray-200 transition-all">
                            <i className="fa-solid fa-upload"></i> 이미지 업로드
                            <input type="file" accept="image/*" className="hidden" onChange={handleNoticeImageUpload} />
                        </label>

                        {notice.imageUrl && (
                            <div className="w-full h-48 rounded-2xl overflow-hidden border border-gray-100 mt-2">
                                <img src={notice.imageUrl} alt="Preview" className="w-full h-full object-cover" />
                            </div>
                        )}
                    </div>
                    <div className="space-y-4">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">공지 텍스트 내용</label>
                        <textarea
                            value={notice.content}
                            onChange={e => setNotice({ ...notice, content: e.target.value })}
                            placeholder="공지사항 내용을 입력하세요..."
                            className="w-full h-64 bg-gray-50 p-4 rounded-2xl font-medium border-2 border-transparent focus:border-red-500 outline-none text-sm resize-none"
                        />
                    </div>
                </div>
                <div className="flex justify-end pt-8">
                    <button onClick={saveNotice} className="w-full md:w-auto px-12 py-4 bg-bee-black text-white font-black rounded-2xl shadow-xl">공지사항 저장</button>
                </div>
            </div>
        </div>
    );
};

export default NoticeTab;
