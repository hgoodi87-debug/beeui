
import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Minus, HelpCircle, ArrowRight } from "lucide-react";
import { StorageService } from "../../services/storageService";
import FAQSchema from "../../src/domains/shared/ui/FAQ/FAQSchema";

interface LandingFAQProps {
  t: any;
}

const LandingFAQ: React.FC<LandingFAQProps> = ({ t }) => {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const [faqItems, setFaqItems] = useState<any[]>([]);

  useEffect(() => {
    // [스봉이] 서버 데이터 기다릴 시간 없어요. 번역 파일에 정성껏 준비해둔 데이터를 바로 꽂아넣을게요. 💅✨
    if (t && t.qna && t.qna.items) {
      setFaqItems(t.qna.items.slice(0, 7));
    }
  }, [t]);

  if (faqItems.length === 0) return null;

  return (
    <section className="py-12 md:py-20 bg-[#0d0d0d] relative overflow-hidden">
      <FAQSchema items={faqItems.map(item => ({ question: item.question, answer: item.answer }))} />

      {/* Background Decor */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-bee-yellow/5 rounded-full blur-[100px] -mr-48 -mt-24 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-bee-yellow/8 rounded-full blur-[100px] -ml-48 -mb-24 pointer-events-none" />

      <div className="max-w-[1000px] mx-auto px-6 relative z-10">
        <div className="mb-8 md:mb-12">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-2xl md:text-5xl font-display font-black text-white mb-4 tracking-tighter"
          >
            {t.qna.title}
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="text-white/40 text-sm md:text-base font-medium"
          >
            {t.qna.subtitle}
          </motion.p>
        </div>

        <div className="space-y-3">
          {faqItems.map((item, idx) => {
            const isOpen = openIndex === idx;
            return (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.05 }}
                className={`group border rounded-2xl transition-all duration-300 ${
                  isOpen
                    ? 'border-bee-yellow bg-white/5 shadow-xl shadow-bee-yellow/5'
                    : 'border-white/10 hover:border-bee-yellow/40 bg-white/3'
                }`}
              >
                <button
                  onClick={() => setOpenIndex(isOpen ? null : idx)}
                  className="w-full flex items-center justify-between p-5 md:p-7 text-left"
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-sm font-black transition-colors shrink-0 ${
                      isOpen ? 'bg-bee-yellow text-bee-black' : 'bg-white/8 text-white/40 group-hover:bg-bee-yellow/15 group-hover:text-bee-yellow'
                    }`}>
                      Q
                    </div>
                    <span className="text-base md:text-lg font-bold text-white leading-tight break-keep">
                      {item.question}
                    </span>
                  </div>
                  <div className={`flex-shrink-0 ml-4 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}>
                    {isOpen ? <Minus className="w-5 h-5 text-bee-yellow" /> : <Plus className="w-5 h-5 text-white/30" />}
                  </div>
                </button>

                <AnimatePresence>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3, ease: "easeInOut" }}
                      className="overflow-hidden"
                    >
                      <div className="px-5 pb-6 md:px-7 md:pb-8 ml-12">
                        <div className="p-5 bg-white/5 rounded-xl border border-white/10 text-white/60 font-medium leading-relaxed whitespace-pre-wrap text-sm">
                          {item.answer}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>

        <div className="mt-8 text-center">
            <button
                onClick={() => window.dispatchEvent(new CustomEvent('NAVIGATE', { detail: 'QNA' }))}
                className="inline-flex items-center gap-2 group px-8 py-4 bg-bee-yellow text-bee-black rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-white hover:text-bee-black transition-all shadow-xl"
            >
                {t.qna.view_all}
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
        </div>
      </div>
    </section>
  );
};

export default LandingFAQ;
