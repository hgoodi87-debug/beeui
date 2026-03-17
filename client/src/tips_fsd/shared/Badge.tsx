
import React from 'react';

interface BadgeProps {
    children: React.ReactNode;
    variant?: 'primary' | 'secondary' | 'accent' | 'outline';
    className?: string;
}

export const Badge: React.FC<BadgeProps> = ({ children, variant = 'primary', className = '' }) => {
    const variants = {
        primary: 'bg-bee-yellow text-bee-black',
        secondary: 'bg-white/10 text-white/60 border border-white/5',
        accent: 'bg-bee-yellow/10 text-bee-yellow border border-bee-yellow/20',
        outline: 'bg-transparent text-white/40 border border-white/10'
    };

    return (
        <div className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest inline-flex items-center gap-1.5 ${variants[variant]} ${className}`}>
            {children}
        </div>
    );
};
