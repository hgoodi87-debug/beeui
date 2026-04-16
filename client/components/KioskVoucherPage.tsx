/**
 * KioskVoucherPage — 키오스크 예약 확정 바우처
 * URL: /kiosk/voucher?id=LOG_ID&lang=ko|en|zh|zh-TW|zh-HK|ja
 * - QR 스캔 후 실시간 바우처 표시
 * - 보관 완료 전까지 5초마다 폴링
 * - 직원용 반납 처리 버튼
 * - 공항 배송 전환 안내 (인천 현장 현금 지불)
 * - 다국어 지원: ko / en / zh / zh-TW / zh-HK / ja
 */
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import { loadLogById, KioskStorageLog, addHours } from '../services/kioskDb';

const POLL_INTERVAL = 5000;

// ─── 다국어 레이블 ────────────────────────────────────────────────────────────
type VoucherLang = 'ko' | 'en' | 'zh' | 'zh-TW' | 'zh-HK' | 'ja';

interface VoucherLabels {
  loading: string;
  notFound: string;
  back: string;
  live: string;
  statusDone: string;
  statusDoneSub: string;
  statusOverdue: string;
  statusOverdueSub: (min: number) => string;
  statusActive: string;
  statusActiveSub: (min: number) => string;
  tagNo: string;
  tagUnit: string;
  zone: string;
  storageDuration: string;
  durationUnit: string;
  bags: string;
  payment: string;
  discount: string;
  currencyUnit: string;
  total: string;
  staffOnly: string;
  staffScan: string;
  staffScanSub: string;
  smallBag: string;
  carrier: string;
  unitSuffix: string;
  airportTitle: string;
  airportSub: string;
  airportStep1: string;
  airportStep2Pre: string;
  airportStep2Highlight: string;
  airportStep2Post: string;
  airportStep3: string;
  cashOnly: string;
  cashNote: string;
  bookDelivery: string;
  savingImage: string;
  saveVoucher: string;
  returnDone: string;
  returnDoneSub: string;
  notifAlertAt: (t: string) => string;
  notifAlertNow: string;
  notifSub: string;
  notifSubSoon: string;
  notifUnsupported: string;
  notifScheduled: string;
  notifScheduledSub: (t: string) => string;
  notifCancel: string;
  notifFired: string;
  notifFiredSub: string;
  notifDenied: string;
  notifDeniedSub: string;
}

const VOUCHER_LABELS: Record<VoucherLang, VoucherLabels> = {
  ko: {
    loading: '바우처 불러오는 중…',
    notFound: '바우처를 찾을 수 없습니다',
    back: '돌아가기',
    live: '실시간',
    statusDone: '반납 완료',
    statusDoneSub: '고객이 짐을 찾아갔습니다',
    statusOverdue: '픽업 시간 초과',
    statusOverdueSub: (min) => `${Math.abs(min)}분 경과 · 연장료 적용 가능`,
    statusActive: '보관 중',
    statusActiveSub: (min) => min > 0 ? `픽업까지 ${min}분` : '픽업 시간 임박',
    tagNo: '태그 번호',
    tagUnit: '번',
    zone: '구역',
    storageDuration: '보관 시간',
    durationUnit: '시간',
    bags: '짐',
    payment: '결제 방법',
    discount: '할인',
    currencyUnit: '원',
    total: '합계',
    staffOnly: '직원 전용',
    staffScan: 'QR 스캔으로 반납 처리',
    staffScanSub: '직원이 이 QR을 스캔하면\n반납 완료 처리 화면으로 이동합니다',
    smallBag: '소형',
    carrier: '캐리어',
    unitSuffix: '개',
    airportTitle: '공항 배송으로 전환',
    airportSub: '짐을 공항까지 보내드립니다',
    airportStep1: '지금 짐을 맡기고 인천국제공항으로 직접 보내드립니다',
    airportStep2Pre: '결제는 ',
    airportStep2Highlight: '인천공항 현장에서 현금',
    airportStep2Post: '으로 진행합니다',
    airportStep3: '예약 후 스태프에게 이 화면을 보여주세요',
    cashOnly: '현금 결제 전용',
    cashNote: '인천국제공항 현장 수령 시 납부',
    bookDelivery: '공항 배송 예약하기',
    savingImage: '저장 중…',
    saveVoucher: '바우처 이미지 저장',
    returnDone: '✓ 반납이 완료되었습니다',
    returnDoneSub: '이 바우처는 기록 보관용으로 유지됩니다',
    notifAlertAt: (t) => `${t}에 알림 받기`,
    notifAlertNow: '지금 알림 받기',
    notifSub: '픽업 1시간 전에 브라우저 알림',
    notifSubSoon: '픽업 시간이 1시간 이내 — 바로 알림',
    notifUnsupported: '이 브라우저는 알림을 지원하지 않아요',
    notifScheduled: '알림 설정 완료',
    notifScheduledSub: (t) => `${t}에 알림이 울립니다 — 탭을 유지해 주세요`,
    notifCancel: '취소',
    notifFired: '알림 전송됨',
    notifFiredSub: '짐 찾을 시간이에요!',
    notifDenied: '알림 권한 거부됨',
    notifDeniedSub: '브라우저 설정에서 알림을 허용해 주세요',
  },
  en: {
    loading: 'Loading voucher…',
    notFound: 'Voucher Not Found',
    back: 'Back',
    live: 'Live',
    statusDone: 'Returned',
    statusDoneSub: 'Your luggage has been retrieved',
    statusOverdue: 'Pickup Overdue',
    statusOverdueSub: (min) => `${Math.abs(min)} min overdue · Extension fee may apply`,
    statusActive: 'In Storage',
    statusActiveSub: (min) => min > 0 ? `${min} min until pickup` : 'Pickup time approaching',
    tagNo: 'Tag No.',
    tagUnit: '',
    zone: 'Zone',
    storageDuration: 'Storage Duration',
    durationUnit: 'hr',
    bags: 'Bags',
    payment: 'Payment',
    discount: 'Discount',
    currencyUnit: '₩',
    total: 'Total',
    staffOnly: 'Staff Only',
    staffScan: 'Scan QR to Complete Return',
    staffScanSub: 'Staff scans this QR to\nopen the return completion screen',
    smallBag: 'Small',
    carrier: 'Carrier',
    unitSuffix: '',
    airportTitle: 'Upgrade to Airport Delivery',
    airportSub: 'We deliver your bags to the airport',
    airportStep1: 'Drop off your bags now and we\'ll deliver them to Incheon Airport',
    airportStep2Pre: 'Payment by ',
    airportStep2Highlight: 'cash on-site at Incheon Airport',
    airportStep2Post: '',
    airportStep3: 'After booking, show this screen to staff',
    cashOnly: 'Cash Payment Only',
    cashNote: 'Paid on delivery at Incheon International Airport',
    bookDelivery: 'Book Airport Delivery',
    savingImage: 'Saving…',
    saveVoucher: 'Save Voucher Image',
    returnDone: '✓ Return Complete',
    returnDoneSub: 'This voucher is kept for your records',
    notifAlertAt: (t) => `Notify me at ${t}`,
    notifAlertNow: 'Notify me now',
    notifSub: 'Browser notification 1 hr before pickup',
    notifSubSoon: 'Pickup within 1 hour — notify immediately',
    notifUnsupported: 'This browser doesn\'t support notifications',
    notifScheduled: 'Notification Set',
    notifScheduledSub: (t) => `You'll be notified at ${t} — keep this tab open`,
    notifCancel: 'Cancel',
    notifFired: 'Notification Sent',
    notifFiredSub: 'Time to pick up your bags!',
    notifDenied: 'Notification Permission Denied',
    notifDeniedSub: 'Enable notifications in your browser settings',
  },
  zh: {
    loading: '正在加载凭证…',
    notFound: '未找到凭证',
    back: '返回',
    live: '实时',
    statusDone: '已取回',
    statusDoneSub: '客人已取走行李',
    statusOverdue: '取行李时间已超时',
    statusOverdueSub: (min) => `已超时 ${Math.abs(min)} 分钟 · 可能收取延时费`,
    statusActive: '保管中',
    statusActiveSub: (min) => min > 0 ? `距取件还有 ${min} 分钟` : '即将到取件时间',
    tagNo: '标签号码',
    tagUnit: '号',
    zone: '区域',
    storageDuration: '保管时间',
    durationUnit: '小时',
    bags: '行李',
    payment: '付款方式',
    discount: '折扣',
    currencyUnit: '₩',
    total: '合计',
    staffOnly: '仅供员工',
    staffScan: '扫码完成归还',
    staffScanSub: '员工扫描此QR码\n即可进入归还确认页面',
    smallBag: '小型',
    carrier: '行李箱',
    unitSuffix: '件',
    airportTitle: '升级为机场配送',
    airportSub: '将行李送到机场',
    airportStep1: '现在寄存行李，我们将直接配送至仁川国际机场',
    airportStep2Pre: '付款方式：',
    airportStep2Highlight: '在仁川机场现场现金支付',
    airportStep2Post: '',
    airportStep3: '预约后请将此页面出示给工作人员',
    cashOnly: '仅限现金支付',
    cashNote: '在仁川国际机场提取时付款',
    bookDelivery: '预约机场配送',
    savingImage: '保存中…',
    saveVoucher: '保存凭证图片',
    returnDone: '✓ 归还完成',
    returnDoneSub: '此凭证将保留以供记录',
    notifAlertAt: (t) => `${t} 提醒我`,
    notifAlertNow: '立即提醒',
    notifSub: '取件1小时前浏览器提醒',
    notifSubSoon: '取件时间在1小时内 — 立即提醒',
    notifUnsupported: '此浏览器不支持通知',
    notifScheduled: '提醒已设置',
    notifScheduledSub: (t) => `将在 ${t} 提醒您 — 请保持标签页开启`,
    notifCancel: '取消',
    notifFired: '提醒已发送',
    notifFiredSub: '是时候去取行李了！',
    notifDenied: '通知权限被拒绝',
    notifDeniedSub: '请在浏览器设置中允许通知',
  },
  'zh-TW': {
    loading: '正在載入憑證…',
    notFound: '找不到憑證',
    back: '返回',
    live: '即時',
    statusDone: '已領取',
    statusDoneSub: '客人已取回行李',
    statusOverdue: '取件時間已超時',
    statusOverdueSub: (min) => `已超時 ${Math.abs(min)} 分鐘 · 可能收取延時費`,
    statusActive: '保管中',
    statusActiveSub: (min) => min > 0 ? `距取件還有 ${min} 分鐘` : '即將到取件時間',
    tagNo: '標籤號碼',
    tagUnit: '號',
    zone: '區域',
    storageDuration: '保管時間',
    durationUnit: '小時',
    bags: '行李',
    payment: '付款方式',
    discount: '折扣',
    currencyUnit: '₩',
    total: '合計',
    staffOnly: '限工作人員',
    staffScan: '掃碼完成歸還',
    staffScanSub: '工作人員掃描此QR碼\n即可進入歸還確認頁面',
    smallBag: '小型',
    carrier: '行李箱',
    unitSuffix: '件',
    airportTitle: '升級為機場配送',
    airportSub: '將行李送到機場',
    airportStep1: '現在寄存行李，我們將直接配送至仁川國際機場',
    airportStep2Pre: '付款方式：',
    airportStep2Highlight: '在仁川機場現場現金支付',
    airportStep2Post: '',
    airportStep3: '預約後請將此頁面出示給工作人員',
    cashOnly: '僅限現金支付',
    cashNote: '在仁川國際機場提取時付款',
    bookDelivery: '預約機場配送',
    savingImage: '儲存中…',
    saveVoucher: '儲存憑證圖片',
    returnDone: '✓ 歸還完成',
    returnDoneSub: '此憑證將保留以供記錄',
    notifAlertAt: (t) => `${t} 提醒我`,
    notifAlertNow: '立即提醒',
    notifSub: '取件1小時前瀏覽器提醒',
    notifSubSoon: '取件時間在1小時內 — 立即提醒',
    notifUnsupported: '此瀏覽器不支援通知',
    notifScheduled: '提醒已設定',
    notifScheduledSub: (t) => `將在 ${t} 提醒您 — 請保持標籤頁開啟`,
    notifCancel: '取消',
    notifFired: '提醒已傳送',
    notifFiredSub: '是時候去取行李了！',
    notifDenied: '通知權限被拒絕',
    notifDeniedSub: '請在瀏覽器設定中允許通知',
  },
  'zh-HK': {
    loading: '正在載入憑證…',
    notFound: '找不到憑證',
    back: '返回',
    live: '即時',
    statusDone: '已領取',
    statusDoneSub: '客人已取回行李',
    statusOverdue: '取件時間已超時',
    statusOverdueSub: (min) => `已超時 ${Math.abs(min)} 分鐘 · 可能收取延時費`,
    statusActive: '保管中',
    statusActiveSub: (min) => min > 0 ? `距取件還有 ${min} 分鐘` : '即將到取件時間',
    tagNo: '標籤號碼',
    tagUnit: '號',
    zone: '區域',
    storageDuration: '保管時間',
    durationUnit: '小時',
    bags: '行李',
    payment: '付款方式',
    discount: '折扣',
    currencyUnit: '₩',
    total: '合計',
    staffOnly: '限工作人員',
    staffScan: '掃碼完成歸還',
    staffScanSub: '工作人員掃描此QR碼\n即可進入歸還確認頁面',
    smallBag: '小型',
    carrier: '行李箱',
    unitSuffix: '件',
    airportTitle: '升級為機場送遞',
    airportSub: '將行李送到機場',
    airportStep1: '現在寄存行李，我們將直接送遞至仁川國際機場',
    airportStep2Pre: '付款方式：',
    airportStep2Highlight: '在仁川機場現場現金支付',
    airportStep2Post: '',
    airportStep3: '預約後請將此頁面出示給工作人員',
    cashOnly: '只限現金支付',
    cashNote: '在仁川國際機場提取時付款',
    bookDelivery: '預約機場送遞',
    savingImage: '儲存中…',
    saveVoucher: '儲存憑證圖片',
    returnDone: '✓ 歸還完成',
    returnDoneSub: '此憑證將保留以作記錄',
    notifAlertAt: (t) => `${t} 提醒我`,
    notifAlertNow: '立即提醒',
    notifSub: '取件1小時前瀏覽器提醒',
    notifSubSoon: '取件時間在1小時內 — 立即提醒',
    notifUnsupported: '此瀏覽器不支援通知',
    notifScheduled: '提醒已設定',
    notifScheduledSub: (t) => `將在 ${t} 提醒您 — 請保持標籤頁開啟`,
    notifCancel: '取消',
    notifFired: '提醒已傳送',
    notifFiredSub: '係時候去攞行李喇！',
    notifDenied: '通知權限被拒絕',
    notifDeniedSub: '請喺瀏覽器設定允許通知',
  },
  ja: {
    loading: '伝票を読み込み中…',
    notFound: '伝票が見つかりません',
    back: '戻る',
    live: 'ライブ',
    statusDone: '返却完了',
    statusDoneSub: 'お客様が荷物をお受け取りになりました',
    statusOverdue: 'ピックアップ時間超過',
    statusOverdueSub: (min) => `${Math.abs(min)}分超過 · 延長料金が発生する場合があります`,
    statusActive: '保管中',
    statusActiveSub: (min) => min > 0 ? `ピックアップまで ${min}分` : 'ピックアップ時間が近づいています',
    tagNo: 'タグ番号',
    tagUnit: '番',
    zone: 'ゾーン',
    storageDuration: '保管時間',
    durationUnit: '時間',
    bags: '荷物',
    payment: 'お支払い方法',
    discount: '割引',
    currencyUnit: '₩',
    total: '合計',
    staffOnly: 'スタッフ専用',
    staffScan: 'QRスキャンで返却処理',
    staffScanSub: 'スタッフがこのQRをスキャンすると\n返却完了画面に移動します',
    smallBag: '小型',
    carrier: 'キャリー',
    unitSuffix: '個',
    airportTitle: '空港配送に切り替え',
    airportSub: '荷物を空港までお届けします',
    airportStep1: '今すぐ荷物を預けて、仁川国際空港まで直接お届けします',
    airportStep2Pre: 'お支払いは',
    airportStep2Highlight: '仁川空港の現場で現金払い',
    airportStep2Post: 'となります',
    airportStep3: '予約後にこの画面をスタッフにご提示ください',
    cashOnly: '現金払い専用',
    cashNote: '仁川国際空港受け取り時にお支払い',
    bookDelivery: '空港配送を予約する',
    savingImage: '保存中…',
    saveVoucher: '伝票画像を保存',
    returnDone: '✓ 返却が完了しました',
    returnDoneSub: 'この伝票は記録として保持されます',
    notifAlertAt: (t) => `${t}に通知を受け取る`,
    notifAlertNow: '今すぐ通知を受け取る',
    notifSub: 'ピックアップ1時間前にブラウザ通知',
    notifSubSoon: 'ピックアップ時間が1時間以内 — すぐに通知',
    notifUnsupported: 'このブラウザは通知をサポートしていません',
    notifScheduled: '通知設定完了',
    notifScheduledSub: (t) => `${t}に通知が鳴ります — タブを開いたままにしてください`,
    notifCancel: 'キャンセル',
    notifFired: '通知送信済み',
    notifFiredSub: '荷物を取りに行く時間です！',
    notifDenied: '通知の権限が拒否されました',
    notifDeniedSub: 'ブラウザの設定で通知を許可してください',
  },
};

const VALID_LANGS: VoucherLang[] = ['ko', 'en', 'zh', 'zh-TW', 'zh-HK', 'ja'];

function resolveVoucherLang(raw: string | null): VoucherLang {
  if (!raw) return 'en';
  if (VALID_LANGS.includes(raw as VoucherLang)) return raw as VoucherLang;
  return 'en';
}
// ─────────────────────────────────────────────────────────────────────────────

const formatTime = (hhmm: string) => {
  if (!hhmm) return '--:--';
  return hhmm.slice(0, 5);
};

const getMinutesLeft = (pickupTime: string): number => {
  const now = new Date();
  const [h, m] = pickupTime.split(':').map(Number);
  const pickupTotal = h * 60 + m;
  const nowTotal = now.getHours() * 60 + now.getMinutes();
  return pickupTotal - nowTotal;
};

// pickup_ts(ms)로부터 1시간 전 알림 시각 문자열 반환 (HH:MM)
const getAlertTimeLabel = (pickupTs: number): string => {
  const alertAt = new Date(pickupTs - 60 * 60 * 1000);
  const h = String(alertAt.getHours()).padStart(2, '0');
  const m = String(alertAt.getMinutes()).padStart(2, '0');
  return `${h}:${m}`;
};

type NotifStatus = 'idle' | 'scheduled' | 'fired' | 'denied' | 'unsupported' | 'too_late';

const KioskVoucherPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const logId = Number(searchParams.get('id'));
  const lang = resolveVoucherLang(searchParams.get('lang'));
  const l = VOUCHER_LABELS[lang];

  const [log, setLog] = useState<KioskStorageLog | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [now, setNow] = useState(new Date());
  const [showDeliveryInfo, setShowDeliveryInfo] = useState(false);
  const [saving, setSaving] = useState(false);
  const [notifStatus, setNotifStatus] = useState<NotifStatus>('idle');
  const notifTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const voucherRef = useRef<HTMLDivElement>(null);

  const fetchLog = useCallback(async () => {
    if (!logId) { setNotFound(true); setLoading(false); return; }
    const entry = await loadLogById(logId);
    if (!entry) { setNotFound(true); setLoading(false); return; }
    setLog(entry);
    setLoading(false);
  }, [logId]);

  useEffect(() => { fetchLog(); }, [fetchLog]);

  // 완료 전까지 5초마다 폴링
  useEffect(() => {
    if (log?.done) return;
    const timer = setInterval(fetchLog, POLL_INTERVAL);
    return () => clearInterval(timer);
  }, [log?.done, fetchLog]);

  // 분침 업데이트
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 30000);
    return () => clearInterval(t);
  }, []);

  // 알림 타이머 정리
  useEffect(() => () => { if (notifTimerRef.current) clearTimeout(notifTimerRef.current); }, []);

  const handleSetNotification = async () => {
    if (!log) return;

    if (!('Notification' in window)) {
      setNotifStatus('unsupported');
      return;
    }

    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      setNotifStatus('denied');
      return;
    }

    const pickupTs = log.pickup_ts
      ? log.pickup_ts
      : (() => {
          const [h, m] = (log.pickup_time || '00:00').split(':').map(Number);
          const d = new Date();
          d.setHours(h, m, 0, 0);
          return d.getTime();
        })();

    const alertAt = pickupTs - 60 * 60 * 1000; // 1시간 전
    const delay = alertAt - Date.now();

    if (delay <= 0) {
      new Notification('🐝 Beeliber', {
        body: l.notifFiredSub,
        icon: '/favicon.ico',
        tag: `beeliber-kiosk-${log.id}`,
      });
      setNotifStatus('fired');
      return;
    }

    if (notifTimerRef.current) clearTimeout(notifTimerRef.current);
    notifTimerRef.current = setTimeout(() => {
      new Notification('🐝 Beeliber', {
        body: l.notifFiredSub,
        icon: '/favicon.ico',
        tag: `beeliber-kiosk-${log.id}`,
      });
      setNotifStatus('fired');
    }, delay);

    setNotifStatus('scheduled');
  };

  const handleSaveImage = async () => {
    if (!voucherRef.current || saving) return;
    setSaving(true);
    try {
      const { default: html2canvas } = await import('html2canvas');
      const canvas = await html2canvas(voucherRef.current, {
        backgroundColor: '#f5f5f7',
        scale: 2,
        useCORS: true,
        logging: false,
      });
      const link = document.createElement('a');
      link.download = `beeliber-voucher-${log?.tag ?? logId}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } finally {
      setSaving(false);
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-[#111111] flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-10 h-10 border-4 border-[#F5C842]/20 border-t-[#F5C842] rounded-full animate-spin" />
        <p className="text-white/50 text-sm">{l.loading}</p>
      </div>
    </div>
  );

  if (notFound || !log) return (
    <div className="min-h-screen bg-[#111111] flex items-center justify-center text-center px-6">
      <div>
        <p className="text-5xl mb-4">🐝</p>
        <p className="text-white text-xl font-black mb-2">{l.notFound}</p>
        <p className="text-white/40 text-sm mb-6">ID: {logId || '—'}</p>
        <button onClick={() => navigate(-1)}
          className="px-6 py-3 bg-[#F5C842] text-[#111111] font-black rounded-full text-sm">
          {l.back}
        </button>
      </div>
    </div>
  );

  const pickupT = log.pickup_time ? formatTime(log.pickup_time) : addHours(log.start_time, log.duration);
  const minutesLeft = getMinutesLeft(log.pickup_time || addHours(log.start_time, log.duration));
  const isOverdue = minutesLeft < 0 && !log.done;
  const isDone = log.done;

  const bagLabel = [
    log.small_qty > 0 ? `${l.smallBag} ${log.small_qty}${l.unitSuffix}` : '',
    log.carrier_qty > 0 ? `${l.carrier} ${log.carrier_qty}${l.unitSuffix}` : '',
  ].filter(Boolean).join(' · ');

  const netPrice = (log.original_price ?? 0) - (log.discount ?? 0);

  return (
    <div className="min-h-screen bg-[#f5f5f7] flex flex-col items-center pb-12">
      {/* 헤더 */}
      <header className="w-full bg-[#111111] px-5 py-3 flex items-center justify-between flex-shrink-0">
        <button onClick={() => navigate(-1)} className="text-white/50 hover:text-white transition-colors text-sm font-bold flex items-center gap-2">
          <i className="fa-solid fa-arrow-left text-xs" /> {l.back}
        </button>
        <p className="text-[#F5C842] font-black text-sm tracking-[0.15em]">BEELIBER</p>
        {!isDone && (
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
            <span className="text-white/30 text-xs">{l.live}</span>
          </div>
        )}
        {isDone && <div className="w-16" />}
      </header>

      <div className="w-full max-w-sm px-4 pt-6 space-y-4" ref={voucherRef}>

        {/* 상태 배지 */}
        {isDone ? (
          <div className="bg-green-500 rounded-[20px] px-5 py-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
              <i className="fa-solid fa-check text-white text-lg" />
            </div>
            <div>
              <p className="text-white font-black text-base">{l.statusDone}</p>
              <p className="text-white/70 text-xs">{l.statusDoneSub}</p>
            </div>
          </div>
        ) : isOverdue ? (
          <div className="bg-red-500 rounded-[20px] px-5 py-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
              <i className="fa-solid fa-clock text-white text-lg" />
            </div>
            <div>
              <p className="text-white font-black text-base">{l.statusOverdue}</p>
              <p className="text-white/70 text-xs">{l.statusOverdueSub(minutesLeft)}</p>
            </div>
          </div>
        ) : (
          <div className="bg-[#F5C842] rounded-[20px] px-5 py-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#111111]/10 flex items-center justify-center flex-shrink-0">
              <i className="fa-solid fa-box-open text-[#111111] text-lg" />
            </div>
            <div>
              <p className="text-[#111111] font-black text-base">{l.statusActive}</p>
              <p className="text-[#111111]/60 text-xs">{l.statusActiveSub(minutesLeft)}</p>
            </div>
          </div>
        )}

        {/* 픽업 1시간 전 알림 */}
        {!isDone && (() => {
          const pickupTs = log.pickup_ts
            ? log.pickup_ts
            : (() => {
                const [h, m] = (log.pickup_time || '00:00').split(':').map(Number);
                const d = new Date(); d.setHours(h, m, 0, 0);
                return d.getTime();
              })();
          const alertTimeLabel = getAlertTimeLabel(pickupTs);
          const tooLate = (pickupTs - Date.now()) <= 60 * 60 * 1000;

          return (
            <div className={`rounded-[20px] overflow-hidden border ${
              notifStatus === 'scheduled' ? 'bg-blue-50 border-blue-100' :
              notifStatus === 'fired'     ? 'bg-green-50 border-green-100' :
              notifStatus === 'denied'   ? 'bg-red-50 border-red-100' :
              'bg-white border-gray-100 shadow-sm'
            }`}>
              {notifStatus === 'idle' || notifStatus === 'unsupported' || notifStatus === 'too_late' ? (
                <button
                  onClick={handleSetNotification}
                  disabled={notifStatus === 'unsupported'}
                  className="w-full px-5 py-4 flex items-center gap-3 disabled:opacity-50"
                >
                  <div className="w-9 h-9 rounded-xl bg-[#F5C842]/10 flex items-center justify-center flex-shrink-0">
                    <i className="fa-solid fa-bell text-[#F5C842] text-sm" />
                  </div>
                  <div className="text-left flex-1">
                    <p className="text-[#111111] font-black text-sm">
                      {tooLate ? l.notifAlertNow : l.notifAlertAt(alertTimeLabel)}
                    </p>
                    <p className="text-gray-400 text-xs">
                      {notifStatus === 'unsupported'
                        ? l.notifUnsupported
                        : tooLate
                          ? l.notifSubSoon
                          : l.notifSub}
                    </p>
                  </div>
                  <i className="fa-solid fa-chevron-right text-gray-300 text-xs flex-shrink-0" />
                </button>
              ) : notifStatus === 'scheduled' ? (
                <div className="px-5 py-4 flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-blue-100 flex items-center justify-center flex-shrink-0">
                    <i className="fa-solid fa-bell text-blue-500 text-sm" />
                  </div>
                  <div className="flex-1">
                    <p className="text-blue-700 font-black text-sm">{l.notifScheduled}</p>
                    <p className="text-blue-400 text-xs">{l.notifScheduledSub(alertTimeLabel)}</p>
                  </div>
                  <button
                    onClick={() => { if (notifTimerRef.current) clearTimeout(notifTimerRef.current); setNotifStatus('idle'); }}
                    className="text-blue-300 text-xs font-bold"
                  >
                    {l.notifCancel}
                  </button>
                </div>
              ) : notifStatus === 'fired' ? (
                <div className="px-5 py-4 flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-green-100 flex items-center justify-center flex-shrink-0">
                    <i className="fa-solid fa-bell text-green-500 text-sm" />
                  </div>
                  <div>
                    <p className="text-green-700 font-black text-sm">{l.notifFired}</p>
                    <p className="text-green-400 text-xs">{l.notifFiredSub}</p>
                  </div>
                </div>
              ) : notifStatus === 'denied' ? (
                <div className="px-5 py-4 flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-red-100 flex items-center justify-center flex-shrink-0">
                    <i className="fa-solid fa-bell-slash text-red-400 text-sm" />
                  </div>
                  <div>
                    <p className="text-red-600 font-black text-sm">{l.notifDenied}</p>
                    <p className="text-red-400 text-xs">{l.notifDeniedSub}</p>
                  </div>
                </div>
              ) : null}
            </div>
          );
        })()}

        {/* 메인 바우처 카드 */}
        <div className="bg-white rounded-[28px] shadow-sm overflow-hidden">
          {/* 태그 + 구역 */}
          <div className="px-6 pt-6 pb-4 flex items-center justify-between border-b border-[#f0f0f0]">
            <div>
              <p className="text-gray-400 text-[10px] font-black uppercase tracking-widest mb-1">{l.tagNo}</p>
              <div className="flex items-baseline gap-1">
                <span className="text-6xl font-black text-[#111111] tabular-nums leading-none">{log.tag}</span>
                {l.tagUnit && <span className="text-lg font-bold text-gray-400">{l.tagUnit}</span>}
              </div>
            </div>
            <div className="bg-[#F5C842] rounded-2xl px-6 py-4 text-center">
              <p className="text-[#111111]/50 text-[9px] font-black uppercase tracking-widest mb-0.5">{l.zone}</p>
              <p className="text-[#111111] font-black text-3xl leading-none">{log.row_label}</p>
            </div>
          </div>

          {/* 상세 정보 */}
          <div className="px-6 py-4 space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-gray-400 text-sm">{l.storageDuration}</span>
              <span className="font-black text-[#111111] text-sm">
                {log.duration}{l.durationUnit} ({formatTime(log.start_time)} → {pickupT})
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-400 text-sm">{l.bags}</span>
              <span className="font-black text-[#111111] text-sm">{bagLabel || '-'}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-400 text-sm">{l.payment}</span>
              <span className="font-black text-[#111111] text-sm">{log.payment}</span>
            </div>
            {(log.discount ?? 0) > 0 && (
              <div className="flex justify-between items-center">
                <span className="text-gray-400 text-sm">{l.discount}</span>
                <span className="font-black text-red-500 text-sm">-{(log.discount ?? 0).toLocaleString()}{l.currencyUnit}</span>
              </div>
            )}
            <div className="flex justify-between items-center pt-3 border-t border-[#f0f0f0]">
              <span className="text-gray-400 text-sm font-bold">{l.total}</span>
              <span className="font-black text-[#111111] text-xl tabular-nums">{netPrice.toLocaleString()}{l.currencyUnit}</span>
            </div>
          </div>

          {/* 직원 스캔용 QR 코드 */}
          {!isDone && (
            <div className="mx-6 mb-4 mt-1 border border-[#f0f0f0] rounded-2xl px-5 py-4 flex items-center gap-4 bg-[#fafafa]">
              <div className="flex-shrink-0 p-1 bg-white rounded-xl border border-gray-100 shadow-sm">
                <QRCodeSVG
                  value={`${window.location.origin}/kiosk/staff-return?id=${log.id}`}
                  size={72}
                  bgColor="#ffffff"
                  fgColor="#111111"
                  level="M"
                />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">{l.staffOnly}</p>
                <p className="text-[#111111] font-black text-sm leading-tight">{l.staffScan}</p>
                <p className="text-gray-400 text-[11px] mt-0.5 leading-tight">
                  {l.staffScanSub.split('\n').map((line, i) => (
                    <span key={i}>{line}{i === 0 ? <br /> : null}</span>
                  ))}
                </p>
              </div>
            </div>
          )}

          {/* 날짜 + ID */}
          <div className="px-6 py-3 bg-[#f9f9f9] rounded-b-[28px] flex items-center justify-between">
            <span className="text-gray-400 text-xs font-bold">{log.date}</span>
            <span className="text-gray-400 text-xs font-bold">#{log.id}</span>
          </div>
        </div>

        {/* 공항 배송 전환 카드 */}
        <div className="bg-[#111111] rounded-[28px] overflow-hidden">
          <button
            onClick={() => setShowDeliveryInfo(!showDeliveryInfo)}
            className="w-full px-6 py-5 flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-[#F5C842]/10 flex items-center justify-center flex-shrink-0">
                <i className="fa-solid fa-plane text-[#F5C842] text-sm" />
              </div>
              <div className="text-left">
                <p className="text-white font-black text-sm">{l.airportTitle}</p>
                <p className="text-white/40 text-xs">{l.airportSub}</p>
              </div>
            </div>
            <i className={`fa-solid fa-chevron-${showDeliveryInfo ? 'up' : 'down'} text-white/30 text-xs transition-transform`} />
          </button>

          {showDeliveryInfo && (
            <div className="px-6 pb-6 space-y-4 border-t border-white/10 pt-4">
              <div className="space-y-2">
                <div className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-[#F5C842]/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <i className="fa-solid fa-1 text-[#F5C842] text-[9px]" />
                  </span>
                  <p className="text-white/70 text-xs leading-relaxed">{l.airportStep1}</p>
                </div>
                <div className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-[#F5C842]/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <i className="fa-solid fa-2 text-[#F5C842] text-[9px]" />
                  </span>
                  <p className="text-white/70 text-xs leading-relaxed">
                    {l.airportStep2Pre}
                    <span className="text-[#F5C842] font-black">{l.airportStep2Highlight}</span>
                    {l.airportStep2Post}
                  </p>
                </div>
                <div className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-[#F5C842]/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <i className="fa-solid fa-3 text-[#F5C842] text-[9px]" />
                  </span>
                  <p className="text-white/70 text-xs leading-relaxed">{l.airportStep3}</p>
                </div>
              </div>

              <div className="bg-[#F5C842]/10 border border-[#F5C842]/20 rounded-2xl px-4 py-3 flex items-center gap-3">
                <i className="fa-solid fa-money-bill-wave text-[#F5C842] text-lg flex-shrink-0" />
                <div>
                  <p className="text-[#F5C842] font-black text-xs">{l.cashOnly}</p>
                  <p className="text-white/50 text-[10px]">{l.cashNote}</p>
                </div>
              </div>

              <a
                href={`/ko/booking?from=kiosk_voucher&kiosk_log=${log.id}&bags=${log.small_qty}&carriers=${log.carrier_qty}&payment=cash_on_delivery`}
                className="w-full bg-[#F5C842] text-[#111111] font-black py-4 rounded-2xl text-sm flex items-center justify-center gap-2 active:scale-[0.98] transition-transform"
              >
                <i className="fa-solid fa-plane-departure" />
                {l.bookDelivery}
              </a>
            </div>
          )}
        </div>

        {/* 이미지 저장 */}
        <button
          onClick={handleSaveImage}
          disabled={saving}
          className="w-full bg-white border border-gray-200 text-[#111111] font-black py-4 rounded-[24px] text-sm active:scale-[0.98] transition-all flex items-center justify-center gap-2 shadow-sm disabled:opacity-60"
        >
          {saving ? (
            <>
              <div className="w-4 h-4 border-2 border-gray-300 border-t-[#111111] rounded-full animate-spin" />
              {l.savingImage}
            </>
          ) : (
            <>
              <i className="fa-solid fa-download text-[#F5C842]" />
              {l.saveVoucher}
            </>
          )}
        </button>

        {/* 완료 후 메시지 */}
        {isDone && (
          <div className="bg-green-50 border border-green-100 rounded-[24px] px-6 py-5 text-center">
            <p className="text-green-600 font-black text-base mb-1">{l.returnDone}</p>
            <p className="text-green-400 text-xs">{l.returnDoneSub}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default KioskVoucherPage;
