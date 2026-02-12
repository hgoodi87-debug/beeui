
import React, { useEffect } from 'react';

interface ManualPageProps {
  onBack: () => void;
  t: any;
}

const stepIcons: Record<number, { icon: string, color: string }> = {
  0: { icon: 'fa-location-dot', color: 'text-blue-400' },
  1: { icon: 'fa-flag-checkered', color: 'text-emerald-400' },
  2: { icon: 'fa-calendar-day', color: 'text-brand-400' },
  3: { icon: 'fa-clock', color: 'text-amber-400' },
  4: { icon: 'fa-truck-fast', color: 'text-pink-400' },
  5: { icon: 'fa-suitcase', color: 'text-indigo-400' },
  6: { icon: 'fa-ticket', color: 'text-rose-400' },
  7: { icon: 'fa-user', color: 'text-sky-400' },
  8: { icon: 'fa-envelope', color: 'text-violet-400' },
  9: { icon: 'fa-share-nodes', color: 'text-green-400' },
  10: { icon: 'fa-comment-dots', color: 'text-orange-400' }
};

const ManualPage: React.FC<ManualPageProps> = ({ onBack, t }) => {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen bg-[#050508] text-white font-sans selection:bg-brand-500">
      {/* Header */}
      <nav className="sticky top-0 z-50 bg-[#0b0a14]/80 backdrop-blur-xl border-b border-white/5 py-4 px-6 md:px-12 flex justify-between items-center">
        <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-brand-600 flex items-center justify-center">
                <i className="fa-solid fa-suitcase-rolling text-white text-sm"></i>
            </div>
            <span className="text-xl font-bold tracking-tight text-white">Beeliber</span>
        </div>
        <button 
          onClick={onBack}
          className="flex items-center gap-2 px-5 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white transition-all text-sm font-bold border border-white/10"
        >
          <i className="fa-solid fa-arrow-left"></i>
        </button>
      </nav>

      <main className="max-w-5xl mx-auto px-6 py-16 md:py-24">
        <div className="text-center mb-20 animate-fade-in">
          <span className="text-brand-500 font-black uppercase tracking-[0.3em] text-xs mb-4 block">{t.subtitle}</span>
          <h1 className="text-4xl md:text-6xl font-bold mb-6 tracking-tight">{t.title}</h1>
          <p className="text-gray-500 text-lg max-w-2xl mx-auto leading-relaxed">
            {t.desc}
          </p>
        </div>

        <div className="grid grid-cols-1 gap-8">
          {t.steps.map((step: any, index: number) => {
            const style = stepIcons[index] || stepIcons[0];
            return (
              <div 
                key={index} 
                className="group relative flex flex-col md:flex-row gap-8 p-8 md:p-10 rounded-[40px] glass-panel border border-white/5 hover:border-brand-500/30 transition-all animate-fade-in-up"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                {/* Step Number Overlay */}
                <div className="absolute top-6 right-10 text-8xl font-black text-white/[0.02] pointer-events-none select-none">
                  {(index + 1).toString().padStart(2, '0')}
                </div>

                {/* Icon Container */}
                <div className={`w-20 h-20 md:w-24 md:h-24 rounded-3xl bg-white/5 flex items-center justify-center ${style.color} text-4xl border border-white/10 group-hover:scale-110 transition-transform`}>
                  <i className={`fa-solid ${style.icon}`}></i>
                </div>

                {/* Text Content */}
                <div className="flex-1 space-y-3">
                  <div className="flex items-center gap-4">
                    <span className={`text-xs font-black px-3 py-1 rounded-full bg-white/5 border border-white/10 ${style.color}`}>
                      {t.step_prefix || 'STEP'} {index + 1}
                    </span>
                    <h3 className="text-2xl md:text-3xl font-bold text-white group-hover:text-brand-400 transition-colors">{step.title}</h3>
                  </div>
                  <p className="text-gray-400 text-lg leading-relaxed md:max-w-2xl">
                    {step.desc}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* CTA Bottom */}
        <div className="mt-24 text-center p-12 rounded-[50px] bg-gradient-to-tr from-brand-900/20 to-purple-900/20 border border-brand-500/20">
          <h2 className="text-3xl font-bold text-white mb-6">{t.cta_title}</h2>
          <p className="text-gray-400 mb-10 max-w-xl mx-auto">{t.cta_desc}</p>
          <button 
            onClick={onBack}
            className="px-12 py-5 bg-brand-600 hover:bg-brand-500 text-white font-black text-lg rounded-2xl shadow-2xl shadow-brand-600/30 transition-all transform hover:-translate-y-2"
          >
            {t.cta_btn}
          </button>
        </div>
      </main>

      <footer className="py-12 border-t border-white/5 text-center">
        <p className="text-gray-700 text-xs uppercase tracking-widest">{t.copyright || 'Beeliber Global Logistics Manual © 2025'}</p>
      </footer>
    </div>
  );
};

export default ManualPage;
