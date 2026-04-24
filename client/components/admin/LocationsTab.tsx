import React from 'react';
import { LocationOption, LocationType, TranslatedLocationData } from '../../types';
import { StorageService } from '../../services/storageService';
import { resolveSupabaseUrl, getSupabaseBaseUrl } from '../../services/supabaseRuntime';
import { getActiveAdminRequestHeaders } from '../../services/adminAuthService';

import LocationMap from '../locations/LocationMap';

interface LocationsTabProps {
    locForm: any;
    setLocForm: (f: any) => void;
    LOCATION_TYPE_OPTIONS: { label: string; value: string }[];
    findCoordinates: () => void;
    isGeocoding: boolean;
    handlePickupImageUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
    handleLocationImageUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
    isSaving: boolean;
    setIsSaving: (v: boolean) => void;
    addLocation: () => void;
    locations: LocationOption[];
    focusLocation: (loc: LocationOption) => void;
    deleteLocation: (e: React.MouseEvent, id: string) => void;
    handleBulkGeocode: () => void;
    handleBulkUpdateLocations: (ids: string[], updates: Partial<LocationOption>) => void;
    lang: string;
    t: any;
}

const preferLocationTranslation = (value?: string, fallback?: string) => {
    const trimmedValue = value?.trim();
    if (trimmedValue) return trimmedValue;
    const trimmedFallback = fallback?.trim();
    return trimmedFallback || '';
};

const normalizeLocationFormTranslations = (loc: LocationOption): LocationOption => {
    return {
        ...loc,
        name: loc.name?.trim() || '',
        address: loc.address?.trim() || '',
        name_en: loc.name_en?.trim() || '',
        name_ja: loc.name_ja?.trim() || '',
        name_zh: loc.name_zh?.trim() || '',
        name_zh_tw: loc.name_zh_tw?.trim() || '',
        name_zh_hk: loc.name_zh_hk?.trim() || '',
        address_en: loc.address_en?.trim() || '',
        address_ja: loc.address_ja?.trim() || '',
        address_zh: loc.address_zh?.trim() || '',
        address_zh_tw: loc.address_zh_tw?.trim() || '',
        address_zh_hk: loc.address_zh_hk?.trim() || '',
    };
};

const getLocIdentifier = (loc: Partial<LocationOption>) =>
    String(loc.shortCode || loc.branchCode || loc.id || '').trim();

const buildBrandPublicUrl = (objectPath: string) => {
    const encodedPath = objectPath
        .split('/')
        .map((segment) => encodeURIComponent(segment))
        .join('/');

    return resolveSupabaseUrl(`/storage/v1/object/public/brand-public/${encodedPath}`);
};

const LocationsTab: React.FC<LocationsTabProps> = ({
    locForm, setLocForm, LOCATION_TYPE_OPTIONS, findCoordinates, isGeocoding,
    handlePickupImageUpload, handleLocationImageUpload, isSaving, setIsSaving, addLocation,
    locations, focusLocation, deleteLocation, handleBulkGeocode, handleBulkUpdateLocations, lang, t
}) => {
    const [selectedIds, setSelectedIds] = React.useState<string[]>([]);
    const [isTranslating, setIsTranslating] = React.useState(false);
    const [filterType, setFilterType] = React.useState<string>('ALL');
    const [filterStatus, setFilterStatus] = React.useState<string>('ALL');
    const [searchQ, setSearchQ] = React.useState('');
    const [isBulkMapping, setIsBulkMapping] = React.useState(false);
    const [viewMode, setViewMode] = React.useState<'TABLE' | 'MAP'>('TABLE');
    const [isPanelOpen, setIsPanelOpen] = React.useState(false);

    // [스봉이] 수정/생성 폼 열기 제어 💅
    const handleOpenPanel = (loc?: LocationOption) => {
        if (loc) {
            const normalized = normalizeLocationFormTranslations(loc);
            const identifier = getLocIdentifier(normalized);
            focusLocation({
                ...normalized,
                supabaseId: normalized.supabaseId || normalized.id,
                id: identifier || normalized.id,
                shortCode: normalized.shortCode || normalized.branchCode || identifier,
            });
        } else {
            // New Draft
            setLocForm({ id: '', supabaseId: '', shortCode: '', name: '', type: LocationType.PARTNER, isActive: false, supportsStorage: false, supportsDelivery: false });
        }
        setIsPanelOpen(true);
    };

    const handleClosePanel = () => {
        setIsPanelOpen(false);
    };

    const handleBulkTranslateAddresses = async () => {
        if (!window.confirm("모든 지점의 누락된 다국어 주소(영문, 일문, 중문)를 AI 번역으로 일괄 보완하시겠습니까?\n이 작업은 시간이 다소 소요될 수 있습니다. 💅")) return;
        
        setIsBulkMapping(true);
        try {
            let count = 0;
            for (const loc of locations) {
                if (loc.address && (!loc.address_en || !loc.address_ja || !loc.address_zh || !loc.address_zh_tw || !loc.address_zh_hk)) {
                    const result: TranslatedLocationData = await StorageService.translateLocationData({
                        name: loc.name,
                        address: loc.address,
                        pickupGuide: loc.pickupGuide || '',
                        description: loc.description || ''
                    });

                    await StorageService.saveLocation({
                        ...loc,
                        address_en: loc.address_en || result.address_en,
                        address_ja: loc.address_ja || result.address_ja,
                        address_zh: loc.address_zh || result.address_zh,
                        address_zh_tw: loc.address_zh_tw || result.address_zh_tw,
                        address_zh_hk: loc.address_zh_hk || result.address_zh_hk,
                        name_en: loc.name_en || result.name_en,
                        name_ja: loc.name_ja || result.name_ja,
                        name_zh: loc.name_zh || result.name_zh,
                        name_zh_tw: loc.name_zh_tw || result.name_zh_tw,
                        name_zh_hk: loc.name_zh_hk || result.name_zh_hk,
                        description_en: loc.description_en || result.description_en,
                        description_ja: loc.description_ja || result.description_ja,
                        description_zh: loc.description_zh || result.description_zh,
                        description_zh_tw: loc.description_zh_tw || result.description_zh_tw,
                        description_zh_hk: loc.description_zh_hk || result.description_zh_hk,
                        pickupGuide_en: loc.pickupGuide_en || result.pickupGuide_en,
                        pickupGuide_ja: loc.pickupGuide_ja || result.pickupGuide_ja,
                        pickupGuide_zh: loc.pickupGuide_zh || result.pickupGuide_zh,
                        pickupGuide_zh_tw: loc.pickupGuide_zh_tw || result.pickupGuide_zh_tw,
                        pickupGuide_zh_hk: loc.pickupGuide_zh_hk || result.pickupGuide_zh_hk,
                    });
                    count++;
                }
            }
            alert(`총 ${count}개 지점의 다국어 정보 보완이 완료되었습니다! 💅✨`);
            window.location.reload();
        } catch (e) {
            console.error("[스봉이] 보완 중 대형 사고 발생:", e);
            alert("보완 작업 중 오류가 발생했습니다. 콘솔을 확인해 보세요. 🚨");
        } finally {
            setIsBulkMapping(false);
        }
    };


    const handleBulkMapPhotos = async (mode: 'ID' | 'NAME') => {
        if (!confirm(`${mode === 'ID' ? '지점 ID' : '지점 한글명'}을 기준으로 스토리지의 사진을 자동 매칭하시겠습니까?\n(기존 사진이 있는 지점도 덮어씌워집니다.)`)) return;

        setIsBulkMapping(true);
        try {
            const { StorageService } = await import('../../services/storageService');
            for (const loc of locations) {
                const fileName = mode === 'ID' ? `${loc.id}.jpg` : `${loc.name}.jpg`;
                const imageUrl = buildBrandPublicUrl(`locations/${fileName}`);

                await StorageService.saveLocation({ ...loc, imageUrl });
            }
            alert("모든 지점의 사진 매칭이 완료되었습니다! 스티치가 아주 열일했네요. ✨");
            window.location.reload();
        } catch (e) {
            alert("매칭 중 오류가 발생했습니다. 사장님, 스토리지에 파일이 진짜 있는 거 맞죠? 🙄");
            console.error(e);
        } finally {
            setIsBulkMapping(false);
        }
    };

    const handleAiTranslate = async () => {
        if (!locForm.name || !locForm.address) { alert("지점명과 주소를 먼저 입력해 주세요."); return; }
        setIsTranslating(true);
        try {
            const { StorageService } = await import('../../services/storageService');
            const result = await StorageService.translateLocationData({ name: locForm.name, address: locForm.address, pickupGuide: locForm.pickupGuide || '', description: locForm.description || '' });
            setLocForm({ ...locForm, ...result });
            alert("AI 자동 번역이 완료되었습니다! ✨");
        } catch (e) { alert("번역 중 오류가 발생했습니다."); console.error(e); }
        finally { setIsTranslating(false); }
    };

    const [isGeneratingForReview, setIsGeneratingForReview] = React.useState(false);
    const [reviewToast, setReviewToast] = React.useState<string | null>(null);

    const handleAiGenerateForReview = async () => {
        if (!locForm.name || !locForm.address) { alert("지점명과 주소를 먼저 입력해 주세요."); return; }
        setIsGeneratingForReview(true);
        setReviewToast(null);
        try {
            const SUPABASE_URL = getSupabaseBaseUrl();
            const headers = await getActiveAdminRequestHeaders();
            const res = await fetch(`${SUPABASE_URL}/functions/v1/ai-content-gen`, {
                method: 'POST',
                headers: { ...headers, 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    use_case: 'translation',
                    entity_id: locForm.supabaseId || locForm.id || null,
                    location_data: {
                        name: locForm.name,
                        address: locForm.address,
                        pickupGuide: locForm.pickupGuide || '',
                        description: locForm.description || '',
                    },
                }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || res.statusText);
            const policy = data.data?.policy_check;
            if (policy && !policy.passed) {
                setReviewToast(`⚠ 정책 위반 감지 — 검수함에 저장됨 (위반: ${policy.violations.join(', ')})`);
            } else {
                setReviewToast('✓ AI 검수함에 저장됨. AI 검수 탭에서 승인하세요.');
            }
            setTimeout(() => setReviewToast(null), 5000);
        } catch (e) {
            alert(`AI 번역 생성 실패: ${e}`);
        } finally {
            setIsGeneratingForReview(false);
        }
    };

    const getLocName = (loc: LocationOption) => {
        if (lang === 'en' && loc.name_en) return loc.name_en;
        if (lang === 'ja' && loc.name_ja) return loc.name_ja;
        if ((lang === 'zh' || lang === 'zh-TW' || lang === 'zh-HK') && loc.name_zh) return loc.name_zh;
        return loc.name || loc.id; // [스봉이] 이름이 없으면 ID라도 보여줘야죠! 💅
    };

    const getLocAddress = (loc: LocationOption) => {
        if (lang === 'en' && loc.address_en) return loc.address_en;
        if (lang === 'ja' && loc.address_ja) return loc.address_ja;
        if ((lang === 'zh' || lang === 'zh-TW' || lang === 'zh-HK') && loc.address_zh) return loc.address_zh;
        return loc.address;
    };

    const filteredLocations = locations.filter(loc => {
        if (filterType !== 'ALL' && loc.type !== filterType) return false;
        if (filterStatus === 'ACTIVE' && loc.isActive === false) return false;
        if (filterStatus === 'INACTIVE' && loc.isActive !== false) return false;
        if (searchQ.trim()) {
            const q = searchQ.toLowerCase();
            const identifier = getLocIdentifier(loc).toLowerCase();
            if (!loc.name.toLowerCase().includes(q) && !identifier.includes(q) && !(loc.name_en || '').toLowerCase().includes(q)) return false;
        }
        return true;
    }).sort((a, b) => a.name.localeCompare(b.name, 'ko'));

    const toggleSelectAll = () => {
        if (selectedIds.length === filteredLocations.length) {
            setSelectedIds([]);
        } else {
            setSelectedIds(filteredLocations.map(l => l.id));
        }
    };

    const toggleSelect = (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
    };

    const handleBulkAction = (updates: Partial<LocationOption>) => {
        if (!selectedIds.length) {
            alert("지점을 먼저 선택해주세요. 🙄");
            return;
        }
        handleBulkUpdateLocations(selectedIds, updates);
        setSelectedIds([]);
    };


    const TYPE_FILTERS = [
        { id: 'ALL', label: '전체', icon: 'fa-th' },
        { id: LocationType.AIRPORT, label: '공항', icon: 'fa-plane' },
        { id: LocationType.PARTNER, label: '파트너', icon: 'fa-handshake' },
        { id: LocationType.HOTEL, label: '호텔', icon: 'fa-hotel' },
        { id: LocationType.AIRBNB, label: '에어비앤비', icon: 'fa-house' },
    ];
    const STATUS_FILTERS = [
        { id: 'ALL', label: '전체' }, { id: 'ACTIVE', label: '활성' }, { id: 'INACTIVE', label: '비활성' },
    ];

    // KPI Calculations
    const activeCount = locations.filter(l => l.isActive !== false).length;
    const inactiveCount = locations.filter(l => l.isActive === false).length;
    const airportCount = locations.filter(l => l.type === LocationType.AIRPORT).length;
    const missingCoordCount = locations.filter(l => !l.lat || !l.lng || (l.lat === 37.5665 && l.lng === 126.9780)).length;

    return (
        <div className="space-y-6 md:space-y-8 animate-fade-in-up">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-2">
                <div className="flex flex-col gap-1">
                    <h1 className="text-2xl md:text-3xl font-black tracking-tight">지점(거점) 관리</h1>
                    <div className="flex items-center gap-2">
                        <span className="text-xs font-black text-gray-400">{filteredLocations.length} / {locations.length} 지점</span>
                        <div className="h-1 w-1 rounded-full bg-gray-300"></div>
                        <div className="flex gap-2">
                            <button onClick={() => handleBulkMapPhotos('ID')} disabled={isBulkMapping} className="text-[10px] font-black text-blue-600 hover:underline disabled:opacity-50">
                                [ID로 사진 매칭]
                            </button>
                            <button onClick={() => handleBulkMapPhotos('NAME')} disabled={isBulkMapping} className="text-[10px] font-black text-emerald-600 hover:underline disabled:opacity-50">
                                [이름으로 사진 매칭]
                            </button>
                            <button onClick={handleBulkGeocode} disabled={isGeocoding} className="text-[10px] font-black text-amber-600 hover:underline disabled:opacity-50">
                                [주소로 전 지점 좌표 연동]
                            </button>
                                <button onClick={async () => {
                                    if (!confirm("MYN- 형식의 지점 ID를 3자리 약칭(AGS, DDP 등)으로 일괄 변경하시겠습니까?\n이 작업은 운영 지점 데이터를 직접 수정하며 되돌릴 수 없습니다. 💅")) return;
                                    setIsBulkMapping(true);
                                    try {
                                        const { StorageService } = await import('../../services/storageService');
                                        const mapping: Record<string, string> = {
                                            'MYN-001': 'AGS', 'MYN-002': 'DDP', 'MYN-003': 'JNO', 'MYN-004': 'CMR',
                                            'MYN-005': 'SSU', 'MYN-006': 'GNS', 'MYN-007': 'MEC', 'MYN-008': 'YDO',
                                            'MYN-009': 'MD2', 'MYN-010': 'IT2', 'MYN-011': 'SRK', 'MYN-012': 'GNM',
                                            'MYN-013': 'NDM', 'MYN-014': 'ISD', 'MYN-015': 'HDA', 'MYN-016': 'MDD',
                                            'MYN-017': 'PTK', 'MYN-018': 'SDO', 'MYN-019': 'SWN', 'MYN-020': 'USO',
                                            'MYN-021': 'BPY', 'MYN-022': 'GPA', 'MYN-023': 'CWN', 'MYN-024': 'USS',
                                            'MYN-025': 'GAL', 'MYN-026': 'BSN', 'MYN-027': 'DGU', 'MYN-028': 'GHE',
                                            'MYN-029': 'NPO', 'MYN-030': 'HDE', 'MYN-031': 'JDM', 'MYN-032': 'JEJ',
                                            'MYN-033': 'GJU'
                                        };
                                        const mynLocations = locations.filter(l => l.id.startsWith('MYN-'));
                                        if (mynLocations.length === 0) { alert("변경할 MYN- 지점이 없습니다. 🙄"); return; }
                                        for (const loc of mynLocations) {
                                            const newId = mapping[loc.id];
                                            if (newId) {
                                                await StorageService.deleteLocation(loc.id);
                                                await StorageService.saveLocation({ ...loc, id: newId, shortCode: newId });
                                            }
                                        }
                                        alert(`총 ${mynLocations.length}개의 지점 ID가 성공적으로 변경되었습니다! ✨`);
                                        window.location.reload();
                                    } catch (e) { alert("ID 변경 중 오류가 발생했습니다. 🚨"); console.error(e); }
                                    finally { setIsBulkMapping(false); }
                                }} disabled={isBulkMapping} className="text-[10px] font-black text-purple-600 hover:underline disabled:opacity-50">
                                    [MYN ID 약칭 변환]
                                </button>
                            <button onClick={handleBulkTranslateAddresses} disabled={isBulkMapping} className="text-[10px] font-black text-rose-600 hover:underline disabled:opacity-50">
                                [전지점 다국어 주소 일괄 보완]
                            </button>
                        </div>
                    </div>
                </div>


                <div className="flex items-center gap-2">
                    {/* View Mode Toggle 💅 */}
                    <div className="bg-gray-100 p-1 rounded-2xl flex items-center shadow-inner border border-gray-200">
                        <button 
                            onClick={() => setViewMode('TABLE')}
                            className={`px-4 py-2 rounded-xl text-[10px] font-black transition-all flex items-center gap-2 ${viewMode === 'TABLE' ? 'bg-white text-bee-black shadow-md' : 'text-gray-400 hover:text-gray-600'}`}
                        >
                            <i className="fa-solid fa-table"></i>
                            데이터 테이블
                        </button>
                        <button 
                            onClick={() => setViewMode('MAP')}
                            className={`px-4 py-2 rounded-xl text-[10px] font-black transition-all flex items-center gap-2 ${viewMode === 'MAP' ? 'bg-white text-bee-black shadow-md' : 'text-gray-400 hover:text-gray-600'}`}
                        >
                            <i className="fa-solid fa-map-location-dot"></i>
                            네트워크 현황 지도
                        </button>
                    </div>

                    {(isBulkMapping || isGeocoding) && (
                        <div className="flex items-center gap-2 px-4 py-2 bg-bee-yellow/10 rounded-full border border-bee-yellow/20 animate-pulse">
                            <i className="fa-solid fa-spinner animate-spin text-bee-yellow text-xs"></i>
                            <span className="text-xs font-black text-bee-yellow">{isBulkMapping ? '스봉이가 작업 중...' : '스봉이가 좌표 찾는 중...'}</span>
                        </div>
                    )}
                </div>
            </div>

            {/* --- KPI Overview - [스봉이] 모바일 가독성 최적화 💅 --- */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 lg:gap-4">
                <div className="bg-white p-4 md:p-5 rounded-[24px] border border-gray-100 shadow-sm flex flex-col justify-between min-h-[100px] md:min-h-[120px]">
                    <p className="text-[9px] md:text-[10px] font-black text-gray-400 uppercase tracking-tight md:tracking-widest mb-1 whitespace-nowrap"><i className="fa-solid fa-network-wired"></i> 전체 네트워크</p>
                    <div className="flex items-end gap-2 md:gap-3">
                        <h3 className="text-2xl md:text-3xl font-black text-bee-black">{locations.length}</h3>
                        <span className="text-[10px] font-bold text-gray-300 mb-1">지점수</span>
                    </div>
                </div>
                <div className="bg-emerald-50 p-4 md:p-5 rounded-[24px] border border-emerald-100 shadow-sm flex flex-col justify-between min-h-[100px] md:min-h-[120px] relative overflow-hidden group">
                    <div className="absolute -right-4 -top-4 w-16 h-16 md:w-20 md:h-20 bg-emerald-500/10 rounded-full group-hover:scale-150 transition-transform duration-500"></div>
                    <p className="text-[9px] md:text-[10px] font-black text-emerald-600/60 uppercase tracking-tight md:tracking-widest mb-1 z-10 whitespace-nowrap"><i className="fa-solid fa-satellite-dish"></i> 활성 운영 지점</p>
                    <div className="flex items-end gap-2 md:gap-3 z-10">
                        <h3 className="text-2xl md:text-3xl font-black text-emerald-500">{activeCount}</h3>
                        <span className="text-[9px] md:text-[10px] font-black text-emerald-600 bg-emerald-100 px-2 py-0.5 rounded-full mb-1">{((activeCount/locations.length)*100).toFixed(0)}%</span>
                    </div>
                </div>
                <div className="bg-orange-50 p-4 md:p-5 rounded-[24px] border border-orange-100 shadow-sm flex flex-col justify-between min-h-[100px] md:min-h-[120px]">
                    <p className="text-[9px] md:text-[10px] font-black text-orange-600/60 uppercase tracking-tight md:tracking-widest mb-1 whitespace-nowrap"><i className="fa-solid fa-pause-circle"></i> 준비/일시중지</p>
                    <div className="flex items-end gap-2 md:gap-3">
                        <h3 className="text-2xl md:text-3xl font-black text-orange-500">{inactiveCount}</h3>
                        <span className="text-[10px] font-bold text-orange-300 mb-1">대기</span>
                    </div>
                </div>
                <div className={`p-4 md:p-5 rounded-[24px] border shadow-sm flex flex-col justify-between min-h-[100px] md:min-h-[120px] ${missingCoordCount > 0 ? 'bg-red-50 border-red-100' : 'bg-white border-gray-100'}`}>
                    <p className={`text-[9px] md:text-[10px] font-black uppercase tracking-tight md:tracking-widest mb-1 whitespace-nowrap ${missingCoordCount > 0 ? 'text-red-500' : 'text-gray-400'}`}><i className="fa-solid fa-triangle-exclamation"></i> 대응 필요</p>
                    <div className="flex items-end gap-2 md:gap-3">
                        <h3 className={`text-2xl md:text-3xl font-black ${missingCoordCount > 0 ? 'text-red-600' : 'text-gray-300'}`}>{missingCoordCount}</h3>
                        <span className={`text-[8px] md:text-[9px] font-black mb-1 leading-tight ${missingCoordCount > 0 ? 'text-red-400' : 'text-gray-300'}`}>{missingCoordCount > 0 ? '좌표/주소\n매핑 필요' : '정상 탐지'}</span>
                    </div>
                </div>
            </div>

            
            <div className="flex flex-col xl:flex-row gap-6 relative items-start h-full min-h-[600px] overflow-hidden pb-10">
                
                {/* --- Main Data Table & Map Area --- */}
                <div className={`transition-all duration-500 ease-in-out space-y-4 ${isPanelOpen ? 'w-full xl:w-2/3 hidden xl:block' : 'w-full'}`}>
                    <div className="bg-white rounded-[24px] p-4 border border-gray-100 shadow-sm space-y-3">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div className="relative flex-1">
                                <i className="fa-solid fa-magnifying-glass absolute left-3 top-1/2 -translate-y-1/2 text-gray-300 text-xs"></i>
                                <input value={searchQ} onChange={e => setSearchQ(e.target.value)} placeholder="지점명 또는 ID 검색..." className="w-full bg-gray-50 pl-8 pr-4 py-2.5 rounded-xl text-xs font-bold border border-gray-100 focus:border-bee-yellow outline-none" />
                            </div>
                            <button onClick={() => handleOpenPanel()} className="shrink-0 px-4 py-2 h-[38px] bg-bee-black text-bee-yellow font-black text-[10px] rounded-xl shadow-lg hover:scale-[1.02] transition-transform flex items-center justify-center gap-2 uppercase tracking-widest whitespace-nowrap">
                                <i className="fa-solid fa-plus"></i> 신규 지점 등록
                            </button>
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                            {TYPE_FILTERS.map(f => (
                                <button key={f.id} onClick={() => setFilterType(f.id)} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-black transition-all ${filterType === f.id ? 'bg-bee-black text-bee-yellow shadow-sm' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}>
                                    <i className={`fa-solid ${f.icon} text-[9px]`}></i>{f.label}
                                </button>
                            ))}
                            <div className="w-px h-5 bg-gray-200 mx-1"></div>
                            {STATUS_FILTERS.map(f => (
                                <button key={f.id} onClick={() => setFilterStatus(f.id)} className={`px-3 py-1.5 rounded-full text-[10px] font-black transition-all ${filterStatus === f.id ? 'bg-bee-yellow text-bee-black shadow-sm' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}>{f.label}</button>
                            ))}
                        </div>

                        {/* 일괄 작업 바 💅 */}
                        <div className="flex flex-wrap gap-2 items-center bg-bee-yellow/5 p-3 rounded-xl border border-bee-yellow/10">
                            <div className="flex items-center gap-2 mr-2">
                                <input type="checkbox" checked={selectedIds.length > 0 && selectedIds.length === filteredLocations.length} onChange={toggleSelectAll} title="전체 지점 선택" className="w-4 h-4 rounded-lg accent-bee-black" />
                                <span className="text-[10px] font-black text-bee-black uppercase tracking-tighter">일괄 선택 ({selectedIds.length})</span>
                            </div>
                            <div className="h-5 w-px bg-bee-yellow/20 mx-1"></div>
                            {[
                                { label: '활성화', key: 'isActive', val: true, icon: 'fa-check' },
                                { label: '비활성화', key: 'isActive', val: false, icon: 'fa-slash' },
                                { label: '배송 ON', key: 'supportsDelivery', val: true, icon: 'fa-truck' },
                                { label: '보관 ON', key: 'supportsStorage', val: true, icon: 'fa-box-archive' },
                                { label: '출발 ON', key: 'isOrigin', val: true, icon: 'fa-right-from-bracket' },
                                { label: '목적지 ON', key: 'isDestination', val: true, icon: 'fa-location-dot' },
                            ].map((btn, idx) => (
                                <button key={idx} onClick={() => handleBulkAction({ [btn.key]: btn.val })} className="px-2 py-1.5 bg-white border border-bee-yellow/30 rounded-lg text-[9px] font-black text-bee-black hover:bg-bee-yellow hover:scale-105 transition-all shadow-sm flex items-center gap-1.5">
                                    <i className={`fa-solid ${btn.icon} text-[8px]`}></i>{btn.label}
                                </button>
                            ))}
                        </div>
                        <div className="text-[10px] font-black text-gray-400">{filteredLocations.length}개 표시 중 / 전체 {locations.length}개</div>
                    </div>

                    {viewMode === 'TABLE' ? (
                        <div className="mt-4 bg-white rounded-[24px] border border-gray-100 shadow-sm overflow-x-auto">
                            <table className="w-full text-left whitespace-nowrap">
                                <thead className="bg-gray-50 text-[10px] font-black uppercase text-gray-400 border-b border-gray-100">
                                    <tr>
                                        <th className="px-5 py-4 w-10">
                                            <input type="checkbox" checked={selectedIds.length > 0 && selectedIds.length === filteredLocations.length} onChange={toggleSelectAll} title="전체 지점 선택" className="w-4 h-4 rounded-lg accent-bee-black" />
                                        </th>
                                        <th className="px-5 py-4">상태 및 유형</th>
                                        <th className="px-5 py-4">지점명 / ID</th>
                                        <th className="px-5 py-4">제공 서비스</th>
                                        <th className="px-5 py-4 text-center">연동 설정</th>
                                        <th className="px-5 py-4 w-10"></th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {filteredLocations.map(loc => (
                                        <tr key={loc.id} onClick={() => handleOpenPanel(loc)} className={`hover:bg-bee-yellow/5 transition-colors cursor-pointer group ${String(locForm.supabaseId || locForm.id || '') === loc.id ? 'bg-bee-yellow/10' : ''}`}>
                                            <td className="px-5 py-4" onClick={e => e.stopPropagation()}>
                                                <input type="checkbox" checked={selectedIds.includes(loc.id)} onChange={e => toggleSelect(e as any, loc.id)} title={`${loc.name} 선택`} className="w-4 h-4 rounded-lg accent-bee-black cursor-pointer" />
                                            </td>
                                            <td className="px-5 py-4 space-y-1">
                                                <div className="flex items-center gap-2">
                                                    {loc.isActive !== false ? <span className="flex items-center gap-1.5 text-[9px] font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-100"><div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></div> ACTIVE</span> : <span className="text-[9px] font-black text-gray-400 bg-gray-100 px-2 py-0.5 rounded-lg">PAUSED</span>}
                                                </div>
                                                <span className={`inline-block px-2 py-0.5 rounded-md text-[8px] font-black uppercase ${loc.type === LocationType.AIRPORT ? 'bg-bee-black text-bee-yellow' : 'bg-gray-100 text-gray-500'}`}>{loc.type}</span>
                                            </td>
                                            <td className="px-5 py-4">
                                                <div className="flex flex-col">
                                                    <span className="font-black text-sm text-bee-black">{getLocName(loc)} <span className="text-[9px] text-gray-400 font-bold ml-1">{getLocIdentifier(loc)}</span></span>
                                                    <span className="text-[10px] font-medium text-gray-400 truncate max-w-[200px]">{getLocAddress(loc)}</span>
                                                </div>
                                            </td>
                                            <td className="px-5 py-4">
                                                <div className="flex gap-1.5 flex-wrap max-w-[150px]">
                                                    {loc.supportsDelivery && <i title="배송접수 가능" className="fa-solid fa-truck text-[9px] text-yellow-500 bg-yellow-50 w-5 h-5 flex items-center justify-center rounded-md border border-yellow-100"></i>}
                                                    {loc.supportsStorage && <i title="수하물 보관 가능" className="fa-solid fa-box-archive text-[9px] text-blue-500 bg-blue-50 w-5 h-5 flex items-center justify-center rounded-md border border-blue-100"></i>}
                                                    {loc.isOrigin && <i title="출발 허브" className="fa-solid fa-right-from-bracket text-[9px] text-purple-500 bg-purple-50 w-5 h-5 flex items-center justify-center rounded-md border border-purple-100"></i>}
                                                    {loc.isDestination && <i title="도착지/픽업지" className="fa-solid fa-location-dot text-[9px] text-teal-500 bg-teal-50 w-5 h-5 flex items-center justify-center rounded-md border border-teal-100"></i>}
                                                </div>
                                            </td>
                                            <td className="px-5 py-4 text-center">
                                                {loc.lat && loc.lng ? (
                                                    (loc.lat === 37.5665 && loc.lng === 126.9780) ? <span className="text-amber-500" title="기본 좌표"><i className="fa-solid fa-triangle-exclamation"></i></span> : <span className="text-emerald-500" title="지도 연동 완료"><i className="fa-solid fa-check"></i></span>
                                                ) : <span className="text-red-400" title="지도 미연동"><i className="fa-solid fa-xmark"></i></span>}
                                                <span className="mx-2 text-gray-200">|</span>
                                                {loc.branchCode ? <span className="text-blue-500" title={`코드: ${loc.branchCode}`}><i className="fa-solid fa-link"></i></span> : <span className="text-gray-300" title="코드 없음"><i className="fa-solid fa-link-slash"></i></span>}
                                            </td>
                                            <td className="px-5 py-4 text-right">
                                                <button onClick={(e) => { e.stopPropagation(); deleteLocation(e, loc.id); }} title="지점 영구 삭제" className="w-7 h-7 rounded-full flex items-center justify-center text-gray-300 hover:bg-red-50 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"><i className="fa-solid fa-trash-can text-[10px]"></i></button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className="w-full h-[600px] rounded-[40px] overflow-hidden border border-gray-100 shadow-xl bg-gray-50 relative">
                            <LocationMap 
                                t={t}
                                lang={lang}
                                branches={filteredLocations}
                                selectedBranch={locations.find(l =>
                                    l.id === String(locForm.supabaseId || locForm.id || '')
                                    || getLocIdentifier(l) === String(locForm.id || '')
                                )}
                                onLocationSelect={(loc) => loc ? handleOpenPanel(loc) : null}
                                currentService="SAME_DAY" // 어드민 오버뷰용 기본값 💅
                                userLocation={{ lat: 37.5665, lng: 126.9780 }} // 서울 중심점 💅
                            />
                            {/* 지도 위에 띄울 간단한 통계 오버레이 💅 */}
                            <div className="absolute bottom-6 left-6 z-10">
                                <div className="px-6 py-4 bg-white/90 backdrop-blur-xl border border-white/20 shadow-2xl rounded-[30px] flex items-center gap-6">
                                    <div className="flex flex-col">
                                        <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">활성 지점</span>
                                        <span className="text-xl font-black text-bee-black">{filteredLocations.filter(l => l.isActive !== false).length}</span>
                                    </div>
                                    <div className="w-px h-8 bg-gray-200"></div>
                                    <div className="flex flex-col">
                                        <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">선택된 지점</span>
                                        <span className="text-xl font-black text-bee-yellow">{locations.find(l =>
                                            l.id === String(locForm.supabaseId || locForm.id || '')
                                            || getLocIdentifier(l) === String(locForm.id || '')
                                        )?.name || '없음'}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* --- Slide-over Detail Panel --- */}
                <div className={`transition-all duration-500 ease-in-out bg-white p-6 md:p-8 rounded-[40px] shadow-[0_0_40px_rgba(0,0,0,0.08)] border border-gray-100 flex flex-col xl:w-1/3 xl:static absolute right-0 top-0 h-full max-h-[85vh] overflow-y-auto z-20 w-11/12 max-w-lg ${isPanelOpen ? 'translate-x-0 opacity-100' : 'translate-x-[120%] opacity-0 xl:hidden'}`}>
                    <div className="flex items-center justify-between sticky -top-6 xl:-top-8 bg-white/95 backdrop-blur-md pb-4 pt-6 xl:pt-8 z-10 border-b border-gray-50 mb-6 w-full">
                        <h3 className="text-lg md:text-xl font-black flex items-center gap-3">
                            <span className="w-2 h-8 bg-bee-yellow rounded-full"></span>
                            {locForm.id ? '지점 상세 정보' : '신규 지점 등록'}
                        </h3>
                        <button onClick={handleClosePanel} className="w-8 h-8 rounded-full bg-gray-50 text-gray-400 hover:bg-gray-100 flex items-center justify-center transition-colors shadow-sm" title="패널 닫기">
                            <i className="fa-solid fa-xmark"></i>
                        </button>
                    </div>
                    <div className="space-y-6 pb-20">
                        <div>
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">지점 ID (중복불가)</label>
                            <input autoComplete="off" value={locForm.id ?? ''} onChange={e => setLocForm({ ...locForm, id: e.target.value })} placeholder="예: icn-t1" className="w-full bg-gray-50 p-3 rounded-xl font-bold border border-gray-100 focus:border-bee-yellow outline-none text-xs" />
                        </div>
                        <div className="space-y-2">
                            <div className="flex items-center justify-between ml-1">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">지점명</label>
                                <div className="flex items-center gap-2">
                                    <button onClick={handleAiTranslate} disabled={isTranslating} className="text-[10px] font-black text-bee-yellow bg-bee-black px-2 py-1 rounded-lg hover:scale-105 transition-all flex items-center gap-1.5 shadow-sm disabled:opacity-50">
                                        {isTranslating ? <i className="fa-solid fa-spinner animate-spin"></i> : <i className="fa-solid fa-wand-magic-sparkles"></i>} AI 자동 번역
                                    </button>
                                    <button onClick={handleAiGenerateForReview} disabled={isGeneratingForReview} className="text-[10px] font-black text-bee-black bg-bee-yellow px-2 py-1 rounded-lg hover:scale-105 transition-all flex items-center gap-1.5 shadow-sm disabled:opacity-50" title="Claude로 번역 생성 후 검수함에 저장 (직접 반영 안 됨)">
                                        {isGeneratingForReview ? <i className="fa-solid fa-spinner animate-spin"></i> : <span>🌐</span>} AI 검수 생성
                                    </button>
                                </div>
                                {reviewToast && (
                                    <div className={`text-[10px] font-bold px-2 py-1 rounded-lg mt-1 ${reviewToast.startsWith('⚠') ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                                        {reviewToast}
                                    </div>
                                )}
                            </div>
                            <div className="grid grid-cols-1 gap-2">
                                <input autoComplete="off" value={locForm.name ?? ''} onChange={e => setLocForm({ ...locForm, name: e.target.value })} placeholder="한글 명칭 입력 (예: 인천공항 T1)" title="지점명 (한국어)" className="bg-white p-3 rounded-xl font-bold border border-gray-100 focus:border-bee-yellow outline-none text-xs shadow-sm" />
                                <input autoComplete="off" value={locForm.name_en || ''} onChange={e => setLocForm({ ...locForm, name_en: e.target.value })} placeholder="영어 명칭 입력 (예: Incheon Airport T1)" title="지점명 (영어)" className="bg-gray-50 p-1.5 px-3 rounded-lg font-bold border border-gray-100 focus:border-bee-yellow outline-none text-[10px]" />
                                <input autoComplete="off" value={locForm.name_ja || ''} onChange={e => setLocForm({ ...locForm, name_ja: e.target.value })} placeholder="일본어 명칭 입력 (예: 仁川空港 T1)" title="지점명 (일본어)" className="bg-gray-50 p-1.5 px-3 rounded-lg font-bold border border-gray-100 focus:border-bee-yellow outline-none text-[10px]" />
                                <input autoComplete="off" value={locForm.name_zh || ''} onChange={e => setLocForm({ ...locForm, name_zh: e.target.value })} placeholder="중국어 간체 입력 (예: 仁川机场 T1)" title="지점명 (중국어 간체)" className="bg-gray-50 p-1.5 px-3 rounded-lg font-bold border border-gray-100 focus:border-bee-yellow outline-none text-[10px]" />
                                <input autoComplete="off" value={locForm.name_zh_tw || ''} onChange={e => setLocForm({ ...locForm, name_zh_tw: e.target.value })} placeholder="대만 번체 입력 (예: 仁川機場 T1)" title="지점명 (대만 번체)" className="bg-gray-50 p-1.5 px-3 rounded-lg font-bold border border-gray-100 focus:border-bee-yellow outline-none text-[10px]" />
                                <input autoComplete="off" value={locForm.name_zh_hk || ''} onChange={e => setLocForm({ ...locForm, name_zh_hk: e.target.value })} placeholder="홍콩 번체 입력 (예: 仁川機場 T1)" title="지점명 (홍콩 번체)" className="bg-gray-50 p-1.5 px-3 rounded-lg font-bold border border-gray-100 focus:border-bee-yellow outline-none text-[10px]" />
                            </div>
                        </div>
                        <div>
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">지점 분류 (Type)</label>
                            <select title="Location Type" value={locForm.type ?? LocationType.PARTNER} onChange={e => setLocForm({ ...locForm, type: e.target.value as LocationType })} className="w-full bg-gray-50 p-3 rounded-xl font-bold border border-gray-100 focus:border-bee-yellow outline-none text-xs">
                                {LOCATION_TYPE_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                            </select>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                            <div>
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">위도 (Lat)</label>
                                <input autoComplete="off" type="number" title="Latitude" placeholder="Latitude" value={locForm.lat ?? ''} onChange={e => setLocForm({ ...locForm, lat: e.target.value ? parseFloat(e.target.value) : undefined })} className="w-full bg-gray-50 p-3 rounded-xl font-bold border border-gray-100 focus:border-bee-yellow outline-none text-xs" />
                            </div>
                            <div>
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">경도 (Lng)</label>
                                <input autoComplete="off" type="number" title="Longitude" placeholder="Longitude" value={locForm.lng ?? ''} onChange={e => setLocForm({ ...locForm, lng: e.target.value ? parseFloat(e.target.value) : undefined })} className="w-full bg-gray-50 p-3 rounded-xl font-bold border border-gray-100 focus:border-bee-yellow outline-none text-xs" />
                            </div>
                        </div>

                        <div>
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">주소 (Address)</label>
                            <div className="flex gap-2">
                                <input autoComplete="off" value={locForm.address ?? ''} onChange={e => setLocForm({ ...locForm, address: e.target.value })} placeholder="지점의 도로명 주소를 입력하세요" className="flex-1 bg-gray-50 p-3 rounded-xl font-bold border border-gray-100 focus:border-bee-yellow outline-none text-xs shadow-sm" />
                                <button onClick={findCoordinates} title="Find Coordinates" disabled={isGeocoding} className="px-4 bg-bee-yellow text-bee-black font-black rounded-xl text-[10px] hover:scale-105 transition-all shadow-sm disabled:opacity-50 whitespace-nowrap">
                                    {isGeocoding ? <i className="fa-solid fa-spinner animate-spin"></i> : <i className="fa-solid fa-location-crosshairs"></i>} 좌표찾기
                                </button>
                            </div>
                            <div className="mt-2 space-y-2">
                                <input autoComplete="off" value={locForm.address_en || ''} onChange={e => setLocForm({ ...locForm, address_en: e.target.value })} placeholder="영어 주소 입력" title="상세 주소 (영어)" className="w-full bg-gray-50 p-2 px-3 rounded-lg font-bold border border-gray-100 focus:border-bee-yellow outline-none text-[10px]" />
                                <input autoComplete="off" value={locForm.address_ja || ''} onChange={e => setLocForm({ ...locForm, address_ja: e.target.value })} placeholder="일본어 주소 입력" title="상세 주소 (일본어)" className="w-full bg-gray-50 p-2 px-3 rounded-lg font-bold border border-gray-100 focus:border-bee-yellow outline-none text-[10px]" />
                                <input autoComplete="off" value={locForm.address_zh || ''} onChange={e => setLocForm({ ...locForm, address_zh: e.target.value })} placeholder="중국어 간체 주소 입력" title="상세 주소 (중국어 간체)" className="w-full bg-gray-50 p-2 px-3 rounded-lg font-bold border border-gray-100 focus:border-bee-yellow outline-none text-[10px]" />
                                <input autoComplete="off" value={locForm.address_zh_tw || ''} onChange={e => setLocForm({ ...locForm, address_zh_tw: e.target.value })} placeholder="대만 번체 주소 입력" title="상세 주소 (대만 번체)" className="w-full bg-gray-50 p-2 px-3 rounded-lg font-bold border border-gray-100 focus:border-bee-yellow outline-none text-[10px]" />
                                <input autoComplete="off" value={locForm.address_zh_hk || ''} onChange={e => setLocForm({ ...locForm, address_zh_hk: e.target.value })} placeholder="홍콩 번체 주소 입력" title="상세 주소 (홍콩 번체)" className="w-full bg-gray-50 p-2 px-3 rounded-lg font-bold border border-gray-100 focus:border-bee-yellow outline-none text-[10px]" />
                            </div>
                        </div>

                        {/* --- SaaS Multi-Branch Extension Fields 🏢 --- */}
                        <div className="pt-4 border-t border-gray-100 space-y-4">
                            <h4 className="text-[10px] font-black text-bee-yellow uppercase tracking-[0.2em] mb-2">SaaS Branch Matrix</h4>
                            
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">전용 URL 코드</label>
                                    <input autoComplete="off" value={locForm.branchCode || ''} onChange={e => setLocForm({ ...locForm, branchCode: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') })} placeholder="예: yeonnam" className="w-full bg-bee-yellow/5 p-3 rounded-xl font-bold border border-bee-yellow/20 focus:border-bee-yellow outline-none text-xs text-bee-black" />
                                </div>
                                <div>
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">대표자명</label>
                                    <input autoComplete="off" value={locForm.ownerName || ''} onChange={e => setLocForm({ ...locForm, ownerName: e.target.value })} placeholder="대표자 성함" className="w-full bg-gray-50 p-3 rounded-xl font-bold border border-gray-100 focus:border-bee-yellow outline-none text-xs" />
                                </div>
                            </div>


                            <div>
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">지점 연락처</label>
                                <input autoComplete="off" value={locForm.phone || locForm.contactNumber || ''} onChange={e => setLocForm({ ...locForm, phone: e.target.value })} placeholder="02-1234-5678" className="w-full bg-gray-50 p-3 rounded-xl font-bold border border-gray-100 focus:border-bee-yellow outline-none text-xs" />
                            </div>
                        </div>

                        <div>
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">대표 이미지 (Main Image)</label>
                            <div className="mt-1 flex items-center gap-2 bg-gray-50 p-2 rounded-2xl border border-gray-100 group focus-within:border-bee-yellow transition-all shadow-sm">
                                {locForm.imageUrl && (
                                    <div className="relative shrink-0">
                                        <img src={locForm.imageUrl} alt="Preview" className="w-12 h-12 rounded-xl object-cover border-2 border-bee-yellow shadow-sm" />
                                        <button onClick={() => setLocForm({ ...locForm, imageUrl: '' })} className="absolute -top-1 -right-1 bg-red-500 text-white w-4 h-4 rounded-full flex items-center justify-center text-[8px] border border-white shadow-sm hover:scale-110 transition-transform" title="이미지 삭제">
                                            <i className="fa-solid fa-xmark"></i>
                                        </button>
                                    </div>
                                )}
                                <input
                                    autoComplete="off"
                                    value={locForm.imageUrl || ''}
                                    onChange={e => setLocForm({ ...locForm, imageUrl: e.target.value })}
                                    placeholder="URL 입력 혹은 우측 버튼으로 업로드"
                                    title="대표 이미지 URL"
                                    className="flex-1 bg-transparent px-2 font-black outline-none text-[10px] text-bee-black placeholder:text-gray-300"
                                />
                                <label className="shrink-0 cursor-pointer p-3 bg-white hover:bg-bee-yellow rounded-xl transition-all shadow-sm group/btn">
                                    <i className="fa-solid fa-cloud-arrow-up text-gray-400 group-hover/btn:text-bee-black text-xs"></i>
                                    <input type="file" accept="image/*" onChange={handleLocationImageUpload} className="hidden" title="대표 사진 업로드" />
                                </label>
                            </div>
                        </div>

                        <div>
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">수령 안내 이미지 (Pickup Guide)</label>
                            <div className="mt-1 flex items-center gap-2 bg-gray-50 p-2 rounded-2xl border border-gray-100 group focus-within:border-emerald-400 transition-all shadow-sm">
                                {locForm.pickupImageUrl && (
                                    <div className="relative shrink-0">
                                        <img src={locForm.pickupImageUrl} alt="Pickup Preview" className="w-12 h-12 rounded-xl object-cover border-2 border-emerald-400 shadow-sm" />
                                        <button onClick={() => setLocForm({ ...locForm, pickupImageUrl: '' })} className="absolute -top-1 -right-1 bg-red-500 text-white w-4 h-4 rounded-full flex items-center justify-center text-[8px] border border-white shadow-sm hover:scale-110 transition-transform" title="이미지 삭제">
                                            <i className="fa-solid fa-xmark"></i>
                                        </button>
                                    </div>
                                )}
                                <input
                                    autoComplete="off"
                                    value={locForm.pickupImageUrl || ''}
                                    onChange={e => setLocForm({ ...locForm, pickupImageUrl: e.target.value })}
                                    placeholder="URL 입력 혹은 우측 버튼으로 업로드"
                                    title="안내 이미지 URL"
                                    className="flex-1 bg-transparent px-2 font-black outline-none text-[10px] text-bee-black placeholder:text-gray-300"
                                />
                                <label className="shrink-0 cursor-pointer p-3 bg-white hover:bg-emerald-400 rounded-xl transition-all shadow-sm group/btn">
                                    <i className="fa-solid fa-map-location-dot text-gray-400 group-hover/btn:text-white text-xs"></i>
                                    <input type="file" accept="image/*" onChange={handlePickupImageUpload} className="hidden" title="안내 사진 업로드" />
                                </label>
                            </div>
                        </div>

                        <div>
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">영업 시간 (Business Hours)</label>
                            <div className="grid grid-cols-1 gap-2 mt-1">
                                <input autoComplete="off" value={locForm.businessHours ?? ''} onChange={e => setLocForm({ ...locForm, businessHours: e.target.value })} placeholder="예: 09:00 - 22:00 (연중무휴)" title="영업 시간 (한국어)" className="bg-white p-3 rounded-xl font-bold border border-gray-100 focus:border-bee-yellow outline-none text-xs shadow-sm" />
                                <input autoComplete="off" value={locForm.businessHours_en || ''} onChange={e => setLocForm({ ...locForm, businessHours_en: e.target.value })} placeholder="영어 영업 시간 입력" title="영업 시간 (영어)" className="bg-gray-50 p-2 px-3 rounded-lg font-bold border border-gray-100 focus:border-bee-yellow outline-none text-[10px]" />
                                <input autoComplete="off" value={locForm.businessHours_ja || ''} onChange={e => setLocForm({ ...locForm, businessHours_ja: e.target.value })} placeholder="일본어 영업 시간 입력" title="영업 시간 (일본어)" className="bg-gray-50 p-2 px-3 rounded-lg font-bold border border-gray-100 focus:border-bee-yellow outline-none text-[10px]" />
                                <input autoComplete="off" value={locForm.businessHours_zh || ''} onChange={e => setLocForm({ ...locForm, businessHours_zh: e.target.value })} placeholder="중국어 영업 시간 입력" title="영업 시간 (중국어)" className="bg-gray-50 p-2 px-3 rounded-lg font-bold border border-gray-100 focus:border-bee-yellow outline-none text-[10px]" />
                            </div>
                        </div>

                        <div>
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">상세 설명 (Description)</label>
                            <textarea value={locForm.description ?? ''} onChange={e => setLocForm({ ...locForm, description: e.target.value })} placeholder="지점에 대한 상세 설명을 입력하세요" className="w-full bg-gray-50 p-3 rounded-xl font-bold border border-gray-100 focus:border-bee-yellow outline-none text-xs min-h-[80px]" />
                        </div>

                        <div>
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">플랫폼 연동 설정 (Checklist)</label>
                            <div className="grid grid-cols-2 gap-2 mt-2">
                                {[
                                    { label: '활성화', key: 'isActive', color: 'bg-green-500' },
                                    { label: '배송지원', key: 'supportsDelivery', color: 'bg-yellow-500' },
                                    { label: '보관지원', key: 'supportsStorage', color: 'bg-blue-500' },
                                    { label: '출발거점', key: 'isOrigin', color: 'bg-purple-500' },
                                    { label: '도착거점', key: 'isDestination', color: 'bg-teal-500' },
                                ].map(item => (
                                    <button
                                        key={item.key}
                                        onClick={() => setLocForm({ ...locForm, [item.key]: !locForm[item.key] })}
                                        className={`flex items-center justify-between p-2 px-3 rounded-xl border transition-all ${locForm[item.key] !== false ? 'border-transparent ring-2 ring-offset-1 ' + (item.key === 'isActive' ? 'ring-green-400 bg-green-50' : item.key === 'supportsDelivery' ? 'ring-yellow-400 bg-yellow-50' : item.key === 'supportsStorage' ? 'ring-blue-400 bg-blue-50' : 'ring-gray-400 bg-gray-50') : 'border-gray-100 bg-white opacity-50'}`}
                                    >
                                        <span className="text-[10px] font-black">{item.label}</span>
                                        <div className={`w-2 h-2 rounded-full ${locForm[item.key] !== false ? item.color : 'bg-gray-200'}`}></div>
                                    </button>
                                ))}
                            </div>
                        </div>

                        <button onClick={addLocation} disabled={isSaving} title="지점 정보 저장" className="w-full py-4 bg-bee-black text-bee-yellow font-black rounded-2xl mt-4 shadow-lg hover:scale-[1.02] transition-transform flex items-center justify-center gap-2">
                            {isSaving ? <i className="fa-solid fa-spinner animate-spin"></i> : <i className="fa-solid fa-floppy-disk"></i>} 지점 정보 저장하기
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LocationsTab;
