import React from 'react';
import { LocationOption, LocationType } from '../../types';

interface OpsHubTabProps {
    locations: LocationOption[];
    focusLocation: (loc: LocationOption) => void;
}

const OpsHubTab: React.FC<OpsHubTabProps> = ({
    locations, focusLocation
}) => {
    return (
        <div className="space-y-6 md:space-y-8 animate-fade-in-up">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl md:text-3xl font-black tracking-tight text-bee-black">Hub Operations</h1>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">거점별 물동량 및 가동률 실시간 모니터링</p>
                </div>
                <div className="flex gap-4">
                    <div className="bg-white px-6 py-2 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-end">
                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Global Status</span>
                        <span className="text-sm font-black text-green-500">All Nodes Online</span>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                {locations.filter(l => l.isActive !== false).map(loc => (
                    <div 
                        key={loc.id} 
                        onClick={() => focusLocation(loc)} 
                        className="bg-white p-6 rounded-[32px] border border-gray-100 shadow-sm hover:shadow-xl hover:scale-[1.02] transition-all cursor-pointer group"
                    >
                        <div className="flex justify-between items-start mb-4">
                            <span className={`px-3 py-1 rounded-full text-[8px] font-black uppercase ${loc.type === LocationType.AIRPORT ? 'bg-bee-black text-bee-yellow' : 'bg-gray-100 text-gray-400'}`}>
                                {loc.type}
                            </span>
                            <div className="flex items-center gap-1">
                                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                                <span className="text-[8px] font-black text-gray-400 uppercase">Live</span>
                            </div>
                        </div>
                        <h4 className="text-lg font-black text-bee-black mb-1 group-hover:text-bee-yellow transition-colors">{loc.name}</h4>
                        <p className="text-[10px] font-bold text-gray-400 truncate mb-4">{loc.address}</p>
                        
                        <div className="space-y-3">
                            <div className="flex justify-between items-center text-[10px] font-black">
                                <span className="text-gray-400 uppercase">Hub Load</span>
                                <span className="text-bee-black">42%</span>
                            </div>
                            <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                <div className="h-full bg-bee-yellow" style={{ width: '42%' }}></div>
                            </div>
                            <div className="flex gap-2">
                                <button className="flex-1 py-2 bg-gray-50 hover:bg-bee-black hover:text-bee-yellow rounded-xl text-[9px] font-black transition-all">
                                    Detail
                                </button>
                                <button className="px-3 py-2 bg-gray-50 hover:bg-bee-black hover:text-bee-yellow rounded-xl text-[9px] font-black transition-all">
                                    <i className="fa-solid fa-location-arrow"></i>
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default OpsHubTab;
