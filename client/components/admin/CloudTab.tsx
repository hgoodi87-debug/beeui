import React from 'react';
import { GoogleCloudConfig } from '../../types';

interface CloudTabProps {
    cloudConfig: GoogleCloudConfig;
    setCloudConfig: (c: GoogleCloudConfig) => void;
    CLOUD_PLACEHOLDERS: Record<string, string>;
    saveCloudSettings: () => void;
    handleMigration: () => void;
    isMigrating: boolean;
}

const CloudTab: React.FC<CloudTabProps> = ({
    cloudConfig,
    setCloudConfig,
    CLOUD_PLACEHOLDERS,
    saveCloudSettings,
    handleMigration,
    isMigrating
}) => {
    return (
        <div className="space-y-6 md:space-y-8 animate-fade-in-up">
            <h1 className="text-2xl md:text-3xl font-black tracking-tight mb-2">Google Cloud & Workspace Automation</h1>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-10">
                {/* Google Cloud Settings */}
                <div className="bg-white p-6 md:p-10 rounded-[30px] md:rounded-[40px] shadow-sm border border-gray-100 flex flex-col gap-6">
                    <h3 className="text-lg md:text-xl font-black flex items-center gap-3">
                        <span className="w-2 h-8 bg-bee-blue rounded-full"></span>
                        Google Cloud (Firebase) Config
                    </h3>
                    <p className="text-xs text-gray-500 font-bold">
                        Firebase Console &gt; Project Settings &gt; General &gt; Your Apps &gt; Config 내용을 입력하세요.
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {(['apiKey', 'authDomain', 'projectId', 'storageBucket', 'messagingSenderId', 'appId'] as const).map(key => (
                            <div key={key} className="flex flex-col gap-2">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">{key}</label>
                                <input
                                    value={cloudConfig[key]}
                                    onChange={e => setCloudConfig({ ...cloudConfig, [key]: e.target.value })}
                                    placeholder={CLOUD_PLACEHOLDERS[key]}
                                    className="bg-gray-50 p-3 rounded-xl font-bold border border-gray-100 text-xs focus:border-bee-blue outline-none"
                                />
                            </div>
                        ))}
                    </div>

                    <div className="flex items-center gap-4 bg-gray-50 p-4 rounded-2xl border border-gray-100 mt-2">
                        <div
                            onClick={() => setCloudConfig({ ...cloudConfig, isActive: !cloudConfig.isActive })}
                            className={`w-14 h-8 rounded-full p-1 cursor-pointer transition-colors duration-300 flex items-center ${cloudConfig.isActive ? 'bg-green-500 justify-end' : 'bg-gray-200 justify-start'}`}
                        >
                            <div className="w-6 h-6 rounded-full bg-white shadow-md"></div>
                        </div>
                        <span className="font-bold text-bee-black">Google Cloud 저장소 활성화</span>
                    </div>

                    <div className="flex justify-end pt-4">
                        <button onClick={saveCloudSettings} className="w-full md:w-auto px-12 py-4 bg-bee-blue text-white font-black rounded-2xl hover:scale-105 transition-all shadow-xl">
                            설정 저장 및 연결 테스트
                        </button>
                    </div>

                    {/* Migration Tool */}
                    <div className="mt-6 p-6 bg-blue-50 rounded-3xl border border-blue-100">
                        <h3 className="text-lg font-black text-bee-black mb-2">데이터 마이그레이션 (Local → Cloud)</h3>
                        <p className="text-xs text-gray-500 mb-4 font-medium leading-relaxed">
                            현재 브라우저(로컬 스토리지)에 저장된 모든 데이터(지점, 예약, 문의 등)를 연결된 Google Cloud 데이터베이스로 업로드합니다.
                            <br />이미 클라우드에 동일한 ID의 데이터가 있다면 덮어씌워집니다.
                        </p>
                        <button
                            onClick={handleMigration}
                            disabled={!cloudConfig.isActive || isMigrating}
                            className="px-6 py-3 bg-blue-600 text-white font-bold rounded-xl text-xs hover:bg-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                        >
                            {isMigrating ? <i className="fa-solid fa-spinner animate-spin mr-2"></i> : <i className="fa-solid fa-cloud-arrow-up mr-2"></i>}
                            로컬 데이터를 클라우드로 백업하기
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
                            <div className="space-y-3">
                                <input
                                    value={cloudConfig.googleChatWebhookUrl || ''}
                                    onChange={e => setCloudConfig({ ...cloudConfig, googleChatWebhookUrl: e.target.value })}
                                    placeholder="https://chat.googleapis.com/v1/spaces/..."
                                    className="w-full bg-white p-3 rounded-xl font-bold border border-green-200 text-xs focus:border-green-500 outline-none text-gray-600"
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CloudTab;
