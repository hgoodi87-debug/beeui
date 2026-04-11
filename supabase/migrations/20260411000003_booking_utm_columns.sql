-- UTM 채널 어트리뷰션 컬럼 추가
-- 예약 시점에 어떤 채널(샤오홍슈, Threads, X 등)에서 왔는지 기록
-- 관련 파일: client/src/utils/gads.ts, client/components/BookingPage.tsx

ALTER TABLE booking_details
  ADD COLUMN IF NOT EXISTS utm_source   TEXT DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS utm_medium   TEXT DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS utm_campaign TEXT DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS utm_content  TEXT DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS utm_term     TEXT DEFAULT NULL;

-- 채널별 예약 수 집계를 빠르게 하기 위한 인덱스
CREATE INDEX IF NOT EXISTS idx_booking_details_utm_source
  ON booking_details (utm_source)
  WHERE utm_source IS NOT NULL;

COMMENT ON COLUMN booking_details.utm_source   IS '유입 채널 (xiaohongshu, threads, twitter, etc.)';
COMMENT ON COLUMN booking_details.utm_medium   IS '매체 유형 (social, cpc, email, etc.)';
COMMENT ON COLUMN booking_details.utm_campaign IS '캠페인명';
COMMENT ON COLUMN booking_details.utm_content  IS '광고 소재 구분';
COMMENT ON COLUMN booking_details.utm_term     IS '키워드 (검색 광고용)';
