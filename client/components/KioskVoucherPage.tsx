/**
 * KioskVoucherPage — 키오스크 예약 확정 바우처
 * URL: /kiosk/voucher?id=LOG_ID
 * - QR 스캔 후 실시간 바우처 표시
 * - 보관 완료 전까지 5초마다 폴링
 * - 직원용 반납 처리 버튼
 * - 공항 배송 전환 안내 (인천 현장 현금 지불)
 */
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import html2canvas from 'html2canvas';
import { QRCodeSVG } from 'qrcode.react';
import { loadLogById, KioskStorageLog, addHours } from '../services/kioskDb';

const POLL_INTERVAL = 5000;

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

    // 지원 여부 확인
    if (!('Notification' in window)) {
      setNotifStatus('unsupported');
      return;
    }

    // 권한 요청
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      setNotifStatus('denied');
      return;
    }

    // pickup_ts가 없으면 시:분으로 오늘 날짜 기준 계산
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
      // 이미 픽업 1시간 이내 — 즉시 알림
      new Notification('🐝 빌리버 — 짐 찾으러 가세요!', {
        body: `태그 ${log.tag}번 짐 픽업 시간이 1시간도 안 남았어요. 서둘러 주세요!`,
        icon: '/favicon.ico',
        tag: `beeliber-kiosk-${log.id}`,
      });
      setNotifStatus('fired');
      return;
    }

    // 스케줄 등록
    if (notifTimerRef.current) clearTimeout(notifTimerRef.current);
    notifTimerRef.current = setTimeout(() => {
      new Notification('🐝 빌리버 — 짐 찾으러 가세요!', {
        body: `태그 ${log.tag}번 짐 픽업 시간 1시간 전입니다. ${formatTime(log.pickup_time)}까지 찾아가세요.`,
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
        <p className="text-white/50 text-sm">바우처 불러오는 중…</p>
      </div>
    </div>
  );

  if (notFound || !log) return (
    <div className="min-h-screen bg-[#111111] flex items-center justify-center text-center px-6">
      <div>
        <p className="text-5xl mb-4">🐝</p>
        <p className="text-white text-xl font-black mb-2">바우처를 찾을 수 없습니다</p>
        <p className="text-white/40 text-sm mb-6">ID: {logId || '없음'}</p>
        <button onClick={() => navigate(-1)}
          className="px-6 py-3 bg-[#F5C842] text-[#111111] font-black rounded-full text-sm">
          돌아가기
        </button>
      </div>
    </div>
  );

  const pickupT = log.pickup_time ? formatTime(log.pickup_time) : addHours(log.start_time, log.duration);
  const minutesLeft = getMinutesLeft(log.pickup_time || addHours(log.start_time, log.duration));
  const isOverdue = minutesLeft < 0 && !log.done;
  const isDone = log.done;

  const bagLabel = [
    log.small_qty > 0 ? `소형 ${log.small_qty}개` : '',
    log.carrier_qty > 0 ? `캐리어 ${log.carrier_qty}개` : '',
  ].filter(Boolean).join(' · ');

  const netPrice = (log.original_price ?? 0) - (log.discount ?? 0);

  return (
    <div className="min-h-screen bg-[#f5f5f7] flex flex-col items-center pb-12">
      {/* 헤더 */}
      <header className="w-full bg-[#111111] px-5 py-3 flex items-center justify-between flex-shrink-0">
        <button onClick={() => navigate(-1)} className="text-white/50 hover:text-white transition-colors text-sm font-bold flex items-center gap-2">
          <i className="fa-solid fa-arrow-left text-xs" /> 돌아가기
        </button>
        <p className="text-[#F5C842] font-black text-sm tracking-[0.15em]">BEELIBER</p>
        {/* 실시간 폴링 표시 */}
        {!isDone && (
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
            <span className="text-white/30 text-xs">실시간</span>
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
              <p className="text-white font-black text-base">반납 완료</p>
              <p className="text-white/70 text-xs">고객이 짐을 찾아갔습니다</p>
            </div>
          </div>
        ) : isOverdue ? (
          <div className="bg-red-500 rounded-[20px] px-5 py-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
              <i className="fa-solid fa-clock text-white text-lg" />
            </div>
            <div>
              <p className="text-white font-black text-base">픽업 시간 초과</p>
              <p className="text-white/70 text-xs">{Math.abs(minutesLeft)}분 경과 · 연장료 적용 가능</p>
            </div>
          </div>
        ) : (
          <div className="bg-[#F5C842] rounded-[20px] px-5 py-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#111111]/10 flex items-center justify-center flex-shrink-0">
              <i className="fa-solid fa-box-open text-[#111111] text-lg" />
            </div>
            <div>
              <p className="text-[#111111] font-black text-base">보관 중</p>
              <p className="text-[#111111]/60 text-xs">
                {minutesLeft > 0 ? `픽업까지 ${minutesLeft}분` : '픽업 시간 임박'}
              </p>
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
                      {tooLate ? '지금 알림 받기' : `${alertTimeLabel}에 알림 받기`}
                    </p>
                    <p className="text-gray-400 text-xs">
                      {notifStatus === 'unsupported'
                        ? '이 브라우저는 알림을 지원하지 않아요'
                        : tooLate
                          ? '픽업 시간이 1시간 이내 — 바로 알림'
                          : '픽업 1시간 전에 브라우저 알림'}
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
                    <p className="text-blue-700 font-black text-sm">알림 설정 완료</p>
                    <p className="text-blue-400 text-xs">{alertTimeLabel}에 알림이 울립니다 — 탭을 유지해 주세요</p>
                  </div>
                  <button
                    onClick={() => { if (notifTimerRef.current) clearTimeout(notifTimerRef.current); setNotifStatus('idle'); }}
                    className="text-blue-300 text-xs font-bold"
                  >
                    취소
                  </button>
                </div>
              ) : notifStatus === 'fired' ? (
                <div className="px-5 py-4 flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-green-100 flex items-center justify-center flex-shrink-0">
                    <i className="fa-solid fa-bell text-green-500 text-sm" />
                  </div>
                  <div>
                    <p className="text-green-700 font-black text-sm">알림 전송됨</p>
                    <p className="text-green-400 text-xs">짐 찾을 시간이에요!</p>
                  </div>
                </div>
              ) : notifStatus === 'denied' ? (
                <div className="px-5 py-4 flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-red-100 flex items-center justify-center flex-shrink-0">
                    <i className="fa-solid fa-bell-slash text-red-400 text-sm" />
                  </div>
                  <div>
                    <p className="text-red-600 font-black text-sm">알림 권한 거부됨</p>
                    <p className="text-red-400 text-xs">브라우저 설정에서 알림을 허용해 주세요</p>
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
              <p className="text-gray-400 text-[10px] font-black uppercase tracking-widest mb-1">태그 번호</p>
              <div className="flex items-baseline gap-1">
                <span className="text-6xl font-black text-[#111111] tabular-nums leading-none">{log.tag}</span>
                <span className="text-lg font-bold text-gray-400">번</span>
              </div>
            </div>
            <div className="bg-[#F5C842] rounded-2xl px-6 py-4 text-center">
              <p className="text-[#111111]/50 text-[9px] font-black uppercase tracking-widest mb-0.5">구역</p>
              <p className="text-[#111111] font-black text-3xl leading-none">{log.row_label}</p>
            </div>
          </div>

          {/* 상세 정보 */}
          <div className="px-6 py-4 space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-gray-400 text-sm">보관 시간</span>
              <span className="font-black text-[#111111] text-sm">
                {log.duration}시간 ({formatTime(log.start_time)} → {pickupT})
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-400 text-sm">짐</span>
              <span className="font-black text-[#111111] text-sm">{bagLabel || '-'}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-400 text-sm">결제 방법</span>
              <span className="font-black text-[#111111] text-sm">{log.payment}</span>
            </div>
            {(log.discount ?? 0) > 0 && (
              <div className="flex justify-between items-center">
                <span className="text-gray-400 text-sm">할인</span>
                <span className="font-black text-red-500 text-sm">-{(log.discount ?? 0).toLocaleString()}원</span>
              </div>
            )}
            <div className="flex justify-between items-center pt-3 border-t border-[#f0f0f0]">
              <span className="text-gray-400 text-sm font-bold">합계</span>
              <span className="font-black text-[#111111] text-xl tabular-nums">{netPrice.toLocaleString()}원</span>
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
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">직원 전용</p>
                <p className="text-[#111111] font-black text-sm leading-tight">QR 스캔으로 반납 처리</p>
                <p className="text-gray-400 text-[11px] mt-0.5 leading-tight">직원이 이 QR을 스캔하면<br />반납 완료 처리 화면으로 이동합니다</p>
              </div>
            </div>
          )}

          {/* 날짜 + 지점 */}
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
                <p className="text-white font-black text-sm">공항 배송으로 전환</p>
                <p className="text-white/40 text-xs">짐을 공항까지 보내드립니다</p>
              </div>
            </div>
            <i className={`fa-solid fa-chevron-${showDeliveryInfo ? 'up' : 'down'} text-white/30 text-xs transition-transform`} />
          </button>

          {showDeliveryInfo && (
            <div className="px-6 pb-6 space-y-4 border-t border-white/10 pt-4">
              {/* 안내 메시지 */}
              <div className="space-y-2">
                <div className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-[#F5C842]/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <i className="fa-solid fa-1 text-[#F5C842] text-[9px]" />
                  </span>
                  <p className="text-white/70 text-xs leading-relaxed">
                    지금 짐을 맡기고 인천국제공항으로 직접 보내드립니다
                  </p>
                </div>
                <div className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-[#F5C842]/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <i className="fa-solid fa-2 text-[#F5C842] text-[9px]" />
                  </span>
                  <p className="text-white/70 text-xs leading-relaxed">
                    결제는 <span className="text-[#F5C842] font-black">인천공항 현장에서 현금</span>으로 진행합니다
                  </p>
                </div>
                <div className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-[#F5C842]/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <i className="fa-solid fa-3 text-[#F5C842] text-[9px]" />
                  </span>
                  <p className="text-white/70 text-xs leading-relaxed">
                    예약 후 스태프에게 이 화면을 보여주세요
                  </p>
                </div>
              </div>

              {/* 현금 안내 배지 */}
              <div className="bg-[#F5C842]/10 border border-[#F5C842]/20 rounded-2xl px-4 py-3 flex items-center gap-3">
                <i className="fa-solid fa-money-bill-wave text-[#F5C842] text-lg flex-shrink-0" />
                <div>
                  <p className="text-[#F5C842] font-black text-xs">현금 결제 전용</p>
                  <p className="text-white/50 text-[10px]">인천국제공항 현장 수령 시 납부</p>
                </div>
              </div>

              {/* 배송 예약 버튼 */}
              <a
                href={`/ko/booking?from=kiosk_voucher&kiosk_log=${log.id}&bags=${log.small_qty}&carriers=${log.carrier_qty}&payment=cash_on_delivery`}
                className="w-full bg-[#F5C842] text-[#111111] font-black py-4 rounded-2xl text-sm flex items-center justify-center gap-2 active:scale-[0.98] transition-transform"
              >
                <i className="fa-solid fa-plane-departure" />
                공항 배송 예약하기
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
              저장 중…
            </>
          ) : (
            <>
              <i className="fa-solid fa-download text-[#F5C842]" />
              바우처 이미지 저장
            </>
          )}
        </button>

        {/* 완료 후 메시지 */}
        {isDone && (
          <div className="bg-green-50 border border-green-100 rounded-[24px] px-6 py-5 text-center">
            <p className="text-green-600 font-black text-base mb-1">✓ 반납이 완료되었습니다</p>
            <p className="text-green-400 text-xs">이 바우처는 기록 보관용으로 유지됩니다</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default KioskVoucherPage;
