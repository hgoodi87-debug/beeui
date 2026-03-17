
import React from 'react';
import { useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { MapPin, Navigation, ArrowLeft, Info } from 'lucide-react';
import { Badge } from '../shared/Badge';
import { TipCard } from '../shared/TipCard';
import { AREAS_DATA, TIPS_DATA } from '../entities/tips.data';
import { useNearbyMatching } from '../features/useNearbyMatching';
import { LOCATIONS } from '../../../constants';

interface TipsAreaPageProps {
    lang: string;
}

export const TipsAreaPage: React.FC<TipsAreaPageProps> = ({ lang }) => {
    const { slug } = useParams<{ slug: string }>();
    const area = AREAS_DATA.find(a => a.area_slug === slug);
    const { findClosestBranch } = useNearbyMatching();

    if (!area) return <div className="pt-32 text-center text-white/40 font-black tracking-widest uppercase">Area not found 🙄</div>;

    const relatedTips = TIPS_DATA.filter(tip => tip.area_slug === slug);
    const relatedBranches = (LOCATIONS as any[]).filter(b => area.relatedBranchIds.includes(b.id));

    return (
        <div className="min-h-screen bg-bee-black text-white pb-32">
            {/* Header / Hero */}
            <div className="relative h-[70vh] w-full overflow-hidden">
                <img 
                    src={area.cover_image_url} 
                    className="w-full h-full object-cover grayscale-[0.5] hover:grayscale-0 transition-all duration-[2s]" 
                    alt={area.area_name[lang as keyof typeof area.area_name] || ''}
                />
                <div className="absolute inset-0 bg-gradient-to-b from-bee-black/60 via-bee-black/20 to-bee-black" />
                
                <div className="absolute bottom-20 left-10 right-10 max-w-7xl mx-auto">
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                    >
                        <button 
                            onClick={() => window.history.back()}
                            className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-white/40 hover:text-bee-yellow mb-8 transition-colors"
                        >
                            <ArrowLeft size={12} /> Back to Hub
                        </button>
                        <Badge variant="accent" className="mb-6">Global Destination</Badge>
                        <h1 className="text-7xl md:text-9xl font-black tracking-tighter mb-6 leading-none">
                            {area.area_name[lang as keyof typeof area.area_name] || ''}
                        </h1>
                        <p className="text-xl md:text-2xl text-white/60 font-bold max-w-3xl leading-relaxed italic">
                            "{area.intro_text[lang as keyof typeof area.intro_text] || ''}"
                        </p>
                    </motion.div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-10 -mt-10 relative z-20">
                {/* Branches Section */}
                <section className="mb-32">
                    <div className="flex items-center gap-4 mb-10">
                        <h2 className="text-4xl font-black">Beeliber Centers 🛰️</h2>
                        <div className="flex-1 h-[1px] bg-white/10" />
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {relatedBranches.map(branch => (
                            <div key={branch.id} className="bg-white/5 border border-white/10 p-8 rounded-[2rem] hover:bg-white/[0.08] transition-all group">
                                <div className="flex justify-between items-start mb-6">
                                    <div className="p-3 bg-bee-yellow/10 rounded-2xl">
                                        <MapPin className="text-bee-yellow" size={24} />
                                    </div>
                                    <Badge variant="outline">{branch.shortCode}</Badge>
                                </div>
                                <h3 className="text-2xl font-black mb-2 group-hover:text-bee-yellow transition-colors">{branch.name}</h3>
                                <p className="text-sm text-white/40 font-medium mb-8 leading-relaxed">{branch.description || branch.address}</p>
                                <button className="w-full py-4 bg-white/5 hover:bg-bee-yellow hover:text-bee-black rounded-xl text-[10px] font-black uppercase tracking-widest transition-all">
                                    Book Storage Now
                                </button>
                            </div>
                        ))}
                    </div>
                </section>

                {/* Local Tips Grid */}
                <section>
                    <div className="flex items-center gap-4 mb-10">
                        <h2 className="text-4xl font-black">Local Insights ✨</h2>
                        <div className="flex-1 h-[1px] bg-white/10" />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {relatedTips.map(tip => (
                            <TipCard
                                key={tip.id}
                                title={tip.title[lang as keyof typeof tip.title] || ''}
                                description={tip.summary[lang as keyof typeof tip.summary] || ''}
                                category={tip.content_type}
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
