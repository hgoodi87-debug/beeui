
import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { 
    Sparkles, 
    Rocket, 
    Zap, 
    Globe, 
    ChevronLeft, 
    ShieldCheck, 
    Cpu, 
    BarChart3, 
    Smartphone,
    ArrowRight
} from 'lucide-react';
import SEO from './SEO';
import { useAppStore } from '../src/store/appStore';

const LogoLink = () => (
    <div className="flex items-center gap-1">
        <span className="text-xl font-black">bee</span>
        <span className="text-xl font-black italic text-bee-yellow">liber</span>
    </div>
);

const VisionPage: React.FC = () => {
    const navigate = useNavigate();
    const { lang } = useAppStore();

    const isZh = lang === 'zh' || lang === 'zh-tw' || lang === 'zh-hk';

    const phases = [
        {
            id: 1,
            title: "Phase 1: Foundation (Current)",
            subtitle: "The Hands-free Revolution",
            desc: lang === 'ko'
                ? "서울 내 주요 거점(홍대, 명동, 성수 등) 기반의 스마트 상점 연계로 당신의 여행에 온전한 자유를 배달합니다. 💅"
                : isZh
                ? "以首爾各大核心據點（弘大、明洞、聖水等）為基礎，透過智慧商店聯動，為您的旅程送上完全的自由。💅"
                : lang === 'ja'
                ? "ソウル主要拠点（弘大・明洞・聖水など）のスマート店舗連携で、旅に完全な自由をお届けします。💅"
                : "Partnering with smart stores at key Seoul hubs (Hongdae, Myeongdong, Seongsu) to deliver complete freedom to your journey. 💅",
            icon: <Smartphone className="text-bee-yellow" />,
            items: ["Smart QR Booking System", "Location-based Tourism Curation", "Hands-free Branding Integration"]
        },
        {
            id: 2,
            title: "Phase 2: Intelligence (Planned)",
            subtitle: "AI-Powered Concierge",
            desc: lang === 'ko'
                ? "단순 보관을 넘어, 인공지능 기반의 개인 맞춤형 여행 큐레이션과 자동화된 고객 상담 시스템을 도입하여 서비스의 질을 한 차원 높입니다. ✨"
                : isZh
                ? "超越單純寄放，引入AI個人化旅遊推薦與自動化客服系統，將服務品質提升至全新境界。✨"
                : lang === 'ja'
                ? "単なる保管を超え、AI個人旅行キュレーションと自動化サポートで、サービスを次のレベルへ。✨"
                : "Beyond simple storage — AI-driven personalized travel curation and automated customer support that elevates every experience. ✨",
            icon: <Cpu className="text-purple-400" />,
            items: ["Smart Travel Partner (AI Chatbot)", "Personalized Itinerary Engine", "Real-time Fleet Optimization"]
        },
        {
            id: 3,
            title: "Phase 3: Hyper-Local (Deepening)",
            subtitle: "Seoul Life Integration",
            desc: lang === 'ko'
                ? "서울 전역의 숙소, 핫플레이스, 모빌리티가 유기적으로 연결된 비리버 에코시스템을 완성합니다. 이제 짐은 공기처럼 느껴지지 않게 될 거예요. 🌍"
                : isZh
                ? "完成串聯首爾全市住宿、熱門景點與交通的Beeliber生態圈。從此，行李輕如空氣。🌍"
                : lang === 'ja'
                ? "ソウル全域の宿泊・スポット・モビリティを有機的に繋ぐBeeliberエコシステムを完成。荷物は空気のように感じられます。🌍"
                : "Completing the Beeliber ecosystem connecting hotels, hotspots, and mobility across Seoul. Luggage will feel like air. 🌍",
            icon: <Globe className="text-blue-400" />,
            items: ["Ultra-Dense Seoul Network", "Door-to-Door Seoul Delivery", "Tourism Alliance Integration"]
        },
        {
            id: 4,
            title: "Phase 4: Hyper-Gap (Evolution)",
            subtitle: "The Future of Travel",
            desc: lang === 'ko'
                ? "Travel Technology의 정점. 무인 자동화 연계 시스템과 데이터 기반의 예측 모델을 통해 세상에서 가장 가벼운 여행 경험을 전 세계에 전파합니다. 🛰️💅"
                : isZh
                ? "旅遊科技的巔峰。透過無人自動化系統與數據預測模型，將世界上最輕盈的旅遊體驗傳播至全球。🛰️💅"
                : lang === 'ja'
                ? "トラベルテクノロジーの頂点。無人自動化と予測モデルで、世界最軽量の旅行体験を全世界へ。🛰️💅"
                : "The pinnacle of travel technology. Autonomous logistics and predictive data models to spread the world's lightest travel experience globally. 🛰️💅",
            icon: <Rocket className="text-bee-yellow" />,
            items: ["Autonomous Logistics Center", "Global Standard Protocol", "Ultimate Travel Intelligence"]
        }
    ];

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: { staggerChildren: 0.2 }
        }
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 30 },
        visible: { opacity: 1, y: 0 }
    };

    return (
        <div className="min-h-screen bg-black text-white selection:bg-bee-yellow selection:text-bee-black">
            <SEO
                title={lang === 'ko' ? "비전과 로드맵 | 빌리버" : isZh ? "品牌願景 | Beeliber" : lang === 'ja' ? "ビジョン | Beeliber" : "Brand Vision | Beeliber"}
                description={lang === 'ko' ? "빌리버의 서비스 확장 방향과 운영 로드맵을 확인하세요." : isZh ? "探索Beeliber的服務擴展方向與營運路線圖。" : lang === 'ja' ? "Beeliberのサービス拡張方向と運営ロードマップをご覧ください。" : "Explore Beeliber's service expansion roadmap and vision."}
                path="/vision"
            />

            {/* Navigation */}
            <nav className="fixed top-0 inset-x-0 z-[100] px-4 py-4">
                <div className="max-w-4xl mx-auto flex justify-between items-center backdrop-blur-xl bg-white/5 border border-white/10 rounded-full px-6 py-2 shadow-2xl">
                    <button onClick={() => navigate(`/${lang}`)} className="flex items-center gap-2 group">
                        <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center group-hover:bg-bee-yellow group-hover:text-bee-black transition-all">
                            <ChevronLeft size={18} />
                        </div>
                        <span className="text-[10px] font-black uppercase tracking-widest hidden sm:block">Back to Home</span>
                    </button>
                    <div className="flex items-center gap-1 cursor-pointer" onClick={() => navigate(`/${lang}`)}>
                        <LogoLink />
                    </div>
                    <div className="px-5 py-2 bg-bee-yellow/10 text-bee-yellow text-[10px] font-black uppercase tracking-wider rounded-full border border-bee-yellow/20">
                        Brand Vision
                    </div>
                </div>
            </nav>

            {/* Hero Section */}
            <header className="pt-40 pb-20 px-6 text-center">
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="inline-flex items-center gap-2 px-4 py-1.5 bg-bee-yellow/10 text-bee-yellow border border-bee-yellow/20 rounded-full mb-8"
                >
                    <Sparkles size={12} />
                    <span className="text-[10px] font-black uppercase tracking-[0.2em]">The Hyper-Gap Strategy</span>
                </motion.div>
                <motion.h1 
                    initial={{ y: 50, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    className="text-6xl md:text-8xl font-black mb-6 uppercase tracking-tighter leading-none italic"
                >
                    Our <span className="text-bee-yellow">Vision</span> 💅
                </motion.h1>
                <motion.p 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3 }}
                    className="text-white/40 font-bold text-lg md:text-xl max-w-2xl mx-auto leading-relaxed"
                >
                    비리버는 단순한 짐 거치 서비스를 넘어, 인류가 이동하는 방식을 혁신하고<br className="hidden md:block" />
                    가장 가벼운 여행이자 온전한 자유의 표준을 만듭니다. 💅✨
                </motion.p>
            </header>

            {/* Roadmap Content */}
            <motion.main 
                variants={containerVariants}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                className="max-w-6xl mx-auto px-6 pb-40"
            >
                <div className="space-y-4">
                    {phases.map((phase) => (
                        <motion.section
                            key={phase.id}
                            variants={itemVariants}
                            className="group relative p-10 md:p-16 bg-white/5 border border-white/10 rounded-[3rem] overflow-hidden hover:bg-white/[0.07] transition-all"
                        >
                            <div className="absolute top-0 right-0 p-12 text-white/5 group-hover:text-bee-yellow/10 transition-colors pointer-events-none">
                                {React.cloneElement(phase.icon as React.ReactElement<any>, { size: 180 })}
                            </div>

                            <div className="relative z-10 flex flex-col md:flex-row gap-8 md:items-start">
                                <div className="md:w-1/3">
                                    <h2 className="text-bee-yellow font-black text-sm uppercase tracking-[0.3em] mb-4">
                                        {phase.title}
                                    </h2>
                                    <h3 className="text-4xl font-black mb-6 italic tracking-tight uppercase leading-none">
                                        {phase.subtitle}
                                    </h3>
                                    <div className="w-12 h-1 bg-bee-yellow/20 rounded-full" />
                                </div>
                                
                                <div className="md:w-2/3">
                                    <p className="text-xl text-white/60 font-medium leading-relaxed mb-10">
                                        {phase.desc}
                                    </p>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        {phase.items.map((item, idx) => (
                                            <div key={idx} className="flex items-center gap-3 text-sm font-bold text-white/80">
                                                <div className="w-1.5 h-1.5 rounded-full bg-bee-yellow" />
                                                {item}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </motion.section>
                    ))}
                </div>

                {/* Final CTA */}
                <motion.div 
                    variants={itemVariants}
                    className="mt-32 p-16 bg-bee-yellow rounded-[4rem] text-bee-black text-center relative overflow-hidden group"
                >
                    <div className="absolute inset-0 bg-black/10 translate-y-full group-hover:translate-y-0 transition-transform duration-500" />
                    <div className="relative z-10">
                        <h2 className="text-5xl md:text-7xl font-black mb-8 italic uppercase tracking-tighter">
                            Join the <span className="underline decoration-bee-black/20">Future</span> 💅
                        </h2>
                        <p className="text-xl font-bold mb-12 opacity-70">비리버와 함께 가장 가벼운 여행을 시작할 준비가 되셨나요?</p>
                        <button 
                            onClick={() => navigate(`/${lang}/booking`)}
                            className="inline-flex items-center gap-4 px-12 py-6 bg-bee-black text-bee-yellow rounded-full font-black uppercase tracking-widest text-sm hover:scale-105 transition-transform"
                        >
                            Experience Beeliber <ArrowRight />
                        </button>
                    </div>
                </motion.div>
            </motion.main>

            <footer className="py-20 border-t border-white/5 text-center">
                <p className="text-[10px] font-black uppercase tracking-[0.5em] text-white/20">
                    &copy; 2026 Beeliber Brand Intelligence. All rights reserved. 💅
                </p>
            </footer>
        </div>
    );
};


export default VisionPage;
