/**
 * KioskQRScanner — 전방 카메라 QR 스캐너
 * jsQR로 비디오 프레임을 실시간 분석해 예약 QR 바우처를 인식합니다.
 */
import React, { useEffect, useRef, useState, useCallback } from 'react';
import jsQR from 'jsqr';

interface KioskQRScannerProps {
  onDetected: (code: string) => void;
  onClose: () => void;
  labelScanning?: string;
  labelError?: string;
  labelRetry?: string;
  labelClose?: string;
  labelHint?: string;
}

const KioskQRScanner: React.FC<KioskQRScannerProps> = ({
  onDetected,
  onClose,
  labelScanning = 'QR 코드를 화면에 맞춰주세요',
  labelError = '카메라를 사용할 수 없습니다.',
  labelRetry = '다시 시도',
  labelClose = '닫기',
  labelHint = '고객의 예약 QR 바우처를 카메라에 비춰주세요',
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const detectedRef = useRef(false);

  const [camError, setCamError] = useState<string | null>(null);
  const [detected, setDetected] = useState(false);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');

  // 카메라 중지
  const stopCamera = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  }, []);

  // 프레임마다 QR 분석
  const tick = useCallback(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || video.readyState !== video.HAVE_ENOUGH_DATA) {
      rafRef.current = requestAnimationFrame(tick);
      return;
    }
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) { rafRef.current = requestAnimationFrame(tick); return; }

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const result = jsQR(imageData.data, imageData.width, imageData.height, {
      inversionAttempts: 'attemptBoth',
    });

    if (result?.data && !detectedRef.current) {
      detectedRef.current = true;
      setDetected(true);
      stopCamera();
      // 짧은 피드백 후 콜백 호출
      setTimeout(() => onDetected(result.data), 300);
      return;
    }

    rafRef.current = requestAnimationFrame(tick);
  }, [onDetected, stopCamera]);

  // 카메라 시작 (facingMode에 따라 전방/후방 선택)
  const startCamera = useCallback(async (mode: 'user' | 'environment') => {
    stopCamera();
    setCamError(null);
    detectedRef.current = false;
    setDetected(false);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: mode, width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play().catch((e) => { if (e.name !== 'AbortError') console.warn('[QR] play error:', e); });
      }
      rafRef.current = requestAnimationFrame(tick);
    } catch {
      // 요청 카메라 실패 시 제약 없이 재시도
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play().catch((e) => { if (e.name !== 'AbortError') console.warn('[QR] play error:', e); });
        }
        rafRef.current = requestAnimationFrame(tick);
      } catch {
        setCamError(labelError);
      }
    }
  }, [tick, stopCamera, labelError]);

  // facingMode 변경 시 카메라 재시작
  useEffect(() => {
    startCamera(facingMode);
    return () => stopCamera();
  }, [facingMode]); // eslint-disable-line react-hooks/exhaustive-deps

  const toggleCamera = useCallback(() => {
    setFacingMode((prev) => (prev === 'user' ? 'environment' : 'user'));
  }, []);

  return (
    <div className="fixed inset-0 z-[200] bg-black flex flex-col items-center justify-center">
      {/* 헤더 */}
      <div className="absolute top-0 inset-x-0 flex items-center justify-between px-5 py-4 z-10">
        <button
          onClick={() => { stopCamera(); onClose(); }}
          className="flex items-center gap-2 text-white/60 hover:text-white transition-colors"
        >
          <i className="fa-solid fa-chevron-left" />
          <span className="text-sm font-bold">{labelClose}</span>
        </button>
        <span className="text-white/40 text-xs font-bold tracking-widest uppercase">QR SCAN</span>
        {/* 카메라 전환 버튼 */}
        <button
          onClick={toggleCamera}
          className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white/60 hover:text-white hover:bg-white/20 transition-all active:scale-90"
          title={facingMode === 'user' ? '후방 카메라로 전환' : '전방 카메라로 전환'}
        >
          <i className="fa-solid fa-camera-rotate text-base" />
        </button>
      </div>

      {camError ? (
        /* 카메라 오류 */
        <div className="flex flex-col items-center gap-5 px-8 text-center">
          <div className="w-20 h-20 rounded-full bg-white/10 flex items-center justify-center">
            <i className="fa-solid fa-camera-slash text-white/40 text-3xl" />
          </div>
          <p className="text-white font-bold text-base">{camError}</p>
          <button
            onClick={() => startCamera(facingMode)}
            className="px-6 py-3 bg-[#F5C842] text-[#111111] font-black rounded-full text-sm"
          >
            {labelRetry}
          </button>
        </div>
      ) : (
        <>
          {/* 비디오 + 뷰파인더 */}
          <div className="relative w-full max-w-sm aspect-square mx-auto">
            <video
              ref={videoRef}
              className="absolute inset-0 w-full h-full object-cover rounded-2xl"
              playsInline
              muted
            />
            <canvas ref={canvasRef} className="hidden" />

            {/* 스캔 프레임 오버레이 */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              {/* 모서리 마커 */}
              {['top-0 left-0', 'top-0 right-0 rotate-90', 'bottom-0 right-0 rotate-180', 'bottom-0 left-0 -rotate-90'].map((pos, i) => (
                <div key={i} className={`absolute ${pos} w-10 h-10`}>
                  <div className={`absolute top-0 left-0 w-full h-1 ${detected ? 'bg-green-400' : 'bg-[#F5C842]'} rounded-full transition-colors`} />
                  <div className={`absolute top-0 left-0 h-full w-1 ${detected ? 'bg-green-400' : 'bg-[#F5C842]'} rounded-full transition-colors`} />
                </div>
              ))}
              {/* 스캔 라인 애니메이션 */}
              {!detected && (
                <div className="absolute inset-x-4 h-0.5 bg-gradient-to-r from-transparent via-[#F5C842] to-transparent animate-scan-line" />
              )}
              {/* 인식 완료 */}
              {detected && (
                <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center animate-scale-in shadow-2xl">
                  <i className="fa-solid fa-check text-white text-2xl" />
                </div>
              )}
            </div>
          </div>

          {/* 안내 텍스트 */}
          <div className="mt-8 text-center px-8">
            <p className="text-white font-black text-lg">{labelScanning}</p>
            <p className="text-white/40 text-sm mt-2 leading-relaxed">{labelHint}</p>
          </div>
        </>
      )}

      <style>{`
        @keyframes scan-line {
          0%   { transform: translateY(-60px); opacity: 0; }
          10%  { opacity: 1; }
          90%  { opacity: 1; }
          100% { transform: translateY(60px); opacity: 0; }
        }
        .animate-scan-line { animation: scan-line 1.8s ease-in-out infinite; }
        @keyframes scale-in {
          from { transform: scale(0.5); opacity: 0; }
          to   { transform: scale(1); opacity: 1; }
        }
        .animate-scale-in { animation: scale-in 0.25s ease-out forwards; }
      `}</style>
    </div>
  );
};

export default KioskQRScanner;
