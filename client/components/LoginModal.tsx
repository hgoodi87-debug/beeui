import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  signInWithEmailAndPassword,
  signInWithGoogle,
} from '../firebaseApp';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess?: () => void;
  onSwitchToSignup?: () => void;
  t: any;
}

const LoginModal: React.FC<LoginModalProps> = ({ isOpen, onClose, onLoginSuccess, onSwitchToSignup, t }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    setError(null);
    try {
      await signInWithGoogle();
      onLoginSuccess?.();
      onClose();
    } catch (err: any) {
      console.error("Google Login Error:", err);
      // [스봉이] 구글 로그인도 애매모호하게 에러 치환 💅
      setError(t.login_modal?.error_general || '로그인 중 오류가 발생했습니다. 다시 시도해주세요.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    try {
      await signInWithEmailAndPassword(email, password);
      onLoginSuccess?.();
      onClose();
    } catch (err: any) {
      console.error("Email Login Error:", err);
      // [비키] 브루트포스 방지용 모호한 에러 메시지 처리 🛡️
      setError(t.login_modal?.error_email || '이메일 또는 비밀번호가 일치하지 않습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  // [렌딩이] 이메일 실시간 유효성 검사 💅✨
  const isValidEmail = email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-start sm:items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto custom-scrollbar" onClick={onClose}>
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 30 }}
            onClick={(e) => e.stopPropagation()}
            className="relative w-full sm:max-w-[440px] bg-white dark:bg-zinc-900 rounded-[32px] md:rounded-[40px] shadow-[0_50px_100px_-20px_rgba(0,0,0,0.3)] overflow-hidden my-auto"
          >
            {/* Close Button */}
            <button
              title="Close Login Modal"
              aria-label="Close Login Modal"
              onClick={onClose}
              className="absolute top-4 right-4 md:top-6 md:right-6 z-20 w-11 h-11 flex items-center justify-center bg-gray-50 dark:bg-zinc-800 text-gray-400 hover:text-black dark:hover:text-white rounded-full transition-all hover:rotate-90 active:scale-90"
            >
              <span className="material-symbols-outlined text-[24px]">close</span>
            </button>

            {/* Promo Banner */}
            <div className="bg-primary px-8 py-3.5 flex items-center justify-center gap-2 relative overflow-hidden group">
              <span className="material-symbols-outlined text-[18px] text-zinc-900 group-hover:rotate-12 transition-transform">celebration</span>
              <p className="text-[#181810] text-xs md:text-sm font-black leading-none tracking-tight">
                {t.login_modal?.benefit || 'Get a 2,000 KRW coupon instantly upon sign-up'}
              </p>
              <div className="absolute inset-0 bg-white/10 -translate-x-full group-hover:translate-x-0 transition-transform duration-700 pointer-events-none" />
            </div>

            <div className="p-8 md:p-12 flex flex-col">
              {/* Headline */}
              <div className="mb-8 md:mb-12 text-center">
                <div className="inline-flex items-center justify-center size-10 md:size-14 bg-primary/10 rounded-2xl mb-6 shadow-inner">
                  <svg className="size-6 md:size-8 text-zinc-900" fill="none" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
                    <path d="M44 4H30.6666V17.3334H17.3334V30.6666H4V44H44V4Z" fill="currentColor"></path>
                  </svg>
                </div>
                <h2 className="text-3xl md:text-4xl font-black text-zinc-900 dark:text-white tracking-tighter">
                  {t.login_modal?.title_new || 'Beeliber 시작하기'}
                </h2>
                <p className="text-zinc-400 dark:text-zinc-500 text-sm md:text-base font-bold mt-3">
                  {t.login_modal?.subtitle_new || '지금 로그인하고 Beeliber의 서비스를 만나보세요.'}
                </p>
              </div>

              {/* Social Login */}
              <div className="space-y-4">
                <button
                  onClick={handleGoogleLogin}
                  disabled={isLoading}
                  className="w-full flex items-center justify-center gap-4 h-14 md:h-16 px-6 border border-zinc-200 dark:border-zinc-800 rounded-[20px] bg-white dark:bg-zinc-900 group relative overflow-hidden transition-all duration-300 hover:border-transparent hover:shadow-[0_8px_30px_rgb(0,0,0,0.12)] active:scale-[0.98] disabled:opacity-50"
                  style={{ transitionTimingFunction: 'cubic-bezier(0.16, 1, 0.3, 1)' }}
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-gray-50 to-white dark:from-zinc-800 dark:to-zinc-900 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
                  <svg className="w-5 h-5 md:w-6 md:h-6 relative z-10 transition-transform duration-300 group-hover:scale-110" viewBox="0 0 24 24">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"></path>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"></path>
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"></path>
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.66l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"></path>
                  </svg>
                  <span className="relative z-10 text-sm md:text-base font-black text-zinc-900 dark:text-zinc-100 tracking-tight">{t.login_modal?.google_continue || 'Continue with Google'}</span>
                </button>
              </div>

              {/* Divider */}
              <div className="relative my-8 md:my-10">
                <div aria-hidden="true" className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-zinc-100 dark:border-zinc-800"></div>
                </div>
                <div className="relative flex justify-center text-xs uppercase tracking-widest font-black">
                  <span className="px-4 bg-white dark:bg-zinc-900 text-zinc-300">{t.login_modal?.or_divider || 'or'}</span>
                </div>
              </div>

              {/* Email Form */}
              <form onSubmit={handleEmailLogin} className="space-y-5">
                <div className="space-y-2 relative group">
                  <label htmlFor="email-address" className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em] ml-2 transition-colors group-focus-within:text-bee-yellow">{t.login_modal?.email_label || 'Email Address'}</label>
                  <div className="relative">
                    <input
                      id="email-address"
                      type="email"
                      title="Email Address"
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        if (error) setError(null);
                      }}
                      required
                      className="w-full h-14 md:h-16 px-6 bg-gray-50 border-2 border-transparent focus:border-bee-yellow rounded-2xl outline-none text-bee-black font-black transition-all placeholder:text-gray-300 pr-12 focus:shadow-[0_0_0_4px_rgba(255,203,5,0.2)]"
                      placeholder="example@bee-liber.com"
                    />
                    <AnimatePresence>
                      {isValidEmail && (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.5 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.5 }}
                          className="absolute right-4 top-1/2 -translate-y-1/2 w-6 h-6 bg-bee-yellow rounded-full flex items-center justify-center text-bee-black"
                        >
                          <span className="material-symbols-outlined text-[16px] font-bold">check</span>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
                <div className="space-y-2 relative group mt-4">
                  <label htmlFor="password" className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em] ml-2 transition-colors group-focus-within:text-bee-yellow">{t.login_modal?.password_label || 'Password'}</label>
                  <input
                    id="password"
                    type="password"
                    title="Password"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (error) setError(null);
                    }}
                    required
                    className="w-full h-14 md:h-16 px-6 bg-gray-50 border-2 border-transparent focus:border-bee-yellow rounded-2xl outline-none text-bee-black font-black transition-all placeholder:text-gray-300 focus:shadow-[0_0_0_4px_rgba(255,203,5,0.2)]"
                    placeholder="••••••••"
                  />
                </div>

                {error && (
                  <motion.div initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-2 mt-2 ml-2 bg-red-50 p-3 rounded-lg border border-red-100">
                    <span className="material-symbols-outlined text-[16px] text-red-500">error</span>
                    <p className="text-xs font-bold text-red-600">
                      {error}
                    </p>
                  </motion.div>
                )}

                <button
                  type="submit"
                  disabled={isLoading}
                  className="relative w-full h-14 md:h-16 bg-primary hover:bg-bee-yellow text-zinc-900 font-black rounded-2xl transition-all shadow-[0_4px_14px_0_rgba(255,203,5,0.39)] hover:shadow-[0_6px_20px_rgba(255,203,5,0.23)] hover:-translate-y-0.5 active:scale-[0.98] mt-4 overflow-hidden disabled:opacity-50 disabled:hover:translate-y-0 disabled:active:scale-100"
                >
                  <AnimatePresence mode="wait">
                    {isLoading ? (
                      <motion.div
                        key="loading"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 flex items-center justify-center bg-bee-yellow/80 backdrop-blur-sm"
                      >
                        <div className="flex gap-1.5">
                          <motion.div className="w-2 h-2 rounded-full bg-black" animate={{ y: [0, -6, 0] }} transition={{ duration: 0.6, repeat: Infinity, delay: 0 }} />
                          <motion.div className="w-2 h-2 rounded-full bg-black" animate={{ y: [0, -6, 0] }} transition={{ duration: 0.6, repeat: Infinity, delay: 0.2 }} />
                          <motion.div className="w-2 h-2 rounded-full bg-black" animate={{ y: [0, -6, 0] }} transition={{ duration: 0.6, repeat: Infinity, delay: 0.4 }} />
                        </div>
                      </motion.div>
                    ) : (
                      <motion.span
                        key="text"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="text-base md:text-lg uppercase tracking-widest relative z-10 block"
                      >
                        {t.login_modal?.login_btn || '로그인'}
                      </motion.span>
                    )}
                  </AnimatePresence>
                </button>
              </form>

              {/* Footer Links */}
              <div className="mt-8 md:mt-10 flex items-center justify-center gap-6 text-xs font-black uppercase tracking-widest">
                <button
                  onClick={onSwitchToSignup}
                  className="text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
                >
                  {t.login_modal?.signup_link || '회원가입'}
                </button>
                <span className="w-1.5 h-1.5 rounded-full bg-zinc-100"></span>
                <button className="text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors">
                  {t.login_modal?.forgot_password || 'Forgot Password?'}
                </button>
              </div>
            </div>

            {/* Policy Footer */}
            <div className="px-10 pb-10 pt-4 text-center border-t border-zinc-50 dark:border-zinc-800/50 mt-4 bg-gray-50/50 dark:bg-black/20">
              <p className="text-[10px] font-bold text-zinc-400 leading-relaxed px-4">
                {t.terms?.policy_agree?.replace('{terms}', t.terms?.link_usage).replace('{privacy}', t.terms?.link_privacy) || 'By continuing, you agree to Beeliber\'s Terms of Service and Privacy Policy.'}
              </p>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default LoginModal;
