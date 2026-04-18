import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { signInWithMagicLink, auth } from '../firebaseApp';

// ─── 다국어 라벨 ─────────────────────────────────────────────────────────────
const LABELS: Record<string, {
  title: string; subtitle: string;
  email_placeholder: string; btn_send: string; btn_resend: string;
  sent_title: string; sent_desc: string; sent_hint: string;
  back: string; or_code: string; go_track: string;
  error_invalid: string; error_generic: string;
  already_logged_in: string;
}> = {
  ko: {
    title: '내 예약 확인',
    subtitle: '예약 시 입력한 이메일 주소를 입력하면\n로그인 링크를 보내드립니다.',
    email_placeholder: '이메일 주소 입력',
    btn_send: '로그인 링크 받기',
    btn_resend: '링크 재전송',
    sent_title: '메일함을 확인해주세요',
    sent_desc: '로 로그인 링크를 보냈습니다.\n5분 이내에 링크를 클릭해주세요.',
    sent_hint: '메일이 안 보이면 스팸함을 확인해주세요.',
    back: '이메일 변경',
    or_code: '예약 코드로 조회',
    go_track: '예약 코드로 바로 조회 →',
    error_invalid: '올바른 이메일 주소를 입력해주세요.',
    error_generic: '전송 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.',
    already_logged_in: '이미 로그인되어 있습니다.',
  },
  en: {
    title: 'My Reservations',
    subtitle: 'Enter the email you used when booking.\nWe\'ll send you a login link.',
    email_placeholder: 'Enter your email',
    btn_send: 'Send login link',
    btn_resend: 'Resend link',
    sent_title: 'Check your inbox',
    sent_desc: 'We sent a login link to\n. Click it within 5 minutes.',
    sent_hint: "Can't find it? Check your spam folder.",
    back: 'Change email',
    or_code: 'Use booking code instead',
    go_track: 'Look up by booking code →',
    error_invalid: 'Please enter a valid email address.',
    error_generic: 'Something went wrong. Please try again.',
    already_logged_in: 'You are already signed in.',
  },
  'zh-TW': {
    title: '我的預訂',
    subtitle: '輸入您預訂時使用的電子郵件地址\n我們將發送登入連結給您',
    email_placeholder: '輸入電子郵件地址',
    btn_send: '發送登入連結',
    btn_resend: '重新發送',
    sent_title: '請確認您的信箱',
    sent_desc: '已將登入連結發送至\n請在5分鐘內點擊連結',
    sent_hint: '找不到郵件？請檢查垃圾郵件資料夾',
    back: '更改電子郵件',
    or_code: '使用預訂碼查詢',
    go_track: '用預訂碼直接查詢 →',
    error_invalid: '請輸入有效的電子郵件地址',
    error_generic: '發生錯誤，請稍後再試',
    already_logged_in: '您已登入',
  },
  'zh-HK': {
    title: '我的預訂',
    subtitle: '輸入您預訂時使用的電子郵件地址\n我們將發送登入連結給您',
    email_placeholder: '輸入電子郵件地址',
    btn_send: '發送登入連結',
    btn_resend: '重新發送',
    sent_title: '請確認您的信箱',
    sent_desc: '已將登入連結發送至\n請在5分鐘內點擊連結',
    sent_hint: '找不到郵件？請檢查垃圾郵件資料夾',
    back: '更改電子郵件',
    or_code: '使用預訂碼查詢',
    go_track: '用預訂碼直接查詢 →',
    error_invalid: '請輸入有效的電子郵件地址',
    error_generic: '發生錯誤，請稍後再試',
    already_logged_in: '您已登入',
  },
  zh: {
    title: '我的预订',
    subtitle: '输入您预订时使用的电子邮件地址\n我们将发送登录链接给您',
    email_placeholder: '输入电子邮件地址',
    btn_send: '发送登录链接',
    btn_resend: '重新发送',
    sent_title: '请查看您的邮箱',
    sent_desc: '已将登录链接发送至\n请在5分钟内点击链接',
    sent_hint: '找不到邮件？请检查垃圾邮件文件夹',
    back: '更改电子邮件',
    or_code: '使用预订码查询',
    go_track: '用预订码直接查询 →',
    error_invalid: '请输入有效的电子邮件地址',
    error_generic: '发生错误，请稍后再试',
    already_logged_in: '您已登录',
  },
  ja: {
    title: '予約確認',
    subtitle: '予約時に入力したメールアドレスを入力してください\nログインリンクをお送りします',
    email_placeholder: 'メールアドレスを入力',
    btn_send: 'ログインリンクを受け取る',
    btn_resend: '再送信',
    sent_title: 'メールボックスをご確認ください',
    sent_desc: 'にログインリンクをお送りしました\n5分以内にリンクをクリックしてください',
    sent_hint: 'メールが見つからない場合は迷惑メールフォルダをご確認ください',
    back: 'メールアドレスを変更',
    or_code: '予約コードで照会',
    go_track: '予約コードで直接照会 →',
    error_invalid: '有効なメールアドレスを入力してください',
    error_generic: 'エラーが発生しました。しばらくしてからお試しください',
    already_logged_in: 'すでにログインしています',
  },
};

// ─── 이메일 유효성 검사 ───────────────────────────────────────────────────────
const isValidEmail = (email: string) =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());

const RESEND_COOLDOWN_SEC = 30;

const MyLoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { urlLang } = useParams<{ urlLang: string }>();
  const lang = urlLang ?? 'ko';
  const t = LABELS[lang] ?? LABELS.en;

  const [email, setEmail] = useState('');
  const [step, setStep] = useState<'input' | 'sent'>('input');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [cooldown, setCooldown] = useState(0);

  // 이미 로그인된 경우 예약 목록으로 바로 이동
  useEffect(() => {
    if (auth.currentUser) {
      navigate(`/${lang}/my/reservations`, { replace: true });
    }
  }, [lang, navigate]);

  // 재전송 쿨다운 타이머
  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => setCooldown((c) => c - 1), 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  const handleSend = async () => {
    const trimmedEmail = email.trim();
    if (!isValidEmail(trimmedEmail)) {
      setError(t.error_invalid);
      return;
    }
    setError('');
    setLoading(true);
    try {
      const nextParam = new URLSearchParams(window.location.search).get('next');
      const dest = nextParam ? `${lang}/${nextParam}` : `${lang}/my/reservations`;
      const redirectTo = `${window.location.origin}/${dest}`;
      await signInWithMagicLink(trimmedEmail, redirectTo);
      setStep('sent');
      setCooldown(RESEND_COOLDOWN_SEC);
    } catch {
      setError(t.error_generic);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F9F9F7] flex flex-col">
      {/* 헤더 */}
      <header className="bg-white border-b border-black/5 px-6 h-14 flex items-center">
        <button
          onClick={() => navigate(`/${lang}`)}
          className="flex items-center gap-2 text-bee-black/40 hover:text-bee-black transition-colors text-sm font-bold"
        >
          <span className="text-bee-yellow font-black text-base tracking-[0.15em]">BEELIBER</span>
        </button>
      </header>

      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          {/* 로고 뱃지 */}
          <div className="flex justify-center mb-8">
            <div className="w-16 h-16 bg-bee-yellow rounded-[1.5rem] flex items-center justify-center shadow-lg shadow-bee-yellow/30">
              <span className="text-3xl">🐝</span>
            </div>
          </div>

          <AnimatePresence mode="wait">
            {step === 'input' ? (
              <motion.div
                key="input"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -16 }}
                transition={{ duration: 0.2 }}
              >
                <h1 className="text-2xl font-black text-bee-black text-center tracking-tight mb-2">
                  {t.title}
                </h1>
                <p className="text-sm text-bee-black/50 text-center leading-relaxed mb-8 whitespace-pre-line">
                  {t.subtitle}
                </p>

                <div className="bg-white rounded-2xl p-6 shadow-sm border border-black/5">
                  <div className="mb-4">
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => { setEmail(e.target.value); setError(''); }}
                      onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                      placeholder={t.email_placeholder}
                      autoComplete="email"
                      className="w-full px-4 py-3.5 rounded-xl border-2 border-black/8 bg-[#F9F9F7] text-bee-black font-bold text-sm placeholder:text-black/25 focus:outline-none focus:border-bee-yellow transition-colors"
                    />
                    {error && (
                      <p className="mt-2 text-red-500 text-xs font-bold">{error}</p>
                    )}
                  </div>

                  <motion.button
                    onClick={handleSend}
                    disabled={loading || !email.trim()}
                    whileTap={{ scale: 0.98 }}
                    className="w-full py-4 rounded-xl bg-bee-black text-bee-yellow font-black text-sm tracking-wide disabled:opacity-40 disabled:cursor-not-allowed transition-opacity"
                  >
                    {loading ? (
                      <span className="flex items-center justify-center gap-2">
                        <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                        </svg>
                        전송 중...
                      </span>
                    ) : t.btn_send}
                  </motion.button>
                </div>

                {/* 예약코드 조회 링크 */}
                <div className="mt-6 text-center">
                  <button
                    onClick={() => navigate(`/${lang}/tracking`)}
                    className="text-sm text-bee-black/40 hover:text-bee-black transition-colors font-bold"
                  >
                    {t.go_track}
                  </button>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="sent"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -16 }}
                transition={{ duration: 0.2 }}
              >
                {/* 전송 완료 */}
                <div className="bg-white rounded-2xl p-8 shadow-sm border border-black/5 text-center">
                  <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-5">
                    <svg className="w-7 h-7 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <h2 className="text-xl font-black text-bee-black mb-3">{t.sent_title}</h2>
                  <p className="text-sm text-bee-black/60 leading-relaxed mb-1">
                    <span className="font-bold text-bee-black">{email}</span>
                    {t.sent_desc.split('\n')[1] ?? ''}
                  </p>
                  <p className="text-xs text-bee-black/35 mt-4">{t.sent_hint}</p>

                  {/* 재전송 */}
                  <div className="mt-6 flex flex-col gap-2">
                    <button
                      onClick={handleSend}
                      disabled={cooldown > 0 || loading}
                      className="w-full py-3.5 rounded-xl bg-bee-yellow text-bee-black font-black text-sm disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
                    >
                      {cooldown > 0 ? `${t.btn_resend} (${cooldown}s)` : t.btn_resend}
                    </button>
                    <button
                      onClick={() => { setStep('input'); setError(''); setCooldown(0); }}
                      className="w-full py-3 rounded-xl text-bee-black/40 font-bold text-sm hover:text-bee-black transition-colors"
                    >
                      {t.back}
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
};

export default MyLoginPage;
