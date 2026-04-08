-- W-1: settlement_status 값 정규화 + CHECK 제약
-- 기존 한국어·소문자 상태값 → 대문자 영문 통일
-- NULL → 'PENDING' 초기화
-- CHECK 제약으로 허용값 고정

-- 1) NULL → PENDING
UPDATE public.booking_details
SET settlement_status = 'PENDING'
WHERE settlement_status IS NULL;

-- 2) 레거시 한국어/소문자 값 → 대문자 영문 통일
UPDATE public.booking_details SET settlement_status = 'DELETED'
  WHERE lower(settlement_status) IN ('deleted', '삭제됨');

UPDATE public.booking_details SET settlement_status = 'PENDING'
  WHERE lower(settlement_status) IN ('pending', '접수완료', '대기', '미정산');

UPDATE public.booking_details SET settlement_status = 'CONFIRMED'
  WHERE lower(settlement_status) IN ('confirmed', '정산확정', '완료');

UPDATE public.booking_details SET settlement_status = 'PAID_OUT'
  WHERE lower(settlement_status) IN ('paid_out', '지급완료');

UPDATE public.booking_details SET settlement_status = 'ON_HOLD'
  WHERE lower(settlement_status) IN ('on_hold', '보류');

UPDATE public.booking_details SET settlement_status = 'MONTHLY_INCLUDED'
  WHERE lower(settlement_status) IN ('monthly_included', '월정산포함');

-- 3) 취소/환불 상태 → DELETED (정산 대상 외)
UPDATE public.booking_details SET settlement_status = 'DELETED'
  WHERE settlement_status IN ('취소됨', '환불완료', 'cancelled', 'refunded');

-- 4) 그 외 알 수 없는 값 → PENDING으로 fallback
UPDATE public.booking_details SET settlement_status = 'PENDING'
  WHERE settlement_status NOT IN (
    'PENDING','CONFIRMED','ON_HOLD','MONTHLY_INCLUDED','PAID_OUT','DELETED'
  );

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
