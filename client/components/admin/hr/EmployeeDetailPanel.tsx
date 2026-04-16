import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AdminUser, LocationOption } from '../../../types';
import { HR_ROLES, HR_PERMISSIONS, HR_STATUS_CONFIG, ORG_TYPES, HRStatusConfig, HRRole } from '../../../src/constants/hr';
import { supabaseGet } from '../../../services/supabaseClient';
import { resetEmployeePassword } from '../../../services/kioskDb';
import { getActiveAdminAccessToken } from '../../../services/adminAuthService';

type SyncCheckItem = {
  label: string;
  value: string;
  ok: boolean | null; // null = 확인불가
};

type SyncCheckState = {
  loading: boolean;
  items: SyncCheckItem[];
  canLogin: boolean | null;
  checkedAt: string;
} | null;

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
  const [syncCheck, setSyncCheck] = React.useState<SyncCheckState>(null);
  const [pwResetState, setPwResetState] = React.useState<'idle' | 'loading' | 'ok' | 'error'>('idle');
  const [pwResetError, setPwResetError] = React.useState('');
  const isCreatingEmployee = !employee?.id;

  const handleCheckSync = React.useCallback(async (data: Partial<AdminUser>) => {
    setSyncCheck({ loading: true, items: [], canLogin: null, checkedAt: '' });
    const items: SyncCheckItem[] = [];

    // 1. employees 레코드 확인
    if (data.employeeId) {
      try {
        const rows = await supabaseGet<Array<{ id: string; login_id?: string; email?: string; employment_status?: string }>>(
          `employees?select=id,login_id,email,employment_status&id=eq.${encodeURIComponent(data.employeeId)}&limit=1`
        );
        const row = rows[0];
        items.push({
          label: '직원 레코드',
          value: row ? `${row.employment_status || 'active'}` : '없음',
          ok: !!row,
        });
      } catch {
        items.push({ label: '직원 레코드', value: '조회 실패', ok: null });
      }
    } else {
      items.push({ label: '직원 레코드', value: 'ID 없음 — 미등록', ok: false });
    }

    // 2. profiles (Auth 연결) 확인
    if (data.profileId) {
      try {
        const rows = await supabaseGet<Array<{ id: string; email?: string }>>(
          `profiles?select=id,email&id=eq.${encodeURIComponent(data.profileId)}&limit=1`
        );
        const row = rows[0];
        items.push({
          label: 'Auth 프로필',
          value: row ? (row.email || '(이메일 없음)') : '없음',
          ok: !!row,
        });
      } catch {
        items.push({ label: 'Auth 프로필', value: '조회 실패', ok: null });
      }
    } else {
      items.push({ label: 'Auth 프로필', value: '연결 없음 — 로그인 불가', ok: false });
    }

    // 3. 로그인 ID 해석 확인 (RPC)
    const loginId = data.loginId || data.email || '';
    if (loginId) {
      try {
        const { getSupabaseConfig } = await import('../../../services/supabaseRuntime');
        const { url, anonKey } = getSupabaseConfig();
        const res = await fetch(`${url}/rest/v1/rpc/resolve_admin_login_email`, {
          method: 'POST',
          headers: {
            apikey: anonKey,
            Authorization: `Bearer ${anonKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ p_identifier: loginId }),
        });
        const resolved: string | null = await res.json();
        items.push({
          label: '로그인 ID 해석',
          value: resolved ? `"${loginId}" → ${resolved}` : `"${loginId}" → 해석 불가`,
          ok: !!resolved,
        });
      } catch {
        items.push({ label: '로그인 ID 해석', value: '확인 실패', ok: null });
      }
    } else {
      items.push({ label: '로그인 ID 해석', value: 'loginId 미설정', ok: false });
    }

    const canLogin = items.every(i => i.ok === true);
    setSyncCheck({
      loading: false,
      items,
      canLogin,
      checkedAt: new Date().toLocaleTimeString('ko-KR'),
    });
  }, []);

  React.useEffect(() => {
    setActiveSubTab('BASIC');
    setShowPassword(false);
    setSyncCheck(null);
    setPwResetState('idle');
    setPwResetError('');
    if (employee) {
      setFormData({ ...employee });
      // 기존 직원이면 패널 열릴 때 바로 연동 상태 확인
      if (employee.id) {
        handleCheckSync(employee);
      }
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
  }, [employee, handleCheckSync]);

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

  const handleResetPassword = async () => {
    const profileId = formData.profileId;
    const newPassword = formData.password?.trim() || '';
    if (!profileId) {
      setPwResetError('Supabase 계정이 아직 연동되지 않았습니다. 먼저 저장하여 계정을 생성해주세요.');
      setPwResetState('error');
      return;
    }
    if (newPassword.length < 6) {
      setPwResetError('비밀번호는 최소 6자 이상이어야 합니다.');
      setPwResetState('error');
      return;
    }
    setPwResetState('loading');
    setPwResetError('');
    try {
      const token = getActiveAdminAccessToken();
      await resetEmployeePassword(profileId, newPassword, token || undefined);
      setPwResetState('ok');
      setFormData({ ...formData, password: '' });
    } catch (e) {
      setPwResetError(e instanceof Error ? e.message : '비밀번호 변경 실패');
      setPwResetState('error');
    }
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

  const selectedBranchLocationId = React.useMemo(() => {
    if (!formData.branchId && !formData.branchCode) return '';

    // shortCode(id) 직접 매칭 OR Supabase UUID(supabaseId) 매칭
    const directMatch = locations.find((location) =>
      location.id === formData.branchId ||
      (location.supabaseId && location.supabaseId === formData.branchId)
    );
    if (directMatch) return directMatch.id;

    const branchToken = String(formData.branchCode || formData.branchId || '').trim().toLowerCase();
    if (!branchToken) return '';

    return locations.find((location) =>
      String(location.branchCode || '').trim().toLowerCase() === branchToken
      || String(location.shortCode || '').trim().toLowerCase() === branchToken
    )?.id || '';
  }, [formData.branchCode, formData.branchId, locations]);

  const selectableLocations = React.useMemo(() => {
    return [...locations].sort((a, b) => {
      const aInactive = a.isActive === false ? 1 : 0;
      const bInactive = b.isActive === false ? 1 : 0;
      if (aInactive !== bInactive) return aInactive - bInactive;
      return (a.name || '').localeCompare(b.name || '', 'ko');
    });
  }, [locations]);

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
                  {/* 실시간 연동 상태 확인 */}
                  <div className={`rounded-[24px] border px-5 py-4 ${
                    syncCheck?.loading ? 'bg-gray-50 border-gray-200' :
                    syncCheck ? (syncCheck.canLogin ? 'bg-emerald-50 border-emerald-100' : 'bg-red-50 border-red-100') :
                    syncSummary.tone
                  }`}>
                    <div className="flex items-center justify-between">
                      <div className={`flex items-center gap-2 text-[11px] font-black ${
                        syncCheck?.loading ? 'text-gray-500' :
                        syncCheck ? (syncCheck.canLogin ? 'text-emerald-700' : 'text-red-700') :
                        ''
                      }`}>
                        {syncCheck?.loading ? (
                          <><i className="fa-solid fa-circle-notch animate-spin"></i><span>연동 상태 확인 중...</span></>
                        ) : syncCheck ? (
                          <><i className={`fa-solid ${syncCheck.canLogin ? 'fa-circle-check' : 'fa-circle-xmark'}`}></i>
                          <span>{syncCheck.canLogin ? '로그인 연동 정상' : '연동 문제 발견'}</span></>
                        ) : (
                          <><i className="fa-solid fa-link"></i><span>{syncSummary.label}</span></>
                        )}
                      </div>
                      {!isCreatingEmployee && (
                        <button
                          type="button"
                          onClick={() => handleCheckSync(formData)}
                          disabled={syncCheck?.loading}
                          title="Supabase 연동 상태 실시간 재확인"
                          className="text-[10px] font-black px-3 py-1.5 rounded-xl bg-white/60 hover:bg-white transition-all disabled:opacity-40"
                        >
                          <i className="fa-solid fa-rotate-right mr-1"></i>재확인
                        </button>
                      )}
                    </div>

                    {/* 체크 결과 목록 */}
                    {syncCheck && !syncCheck.loading && (
                      <div className="mt-3 space-y-2">
                        {syncCheck.items.map((item, idx) => (
                          <div key={idx} className="flex items-center justify-between text-[10px] font-bold">
                            <span className={`flex items-center gap-1.5 ${
                              item.ok === true ? 'text-emerald-700' :
                              item.ok === false ? 'text-red-600' : 'text-gray-400'
                            }`}>
                              <i className={`fa-solid fa-sm ${
                                item.ok === true ? 'fa-check' :
                                item.ok === false ? 'fa-xmark' : 'fa-minus'
                              }`}></i>
                              {item.label}
                            </span>
                            <span className="text-gray-500 max-w-[55%] text-right truncate">{item.value}</span>
                          </div>
                        ))}
                        <p className="text-[9px] font-bold text-gray-400 pt-1">
                          확인 시각: {syncCheck.checkedAt}
                        </p>
                      </div>
                    )}

                    {/* 미확인 시 기존 요약 */}
                    {!syncCheck && (
                      <p className="mt-2 text-[10px] font-bold leading-relaxed opacity-90">
                        {syncSummary.detail}
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
                        placeholder={formData.branchCode || formData.branchId || '직접 입력'}
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

                  {isCreatingEmployee && (
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-gray-400 ml-1">초기 비밀번호</label>
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
                      <p className="text-[10px] font-bold text-gray-400 leading-relaxed">
                        신규 직원 초대는 초기 비밀번호가 꼭 필요합니다. 이제 기본 정보 탭에서 바로 같이 설정할 수 있어요.
                      </p>
                    </div>
                  )}

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
                        value={selectedBranchLocationId} 
                        onChange={e => {
                          const nextLocation = locations.find((location) => location.id === e.target.value);
                          setFormData({
                            ...formData,
                            branchId: nextLocation?.id || '',
                            branchCode: nextLocation?.branchCode || nextLocation?.shortCode || '',
                          });
                        }}
                        title="소속 지점 선택"
                        className="w-full bg-gray-50 p-4 rounded-2xl text-xs font-bold border border-transparent focus:border-bee-black outline-none"
                      >
                        <option value="">본사 (HQ)</option>
                        {selectableLocations.map(loc => (
                          <option key={loc.id} value={loc.id}>
                            {loc.name}{loc.isActive === false ? ' (비활성)' : ''}
                          </option>
                        ))}
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
                        onChange={e => {
                          setFormData({ ...formData, password: e.target.value });
                          if (pwResetState !== 'idle') { setPwResetState('idle'); setPwResetError(''); }
                        }}
                        className="w-full bg-gray-50 p-4 pr-24 rounded-2xl text-xs font-bold border border-transparent focus:border-bee-black outline-none transition-all tracking-widest"
                        placeholder="새 비밀번호 (6자 이상)"
                        title="새 비밀번호 입력"
                      />
                      <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          title="비밀번호 표시/숨기기"
                          className="p-2 text-gray-300 hover:text-bee-black transition-all"
                        >
                          <i className={`fa-solid ${showPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                        </button>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={handleResetPassword}
                      disabled={pwResetState === 'loading' || !formData.password?.trim()}
                      className="w-full py-3 rounded-2xl text-xs font-black transition-all disabled:opacity-40 disabled:cursor-not-allowed bg-bee-black text-white hover:bg-gray-800 active:scale-95"
                    >
                      {pwResetState === 'loading' ? (
                        <span><i className="fa-solid fa-spinner fa-spin mr-2"></i>변경 중...</span>
                      ) : pwResetState === 'ok' ? (
                        <span><i className="fa-solid fa-check mr-2 text-green-400"></i>비밀번호 변경 완료</span>
                      ) : (
                        <span><i className="fa-solid fa-key mr-2"></i>지금 비밀번호 재설정</span>
                      )}
                    </button>
                    {pwResetState === 'error' && pwResetError && (
                      <p className="text-[10px] font-bold text-red-500 ml-1">{pwResetError}</p>
                    )}
                    {pwResetState === 'ok' && (
                      <p className="text-[10px] font-bold text-emerald-600 ml-1">비밀번호가 성공적으로 변경됐어요. 직원에게 새 비밀번호를 알려주세요.</p>
                    )}
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
