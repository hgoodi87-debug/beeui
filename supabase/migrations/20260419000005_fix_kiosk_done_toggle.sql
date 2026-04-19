-- [BUGFIX] 키오스크 완료 체크 해제 복구 불가 수정
-- kiosk_log_anon_update의 USING (done = false)가 done=true 행 UPDATE 자체를 차단.
-- 실수로 완료 처리한 항목을 되돌릴 수 없는 운영 버그.
-- USING(true)로 변경하고 WITH CHECK에서 branch_id 실존 검증은 유지.

DROP POLICY IF EXISTS kiosk_log_anon_update ON kiosk_storage_log;
CREATE POLICY kiosk_log_anon_update ON kiosk_storage_log
    FOR UPDATE TO public
    USING (true)
    WITH CHECK (
        branch_id IS NOT NULL
        AND EXISTS (
            SELECT 1 FROM kiosk_branches kb
            WHERE kb.branch_id = kiosk_storage_log.branch_id
              AND kb.is_active = true
        )
    );
