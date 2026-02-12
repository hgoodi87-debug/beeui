
import React, { useState, useEffect } from 'react';
import { AdminUser } from '../types';
import { StorageService } from '../services/storageService';

interface AdminLoginPageProps {
  onLogin: (name: string, jobTitle: string) => void;
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

  // Seed initial admin data if empty or invalid, AND sanitize existing data
  useEffect(() => {
    const storedAdmins = localStorage.getItem('beeliber_admins');

    if (!storedAdmins) {
      localStorage.setItem('beeliber_admins', JSON.stringify(INITIAL_ADMINS));
    } else {
      try {
        const parsed = JSON.parse(storedAdmins);

        if (!Array.isArray(parsed) || parsed.length === 0) {
          localStorage.setItem('beeliber_admins', JSON.stringify(INITIAL_ADMINS));
        } else {
          // DATA SANITIZATION:
          const cleanedAdmins: AdminUser[] = parsed.map((u: any) => ({
            ...u,
            name: (u.name || '').trim(),
            jobTitle: (u.jobTitle || '').trim(),
            password: (u.password || '').trim()
          }));

          // MERGE NEW INITIAL ADMINS (Migration)
          let changed = false;
          INITIAL_ADMINS.forEach(initAdmin => {
            // Check if an admin with this name already exists
            if (!cleanedAdmins.some(a => a.name === initAdmin.name)) {
              cleanedAdmins.push(initAdmin);
              changed = true;
            }
          });

          if (changed || JSON.stringify(cleanedAdmins) !== JSON.stringify(parsed)) {
            localStorage.setItem('beeliber_admins', JSON.stringify(cleanedAdmins));
          }
        }
      } catch (e) {
        localStorage.setItem('beeliber_admins', JSON.stringify(INITIAL_ADMINS));
      }
    }
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
      // Fetch admins from Cloud (Firestore) instead of localStorage
      const storedAdmins = await StorageService.getAdmins();

      // Robust matching: remove all spaces, lowercase, normalize
      const normalize = (str: string) => str.replace(/\s+/g, '').toLowerCase().normalize('NFC');

      const inputName = normalize(formData.name);
      const inputPassword = formData.password.trim();

      // Find matching user by Name and Password
      const admin = storedAdmins.find(u => {
        const storedName = normalize(u.name || '');
        const storedPass = (u.password || '').trim();
        return storedName === inputName && storedPass === inputPassword;
      });

      if (admin) {
        onLogin(admin.name, admin.jobTitle || 'Staff');
      } else {
        setError('이름 또는 비밀번호가 올바르지 않습니다.');
      }
    } catch (e) {
      console.error("Login Error:", e);
      setError('로그인 처리 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-bee-light flex items-center justify-center p-6 font-sans">
      <div className="max-w-md w-full animate-fade-in">
        <div className="text-center mb-10">
          <div className="w-20 h-20 bg-bee-yellow rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-xl shadow-yellow-100">
            <i className="fa-solid fa-shield-halved text-bee-black text-3xl"></i>
          </div>
          <div className="flex items-center justify-center gap-1 mb-2 scale-110">
            <span className="text-3xl font-black italic text-bee-yellow">bee</span>
            <span className="text-3xl font-black text-bee-black">liber</span>
          </div>
          <p className="text-bee-grey font-bold uppercase tracking-[0.2em] text-[10px] mt-2">Logistics Control Portal</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white p-10 rounded-[40px] border border-gray-100 shadow-2xl space-y-6">
          <div className="space-y-4">
            <div>
              <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-2">Admin Name</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="관리자 이름 (Name)"
                className="w-full bg-gray-50 border-2 border-transparent rounded-2xl py-4 px-6 text-bee-black font-bold focus:outline-none focus:border-bee-yellow focus:bg-white transition-all"
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
                className="w-full bg-gray-50 border-2 border-transparent rounded-2xl py-4 px-6 text-bee-black font-black tracking-widest focus:outline-none focus:border-bee-yellow focus:bg-white transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-[38px] text-gray-400 hover:text-bee-black transition-colors"
              >
                <i className={`fa-solid ${showPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
              </button>
            </div>
          </div>

          {error && <p className="text-red-500 text-xs text-center font-bold animate-pulse">{error}</p>}

          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              className={`w-full btn-primary py-5 rounded-2xl shadow-xl shadow-yellow-100 text-lg mb-4 ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {loading ? (
                <div className="flex items-center justify-center gap-2">
                  <i className="fa-solid fa-circle-notch animate-spin"></i>
                  <span>확인 중...</span>
                </div>
              ) : (
                '대시보드 접속'
              )}
            </button>

            <button
              type="button"
              onClick={onCancel}
              className="w-full text-gray-400 hover:text-bee-black text-sm font-bold transition-colors mb-4"
            >
              돌아가기
            </button>


          </div>
        </form>

        <p className="mt-12 text-center text-[10px] text-gray-300 font-bold uppercase tracking-[0.4em]">
          Beeliber Systems &copy; 2025
        </p>
      </div>
    </div>
  );
};

export default AdminLoginPage;
