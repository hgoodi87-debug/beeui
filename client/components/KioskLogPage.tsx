/**
 * KioskLogPage — 키오스크 장부 전용 페이지
 * URL: /kiosk/:branchSlug/log
 * 어드민 KioskTab과 동일한 UI, 해당 지점 자동 선택
 */
import React, { Suspense, lazy, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

const KioskTab = lazy(() => import('./admin/KioskTab'));

type SubView = 'admin' | 'settings';

const TABS: { id: SubView; label: string; icon: string }[] = [
  { id: 'admin',    label: '보관 장부',   icon: 'fa-table-list' },
  { id: 'settings', label: '키오스크 설정', icon: 'fa-sliders' },
];

const KioskLogPage: React.FC = () => {
  const { branchSlug } = useParams<{ branchSlug: string }>();
  const navigate = useNavigate();
  const [activeView, setActiveView] = useState<SubView>('admin');

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* 헤더 */}
      <header className="bg-[#111111] px-4 flex items-center flex-shrink-0" style={{ minHeight: 56 }}>
        {/* 돌아가기 */}
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-white/60 hover:text-white transition-colors text-sm font-bold flex-shrink-0 py-3"
        >
          <i className="fa-solid fa-arrow-left" />
          <span className="hidden sm:inline">돌아가기</span>
        </button>

        {/* 중앙 탭 */}
        <div className="flex-1 flex items-center justify-center gap-1 py-2">
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveView(tab.id)}
              className={`flex items-center gap-2 px-5 py-2 rounded-full text-sm font-black transition-all ${
                activeView === tab.id
                  ? 'bg-[#F5C842] text-[#111111]'
                  : 'text-white/50 hover:text-white hover:bg-white/10'
              }`}
            >
              <i className={`fa-solid ${tab.icon} text-xs`} />
              {tab.label}
            </button>
          ))}
        </div>

        {/* 우측 여백 균형 (돌아가기 버튼 너비 맞춤) */}
        <div className="flex-shrink-0 w-20" />
      </header>

      {/* KioskTab — 어드민과 동일 UI */}
      <div className="flex-1 overflow-auto">
        <Suspense fallback={
          <div className="flex items-center justify-center h-64">
            <div className="w-8 h-8 border-4 border-[#F5C842] border-t-transparent rounded-full animate-spin" />
          </div>
        }>
          <KioskTab
            initialBranchSlug={branchSlug}
            logMode
            activeView={activeView}
            onViewChange={(v) => setActiveView(v as SubView)}
          />
        </Suspense>
      </div>
    </div>
  );
};

export default KioskLogPage;
