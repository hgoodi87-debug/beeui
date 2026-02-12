import React, { useState, useEffect } from 'react';
import { StorageService } from '../services/storageService';
import { PrivacyPolicyData } from '../types';

interface PrivacyPageProps {
  onBack: () => void;
  t: any;
}

const PrivacyPage: React.FC<PrivacyPageProps> = ({ onBack, t }) => {
  const [data, setData] = useState<PrivacyPolicyData | null>(null);

  useEffect(() => {
    window.scrollTo(0, 0);
    loadPolicy();
  }, []);

  const loadPolicy = async () => {
    const saved = await StorageService.getPrivacyPolicy();
    if (saved) setData(saved);
  };

  const hasDynamicData = data && Array.isArray(data.content) && data.content.length > 0;
  const content = hasDynamicData ? data.content : (t.privacy_page?.content || []);
  const title = (hasDynamicData && data.title) ? data.title : (t.privacy_page?.title || 'Privacy Policy');
  const lastUpdated = (hasDynamicData && data.last_updated) ? data.last_updated : (t.privacy_page?.last_updated || 'Last Updated: 2026.02.01');
  const intro = (hasDynamicData && data.intro) ? data.intro : (t.privacy_page?.intro || '');

  return (
    <div
      className="min-h-screen bg-slate-50 font-sans text-bee-black select-none"
      onContextMenu={(e) => e.preventDefault()}
      onCopy={(e) => e.preventDefault()}
      onDragStart={(e) => e.preventDefault()}
    >
      {/* Header */}
      <nav className="sticky top-0 z-[100] bg-white/90 backdrop-blur-md shadow-sm py-4 px-6 md:px-12 flex justify-between items-center transition-all">
        <div className="flex items-center gap-1 cursor-pointer" onClick={onBack}>
          <span className="text-3xl md:text-4xl font-black italic text-bee-yellow">bee</span>
          <span className="text-3xl md:text-4xl font-black text-bee-black">liber</span>
        </div>
        <button onClick={onBack} className="text-xs font-black text-bee-grey hover:text-bee-black uppercase tracking-widest flex items-center gap-2 px-6 py-3 bg-gray-100 rounded-full transition-all hover:scale-105">
          <i className="fa-solid fa-arrow-left"></i> {t.notice?.close || 'Back'}
        </button>
      </nav>

      {/* Content */}
      <main className="max-w-4xl mx-auto px-6 py-12 md:py-20">
        <div className="mb-12 md:mb-16 text-center animate-fade-in-up">
          <span className="inline-block px-4 py-1.5 rounded-full bg-bee-yellow/10 text-bee-black text-[10px] font-black uppercase tracking-[0.2em] mb-4">
            Legal Document
          </span>
          <h1 className="text-4xl md:text-6xl font-black mb-6 tracking-tighter">{title}</h1>
          <p className="text-gray-400 font-bold text-sm tracking-widest uppercase">
            {lastUpdated}
          </p>
        </div>

        {/* Intro Section */}
        {intro && (
          <div className="mb-12 p-8 md:p-12 bg-white rounded-[40px] text-bee-grey font-medium leading-loose whitespace-pre-wrap animate-fade-in-up border border-gray-100 shadow-xl shadow-gray-200/50">
            {intro}
          </div>
        )}

        <div className="space-y-8 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
          {content.map((section: any, idx: number) => (
            <div key={idx} className="bg-white rounded-[40px] p-8 md:p-12 border border-gray-50 shadow-xl shadow-gray-200/50 hover:border-bee-yellow/20 transition-all group">
              <h2 className="text-2xl md:text-3xl font-black mb-6 flex items-center gap-4">
                <span className="w-12 h-12 rounded-2xl bg-bee-black text-bee-yellow flex items-center justify-center text-lg shadow-sm group-hover:scale-110 transition-transform">
                  {idx + 1}
                </span>
                {section.title}
              </h2>
              <div className="pl-0 md:pl-16 text-bee-grey font-medium leading-relaxed whitespace-pre-wrap text-base md:text-lg select-none">
                {section.text}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-20 pt-12 border-t border-gray-100 text-center">
          <p className="text-gray-400 text-[10px] font-black uppercase tracking-widest mb-8">
            {t.footer?.desc || 'Beeliber makes travel light and valuable.'}
          </p>
          <button
            onClick={onBack}
            className="px-12 py-5 bg-bee-black text-bee-yellow font-black rounded-[25px] shadow-2xl hover:scale-105 active:scale-95 transition-all text-lg uppercase tracking-widest"
          >
            {t.privacy_page?.agree_button || 'Confirm & Close'}
          </button>
        </div>
      </main>
    </div>

  );
};

export default PrivacyPage;
