import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AdminUser, LocationOption } from '../../../types';
import { HR_ROLES, HR_PERMISSIONS, HR_STATUS_CONFIG, ORG_TYPES, HRStatusConfig, HRRole } from '../../../src/constants/hr';

interface EmployeeDetailPanelProps {
  employee: Partial<AdminUser> | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: Partial<AdminUser>) => void;
  isSaving: boolean;
  locations: LocationOption[];
}

const EmployeeDetailPanel: React.FC<EmployeeDetailPanelProps> = ({
  employee, isOpen, onClose, onSave, isSaving, locations
}) => {
  const [activeSubTab, setActiveSubTab] = React.useState<'BASIC' | 'PERMISSIONS' | 'SECURITY' | 'HISTORY'>('BASIC');
  const [formData, setFormData] = React.useState<Partial<AdminUser>>({});
  const [showPassword, setShowPassword] = React.useState(false);

  React.useEffect(() => {
    if (employee) {
      setFormData({ ...employee });
    } else {
      setFormData({
        status: 'active',
        permissions: [],
        orgType: 'HQ',
        security: {
          failedLoginCount: 0,
          isLocked: false,
          twoFactorEnabled: false
        }
      });
    }
  }, [employee]);

  const togglePermission = (perm: string) => {
    const current = formData.permissions || [];
    if (current.includes(perm)) {
      setFormData({ ...formData, permissions: current.filter(p => p !== perm) });
    } else {
      setFormData({ ...formData, permissions: [...current, perm] });
    }
  };

  const handleSave = () => {
    onSave(formData);
  };

  const syncSummary = React.useMemo(() => {
    if (formData.syncStatus?.status === 'error') {
      return {
        label: 'Supabase 동기화 실패',
        tone: 'bg-red-50 border-red-100 text-red-700',
        detail: formData.syncStatus.lastError || '로그인 계정 동기화 중 오류가 발생했습니다. 값을 확인하고 다시 저장해 주세요.',
      };
    }

    if (formData.syncStatus?.status === 'synced' && formData.syncStatus.profileId && formData.syncStatus.employeeId) {
      return {
        label: formData.syncStatus.syntheticEmail ? 'Supabase 연동 완료 (임시 이메일)' : 'Supabase 연동 완료',
        tone: 'bg-emerald-50 border-emerald-100 text-emerald-700',
        detail: `Auth ${formData.syncStatus.authEmail || formData.email || '미설정'} / 직원ID ${formData.syncStatus.employeeId}`,
      };
    }

    if (formData.email || formData.loginId) {
      return {
        label: '저장 후 Supabase 동기화 예정',
        tone: 'bg-amber-50 border-amber-100 text-amber-700',
        detail: '지금 저장하면 로그인 계정과 직원 테이블을 같이 맞춥니다.',
      };
    }

    return {
      label: '로그인 연동 정보 미설정',
      tone: 'bg-gray-50 border-gray-200 text-gray-500',
      detail: '로그인 ID 또는 내부 인증 이메일이 없으면 명부 전용 상태로 남습니다.',
    };
  }, [formData]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* 배경 오버레이 */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[999]"
          />

          {/* 패널 본체 */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed top-0 right-0 h-full w-full max-w-[500px] bg-white shadow-2xl z-[1000] flex flex-col overflow-hidden rounded-l-[40px]"
          >
            {/* 헤더 */}
            <div className="p-8 border-b border-gray-50 flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-black text-bee-black">
                  {employee?.id ? '직원 정보 수정' : '신규 직원 초대'}
                </h2>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">인사 관리 시스템</p>
              </div>
              <button 
                onClick={onClose} 
                title="패널 닫기"
                className="w-12 h-12 rounded-2xl bg-gray-50 text-gray-400 hover:bg-bee-black hover:text-white transition-all flex items-center justify-center shadow-sm"
              >
                <i className="fa-solid fa-xmark text-lg"></i>
              </button>
            </div>

            {/* 서브 탭 */}
            <div className="flex border-b border-gray-50 bg-gray-50/30">
              {[
                { id: 'BASIC', label: '기본 정보' },
                { id: 'PERMISSIONS', label: '역할/권한' },
                { id: 'SECURITY', label: '보안 상태' },
                { id: 'HISTORY', label: '활동 로그' },
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveSubTab(tab.id as any)}
                  title={`${tab.label} 상세보기`}
                  className={`flex-1 py-4 text-[11px] font-black transition-all ${activeSubTab === tab.id ? 'text-bee-black border-b-2 border-bee-black bg-white' : 'text-gray-300 hover:text-gray-500'}`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* 컨텐츠 영역 */}
            <div className="flex-1 overflow-y-auto p-8 space-y-8 no-scrollbar">
              {activeSubTab === 'BASIC' && (
                <div className="space-y-6 animate-fade-in">
                  <div className={`rounded-[24px] border px-5 py-4 ${syncSummary.tone}`}>
                    <div className="flex items-center gap-2 text-[11px] font-black">
                      <i className="fa-solid fa-link"></i>
                      <span>{syncSummary.label}</span>
                    </div>
                    <p className="mt-2 text-[10px] font-bold leading-relaxed opacity-90">
                      {syncSummary.detail}
                    </p>
                    {formData.syncStatus?.syncedAt && (
                      <p className="mt-2 text-[10px] font-bold opacity-70">
                        최근 동기화: {formData.syncStatus.syncedAt}
                      </p>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-gray-400 ml-1">성명</label>
                      <input 
                        value={formData.name || ''} 
                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                        className="w-full bg-gray-50 p-4 rounded-2xl text-xs font-bold border border-transparent focus:border-bee-black outline-none transition-all" 
                        placeholder="이름 입력"
                        title="직원 성명 입력"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-gray-400 ml-1">직책</label>
                      <input 
                        value={formData.jobTitle || ''} 
                        onChange={e => setFormData({ ...formData, jobTitle: e.target.value })}
                        className="w-full bg-gray-50 p-4 rounded-2xl text-xs font-bold border border-transparent focus:border-bee-black outline-none transition-all" 
                        placeholder="매니저 / 사원 등"
                        title="직책 입력"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-gray-400 ml-1">로그인 ID</label>
                      <input 
                        value={formData.loginId || ''} 
                        onChange={e => setFormData({ ...formData, loginId: e.target.value })}
                        className="w-full bg-gray-50 p-4 rounded-2xl text-xs font-bold border border-transparent focus:border-bee-black outline-none transition-all" 
                        placeholder={formData.branchId ? `${formData.branchId}` : '직접 입력'}
                        title="로그인 ID 입력"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-gray-400 ml-1">내부 인증 이메일</label>
                      <input 
                        value={formData.email || ''} 
                        onChange={e => setFormData({ ...formData, email: e.target.value })}
                        className="w-full bg-gray-50 p-4 rounded-2xl text-xs font-bold border border-transparent focus:border-bee-black outline-none transition-all" 
                        placeholder="example@bee-liber.com"
                        title="내부 인증 이메일 입력"
                      />
                    </div>
                  </div>

                  <div className="rounded-2xl bg-gray-50 px-4 py-3 text-[10px] font-bold text-gray-500 leading-relaxed">
                    지점 계정은 로그인 ID를 지점 ID로 쓰면 되고요. 본사/슈퍼관리자는 직접 원하는 로그인 ID를 넣으면 됩니다. 이메일은 내부 인증 연결용으로만 씁니다, 아시겠어요?
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-gray-400 ml-1">기관 분류</label>
                      <select 
                        value={formData.orgType || 'HQ'} 
                        onChange={e => setFormData({ ...formData, orgType: e.target.value as any })}
                        title="기관 분류 선택"
                        className="w-full bg-gray-50 p-4 rounded-2xl text-xs font-bold border border-transparent focus:border-bee-black outline-none"
                      >
                        {ORG_TYPES.map(org => <option key={org.id} value={org.id}>{org.label}</option>)}
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-gray-400 ml-1">소속 지점</label>
                      <select 
                        value={formData.branchId || ''} 
                        onChange={e => setFormData({ ...formData, branchId: e.target.value })}
                        title="소속 지점 선택"
                        className="w-full bg-gray-50 p-4 rounded-2xl text-xs font-bold border border-transparent focus:border-bee-black outline-none"
                      >
                        <option value="">본사 (HQ)</option>
                        {locations.filter(l => l.isActive).map(loc => <option key={loc.id} value={loc.id}>{loc.name}</option>)}
                      </select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 ml-1">계정 상태</label>
                    <div className="flex flex-wrap gap-2">
                      {Object.entries(HR_STATUS_CONFIG).map(([key, config]) => (
                        <button
                          key={key}
                          type="button"
                          onClick={() => setFormData({ ...formData, status: key as any })}
                          title={`${(config as HRStatusConfig).label} 상태로 변경`}
                          className={`px-4 py-2 rounded-xl text-[10px] font-black flex items-center gap-2 transition-all border ${formData.status === key ? 'bg-bee-black text-white border-bee-black shadow-lg scale-105' : 'bg-white text-gray-400 border-gray-100 hover:border-gray-300'}`}
                        >
                          <i className={`fa-solid ${(config as HRStatusConfig).icon}`}></i>
                          {(config as HRStatusConfig).label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {activeSubTab === 'PERMISSIONS' && (
                <div className="space-y-6 animate-fade-in">
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-gray-400 ml-1">시스템 권한 역할 (Primary Role)</label>
                    <div className="grid grid-cols-2 gap-2">
                      {HR_ROLES.map(role => (
                        <button
                          key={role.id}
                          type="button"
                          onClick={() => setFormData({ ...formData, role: role.id as any })}
                          title={`${role.label} 부여`}
                          className={`p-4 rounded-2xl border text-left transition-all ${formData.role === role.id ? 'border-bee-black bg-bee-black text-bee-yellow shadow-lg shadow-bee-black/10' : 'border-gray-100 bg-white text-gray-400 hover:border-gray-300'}`}
                        >
                          <p className="text-[11px] font-black">{role.label}</p>
                          <p className={`text-[8px] font-bold ${formData.role === role.id ? 'text-bee-yellow/60' : 'text-gray-300'}`}>{role.desc}</p>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-gray-400 ml-1">세부 접근 제어 (ACL)</label>
                    <div className="bg-gray-50 p-5 rounded-3xl grid grid-cols-1 gap-4">
                      {Object.entries(HR_PERMISSIONS).map(([key, val]) => (
                        <div key={key} className="flex items-center justify-between">
                          <span className="text-[10px] font-black text-bee-black uppercase tracking-tighter">{key.replace(/_/g, ' ')}</span>
                          <button 
                            type="button"
                            onClick={() => togglePermission(val)}
                            title={`${key} 권한 전환`}
                            className={`w-12 h-6 rounded-full transition-all relative ${formData.permissions?.includes(val) ? 'bg-bee-black' : 'bg-gray-200'}`}
                          >
                            <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${formData.permissions?.includes(val) ? 'left-7' : 'left-1'}`} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {activeSubTab === 'SECURITY' && (
                <div className="space-y-6 animate-fade-in">
                  <div className="bg-bee-black p-6 rounded-[32px] text-white">
                    <div className="flex items-center gap-3 mb-6">
                      <i className="fa-solid fa-shield-halved text-bee-yellow text-xl"></i>
                      <h4 className="text-sm font-black italic">Security Checkup</h4>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-white/10 p-4 rounded-2xl">
                        <p className="text-[9px] font-bold text-gray-400 uppercase mb-1">Last Login</p>
                        <p className="text-xs font-black">{formData.security?.lastLoginAt || '기록 없음'}</p>
                      </div>
                      <div className="bg-white/10 p-4 rounded-2xl">
                        <p className="text-[9px] font-bold text-gray-400 uppercase mb-1">MFA Status</p>
                        <p className={`text-xs font-black ${formData.security?.twoFactorEnabled ? 'text-green-400' : 'text-orange-400'}`}>
                          {formData.security?.twoFactorEnabled ? '활성화' : '미사용'}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 ml-1">비밀번호 재설정</label>
                    <div className="relative">
                      <input 
                        type={showPassword ? 'text' : 'password'}
                        value={formData.password || ''} 
                        onChange={e => setFormData({ ...formData, password: e.target.value })}
                        className="w-full bg-gray-50 p-4 rounded-2xl text-xs font-bold border border-transparent focus:border-bee-black outline-none transition-all tracking-widest" 
                        placeholder="••••••••"
                        title="신규 비밀번호 입력"
                      />
                      <button 
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        title="비밀번호 표시/숨기기"
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-300 hover:text-bee-black transition-all"
                      >
                        <i className={`fa-solid ${showPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                      </button>
                    </div>
                  </div>

                  {formData.security?.isLocked && (
                    <div className="bg-red-50 p-6 rounded-[32px] border border-red-100 flex items-center justify-between">
                      <div className="flex items-center gap-3 text-red-600">
                        <i className="fa-solid fa-triangle-exclamation"></i>
                        <span className="text-xs font-black">계정이 잠겨있습니다.</span>
                      </div>
                      <button 
                        type="button"
                        onClick={() => setFormData({ ...formData, security: { ...formData.security, isLocked: false, failedLoginCount: 0 } as any })}
                        title="계정 잠금 즉시 해제"
                        className="px-4 py-2 bg-red-600 text-white rounded-xl text-[10px] font-black hover:bg-red-700 transition-all"
                      >
                        잠금 해제
                      </button>
                    </div>
                  )}
                </div>
              )}

              {activeSubTab === 'HISTORY' && (
                <div className="flex flex-col items-center justify-center py-20 opacity-20 animate-fade-in">
                  <i className="fa-solid fa-clock-rotate-left text-5xl mb-4"></i>
                  <p className="text-xs font-black italic">활동 로그 데이터를 불러오는 중입니다...</p>
                </div>
              )}
            </div>

            {/* 푸터 버튼 */}
            <div className="p-8 bg-gray-50 border-t border-gray-100 flex gap-4">
              <button 
                onClick={onClose} 
                title="등록 및 수정 취소"
                className="flex-1 py-4 rounded-2xl bg-white border border-gray-100 text-[11px] font-black text-gray-400 hover:text-bee-black transition-all"
              >
                닫기
              </button>
              <button 
                onClick={handleSave} 
                disabled={isSaving}
                title="입력한 직원 정보 저장"
                className="flex-[2] py-4 rounded-2xl bg-bee-yellow text-bee-black shadow-lg shadow-yellow-100 text-[11px] font-black hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2"
              >
                {isSaving && <i className="fa-solid fa-circle-notch animate-spin"></i>}
                {employee?.id ? '정보 업데이트' : '신규 직원 초대하기'}
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default EmployeeDetailPanel;
