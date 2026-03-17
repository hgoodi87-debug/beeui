import React from 'react';
import { AdminUser, LocationOption } from '../../../types';
import { HR_STATUS_CONFIG, HR_ROLES, HRStatusConfig, HRRole } from '../../../src/constants/hr';

interface EmployeeListTabProps {
  admins: AdminUser[];
  locations: LocationOption[];
  onEdit: (admin: AdminUser) => void;
  onDelete: (id: string) => void;
  onAdd: () => void;
}

const EmployeeListTab: React.FC<EmployeeListTabProps> = ({
  admins, locations, onEdit, onDelete, onAdd
}) => {
  const [filterStatus, setFilterStatus] = React.useState<string>('ALL');
  const [searchQ, setSearchQ] = React.useState('');

  // KPI 상세 계산
  const stats = React.useMemo(() => {
    return {
      total: admins.length,
      active: admins.filter(a => a.status === 'active').length,
      invited: admins.filter(a => a.status === 'invited').length,
      issue: admins.filter(a => a.status === 'locked' || a.status === 'suspended').length,
    };
  }, [admins]);

  const filteredAdmins = React.useMemo(() => {
    return admins.filter(admin => {
      if (filterStatus !== 'ALL' && admin.status !== filterStatus) return false;
      if (searchQ.trim()) {
        const q = searchQ.toLowerCase();
        if (!admin.name?.toLowerCase().includes(q) && 
            !admin.jobTitle?.toLowerCase().includes(q) && 
            !admin.email?.toLowerCase().includes(q)) return false;
      }
      return true;
    }).sort((a, b) => (a.name || '').localeCompare(b.name || '', 'ko'));
  }, [admins, filterStatus, searchQ]);

  return (
    <div className="space-y-8 animate-fade-in-up">
      {/* KPI 현황 카드 */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: '전체 인력', value: stats.total, color: 'bee-black', icon: 'fa-users' },
          { label: '활성 계정', value: stats.active, color: 'green-600', icon: 'fa-user-check' },
          { label: '초대 대기', value: stats.invited, color: 'blue-500', icon: 'fa-paper-plane' },
          { label: '보안 이슈', value: stats.issue, color: 'red-500', icon: 'fa-shield-red' },
        ].map(kpi => (
          <div key={kpi.label} className="bg-white p-6 rounded-[32px] border border-gray-100 shadow-sm flex items-center justify-between group hover:shadow-lg transition-all">
            <div>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">{kpi.label}</p>
              <h3 className={`text-2xl font-black text-${kpi.color}`}>{kpi.value}</h3>
            </div>
            <div className={`w-12 h-12 rounded-2xl bg-${kpi.color}/5 flex items-center justify-center text-${kpi.color} text-xl group-hover:scale-110 transition-transform`}>
              <i className={`fa-solid ${kpi.icon}`}></i>
            </div>
          </div>
        ))}
      </div>

      {/* 필터 및 검색 바 */}
      <div className="bg-white rounded-[32px] p-6 border border-gray-100 shadow-sm flex flex-col lg:flex-row gap-4">
        <div className="flex-1 relative">
          <i className="fa-solid fa-magnifying-glass absolute left-4 top-1/2 -translate-y-1/2 text-gray-300"></i>
          <input 
            value={searchQ}
            onChange={e => setSearchQ(e.target.value)}
            placeholder="이름, 직책, 이메일로 검색..." 
            title="직원 검색"
            className="w-full bg-gray-50 pl-11 pr-4 py-4 rounded-2xl text-xs font-bold border border-transparent focus:border-bee-black outline-none transition-all"
          />
        </div>
        <div className="flex gap-3 overflow-x-auto no-scrollbar pb-1 lg:pb-0">
          <select 
            value={filterStatus}
            onChange={e => setFilterStatus(e.target.value)}
            title="상태 필터"
            className="bg-gray-50 px-4 py-4 rounded-2xl text-[11px] font-black border border-transparent focus:border-bee-black outline-none min-w-[120px]"
          >
            <option value="ALL">모든 상태</option>
            {Object.entries(HR_STATUS_CONFIG).map(([key, config]) => (
              <option key={key} value={key}>{(config as HRStatusConfig).label}</option>
            ))}
          </select>
          <button 
            onClick={onAdd}
            title="신규 직원 추가 초대"
            className="bg-bee-yellow px-6 py-4 rounded-2xl text-xs font-black whitespace-nowrap shadow-lg shadow-yellow-100 hover:scale-[1.02] active:scale-95 transition-all"
          >
            <i className="fa-solid fa-user-plus mr-2"></i>
            신규 직원 초대
          </button>
        </div>
      </div>

      {/* 직원 그리드 목록 */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredAdmins.length === 0 ? (
          <div className="col-span-full py-32 text-center text-gray-300">
            <i className="fa-solid fa-user-slash text-5xl mb-4 opacity-20"></i>
            <p className="text-sm font-black italic opacity-40">조건에 맞는 직원이 없습니다.</p>
          </div>
        ) : (
          filteredAdmins.map(admin => {
            const statusConfig = (HR_STATUS_CONFIG as Record<string, HRStatusConfig>)[admin.status || 'active'] || HR_STATUS_CONFIG.active;
            const roleConfig = HR_ROLES.find((r: HRRole) => r.id === admin.role) || HR_ROLES[HR_ROLES.length - 1];
            
            return (
              <div 
                key={admin.id}
                onClick={() => onEdit(admin)}
                className="bg-white p-6 rounded-[32px] border border-gray-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all cursor-pointer group relative overflow-hidden"
              >
                {/* 우측 상단 상태 뱃지 */}
                <div className="absolute top-4 right-4 flex gap-2">
                   <div className={`px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-tighter ${statusConfig.color} shadow-sm`}>
                     {statusConfig.label}
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
