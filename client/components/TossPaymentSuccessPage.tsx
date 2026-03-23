import React, { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { BookingState } from '../types';
import { confirmTossPayment } from '../services/tossPaymentsService';

interface TossPaymentSuccessPageProps {
    lang: string;
    onBookingReady: (booking: BookingState) => void | Promise<void>;
    onBackToBooking: () => void;
}

const TossPaymentSuccessPage: React.FC<TossPaymentSuccessPageProps> = ({
    lang,
    onBookingReady,
    onBackToBooking
}) => {
    const [searchParams] = useSearchParams();
    const [errorMessage, setErrorMessage] = useState('');
    const [isProcessing, setIsProcessing] = useState(true);
    const hasStartedRef = useRef(false);

    useEffect(() => {
        if (hasStartedRef.current) {
            return;
        }
        hasStartedRef.current = true;

        const paymentKey = (searchParams.get('paymentKey') || '').trim();
        const orderId = (searchParams.get('orderId') || '').trim();
        const amount = Number(searchParams.get('amount') || '0');

        if (!paymentKey || !orderId || !Number.isFinite(amount) || amount < 0) {
            setIsProcessing(false);
            setErrorMessage(lang === 'ko'
                ? '결제 승인 정보를 제대로 받지 못했어요. 다시 예약 흐름으로 돌아가 주세요.'
                : 'Missing payment confirmation data.');
            return;
        }

        void (async () => {
            try {
                const result = await confirmTossPayment({ paymentKey, orderId, amount });
                await onBookingReady(result.booking);
            } catch (error) {
                console.error('[TossPaymentSuccessPage] confirm error:', error);
                setErrorMessage(
                    error instanceof Error
                        ? error.message
                        : (lang === 'ko'
                            ? '결제는 끝났는데 예약 확정에서 막혔어요. 다시 시도해 주세요.'
                            : 'Payment confirmation failed.')
                );
                setIsProcessing(false);
            }
        })();
    }, [lang, onBookingReady, searchParams]);

    if (isProcessing) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center px-6">
                <div className="max-w-md w-full bg-white rounded-[2rem] border border-gray-100 shadow-xl p-8 text-center space-y-4">
                    <div className="w-16 h-16 mx-auto rounded-3xl bg-bee-yellow text-bee-black flex items-center justify-center text-2xl font-black animate-pulse">
                        ₩
                    </div>
                    <h1 className="text-2xl font-black italic tracking-tight text-bee-black">
                        {lang === 'ko' ? '결제 승인 확인 중' : 'Confirming payment'}
                    </h1>
                    <p className="text-sm font-bold text-gray-500 leading-relaxed">
                        {lang === 'ko'
                            ? '토스 결제 승인과 예약 확정을 이어붙이는 중이에요. 이 화면에서 잠깐만 기다려 주세요.'
                            : 'Please wait while we confirm your payment and booking.'}
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center px-6">
            <div className="max-w-md w-full bg-white rounded-[2rem] border border-red-100 shadow-xl p-8 space-y-5">
                <div className="w-16 h-16 rounded-3xl bg-red-50 text-red-500 flex items-center justify-center text-3xl font-black mx-auto">
                    !
                </div>
                <div className="text-center space-y-2">
                    <h1 className="text-2xl font-black italic tracking-tight text-bee-black">
                        {lang === 'ko' ? '결제 확인이 멈췄어요' : 'Payment confirmation failed'}
                    </h1>
                    <p className="text-sm font-bold text-gray-500 leading-relaxed whitespace-pre-line">
                        {errorMessage}
                    </p>
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

export default TossPaymentSuccessPage;
