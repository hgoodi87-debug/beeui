/**
 * KioskTab — 현장 키오스크 통합 관리
 * UI: Stitch "Beeliber Onyx & Gold" 디자인 시스템 적용
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  KioskBranch,
  loadAllActiveBranches,
  loadSettings,
  loadTodayLog,
  loadLogRange,
  insertStorageLog,
  updateStorageLog,
  upsertSetting,
  assignTagAndRow,
  todayStr as tdy,
  DEFAULT_CFG as KIOSK_DEFAULT_CFG,
  KIOSK_TABLES,
} from '../../services/kioskDb';
import { supabaseGet, supabaseMutate } from '../../services/supabaseClient';

// ─── 타입 ─────────────────────────────────────────────────────────────────
interface Entry {
  id: number; date: string; tag: number;
  smallQty: number; carrierQty: number;
  startTime: string; pickupTime: string; pickupTs: number;
  duration: number; originalPrice: number; discount: number;
  payment: string; done: boolean; memo: string; rowLabel: string;
}
interface RowRule { label: string; start: string; end: string; max: number; }
interface Cfg {
  prices: { small_4h: number; carrier_2h: number; carrier_4h: number; extra_per_hour: number };
  operations: { max_bags: number; close_hour: number; duration_options: number[] };
  notices: { ko: string[]; en: string[]; zh: string[] };
  discount: { unit: number; allow_free: boolean };
  admin_password: string;
  row_rules: { rows: RowRule[] };
}

const DEFAULT_CFG: Cfg = KIOSK_DEFAULT_CFG;

// ─── i18n ─────────────────────────────────────────────────────────────────
type Lang = 'ko' | 'en' | 'zh';
const T: Record<Lang, Record<string, string>> = {
  ko: {
    s_tag: '태그 번호', tag_hint: '숫자를 눌러 직접 입력할 수 있습니다',
    s_bag: '짐 수량 입력', s_dur: '보관 시간 선택', s_assign: '태그 · 구역 배정',
    t_small: '소형 가방', t_small_d: '토트백 · 소형백 · 소형 배낭',
    t_carrier: '캐리어', t_carrier_d: '여행용 캐리어 · 큰 가방',
    l_start: '보관 시작', l_pickup: '픽업 예정', l_total: '합계',
    btn_sub: '접수 완료', m_title: '접수 확인', btn_cancel: '취소', btn_ok: '확인하였습니다',
    suc_t: '접수 완료!', ntc_title: '주의사항',
    mk_tag: '태그', mk_type: '유형', mk_dur: '시간', mk_start: '시작', mk_pk: '픽업 예정', mk_price: '총 요금',
    st_total: '전체', st_done: '반납완료', active: '보관중', st_over: '시간초과', st_rev: '오늘수익', st_unpaid: '미수금',
    ts: '소형', tc: '캐리어', hr: '시간', hr8p: '8시간+',
    om: '분 초과', oh: '시간', free: '무료', no_disc: '할인 없음', pd: '완료', up: '미수금',
    del: '삭제하시겠습니까?', empty: '데이터가 없습니다', pcs: '개', from4: '4시간부터 가능',
    find_title: '가방 찾기', find_placeholder: '태그 번호 (예: 7)', find_btn: '검색',
    a_title: '보관 장부', a_date: '날짜', a_stat: '상태',
    f_all: '전체', f_wait: '대기', f_over: '초과', f_done: '완료',
    set_price: '가격 설정', set_ops: '운영 설정', set_notices: '안내 메시지',
    set_disc: '할인 설정', set_rows: '구역 배치 규칙 (A~G)', set_pass: '보안 설정',
    save_btn: '설정 저장', saved: '저장되었습니다',
    pass_title: '비밀번호 입력', pass_error: '비밀번호가 잘못되었습니다',
  },
  en: {
    s_tag: 'Tag Number', tag_hint: 'Tap the number to type directly',
    s_bag: 'Bag Quantity', s_dur: 'Storage Duration', s_assign: 'Tag & Zone',
    t_small: 'Small Bag', t_small_d: 'Handbag · Tote · Small backpack',
    t_carrier: 'Carrier', t_carrier_d: 'Suitcase · Large luggage',
    l_start: 'Start', l_pickup: 'Pickup', l_total: 'Total',
    btn_sub: 'Check In', m_title: 'Confirm', btn_cancel: 'Cancel', btn_ok: 'I Agree',
    suc_t: 'Complete!', ntc_title: 'Notice',
    mk_tag: 'Tag', mk_type: 'Type', mk_dur: 'Duration', mk_start: 'Start', mk_pk: 'Pickup', mk_price: 'Total',
    st_total: 'Total', st_done: 'Returned', active: 'Stored', st_over: 'Overdue', st_rev: 'Revenue', st_unpaid: 'Unpaid',
    ts: 'Small', tc: 'Carrier', hr: 'hr', hr8p: '8hr+',
    om: 'min over', oh: 'hr', free: 'Free', no_disc: 'No discount', pd: 'Paid', up: 'Unpaid',
    del: 'Delete?', empty: 'No data', pcs: '', from4: 'from 4hr',
    find_title: 'Find Luggage', find_placeholder: 'Tag number (e.g. 7)', find_btn: 'Search',
    a_title: 'Storage Log', a_date: 'Date', a_stat: 'Status',
    f_all: 'All', f_wait: 'Waiting', f_over: 'Overdue', f_done: 'Done',
    set_price: 'Price Settings', set_ops: 'Operations', set_notices: 'Notice Messages',
    set_disc: 'Discount', set_rows: 'Zone Rules (A~G)', set_pass: 'Security',
    save_btn: 'Save Settings', saved: 'Saved',
    pass_title: 'Enter Password', pass_error: 'Wrong password',
  },
  zh: {
    s_tag: '标签号码', tag_hint: '点击数字可直接输入',
    s_bag: '行李数量', s_dur: '存放时间', s_assign: '标签 · 区域',
    t_small: '小包', t_small_d: '手提包 · 环保袋 · 小背包',
    t_carrier: '行李箱', t_carrier_d: '旅行箱 · 大行李',
    l_start: '开始', l_pickup: '取件', l_total: '合计',
    btn_sub: '提交接收', m_title: '确认', btn_cancel: '取消', btn_ok: '确认',
    suc_t: '完成！', ntc_title: '注意事项',
    mk_tag: '标签', mk_type: '类型', mk_dur: '时间', mk_start: '开始', mk_pk: '取件', mk_price: '费用',
    st_total: '全部', st_done: '已取', active: '存放中', st_over: '超时', st_rev: '今日收入', st_unpaid: '未付',
    ts: '小包', tc: '行李箱', hr: '小时', hr8p: '8小时+',
    om: '分超时', oh: '小时', free: '免费', no_disc: '无折扣', pd: '已付', up: '未付',
    del: '确认删除？', empty: '暂无数据', pcs: '件', from4: '4小时起',
    find_title: '找行李', find_placeholder: '标签号 (如: 7)', find_btn: '查找',
    a_title: '存放记录', a_date: '日期', a_stat: '状态',
    f_all: '全部', f_wait: '等待', f_over: '超时', f_done: '完成',
    set_price: '价格设置', set_ops: '运营设置', set_notices: '提示信息',
    set_disc: '折扣设置', set_rows: '区域规则 (A~G)', set_pass: '安全设置',
    save_btn: '保存设置', saved: '已保存',
    pass_title: '输入密码', pass_error: '密码错误',
  },
};

// ─── 유틸 ─────────────────────────────────────────────────────────────────
const ROW_COLORS: Record<string, string> = {
  A: '#6366F1', B: '#3B82F6', C: '#10B981', D: '#F59E0B', E: '#EF4444', F: '#EC4899', G: '#8B5CF6',
};
const pad = (v: number) => String(v).padStart(2, '0');
const fmt = (d: Date) => `${pad(d.getHours())}:${pad(d.getMinutes())}`;
const timeToMin = (t: string) => { const [h, m] = t.split(':').map(Number); return h * 60 + m; };
const fromDB = (r: any): Entry => ({
  id: r.id, date: r.date, tag: r.tag,
  smallQty: r.small_qty, carrierQty: r.carrier_qty,
  startTime: r.start_time, pickupTime: r.pickup_time, pickupTs: Number(r.pickup_ts),
  duration: r.duration, originalPrice: r.original_price,
  discount: r.discount || 0, payment: r.payment,
  done: r.done, memo: r.memo || '', rowLabel: r.row_label || '',
});

// ─── 메인 ─────────────────────────────────────────────────────────────────
type SubView = 'checkin' | 'admin' | 'settings';

interface KioskTabProps {
  initialBranchSlug?: string;
  /** 장부 전용 모드: 보관장부·설정만 표시, 지점 선택 숨김, 기본 뷰 = admin */
  logMode?: boolean;
  /** 외부에서 뷰 제어 (logMode에서 KioskLogPage 헤더 탭 연동) */
  activeView?: SubView;
  onViewChange?: (v: SubView) => void;
}

const KioskTab: React.FC<KioskTabProps> = ({ initialBranchSlug, logMode = false, activeView, onViewChange }) => {
  const [viewInner, setViewInner] = useState<SubView>(logMode ? 'admin' : 'checkin');
  const view = activeView ?? viewInner;
  const setView = (v: SubView) => { setViewInner(v); onViewChange?.(v); };
  const [lang, setLang] = useState<Lang>('ko');
  const [cfg, setCfg] = useState<Cfg>(DEFAULT_CFG);
  const [entries, setEntries] = useState<Entry[]>([]);
  const [cfgLoaded, setCfgLoaded] = useState(false);

  // 지점 목록 + 선택된 지점
  const [branches, setBranches] = useState<KioskBranch[]>([]);
  const [selectedBranch, setSelectedBranch] = useState<KioskBranch | null>(null);

  const t = (k: string) => T[lang]?.[k] ?? T.ko[k] ?? k;

  // 지점 목록 로딩
  useEffect(() => {
    loadAllActiveBranches().then((list) => {
      setBranches(list);
      if (list.length > 0) {
        if (initialBranchSlug) {
          const match = list.find((b) => b.slug === initialBranchSlug || b.branch_id === initialBranchSlug);
          setSelectedBranch(match ?? list[0]);
        } else {
          setSelectedBranch(list[0]);
        }
      }
    });
  }, [initialBranchSlug]);

  const branchId = selectedBranch?.branch_id ?? selectedBranch?.slug ?? 'default';

  const loadCfg = useCallback(async () => {
    if (!branchId) return;
    try {
      const settings = await loadSettings(branchId);
      setCfg(settings);
    } catch { /* silent */ } finally { setCfgLoaded(true); }
  }, [branchId]);

  const loadData = useCallback(async () => {
    if (!branchId) return;
    const today = tdy();
    const rows = await loadTodayLog(branchId, today);
    setEntries(rows.map(fromDB));
  }, [branchId]);

  useEffect(() => { loadCfg(); }, [loadCfg]);
  useEffect(() => { loadData(); }, [loadData]);

  useEffect(() => {
    if (view !== 'admin') return;
    const id = setInterval(loadData, 30000);
    return () => clearInterval(id);
  }, [view, loadData]);

  const saveCfgToDb = async (next: Cfg) => {
    const keys = ['prices', 'operations', 'notices', 'discount', 'admin_password', 'row_rules'] as const;
    for (const key of keys) {
      await upsertSetting(branchId, key, (next as any)[key]);
    }
  };

  const assignRow = async (startTime: string): Promise<string> => {
    const today = tdy();
    const currentLog = await loadTodayLog(branchId, today);
    const { rowLabel } = assignTagAndRow(currentLog, cfg);
    return rowLabel;
  };

  if (!cfgLoaded || branches.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-bee-yellow border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const allSubTabs: { id: SubView; label: string; icon: string }[] = [
    { id: 'checkin',  label: lang === 'ko' ? '현장 접수'    : lang === 'zh' ? '现场接收' : 'Check-in',    icon: 'fa-clipboard-check' },
    { id: 'admin',   label: lang === 'ko' ? '보관 장부'    : lang === 'zh' ? '存放记录' : 'Storage Log', icon: 'fa-table-list' },
    { id: 'settings', label: lang === 'ko' ? '키오스크 설정' : lang === 'zh' ? '设置'    : 'Settings',    icon: 'fa-sliders' },
  ];
  const subTabs = logMode
    ? allSubTabs.filter(t => t.id === 'admin' || t.id === 'settings')
    : allSubTabs;

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* ── 페이지 헤더 + 지점 선택 — 장부 모드에서는 전체 숨김 ── */}
      {!logMode && (
        <>
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-black tracking-tight">현장 키오스크</h1>
              <p className="text-sm text-gray-400 font-medium mt-0.5">짐보관 현장 접수 · 관리 · 설정</p>
            </div>
            <div className="flex items-center gap-3">
              {branches.length > 1 && (
                <select
                  value={selectedBranch?.id ?? ''}
                  onChange={(e) => {
                    const b = branches.find((br) => br.id === e.target.value);
                    if (b) setSelectedBranch(b);
                  }}
                  className="bg-gray-100 rounded-full px-4 py-2 text-sm font-bold text-bee-black border-none outline-none"
                >
                  {branches.map((b) => (
                    <option key={b.id} value={b.id}>{b.branch_name}</option>
                  ))}
                </select>
              )}
              <div className="flex items-center bg-gray-100 rounded-full p-1">
                {(['ko', 'en', 'zh'] as Lang[]).map(l => (
                  <button key={l} onClick={() => setLang(l)}
                    className={`px-5 py-2 rounded-full text-sm font-bold transition-all ${
                      lang === l ? 'bg-bee-black text-white shadow-sm' : 'text-gray-500 hover:text-gray-800'
                    }`}>
                    {l === 'ko' ? '한국어' : l === 'en' ? 'English' : '中文'}
                  </button>
                ))}
              </div>
            </div>
          </div>
          {selectedBranch && (
            <div className="bg-bee-yellow/10 border border-bee-yellow/30 rounded-2xl px-5 py-3 flex items-center gap-3 text-sm">
              <i className="fa-solid fa-tablet-screen-button text-bee-yellow" />
              <span className="text-gray-600">현장 키오스크 URL:</span>
              <a
                href={`/kiosk/${encodeURIComponent(selectedBranch.slug)}`}
                target="_blank"
                rel="noreferrer"
                className="font-black text-bee-black underline underline-offset-2"
              >
                /kiosk/{selectedBranch.slug}
              </a>
            </div>
          )}
        </>
      )}

      {/* ── 서브탭 — logMode에서는 헤더에 올라가므로 숨김 ── */}
      {!logMode && (
        <div className="flex gap-8 border-b border-gray-200">
          {subTabs.map(tab => (
            <button key={tab.id}
              onClick={() => { setView(tab.id); if (tab.id === 'admin') loadData(); }}
              className={`pb-3 text-sm font-bold transition-all border-b-[3px] -mb-px flex items-center gap-2 ${
                view === tab.id
                  ? 'border-bee-yellow text-bee-black'
                  : 'border-transparent text-gray-400 hover:text-gray-700 hover:border-gray-300'
              }`}>
              <i className={`fa-solid ${tab.icon} text-xs`}></i>
              {tab.label}
            </button>
          ))}
        </div>
      )}

      {/* ── 서브뷰 ── */}
      {view === 'checkin'  && <CheckinView  lang={lang} t={t} cfg={cfg} assignRow={assignRow} onSubmitDone={loadData} branchId={branchId} />}
      {view === 'admin'    && <AdminView    lang={lang} t={t} cfg={cfg} entries={entries} onUpdate={loadData} />}
      {view === 'settings' && <SettingsView lang={lang} t={t} cfg={cfg} setCfg={setCfg} saveCfgToDb={saveCfgToDb} />}
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════
// STEP BADGE
// ═══════════════════════════════════════════════════════════════════════════
const StepBadge: React.FC<{ n: number; done?: boolean }> = ({ n, done }) => (
  <span className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-black flex-shrink-0 transition-all ${
    done ? 'bg-bee-yellow text-bee-black' : 'bg-bee-black text-white'
  }`}>
    {done ? <i className="fa-solid fa-check text-[10px]"></i> : n}
  </span>
);

// ═══════════════════════════════════════════════════════════════════════════
// CHECK-IN VIEW
// ═══════════════════════════════════════════════════════════════════════════
interface CheckinProps { lang: Lang; t: (k:string)=>string; cfg: Cfg; assignRow: (t:string)=>Promise<string>; onSubmitDone: ()=>void; branchId: string; }

const CheckinView: React.FC<CheckinProps> = ({ lang, t, cfg, assignRow, onSubmitDone, branchId }) => {
  const [tag, setTag] = useState(1);
  const [editTag, setEditTag] = useState(false);
  const [tagInput, setTagInput] = useState('1');
  const [smallQty, setSmallQty] = useState(0);
  const [carrierQty, setCarrierQty] = useState(0);
  const [durIdx, setDurIdx] = useState<number | null>(null);
  const [durH, setDurH] = useState(0);
  const [showConfirm, setShowConfirm] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [successRow, setSuccessRow] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const tagRef = useRef<HTMLInputElement>(null);

  const durs = cfg.operations.duration_options;
  const isSmallOff = (h: number) => smallQty > 0 && h < 4;
  const curH = durIdx !== null ? (durs[durIdx] === 8 ? durH : durs[durIdx]) : 0;
  const now = new Date();
  const pickupDt = curH > 0 ? new Date(now.getTime() + curH * 3600000) : null;

  const pricePerS = (h: number) => h < 4 ? null : h === 4 ? cfg.prices.small_4h : cfg.prices.small_4h + (h - 4) * cfg.prices.extra_per_hour;
  const pricePerC = (h: number) => h <= 2 ? cfg.prices.carrier_2h : h <= 4 ? cfg.prices.carrier_4h : cfg.prices.carrier_4h + (h - 4) * cfg.prices.extra_per_hour;
  const totalS = smallQty > 0 && curH >= 4 ? (pricePerS(curH) ?? 0) * smallQty : 0;
  const totalC = carrierQty > 0 && curH > 0 ? pricePerC(curH) * carrierQty : 0;
  const total = totalS + totalC;
  const canSubmit = (smallQty > 0 || carrierQty > 0) && durIdx !== null && curH > 0 && (smallQty === 0 || curH >= 4);

  const step1ok = smallQty > 0 || carrierQty > 0;
  const step2ok = durIdx !== null && curH > 0;

  const handleDur = (i: number) => {
    if (isSmallOff(durs[i])) return;
    if (durs[i] === 8) {
      const v = prompt('시간 입력 (8 이상)', '8');
      if (!v || isNaN(+v) || +v < 8) return;
      setDurH(+v);
    } else { setDurH(durs[i]); }
    setDurIdx(i);
  };

  const handleSubmit = async () => {
    if (!canSubmit || submitting) return;
    setSubmitting(true);
    try {
      const start = fmt(now);
      const rowLabel = await assignRow(start);
      const pk = pickupDt!;
      await insertStorageLog({
        branch_id: branchId,
        date: tdy(), tag, small_qty: smallQty, carrier_qty: carrierQty,
        start_time: start, pickup_time: fmt(pk), pickup_ts: pk.getTime(),
        duration: curH, original_price: total, discount: 0,
        payment: '미수금', done: false, memo: '', row_label: rowLabel,
        source: 'kiosk', commission_rate: 0,
      });
      setSuccessRow(rowLabel);
      setShowConfirm(false);
      setShowSuccess(true);
      onSubmitDone();
      setTimeout(() => {
        setShowSuccess(false);
        setTag(v => v + 1);
        setSmallQty(0); setCarrierQty(0); setDurIdx(null); setDurH(0);
      }, 4000);
    } finally { setSubmitting(false); }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-10 gap-6">
      {/* ── 왼쪽 (6/10) : 접수 단계 ── */}
      <div className="lg:col-span-6">
        <div className="bg-white rounded-[30px] shadow-sm p-8 space-y-10">

          {/* Step 1: 가방 수량 */}
          <section>
            <div className="flex items-center gap-3 mb-6">
              <StepBadge n={1} done={step1ok} />
              <h3 className="text-lg font-black">{t('s_bag')}</h3>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {[
                {
                  key: 's', qty: smallQty, setQty: setSmallQty,
                  label: t('t_small'), desc: t('t_small_d'),
                  icon: (
                    <svg viewBox="0 0 56 56" fill="none" className="w-10 h-10">
                      <rect x="8" y="18" width="40" height="28" rx="6" fill="#F3E8D0" stroke="#C9A96E" strokeWidth="2.5"/>
                      <path d="M20 18V14a8 8 0 0116 0v4" stroke="#C9A96E" strokeWidth="2.5" strokeLinecap="round"/>
                      <circle cx="28" cy="32" r="3" fill="#C9A96E"/>
                    </svg>
                  ),
                },
                {
                  key: 'c', qty: carrierQty, setQty: setCarrierQty,
                  label: t('t_carrier'), desc: t('t_carrier_d'),
                  icon: (
                    <svg viewBox="0 0 56 56" fill="none" className="w-10 h-10">
                      <rect x="12" y="10" width="32" height="36" rx="5" fill="#D6E4F0" stroke="#5B8DB8" strokeWidth="2.5"/>
                      <rect x="18" y="16" width="20" height="12" rx="3" fill="#B8D4E8" stroke="#5B8DB8" strokeWidth="1.5"/>
                      <path d="M22 10V6a6 6 0 0112 0v4" stroke="#5B8DB8" strokeWidth="2.5" strokeLinecap="round"/>
                      <circle cx="20" cy="50" r="3" fill="#5B8DB8"/>
                      <circle cx="36" cy="50" r="3" fill="#5B8DB8"/>
                    </svg>
                  ),
                },
              ].map(({ key, qty, setQty, label, desc, icon }) => (
                <div key={key}
                  className={`p-6 rounded-2xl border-2 flex flex-col items-center text-center transition-all ${
                    qty > 0 ? 'border-bee-yellow bg-amber-50' : 'border-gray-100 bg-gray-50 hover:border-gray-200'
                  }`}>
                  <div className="mb-3">{icon}</div>
                  <p className="font-bold text-sm mb-1">{label}</p>
                  <p className="text-xs text-gray-400 mb-5">{desc}</p>
                  <div className="flex items-center gap-4 bg-white rounded-full px-2 py-1 shadow-sm">
                    <button disabled={qty <= 0} onClick={() => setQty(v => Math.max(0, v-1))}
                      className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-gray-100 text-gray-500 disabled:opacity-20 transition-all font-bold text-lg">−</button>
                    <span className="text-2xl font-black w-6 text-center">{qty}</span>
                    <button disabled={qty >= cfg.operations.max_bags} onClick={() => setQty(v => Math.min(cfg.operations.max_bags, v+1))}
                      className="w-8 h-8 rounded-full bg-bee-yellow flex items-center justify-center hover:bg-amber-400 text-bee-black disabled:opacity-20 transition-all font-bold text-lg">+</button>
                  </div>
                  {key === 's' && qty > 0 && <p className="text-[10px] text-gray-400 mt-3">{t('from4')}</p>}
                  {qty > 0 && durIdx !== null && curH > 0 && (() => {
                    const pp = key === 's' ? pricePerS(curH) : pricePerC(curH);
                    return pp ? <p className="text-xs font-bold text-amber-600 mt-2">{pp.toLocaleString()}원 × {qty}</p> : null;
                  })()}
                </div>
              ))}
            </div>
          </section>

          {/* Step 2: 보관 시간 */}
          <section>
            <div className="flex items-center gap-3 mb-6">
              <StepBadge n={2} done={step2ok} />
              <h3 className="text-lg font-black">{t('s_dur')}</h3>
            </div>
            <div className="flex flex-wrap gap-3">
              {durs.map((h, i) => {
                const off = isSmallOff(h);
                const sel = durIdx === i && !off;
                return (
                  <button key={h} disabled={off} onClick={() => handleDur(i)}
                    className={`px-6 py-3 rounded-full text-sm font-bold transition-all ${
                      sel  ? 'bg-bee-black text-white shadow-md'
                           : off ? 'bg-gray-100 text-gray-300 cursor-not-allowed'
                           : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}>
                    {h === 8 ? t('hr8p') : `${h}${t('hr')}`}
                    {h === 6 && lang === 'ko' && ' (기본)'}
                  </button>
                );
              })}
            </div>
          </section>

          {/* Step 3: 태그 번호 */}
          <section>
            <div className="flex items-center gap-3 mb-6">
              <StepBadge n={3} />
              <h3 className="text-lg font-black">{t('s_tag')}</h3>
            </div>
            <div className="bg-bee-black rounded-2xl p-6 flex flex-col items-center justify-center">
              <p className="text-[10px] text-white/40 font-black uppercase tracking-widest mb-3">자동 구역 배정 · 수동 태그</p>
              <div className="flex items-center gap-8">
                <button onClick={() => setTag(v => Math.max(1, v - 1))}
                  className="w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 text-white text-2xl font-bold flex items-center justify-center transition-all">−</button>
                {editTag ? (
                  <input ref={tagRef} type="number" value={tagInput}
                    onChange={e => setTagInput(e.target.value)}
                    onBlur={() => { const v = parseInt(tagInput); if (v > 0) setTag(v); setEditTag(false); }}
                    onKeyDown={e => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur(); }}
                    className="text-7xl font-black text-center w-36 border-b-4 border-bee-yellow outline-none bg-transparent text-white" />
                ) : (
                  <button onClick={() => { setEditTag(true); setTagInput(String(tag)); setTimeout(() => tagRef.current?.select(), 30); }}
                    className="text-7xl font-black text-white border-b-4 border-dashed border-bee-yellow/50 pb-1 hover:border-solid min-w-[120px] text-center transition-all">
                    {tag}
                  </button>
                )}
                <button onClick={() => setTag(v => v + 1)}
                  className="w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 text-white text-2xl font-bold flex items-center justify-center transition-all">+</button>
              </div>
              <p className="text-[11px] text-white/30 font-medium mt-3">{t('tag_hint')}</p>
            </div>
          </section>
        </div>
      </div>

      {/* ── 오른쪽 (4/10) : 접수 요약 ── */}
      <div className="lg:col-span-4 flex flex-col gap-4">
        {/* 요약 카드 (bee-black hero) */}
        <div className={`bg-bee-black rounded-[30px] p-8 flex flex-col gap-6 transition-all ${canSubmit ? 'shadow-2xl' : 'opacity-60'}`}>
          <h3 className="text-lg font-black text-white border-b border-white/10 pb-4 uppercase tracking-wide">
            접수 요약
          </h3>
          <div className="space-y-4">
            {[
              { label: t('mk_tag'),  val: `#${tag}` },
              { label: t('t_small'), val: smallQty > 0 ? `${smallQty}${t('pcs')}` : '—' },
              { label: t('t_carrier'), val: carrierQty > 0 ? `${carrierQty}${t('pcs')}` : '—' },
              { label: t('s_dur'),   val: curH > 0 ? `${curH}${t('hr')}` : '—' },
              { label: t('l_start'), val: fmt(now) },
              { label: t('l_pickup'), val: pickupDt ? fmt(pickupDt) : '—', accent: true },
            ].map(({ label, val, accent }) => (
              <div key={label} className="flex justify-between items-center">
                <span className="text-sm text-white/50 font-semibold">{label}</span>
                <span className={`font-black text-sm ${accent ? 'text-bee-yellow' : 'text-white'}`}>{val}</span>
              </div>
            ))}
          </div>
          <div className="pt-4 border-t border-white/10">
            <div className="flex justify-between items-end mb-6">
              <span className="text-sm font-bold text-white/50 uppercase tracking-wide">{t('l_total')}</span>
              <span className="text-4xl font-black text-bee-yellow">{total > 0 ? `₩${total.toLocaleString()}` : '—'}</span>
            </div>
            <button disabled={!canSubmit} onClick={() => setShowConfirm(true)}
              className={`w-full py-5 rounded-full font-black text-lg transition-all flex items-center justify-center gap-2 ${
                canSubmit
                  ? 'bg-bee-yellow text-bee-black hover:scale-[1.02] active:scale-95 shadow-xl shadow-bee-yellow/20'
                  : 'bg-white/10 text-white/30 cursor-not-allowed'
              }`}>
              <i className="fa-solid fa-clipboard-check"></i>
              {t('btn_sub')}
            </button>
          </div>
        </div>

        {/* 열 배치 안내 */}
        <div className="bg-white rounded-[30px] shadow-sm p-6">
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">열 배치 규칙</p>
          <div className="space-y-2">
            {cfg.row_rules.rows.map(r => (
              <div key={r.label} className="flex items-center gap-3">
                <span className="w-7 h-7 rounded-lg flex items-center justify-center font-black text-white text-xs flex-shrink-0"
                  style={{ background: ROW_COLORS[r.label] ?? '#999' }}>{r.label}</span>
                <span className="text-xs text-gray-500 font-medium">{r.start}~{r.end}</span>
                <span className="ml-auto text-xs text-gray-400 font-semibold">최대 {r.max}개</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── 확인 모달 ── */}
      {showConfirm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-[32px] p-8 w-full max-w-sm shadow-2xl">
            {(cfg.notices['ko']||[]).length > 0 && (
              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 mb-6">
                <div className="flex items-center gap-2 mb-2">
                  <i className="fa-solid fa-triangle-exclamation text-amber-500 text-sm"></i>
                  <span className="text-xs font-black text-amber-700">{t('ntc_title')}</span>
                </div>
                <ul className="space-y-1">
                  {(cfg.notices['ko']||[]).map((n, i) => (
                    <li key={i} className="text-xs text-amber-700 flex items-start gap-2">
                      <span className="w-1 h-1 rounded-full bg-amber-400 flex-shrink-0 mt-1.5"></span>{n}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            <div className="text-center mb-6">
              <div className="w-14 h-14 rounded-full bg-bee-black flex items-center justify-center mx-auto mb-3">
                <i className="fa-solid fa-bag-shopping text-bee-yellow text-xl"></i>
              </div>
              <h2 className="text-xl font-black">{t('m_title')}</h2>
            </div>
            <div className="space-y-2 mb-6">
              {[
                [t('mk_tag'),  `#${tag}`],
                [t('mk_type'), [smallQty>0?`${t('ts')} ${smallQty}개`:'', carrierQty>0?`${t('tc')} ${carrierQty}개`:''].filter(Boolean).join(' + ')],
                [t('mk_dur'),  `${curH}${t('hr')}`],
                [t('mk_start'), fmt(now)],
                [t('mk_pk'),   pickupDt ? fmt(pickupDt) : '—'],
                [t('mk_price'), `₩${total.toLocaleString()}`],
              ].map(([k,v]) => (
                <div key={k} className="flex justify-between py-2 border-b border-gray-100 last:border-0 text-sm">
                  <span className="text-gray-400 font-semibold">{k}</span>
                  <span className="font-black">{v}</span>
                </div>
              ))}
            </div>
            <div className="flex gap-3">
              <button onClick={() => setShowConfirm(false)}
                className="flex-1 py-3.5 rounded-full bg-gray-100 font-bold text-sm text-gray-600 hover:bg-gray-200 transition-colors">{t('btn_cancel')}</button>
              <button onClick={handleSubmit} disabled={submitting}
                className="flex-1 py-3.5 rounded-full bg-bee-black text-bee-yellow font-black text-sm hover:bg-bee-black/90 disabled:opacity-60 transition-colors">
                {submitting ? <i className="fa-solid fa-spinner animate-spin"></i> : t('btn_ok')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── 성공 오버레이 ── */}
      {showSuccess && (
        <div className="fixed inset-0 bg-bee-black flex flex-col items-center justify-center z-50">
          <div className="w-20 h-20 rounded-full bg-bee-yellow flex items-center justify-center mb-6">
            <i className="fa-solid fa-check text-bee-black text-3xl"></i>
          </div>
          <p className="text-5xl font-black text-bee-yellow mb-3">#{tag}</p>
          <h1 className="text-2xl font-black text-white mb-2">{t('suc_t')}</h1>
          {successRow && (
            <div className="mt-8 px-12 py-8 border-2 border-bee-yellow/30 rounded-3xl text-center">
              <p className="text-sm text-white/50 font-bold mb-2">배치 구역</p>
              <p className="text-9xl font-black leading-none" style={{ color: ROW_COLORS[successRow] ?? '#F5C842' }}>{successRow}</p>
              <p className="text-sm text-white/50 mt-3">{successRow}열에 보관해 주세요</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════
// ADMIN VIEW
// ═══════════════════════════════════════════════════════════════════════════
interface AdminViewProps { lang: Lang; t: (k:string)=>string; cfg: Cfg; entries: Entry[]; onUpdate: ()=>void; }

const AdminView: React.FC<AdminViewProps> = ({ t, cfg, entries, onUpdate }) => {
  const [filterDate, setFilterDate] = useState(tdy());
  const [filterStat, setFilterStat] = useState('all');
  const [findTag, setFindTag] = useState('');
  const [findResult, setFindResult] = useState<React.ReactNode>(null);
  const now = Date.now();

  const todayEntries = entries.filter(e => e.date === (filterDate || tdy()));
  const filtered = entries.filter(e => {
    if (filterDate && e.date !== filterDate) return false;
    const ov = !e.done && e.pickupTs < now;
    if (filterStat === 'wait' && (e.done || ov)) return false;
    if (filterStat === 'over' && (e.done || !ov)) return false;
    if (filterStat === 'done' && !e.done) return false;
    return true;
  });

  const stats = {
    total: todayEntries.length,
    done:  todayEntries.filter(e => e.done).length,
    active: todayEntries.filter(e => !e.done).length,
    over:  todayEntries.filter(e => !e.done && e.pickupTs < now).length,
    rev:   todayEntries.reduce((s,e) => s + (e.originalPrice-(e.discount||0)), 0),
    unpaid: todayEntries.filter(e => e.payment === '미수금').length,
  };

  const handleFind = () => {
    const n = parseInt(findTag);
    if (!n) { setFindResult(<span className="text-red-400 text-sm font-bold">태그 번호를 입력하세요</span>); return; }
    const today = filterDate || tdy();
    let found = entries.filter(e => e.tag === n && e.date === today && !e.done);
    if (!found.length) found = entries.filter(e => e.tag === n && e.date === today);
    if (!found.length) { setFindResult(<span className="text-red-400 text-sm font-bold">오늘 #{n} 태그를 찾을 수 없습니다</span>); return; }
    const e = found[0];
    const ov = !e.done && e.pickupTs < now;
    const types = [e.smallQty>0?`소형${e.smallQty}개`:'', e.carrierQty>0?`캐리어${e.carrierQty}개`:''].filter(Boolean).join(' + ');
    setFindResult(
      <div className="mt-4 bg-white/10 rounded-2xl p-4 flex items-start gap-4">
        <div className="text-5xl font-black leading-none flex-shrink-0"
          style={{ color: ROW_COLORS[e.rowLabel] ?? '#F5C842' }}>{e.rowLabel || '?'}</div>
        <div className="flex-1 min-w-0">
          <p className="font-black text-white text-sm">#{e.tag} — {types}</p>
          <p className="text-xs text-white/50 mt-1">{e.startTime} 접수 → {e.pickupTime} 픽업예정</p>
          <div className="mt-2">
            {e.done
              ? <span className="inline-flex px-2.5 py-1 rounded-full bg-green-500/20 text-green-400 text-[11px] font-bold">반납완료</span>
              : ov
              ? <span className="inline-flex px-2.5 py-1 rounded-full bg-red-500/20 text-red-400 text-[11px] font-bold">시간초과</span>
              : <span className="inline-flex px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-400 text-[11px] font-bold">보관중</span>}
          </div>
          {!e.done && (
            <button onClick={async () => {
              await updateStorageLog(e.id, { done: true });
              onUpdate();
              setFindResult(
                <div className="mt-4 flex items-center gap-3 bg-white/10 rounded-2xl p-4">
                  <i className="fa-solid fa-circle-check text-green-400 text-xl"></i>
                  <p className="font-black text-white text-sm">반납 처리 완료</p>
                </div>
              );
              setFindTag('');
            }}
              className="mt-3 px-4 py-2 bg-bee-yellow text-bee-black font-black rounded-full text-xs hover:bg-amber-400 transition-colors">
              <i className="fa-solid fa-check mr-1.5"></i>
              반납 처리 — {e.rowLabel}열
            </button>
          )}
        </div>
      </div>
    );
  };

  const handleUf = async (id: number, field: string, value: any) => {
    await updateStorageLog(id, { [field]: value } as any);
    onUpdate();
  };

  const overStr = (e: Entry) => {
    if (e.done || e.pickupTs >= now) return null;
    const m = Math.floor((now - e.pickupTs) / 60000);
    return m < 60 ? `${m}분` : `${Math.floor(m/60)}시간 ${m%60}분`;
  };

  return (
    <div className="space-y-4">
      {/* 짐 찾기 */}
      <div className="bg-bee-black rounded-2xl p-5">
        <div className="flex items-center gap-2 mb-4">
          <i className="fa-solid fa-magnifying-glass text-bee-yellow"></i>
          <h3 className="font-black text-white text-sm">{t('find_title')}</h3>
        </div>
        <div className="flex gap-2">
          <input type="number" value={findTag} onChange={e => setFindTag(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') handleFind(); }}
            placeholder={t('find_placeholder')}
            className="flex-1 bg-white/10 border-2 border-white/10 rounded-full px-4 py-2.5 text-lg font-black text-white text-center outline-none focus:border-bee-yellow transition-colors placeholder:text-white/20" />
          <button onClick={handleFind}
            className="px-5 py-2.5 bg-bee-yellow text-bee-black font-black rounded-full hover:bg-amber-400 transition-colors flex-shrink-0 text-sm">
            {t('find_btn')}
          </button>
        </div>
        {findResult && <div>{findResult}</div>}
      </div>

      {/* 통계 6칸 */}
      <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
        {[
          { label: t('st_total'),  val: stats.total,  icon: 'fa-inbox',           color: 'text-blue-500' },
          { label: t('active'),    val: stats.active,  icon: 'fa-box-open',        color: 'text-indigo-500' },
          { label: t('st_done'),   val: stats.done,    icon: 'fa-circle-check',    color: 'text-green-500' },
          { label: t('st_over'),   val: stats.over,    icon: 'fa-clock',           color: 'text-red-500' },
          { label: t('st_rev'),    val: `₩${stats.rev.toLocaleString()}`, icon: 'fa-won-sign', color: 'text-amber-500' },
          { label: t('st_unpaid'), val: stats.unpaid,  icon: 'fa-money-bill-wave', color: 'text-orange-500' },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-xl p-3 shadow-sm text-center">
            <i className={`fa-solid ${s.icon} ${s.color} text-sm mb-1 block`}></i>
            <p className="text-lg font-black text-bee-black leading-none mb-0.5">{s.val}</p>
            <p className="text-[9px] text-gray-400 font-bold uppercase tracking-wide">{s.label}</p>
          </div>
        ))}
      </div>

      {/* 구역별 현황 + 오늘 요약 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* 구역별 현황 */}
        <div className="bg-white rounded-2xl shadow-sm p-4">
          <h3 className="font-black text-bee-black mb-4 flex items-center gap-2 text-sm">
            <i className="fa-solid fa-table-columns text-bee-yellow text-xs"></i>
            구역별 현황
          </h3>
          <div className="grid grid-cols-2 gap-2">
            {cfg.row_rules.rows.map(rule => {
              const rowItems = todayEntries.filter(e => e.rowLabel === rule.label);
              const active = rowItems.filter(e => !e.done).length;
              const pct = Math.round((active / rule.max) * 100);
              return (
                <div key={rule.label} className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-md flex items-center justify-center font-black text-white text-xs flex-shrink-0"
                    style={{ background: ROW_COLORS[rule.label] ?? '#999' }}>{rule.label}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between text-[10px] font-bold text-gray-500 mb-1">
                      <span className="truncate">{rowItems.filter(e=>!e.done).map(e=>`#${e.tag}`).join(' ')||'—'}</span>
                      <span className="flex-shrink-0 ml-2">{active}/{rule.max}</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-1.5">
                      <div className="h-1.5 rounded-full transition-all"
                        style={{ width: `${pct}%`, background: ROW_COLORS[rule.label] ?? '#999' }} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 오늘 요약 */}
        <div className="bg-white rounded-2xl shadow-sm p-4">
          <h3 className="font-black text-bee-black mb-4 flex items-center gap-2 text-sm">
            <i className="fa-solid fa-chart-simple text-bee-yellow text-xs"></i>
            오늘 요약
          </h3>
          <div className="grid grid-cols-2 gap-2">
            {[
              { label: '소형 가방', val: `${todayEntries.reduce((s,e)=>s+e.smallQty,0)}개` },
              { label: '캐리어',    val: `${todayEntries.reduce((s,e)=>s+e.carrierQty,0)}개` },
              { label: '미수금',    val: `${stats.unpaid}건`, warn: true },
              { label: '총 수익',   val: `₩${stats.rev.toLocaleString()}`, dark: true },
            ].map(r => (
              <div key={r.label} className={`flex justify-between items-center px-3 py-2 rounded-lg ${r.dark ? 'bg-bee-black' : 'bg-gray-50'}`}>
                <span className={`text-xs font-semibold ${r.dark ? 'text-white/60' : 'text-gray-500'}`}>{r.label}</span>
                <span className={`font-black text-sm ${r.dark ? 'text-bee-yellow' : r.warn ? 'text-amber-600' : ''}`}>{r.val}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 전체 목록 — 3열 카드 */}
      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
        <div className="flex flex-wrap gap-3 items-center px-4 py-3 border-b border-gray-100">
          <h3 className="font-black text-sm flex-1">{t('a_title')}</h3>
          <div className="flex items-center gap-2">
            <label className="text-[10px] font-black text-gray-400 uppercase">{t('a_date')}</label>
            <input type="date" value={filterDate} onChange={e => setFilterDate(e.target.value)}
              className="border border-gray-200 rounded-xl px-2.5 py-1.5 text-xs font-bold focus:border-bee-yellow outline-none" />
          </div>
          <div className="flex gap-1 bg-gray-100 rounded-full p-1">
            {(['all','wait','over','done'] as const).map(s => (
              <button key={s} onClick={() => setFilterStat(s)}
                className={`px-3 py-1 rounded-full text-[10px] font-black transition-all ${
                  filterStat === s ? 'bg-bee-black text-bee-yellow' : 'text-gray-400 hover:text-gray-700'
                }`}>
                {t(`f_${s}`)}
              </button>
            ))}
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="py-16 text-center text-gray-400 font-bold text-sm">{t('empty')}</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 p-4">
            {filtered.map(e => {
              const ov = !e.done && e.pickupTs < now;
              const types = [e.smallQty>0?`소형 ${e.smallQty}`:'', e.carrierQty>0?`캐리어 ${e.carrierQty}`:''].filter(Boolean).join(' + ');
              const fn = e.originalPrice - (e.discount||0);
              const discOpts: number[] = [0];
              for (let v = cfg.discount.unit; v < e.originalPrice; v += cfg.discount.unit) discOpts.push(v);
              if (cfg.discount.allow_free && e.originalPrice > 0) discOpts.push(e.originalPrice);
              return (
                <div key={e.id} className={`rounded-2xl overflow-hidden border ${
                  e.done ? 'bg-green-50 border-green-100' : ov ? 'bg-red-50 border-red-100' : 'bg-white border-gray-100'
                } shadow-sm`}>
                  {/* 카드 헤더 */}
                  <div className="flex items-center gap-2 px-3 py-2.5 border-b border-inherit">
                    {e.rowLabel ? (
                      <span className="w-6 h-6 rounded-md flex items-center justify-center font-black text-white text-xs flex-shrink-0"
                        style={{ background: ROW_COLORS[e.rowLabel]??'#999' }}>{e.rowLabel}</span>
                    ) : <span className="w-6 h-6 rounded-md bg-gray-200 flex-shrink-0" />}
                    <span className="font-black text-bee-black text-sm">#{e.tag}</span>
                    <span className="text-[10px] text-gray-400 ml-auto">{e.date}</span>
                  </div>
                  {/* 카드 바디 */}
                  <div className="px-3 py-2.5 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-600">{types || '—'}</span>
                      {e.done
                        ? <span className="px-2 py-0.5 rounded-full bg-green-100 text-green-700 text-[10px] font-bold">{t('f_done')}</span>
                        : ov
                        ? <span className="px-2 py-0.5 rounded-full bg-red-100 text-red-700 text-[10px] font-bold">{overStr(e)}</span>
                        : <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 text-[10px] font-bold">{t('f_wait')}</span>
                      }
                    </div>
                    <p className="text-[11px] text-gray-500">{e.startTime} → {e.pickupTime}</p>
                    <div className="flex items-center gap-1 text-xs">
                      {e.discount > 0 && <span className="text-gray-300 line-through">{e.originalPrice.toLocaleString()}</span>}
                      {e.discount > 0 && <span className="text-red-400 text-[10px]">-{e.discount.toLocaleString()}</span>}
                      <span className="font-black text-bee-black">₩{fn.toLocaleString()}</span>
                    </div>
                  </div>
                  {/* 카드 푸터 컨트롤 */}
                  <div className="flex items-center gap-1.5 px-3 py-2 bg-gray-50 border-t border-gray-100">
                    <select value={e.payment} onChange={ev => handleUf(e.id,'payment',ev.target.value)}
                      className="flex-1 border border-gray-200 rounded-lg px-1.5 py-1 text-[10px] focus:border-bee-yellow outline-none bg-white">
                      <option value="미수금">{t('up')}</option>
                      <option value="완료">{t('pd')}</option>
                    </select>
                    <select value={e.discount} onChange={ev => handleUf(e.id,'discount',+ev.target.value)}
                      className="border border-gray-200 rounded-lg px-1.5 py-1 text-[10px] focus:border-bee-yellow outline-none bg-white w-14">
                      {discOpts.map(v => <option key={v} value={v}>{v===0?'할인없음':v===e.originalPrice?'무료':`-${v}`}</option>)}
                    </select>
                    <input type="checkbox" checked={e.done} onChange={ev => handleUf(e.id,'done',ev.target.checked)}
                      className="w-4 h-4 accent-bee-yellow cursor-pointer" title="반납완료" />
                    <input value={e.memo} onChange={ev => handleUf(e.id,'memo',ev.target.value)}
                      className="w-14 border border-gray-200 rounded-lg px-1.5 py-1 text-[10px] focus:border-bee-yellow outline-none bg-white" placeholder="메모" />
                    <button onClick={() => { if (confirm(t('del'))) { supabaseMutate(`${KIOSK_TABLES.log}?id=eq.${e.id}`, 'DELETE').then(()=>onUpdate()); } }}
                      className="w-6 h-6 rounded-full bg-white text-gray-300 hover:bg-red-50 hover:text-red-400 flex items-center justify-center transition-colors border border-gray-200 flex-shrink-0">
                      <i className="fa-solid fa-xmark text-[9px]"></i>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════
// SETTINGS VIEW
// ═══════════════════════════════════════════════════════════════════════════
interface SettingsViewProps { lang: Lang; t: (k:string)=>string; cfg: Cfg; setCfg: (c:Cfg)=>void; saveCfgToDb: (c:Cfg)=>Promise<void>; }

const SettingsView: React.FC<SettingsViewProps> = ({ t, cfg, setCfg, saveCfgToDb }) => {
  const [unlocked, setUnlocked] = useState(false);
  const [passInput, setPassInput] = useState('');
  const [passErr, setPassErr] = useState(false);
  const [saving, setSaving] = useState(false);
  const [noticeLang, setNoticeLang] = useState<Lang>('ko');
  const [toast, setToast] = useState('');
  const [local, setLocal] = useState<Cfg>(() => JSON.parse(JSON.stringify(cfg)));
  const [curPass, setCurPass] = useState('');
  const [newPass, setNewPass] = useState('');

  useEffect(() => { setLocal(JSON.parse(JSON.stringify(cfg))); }, [cfg]);

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 3000); };

  /* ── 잠금 화면 ── */
  if (!unlocked) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="bg-white rounded-[32px] shadow-sm p-10 w-full max-w-xs text-center">
          <div className="w-16 h-16 rounded-2xl bg-bee-black flex items-center justify-center mx-auto mb-5">
            <i className="fa-solid fa-lock text-bee-yellow text-2xl"></i>
          </div>
          <h3 className="text-xl font-black mb-6">{t('pass_title')}</h3>
          <input type="password" value={passInput} autoFocus
            onChange={e => setPassInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') {
              if (passInput === cfg.admin_password) { setUnlocked(true); setPassErr(false); }
              else { setPassErr(true); setPassInput(''); }
            }}}
            className="w-full text-center text-3xl tracking-[0.5em] bg-gray-50 rounded-2xl py-4 mb-3 outline-none focus:ring-2 focus:ring-bee-yellow transition-all font-mono border-2 border-transparent focus:border-bee-yellow" />
          {passErr && <p className="text-red-500 text-sm font-bold mb-3">{t('pass_error')}</p>}
          <button onClick={() => {
            if (passInput === cfg.admin_password) { setUnlocked(true); setPassErr(false); }
            else { setPassErr(true); setPassInput(''); }
          }} className="w-full py-4 bg-bee-black text-bee-yellow font-black rounded-full hover:bg-bee-black/90 transition-colors">
            확인
          </button>
        </div>
      </div>
    );
  }

  /* ── 설정 카드 ── */
  const Card: React.FC<{ title: string; icon: string; children: React.ReactNode }> = ({ title, icon, children }) => (
    <div className="bg-white rounded-[30px] shadow-sm p-7">
      <h3 className="text-base font-black mb-6 flex items-center gap-3">
        <span className="w-9 h-9 rounded-xl bg-bee-black flex items-center justify-center flex-shrink-0">
          <i className={`fa-solid ${icon} text-bee-yellow text-sm`}></i>
        </span>
        {title}
      </h3>
      {children}
    </div>
  );

  const inp = (val: number, onChange: (v:number)=>void, suffix?: string) => (
    <div className="relative">
      <input type="number" value={val} onChange={e => onChange(Number(e.target.value))}
        className="w-full bg-gray-50 border-2 border-transparent rounded-xl px-4 py-3 text-sm font-bold focus:border-bee-yellow outline-none transition-colors" />
      {suffix && <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-gray-400 font-semibold pointer-events-none">{suffix}</span>}
    </div>
  );

  const Label: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 mb-1.5 block">{children}</label>
  );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

      {/* ── 왼쪽 열 ── */}
      <div className="space-y-6">

        {/* 가격 설정 */}
        <Card title={t('set_price')} icon="fa-won-sign">
          <div className="space-y-4">
            <div><Label>소형 가방 4시간 기본료 (원)</Label>{inp(local.prices.small_4h, v => setLocal(p => ({ ...p, prices: { ...p.prices, small_4h: v } })), '원')}</div>
            <div><Label>캐리어 2시간 기본료 (원)</Label>{inp(local.prices.carrier_2h, v => setLocal(p => ({ ...p, prices: { ...p.prices, carrier_2h: v } })), '원')}</div>
            <div><Label>캐리어 4시간 기본료 (원)</Label>{inp(local.prices.carrier_4h, v => setLocal(p => ({ ...p, prices: { ...p.prices, carrier_4h: v } })), '원')}</div>
            <div><Label>추가 요금 (시간당)</Label>{inp(local.prices.extra_per_hour, v => setLocal(p => ({ ...p, prices: { ...p.prices, extra_per_hour: v } })), '원/시간')}</div>
          </div>
        </Card>

        {/* 운영 설정 */}
        <Card title={t('set_ops')} icon="fa-gear">
          <div className="space-y-4">
            <div><Label>최대 가방 수</Label>{inp(local.operations.max_bags, v => setLocal(p => ({ ...p, operations: { ...p.operations, max_bags: v } })), '개')}</div>
            <div><Label>영업 종료 시간 (24h)</Label>{inp(local.operations.close_hour, v => setLocal(p => ({ ...p, operations: { ...p.operations, close_hour: v } })), '시')}</div>
            <div>
              <Label>보관 시간 옵션</Label>
              <div className="grid grid-cols-4 gap-2">
                {[2,3,4,5,6,7,8].map(d => (
                  <label key={d} className={`flex flex-col items-center gap-1 p-3 rounded-xl border-2 cursor-pointer transition-all ${
                    local.operations.duration_options.includes(d) ? 'border-bee-yellow bg-amber-50' : 'border-gray-100 hover:border-gray-200'
                  }`}>
                    <input type="checkbox" className="hidden" checked={local.operations.duration_options.includes(d)}
                      onChange={e => setLocal(p => ({
                        ...p, operations: { ...p.operations,
                          duration_options: e.target.checked ? [...p.operations.duration_options, d].sort((a,b)=>a-b) : p.operations.duration_options.filter(x=>x!==d)
                        }
                      }))} />
                    <span className="text-sm font-black">{d === 8 ? '8+' : d}</span>
                    <span className="text-[9px] text-gray-400">시간</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        </Card>

        {/* 할인 설정 */}
        <Card title={t('set_disc')} icon="fa-percent">
          <div className="space-y-4">
            <div><Label>할인 단위 (원)</Label>{inp(local.discount.unit, v => setLocal(p => ({ ...p, discount: { ...p.discount, unit: v } })), '원')}</div>
            <label className="flex items-center gap-4 bg-gray-50 rounded-xl p-4 cursor-pointer hover:bg-gray-100 transition-colors">
              <input type="checkbox" checked={local.discount.allow_free}
                onChange={e => setLocal(p => ({ ...p, discount: { ...p.discount, allow_free: e.target.checked } }))}
                className="w-5 h-5 accent-bee-yellow" />
              <span className="text-sm font-bold">무료 옵션 허용</span>
            </label>
          </div>
        </Card>
      </div>

      {/* ── 오른쪽 열 ── */}
      <div className="space-y-6">

        {/* 안내 메시지 */}
        <Card title={t('set_notices')} icon="fa-bullhorn">
          <div className="flex gap-1 bg-gray-100 rounded-full p-1 mb-5">
            {(['ko','en','zh'] as Lang[]).map(l => (
              <button key={l} onClick={() => setNoticeLang(l)}
                className={`flex-1 py-2 rounded-full text-xs font-black transition-all ${
                  noticeLang === l ? 'bg-bee-black text-bee-yellow' : 'text-gray-400 hover:text-gray-700'
                }`}>
                {l==='ko'?'한국어':l==='en'?'English':'中文'}
              </button>
            ))}
          </div>
          <div className="space-y-2">
            {(local.notices[noticeLang]||[]).map((n,i) => (
              <div key={i} className="flex gap-2">
                <input value={n} onChange={e => setLocal(p => {
                  const notices = { ...p.notices };
                  const list = [...(notices[noticeLang]||[])]; list[i] = e.target.value;
                  notices[noticeLang] = list; return { ...p, notices };
                })} className="flex-1 bg-gray-50 border-2 border-transparent rounded-xl px-3 py-2 text-xs font-bold focus:border-bee-yellow outline-none transition-colors" />
                <button onClick={() => setLocal(p => {
                  const notices = { ...p.notices };
                  const list = [...(notices[noticeLang]||[])]; list.splice(i,1);
                  notices[noticeLang] = list; return { ...p, notices };
                })} className="w-9 h-9 rounded-full bg-red-50 text-red-400 hover:bg-red-100 flex items-center justify-center transition-colors flex-shrink-0">
                  <i className="fa-solid fa-xmark text-xs"></i>
                </button>
              </div>
            ))}
            <button onClick={() => setLocal(p => {
              const notices = { ...p.notices };
              notices[noticeLang] = [...(notices[noticeLang]||[]), '새 공지사항'];
              return { ...p, notices };
            })} className="w-full py-3 border-2 border-dashed border-gray-200 rounded-xl text-xs font-black text-gray-400 hover:border-bee-yellow hover:text-bee-yellow transition-all">
              + 추가
            </button>
          </div>
        </Card>

        {/* 구역 규칙 */}
        <Card title={t('set_rows')} icon="fa-table-columns">
          <p className="text-xs text-gray-400 mb-4">시간대별 기본 배치 구역 + 최대 수용 개수. 가득 차면 인접 구역으로 자동 배정됩니다.</p>
          <div className="space-y-2">
            {local.row_rules.rows.map((r,i) => (
              <div key={r.label} className="flex items-center gap-2 bg-gray-50 rounded-2xl p-3">
                <span className="w-8 h-8 rounded-xl flex items-center justify-center font-black text-white text-sm flex-shrink-0"
                  style={{ background: ROW_COLORS[r.label]??'#999' }}>{r.label}</span>
                <input type="text" value={r.start} placeholder="09:00"
                  onChange={e => setLocal(p => { const rows=[...p.row_rules.rows]; rows[i]={...rows[i],start:e.target.value}; return {...p,row_rules:{rows}}; })}
                  className="w-16 bg-white border-2 border-transparent rounded-lg px-2 py-1.5 text-xs font-bold text-center focus:border-bee-yellow outline-none" />
                <span className="text-gray-400 text-xs">~</span>
                <input type="text" value={r.end} placeholder="12:00"
                  onChange={e => setLocal(p => { const rows=[...p.row_rules.rows]; rows[i]={...rows[i],end:e.target.value}; return {...p,row_rules:{rows}}; })}
                  className="w-16 bg-white border-2 border-transparent rounded-lg px-2 py-1.5 text-xs font-bold text-center focus:border-bee-yellow outline-none" />
                <input type="number" value={r.max} min={1} max={30}
                  onChange={e => setLocal(p => { const rows=[...p.row_rules.rows]; rows[i]={...rows[i],max:parseInt(e.target.value)||r.max}; return {...p,row_rules:{rows}}; })}
                  className="w-14 bg-white border-2 border-transparent rounded-lg px-2 py-1.5 text-xs font-bold text-center focus:border-bee-yellow outline-none ml-auto" />
                <span className="text-gray-400 text-xs">개</span>
              </div>
            ))}
          </div>
        </Card>

        {/* 보안 설정 */}
        <Card title={t('set_pass')} icon="fa-lock">
          <div className="space-y-4">
            {[['현재 비밀번호', curPass, setCurPass], ['새 비밀번호', newPass, setNewPass]].map(([label, val, setter]) => (
              <div key={label as string}>
                <Label>{label as string}</Label>
                <input type="password" value={val as string} onChange={e => (setter as Function)(e.target.value)}
                  className="w-full bg-gray-50 border-2 border-transparent rounded-xl px-4 py-3 text-sm font-bold focus:border-bee-yellow outline-none transition-colors" />
              </div>
            ))}
            <button onClick={() => {
              if (!curPass || !newPass) { alert('비밀번호를 입력해주세요'); return; }
              if (curPass !== local.admin_password) { alert('현재 비밀번호가 잘못되었습니다'); return; }
              setLocal(p => ({ ...p, admin_password: newPass }));
              setCurPass(''); setNewPass('');
              showToast('비밀번호 변경됨 (저장 버튼으로 확정하세요)');
            }} className="w-full py-3 bg-gray-100 text-gray-700 font-black rounded-full text-sm hover:bg-gray-200 transition-colors">
              비밀번호 변경
            </button>
          </div>
        </Card>
      </div>

      {/* ── 저장 버튼 ── */}
      <div className="lg:col-span-2">
        <button onClick={async () => { setSaving(true); try { setCfg(local); await saveCfgToDb(local); showToast(t('saved')); } finally { setSaving(false); } }}
          disabled={saving}
          className="w-full py-5 bg-bee-yellow text-bee-black font-black text-lg rounded-full shadow-xl shadow-bee-yellow/20 hover:scale-[1.01] transition-all disabled:opacity-60 flex items-center justify-center gap-3">
          {saving ? <><i className="fa-solid fa-spinner animate-spin"></i> 저장 중...</> : <><i className="fa-solid fa-floppy-disk"></i> {t('save_btn')}</>}
        </button>
      </div>

      {toast && (
        <div className="fixed bottom-8 right-8 bg-bee-black text-bee-yellow px-6 py-4 rounded-full shadow-2xl font-bold text-sm z-50 flex items-center gap-2 animate-fade-in">
          <i className="fa-solid fa-circle-check"></i> {toast}
        </div>
      )}
    </div>
  );
};

export default KioskTab;
