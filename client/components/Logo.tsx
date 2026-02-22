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
            {/* Icon: Yellow Rounded Square with Box */}
            <div className={`${sizes[size]} aspect-square bg-[#FFCB05] rounded-xl flex items-center justify-center shadow-lg`}>
                <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="w-[60%] h-[60%] text-black"
                >
                    <path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" />
                    <path d="m3.3 7 8.7 5 8.7-5" />
                    <path d="M12 22V12" />
                </svg>
            </div>

            {/* Text: beeliber */}
            <h1 className={`font-display font-black tracking-tighter ${size === 'sm' ? 'text-lg' : size === 'md' ? 'text-xl' : size === 'lg' ? 'text-2xl' : 'text-3xl'}`}>
                <span className="text-white">bee</span>
                <span className="text-[#FFCB05]">liber</span>
            </h1>
        </div>
    );
};

export default Logo;
