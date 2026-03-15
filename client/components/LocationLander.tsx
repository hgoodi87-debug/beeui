
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { MapPin, Clock, ShieldCheck, ArrowRight, Star, ChevronLeft, Sparkles, Compass } from 'lucide-react';
import { SEO_LOCATIONS, SeoLocation } from '../src/constants/seoLocations';
import { LOCATIONS } from '../constants';
import SEO from './SEO';
import BookingWidget from './BookingWidget';
import { TRAVEL_TIPS } from '../src/constants/travelTips';

interface LocationLanderProps {
  t: any;
  lang: string;
}

const LocationLander: React.FC<LocationLanderProps> = ({ t, lang }) => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [seoData, setSeoData] = useState<SeoLocation | null>(null);

  useEffect(() => {
    const data = SEO_LOCATIONS.find(loc => loc.slug === slug);
    if (data) {
      setSeoData(data);
    } else {
      navigate('/', { replace: true });
    }
    window.scrollTo(0, 0);
  }, [slug, navigate]);

  if (!seoData) return null;

  // 관련 지표 및 데이터 매핑
  const l = (key: keyof SeoLocation['titles']) => {
    const langKey = lang as keyof SeoLocation['titles'];
    return seoData.titles[langKey] || seoData.titles['ko'];
  };
  const d = (key: keyof SeoLocation['descriptions']) => {
    const langKey = lang as keyof SeoLocation['descriptions'];
    return seoData.descriptions[langKey] || seoData.descriptions['ko'];
  };
  const k = (key: keyof SeoLocation['keywords']) => {
    const langKey = lang as keyof SeoLocation['keywords'];
    return seoData.keywords[langKey] || seoData.keywords['ko'];
  };
  const intro = () => {
    const langKey = lang as keyof SeoLocation['intros'];
    return seoData.intros[langKey] || seoData.intros['ko'];
  };
  const faqs = seoData.faqs || [];

  const relatedBranches = LOCATIONS.filter(loc => seoData.relatedBranchIds.includes(loc.id));

  return (
    <div className="min-h-screen bg-black text-white selection:bg-bee-yellow selection:text-bee-black">
      <SEO 
        title={l('ko' as any)}
        description={d('ko' as any)}
        keywords={k('ko' as any)}
        lang={lang}
        path={`/storage/${slug}`}
        ogType="article"
        ogImage="https://bee-liber.com/og-locations.png" // 💅 지역별 특화 OG 이미지 (가칭)
      />

      {/* 🍯 FAQ Schema (JSON-LD) for Google Rich Results */}
      {faqs.length > 0 && (
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "FAQPage",
            "mainEntity": faqs.map(faq => ({
              "@type": "Question",
              "name": faq.question,
              "acceptedAnswer": {
                "@type": "Answer",
                "text": faq.answer[lang as keyof typeof faq.answer] || faq.answer['ko']
              }
            }))
          })}
        </script>
      )}

      {/* Premium Navigation */}
      <nav className="fixed top-0 inset-x-0 z-[100] px-4 py-4">
        <div className="max-w-4xl mx-auto flex justify-between items-center backdrop-blur-xl bg-white/5 border border-white/10 rounded-full px-6 py-2 shadow-2xl">
          <button onClick={() => navigate('/')} className="flex items-center gap-2 group">
            <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center group-hover:bg-bee-yellow group-hover:text-bee-black transition-all">
              <ChevronLeft size={18} />
            </div>
            <span className="text-[10px] font-black uppercase tracking-widest hidden sm:block">Beeliber</span>
          </button>
          
          <div className="flex items-center gap-1">
            <span className="text-xl font-black italic">bee</span>
            <span className="text-xl font-black italic text-bee-yellow">liber</span>
          </div>

          <button 
            onClick={() => window.scrollTo({ top: document.getElementById('booking-section')?.offsetTop || 0, behavior: 'smooth' })}
            className="px-5 py-2 bg-bee-yellow text-bee-black text-[10px] font-black uppercase tracking-wider rounded-full hover:scale-105 active:scale-95 transition-all"
          >
            Book Now
          </button>
        </div>
      </nav>

      {/* Hero Content */}
      <header className="relative pt-40 pb-20 px-6 overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-4xl h-full pointer-events-none">
          <div className="absolute top-20 left-10 w-64 h-64 bg-bee-yellow/20 rounded-full blur-[100px]" />
          <div className="absolute bottom-20 right-10 w-64 h-64 bg-bee-yellow/10 rounded-full blur-[100px]" />
        </div>

        <div className="max-w-4xl mx-auto relative z-10 text-center">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="inline-flex items-center gap-2 px-4 py-1.5 bg-bee-yellow/10 text-bee-yellow border border-bee-yellow/20 rounded-full mb-8 shadow-lg shadow-bee-yellow/5"
            >
                <MapPin size={12} />
                <span className="text-[10px] font-black uppercase tracking-[0.2em]">Official Service Area</span>
            </motion.div>

            <motion.h1 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="text-5xl md:text-8xl font-black mb-10 tracking-tighter leading-[0.9] uppercase"
            >
                {l('en' as any).split('|')[0]}
            </motion.h1>

            <motion.p 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="text-white font-bold text-lg md:text-2xl max-w-2xl mx-auto leading-relaxed mb-6"
            >
                {d(lang as any)}
            </motion.p>

            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="max-w-xl mx-auto p-6 bg-white/5 border border-white/10 rounded-3xl backdrop-blur-sm"
            >
                <p className="text-white/60 text-sm md:text-base font-medium leading-relaxed italic">
                    "{intro()}"
                </p>
            </motion.div>
        </div>
      </header>

      {/* Features Grid */}
      <section className="max-w-4xl mx-auto px-6 py-20 border-b border-white/5">
         <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-20">
            {[
                { icon: <Clock className="text-bee-yellow" />, title: "Seoul Hub Presence", desc: "Located at the heart of Seoul's transit hubs for maximum accessibility." },
                { icon: <ShieldCheck className="text-bee-yellow" />, title: "Premium Seoul Safety", desc: "Certified storage facility with 24/7 monitoring and premium insurance." },
                { icon: <Star className="text-bee-yellow" />, title: "Smart Airport Link", desc: "Seamless same-day delivery from Seoul hubs to Incheon Airport." }
            ].map((f, i) => (
                <motion.div 
                    key={i}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.1 }}
                    className="p-8 bg-white/5 border border-white/10 rounded-[2.5rem] hover:bg-white/10 transition-all group"
                >
                    <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                        {f.icon}
                    </div>
                    <h3 className="text-xl font-black mb-4">{f.title}</h3>
                    <p className="text-white/40 font-bold leading-relaxed">{f.desc}</p>
                </motion.div>
            ))}
         </div>

         {/* 💅 Around the Area: Must-Visit Spots (New Section) */}
         {seoData.touristSpots && seoData.touristSpots.length > 0 && (
            <motion.div 
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="mt-32"
            >
                <div className="flex flex-col items-center mb-16 px-6">
                    <div className="flex items-center gap-2 mb-4 px-3 py-1 bg-bee-yellow/10 border border-bee-yellow/20 rounded-full">
                        <Sparkles size={14} className="text-bee-yellow fill-bee-yellow" />
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-bee-yellow">Local Curation</span>
                    </div>
                    <h3 className="text-3xl md:text-5xl font-black mb-6 tracking-tight italic uppercase text-center">
                        Must-Visit <span className="text-bee-yellow">Hotspots</span> 💅
                    </h3>
                    <p className="text-white/40 font-bold text-center max-w-xl">
                        {lang === 'ko' ? '지점 주변의 가장 힙하고 매력적인 명소들을 엄선했습니다.' : 'We\'ve curated the hippest and most charming spots around this branch.'}
                    </p>
                </div>

                <div className="grid grid-cols-1 gap-6">
                    {seoData.touristSpots.map((spot, idx) => (
                        <motion.div
                            key={spot.id}
                            initial={{ opacity: 0, scale: 0.95 }}
                            whileInView={{ opacity: 1, scale: 1 }}
                            viewport={{ once: true }}
                            transition={{ delay: idx * 0.1 }}
                            className="group relative flex flex-col md:flex-row items-center gap-6 p-8 md:p-10 bg-white/5 border border-white/10 rounded-[3rem] hover:bg-white/10 hover:border-bee-yellow/30 transition-all overflow-hidden"
                        >
                            <div className="w-16 h-16 md:w-20 md:h-20 rounded-3xl bg-white/10 flex items-center justify-center shrink-0 group-hover:rotate-12 transition-transform">
                                {spot.category === 'landmark' ? <Star className="text-orange-400 fill-orange-400" size={32} /> : <Compass className="text-blue-400" size={32} />}
                            </div>
                            <div className="flex-1 text-center md:text-left">
                                <h4 className="text-2xl md:text-3xl font-black mb-3 text-white">
                                    {(spot.name as any)[lang] || spot.name.ko}
                                </h4>
                                <p className="text-white/40 font-bold text-lg leading-relaxed">
                                    {(spot.description as any)[lang] || spot.description.ko}
                                </p>
                            </div>
                            <div className="hidden md:block">
                                <div className="w-12 h-12 rounded-full border border-white/10 flex items-center justify-center group-hover:bg-bee-yellow group-hover:text-bee-black transition-all">
                                    <ArrowRight size={20} />
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </motion.div>
         )}

         {/* Local FAQ Section (Phase 2 보강 💅) */}
         {faqs.length > 0 && (
            <motion.div 
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                className="max-w-3xl mx-auto"
            >
                <h3 className="text-2xl font-black mb-10 text-center uppercase tracking-widest text-bee-yellow/80">Localized FAQ 🍯</h3>
                <div className="space-y-4">
                    {faqs.map((faq, idx) => (
                        <div key={idx} className="p-6 bg-white/5 border border-white/10 rounded-3xl">
                            <h4 className="text-lg font-black mb-2 flex gap-3">
                                <span className="text-bee-yellow">Q.</span>
                                {faq.question}
                            </h4>
                            <p className="text-white/50 font-medium pl-8 border-l border-bee-yellow/30">
                                {faq.answer[lang as keyof typeof faq.answer] || faq.answer['ko']}
                            </p>
                        </div>
                    ))}
                </div>
            </motion.div>
         )}
      </section>
      
      {/* 💅 Local Travel Tips Section (New) */}
      {seoData.relatedTipIds && seoData.relatedTipIds.length > 0 && (
        <section className="max-w-4xl mx-auto px-6 py-20 border-b border-white/5">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-5xl font-black mb-6 tracking-tight italic uppercase">
              Local <span className="text-bee-yellow">Travel Guide</span> 💅
            </h2>
            <p className="text-white/40 font-bold text-lg">
              {lang === 'ko' ? '비리버가 제안하는 이 지역을 더 가볍게 즐기는 법' : 'Beeliber curated tips to enjoy this area without luggage.'}
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {TRAVEL_TIPS.filter(tip => seoData.relatedTipIds?.includes(tip.id)).map((tip, i) => (
              <motion.div
                key={tip.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="group p-10 bg-white/5 border border-white/10 rounded-[3rem] hover:bg-white/10 hover:border-bee-yellow/30 transition-all cursor-pointer overflow-hidden relative"
                onClick={() => navigate('/tips')}
              >
                <div className="absolute top-0 right-0 p-8 text-white/5 group-hover:text-bee-yellow/30 transition-colors">
                  <ShieldCheck size={40} />
                </div>
                <h3 className="text-xl font-black mb-4 leading-tight">
                  {tip.title[lang as keyof typeof tip.title] || tip.title['ko']}
                </h3>
                <p className="text-white/30 font-bold text-sm mb-8 leading-relaxed">
                  {tip.desc[lang as keyof typeof tip.desc] || tip.desc['ko']}
                </p>
                <div className="flex items-center gap-2 text-bee-yellow text-xs font-black uppercase tracking-widest">
                  View Detail <ArrowRight size={14} className="group-hover:translate-x-2 transition-transform" />
                </div>
              </motion.div>
            ))}
          </div>
        </section>
      )}

      {/* Booking Widget Section */}
      <section id="booking-section" className="py-20 px-6">
        <div className="max-w-4xl mx-auto bg-white text-black rounded-[3rem] overflow-hidden shadow-2xl shadow-bee-yellow/10">
            <div className="p-8 md:p-12 border-b border-gray-100 flex flex-col md:flex-row justify-between items-center gap-6">
                <div className="text-center md:text-left">
                    <h2 className="text-3xl font-black tracking-tight mb-2">Book Your Space Now 💅</h2>
                    <p className="text-gray-400 font-bold">Start your luggage-free journey in seconds.</p>
                </div>
                {relatedBranches.length > 0 && (
                    <div className="flex -space-x-3">
                        {relatedBranches.slice(0, 3).map((b, i) => (
                            <div key={i} className="w-12 h-12 rounded-full border-4 border-white bg-bee-black flex items-center justify-center text-[10px] font-black text-bee-yellow uppercase">
                                {b.shortCode}
                            </div>
                        ))}
                    </div>
                )}
            </div>
            <div className="p-4 md:p-8">
                <BookingWidget 
                    t={t} 
                    lang={lang}
                    onSuccess={() => navigate('/booking-success')} 
                    initialLocationId={relatedBranches[0]?.id}
                />
            </div>
        </div>
      </section>

      {/* CTA Footer */}
      <footer className="py-32 text-center px-6">
         <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="max-w-2xl mx-auto"
         >
             <h2 className="text-4xl md:text-6xl font-black mb-10 tracking-tight italic">
                Experience the <span className="text-bee-yellow">Hyper-Gap</span> in Travel 💅
             </h2>
             <button 
                onClick={() => navigate('/')}
                className="group inline-flex items-center gap-3 px-10 py-5 bg-white text-black font-black rounded-full hover:bg-bee-yellow transition-all"
             >
                Return to Home
                <ArrowRight className="group-hover:translate-x-2 transition-transform" />
             </button>
         </motion.div>
      </footer>
    </div>
  );
};

export default LocationLander;
