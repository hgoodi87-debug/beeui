import React from 'react';
import { motion } from 'framer-motion';
import { ExternalLink, CheckCircle, Clock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { LocationOption, LocationType } from '../../types';

interface RoadmapTabProps {
    t: any;
    lang: string;
    locations?: LocationOption[];
}

const RoadmapTab: React.FC<RoadmapTabProps> = ({ t, lang, locations = [] }) => {
    const navigate = useNavigate();
    // Define the roadmap sections
    const roadmapSections = [
        {
            title: '고객용 웹 서비스 (B2C Web Service)',
            description: '일반 고객을 위한 랜딩, 예약 및 마이페이지 화면입니다.',
            routes: [
                { path: '/', name: '메인 랜딩페이지', desc: '서비스 소개, 가격 안내 및 예약 유도', status: 'completed' },
                { path: '/services', name: '서비스 상세 소개', desc: '보관 및 배송 서비스 상세 설명', status: 'completed' },
                { path: '/locations', name: '지점/위치 안내', desc: '전체 지점 리스트 및 지도 확인', status: 'completed' },
                { path: '/booking', name: '짐 보관/배송 예약', desc: '세부 예약 폼 제공 및 결제', status: 'completed' },
                { path: '/booking-success', name: '예약 완료 안내', desc: '예약 성공 결과 및 이용 가이드 확인', status: 'completed' },
                { path: '/tracking', name: '예약 조회/배송 추적', desc: '고객 예약 번호로 현재 상태 조회', status: 'completed' },
                { path: '/mypage', name: '마이페이지', desc: '고객 정보 및 이전 예약 내역 확인', status: 'in-progress' },
                { path: '/partnership', name: '제휴 안내', desc: '파트너 도입 및 프랜차이즈 문의', status: 'completed' },
                { path: '/qna', name: '자주 묻는 질문 (FAQ)', desc: '서비스 이용 관련 Q&A 및 지연 요금 안내', status: 'completed' },
                { path: '/vision', name: '비전 및 가치', desc: 'Beeliber의 서비스 철학 및 미래 로드맵', status: 'completed' },
                { path: '/terms', name: '이용약관', desc: '글로벌 이용약관 표시', status: 'completed' },
                { path: '/privacy', name: '개인정보처리방침', desc: '개인정보 보호 규정 표시', status: 'completed' },
            ]
        },
        {
            title: '지능형 콘텐츠 및 SEO (Programmatic SEO)',
            description: '검색 엔진 최적화 및 타겟 컨텐츠 제공을 위한 자동화 페이지입니다.',
            routes: [
                { path: '/ko/storage/:slug', name: '지역별 보관 랜딩', desc: '특정 지역 보관 키워드 대응 SEO 랜딩', status: 'completed' },
                { path: '/ko/delivery/:slug', name: '지역별 배송 랜딩', desc: '특정 지역 배송 키워드 대응 SEO 랜딩', status: 'completed' },
            ]
        },
        {
            title: '본사 및 지점 관리자 (B2B Admin & Super Admin)',
            description: '본사 관리자 및 각 지점 매니저, 현장 직원을 위한 관리 화면입니다.',
            routes: [
                { path: '/admin', name: '관리자 로그인', desc: '본사 및 지점 관리자 통용 로그인', status: 'completed' },
                { path: '/admin/dashboard', name: '본사 통합 대시보드', desc: '전체 예약, 매출, 지점, 인사, 정산 통합 관리 (Super Admin)', status: 'completed' },
                { path: '/admin/branch/:id', name: '지점 전용 관리자', desc: '지점별 예약 목록, 엑셀 내보내기, 상태 변경 (Branch Admin)', status: 'completed' },
                { path: '/admin/branch/:id/booking', name: '지점 수동 예약', desc: '현장 방문 고객 또는 유선 예약을 위한 관리자 직접 입력', status: 'completed' },
                { path: '/staff/scan', name: '현장직원 스캐너', desc: 'QR 스캔을 통한 빠른 짐 상태 업데이트', status: 'completed' },
                { path: '/manual', name: '시스템 매뉴얼', desc: '관리자용 시스템 이용 가이드 안내', status: 'completed' },
            ]
        },
        {
            title: '지점 전용 랜딩 (B2B2C Branch Landing)',
            description: '특정 제휴 지점을 통한 유입 시 전용 랜딩 및 동적 처리를 담당합니다.',
            routes: [
                { path: '/branch/:branchCode', name: '지점 전용 예약 시작점', desc: '지점 코드로 유입 시 자동 지점 할당 및 요금 적용', status: 'completed' },
            ]
        }
    ];

    const activePartnerRoutes = locations
        .filter(loc => loc.isActive && loc.type === LocationType.PARTNER)
        .map(loc => ({
            path: `/admin/branch/${loc.id}`,
            name: `[${loc.name}] 관리자 페이지`,
            desc: `${loc.name} 지점 전용 예약 및 상태 관리 화면`,
            status: 'completed'
        }));

    const finalSections = [...roadmapSections];
    if (activePartnerRoutes.length > 0) {
        finalSections.splice(2, 0, {
            title: '활성 파트너 지점 관리자 (Active Partner Admin)',
            description: '현재 운영 중인 제휴 파트너 지점들의 전용 관리자 페이지 경로입니다.',
            routes: activePartnerRoutes
        });
    }

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'completed':
                return (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-green-100 text-green-700">
                        <CheckCircle className="w-3 h-3" />
                        완료됨
                    </span>
                );
            case 'in-progress':
                return (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-700">
                        <Clock className="w-3 h-3" />
                        진행/예정
                    </span>
                );
            default:
                return null;
        }
    };

    const handleRouteClick = (path: string) => {
        // 어드민 내부 경로는 같은 탭에서 SPA 네비게이션 (새 탭 시 인증 상태 유실 방지)
        // 고객용 외부 경로는 새 탭으로 오픈
        if (path.startsWith('/admin') || path.startsWith('/staff')) {
            navigate(path);
        } else {
            window.open(path, '_blank');
        }
    };

    return (
        <div className="space-y-12">
            {/* Header */}
            <div>
                <h2 className="text-2xl font-black text-bee-black">전체 페이지 로드맵 🗺️</h2>
                <p className="text-gray-500 mt-2 font-medium">Beeliber 애플리케이션의 모든 주요 페이지 경로와 역할을 한눈에 확인하세요.</p>
            </div>

            <div className="space-y-12">
                {finalSections.map((section, idx) => (
                    <motion.div
                        key={idx}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.1 }}
                        className="bg-white rounded-[2rem] border-2 border-slate-100 p-8 hover:border-bee-yellow/30 transition-colors"
                    >
                        <div className="mb-8">
                            <h3 className="text-xl font-bold text-gray-900 border-b-2 border-bee-yellow inline-block pb-1">{section.title}</h3>
                            <p className="text-gray-500 mt-3 text-sm">{section.description}</p>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                            {section.routes.map((route, rIdx) => (
                                <div
                                    key={rIdx}
                                    onClick={() => handleRouteClick(route.path)}
                                    className="group relative flex flex-col p-5 bg-slate-50 rounded-2xl border border-slate-100 cursor-pointer hover:bg-white hover:border-bee-yellow hover:shadow-lg hover:shadow-bee-yellow/10 transition-all duration-300"
                                >
                                    <div className="flex justify-between items-start mb-3">
                                        <span className="bg-slate-200/70 text-slate-600 px-3 py-1 rounded-lg text-xs font-mono font-bold group-hover:bg-bee-yellow/20 group-hover:text-bee-black transition-colors">
                                            {route.path}
                                        </span>
                                        {getStatusBadge(route.status)}
                                    </div>
                                    <h4 className="text-lg font-bold text-gray-900 mb-1 flex items-center gap-2">
                                        {route.name}
                                        <ExternalLink className="w-4 h-4 text-gray-400 group-hover:text-bee-yellow transition-colors opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0" />
                                    </h4>
                                    <p className="text-sm text-gray-500 line-clamp-2">{route.desc}</p>
                                </div>
                            ))}
                        </div>
                    </motion.div>
                ))}
            </div>
        </div>
    );
};

export default RoadmapTab;
