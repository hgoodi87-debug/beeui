/**
 * KioskPage — 현장 키오스크 (All-in-One 단일 화면)
 * URL: /kiosk/:branchSlug
 * - 인증 불필요, 전체화면 태블릿 최적화
 * - 3컬럼 통합: ① 짐 수량 | ② 보관 시간 | ③ 접수 확인
 * - Beeliber Onyx & Gold 디자인 시스템
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
type Lang = 'ko' | 'en' | 'zh';
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
    select_bags: '짐을 입력해주세요', select_dur: '보관 시간을 선택해주세요',
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
    select_bags: 'Please enter bag count', select_dur: 'Please select duration',
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
    select_bags: '请输入行李数量', select_dur: '请选择存放时间',
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
                    <img src="/images/bags/carrier-photo.png" alt="캐리어" className="w-10 h-10 object-contain mx-auto mb-2 opacity-80" />
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
                          min={1} max={20} />
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

  // 성공 화면
  const [step, setStep] = useState<'form' | 'success'>('form');
  const [resultTag, setResultTag] = useState(0);
  const [resultRow, setResultRow] = useState('A');
  const [resultStartTime, setResultStartTime] = useState('');
  const [submitting, setSubmitting] = useState(false);

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
    const { tag, rowLabel } = assignTagAndRow(currentLog, cfg);
    const payload = {
      branch_id: branch.branch_id ?? branch.slug,
      date: today, tag,
      small_qty: smallQty, carrier_qty: carrierQty,
      start_time: startTime, pickup_time: pickupTime, pickup_ts: pickupTs,
      duration, original_price: originalPrice, discount, payment,
      done: false, memo: '', row_label: rowLabel,
      source: 'kiosk' as const, commission_rate: 0,
    };
    await insertStorageLog(payload);
    setResultTag(tag);
    setResultRow(rowLabel);
    setResultStartTime(startTime);
    setTodayLog((prev) => [...prev, { ...payload, id: tag, created_at: new Date().toISOString() }]);
    setOfflineCount(getOfflineQueueSize());
    setSubmitting(false);
    setStep('success');
  }, [branch, cfg, smallQty, carrierQty, duration, originalPrice, discount, payment, canSubmit]);

  const resetForm = () => {
    setStep('form');
    setSmallQty(0); setCarrierQty(0); setDuration(0);
    setPayment('현금'); setDiscount(0);
    setResultTag(0); setResultRow('A');
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
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?data=${encodeURIComponent(deliveryUrl)}&size=220x220&bgcolor=ffffff&color=111111&margin=10`;

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
            <button onClick={resetForm}
              className="w-full bg-[#111111] text-white font-black py-4 rounded-full text-base active:scale-[0.98] transition-transform">
              {t.reset}
            </button>
          </div>
        </main>
      </div>
    );
  }

  // ─── 메인 폼 — 3컬럼 ──────────────────────────────────────────────────
  const paymentOptions: { value: PaymentMethod; label: string }[] = [
    { value: '현금', label: t.payment_cash },
    { value: '카드', label: t.payment_card },
    // '미수금'은 어드민 전용 — 손님 화면에 노출하지 않음
  ];

  const startT = timeStr();

  return (
    <div className="h-screen bg-[#f9f9f9] flex flex-col overflow-hidden">
      {showAdmin && <AdminPanel {...adminPanelProps} />}

      {/* 헤더 */}
      <header className="bg-[#111111] px-8 py-3 flex items-center justify-between flex-shrink-0">
        <button onPointerDown={handleLogoPointerDown} onPointerUp={handleLogoPointerUp} onPointerLeave={handleLogoPointerUp} className="select-none">
          <p className="text-[#F5C842] font-black text-lg tracking-[0.18em]">BEELIBER</p>
          <p className="text-white/40 text-xs">{lang === 'ko' ? branch?.branch_name : branch?.branch_name_en ?? branch?.branch_name}</p>
        </button>
        <div className="flex items-center gap-3">
          {!isOnline && (
            <div className="flex items-center gap-1.5 bg-orange-500/20 rounded-full px-3 py-1">
              <i className="fa-solid fa-wifi-slash text-orange-400 text-xs" />
              <span className="text-orange-400 text-xs font-bold">{t.offline_warn}</span>
            </div>
          )}
          <div className="flex gap-1.5">
            {(['ko', 'en', 'zh'] as Lang[]).map((l) => (
              <button key={l} onClick={() => setLang(l)}
                className={`px-3 py-1.5 rounded-full text-xs font-black transition-all ${lang === l ? 'bg-[#F5C842] text-[#111111]' : 'text-white/40 ring-1 ring-white/20'}`}>
                {l === 'ko' ? 'KO' : l === 'en' ? 'EN' : 'ZH'}
              </button>
            ))}
          </div>
          <button
            onClick={() => setShowAdmin(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/10 text-white/60 hover:bg-[#F5C842] hover:text-[#111111] transition-all text-xs font-black"
            title="보관 장부"
          >
            <i className="fa-solid fa-book text-xs" />
            <span>장부</span>
          </button>
        </div>
      </header>

      {/* 오늘 접수 현황 — 상단 미니 패널 */}
      {todayLog.length > 0 && (
        <div className="bg-[#111111] border-b border-white/10 px-4 py-2 flex items-center gap-3 overflow-x-auto flex-shrink-0">
          <div className="flex items-center gap-2 flex-shrink-0">
            <span className="text-[#F5C842] font-black text-xs tracking-widest uppercase">TODAY</span>
            <span className="bg-[#F5C842] text-[#111111] font-black text-xs px-2 py-0.5 rounded-full">
              {todayLog.filter(e => !e.done).length}건
            </span>
          </div>
          <div className="w-px h-4 bg-white/20 flex-shrink-0" />
          <div className="flex gap-2 overflow-x-auto">
            {todayLog.slice().reverse().map((e) => (
              <div key={e.id ?? e.tag}
                className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold ${
                  e.done ? 'bg-white/10 text-white/30' : 'bg-[#F5C842]/15 text-[#F5C842]'
                }`}>
                <span className="font-black">#{e.tag}</span>
                <span className="text-white/40">{e.row_label}</span>
                <span>{e.duration}h</span>
                {e.done && <span className="text-white/30">✓</span>}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 세로 중앙 정렬 메인 */}
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-lg mx-auto w-full px-5 py-5 flex flex-col gap-5">

          {/* ── ① 짐 수량 ──────────────────────────────────────────────── */}
          <section className="flex flex-col gap-3">
            <ColHeader num={1} label={t.col1} />

            {/* 가로 카드형 품목 선택 */}
            <div className="grid grid-cols-2 gap-3">
              {/* 소형 가방 카드 */}
              {(() => {
                const active = smallQty > 0;
                return (
                  <div
                    onClick={() => setSmallQty((v) => Math.min(cfg.operations.max_bags, v + 1))}
                    className={`relative rounded-[20px] shadow-[0_4px_20px_rgba(0,0,0,0.06)] p-4 flex flex-col items-center gap-2 cursor-pointer select-none transition-all active:scale-[0.97] ${
                      active ? 'bg-[#F5C842] ring-2 ring-[#F5C842]' : 'bg-white'
                    }`}
                  >
                    {/* 수량 뱃지 */}
                    {active && (
                      <div className="absolute top-3 right-3 w-6 h-6 rounded-full bg-[#111111] flex items-center justify-center">
                        <span className="text-[#F5C842] font-black text-xs">{smallQty}</span>
                      </div>
                    )}
                    <img src="/images/bags/hand-bag-photo.png" alt={t.small} className="w-16 h-16 object-contain drop-shadow-sm" />
                    <div className="text-center">
                      <p className={`font-black text-sm leading-tight ${active ? 'text-[#111111]' : 'text-[#111111]'}`}>{t.small}</p>
                      <p className={`text-[10px] mt-0.5 ${active ? 'text-[#111111]/60' : 'text-gray-400'}`}>{t.small_desc}</p>
                    </div>
                    {/* 카운터 조작 */}
                    {active && (
                      <div className="flex items-center gap-2 mt-1" onClick={(e) => e.stopPropagation()}>
                        <button onClick={() => setSmallQty((v) => Math.max(0, v - 1))}
                          className="w-8 h-8 rounded-full bg-[#111111]/15 flex items-center justify-center text-base font-black text-[#111111] active:scale-95">−</button>
                        <span className="text-lg font-black text-[#111111] w-6 text-center tabular-nums">{smallQty}</span>
                        <button onClick={() => setSmallQty((v) => Math.min(cfg.operations.max_bags, v + 1))}
                          className="w-8 h-8 rounded-full bg-[#111111]/20 flex items-center justify-center text-base font-black text-[#111111] active:scale-95">+</button>
                      </div>
                    )}
                    {!active && (
                      <div className="mt-1 px-4 py-1 rounded-full bg-[#f5f5f5] text-gray-400 text-xs font-bold">터치로 추가</div>
                    )}
                  </div>
                );
              })()}

              {/* 대형 캐리어 카드 */}
              {(() => {
                const active = carrierQty > 0;
                return (
                  <div
                    onClick={() => setCarrierQty((v) => Math.min(cfg.operations.max_bags, v + 1))}
                    className={`relative rounded-[20px] shadow-[0_4px_20px_rgba(0,0,0,0.06)] p-4 flex flex-col items-center gap-2 cursor-pointer select-none transition-all active:scale-[0.97] ${
                      active ? 'bg-[#111111] ring-2 ring-[#111111]' : 'bg-white'
                    }`}
                  >
                    {/* 수량 뱃지 */}
                    {active && (
                      <div className="absolute top-3 right-3 w-6 h-6 rounded-full bg-[#F5C842] flex items-center justify-center">
                        <span className="text-[#111111] font-black text-xs">{carrierQty}</span>
                      </div>
                    )}
                    <img src="/images/bags/carrier-photo.png" alt={t.carrier} className="w-16 h-16 object-contain drop-shadow-sm" />
                    <div className="text-center">
                      <p className={`font-black text-sm leading-tight ${active ? 'text-white' : 'text-[#111111]'}`}>{t.carrier}</p>
                      <p className={`text-[10px] mt-0.5 ${active ? 'text-white/50' : 'text-gray-400'}`}>{t.carrier_desc}</p>
                    </div>
                    {/* 카운터 조작 */}
                    {active && (
                      <div className="flex items-center gap-2 mt-1" onClick={(e) => e.stopPropagation()}>
                        <button onClick={() => setCarrierQty((v) => Math.max(0, v - 1))}
                          className="w-8 h-8 rounded-full bg-white/15 flex items-center justify-center text-base font-black text-white active:scale-95">−</button>
                        <span className="text-lg font-black text-white w-6 text-center tabular-nums">{carrierQty}</span>
                        <button onClick={() => setCarrierQty((v) => Math.min(cfg.operations.max_bags, v + 1))}
                          className="w-8 h-8 rounded-full bg-[#F5C842]/30 flex items-center justify-center text-base font-black text-white active:scale-95">+</button>
                      </div>
                    )}
                    {!active && (
                      <div className="mt-1 px-4 py-1 rounded-full bg-[#f5f5f5] text-gray-400 text-xs font-bold">터치로 추가</div>
                    )}
                  </div>
                );
              })()}
            </div>

            {/* 안내사항 */}
            {cfg.notices[lang]?.length > 0 && (
              <div className="bg-white rounded-[20px] p-4 shadow-[0_4px_20px_rgba(0,0,0,0.04)]">
                <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-2">{t.notice_title}</p>
                <ul className="space-y-1.5">
                  {cfg.notices[lang].map((n, i) => (
                    <li key={i} className="text-xs text-gray-600 flex items-start gap-2">
                      <span className="text-[#F5C842] flex-shrink-0">•</span>{n}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* 소형 4h 제한 알림 */}
            {smallQty > 0 && carrierQty === 0 && duration > 0 && duration < 4 && (
              <div className="bg-orange-50 rounded-[16px] p-3">
                <p className="text-orange-500 text-xs font-bold">{t.from_4h}</p>
              </div>
            )}
          </section>

          {/* ── ② 보관 시간 ─────────────────────────────────────────────── */}
          <section className="flex flex-col gap-3">
            <ColHeader num={2} label={t.col2} />

            <div className="grid grid-cols-3 gap-2.5">
              {cfg.operations.duration_options.map((h) => {
                const isDisabled = smallQty > 0 && carrierQty === 0 && h < 4;
                const isSelected = duration === h;
                const previewPrice = calcPrice(smallQty, carrierQty, h, cfg.prices);
                // 시간대별 색상
                const palette = h <= 2
                  ? { idle: 'bg-sky-50 text-sky-600', sel: 'bg-sky-400 text-white', badge: 'bg-sky-100 text-sky-700', badgeSel: 'bg-white/20 text-white' }
                  : h <= 4
                  ? { idle: 'bg-teal-50 text-teal-600', sel: 'bg-teal-400 text-white', badge: 'bg-teal-100 text-teal-700', badgeSel: 'bg-white/20 text-white' }
                  : h <= 5
                  ? { idle: 'bg-amber-50 text-amber-600', sel: 'bg-[#F5C842] text-[#111111]', badge: 'bg-amber-100 text-amber-700', badgeSel: 'bg-[#111]/10 text-[#111]/70' }
                  : h <= 6
                  ? { idle: 'bg-orange-50 text-orange-500', sel: 'bg-orange-400 text-white', badge: 'bg-orange-100 text-orange-600', badgeSel: 'bg-white/20 text-white' }
                  : h <= 7
                  ? { idle: 'bg-rose-50 text-rose-500', sel: 'bg-rose-400 text-white', badge: 'bg-rose-100 text-rose-600', badgeSel: 'bg-white/20 text-white' }
                  : { idle: 'bg-violet-50 text-violet-600', sel: 'bg-violet-400 text-white', badge: 'bg-violet-100 text-violet-700', badgeSel: 'bg-white/20 text-white' };
                return (
                  <button key={h} disabled={isDisabled} onClick={() => setDuration(h)}
                    className={`rounded-[16px] font-black transition-all active:scale-[0.97] shadow-[0_2px_12px_rgba(0,0,0,0.06)] flex flex-col items-center justify-center gap-1 py-3 ${
                      isDisabled ? 'bg-[#f0f0f0] text-gray-300 cursor-not-allowed'
                      : isSelected ? palette.sel
                      : palette.idle
                    }`}>
                    <span className="text-xl font-black tabular-nums">{h}</span>
                    <span className="text-[10px] font-bold opacity-70">{t.duration}</span>
                    {!isDisabled && (
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        isSelected ? palette.badgeSel : palette.badge
                      }`}>
                        {previewPrice > 0 ? `${previewPrice.toLocaleString()}원` : '-'}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* 가격 미리보기 바 */}
            {duration > 0 && (smallQty + carrierQty > 0) && (
              <div className="bg-white rounded-[16px] px-5 py-3 shadow-[0_4px_20px_rgba(0,0,0,0.06)] flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-xs font-bold uppercase tracking-wide">{t.total}</p>
                  <p className="text-[#111111] font-black text-xl">{originalPrice.toLocaleString()}원</p>
                </div>
                <div className="text-right">
                  <p className="text-gray-400 text-xs">{t.pickup}</p>
                  <p className="text-[#111111] font-bold">{addHours(startT, duration)}</p>
                </div>
              </div>
            )}
          </section>

          {/* ── ③ 접수 확인 ─────────────────────────────────────────────── */}
          <section className="flex flex-col gap-3">
            <ColHeader num={3} label={t.col3} />

            {/* 요약 카드 */}
            <div className="bg-white rounded-[20px] p-5 shadow-[0_4px_20px_rgba(0,0,0,0.06)]">
              <div className="space-y-2.5 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">{t.small}</span>
                  <span className="font-bold text-[#111111]">{smallQty}{t.pcs}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">{t.carrier}</span>
                  <span className="font-bold text-[#111111]">{carrierQty}{t.pcs}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">{t.col2}</span>
                  <span className="font-bold text-[#111111]">{duration > 0 ? `${duration}${t.duration}` : '—'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">{t.start}</span>
                  <span className="font-bold text-[#111111]">{startT}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">{t.pickup}</span>
                  <span className="font-bold text-[#111111]">{duration > 0 ? addHours(startT, duration) : '—'}</span>
                </div>
                <div className="pt-2.5 border-t border-[#f0f0f0] flex justify-between items-center">
                  <span className="text-gray-400 font-bold">{t.total}</span>
                  <span className="font-black text-[#111111] text-xl">{originalPrice.toLocaleString()}원</span>
                </div>
              </div>
            </div>

            {/* 결제 방법 */}
            <div className="bg-white rounded-[20px] p-4 shadow-[0_4px_20px_rgba(0,0,0,0.06)]">
              <p className="text-gray-400 text-xs font-bold uppercase tracking-widest mb-3">{t.select_payment}</p>
              <div className="flex gap-2">
                {paymentOptions.map((opt) => (
                  <button key={opt.value} onClick={() => setPayment(opt.value)}
                    className={`flex-1 py-3 rounded-full font-black text-sm transition-all active:scale-[0.98] ${
                      payment === opt.value ? 'bg-[#111111] text-white' : 'bg-[#f5f5f5] text-gray-600'
                    }`}>
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* 할인 */}
            {cfg.discount.unit > 0 && (
              <div className="bg-white rounded-[20px] p-4 shadow-[0_4px_20px_rgba(0,0,0,0.06)]">
                <p className="text-gray-400 text-xs font-bold uppercase tracking-widest mb-2.5">{t.discount}</p>
                <div className="flex items-center gap-3">
                  <button onClick={() => setDiscount((d) => Math.max(0, d - cfg.discount.unit))}
                    className="w-11 h-11 rounded-full bg-[#f0f0f0] text-[#111111] font-black text-xl active:scale-95">−</button>
                  <span className="flex-1 text-center font-black text-[#111111] text-lg">{discount.toLocaleString()}원</span>
                  <button onClick={() => {
                    const max = cfg.discount.allow_free ? originalPrice : originalPrice - cfg.discount.unit;
                    setDiscount((d) => Math.min(max, d + cfg.discount.unit));
                  }} className="w-11 h-11 rounded-full bg-[#F5C842] text-[#111111] font-black text-xl active:scale-95">+</button>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between mt-2.5 pt-2.5 border-t border-[#f0f0f0] text-sm">
                    <span className="text-gray-400">{t.total}</span>
                    <span className="font-black text-[#111111]">{finalPrice.toLocaleString()}원</span>
                  </div>
                )}
              </div>
            )}

            {/* 접수하기 버튼 */}
            <div className="pb-6">
              {!canSubmit && (
                <p className="text-center text-xs text-gray-400 mb-2">
                  {smallQty + carrierQty === 0 ? t.select_bags : t.select_dur}
                </p>
              )}
              <button disabled={!canSubmit || submitting} onClick={handleSubmit}
                className={`w-full py-5 rounded-full font-black text-lg transition-all active:scale-[0.98] ${
                  canSubmit && !submitting
                    ? 'bg-[#F5C842] text-[#111111] shadow-[0_8px_32px_rgba(245,200,66,0.4)]'
                    : 'bg-[#e0e0e0] text-gray-400 cursor-not-allowed'
                }`}>
                {submitting
                  ? <span className="inline-flex items-center gap-2"><i className="fa-solid fa-spinner animate-spin" /> 처리 중...</span>
                  : t.submit}
              </button>
            </div>
          </section>

        </div>
      </main>

      {/* 온라인 인디케이터 */}
      <div className="fixed bottom-4 right-5 flex items-center gap-1.5 pointer-events-none">
        <div className={`w-1.5 h-1.5 rounded-full ${isOnline ? 'bg-green-400' : 'bg-red-400 animate-pulse'}`} />
        <span className="text-gray-400 text-[10px]">{isOnline ? 'online' : 'offline'}</span>
        {syncStatus === 'syncing' && <span className="text-gray-400 text-[10px] ml-1">{t.syncing}</span>}
      </div>
    </div>
  );
};

export default KioskPage;
