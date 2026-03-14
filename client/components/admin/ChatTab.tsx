
import React, { useState, useEffect, useRef } from 'react';
import { StorageService } from '../../services/storageService';
import { ChatMessage, ChatSession } from '../../types';

const ChatTab: React.FC = () => {
    const [sessions, setSessions] = useState<any[]>([]);
    const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [input, setInput] = useState('');
    const [isSending, setIsSending] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);

    // Subscribe to all sessions
    useEffect(() => {
        const unsubscribe = StorageService.subscribeChatSessions((data) => {
            setSessions(data);
        });
        return () => unsubscribe();
    }, []);

    // Subscribe to messages of selected session
    useEffect(() => {
        if (!selectedSessionId) {
            setMessages([]);
            return;
        }
        const unsubscribe = StorageService.subscribeChatMessages(selectedSessionId, (msgs) => {
            setMessages(msgs);
        });
        return () => unsubscribe();
    }, [selectedSessionId]);

    // Scroll to bottom
    useEffect(() => {
        if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }, [messages]);

    const handleSend = async () => {
        if (!input.trim() || !selectedSessionId || isSending) return;
        setIsSending(true);
        try {
            const currentSession = sessions.find(s => s.sessionId === selectedSessionId);
            const adminMsg: ChatMessage = {
                role: 'admin',
                text: input,
                timestamp: new Date().toISOString(),
                sessionId: selectedSessionId,
                userName: 'Admin',
                userEmail: 'admin@beeliber.com'
            };
            await StorageService.saveChatMessage(adminMsg);

            // Update session metadata as well
            if (currentSession) {
                await StorageService.saveChatSession({
                    ...currentSession,
                    lastMessage: input,
                    timestamp: adminMsg.timestamp
                });
            }

            setInput('');
        } catch (e) {
            console.error(e);
        } finally {
            setIsSending(false);
        }
    };

    const toggleBot = async () => {
        if (!selectedSessionId) return;
        const currentSession = sessions.find(s => s.sessionId === selectedSessionId);
        if (!currentSession) return;

        const newStatus = !currentSession.isBotDisabled;
        await StorageService.updateChatSession(selectedSessionId, { isBotDisabled: newStatus });
    };

    return (
        <div className="h-[calc(100vh-180px)] flex gap-6 animate-fade-in-up">
            {/* Session List */}
            <div className="w-80 bg-white rounded-[40px] shadow-sm border border-gray-100 flex flex-col overflow-hidden">
                <div className="p-6 border-b border-gray-50 flex items-center justify-between">
                    <h3 className="font-black text-lg">Active Chats</h3>
                    <span className="bg-bee-yellow text-bee-black text-[10px] font-black px-2 py-1 rounded-full">{sessions.length}</span>
                </div>
                <div className="flex-1 overflow-y-auto p-4 space-y-2 custom-scrollbar">
                    {sessions.map((s) => (
                        <button
                            key={s.sessionId}
                            onClick={() => setSelectedSessionId(s.sessionId)}
                            className={`w-full p-4 rounded-3xl text-left transition-all border ${selectedSessionId === s.sessionId ? 'bg-bee-black text-white border-bee-black shadow-lg' : 'bg-gray-50 text-bee-black border-transparent hover:bg-gray-100'}`}
                        >
                            <div className="flex justify-between items-start mb-1">
                                <span className="font-black text-sm truncate pr-2">{s.userName}</span>
                                <span className={`text-[8px] font-bold ${selectedSessionId === s.sessionId ? 'text-gray-400' : 'text-gray-400'}`}>
                                    {new Date(s.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                            </div>
                            <p className={`text-xs truncate ${selectedSessionId === s.sessionId ? 'text-gray-300' : 'text-gray-500 font-medium'}`}>{s.lastMessage}</p>
                            <div className="mt-2 text-[8px] font-bold opacity-40 uppercase tracking-tighter truncate">{s.userEmail}</div>
                        </button>
                    ))}
                    {sessions.length === 0 && (
                        <div className="py-20 text-center text-gray-400 font-bold">진행 중인 채팅이 없습니다.</div>
                    )}
                </div>
            </div>

            {/* Chat Window */}
            <div className="flex-1 bg-white rounded-[40px] shadow-sm border border-gray-100 flex flex-col overflow-hidden">
                {selectedSessionId ? (
                    <>
                        <div className="p-6 border-b border-gray-50 flex items-center gap-4 bg-gray-50/30">
                            <div className="w-10 h-10 rounded-2xl bg-bee-yellow flex items-center justify-center font-black">
                                {sessions.find(s => s.sessionId === selectedSessionId)?.userName?.charAt(0) || 'U'}
                            </div>
                            <div className="flex-1 flex justify-between items-center">
                                <div>
                                    <h4 className="font-black text-bee-black">{sessions.find(s => s.sessionId === selectedSessionId)?.userName}</h4>
                                    <p className="text-[10px] font-bold text-gray-400">{sessions.find(s => s.sessionId === selectedSessionId)?.userEmail}</p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={toggleBot}
                                        className={`px-4 py-2 rounded-xl text-[10px] font-black transition-all ${sessions.find(s => s.sessionId === selectedSessionId)?.isBotDisabled ? 'bg-red-50 text-red-500 border border-red-100' : 'bg-green-50 text-green-600 border border-green-100'}`}
                                    >
                                        {sessions.find(s => s.sessionId === selectedSessionId)?.isBotDisabled ? '챗봇 중지됨' : '챗봇 활성'}
                                    </button>
                                    <button
                                        onClick={async () => {
                                            if (window.confirm('이 채팅방을 정말 삭제하시겠습니까? 모든 메시지가 삭제됩니다.')) {
                                                try {
                                                    await StorageService.deleteChatSession(selectedSessionId);
                                                    setSelectedSessionId(null);
                                                } catch (e) {
                                                    alert('삭제 중 오류가 발생했습니다.');
                                                }
                                            }
                                        }}
                                        className="p-2 w-10 h-10 flex items-center justify-center rounded-xl bg-gray-100 text-gray-400 hover:bg-red-50 hover:text-red-500 transition-all"
                                        title="채팅방 삭제"
                                    >
                                        <i className="fa-solid fa-trash-can"></i>
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto p-8 space-y-4 custom-scrollbar bg-gray-50/20" ref={scrollRef}>
                            {messages.map((m, idx) => (
                                <div key={idx} className={`flex ${m.role === 'admin' ? 'justify-end' : 'justify-start'}`}>
                                    <div className={`max-w-[70%] p-4 rounded-3xl text-sm font-bold shadow-sm ${m.role === 'admin' ? 'bg-bee-black text-bee-yellow rounded-tr-none' : (m.role === 'model' ? 'bg-blue-50 text-blue-700 border border-blue-100 rounded-tl-none' : 'bg-white text-bee-black border border-gray-100 rounded-tl-none')}`}>
                                        <div className="flex items-center justify-between mb-1 gap-4">
                                            <span className="text-[9px] font-black uppercase tracking-widest opacity-40">
                                                {m.role === 'admin' ? '나 (Admin)' : (m.role === 'model' ? 'Bee AI' : 'Customer')}
                                            </span>
                                            <span className="text-[8px] font-bold opacity-30">{new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                        </div>
                                        <p className="whitespace-pre-wrap leading-relaxed">{m.text}</p>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="p-6 border-t border-gray-50 bg-white">
                            <div className="flex gap-4">
                                <input
                                    value={input}
                                    onChange={e => setInput(e.target.value)}
                                    onKeyDown={e => e.key === 'Enter' && handleSend()}
                                    placeholder="답변을 입력하세요..."
                                    className="flex-1 bg-gray-50 border-none rounded-2xl px-6 py-4 font-bold text-sm focus:ring-2 focus:ring-bee-yellow outline-none transition-all"
                                />
                                <button
                                    onClick={handleSend}
                                    disabled={!input.trim() || isSending}
                                    className="px-8 bg-bee-black text-bee-yellow rounded-2xl font-black text-sm hover:scale-105 active:scale-95 transition-all disabled:opacity-50 shadow-lg flex items-center gap-2"
                                >
                                    {isSending ? <i className="fa-solid fa-spinner animate-spin"></i> : <i className="fa-solid fa-paper-plane"></i>}
                                    전송
                                </button>
                            </div>
                        </div>
                    </>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-gray-400">
                        <i className="fa-solid fa-comments text-6xl mb-4 opacity-10"></i>
                        <p className="font-bold">채팅 세션을 선택하여 대화를 시작하세요.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ChatTab;
