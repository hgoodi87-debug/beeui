-- ═══════════════════════════════════════════════════════════════════════════
-- Kiosk Security Fix — 2026-04-11
-- 1) kiosk_storage_log에 태그 중복 방지 UNIQUE 제약 추가
-- 2) anon DELETE 정책 제거 (kiosk_log_anon_delete)
-- 3) kiosk_log_anon_update: 완료된 항목 수정 불가 강화
-- ═══════════════════════════════════════════════════════════════════════════

-- 1. 태그 중복 방지: 같은 지점·날짜에 같은 태그 번호 불가
--    (동시 접수 레이스 컨디션 방지)
ALTER TABLE kiosk_storage_log
  ADD CONSTRAINT uq_kiosk_tag_per_day
  UNIQUE (branch_id, date, tag);

-- 2. anon DELETE 제거 — anon key만 있으면 누구나 삭제 가능한 보안 취약점
DROP POLICY IF EXISTS "kiosk_log_anon_delete" ON kiosk_storage_log;

-- 3. UPDATE 정책 강화: done=TRUE인 항목은 anon이 수정 불가
--    (반납 완료된 건 키오스크에서 되돌릴 수 없게)
DROP POLICY IF EXISTS "kiosk_log_anon_update" ON kiosk_storage_log;
CREATE POLICY "kiosk_log_anon_update"
  ON kiosk_storage_log FOR UPDATE
  USING (done = FALSE)
  WITH CHECK (TRUE);
