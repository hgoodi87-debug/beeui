
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { StorageService } from '../../services/storageService';
import { TipAreaInfo, TipThemeInfo, TipContent, TipPublishStatus, TipContentType } from '../../src/domains/shared/types';

// [스봉이] tips_fsd 삭제로 인해 로컬 대체 상수로 변경합니다 💅
const TIPS_DATA: any[] = [];
const AREAS_DATA: any[] = [];
const THEMES_DATA: any[] = [];

// [스봉이] Badge 인라인 대체
const Badge: React.FC<{ variant?: string; className?: string; children: React.ReactNode }> = ({ variant = 'outline', className = '', children }) => (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-black ${
        variant === 'accent' ? 'bg-bee-yellow text-bee-black' : 'bg-gray-100 text-gray-500 border border-gray-200'
    } ${className}`}>{children}</span>
);
import { Plus, Edit2, Trash2, Globe, Rocket, AlertTriangle, CheckCircle2, Search, Filter, Image as ImageIcon, MapPin, Tag } from 'lucide-react';

export const TipsCMSTab: React.FC = () => {
    const [areas, setAreas] = useState<TipAreaInfo[]>([]);
    const [themes, setThemes] = useState<TipThemeInfo[]>([]);
    const [contents, setContents] = useState<TipContent[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [activeSubTab, setActiveSubTab] = useState<'AREAS' | 'THEMES' | 'CONTENTS'>('AREAS');

    // Filter states
    const [areaFilter, setAreaFilter] = useState<string>('ALL');
    const [themeFilter, setThemeFilter] = useState<string>('ALL');
    const [searchQuery, setSearchQuery] = useState('');

    // Modal states
    const [isMigrating, setIsMigrating] = useState(false);
    const [editingItem, setEditingItem] = useState<{ type: 'AREA' | 'THEME' | 'CONTENT', data: any } | null>(null);

    useEffect(() => {
        const unsubAreas = StorageService.subscribeTipsAreas(setAreas);
        const unsubThemes = StorageService.subscribeTipsThemes(setThemes);
        const unsubContents = StorageService.subscribeTipsContents({}, setContents);

        setIsLoading(false);
        return () => {
            unsubAreas();
            unsubThemes();
            unsubContents();
        };
    }, []);

    const handleMigrate = async () => {
        if (!confirm('본부장님, 하드코딩된 데이터를 Firestore로 강제 이민(?) 시키겠어요? 💅 기존 데이터가 있으면 덮어씌워질 수 있으니 주의하세요. ✨')) return;
        
        setIsMigrating(true);
        try {
            // Areas migration
            for (const area of AREAS_DATA) {
                await StorageService.saveTipsArea({
                    ...area,
                    order: AREAS_DATA.indexOf(area)
                });
            }

            // Themes migration
            for (const theme of THEMES_DATA) {
                await StorageService.saveTipsTheme({
                    ...theme,
                    description: (theme as any).description || theme.theme_name, // Fallback to name if description missing
                    is_active: true,
                    order: THEMES_DATA.indexOf(theme)
                });
            }

            // Contents migration
            for (const content of TIPS_DATA) {
                await StorageService.saveTipsContent({
                    ...content,
                    priority_score: 10,
                    quality_score: 100
                });
            }

            alert('마이그레이션이 성공적으로 완료되었습니다! 🚀 이제 진짜 깍쟁이처럼 관리해 보세요. ✨');
        } catch (error: any) {
            console.error('Migration error:', error);
            alert(`어머, 마이그레이션 중에 사고가 났어요: ${error.message} 🙄`);
        } finally {
            setIsMigrating(false);
        }
    };

    const handleDeleteArea = async (id: string) => {
        if (!confirm('정말로 이 지형(Area)을 지울까요? 🙄 연결된 콘텐츠가 고아가 될 수도 있어요.')) return;
        try {
            await StorageService.deleteTipsArea(id);
        } catch (e) { alert('삭제 실패!'); }
    };

    const handleDeleteTheme = async (id: string) => {
        if (!confirm('정말로 이 테마를 지울까요? 🙄')) return;
        try {
            await StorageService.deleteTipsTheme(id);
        } catch (e) { alert('삭제 실패!'); }
    };

    const handleDeleteContent = async (id: string) => {
        if (!confirm('정말로 이 콘텐츠(Place)를 지울까요? 🙄')) return;
        try {
            await StorageService.deleteTipsContent(id);
        } catch (e) { alert('삭제 실패!'); }
    };

    const filteredContents = contents.filter(c => {
        const matchesArea = areaFilter === 'ALL' || c.area_slug === areaFilter;
        const matchesTheme = themeFilter === 'ALL' || c.theme_tags.includes(themeFilter);
        const matchesSearch = c.title.ko.toLowerCase().includes(searchQuery.toLowerCase()) || 
                             c.slug.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesArea && matchesTheme && matchesSearch;
    });

    return (
        <div className="flex flex-col gap-8">
            {/* Header Toolbar */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-orange-100 rounded-2xl flex items-center justify-center text-orange-500 shadow-sm border border-orange-50/50">
                        <i className="fa-solid fa-lightbulb text-xl"></i>
                    </div>
                    <div>
                        <h1 className="text-3xl font-black tracking-tight text-bee-black">Tips CMS Hub 🏗️✨</h1>
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-1">Beeliber Content Management System</p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <button 
                        onClick={handleMigrate}
                        disabled={isMigrating}
                        className="flex items-center gap-2 px-6 py-3.5 bg-bee-black text-bee-yellow rounded-2xl text-sm font-black transition-all hover:shadow-xl hover:-translate-y-0.5 disabled:opacity-50 disabled:translate-y-0"
                    >
                        {isMigrating ? <i className="fa-solid fa-spinner animate-spin"></i> : <Rocket size={18} />}
                        마이그레이션 실행
                    </button>
                    <button 
                        className="flex items-center gap-2 px-6 py-3.5 bg-bee-yellow text-bee-black rounded-2xl text-sm font-black transition-all hover:shadow-xl hover:-translate-y-0.5"
                    >
                        <Plus size={18} />
                        신규 항목 추가
                    </button>
                </div>
            </div>

            {/* Sub Tabs */}
            <div className="flex items-center gap-2 p-1.5 bg-gray-100 rounded-2xl w-fit border border-gray-200">
                {[
                    { id: 'AREAS', label: '주요 지역 (Areas)', icon: 'fa-map-location-dot' },
                    { id: 'THEMES', label: '여행 테마 (Themes)', icon: 'fa-tags' },
                    { id: 'CONTENTS', label: '콘텐츠/장소 (Places)', icon: 'fa-location-crosshairs' },
                ].map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveSubTab(tab.id as any)}
                        className={`flex items-center gap-3 px-6 py-3 rounded-xl text-sm font-black transition-all ${activeSubTab === tab.id ? 'bg-white text-bee-black shadow-sm ring-1 ring-black/5' : 'text-gray-400 hover:text-gray-600'}`}
                    >
                        <i className={`fa-solid ${tab.icon} w-5`}></i>
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Content Area */}
            <div className="min-h-[600px]">
                {activeSubTab === 'AREAS' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {areas.map(area => (
                            <motion.div 
                                layout
                                key={area.id}
                                className="bg-white rounded-[32px] p-8 border border-gray-100 shadow-sm hover:shadow-xl transition-all group overflow-hidden relative"
                            >
                                <div className="absolute top-0 right-0 w-32 h-32 bg-gray-50 rounded-bl-[100px] -z-10 group-hover:bg-orange-50 transition-colors"></div>
                                
                                <div className="flex items-start justify-between mb-6">
                                    <div className="w-16 h-16 rounded-2xl overflow-hidden border border-gray-100 shadow-sm">
                                        <img src={area.cover_image_url} alt={area.area_slug} className="w-full h-full object-cover" />
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button title="수정" className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center text-gray-400 hover:bg-bee-yellow hover:text-bee-black transition-all">
                                            <Edit2 size={16} />
                                        </button>
                                        <button 
                                            title="삭제"
                                            onClick={() => area.id && handleDeleteArea(area.id)}
                                            className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center text-gray-400 hover:bg-red-50 hover:text-red-500 transition-all"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </div>

                                <h3 className="text-xl font-black text-bee-black mb-2 flex items-center gap-2">
                                    {area.area_name.ko}
                                    {area.is_priority_area && <Badge variant="accent" className="scale-75">Priority</Badge>}
                                </h3>
                                <p className="text-sm font-bold text-gray-400 mb-6 italic line-clamp-2 leading-relaxed">
                                    {area.headline.ko}
                                </p>

                                <div className="flex flex-wrap gap-2 pt-6 border-t border-gray-100">
                                    <span className="text-[10px] font-black uppercase tracking-tighter text-gray-300">Related Branches:</span>
                                    {area.relatedBranchIds.map(bid => (
                                        <span key={bid} className="px-2 py-0.5 bg-gray-50 text-[10px] font-black text-gray-500 rounded-md border border-gray-100">{bid}</span>
                                    ))}
                                </div>
                            </motion.div>
                        ))}
                    </div>
                )}

                {activeSubTab === 'THEMES' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                         {themes.map(theme => (
                            <div key={theme.id} className="bg-white rounded-[32px] p-8 border border-gray-100 shadow-sm flex flex-col items-center text-center">
                                <div className="w-20 h-20 bg-gray-50 rounded-3xl flex items-center justify-center text-3xl mb-6 shadow-inner">
                                    {theme.icon || '✨'}
                                </div>
                                <h3 className="text-xl font-black text-bee-black mb-1">{theme.theme_name.ko}</h3>
                                <p className="text-xs font-bold text-gray-400 mb-6 uppercase tracking-widest">{theme.theme_slug}</p>
                                <div className="flex items-center gap-2 mt-auto">
                                    <button title="테마 수정" className="px-4 py-2 bg-gray-50 rounded-xl text-xs font-black text-gray-500 hover:bg-bee-yellow hover:text-bee-black transition-all">수정</button>
                                    <button 
                                        title="테마 삭제"
                                        onClick={() => theme.id && handleDeleteTheme(theme.id)}
                                        className="px-4 py-2 bg-gray-50 rounded-xl text-xs font-black text-gray-500 hover:bg-red-50 hover:text-red-500 transition-all"
                                    >삭제</button>
                                </div>
                            </div>
                         ))}
                    </div>
                )}

                {activeSubTab === 'CONTENTS' && (
                    <div className="flex flex-col gap-8">
                        {/* Filters */}
                        <div className="bg-white rounded-[32px] p-6 border border-gray-100 shadow-sm flex flex-wrap items-center gap-6">
                            <div className="flex-1 min-w-[300px] relative">
                                <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-300" size={18} />
                                <input 
                                    type="text" 
                                    placeholder="콘텐츠 제목 또는 Slug 검색..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full bg-gray-50 border border-gray-100 rounded-2xl py-3.5 pl-14 pr-6 text-sm font-bold outline-none focus:ring-2 ring-bee-yellow/20 transition-all"
                                />
                            </div>
                            <div className="flex items-center gap-4">
                                <div className="flex items-center gap-2 px-4 py-3 bg-gray-50 rounded-2xl border border-gray-100">
                                    <MapPin size={16} className="text-gray-400" />
                                    <select 
                                        title="지역 필터"
                                        value={areaFilter}
                                        onChange={(e) => setAreaFilter(e.target.value)}
                                        className="bg-transparent text-xs font-black text-bee-black outline-none cursor-pointer"
                                    >
                                        <option value="ALL">전체 지역</option>
                                        {areas.map(a => <option key={a.id} value={a.area_slug}>{a.area_name.ko}</option>)}
                                    </select>
                                </div>
                                <div className="flex items-center gap-2 px-4 py-3 bg-gray-50 rounded-2xl border border-gray-100">
                                    <Tag size={16} className="text-gray-400" />
                                    <select 
                                        title="테마 필터"
                                        value={themeFilter}
                                        onChange={(e) => setThemeFilter(e.target.value)}
                                        className="bg-transparent text-xs font-black text-bee-black outline-none cursor-pointer"
                                    >
                                        <option value="ALL">전체 테마</option>
                                        {themes.map(t => <option key={t.id} value={t.theme_slug}>{t.theme_name.ko}</option>)}
                                    </select>
                                </div>
                            </div>
                        </div>

                        {/* Contents Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {filteredContents.map(content => (
                                <div key={content.id} className="bg-white rounded-[32px] border border-gray-100 shadow-sm hover:shadow-xl transition-all group flex flex-col">
                                    <div className="relative aspect-video rounded-t-[32px] overflow-hidden">
                                        <img src={content.cover_image_url} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" alt="" />
                                        <div className="absolute top-4 left-4 flex gap-2">
                                            <Badge variant={content.publish_status === 'published' ? 'accent' : 'outline'} className="shadow-lg backdrop-blur-md">
                                                {content.publish_status.toUpperCase()}
                                            </Badge>
                                            <Badge variant="outline" className="bg-black/20 text-white border-white/10 backdrop-blur-md">
                                                {content.content_type.toUpperCase()}
                                            </Badge>
                                        </div>
                                    </div>
                                    <div className="p-8 flex-1 flex flex-col">
                                        <div className="flex items-start justify-between mb-4">
                                            <div>
                                                <span className="text-[10px] font-black text-bee-yellow uppercase tracking-widest mb-1 block">{content.area_slug}</span>
                                                <h3 className="text-xl font-black text-bee-black line-clamp-1">{content.title.ko}</h3>
                                            </div>
                                            <div className="flex gap-1">
                                                <button title="장소 수정" className="p-2 hover:bg-gray-100 rounded-lg transition-colors"><Edit2 size={16} className="text-gray-400" /></button>
                                                <button 
                                                    title="장소 삭제"
                                                    onClick={() => content.id && handleDeleteContent(content.id)}
                                                    className="p-2 hover:bg-red-50 rounded-lg transition-colors"><Trash2 size={16} className="text-gray-400 hover:text-red-500" /></button>
                                            </div>
                                        </div>
                                        <p className="text-sm font-bold text-gray-400 line-clamp-2 mb-6 flex-1 italic leading-relaxed">
                                            {content.summary.ko}
                                        </p>
                                        <div className="flex flex-wrap gap-1.5 pt-6 border-t border-gray-50">
                                            {content.theme_tags.map(tag => (
                                                <span key={tag} className="px-2.5 py-1 bg-gray-50 text-[9px] font-black text-gray-500 rounded-lg border border-gray-100 uppercase">#{tag}</span>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
