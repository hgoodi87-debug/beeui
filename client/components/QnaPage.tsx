
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, HelpCircle, ShieldCheck, Ticket, MapPin, Search, Loader2 } from 'lucide-react';
import { StorageService } from '../services/storageService';
import { QnaData } from '../types';
import SEO from './SEO';

interface QnaPageProps {
  onBack: () => void;
  t: any;
  lang: string;
}

const QnaPage: React.FC<QnaPageProps> = ({ onBack, t, lang }) => {
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [dbQna, setDbQna] = useState<QnaData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    window.scrollTo(0, 0);
    const loadQna = async () => {
      try {
        const data = await StorageService.getQnaPolicy();
        if (data && data.items && data.items.length > 0) {
          setDbQna(data);
        }
      } catch (e) {
        console.error("Failed to fetch Q&A from DB:", e);
      } finally {
        setIsLoading(false);
      }
    };
    loadQna();
  }, []);

  const staticQna = t.qna || {
    title: "Q&A",
    subtitle: "Frequently Asked Questions",
    categories: { general: "General", booking: "Booking", safety: "Safety", locations: "Locations" },
    items: []
  };

  const qnaData = dbQna || staticQna;

  const categories = [
    { id: 'all', label: lang === 'ko' ? '전체' : (lang === 'en' ? 'All' : (lang === 'zh' ? '全部' : 'すべて')), icon: <Search size={16} /> },
    { id: 'general', label: qnaData.categories.general, icon: <HelpCircle size={16} /> },
    { id: 'booking', label: qnaData.categories.booking, icon: <Ticket size={16} /> },
    { id: 'safety', label: qnaData.categories.safety, icon: <ShieldCheck size={16} /> },
    { id: 'locations', label: qnaData.categories.locations, icon: <MapPin size={16} /> },
  ];

  const filteredItems = qnaData.items.filter((item: any) => {
    const matchesCategory = activeCategory === 'all' || item.category === activeCategory;
    const matchesSearch = item.question.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          item.answer.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const toggleAccordion = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  // 💅 FAQ 구조화된 데이터 생성 (Google AI가 아주 좋아하겠죠?)
  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": qnaData.items.map((item: any) => ({
      "@type": "Question",
      "name": item.question,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": item.answer
      }
    }))
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-bee-black select-none">
      <SEO 
        title={`${qnaData.title} | Beeliber Premium Support`}
        description={qnaData.subtitle}
        lang={lang}
        path="/qna"
        schema={faqSchema}
      />
      {/* Premium Header/Navbar */}
      <nav className="sticky top-0 z-[100] bg-white/90 backdrop-blur-md shadow-sm py-4 px-6 md:px-12 flex justify-between items-center border-b border-gray-100">
        <div className="flex items-center gap-1 cursor-pointer" onClick={onBack}>
          <span className="text-3xl md:text-4xl font-black text-bee-black">bee</span>
          <span className="text-3xl md:text-4xl font-black text-bee-yellow italic pr-1">liber</span>
        </div>
        <button 
          onClick={onBack} 
          className="group text-xs font-black text-bee-black hover:text-bee-yellow uppercase tracking-widest flex items-center gap-2 px-6 py-3 bg-gray-100 rounded-full transition-all hover:scale-105 active:scale-95"
        >
          <motion.i 
            animate={{ x: [0, -4, 0] }}
            transition={{ repeat: Infinity, duration: 1.5 }}
            className="fa-solid fa-arrow-left"
          ></motion.i> 
          {t.notice?.close || 'Back'}
        </button>
      </nav>

      {/* Hero Section */}
      <header className="relative py-20 md:py-32 px-6 overflow-hidden bg-white">
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none opacity-20">
            <div className="absolute -top-24 -left-24 w-96 h-96 bg-bee-yellow rounded-full blur-[120px]" />
            <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-bee-yellow/40 rounded-full blur-[120px]" />
        </div>

        <div className="max-w-4xl mx-auto text-center relative z-10">
          <motion.span 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-block px-4 py-1.5 rounded-full bg-bee-yellow/10 text-bee-black text-[10px] font-black uppercase tracking-[0.2em] mb-6"
          >
            Support Center
          </motion.span>
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-5xl md:text-7xl font-black mb-8 tracking-tighter leading-tight"
          >
            {qnaData.title}
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-gray-500 font-bold text-lg md:text-xl max-w-2xl mx-auto leading-relaxed"
          >
            {qnaData.subtitle}
          </motion.p>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-6 pb-32 -mt-10 relative z-20">
        
        {/* Search & Filter Bar */}
        <div className="bg-white rounded-[32px] shadow-2xl shadow-gray-200/50 p-4 mb-12 border border-gray-100 flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input 
              type="text"
              placeholder={lang === 'ko' ? "검색어를 입력하세요..." : "Search questions..."}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-14 pr-6 py-4 bg-gray-50 rounded-2xl border-none focus:ring-2 focus:ring-bee-yellow/50 font-bold transition-all"
            />
          </div>
          <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0 scrollbar-hide">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`flex items-center gap-2 px-5 py-4 rounded-2xl font-black text-xs uppercase tracking-wider transition-all whitespace-nowrap ${
                  activeCategory === cat.id 
                    ? 'bg-bee-black text-bee-yellow shadow-lg scale-105' 
                    : 'bg-gray-50 text-gray-400 hover:bg-gray-100 hover:text-bee-black'
                }`}
              >
                {cat.icon}
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {isLoading ? (
          <div className="py-20 text-center text-bee-black font-black uppercase tracking-widest animate-pulse">
            <Loader2 className="animate-spin mx-auto mb-4" />
            최신 정보를 동기화 중입니다...
          </div>
        ) : (
          /* Accordion List */
          <section className="space-y-4" aria-label="FAQ List">
          <AnimatePresence mode="popLayout">
            {filteredItems.length > 0 ? (
              filteredItems.map((item: any, idx: number) => {
                const globalIdx = qnaData.items.indexOf(item);
                const isOpen = openIndex === globalIdx;

                return (
                  <motion.article
                    key={globalIdx}
                    layout
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="group"
                  >
                    <button
                      onClick={() => toggleAccordion(globalIdx)}
                      aria-expanded={isOpen}
                      aria-controls={`faq-answer-${globalIdx}`}
                      className={`w-full text-left p-6 md:p-8 bg-white border border-gray-100 rounded-[32px] transition-all hover:shadow-xl hover:border-bee-yellow/20 flex items-start gap-6 ${
                        isOpen ? 'ring-2 ring-bee-yellow shadow-2xl' : ''
                      }`}
                    >
                      <div className={`w-12 h-12 rounded-2xl flex-shrink-0 flex items-center justify-center text-xl font-black transition-all ${
                        isOpen ? 'bg-bee-yellow text-bee-black' : 'bg-gray-50 text-gray-400 group-hover:bg-bee-yellow/10 group-hover:text-bee-black'
                      }`}>
                        Q
                      </div>
                      <div className="flex-1 pt-2">
                        <h3 
                          id={`faq-question-${globalIdx}`}
                          className={`text-lg md:text-xl font-black transition-colors ${isOpen ? 'text-bee-black' : 'text-gray-800'}`}
                        >
                          {item.question}
                        </h3>
                        <AnimatePresence>
                          {isOpen && (
                            <motion.div
                              id={`faq-answer-${globalIdx}`}
                              role="region"
                              aria-labelledby={`faq-question-${globalIdx}`}
                              initial={{ height: 0, opacity: 0, marginTop: 0 }}
                              animate={{ height: 'auto', opacity: 1, marginTop: 24 }}
                              exit={{ height: 0, opacity: 0, marginTop: 0 }}
                              transition={{ duration: 0.3, ease: "circOut" }}
                              className="overflow-hidden"
                            >
                              <div className="p-6 bg-slate-50/50 rounded-2xl border border-dashed border-gray-200 text-bee-black/80 font-bold leading-relaxed text-base md:text-lg whitespace-pre-wrap">
                                {item.answer}
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                      <div className={`mt-3 p-2 rounded-full transition-all ${isOpen ? 'bg-bee-black text-bee-yellow rotate-180' : 'bg-gray-50 text-gray-300'}`}>
                        <ChevronDown size={20} />
                      </div>
                    </button>
                  </motion.article>
                );
              })
            ) : (
                <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="py-20 text-center"
                >
                    <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6 text-gray-300">
                        <Search size={32} />
                    </div>
                    <p className="text-gray-400 font-black uppercase tracking-widest">
                        {lang === 'ko' ? "검색 결과가 없습니다." : "No results found."}
                    </p>
                </motion.div>
            )}
          </AnimatePresence>
        </section>
        )}

        {/* Footer Contact */}
        <div className="mt-20 p-10 md:p-16 rounded-[48px] bg-bee-black text-center relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-64 h-64 bg-bee-yellow/5 rounded-full blur-3xl -mr-32 -mt-32 transition-all group-hover:bg-bee-yellow/10" />
            
            <p className="text-bee-yellow text-[10px] font-black uppercase tracking-[0.4em] mb-6">Still have questions?</p>
            <h2 className="text-3xl md:text-4xl font-black text-white mb-10 tracking-tight">
                {lang === 'ko' ? "실시간 지원이\n필요하신가요?" : "Need live assistance?"}
            </h2>
            <div className="flex flex-col md:flex-row gap-4 justify-center">
                <button 
                  onClick={onBack}
                  className="px-10 py-5 bg-bee-yellow text-bee-black font-black rounded-2xl shadow-xl hover:scale-105 active:scale-95 transition-all"
                >
                    {lang === 'ko' ? "메인으로 돌아가기" : "Back to Home"}
                </button>
                <button className="px-10 py-5 bg-white/10 text-white font-black rounded-2xl hover:bg-white/20 transition-all">
                    {lang === 'ko' ? "고객센터 문의하기" : "Contact Support"}
                </button>
            </div>
        </div>
      </main>
    </div>
  );
};

export default QnaPage;
