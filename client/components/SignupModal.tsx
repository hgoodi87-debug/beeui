import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    createUserWithEmailAndPassword,
    updateProfile,
    signInWithGoogle
} from '../firebaseApp';
import { StorageService } from '../services/storageService';
import { UserProfile } from '../types';

interface SignupModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSignupSuccess?: () => void;
    onSwitchToLogin?: () => void;
    t: any;
}

const SignupModal: React.FC<SignupModalProps> = ({ isOpen, onClose, onSignupSuccess, onSwitchToLogin, t }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [nickname, setNickname] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [view, setView] = useState<'CHOICE' | 'FORM'>('CHOICE');

    const handleGoogleSignup = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const userCredential = await signInWithGoogle();
            const user = userCredential.user;

            const nextProfile: UserProfile = {
                uid: user.uid,
                email: user.email || '',
                displayName: user.displayName || 'Traveler',
                createdAt: new Date().toISOString(),
                level: 'BRONZE',
                points: 2000
            };
            await StorageService.updateUserProfile(user.uid, nextProfile);
            await StorageService.issueWelcomeCoupon(user.uid);

            onSignupSuccess?.();
            onClose();
        } catch (err: any) {
            console.error("Google Signup Error:", err);
            setError(t.signup_modal?.error_google || 'Failed to sign up with Google.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleEmailSignup = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);
        try {
            const userCredential = await createUserWithEmailAndPassword(email, password);
            const user = userCredential.user;

            await updateProfile(user, { displayName: nickname });

            const nextProfile: UserProfile = {
                uid: user.uid,
                email,
                displayName: nickname,
                createdAt: new Date().toISOString(),
                level: 'BRONZE',
                points: 2000
            };
            await StorageService.updateUserProfile(user.uid, nextProfile);
            await StorageService.issueWelcomeCoupon(user.uid);

            onSignupSuccess?.();
            onClose();
        } catch (err: any) {
            console.error("Email Signup Error:", err);
            setError(t.signup_modal?.error || 'An error occurred during sign-up.');
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
                        className="relative z-10 w-full sm:max-w-[440px] max-w-[calc(100vw-32px)] bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
                    >
                        {/* Promo Banner */}
                        <div className="bg-primary py-3 px-4 text-center">
                            <p className="text-[#181710] text-sm font-bold tracking-tight">
                                {t.signup_modal?.promo || '지금 가입하고 2,000원 할인 쿠폰 받으세요! 🎁'}
                            </p>
                        </div>

                        <div className="p-6 md:p-10 flex-1 overflow-y-auto no-scrollbar">
                            <div className="p-6 md:p-8 pt-6 md:pt-10 flex flex-col items-center">

                                {/* Close Button */}
                                <button title="Close Signup Modal" aria-label="Close Signup Modal" onClick={onClose} className="absolute top-3 right-3 md:top-6 md:right-6 w-10 h-10 flex items-center justify-center text-gray-400 hover:bg-gray-100 rounded-full transition-all z-20">
                                    <span className="material-symbols-outlined text-[24px]">close</span>
                                </button>

                                {/* Logo Section */}
                                <div className="mb-8 flex flex-col items-center gap-4">
                                    <div className="w-20 h-20 bg-primary rounded-full flex items-center justify-center shadow-lg">
                                        <span className="material-symbols-outlined text-white text-4xl font-fill">
                                            luggage
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="size-5 text-[#181710] dark:text-white">
                                            <svg fill="currentColor" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
                                                <path d="M44 4H30.6666V17.3334H17.3334V30.6666H4V44H44V4Z"></path>
                                            </svg>
                                        </div>
                                        <h2 className="text-[#181710] dark:text-white text-xl font-black leading-tight tracking-tight">Beeliber</h2>
                                    </div>
                                </div>

                                <AnimatePresence mode="wait">
                                    {view === 'CHOICE' ? (
                                        <motion.div
                                            key="choice"
                                            initial={{ opacity: 0, x: -20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            exit={{ opacity: 0, x: 20 }}
                                            className="w-full"
                                        >
                                            <div className="text-center mb-8 space-y-2">
                                                <h1 className="text-[#181710] dark:text-white text-2xl font-extrabold leading-tight tracking-tight px-2">
                                                    {t.signup_modal?.welcome || 'Beeliber에 오신 것을 환영합니다!'}
                                                </h1>
                                                <p className="text-gray-500 dark:text-gray-400 text-base font-medium">
                                                    {t.signup_modal?.subtitle || '여행의 시작을 더욱 가볍게 만들어보세요.'}
                                                </p>
                                            </div>

                                            <div className="w-full space-y-3 mb-8">
                                                <button
                                                    onClick={handleGoogleSignup}
                                                    disabled={isLoading}
                                                    title="Sign up with Google"
                                                    aria-label="Sign up with Google"
                                                    className="w-full flex items-center justify-center gap-3 bg-white border border-gray-300 rounded-lg py-2.5 md:py-3.5 px-6 shadow-sm transition-all hover:bg-gray-50 group disabled:opacity-50"
                                                >
                                                    <svg className="w-5 h-5" viewBox="0 0 48 48">
                                                        <defs>
                                                            <path d="M44.5 20H24v8.5h11.8C34.7 33.9 30.1 37 24 37c-7.2 0-13-5.8-13-13s5.8-13 13-13c3.1 0 5.9 1.1 8.1 2.9l6.4-6.4C34.6 4.1 29.6 2 24 2 11.8 2 2 11.8 2 24s9.8 22 22 22c11 0 21-8 21-22 0-1.3-.2-2.7-.5-4z" id="a"></path>
                                                        </defs>
                                                        <clipPath id="b"><use overflow="visible" xlinkHref="#a"></use></clipPath>
                                                        <path clipPath="url(#b)" d="M0 37V11l17 13z" fill="#FBBC05"></path>
                                                        <path clipPath="url(#b)" d="M0 11l17 13 7-6.1L48 14V0H0z" fill="#EA4335"></path>
                                                        <path clipPath="url(#b)" d="M0 37l30-23 7.9 1L48 0v48H0z" fill="#34A853"></path>
                                                        <path clipPath="url(#b)" d="M48 48L17 24l-4-3 35-10z" fill="#4285F4"></path>
                                                    </svg>
                                                    <span className="text-[#181710] font-bold text-base">{t.signup_modal?.google_signup || 'Sign up with Google'}</span>
                                                </button>
                                                <button
                                                    onClick={() => setView('FORM')}
                                                    title="Sign up with Email"
                                                    aria-label="Sign up with Email"
                                                    className="w-full flex items-center justify-center gap-3 bg-white border border-gray-200 rounded-lg py-2.5 md:py-3.5 px-6 hover:bg-gray-50 transition-colors"
                                                >
                                                    <span className="material-symbols-outlined text-gray-600 text-[20px]">mail</span>
                                                    <span className="text-gray-700 font-semibold text-base">{t.signup_modal?.email_signup || 'Sign up with Email'}</span>
                                                </button>
                                            </div>

                                            <div className="text-center">
                                                <button
                                                    onClick={onSwitchToLogin}
                                                    className="text-sm font-bold text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors"
                                                >
                                                    {t.signup_modal?.login_link || 'Already have an account? Log in'}
                                                </button>
                                            </div>
                                        </motion.div>
                                    ) : (
                                        <motion.div
                                            key="form"
                                            initial={{ opacity: 0, x: 20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            exit={{ opacity: 0, x: -20 }}
                                            className="w-full"
                                        >
                                            <form onSubmit={handleEmailSignup} className="space-y-4 w-full">
                                                <div className="space-y-1.5">
                                                    <label className="text-xs font-semibold text-zinc-600 dark:text-zinc-400 uppercase tracking-wider ml-1">{t.signup_modal?.nickname_label || 'Nickname'}</label>
                                                    <input
                                                        type="text"
                                                        title="Nickname"
                                                        value={nickname}
                                                        onChange={(e) => setNickname(e.target.value)}
                                                        required
                                                        className="w-full h-10 md:h-12 px-4 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all font-bold"
                                                        placeholder={t.signup_modal?.nickname_placeholder || "Enter a cool nickname"}
                                                    />
                                                </div>
                                                <div className="space-y-1.5">
                                                    <label className="text-xs font-semibold text-zinc-600 dark:text-zinc-400 uppercase tracking-wider ml-1">{t.signup_modal?.email_label || 'Email Address'}</label>
                                                    <input
                                                        type="email"
                                                        title="Email Address"
                                                        value={email}
                                                        onChange={(e) => setEmail(e.target.value)}
                                                        required
                                                        className="w-full h-10 md:h-12 px-4 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all font-bold"
                                                        placeholder="example@bee-liber.com"
                                                    />
                                                </div>
                                                <div className="space-y-1.5">
                                                    <label className="text-xs font-semibold text-zinc-600 dark:text-zinc-400 uppercase tracking-wider ml-1">{t.signup_modal?.password_label || 'Password'}</label>
                                                    <input
                                                        type="password"
                                                        title="Password"
                                                        value={password}
                                                        onChange={(e) => setPassword(e.target.value)}
                                                        required
                                                        className="w-full h-10 md:h-12 px-4 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all font-bold"
                                                        placeholder={t.signup_modal?.password_placeholder || "Enter 8 or more characters"}
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
                                                    {isLoading ? '...' : '가입 완료하기'}
                                                </button>

                                                <button
                                                    type="button"
                                                    onClick={() => setView('CHOICE')}
                                                    title="Go Back"
                                                    aria-label="Go Back"
                                                    className="w-full h-10 bg-gray-50 dark:bg-zinc-800 text-zinc-500 font-bold rounded-lg transition-colors text-sm"
                                                >
                                                    {t.signup_modal?.back || 'Go Back'}
                                                </button>
                                            </form>
                                        </motion.div>
                                    )}
                                </AnimatePresence>

                                {/* Decorative Illustration (from HTML variant) */}
                                <div className="w-full rounded-xl overflow-hidden bg-background-light dark:bg-background-dark border border-gray-100 dark:border-gray-800 p-1 mb-6 mt-8">
                                    <div className="relative w-full h-32 rounded-lg overflow-hidden flex items-center justify-center bg-gray-50 dark:bg-gray-900">
                                        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent"></div>
                                        <div className="relative z-10 flex flex-col items-center scale-75 transform origin-center">
                                            <div className="w-24 h-28 bg-primary rounded-xl relative shadow-md flex flex-col p-3 border-2 border-[#181710]/10">
                                                <div className="w-8 h-1 bg-[#181710]/20 rounded-full mx-auto mb-1"></div>
                                                <div className="flex-1 flex items-center justify-center">
                                                    <span className="material-symbols-outlined text-3xl text-white">luggage</span>
                                                </div>
                                                <div className="w-full h-6 bg-white/20 rounded-md"></div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="text-center space-y-2">
                                    <p className="text-[11px] text-gray-400 dark:text-gray-500 leading-relaxed max-w-[280px]">
                                        {t.terms?.policy_agree?.replace('{terms}', t.terms?.link_usage).replace('{privacy}', t.terms?.link_privacy) || 'By continuing, you agree to Beeliber\'s Terms of Service and Privacy Policy.'}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};

export default SignupModal;
