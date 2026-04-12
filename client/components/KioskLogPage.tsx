/**
 * KioskLogPage — 키오스크 장부 전용 페이지
 * URL: /kiosk/:branchSlug/log
 * 어드민 KioskTab과 동일한 UI, 해당 지점 자동 선택
 */
import React, { Suspense, lazy } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

const KioskTab = lazy(() => import('./admin/KioskTab'));

const KioskLogPage: React.FC = () => {
  const { branchSlug } = useParams<{ branchSlug: string }>();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* 헤더 */}
      <header className="bg-[#111111] px-6 py-3 flex items-center gap-4 flex-shrink-0">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-white/60 hover:text-white transition-colors text-sm font-bold"
        >
          <i className="fa-solid fa-arrow-left" />
          <span>돌아가기</span>
        </button>
        <div className="flex-1" />
        <p className="text-[#F5C842] font-black text-sm tracking-widest">BEELIBER 장부</p>
      </header>

      {/* KioskTab — 어드민과 동일 UI */}
      <div className="flex-1 overflow-auto">
        <Suspense fallback={
          <div className="flex items-center justify-center h-64">
            <div className="w-8 h-8 border-4 border-[#F5C842] border-t-transparent rounded-full animate-spin" />
          </div>
        }>
          <KioskTab initialBranchSlug={branchSlug} logMode />
        </Suspense>
      </div>
    </div>
  );
};

export default KioskLogPage;
