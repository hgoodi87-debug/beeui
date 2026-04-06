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
        <div className={`flex items-center gap-2 select-none ${className}`}>
            {/* Text: beeliber */}
            <span className={`logo ${size === 'sm' ? 'text-lg' : size === 'md' ? 'text-xl' : size === 'lg' ? 'text-2xl' : 'text-3xl'}`}>
                <span className="bee">bee</span>
                <span className="liber pr-1">liber</span>
            </span>
        </div>
    );
};

export default Logo;
