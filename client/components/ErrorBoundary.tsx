
import React, { Component, ErrorInfo, ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';

/**
 * 에러를 GA4로 전송 (Sentry DSN 설정 전 임시 원격 로깅)
 * window.SENTRY_DSN 환경변수 설정 시 Sentry로 자동 전환 가능
 */
const logErrorRemotely = (error: Error, context?: string) => {
  try {
    const gtag = (window as unknown as { gtag?: (...args: unknown[]) => void }).gtag;
    if (typeof gtag === 'function') {
      gtag('event', 'exception', {
        description: `[${context || 'unknown'}] ${error.message}`,
        fatal: true,
        error_name: error.name,
        error_stack: error.stack?.slice(0, 500),
      });
    }
  } catch {
    // GA4 전송 실패는 무시
  }
};

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
        // 청크 로드 실패(배포 후 해시 변경) → 즉시 강제 새로고침
        const msg = error.message || '';
        if (
            msg.includes('Failed to fetch dynamically imported module') ||
            msg.includes('Importing a module script failed') ||
            msg.includes('error loading dynamically imported module')
        ) {
            window.location.reload();
            // reload 중에도 state 반환은 필요
            return { hasError: false, error: null };
        }
        return { hasError: true, error };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error('Uncaught error:', error, errorInfo);
        logErrorRemotely(error, errorInfo.componentStack?.split('\n')[1]?.trim());
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
