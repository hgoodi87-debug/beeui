import React from 'react';
import { useSearchParams } from 'react-router-dom';

interface TossPaymentFailPageProps {
    lang: string;
    onBackToBooking: () => void;
}

const TossPaymentFailPage: React.FC<TossPaymentFailPageProps> = ({ lang, onBackToBooking }) => {
    const [searchParams] = useSearchParams();
    const code = (searchParams.get('code') || '').trim();
    const message = (searchParams.get('message') || '').trim();

    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center px-6">
            <div className="max-w-md w-full bg-white rounded-[2rem] border border-gray-100 shadow-xl p-8 space-y-5">
                <div className="w-16 h-16 rounded-3xl bg-red-50 text-red-500 flex items-center justify-center text-3xl font-black mx-auto">
                    ×
                </div>
                <div className="text-center space-y-2">
                    <h1 className="text-2xl font-black italic tracking-tight text-bee-black">
                        {lang === 'ko' ? '결제가 완료되지 않았어요' : 'Payment was not completed'}
                    </h1>
                    <p className="text-sm font-bold text-gray-500 leading-relaxed whitespace-pre-line">
                        {message || (lang === 'ko'
                            ? '결제창에서 취소되었거나 승인 전에 멈췄어요. 같은 예약 내용을 다시 진행해 주세요.'
                            : 'The payment was cancelled or interrupted.')}
                    </p>
                    {code && (
                        <p className="text-xs font-black uppercase tracking-widest text-gray-400">
                            CODE: {code}
                        </p>
                    )}
                </div>
                <button
                    type="button"
                    onClick={onBackToBooking}
                    className="w-full h-14 rounded-2xl bg-bee-black text-bee-yellow font-black text-base"
                >
                    {lang === 'ko' ? '예약 페이지로 돌아가기' : 'Back to booking'}
                </button>
            </div>
        </div>
    );
};

export default TossPaymentFailPage;
