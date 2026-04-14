
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore } from '../src/store/appStore';
import { Globe, X, Check } from 'lucide-react';

interface LanguagePopupProps {
    t: any;
    onLangChange?: (lang: string) => void;
}

const LANGUAGES = [
    { code: 'ko',    name: '한국어',          nativeName: '한국어',       flag: '🇰🇷' },
    { code: 'en',    name: 'English',         nativeName: 'English',     flag: '🇺🇸' },
    { code: 'zh',    name: '简体中文',         nativeName: '简体中文',     flag: '🇨🇳' },
    { code: 'zh-TW', name: '繁體中文 (TW)',   nativeName: '繁體中文',     flag: '🇹🇼' },
    { code: 'zh-HK', name: '繁體中文 (HK)',   nativeName: '繁體中文',     flag: '🇭🇰' },
    { code: 'ja',    name: '日本語',           nativeName: '日本語',       flag: '🇯🇵' },
];

const detectBrowserLang = (): string => {
    const b = navigator.language.toLowerCase();
    if (b.includes('hk')) return 'zh-HK';
    if (b.includes('tw')) return 'zh-TW';
    if (b.startsWith('zh')) return 'zh';
    if (b.startsWith('ja')) return 'ja';
    if (b.startsWith('en')) return 'en';
    return 'ko';
};

const LanguagePopup: React.FC<LanguagePopupProps> = ({ t, onLangChange }) => {
    const { lang, setLang } = useAppStore();
    const [isVisible, setIsVisible] = useState(false);
    const [detectedLang] = useState<string>(detectBrowserLang);

    useEffect(() => {
        const hasSeenPopup = sessionStorage.getItem('beeliber_lang_popup_seen');
        if (hasSeenPopup) return;

        const timer = setTimeout(() => setIsVisible(true), 1500);
        return () => clearTimeout(timer);
    }, []);

    const handleClose = () => {
        setIsVisible(false);
        sessionStorage.setItem('beeliber_lang_popup_seen', 'true');
    };

    const handleSwitch = (newLang: string) => {
        if (onLangChange) {
            onLangChange(newLang);
        } else {
            setLang(newLang);
        }
        setIsVisible(false);
        sessionStorage.setItem('beeliber_lang_popup_seen', 'true');
    };

    if (!isVisible) return null;

    return (
        <AnimatePresence>
            {/* Backdrop */}
            <motion.div
                key="lang-popup-backdrop"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="fixed inset-0 z-[2999] bg-black/50 backdrop-blur-sm"
                onClick={handleClose}
            />

            {/* Centered Modal */}
            <motion.div
                key="lang-popup"
                initial={{ opacity: 0, scale: 0.88, y: 24 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.88, y: 24 }}
                transition={{ type: 'spring', stiffness: 320, damping: 26 }}
                className="fixed inset-0 z-[3000] flex items-center justify-center px-5 pointer-events-none"
            >
                <div className="bg-white rounded-[2rem] shadow-[0_32px_80px_rgba(0,0,0,0.25)] border border-black/5 overflow-hidden w-full max-w-md pointer-events-auto">
                    {/* Header */}
                    <div className="flex items-center justify-between px-7 py-6 border-b border-gray-100">
                        <div className="flex items-center gap-3">
                            <div className="w-11 h-11 bg-bee-yellow rounded-2xl flex items-center justify-center">
                                <Globe size={20} className="text-bee-black" />
                            </div>
                            <div>
                                <p className="text-base font-black text-bee-black leading-tight">언어 선택</p>
                                <p className="text-xs text-gray-400 font-medium">Select your language</p>
                            </div>
                        </div>
                        <button
                            onClick={handleClose}
                            className="w-9 h-9 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 hover:text-black transition-colors"
                            title="Close"
                        >
                            <X size={17} />
                        </button>
                    </div>

                    {/* Language Grid */}
                    <div className="p-5 grid grid-cols-2 gap-2.5">
                        {LANGUAGES.map((l) => {
                            const isCurrent = lang === l.code;
                            const isDetected = detectedLang === l.code;
                            return (
                                <button
                                    key={l.code}
                                    onClick={() => handleSwitch(l.code)}
                                    className={`
                                        flex items-center gap-3.5 px-5 py-4 rounded-2xl transition-all text-left relative
                                        ${isCurrent
                                            ? 'bg-bee-yellow text-bee-black shadow-md'
                                            : 'bg-gray-50 hover:bg-gray-100 text-bee-black'}
                                    `}
                                >
                                    <span className="text-3xl leading-none">{l.flag}</span>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-black leading-tight truncate">{l.nativeName}</p>
                                        {isDetected && !isCurrent && (
                                            <p className="text-[9px] font-black text-bee-yellow bg-bee-black px-1.5 py-0.5 rounded-full inline-block mt-1 uppercase tracking-wide">
                                                추천
                                            </p>
                                        )}
                                    </div>
                                    {isCurrent && (
                                        <Check size={16} className="flex-shrink-0 text-bee-black" />
                                    )}
                                </button>
                            );
                        })}
                    </div>

                    {/* Footer hint */}
                    <p className="text-center text-[11px] text-gray-300 pb-5 font-medium">
                        언제든지 상단 메뉴에서 변경할 수 있습니다
                    </p>
                </div>
            </motion.div>
        </AnimatePresence>
    );
};

export default LanguagePopup;
