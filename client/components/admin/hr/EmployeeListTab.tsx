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
  onBulkReset?: () => void;
}

const EmployeeListTab: React.FC<EmployeeListTabProps> = ({
  admins, locations, onEdit, onDelete, onAdd, onDeduplicate, onBulkReset
}) => {
  const [activeCategory, setActiveCategory] = React.useState<'ALL' | 'SUPER' | 'TITLE' | 'BRANCH'>('ALL');
  const [selectedSubFilter, setSelectedSubFilter] = React.useState<string>('ALL');
  const [searchQ, setSearchQ] = React.useState('');

  const resolveLocation = React.useCallback((admin: AdminUser) => {
    if (admin.branchId) {
      const directMatch = locations.find((location) => location.id === admin.branchId);
      if (directMatch) return directMatch;
    }

    const branchToken = String(admin.branchCode || admin.branchId || '').trim().toLowerCase();
    if (!branchToken) return null;

    return locations.find((location) =>
      String(location.branchCode || '').trim().toLowerCase() === branchToken
      || String(location.shortCode || '').trim().toLowerCase() === branchToken
    ) || null;
  }, [locations]);

  // 직책 목록 및 지점 목록 추출 (HQ 직원 위주로 추출하여 필터 혼란 방지) 💅
  const jobTitles = React.useMemo(() => {
    // 슈퍼 관리자가 아니면서 지점 소속이 없는(HQ) 직원들의 직책만 추출
    const hqAdmins = admins.filter(admin => {
        const isSuperName = admin.name === '천명' || admin.name === 'admin';
        const isSuper = admin.role === 'super' || isSuperName;
        return !isSuper && !admin.branchId && !admin.branchCode;
    });
    const titles = Array.from(new Set(hqAdmins.map(a => a.jobTitle).filter(Boolean)));
    return titles.sort();
  }, [admins]);

  const filteredAdmins = React.useMemo(() => {
    return admins.filter(admin => {
      const matchedLocation = resolveLocation(admin);
      // 1. 카테고리 필터
      const isSuperName = admin.name === '천명' || admin.name === 'admin';
      const isSuper = admin.role === 'super' || isSuperName;
      const hasBranch = Boolean(admin.branchId || admin.branchCode || matchedLocation);

      if (activeCategory === 'SUPER') {
        if (!isSuper) return false;
      } else if (activeCategory === 'ALL') {
        // [스봉이] 전체 명부는 괜히 숨기지 말고 그대로 다 보여줘야 덜 놀라죠, 참나.
      } else if (activeCategory === 'TITLE') {
        // 슈퍼 관리자가 아니면서 지점 정보가 없는(HQ) 직원이어야 함
        if (isSuper || hasBranch) return false;
        if (selectedSubFilter !== 'ALL' && admin.jobTitle !== selectedSubFilter) return false;
      } else if (activeCategory === 'BRANCH') {
        // 슈퍼 관리자가 아니면서 지점 정보가 있는 직원이어야 함
        if (isSuper || !hasBranch) return false;
        if (selectedSubFilter !== 'ALL' && matchedLocation?.id !== selectedSubFilter) return false;
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
  }, [admins, activeCategory, resolveLocation, selectedSubFilter, searchQ]);

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
              onClick={onDeduplicate}
              title="이메일 또는 로그인ID까지 같은 완전 중복만 안전하게 정리"
              className="bg-bee-black text-bee-yellow px-5 py-4 rounded-2xl text-[11px] font-black transition-all flex items-center gap-2 group hover:scale-[1.02] active:scale-95 shadow-md"
            >
              <i className="fa-solid fa-broom group-hover:animate-bounce"></i>
              중복 정리
            </button>
          ) : (
            <div className="hidden">중복 정리 기능 미연결</div>
          )}

          {/* [스봉이] 지점 비밀번호 일괄 초기화 버튼 (0000!!) 💅✨ */}
          {onBulkReset && activeCategory === 'BRANCH' && (
            <button 
              onClick={() => {
                if (window.confirm('모든 지점 관리자의 비밀번호를 "0000!!"으로 초기화하시겠습니까?')) {
                  onBulkReset();
                }
              }}
              className="bg-red-500 text-white px-5 py-4 rounded-2xl text-[11px] font-black transition-all flex items-center gap-2 group hover:scale-[1.02] active:scale-95 shadow-md shadow-red-100"
            >
              <i className="fa-solid fa-key-skeleton"></i>
              비밀번호 일괄 초기화
            </button>
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
            const matchedLocation = resolveLocation(admin);
            const adminRole = isSuperName ? 'super' : (admin.role || ((admin.branchId || admin.branchCode || matchedLocation?.id) ? 'branch' : 'staff'));
            const statusConfig = (HR_STATUS_CONFIG as Record<string, HRStatusConfig>)[admin.status || 'active'] || HR_STATUS_CONFIG.active;
            const syncBadge = getSyncBadge(admin);
            const branchName = admin.branchName || matchedLocation?.name || null;
            const isHQ = !branchName;

            // ── 역할(직책) 배지 스타일 ──────────────────────────────────────
            const ROLE_BADGE: Record<string, { bg: string; text: string; icon: string }> = {
              super:   { bg: 'bg-[#111111]',     text: 'text-[#F5C842]', icon: 'fa-shield-crown' },
              hq:      { bg: 'bg-blue-600',       text: 'text-white',     icon: 'fa-building' },
              branch:  { bg: 'bg-[#F5C842]',      text: 'text-[#111111]', icon: 'fa-store' },
              finance: { bg: 'bg-emerald-600',    text: 'text-white',     icon: 'fa-coins' },
              cs:      { bg: 'bg-sky-500',         text: 'text-white',     icon: 'fa-headset' },
              partner: { bg: 'bg-purple-500',     text: 'text-white',     icon: 'fa-handshake' },
              driver:  { bg: 'bg-orange-500',     text: 'text-white',     icon: 'fa-truck' },
              staff:   { bg: 'bg-gray-200',       text: 'text-gray-600',  icon: 'fa-user' },
            };
            const roleBadge = ROLE_BADGE[adminRole] ?? ROLE_BADGE.staff;
            const roleLabel = HR_ROLES.find((r: HRRole) => r.id === adminRole)?.label ?? '일반스태프';

            // ── 상태 dot 색상 ────────────────────────────────────────────────
            const STATUS_DOT: Record<string, string> = {
              active:    'bg-emerald-500',
              invited:   'bg-amber-400',
              suspended: 'bg-orange-500',
              resigned:  'bg-gray-300',
              locked:    'bg-red-500',
            };
            const statusDot = STATUS_DOT[admin.status || 'active'] ?? 'bg-gray-300';

            return (
              <div
                key={admin.id}
                onClick={() => onEdit(admin)}
                className="bg-white p-6 rounded-[32px] border border-gray-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all cursor-pointer group relative overflow-hidden"
              >
                {/* ── 상단: 아바타 + 이름 + 이메일 ── */}
                <div className="flex items-start gap-4">
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center font-black italic text-xl flex-shrink-0 transition-all ${admin.id ? 'bg-bee-yellow text-bee-black group-hover:bg-bee-black group-hover:text-bee-yellow' : 'bg-gray-100 text-gray-300'}`}>
                    {admin.name?.slice(0, 1)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-base font-black text-bee-black leading-tight truncate">{admin.name}</h4>
                    {admin.jobTitle && (
                      <p className="text-[11px] font-bold text-gray-400 mt-0.5 truncate">{admin.jobTitle}</p>
                    )}
                    <p className="text-[10px] text-gray-300 mt-0.5 truncate">
                      {admin.syncStatus?.authEmail || admin.email || admin.loginId || '로그인 정보 미설정'}
                    </p>
                  </div>
                </div>

                {/* ── 배지 행 ── */}
                <div className="mt-4 flex flex-wrap gap-1.5">
                  {/* 역할 배지 */}
                  <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black ${roleBadge.bg} ${roleBadge.text}`}>
                    <i className={`fa-solid ${roleBadge.icon} text-[8px]`} />
                    {roleLabel}
                  </span>

                  {/* 지점 배지 */}
                  {isHQ ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black bg-gray-800 text-white">
                      <i className="fa-solid fa-building text-[8px]" />
                      HQ 본사
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black bg-violet-500 text-white">
                      <i className="fa-solid fa-location-dot text-[8px]" />
                      {branchName}
                    </span>
                  )}

                  {/* 상태 배지 */}
                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black ${statusConfig.color}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${statusDot} flex-shrink-0`} />
                    {statusConfig.label}
                  </span>

                  {/* 동기화 배지 */}
                  <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black ${syncBadge.className}`}>
                    {syncBadge.label}
                  </span>

                  {/* 임시 이메일 배지 */}
                  {admin.syncStatus?.syntheticEmail && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black bg-amber-100 text-amber-700">
                      <i className="fa-solid fa-at text-[8px]" />
                      임시메일
                    </span>
                  )}
                </div>

                {/* ── 에러 메시지 ── */}
                {admin.syncStatus?.status === 'error' && admin.syncStatus.lastError && (
                  <p className="mt-3 text-[10px] font-bold leading-relaxed text-red-500 bg-red-50 rounded-xl px-3 py-2">
                    <i className="fa-solid fa-circle-exclamation mr-1" />
                    {admin.syncStatus.lastError}
                  </p>
                )}

                {/* ── 하단: 구분선 + 버튼 ── */}
                <div className="mt-4 pt-4 border-t border-gray-50 flex items-center justify-end gap-2">
                  <button
                    onClick={(e) => { e.stopPropagation(); onEdit(admin); }}
                    title="직원 상세 정보 및 권한 수정"
                    className="w-8 h-8 rounded-xl bg-gray-50 text-gray-400 hover:bg-bee-black hover:text-white transition-all flex items-center justify-center"
                  >
                    <i className="fa-solid fa-gear text-[10px]" />
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); onDelete(admin.id); }}
                    title="직원 계정 삭제"
                    className="w-8 h-8 rounded-xl bg-gray-50 text-gray-400 hover:bg-red-500 hover:text-white transition-all flex items-center justify-center"
                  >
                    <i className="fa-solid fa-trash-can text-[10px]" />
                  </button>
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
