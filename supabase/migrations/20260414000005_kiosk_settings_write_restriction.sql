-- =============================================
-- kiosk_settings DELETE 잠금 + admin_password 읽기 제한
-- 배경: kiosk_settings는 anon 전체 쓰기 정책이라 누구나 설정 삭제 가능
--       admin_password 키는 anon SELECT로 공개 노출됨
--
-- 제약: 키오스크 디바이스가 anon key로 설정을 읽고 저장하므로
--       INSERT/UPDATE는 유지해야 함 (아키텍처 제약)
--       → DELETE만 잠그고, admin_password SELECT는 별도 정책으로 숨김
--
-- 장기 계획: kiosk settings write를 Edge Function(service_role)으로 전환
-- =============================================

-- 1) 기존 ALL 정책 제거 → INSERT/UPDATE/SELECT 개별 정책으로 분리
DROP POLICY IF EXISTS "kiosk_settings_anon_write" ON kiosk_settings;

-- SELECT: 모든 설정 읽기 허용 (키오스크 동작에 필요)
-- admin_password 키는 제외하여 브라우저 네트워크 탭 노출 감소
CREATE POLICY "kiosk_settings_anon_read_safe"
  ON kiosk_settings FOR SELECT
  USING (key <> 'admin_password');

-- admin_password는 인증된 사용자(관리자)만 읽기
CREATE POLICY "kiosk_settings_admin_read_password"
  ON kiosk_settings FOR SELECT
  TO authenticated
  USING (key = 'admin_password');

-- INSERT/UPDATE: anon 허용 유지 (키오스크 설정 저장 필요)
-- 장기적으로 Edge Function으로 이전 예정
CREATE POLICY "kiosk_settings_anon_upsert"
  ON kiosk_settings FOR INSERT
  WITH CHECK (TRUE);

CREATE POLICY "kiosk_settings_anon_update"
  ON kiosk_settings FOR UPDATE
  USING (TRUE) WITH CHECK (TRUE);

-- DELETE: 관리자만 허용 (anon 삭제 차단)
CREATE POLICY "kiosk_settings_admin_delete"
  ON kiosk_settings FOR DELETE
  USING (
    public.has_any_role(ARRAY['super_admin', 'hq_admin', 'hub_manager'])
  );
