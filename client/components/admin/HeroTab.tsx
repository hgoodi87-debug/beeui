import React from 'react';
import { HeroConfig } from '../../types';

interface HeroTabProps {
    heroConfig: HeroConfig;
    setHeroConfig: (c: HeroConfig) => void;
    handleHeroImageUpload: (e: React.ChangeEvent<HTMLInputElement>, field: keyof HeroConfig) => void;
    handleHeroVideoUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
    saveHero: () => void;
    isSaving: boolean;
}

const HeroTab: React.FC<HeroTabProps> = ({
    heroConfig,
    setHeroConfig,
    handleHeroImageUpload,
    handleHeroVideoUpload,
    saveHero,
    isSaving
}) => {
    return (
        <div className="space-y-6 md:space-y-8 animate-fade-in-up">
            <h1 className="text-2xl md:text-3xl font-black tracking-tight mb-2">히어로 섹션 관리</h1>
            <div className="bg-white p-6 md:p-10 rounded-[30px] md:rounded-[40px] shadow-sm border border-gray-100">
                <div className="flex items-center gap-4 mb-8">
                    <h3 className="text-lg md:text-xl font-black flex items-center gap-3">
                        <span className="w-2 h-8 bg-bee-yellow rounded-full"></span>
                        이미지 및 비디오 설정
                    </h3>
                    <p className="text-xs text-gray-500 font-bold">메인 화면의 첫인상을 결정하는 히어로 영역을 관리합니다.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                    <div className="space-y-8">
                        {/* Desktop Image */}
                        <div className="space-y-3">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">데스크탑 메인 이미지 (PC)</label>
                            <div className="relative group">
                                <input
                                    value={heroConfig.imageUrl}
                                    onChange={e => setHeroConfig({ ...heroConfig, imageUrl: e.target.value })}
                                    placeholder="https://..."
                                    className="w-full bg-gray-50 p-4 rounded-2xl font-bold border-2 border-transparent focus:border-bee-yellow outline-none text-xs"
                                />
                                <label className="absolute right-2 top-2 cursor-pointer bg-white px-3 py-1.5 rounded-xl shadow-sm border font-black text-[10px] hover:bg-gray-50">
                                    UPLOAD
                                    <input type="file" accept="image/*" className="hidden" onChange={e => handleHeroImageUpload(e, 'imageUrl')} />
                                </label>
                            </div>
                            {heroConfig.imageUrl && (
                                <div className="w-full h-32 rounded-2xl overflow-hidden border border-gray-100 bg-gray-50">
                                    <img src={heroConfig.imageUrl} alt="Preview PC" className="w-full h-full object-cover" />
                                </div>
                            )}
                        </div>

                        {/* Mobile Image */}
                        <div className="space-y-3">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">모바일 최적화 이미지 (Mobile)</label>
                            <div className="relative group">
                                <input
                                    value={heroConfig.mobileImageUrl || ''}
                                    onChange={e => setHeroConfig({ ...heroConfig, mobileImageUrl: e.target.value })}
                                    placeholder="https://..."
                                    className="w-full bg-gray-50 p-4 rounded-2xl font-bold border-2 border-transparent focus:border-bee-yellow outline-none text-xs"
                                />
                                <label className="absolute right-2 top-2 cursor-pointer bg-white px-3 py-1.5 rounded-xl shadow-sm border font-black text-[10px] hover:bg-gray-50">
                                    UPLOAD
                                    <input type="file" accept="image/*" className="hidden" onChange={e => handleHeroImageUpload(e, 'mobileImageUrl')} />
                                </label>
                            </div>
                            {heroConfig.mobileImageUrl && (
                                <div className="w-24 h-40 rounded-2xl overflow-hidden border border-gray-100 bg-gray-50 mx-auto">
                                    <img src={heroConfig.mobileImageUrl} alt="Preview Mobile" className="w-full h-full object-cover" />
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="space-y-8">
                        {/* Video Background URL */}
                        <div className="space-y-3 p-6 bg-bee-yellow/5 rounded-[30px] border border-bee-yellow/10">
                            <div className="flex items-center gap-2 mb-2">
                                <i className="fa-solid fa-video text-bee-yellow"></i>
                                <label className="text-[10px] font-black text-bee-black uppercase tracking-widest">배경 비디오 URL (Video Background)</label>
                            </div>
                            <p className="text-[10px] text-gray-500 font-bold mb-4 leading-relaxed">
                                파일 업로드 시 자동으로 URL이 채워지며, 저장 후 메인에 즉시 반영됩니다.<br />
                                비어있을 경우 PC 메인 이미지가 대신 표시됩니다.
                            </p>
                            <div className="relative group">
                                <input
                                    value={heroConfig.videoUrl || ''}
                                    onChange={e => setHeroConfig({ ...heroConfig, videoUrl: e.target.value })}
                                    placeholder="예: https://drive.google.com/uc?export=download&id=..."
                                    className="w-full bg-white p-4 rounded-2xl font-bold border-2 border-transparent focus:border-bee-yellow outline-none text-xs shadow-sm"
                                />
                                <label className="absolute right-2 top-2 cursor-pointer bg-bee-black text-bee-yellow px-3 py-1.5 rounded-xl shadow-sm border border-bee-yellow/20 font-black text-[10px] hover:bg-gray-800">
                                    UPLOAD
                                    <input type="file" accept="video/*" className="hidden" onChange={handleHeroVideoUpload} />
                                </label>
                            </div>
                            {heroConfig.videoUrl && (
                                <div className="w-full aspect-video rounded-2xl overflow-hidden border border-gray-100 bg-black mt-4">
                                    <video src={heroConfig.videoUrl} autoPlay muted loop className="w-full h-full object-cover" />
                                </div>
                            )}
                        </div>

                        <div className="bg-blue-50 p-6 rounded-[30px] border border-blue-100">
                            <h4 className="text-xs font-black text-blue-700 mb-2 font-black italic">Tip: 실시간 반영</h4>
                            <p className="text-[10px] text-blue-600 font-medium leading-relaxed">
                                여기서 저장한 설정은 메인 페이지에 즉시 실시간으로 반영됩니다.<br />
                                로딩 지연을 줄이기 위해 가능한 용량이 작은 영상을 사용하세요.
                            </p>
                        </div>
                    </div>
                </div>

                <div className="flex justify-end pt-12 border-t border-gray-50 mt-10">
                    <button
                        onClick={saveHero}
                        disabled={isSaving}
                        className="w-full md:w-auto px-16 py-5 bg-bee-black text-bee-yellow font-black rounded-3xl shadow-2xl hover:scale-[1.02] active:scale-95 transition-all text-lg flex items-center justify-center gap-3"
                    >
                        {isSaving ? <i className="fa-solid fa-spinner animate-spin"></i> : <i className="fa-solid fa-cloud-arrow-up"></i>}
                        히어로 설정 저장하기
                    </button>
                </div>
            </div>
        </div>
    );
};

export default HeroTab;
