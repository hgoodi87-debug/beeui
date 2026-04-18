import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { auth, getActiveCustomerAccessToken, CustomerAuthUser } from '../firebaseApp';
import { supabaseGet } from '../services/supabaseClient';

// ─── 타입 ─────────────────────────────────────────────────────────────────────
interface BookingRow {
  id: string;
  reservation_code: string | null;
  user_name: string | null;
  user_email: string | null;
  service_type: string | null;
  pickup_date: string | null;
  pickup_time: string | null;
  pickup_location: string | null;
  dropoff_location: string | null;
  final_price: number | null;
  bags: number | null;
  settlement_status: string | null;
  ops_status: string | null;
  created_at: string;
}

// ─── 다국어 라벨 ─────────────────────────────────────────────────────────────
const LABELS: Record<string, {
  title: string; subtitle: string; loading: string;
  no_bookings: string; no_bookings_sub: string;
  service_storage: string; service_delivery: string;
  status_label: string; price_label: string; bags_label: string;
  pickup_label: string; dropoff_label: string; date_label: string;
  logout: string; go_booking: string; back: string;
  error_load: string; retry: string;
  status: Record<string, string>;
}> = {
  ko: {
    title: '내 예약',
    subtitle: '예약 내역을 확인할 수 있습니다.',
    loading: '불러오는 중...',
    no_bookings: '예약 내역이 없어요',
    no_bookings_sub: '빌리버로 첫 예약을 해보세요 🐝',
    service_storage: '짐 보관',
    service_delivery: '공항 배송',
    status_label: '상태',
    price_label: '결제 금액',
    bags_label: '짐',
    pickup_label: '보관 장소',
    dropoff_label: '배송지',
    date_label: '이용 일자',
    logout: '로그아웃',
    go_booking: '예약하러 가기',
    back: '홈으로',
    error_load: '예약 내역을 불러오지 못했습니다.',
    retry: '다시 시도',
    status: {
      PENDING: '접수 대기',
      CONFIRMED: '확정',
      PAID_OUT: '정산 완료',
      MONTHLY_INCLUDED: '월 정산 포함',
      ON_HOLD: '보류',
      CANCELLED: '취소',
      REFUNDED: '환불 완료',
      DELETED: '삭제됨',
    },
  },
  en: {
    title: 'My Reservations',
    subtitle: 'View your booking history.',
    loading: 'Loading...',
    no_bookings: 'No reservations yet',
    no_bookings_sub: 'Make your first booking with Beeliber 🐝',
    service_storage: 'Luggage Storage',
    service_delivery: 'Airport Delivery',
    status_label: 'Status',
    price_label: 'Amount',
    bags_label: 'Bags',
    pickup_label: 'Storage location',
    dropoff_label: 'Delivery destination',
    date_label: 'Date',
    logout: 'Sign out',
    go_booking: 'Make a booking',
    back: 'Back to home',
    error_load: 'Failed to load reservations.',
    retry: 'Try again',
    status: {
      PENDING: 'Pending',
      CONFIRMED: 'Confirmed',
      PAID_OUT: 'Settled',
      MONTHLY_INCLUDED: 'Monthly',
      ON_HOLD: 'On hold',
      CANCELLED: 'Cancelled',
      REFUNDED: 'Refunded',
      DELETED: 'Deleted',
    },
  },
  'zh-TW': {
    title: '我的預訂',
    subtitle: '查看您的預訂記錄',
    loading: '載入中...',
    no_bookings: '尚無預訂記錄',
    no_bookings_sub: '立即使用Beeliber進行第一次預訂 🐝',
    service_storage: '行李寄存',
    service_delivery: '機場配送',
    status_label: '狀態',
    price_label: '付款金額',
    bags_label: '行李',
    pickup_label: '寄存地點',
    dropoff_label: '配送目的地',
    date_label: '使用日期',
    logout: '登出',
    go_booking: '立即預訂',
    back: '返回首頁',
    error_load: '無法載入預訂記錄',
    retry: '重試',
    status: {
      PENDING: '待確認', CONFIRMED: '已確認', PAID_OUT: '已結算',
      MONTHLY_INCLUDED: '月結', ON_HOLD: '暫停', CANCELLED: '已取消',
      REFUNDED: '已退款', DELETED: '已刪除',
    },
  },
  'zh-HK': {
    title: '我的預訂',
    subtitle: '查看您的預訂記錄',
    loading: '載入中...',
    no_bookings: '暫無預訂記錄',
    no_bookings_sub: '立即使用Beeliber進行第一次預訂 🐝',
    service_storage: '行李寄存',
    service_delivery: '機場送遞',
    status_label: '狀態',
    price_label: '付款金額',
    bags_label: '行李',
    pickup_label: '寄存地點',
    dropoff_label: '送遞目的地',
    date_label: '使用日期',
    logout: '登出',
    go_booking: '立即預訂',
    back: '返回首頁',
    error_load: '無法載入預訂記錄',
    retry: '重試',
    status: {
      PENDING: '待確認', CONFIRMED: '已確認', PAID_OUT: '已結算',
      MONTHLY_INCLUDED: '月結', ON_HOLD: '暫停', CANCELLED: '已取消',
      REFUNDED: '已退款', DELETED: '已刪除',
    },
  },
  zh: {
    title: '我的预订',
    subtitle: '查看您的预订记录',
    loading: '加载中...',
    no_bookings: '暂无预订记录',
    no_bookings_sub: '立即使用Beeliber进行第一次预订 🐝',
    service_storage: '行李寄存',
    service_delivery: '机场配送',
    status_label: '状态',
    price_label: '付款金额',
    bags_label: '行李',
    pickup_label: '寄存地点',
    dropoff_label: '配送目的地',
    date_label: '使用日期',
    logout: '登出',
    go_booking: '立即预订',
    back: '返回首页',
    error_load: '无法加载预订记录',
    retry: '重试',
    status: {
      PENDING: '待确认', CONFIRMED: '已确认', PAID_OUT: '已结算',
      MONTHLY_INCLUDED: '月结', ON_HOLD: '暂停', CANCELLED: '已取消',
      REFUNDED: '已退款', DELETED: '已删除',
    },
  },
  ja: {
    title: '予約一覧',
    subtitle: '予約履歴をご確認いただけます',
    loading: '読み込み中...',
    no_bookings: '予約がありません',
    no_bookings_sub: 'Beeliberで最初の予約をしましょう 🐝',
    service_storage: '荷物預かり',
    service_delivery: '空港配送',
    status_label: 'ステータス',
    price_label: '決済金額',
    bags_label: '荷物',
    pickup_label: '預かり場所',
    dropoff_label: '配送先',
    date_label: '利用日',
    logout: 'ログアウト',
    go_booking: '予約する',
    back: 'ホームへ',
    error_load: '予約情報を読み込めませんでした',
    retry: '再試行',
    status: {
      PENDING: '受付待ち', CONFIRMED: '確定', PAID_OUT: '精算済み',
      MONTHLY_INCLUDED: '月次精算', ON_HOLD: '保留', CANCELLED: 'キャンセル',
      REFUNDED: '返金済み', DELETED: '削除済み',
    },
  },
};

// ─── 상태 뱃지 색상 ───────────────────────────────────────────────────────────
const STATUS_COLORS: Record<string, string> = {
  PENDING:           'bg-amber-100 text-amber-700',
  CONFIRMED:         'bg-green-100 text-green-700',
  PAID_OUT:          'bg-blue-100 text-blue-700',
  MONTHLY_INCLUDED:  'bg-purple-100 text-purple-700',
  ON_HOLD:           'bg-orange-100 text-orange-700',
  CANCELLED:         'bg-red-100 text-red-700',
  REFUNDED:          'bg-gray-100 text-gray-500',
  DELETED:           'bg-gray-100 text-gray-400',
};

// ─── 날짜 포맷 ────────────────────────────────────────────────────────────────
const fmtDate = (d: string | null, lang: string) => {
  if (!d) return '—';
  try {
    return new Date(d).toLocaleDateString(
      lang === 'ko' ? 'ko-KR' : lang === 'ja' ? 'ja-JP' : 'zh-TW',
      { year: 'numeric', month: 'short', day: 'numeric' }
    );
  } catch {
    return d;
  }
};

// ─── 예약 카드 ────────────────────────────────────────────────────────────────
const BookingCard: React.FC<{ b: BookingRow; t: typeof LABELS['ko']; lang: string }> = ({ b, t, lang }) => {
  const isDelivery = b.service_type === 'DELIVERY';
  const statusKey = b.settlement_status ?? 'PENDING';
  const statusLabel = t.status[statusKey] ?? statusKey;
  const badgeClass = STATUS_COLORS[statusKey] ?? 'bg-gray-100 text-gray-500';

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-2xl border border-black/5 shadow-sm overflow-hidden"
    >
      {/* 상단 헤더 */}
      <div className="flex items-center justify-between px-5 pt-5 pb-3 border-b border-black/5">
        <div className="flex items-center gap-2.5">
          <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-base ${isDelivery ? 'bg-blue-50' : 'bg-bee-yellow/20'}`}>
            {isDelivery ? '✈️' : '🧳'}
          </div>
          <div>
            <p className="font-black text-bee-black text-sm leading-tight">
              {isDelivery ? t.service_delivery : t.service_storage}
            </p>
            {b.reservation_code && (
              <p className="text-[11px] text-bee-black/35 font-bold tracking-wider mt-0.5">
                #{b.reservation_code}
              </p>
            )}
          </div>
        </div>
        <span className={`px-2.5 py-1 rounded-full text-[11px] font-black ${badgeClass}`}>
          {statusLabel}
        </span>
      </div>

      {/* 상세 정보 */}
      <div className="px-5 py-4 space-y-2.5">
        {b.pickup_date && (
          <div className="flex items-center justify-between text-sm">
            <span className="text-bee-black/40 font-bold">{t.date_label}</span>
            <span className="font-bold text-bee-black">
              {fmtDate(b.pickup_date, lang)}
              {b.pickup_time ? ` ${b.pickup_time.slice(0, 5)}` : ''}
            </span>
          </div>
        )}
        {b.pickup_location && (
          <div className="flex items-start justify-between text-sm gap-4">
            <span className="text-bee-black/40 font-bold shrink-0">
              {isDelivery ? t.dropoff_label : t.pickup_label}
            </span>
            <span className="font-bold text-bee-black text-right leading-snug">
              {isDelivery ? (b.dropoff_location ?? b.pickup_location) : b.pickup_location}
            </span>
          </div>
        )}
        {b.bags != null && b.bags > 0 && (
          <div className="flex items-center justify-between text-sm">
            <span className="text-bee-black/40 font-bold">{t.bags_label}</span>
            <span className="font-bold text-bee-black">{b.bags}</span>
          </div>
        )}
      </div>

      {/* 하단 금액 */}
      {b.final_price != null && b.final_price > 0 && (
        <div className="px-5 py-3.5 bg-bee-light/40 flex items-center justify-between">
          <span className="text-xs text-bee-black/40 font-black uppercase tracking-wider">
            {t.price_label}
          </span>
          <span className="font-black text-bee-black text-base tabular-nums">
            ₩{b.final_price.toLocaleString()}
          </span>
        </div>
      )}
    </motion.div>
  );
};

// ─── 메인 컴포넌트 ────────────────────────────────────────────────────────────
const MyReservationsPage: React.FC = () => {
  const navigate = useNavigate();
  const { urlLang } = useParams<{ urlLang: string }>();
  const lang = urlLang ?? 'ko';
  const t = LABELS[lang] ?? LABELS.en;

  const [user, setUser] = useState<CustomerAuthUser | null>(auth.currentUser);
  const [bookings, setBookings] = useState<BookingRow[]>([]);
  const [loadState, setLoadState] = useState<'init' | 'loading' | 'done' | 'error'>('init');

  const loadBookings = useCallback(async (email: string) => {
    setLoadState('loading');
    try {
      const token = await getActiveCustomerAccessToken();
      const encoded = encodeURIComponent(email);
      const data = await supabaseGet<BookingRow[]>(
        `booking_details?user_email=eq.${encoded}&settlement_status=neq.DELETED&order=created_at.desc&limit=50&select=id,reservation_code,user_name,user_email,service_type,pickup_date,pickup_time,pickup_location,dropoff_location,final_price,bags,settlement_status,ops_status,created_at`,
        token,
      );
      setBookings(data ?? []);
      setLoadState('done');
    } catch {
      setLoadState('error');
    }
  }, []);

  useEffect(() => {
    // onAuthStateChanged: 매직링크 콜백 후 세션 복원 포함
    const unsubscribe = auth.onAuthStateChanged((u) => {
      setUser(u);
      if (u?.email) {
        loadBookings(u.email);
      } else {
        navigate(`/${lang}/my/login`, { replace: true });
      }
    });
    return unsubscribe;
  }, [lang, navigate, loadBookings]);

  const handleSignOut = async () => {
    await auth.signOut();
    navigate(`/${lang}/my/login`, { replace: true });
  };

  // ── 로딩 / 인증 대기 ────────────────────────────────────────────────────────
  if (loadState === 'init' || (loadState === 'loading' && !user)) {
    return (
      <div className="min-h-screen bg-[#F9F9F7] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-bee-yellow/30 border-t-bee-yellow rounded-full animate-spin" />
          <p className="text-bee-black/40 text-sm font-bold">{t.loading}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F9F9F7] flex flex-col">
      {/* 헤더 */}
      <header className="bg-white border-b border-black/5 px-5 h-14 flex items-center justify-between sticky top-0 z-10">
        <button
          onClick={() => navigate(`/${lang}`)}
          className="text-bee-yellow font-black text-base tracking-[0.15em]"
        >
          BEELIBER
        </button>
        {user && (
          <button
            onClick={handleSignOut}
            className="text-xs font-black text-bee-black/30 hover:text-red-500 transition-colors"
          >
            {t.logout}
          </button>
        )}
      </header>

      <main className="flex-1 max-w-lg mx-auto w-full px-4 py-8">
        {/* 제목 + 이메일 */}
        <div className="mb-6">
          <h1 className="text-2xl font-black text-bee-black tracking-tight">{t.title}</h1>
          {user?.email && (
            <p className="text-sm text-bee-black/40 font-bold mt-1">{user.email}</p>
          )}
        </div>

        {/* 에러 */}
        {loadState === 'error' && (
          <div className="bg-red-50 border border-red-100 rounded-2xl p-5 text-center mb-6">
            <p className="text-red-600 font-bold text-sm mb-3">{t.error_load}</p>
            <button
              onClick={() => user?.email && loadBookings(user.email)}
              className="px-4 py-2 bg-red-500 text-white rounded-xl font-black text-xs"
            >
              {t.retry}
            </button>
          </div>
        )}

        {/* 로딩 스켈레톤 */}
        {loadState === 'loading' && (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white rounded-2xl h-32 animate-pulse border border-black/5" />
            ))}
          </div>
        )}

        {/* 예약 없음 */}
        {loadState === 'done' && bookings.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center py-20 text-center"
          >
            <div className="w-20 h-20 bg-bee-yellow/15 rounded-3xl flex items-center justify-center text-4xl mb-5">
              🧳
            </div>
            <p className="text-bee-black font-black text-lg mb-2">{t.no_bookings}</p>
            <p className="text-bee-black/40 text-sm font-bold mb-8">{t.no_bookings_sub}</p>
            <button
              onClick={() => navigate(`/${lang}/locations`)}
              className="px-6 py-3.5 bg-bee-yellow text-bee-black font-black rounded-2xl text-sm shadow-lg shadow-bee-yellow/25"
            >
              {t.go_booking}
            </button>
          </motion.div>
        )}

        {/* 예약 목록 */}
        {loadState === 'done' && bookings.length > 0 && (
          <AnimatePresence>
            <div className="space-y-3">
              {bookings.map((b, i) => (
                <motion.div
                  key={b.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04 }}
                >
                  <BookingCard b={b} t={t} lang={lang} />
                </motion.div>
              ))}
            </div>
          </AnimatePresence>
        )}

        {/* 홈 버튼 */}
        {loadState === 'done' && (
          <div className="mt-8 text-center">
            <button
              onClick={() => navigate(`/${lang}`)}
              className="text-sm text-bee-black/30 font-bold hover:text-bee-black transition-colors"
            >
              {t.back}
            </button>
          </div>
        )}
      </main>
    </div>
  );
};

export default MyReservationsPage;
