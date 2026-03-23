import React, { useState } from 'react';
import { StorageTier, PriceSettings, GoogleCloudConfig, ServiceType } from '../../types';
import DiscountTab from './DiscountTab'; // Mirroring discount logic here
import {
    getBagCategoriesForService,
    getBagCategoryLabel,
    getStoragePriceForCategory,
} from '../../src/domains/booking/bagCategoryUtils';

const DELIVERY_BAG_CATEGORIES = getBagCategoriesForService(ServiceType.DELIVERY);
const STORAGE_BAG_CATEGORIES = getBagCategoriesForService(ServiceType.STORAGE);

interface SystemTabProps {
    deliveryPrices: PriceSettings;
    updateDeliveryPrice: (size: keyof PriceSettings, val: number) => void;
    storageTiers: StorageTier[];
    updateStoragePrice: (id: string, size: keyof PriceSettings, val: number) => void;
    cloudConfig: GoogleCloudConfig;
    setCloudConfig: (c: GoogleCloudConfig) => void;
    saveCloudSettings: () => void;
    isSaving: boolean;
}

const SystemTab: React.FC<SystemTabProps> = ({
    deliveryPrices,
    updateDeliveryPrice,
    storageTiers,
    updateStoragePrice,
    cloudConfig,
    setCloudConfig,
    saveCloudSettings,
    isSaving
}) => {
    const [activeSubTab, setActiveSubTab] = useState<'PRICES' | 'PROMOTIONS' | 'CONFIG'>('PRICES');

    return (
        <div className="space-y-8 animate-fade-in-up">
            <div>
                <h1 className="text-3xl font-black tracking-tight mb-2">시스템 통합 설정 허브 ⚙️🛡️</h1>
                <p className="text-gray-500 text-sm font-bold">비리버 서비스의 핵심 정책과 인프라 설정을 한곳에서 관리합니다. 💅</p>
            </div>

            {/* Sub Tabs Selection */}
            <div className="flex p-1.5 bg-gray-100 rounded-[24px] w-fit">
                {[
                    { id: 'PRICES', label: '운영 요금 정책', icon: 'fa-tags' },
                    { id: 'PROMOTIONS', label: '프로모션 마케팅', icon: 'fa-ticket' },
                    { id: 'CONFIG', label: '시스템 환경 설정', icon: 'fa-gears' },
                ].map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveSubTab(tab.id as any)}
                        className={`px-8 py-3 rounded-[20px] text-xs font-black transition-all flex items-center gap-2 ${
                            activeSubTab === tab.id 
                            ? 'bg-white text-bee-black shadow-sm' 
                            : 'text-gray-400 hover:text-gray-600'
                        }`}
                    >
                        <i className={`fa-solid ${tab.icon}`}></i>
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Tab Contents */}
            {activeSubTab === 'PRICES' && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <div className="bg-white p-8 rounded-[40px] shadow-sm border border-gray-100 h-fit">
                        <div className="flex items-center justify-between mb-8">
                            <h3 className="text-xl font-black flex items-center gap-3">
                                <span className="w-2 h-8 bg-bee-yellow rounded-full"></span>배송 기본 요금
                            </h3>
                            <span className="text-[10px] font-black text-gray-300 uppercase tracking-widest">Delivery Standard</span>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            {DELIVERY_BAG_CATEGORIES.map(category => (
                                <div
                                    key={category.id}
                                    className="bg-gray-50 p-6 rounded-3xl border transition-all border-transparent hover:border-bee-yellow"
                                >
                                    <label className="text-[10px] font-black text-gray-400 tracking-tight mb-3 block">{getBagCategoryLabel(category.id, 'ko')}</label>
                                    <div className="flex items-center gap-2">
                                        <span className="font-bold text-gray-300 text-sm">₩</span>
                                        <input
                                            type="number"
                                            value={getStoragePriceForCategory(deliveryPrices, category.id)}
                                            onChange={(e) => updateDeliveryPrice(category.primaryKey, Number(e.target.value))}
                                            title={`${getBagCategoryLabel(category.id, 'ko')} 배송 요금`}
                                            className="bg-transparent font-black text-2xl w-full outline-none"
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                        <p className="mt-6 text-[10px] text-gray-400 font-medium">* 모든 요금은 가방 1개당 단가(KRW) 기준입니다.</p>
                        <p className="mt-2 text-[10px] font-black text-red-500">* 배송은 쇼핑백, 손가방과 캐리어만 접수합니다.</p>
                    </div>

                    <div className="bg-white p-8 rounded-[40px] shadow-sm border border-gray-100 space-y-8">
                        <div className="flex items-center justify-between mb-2">
                            <h3 className="text-xl font-black flex items-center gap-3">
                                <span className="w-2 h-8 bg-bee-blue rounded-full"></span>공항 보관 요금
                            </h3>
                            <span className="text-[10px] font-black text-gray-300 uppercase tracking-widest">Airport Storage</span>
                        </div>
                        <div className="space-y-6">
                            {storageTiers.map(tier => (
                                <div key={tier.id} className="bg-gray-50 rounded-[32px] p-6 hover:shadow-lg hover:shadow-bee-blue/5 transition-all group">
                                    <div className="flex items-center justify-between mb-4">
                                        <h4 className="font-black text-bee-black text-sm">{tier.label}</h4>
                                        <i className="fa-solid fa-clock-rotate-left text-gray-200 group-hover:text-bee-blue transition-colors"></i>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                        {STORAGE_BAG_CATEGORIES.map(category => (
                                            <div key={category.id} className="bg-white p-3 rounded-2xl text-center border border-gray-100 group-hover:border-bee-blue/20">
                                                <div className="text-[9px] font-black text-gray-300 tracking-tight mb-2">{getBagCategoryLabel(category.id, 'ko')}</div>
                                                <input
                                                    type="number"
                                                    value={getStoragePriceForCategory(tier.prices, category.id)}
                                                    onChange={(e) => updateStoragePrice(tier.id, category.primaryKey, Number(e.target.value))}
                                                    title={`${tier.label} - ${getBagCategoryLabel(category.id, 'ko')} 보관 요금`}
                                                    className="w-full bg-transparent text-center font-black text-sm outline-none"
                                                />
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {activeSubTab === 'PROMOTIONS' && (
                <div className="bg-white p-8 rounded-[40px] shadow-sm border border-gray-100">
                    <DiscountTab />
                </div>
            )}

            {activeSubTab === 'CONFIG' && (
                <div className="max-w-4xl mx-auto space-y-8">
                    <div className="bg-white p-10 rounded-[40px] shadow-sm border border-gray-100">
                        <div className="flex items-center justify-between mb-10">
                            <h3 className="text-2xl font-black flex items-center gap-4">
                                <span className="w-2 h-10 bg-emerald-500 rounded-full"></span>클라우드 인프라 설정
                            </h3>
                            <div className="px-4 py-2 bg-emerald-50 text-emerald-500 rounded-xl text-[10px] font-black uppercase tracking-widest">
                                External Services
                            </div>
                        </div>

                        <div className="space-y-8">
                            <div className="p-8 bg-gray-50 rounded-[32px] border border-transparent hover:border-emerald-500/20 transition-all">
                                <div className="flex items-center gap-4 mb-6">
                                    <div className="w-12 h-12 bg-white rounded-2xl shadow-sm flex items-center justify-center">
                                        <img src="https://www.gstatic.com/lamda/images/gemini_sparkle_v002_d4735303ff6292a2e30.svg" alt="Gemini" className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <h4 className="font-black text-bee-black">Google Gemini AI Engine</h4>
                                        <p className="text-[10px] font-bold text-gray-400 uppercase">Language Models & Analysis</p>
                                    </div>
                                </div>
                                <div className="space-y-4">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">AI API Key (Google Cloud)</label>
                                    <div className="relative">
                                        <input
                                            type="password"
                                            value={cloudConfig.apiKey}
                                            onChange={(e) => setCloudConfig({ ...cloudConfig, apiKey: e.target.value })}
                                            placeholder="AI API 키를 입력하세요..."
                                            className="w-full bg-white p-5 rounded-2xl font-bold border-2 border-transparent focus:border-emerald-500 outline-none text-sm shadow-sm pr-12"
                                        />
                                        <i className="fa-solid fa-key absolute right-5 top-1/2 -translate-y-1/2 text-gray-200"></i>
                                    </div>
                                    <p className="text-[10px] text-gray-400 font-medium px-2 leading-relaxed">
                                        * 이 키는 지점 설명 자동 번역 및 예약 데이터 AI 분석에 사용됩니다. 💅
                                    </p>
                                </div>
                            </div>

                            <div className="p-8 bg-gray-50 rounded-[32px] border border-transparent hover:border-blue-500/20 transition-all">
                                <div className="flex items-center gap-4 mb-6">
                                    <div className="w-12 h-12 bg-white rounded-2xl shadow-sm flex items-center justify-center text-blue-500 text-xl">
                                        <i className="fa-solid fa-map-location-dot"></i>
                                    </div>
                                    <div>
                                        <h4 className="font-black text-bee-black">Naver Maps Platform</h4>
                                        <p className="text-[10px] font-bold text-gray-400 uppercase">Geocoding & Map Rendering</p>
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Map Client ID (NCP)</label>
                                        <input
                                            value={cloudConfig.mapId || ''}
                                            onChange={(e) => setCloudConfig({ ...cloudConfig, mapId: e.target.value })}
                                            placeholder="Naver Maps Client ID"
                                            className="w-full bg-white p-4 rounded-2xl font-bold border-2 border-transparent focus:border-blue-500 outline-none text-xs shadow-sm"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Map Secret Key</label>
                                        <input
                                            type="password"
                                            value={cloudConfig.mapSecret || ''}
                                            onChange={(e) => setCloudConfig({ ...cloudConfig, mapSecret: e.target.value })}
                                            placeholder="Naver Maps Client Secret"
                                            className="w-full bg-white p-4 rounded-2xl font-bold border-2 border-transparent focus:border-blue-500 outline-none text-xs shadow-sm"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="mt-12 flex justify-end">
                            <button
                                onClick={saveCloudSettings}
                                disabled={isSaving}
                                className="px-12 py-5 bg-bee-black text-white font-black rounded-3xl shadow-2xl hover:translate-y-[-2px] active:translate-y-0 transition-all flex items-center gap-3 disabled:opacity-50"
                            >
                                {isSaving ? <i className="fa-solid fa-circle-notch animate-spin"></i> : <i className="fa-solid fa-shield-halved"></i>}
                                클라우드 설정값 저장하기
                            </button>
                        </div>
                    </div>

                    <div className="p-8 bg-bee-yellow/10 rounded-[40px] border border-bee-yellow/20">
                        <h4 className="font-black text-bee-black mb-4 flex items-center gap-2">
                            <i className="fa-solid fa-triangle-exclamation"></i> 주의사항
                        </h4>
                        <ul className="text-xs text-bee-black/60 font-medium space-y-2 list-disc ml-5 leading-relaxed">
                            <li>시스템 환경 변수는 클라우드 인프라의 직접적인 작동에 영향을 미칩니다.</li>
                            <li>잘못된 API 키 입력 시 번역이나 지도 렌더링이 중단될 수 있습니다. 💅</li>
                            <li>모든 설정값은 암호화되어 관리되지만, 외부 유출에 각별히 유의해 주세요.</li>
                        </ul>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SystemTab;
