
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Search, Map as MapIcon, Compass, Sparkles, Navigation } from 'lucide-react';
import { TipCard } from '../shared/TipCard';
import { Badge } from '../shared/Badge';
import { TIPS_DATA, AREAS_DATA } from '../entities/tips.data';
import { useNearbyMatching } from '../features/useNearbyMatching';

interface TipsMainPageProps {
    lang: string;
}

export const TipsMainPage: React.FC<TipsMainPageProps> = ({ lang }) => {
    const [searchQuery, setSearchQuery] = useState('');
    const { findClosestBranch } = useNearbyMatching();

    // [스봉이] 필터링 및 검색 로직 🔍✨
    const filteredTips = TIPS_DATA.filter(tip => 
        tip.title[lang as keyof typeof tip.title]?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tip.summary[lang as keyof typeof tip.summary]?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="min-h-screen bg-bee-black text-white pt-24 pb-32 px-6 overflow-hidden">
            {/* Background Orbs */}
            <div className="fixed top-0 left-0 w-full h-full pointer-events-none overflow-hidden z-0">
                <div className="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] bg-bee-yellow/5 rounded-full blur-[120px]" />
                <div className="absolute bottom-[-10%] left-[-5%] w-[400px] h-[400px] bg-bee-yellow/3 rounded-full blur-[100px]" />
            </div>

            <div className="max-w-7xl mx-auto relative z-10">
                {/* Hero Section */}
                <header className="mb-20">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex items-center gap-3 mb-6"
                    >
                        <Badge variant="accent" className="animate-pulse">Travel Hub 2.0</Badge>
                        <div className="w-12 h-[1px] bg-white/10" />
                        <span className="text-[10px] font-black uppercase tracking-[0.3em] text-white/40">Beeliber Explorer</span>
                    </motion.div>
                    
                    <motion.h1 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="text-6xl md:text-8xl font-black mb-10 leading-[0.95] tracking-tighter"
                    >
                        DISCOVER<br />
                        <span className="text-bee-yellow">SEOUL</span> LIBRE. 💅
                    </motion.h1>

                    <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="relative max-w-2xl"
                    >
                        <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-white/20" size={20} />
                        <input 
                            type="text"
                            placeholder="Where are you heading today? (e.g. Hongdae, Shopping...)"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full bg-white/5 border border-white/10 rounded-full py-6 pl-16 pr-8 text-lg font-bold focus:outline-none focus:border-bee-yellow/50 focus:bg-white/[0.08] transition-all"
                        />
                    </motion.div>
                </header>

                {/* Region Grid */}
                <section className="mb-32">
                    <div className="flex items-end justify-between mb-12">
                        <div>
                            <span className="text-[10px] font-black uppercase tracking-widest text-bee-yellow mb-2 block">Hot Slots</span>
                            <h2 className="text-4xl font-black tracking-tight">Priority Areas 🎯</h2>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {AREAS_DATA.map((area, idx) => (
                            <motion.div
                                key={area.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.1 * idx }}
                                className="group relative aspect-[4/5] rounded-[2.5rem] overflow-hidden cursor-pointer"
                                onClick={() => window.location.href = `/tips/area/${area.area_slug}`}
                            >
                                <img 
                                    src={area.cover_image_url} 
                                    className="w-full h-full object-cover grayscale group-hover:grayscale-0 group-hover:scale-110 transition-all duration-700" 
                                    alt={area.area_name[lang as keyof typeof area.area_name] || ''}
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-bee-black via-transparent to-transparent opacity-80" />
                                <div className="absolute bottom-10 left-10 right-10">
                                    <h3 className="text-3xl font-black mb-2">{area.area_name[lang as keyof typeof area.area_name] || ''}</h3>
                                    <p className="text-xs text-white/60 font-medium line-clamp-2 italic mb-4">
                                        {area.headline[lang as keyof typeof area.headline] || ''}
                                    </p>
                                    <Badge variant="outline">Explore <Navigation size={10} className="ml-1" /></Badge>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </section>

                {/* Recommendation Tips */}
                <section>
                    <div className="flex items-end justify-between mb-12">
                        <div>
                            <span className="text-[10px] font-black uppercase tracking-widest text-bee-yellow mb-2 block">Curated</span>
                            <h2 className="text-4xl font-black tracking-tight">Hands-free Guides ✨</h2>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {filteredTips.map((tip, idx) => (
                            <TipCard
                                key={tip.id}
                                title={tip.title[lang as keyof typeof tip.title] || ''}
                                description={tip.summary[lang as keyof typeof tip.summary] || ''}
                                category={tip.content_type}
                                area={tip.area_slug}
                                imageUrl={tip.cover_image_url}
                                onClick={() => window.location.href = `/tips/place/${tip.slug}`}
                            />
                        ))}
                    </div>
                </section>
            </div>
        </div>
    );
};
