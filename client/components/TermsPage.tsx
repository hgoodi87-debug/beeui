
import React, { useEffect, useState } from 'react';


import { StorageService } from '../services/storageService';
import { TermsPolicyData } from '../types';

interface TermsPageProps {
  onBack: () => void;
  t: any;
}

const TermsPage: React.FC<TermsPageProps> = ({ onBack, t }) => {
  const [dynamicPolicy, setDynamicPolicy] = useState<TermsPolicyData | null>(null);

  useEffect(() => {
    window.scrollTo(0, 0);
    loadPolicy();
  }, []);

  const loadPolicy = async () => {
    const data = await StorageService.getTermsPolicy();
    setDynamicPolicy(data);
  };

  const hasDynamicContent = dynamicPolicy && Array.isArray(dynamicPolicy.content) && dynamicPolicy.content.length > 0;
  const content = hasDynamicContent ? dynamicPolicy.content : (t.terms_page?.content || []);
  const title = (hasDynamicContent && dynamicPolicy.title) ? dynamicPolicy.title : (t.terms_page?.title || 'Terms of Service');
  const lastUpdated = (hasDynamicContent && dynamicPolicy.last_updated) ? dynamicPolicy.last_updated : (t.terms_page?.last_updated || 'Last Updated: 2026.02.01');
  const intro = (hasDynamicContent && dynamicPolicy.intro) ? dynamicPolicy.intro : (t.terms_page?.intro || '');

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
          <span className="text-3xl md:text-4xl font-black text-bee-black">bee</span>
          <span className="text-3xl md:text-4xl font-black text-bee-yellow italic pr-1">liber</span>
        </div>
        <button onClick={onBack} className="text-xs font-black text-bee-black hover:text-red-500 uppercase tracking-widest flex items-center gap-2 px-6 py-3 bg-gray-100 rounded-full transition-all hover:scale-105">
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

        {/* Intro */}
        {intro && (
          <div className="mb-12 p-8 md:p-12 bg-white rounded-[40px] text-bee-black font-bold leading-loose whitespace-pre-wrap animate-fade-in-up border border-gray-100 shadow-xl shadow-gray-200/50">
            {intro}
          </div>
        )}

        <div className="space-y-8 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
          {content.map((section: any, idx: number) => (
            <div key={idx} className="bg-white rounded-[40px] p-8 md:p-12 border border-gray-50 shadow-xl shadow-gray-200/50 hover:border-bee-yellow/20 transition-all group">
              <h2 className="text-2xl md:text-3xl font-black mb-6 flex items-center gap-4">
                <span className="w-12 h-12 rounded-2xl bg-bee-yellow flex items-center justify-center text-lg text-bee-black shadow-lg group-hover:scale-110 transition-transform">
                  {idx + 1}
                </span>
                {section.title}
              </h2>
              <div className="pl-0 md:pl-16 text-bee-black font-bold leading-relaxed whitespace-pre-wrap text-base md:text-lg select-none">
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
            {t.terms_page?.agree_button || 'Confirm & Close'}
          </button>
        </div>
      </main>
    </div>

  );
};

export default TermsPage;
