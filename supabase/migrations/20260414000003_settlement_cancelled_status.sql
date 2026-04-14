-- =============================================
-- Add CANCELLED / REFUNDED to settlement_status CHECK
-- 배경: 20260408000001 마이그레이션에서 취소·환불 예약이
--       'DELETED'로 통합 변환됨 → 정산 분석 시 구분 불가.
-- 이미 적용된 데이터는 복구 불가이나, 이후 취소/환불 건은
-- 별도 상태로 기록할 수 있도록 CHECK 제약을 확장한다.
-- =============================================

-- 1) 기존 CHECK 제약 제거 후 재생성 (값 추가)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'chk_settlement_status'
      AND conrelid = 'public.booking_details'::regclass
  ) THEN
    ALTER TABLE public.booking_details
      DROP CONSTRAINT chk_settlement_status;
  END IF;
END $$;

ALTER TABLE public.booking_details
  ADD CONSTRAINT chk_settlement_status
  CHECK (settlement_status IN (
    'PENDING',
    'CONFIRMED',
    'ON_HOLD',
    'MONTHLY_INCLUDED',
    'PAID_OUT',
    'DELETED',
    'CANCELLED',   -- 취소된 예약 (정산 제외, 취소 이력 구분)
    'REFUNDED'     -- 환불 완료 예약 (정산 제외, 환불 이력 구분)
  ));

COMMENT ON COLUMN public.booking_details.settlement_status IS
  '정산 상태. PENDING/CONFIRMED/ON_HOLD/MONTHLY_INCLUDED/PAID_OUT = 정산 대상. '
  'DELETED = 삭제·운영 제외. CANCELLED = 취소. REFUNDED = 환불. '
  '주의: 2026-04-08 이전 취소·환불 건은 마이그레이션으로 DELETED로 통합됨.';
