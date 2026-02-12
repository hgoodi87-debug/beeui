import React from 'react';

interface ManualModalProps {
  isOpen: boolean;
  onClose: () => void;
  t: any;
}

const stepIcons: Record<number, { icon: string, color: string }> = {
  0: { icon: 'fa-location-dot', color: 'text-brand-400' },
  1: { icon: 'fa-flag-checkered', color: 'text-brand-400' },
  2: { icon: 'fa-calendar-day', color: 'text-brand-400' },
  3: { icon: 'fa-clock', color: 'text-brand-400' },
  4: { icon: 'fa-truck-fast', color: 'text-brand-400' },
  5: { icon: 'fa-suitcase', color: 'text-brand-400' },
  6: { icon: 'fa-ticket', color: 'text-brand-400' },
  7: { icon: 'fa-user', color: 'text-brand-400' },
  8: { icon: 'fa-envelope', color: 'text-brand-400' },
  9: { icon: 'fa-share-nodes', color: 'text-brand-400' },
  10: { icon: 'fa-comment-dots', color: 'text-brand-400' }
};

const ManualModal: React.FC<ManualModalProps> = ({ isOpen, onClose, t }) => {
  if (!isOpen || !t) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-6 animate-fade-in">
      <div className="absolute inset-0 bg-[#050508]/90 backdrop-blur-md" onClick={onClose}></div>

      <div className="relative w-full max-w-4xl max-h-[90vh] glass-panel rounded-[40px] border border-white/10 shadow-2xl flex flex-col overflow-hidden animate-zoom-in">
        {/* Header */}
        <div className="p-8 border-b border-white/5 flex justify-between items-center bg-white/5">
          <div>
            <h2 className="text-2xl font-bold text-white flex items-center gap-3">
              <span className="w-10 h-10 rounded-xl bg-brand-600 flex items-center justify-center text-lg">
                <i className="fa-solid fa-book-open"></i>
              </span>
              {t.title}
            </h2>
            <p className="text-gray-400 text-sm mt-1">{t.desc}</p>
          </div>
          <button onClick={onClose} className="w-10 h-10 rounded-full hover:bg-white/10 text-gray-400 hover:text-white transition-all">
            <i className="fa-solid fa-times"></i>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {t.steps.map((step: any, index: number) => (
              <div key={index} className="flex gap-4 p-5 rounded-3xl bg-white/5 border border-white/5 hover:border-brand-500/30 transition-all group">
                <div className={`flex-shrink-0 w-12 h-12 rounded-2xl bg-brand-900/30 border border-brand-500/20 flex items-center justify-center ${stepIcons[index]?.color || 'text-brand-400'} group-hover:scale-110 transition-transform`}>
                  <i className={`fa-solid ${stepIcons[index]?.icon || 'fa-check'} text-xl`}></i>
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] font-bold text-brand-500 uppercase tracking-widest">{t.step_prefix || 'STEP'} {(index + 1).toString().padStart(2, '0')}</span>
                    <h4 className="text-sm font-bold text-white">{step.title}</h4>
                  </div>
                  <p className="text-xs text-gray-500 leading-relaxed">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="p-8 border-t border-white/5 bg-white/5 flex justify-center">
          <button
            onClick={onClose}
            className="px-10 py-4 bg-brand-600 hover:bg-brand-500 text-white font-bold rounded-2xl shadow-xl shadow-brand-600/20 transition-all transform hover:-translate-y-1"
          >
            {t.cta_btn}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ManualModal;