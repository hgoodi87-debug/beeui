/**
 * KioskPage — 현장 키오스크 독립 페이지
 * URL: /kiosk/:branchSlug
 * - 인증 불필요, 전체화면 태블릿 최적화
 * - 오프라인 큐, 배송 연계 CTA, 어드민 패널
 */
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  KioskBranch,
  KioskCfg,
  KioskStorageLog,
  DEFAULT_CFG,
  loadBranchBySlug,
  loadSettings,
  loadTodayLog,
  insertStorageLog,
  updateStorageLog,
  assignTagAndRow,
  calcPrice,
  flushOfflineQueue,
  getOfflineQueueSize,
  todayStr,
  timeStr,
  addHours,
} from '../services/kioskDb';

// ─── i18n ─────────────────────────────────────────────────────────────────
type Lang = 'ko' | 'en' | 'zh';
const LABELS: Record<Lang, Record<string, string>> = {
  ko: {
    title: '짐 보관 접수',
    step_bags: '짐 수량',
    step_dur: '보관 시간',
    step_confirm: '접수 확인',
    small: '소형 가방',
    small_desc: '토트백 · 소형 배낭 · 소형 캐리어',
    carrier: '대형 캐리어',
    carrier_desc: '여행용 캐리어 · 큰 가방',
    duration: '시간',
    start: '보관 시작',
    pickup: '픽업 예정',
    total: '합계',
    submit: '접수하기',
    cancel: '취소',
    confirm: '확인하였습니다',
    success: '접수 완료!',
    tag: '태그',
    zone: '구역',
    next: '다음',
    back: '이전',
    payment_cash: '현금',
    payment_card: '카드',
    payment_pending: '미수금',
    select_payment: '결제 방법',
    delivery_title: '공항까지 배송해드릴까요?',
    delivery_desc: '지금 예약하면 짐을 공항으로 직접 보내드려요.',
    delivery_btn: '배송 예약하기',
    delivery_skip: '괜찮아요',
    notice_title: '안내사항',
    admin_title: '관리자 모드',
    admin_password: '비밀번호',
    admin_enter: '입장',
    admin_wrong: '비밀번호가 틀렸습니다',
    today_log: '오늘 접수 현황',
    offline_warn: '오프라인 상태입니다',
    offline_queued: '건 대기 중',
    syncing: '동기화 중...',
    synced: '동기화 완료',
    done: '반납 완료',
    mark_done: '반납 처리',
    no_bags: '짐을 입력해주세요',
    max_bags: '최대 {max}개까지 가능합니다',
    from_4h: '4시간부터 보관 가능합니다',
    select_dur: '보관 시간을 선택해주세요',
    pcs: '개',
    loading: '로딩 중...',
    not_found: '지점을 찾을 수 없습니다',
    free: '무료',
    discount: '할인',
  },
  en: {
    title: 'Luggage Storage',
    step_bags: 'Bags',
    step_dur: 'Duration',
    step_confirm: 'Confirm',
    small: 'Small Bag',
    small_desc: 'Tote · Backpack · Small Carry-on',
    carrier: 'Large Suitcase',
    carrier_desc: 'Travel suitcase · Large luggage',
    duration: 'hr',
    start: 'Start',
    pickup: 'Pickup',
    total: 'Total',
    submit: 'Check In',
    cancel: 'Cancel',
    confirm: 'I Agree',
    success: 'Check-in Complete!',
    tag: 'Tag',
    zone: 'Zone',
    next: 'Next',
    back: 'Back',
    payment_cash: 'Cash',
    payment_card: 'Card',
    payment_pending: 'Unpaid',
    select_payment: 'Payment',
    delivery_title: 'Need airport delivery?',
    delivery_desc: 'We deliver your luggage directly to the airport.',
    delivery_btn: 'Book Delivery',
    delivery_skip: 'No thanks',
    notice_title: 'Notice',
    admin_title: 'Admin Mode',
    admin_password: 'Password',
    admin_enter: 'Enter',
    admin_wrong: 'Wrong password',
    today_log: "Today's Log",
    offline_warn: 'You are offline',
    offline_queued: 'pending',
    syncing: 'Syncing...',
    synced: 'Synced',
    done: 'Returned',
    mark_done: 'Mark Returned',
    no_bags: 'Please enter bag count',
    max_bags: 'Max {max} bags allowed',
    from_4h: 'Minimum 4 hours for small bags',
    select_dur: 'Please select duration',
    pcs: '',
    loading: 'Loading...',
    not_found: 'Branch not found',
    free: 'Free',
    discount: 'Discount',
  },
  zh: {
    title: '行李寄存',
    step_bags: '行李数量',
    step_dur: '存放时间',
    step_confirm: '确认',
    small: '小型行李',
    small_desc: '手提包 · 背包 · 小型拉杆箱',
    carrier: '大型行李箱',
    carrier_desc: '旅行箱 · 大型行李',
    duration: '小时',
    start: '开始',
    pickup: '取件',
    total: '合计',
    submit: '办理存放',
    cancel: '取消',
    confirm: '我已确认',
    success: '办理完成！',
    tag: '标签',
    zone: '区域',
    next: '下一步',
    back: '返回',
    payment_cash: '现金',
    payment_card: '刷卡',
    payment_pending: '未付款',
    select_payment: '付款方式',
    delivery_title: '需要机场配送吗？',
    delivery_desc: '我们将您的行李直接送到机场。',
    delivery_btn: '预约配送',
    delivery_skip: '不需要',
    notice_title: '注意事项',
    admin_title: '管理员模式',
    admin_password: '密码',
    admin_enter: '进入',
    admin_wrong: '密码错误',
    today_log: '今日接待记录',
    offline_warn: '当前离线',
    offline_queued: '条等待同步',
    syncing: '同步中...',
    synced: '已同步',
    done: '已取件',
    mark_done: '标记已取件',
    no_bags: '请输入行李数量',
    max_bags: '最多 {max} 件',
    from_4h: '小行李最少存放4小时',
    select_dur: '请选择存放时间',
    pcs: '件',
    loading: '加载中...',
    not_found: '未找到该分店',
    free: '免费',
    discount: '折扣',
  },
};

// ─── 단계 ─────────────────────────────────────────────────────────────────
type Step = 'bags' | 'duration' | 'confirm' | 'success' | 'delivery';

// ─── 결제 방법 ────────────────────────────────────────────────────────────
type PaymentMethod = '현금' | '카드' | '미수금';

// ─── 헬퍼 컴포넌트 ────────────────────────────────────────────────────────
const StepDot: React.FC<{ active: boolean; done: boolean }> = ({ active, done }) => (
  <div className={`w-3 h-3 rounded-full transition-all duration-300 ${
    done ? 'bg-bee-yellow' : active ? 'bg-bee-black' : 'bg-gray-300'
  }`} />
);

const CounterBtn: React.FC<{
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
  label: string;
  sub: string;
}> = ({ value, onChange, min = 0, max = 9, label, sub }) => (
  <div className="flex items-center justify-between bg-white rounded-[24px] p-6 shadow-sm border border-gray-100">
    <div>
      <p className="text-bee-black font-black text-lg leading-tight">{label}</p>
      <p className="text-gray-400 text-sm mt-0.5">{sub}</p>
    </div>
    <div className="flex items-center gap-5">
      <button
        onClick={() => onChange(Math.max(min, value - 1))}
        className="w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center text-2xl font-black text-bee-black active:scale-95 transition-transform select-none"
      >−</button>
      <span className="text-3xl font-black text-bee-black w-8 text-center">{value}</span>
      <button
        onClick={() => onChange(Math.min(max, value + 1))}
        className="w-14 h-14 rounded-full bg-bee-yellow flex items-center justify-center text-2xl font-black text-bee-black active:scale-95 transition-transform select-none"
      >+</button>
    </div>
  </div>
);

// ─── 메인 컴포넌트 ────────────────────────────────────────────────────────
const KioskPage: React.FC = () => {
  const { branchSlug } = useParams<{ branchSlug: string }>();
  const navigate = useNavigate();

  // Branch & config
  const [branch, setBranch] = useState<KioskBranch | null>(null);
  const [cfg, setCfg] = useState<KioskCfg>(DEFAULT_CFG);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  // Checkin state
  const [lang, setLang] = useState<Lang>('ko');
  const [step, setStep] = useState<Step>('bags');
  const [smallQty, setSmallQty] = useState(0);
  const [carrierQty, setCarrierQty] = useState(0);
  const [duration, setDuration] = useState(0);
  const [payment, setPayment] = useState<PaymentMethod>('현금');
  const [discount, setDiscount] = useState(0);

  // Result
  const [resultTag, setResultTag] = useState(0);
  const [resultRow, setResultRow] = useState('A');
  const [resultEntry, setResultEntry] = useState<KioskStorageLog | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Today's log
  const [todayLog, setTodayLog] = useState<KioskStorageLog[]>([]);

  // Online/offline
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [offlineCount, setOfflineCount] = useState(getOfflineQueueSize());
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'done'>('idle');

  // Admin mode
  const [showAdmin, setShowAdmin] = useState(false);
  const [adminPw, setAdminPw] = useState('');
  const [adminUnlocked, setAdminUnlocked] = useState(false);
  const [adminError, setAdminError] = useState(false);

  // Long-press to open admin (5 fingers or 3s hold on logo)
  const logoLongPressRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const t = LABELS[lang];

  // ── 초기 로딩 ────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!branchSlug) { setNotFound(true); setLoading(false); return; }
    const slug = decodeURIComponent(branchSlug);

    (async () => {
      const b = await loadBranchBySlug(slug);
      if (!b) { setNotFound(true); setLoading(false); return; }
      setBranch(b);

      const settings = await loadSettings(b.branch_id ?? 'default');
      setCfg(settings);

      const today = todayStr();
      const entries = await loadTodayLog(b.branch_id ?? slug, today);
      setTodayLog(entries);
      setLoading(false);
    })();
  }, [branchSlug]);

  // ── 온라인/오프라인 감지 + 큐 플러시 ────────────────────────────────────
  useEffect(() => {
    const handleOnline = async () => {
      setIsOnline(true);
      const cnt = getOfflineQueueSize();
      if (cnt > 0) {
        setSyncStatus('syncing');
        await flushOfflineQueue();
        setOfflineCount(getOfflineQueueSize());
        setSyncStatus('done');
        setTimeout(() => setSyncStatus('idle'), 3000);
      }
    };
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // ── 로고 롱프레스 어드민 ─────────────────────────────────────────────────
  const handleLogoPointerDown = () => {
    logoLongPressRef.current = setTimeout(() => {
      setShowAdmin(true);
    }, 3000);
  };
  const handleLogoPointerUp = () => {
    if (logoLongPressRef.current) clearTimeout(logoLongPressRef.current);
  };

  // ── 가격 계산 ─────────────────────────────────────────────────────────────
  const originalPrice = calcPrice(smallQty, carrierQty, duration, cfg.prices);
  const finalPrice = Math.max(0, originalPrice - discount);

  // ── 접수 제출 ─────────────────────────────────────────────────────────────
  const handleSubmit = useCallback(async () => {
    if (!branch) return;
    setSubmitting(true);

    const today = todayStr();
    const startTime = timeStr();
    const pickupTime = addHours(startTime, duration);
    const pickupTs = Date.now() + duration * 60 * 60 * 1000;

    const currentLog = await loadTodayLog(branch.branch_id ?? branch.slug, today);
    const { tag, rowLabel } = assignTagAndRow(currentLog, cfg);

    const payload = {
      branch_id: branch.branch_id ?? branch.slug,
      date: today,
      tag,
      small_qty: smallQty,
      carrier_qty: carrierQty,
      start_time: startTime,
      pickup_time: pickupTime,
      pickup_ts: pickupTs,
      duration,
      original_price: originalPrice,
      discount,
      payment,
      done: false,
      memo: '',
      row_label: rowLabel,
      source: 'kiosk' as const,
      commission_rate: 0,
    };

    const inserted = await insertStorageLog(payload);
    setResultTag(tag);
    setResultRow(rowLabel);
    setResultEntry(inserted);
    setTodayLog((prev) => [...prev, { ...payload, id: tag, created_at: new Date().toISOString() }]);
    setOfflineCount(getOfflineQueueSize());
    setSubmitting(false);
    setStep('success');
  }, [branch, cfg, smallQty, carrierQty, duration, originalPrice, discount, payment]);

  // ── 초기화 ────────────────────────────────────────────────────────────────
  const resetForm = () => {
    setStep('bags');
    setSmallQty(0);
    setCarrierQty(0);
    setDuration(0);
    setPayment('현금');
    setDiscount(0);
    setResultTag(0);
    setResultRow('A');
    setResultEntry(null);
  };

  // ── 어드민 로그인 ─────────────────────────────────────────────────────────
  const handleAdminLogin = () => {
    if (adminPw === cfg.admin_password) {
      setAdminUnlocked(true);
      setAdminError(false);
    } else {
      setAdminError(true);
    }
  };

  // ── 반납 처리 ─────────────────────────────────────────────────────────────
  const handleMarkDone = async (entry: KioskStorageLog) => {
    if (entry.id) {
      await updateStorageLog(entry.id, { done: true });
    }
    setTodayLog((prev) =>
      prev.map((e) => (e.tag === entry.tag && e.date === entry.date ? { ...e, done: true } : e))
    );
  };

  // ── QR 코드 URL (무료 API) ────────────────────────────────────────────────
  const deliveryUrl = `${window.location.origin}/ko/booking?from=kiosk&pickup=${branch?.branch_id ?? ''}&bags=${smallQty}&carriers=${carrierQty}&kiosk_tag=${resultTag}`;
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?data=${encodeURIComponent(deliveryUrl)}&size=200x200&bgcolor=ffffff&color=111111&margin=10`;

  // ─── 렌더링 ──────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen bg-bee-black flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-bee-yellow/20 border-t-bee-yellow rounded-full animate-spin" />
          <p className="text-white/50 text-sm tracking-widest">{t.loading}</p>
        </div>
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="min-h-screen bg-bee-black flex items-center justify-center text-center px-8">
        <div>
          <p className="text-6xl mb-4">🐝</p>
          <p className="text-white text-2xl font-black mb-2">{t.not_found}</p>
          <p className="text-white/40 text-sm">/{branchSlug}</p>
        </div>
      </div>
    );
  }

  // ─── 어드민 패널 (오버레이) ────────────────────────────────────────────────
  const AdminPanel = () => (
    <div className="fixed inset-0 z-50 bg-bee-black/95 backdrop-blur-sm overflow-y-auto">
      <div className="max-w-2xl mx-auto p-6 pt-8">
        {/* 헤더 */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-white font-black text-xl">{t.admin_title}</h2>
          <button
            onClick={() => { setShowAdmin(false); setAdminUnlocked(false); setAdminPw(''); setAdminError(false); }}
            className="text-white/40 hover:text-white text-2xl leading-none"
          >✕</button>
        </div>

        {!adminUnlocked ? (
          /* 비밀번호 입력 */
          <div className="flex flex-col items-center gap-4 mt-20">
            <p className="text-white/60 text-sm">{t.admin_password}</p>
            <input
              type="password"
              value={adminPw}
              onChange={(e) => setAdminPw(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAdminLogin()}
              className="bg-white/10 border border-white/20 rounded-2xl px-6 py-4 text-white text-center text-2xl tracking-[0.3em] w-48 focus:outline-none focus:border-bee-yellow"
              maxLength={8}
              autoFocus
            />
            {adminError && <p className="text-red-400 text-sm">{t.admin_wrong}</p>}
            <button
              onClick={handleAdminLogin}
              className="bg-bee-yellow text-bee-black font-black px-10 py-3 rounded-full text-sm mt-2 active:scale-95 transition-transform"
            >
              {t.admin_enter}
            </button>
          </div>
        ) : (
          /* 오늘 현황 */
          <div>
            {/* 동기화 상태 */}
            {offlineCount > 0 && (
              <div className="bg-orange-500/20 border border-orange-500/40 rounded-2xl p-4 mb-4 text-orange-300 text-sm">
                <i className="fa-solid fa-triangle-exclamation mr-2" />
                {offlineCount} {t.offline_queued}
              </div>
            )}
            <h3 className="text-white/60 text-xs font-bold uppercase tracking-widest mb-3">{t.today_log}</h3>
            <div className="space-y-2">
              {todayLog.length === 0 && (
                <p className="text-white/30 text-sm text-center py-8">No entries today</p>
              )}
              {todayLog.map((e, i) => (
                <div key={i} className={`flex items-center gap-3 p-4 rounded-2xl ${e.done ? 'bg-white/5 opacity-60' : 'bg-white/10'}`}>
                  <span className="w-10 h-10 rounded-full bg-bee-yellow flex items-center justify-center text-bee-black font-black text-lg flex-shrink-0">
                    {e.tag}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm font-bold">
                      {e.row_label} · {e.small_qty > 0 ? `소형 ${e.small_qty}` : ''}{e.carrier_qty > 0 ? ` 캐리어 ${e.carrier_qty}` : ''}
                    </p>
                    <p className="text-white/40 text-xs">{e.start_time} → {e.pickup_time} · {e.original_price.toLocaleString()}원</p>
                  </div>
                  {!e.done && (
                    <button
                      onClick={() => handleMarkDone(e)}
                      className="text-bee-yellow text-xs font-bold border border-bee-yellow/40 rounded-full px-3 py-1.5 active:scale-95 transition-transform flex-shrink-0"
                    >
                      {t.mark_done}
                    </button>
                  )}
                  {e.done && <span className="text-green-400 text-xs font-bold flex-shrink-0">{t.done}</span>}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );

  // ─── Success 화면 ─────────────────────────────────────────────────────────
  if (step === 'success') {
    return (
      <div className="min-h-screen bg-bee-black flex flex-col items-center justify-center px-6 py-10">
        {showAdmin && <AdminPanel />}

        {/* 성공 배지 */}
        <div className="flex flex-col items-center gap-6 mb-10">
          <div className="w-20 h-20 rounded-full bg-bee-yellow flex items-center justify-center">
            <i className="fa-solid fa-check text-bee-black text-3xl" />
          </div>
          <h1 className="text-white font-black text-3xl text-center">{t.success}</h1>
          <div className="flex gap-6">
            <div className="text-center">
              <p className="text-white/40 text-xs uppercase tracking-widest mb-1">{t.tag}</p>
              <p className="text-bee-yellow font-black text-5xl">{resultTag}</p>
            </div>
            <div className="w-px bg-white/10" />
            <div className="text-center">
              <p className="text-white/40 text-xs uppercase tracking-widest mb-1">{t.zone}</p>
              <p className="text-white font-black text-5xl">{resultRow}</p>
            </div>
          </div>
          {/* 요약 */}
          <div className="bg-white/10 rounded-2xl px-8 py-4 text-center">
            <p className="text-white/60 text-sm">
              {timeStr()} → {addHours(timeStr(), duration)} · {(finalPrice).toLocaleString()}원
            </p>
          </div>
        </div>

        {/* 배송 CTA */}
        <div className="w-full max-w-sm bg-white/10 border border-white/20 rounded-[28px] p-6 mb-8">
          <h3 className="text-white font-black text-lg mb-1">{t.delivery_title}</h3>
          <p className="text-white/50 text-sm mb-5">{t.delivery_desc}</p>
          <div className="flex gap-3">
            <button
              onClick={() => navigate(`/ko/booking?from=kiosk&pickup=${branch?.branch_id ?? ''}&bags=${smallQty}&carriers=${carrierQty}&kiosk_tag=${resultTag}`)}
              className="flex-1 bg-bee-yellow text-bee-black font-black py-4 rounded-full text-sm active:scale-95 transition-transform"
            >
              <i className="fa-solid fa-plane mr-2" />{t.delivery_btn}
            </button>
            <button
              onClick={resetForm}
              className="flex-1 bg-white/10 text-white/60 font-bold py-4 rounded-full text-sm active:scale-95 transition-transform"
            >
              {t.delivery_skip}
            </button>
          </div>
        </div>

        {/* QR 코드 */}
        <div className="flex flex-col items-center gap-2 mb-8">
          <img src={qrUrl} alt="QR" className="w-32 h-32 rounded-xl" />
          <p className="text-white/30 text-xs">배송 예약 QR</p>
        </div>

        {/* 새 접수 */}
        <button
          onClick={resetForm}
          className="text-white/40 text-sm underline underline-offset-4"
        >
          새로 접수하기
        </button>

        {/* 온라인 상태 */}
        <div className="absolute top-4 right-4 flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${isOnline ? 'bg-green-400' : 'bg-red-400'}`} />
          {syncStatus === 'syncing' && <p className="text-white/40 text-xs">{t.syncing}</p>}
          {syncStatus === 'done' && <p className="text-green-400 text-xs">{t.synced}</p>}
        </div>
      </div>
    );
  }

  // ─── 접수 폼 ──────────────────────────────────────────────────────────────
  const steps: Step[] = ['bags', 'duration', 'confirm'];
  const stepIdx = steps.indexOf(step);

  const canNext = (() => {
    if (step === 'bags') return smallQty + carrierQty > 0;
    if (step === 'duration') return duration > 0;
    return true;
  })();

  const handleNext = () => {
    if (step === 'bags') setStep('duration');
    else if (step === 'duration') setStep('confirm');
    else if (step === 'confirm') handleSubmit();
  };

  const handleBack = () => {
    if (step === 'duration') setStep('bags');
    else if (step === 'confirm') setStep('duration');
  };

  const paymentOptions: { value: PaymentMethod; label: string }[] = [
    { value: '현금', label: t.payment_cash },
    { value: '카드', label: t.payment_card },
    { value: '미수금', label: t.payment_pending },
  ];

  return (
    <div className="min-h-screen bg-[#f5f5f5] flex flex-col">
      {showAdmin && <AdminPanel />}

      {/* 헤더 */}
      <header className="bg-bee-black px-6 pt-safe-top pb-4">
        <div className="flex items-center justify-between">
          {/* 로고 (롱프레스 → 어드민) */}
          <button
            onPointerDown={handleLogoPointerDown}
            onPointerUp={handleLogoPointerUp}
            onPointerLeave={handleLogoPointerUp}
            className="select-none"
          >
            <p className="text-bee-yellow font-black text-base tracking-[0.15em]">BEELIBER</p>
            <p className="text-white/40 text-xs">
              {lang === 'ko' ? branch?.branch_name : branch?.branch_name_en ?? branch?.branch_name}
            </p>
          </button>

          {/* 언어 선택 */}
          <div className="flex gap-1">
            {(['ko', 'en', 'zh'] as Lang[]).map((l) => (
              <button
                key={l}
                onClick={() => setLang(l)}
                className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
                  lang === l
                    ? 'bg-bee-yellow text-bee-black'
                    : 'text-white/40 hover:text-white'
                }`}
              >
                {l === 'ko' ? '한' : l === 'en' ? 'EN' : '中'}
              </button>
            ))}
          </div>
        </div>

        {/* 스텝 인디케이터 */}
        <div className="flex items-center gap-2 mt-4">
          {steps.map((s, i) => (
            <React.Fragment key={s}>
              <StepDot active={i === stepIdx} done={i < stepIdx} />
              {i < steps.length - 1 && (
                <div className={`flex-1 h-px ${i < stepIdx ? 'bg-bee-yellow' : 'bg-white/20'}`} />
              )}
            </React.Fragment>
          ))}
        </div>
        <p className="text-white/40 text-xs mt-2 font-bold uppercase tracking-widest">
          {step === 'bags' ? t.step_bags : step === 'duration' ? t.step_dur : t.step_confirm}
        </p>
      </header>

      {/* 오프라인 배너 */}
      {!isOnline && (
        <div className="bg-orange-500 px-6 py-2 flex items-center gap-2">
          <i className="fa-solid fa-wifi-slash text-white text-sm" />
          <p className="text-white text-sm font-bold">{t.offline_warn}</p>
          {offlineCount > 0 && <p className="text-white/70 text-xs ml-1">({offlineCount} {t.offline_queued})</p>}
        </div>
      )}

      {/* 메인 콘텐츠 */}
      <main className="flex-1 px-4 py-6 max-w-lg mx-auto w-full flex flex-col gap-4">

        {/* ── Step 1: 짐 수량 ─────────────────────────────────────────────── */}
        {step === 'bags' && (
          <>
            <CounterBtn
              value={smallQty}
              onChange={setSmallQty}
              max={cfg.operations.max_bags}
              label={t.small}
              sub={t.small_desc}
            />
            <CounterBtn
              value={carrierQty}
              onChange={setCarrierQty}
              max={cfg.operations.max_bags}
              label={t.carrier}
              sub={t.carrier_desc}
            />

            {/* 안내사항 */}
            {cfg.notices[lang]?.length > 0 && (
              <div className="bg-white rounded-[20px] p-5 border border-gray-100 shadow-sm">
                <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-3">{t.notice_title}</p>
                <ul className="space-y-1.5">
                  {cfg.notices[lang].map((n, i) => (
                    <li key={i} className="text-sm text-gray-600 flex items-start gap-2">
                      <span className="text-bee-yellow mt-0.5">•</span>{n}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </>
        )}

        {/* ── Step 2: 보관 시간 ────────────────────────────────────────────── */}
        {step === 'duration' && (
          <>
            <div className="bg-white rounded-[24px] p-6 shadow-sm border border-gray-100">
              <p className="text-bee-black font-black text-sm mb-4 uppercase tracking-widest">{t.step_dur}</p>
              <div className="grid grid-cols-3 gap-3">
                {cfg.operations.duration_options.map((h) => {
                  const isDisabled = smallQty > 0 && carrierQty === 0 && h < 4;
                  const isSelected = duration === h;
                  return (
                    <button
                      key={h}
                      disabled={isDisabled}
                      onClick={() => setDuration(h)}
                      className={`py-5 rounded-2xl font-black text-lg transition-all active:scale-95 ${
                        isSelected
                          ? 'bg-bee-black text-white shadow-lg'
                          : isDisabled
                          ? 'bg-gray-100 text-gray-300 cursor-not-allowed'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {h}<span className="text-sm font-bold ml-0.5">{t.duration}</span>
                    </button>
                  );
                })}
              </div>
              {smallQty > 0 && carrierQty === 0 && (
                <p className="text-orange-500 text-xs mt-3 text-center">{t.from_4h}</p>
              )}
            </div>

            {/* 가격 미리보기 */}
            {duration > 0 && (
              <div className="bg-white rounded-[24px] p-5 shadow-sm border border-gray-100 flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-xs font-bold uppercase tracking-wide mb-1">{t.total}</p>
                  <p className="text-bee-black font-black text-2xl">{originalPrice.toLocaleString()}원</p>
                </div>
                <p className="text-gray-400 text-sm">
                  {smallQty > 0 && `소형 ${smallQty}${t.pcs}`}
                  {smallQty > 0 && carrierQty > 0 && ' · '}
                  {carrierQty > 0 && `캐리어 ${carrierQty}${t.pcs}`}
                  <br />
                  {duration}{t.duration}
                </p>
              </div>
            )}
          </>
        )}

        {/* ── Step 3: 접수 확인 ────────────────────────────────────────────── */}
        {step === 'confirm' && (
          <>
            {/* 요약 카드 */}
            <div className="bg-white rounded-[24px] p-6 shadow-sm border border-gray-100">
              <p className="text-bee-black font-black text-sm mb-4 uppercase tracking-widest">{t.step_confirm}</p>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">{t.small}</span>
                  <span className="font-bold">{smallQty}{t.pcs}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">{t.carrier}</span>
                  <span className="font-bold">{carrierQty}{t.pcs}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">{t.step_dur}</span>
                  <span className="font-bold">{duration}{t.duration}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">{t.start}</span>
                  <span className="font-bold">{timeStr()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">{t.pickup}</span>
                  <span className="font-bold">{addHours(timeStr(), duration)}</span>
                </div>
                <div className="border-t border-gray-100 pt-3 flex justify-between">
                  <span className="text-gray-400">{t.total}</span>
                  <span className="font-black text-bee-black text-lg">{originalPrice.toLocaleString()}원</span>
                </div>
              </div>
            </div>

            {/* 결제 방법 */}
            <div className="bg-white rounded-[24px] p-5 shadow-sm border border-gray-100">
              <p className="text-gray-400 text-xs font-bold uppercase tracking-widest mb-3">{t.select_payment}</p>
              <div className="flex gap-3">
                {paymentOptions.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => setPayment(opt.value)}
                    className={`flex-1 py-4 rounded-2xl font-bold text-sm transition-all active:scale-95 ${
                      payment === opt.value
                        ? 'bg-bee-black text-white'
                        : 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* 할인 */}
            {cfg.discount.unit > 0 && (
              <div className="bg-white rounded-[24px] p-5 shadow-sm border border-gray-100">
                <p className="text-gray-400 text-xs font-bold uppercase tracking-widest mb-3">{t.discount}</p>
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => setDiscount((d) => Math.max(0, d - cfg.discount.unit))}
                    className="w-12 h-12 rounded-full bg-gray-100 text-bee-black font-black text-xl active:scale-95 transition-transform"
                  >−</button>
                  <span className="flex-1 text-center font-black text-bee-black text-xl">
                    {discount.toLocaleString()}원
                  </span>
                  <button
                    onClick={() => {
                      const maxDiscount = cfg.discount.allow_free ? originalPrice : originalPrice - cfg.discount.unit;
                      setDiscount((d) => Math.min(maxDiscount, d + cfg.discount.unit));
                    }}
                    className="w-12 h-12 rounded-full bg-bee-yellow text-bee-black font-black text-xl active:scale-95 transition-transform"
                  >+</button>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between mt-3 pt-3 border-t border-gray-100">
                    <span className="text-gray-400 text-sm">{t.total}</span>
                    <span className="font-black text-bee-black">{finalPrice.toLocaleString()}원</span>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </main>

      {/* 푸터 버튼 */}
      <footer className="px-4 pb-safe-bottom pb-6 pt-4 bg-white border-t border-gray-100 flex gap-3">
        {step !== 'bags' && (
          <button
            onClick={handleBack}
            className="w-14 h-14 rounded-full bg-gray-100 text-bee-black flex items-center justify-center active:scale-95 transition-transform"
          >
            <i className="fa-solid fa-arrow-left" />
          </button>
        )}
        <button
          disabled={!canNext || submitting}
          onClick={handleNext}
          className={`flex-1 py-4 rounded-full font-black text-base transition-all active:scale-95 ${
            canNext && !submitting
              ? 'bg-bee-black text-white shadow-lg'
              : 'bg-gray-200 text-gray-400 cursor-not-allowed'
          }`}
        >
          {submitting
            ? '...'
            : step === 'confirm'
            ? t.submit
            : t.next}
        </button>
      </footer>

      {/* 온라인 인디케이터 (우측 하단) */}
      <div className="fixed bottom-24 right-4 flex items-center gap-1.5 pointer-events-none">
        <div className={`w-2 h-2 rounded-full ${isOnline ? 'bg-green-400' : 'bg-red-400 animate-pulse'}`} />
        {syncStatus === 'syncing' && <p className="text-gray-500 text-[10px]">{t.syncing}</p>}
      </div>
    </div>
  );
};

export default KioskPage;
