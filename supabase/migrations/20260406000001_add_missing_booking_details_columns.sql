-- booking_details 누락 컬럼 추가
-- storageService.ts saveBooking()이 INSERT하는 nametag_id, bags, bag_summary가
-- 테이블에 없어 예약확정 시 400 오류 발생하던 버그 수정
ALTER TABLE public.booking_details
  ADD COLUMN IF NOT EXISTS nametag_id   integer,
  ADD COLUMN IF NOT EXISTS bags         integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS bag_summary  text;
