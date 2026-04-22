import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocation } from 'react-router-dom';
import { Home, MessageSquare, HelpCircle, ArrowLeft, Send, X, Search, ChevronRight } from 'lucide-react';
import { sendMessageToGemini, translateText } from '../services/geminiService';
import { StorageService } from '../services/storageService';
import { resolveSupabaseEndpoint } from '../services/supabaseRuntime';
import { ChatMessage, ChatSession } from '../types';

interface ChatBotProps {
    t?: any;
    lang: string;
}

const INACTIVITY_LIMIT = 300000;
const SUPPORTED_URL_LANGS = new Set(['ko', 'en', 'zh', 'zh-tw', 'zh-hk', 'ja']);
const GOOGLE_CHAT_NOTIFY_ENDPOINT = resolveSupabaseEndpoint(
    import.meta.env.VITE_GOOGLE_CHAT_NOTIFY_ENDPOINT,
    '/functions/v1/notify-google-chat',
);

type TabType = 'home' | 'messages' | 'help';
type ViewType = TabType | 'chat';

const LABELS: Record<string, {
    greeting: string; greeting_sub: string; send_btn: string;
    tab_home: string; tab_messages: string; tab_help: string;
    no_msg: string; no_msg_sub: string;
    help_title: string;
    faq: { label: string; sub: string; topic: 'STORAGE' | 'DELIVERY' | 'REFUND' | 'OTHER' }[];
    placeholder: string; auto_close: string; escalate_btn: string;
    form_title: string; form_desc: string; start_chat: string;
    name: string; email: string; sns: string;
    online: string; staff: string; header: string;
    send_msg_empty: string;
}> = {
    ko: {
        greeting: '안녕하세요 👋', greeting_sub: '도움이 필요하신가요?',
        send_btn: '메시지를 보내주세요', tab_home: '홈', tab_messages: '메시지', tab_help: '도움말',
        no_msg: '메시지 없음', no_msg_sub: '팀의 메시지가 여기에 표시됩니다',
        help_title: '도움말 검색',
        faq: [
            { label: '짐 보관 예약은 어떻게 하나요?', sub: '지점 위치·가격 안내', topic: 'STORAGE' },
            { label: '짐 배송 서비스 이용 방법', sub: '공항↔호텔 배송 절차', topic: 'DELIVERY' },
            { label: '취소 및 환불 규정 안내', sub: '환불 조건·절차 확인', topic: 'REFUND' },
            { label: 'Beeliber 지원팀의 도움 받기', sub: '직접 상담 연결', topic: 'OTHER' },
        ],
        placeholder: '메시지를 입력하세요...', auto_close: '5분간 입력이 없으면 자동 종료됩니다.',
        escalate_btn: '상담원 연결하기', form_title: '상담 시작하기',
        form_desc: '더 나은 도움을 드리기 위해\n이름과 이메일을 입력해 주세요.',
        start_chat: '상담 시작하기', name: '성함 (Name)', email: '이메일 (Email)', sns: 'SNS 채널',
        online: '온라인', staff: '스태프 답변', header: 'Beeliber 지원', send_msg_empty: '메시지 보내기',
    },
    en: {
        greeting: 'Hello 👋', greeting_sub: 'Need help?',
        send_btn: 'Send us a message', tab_home: 'Home', tab_messages: 'Messages', tab_help: 'Help',
        no_msg: 'No messages', no_msg_sub: 'Messages from our team will appear here',
        help_title: 'Help Search',
        faq: [
            { label: 'How do I book luggage storage?', sub: 'Locations & pricing', topic: 'STORAGE' },
            { label: 'How does delivery service work?', sub: 'Airport ↔ Hotel delivery', topic: 'DELIVERY' },
            { label: 'Cancellation & refund policy', sub: 'Check conditions', topic: 'REFUND' },
            { label: 'Get help from Beeliber team', sub: 'Connect directly', topic: 'OTHER' },
        ],
        placeholder: 'Type a message...', auto_close: 'Chat auto-closes after 5 mins of inactivity.',
        escalate_btn: 'Connect to Agent', form_title: 'Start Chat',
        form_desc: 'Please enter your name and email\nso we can assist you better.',
        start_chat: 'Start Chat', name: 'Name', email: 'Email', sns: 'SNS Channel',
        online: 'Online', staff: 'Staff Answer', header: 'Beeliber Support', send_msg_empty: 'Send Message',
    },
    'zh-tw': {
        greeting: '您好 👋', greeting_sub: '需要幫助嗎？',
        send_btn: '請傳送訊息給我們', tab_home: '首頁', tab_messages: '訊息', tab_help: '幫助',
        no_msg: '沒有訊息', no_msg_sub: '我們團隊的訊息將顯示在這裡',
        help_title: '幫助搜尋',
        faq: [
            { label: '如何預訂行李寄存？', sub: '地點與價格說明', topic: 'STORAGE' },
            { label: '行李配送服務如何使用？', sub: '機場↔飯店配送流程', topic: 'DELIVERY' },
            { label: '取消與退款規定', sub: '確認退款條件', topic: 'REFUND' },
            { label: '聯絡 Beeliber 支援團隊', sub: '直接連線客服', topic: 'OTHER' },
        ],
        placeholder: '輸入訊息...', auto_close: '5分鐘無活動後將自動關閉。',
        escalate_btn: '聯絡客服人員', form_title: '開始諮詢',
        form_desc: '請輸入您的姓名和電子郵件\n以便我們提供更好的協助。',
        start_chat: '開始諮詢', name: '姓名', email: '電子郵件', sns: 'SNS 頻道',
        online: '在線', staff: '客服回覆', header: 'Beeliber 支援', send_msg_empty: '傳送訊息',
    },
    zh: {
        greeting: '您好 👋', greeting_sub: '需要帮助吗？',
        send_btn: '请发送消息给我们', tab_home: '首页', tab_messages: '消息', tab_help: '帮助',
        no_msg: '没有消息', no_msg_sub: '来自团队的消息将显示在这里',
        help_title: '帮助搜索',
        faq: [
            { label: '如何预订行李寄存？', sub: '地点与价格说明', topic: 'STORAGE' },
            { label: '行李配送服务如何使用？', sub: '机场↔酒店配送流程', topic: 'DELIVERY' },
            { label: '取消与退款规定', sub: '确认退款条件', topic: 'REFUND' },
            { label: '联系 Beeliber 支援团队', sub: '直接连线客服', topic: 'OTHER' },
        ],
        placeholder: '输入消息...', auto_close: '5分钟无活动后将自动关闭。',
        escalate_btn: '联系客服', form_title: '开始咨询',
        form_desc: '请输入您的姓名和电子邮件\n以便我们提供更好的帮助。',
        start_chat: '开始咨询', name: '姓名', email: '电子邮件', sns: 'SNS 频道',
        online: '在线', staff: '客服回复', header: 'Beeliber 支援', send_msg_empty: '发送消息',
    },
    ja: {
        greeting: 'こんにちは 👋', greeting_sub: 'お手伝いしましょうか？',
        send_btn: 'メッセージを送ってください', tab_home: 'ホーム', tab_messages: 'メッセージ', tab_help: 'ヘルプ',
        no_msg: 'メッセージなし', no_msg_sub: 'チームのメッセージがここに表示されます',
        help_title: 'ヘルプ検索',
        faq: [
            { label: '荷物預かりの予約方法は？', sub: '場所と料金のご案内', topic: 'STORAGE' },
            { label: '荷物配送サービスの利用方法', sub: '空港↔ホテル配送手順', topic: 'DELIVERY' },
            { label: 'キャンセルと返金ポリシー', sub: '返金条件の確認', topic: 'REFUND' },
            { label: 'Beeliberサポートに連絡', sub: '直接サポートへ', topic: 'OTHER' },
        ],
        placeholder: 'メッセージを入力...', auto_close: '5分間入力がないと自動終了します。',
        escalate_btn: 'オペレーターに繋ぐ', form_title: '相談開始',
        form_desc: 'より良いサポートのため\nお名前とメールアドレスをご入力ください。',
        start_chat: '相談開始', name: 'お名前', email: 'メールアドレス', sns: 'SNSチャンネル',
        online: 'オンライン', staff: 'スタッフ回答', header: 'Beeliber サポート', send_msg_empty: 'メッセージ送信',
    },
};

const ChatBot: React.FC<ChatBotProps> = ({ t, lang }) => {
    const location = useLocation();
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [view, setView] = useState<ViewType>('home');
    const [activeTab, setActiveTab] = useState<TabType>('home');
    const [unreadCount, setUnreadCount] = useState(0);
    const scrollRef = useRef<HTMLDivElement>(null);
    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const [userInfo, setUserInfo] = useState({ name: localStorage.getItem('beeliber_user_name') || '', email: localStorage.getItem('beeliber_user_email') || '', snsChannel: localStorage.getItem('beeliber_user_sns_channel') || 'kakao', snsId: localStorage.getItem('beeliber_user_sns_id') || '' });
    const [isInfoSubmitted, setIsInfoSubmitted] = useState(() => !!(localStorage.getItem('beeliber_user_name') && localStorage.getItem('beeliber_user_email') && localStorage.getItem('beeliber_user_sns_id')));
    const [sessionId] = useState(() => { const s = sessionStorage.getItem('beeliber_chat_session_id'); if (s) return s; const n = 'sess_' + Math.random().toString(36).substring(2, 9); sessionStorage.setItem('beeliber_chat_session_id', n); return n; });
    const [sessionMeta, setSessionMeta] = useState<ChatSession | null>(null);
    const [showEscalate, setShowEscalate] = useState(false);
    const [translatedMessages, setTranslatedMessages] = useState<Record<string, string>>({});

    const L = LABELS[lang] ?? LABELS['en'];
    const firstSegment = location.pathname.split('/').filter(Boolean)[0]?.toLowerCase() || '';
    const isPublicLangRoute = SUPPORTED_URL_LANGS.has(firstSegment);

    // 관리자 메시지 실시간 번역 — isOpen 기반 유지
    useEffect(() => {
        if (lang === 'ko') return;
        const translateNewAdminMessages = async () => {
            const adminMsgs = messages.filter(m => m.role === 'admin' && !translatedMessages[m.timestamp]);
            if (adminMsgs.length === 0) return;
            for (const msg of adminMsgs) {
                try { const translated = await translateText(msg.text, lang); setTranslatedMessages(prev => ({ ...prev, [msg.timestamp]: translated })); }
                catch (e) { console.error('번역 오류:', e); }
            }
        };
        translateNewAdminMessages();
    }, [messages, lang, translatedMessages]);

    // 채팅 구독 — isOpen 기반 유지
    useEffect(() => {
        if (!isOpen || !sessionId) return;
        const unsubscribe = StorageService.subscribeChatMessages(sessionId, (msgs) => {
            setMessages(prev => {
                if (msgs.length > 0) {
                    // 채팅 뷰가 아닐 때 관리자 메시지 unread 카운트
                    if (view !== 'chat') {
                        const prevIds = new Set(prev.map(m => m.timestamp));
                        const newAdmin = msgs.filter(m => m.role === 'admin' && !prevIds.has(m.timestamp));
                        if (newAdmin.length > 0) setUnreadCount(c => c + newAdmin.length);
                    }
                    return msgs;
                }
                return prev;
            });
            if (msgs.length > 0 && !isInfoSubmitted) setIsInfoSubmitted(true);
        });
        return () => unsubscribe();
    }, [isOpen, sessionId]);

    // 세션 메타 구독
    useEffect(() => {
        if (!isOpen || !sessionId) return;
        const unsubscribe = StorageService.subscribeChatSessions((sessions) => {
            const current = sessions.find(s => s.sessionId === sessionId);
            if (current) setSessionMeta(current);
        });
        return () => unsubscribe();
    }, [isOpen, sessionId]);

    // 환영 메시지
    useEffect(() => {
        if (t?.welcome && messages.length === 0 && isInfoSubmitted) {
            const welcomeMsg: ChatMessage = { role: 'model', text: t.welcome, timestamp: new Date().toISOString(), sessionId, userName: userInfo.name, userEmail: userInfo.email };
            setMessages([welcomeMsg]);
            StorageService.saveChatSession({ sessionId, userName: userInfo.name, userEmail: userInfo.email, lastMessage: welcomeMsg.text, timestamp: welcomeMsg.timestamp });
            StorageService.saveChatMessage(welcomeMsg);
        }
    }, [t, messages.length, isInfoSubmitted]);

    // 스크롤 자동
    useEffect(() => {
        if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }, [messages, loading]);

    // 불활동 타이머
    useEffect(() => {
        if (!isOpen || !isInfoSubmitted || view !== 'chat') return;
        if (timerRef.current) clearTimeout(timerRef.current);
        if (messages.length > 1) timerRef.current = setTimeout(() => setIsOpen(false), INACTIVITY_LIMIT);
        return () => { if (timerRef.current) clearTimeout(timerRef.current); };
    }, [messages, isOpen, isInfoSubmitted, view]);

    const sendToGoogleChat = async (role: 'user' | 'model', text: string) => {
        try {
            const res = await fetch(GOOGLE_CHAT_NOTIFY_ENDPOINT, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ text, sessionId, senderName: userInfo.name, senderEmail: userInfo.email, snsChannel: userInfo.snsChannel, snsId: userInfo.snsId, role }) });
            if (!res.ok) throw new Error(await res.text().catch(() => ''));
        } catch (e) { console.error('Google Chat 알림 실패:', e); }
    };

    const processMessage = async (userText: string, hiddenPrompt?: string) => {
        setLoading(true);
        const userMsg: ChatMessage = { role: 'user', text: userText, timestamp: new Date().toISOString(), sessionId, userName: userInfo.name, userEmail: userInfo.email };
        setMessages(prev => [...prev, userMsg]);
        await StorageService.saveChatSession({ sessionId, userName: userInfo.name, userEmail: userInfo.email, lastMessage: userText, timestamp: userMsg.timestamp });
        await StorageService.saveChatMessage(userMsg);
        const chatText = hiddenPrompt ? (t?.notify_template?.replace('{userText}', userText) || `[챗봇 알림] 고객이 '${userText}' 버튼을 클릭했습니다.`) : userText;
        await sendToGoogleChat('user', chatText);
        if (sessionMeta?.isBotDisabled) { setLoading(false); return; }
        try {
            const historyContext = messages.map(m => ({ role: (m.role === 'admin' ? 'model' : m.role) as any, text: m.text }));
            const responseText = await sendMessageToGemini(historyContext, hiddenPrompt || userText, lang);
            if (responseText) {
                if (responseText.includes('[ESCALATE]')) setShowEscalate(true);
                const cleanText = responseText.replace(/\[ESCALATE\]\s*/g, '').trim();
                const aiMsg: ChatMessage = { role: 'model', text: cleanText, timestamp: new Date().toISOString(), sessionId, userName: 'Bee AI', userEmail: 'ai@beeliber.com' };
                setMessages(prev => [...prev, aiMsg]);
                await StorageService.saveChatMessage(aiMsg);
                sendToGoogleChat('model', cleanText);
            }
        } catch (e) { console.error(e); } finally { setLoading(false); }
    };

    const handleSend = () => { if (!input.trim() || loading) return; processMessage(input); setInput(''); };

    const handleInfoSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        localStorage.setItem('beeliber_user_name', userInfo.name);
        localStorage.setItem('beeliber_user_email', userInfo.email);
        localStorage.setItem('beeliber_user_sns_channel', userInfo.snsChannel);
        localStorage.setItem('beeliber_user_sns_id', userInfo.snsId);
        setIsInfoSubmitted(true);
        StorageService.saveChatSession({ sessionId, userName: userInfo.name, userEmail: userInfo.email, lastMessage: t?.request_consult || '상담 요청', timestamp: new Date().toISOString() });
    };

    const handleTopicClick = async (topic: 'DELIVERY' | 'STORAGE' | 'OTHER' | 'REFUND') => {
        const map = { DELIVERY: [t?.topic_delivery || '배송 서비스에 대해 설명해주세요.', t?.ai_delivery_prompt || '짐 배송 서비스의 이용 방법, 가격(2만원~), 공항-호텔 간 이동 절차에 대해 자세히 설명해줘.'], STORAGE: [t?.topic_storage || '짐 보관 방법이 궁금해요.', t?.ai_storage_prompt || '짐 보관 서비스의 이용 방법, 파트너지점 위치, 보관료에 대해 설명해줘.'], REFUND: [t?.topic_refund || '환불 절차가 궁금해요.', t?.ai_refund_prompt || '예약 취소 및 환불 규정에 대해 상세히 설명해줘.'], OTHER: [t?.topic_other || '기타 문의사항이 있습니다.', t?.ai_other_prompt || '예약 취소 환불 규정이나 고객센터 연결 방법에 대해 안내해줘.'] };
        const [userText, hiddenPrompt] = map[topic];
        goToChat();
        await processMessage(userText, hiddenPrompt);
    };

    const goToChat = () => setView('chat');
    const goBack = () => setView(activeTab);
    const switchTab = (tab: TabType) => { setActiveTab(tab); setView(tab); if (tab === 'messages') setUnreadCount(0); };
    const handleClose = () => { setIsOpen(false); setLoading(false); };

    if (!isPublicLangRoute) return null;

    // ─── Info Form (채팅 시작 전) ─────────────────────────────────────────────
    const InfoForm = (
        <div className="flex-1 overflow-y-auto p-6 flex flex-col justify-center bg-gray-50/50">
            <div className="text-center mb-6">
                <img src="/images/bee-mascot-nobg.webp" alt="beeboy" className="w-14 h-14 mx-auto mb-3 object-contain" />
                <h5 className="text-lg font-black text-bee-black mb-1">{L.form_title}</h5>
                <p className="text-xs text-gray-500 font-medium whitespace-pre-line">{L.form_desc}</p>
            </div>
            <form onSubmit={handleInfoSubmit} className="space-y-3">
                <input required type="text" placeholder={L.name} className="w-full bg-white border-2 border-transparent focus:border-bee-yellow rounded-2xl py-3.5 px-5 text-sm font-bold shadow-sm outline-none transition-all" value={userInfo.name} onChange={e => setUserInfo({ ...userInfo, name: e.target.value })} />
                <input required type="email" placeholder={L.email} className="w-full bg-white border-2 border-transparent focus:border-bee-yellow rounded-2xl py-3.5 px-5 text-sm font-bold shadow-sm outline-none transition-all" value={userInfo.email} onChange={e => setUserInfo({ ...userInfo, email: e.target.value })} />
                <div className="grid grid-cols-2 gap-3">
                    <select title="SNS" aria-label="SNS" className="w-full bg-white border-2 border-transparent focus:border-bee-yellow rounded-2xl py-3.5 px-4 text-xs font-bold shadow-sm outline-none transition-all appearance-none cursor-pointer" value={userInfo.snsChannel} onChange={e => setUserInfo({ ...userInfo, snsChannel: e.target.value })}>
                        {['kakao','line','whatsapp','instagram','wechat','other'].map(v => <option key={v} value={v}>{v.charAt(0).toUpperCase() + v.slice(1)}</option>)}
                    </select>
                    <input required type="text" placeholder="SNS ID" className="w-full bg-white border-2 border-transparent focus:border-bee-yellow rounded-2xl py-3.5 px-4 text-sm font-bold shadow-sm outline-none transition-all" value={userInfo.snsId} onChange={e => setUserInfo({ ...userInfo, snsId: e.target.value })} />
                </div>
                <button type="submit" className="w-full bg-bee-black text-bee-yellow py-4 rounded-2xl font-black text-sm shadow-xl hover:scale-[1.02] active:scale-95 transition-all mt-2">{L.start_chat}</button>
            </form>
        </div>
    );

    // ─── Chat Messages Area ───────────────────────────────────────────────────
    const ChatArea = (
        <>
            <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50/40" ref={scrollRef}>
                {messages.map((msg, idx) => (
                    <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in-up`}>
                        {msg.role !== 'user' && (
                            <div className="w-7 h-7 rounded-full bg-bee-yellow flex items-center justify-center text-[10px] font-black mr-2 mt-0.5 shrink-0 overflow-hidden">
                                <img src="/images/bee-mascot-nobg.webp" alt="" className="w-full h-full object-contain" />
                            </div>
                        )}
                        <div className={`max-w-[80%] px-4 py-3 rounded-2xl text-[13px] font-medium leading-relaxed shadow-sm ${msg.role === 'user' ? 'bg-bee-black text-white rounded-br-sm' : msg.role === 'admin' ? 'bg-bee-yellow text-bee-black rounded-bl-sm ring-1 ring-bee-yellow/30' : 'bg-white text-bee-black border border-gray-100 rounded-bl-sm'}`}>
                            {msg.role === 'admin' && <div className="text-[9px] font-black uppercase tracking-widest opacity-50 mb-1">{L.staff}</div>}
                            {msg.role === 'admin' ? (
                                <div>{translatedMessages[msg.timestamp] || msg.text}
                                    {translatedMessages[msg.timestamp] && <div className="text-[9px] opacity-30 border-t border-bee-black/10 pt-1 mt-1 italic">Original: {msg.text}</div>}
                                </div>
                            ) : msg.text}
                        </div>
                    </div>
                ))}
                {loading && (
                    <div className="flex justify-start items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-bee-yellow flex items-center justify-center overflow-hidden shrink-0"><img src="/images/bee-mascot-nobg.webp" alt="" className="w-full h-full object-contain" /></div>
                        <div className="bg-white px-4 py-3 rounded-2xl rounded-bl-sm border border-gray-100 flex gap-1.5">
                            <div className="w-1.5 h-1.5 bg-bee-yellow rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                            <div className="w-1.5 h-1.5 bg-bee-yellow rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                            <div className="w-1.5 h-1.5 bg-bee-yellow rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                        </div>
                    </div>
                )}
            </div>
            <div className="p-3 bg-white border-t border-gray-100">
                {showEscalate && (
                    <button onClick={async () => {
                        setShowEscalate(false);
                        try {
                            await fetch(GOOGLE_CHAT_NOTIFY_ENDPOINT, {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({
                                    type: 'escalate',
                                    sessionId,
                                    senderName: userInfo.name,
                                    senderEmail: userInfo.email,
                                    snsChannel: userInfo.snsChannel,
                                    snsId: userInfo.snsId,
                                    recentMessages: messages.slice(-8).map(m => ({ role: m.role, text: m.text })),
                                }),
                            });
                        } catch (e) { console.error('상담원 연결 알림 실패:', e); }
                        await processMessage(L.escalate_btn);
                    }} className="w-full mb-2 bg-bee-yellow text-bee-black font-black py-2.5 rounded-2xl text-xs hover:bg-bee-yellow/80 transition-all flex items-center justify-center gap-2">
                        <i className="fa-solid fa-headset text-xs"></i>{L.escalate_btn}
                    </button>
                )}
                <div className="flex gap-2">
                    <input type="text" className="flex-1 bg-gray-50 rounded-2xl py-3 px-4 text-sm font-medium focus:ring-2 focus:ring-bee-yellow outline-none placeholder:text-gray-300" placeholder={L.placeholder} value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSend()} />
                    <button onClick={handleSend} disabled={loading || !input.trim()} aria-label="Send" className="w-12 h-12 bg-bee-black text-bee-yellow rounded-2xl flex items-center justify-center active:scale-95 disabled:opacity-40 transition-all shrink-0">
                        <Send size={16} />
                    </button>
                </div>
                {messages.length > 1 && <p className="text-[9px] text-center text-gray-300 mt-1.5">{L.auto_close}</p>}
            </div>
        </>
    );

    return (
        <div className="fixed bottom-6 right-4 sm:right-6 z-[150] flex flex-col items-end font-sans">
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 20, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 20, scale: 0.95 }}
                        transition={{ type: 'spring', damping: 28, stiffness: 260 }}
                        className="mb-4 w-[calc(100vw-2rem)] sm:w-[360px] h-[600px] max-h-[85vh] bg-white rounded-[24px] shadow-2xl flex flex-col overflow-hidden"
                    >
                        {/* ── Header ─────────────────────────────────────────── */}
                        <div className="bg-bee-black px-5 py-4 flex items-center gap-3 shrink-0">
                            {view === 'chat' ? (
                                <button onClick={goBack} className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white/20 transition-all shrink-0"><ArrowLeft size={16} /></button>
                            ) : (
                                <div className="w-8 h-8 rounded-full bg-bee-yellow flex items-center justify-center overflow-hidden shrink-0">
                                    <img src="/images/bee-mascot-nobg.webp" alt="beeboy" className="w-full h-full object-contain" />
                                </div>
                            )}
                            <div className="flex-1 min-w-0">
                                <h4 className="text-white font-black text-sm leading-none">{L.header}</h4>
                                <div className="flex items-center gap-1.5 mt-1">
                                    <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse"></span>
                                    <span className="text-white/50 text-[10px] font-bold uppercase tracking-widest">{L.online}</span>
                                </div>
                            </div>
                            <button onClick={handleClose} title="Close" aria-label="Close" className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white/70 hover:bg-white/20 hover:text-white transition-all shrink-0"><X size={16} /></button>
                        </div>

                        {/* ── View Content ────────────────────────────────────── */}
                        <div className="flex-1 flex flex-col min-h-0">
                            {/* HOME */}
                            {view === 'home' && (
                                <div className="flex-1 overflow-y-auto">
                                    {/* Greeting block */}
                                    <div className="bg-bee-black px-5 pt-2 pb-8">
                                        <p className="text-white font-black text-2xl leading-snug">{L.greeting}</p>
                                        <p className="text-white/60 text-sm font-medium mt-1">{L.greeting_sub}</p>
                                    </div>
                                    <div className="px-4 -mt-5">
                                        {/* Send message button */}
                                        <button
                                            onClick={() => { goToChat(); }}
                                            className="w-full bg-white rounded-2xl shadow-lg px-5 py-4 flex items-center justify-between hover:shadow-xl transition-all group"
                                        >
                                            <span className="text-bee-black font-bold text-sm">{L.send_btn}</span>
                                            <span className="w-8 h-8 bg-bee-yellow rounded-full flex items-center justify-center group-hover:scale-110 transition-transform shrink-0"><Send size={14} className="text-bee-black" /></span>
                                        </button>
                                        {/* FAQ section */}
                                        <div className="mt-4 bg-white rounded-2xl shadow-sm overflow-hidden">
                                            <div className="flex items-center gap-2 px-5 py-3.5 border-b border-gray-50">
                                                <Search size={14} className="text-gray-400" />
                                                <span className="text-[12px] font-black text-bee-black">{L.help_title}</span>
                                            </div>
                                            {L.faq.map((item: any, idx: number) => (
                                                <button key={idx} onClick={() => handleTopicClick(item.topic)} className="w-full text-left px-5 py-3.5 flex items-center justify-between hover:bg-gray-50 transition-colors border-b border-gray-50 last:border-0">
                                                    <div className="min-w-0 mr-2">
                                                        <p className="text-[13px] font-bold text-bee-black truncate">{item.label}</p>
                                                        <p className="text-[11px] text-gray-400 font-medium">{item.sub}</p>
                                                    </div>
                                                    <ChevronRight size={14} className="text-gray-300 shrink-0" />
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* MESSAGES */}
                            {view === 'messages' && (
                                <div className="flex-1 flex flex-col">
                                    <div className="px-5 py-3 border-b border-gray-100">
                                        <h3 className="font-black text-bee-black text-base">{L.tab_messages}</h3>
                                    </div>
                                    {messages.length > 0 ? (
                                        <button onClick={goToChat} className="m-4 bg-white rounded-2xl shadow-sm border border-gray-100 p-4 text-left hover:shadow-md transition-all">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-bee-yellow flex items-center justify-center overflow-hidden shrink-0">
                                                    <img src="/images/bee-mascot-nobg.webp" alt="" className="w-full h-full object-contain" />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-[13px] font-black text-bee-black">{L.header}</p>
                                                    <p className="text-[11px] text-gray-400 truncate font-medium">{messages[messages.length - 1]?.text || ''}</p>
                                                </div>
                                                <ChevronRight size={14} className="text-gray-300 shrink-0" />
                                            </div>
                                        </button>
                                    ) : (
                                        <div className="flex-1 flex flex-col items-center justify-center text-center px-8 pb-8">
                                            <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mb-4">
                                                <MessageSquare size={28} className="text-gray-300" />
                                            </div>
                                            <p className="font-black text-bee-black mb-1">{L.no_msg}</p>
                                            <p className="text-sm text-gray-400 font-medium mb-6">{L.no_msg_sub}</p>
                                            <button onClick={goToChat} className="flex items-center gap-2 bg-bee-yellow text-bee-black font-black py-3 px-6 rounded-full text-sm hover:brightness-105 active:scale-95 transition-all">
                                                {L.send_msg_empty} <Send size={14} />
                                            </button>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* HELP */}
                            {view === 'help' && (
                                <div className="flex-1 overflow-y-auto">
                                    <div className="px-5 py-3 border-b border-gray-100">
                                        <h3 className="font-black text-bee-black text-base">{L.tab_help}</h3>
                                    </div>
                                    <div className="m-4 bg-white rounded-2xl shadow-sm overflow-hidden">
                                        <div className="flex items-center gap-2 px-5 py-3.5 border-b border-gray-50 bg-gray-50/50">
                                            <Search size={14} className="text-gray-400" />
                                            <span className="text-[12px] font-black text-bee-black">{L.help_title}</span>
                                        </div>
                                        {L.faq.map((item: any, idx: number) => (
                                            <button key={idx} onClick={() => handleTopicClick(item.topic)} className="w-full text-left px-5 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors border-b border-gray-50 last:border-0">
                                                <div className="min-w-0 mr-2">
                                                    <p className="text-[13px] font-bold text-bee-black">{item.label}</p>
                                                    <p className="text-[11px] text-gray-400 font-medium mt-0.5">{item.sub}</p>
                                                </div>
                                                <ChevronRight size={14} className="text-gray-300 shrink-0" />
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* CHAT */}
                            {view === 'chat' && (isInfoSubmitted ? ChatArea : InfoForm)}
                        </div>

                        {/* ── Tab Bar (홈/메시지/도움말 뷰에서만) ──────────────── */}
                        {view !== 'chat' && (
                            <div className="flex border-t border-gray-100 bg-white shrink-0">
                                {([['home', Home, L.tab_home], ['messages', MessageSquare, L.tab_messages], ['help', HelpCircle, L.tab_help]] as const).map(([tab, Icon, label]) => (
                                    <button key={tab} onClick={() => switchTab(tab as TabType)} className={`flex-1 flex flex-col items-center gap-1 py-3 relative transition-colors ${activeTab === tab ? 'text-bee-black' : 'text-gray-300 hover:text-gray-400'}`}>
                                        <div className="relative">
                                            <Icon size={20} strokeWidth={activeTab === tab ? 2.5 : 1.5} />
                                            {tab === 'messages' && unreadCount > 0 && (
                                                <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white rounded-full text-[9px] font-black flex items-center justify-center">{unreadCount > 9 ? '9+' : unreadCount}</span>
                                            )}
                                        </div>
                                        <span className={`text-[10px] font-bold ${activeTab === tab ? 'text-bee-black' : 'text-gray-400'}`}>{label}</span>
                                        {activeTab === tab && <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-4 h-0.5 bg-bee-yellow rounded-full" />}
                                    </button>
                                ))}
                            </div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ── FAB ────────────────────────────────────────────────── */}
            <motion.button
                onClick={() => isOpen ? handleClose() : setIsOpen(true)}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.92 }}
                className={`w-14 h-14 rounded-[20px] shadow-2xl flex items-center justify-center z-10 transition-colors relative ${isOpen ? 'bg-bee-black' : 'bg-bee-yellow'}`}
            >
                {isOpen
                    ? <X size={22} className="text-bee-yellow" />
                    : <>
                        <img src="/images/bee-mascot-nobg.webp" alt="chat" className="w-9 h-9 object-contain" />
                        {unreadCount > 0 && <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full text-[10px] font-black flex items-center justify-center border-2 border-white">{unreadCount > 9 ? '9+' : unreadCount}</span>}
                    </>
                }
            </motion.button>
        </div>
    );
};

export default ChatBot;
