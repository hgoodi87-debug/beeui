/**
 * KioskStaffReturnPage — 직원 전용 반납 처리 페이지
 * URL: /kiosk/staff-return?id=LOG_ID
 * - 고객 바우처의 QR 코드를 스캔하면 이 페이지로 진입
 * - 직원이 보관 내역을 확인하고 반납 완료 처리
 * - 인증 불필요 (키오스크 내부망 전용)
 */
import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { loadLogById, updateStorageLog, KioskStorageLog, addHours } from '../services/kioskDb';

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

const KioskStaffReturnPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const logId = Number(searchParams.get('id'));

  const [log, setLog] = useState<KioskStorageLog | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [marking, setMarking] = useState(false);
  const [done, setDone] = useState(false);

  const fetchLog = useCallback(async () => {
    if (!logId) { setNotFound(true); setLoading(false); return; }
    const entry = await loadLogById(logId);
    if (!entry) { setNotFound(true); setLoading(false); return; }
    setLog(entry);
    setDone(entry.done);
    setLoading(false);
  }, [logId]);

  useEffect(() => { fetchLog(); }, [fetchLog]);

  const handleMarkDone = async () => {
    if (!log?.id || marking) return;
    setMarking(true);
    try {
      await updateStorageLog(log.id, { done: true });
      setLog((prev) => prev ? { ...prev, done: true } : prev);
      setDone(true);
    } finally {
      setMarking(false);
    }
  };

  // --- 로딩 ---
  if (loading) return (
    <div className="min-h-screen bg-[#111111] flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-10 h-10 border-4 border-[#F5C842]/20 border-t-[#F5C842] rounded-full animate-spin" />
        <p className="text-white/50 text-sm">바우처 불러오는 중…</p>
      </div>
    </div>
  );

  // --- 못찾음 ---
  if (notFound || !log) return (
    <div className="min-h-screen bg-[#111111] flex items-center justify-center text-center px-6">
      <div>
        <p className="text-5xl mb-4">🐝</p>
        <p className="text-white text-xl font-black mb-2">바우처를 찾을 수 없습니다</p>
        <p className="text-white/40 text-sm">ID: {logId || '없음'}</p>
      </div>
    </div>
  );

  const pickupT = log.pickup_time ? formatTime(log.pickup_time) : addHours(log.start_time, log.duration);
  const minutesLeft = getMinutesLeft(log.pickup_time || addHours(log.start_time, log.duration));
  const isOverdue = minutesLeft < 0 && !done;
  const bagLabel = [
    log.small_qty > 0 ? `소형 ${log.small_qty}개` : '',
    log.carrier_qty > 0 ? `캐리어 ${log.carrier_qty}개` : '',
  ].filter(Boolean).join(' · ');
  const netPrice = (log.original_price ?? 0) - (log.discount ?? 0);

  // --- 완료 상태 ---
  if (done) return (
    <div className="min-h-screen bg-[#111111] flex flex-col items-center justify-center px-6 text-center gap-6">
      <div className="w-24 h-24 rounded-full bg-green-500 flex items-center justify-center">
        <i className="fa-solid fa-check text-white text-4xl" />
      </div>
      <div>
        <p className="text-white font-black text-2xl mb-2">반납 완료</p>
        <p className="text-white/50 text-sm">태그 <span className="text-[#F5C842] font-black">{log.tag}번</span> · 구역 <span className="text-[#F5C842] font-black">{log.row_label}</span></p>
        <p className="text-white/30 text-xs mt-2">고객이 짐을 찾아갔습니다</p>
      </div>
      <button
        onClick={() => window.close()}
        className="px-8 py-3 bg-white/10 text-white/60 font-bold rounded-full text-sm"
      >
        창 닫기
      </button>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#111111] flex flex-col">
      {/* 헤더 */}
      <header className="px-5 py-4 flex items-center justify-between border-b border-white/10">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-[#F5C842]" />
          <p className="text-[#F5C842] font-black text-sm tracking-[0.15em]">BEELIBER STAFF</p>
        </div>
        <p className="text-white/30 text-xs">반납 처리</p>
      </header>

      <div className="flex-1 flex flex-col items-center justify-center px-5 py-8 gap-5 w-full max-w-sm mx-auto">

        {/* 상태 배지 */}
        {isOverdue ? (
          <div className="w-full bg-red-500/10 border border-red-500/30 rounded-[20px] px-5 py-4 flex items-center gap-3">
            <i className="fa-solid fa-triangle-exclamation text-red-400 text-lg" />
            <div>
              <p className="text-red-300 font-black text-sm">픽업 시간 초과</p>
              <p className="text-red-400/60 text-xs">{Math.abs(minutesLeft)}분 경과</p>
            </div>
          </div>
        ) : (
          <div className="w-full bg-[#F5C842]/10 border border-[#F5C842]/20 rounded-[20px] px-5 py-4 flex items-center gap-3">
            <i className="fa-solid fa-box-open text-[#F5C842] text-lg" />
            <div>
              <p className="text-[#F5C842] font-black text-sm">보관 중</p>
              <p className="text-[#F5C842]/50 text-xs">
                {minutesLeft > 0 ? `픽업까지 ${minutesLeft}분` : '픽업 시간 임박'}
              </p>
            </div>
          </div>
        )}

        {/* 메인 카드 */}
        <div className="w-full bg-white/5 border border-white/10 rounded-[28px] overflow-hidden">
          {/* 태그 + 구역 */}
          <div className="px-6 pt-6 pb-5 flex items-center justify-between border-b border-white/10">
            <div>
              <p className="text-white/30 text-[10px] font-black uppercase tracking-widest mb-1">태그 번호</p>
              <div className="flex items-baseline gap-1">
                <span className="text-7xl font-black text-white tabular-nums leading-none">{log.tag}</span>
                <span className="text-xl font-bold text-white/40">번</span>
              </div>
            </div>
            <div className="bg-[#F5C842] rounded-2xl px-7 py-5 text-center">
              <p className="text-[#111111]/50 text-[9px] font-black uppercase tracking-widest mb-0.5">구역</p>
              <p className="text-[#111111] font-black text-4xl leading-none">{log.row_label}</p>
            </div>
          </div>

          {/* 상세 */}
          <div className="px-6 py-5 space-y-3.5">
            <div className="flex justify-between items-center">
              <span className="text-white/40 text-sm">보관 시간</span>
              <span className="font-black text-white text-sm">
                {log.duration}시간 ({formatTime(log.start_time)} → {pickupT})
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-white/40 text-sm">짐</span>
              <span className="font-black text-white text-sm">{bagLabel || '-'}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-white/40 text-sm">결제 방법</span>
              <span className="font-black text-white text-sm">{log.payment}</span>
            </div>
            {(log.discount ?? 0) > 0 && (
              <div className="flex justify-between items-center">
                <span className="text-white/40 text-sm">할인</span>
                <span className="font-black text-red-400 text-sm">-{(log.discount ?? 0).toLocaleString()}원</span>
              </div>
            )}
            <div className="flex justify-between items-center pt-3 border-t border-white/10">
              <span className="text-white/50 text-sm font-bold">합계</span>
              <span className="font-black text-white text-2xl tabular-nums">{netPrice.toLocaleString()}원</span>
            </div>
          </div>

          {/* 날짜 · ID */}
          <div className="px-6 py-3 bg-white/5 flex items-center justify-between">
            <span className="text-white/20 text-xs">{log.date}</span>
            <span className="text-white/20 text-xs">#{log.id}</span>
          </div>
        </div>

        {/* 반납 완료 처리 버튼 */}
        <button
          onClick={handleMarkDone}
          disabled={marking}
          className="w-full bg-[#F5C842] text-[#111111] font-black py-5 rounded-[24px] text-lg active:scale-[0.97] transition-all disabled:opacity-60 flex items-center justify-center gap-3 shadow-xl shadow-[#F5C842]/20"
        >
          {marking ? (
            <>
              <div className="w-5 h-5 border-2 border-[#111111]/30 border-t-[#111111] rounded-full animate-spin" />
              처리 중…
            </>
          ) : (
            <>
              <i className="fa-solid fa-check-circle text-xl" />
              반납 완료 처리
            </>
          )}
        </button>

        <p className="text-white/20 text-xs text-center">
          직원 전용 페이지 · 고객에게 노출 금지
        </p>
      </div>
    </div>
  );
};

export default KioskStaffReturnPage;
