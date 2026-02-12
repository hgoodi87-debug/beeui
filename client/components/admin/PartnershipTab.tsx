import React from 'react';
import { PartnershipInquiry } from '../../types';

interface PartnershipTabProps {
    inquiries: PartnershipInquiry[];
    deleteInquiry: (id: string) => void;
}

const PartnershipTab: React.FC<PartnershipTabProps> = ({ inquiries, deleteInquiry }) => {
    return (
        <div className="space-y-6 md:space-y-8 animate-fade-in-up">
            <h1 className="text-2xl md:text-3xl font-black tracking-tight mb-2">제휴 문의 접수 현황</h1>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {inquiries.length > 0 ? inquiries.map(inq => (
                    <div key={inq.id} className="bg-white p-6 rounded-[30px] shadow-sm border border-gray-100 flex flex-col gap-4">
                        <div className="flex items-center justify-between">
                            <span className="text-[10px] font-black text-gray-300 uppercase tracking-widest">{inq.id}</span>
                            <span className="text-[10px] font-bold text-gray-400">{inq.createdAt}</span>
                        </div>
                        <div>
                            <h4 className="font-black text-lg text-bee-black mb-1">{inq.companyName}</h4>
                            <p className="text-xs font-bold text-bee-blue">{inq.contactName} ({inq.position})</p>
                        </div>
                        <div className="bg-gray-50 p-4 rounded-2xl flex flex-col gap-2">
                            <div className="flex items-center gap-2 text-xs font-bold text-gray-600">
                                <i className="fa-solid fa-phone text-[10px] text-gray-300"></i> {inq.phone}
                            </div>
                            <div className="flex items-center gap-2 text-xs font-bold text-gray-600">
                                <i className="fa-solid fa-envelope text-[10px] text-gray-300"></i> {inq.email}
                            </div>
                        </div>
                        <div className="flex-1">
                            <p className="text-xs text-gray-500 leading-relaxed font-medium line-clamp-4">{inq.message}</p>
                        </div>
                        <button
                            onClick={() => deleteInquiry(inq.id!)}
                            className="w-full py-3 bg-gray-50 text-gray-400 hover:bg-bee-black hover:text-bee-yellow rounded-xl text-[10px] font-black transition-all uppercase tracking-widest"
                        >
                            문의 처리 완료
                        </button>
                    </div>
                )) : (
                    <div className="col-span-full py-20 text-center text-gray-400 font-bold bg-white rounded-[40px] border border-gray-100">
                        접수된 문의가 없습니다.
                    </div>
                )}
            </div>
        </div>
    );
};

export default PartnershipTab;
