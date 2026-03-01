
import React, { useState, useEffect } from 'react';
import { AdminUser } from '../types';
import { StorageService } from '../services/storageService';
import { app, ensureAuth } from '../firebaseApp';

interface AdminLoginPageProps {
  onLogin: (name: string, jobTitle: string, branchId?: string) => void;
  onCancel: () => void;
}

// Initial Admin Data with Job Title
const INITIAL_ADMINS: AdminUser[] = [
  { id: 'admin-001', name: '천명', jobTitle: 'CEO', password: '8684', createdAt: new Date().toISOString() },
  { id: 'admin-002', name: '매니저', jobTitle: 'General Manager', password: '1234', createdAt: new Date().toISOString() },
  { id: 'admin-003', name: '스태프', jobTitle: 'Staff', password: '0000', createdAt: new Date().toISOString() },
  { id: 'admin-004', name: '진호', jobTitle: 'Master', password: '4608', createdAt: new Date().toISOString() }
];

const AdminLoginPage: React.FC<AdminLoginPageProps> = ({ onLogin, onCancel }) => {
  const [formData, setFormData] = useState({
    name: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  // Remove insecure local storage seeding 💅
  useEffect(() => {
    localStorage.removeItem('beeliber_admins');
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
      setError('이름과 비밀번호를 입력해주세요.');
      return;
    }

    setLoading(true);
    try {
      // 1. Ensure Auth Context is ready (Anonymous sign-in) 💅
      await ensureAuth();

      // 2. Call secure backend verification 🛡️
      const { httpsCallable } = await import('firebase/functions');
      const { functions } = await import('../firebaseApp');
      const verifyAdmin = httpsCallable(functions, 'verifyAdmin');

      const result = await verifyAdmin({
        name: formData.name,
        password: formData.password
      });

      const admin: any = result.data;
      if (admin) {
        onLogin(admin.name, admin.jobTitle || 'Staff', admin.branchId);
      } else {
        setError('로그인 정보가 올바르지 않습니다.');
      }

    } catch (err: any) {
      console.error("Login Error:", err);
      if (err.code === 'unauthenticated') {
        setError('이름 또는 비밀번호가 올바르지 않습니다.');
      } else if (err.code === 'permission-denied') {
        setError('데이터 접근 권한이 없습니다.');
      } else {
        setError('시스템 점검 중입니다. 잠시 후 다시 시도해주세요.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-bee-black flex items-center justify-center p-6 font-sans relative overflow-hidden">
      {/* Dynamic Background Elements */}
      <div className="absolute top-[-10%] right-[-5%] w-96 h-96 bg-bee-yellow rounded-full blur-[150px] opacity-20 pointer-events-none animate-pulse-slow"></div>
      <div className="absolute bottom-[-10%] left-[-5%] w-80 h-80 bg-bee-yellow rounded-full blur-[120px] opacity-10 pointer-events-none"></div>

      <div className="max-w-md w-full animate-fade-in relative z-10">
        <div className="text-center mb-10">
          <div className="w-20 h-20 bg-gradient-to-br from-bee-yellow to-[#E5C100] rounded-[24px] flex items-center justify-center mx-auto mb-8 shadow-2xl shadow-bee-yellow/20 relative group overflow-hidden">
            <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-500 ease-in-out"></div>
            <i className="fa-solid fa-shield-halved text-bee-black text-3xl font-black relative z-10 drop-shadow-sm group-hover:scale-110 transition-transform duration-300"></i>
          </div>
          <div className="flex items-center justify-center gap-1 mb-2 scale-110">
            <span className="text-4xl font-black italic text-bee-yellow">bee</span>
            <span className="text-4xl font-black text-white">liber</span>
          </div>
          <p className="text-bee-yellow font-black uppercase tracking-[0.3em] text-[10px] mt-3 drop-shadow-sm">Logistics Control Portal</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white/5 backdrop-blur-2xl p-10 rounded-[40px] border border-white/10 shadow-2xl space-y-6 hover:shadow-bee-yellow/5 transition-all duration-500">
          {error && (
            <div className="p-4 mb-2 text-sm bg-red-500/10 border border-red-500/20 text-red-500 rounded-2xl text-center animate-shake font-bold">
              {error}
            </div>
          )}
          <div className="space-y-4">
            <div>
              <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-2">Admin Name</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="관리자 이름 (Name)"
                className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 text-white font-bold placeholder-gray-500 focus:outline-none focus:border-bee-yellow focus:bg-white/10 transition-all shadow-inner"
                autoFocus
              />
            </div>

            <div className="relative">
              <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-2">Password</label>
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="비밀번호"
                className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 text-white font-black tracking-widest placeholder-gray-500 focus:outline-none focus:border-bee-yellow focus:bg-white/10 transition-all shadow-inner"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-5 top-[38px] text-gray-500 hover:text-bee-yellow transition-colors"
                title={showPassword ? "비밀번호 숨기기" : "비밀번호 보기"}
                aria-label={showPassword ? "비밀번호 숨기기" : "비밀번호 보기"}
              >
                <i className={`fa-solid ${showPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
              </button>
            </div>
          </div>

          {error && <p className="text-red-400 text-xs text-center font-bold animate-pulse bg-red-400/10 py-2 rounded-lg border border-red-400/20">{error}</p>}

          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              className={`w-full bg-bee-yellow text-bee-black font-black hover:bg-[#E5C100] py-5 rounded-2xl shadow-xl shadow-bee-yellow/20 text-lg mb-4 hover:scale-[1.02] active:scale-95 transition-all ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {loading ? (
                <div className="flex items-center justify-center gap-2">
                  <i className="fa-solid fa-circle-notch animate-spin"></i>
                  <span>Connecting...</span>
                </div>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  SECURE LOGIN <i className="fa-solid fa-arrow-right"></i>
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

        <p className="mt-12 text-center text-[10px] text-gray-500 font-bold uppercase tracking-[0.4em]">
          Beeliber Systems &copy; 2025
        </p>
      </div>
    </div >
  );
};

export default AdminLoginPage;
