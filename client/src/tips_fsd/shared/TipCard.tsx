
import React from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, MapPin } from 'lucide-react';
import { Badge } from './Badge';

interface TipCardProps {
    title: string;
    description: string;
    category: string;
    area?: string;
    imageUrl?: string;
    onClick?: () => void;
    onReserveClick?: () => void;
    distance?: string;
    branchName?: string;
}

export const TipCard: React.FC<TipCardProps> = ({
    title,
    description,
    category,
    area,
    imageUrl,
    onClick,
    onReserveClick,
    distance,
    branchName
}) => {
    return (
        <motion.div
            whileHover={{ y: -5 }}
            className="group relative bg-white/5 border border-white/10 rounded-[2.5rem] overflow-hidden hover:bg-white/[0.08] hover:border-bee-yellow/30 transition-all cursor-pointer"
            onClick={onClick}
        >
            {imageUrl && (
                <div className="aspect-[16/10] overflow-hidden relative">
                    <img 
                        src={imageUrl} 
                        alt={title}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                        loading="lazy"
                    />
                    <div className="absolute top-4 left-4">
                        <Badge variant="accent">{category}</Badge>
                    </div>
                </div>
            )}
            
            <div className="p-8">
                <div className="flex items-center gap-2 mb-3">
                    {area && <span className="text-[10px] font-black text-bee-yellow/60 uppercase tracking-widest">{area}</span>}
                    {branchName && (
                        <>
                            <div className="w-1 h-1 rounded-full bg-white/20" />
                            <div className="flex items-center gap-1 text-[10px] font-bold text-white/40">
                                <MapPin size={10} />
                                <span>{branchName} {distance && `(${distance}km)`}</span>
                            </div>
                        </>
                    )}
                </div>

                <h4 className="text-xl font-black mb-3 group-hover:text-bee-yellow transition-colors leading-tight">{title}</h4>
                <p className="text-sm text-white/40 font-medium line-clamp-2 leading-relaxed italic mb-8">"{description}"</p>

                <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase tracking-widest text-white/60 group-hover:text-bee-yellow transition-colors flex items-center gap-2">
                        Details <ArrowRight size={12} />
                    </span>
                    
                    {onReserveClick && (
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                onReserveClick();
                            }}
                            className="px-4 py-2 bg-bee-yellow text-bee-black text-[10px] font-black uppercase tracking-wider rounded-xl hover:scale-105 active:scale-95 transition-all"
                        >
                            Reserve
                        </button>
                    )}
                </div>
            </div>
        </motion.div>
    );
};
