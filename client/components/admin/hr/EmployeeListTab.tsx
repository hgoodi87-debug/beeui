import React from 'react';
import { AdminUser, LocationOption } from '../../../types';
import { HR_STATUS_CONFIG, HR_ROLES, HRStatusConfig, HRRole } from '../../../src/constants/hr';

interface EmployeeListTabProps {
  admins: AdminUser[];
  locations: LocationOption[];
  onEdit: (admin: AdminUser) => void;
  onDelete: (id: string) => void;
  onAdd: () => void;
  onDeduplicate?: () => void;
}

const EmployeeListTab: React.FC<EmployeeListTabProps> = ({
  admins, locations, onEdit, onDelete, onAdd, onDeduplicate
}) => {
  const [activeCategory, setActiveCategory] = React.useState<'ALL' | 'SUPER' | 'TITLE' | 'BRANCH'>('ALL');
  const [selectedSubFilter, setSelectedSubFilter] = React.useState<string>('ALL');
  const [searchQ, setSearchQ] = React.useState('');

  // 직책 목록 및 지점 목록 추출 (HQ 직원 위주로 추출하여 필터 혼란 방지) 💅
  const jobTitles = React.useMemo(() => {
    // 슈퍼 관리자가 아니면서 지점 소속이 없는(HQ) 직원들의 직책만 추출
    const hqAdmins = admins.filter(admin => {
        const isSuperName = admin.name === '천명' || admin.name === 'admin';
        const isSuper = admin.role === 'super' || isSuperName;
        return !isSuper && !admin.branchId;
    });
    const titles = Array.from(new Set(hqAdmins.map(a => a.jobTitle).filter(Boolean)));
    return titles.sort();
  }, [admins]);

  const filteredAdmins = React.useMemo(() => {
    return admins.filter(admin => {
      // 1. 카테고리 필터
      const isSuperName = admin.name === '천명' || admin.name === 'admin';
      const isSuper = admin.role === 'super' || isSuperName;

      if (activeCategory === 'SUPER') {
        if (!isSuper) return false;
      } else if (activeCategory === 'ALL') {
        // [스봉이] 전체 명부는 괜히 숨기지 말고 그대로 다 보여줘야 덜 놀라죠, 참나.
      } else if (activeCategory === 'TITLE') {
        // 슈퍼 관리자가 아니면서 지점 정보가 없는(HQ) 직원이어야 함
        if (isSuper || admin.branchId) return false;
        if (selectedSubFilter !== 'ALL' && admin.jobTitle !== selectedSubFilter) return false;
      } else if (activeCategory === 'BRANCH') {
        // 슈퍼 관리자가 아니면서 지점 정보가 있는 직원이어야 함
        if (isSuper || !admin.branchId) return false;
        if (selectedSubFilter !== 'ALL' && admin.branchId !== selectedSubFilter) return false;
      }

      // 2. 검색 필터
      if (searchQ.trim()) {
        const q = searchQ.toLowerCase();
        if (!admin.name?.toLowerCase().includes(q) && 
            !admin.jobTitle?.toLowerCase().includes(q) && 
            !admin.email?.toLowerCase().includes(q)) return false;
      }
      return true;
    }).sort((a, b) => (a.name || '').localeCompare(b.name || '', 'ko'));
  }, [admins, activeCategory, selectedSubFilter, searchQ]);

  const getSyncBadge = (admin: AdminUser) => {
    if (admin.syncStatus?.status === 'error') {
      return {
        label: '동기화 실패',
        className: 'bg-red-50 text-red-700 border border-red-100',
      };
    }

    if (admin.syncStatus?.status === 'synced' && admin.syncStatus.profileId && admin.syncStatus.employeeId) {
      return {
        label: admin.syncStatus.syntheticEmail ? '임시메일 연동' : '로그인 연동 완료',
        className: 'bg-emerald-50 text-emerald-700 border border-emerald-100',
      };
    }

    if (admin.email || admin.loginId) {
      return {
        label: '동기화 필요',
        className: 'bg-amber-50 text-amber-700 border border-amber-100',
      };
    }

    return {
      label: '명부 전용',
      className: 'bg-gray-100 text-gray-500 border border-gray-200',
    };
  };

  return (
    <div className="space-y-8 animate-fade-in-up">
      {/* 카테고리 탭 상단 정렬 */}
      <div className="flex flex-wrap gap-2">
        {[
          { id: 'ALL', label: '전체 직원', icon: 'fa-users' },
          { id: 'SUPER', label: '슈퍼관리', icon: 'fa-shield-crown' },
          { id: 'TITLE', label: '직책별', icon: 'fa-id-card-clip' },
          { id: 'BRANCH', label: '브랜치 지점', icon: 'fa-building-flag' },
        ].map(cat => (
          <button
            key={cat.id}
            onClick={() => {
              setActiveCategory(cat.id as any);
              setSelectedSubFilter('ALL');
            }}
            className={`px-6 py-3 rounded-2xl text-xs font-black transition-all flex items-center gap-2 ${activeCategory === cat.id ? 'bg-bee-black text-bee-yellow shadow-lg' : 'bg-white text-gray-400 border border-gray-100'}`}
          >
            <i className={`fa-solid ${cat.icon}`}></i>
            {cat.label}
          </button>
        ))}
      </div>

      {/* 필터 및 검색 바 */}
      <div className="bg-white rounded-[32px] p-6 border border-gray-100 shadow-sm flex flex-col lg:flex-row gap-4 items-center">
        <div className="flex-1 relative w-full">
          <i className="fa-solid fa-magnifying-glass absolute left-4 top-1/2 -translate-y-1/2 text-gray-300"></i>
          <input 
            value={searchQ}
            onChange={e => setSearchQ(e.target.value)}
            placeholder={`${activeCategory === 'ALL' ? '전체 직원' : activeCategory === 'SUPER' ? '슈퍼관리자' : activeCategory === 'TITLE' ? '직책' : '지점 직원'} 검색...`} 
            title="직원 검색"
            className="w-full bg-gray-50 pl-11 pr-4 py-4 rounded-2xl text-xs font-bold border border-transparent focus:border-bee-black outline-none transition-all"
          />
        </div>
        <div className="flex gap-3 w-full lg:w-auto overflow-x-auto no-scrollbar pb-1 lg:pb-0">
          {activeCategory !== 'SUPER' && (
            <select 
              value={selectedSubFilter}
              onChange={e => setSelectedSubFilter(e.target.value)}
              title="상세 필터"
              className="bg-gray-50 px-4 py-4 rounded-2xl text-[11px] font-black border border-transparent focus:border-bee-black outline-none min-w-[150px]"
            >
              <option value="ALL">{activeCategory === 'TITLE' ? '모든 직책' : '모든 지점'}</option>
              {activeCategory === 'TITLE' ? (
                jobTitles.map(title => (
                  <option key={title} value={title}>{title}</option>
                ))
              ) : (
                locations.map(loc => (
                  <option key={loc.id} value={loc.id}>{loc.name}</option>
                ))
              )}
            </select>
          )}

          {/* [스봉이] 중복 데이터 정리 도구 버튼 💅 - 디버깅 강화 */}
          {onDeduplicate ? (
            <button 
              onClick={() => {
                console.log("[스봉이] 중복 정리 버튼 클릭됨!");
                onDeduplicate();
              }}
              title="이메일 또는 로그인ID까지 같은 완전 중복만 안전하게 정리"
              className="bg-bee-black text-bee-yellow px-5 py-4 rounded-2xl text-[11px] font-black transition-all flex items-center gap-2 group hover:scale-[1.02] active:scale-95 shadow-md"
            >
              <i className="fa-solid fa-broom group-hover:animate-bounce"></i>
              중복 정리
            </button>
          ) : (
            <div className="hidden">중복 정리 기능 미연결</div>
          )}

          <button 
            onClick={onAdd}
            title="신규 직원 추가 초대"
            className="bg-bee-yellow px-6 py-4 rounded-2xl text-xs font-black whitespace-nowrap shadow-lg shadow-yellow-100 hover:scale-[1.02] active:scale-95 transition-all flex items-center gap-2"
          >
            <i className="fa-solid fa-user-plus"></i>
            초대
          </button>
        </div>
      </div>

      <div className="flex items-center justify-between gap-3 text-[11px] font-black text-gray-400 px-1">
        <span>총 {admins.length}명</span>
        <span>현재 {filteredAdmins.length}명 표시</span>
      </div>

      {/* 직원 그리드 목록 */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredAdmins.length === 0 ? (
          <div className="col-span-full py-32 text-center text-gray-300">
            <i className="fa-solid fa-user-slash text-5xl mb-4 opacity-20"></i>
            <p className="text-sm font-black italic opacity-40">조건에 맞는 직원이 없습니다.</p>
            <p className="text-[11px] font-bold opacity-40 mt-2">필터나 검색어부터 한 번 비워보세요.</p>
          </div>
        ) : (
          filteredAdmins.map(admin => {
            const isSuperName = admin.name === '천명' || admin.name === 'admin';
            // [스봉이] 지점 소속이면 우선적으로 'branch' 역할을 부여해서 '브랜치' 배지가 나오게 합니다. 💅
            const adminRole = isSuperName ? 'super' : (admin.role || (admin.branchId ? 'branch' : 'staff'));
            const statusConfig = (HR_STATUS_CONFIG as Record<string, HRStatusConfig>)[admin.status || 'active'] || HR_STATUS_CONFIG.active;
            const roleConfig = HR_ROLES.find((r: HRRole) => r.id === adminRole) || HR_ROLES.find(r => r.id === 'staff') || HR_ROLES[0];
            const syncBadge = getSyncBadge(admin);
            
            return (
              <div 
                key={admin.id}
                onClick={() => onEdit(admin)}
                className="bg-white p-6 rounded-[32px] border border-gray-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all cursor-pointer group relative overflow-hidden"
              >
                {/* 우측 상단 상태 뱃지 */}
                <div className="absolute top-4 right-4 flex flex-col items-end gap-2">
                   <div className={`px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-tighter ${statusConfig.color} shadow-sm`}>
                     {statusConfig.label}
                   </div>
                   <div className={`px-2.5 py-1 rounded-full text-[9px] font-black tracking-tight shadow-sm ${syncBadge.className}`}>
                     {syncBadge.label}
                   </div>
                </div>

                <div className="flex items-center gap-5 mt-2">
                  <div className={`w-16 h-16 rounded-[24px] flex items-center justify-center font-black italic text-2xl transition-all ${admin.id ? 'bg-bee-yellow text-bee-black group-hover:bg-bee-black group-hover:text-bee-yellow' : 'bg-gray-100 text-gray-300'}`}>
                    {admin.name?.slice(0,1)}
                  </div>
                  <div>
                    <h4 className="text-lg font-black text-bee-black mb-0.5">{admin.name}</h4>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold text-gray-400">{admin.jobTitle}</span>
                      <span className="w-1 h-1 rounded-full bg-gray-200"></span>
                      <span className="text-[10px] font-black text-bee-black/30 group-hover:text-bee-black transition-colors">
                        {locations.find(l => l.id === admin.branchId)?.name || 'HQ / 본사'}
                      </span>
                    </div>
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <span className="text-[10px] font-bold text-gray-400">
                        {admin.syncStatus?.authEmail || admin.email || admin.loginId || '로그인 정보 미설정'}
                      </span>
                      {admin.syncStatus?.syntheticEmail && (
                        <span className="rounded-full bg-amber-100 px-2 py-1 text-[9px] font-black text-amber-700">
                          임시 이메일
                        </span>
                      )}
                    </div>
                    {admin.syncStatus?.status === 'error' && admin.syncStatus.lastError && (
                      <p className="mt-2 max-w-[240px] text-[10px] font-bold leading-relaxed text-red-500">
                        {admin.syncStatus.lastError}
                      </p>
                    )}
                  </div>
                </div>

                <div className="mt-6 pt-6 border-t border-gray-50 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full bg-${roleConfig.color}`}></div>
                    <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">{roleConfig.label}</span>
                  </div>
                  <div className="flex gap-2">
                    <button 
                      onClick={(e) => { e.stopPropagation(); onEdit(admin); }}
                      title="직원 상세 정보 및 권한 수정"
                      className="w-8 h-8 rounded-lg bg-gray-50 text-gray-400 hover:bg-bee-black hover:text-white transition-all flex items-center justify-center"
                    >
                      <i className="fa-solid fa-gear text-[10px]"></i>
                    </button>
                    <button 
                      onClick={(e) => { e.stopPropagation(); onDelete(admin.id); }}
                      title="직원 계정 삭제"
                      className="w-8 h-8 rounded-lg bg-gray-50 text-gray-400 hover:bg-red-500 hover:text-white transition-all flex items-center justify-center"
                    >
                      <i className="fa-solid fa-trash-can text-[10px]"></i>
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default EmployeeListTab;
