import React, { useState, useEffect } from 'react';
import { getAdminAuthProvider, isSupabaseAdminAuthEnabled, loginAdmin, warmAdminAuth } from '../services/adminAuthService';

interface AdminLoginPageProps {
  onLogin: (name: string, jobTitle: string, role: string, email?: string, branchId?: string) => void;
  onCancel: () => void;
}

const AdminLoginPage: React.FC<AdminLoginPageProps> = ({ onLogin, onCancel }) => {
  const [formData, setFormData] = useState({
    name: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const authProvider = getAdminAuthProvider();
  const isSupabaseMode = isSupabaseAdminAuthEnabled();

  // Pre-warm Auth and Functions
  useEffect(() => {
    warmAdminAuth().catch(console.error);

    // 로그인 직후 대시보드 lazy 로딩 대기를 줄이기 위한 사전 워밍업
    void import('./AdminDashboard');
    void import('./BranchAdminPage');
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!formData.name || !formData.password) {
      setError(isSupabaseMode ? '로그인 ID와 비밀번호를 입력해주세요.' : '이름과 비밀번호를 입력해주세요.');
      return;
    }

    setLoading(true);
    try {
      const inputName = formData.name.trim();
      const inputPass = formData.password.trim();

      console.log(`[AdminLogin] 🚀 ${authProvider.toUpperCase()} 로그인 시도: "${inputName}" / 비밀번호: "${inputPass.replace(/./g, '*')}"`);

      const admin = await loginAdmin(inputName, inputPass);

      // [스봉이] 파이버베이스 모드일 때는 UID 매핑이 Firestore 전역에 퍼질 시간이 필요해요.
      // 깍쟁이처럼 여기서 딱 검증하고 보내드릴게요. 💅
      if (admin.provider === 'firebase' || !isSupabaseMode) {
        setLoading(true); // 로딩 메시지 업데이트 유도
        try {
          const { db, auth } = await import('../firebaseApp');
          const { doc, getDoc } = await import('firebase/firestore');
          const uid = auth.currentUser?.uid;

          if (uid) {
            console.log(`[AdminLogin] 🛡️ 권한 전파 대기 중... (UID: ${uid})`);
            let verified = false;
            let attempts = 0;
            while (!verified && attempts < 10) {
              attempts++;
              const adminDoc = await getDoc(doc(db, 'admins', uid));
              if (adminDoc.exists() && adminDoc.data()?.role) {
                console.log(`[AdminLogin] ✅ 권한 전파 확인! (${attempts}회 시도)`);
                verified = true;
              } else {
                await new Promise(r => setTimeout(r, 400));
              }
            }
            if (!verified) console.warn("[AdminLogin] 권한 전파 확인이 늦어지고 있지만, 일단 진입을 시도합니다.");
          }
        } catch (verifErr) {
          console.warn("[AdminLogin] 권한 전파 확인 중 경미한 오류:", verifErr);
        }
      }

      console.log(`[AdminLogin] 🎉 로그인 최종 승인! 어서 오세요, ${admin.name} ${admin.jobTitle}님! (권한: ${admin.role}, provider: ${admin.provider}) 💅`);
      onLogin(admin.name, admin.jobTitle || 'Staff', admin.role, admin.email, admin.branchId);

      void import('../services/auditService')
        .then(({ AuditService }) => AuditService.logAction(
          { id: admin.email || admin.name, name: admin.name, email: admin.email || 'local@fallback' },
          'LOGIN',
          { id: admin.employeeId || admin.name, type: 'ADMIN' },
          { jobTitle: admin.jobTitle || 'Staff', role: admin.role, mode: admin.provider }
        ))
        .catch((auditErr) => {
          console.warn("[AdminLogin] 감사 로그 기록 실패 (데이터 구조 확인 필요):", auditErr);
        });

    } catch (err: any) {
      console.error("Login Error Details:", err);
      const errCode = err.code || "unknown";
      const errMsg = err.message || "Unknown error";

      if (errCode === 'invalid-identifier') {
        setError('로그인 ID 형식이 올바르지 않습니다.');
      } else if (errCode === 'supabase/local-email-login-required') {
        setError('로컬 프리뷰에서는 이메일 형식으로 로그인해 주세요. 로그인ID/지점ID는 Firebase localhost 허용 후에 붙습니다.');
      } else if (errCode === 'unauthenticated' || errCode === 'functions/unauthenticated' || errCode === 'supabase/400' || errCode === 'invalid_credentials') {
        setError(isSupabaseMode ? '로그인 ID 또는 비밀번호가 올바르지 않습니다. 다시 확인해주세요.' : '이름 또는 비밀번호가 올바르지 않습니다. 다시 확인해주세요.');
      } else if (errCode === 'permission-denied' || errCode === 'functions/permission-denied') {
        setError('해당 관리자 계정의 접근 권한이 거부되었습니다.');
      } else if (errCode === 'supabase/missing-employee') {
        setError('Supabase 직원 프로필이 아직 준비되지 않았습니다. 부트스트랩 상태를 확인해주세요.');
      } else if (errCode === 'supabase/missing-auth-email') {
        setError('이 계정은 내부 인증 이메일 연결이 아직 없어요. 인사관리에서 로그인 ID와 이메일을 같이 확인해주세요.');
      } else if (errCode === 'supabase/inactive-admin') {
        setError('비활성화된 관리자 계정입니다. HQ 권한 상태를 확인해주세요.');
      } else if (errCode === 'supabase/firebase-bridge-failed') {
        setError('Firebase 관리자 권한 연결에 실패했어요. 잠시 후 다시 시도해주세요.');
      } else if (errCode === 'auth/unauthorized-domain' || errMsg.includes('referer') || errMsg.includes('requests-from-referer')) {
        setError(`로컬 인증이 막혔어요. [${window.location.origin}] 를 Firebase/GCP 허용 도메인 또는 허용 리퍼러에 추가해 주세요. 급하면 로컬에서는 이메일 로그인으로 먼저 붙으시면 됩니다.`);
      } else if (String(errCode).startsWith('supabase/')) {
        setError(`Supabase 연결 오류 (${errCode})가 발생했습니다. Phase 1 스키마와 Auth 설정을 확인해주세요.`);
      } else {
        setError(`연결 오류 (Code: ${errCode}). 인터넷 연결이나 파이어베이스 설정을 확인해주세요.`);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-bee-black flex items-center justify-center p-6 font-sans relative overflow-hidden">
      {/* Dynamic Background Elements */}
      <div className="absolute top-[-10%] right-[-5%] w-96 h-96 bg-bee-yellow rounded-full blur-[100px] opacity-20 pointer-events-none animate-pulse"></div>
      <div className="absolute bottom-[-10%] left-[-5%] w-80 h-80 bg-bee-yellow rounded-full blur-[80px] opacity-10 pointer-events-none"></div>

      <div className="max-w-md w-full relative z-10">
        <div className="text-center mb-10">
          <div className="w-20 h-20 bg-gradient-to-br from-bee-yellow to-[#E5C100] rounded-[24px] flex items-center justify-center mx-auto mb-8 shadow-2xl shadow-bee-yellow/20 relative group overflow-hidden">
            <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-500 ease-in-out"></div>
            <i className="fa-solid fa-shield-halved text-bee-black text-3xl font-black relative z-10 drop-shadow-sm group-hover:scale-110 transition-transform duration-300"></i>
          </div>
          <div className="flex items-center justify-center gap-1 mb-2 scale-110">
            <span className="text-4xl font-black text-white">bee</span>
            <span className="text-4xl font-black italic text-bee-yellow">liber</span>
          </div>
          <p className="text-bee-yellow font-black uppercase tracking-[0.3em] text-[10px] mt-3 drop-shadow-sm">스마트 여정 관제 포털</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white/5 backdrop-blur-2xl p-10 rounded-[40px] border border-white/10 shadow-2xl space-y-6 hover:shadow-bee-yellow/5 transition-all duration-500">
          {error && (
            <div className="p-5 mb-4 text-xs bg-red-500/10 border border-red-500/20 text-red-500 rounded-2xl text-center font-bold leading-relaxed transition-all duration-300">
              <i className="fa-solid fa-circle-exclamation mb-2 text-lg block"></i>
              {error}
            </div>
          )}
          <div className="space-y-4">
            <div className="group">
              <label className="block text-[10px] font-black text-gray-500 group-focus-within:text-bee-yellow uppercase tracking-widest mb-2 ml-2 transition-colors">
                {isSupabaseMode ? '관리자 로그인 ID' : '관리자 이름'}
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder={isSupabaseMode ? '지점ID / 로그인ID / 이메일' : '관리자 이름'}
                className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 text-white font-bold placeholder-gray-600 focus:outline-none focus:border-bee-yellow focus:bg-white/10 transition-all shadow-inner"
                autoFocus
                autoComplete="username"
              />
            </div>

            <div className="relative group">
              <label className="block text-[10px] font-black text-gray-500 group-focus-within:text-bee-yellow uppercase tracking-widest mb-2 ml-2 transition-colors">비밀번호</label>
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="비밀번호"
                className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 text-white font-black tracking-widest placeholder-gray-600 focus:outline-none focus:border-bee-yellow focus:bg-white/10 transition-all shadow-inner"
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-5 top-[38px] text-gray-500 hover:text-bee-yellow transition-colors"
                title={showPassword ? "비밀번호 숨기기" : "비밀번호 보기"}
              >
                <i className={`fa-solid ${showPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
              </button>
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              className={`w-full bg-bee-yellow text-bee-black font-black hover:bg-[#E5C100] py-5 rounded-2xl shadow-xl shadow-bee-yellow/20 text-lg mb-4 hover:scale-[1.02] active:scale-95 transition-all ${loading ? 'opacity-50 cursor-not-allowed' : 'hover:shadow-bee-yellow/40'}`}
            >
              {loading ? (
                <div className="flex items-center justify-center gap-2">
                  <i className="fa-solid fa-circle-notch animate-spin"></i>
                  <span>{isSupabaseMode ? '관리자 권한을 확인하는 중...' : '로그인 확인 중...'}</span>
                </div>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  안전 로그인 <i className="fa-solid fa-arrow-right"></i>
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={onCancel}
              className="w-full text-gray-500 hover:text-white text-sm font-bold transition-colors mb-4 flex items-center justify-center gap-2"
            >
              <i className="fa-solid fa-house"></i> 메인으로 돌아가기
            </button>
          </div>
        </form>

        <p className="mt-5 text-center text-[10px] font-bold tracking-[0.25em] uppercase text-gray-500">
          {isSupabaseMode ? 'Supabase 관리자 로그인 모드' : 'Firebase 관리자 인증 모드'}
        </p>

        <p className="mt-12 text-center text-[10px] text-gray-600 font-bold uppercase tracking-[0.4em]">
          Beeliber Systems &copy; 2025
        </p>
      </div>
    </div >
  );
};

export default AdminLoginPage;
