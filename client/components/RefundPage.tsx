import React, { useEffect } from 'react';
import { motion } from 'framer-motion';

interface RefundPageProps {
  onBack: () => void;
  t: any;
}

const RefundPage: React.FC<RefundPageProps> = ({ onBack, t }) => {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const refundT = t.refund_page || {};
  const content = refundT.content || [];
  const title = refundT.title || 'Cancellation & Refund Policy';
  const lastUpdated = refundT.last_updated || 'Last Updated: 2026.03.17';
  const intro = refundT.intro || '';

  return (
    <div
      className="min-h-screen bg-[#F8F9FA] font-sans text-bee-black selection:bg-bee-yellow/30"
      onContextMenu={(e) => e.preventDefault()}
      onCopy={(e) => e.preventDefault()}
    >
      {/* Premium Header */}
      <nav className="sticky top-0 z-[100] bg-white/70 backdrop-blur-xl border-b border-gray-100 py-4 px-6 md:px-12 flex justify-between items-center transition-all">
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex items-center gap-1 cursor-pointer group" 
          onClick={onBack}
        >
          <span className="text-2xl md:text-3xl font-black text-bee-black group-hover:text-bee-yellow transition-colors italic">bee</span>
          <span className="text-2xl md:text-3xl font-black text-bee-yellow group-hover:text-bee-black transition-colors italic pr-1 tracking-tighter">liber</span>
        </motion.div>
        
        <motion.button 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={onBack} 
          className="group relative overflow-hidden px-6 py-2.5 bg-bee-black text-bee-yellow rounded-full transition-all shadow-lg hover:shadow-bee-yellow/20"
        >
          <span className="relative z-10 flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em]">
            <i className="fa-solid fa-arrow-left text-[8px]"></i>
            {t.notice?.close || 'Back'}
          </span>
          <div className="absolute inset-0 bg-white translate-y-full group-hover:translate-y-0 transition-transform duration-300 opacity-10"></div>
        </motion.button>
      </nav>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-6 py-16 md:py-24 relative">
        {/* Background Decorative Elements */}
        <div className="absolute top-20 -left-20 w-64 h-64 bg-bee-yellow/5 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-40 -right-20 w-80 h-80 bg-bee-black/5 rounded-full blur-3xl pointer-events-none"></div>

        {/* Title Section */}
        <div className="mb-16 md:mb-24 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <span className="inline-block px-4 py-1.5 rounded-full bg-bee-yellow text-bee-black text-[9px] font-black uppercase tracking-[0.3em] mb-6 shadow-sm">
              Premium Service Policy
            </span>
            <h1 className="text-4xl md:text-7xl font-black mb-8 tracking-tighter leading-[1.1] text-bee-black">
              {title.split(' ').map((word: string, i: number) => {
                if (word.toLowerCase().includes('beeliber')) {
                  const cleanWord = word.replace(/[,.]/g, '');
                  const suffix = word.replace(cleanWord, '');
                  return (
                    <span key={i} className="inline-block mr-2">
                      <span className="italic">bee</span>
                      <span className="text-bee-yellow italic">liber</span>
                      {suffix}
                    </span>
                  );
                }
                return (
                  <span key={i} className="inline-block mr-2">
                    {word}
                  </span>
                );
              })}
            </h1>
            <div className="flex items-center justify-center gap-3">
              <div className="h-[1px] w-8 bg-bee-yellow"></div>
              <p className="text-gray-400 font-black text-[10px] tracking-[0.4em] uppercase">
                {lastUpdated}
              </p>
              <div className="h-[1px] w-8 bg-bee-yellow"></div>
            </div>
          </motion.div>
        </div>

        {/* Intro Card */}
        {intro && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mb-16 relative group"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-bee-yellow/10 to-transparent rounded-[40px] blur-sm group-hover:blur-md transition-all"></div>
            <div className="relative p-8 md:p-14 bg-white/80 backdrop-blur-md rounded-[40px] border border-white shadow-2xl shadow-gray-200/50">
              <i className="fa-solid fa-receipt text-bee-yellow/30 text-4xl mb-6 block"></i>
              <p className="text-bee-black font-bold leading-[1.8] text-base md:text-xl whitespace-pre-wrap tracking-tight">
                {intro}
              </p>
            </div>
          </motion.div>
        )}

        {/* Policy Sections */}
        <div className="space-y-6">
          {content.map((section: any, idx: number) => (
            <motion.div 
              key={idx}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ delay: idx * 0.05 }}
              className="group relative"
            >
              <div className="absolute inset-0 bg-bee-yellow opacity-0 group-hover:opacity-[0.02] rounded-[32px] transition-opacity"></div>
              <div className="relative bg-white rounded-[32px] p-8 md:p-12 border border-gray-50 shadow-xl shadow-gray-200/30 hover:shadow-2xl hover:border-bee-yellow/20 transition-all">
                <div className="flex flex-col md:flex-row gap-6 md:gap-10">
                  <div className="flex-shrink-0">
                    <div className="w-14 h-14 rounded-2xl bg-bee-black text-bee-yellow flex items-center justify-center text-xl font-black shadow-lg group-hover:rotate-6 transition-transform">
                      {(idx + 1).toString().padStart(2, '0')}
                    </div>
                  </div>
                  <div className="flex-grow">
                    <h2 className="text-xl md:text-2xl font-black mb-6 tracking-tight text-bee-black group-hover:text-bee-yellow transition-colors">
                      {section.title}
                    </h2>
                    <div className="text-gray-600 font-bold leading-[1.7] whitespace-pre-wrap text-[15px] md:text-lg tracking-tight">
                      {section.text.split('\n').map((line: string, i: number) => (
                        <p key={i} className={line.startsWith('-') || line.match(/^\d\)/) ? "mt-2 pl-4 border-l-2 border-bee-yellow/30" : "mt-1"}>
                          {line}
                        </p>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Footer Action */}
        <motion.div 
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          className="mt-24 pt-16 border-t border-gray-100 text-center"
        >
          <p className="text-gray-400 text-[9px] font-black uppercase tracking-[0.5em] mb-10">
            {t.footer?.desc || 'FAIR TRADING WITH BEELIBER'}
          </p>
          <motion.button
            whileHover={{ scale: 1.05, y: -5 }}
            whileTap={{ scale: 0.95 }}
            onClick={onBack}
            className="px-16 py-6 bg-bee-black text-bee-yellow font-black rounded-[30px] shadow-[0_20px_50px_rgba(0,0,0,0.2)] flex items-center gap-4 mx-auto hover:bg-bee-yellow hover:text-bee-black transition-all group"
          >
            <span className="text-sm md:text-lg uppercase tracking-widest">{refundT.agree_button || 'Confirm & Close'}</span>
            <i className="fa-solid fa-check-double group-hover:scale-125 transition-transform"></i>
          </motion.button>
        </motion.div>
      </main>

      {/* Side Progress / Floating indicator */}
      <div className="fixed right-8 bottom-8 hidden lg:block">
        <div className="flex flex-col items-center gap-4">
          <div className="w-[1px] h-20 bg-gradient-to-t from-bee-yellow to-transparent"></div>
          <p className="vertical-text text-[8px] font-black text-bee-yellow tracking-widest uppercase origin-bottom -rotate-180 [writing-mode:vertical-rl]">
            BEELIBER REFUND POLICY
          </p>
        </div>
      </div>
    </div>
  );
};

export default RefundPage;
