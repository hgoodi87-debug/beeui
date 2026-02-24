import React from 'react';

interface LogoProps {
    className?: string;
    size?: 'sm' | 'md' | 'lg' | 'xl';
}

const Logo: React.FC<LogoProps> = ({ className = '', size = 'md' }) => {
    const sizes = {
        sm: 'h-6',
        md: 'h-8',
        lg: 'h-10',
        xl: 'h-12'
    };

    return (
        <div className={`flex items-center gap-2 md:gap-3 select-none ${className}`}>
            {/* Text: beeliber */}
            <h1 className={`font-display font-black tracking-tighter ${size === 'sm' ? 'text-lg' : size === 'md' ? 'text-xl' : size === 'lg' ? 'text-2xl' : 'text-3xl'}`}>
                <span className="text-white">bee</span>
                <span className="text-[#FFCB05] italic pr-1">liber</span>
            </h1>
        </div>
    );
};

export default Logo;
