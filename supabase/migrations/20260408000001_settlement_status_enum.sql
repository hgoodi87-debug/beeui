-- W-1: settlement_status 값 정규화 + CHECK 제약
-- 기존 소문자 'deleted' → 'DELETED' 통일
-- NULL → 'PENDING' 초기화
-- CHECK 제약으로 허용값 고정

-- 1) NULL → PENDING
UPDATE public.booking_details
SET settlement_status = 'PENDING'
WHERE settlement_status IS NULL;

-- 2) 'deleted' → 'DELETED' (대소문자 통일)
UPDATE public.booking_details
SET settlement_status = 'DELETED'
WHERE lower(settlement_status) = 'deleted';

-- 3) CHECK 제약 추가 (이미 존재하면 스킵)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'chk_settlement_status'
      AND conrelid = 'public.booking_details'::regclass
  ) THEN
    ALTER TABLE public.booking_details
      ADD CONSTRAINT chk_settlement_status
      CHECK (settlement_status IN (
        'PENDING',
        'CONFIRMED',
        'ON_HOLD',
        'MONTHLY_INCLUDED',
        'PAID_OUT',
        'DELETED'
      ));
  END IF;
END $$;

-- 4) DEFAULT 설정
ALTER TABLE public.booking_details
  ALTER COLUMN settlement_status SET DEFAULT 'PENDING';
