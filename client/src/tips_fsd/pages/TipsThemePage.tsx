
import React from 'react';
import { useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Sparkles, ArrowLeft, Send } from 'lucide-react';
import { Badge } from '../shared/Badge';
import { TipCard } from '../shared/TipCard';
import { TIPS_DATA, THEMES_DATA } from '../entities/tips.data';

interface TipsThemePageProps {
    lang: string;
}

export const TipsThemePage: React.FC<TipsThemePageProps> = ({ lang }) => {
    const { slug } = useParams<{ slug: string }>();
    const theme = THEMES_DATA.find(t => t.slug === slug);

    if (!theme) return <div className="pt-32 text-center text-white/40 font-black tracking-widest uppercase">Theme not found 💅</div>;

    const relatedTips = TIPS_DATA.filter(tip => tip.theme_tags?.includes(slug || ''));

    return (
        <div className="min-h-screen bg-bee-black text-white pb-32">
            {/* Minimal Header */}
            <div className="pt-32 px-10 max-w-7xl mx-auto mb-20">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                >
                    <button 
                        onClick={() => window.history.back()}
                        className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-white/40 hover:text-bee-yellow mb-12 transition-colors"
                    >
                        <ArrowLeft size={12} /> Back to Explorer
                    </button>
                    
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-10">
                        <div className="max-w-3xl">
                            <Badge variant="accent" className="mb-6">Theme Curated</Badge>
                            <h1 className="text-6xl md:text-8xl font-black tracking-tighter mb-8 leading-[0.9]">
                                {theme.title[lang as keyof typeof theme.title]}
                            </h1>
                            <p className="text-xl md:text-2xl text-white/40 font-bold leading-relaxed italic">
                                "{theme.description[lang as keyof typeof theme.description]}"
                            </p>
                        </div>
                        <div className="p-8 bg-white/5 border border-white/10 rounded-[2rem] hidden lg:block">
                            <Sparkles className="text-bee-yellow mb-4" size={32} />
                            <p className="text-[10px] font-black uppercase tracking-widest text-white/20">Official Selection</p>
                        </div>
                    </div>
                </motion.div>
            </div>

            <div className="max-w-7xl mx-auto px-10 relative z-20">
                {/* Content Grid */}
                <section>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {relatedTips.length > 0 ? (
                            relatedTips.map(tip => (
                                <TipCard
                                    key={tip.id}
                                    title={tip.title[lang as keyof typeof tip.title] || ''}
                                    description={tip.summary[lang as keyof typeof tip.summary] || ''}
                                    category={tip.content_type}
                                    area={tip.area_slug}
                                    imageUrl={tip.cover_image_url}
                                    onClick={() => window.location.href = `/tips/place/${tip.slug}`}
                                />
                            ))
                        ) : (
                            <div className="col-span-full py-32 text-center border-2 border-dashed border-white/5 rounded-[3rem]">
                                <p className="text-white/20 font-black uppercase tracking-widest mb-6">Coming soon... ✨</p>
                            </div>
                        )}
                    </div>
                </section>

                {/* Theme CTA */}
                <motion.div 
                    initial={{ opacity: 0, y: 40 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    className="mt-32 p-16 bg-white/[0.03] border border-white/10 rounded-[4rem] text-center"
                >
                    <h3 className="text-3xl font-black mb-6">Have a better suggestion for this theme? 💅</h3>
                    <p className="text-white/40 font-bold mb-10 max-w-xl mx-auto">
                        Beeliber curators are always looking for hidden gems. <br />
                        Share your local insights with us.
                    </p>
                    <button className="px-10 py-5 bg-white text-bee-black rounded-2xl text-sm font-black uppercase tracking-widest flex items-center gap-3 mx-auto hover:bg-bee-yellow transition-all">
                        Submit a Tip <Send size={18} />
                    </button>
                </motion.div>
            </div>
        </div>
    );
};
