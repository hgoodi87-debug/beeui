/**
 * KioskPage — 현장 키오스크 (All-in-One 단일 화면)
 * URL: /kiosk/:branchSlug
 * - 인증 불필요, 전체화면 태블릿 최적화
 * - 3컬럼 통합: ① 짐 수량 | ② 보관 시간 | ③ 접수 확인
 * - Beeliber Onyx & Gold 디자인 시스템
 */
import React, { useState, useEffect, useCallback, useRef } from 'react';
import Logo from './Logo';
import { useParams, useNavigate } from 'react-router-dom';
import { printKioskReceipt } from '../utils/kioskPrint';
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
  upsertSetting,
  assignTagAndRow,
  calcPrice,
  flushOfflineQueue,
  getOfflineQueueSize,
  todayStr,
  timeStr,
  addHours,
} from '../services/kioskDb';

// ─── i18n ─────────────────────────────────────────────────────────────────
type Lang = 'ko' | 'en' | 'zh' | 'zh-TW' | 'zh-HK' | 'ja';
const LABELS: Record<Lang, Record<string, string>> = {
  ko: {
    small: '소형 가방', small_desc: '토트백 · 배낭 · 소형 캐리어',
    carrier: '대형 캐리어', carrier_desc: '여행용 캐리어 · 큰 가방',
    col1: '짐 수량', col2: '보관 시간', col3: '접수 확인',
    duration: '시간', start: '보관 시작', pickup: '픽업 예정', total: '합계',
    submit: '접수하기',
    payment_cash: '현금', payment_card: '카드', payment_pending: '미수금',
    select_payment: '결제 방법',
    notice_title: '안내사항',
    admin_title: '관리자 모드', admin_password: '비밀번호',
    admin_enter: '입장', admin_wrong: '비밀번호가 틀렸습니다',
    today_log: '오늘 접수 현황',
    offline_warn: '오프라인 상태입니다', offline_queued: '건 대기 중',
    syncing: '동기화 중...', synced: '동기화 완료',
    done: '반납 완료', mark_done: '반납 처리',
    pcs: '개', loading: '로딩 중...', not_found: '지점을 찾을 수 없습니다',
    discount: '할인',
    success_msg: '접수가 완료되었습니다!', success_sub: 'Booking confirmed',
    tag: '태그', zone: '구역',
    delivery_btn: '공항 배송 예약하기', qr_scan: '분실 방지 QR 스캔',
    qr_sub: 'bee-liber.com에서 조회', reset: '처음으로',
    from_4h: '소형 가방은 4시간부터 보관 가능합니다',
    select_bags: '짐을 입력해주세요', select_dur: '보관 시간을 선택해주세요', touch_add: '터치로 추가',
  },
  en: {
    small: 'Small Bag', small_desc: 'Tote · Backpack · Small Carry-on',
    carrier: 'Large Suitcase', carrier_desc: 'Travel suitcase · Large luggage',
    col1: 'Bags', col2: 'Duration', col3: 'Confirm',
    duration: 'hr', start: 'Start', pickup: 'Pickup', total: 'Total',
    submit: 'Check In',
    payment_cash: 'Cash', payment_card: 'Card', payment_pending: 'Unpaid',
    select_payment: 'Payment',
    notice_title: 'Notice',
    admin_title: 'Admin Mode', admin_password: 'Password',
    admin_enter: 'Enter', admin_wrong: 'Wrong password',
    today_log: "Today's Log",
    offline_warn: 'You are offline', offline_queued: 'pending',
    syncing: 'Syncing...', synced: 'Synced',
    done: 'Returned', mark_done: 'Mark Returned',
    pcs: '', loading: 'Loading...', not_found: 'Branch not found',
    discount: 'Discount',
    success_msg: 'Booking Confirmed!', success_sub: '접수가 완료되었습니다',
    tag: 'Tag', zone: 'Zone',
    delivery_btn: 'Book Airport Delivery', qr_scan: 'Scan QR to track luggage',
    qr_sub: 'Track at bee-liber.com', reset: 'Start Over',
    from_4h: 'Minimum 4 hours for small bags',
    select_bags: 'Please enter bag count', select_dur: 'Please select duration', touch_add: 'Tap to add',
  },
  zh: {
    small: '小型行李', small_desc: '手提包 · 背包 · 小型拉杆箱',
    carrier: '大型行李箱', carrier_desc: '旅行箱 · 大型行李',
    col1: '行李数量', col2: '存放时间', col3: '确认预订',
    duration: '小时', start: '开始', pickup: '取件', total: '合计',
    submit: '办理存放',
    payment_cash: '现金', payment_card: '刷卡', payment_pending: '未付款',
    select_payment: '付款方式',
    notice_title: '注意事项',
    admin_title: '管理员模式', admin_password: '密码',
    admin_enter: '进入', admin_wrong: '密码错误',
    today_log: '今日接待记录',
    offline_warn: '当前离线', offline_queued: '条等待同步',
    syncing: '同步中...', synced: '已同步',
    done: '已取件', mark_done: '标记已取件',
    pcs: '件', loading: '加载中...', not_found: '未找到该分店',
    discount: '折扣',
    success_msg: '办理完成！', success_sub: 'Booking confirmed',
    tag: '标签', zone: '区域',
    delivery_btn: '预约机场配送', qr_scan: '请扫描QR码',
    qr_sub: '在 bee-liber.com 查询', reset: '重新开始',
    from_4h: '小行李最少存放4小时',
    select_bags: '请输入行李数量', select_dur: '请选择存放时间', touch_add: '点击添加',
  },
  'zh-TW': {
    small: '小型行李', small_desc: '手提包 · 背包 · 小型行李箱',
    carrier: '大型行李箱', carrier_desc: '旅行箱 · 大型行李',
    col1: '行李數量', col2: '寄存時間', col3: '確認預訂',
    duration: '小時', start: '開始', pickup: '取件', total: '合計',
    submit: '辦理寄存',
    payment_cash: '現金', payment_card: '刷卡', payment_pending: '未付款',
    select_payment: '付款方式',
    notice_title: '注意事項',
    admin_title: '管理員模式', admin_password: '密碼',
    admin_enter: '進入', admin_wrong: '密碼錯誤',
    today_log: '今日接待記錄',
    offline_warn: '目前離線', offline_queued: '筆等待同步',
    syncing: '同步中...', synced: '已同步',
    done: '已取件', mark_done: '標記已取件',
    pcs: '件', loading: '載入中...', not_found: '找不到該分店',
    discount: '折扣',
    success_msg: '辦理完成！', success_sub: 'Booking confirmed',
    tag: '標籤', zone: '區域',
    delivery_btn: '預約機場配送', qr_scan: '請掃描QR碼',
    qr_sub: '在 bee-liber.com 查詢', reset: '重新開始',
    from_4h: '小行李最少寄存4小時',
    select_bags: '請輸入行李數量', select_dur: '請選擇寄存時間', touch_add: '點擊新增',
  },
  'zh-HK': {
    small: '細型行李', small_desc: '手袋 · 背囊 · 小型行李箱',
    carrier: '大型行李箱', carrier_desc: '旅行喼 · 大型行李',
    col1: '行李數量', col2: '寄存時間', col3: '確認預約',
    duration: '小時', start: '開始', pickup: '取件', total: '合計',
    submit: '辦理寄存',
    payment_cash: '現金', payment_card: '刷卡', payment_pending: '未付款',
    select_payment: '付款方式',
    notice_title: '注意事項',
    admin_title: '管理員模式', admin_password: '密碼',
    admin_enter: '進入', admin_wrong: '密碼錯誤',
    today_log: '今日接待記錄',
    offline_warn: '目前離線', offline_queued: '筆等待同步',
    syncing: '同步中...', synced: '已同步',
    done: '已取件', mark_done: '標記已取件',
    pcs: '件', loading: '載入中...', not_found: '搵唔到該分店',
    discount: '折扣',
    success_msg: '辦理完成！', success_sub: 'Booking confirmed',
    tag: '標籤', zone: '區域',
    delivery_btn: '預約機場送遞', qr_scan: '請掃描QR碼',
    qr_sub: '喺 bee-liber.com 查詢', reset: '重新開始',
    from_4h: '細行李最少寄存4小時',
    select_bags: '請輸入行李數量', select_dur: '請選擇寄存時間', touch_add: '點擊新增',
  },
  ja: {
    small: '小型バッグ', small_desc: 'トートバッグ · リュック · 小型スーツケース',
    carrier: '大型スーツケース', carrier_desc: '旅行用スーツケース · 大型荷物',
    col1: '荷物の数', col2: '預け時間', col3: '受付確認',
    duration: '時間', start: '預け開始', pickup: '受取予定', total: '合計',
    submit: '受付する',
    payment_cash: '現金', payment_card: 'カード', payment_pending: '未払い',
    select_payment: 'お支払い方法',
    notice_title: 'ご案内',
    admin_title: '管理者モード', admin_password: 'パスワード',
    admin_enter: '入室', admin_wrong: 'パスワードが違います',
    today_log: '本日の受付状況',
    offline_warn: 'オフライン中', offline_queued: '件待機中',
    syncing: '同期中...', synced: '同期完了',
    done: '返却完了', mark_done: '返却済みにする',
    pcs: '個', loading: '読み込み中...', not_found: '店舗が見つかりません',
    discount: '割引',
    success_msg: '受付完了しました！', success_sub: 'Booking confirmed',
    tag: 'タグ', zone: 'ゾーン',
    delivery_btn: '空港配送を予約', qr_scan: '紛失防止QRスキャン',
    qr_sub: 'bee-liber.com で確認', reset: '最初から',
    from_4h: '小型バッグは4時間以上からお預かりします',
    select_bags: '荷物の数を入力してください', select_dur: '預け時間を選択してください', touch_add: 'タップして追加',
  },
};

type PaymentMethod = '현금' | '카드' | '미수금';

// ─── 어드민 패널 (3탭: 현황 / 통계 / 설정) ────────────────────────────────
interface AdminPanelProps {
  cfg: KioskCfg;
  branch: KioskBranch | null;
  todayLog: KioskStorageLog[];
  offlineCount: number;
  adminUnlocked: boolean;
  adminPw: string;
  adminError: boolean;
  t: Record<string, string>;
  setShowAdmin: (v: boolean) => void;
  setAdminUnlocked: (v: boolean) => void;
  setAdminPw: (v: string) => void;
  setAdminError: (v: boolean) => void;
  handleAdminLogin: () => void;
  handleMarkDone: (entry: KioskStorageLog) => void;
  setCfg: React.Dispatch<React.SetStateAction<KioskCfg>>;
}

const AdminPanel: React.FC<AdminPanelProps> = ({
  cfg, branch, todayLog, offlineCount,
  adminUnlocked, adminError, t,
  setShowAdmin, setAdminUnlocked, setAdminPw, setAdminError,
  handleAdminLogin, handleMarkDone, setCfg,
}) => {
  const [adminTab, setAdminTab] = React.useState<'log' | 'stats' | 'settings'>('log');
  const [localPrices, setLocalPrices] = React.useState({ ...cfg.prices });
  const [localOps, setLocalOps] = React.useState({ ...cfg.operations });
  const [saving, setSaving] = React.useState(false);
  const [saved, setSaved] = React.useState(false);

  // 숫자 키패드 PIN 상태
  const [pinInput, setPinInput] = React.useState('');
  const [pinShake, setPinShake] = React.useState(false);

  // 보관 장부 상단 PIN 변경 상태
  const [showPinChange, setShowPinChange] = React.useState(false);
  const [newPin, setNewPin] = React.useState('');
  const [pinSaved, setPinSaved] = React.useState(false);

  const PIN_LEN = 4;

  const handlePinKey = React.useCallback((digit: string) => {
    setPinInput((prev) => {
      if (prev.length >= PIN_LEN) return prev;
      const next = prev + digit;
      if (next.length === PIN_LEN) {
        // 자동 검증
        setTimeout(() => {
          if (next === cfg.admin_password) {
            setAdminUnlocked(true);
            setAdminError(false);
            setAdminPw(next);
          } else {
            setPinShake(true);
            setTimeout(() => { setPinShake(false); setPinInput(''); }, 600);
            setAdminError(true);
          }
        }, 100);
      }
      return next;
    });
  }, [cfg.admin_password, setAdminUnlocked, setAdminError, setAdminPw]);

  const handleNewPinKey = (digit: string) => {
    setNewPin((prev) => prev.length < PIN_LEN ? prev + digit : prev);
  };

  const savePin = async () => {
    if (!branch || newPin.length !== PIN_LEN) return;
    setSaving(true);
    await upsertSetting(branch.branch_id ?? 'default', 'admin_password', newPin);
    setCfg((prev) => ({ ...prev, admin_password: newPin }));
    setSaving(false);
    setPinSaved(true);
    setNewPin('');
    setShowPinChange(false);
    setTimeout(() => setPinSaved(false), 2500);
  };

  const saveSettings = async () => {
    if (!branch) return;
    setSaving(true);
    const bid = branch.branch_id ?? 'default';
    await Promise.all([
      upsertSetting(bid, 'prices', localPrices),
      upsertSetting(bid, 'operations', localOps),
    ]);
    setCfg((prev) => ({ ...prev, prices: localPrices, operations: localOps }));
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const closeAdmin = () => { setShowAdmin(false); setAdminUnlocked(false); setAdminPw(''); setAdminError(false); setPinInput(''); };

  const stats = {
    total: todayLog.length,
    active: todayLog.filter((e) => !e.done).length,
    done: todayLog.filter((e) => e.done).length,
    smallTotal: todayLog.reduce((s, e) => s + e.small_qty, 0),
    carrierTotal: todayLog.reduce((s, e) => s + e.carrier_qty, 0),
    revenue: todayLog.reduce((s, e) => s + (e.original_price - e.discount), 0),
    byCash: todayLog.filter((e) => e.payment === '현금').length,
    byCard: todayLog.filter((e) => e.payment === '카드').length,
    byUnpaid: todayLog.filter((e) => e.payment === '미수금').length,
    unpaidAmt: todayLog.filter((e) => e.payment === '미수금').reduce((s, e) => s + (e.original_price - e.discount), 0),
  };

  // 숫자 키패드 렌더러
  const Numpad = ({ onKey, value }: { onKey: (d: string) => void; value: string }) => (
    <div className="flex flex-col items-center gap-4">
      {/* PIN 도트 */}
      <div className={`flex gap-4 mb-2 transition-all ${pinShake ? 'animate-[wiggle_0.5s_ease-in-out]' : ''}`}>
        {Array.from({ length: PIN_LEN }).map((_, i) => (
          <div key={i} className={`w-4 h-4 rounded-full border-2 transition-all ${
            i < value.length
              ? (adminError && value.length === 0 ? 'bg-red-400 border-red-400' : 'bg-[#F5C842] border-[#F5C842]')
              : 'border-white/30'
          }`} />
        ))}
      </div>
      {adminError && <p className="text-red-400 text-xs font-bold -mt-2">비밀번호가 틀렸습니다</p>}
      {/* 키패드 */}
      <div className="grid grid-cols-3 gap-3 w-56">
        {['1','2','3','4','5','6','7','8','9'].map((d) => (
          <button key={d} onClick={() => onKey(d)}
            className="h-14 rounded-2xl bg-white/10 text-white font-black text-xl active:bg-[#F5C842] active:text-[#111111] transition-colors select-none">
            {d}
          </button>
        ))}
        <div />
        <button onClick={() => onKey('0')}
          className="h-14 rounded-2xl bg-white/10 text-white font-black text-xl active:bg-[#F5C842] active:text-[#111111] transition-colors select-none">
          0
        </button>
        <button onClick={() => { if (value === pinInput) setPinInput((p) => p.slice(0, -1)); else setNewPin((p) => p.slice(0, -1)); }}
          className="h-14 rounded-2xl bg-white/10 text-white/60 flex items-center justify-center active:bg-white/20 transition-colors select-none">
          <i className="fa-solid fa-delete-left text-lg" />
        </button>
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 bg-[#111111]/97 backdrop-blur-md overflow-y-auto">
      <div className="max-w-2xl mx-auto p-6">
        {/* 헤더 */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-white font-black text-lg">보관 장부</h2>
            <p className="text-white/40 text-xs mt-0.5">{branch?.branch_name} · {todayStr()}</p>
          </div>
          <button onClick={closeAdmin} className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white/60 hover:text-white transition-colors">✕</button>
        </div>

        {!adminUnlocked ? (
          /* ── PIN 키패드 입력 화면 ── */
          <div className="flex flex-col items-center gap-6 mt-10">
            <div className="w-16 h-16 rounded-full bg-[#F5C842]/10 flex items-center justify-center">
              <i className="fa-solid fa-lock text-[#F5C842] text-2xl" />
            </div>
            <p className="text-white/60 text-sm font-bold">4자리 PIN을 입력하세요</p>
            <Numpad onKey={handlePinKey} value={pinInput} />
          </div>
        ) : (
          <div>
            {/* 탭 버튼 */}
            <div className="flex gap-2 mb-5">
              {([['log', '보관 장부'], ['stats', '통계'], ['settings', '설정']] as const).map(([tab, label]) => (
                <button key={tab} onClick={() => setAdminTab(tab)}
                  className={`px-5 py-2.5 rounded-full font-black text-sm transition-all ${
                    adminTab === tab ? 'bg-[#F5C842] text-[#111111]' : 'bg-white/10 text-white/50 hover:text-white'
                  }`}>
                  {label}
                </button>
              ))}
            </div>

            {/* ── 탭 1: 보관 장부 ── */}
            {adminTab === 'log' && (
              <div>
                {/* PIN 변경 (상단) */}
                <div className="mb-4">
                  {!showPinChange ? (
                    <button onClick={() => { setShowPinChange(true); setNewPin(''); }}
                      className="flex items-center gap-1.5 text-white/40 hover:text-white/70 text-xs font-bold transition-colors">
                      <i className="fa-solid fa-key text-[10px]" />
                      PIN 변경
                    </button>
                  ) : (
                    <div className="bg-white/10 rounded-2xl p-5 flex flex-col items-center gap-4">
                      <div className="flex items-center justify-between w-full">
                        <p className="text-white/60 text-sm font-bold">새 PIN 4자리 입력</p>
                        <button onClick={() => { setShowPinChange(false); setNewPin(''); }}
                          className="text-white/40 hover:text-white text-xs">취소</button>
                      </div>
                      {/* 새 PIN 도트 */}
                      <div className="flex gap-4">
                        {Array.from({ length: PIN_LEN }).map((_, i) => (
                          <div key={i} className={`w-4 h-4 rounded-full border-2 transition-all ${
                            i < newPin.length ? 'bg-[#F5C842] border-[#F5C842]' : 'border-white/30'
                          }`} />
                        ))}
                      </div>
                      <div className="grid grid-cols-3 gap-2.5 w-48">
                        {['1','2','3','4','5','6','7','8','9'].map((d) => (
                          <button key={d} onClick={() => handleNewPinKey(d)}
                            className="h-12 rounded-xl bg-white/10 text-white font-black text-lg active:bg-[#F5C842] active:text-[#111111] transition-colors select-none">
                            {d}
                          </button>
                        ))}
                        <div />
                        <button onClick={() => handleNewPinKey('0')}
                          className="h-12 rounded-xl bg-white/10 text-white font-black text-lg active:bg-[#F5C842] active:text-[#111111] transition-colors select-none">
                          0
                        </button>
                        <button onClick={() => setNewPin((p) => p.slice(0, -1))}
                          className="h-12 rounded-xl bg-white/10 text-white/60 flex items-center justify-center active:bg-white/20 transition-colors select-none">
                          <i className="fa-solid fa-delete-left" />
                        </button>
                      </div>
                      <button onClick={savePin} disabled={newPin.length !== PIN_LEN || saving}
                        className={`w-full py-3 rounded-full font-black text-sm transition-all active:scale-[0.98] ${
                          newPin.length === PIN_LEN ? (pinSaved ? 'bg-green-500 text-white' : 'bg-[#F5C842] text-[#111111]') : 'bg-white/10 text-white/30 cursor-not-allowed'
                        }`}>
                        {pinSaved ? '✓ 저장 완료' : `PIN 저장 (${newPin.length}/${PIN_LEN})`}
                      </button>
                    </div>
                  )}
                </div>

                {offlineCount > 0 && (
                  <div className="bg-orange-500/20 rounded-2xl p-4 mb-4 text-orange-300 text-sm flex items-center gap-2">
                    <i className="fa-solid fa-triangle-exclamation" />
                    오프라인 {offlineCount}건 대기 중 — 네트워크 연결 시 자동 동기화
                  </div>
                )}
                {/* 요약 뱃지 */}
                <div className="grid grid-cols-3 gap-3 mb-5">
                  {[
                    { label: '전체', value: stats.total, color: 'bg-white/10 text-white' },
                    { label: '보관 중', value: stats.active, color: 'bg-[#F5C842]/20 text-[#F5C842]' },
                    { label: '반납 완료', value: stats.done, color: 'bg-green-500/20 text-green-400' },
                  ].map((s) => (
                    <div key={s.label} className={`${s.color} rounded-2xl p-4 text-center`}>
                      <p className="text-3xl font-black tabular-nums">{s.value}</p>
                      <p className="text-xs font-bold opacity-70 mt-1">{s.label}</p>
                    </div>
                  ))}
                </div>
                {/* 접수 목록 */}
                <div className="space-y-2">
                  {todayLog.length === 0 && <p className="text-white/30 text-sm text-center py-10">오늘 접수 없음</p>}
                  {todayLog.map((e, i) => (
                    <div key={i} className={`flex items-center gap-3 p-4 rounded-2xl transition-opacity ${e.done ? 'bg-white/5 opacity-50' : 'bg-white/10'}`}>
                      <span className={`w-10 h-10 rounded-full flex items-center justify-center font-black text-base flex-shrink-0 ${e.done ? 'bg-white/20 text-white/50' : 'bg-[#F5C842] text-[#111111]'}`}>{e.tag}</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-white text-sm font-bold">{e.row_label}구역</p>
                          <span className="text-white/40 text-xs">·</span>
                          <p className="text-white/70 text-xs">
                            {e.small_qty > 0 ? `소형 ${e.small_qty}` : ''}{e.small_qty > 0 && e.carrier_qty > 0 ? ' ' : ''}{e.carrier_qty > 0 ? `캐리어 ${e.carrier_qty}` : ''}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 mt-0.5">
                          <p className="text-white/40 text-xs">{e.start_time} → {e.pickup_time}</p>
                          <span className="text-white/20 text-xs">·</span>
                          <p className="text-[#F5C842]/70 text-xs font-bold">{(e.original_price - e.discount).toLocaleString()}원</p>
                          <span className="text-white/20 text-xs">·</span>
                          <p className="text-white/40 text-xs">{e.payment}</p>
                        </div>
                      </div>
                      {!e.done
                        ? <button onClick={() => handleMarkDone(e)}
                            className="text-[#F5C842] text-xs font-bold ring-1 ring-[#F5C842]/40 rounded-full px-3 py-1.5 active:scale-95 flex-shrink-0 whitespace-nowrap">
                            {t.mark_done}
                          </button>
                        : <span className="text-green-400 text-xs font-bold flex-shrink-0">✓ {t.done}</span>}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ── 탭 2: 통계 ── */}
            {adminTab === 'stats' && (
              <div className="space-y-4">
                <div className="bg-[#F5C842] rounded-2xl p-6">
                  <p className="text-[#111111]/60 text-xs font-bold uppercase tracking-widest mb-1">오늘 총 매출</p>
                  <p className="text-[#111111] font-black text-4xl tabular-nums">{stats.revenue.toLocaleString()}원</p>
                  {stats.unpaidAmt > 0 && (
                    <p className="text-[#111111]/60 text-xs mt-1">미수금 {stats.unpaidAmt.toLocaleString()}원 포함</p>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-white/10 rounded-2xl p-5 text-center">
                    <img src="/images/bags/hand-bag-photo.png" alt="소형" className="w-10 h-10 object-contain mx-auto mb-2 opacity-80" />
                    <p className="text-white font-black text-3xl tabular-nums">{stats.smallTotal}</p>
                    <p className="text-white/50 text-xs mt-1">소형 가방</p>
                  </div>
                  <div className="bg-white/10 rounded-2xl p-5 text-center">
                    <picture><source srcSet="/images/bags/carrier-photo.webp" type="image/webp" /><img src="/images/bags/carrier-photo.png" alt="캐리어" className="w-10 h-10 object-contain mx-auto mb-2 opacity-80" /></picture>
                    <p className="text-white font-black text-3xl tabular-nums">{stats.carrierTotal}</p>
                    <p className="text-white/50 text-xs mt-1">대형 캐리어</p>
                  </div>
                </div>
                <div className="bg-white/10 rounded-2xl p-5">
                  <p className="text-white/50 text-xs font-bold uppercase tracking-widest mb-4">결제 방법</p>
                  <div className="space-y-3">
                    {[
                      { label: '현금', count: stats.byCash, color: 'bg-green-400' },
                      { label: '카드', count: stats.byCard, color: 'bg-blue-400' },
                      { label: '미수금', count: stats.byUnpaid, color: 'bg-orange-400' },
                    ].map((item) => (
                      <div key={item.label} className="flex items-center gap-3">
                        <span className={`w-2 h-2 rounded-full flex-shrink-0 ${item.color}`} />
                        <span className="text-white/60 text-sm w-16">{item.label}</span>
                        <div className="flex-1 bg-white/10 rounded-full h-2">
                          <div className={`h-2 rounded-full ${item.color} transition-all`}
                            style={{ width: stats.total > 0 ? `${(item.count / stats.total) * 100}%` : '0%' }} />
                        </div>
                        <span className="text-white font-black text-sm tabular-nums w-6 text-right">{item.count}</span>
                      </div>
                    ))}
                  </div>
                </div>
                {stats.active > 0 && (
                  <div className="bg-white/10 rounded-2xl p-5">
                    <p className="text-white/50 text-xs font-bold uppercase tracking-widest mb-3">픽업 예정 ({stats.active}건)</p>
                    <div className="space-y-2">
                      {todayLog.filter((e) => !e.done).sort((a, b) => a.pickup_time.localeCompare(b.pickup_time)).map((e, i) => (
                        <div key={i} className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="w-7 h-7 rounded-full bg-[#F5C842] flex items-center justify-center text-[#111111] font-black text-xs">{e.tag}</span>
                            <span className="text-white/70 text-sm">{e.row_label}구역</span>
                          </div>
                          <span className="text-white font-bold text-sm">{e.pickup_time}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ── 탭 3: 설정 ── */}
            {adminTab === 'settings' && (
              <div className="space-y-5">
                <div className="bg-white/10 rounded-2xl p-5">
                  <p className="text-white/50 text-xs font-bold uppercase tracking-widest mb-4">가격 설정</p>
                  <div className="space-y-3">
                    {[
                      { key: 'small_4h' as const, label: '소형 가방 (4시간)' },
                      { key: 'carrier_2h' as const, label: '캐리어 (2시간)' },
                      { key: 'carrier_4h' as const, label: '캐리어 (4시간)' },
                      { key: 'extra_per_hour' as const, label: '초과 시간당' },
                    ].map(({ key, label }) => (
                      <div key={key} className="flex items-center justify-between gap-4">
                        <label className="text-white/70 text-sm flex-1">{label}</label>
                        <div className="flex items-center gap-2">
                          <input type="number" value={localPrices[key]}
                            onChange={(e) => setLocalPrices((p) => ({ ...p, [key]: Number(e.target.value) }))}
                            className="bg-white/10 rounded-xl px-3 py-2 text-white text-right font-black w-24 focus:outline-none focus:ring-2 focus:ring-[#F5C842] text-sm"
                            step={500} min={0} />
                          <span className="text-white/40 text-sm">원</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="bg-white/10 rounded-2xl p-5">
                  <p className="text-white/50 text-xs font-bold uppercase tracking-widest mb-4">운영 설정</p>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between gap-4">
                      <label className="text-white/70 text-sm flex-1">최대 보관 건수</label>
                      <div className="flex items-center gap-2">
                        <input type="number" value={localOps.max_bags}
                          onChange={(e) => setLocalOps((p) => ({ ...p, max_bags: Number(e.target.value) }))}
                          className="bg-white/10 rounded-xl px-3 py-2 text-white text-right font-black w-20 focus:outline-none focus:ring-2 focus:ring-[#F5C842] text-sm"
                          min={1} max={100} />
                        <span className="text-white/40 text-sm">개</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between gap-4">
                      <label className="text-white/70 text-sm flex-1">마감 시간</label>
                      <div className="flex items-center gap-2">
                        <input type="number" value={localOps.close_hour}
                          onChange={(e) => setLocalOps((p) => ({ ...p, close_hour: Number(e.target.value) }))}
                          className="bg-white/10 rounded-xl px-3 py-2 text-white text-right font-black w-20 focus:outline-none focus:ring-2 focus:ring-[#F5C842] text-sm"
                          min={1} max={24} />
                        <span className="text-white/40 text-sm">시</span>
                      </div>
                    </div>
                  </div>
                </div>
                <button onClick={saveSettings} disabled={saving}
                  className={`w-full py-4 rounded-full font-black text-base transition-all active:scale-[0.98] ${
                    saved ? 'bg-green-500 text-white' : 'bg-[#F5C842] text-[#111111]'
                  }`}>
                  {saving ? <span className="inline-flex items-center gap-2"><i className="fa-solid fa-spinner animate-spin" /> 저장 중...</span>
                    : saved ? <span><i className="fa-solid fa-check mr-2" />저장 완료</span>
                    : '설정 저장'}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

// ─── 컬럼 헤더 ────────────────────────────────────────────────────────────
const ColHeader: React.FC<{ num: number; label: string }> = ({ num, label }) => (
  <div className="flex items-center gap-3 mb-4 flex-shrink-0">
    <div className="w-8 h-8 rounded-full bg-[#F5C842] flex items-center justify-center font-black text-[#111111] text-sm flex-shrink-0">
      {num}
    </div>
    <h2 className="text-[#111111] font-black text-lg">{label}</h2>
  </div>
);

// ─── 메인 ─────────────────────────────────────────────────────────────────
const KioskPage: React.FC = () => {
  const { branchSlug } = useParams<{ branchSlug: string }>();
  const navigate = useNavigate();

  const [branch, setBranch] = useState<KioskBranch | null>(null);
  const [cfg, setCfg] = useState<KioskCfg>(DEFAULT_CFG);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const [lang, setLang] = useState<Lang>('ko');
  const [smallQty, setSmallQty] = useState(0);
  const [carrierQty, setCarrierQty] = useState(0);
  const [duration, setDuration] = useState(0);
  const [payment, setPayment] = useState<PaymentMethod>('현금');
  const [discount, setDiscount] = useState(0);

  // ── 언어 드롭다운 ────────────────────────────────────────────────────
  const [isLangOpen, setIsLangOpen] = useState(false);

  // ── 주문 번호 카운터 (1~100 순환) ──────────────────────────────────────
  const [nextTag, setNextTag] = useState(1);
  const [editingTag, setEditingTag] = useState(false);
  const [tagInputVal, setTagInputVal] = useState('1');

  // ── 가방 수량 직접 입력 ──────────────────────────────────────────────
  const [editingSmall, setEditingSmall] = useState(false);
  const [editingCarrier, setEditingCarrier] = useState(false);
  const [smallInputVal, setSmallInputVal] = useState('0');
  const [carrierInputVal, setCarrierInputVal] = useState('0');

  // 성공 화면
  const [step, setStep] = useState<'form' | 'success'>('form');
  const [resultTag, setResultTag] = useState(0);
  const [resultRow, setResultRow] = useState('A');
  const [resultStartTime, setResultStartTime] = useState('');
  const [resultLogId, setResultLogId] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);
  // 자동 리셋 카운트다운 (성공 화면 → 30초 후 자동 초기화)
  const [resetCountdown, setResetCountdown] = useState(30);

  const [todayLog, setTodayLog] = useState<KioskStorageLog[]>([]);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [offlineCount, setOfflineCount] = useState(getOfflineQueueSize());
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'done'>('idle');

  const [showAdmin, setShowAdmin] = useState(false);
  const [adminPw, setAdminPw] = useState('');
  const [adminUnlocked, setAdminUnlocked] = useState(false);
  const [adminError, setAdminError] = useState(false);

  const logoLongPressRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const t = LABELS[lang];

  useEffect(() => {
    if (!branchSlug) { setNotFound(true); setLoading(false); return; }
    const slug = decodeURIComponent(branchSlug);
    (async () => {
      const b = await loadBranchBySlug(slug);
      if (!b) { setNotFound(true); setLoading(false); return; }
      setBranch(b);
      const settings = await loadSettings(b.branch_id ?? 'default');
      setCfg(settings);
      const entries = await loadTodayLog(b.branch_id ?? slug, todayStr());
      setTodayLog(entries);
      // 오늘 최대 태그 +1 로 카운터 초기화 (100 초과 시 1 로 순환)
      if (entries.length > 0) {
        const maxTag = Math.max(...entries.map((e) => e.tag));
        const initial = maxTag >= 100 ? 1 : maxTag + 1;
        setNextTag(initial);
        setTagInputVal(String(initial));
      }
      setLoading(false);
    })();
  }, [branchSlug]);

  useEffect(() => {
    const handleOnline = async () => {
      setIsOnline(true);
      if (getOfflineQueueSize() > 0) {
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
    return () => { window.removeEventListener('online', handleOnline); window.removeEventListener('offline', handleOffline); };
  }, []);

  // 자동 리셋: 성공 화면 진입 시 30초 카운트다운
  useEffect(() => {
    if (step !== 'success') {
      setResetCountdown(30);
      return;
    }
    setResetCountdown(30);
    const id = setInterval(() => {
      setResetCountdown(c => {
        if (c <= 1) { clearInterval(id); return 0; }
        return c - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [step]);

  // 카운트다운 0 → 폼 초기화
  useEffect(() => {
    if (step === 'success' && resetCountdown === 0) {
      setStep('form');
      setSmallQty(0); setCarrierQty(0); setDuration(0);
      setPayment('현금'); setDiscount(0);
      setResultTag(0); setResultRow('A'); setResultLogId(null);
    }
  }, [resetCountdown, step]);

  const handleLogoPointerDown = () => { logoLongPressRef.current = setTimeout(() => setShowAdmin(true), 3000); };
  const handleLogoPointerUp = () => { if (logoLongPressRef.current) clearTimeout(logoLongPressRef.current); };

  const originalPrice = calcPrice(smallQty, carrierQty, duration, cfg.prices);
  const finalPrice = Math.max(0, originalPrice - discount);

  const canSubmit = (smallQty + carrierQty > 0) && duration > 0;

  const handleSubmit = useCallback(async () => {
    if (!branch || !canSubmit) return;
    setSubmitting(true);
    const today = todayStr();
    const startTime = timeStr();
    const pickupTime = addHours(startTime, duration);
    const pickupTs = Date.now() + duration * 60 * 60 * 1000;
    const currentLog = await loadTodayLog(branch.branch_id ?? branch.slug, today);
    const { rowLabel } = assignTagAndRow(currentLog, cfg);
    const tag = nextTag;
    // 카운터 advance (100→1 순환)
    const advancedTag = nextTag >= 100 ? 1 : nextTag + 1;
    setNextTag(advancedTag);
    setTagInputVal(String(advancedTag));
    const payload = {
      branch_id: branch.branch_id ?? branch.slug,
      date: today, tag,
      small_qty: smallQty, carrier_qty: carrierQty,
      start_time: startTime, pickup_time: pickupTime, pickup_ts: pickupTs,
      duration, original_price: originalPrice, discount, payment,
      done: false, memo: '', row_label: rowLabel,
      source: 'kiosk' as const, commission_rate: 0,
    };
    const saved = await insertStorageLog(payload);
    setResultLogId(saved?.id ?? null);
    setResultTag(tag);
    setResultRow(rowLabel);
    setResultStartTime(startTime);
    setTodayLog((prev) => [...prev, { ...payload, id: tag, created_at: new Date().toISOString() }]);
    setOfflineCount(getOfflineQueueSize());
    setSubmitting(false);
    setStep('success');
    // 접수 완료 즉시 영수증 자동 출력
    void printKioskReceipt({
      tag,
      rowLabel,
      branchName: branch.branch_name,
      branchSlug: branch.branch_name_en || branch.slug || '',
      smallQty,
      carrierQty,
      duration,
      startTime,
      pickupTime,
      originalPrice,
      discount,
      payment,
      date: today,
    });
  }, [branch, cfg, smallQty, carrierQty, duration, originalPrice, discount, payment, canSubmit, nextTag]);

  const resetForm = () => {
    setStep('form');
    setSmallQty(0); setCarrierQty(0); setDuration(0);
    setPayment('현금'); setDiscount(0);
    setResultTag(0); setResultRow('A'); setResultLogId(null);
  };

  const handleAdminLogin = () => {
    if (adminPw === cfg.admin_password) { setAdminUnlocked(true); setAdminError(false); }
    else setAdminError(true);
  };

  const handleMarkDone = async (entry: KioskStorageLog) => {
    if (entry.id) await updateStorageLog(entry.id, { done: true });
    setTodayLog((prev) => prev.map((e) => (e.tag === entry.tag && e.date === entry.date ? { ...e, done: true } : e)));
  };

  const deliveryUrl = `${window.location.origin}/ko/booking?from=kiosk&pickup=${branch?.branch_id ?? ''}&bags=${smallQty}&carriers=${carrierQty}&kiosk_tag=${resultTag}`;
  const voucherUrl = resultLogId
    ? `${window.location.origin}/kiosk/voucher?id=${resultLogId}`
    : deliveryUrl;
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?data=${encodeURIComponent(voucherUrl)}&size=220x220&bgcolor=ffffff&color=111111&margin=10`;

  // ─── 로딩 ─────────────────────────────────────────────────────────────
  if (loading) return (
    <div className="h-screen bg-[#111111] flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 border-4 border-[#F5C842]/20 border-t-[#F5C842] rounded-full animate-spin" />
        <p className="text-white/50 text-sm tracking-widest">{t.loading}</p>
      </div>
    </div>
  );

  if (notFound) return (
    <div className="h-screen bg-[#111111] flex items-center justify-center text-center">
      <div>
        <p className="text-6xl mb-4">🐝</p>
        <p className="text-white text-2xl font-black mb-2">{t.not_found}</p>
        <p className="text-white/40 text-sm">/{branchSlug}</p>
      </div>
    </div>
  );

  // ─── AdminPanel props helper ──────────────────────────────────────────
  const adminPanelProps: AdminPanelProps = {
    cfg, branch, todayLog, offlineCount,
    adminUnlocked, adminPw, adminError, t,
    setShowAdmin, setAdminUnlocked, setAdminPw, setAdminError,
    handleAdminLogin, handleMarkDone, setCfg,
  };


  // ─── 성공 화면 ────────────────────────────────────────────────────────
  if (step === 'success') {
    const startT = resultStartTime;
    const pickupT = addHours(startT, duration);
    return (
      <div className="h-screen bg-[#f9f9f9] flex flex-col overflow-hidden">
        {showAdmin && <AdminPanel {...adminPanelProps} />}
        <header className="bg-[#111111] px-8 py-3 flex items-center justify-between flex-shrink-0">
          <button onPointerDown={handleLogoPointerDown} onPointerUp={handleLogoPointerUp} onPointerLeave={handleLogoPointerUp} className="select-none">
            <p className="text-[#F5C842] font-black text-lg tracking-[0.18em]">BEELIBER</p>
            <p className="text-white/40 text-xs">{lang === 'ko' ? branch?.branch_name : branch?.branch_name_en ?? branch?.branch_name}</p>
          </button>
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${isOnline ? 'bg-green-400' : 'bg-red-400 animate-pulse'}`} />
            {syncStatus === 'syncing' && <span className="text-white/40 text-xs">{t.syncing}</span>}
          </div>
        </header>
        <main className="flex-1 grid grid-cols-[55%_45%] overflow-hidden">
          <div className="p-8 flex flex-col gap-4 overflow-hidden">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0">
                <i className="fa-solid fa-check text-white text-xl" />
              </div>
              <div>
                <h1 className="text-[#111111] font-black text-2xl">{t.success_msg}</h1>
                <p className="text-gray-400 text-sm">{t.success_sub}</p>
              </div>
            </div>
            <div className="bg-white rounded-[24px] p-6 shadow-[0_4px_24px_rgba(0,0,0,0.06)]">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-gray-400 text-xs font-bold uppercase tracking-widest mb-1">{t.tag}</p>
                  <div className="flex items-baseline gap-1">
                    <span className="text-5xl font-black text-[#111111] tabular-nums">{resultTag}</span>
                    <span className="text-base font-bold text-gray-400">번</span>
                  </div>
                </div>
                <div className="bg-[#F5C842] rounded-xl px-5 py-3 text-right">
                  <p className="text-[#111111]/60 text-xs font-bold uppercase tracking-widest mb-0.5">{t.zone}</p>
                  <p className="text-[#111111] font-black text-2xl">{resultRow}</p>
                </div>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-gray-400">시간</span><span className="font-bold text-[#111111]">{duration}시간 ({startT} → {pickupT})</span></div>
                <div className="flex justify-between"><span className="text-gray-400">짐</span>
                  <span className="font-bold text-[#111111]">
                    {smallQty > 0 ? `소형 ${smallQty}${t.pcs}` : ''}{smallQty > 0 && carrierQty > 0 ? ' · ' : ''}{carrierQty > 0 ? `캐리어 ${carrierQty}${t.pcs}` : ''}
                  </span>
                </div>
                <div className="flex justify-between pt-2 border-t border-[#f0f0f0]"><span className="text-gray-400">{t.total}</span><span className="font-black text-[#111111]">{finalPrice.toLocaleString()}원</span></div>
              </div>
            </div>
            <button onClick={() => navigate(`/ko/booking?from=kiosk&pickup=${branch?.branch_id ?? ''}&bags=${smallQty}&carriers=${carrierQty}&kiosk_tag=${resultTag}`)}
              className="w-full bg-[#F5C842] text-[#111111] font-black py-4 rounded-full text-base active:scale-[0.98] transition-transform flex items-center justify-center gap-2">
              <i className="fa-solid fa-plane" />{t.delivery_btn}
            </button>
          </div>
          <div className="bg-white p-8 flex flex-col items-center justify-center gap-4 border-l border-[#f0f0f0]">
            <p className="text-[#111111] font-black text-base text-center">{t.qr_scan}</p>
            <div className="bg-[#f9f9f9] rounded-[20px] p-3">
              <img src={qrUrl} alt="QR" className="w-44 h-44 rounded-xl" />
            </div>
            <p className="text-gray-400 text-sm">{t.qr_sub}</p>
            <button
              onClick={() => void printKioskReceipt({
                tag: resultTag,
                rowLabel: resultRow,
                branchName: branch?.branch_name ?? '',
                branchSlug: branch?.branch_name_en || branch?.slug || '',
                smallQty,
                carrierQty,
                duration,
                startTime: resultStartTime,
                pickupTime: addHours(resultStartTime, duration),
                originalPrice,
                discount,
                payment,
                date: todayStr(),
              })}
              className="w-full bg-[#F5C842] text-[#111111] font-black py-4 rounded-full text-base active:scale-[0.98] transition-transform flex items-center justify-center gap-2">
              <i className="fa-solid fa-print" /> 재출력
            </button>
            <button onClick={resetForm}
              className="w-full bg-[#111111] text-white font-black py-4 rounded-full text-base active:scale-[0.98] transition-transform relative overflow-hidden">
              {/* 카운트다운 진행 바 */}
              <span
                className="absolute inset-0 bg-white/10 transition-none"
                style={{ width: `${(resetCountdown / 30) * 100}%`, transitionProperty: 'none' }}
              />
              <span className="relative z-10">
                {resetCountdown <= 10
                  ? `${t.reset} (${resetCountdown}s)`
                  : t.reset}
              </span>
            </button>
          </div>
        </main>
      </div>
    );
  }

  // ─── 메인 폼 — 3컬럼 ──────────────────────────────────────────────────
  // 현재 현금만 운영 중 — 카드 제외, 미수금은 어드민 전용
  const paymentOptions: { value: PaymentMethod; label: string }[] = [
    { value: '현금', label: t.payment_cash },
  ];

  const startT = timeStr();

  return (
    <div className="h-screen bg-[#f5f5f7] flex flex-col overflow-hidden">
      {showAdmin && <AdminPanel {...adminPanelProps} />}

      {/* ✦ 배경 파티클 — 여성 고객 감성 골드 스파클 */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden z-0" aria-hidden>
        {([
          { ch: '✦', l: '7%',  delay: '0s',    dur: '7.5s',  size: 10, gold: true  },
          { ch: '✧', l: '19%', delay: '2.4s',  dur: '9.2s',  size: 7,  gold: false },
          { ch: '✦', l: '31%', delay: '1.1s',  dur: '6.8s',  size: 9,  gold: true  },
          { ch: '✿', l: '44%', delay: '3.6s',  dur: '8.4s',  size: 8,  gold: false },
          { ch: '✧', l: '56%', delay: '0.6s',  dur: '7.9s',  size: 7,  gold: true  },
          { ch: '✦', l: '67%', delay: '4.3s',  dur: '6.3s',  size: 11, gold: false },
          { ch: '✿', l: '79%', delay: '1.8s',  dur: '10s',   size: 8,  gold: true  },
          { ch: '✧', l: '89%', delay: '2.9s',  dur: '7.1s',  size: 9,  gold: false },
          { ch: '✦', l: '24%', delay: '5.2s',  dur: '8.8s',  size: 7,  gold: true  },
          { ch: '✿', l: '63%', delay: '3.1s',  dur: '9.6s',  size: 8,  gold: false },
        ] as { ch: string; l: string; delay: string; dur: string; size: number; gold: boolean }[]).map((p, i) => (
          <span key={i} style={{
            position: 'absolute',
            bottom: '-2%',
            left: p.l,
            fontSize: p.size,
            color: p.gold ? 'rgba(245,200,66,0.28)' : 'rgba(180,140,255,0.18)',
            animation: `kiosk-float ${p.dur} ${p.delay} ease-in-out infinite`,
            userSelect: 'none',
          }}>{p.ch}</span>
        ))}
      </div>

      {/* 헤더 — 랜딩 Navbar와 동일한 글래스 pill */}
      <header className="relative z-20 bg-black/60 backdrop-blur-2xl border-b border-white/5 px-4 py-2 flex items-center justify-between flex-shrink-0">
        {/* 로고 */}
        <button
          onPointerDown={handleLogoPointerDown}
          onPointerUp={handleLogoPointerUp}
          onPointerLeave={handleLogoPointerUp}
          className="select-none scale-90 origin-left"
        >
          <Logo size="sm" />
        </button>

        {/* 주문 번호 카운터 */}
        <div className="flex flex-col items-center select-none">
          <p className="text-white/40 text-[9px] font-bold uppercase tracking-widest mb-0.5">NEXT ORDER</p>
          {editingTag ? (
            <div className="flex items-center gap-2">
              <input
                type="number"
                min={1}
                max={100}
                value={tagInputVal}
                onChange={(e) => setTagInputVal(e.target.value)}
                onBlur={() => {
                  const v = Math.min(100, Math.max(1, parseInt(tagInputVal) || 1));
                  setNextTag(v);
                  setTagInputVal(String(v));
                  setEditingTag(false);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    const v = Math.min(100, Math.max(1, parseInt(tagInputVal) || 1));
                    setNextTag(v);
                    setTagInputVal(String(v));
                    setEditingTag(false);
                  }
                  if (e.key === 'Escape') setEditingTag(false);
                }}
                autoFocus
                className="w-16 text-center text-xl font-black bg-white/10 text-white rounded-xl px-2 py-1 focus:outline-none focus:ring-2 focus:ring-[#F5C842]"
              />
              <button
                onClick={() => {
                  const v = Math.min(100, Math.max(1, parseInt(tagInputVal) || 1));
                  setNextTag(v);
                  setTagInputVal(String(v));
                  setEditingTag(false);
                }}
                className="px-3 py-1.5 bg-[#F5C842] text-[#111111] rounded-xl font-black text-xs"
              >확인</button>
            </div>
          ) : (
            <button
              onClick={() => { setTagInputVal(String(nextTag)); setEditingTag(true); }}
              className="flex items-baseline gap-0.5 hover:opacity-80 transition-opacity group"
              title="탭하여 번호 수정"
            >
              <span className="text-white/30 text-sm font-black">#</span>
              <span className="text-[#F5C842] text-3xl font-black tabular-nums leading-none">{String(nextTag).padStart(2, '0')}</span>
              <i className="fa-solid fa-pen-to-square text-white/20 text-[10px] ml-1 group-hover:text-white/50 transition-colors" />
            </button>
          )}
        </div>

        {/* 우측: 오프라인 경고 + 언어 드롭다운 + 장부 햄버거 */}
        <div className="flex items-center gap-2">
          {!isOnline && (
            <div className="flex items-center gap-1.5 bg-orange-500/20 rounded-full px-3 py-1">
              <i className="fa-solid fa-wifi-slash text-orange-400 text-xs" />
              <span className="text-orange-400 text-xs font-bold">{t.offline_warn}</span>
            </div>
          )}

          {/* 언어 드롭다운 — Navbar와 동일한 구조 */}
          <div className="relative">
            <button
              onClick={() => setIsLangOpen(v => !v)}
              className="flex items-center gap-1.5 bg-white/5 hover:bg-white/10 px-2.5 py-1.5 min-h-[44px] rounded-full transition-all border border-white/5"
            >
              <img
                src={`https://flagcdn.com/w40/${({ ko:'kr', en:'us', zh:'cn', 'zh-TW':'tw', 'zh-HK':'hk', ja:'jp' } as Record<Lang,string>)[lang]}.png`}
                alt={lang}
                className="w-3.5 h-auto rounded-sm"
              />
              <span className="text-[10px] font-black text-white/80 tracking-widest uppercase">
                {({ ko:'KR', en:'EN', zh:'CN', 'zh-TW':'TW', 'zh-HK':'HK', ja:'JP' } as Record<Lang,string>)[lang]}
              </span>
            </button>

            {isLangOpen && (
              <div className="absolute top-full mt-2 right-0 bg-black/90 backdrop-blur-3xl rounded-2xl shadow-2xl border border-white/10 overflow-hidden py-2 z-50" style={{ width: '172px' }}>
                {/* 2열 그리드 */}
                <div className="grid grid-cols-2 gap-px px-2">
                  {([
                    ['ko',    'kr', 'KR', '한국어'],
                    ['en',    'us', 'EN', 'English'],
                    ['zh',    'cn', 'CN', '简体中文'],
                    ['zh-TW', 'tw', 'TW', '繁體中文'],
                    ['zh-HK', 'hk', 'HK', '粵語'],
                    ['ja',    'jp', 'JP', '日本語'],
                  ] as [Lang, string, string, string][]).map(([code, flag, label, name]) => (
                    <button
                      key={code}
                      onClick={() => { setLang(code); setIsLangOpen(false); }}
                      className={`flex flex-col items-center gap-1 px-2 py-2.5 rounded-xl hover:bg-white/10 transition-all ${lang === code ? 'bg-white/10 text-[#F5C842]' : 'text-white/60'}`}
                    >
                      <img src={`https://flagcdn.com/w40/${flag}.png`} alt={label} className="w-5 h-auto rounded-sm opacity-90" />
                      <span className="text-[10px] font-black tracking-widest">{label}</span>
                      <span className="text-[8px] font-medium text-white/40 leading-none">{name}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* 장부 — Navbar 햄버거와 동일 */}
          <button
            onClick={() => navigate(`/kiosk/${branchSlug}/log`)}
            className="w-11 h-11 bg-[#F5C842] flex flex-col items-center justify-center gap-[3px] rounded-xl hover:bg-white hover:scale-105 active:scale-95 transition-all shadow-xl"
            title="보관 장부"
          >
            <span className="w-4 h-[1.5px] bg-black rounded-full" />
            <span className="w-4 h-[1.5px] bg-black rounded-full" />
            <span className="w-4 h-[1.5px] bg-black rounded-full" />
          </button>
        </div>
      </header>

      {/* 오늘 접수 현황 */}
      {todayLog.length > 0 && (
        <div className="bg-white border-b border-black/[0.06] px-4 py-1.5 flex items-center gap-3 overflow-x-auto flex-shrink-0">
          <div className="flex items-center gap-2 flex-shrink-0">
            <span className="text-[#111111]/40 font-black text-[10px] tracking-[0.2em] uppercase">TODAY</span>
            <span className="bg-[#F5C842] text-[#111111] font-black text-[10px] px-2 py-0.5 rounded-full">
              {todayLog.filter(e => !e.done).length}건
            </span>
          </div>
          <div className="w-px h-3 bg-black/10 flex-shrink-0" />
          <div className="flex gap-1.5 overflow-x-auto">
            {todayLog.slice().reverse().map((e) => (
              <div key={e.id ?? e.tag}
                className={`flex-shrink-0 flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold ${
                  e.done ? 'bg-black/[0.04] text-black/25' : 'bg-[#F5C842]/15 text-[#111111]'
                }`}>
                <span className="font-black">#{e.tag}</span>
                <span className="opacity-50">{e.row_label}</span>
                <span>{e.duration}h</span>
                {e.done && <span className="opacity-40">✓</span>}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── 메인: 모바일 스크롤 세로 | PC(lg+) 좌우 2패널 ───────────── */}
      <main className="flex-1 overflow-y-auto lg:overflow-hidden flex flex-col lg:flex-row">

        {/* ─── 패널 A: ① 짐 + ② 시간 ─────────────────────────────── */}
        <div className="flex flex-col gap-3 px-4 pt-3 pb-2
                        lg:flex-1 lg:overflow-y-auto lg:pt-6 lg:pb-6 lg:pl-6 lg:pr-4 lg:gap-5">

          {/* ① 짐 수량 */}
          <div className="flex flex-col gap-2 lg:flex-shrink-0 lg:gap-3">
            {/* 섹션 헤더 — 노란 뱃지 */}
            <div className="flex items-center gap-2 flex-shrink-0">
              <span className="w-6 h-6 lg:w-7 lg:h-7 rounded-full bg-[#F5C842] flex items-center justify-center font-black text-xs lg:text-sm text-[#111111]">1</span>
              <span className="font-black text-[#111111] text-sm lg:text-base">{t.col1}</span>
            </div>

            {/* 가방 카드 그리드 */}
            <div className="grid grid-cols-2 gap-2 lg:gap-3">

              {/* 소형 가방 — portrait 카드 */}
              {(() => {
                const active = smallQty > 0;
                return (
                  <div
                    onClick={() => setSmallQty((v) => Math.min(cfg.operations.max_bags, v + 1))}
                    className={`relative rounded-2xl overflow-hidden cursor-pointer select-none transition-all active:scale-[0.97]
                      flex flex-col items-center justify-between p-4 pt-5 min-h-[155px]
                      lg:h-[200px] lg:min-h-0 lg:justify-center lg:gap-2 lg:p-4 lg:pt-5
                      ${active ? 'bg-[#F5C842] shadow-[0_4px_16px_rgba(245,200,66,0.35)]' : 'bg-white shadow-[0_2px_8px_rgba(0,0,0,0.06)]'}`}
                  >
                    {active && (
                      <div className="absolute top-2 right-2 min-w-[20px] h-5 lg:min-w-[24px] lg:h-6 rounded-full bg-[#111111] flex items-center justify-center px-1">
                        <span className="text-[#F5C842] font-black text-[9px] lg:text-[10px] tabular-nums">{smallQty}</span>
                      </div>
                    )}
                    <img src="/images/bags/hand-bag-photo.png" alt={t.small}
                      className="w-10 h-10 lg:w-14 lg:h-14 object-contain flex-shrink-0" />
                    <div className="text-center">
                      <p className="font-black text-sm text-[#111111] leading-tight">{t.small}</p>
                      <p className="text-[10px] text-[#111111]/50 mt-1 leading-tight">{t.small_desc}</p>
                    </div>
                    {!active ? (
                      <div className="w-full py-1.5 bg-black/[0.06] rounded-full text-[11px] font-bold text-[#111111]/50 text-center">
                        {t.touch_add}
                      </div>
                    ) : (
                      <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                        <button onClick={() => setSmallQty((v) => Math.max(0, v - 1))}
                          className="w-8 h-8 rounded-full bg-[#111111]/15 flex items-center justify-center font-black text-[#111111] active:scale-95">−</button>
                        {editingSmall ? (
                          <input
                            type="number"
                            value={smallInputVal}
                            onChange={(e) => setSmallInputVal(e.target.value)}
                            onBlur={() => {
                              const v = Math.min(cfg.operations.max_bags, Math.max(0, parseInt(smallInputVal) || 0));
                              setSmallQty(v); setSmallInputVal(String(v)); setEditingSmall(false);
                            }}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                const v = Math.min(cfg.operations.max_bags, Math.max(0, parseInt(smallInputVal) || 0));
                                setSmallQty(v); setSmallInputVal(String(v)); setEditingSmall(false);
                              }
                              if (e.key === 'Escape') { setSmallInputVal(String(smallQty)); setEditingSmall(false); }
                            }}
                            autoFocus
                            className="w-12 text-center font-black text-[#111111] text-lg tabular-nums bg-transparent border-b-2 border-[#111111] focus:outline-none"
                          />
                        ) : (
                          <span
                            onClick={() => { setSmallInputVal(String(smallQty)); setEditingSmall(true); }}
                            className="font-black text-[#111111] text-lg tabular-nums w-10 text-center cursor-text"
                          >{smallQty}</span>
                        )}
                        <button onClick={() => setSmallQty((v) => Math.min(cfg.operations.max_bags, v + 1))}
                          className="w-8 h-8 rounded-full bg-[#111111]/20 flex items-center justify-center font-black text-[#111111] active:scale-95">+</button>
                      </div>
                    )}
                  </div>
                );
              })()}

              {/* 대형 캐리어 — portrait 카드 */}
              {(() => {
                const active = carrierQty > 0;
                return (
                  <div
                    onClick={() => setCarrierQty((v) => Math.min(cfg.operations.max_bags, v + 1))}
                    className={`relative rounded-2xl overflow-hidden cursor-pointer select-none transition-all active:scale-[0.97]
                      flex flex-col items-center justify-between p-4 pt-5 min-h-[155px]
                      lg:h-[200px] lg:min-h-0 lg:justify-center lg:gap-2 lg:p-4 lg:pt-5
                      ${active ? 'bg-[#F5C842] shadow-[0_4px_16px_rgba(245,200,66,0.35)]' : 'bg-white shadow-[0_2px_8px_rgba(0,0,0,0.06)]'}`}
                  >
                    {active && (
                      <div className="absolute top-2 right-2 min-w-[20px] h-5 lg:min-w-[24px] lg:h-6 rounded-full bg-[#111111] flex items-center justify-center px-1">
                        <span className="text-[#F5C842] font-black text-[9px] lg:text-[10px] tabular-nums">{carrierQty}</span>
                      </div>
                    )}
                    <picture><source srcSet="/images/bags/carrier-photo.webp" type="image/webp" /><img src="/images/bags/carrier-photo.png" alt={t.carrier} className="w-10 h-10 lg:w-14 lg:h-14 object-contain flex-shrink-0" /></picture>
                    <div className="text-center">
                      <p className="font-black text-sm text-[#111111] leading-tight">{t.carrier}</p>
                      <p className="text-[10px] text-[#111111]/50 mt-1 leading-tight">{t.carrier_desc}</p>
                    </div>
                    {!active ? (
                      <div className="w-full py-1.5 bg-black/[0.06] rounded-full text-[11px] font-bold text-[#111111]/50 text-center">
                        {t.touch_add}
                      </div>
                    ) : (
                      <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                        <button onClick={() => setCarrierQty((v) => Math.max(0, v - 1))}
                          className="w-8 h-8 rounded-full bg-[#111111]/15 flex items-center justify-center font-black text-[#111111] active:scale-95">−</button>
                        {editingCarrier ? (
                          <input
                            type="number"
                            value={carrierInputVal}
                            onChange={(e) => setCarrierInputVal(e.target.value)}
                            onBlur={() => {
                              const v = Math.min(cfg.operations.max_bags, Math.max(0, parseInt(carrierInputVal) || 0));
                              setCarrierQty(v); setCarrierInputVal(String(v)); setEditingCarrier(false);
                            }}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                const v = Math.min(cfg.operations.max_bags, Math.max(0, parseInt(carrierInputVal) || 0));
                                setCarrierQty(v); setCarrierInputVal(String(v)); setEditingCarrier(false);
                              }
                              if (e.key === 'Escape') { setCarrierInputVal(String(carrierQty)); setEditingCarrier(false); }
                            }}
                            autoFocus
                            className="w-12 text-center font-black text-[#111111] text-lg tabular-nums bg-transparent border-b-2 border-[#111111] focus:outline-none"
                          />
                        ) : (
                          <span
                            onClick={() => { setCarrierInputVal(String(carrierQty)); setEditingCarrier(true); }}
                            className="font-black text-[#111111] text-lg tabular-nums w-10 text-center cursor-text"
                          >{carrierQty}</span>
                        )}
                        <button onClick={() => setCarrierQty((v) => Math.min(cfg.operations.max_bags, v + 1))}
                          className="w-8 h-8 rounded-full bg-[#111111]/20 flex items-center justify-center font-black text-[#111111] active:scale-95">+</button>
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>

            {/* 안내사항 — 별도 카드 */}
            {(cfg.notices[lang]?.length > 0 || (smallQty > 0 && carrierQty === 0 && duration > 0 && duration < 4)) && (
              <div className="bg-white rounded-2xl px-4 py-3.5 shadow-[0_2px_8px_rgba(0,0,0,0.06)] flex-shrink-0">
                <p className="font-bold text-xs text-[#111111] mb-2">{t.notice_title}</p>
                {cfg.notices[lang]?.map((n, i) => (
                  <p key={i} className="text-[11px] text-gray-500 flex items-start gap-1.5 mt-1">
                    <span className="text-[#F5C842] flex-shrink-0 mt-px">•</span>
                    <span>{n}</span>
                  </p>
                ))}
                {smallQty > 0 && carrierQty === 0 && duration > 0 && duration < 4 && (
                  <p className="text-orange-400 text-[11px] font-bold flex items-start gap-1.5 mt-1">
                    <span className="flex-shrink-0 mt-px">•</span>
                    <span>{t.from_4h}</span>
                  </p>
                )}
              </div>
            )}
          </div>

          {/* ② 보관 시간 */}
          <div className="flex flex-col gap-2 flex-shrink-0 lg:gap-3">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 lg:w-7 lg:h-7 rounded-full bg-[#F5C842] flex items-center justify-center font-black text-xs lg:text-sm text-[#111111]">2</span>
              <span className="font-black text-[#111111] text-sm lg:text-base">{t.col2}</span>
            </div>
            <div className="grid grid-cols-3 lg:grid-cols-6 gap-2.5">
              {cfg.operations.duration_options.map((h, idx) => {
                const isDisabled = smallQty > 0 && carrierQty === 0 && h < 4;
                const isSelected = duration === h;
                const previewPrice = calcPrice(smallQty, carrierQty, h, cfg.prices);
                const PASTEL_BG   = ['bg-blue-50','bg-violet-50','bg-emerald-50','bg-rose-50','bg-amber-50','bg-sky-50'];
                const PASTEL_TEXT = ['text-blue-500','text-violet-500','text-emerald-500','text-rose-500','text-amber-500','text-sky-500'];
                const PASTEL_SUB  = ['text-blue-400','text-violet-400','text-emerald-400','text-rose-400','text-amber-400','text-sky-400'];
                const pi = idx % 6;
                return (
                  <button key={h} disabled={isDisabled} onClick={() => setDuration(h)}
                    className={`rounded-xl lg:rounded-2xl font-black transition-all active:scale-[0.97]
                      flex flex-col items-center justify-center gap-0 py-2 lg:py-4 ${
                      isDisabled ? 'bg-gray-100 text-gray-300 cursor-not-allowed'
                      : isSelected ? 'bg-[#F5C842] shadow-[0_4px_12px_rgba(245,200,66,0.4)] text-[#111111]'
                      : `${PASTEL_BG[pi]} shadow-[0_1px_4px_rgba(0,0,0,0.04)]`
                    }`}>
                    <div className="flex items-baseline gap-0.5">
                      <span className={`text-xl lg:text-2xl font-black tabular-nums leading-none ${isSelected ? 'text-[#111111]' : PASTEL_TEXT[pi]}`}>{h}</span>
                      <span className={`text-[9px] lg:text-[10px] font-bold ${isSelected ? 'text-[#111111]/60' : PASTEL_SUB[pi]}`}>{t.duration}</span>
                    </div>
                    {!isDisabled && (
                      <span className={`text-[8px] lg:text-[9px] font-bold tabular-nums mt-0.5 ${isSelected ? 'text-[#111111]/50' : PASTEL_SUB[pi]}`}>
                        {previewPrice > 0 ? `${previewPrice.toLocaleString()}원` : '—'}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* ③ 모바일 전용 — 접수 확인 */}
          <div className="lg:hidden flex flex-col gap-2 pb-3">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-[#111111] flex items-center justify-center font-black text-xs text-[#F5C842]">3</span>
              <span className="font-black text-[#111111] text-sm">{t.col3}</span>
            </div>
            <div className="bg-white rounded-2xl px-4 py-3 shadow-[0_2px_8px_rgba(0,0,0,0.06)]">
              <div className="grid grid-cols-2 gap-x-2 gap-y-1.5 text-xs">
                <div className="flex justify-between"><span className="text-gray-400">{t.small}</span><span className="font-bold text-[#111111]">{smallQty}{t.pcs}</span></div>
                <div className="flex justify-between"><span className="text-gray-400">{t.carrier}</span><span className="font-bold text-[#111111]">{carrierQty}{t.pcs}</span></div>
                <div className="flex justify-between"><span className="text-gray-400">{t.col2}</span><span className="font-bold text-[#111111]">{duration > 0 ? `${duration}${t.duration}` : '—'}</span></div>
                <div className="flex justify-between"><span className="text-gray-400">{t.pickup}</span><span className="font-bold text-[#111111]">{duration > 0 ? addHours(startT, duration) : '—'}</span></div>
              </div>
              <div className="mt-2 pt-2 border-t border-gray-100 flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <span className="text-gray-400 text-xs">{t.select_payment}</span>
                  <span className="bg-[#111111] text-white text-xs font-black px-3 py-1 rounded-full">{t.payment_cash}</span>
                </div>
                <span className="font-black text-[#111111] text-base tabular-nums">{originalPrice.toLocaleString()}원</span>
              </div>
            </div>
            {cfg.discount.unit > 0 && (
              <div className="bg-white rounded-2xl px-4 py-2.5 shadow-[0_2px_8px_rgba(0,0,0,0.06)] flex items-center justify-between">
                <span className="text-gray-400 text-xs font-bold">{t.discount}</span>
                <div className="flex items-center gap-1.5">
                  <button onClick={() => setDiscount((d) => Math.max(0, d - cfg.discount.unit))}
                    className="w-7 h-7 rounded-full bg-gray-100 text-[#111111] font-black text-sm active:scale-95">−</button>
                  <span className="font-black text-[#111111] text-sm tabular-nums min-w-[44px] text-center">{discount.toLocaleString()}원</span>
                  <button onClick={() => { const max = cfg.discount.allow_free ? originalPrice : originalPrice - cfg.discount.unit; setDiscount((d) => Math.min(max, d + cfg.discount.unit)); }}
                    className="w-7 h-7 rounded-full bg-[#F5C842] text-[#111111] font-black text-sm active:scale-95">+</button>
                  {discount > 0 && <span className="font-black text-[#111111] text-xs tabular-nums ml-1">→ {finalPrice.toLocaleString()}원</span>}
                </div>
              </div>
            )}
            {!canSubmit && <p className="text-center text-[10px] text-gray-400">{smallQty + carrierQty === 0 ? t.select_bags : t.select_dur}</p>}
            <button disabled={!canSubmit || submitting} onClick={handleSubmit}
              className={`w-full py-3 rounded-full font-black text-sm transition-all active:scale-[0.98] ${canSubmit && !submitting ? 'bg-[#F5C842] text-[#111111] shadow-[0_6px_20px_rgba(245,200,66,0.45)] kiosk-cta-shimmer' : 'bg-gray-200 text-gray-400 cursor-not-allowed'}`}>
              {submitting ? <span className="inline-flex items-center gap-2"><i className="fa-solid fa-spinner animate-spin" /> 처리 중...</span> : t.submit}
            </button>
          </div>

        </div>

        {/* ─── 패널 B: ③ 접수 확인 (PC 전용 사이드바) ────────────── */}
        <div className="hidden lg:flex flex-col justify-center gap-4 w-[360px] border-l border-black/[0.06] py-8 px-8">
          <div className="flex items-center gap-2">
            <span className="w-7 h-7 rounded-full bg-[#111111] flex items-center justify-center font-black text-sm text-[#F5C842]">3</span>
            <span className="font-black text-[#111111] text-base">{t.col3}</span>
          </div>
          <div className="bg-white rounded-2xl px-6 py-5 shadow-[0_2px_12px_rgba(0,0,0,0.07)]">
            <div className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm mb-4">
              <div className="flex justify-between"><span className="text-gray-400">{t.small}</span><span className="font-bold text-[#111111]">{smallQty}{t.pcs}</span></div>
              <div className="flex justify-between"><span className="text-gray-400">{t.carrier}</span><span className="font-bold text-[#111111]">{carrierQty}{t.pcs}</span></div>
              <div className="flex justify-between"><span className="text-gray-400">{t.col2}</span><span className="font-bold text-[#111111]">{duration > 0 ? `${duration}${t.duration}` : '—'}</span></div>
              <div className="flex justify-between"><span className="text-gray-400">{t.pickup}</span><span className="font-bold text-[#111111]">{duration > 0 ? addHours(startT, duration) : '—'}</span></div>
            </div>
            <div className="pt-3 border-t border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-gray-400 text-xs">{t.select_payment}</span>
                <span className="bg-[#111111] text-white text-[10px] font-black px-2.5 py-0.5 rounded-full">{t.payment_cash}</span>
              </div>
              <span className="font-black text-[#111111] text-2xl tabular-nums">{originalPrice.toLocaleString()}원</span>
            </div>
          </div>
          {cfg.discount.unit > 0 && (
            <div className="bg-white rounded-2xl px-5 py-3 shadow-[0_2px_8px_rgba(0,0,0,0.06)] flex items-center justify-between">
              <span className="text-gray-400 text-xs font-bold">{t.discount}</span>
              <div className="flex items-center gap-2">
                <button onClick={() => setDiscount((d) => Math.max(0, d - cfg.discount.unit))}
                  className="w-8 h-8 rounded-full bg-gray-100 text-[#111111] font-black text-sm active:scale-95">−</button>
                <span className="font-black text-[#111111] text-sm tabular-nums min-w-[52px] text-center">{discount.toLocaleString()}원</span>
                <button onClick={() => { const max = cfg.discount.allow_free ? originalPrice : originalPrice - cfg.discount.unit; setDiscount((d) => Math.min(max, d + cfg.discount.unit)); }}
                  className="w-8 h-8 rounded-full bg-[#F5C842] text-[#111111] font-black text-sm active:scale-95">+</button>
                {discount > 0 && <span className="font-black text-[#111111] text-sm tabular-nums ml-1">→ {finalPrice.toLocaleString()}원</span>}
              </div>
            </div>
          )}
          {!canSubmit && <p className="text-center text-xs text-gray-400">{smallQty + carrierQty === 0 ? t.select_bags : t.select_dur}</p>}
          <button disabled={!canSubmit || submitting} onClick={handleSubmit}
            className={`w-full py-4 rounded-full font-black text-base transition-all active:scale-[0.98] ${canSubmit && !submitting ? 'bg-[#F5C842] text-[#111111] shadow-[0_8px_28px_rgba(245,200,66,0.45)] kiosk-cta-shimmer' : 'bg-gray-200 text-gray-400 cursor-not-allowed'}`}>
            {submitting ? <span className="inline-flex items-center gap-2"><i className="fa-solid fa-spinner animate-spin" /> 처리 중...</span> : t.submit}
          </button>
        </div>

      </main>

      {/* 온라인 인디케이터 */}
      <div className="fixed bottom-3 right-4 flex items-center gap-1.5 pointer-events-none">
        <div className={`w-1.5 h-1.5 rounded-full ${isOnline ? 'bg-green-400' : 'bg-red-400 animate-pulse'}`} />
        <span className="text-gray-400 text-[9px]">{isOnline ? 'online' : 'offline'}</span>
        {syncStatus === 'syncing' && <span className="text-gray-400 text-[9px] ml-1">{t.syncing}</span>}
      </div>
    </div>
  );
};

export default KioskPage;
