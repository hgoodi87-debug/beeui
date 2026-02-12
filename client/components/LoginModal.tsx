import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { auth } from '../firebaseApp';
import {
  signInWithPopup,
  GoogleAuthProvider,
  signInWithEmailAndPassword
} from 'firebase/auth';

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
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
      onLoginSuccess?.();
      onClose();
    } catch (err: any) {
      console.error("Google Login Error:", err);
      setError(t.login_modal?.error_google || 'Failed to log in with Google.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      onLoginSuccess?.();
      onClose();
    } catch (err: any) {
      console.error("Email Login Error:", err);
      setError(t.login_modal?.error_email || 'Invalid email or password.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-[2px] p-4" onClick={onClose}>
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            onClick={(e) => e.stopPropagation()}
            className="relative w-full sm:max-w-[440px] max-w-[calc(100vw-32px)] bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl overflow-hidden"
          >
            {/* Close Button */}
            <button title="Close Login Modal" aria-label="Close Login Modal" onClick={onClose} className="modal-close-btn absolute top-3 right-3 md:top-5 md:right-5 w-10 h-10 flex items-center justify-center text-gray-400 hover:bg-gray-100 rounded-full transition-all">
              <span className="material-symbols-outlined text-[24px]">close</span>
            </button>

            {/* Promo Banner */}
            <div className="bg-primary px-6 py-2.5 flex items-center justify-center gap-2">
              <span className="material-symbols-outlined text-[18px] text-zinc-900">celebration</span>
              <p className="text-[#181810] text-sm font-bold leading-none tracking-tight">
                {t.login_modal?.benefit || 'Get a 2,000 KRW coupon instantly upon sign-up'}
              </p>
            </div>

            <div className="p-6 md:p-10 flex flex-col gap-0">
              {/* Headline */}
              <div className="mb-6 md:mb-8 text-center">
                <div className="inline-flex items-center justify-center size-8 md:size-10 bg-primary/10 rounded-lg mb-4">
                  <svg className="size-6 text-zinc-900" fill="none" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
                    <path d="M44 4H30.6666V17.3334H17.3334V30.6666H4V44H44V4Z" fill="currentColor"></path>
                  </svg>
                </div>
                <h2 className="text-2xl font-bold text-zinc-900 dark:text-white">
                  {t.login_modal?.title_new || 'Beeliber 시작하기'}
                </h2>
                <p className="text-zinc-500 dark:text-zinc-400 text-sm mt-2">
                  {t.login_modal?.subtitle_new || '지금 로그인하고 Beeliber의 서비스를 만나보세요.'}
                </p>
              </div>

              {/* Social Login */}
              <div className="space-y-3">
                <button
                  onClick={handleGoogleLogin}
                  disabled={isLoading}
                  className="w-full flex items-center justify-center gap-3 h-12 px-5 border border-zinc-200 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-700 transition-all shadow-sm"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"></path>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"></path>
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"></path>
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.66l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"></path>
                  </svg>
                  <span className="text-sm font-semibold text-zinc-700 dark:text-zinc-200">{t.login_modal?.google_continue || 'Continue with Google'}</span>
                </button>
              </div>

              {/* Divider */}
              <div className="relative my-6 md:my-8">
                <div aria-hidden="true" className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-zinc-200 dark:border-zinc-700"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white dark:bg-zinc-900 text-zinc-400">{t.login_modal?.or_divider || 'or'}</span>
                </div>
              </div>

              {/* Email Form */}
              <form onSubmit={handleEmailLogin} className="space-y-4">
                <div className="space-y-1.5">
                  <label htmlFor="email-address" className="text-xs font-semibold text-zinc-600 dark:text-zinc-400 uppercase tracking-wider ml-1">{t.login_modal?.email_label || 'Email Address'}</label>
                  <input
                    id="email-address"
                    type="email"
                    title="Email Address"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full h-12 md:h-14 px-5 bg-gray-50 border-2 border-transparent focus:border-bee-yellow rounded-2xl outline-none text-bee-black font-bold transition-all placeholder:text-gray-400"
                    placeholder="example@bee-liber.com"
                  />
                </div>
                <div className="space-y-1.5">
                  <label htmlFor="password" className="text-xs font-semibold text-zinc-600 dark:text-zinc-400 uppercase tracking-wider ml-1">{t.login_modal?.password_label || 'Password'}</label>
                  <input
                    id="password"
                    type="password"
                    title="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="w-full h-12 md:h-14 px-5 bg-gray-50 border-2 border-transparent focus:border-bee-yellow rounded-2xl outline-none text-bee-black font-bold transition-all placeholder:text-gray-400"
                    placeholder="••••••••"
                  />
                </div>

                {error && (
                  <p className="text-xs font-bold text-red-500 mt-1 ml-1">{error}</p>
                )}

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full h-12 bg-primary hover:bg-[#ebd904] text-zinc-900 font-bold rounded-lg transition-colors shadow-sm mt-2 disabled:opacity-50"
                >
                  {isLoading ? '...' : (t.login_modal?.login_btn || '로그인')}
                </button>
              </form>

              {/* Footer Links */}
              <div className="mt-6 md:mt-8 flex items-center justify-center gap-4 text-sm font-medium">
                <button
                  onClick={onSwitchToSignup}
                  className="text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
                >
                  {t.login_modal?.signup_link || '회원가입'}
                </button>
                <span className="w-1 h-1 rounded-full bg-zinc-300"></span>
                <button className="text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors">
                  {t.login_modal?.forgot_password || 'Forgot Password?'}
                </button>
              </div>
            </div>

            {/* Policy Footer */}
            <div className="px-8 pb-8 pt-2 text-center border-t border-zinc-50 dark:border-zinc-800/50 mt-4">
              <p className="text-[11px] text-zinc-400 leading-relaxed px-4">
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
