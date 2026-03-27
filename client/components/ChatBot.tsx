import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocation } from 'react-router-dom';
import { sendMessageToGemini, translateText } from '../services/geminiService';
import { StorageService } from '../services/storageService';
import { ChatMessage, ChatSession } from '../types';

interface ChatBotProps {
    t?: any;
    lang: string;
}

const INACTIVITY_LIMIT = 300000; // 5 minutes (300,000ms)
const SUPPORTED_URL_LANGS = new Set(['ko', 'en', 'zh', 'zh-tw', 'zh-hk', 'ja']);

const ChatBot: React.FC<ChatBotProps> = ({ t, lang }) => {
    const location = useLocation();
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);
    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const [userInfo, setUserInfo] = useState<{ name: string; email: string; snsChannel: string; snsId: string }>({
        name: localStorage.getItem('beeliber_user_name') || '',
        email: localStorage.getItem('beeliber_user_email') || '',
        snsChannel: localStorage.getItem('beeliber_user_sns_channel') || 'kakao',
        snsId: localStorage.getItem('beeliber_user_sns_id') || ''
    });
    const [isInfoSubmitted, setIsInfoSubmitted] = useState(() => {
        return !!(localStorage.getItem('beeliber_user_name') &&
            localStorage.getItem('beeliber_user_email') &&
            localStorage.getItem('beeliber_user_sns_id'));
    });

    // Generate or retrieve session ID for threading
    const [sessionId] = useState(() => {
        const saved = sessionStorage.getItem('beeliber_chat_session_id');
        if (saved) return saved;
        const newId = 'sess_' + Math.random().toString(36).substring(2, 9);
        sessionStorage.setItem('beeliber_chat_session_id', newId);
        return newId;
    });

    const [sessionMeta, setSessionMeta] = useState<ChatSession | null>(null);

    const [translatedMessages, setTranslatedMessages] = useState<Record<string, string>>({});
    const firstSegment = location.pathname.split('/').filter(Boolean)[0]?.toLowerCase() || '';
    const isPublicLangRoute = SUPPORTED_URL_LANGS.has(firstSegment);

    // 관리자 메시지 실시간 번역 로직
    useEffect(() => {
        if (lang === 'ko') return;

        const translateNewAdminMessages = async () => {
            const adminMsgs = messages.filter(m => m.role === 'admin' && !translatedMessages[m.timestamp]);

            if (adminMsgs.length === 0) return;

            console.log(`${adminMsgs.length}개의 새로운 관리자 메시지 번역 중...`);

            for (const msg of adminMsgs) {
                try {
                    const translated = await translateText(msg.text, lang);
                    setTranslatedMessages(prev => ({
                        ...prev,
                        [msg.timestamp]: translated
                    }));
                } catch (e) {
                    console.error("번역 오류 발생:", e);
                }
            }
        };

        translateNewAdminMessages();
    }, [messages, lang, translatedMessages]);

    // Subscribe to chat messages
    useEffect(() => {
        if (!isOpen || !sessionId) return;
        const unsubscribe = StorageService.subscribeChatMessages(sessionId, (msgs) => {
            setMessages(msgs);
            // If we find existing messages, we consider info as submitted even if state was false
            if (msgs.length > 0 && !isInfoSubmitted) {
                setIsInfoSubmitted(true);
            }
        });
        return () => unsubscribe();
    }, [isOpen, sessionId]);

    // Subscribe to session metadata
    useEffect(() => {
        if (!isOpen || !sessionId) return;
        const unsubscribe = StorageService.subscribeChatSessions((sessions) => {
            const current = sessions.find(s => s.sessionId === sessionId);
            if (current) setSessionMeta(current);
        });
        return () => unsubscribe();
    }, [isOpen, sessionId]);

    // Initial Welcome Message - Only if no messages in Firestore yet
    useEffect(() => {
        if (t?.welcome && messages.length === 0 && isInfoSubmitted) {
            const welcomeMsg: ChatMessage = {
                role: 'model',
                text: t.welcome,
                timestamp: new Date().toISOString(),
                sessionId,
                userName: userInfo.name,
                userEmail: userInfo.email
            };
            StorageService.saveChatMessage(welcomeMsg);
        }
    }, [t, messages.length, isInfoSubmitted]);

    // Scroll to bottom on new message
    useEffect(() => {
        if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }, [messages, isOpen, loading, isInfoSubmitted]);

    // Inactivity Timer Logic
    useEffect(() => {
        if (!isOpen || !isInfoSubmitted) return;

        // Reset timer on any change to messages or when opened
        if (timerRef.current) clearTimeout(timerRef.current);

        if (messages.length > 1) { // Only start timer if user has interacted (more than just welcome msg)
            timerRef.current = setTimeout(() => {
                handleAutoClose();
            }, INACTIVITY_LIMIT);
        }

        return () => {
            if (timerRef.current) clearTimeout(timerRef.current);
        };
    }, [messages, isOpen, isInfoSubmitted]);

    const handleAutoClose = () => {
        setIsOpen(false);
        setLoading(false);
    };


    const sendToGoogleChat = async (role: 'user' | 'model', text: string) => {
        // Core Webhook URL (Direct fallback)
        const directWebhook = import.meta.env.VITE_GOOGLE_CHAT_WEBHOOK_URL;
        const functionUrl = `${window.location.origin}/api/notify-google-chat`;

        const displayRole = role === 'user' ? `${userInfo.name || t?.user_label || '고객'} (${userInfo.email || 'N/A'})` : `${t?.header || 'Bee AI'}`;
        const payload = {
            text: `*${displayRole}*: ${text}`,
            thread: { threadKey: sessionId }
        };

        // Attempt 1: Cloud Function Proxy (CORS Friendly)
        try {
            console.log('Attempting Proxy Notification...');
            const response = await fetch(functionUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    text,
                    sessionId,
                    senderName: userInfo.name || localStorage.getItem('beeliber_user_name'),
                    senderEmail: userInfo.email || localStorage.getItem('beeliber_user_email'),
                    snsChannel: userInfo.snsChannel || localStorage.getItem('beeliber_user_sns_channel'),
                    snsId: userInfo.snsId || localStorage.getItem('beeliber_user_sns_id'),
                    role
                })
            });
            if (response.ok) {
                console.log('Proxy Notification Success');
                return;
            }
        } catch (e) {
            console.error('Proxy Notification Failed:', e);
        }

        // Attempt 2: Direct Webhook (Fallback - may hit CORS but good for mobile app-like environments)
        try {
            console.log('Attempting Direct Webhook Fallback...');
            await fetch(directWebhook || '', {
                method: 'POST',
                mode: 'no-cors',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            console.log('Direct Webhook Sent (no-cors mode)');
        } catch (e) {
            console.error('Direct Webhook Failed:', e);
        }
    };

    const processMessage = async (userText: string, hiddenPrompt?: string) => {
        setLoading(true);

        const userMsg: ChatMessage = {
            role: 'user',
            text: userText,
            timestamp: new Date().toISOString(),
            sessionId,
            userName: userInfo.name,
            userEmail: userInfo.email
        };

        await StorageService.saveChatMessage(userMsg);

        const chatText = hiddenPrompt ? (t?.notify_template?.replace('{userText}', userText) || `[챗봇 알림] 고객이 '${userText}' 버튼을 클릭했습니다.`) : userText;
        await sendToGoogleChat('user', chatText);

        await StorageService.saveChatSession({
            sessionId,
            userName: userInfo.name,
            userEmail: userInfo.email,
            lastMessage: userText,
            timestamp: userMsg.timestamp
        });

        if (sessionMeta?.isBotDisabled) {
            console.log("Bot is disabled by admin. Skipping AI response.");
            return;
        }

        try {
            const historyContext = messages.map(m => ({ role: (m.role === 'admin' ? 'model' : m.role) as any, text: m.text }));
            const promptToSend = hiddenPrompt || userText;
            const responseText = await sendMessageToGemini(historyContext, promptToSend, lang);

            if (responseText) {
                const aiMsg: ChatMessage = {
                    role: 'model',
                    text: responseText,
                    timestamp: new Date().toISOString(),
                    sessionId,
                    userName: 'Bee AI',
                    userEmail: 'ai@beeliber.com'
                };
                await StorageService.saveChatMessage(aiMsg);
                sendToGoogleChat('model', responseText);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const handleSend = () => {
        if (!input.trim() || loading) return;
        processMessage(input);
        setInput('');
    };

    const handleInfoSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        localStorage.setItem('beeliber_user_name', userInfo.name);
        localStorage.setItem('beeliber_user_email', userInfo.email);
        localStorage.setItem('beeliber_user_sns_channel', userInfo.snsChannel);
        localStorage.setItem('beeliber_user_sns_id', userInfo.snsId);

        setIsInfoSubmitted(true);

        StorageService.saveChatSession({
            sessionId,
            userName: userInfo.name,
            userEmail: userInfo.email,
            lastMessage: t?.request_consult || '상담 요청',
            timestamp: new Date().toISOString()
        });
    };

    const handleTopicClick = async (topic: 'DELIVERY' | 'STORAGE' | 'OTHER' | 'REFUND') => {
        let userText = "";
        let hiddenPrompt = "";

        switch (topic) {
            case 'DELIVERY':
                userText = t?.topic_delivery || "배송 서비스에 대해 설명해주세요.";
                hiddenPrompt = t?.ai_delivery_prompt || "짐 배송 서비스의 이용 방법, 가격(2만원~), 공항-호텔 간 이동 절차에 대해 자세히 설명해줘.";
                break;
            case 'STORAGE':
                userText = t?.topic_storage || "짐 보관 방법이 궁금해요.";
                hiddenPrompt = t?.ai_storage_prompt || "짐 보관 서비스의 이용 방법, 파트너지점 지점 위치, 보관료(4시간, 1일 등)에 대해 설명해줘.";
                break;
            case 'OTHER':
                userText = t?.topic_other || "기타 문의사항이 있습니다.";
                hiddenPrompt = t?.ai_other_prompt || "예약 취소 환불 규정이나 고객센터 연결 방법에 대해 안내해줘.";
                break;
            case 'REFUND':
                userText = t?.topic_refund || "환불 절차가 궁금해요.";
                hiddenPrompt = t?.ai_refund_prompt || "예약 취소 및 환불 규정에 대해 상세히 설명해줘. (24시간 전 100%, 12시간 전 50% 등)";
                break;
        }
        await processMessage(userText, hiddenPrompt);
    };

    const handleQuickBook = () => {
        setIsOpen(false);
        window.location.hash = '#booking';
    };

    if (!isPublicLangRoute) {
        return null;
    }

    return (
        <div className="fixed bottom-6 right-6 z-[150] flex flex-col items-end font-sans">
            {isOpen && (
                <div className="mb-4 w-[calc(100vw-3rem)] sm:w-[350px] md:w-[400px] h-[600px] max-h-[80vh] bg-white border border-gray-100 rounded-[40px] shadow-2xl flex flex-col overflow-hidden animate-fade-in-up">
                    <div className="bg-bee-yellow p-6 flex justify-between items-center relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-10 -mt-10 blur-xl"></div>
                        <div className="flex items-center gap-4 relative z-10">
                            <div className="w-12 h-12 rounded-2xl bg-bee-black flex items-center justify-center text-bee-yellow font-black text-lg shadow-lg">B</div>
                            <div>
                                <h4 className="text-bee-black font-black text-base leading-none tracking-tight">{t?.header || 'Bee AI'}</h4>
                                <div className="flex items-center gap-2 mt-1.5">
                                    <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                                    <span className="text-bee-black/60 text-[10px] font-black uppercase tracking-widest">
                                        {t?.online || 'Online'}
                                    </span>
                                </div>
                            </div>
                        </div>
                        <button title="Close Chat" aria-label="Close Chat" onClick={handleAutoClose} className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/40 flex items-center justify-center text-bee-black transition-all relative z-10">
                            <i className="fa-solid fa-times"></i>
                        </button>
                    </div>

                    {!isInfoSubmitted ? (
                        <div className="flex-1 p-8 flex flex-col justify-center bg-gray-50/50">
                            <div className="text-center mb-8">
                                <h5 className="text-xl font-black text-bee-black mb-2">{t?.form_title || '상담 시작하기'}</h5>
                                <p className="text-sm text-gray-500 font-medium whitespace-pre-line">
                                    {t?.form_desc || '더 나은 도움을 드리기 위해\n이름과 이메일을 입력해 주세요.'}
                                </p>
                            </div>
                            <form onSubmit={handleInfoSubmit} className="space-y-4">
                                <div>
                                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-2 mb-1 block">{t?.name || 'Name'}</label>
                                    <input
                                        required
                                        type="text"
                                        placeholder={t?.name || "성함 (Name)"}
                                        className="w-full bg-white border-2 border-transparent focus:border-bee-yellow rounded-2xl py-4 px-6 text-sm font-bold shadow-sm outline-none transition-all"
                                        value={userInfo.name}
                                        onChange={e => setUserInfo({ ...userInfo, name: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-2 mb-1 block">{t?.email || 'Email'}</label>
                                    <input
                                        required
                                        type="email"
                                        placeholder="example@email.com"
                                        className="w-full bg-white border-2 border-transparent focus:border-bee-yellow rounded-2xl py-4 px-6 text-sm font-bold shadow-sm outline-none transition-all"
                                        value={userInfo.email}
                                        onChange={e => setUserInfo({ ...userInfo, email: e.target.value })}
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-2 mb-1 block">{t?.sns || 'SNS'}</label>
                                        <select
                                            title="Select SNS Channel"
                                            aria-label="Select SNS Channel"
                                            className="w-full bg-white border-2 border-transparent focus:border-bee-yellow rounded-2xl py-4 px-4 text-xs font-bold shadow-sm outline-none transition-all appearance-none cursor-pointer"
                                            value={userInfo.snsChannel}
                                            onChange={e => setUserInfo({ ...userInfo, snsChannel: e.target.value })}
                                        >
                                            <option value="kakao">Kakao</option>
                                            <option value="line">LINE</option>
                                            <option value="whatsapp">WhatsApp</option>
                                            <option value="instagram">Instagram</option>
                                            <option value="wechat">WeChat</option>
                                            <option value="other">Other</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-2 mb-1 block">SNS ID</label>
                                        <input
                                            required
                                            type="text"
                                            placeholder="ID"
                                            className="w-full bg-white border-2 border-transparent focus:border-bee-yellow rounded-2xl py-4 px-4 text-sm font-bold shadow-sm outline-none transition-all"
                                            value={userInfo.snsId}
                                            onChange={e => setUserInfo({ ...userInfo, snsId: e.target.value })}
                                        />
                                    </div>
                                </div>
                                <button
                                    type="submit"
                                    className="w-full bg-bee-black text-bee-yellow py-5 rounded-2xl font-black text-base shadow-xl hover:scale-[1.02] active:scale-95 transition-all mt-4"
                                >
                                    {t?.start_chat || '상담 시작하기'}
                                </button>
                            </form>
                        </div>
                    ) : (
                        <>
                            {messages.length > 1 && (
                                <div className="h-1 w-full bg-gray-100">
                                    <div
                                        className="h-full bg-bee-yellow transition-all ease-linear w-0 animate-[width-full_300s_linear_forwards]"
                                        key={messages.length}
                                    ></div>
                                </div>
                            )}

                            <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-gray-50/50 custom-scrollbar scroll-smooth" ref={scrollRef}>
                                {messages.map((msg, idx) => (
                                    <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in-up`}>
                                        <div className={`max-w-[85%] p-4 rounded-3xl text-sm font-bold leading-relaxed shadow-sm ${msg.role === 'user' ? 'bg-bee-black text-white rounded-tr-none' : (msg.role === 'admin' ? 'bg-bee-yellow text-bee-black border border-bee-yellow/20 rounded-tl-none font-black scale-[1.02] shadow-md ring-2 ring-bee-yellow ring-offset-2' : 'bg-white text-bee-black border border-gray-100 rounded-tl-none')}`}>
                                            {msg.role === 'admin' && (
                                                <div className="flex items-center gap-1.5 mb-1.5">
                                                    <i className="fa-solid fa-shield-halved text-[8px]"></i>
                                                    <span className="text-[8px] font-black uppercase tracking-widest opacity-60">Staff Answer</span>
                                                </div>
                                            )}
                                            {msg.role === 'admin' ? (
                                                <div className="space-y-2">
                                                    <div>{translatedMessages[msg.timestamp] || msg.text}</div>
                                                    {translatedMessages[msg.timestamp] && (
                                                        <div className="text-[10px] opacity-40 border-t border-bee-black/10 pt-1 font-medium italic">
                                                            Original: {msg.text}
                                                        </div>
                                                    )}
                                                </div>
                                            ) : msg.text}
                                        </div>
                                    </div>
                                ))}

                                {loading && (
                                    <div className="flex justify-start">
                                        <div className="bg-white p-4 rounded-2xl flex gap-1.5 animate-pulse border border-gray-100">
                                            <div className="w-1.5 h-1.5 bg-bee-yellow rounded-full"></div>
                                            <div className="w-1.5 h-1.5 bg-bee-yellow rounded-full"></div>
                                            <div className="w-1.5 h-1.5 bg-bee-yellow rounded-full"></div>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {!loading && messages.length === 1 && (
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className="absolute inset-x-6 top-1/2 -translate-y-1/2 bg-white rounded-[32px] shadow-[0_20px_50px_rgba(0,0,0,0.15)] p-6 z-20 border border-gray-50"
                                >
                                    <p className="text-[11px] font-black text-bee-black uppercase tracking-widest text-center mb-6 opacity-60">
                                        {t?.chatbot?.topic_menu_title || (lang === 'ko' ? '원하시는 서비스를 선택해주세요' : 'Please select a service')}
                                    </p>
                                    <div className="grid grid-cols-1 gap-3">
                                        <button onClick={() => handleTopicClick('DELIVERY')} className="bg-gray-50 hover:bg-bee-yellow border border-transparent p-4 rounded-2xl text-left transition-all group">
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-bee-black shadow-sm group-hover:scale-110 transition-transform"><i className="fa-solid fa-truck-fast"></i></div>
                                                <div>
                                                    <h5 className="font-black text-bee-black text-sm">{t?.topic_delivery}</h5>
                                                    <p className="text-[10px] text-gray-400 group-hover:text-bee-black/60 font-bold">{t?.topic_delivery_sub}</p>
                                                </div>
                                            </div>
                                        </button>
                                        <button onClick={() => handleTopicClick('STORAGE')} className="bg-gray-50 hover:bg-bee-black border border-transparent p-4 rounded-2xl text-left transition-all group">
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-bee-black shadow-sm group-hover:rotate-12 transition-transform"><i className="fa-solid fa-box-archive"></i></div>
                                                <div>
                                                    <h5 className="font-black text-bee-black group-hover:text-bee-yellow text-sm">{t?.topic_storage}</h5>
                                                    <p className="text-[10px] text-gray-400 group-hover:text-bee-yellow/60 font-bold">{t?.topic_storage_sub}</p>
                                                </div>
                                            </div>
                                        </button>
                                        <div className="grid grid-cols-2 gap-3 mt-2">
                                            <button onClick={() => handleTopicClick('REFUND')} className="bg-gray-50 hover:bg-red-50 border border-transparent p-4 rounded-2xl text-left transition-all group">
                                                <div className="flex flex-col items-center gap-2">
                                                    <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-red-500 shadow-sm"><i className="fa-solid fa-rotate-left"></i></div>
                                                    <h5 className="font-black text-bee-black group-hover:text-red-600 text-[11px]">{t?.topic_refund}</h5>
                                                </div>
                                            </button>
                                            <button onClick={() => handleTopicClick('OTHER')} className="bg-gray-50 hover:bg-gray-100 border border-transparent p-4 rounded-2xl text-left transition-all group">
                                                <div className="flex flex-col items-center gap-2">
                                                    <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-bee-black shadow-sm"><i className="fa-solid fa-headset"></i></div>
                                                    <h5 className="font-black text-bee-black text-[11px]">{t?.topic_other}</h5>
                                                </div>
                                            </button>
                                        </div>
                                    </div>
                                </motion.div>
                            )}

                            <div className="p-4 bg-white border-t border-gray-100">
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        className="flex-1 min-w-0 bg-gray-50 border-none rounded-2xl py-4 px-4 sm:px-6 text-sm font-bold focus:ring-2 focus:ring-bee-yellow outline-none placeholder:text-gray-300 transition-all"
                                        placeholder={t?.placeholder || "메시지를 입력하세요..."}
                                        value={input}
                                        onChange={(e) => setInput(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                                    />
                                    <button
                                        onClick={handleSend}
                                        disabled={loading || !input.trim()}
                                        className="w-14 sm:w-auto sm:px-6 h-14 bg-bee-black text-bee-yellow rounded-2xl hover:bg-bee-black/90 transition-all flex items-center justify-center shadow-lg active:scale-95 disabled:opacity-50 flex-shrink-0"
                                        aria-label="Send"
                                    >
                                        <div className="flex items-center gap-2">
                                            <span className="hidden sm:block font-black text-sm uppercase tracking-tighter">Send</span>
                                            <i className="fa-solid fa-paper-plane text-base sm:text-sm"></i>
                                        </div>
                                    </button>
                                </div>
                                {messages.length > 1 && (
                                    <p className="text-[9px] text-center text-gray-300 mt-2 font-medium">
                                        * {lang === 'ko' ? '5분간 입력이 없으면 상담이 자동 종료됩니다.' : (lang === 'en' ? 'Chat auto-closes after 5 mins of inactivity.' : (lang === 'zh-CN' ? '5分钟无活动将自动关闭。' : '5분간 입력이 없으면 상담이 자동 종료됩니다.'))}
                                    </p>
                                )}
                            </div>
                        </>
                    )}
                </div>
            )}

            <button onClick={() => isOpen ? handleAutoClose() : setIsOpen(true)} className={`w-16 h-16 rounded-[24px] bg-bee-yellow shadow-2xl flex items-center justify-center transition-all hover:scale-110 active:scale-95 z-10 ${isOpen ? 'rotate-90 bg-bee-black' : ''}`}>
                {isOpen ? <i className="fa-solid fa-times text-bee-yellow text-xl"></i> : <div className="relative"><i className="fa-solid fa-robot text-bee-black text-2xl"></i><span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-bee-yellow animate-pulse"></span></div>}
            </button>
            <style>{`
                @keyframes width-full {
                    from { width: 100%; }
                    to { width: 0%; }
                }
            `}</style>
        </div>
    );
};

export default ChatBot;
