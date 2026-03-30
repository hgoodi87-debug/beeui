import React, { useState, useCallback } from 'react';
import { HR_ROLES, HRRole, HR_PERMISSIONS } from '../../../src/constants/hr';

const PERMISSION_GROUPS = [
  { group: '예약', items: [
    { key: HR_PERMISSIONS.BOOKING_VIEW, label: '예약 조회' },
    { key: HR_PERMISSIONS.BOOKING_EDIT, label: '예약 수정' },
    { key: HR_PERMISSIONS.BOOKING_CANCEL, label: '예약 취소' },
    { key: HR_PERMISSIONS.BOOKING_MANUAL, label: '수동 예약' },
  ]},
  { group: '정산', items: [
    { key: HR_PERMISSIONS.SETTLEMENT_VIEW, label: '정산 조회' },
    { key: HR_PERMISSIONS.SETTLEMENT_CLOSE, label: '정산 마감' },
    { key: HR_PERMISSIONS.SETTLEMENT_ADJUST, label: '정산 조정' },
    { key: HR_PERMISSIONS.SETTLEMENT_MONTHLY, label: '월 정산' },
  ]},
  { group: '인사/보안', items: [
    { key: HR_PERMISSIONS.HR_VIEW, label: '인사 조회' },
    { key: HR_PERMISSIONS.HR_EDIT, label: '인사 수정' },
    { key: HR_PERMISSIONS.HR_ROLE_ASSIGN, label: '역할 배정' },
    { key: HR_PERMISSIONS.HR_AUDIT_LOG, label: '감사 로그' },
  ]},
  { group: '시스템', items: [
    { key: HR_PERMISSIONS.LOCATION_EDIT, label: '지점 편집' },
    { key: HR_PERMISSIONS.SYSTEM_CONFIG, label: '시스템 설정' },
  ]},
];

const DEFAULT_ROLE_PERMISSIONS: Record<string, string[]> = {
  super: Object.values(HR_PERMISSIONS),
  hq: Object.values(HR_PERMISSIONS).filter(p => p !== HR_PERMISSIONS.SYSTEM_CONFIG),
  branch: [HR_PERMISSIONS.BOOKING_VIEW, HR_PERMISSIONS.BOOKING_EDIT, HR_PERMISSIONS.BOOKING_CANCEL, HR_PERMISSIONS.SETTLEMENT_VIEW, HR_PERMISSIONS.HR_VIEW],
  finance: [HR_PERMISSIONS.BOOKING_VIEW, HR_PERMISSIONS.SETTLEMENT_VIEW, HR_PERMISSIONS.SETTLEMENT_CLOSE, HR_PERMISSIONS.SETTLEMENT_ADJUST, HR_PERMISSIONS.SETTLEMENT_MONTHLY],
  cs: [HR_PERMISSIONS.BOOKING_VIEW, HR_PERMISSIONS.BOOKING_EDIT, HR_PERMISSIONS.BOOKING_CANCEL, HR_PERMISSIONS.BOOKING_MANUAL],
  partner: [HR_PERMISSIONS.BOOKING_VIEW, HR_PERMISSIONS.SETTLEMENT_VIEW],
  driver: [HR_PERMISSIONS.BOOKING_VIEW],
  staff: [HR_PERMISSIONS.BOOKING_VIEW, HR_PERMISSIONS.BOOKING_EDIT],
};

const RoleManagementTab: React.FC = () => {
  const [editingRole, setEditingRole] = useState<string | null>(null);
  const [rolePermissions, setRolePermissions] = useState<Record<string, string[]>>(DEFAULT_ROLE_PERMISSIONS);

  const togglePermission = useCallback((roleId: string, permKey: string) => {
    setRolePermissions(prev => {
      const current = prev[roleId] || [];
      const next = current.includes(permKey)
        ? current.filter(p => p !== permKey)
        : [...current, permKey];
      return { ...prev, [roleId]: next };
    });
  }, []);

  const handleSave = useCallback((roleId: string) => {
    setEditingRole(null);
    alert(`${roleId} 역할 권한이 저장되었습니다.`);
  }, []);

  return (
    <div className="space-y-8 animate-fade-in-up">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-black text-bee-black mb-1">역할 및 권한 템플릿</h2>
          <p className="text-xs font-bold text-gray-400 italic">시스템 접근 수준을 정의하는 마스터 템플릿입니다.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {HR_ROLES.map((role: HRRole) => {
          const isEditing = editingRole === role.id;
          const perms = rolePermissions[role.id] || [];

          return (
            <div key={role.id} className={`bg-white p-8 rounded-[40px] border shadow-sm hover:shadow-xl transition-all group ${isEditing ? 'border-bee-yellow ring-2 ring-bee-yellow/20' : 'border-gray-100'}`}>
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-2xl bg-${role.color}/5 flex items-center justify-center text-${role.color} text-xl`}>
                    <i className="fa-solid fa-shield-halved"></i>
                  </div>
                  <div>
                    <h3 className="font-black text-lg text-bee-black">{role.label}</h3>
                    <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">{role.id}</span>
                  </div>
                </div>
                {isEditing ? (
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setEditingRole(null)}
                      className="w-10 h-10 rounded-xl bg-gray-50 text-gray-400 hover:bg-gray-100 transition-all flex items-center justify-center"
                    >
                      <i className="fa-solid fa-xmark text-xs"></i>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSave(role.id)}
                      className="w-10 h-10 rounded-xl bg-bee-yellow text-bee-black hover:bg-bee-black hover:text-bee-yellow transition-all flex items-center justify-center shadow-lg"
                    >
                      <i className="fa-solid fa-check text-xs"></i>
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setEditingRole(role.id)}
                    title={`${role.label} 템플릿 수정`}
                    className="w-10 h-10 rounded-xl bg-gray-50 text-gray-400 hover:bg-bee-black hover:text-bee-yellow transition-all flex items-center justify-center shadow-sm"
                  >
                    <i className="fa-solid fa-pen-nib text-xs"></i>
                  </button>
                )}
              </div>

              <p className="text-[11px] font-bold text-gray-500 leading-relaxed mb-6">
                {role.desc}
              </p>

              {isEditing ? (
                <div className="space-y-4">
                  {PERMISSION_GROUPS.map(group => (
                    <div key={group.group}>
                      <h4 className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-2">{group.group}</h4>
                      <div className="flex flex-wrap gap-2">
                        {group.items.map(item => {
                          const active = perms.includes(item.key);
                          return (
                            <button
                              key={item.key}
                              type="button"
                              onClick={() => togglePermission(role.id, item.key)}
                              className={`px-3 py-1.5 rounded-lg text-[9px] font-black border transition-all ${
                                active
                                  ? 'bg-bee-yellow/10 text-bee-black border-bee-yellow/30'
                                  : 'bg-gray-50 text-gray-300 border-gray-100 hover:border-gray-300'
                              }`}
                            >
                              <i className={`fa-solid ${active ? 'fa-check mr-1' : 'fa-plus mr-1'}`}></i>
                              {item.label}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-3">
                  <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-tighter">권한 프리셋 ({perms.length}개)</h4>
                  <div className="flex flex-wrap gap-2">
                    {perms.slice(0, 4).map(p => (
                      <span key={p} className="px-2 py-1 bg-gray-50 text-gray-400 rounded-lg text-[9px] font-black border border-gray-100 leading-none">
                        {p}
                      </span>
                    ))}
                    {perms.length > 4 && (
                      <span className="px-2 py-1 bg-bee-yellow/10 text-bee-yellow rounded-lg text-[9px] font-black border border-bee-yellow/20 leading-none">
                        + {perms.length - 4}개 더
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}

        <div
          onClick={() => alert('역할 추가 기능은 준비 중입니다.')}
          title="새로운 시스템 역할 정의 추가"
          className="bg-gray-50 p-8 rounded-[40px] border-2 border-dashed border-gray-200 flex flex-col items-center justify-center text-gray-400 hover:border-bee-black hover:text-bee-black transition-all cursor-pointer group"
        >
          <div className="w-14 h-14 rounded-full border-2 border-dashed border-gray-200 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
            <i className="fa-solid fa-plus text-xl"></i>
          </div>
          <p className="text-xs font-black italic">새로운 역할 정의 추가</p>
        </div>
      </div>
    </div>
  );
};

export default RoleManagementTab;
