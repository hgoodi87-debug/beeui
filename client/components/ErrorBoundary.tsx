
import React, { Component, ErrorInfo, ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';

interface Props {
    children: ReactNode;
    fallback?: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false,
        error: null
    };

    public static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error('Uncaught error:', error, errorInfo);
    }

    public render() {
        if (this.state.hasError) {
            if (this.props.fallback) {
                return this.props.fallback;
            }
            return (
                <div className="p-4 bg-red-50 text-red-500 border border-red-200 rounded-lg">
                    <h1 className="text-xl font-bold mb-2">Something went wrong.</h1>
                    <p className="font-mono text-sm whitespace-pre-wrap">
                        {this.state.error?.toString()}
                    </p>
                </div>
            );
        }

        return this.props.children;
    }
}

export function PageErrorFallback({ lang }: { lang?: string }) {
    const navigate = useNavigate();
    const home = `/${lang || 'en'}`;
    return (
        <div className="min-h-screen w-full flex flex-col items-center justify-center bg-white gap-6 px-6">
            <span className="text-5xl">🐝</span>
            <div className="text-center">
                <p className="font-black text-xl text-bee-black mb-2">
                    {lang === 'ko' ? '페이지를 불러오지 못했어요' : 'Something went wrong'}
                </p>
                <p className="text-sm text-gray-400">
                    {lang === 'ko' ? '잠시 후 다시 시도해 주세요' : 'Please try again in a moment'}
                </p>
            </div>
            <button
                onClick={() => navigate(home)}
                className="px-8 py-3 bg-bee-yellow text-bee-black font-black rounded-2xl text-sm hover:bg-bee-yellow/80 transition-colors"
            >
                {lang === 'ko' ? '홈으로 돌아가기' : 'Back to Home'}
            </button>
        </div>
    );
}

export default ErrorBoundary;
