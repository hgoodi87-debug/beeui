-- W-2: booking_details에 insurance_fee 컬럼 추가
-- 보험료를 별도 컬럼으로 저장하여 수익 분석 및 보험사 리포팅 가능하게 함

ALTER TABLE public.booking_details
  ADD COLUMN IF NOT EXISTS insurance_fee integer NOT NULL DEFAULT 0;

COMMENT ON COLUMN public.booking_details.insurance_fee
  IS '보험료 (원). 5000 × insuranceLevel × max(1, totalBags) 계산값';
