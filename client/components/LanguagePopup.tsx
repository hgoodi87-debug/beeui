
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore } from '../src/store/appStore';
import { Languages, X, Globe, ChevronRight } from 'lucide-react';

interface LanguagePopupProps {
    t: any;
}

const LanguagePopup: React.FC<LanguagePopupProps> = ({ t }) => {
    const { lang, setLang } = useAppStore();
    const [isVisible, setIsVisible] = useState(false);
    const [detectedLang, setDetectedLang] = useState<string | null>(null);

    const languageMap: Record<string, { name: string; icon: string; code: string }> = {
        'ko': { name: '한국어', icon: '🇰🇷', code: 'ko' },
        'en': { name: 'English', icon: '🇺🇸', code: 'en' },
        'ja': { name: '日本語', icon: '🇯🇵', code: 'ja' },
        'zh-CN': { name: '简体中文', icon: '🇨🇳', code: 'zh-CN' },
        'zh-HK': { name: '繁體中文 (HK)', icon: '🇭🇰', code: 'zh-HK' },
        'zh-TW': { name: '繁體中文 (TW)', icon: '🇹🇼', code: 'zh-TW' },
    };

    useEffect(() => {
        // Only run once per session or use a persistence check
        const hasSeenPopup = sessionStorage.getItem('beeliber_lang_popup_seen');
        if (hasSeenPopup) return;

        const browserLang = navigator.language.toLowerCase();
        let targetLang = 'ko';

        if (browserLang.startsWith('en')) targetLang = 'en';
        else if (browserLang.startsWith('ja')) targetLang = 'ja';
        else if (browserLang.includes('hk')) targetLang = 'zh-HK';
        else if (browserLang.includes('tw')) targetLang = 'zh-TW';
        else if (browserLang.startsWith('zh')) targetLang = 'zh-CN';
        else if (browserLang.startsWith('ko')) targetLang = 'ko';

        // Simplify zh-CN if needed (project uses 'zh' for zh-CN)
        const projectLang = targetLang === 'zh-CN' ? 'zh' : targetLang;

        if (projectLang !== lang) {
            setDetectedLang(projectLang);
            // Wait a bit before showing
            const timer = setTimeout(() => {
                setIsVisible(true);
            }, 1500);
            return () => clearTimeout(timer);
        }
    }, [lang]);

    const handleClose = () => {
        setIsVisible(false);
        sessionStorage.setItem('beeliber_lang_popup_seen', 'true');
    };

    const handleSwitch = (newLang: string) => {
        setLang(newLang);
        setIsVisible(false);
        sessionStorage.setItem('beeliber_lang_popup_seen', 'true');
    };

    if (!isVisible || !detectedLang) return null;

    const targetInfo = languageMap[detectedLang] || languageMap['en'];

    return (
        <AnimatePresence>
            <div className="fixed bottom-10 left-10 z-[3000] hidden md:block">
                <motion.div
                    initial={{ opacity: 0, x: -50, scale: 0.9 }}
                    animate={{ opacity: 1, x: 0, scale: 1 }}
                    exit={{ opacity: 0, x: -50, scale: 0.9 }}
                    className="bg-white rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.15)] border border-black/5 p-6 w-[320px] backdrop-blur-xl bg-white/90"
                >
                    <button
                        onClick={handleClose}
                        className="absolute top-4 right-4 text-gray-400 hover:text-black transition-colors"
                        title="Close Language Suggestion"
                    >
                        <X size={18} />
                    </button>

                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 bg-bee-yellow rounded-2xl flex items-center justify-center shadow-lg shadow-bee-yellow/20">
                            <Languages size={20} className="text-black" />
                        </div>
                        <div>
                            <h4 className="text-sm font-black text-bee-black">Language Suggestion</h4>
                            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Global Traveler Service</p>
                        </div>
                    </div>

                    <p className="text-sm text-gray-600 mb-6 leading-relaxed">
                        It looks like your browser is set to <span className="font-bold text-bee-black">{targetInfo.name}</span>. Would you like to switch the language?
                    </p>

                    <div className="space-y-2">
                        <button
                            onClick={() => handleSwitch(detectedLang)}
                            className="w-full bg-bee-yellow hover:bg-yellow-400 text-bee-black py-4 rounded-2xl font-black text-sm transition-all flex items-center justify-between px-6 shadow-xl shadow-bee-yellow/10"
                        >
                            <span className="flex items-center gap-3">
                                <span className="text-lg">{targetInfo.icon}</span>
                                Switch to {targetInfo.name}
                            </span>
                            <ChevronRight size={16} />
                        </button>
                        <button
                            onClick={handleClose}
                            className="w-full bg-gray-50 hover:bg-gray-100 text-gray-500 py-4 rounded-2xl font-bold text-sm transition-all text-center"
                        >
                            Keep using {languageMap[lang]?.name || lang}
                        </button>
                    </div>
                </motion.div>
            </div>

            {/* Mobile Version */}
            <div className="fixed inset-x-0 bottom-0 z-[3000] md:hidden p-6">
                <motion.div
                    initial={{ opacity: 0, y: 100 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 100 }}
                    className="bg-white rounded-[2.5rem] shadow-[0_-20px_50px_rgba(0,0,0,0.1)] p-8 border-t border-black/5"
                >
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-bee-yellow rounded-2xl flex items-center justify-center">
                                <Globe size={24} />
                            </div>
                            <h4 className="text-lg font-black">{targetInfo.name} 지원</h4>
                        </div>
                        <button onClick={handleClose} className="p-2" title="Close Language Suggestion">
                            <X size={24} />
                        </button>
                    </div>

                    <p className="text-gray-600 mb-8 break-keep">
                        브라우저 언어 설정에 맞춰 {targetInfo.name}로 서비스를 이용하시겠습니까?
                    </p>

                    <div className="grid grid-cols-2 gap-4">
                        <button
                            onClick={handleClose}
                            className="bg-gray-100 text-gray-500 py-5 rounded-3xl font-bold"
                        >
                            아니오
                        </button>
                        <button
                            onClick={() => handleSwitch(detectedLang)}
                            className="bg-bee-yellow text-bee-black py-5 rounded-3xl font-black shadow-lg shadow-bee-yellow/20"
                        >
                            네, 바꿀게요
                        </button>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};

export default LanguagePopup;
