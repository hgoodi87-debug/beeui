
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
  onMenuClick?: () => void; // Added for side menu
  onBookClick?: () => void; // CTA 예약하기/Book 버튼 전용 (onLocationsClick과 분리)
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

const Navbar: React.FC<NavbarProps> = ({
  onAdminClick, onLocationsClick, onPartnersClick, onServicesClick,
  onTermsClick, onQnaClick, onLoginClick, onMyPageClick, onMenuClick, onBookClick,
  user, currentLang, onLangChange, t
}) => {
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

  const currentLangObj = LANGUAGES.find(l => l.code.toLowerCase() === currentLang.toLowerCase()) || LANGUAGES[0];
  const navItems = [
    { label: currentLang === 'ko' ? '서비스 소개' : (t.nav?.services || 'Services'), onClick: onServicesClick },
    { label: currentLang === 'ko' ? '이용방법' : (t.nav?.how_it_works || 'How It Works'), onClick: onLocationsClick },
    { label: currentLang === 'ko' ? '요금안내' : (t.nav?.pricing || 'Pricing'), onClick: onPartnersClick },
    { label: currentLang === 'ko' ? 'Q&A' : (t.nav?.help_center || 'Q&A'), onClick: onQnaClick },
  ].filter(item => Boolean(item.onClick));

  return (
    <nav className="fixed top-0 left-0 right-0 z-[100] px-4 py-2 md:py-3 transition-all duration-500 pointer-events-none">
      <div className={`max-w-[1200px] mx-auto flex items-center justify-between backdrop-blur-2xl border border-white/10 rounded-full px-4 md:px-6 py-1.5 shadow-2xl transition-all duration-500 pointer-events-auto ${scrolled ? 'bg-black/65 scale-[0.98]' : 'bg-black/35 scale-100'}`}>

        {/* Brand Logo Area */}
        <div className="flex items-center cursor-pointer group scale-90 md:scale-95 origin-left" onClick={() => window.location.href = '/'}>
          <Logo size="sm" className="group-hover:scale-105 transition-transform" />
        </div>

        <div className="hidden lg:flex items-center gap-7">
          {navItems.map((item) => (
            <button
              key={item.label}
              onClick={item.onClick}
              className="text-[12px] font-black text-white/70 hover:text-bee-yellow transition-colors tracking-[0.08em] uppercase"
            >
              {item.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-1.5 md:gap-3">
          {/* Language Selector - Ultra Slim Pill */}
          <div className="relative" ref={langMenuRef}>
            <button
              onClick={() => setIsLangOpen(!isLangOpen)}
              className="flex items-center gap-1.5 bg-white/5 hover:bg-white/10 px-2.5 py-1.5 min-h-[44px] rounded-full transition-all border border-white/5 group"
            >
              <img
                src={`https://flagcdn.com/w40/${currentLangObj.flag}.png`}
                alt={currentLang}
                className="w-3.5 h-auto rounded-sm"
              />
              <span className="hidden sm:inline text-[10px] font-black text-white/80 tracking-widest uppercase">{currentLangObj.name}</span>
            </button>

            {isLangOpen && (
              <div className="absolute top-full mt-3 right-0 w-40 bg-black/90 backdrop-blur-3xl rounded-2xl shadow-2xl border border-white/10 overflow-hidden flex flex-col py-2">
                {LANGUAGES.map(lang => (
                  <button
                    key={lang.code}
                    onClick={() => { onLangChange(lang.code); setIsLangOpen(false); }}
                    className={`flex items-center gap-3 px-5 py-2.5 hover:bg-white/5 transition-all text-left w-full ${currentLang.toLowerCase() === lang.code.toLowerCase() ? 'text-bee-yellow bg-white/5' : 'text-white/60'}`}
                  >
                    <img
                      src={`https://flagcdn.com/w40/${lang.flag}.png`}
                      alt={lang.name}
                      className="w-3.5 h-auto rounded-sm opacity-80"
                    />
                    <span className="text-[10px] font-bold uppercase tracking-widest">{lang.name}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="w-px h-3 bg-white/10 mx-1 hidden md:block"></div>

          {/* Login/MyPage - 로그인 비활성화 (활성화 요청 시 이 주석 제거) */}
          {user && !user.isAnonymous && (
            <button
              onClick={onMyPageClick}
              className="text-[11px] font-black text-white/90 hover:text-bee-yellow transition-colors tracking-tighter px-3 min-h-[44px] uppercase"
            >
              {t.mypage || 'MY'}
            </button>
          )}

          <button
            onClick={onBookClick || onLocationsClick}
            className="hidden md:flex min-h-[44px] items-center rounded-full bg-white px-5 text-[11px] font-black uppercase tracking-[0.16em] text-bee-black transition-all hover:bg-bee-yellow active:scale-95"
          >
            {currentLang === 'ko' ? '예약하기' : 'Book'}
          </button>

          {/* Hamburger Menu - Classic 3-Line Button (모바일 전용, 데스크톱에서 숨김) */}
          <button
            onClick={onMenuClick}
            className="lg:hidden w-11 h-11 bg-bee-yellow flex flex-col items-center justify-center gap-[3px] rounded-xl hover:bg-white hover:scale-105 active:scale-95 transition-all shadow-xl ml-1"
          >
            <span className="w-4 h-[1.5px] bg-black rounded-full"></span>
            <span className="w-4 h-[1.5px] bg-black rounded-full"></span>
            <span className="w-4 h-[1.5px] bg-black rounded-full"></span>
          </button>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
