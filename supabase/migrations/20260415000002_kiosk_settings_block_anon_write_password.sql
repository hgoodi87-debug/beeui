-- =============================================
-- kiosk_settings: anon 키가 admin_password 키에 쓰기 불가하도록 차단
-- 배경: 20260414000005 에서 INSERT/UPDATE 정책의 WITH CHECK 가 TRUE 로
--       설정돼 있어 anon 키를 가진 누구나 admin_password 를 덮어쓸 수 있음.
--       PIN 검증은 kiosk-auth Edge Function(service_role)으로 이전하므로
--       anon 의 admin_password 직접 쓰기는 완전히 차단함.
-- =============================================

-- 기존 INSERT/UPDATE 정책 교체
DROP POLICY IF EXISTS "kiosk_settings_anon_upsert" ON kiosk_settings;
DROP POLICY IF EXISTS "kiosk_settings_anon_update" ON kiosk_settings;

-- INSERT: admin_password 키 삽입 불가
CREATE POLICY "kiosk_settings_anon_upsert"
  ON kiosk_settings FOR INSERT
  WITH CHECK (key <> 'admin_password');

-- UPDATE: admin_password 키 수정 불가
CREATE POLICY "kiosk_settings_anon_update"
  ON kiosk_settings FOR UPDATE
  USING (key <> 'admin_password')
  WITH CHECK (key <> 'admin_password');
