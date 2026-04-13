import React, { useEffect, useRef, useState } from 'react';

interface QRScanModalProps {
  onDetect: (bookingId: string) => void;
  onClose: () => void;
  /** inline 모드: 전체화면 오버레이 없이 부모 레이아웃 안에 임베드 */
  inline?: boolean;
}

// BarcodeDetector가 지원되는지 확인
const hasBarcodeDetector = (): boolean => {
  return typeof window !== 'undefined' && 'BarcodeDetector' in window;
};

// 스캔된 QR 텍스트에서 예약 ID 추출
// QR 포맷: https://bee-liber.com/staff/scan?id=XXXX 또는 예약코드 직접 포함
const extractBookingId = (text: string): string | null => {
  try {
    const url = new URL(text);
    const id = url.searchParams.get('id') || url.searchParams.get('scan');
    if (id) return id;
  } catch {
    // URL 아닌 경우 — 예약코드 직접 입력된 경우
  }
  // UUID 패턴 체크
  const uuidPattern = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i;
  const match = text.match(uuidPattern);
  if (match) return match[0];
  // 그 외 non-empty 텍스트 그대로 사용
  const trimmed = text.trim();
  return trimmed.length > 0 ? trimmed : null;
};

const QRScanModal: React.FC<QRScanModalProps> = ({ onDetect, onClose, inline = false }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number>(0);
  const detectorRef = useRef<any>(null);

  const [status, setStatus] = useState<'starting' | 'scanning' | 'error' | 'manual'>('starting');
  const [errorMsg, setErrorMsg] = useState('');
  const [manualInput, setManualInput] = useState('');
  const [scanCount, setScanCount] = useState(0);

  const stopCamera = () => {
    cancelAnimationFrame(rafRef.current);
    streamRef.current?.getTracks().forEach(t => t.stop());
    streamRef.current = null;
  };

  const handleClose = () => {
    stopCamera();
    onClose();
  };

  const handleManualSubmit = () => {
    const id = extractBookingId(manualInput.trim());
    if (!id) return;
    stopCamera();
    onDetect(id);
  };

  useEffect(() => {
    let cancelled = false;

    const startCamera = async () => {
      if (!hasBarcodeDetector()) {
        setStatus('manual');
        return;
      }

      try {
        // @ts-ignore — BarcodeDetector는 TypeScript 타입 없을 수 있음
        detectorRef.current = new window.BarcodeDetector({ formats: ['qr_code'] });
      } catch {
        setStatus('manual');
        return;
      }

      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } },
        });
        if (cancelled) { stream.getTracks().forEach(t => t.stop()); return; }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }
        setStatus('scanning');

        const scan = async () => {
          if (!videoRef.current || !canvasRef.current || !detectorRef.current) return;
          const video = videoRef.current;
          if (video.readyState < 2) { rafRef.current = requestAnimationFrame(scan); return; }

          try {
            const barcodes = await detectorRef.current.detect(video);
            if (barcodes.length > 0) {
              const text = barcodes[0].rawValue;
              const id = extractBookingId(text);
              if (id) {
                stopCamera();
                onDetect(id);
                return;
              }
            }
          } catch { /* 간헐적 오류 무시 */ }

          setScanCount(c => c + 1);
          rafRef.current = requestAnimationFrame(scan);
        };
        rafRef.current = requestAnimationFrame(scan);
      } catch (e: any) {
        if (!cancelled) {
          const isPermission = e?.name === 'NotAllowedError';
          setErrorMsg(isPermission ? '카메라 권한이 거부되었습니다. 직접 예약코드를 입력하세요.' : '카메라를 열 수 없습니다. 직접 예약코드를 입력하세요.');
          setStatus('manual');
        }
      }
    };

    startCamera();
    return () => {
      cancelled = true;
      stopCamera();
    };
  }, []);

  if (inline) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 gap-6">
        {/* 카메라 뷰 */}
        {(status === 'starting' || status === 'scanning') && (
          <div className="relative w-full max-w-sm aspect-square bg-black rounded-[32px] overflow-hidden shadow-2xl">
            <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
            <canvas ref={canvasRef} className="hidden" />
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="relative w-56 h-56">
                <div className="absolute top-0 left-0 w-10 h-10 border-t-4 border-l-4 border-bee-yellow rounded-tl-lg"></div>
                <div className="absolute top-0 right-0 w-10 h-10 border-t-4 border-r-4 border-bee-yellow rounded-tr-lg"></div>
                <div className="absolute bottom-0 left-0 w-10 h-10 border-b-4 border-l-4 border-bee-yellow rounded-bl-lg"></div>
                <div className="absolute bottom-0 right-0 w-10 h-10 border-b-4 border-r-4 border-bee-yellow rounded-br-lg"></div>
                <div className="absolute left-2 right-2 h-0.5 bg-bee-yellow/70" style={{ top: `${50 + 35 * Math.sin(scanCount * 0.08)}%` }}></div>
              </div>
            </div>
            {status === 'starting' && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/60">
                <div className="flex flex-col items-center gap-2 text-white">
                  <div className="w-6 h-6 border-2 border-bee-yellow border-t-transparent rounded-full animate-spin"></div>
                  <span className="text-[11px] font-bold">카메라 시작중...</span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* 수동 입력 fallback */}
        {status === 'manual' && (
          <div className="w-full max-w-sm space-y-3">
            {errorMsg ? (
              <div className="bg-amber-50 border border-amber-200 rounded-2xl px-4 py-3 text-xs font-bold text-amber-700 flex items-start gap-2">
                <i className="fa-solid fa-triangle-exclamation mt-0.5 flex-shrink-0"></i>
                <span>{errorMsg}</span>
              </div>
            ) : (
              <div className="bg-white/10 border border-white/20 rounded-2xl px-4 py-3 text-xs font-bold text-gray-300">
                이 기기는 카메라 QR 스캔을 지원하지 않아요.<br />예약코드를 직접 입력하세요.
              </div>
            )}
          </div>
        )}

        {status === 'scanning' && (
          <p className="text-[11px] text-gray-400 font-bold text-center">QR코드를 네모 안에 맞춰주세요 — 자동 인식됩니다</p>
        )}

        {/* 직접 입력 */}
        <div className="w-full max-w-sm space-y-2">
          <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">예약코드 직접 입력</p>
          <div className="flex gap-2">
            <input
              type="text"
              value={manualInput}
              onChange={e => setManualInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleManualSubmit()}
              placeholder="예약 ID 또는 예약코드"
              className="flex-1 bg-white/10 border border-white/20 text-white rounded-2xl px-4 py-3 text-sm font-bold focus:outline-none focus:border-bee-yellow placeholder-gray-600"
              autoComplete="off"
            />
            <button
              onClick={handleManualSubmit}
              disabled={!manualInput.trim()}
              className="px-4 py-3 bg-bee-yellow text-bee-black rounded-2xl font-black text-sm disabled:opacity-40 active:scale-95 transition-all"
            >
              조회
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/90 p-4">
      <div className="w-full max-w-sm bg-white rounded-[32px] overflow-hidden shadow-2xl">
        {/* 헤더 */}
        <div className="bg-bee-black px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-bee-yellow rounded-xl flex items-center justify-center">
              <i className="fa-solid fa-qrcode text-bee-black text-sm"></i>
            </div>
            <div>
              <p className="text-white font-black text-sm">QR 스캔</p>
              <p className="text-gray-400 text-[10px] font-bold">고객 바우처 QR을 카메라에 비추세요</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="w-8 h-8 bg-white/10 rounded-full flex items-center justify-center text-white hover:bg-white/20 transition-all"
          >
            <i className="fa-solid fa-xmark text-xs"></i>
          </button>
        </div>

        <div className="p-5 space-y-4">
          {/* 카메라 뷰 */}
          {(status === 'starting' || status === 'scanning') && (
            <div className="relative w-full aspect-square bg-bee-black rounded-[24px] overflow-hidden">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
              />
              <canvas ref={canvasRef} className="hidden" />

              {/* 스캔 가이드 오버레이 */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="relative w-48 h-48">
                  {/* 코너 브라켓 */}
                  <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-bee-yellow rounded-tl-lg"></div>
                  <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-bee-yellow rounded-tr-lg"></div>
                  <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-bee-yellow rounded-bl-lg"></div>
                  <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-bee-yellow rounded-br-lg"></div>
                  {/* 스캔 라인 */}
                  <div
                    className="absolute left-2 right-2 h-0.5 bg-bee-yellow/70"
                    style={{ top: `${50 + 35 * Math.sin(scanCount * 0.08)}%` }}
                  ></div>
                </div>
              </div>

              {status === 'starting' && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/60">
                  <div className="flex flex-col items-center gap-2 text-white">
                    <div className="w-6 h-6 border-2 border-bee-yellow border-t-transparent rounded-full animate-spin"></div>
                    <span className="text-[11px] font-bold">카메라 시작중...</span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* 수동 입력 모드 */}
          {status === 'manual' && (
            <div className="space-y-3">
              {errorMsg && (
                <div className="bg-amber-50 border border-amber-200 rounded-2xl px-4 py-3 text-xs font-bold text-amber-700 flex items-start gap-2">
                  <i className="fa-solid fa-triangle-exclamation mt-0.5 flex-shrink-0"></i>
                  <span>{errorMsg}</span>
                </div>
              )}
              {!errorMsg && (
                <div className="bg-blue-50 border border-blue-100 rounded-2xl px-4 py-3 text-xs font-bold text-blue-700">
                  이 기기는 카메라 QR 스캔을 지원하지 않아요.<br />예약코드를 직접 입력하세요.
                </div>
              )}
            </div>
          )}

          {/* 직접 입력 — 항상 표시 */}
          <div className="space-y-2">
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">예약코드 직접 입력</p>
            <div className="flex gap-2">
              <input
                type="text"
                value={manualInput}
                onChange={e => setManualInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleManualSubmit()}
                placeholder="예약 ID 또는 예약코드"
                className="flex-1 bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3 text-sm font-bold text-bee-black focus:outline-none focus:border-bee-yellow placeholder-gray-300"
                autoComplete="off"
              />
              <button
                onClick={handleManualSubmit}
                disabled={!manualInput.trim()}
                className="px-4 py-3 bg-bee-yellow text-bee-black rounded-2xl font-black text-sm disabled:opacity-40 active:scale-95 transition-all"
              >
                조회
              </button>
            </div>
          </div>

          {status === 'scanning' && (
            <p className="text-[10px] text-center text-gray-400 font-bold">
              QR코드를 네모 안에 맞춰주세요 — 자동 인식됩니다
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default QRScanModal;
