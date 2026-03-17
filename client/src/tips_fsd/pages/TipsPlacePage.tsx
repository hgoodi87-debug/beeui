
import React from 'react';
import { useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Share2, Bookmark, Navigation, MapPin, ArrowRight, MessageCircle } from 'lucide-react';
import { Badge } from '../shared/Badge';
import { TIPS_DATA } from '../entities/tips.data';
import { useNearbyMatching } from '../features/useNearbyMatching';

interface TipsPlacePageProps {
    lang: string;
}

export const TipsPlacePage: React.FC<TipsPlacePageProps> = ({ lang }) => {
    const { slug } = useParams<{ slug: string }>();
    const tip = TIPS_DATA.find(t => t.slug === slug);
    const { findClosestBranch } = useNearbyMatching();

    if (!tip) return <div className="pt-32 text-center text-white/40 font-black tracking-widest uppercase">Tip content not found 💅</div>;

    return (
        <div className="min-h-screen bg-bee-black text-white pb-40">
            {/* Immersive Header */}
            <div className="relative h-[80vh] w-full overflow-hidden">
                <img 
                    src={tip.cover_image_url} 
                    className="w-full h-full object-cover scale-105" 
                    alt={tip.title[lang as keyof typeof tip.title] || ''}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-bee-black via-bee-black/40 to-transparent" />
                
                <div className="absolute bottom-20 left-0 w-full px-10">
                    <div className="max-w-4xl mx-auto">
                        <motion.div
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                        >
                            <div className="flex items-center gap-3 mb-8">
                                <Badge variant="accent">{tip.content_type}</Badge>
                                <div className="w-8 h-[1px] bg-white/20" />
                                <span className="text-[10px] font-black uppercase tracking-widest text-white/60">{tip.area_slug}</span>
                            </div>
                            <h1 className="text-6xl md:text-8xl font-black tracking-tighter mb-8 leading-[0.9]">
                                {tip.title[lang as keyof typeof tip.title]}
                            </h1>
                            <p className="text-xl md:text-2xl text-white/80 font-bold leading-relaxed italic border-l-4 border-bee-yellow pl-8 mb-10">
                                "{tip.summary[lang as keyof typeof tip.summary]}"
                            </p>
                            
                            <div className="flex flex-wrap gap-4">
                                {tip.theme_tags?.map(tag => (
                                    <Badge key={tag} variant="secondary">#{tag}</Badge>
                                ))}
                            </div>
                        </motion.div>
                    </div>
                </div>
            </div>

            {/* Content Body */}
            <div className="max-w-4xl mx-auto px-10 pt-20">
                <motion.article 
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    className="prose prose-invert prose-bee max-w-none mb-32"
                >
                    <div className="text-lg text-white/70 leading-relaxed font-medium whitespace-pre-line space-y-8">
                        {tip.body?.[lang as keyof typeof tip.body] || tip.body?.['en' as keyof typeof tip.body]}
                    </div>
                </motion.article>

                {/* Action CTA Section */}
                <motion.section 
                    initial={{ opacity: 0, scale: 0.95 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    className="bg-bee-yellow rounded-[3rem] p-12 text-bee-black overflow-hidden relative"
                >
                    <div className="relative z-10">
                        <Badge variant="primary" className="bg-black/10 text-black/60 mb-6">Expert Recommendation</Badge>
                        <h2 className="text-4xl md:text-5xl font-black mb-6 tracking-tight">Enjoy Here Hands-free. 💅</h2>
                        <p className="text-lg font-bold mb-10 opacity-70">
                            Don't let your heavy suitcases ruin the vibe. <br />
                            Store them at the nearest Beeliber center and explore Seoul Libre.
                        </p>
                        
                        <div className="flex flex-wrap gap-4">
                            <button className="px-10 py-5 bg-bee-black text-bee-yellow rounded-2xl text-sm font-black uppercase tracking-widest flex items-center gap-3 hover:scale-105 active:scale-95 transition-all">
                                Find Nearest Center <Navigation size={18} />
                            </button>
                            <button className="px-10 py-5 bg-white/20 text-bee-black rounded-2xl text-sm font-black uppercase tracking-widest flex items-center gap-3 hover:bg-white/30 transition-all">
                                Share This Tip <Share2 size={18} />
                            </button>
                        </div>
                    </div>
                    
                    {/* Decorative Icon */}
                    <div className="absolute -right-10 -bottom-10 opacity-10 pointer-events-none">
                        <Sparkles size={300} strokeWidth={1} />
                    </div>
                </motion.section>
            </div>
        </div>
    );
};

const Sparkles = ({ size, strokeWidth }: { size: number, strokeWidth: number }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707m12.728 0l-.707-.707M6.343 6.343l-.707-.707" />
    </svg>
);
