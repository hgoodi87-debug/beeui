import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { BookOpen, Sparkles, Map, ChevronLeft, ArrowRight } from 'lucide-react';
import SEO from './SEO';
import { TRAVEL_TIPS } from '../src/constants/travelTips';

const TravelTips: React.FC<{ lang: string }> = ({ lang }) => {
    const navigate = useNavigate();

    const tips = TRAVEL_TIPS;

    return (
        <div className="min-h-screen bg-black text-white selection:bg-bee-yellow selection:text-bee-black">
            <SEO 
                title="서울 여행 팁 & 가이드 | Beeliber 무중력 여행 💅"
                description="서울 여행의 질을 높여주는 짐 보관, 배송 팁부터 핫플레이스 가이드까지. Beeliber와 함께 가방 없이 자유롭게 여행하세요."
                path="/tips"
                ogType="article"
            />

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
                    <button className="px-5 py-2 bg-bee-yellow/10 text-bee-yellow text-[10px] font-black uppercase tracking-wider rounded-full border border-bee-yellow/20">
                        Content Hub
                    </button>
                </div>
            </nav>

            <header className="pt-40 pb-20 px-6 text-center">
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="inline-flex items-center gap-2 px-4 py-1.5 bg-bee-yellow/10 text-bee-yellow border border-bee-yellow/20 rounded-full mb-8"
                >
                    <Sparkles size={12} />
                    <span className="text-[10px] font-black uppercase tracking-[0.2em]">Travel Smarter</span>
                </motion.div>
                <h1 className="text-5xl md:text-7xl font-black mb-6 uppercase tracking-tighter leading-none italic">
                    Seoul <span className="text-bee-yellow">Travel Tips</span> 💅
                </h1>
                <p className="text-white/40 font-bold text-lg md:text-xl max-w-xl mx-auto">
                    Beeliber curated guides for a premium, luggage-free experience in Korea.
                </p>
            </header>

            <main className="max-w-4xl mx-auto px-6 pb-40">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {tips.map((tip, i) => (
                        <motion.article
                            key={tip.id}
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: i * 0.1 }}
                            className="group p-10 bg-white/5 border border-white/10 rounded-[3rem] hover:bg-white/10 hover:border-bee-yellow/30 transition-all cursor-pointer relative overflow-hidden"
                            onClick={() => navigate(`/storage/seongsu`)} // 💅 우선 성수로 연결 (예시)
                        >
                            <div className="absolute top-0 right-0 p-8 text-white/10 group-hover:text-bee-yellow/50 transition-colors">
                                <BookOpen size={40} />
                            </div>
                            <h2 className="text-2xl font-black mb-4 pr-10 leading-tight">
                                {tip.title[lang as keyof typeof tip.title] || tip.title['ko']}
                            </h2>
                            <p className="text-white/40 font-bold mb-8 leading-relaxed">
                                {tip.desc[lang as keyof typeof tip.desc] || tip.desc['ko']}
                            </p>
                            <div className="flex items-center gap-2 text-bee-yellow text-xs font-black uppercase tracking-widest">
                                Read More <ArrowRight size={14} className="group-hover:translate-x-2 transition-transform" />
                            </div>
                        </motion.article>
                    ))}
                    
                    {/* Coming Soon Card */}
                    <div className="p-10 border border-dashed border-white/10 rounded-[3rem] flex flex-col items-center justify-center text-center opacity-50">
                        <Map className="mb-4 text-white/20" size={32} />
                        <h3 className="font-black mb-2 uppercase tracking-widest text-xs">More Guides Coming</h3>
                        <p className="text-[10px] font-bold text-white/30">Curating the best Seoul experiences.</p>
                    </div>
                </div>
            </main>

            <footer className="py-20 border-t border-white/5 text-center">
                <p className="text-[10px] font-black uppercase tracking-[0.5em] text-white/20">
                    &copy; 2026 Beeliber Content Hub. All rights reserved.
                </p>
            </footer>
        </div>
    );
};

export default TravelTips;
