import React from 'react';
import { LocationOption, LocationType } from '../../types';

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

    const handleBulkMapPhotos = async (mode: 'ID' | 'NAME') => {
        if (!confirm(`${mode === 'ID' ? '지점 ID' : '지점 한글명'}을 기준으로 스토리지의 사진을 자동 매칭하시겠습니까?\n(기존 사진이 있는 지점도 덮어씌워집니다.)`)) return;

        setIsBulkMapping(true);
        try {
            const { StorageService } = await import('../../services/storageService');
            const bucket = "beeliber-main.firebasestorage.app";

            for (const loc of locations) {
                const fileName = mode === 'ID' ? `${loc.id}.jpg` : `${loc.name}.jpg`;
                const encodedFileName = encodeURIComponent(`locations/${fileName}`);
                const imageUrl = `https://firebasestorage.googleapis.com/v0/b/${bucket}/o/${encodedFileName}?alt=media`;

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
            if (!loc.name.toLowerCase().includes(q) && !loc.id.toLowerCase().includes(q) && !(loc.name_en || '').toLowerCase().includes(q)) return false;
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
                                if (!confirm("MBX- 형식의 지점 ID를 3자리 약칭(AGS, DDP 등)으로 일괄 변경하시겠습니까?\n이 작업은 Firestore 데이터를 직접 수정하며 되돌릴 수 없습니다. 💅")) return;
                                setIsBulkMapping(true);
                                try {
                                    const { StorageService } = await import('../../services/storageService');
                                    const mapping: Record<string, string> = {
                                        'MBX-001': 'AGS', 'MBX-002': 'DDP', 'MBX-003': 'JNO', 'MBX-004': 'CMR',
                                        'MBX-005': 'SSU', 'MBX-006': 'GNS', 'MBX-007': 'MEC', 'MBX-008': 'YDO',
                                        'MBX-009': 'MD2', 'MBX-010': 'IT2', 'MBX-011': 'SRK', 'MBX-012': 'GNM',
                                        'MBX-013': 'NDM', 'MBX-014': 'ISD', 'MBX-015': 'HDA', 'MBX-016': 'MDD',
                                        'MBX-017': 'PTK', 'MBX-018': 'SDO', 'MBX-019': 'SWN', 'MBX-020': 'USO',
                                        'MBX-021': 'BPY', 'MBX-022': 'GPA', 'MBX-023': 'CWN', 'MBX-024': 'USS',
                                        'MBX-025': 'GAL', 'MBX-026': 'BSN', 'MBX-027': 'DGU', 'MBX-028': 'GHE',
                                        'MBX-029': 'NPO', 'MBX-030': 'HDE', 'MBX-031': 'JDM', 'MBX-032': 'JEJ',
                                        'MBX-033': 'GJU'
                                    };
                                    const mbxLocations = locations.filter(l => l.id.startsWith('MBX-'));
                                    if (mbxLocations.length === 0) { alert("변경할 MBX- 지점이 없습니다. 🙄"); return; }
                                    for (const loc of mbxLocations) {
                                        const newId = mapping[loc.id];
                                        if (newId) {
                                            await StorageService.deleteLocation(loc.id);
                                            await StorageService.saveLocation({ ...loc, id: newId, shortCode: newId });
                                        }
                                    }
                                    alert(`총 ${mbxLocations.length}개의 지점 ID가 성공적으로 변경되었습니다! ✨`);
                                    window.location.reload();
                                } catch (e) { alert("ID 변경 중 오류가 발생했습니다. 🚨"); console.error(e); }
                                finally { setIsBulkMapping(false); }
                            }} disabled={isBulkMapping} className="text-[10px] font-black text-purple-600 hover:underline disabled:opacity-50">
                                [MBX ID 약칭 변환]
                            </button>
                        </div>
                    </div>
                </div>
                {(isBulkMapping || isGeocoding) && (
                    <div className="flex items-center gap-2 px-4 py-2 bg-bee-yellow/10 rounded-full border border-bee-yellow/20 animate-pulse">
                        <i className="fa-solid fa-spinner animate-spin text-bee-yellow text-xs"></i>
                        <span className="text-xs font-black text-bee-yellow">{isBulkMapping ? '스봉이가 사진 찾는 중...' : '스봉이가 좌표 찾는 중...'}</span>
                    </div>
                )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
                <div className="bg-white p-6 md:p-8 rounded-[30px] md:rounded-[40px] shadow-sm border border-gray-100 space-y-6 lg:col-span-1 h-fit">
                    <h3 className="text-lg md:text-xl font-black flex items-center gap-3"><span className="w-2 h-8 bg-bee-yellow rounded-full"></span>지점 등록/수정</h3>
                    <div className="space-y-4">
                        <div>
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">지점 ID (중복불가)</label>
                            <input value={locForm.id} onChange={e => setLocForm({ ...locForm, id: e.target.value })} placeholder="예: icn-t1" className="w-full bg-gray-50 p-3 rounded-xl font-bold border border-gray-100 focus:border-bee-yellow outline-none text-xs" />
                        </div>
                        <div className="space-y-2">
                            <div className="flex items-center justify-between ml-1">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">지점명</label>
                                <button onClick={handleAiTranslate} disabled={isTranslating} className="text-[10px] font-black text-bee-yellow bg-bee-black px-2 py-1 rounded-lg hover:scale-105 transition-all flex items-center gap-1.5 shadow-sm disabled:opacity-50">
                                    {isTranslating ? <i className="fa-solid fa-spinner animate-spin"></i> : <i className="fa-solid fa-wand-magic-sparkles"></i>} AI 자동 번역
                                </button>
                            </div>
                            <div className="grid grid-cols-1 gap-2">
                                <input value={locForm.name} onChange={e => setLocForm({ ...locForm, name: e.target.value })} placeholder="한글 명칭 입력 (예: 인천공항 T1)" title="지점명 (한국어)" className="bg-white p-3 rounded-xl font-bold border border-gray-100 focus:border-bee-yellow outline-none text-xs shadow-sm" />
                                <input value={locForm.name_en || ''} onChange={e => setLocForm({ ...locForm, name_en: e.target.value })} placeholder="영어 명칭 입력 (예: Incheon Airport T1)" title="지점명 (영어)" className="bg-gray-50 p-1.5 px-3 rounded-lg font-bold border border-gray-100 focus:border-bee-yellow outline-none text-[10px]" />
                                <input value={locForm.name_ja || ''} onChange={e => setLocForm({ ...locForm, name_ja: e.target.value })} placeholder="일본어 명칭 입력 (예: 仁川空港 T1)" title="지점명 (일본어)" className="bg-gray-50 p-1.5 px-3 rounded-lg font-bold border border-gray-100 focus:border-bee-yellow outline-none text-[10px]" />
                                <input value={locForm.name_zh || ''} onChange={e => setLocForm({ ...locForm, name_zh: e.target.value })} placeholder="중국어 명칭 입력 (예: 仁川机场 T1)" title="지점명 (중국어)" className="bg-gray-50 p-1.5 px-3 rounded-lg font-bold border border-gray-100 focus:border-bee-yellow outline-none text-[10px]" />
                            </div>
                        </div>
                        <div>
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">지점 분류 (Type)</label>
                            <select title="Location Type" value={locForm.type} onChange={e => setLocForm({ ...locForm, type: e.target.value as LocationType })} className="w-full bg-gray-50 p-3 rounded-xl font-bold border border-gray-100 focus:border-bee-yellow outline-none text-xs">
                                {LOCATION_TYPE_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                            </select>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                            <div>
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">위도 (Lat)</label>
                                <input type="number" title="Latitude" placeholder="Latitude" value={locForm.lat ?? ''} onChange={e => setLocForm({ ...locForm, lat: e.target.value ? parseFloat(e.target.value) : undefined })} className="w-full bg-gray-50 p-3 rounded-xl font-bold border border-gray-100 focus:border-bee-yellow outline-none text-xs" />
                            </div>
                            <div>
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">경도 (Lng)</label>
                                <input type="number" title="Longitude" placeholder="Longitude" value={locForm.lng ?? ''} onChange={e => setLocForm({ ...locForm, lng: e.target.value ? parseFloat(e.target.value) : undefined })} className="w-full bg-gray-50 p-3 rounded-xl font-bold border border-gray-100 focus:border-bee-yellow outline-none text-xs" />
                            </div>
                        </div>

                        <div>
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">주소 (Address)</label>
                            <div className="flex gap-2">
                                <input value={locForm.address} onChange={e => setLocForm({ ...locForm, address: e.target.value })} placeholder="지점의 도로명 주소를 입력하세요" className="flex-1 bg-gray-50 p-3 rounded-xl font-bold border border-gray-100 focus:border-bee-yellow outline-none text-xs shadow-sm" />
                                <button onClick={findCoordinates} disabled={isGeocoding} className="px-4 bg-bee-yellow text-bee-black font-black rounded-xl text-[10px] hover:scale-105 transition-all shadow-sm disabled:opacity-50 whitespace-nowrap">
                                    {isGeocoding ? <i className="fa-solid fa-spinner animate-spin"></i> : <i className="fa-solid fa-location-crosshairs"></i>} 좌표찾기
                                </button>
                            </div>
                            <div className="mt-2 space-y-2">
                                <input value={locForm.address_en || ''} onChange={e => setLocForm({ ...locForm, address_en: e.target.value })} placeholder="영어 주소 입력" title="상세 주소 (영어)" className="w-full bg-gray-50 p-2 px-3 rounded-lg font-bold border border-gray-100 focus:border-bee-yellow outline-none text-[10px]" />
                                <input value={locForm.address_ja || ''} onChange={e => setLocForm({ ...locForm, address_ja: e.target.value })} placeholder="일본어 주소 입력" title="상세 주소 (일본어)" className="w-full bg-gray-50 p-2 px-3 rounded-lg font-bold border border-gray-100 focus:border-bee-yellow outline-none text-[10px]" />
                                <input value={locForm.address_zh || ''} onChange={e => setLocForm({ ...locForm, address_zh: e.target.value })} placeholder="중국어 주소 입력" title="상세 주소 (중국어)" className="w-full bg-gray-50 p-2 px-3 rounded-lg font-bold border border-gray-100 focus:border-bee-yellow outline-none text-[10px]" />
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
                                <input value={locForm.businessHours} onChange={e => setLocForm({ ...locForm, businessHours: e.target.value })} placeholder="예: 09:00 - 22:00 (연중무휴)" title="영업 시간 (한국어)" className="bg-white p-3 rounded-xl font-bold border border-gray-100 focus:border-bee-yellow outline-none text-xs shadow-sm" />
                                <input value={locForm.businessHours_en || ''} onChange={e => setLocForm({ ...locForm, businessHours_en: e.target.value })} placeholder="영어 영업 시간 입력" title="영업 시간 (영어)" className="bg-gray-50 p-2 px-3 rounded-lg font-bold border border-gray-100 focus:border-bee-yellow outline-none text-[10px]" />
                                <input value={locForm.businessHours_ja || ''} onChange={e => setLocForm({ ...locForm, businessHours_ja: e.target.value })} placeholder="일본어 영업 시간 입력" title="영업 시간 (일본어)" className="bg-gray-50 p-2 px-3 rounded-lg font-bold border border-gray-100 focus:border-bee-yellow outline-none text-[10px]" />
                                <input value={locForm.businessHours_zh || ''} onChange={e => setLocForm({ ...locForm, businessHours_zh: e.target.value })} placeholder="중국어 영업 시간 입력" title="영업 시간 (중국어)" className="bg-gray-50 p-2 px-3 rounded-lg font-bold border border-gray-100 focus:border-bee-yellow outline-none text-[10px]" />
                            </div>
                        </div>

                        <div>
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">상세 설명 (Description)</label>
                            <textarea value={locForm.description} onChange={e => setLocForm({ ...locForm, description: e.target.value })} placeholder="지점에 대한 상세 설명을 입력하세요" className="w-full bg-gray-50 p-3 rounded-xl font-bold border border-gray-100 focus:border-bee-yellow outline-none text-xs min-h-[80px]" />
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

                <div className="lg:col-span-2 space-y-4">
                    <div className="bg-white rounded-[24px] p-4 border border-gray-100 shadow-sm space-y-3">
                        <div className="relative">
                            <i className="fa-solid fa-magnifying-glass absolute left-3 top-1/2 -translate-y-1/2 text-gray-300 text-xs"></i>
                            <input value={searchQ} onChange={e => setSearchQ(e.target.value)} placeholder="지점명 또는 ID 검색..." className="w-full bg-gray-50 pl-8 pr-4 py-2.5 rounded-xl text-xs font-bold border border-gray-100 focus:border-bee-yellow outline-none" />
                        </div>
                        <div className="flex flex-wrap gap-2 items-center">
                            {TYPE_FILTERS.map(f => (
                                <button key={f.id} onClick={() => setFilterType(f.id)} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-black transition-all ${filterType === f.id ? 'bg-bee-black text-bee-yellow shadow-sm' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}>
                                    <i className={`fa-solid ${f.icon} text-[9px]`}></i>{f.label}
                                </button>
                            ))}
                            <div className="w-px h-5 bg-gray-200"></div>
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

                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-3 auto-rows-min">
                        {filteredLocations.map(loc => (
                            <div key={loc.id} onClick={() => focusLocation(loc)} className={`bg-white p-3 md:px-4 rounded-[24px] border shadow-sm hover:shadow-md transition-all group relative cursor-pointer flex flex-col sm:flex-row items-center gap-3 ${locForm.id === loc.id ? 'border-bee-yellow ring-2 ring-bee-yellow/20' : 'border-gray-100'}`}>
                                <div className="shrink-0" onClick={e => e.stopPropagation()}>
                                    <input type="checkbox" checked={selectedIds.includes(loc.id)} onChange={(e) => toggleSelect(e as any, loc.id)} title={`${loc.name} 선택`} className="w-4 h-4 rounded-lg accent-bee-black cursor-pointer" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                                        <h4 className="font-black text-base text-bee-black truncate leading-tight">{getLocName(loc)}</h4>
                                        <div className="flex items-center gap-2 shrink-0">
                                            <span className={`px-1.5 py-0.5 rounded-lg text-[7px] font-black uppercase ${loc.type === LocationType.AIRPORT ? 'bg-bee-black text-bee-yellow' : 'bg-gray-100 text-gray-400'}`}>{loc.type}</span>
                                            <span className="text-[9px] font-black text-gray-400 uppercase tracking-tighter">{loc.id}</span>
                                        </div>
                                    </div>
                                    <p className="text-[10px] text-gray-400 font-medium truncate leading-none mt-1" title={getLocAddress(loc)}>{getLocAddress(loc)}</p>
                                </div>
                                <div className="hidden xl:flex flex-wrap gap-1 shrink-0">
                                    {loc.supportsDelivery && <span className="text-[8px] font-bold bg-yellow-50 text-yellow-600 px-1.5 py-0.5 rounded">배송</span>}
                                    {loc.supportsStorage && <span className="text-[8px] font-bold bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded">보관</span>}
                                    {loc.isOrigin && <span className="text-[8px] font-bold bg-purple-50 text-purple-600 px-1.5 py-0.5 rounded">출발</span>}
                                    {loc.isDestination && <span className="text-[8px] font-bold bg-teal-50 text-teal-600 px-1.5 py-0.5 rounded">도착</span>}
                                </div>
                                <div className="flex items-center gap-4 shrink-0">
                                    <div className="flex items-center gap-2">
                                        {loc.isActive !== false ? (
                                            <span className="flex items-center gap-1 text-[8px] font-black text-green-500 bg-green-50 px-2 py-1 rounded-lg ring-1 ring-green-100"><div className="w-1 h-1 bg-green-500 rounded-full animate-pulse"></div> Active</span>
                                        ) : (
                                            <span className="text-[8px] font-black text-red-300 bg-red-50/50 px-2 py-1 rounded-lg">Inactive</span>
                                        )}
                                    </div>
                                    <div className="w-24 text-right">
                                        {loc.lat && loc.lng ? (
                                            (loc.lat === 37.5665 && loc.lng === 126.9780) ? (
                                                <span className="text-[8px] font-black text-amber-600 bg-amber-50 px-2 py-1 rounded-lg flex items-center justify-center gap-1 ring-1 ring-amber-200"><i className="fa-solid fa-triangle-exclamation"></i> 기본좌표</span>
                                            ) : (
                                                <span className="text-[8px] font-black text-green-600/60 bg-green-50/30 px-2 py-1 rounded-lg flex items-center justify-center gap-1"><i className="fa-solid fa-location-dot"></i> 연동됨</span>
                                            )
                                        ) : (
                                            <span className="text-[8px] font-black text-red-400/60 bg-red-50/30 px-2 py-1 rounded-lg flex items-center justify-center gap-1"><i className="fa-solid fa-location-xmark"></i> 없음</span>
                                        )}
                                    </div>
                                </div>
                                <button onClick={(e) => deleteLocation(e, loc.id)} title="지점 삭제" className="absolute top-1/2 -translate-y-1/2 right-2 text-gray-200 hover:text-red-500 transition-colors p-1 opacity-0 group-hover:opacity-100"><i className="fa-solid fa-trash-can text-[10px]"></i></button>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LocationsTab;
