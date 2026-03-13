
import React, { useState, useEffect, useRef } from 'react';
import Logo from './Logo';

interface NavbarProps {
  onAdminClick?: () => void;
  onLocationsClick?: () => void;
  onPartnersClick?: () => void;
  onServicesClick?: () => void;
  onTermsClick?: () => void;
  onQnaClick?: () => void;
  onLoginClick?: () => void;
  onMyPageClick?: () => void;
  user: any;
  currentLang: string;
  onLangChange: (lang: string) => void;
  t: any;
}

const LANGUAGES = [
  { code: 'ko', name: 'KR', flag: 'kr' },
  { code: 'en', name: 'EN', flag: 'us' },
  { code: 'zh', name: 'CN', flag: 'cn' },
  { code: 'zh-TW', name: 'TW', flag: 'tw' },
  { code: 'zh-HK', name: 'HK', flag: 'hk' },
  { code: 'ja', name: 'JP', flag: 'jp' },
];

const Navbar: React.FC<NavbarProps> = ({ onAdminClick, onLocationsClick, onPartnersClick, onServicesClick, onTermsClick, onQnaClick, onLoginClick, onMyPageClick, user, currentLang, onLangChange, t }) => {
  const [scrolled, setScrolled] = useState(false);
  const [isLangOpen, setIsLangOpen] = useState(false);
  const langMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (langMenuRef.current && !langMenuRef.current.contains(event.target as Node)) {
        setIsLangOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <nav className={`fixed top-0 left-0 right-0 z-[100] px-4 py-4 transition-all duration-300`}>
      <div className={`max-w-[1200px] mx-auto flex items-center justify-between backdrop-blur-xl border border-white/10 rounded-full px-6 py-2 shadow-2xl transition-all duration-300 ${scrolled ? 'bg-black/60 shadow-lg' : 'bg-black/40'}`}>

        {/* Brand Logo Area */}
        <div className="flex flex-col items-start group">
          <div className="flex items-center gap-1 cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
            <Logo size="sm" />
          </div>
        </div>

        <div className="flex items-center gap-4 md:gap-8">

          {/* Language Selector - Dropdown (Vertical Scroll) */}
          <div className="relative" ref={langMenuRef}>
            <button
              onClick={() => setIsLangOpen(!isLangOpen)}
              className="flex items-center gap-2 bg-gray-100/50 hover:bg-gray-100 p-2 pl-3 pr-3 rounded-full transition-all backdrop-blur-sm"
            >
              <img
                src={`https://flagcdn.com/w40/${LANGUAGES.find(l => l.code === currentLang)?.flag || 'kr'}.png`}
                alt={currentLang}
                className="w-4 h-auto rounded-sm shadow-[0_1px_2px_rgba(0,0,0,0.1)]"
              />
              <span className="text-[10px] font-black uppercase tracking-widest">{LANGUAGES.find(l => l.code === currentLang)?.name}</span>
              <i className={`fa-solid fa-chevron-down text-[10px] text-gray-400 transition-transform duration-300 ${isLangOpen ? 'rotate-180' : ''}`}></i>
            </button>

            {isLangOpen && (
              <div className="absolute top-full mt-2 left-0 md:right-0 md:left-auto w-32 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden flex flex-col animate-fade-in-up max-h-[300px] overflow-y-auto custom-scrollbar">
                {LANGUAGES.map(lang => (
                  <button
                    key={lang.code}
                    onClick={() => { onLangChange(lang.code); setIsLangOpen(false); }}
                    className={`flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-all text-left w-full ${currentLang === lang.code ? 'bg-bee-yellow text-bee-black' : 'text-gray-500'}`}
                  >
                    <img
                      src={`https://flagcdn.com/w40/${lang.flag}.png`}
                      alt={lang.name}
                      className="w-4 h-auto rounded-sm shadow-[0_1px_2px_rgba(0,0,0,0.1)]"
                    />
                    <span className="text-xs font-black uppercase tracking-wider">{lang.name}</span>
                    {currentLang === lang.code && <i className="fa-solid fa-check text-[10px] ml-auto"></i>}
                  </button>
                ))}
              </div>
            )}
          </div>
          <div className="hidden lg:flex items-center gap-8">
            <button onClick={onServicesClick} className="text-xs font-black text-white/80 hover:text-bee-yellow uppercase tracking-widest transition-colors">{t.services}</button>
            <button onClick={() => window.location.hash = '#tracking'} className="text-xs font-black text-white/80 hover:text-bee-yellow uppercase tracking-widest transition-colors">{t.tracking}</button>
            <button onClick={onPartnersClick} className="text-xs font-black text-white/80 hover:text-bee-yellow uppercase tracking-widest transition-colors">{t.partners}</button>
            <button onClick={onQnaClick} className="text-xs font-black text-white/80 hover:text-bee-yellow uppercase tracking-widest transition-colors">Q&A</button>
            <div className="w-px h-4 bg-gray-200"></div>
            {user && !user.isAnonymous ? (
              <button
                onClick={onMyPageClick}
                className="flex items-center gap-2 text-xs font-black text-bee-black hover:text-[#FF495C] transition-colors uppercase tracking-widest"
              >
                <i className="fa-solid fa-user-circle text-sm"></i>
                {user.displayName || t.mypage || 'MY PAGE'}
              </button>
            ) : (
              <button
                onClick={onLoginClick}
                className="text-xs font-black text-bee-black hover:text-[#FF495C] transition-colors uppercase tracking-widest"
              >
                {t.login || 'LOGIN'}
              </button>
            )}
            <button onClick={() => window.location.pathname !== '/booking' && (window.history.pushState(null, '', '/booking'), window.dispatchEvent(new PopStateEvent('popstate')))} className="bg-bee-black text-bee-yellow px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest hover:scale-105 transition-all shadow-md shadow-black/5">{t.book}</button>
          </div>
        </div>
      </div>
      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #e5e7eb; border-radius: 2px; }
      `}</style>
    </nav>
  );
};

export default Navbar;
