
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
        if (data && data.items && data.items.length > 0) {
          setFaqItems(data.items.slice(0, 5));
        } else {
          // [스봉이] 서버에 데이터가 없으면 제가 준비한 특급 FAQ 5개를 보여드릴게요. 💅✨
          setFaqItems([
            { question: "짐 보관은 어디서 하나요?", answer: "홍대입구역, 서울역 등 주요 역사 근처의 '빌리버 허브' 거점에서 전문가들이 안전하게 보관합니다. 예약 후 안내되는 위치를 확인하세요!" },
            { question: "공항 배송 서비스를 이용하고 싶어요. 언제까지 맡겨야 하나요?", answer: "당일 배송을 위해 오전 11시(일부 지점 13시)까지는 짐을 맡겨주셔야 합니다. 그래야 오후 4시 이후 인천공항에서 바로 찾으실 수 있거든요. ✨" },
            { question: "영업 시간이 어떻게 되나요?", answer: "각 허브 지점별로 상이하나, 보통 오전 9시부터 저녁 7시까지 운영됩니다. 예약 페이지에서 지점별 상세 운영 시간을 확인해 주세요." },
            { question: "예약을 취소하면 환불이 되나요?", answer: "서비스 이용 전일 24:00 전까지 취소하시면 100% 환불해 드립니다. 당일 취소는 아쉽게도 환불이 어려우니 미리 말씀해 주세요! 💅" },
            { question: "짐 크기나 무게 제한이 있나요?", answer: "일반적인 여행용 캐리어(기내용부터 특대형까지)는 모두 가능합니다. 골프백이나 유모차 같은 대형 수하물은 사전 문의 부탁드려요." }
          ]);
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
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-2xl md:text-5xl font-display font-black text-bee-black mb-4 tracking-tighter"
          >
            {t.qna.title}
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="text-gray-500 text-sm md:text-lg font-medium"
          >
            {t.qna.subtitle}
          </motion.p>
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
                {t.qna.view_all}
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
        </div>
      </div>
    </section>
  );
};

export default LandingFAQ;
