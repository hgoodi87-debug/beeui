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
    addLocation: () => void;
    locations: LocationOption[];
    focusLocation: (loc: LocationOption) => void;
    deleteLocation: (e: React.MouseEvent, id: string) => void;
    lang: string;
    t: any;
}

const LocationsTab: React.FC<LocationsTabProps> = ({
    locForm, setLocForm, LOCATION_TYPE_OPTIONS, findCoordinates, isGeocoding,
    handlePickupImageUpload, handleLocationImageUpload, isSaving, addLocation,
    locations, focusLocation, deleteLocation, lang, t
}) => {
    const [isTranslating, setIsTranslating] = React.useState(false);
    const [filterType, setFilterType] = React.useState<string>('ALL');
    const [filterStatus, setFilterStatus] = React.useState<string>('ALL');
    const [searchQ, setSearchQ] = React.useState('');

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
        return loc.name;
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
    });

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
                <h1 className="text-2xl md:text-3xl font-black tracking-tight">지점(거점) 관리</h1>
                <span className="text-xs font-black text-gray-400">{filteredLocations.length} / {locations.length} 지점</span>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
                {/* 왼쪽: 등록/수정 폼 */}
                <div className="bg-white p-6 md:p-8 rounded-[30px] md:rounded-[40px] shadow-sm border border-gray-100 space-y-6 lg:col-span-1 h-fit">
                    <div className="flex flex-col gap-4">
                        <h3 className="text-lg md:text-xl font-black flex items-center gap-3"><span className="w-2 h-8 bg-bee-yellow rounded-full"></span>지점 등록/수정</h3>
                        <button onClick={async () => { if (confirm("경고: 초기 데이터로 강제 동기화합니다.")) { try { const { StorageService } = await import('../../services/storageService'); await StorageService.syncLocationsWithConstants(); alert("동기화 완료."); window.location.reload(); } catch (e) { alert("오류"); } } }} className="w-full py-3 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 border border-gray-200">
                            <i className="fa-solid fa-rotate"></i> 초기 데이터 강제 동기화 (Sync DB)
                        </button>
                    </div>

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
                                <input value={locForm.name} onChange={e => setLocForm({ ...locForm, name: e.target.value })} placeholder="KR: 인천공항 T1" className="bg-white p-3 rounded-xl font-bold border border-gray-100 focus:border-bee-yellow outline-none text-xs shadow-sm" />
                                <input value={locForm.name_en || ''} onChange={e => setLocForm({ ...locForm, name_en: e.target.value })} placeholder="EN: Incheon Airport T1" className="bg-gray-50 p-1.5 px-3 rounded-lg font-bold border border-gray-100 focus:border-bee-yellow outline-none text-[10px]" />
                                <input value={locForm.name_ja || ''} onChange={e => setLocForm({ ...locForm, name_ja: e.target.value })} placeholder="JA: 仁川空港 T1" className="bg-gray-50 p-1.5 px-3 rounded-lg font-bold border border-gray-100 focus:border-bee-yellow outline-none text-[10px]" />
                                <input value={locForm.name_zh || ''} onChange={e => setLocForm({ ...locForm, name_zh: e.target.value })} placeholder="ZH: 仁川机场 T1" className="bg-gray-50 p-1.5 px-3 rounded-lg font-bold border border-gray-100 focus:border-bee-yellow outline-none text-[10px]" />
                            </div>
                        </div>

                        <div>
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">지점 분류 (Type)</label>
                            <select title="Location Type" value={locForm.type} onChange={e => setLocForm({ ...locForm, type: e.target.value as LocationType })} className="w-full bg-gray-50 p-3 rounded-xl font-bold border border-gray-100 focus:border-bee-yellow outline-none text-xs">
                                {LOCATION_TYPE_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                            </select>
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                            <div><label className="text-[9px] font-black text-gray-400 uppercase">위도 (Lat)</label><input type="number" title="Latitude" placeholder="Latitude" value={locForm.lat ?? ''} onChange={e => setLocForm({ ...locForm, lat: e.target.value ? parseFloat(e.target.value) : undefined })} className="w-full bg-gray-50 p-3 rounded-xl font-bold border border-gray-100 focus:border-bee-yellow outline-none text-xs" /></div>
                            <div><label className="text-[9px] font-black text-gray-400 uppercase">경도 (Lng)</label><input type="number" title="Longitude" placeholder="Longitude" value={locForm.lng ?? ''} onChange={e => setLocForm({ ...locForm, lng: e.target.value ? parseFloat(e.target.value) : undefined })} className="w-full bg-gray-50 p-3 rounded-xl font-bold border border-gray-100 focus:border-bee-yellow outline-none text-xs" /></div>
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                            <div><label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">출발 할증</label><input type="number" title="Origin Surcharge" placeholder="0" value={locForm.originSurcharge} onChange={e => setLocForm({ ...locForm, originSurcharge: Number(e.target.value) })} className="w-full bg-gray-50 p-3 rounded-xl font-bold border border-gray-100 focus:border-bee-yellow outline-none text-xs" /></div>
                            <div><label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">도착 할증</label><input type="number" title="Destination Surcharge" placeholder="0" value={locForm.destinationSurcharge} onChange={e => setLocForm({ ...locForm, destinationSurcharge: Number(e.target.value) })} className="w-full bg-gray-50 p-3 rounded-xl font-bold border border-gray-100 focus:border-bee-yellow outline-none text-xs" /></div>
                        </div>

                        <div>
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">지점 대표 사진 (Main Image)</label>
                            <div className="flex gap-2">
                                <input value={locForm.imageUrl || ''} onChange={e => setLocForm({ ...locForm, imageUrl: e.target.value })} placeholder="이미지 URL" className="flex-1 bg-gray-50 p-3 rounded-xl font-bold border border-gray-100 focus:border-bee-yellow outline-none text-xs" />
                                <label className="cursor-pointer bg-gray-100 px-3 py-2 rounded-xl font-bold text-xs flex items-center justify-center hover:bg-gray-200 transition-all min-w-[70px]"><i className="fa-solid fa-upload mr-1"></i> 업로드<input type="file" accept="image/*" className="hidden" onChange={handleLocationImageUpload} /></label>
                            </div>
                            {locForm.imageUrl && <div className="relative w-full h-40 rounded-xl overflow-hidden border border-gray-100 bg-gray-50 mt-2"><img src={locForm.imageUrl} alt="Preview" className="w-full h-full object-cover" /><button onClick={() => setLocForm({ ...locForm, imageUrl: '' })} title="Remove Image" aria-label="Remove" className="absolute top-2 right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center text-[10px] shadow-md"><i className="fa-solid fa-xmark"></i></button></div>}
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">주소</label>
                            <div className="flex gap-2">
                                <input title="Location Address" placeholder="주소를 입력하세요" value={locForm.address} onChange={e => setLocForm({ ...locForm, address: e.target.value })} className="flex-1 bg-gray-50 p-3 rounded-xl font-bold border border-gray-100 focus:border-bee-yellow outline-none text-xs" />
                                <button onClick={findCoordinates} disabled={isGeocoding} className="bg-bee-black text-bee-yellow px-3 py-2 rounded-xl font-bold text-xs hover:bg-gray-800 transition-all shadow-md flex items-center justify-center min-w-[70px]">{isGeocoding ? <i className="fa-solid fa-spinner animate-spin"></i> : <span>좌표 찾기</span>}</button>
                            </div>
                            <div className="grid grid-cols-1 gap-1">
                                <input value={locForm.address_en || ''} onChange={e => setLocForm({ ...locForm, address_en: e.target.value })} placeholder="Address (English)" className="bg-gray-50 p-1.5 px-3 rounded-lg font-bold border border-gray-100 focus:border-bee-yellow outline-none text-[10px]" />
                                <input value={locForm.address_ja || ''} onChange={e => setLocForm({ ...locForm, address_ja: e.target.value })} placeholder="住所 (日本語)" className="bg-gray-50 p-1.5 px-3 rounded-lg font-bold border border-gray-100 focus:border-bee-yellow outline-none text-[10px]" />
                                <input value={locForm.address_zh || ''} onChange={e => setLocForm({ ...locForm, address_zh: e.target.value })} placeholder="地址 (中国語)" className="bg-gray-50 p-1.5 px-3 rounded-lg font-bold border border-gray-100 focus:border-bee-yellow outline-none text-[10px]" />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">수화물 수령 위치 안내</label>
                            <textarea value={locForm.pickupGuide} onChange={e => setLocForm({ ...locForm, pickupGuide: e.target.value })} placeholder="KR: 예: 3층 A카운터 앞 노란색 표지판 아래" className="w-full bg-gray-50 p-3 rounded-xl font-bold border border-gray-100 focus:border-bee-yellow outline-none text-xs h-20 resize-none" />
                            <textarea value={locForm.pickupGuide_en || ''} onChange={e => setLocForm({ ...locForm, pickupGuide_en: e.target.value })} placeholder="EN: pickup guide" className="w-full bg-gray-50 p-1.5 px-3 rounded-lg font-bold border border-gray-100 focus:border-bee-yellow outline-none text-[10px] h-12 resize-none" />
                            <textarea value={locForm.pickupGuide_ja || ''} onChange={e => setLocForm({ ...locForm, pickupGuide_ja: e.target.value })} placeholder="JA: ピックアップガイド" className="w-full bg-gray-50 p-1.5 px-3 rounded-lg font-bold border border-gray-100 focus:border-bee-yellow outline-none text-[10px] h-12 resize-none" />
                            <textarea value={locForm.pickupGuide_zh || ''} onChange={e => setLocForm({ ...locForm, pickupGuide_zh: e.target.value })} placeholder="ZH: 取件指南" className="w-full bg-gray-50 p-1.5 px-3 rounded-lg font-bold border border-gray-100 focus:border-bee-yellow outline-none text-[10px] h-12 resize-none" />
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-bee-yellow uppercase tracking-widest ml-1">운영 시간 (Business Hours)</label>
                            <input value={locForm.businessHours || ''} onChange={e => setLocForm({ ...locForm, businessHours: e.target.value })} placeholder="KR: 연중무휴 09:00-21:00" className="w-full bg-gray-50 p-3 rounded-xl font-bold border border-gray-100 focus:border-bee-yellow outline-none text-xs" />
                            <div className="grid grid-cols-1 gap-1">
                                <input value={locForm.businessHours_en || ''} onChange={e => setLocForm({ ...locForm, businessHours_en: e.target.value })} placeholder="EN: Open daily 09:00-21:00" className="bg-gray-50 p-1.5 px-3 rounded-lg font-bold border border-gray-100 focus:border-bee-yellow outline-none text-[10px]" />
                                <input value={locForm.businessHours_ja || ''} onChange={e => setLocForm({ ...locForm, businessHours_ja: e.target.value })} placeholder="JA: 年中無休 09:00-21:00" className="bg-gray-50 p-1.5 px-3 rounded-lg font-bold border border-gray-100 focus:border-bee-yellow outline-none text-[10px]" />
                                <input value={locForm.businessHours_zh || ''} onChange={e => setLocForm({ ...locForm, businessHours_zh: e.target.value })} placeholder="ZH: 全年无休 09:00-21:00" className="bg-gray-50 p-1.5 px-3 rounded-lg font-bold border border-gray-100 focus:border-bee-yellow outline-none text-[10px]" />
                            </div>
                        </div>

                        <div>
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">수령 위치 안내 사진 (Pickup Image)</label>
                            <div className="flex gap-2">
                                <input value={locForm.pickupImageUrl} onChange={e => setLocForm({ ...locForm, pickupImageUrl: e.target.value })} placeholder="이미지 URL 혹은 파일 업로드" className="flex-1 bg-gray-50 p-3 rounded-xl font-bold border border-gray-100 focus:border-bee-yellow outline-none text-xs" />
                                <label className="cursor-pointer bg-gray-100 px-3 py-2 rounded-xl font-bold text-xs flex items-center justify-center hover:bg-gray-200 transition-all min-w-[70px]"><i className="fa-solid fa-upload mr-1"></i> 업로드<input type="file" accept="image/*" className="hidden" onChange={handlePickupImageUpload} /></label>
                            </div>
                            {locForm.pickupImageUrl && <div className="relative w-full h-32 rounded-xl overflow-hidden border border-gray-100 bg-gray-50 mt-2"><img src={locForm.pickupImageUrl} alt="Pickup Preview" className="w-full h-full object-cover" /><button onClick={() => setLocForm({ ...locForm, pickupImageUrl: '' })} title="Delete Pickup Image" aria-label="Delete Pickup Image" className="absolute top-2 right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center text-[10px] shadow-md"><i className="fa-solid fa-xmark"></i></button></div>}
                        </div>

                        <div className="grid grid-cols-2 gap-2 pt-2">
                            <label className="flex items-center gap-2 text-xs font-bold cursor-pointer bg-gray-50 p-2 rounded-lg hover:bg-gray-100"><input type="checkbox" checked={locForm.supportsDelivery} onChange={e => setLocForm({ ...locForm, supportsDelivery: e.target.checked })} /> 배송 (Delivery)</label>
                            <label className="flex items-center gap-2 text-xs font-bold cursor-pointer bg-gray-50 p-2 rounded-lg hover:bg-gray-100"><input type="checkbox" checked={locForm.supportsStorage} onChange={e => setLocForm({ ...locForm, supportsStorage: e.target.checked })} /> 보관 (Storage)</label>
                            <label className="flex items-center gap-2 text-xs font-bold cursor-pointer bg-gray-50 p-2 rounded-lg hover:bg-gray-100"><input type="checkbox" checked={locForm.isOrigin} onChange={e => setLocForm({ ...locForm, isOrigin: e.target.checked })} /> 출발 (Origin)</label>
                            <label className="flex items-center gap-2 text-xs font-bold cursor-pointer bg-gray-50 p-2 rounded-lg hover:bg-gray-100"><input type="checkbox" checked={locForm.isDestination} onChange={e => setLocForm({ ...locForm, isDestination: e.target.checked })} /> 목적지 (Dest)</label>
                            <label className="flex items-center gap-2 text-xs font-bold cursor-pointer bg-yellow-50 text-yellow-700 p-2 rounded-lg hover:bg-yellow-100 border border-yellow-100"><input type="checkbox" checked={locForm.isPartner} onChange={e => setLocForm({ ...locForm, isPartner: e.target.checked })} /> 파트너 지점 (Partner)</label>
                        </div>

                        {locForm.isPartner && (
                            <div className="pt-4 mt-2 border-t border-dashed border-gray-200 space-y-4 animate-fade-in">
                                <h4 className="text-[11px] font-black text-bee-yellow uppercase tracking-widest flex items-center gap-2"><i className="fa-solid fa-handshake"></i> 파트너 지점 상세</h4>
                                <div className="grid grid-cols-2 gap-2">
                                    <div><label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">지점장</label><input value={locForm.ownerName || ''} onChange={e => setLocForm({ ...locForm, ownerName: e.target.value })} placeholder="홍길동" className="w-full bg-gray-50 p-3 rounded-xl font-bold border border-gray-100 focus:border-bee-yellow outline-none text-xs" /></div>
                                    <div><label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">연락처</label><input value={locForm.ownerPhone || ''} onChange={e => setLocForm({ ...locForm, ownerPhone: e.target.value })} placeholder="010-1234-5678" className="w-full bg-gray-50 p-3 rounded-xl font-bold border border-gray-100 focus:border-bee-yellow outline-none text-xs" /></div>
                                    <div className="col-span-2"><label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">이메일</label><input value={locForm.ownerEmail || ''} onChange={e => setLocForm({ ...locForm, ownerEmail: e.target.value })} placeholder="owner@email.com" className="w-full bg-gray-50 p-3 rounded-xl font-bold border border-gray-100 focus:border-bee-yellow outline-none text-xs" /></div>
                                    <div className="col-span-2"><label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">사업자번호</label><input value={locForm.businessRegNumber || ''} onChange={e => setLocForm({ ...locForm, businessRegNumber: e.target.value })} placeholder="123-45-67890" className="w-full bg-gray-50 p-3 rounded-xl font-bold border border-gray-100 focus:border-bee-yellow outline-none text-xs" /></div>
                                </div>
                                <div className="bg-yellow-50/50 p-4 rounded-2xl border border-yellow-100/50 space-y-3">
                                    <h5 className="text-[10px] font-black text-gray-500 uppercase flex items-center gap-1.5"><i className="fa-solid fa-percent"></i> 수수료율 (%)</h5>
                                    <div className="grid grid-cols-2 gap-2">
                                        <div><label className="text-[9px] font-black text-gray-400 uppercase">보관</label><input title="Storage Commission" placeholder="0" type="number" value={locForm.commissionRates?.storage || 0} onChange={e => setLocForm({ ...locForm, commissionRates: { ...locForm.commissionRates, storage: Number(e.target.value) } })} className="w-full bg-white p-2.5 rounded-xl font-bold border border-gray-100 focus:border-bee-yellow outline-none text-xs" /></div>
                                        <div><label className="text-[9px] font-black text-gray-400 uppercase">배송</label><input title="Delivery Commission" placeholder="0" type="number" value={locForm.commissionRates?.delivery || 0} onChange={e => setLocForm({ ...locForm, commissionRates: { ...locForm.commissionRates, delivery: Number(e.target.value) } })} className="w-full bg-white p-2.5 rounded-xl font-bold border border-gray-100 focus:border-bee-yellow outline-none text-xs" /></div>
                                        <div><label className="text-[9px] font-black text-gray-400 uppercase">티켓</label><input title="Ticket Commission" placeholder="0" type="number" value={locForm.commissionRates?.ticket || 0} onChange={e => setLocForm({ ...locForm, commissionRates: { ...locForm.commissionRates, ticket: Number(e.target.value) } })} className="w-full bg-white p-2.5 rounded-xl font-bold border border-gray-100 focus:border-bee-yellow outline-none text-xs" /></div>
                                        <div><label className="text-[9px] font-black text-gray-400 uppercase">유심</label><input title="USIM Commission" placeholder="0" type="number" value={locForm.commissionRates?.usim || 0} onChange={e => setLocForm({ ...locForm, commissionRates: { ...locForm.commissionRates, usim: Number(e.target.value) } })} className="w-full bg-white p-2.5 rounded-xl font-bold border border-gray-100 focus:border-bee-yellow outline-none text-xs" /></div>
                                        <div className="col-span-2"><label className="text-[9px] font-black text-gray-400 uppercase">기타</label><input title="Other Commission" placeholder="0" type="number" value={locForm.commissionRates?.others || 0} onChange={e => setLocForm({ ...locForm, commissionRates: { ...locForm.commissionRates, others: Number(e.target.value) } })} className="w-full bg-white p-2.5 rounded-xl font-bold border border-gray-100 focus:border-bee-yellow outline-none text-xs" /></div>
                                    </div>
                                </div>
                            </div>
                        )}

                        <div className="pt-2 border-t border-dashed border-gray-200">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 mb-2 block">제공 서비스</label>
                            <div className="grid grid-cols-2 gap-2">
                                {['짐 보관', '짐 배송', '환전', '캐리어 구매'].map(service => (
                                    <label key={service} className="flex items-center gap-2 text-xs font-bold cursor-pointer bg-gray-50 p-2 rounded-lg hover:bg-gray-100 transition-colors">
                                        <input type="checkbox" checked={(locForm.availableServices || []).includes(service)} onChange={e => { const cs = locForm.availableServices || []; setLocForm({ ...locForm, availableServices: e.target.checked ? [...cs, service] : cs.filter((s: string) => s !== service) }); }} className="w-4 h-4 rounded accent-bee-black" />{service}
                                    </label>
                                ))}
                            </div>
                        </div>

                        <div className="pt-2 border-t border-dashed border-gray-200">
                            <label className="flex items-center gap-3 text-sm font-black cursor-pointer bg-bee-yellow/10 p-4 rounded-2xl border-2 border-bee-yellow/20 hover:bg-bee-yellow/20 transition-all">
                                <input type="checkbox" checked={locForm.isActive ?? true} onChange={e => setLocForm({ ...locForm, isActive: e.target.checked })} className="w-5 h-5 rounded-lg accent-bee-black" />
                                로케이션 노출 활성화 (Active)
                            </label>
                        </div>
                        <button onClick={addLocation} disabled={isSaving} className="w-full py-4 bg-bee-black text-bee-yellow font-black rounded-2xl mt-4 shadow-lg hover:scale-[1.02] transition-transform flex items-center justify-center gap-2">
                            {isSaving ? <i className="fa-solid fa-spinner animate-spin"></i> : <i className="fa-solid fa-floppy-disk"></i>} 저장하기
                        </button>
                    </div>
                </div>

                {/* 오른쪽: 필터 + 지점 목록 */}
                <div className="lg:col-span-2 space-y-4">
                    {/* ─── 필터 바 💅 ─── */}
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
                            {(filterType !== 'ALL' || filterStatus !== 'ALL' || searchQ) && (
                                <button onClick={() => { setFilterType('ALL'); setFilterStatus('ALL'); setSearchQ(''); }} className="px-3 py-1.5 rounded-full text-[10px] font-black text-red-400 bg-red-50 hover:bg-red-100 transition-all ml-auto">
                                    <i className="fa-solid fa-xmark mr-1"></i>초기화
                                </button>
                            )}
                        </div>
                        <div className="text-[10px] font-black text-gray-400">{filteredLocations.length}개 표시 중 / 전체 {locations.length}개</div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 auto-rows-min">
                        {filteredLocations.map(loc => (
                            <div key={loc.id} onClick={() => focusLocation(loc)} className={`bg-white p-6 rounded-[24px] md:rounded-[30px] border shadow-sm hover:shadow-md transition-all group relative cursor-pointer ${locForm.id === loc.id ? 'border-bee-yellow ring-2 ring-bee-yellow/20' : 'border-gray-100'}`}>
                                <div className="flex items-center gap-3 mb-3">
                                    <span className={`px-2 py-1 rounded-lg text-[9px] font-black uppercase ${loc.type === LocationType.AIRPORT ? 'bg-bee-black text-bee-yellow' : 'bg-gray-100 text-gray-500'}`}>{loc.type}</span>
                                    <span className="text-[10px] font-black text-gray-300 uppercase tracking-widest">{loc.id}</span>
                                    <div className="ml-auto flex items-center gap-2">
                                        {loc.type !== LocationType.AIRPORT && (
                                            <button onClick={(e) => { e.stopPropagation(); window.open(`/branch/${loc.id}`, '_blank'); }} className="text-[8px] font-black bg-bee-black text-bee-yellow px-2 py-0.5 rounded-full hover:scale-110 transition-all flex items-center gap-1 shadow-sm" title="지점 대시보드">
                                                <i className="fa-solid fa-chart-pie"></i> DASHBOARD
                                            </button>
                                        )}
                                        {loc.isActive !== false ? (
                                            <span className="flex items-center gap-1.5 text-[8px] font-black text-green-500 bg-green-50 px-2 py-0.5 rounded-full ring-1 ring-green-100"><div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div> Active</span>
                                        ) : (
                                            <span className="flex items-center gap-1.5 text-[8px] font-black text-red-400 bg-red-50 px-2 py-0.5 rounded-full ring-1 ring-red-100"><div className="w-1.5 h-1.5 bg-red-400 rounded-full"></div> Inactive</span>
                                        )}
                                    </div>
                                </div>
                                <div className="mb-1">
                                    <h4 className="font-black text-lg text-bee-black">{getLocName(loc)}</h4>
                                    {lang !== 'ko' && <p className="text-[10px] text-gray-300 font-bold">{loc.name}</p>}
                                </div>
                                <p className="text-xs text-gray-400 font-medium truncate mb-4">{getLocAddress(loc)}</p>
                                {loc.isPartner && loc.commissionRates && (
                                    <div className="mb-4 bg-gray-50 p-2.5 rounded-xl border border-gray-100 flex items-center gap-3">
                                        <span className="text-[9px] font-black text-gray-300 uppercase tracking-widest"><i className="fa-solid fa-coins mr-1"></i>Commission</span>
                                        <div className="flex items-center gap-3 ml-auto">
                                            <div className="flex items-center gap-1.5 text-[10px] font-black"><span className="text-gray-400">보관</span><span className="text-bee-black bg-white px-1.5 py-0.5 rounded-md border border-gray-100">{loc.commissionRates.storage || 0}%</span></div>
                                            <div className="flex items-center gap-1.5 text-[10px] font-black"><span className="text-gray-400">배송</span><span className="text-bee-black bg-white px-1.5 py-0.5 rounded-md border border-gray-100">{loc.commissionRates.delivery || 0}%</span></div>
                                        </div>
                                    </div>
                                )}
                                <div className="flex items-center justify-between">
                                    <div className="flex flex-wrap gap-2">
                                        {loc.supportsDelivery && <span className="text-[9px] font-bold bg-yellow-50 text-yellow-700 px-2 py-1 rounded">배송</span>}
                                        {loc.supportsStorage && <span className="text-[9px] font-bold bg-blue-50 text-blue-700 px-2 py-1 rounded">보관</span>}
                                        {loc.isOrigin && <span className="text-[9px] font-bold bg-purple-50 text-purple-700 px-2 py-1 rounded">출발</span>}
                                        {loc.isDestination && <span className="text-[9px] font-bold bg-teal-50 text-teal-700 px-2 py-1 rounded">도착</span>}
                                        {loc.isPartner && <span className="text-[9px] font-bold bg-bee-yellow text-black px-2 py-1 rounded">PARTNER</span>}
                                    </div>
                                    {loc.lat && loc.lng ? <span className="text-[9px] font-bold text-green-600 bg-green-50 px-2 py-1 rounded flex items-center gap-1"><i className="fa-solid fa-location-dot"></i> 좌표 연동됨</span> : <span className="text-[9px] font-bold text-red-400 bg-red-50 px-2 py-1 rounded">좌표 없음</span>}
                                </div>
                                <button onClick={(e) => deleteLocation(e, loc.id)} title="Delete Location" aria-label="Delete Location" className="absolute top-4 right-4 text-gray-200 hover:text-red-500 transition-colors p-2"><i className="fa-solid fa-trash-can"></i></button>
                            </div>
                        ))}
                        {filteredLocations.length === 0 && (
                            <div className="col-span-full py-20 text-center text-gray-400 font-bold bg-white rounded-[40px] border border-gray-100">
                                <i className="fa-solid fa-magnifying-glass text-2xl mb-3 text-gray-200 block"></i>
                                조건에 맞는 지점이 없습니다.
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LocationsTab;
