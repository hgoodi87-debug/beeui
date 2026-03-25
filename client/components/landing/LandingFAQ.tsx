
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
    const loadFaq = async () => {
      try {
        const data = await StorageService.getQnaPolicy();
        if (data && data.items) {
          // [스봉이] 랜딩 페이지에는 가장 중요한 5개만 선별해서 보여드릴게요 💅
          setFaqItems(data.items.slice(0, 5));
        }
      } catch (e) {
        console.error("Failed to load FAQ for landing:", e);
      }
    };
    loadFaq();
  }, []);

  if (faqItems.length === 0) return null;

  return (
    <section className="py-12 md:py-16 bg-white relative overflow-hidden">
      <FAQSchema items={faqItems.map(item => ({ question: item.question, answer: item.answer }))} />
      
      {/* Background Decor 🐝 */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-bee-yellow/5 rounded-full blur-[100px] -mr-48 -mt-24 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-bee-yellow/10 rounded-full blur-[100px] -ml-48 -mb-24 pointer-events-none" />

      <div className="max-w-[1000px] mx-auto px-6 relative z-10">
        <div className="text-center mb-8 md:mb-12">
          <motion.span 
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="inline-block px-4 py-1.5 rounded-full bg-bee-yellow/10 text-bee-black text-[10px] font-black uppercase tracking-[0.2em] mb-4"
          >
            FAQ
          </motion.span>
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-4xl md:text-5xl font-black tracking-tighter"
          >
            궁금한 점이 있으신가요?
          </motion.h2>
        </div>

        <div className="space-y-4">
          {faqItems.map((item, idx) => {
            const isOpen = openIndex === idx;
            return (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.05 }}
                className={`group border rounded-3xl transition-all duration-300 ${
                  isOpen ? 'border-bee-yellow bg-gray-50/50 shadow-xl' : 'border-gray-100 hover:border-bee-yellow/30'
                }`}
              >
                <button
                  onClick={() => setOpenIndex(isOpen ? null : idx)}
                  className="w-full flex items-center justify-between p-6 md:p-8 text-left"
                >
                  <div className="flex items-center gap-4 md:gap-6">
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-sm font-black transition-colors ${
                      isOpen ? 'bg-bee-yellow text-bee-black' : 'bg-gray-50 text-gray-400 group-hover:bg-bee-yellow/10 group-hover:text-bee-black'
                    }`}>
                      Q
                    </div>
                    <span className="text-lg md:text-xl font-bold text-bee-black leading-tight">
                      {item.question}
                    </span>
                  </div>
                  <div className={`flex-shrink-0 ml-4 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}>
                    {isOpen ? <Minus className="w-5 h-5 text-bee-black" /> : <Plus className="w-5 h-5 text-gray-400" />}
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
                      <div className="px-6 pb-8 md:px-8 md:pb-10 ml-12 md:ml-14">
                        <div className="p-6 bg-white rounded-2xl border border-dashed border-gray-200 text-bee-black/70 font-medium leading-relaxed whitespace-pre-wrap">
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
                className="inline-flex items-center gap-2 group px-8 py-4 bg-bee-black text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-bee-yellow hover:text-bee-black transition-all shadow-xl hover:shadow-bee-yellow/20"
            >
                전체 질문 보러가기
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
        </div>
      </div>
    </section>
  );
};

export default LandingFAQ;
