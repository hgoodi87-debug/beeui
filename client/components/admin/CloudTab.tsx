import React from 'react';
import { GoogleCloudConfig } from '../../types';

interface CloudTabProps {
    cloudConfig: GoogleCloudConfig;
    setCloudConfig: (c: GoogleCloudConfig) => void;
    saveCloudSettings: () => void;
    handleMigration: () => void;
    isMigrating: boolean;
}

const CloudTab: React.FC<CloudTabProps> = ({
    cloudConfig,
    setCloudConfig,
    saveCloudSettings,
    handleMigration,
    isMigrating
}) => {
    return (
        <div className="space-y-6 md:space-y-8 animate-fade-in-up">
            <h1 className="text-2xl md:text-3xl font-black tracking-tight mb-2">Google Integrations & Legacy Tools</h1>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-10">
                {/* Google Cloud Settings */}
                <div className="bg-white p-6 md:p-10 rounded-[30px] md:rounded-[40px] shadow-sm border border-gray-100 flex flex-col gap-6">
                    <h3 className="text-lg md:text-xl font-black flex items-center gap-3">
                        <span className="w-2 h-8 bg-bee-blue rounded-full"></span>
                        External Integration Keys
                    </h3>
                    <p className="text-xs text-gray-500 font-bold">
                        운영 DB/Auth/Storage/Functions는 Supabase를 사용합니다. 이 화면에는 Firebase 프로젝트 값이 아니라 외부 서비스 키만 보관합니다.
                    </p>

                    <div className="flex flex-col gap-2">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Gemini API Key</label>
                        <input
                            type="password"
                            value={cloudConfig.apiKey}
                            onChange={e => setCloudConfig({ ...cloudConfig, apiKey: e.target.value })}
                            placeholder="예: AIzaSy... 또는 Gemini 서버 연동용 키"
                            className="bg-gray-50 p-3 rounded-xl font-bold border border-gray-100 text-xs focus:border-bee-blue outline-none"
                        />
                    </div>

                    <div className="flex items-center gap-4 bg-gray-50 p-4 rounded-2xl border border-gray-100 mt-2">
                        <div
                            onClick={() => setCloudConfig({ ...cloudConfig, isActive: !cloudConfig.isActive })}
                            className={`w-14 h-8 rounded-full p-1 cursor-pointer transition-colors duration-300 flex items-center ${cloudConfig.isActive ? 'bg-green-500 justify-end' : 'bg-gray-200 justify-start'}`}
                        >
                            <div className="w-6 h-6 rounded-full bg-white shadow-md"></div>
                        </div>
                        <span className="font-bold text-bee-black">외부 서비스 키 설정 사용</span>
                    </div>

                    <div className="flex justify-end pt-4">
                        <button onClick={saveCloudSettings} className="w-full md:w-auto px-12 py-4 bg-bee-blue text-white font-black rounded-2xl hover:scale-105 transition-all shadow-xl">
                            설정 저장
                        </button>
                    </div>

                    {/* Migration Tool */}
                    <div className="mt-6 p-6 bg-blue-50 rounded-3xl border border-blue-100">
                        <h3 className="text-lg font-black text-bee-black mb-2">레거시 로컬 데이터 백업 도구</h3>
                        <p className="text-xs text-gray-500 mb-4 font-medium leading-relaxed">
                            현재 브라우저(로컬 스토리지)에 남아 있는 예전 데이터를 점검하거나 백업하는 보조 도구입니다.
                            <br />현재 운영 원본 데이터베이스와 함수 런타임은 Supabase 기준으로 관리됩니다.
                        </p>
                        <button
                            onClick={handleMigration}
                            disabled={!cloudConfig.isActive || isMigrating}
                            className="px-6 py-3 bg-blue-600 text-white font-bold rounded-xl text-xs hover:bg-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                        >
                            {isMigrating ? <i className="fa-solid fa-spinner animate-spin mr-2"></i> : <i className="fa-solid fa-cloud-arrow-up mr-2"></i>}
                            레거시 로컬 데이터 백업 실행
                        </button>
                    </div>
                </div>

                {/* Automation & AI Settings */}
                <div className="bg-white p-6 md:p-10 rounded-[30px] md:rounded-[40px] shadow-sm border border-gray-100 flex flex-col gap-8 h-fit">
                    <h3 className="text-lg md:text-xl font-black flex items-center gap-3">
                        <span className="w-2 h-8 bg-purple-500 rounded-full"></span>
                        Automation & Intelligence
                    </h3>

                    <div className="space-y-6">
                        <div className="p-6 bg-purple-50 rounded-3xl border border-purple-100">
                            <div className="flex justify-between items-start mb-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-purple-600 shadow-sm">
                                        <i className="fa-solid fa-wand-magic-sparkles"></i>
                                    </div>
                                    <div>
                                        <h4 className="font-black text-bee-black">Gemini (Opal) Intelligence</h4>
                                        <p className="text-[10px] font-bold text-purple-400 uppercase">AI Data Processing</p>
                                    </div>
                                </div>
                                <div
                                    onClick={() => setCloudConfig({ ...cloudConfig, enableGeminiAutomation: !cloudConfig.enableGeminiAutomation })}
                                    className={`w-10 h-6 rounded-full p-1 cursor-pointer transition-colors duration-300 flex items-center ${cloudConfig.enableGeminiAutomation ? 'bg-purple-500 justify-end' : 'bg-gray-200 justify-start'}`}
                                >
                                    <div className="w-4 h-4 rounded-full bg-white shadow-md"></div>
                                </div>
                            </div>
                        </div>

                        <div className="p-6 bg-green-50 rounded-3xl border border-green-100">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-green-600 shadow-sm">
                                    <i className="fa-regular fa-comments"></i>
                                </div>
                                <div>
                                    <h4 className="font-black text-bee-black">Google Chat Integration</h4>
                                    <p className="text-[10px] font-bold text-green-600 uppercase">Real-time Monitoring</p>
                                </div>
                            </div>
                            <p className="text-xs font-bold text-green-700 leading-relaxed">
                                Google Chat 웹훅은 클라이언트에 저장하지 않습니다. Supabase Edge Function 환경변수에서만 관리합니다.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CloudTab;
