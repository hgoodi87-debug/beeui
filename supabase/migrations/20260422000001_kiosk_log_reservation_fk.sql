-- Migration: kiosk_storage_log에 reservation_id FK 추가
-- 목적: 키오스크 예약 접수 시 booking_details와 FK로 연결
-- 이전: memo 텍스트에만 예약번호 저장 (연동 없음)
-- 이후: reservation_id uuid → booking_details.id (nullable)

ALTER TABLE kiosk_storage_log
  ADD COLUMN IF NOT EXISTS reservation_id uuid
    REFERENCES booking_details(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_kiosk_log_reservation_id
  ON kiosk_storage_log (reservation_id)
  WHERE reservation_id IS NOT NULL;
