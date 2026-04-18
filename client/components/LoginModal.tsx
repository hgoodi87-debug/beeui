import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { signInWithMagicLink, auth } from '../firebaseApp';

interface LoginModalProps {
  open: boolean;
  lang: string;
  onClose: () => void;
  onSuccess?: () => void;
  onNavigateTracking: () => void;
  redirectTo?: string;
  // 호환용
  isOpen?: boolean;
  onLoginSuccess?: () => void;
  onSwitchToSignup?: () => void;
  t?: any;
}

const LABELS: Record<string, {
  notice: string; placeholder: string;
  btn_send: string; btn_resend: string; btn_continue: string;
  sent_title: string; sent_desc: string; sent_waiting: string;
  done_title: string; done_desc: string;
  back: string; go_track: string;
  error_invalid: string; error_generic: string;
}> = {
  ko: {
    notice: '별도 회원가입 없이 이메일로 로그인할 수 있습니다.\n간편하게 예약하시고 여행을 즐기세요!',
    placeholder: '이메일 주소 입력',
    btn_send: '로그인 하기',
    btn_resend: '링크 재전송',
    btn_continue: '인증 완료 — 계속하기',
    sent_title: '이메일을 확인해주세요',
    sent_desc: '로 로그인 링크를 보냈어요.\n링크를 클릭하면 이 화면에서 자동으로 인증됩니다.',
    sent_waiting: '인증 대기 중...',
    done_title: '인증이 완료됐어요!',
    done_desc: '로그인에 성공했습니다.',
    back: '이메일 다시 입력',
    go_track: '예약 코드로 직접 조회 →',
    error_invalid: '올바른 이메일 주소를 입력해주세요.',
    error_generic: '전송 중 오류가 발생했습니다. 다시 시도해주세요.',
  },
  en: {
    notice: 'No sign-up required.\nJust enter your email and start booking!',
    placeholder: 'Enter your email address',
    btn_send: 'Sign in',
    btn_resend: 'Resend link',
    btn_continue: 'Verified — Continue',
    sent_title: 'Check your inbox',
    sent_desc: 'We sent a sign-in link to\nClick it — this screen will update automatically.',
    sent_waiting: 'Waiting for verification...',
    done_title: 'Verified!',
    done_desc: 'You\'re signed in successfully.',
    back: 'Change email',
    go_track: 'Look up by booking code →',
    error_invalid: 'Please enter a valid email address.',
    error_generic: 'Something went wrong. Please try again.',
  },
  'zh-TW': {
    notice: '無需另外註冊，直接以電子郵件登入\n輕鬆預訂，享受旅程！',
    placeholder: '輸入電子郵件地址',
    btn_send: '登入',
    btn_resend: '重新發送',
    btn_continue: '驗證完成 — 繼續',
    sent_title: '請確認您的信箱',
    sent_desc: '已將登入連結發送至\n點擊連結後此畫面將自動更新。',
    sent_waiting: '等待驗證中...',
    done_title: '驗證完成！',
    done_desc: '登入成功。',
    back: '更改電子郵件',
    go_track: '用預訂碼直接查詢 →',
    error_invalid: '請輸入有效的電子郵件地址',
    error_generic: '發生錯誤，請稍後再試',
  },
  'zh-HK': {
    notice: '無需另外註冊，直接以電郵登入\n輕鬆預訂，享受旅程！',
    placeholder: '輸入電郵地址',
    btn_send: '登入',
    btn_resend: '重新發送',
    btn_continue: '驗證完成 — 繼續',
    sent_title: '請確認您的信箱',
    sent_desc: '已將登入連結發送至\n點擊連結後此畫面將自動更新。',
    sent_waiting: '等待驗證中...',
    done_title: '驗證完成！',
    done_desc: '登入成功。',
    back: '更改電郵',
    go_track: '用預訂碼直接查詢 →',
    error_invalid: '請輸入有效的電郵地址',
    error_generic: '發生錯誤，請稍後再試',
  },
  zh: {
    notice: '无需另外注册，直接以邮箱登录\n轻松预订，享受旅程！',
    placeholder: '输入电子邮件地址',
    btn_send: '登录',
    btn_resend: '重新发送',
    btn_continue: '验证完成 — 继续',
    sent_title: '请查看您的邮箱',
    sent_desc: '已将登录链接发送至\n点击链接后此页面将自动更新。',
    sent_waiting: '等待验证中...',
    done_title: '验证完成！',
    done_desc: '登录成功。',
    back: '更改邮箱',
    go_track: '用预订码直接查询 →',
    error_invalid: '请输入有效的电子邮件地址',
    error_generic: '发生错误，请稍后再试',
  },
  ja: {
    notice: '会員登録不要。メールアドレスだけで\n簡単にログインできます！',
    placeholder: 'メールアドレスを入力',
    btn_send: 'ログインする',
    btn_resend: '再送信',
    btn_continue: '認証完了 — 続ける',
    sent_title: 'メールをご確認ください',
    sent_desc: 'にログインリンクを送りました。\nリンクをクリックするとこの画面が自動で更新されます。',
    sent_waiting: '認証待ち中...',
    done_title: '認証完了！',
    done_desc: 'ログインに成功しました。',
    back: 'メールアドレスを変更',
    go_track: '予約コードで直接照会 →',
    error_invalid: '有効なメールアドレスを入力してください',
    error_generic: 'エラーが発生しました。もう一度お試しください',
  },
};

const isValidEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());
const COOLDOWN = 30;

const LoginModal: React.FC<LoginModalProps> = ({
  open, lang, onClose, onSuccess, onNavigateTracking, redirectTo,
}) => {
  const t = LABELS[lang] ?? LABELS.en;
  const [email, setEmail] = useState('');
  const [step, setStep] = useState<'email' | 'sent' | 'done'>('email');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [cooldown, setCooldown] = useState(0);

  // 모달 닫히면 초기화
  useEffect(() => {
    if (!open) {
      const id = setTimeout(() => {
        setStep('email'); setEmail(''); setError(''); setCooldown(0);
      }, 300);
      return () => clearTimeout(id);
    }
  }, [open]);

  // 재전송 쿨다운
  useEffect(() => {
    if (cooldown <= 0) return;
    const id = setInterval(() => setCooldown(c => c - 1), 1000);
    return () => clearInterval(id);
  }, [cooldown]);

  // 🔑 핵심: 'sent' 단계에서 로그인 완료 자동 감지
  // 다른 탭에서 Magic Link 클릭 → localStorage 변경 → storage 이벤트 → applySession
  // → notifyAuthListeners → onAuthStateChanged 콜백 → step: 'done'
  useEffect(() => {
    if (step !== 'sent') return;
    const unsub = auth.onAuthStateChanged((user) => {
      if (user) setStep('done');
    });
    return unsub;
  }, [step]);

  const handleSend = async () => {
    if (!isValidEmail(email)) { setError(t.error_invalid); return; }
    setError(''); setLoading(true);
    try {
      const dest = redirectTo ?? `${window.location.origin}/${lang}/my/reservations`;
      await signInWithMagicLink(email.trim(), dest);
      setStep('sent');
      setCooldown(COOLDOWN);
    } catch (err) {
      const e = err as Error & { status?: number };
      console.error('[LoginModal] magic link failed:', e.status, e.message);
      if (e.status === 429) {
        setError('잠시 후 다시 시도해주세요. (요청 한도 초과)');
      } else if (e.status === 422) {
        setError('이메일 주소 또는 설정을 확인해주세요.');
      } else {
        setError(t.error_generic);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleContinue = () => {
    onSuccess?.();
    onClose();
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* 백드롭 */}
          <motion.div
            key="bd"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[200] bg-black/60 backdrop-blur-[4px]"
            onClick={step === 'done' ? undefined : onClose}
          />

          {/* 바텀시트 */}
          <motion.div
            key="sheet"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 34, stiffness: 340, mass: 0.85 }}
            className="fixed bottom-0 left-0 right-0 z-[201] mx-auto max-w-lg bg-white rounded-t-[32px]"
            onClick={e => e.stopPropagation()}
          >
            {/* 드래그 핸들 */}
            <div className="flex justify-center pt-3.5 pb-0.5">
              <div className="w-10 h-[3px] rounded-full bg-black/[0.07]" />
            </div>

            {/* 닫기 (done 단계에서는 숨김) */}
            {step !== 'done' && (
              <button
                onClick={onClose}
                aria-label="Close"
                className="absolute top-4 right-5 w-9 h-9 flex items-center justify-center rounded-full text-black/20 hover:text-black/50 hover:bg-black/[0.04] transition-all"
              >
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path d="M1 1L13 13M13 1L1 13" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"/>
                </svg>
              </button>
            )}

            <div className="px-7 pt-5 pb-10">
              <AnimatePresence mode="wait">

                {/* ── step 1: 이메일 입력 ── */}
                {step === 'email' && (
                  <motion.div
                    key="email"
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.16 }}
                  >
                    <div className="flex flex-col items-center mb-5">
                      <div className="w-[54px] h-[54px] bg-[#FFD600] rounded-[15px] flex items-center justify-center text-[26px] shadow-[0_8px_24px_rgba(255,214,0,0.28)] mb-3">
                        🐝
                      </div>
                      <span className="text-[11px] font-black tracking-[0.22em] text-[#FFD600] uppercase">BEELIBER</span>
                    </div>

                    <h2 className="text-[1.65rem] font-black text-[#1c1b1b] text-center tracking-tight leading-none mb-4">
                      로그인
                    </h2>

                    <div className="bg-[#f9f8f4] rounded-2xl px-5 py-4 mb-6 text-center">
                      <p className="text-[0.8rem] text-[#1c1b1b]/55 font-medium leading-relaxed whitespace-pre-line">
                        {t.notice}
                      </p>
                    </div>

                    <div className="mb-3">
                      <input
                        type="email"
                        value={email}
                        onChange={e => { setEmail(e.target.value); setError(''); }}
                        onKeyDown={e => e.key === 'Enter' && handleSend()}
                        placeholder={t.placeholder}
                        autoComplete="email"
                        className="w-full px-5 py-[15px] rounded-2xl bg-[#f0edec] text-[#1c1b1b] font-semibold text-[0.9rem] placeholder:text-[#1c1b1b]/22 focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#FFD600]/55 transition-all"
                      />
                      <AnimatePresence>
                        {error && (
                          <motion.p
                            initial={{ opacity: 0, y: -4 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0 }}
                            className="mt-2 text-red-500 text-xs font-bold pl-1"
                          >
                            {error}
                          </motion.p>
                        )}
                      </AnimatePresence>
                    </div>

                    <motion.button
                      onClick={handleSend}
                      disabled={loading || !email.trim()}
                      whileTap={{ scale: 0.985 }}
                      className="w-full py-[16px] rounded-2xl bg-[#1c1b1b] text-[#FFD600] font-black text-[0.95rem] tracking-wide disabled:opacity-25 disabled:cursor-not-allowed transition-opacity mb-5"
                    >
                      {loading ? (
                        <span className="flex items-center justify-center gap-2">
                          <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                          </svg>
                          전송 중...
                        </span>
                      ) : t.btn_send}
                    </motion.button>

                    <div className="text-center">
                      <button
                        onClick={onNavigateTracking}
                        className="text-[0.75rem] text-[#1c1b1b]/25 font-semibold hover:text-[#1c1b1b]/55 transition-colors"
                      >
                        {t.go_track}
                      </button>
                    </div>
                  </motion.div>
                )}

                {/* ── step 2: 이메일 대기 ── */}
                {step === 'sent' && (
                  <motion.div
                    key="sent"
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.16 }}
                  >
                    <div className="flex flex-col items-center mb-5 mt-1">
                      <div className="w-[54px] h-[54px] bg-[#FFD600] rounded-[15px] flex items-center justify-center text-[26px] shadow-[0_8px_24px_rgba(255,214,0,0.28)] mb-3">
                        🐝
                      </div>
                      <span className="text-[11px] font-black tracking-[0.22em] text-[#FFD600] uppercase">BEELIBER</span>
                    </div>

                    <h2 className="text-[1.4rem] font-black text-[#1c1b1b] text-center tracking-tight mb-4">
                      {t.sent_title}
                    </h2>

                    <div className="bg-[#f0edec] rounded-2xl px-5 py-4 mb-5">
                      <p className="text-xs font-black text-[#1c1b1b]/35 uppercase tracking-widest mb-1 text-center">이메일</p>
                      <p className="font-black text-[#1c1b1b] text-sm text-center">{email}</p>
                    </div>

                    <p className="text-[0.78rem] text-[#1c1b1b]/40 font-medium text-center leading-relaxed whitespace-pre-line mb-6 px-2">
                      {t.sent_desc}
                    </p>

                    {/* 대기 인디케이터 */}
                    <div className="flex items-center justify-center gap-2 mb-6">
                      <div className="flex gap-1">
                        {[0, 1, 2].map(i => (
                          <motion.div
                            key={i}
                            className="w-1.5 h-1.5 bg-[#FFD600] rounded-full"
                            animate={{ opacity: [0.3, 1, 0.3] }}
                            transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.4 }}
                          />
                        ))}
                      </div>
                      <span className="text-[0.75rem] text-[#1c1b1b]/35 font-semibold">
                        {t.sent_waiting}
                      </span>
                    </div>

                    <motion.button
                      onClick={handleSend}
                      disabled={cooldown > 0 || loading}
                      whileTap={{ scale: 0.985 }}
                      className="w-full py-[14px] rounded-2xl bg-[#f0edec] text-[#1c1b1b] font-black text-[0.85rem] disabled:opacity-35 disabled:cursor-not-allowed transition-opacity mb-3"
                    >
                      {cooldown > 0 ? `${t.btn_resend} (${cooldown}s)` : t.btn_resend}
                    </motion.button>

                    <button
                      onClick={() => { setStep('email'); setError(''); setCooldown(0); }}
                      className="w-full py-2.5 text-[#1c1b1b]/25 font-semibold text-sm hover:text-[#1c1b1b]/55 transition-colors"
                    >
                      {t.back}
                    </button>
                  </motion.div>
                )}

                {/* ── step 3: 인증 완료 ── */}
                {step === 'done' && (
                  <motion.div
                    key="done"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.22 }}
                  >
                    <div className="flex flex-col items-center mb-6 mt-2">
                      {/* 체크 애니메이션 */}
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: 'spring', damping: 18, stiffness: 300, delay: 0.1 }}
                        className="w-[64px] h-[64px] bg-[#FFD600] rounded-full flex items-center justify-center mb-4 shadow-[0_8px_24px_rgba(255,214,0,0.35)]"
                      >
                        <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
                          <path d="M5 14L11 20L23 8" stroke="#1c1b1b" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </motion.div>
                      <span className="text-[11px] font-black tracking-[0.22em] text-[#FFD600] uppercase">BEELIBER</span>
                    </div>

                    <h2 className="text-[1.55rem] font-black text-[#1c1b1b] text-center tracking-tight mb-2">
                      {t.done_title}
                    </h2>
                    <p className="text-[0.82rem] text-[#1c1b1b]/45 font-medium text-center mb-8">
                      {t.done_desc}
                    </p>

                    <motion.button
                      onClick={handleContinue}
                      whileTap={{ scale: 0.985 }}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2 }}
                      className="w-full py-[16px] rounded-2xl bg-[#1c1b1b] text-[#FFD600] font-black text-[0.95rem] tracking-wide"
                    >
                      {t.btn_continue}
                    </motion.button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default LoginModal;
