-- [DB-02] 키오스크 RLS 취약점 수정

-- 1. CRITICAL: kiosk_settings_anon_read(qual=true)가 anon_read_safe를 무효화
--    permissive 정책 OR 결합으로 admin_password 노출 → 덮어쓰는 정책 제거
DROP POLICY IF EXISTS kiosk_settings_anon_read ON kiosk_settings;

-- 2. kiosk_log anon INSERT: with_check=true로 branch_id 위조 가능
--    branch_id가 실제 kiosk_branches에 존재하는 값인지 검증
DROP POLICY IF EXISTS kiosk_log_anon_insert ON kiosk_storage_log;
CREATE POLICY kiosk_log_anon_insert ON kiosk_storage_log
    FOR INSERT TO public
    WITH CHECK (
        branch_id IS NOT NULL
        AND EXISTS (
            SELECT 1 FROM kiosk_branches kb
            WHERE kb.branch_id = kiosk_storage_log.branch_id
              AND kb.is_active = true
        )
    );

-- 3. kiosk_log anon UPDATE: with_check=true로 branch_id 변경 가능
--    수정 시에도 branch_id가 kiosk_branches에 등록된 값이어야 함
DROP POLICY IF EXISTS kiosk_log_anon_update ON kiosk_storage_log;
CREATE POLICY kiosk_log_anon_update ON kiosk_storage_log
    FOR UPDATE TO public
    USING (done = false)
    WITH CHECK (
        branch_id IS NOT NULL
        AND EXISTS (
            SELECT 1 FROM kiosk_branches kb
            WHERE kb.branch_id = kiosk_storage_log.branch_id
              AND kb.is_active = true
        )
    );
