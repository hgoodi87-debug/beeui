-- booking_details에 admin_note 컬럼 추가
-- 관리자가 예약 상세에서 입력하는 메모/특이사항 저장용
ALTER TABLE public.booking_details
  ADD COLUMN IF NOT EXISTS admin_note text;
