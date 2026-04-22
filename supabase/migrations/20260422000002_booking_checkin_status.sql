-- Migration: booking_details.ops_status에 'checked_in' 값 추가
-- 키오스크 현장 접수 시 사용. kiosk-auth Edge Function이 service_role로 설정.
-- ops_status는 text 타입으로 CHECK 제약 없음 — 마이그레이션 없이도 동작하나,
-- 문서화 목적으로 기존 값 목록을 comment로 기록.

-- 기존 ops_status 값: cancelled | completed | pickup_completed | refunded
-- 추가 값: checked_in (키오스크 QR 접수 완료)
-- 변경 없음: text 타입이므로 스키마 변경 불필요. 문서화 전용 마이그레이션.

COMMENT ON COLUMN booking_details.ops_status IS
  'ops 처리 상태: cancelled | completed | pickup_completed | refunded | checked_in';
