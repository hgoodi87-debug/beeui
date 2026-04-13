-- ═══════════════════════════════════════════════════════════════════════════
-- 종합 RLS 보안 수정 — 2026-04-12
-- RLS 감사 결과 발견된 전체 취약 정책 일괄 수정
--
-- CRITICAL:
--   #A: booking_details — 기존 공개 정책(p_booking_details_r/u) 잔존 확인 후 삭제
--   #B: app_settings — 누구나 앱 설정 ALL 접근 → 관리자 전용
--   #C: discount_codes — 누구나 할인코드 생성/수정 → 관리자 전용
--   #D: employees — 전 직원 email/phone/security 공개 → 관리자만
--   #E: user_coupons — 타인 쿠폰 전체 조회 → 본인만
--
-- HIGH (공개 쓰기):
--   #F: locations, cms_*, daily_closings, delivery_assignments,
--       expenditures, google_reviews, system_notices → 관리자 전용 쓰기
--   #G: chat_sessions/messages (user_email 포함) → 세션 소유자+관리자
--   #H: branch_prospects — SELECT 관리자만, INSERT 공개 유지
--
-- MEDIUM (정책 없는 테이블):
--   #I: reservation_items, storage_assets — 소유자+관리자 정책 추가
--   #J: beeliber — 레거시 빈 테이블, 관리자 전용
-- ═══════════════════════════════════════════════════════════════════════════

-- ─── #A: booking_details 잔존 공개 정책 제거 ──────────────────────────────
-- (오늘 마이그레이션에서 잘못된 이름을 삭제 — 실제 위험 정책 p_booking_details_r/u 잔존)
DROP POLICY IF EXISTS "p_booking_details_r" ON public.booking_details;
DROP POLICY IF EXISTS "p_booking_details_u" ON public.booking_details;

-- ─── #B: app_settings — ALL 공개 → 관리자 전용 ────────────────────────────
DROP POLICY IF EXISTS "p_app_settings_w" ON public.app_settings;
CREATE POLICY "admin_write_app_settings"
  ON public.app_settings FOR ALL
  USING (public.has_any_role(ARRAY['super_admin','hq_admin']))
  WITH CHECK (public.has_any_role(ARRAY['super_admin','hq_admin']));

-- ─── #C: discount_codes — ALL 공개 → 관리자 전용 ──────────────────────────
DROP POLICY IF EXISTS "p_discount_codes_w" ON public.discount_codes;
CREATE POLICY "admin_write_discount_codes"
  ON public.discount_codes FOR ALL
  USING (public.has_any_role(ARRAY['super_admin','hq_admin','finance_staff']))
  WITH CHECK (public.has_any_role(ARRAY['super_admin','hq_admin','finance_staff']));

-- ─── #D: employees — 전 직원 PII 공개 → 관리자 전용 ──────────────────────
DROP POLICY IF EXISTS "public_read_employees" ON public.employees;
CREATE POLICY "admin_read_employees"
  ON public.employees FOR SELECT
  USING (
    profile_id = auth.uid()
    OR public.has_any_role(ARRAY[
      'super_admin','hq_admin','hub_manager','finance_staff','ops_staff','cs_staff'
    ])
  );

-- ─── #E: user_coupons — 타인 쿠폰 조회 가능 → 본인만 ──────────────────────
DROP POLICY IF EXISTS "p_user_coupons_r" ON public.user_coupons;
CREATE POLICY "owner_read_user_coupons"
  ON public.user_coupons FOR SELECT
  USING (
    user_id = auth.uid()
    OR public.has_any_role(ARRAY['super_admin','hq_admin','finance_staff','cs_staff'])
  );

-- ─── #F: 공개 쓰기 테이블들 → 관리자 전용 ───────────────────────────────

-- locations
DROP POLICY IF EXISTS "p_locations_w" ON public.locations;
CREATE POLICY "admin_write_locations"
  ON public.locations FOR ALL
  USING (public.has_any_role(ARRAY['super_admin','hq_admin','hub_manager']))
  WITH CHECK (public.has_any_role(ARRAY['super_admin','hq_admin','hub_manager']));

-- cms_areas
DROP POLICY IF EXISTS "p_cms_areas_w" ON public.cms_areas;
CREATE POLICY "admin_write_cms_areas"
  ON public.cms_areas FOR ALL
  USING (public.has_any_role(ARRAY['super_admin','hq_admin']))
  WITH CHECK (public.has_any_role(ARRAY['super_admin','hq_admin']));

-- cms_contents
DROP POLICY IF EXISTS "p_cms_contents_w" ON public.cms_contents;
CREATE POLICY "admin_write_cms_contents"
  ON public.cms_contents FOR ALL
  USING (public.has_any_role(ARRAY['super_admin','hq_admin']))
  WITH CHECK (public.has_any_role(ARRAY['super_admin','hq_admin']));

-- cms_themes
DROP POLICY IF EXISTS "p_cms_themes_w" ON public.cms_themes;
CREATE POLICY "admin_write_cms_themes"
  ON public.cms_themes FOR ALL
  USING (public.has_any_role(ARRAY['super_admin','hq_admin']))
  WITH CHECK (public.has_any_role(ARRAY['super_admin','hq_admin']));

-- daily_closings
DROP POLICY IF EXISTS "p_daily_closings" ON public.daily_closings;
CREATE POLICY "staff_all_daily_closings"
  ON public.daily_closings FOR ALL
  USING (public.has_any_role(ARRAY['super_admin','hq_admin','hub_manager','finance_staff','ops_staff']))
  WITH CHECK (public.has_any_role(ARRAY['super_admin','hq_admin','hub_manager','finance_staff','ops_staff']));

-- delivery_assignments
DROP POLICY IF EXISTS "p_delivery_assign" ON public.delivery_assignments;
CREATE POLICY "staff_all_delivery_assignments"
  ON public.delivery_assignments FOR ALL
  USING (public.has_any_role(ARRAY['super_admin','hq_admin','hub_manager','ops_staff']))
  WITH CHECK (public.has_any_role(ARRAY['super_admin','hq_admin','hub_manager','ops_staff']));

-- expenditures
DROP POLICY IF EXISTS "p_expenditures" ON public.expenditures;
CREATE POLICY "finance_all_expenditures"
  ON public.expenditures FOR ALL
  USING (public.has_any_role(ARRAY['super_admin','hq_admin','finance_staff']))
  WITH CHECK (public.has_any_role(ARRAY['super_admin','hq_admin','finance_staff']));

-- google_reviews (Edge Function service_role만 쓰기 — RLS 우회)
DROP POLICY IF EXISTS "p_google_reviews_w" ON public.google_reviews;

-- google_review_summary (동일)
DROP POLICY IF EXISTS "p_review_summary_w" ON public.google_review_summary;

-- system_notices
DROP POLICY IF EXISTS "p_system_notices_w" ON public.system_notices;
CREATE POLICY "admin_write_system_notices"
  ON public.system_notices FOR ALL
  USING (public.has_any_role(ARRAY['super_admin','hq_admin']))
  WITH CHECK (public.has_any_role(ARRAY['super_admin','hq_admin']));

-- ─── #G: chat_sessions / chat_messages ────────────────────────────────────
-- session_id(text) 기반이므로 auth.uid 대신 이메일 비교
-- 미인증 채팅 지원하려면 서비스가 service_role 키로 삽입 → 정책 없이도 삽입 가능

DROP POLICY IF EXISTS "p_chat_sessions" ON public.chat_sessions;
CREATE POLICY "owner_or_staff_chat_sessions"
  ON public.chat_sessions FOR SELECT
  USING (
    user_email = (SELECT email FROM public.profiles WHERE id = auth.uid())
    OR public.has_any_role(ARRAY['super_admin','hq_admin','cs_staff','ops_staff'])
  );
CREATE POLICY "staff_write_chat_sessions"
  ON public.chat_sessions FOR ALL
  USING (public.has_any_role(ARRAY['super_admin','hq_admin','cs_staff']))
  WITH CHECK (public.has_any_role(ARRAY['super_admin','hq_admin','cs_staff']));

DROP POLICY IF EXISTS "p_chat_messages" ON public.chat_messages;
CREATE POLICY "owner_or_staff_chat_messages"
  ON public.chat_messages FOR SELECT
  USING (
    user_email = (SELECT email FROM public.profiles WHERE id = auth.uid())
    OR public.has_any_role(ARRAY['super_admin','hq_admin','cs_staff','ops_staff'])
  );
CREATE POLICY "staff_write_chat_messages"
  ON public.chat_messages FOR ALL
  USING (public.has_any_role(ARRAY['super_admin','hq_admin','cs_staff']))
  WITH CHECK (public.has_any_role(ARRAY['super_admin','hq_admin','cs_staff']));

-- ─── #H: branch_prospects — 공개 INSERT 유지, SELECT 관리자만 ────────────
DROP POLICY IF EXISTS "p_branch_prospects" ON public.branch_prospects;

CREATE POLICY "public_insert_branch_prospects"
  ON public.branch_prospects FOR INSERT
  WITH CHECK (true);  -- 제휴 문의 접수는 누구나

CREATE POLICY "admin_read_branch_prospects"
  ON public.branch_prospects FOR SELECT
  USING (public.has_any_role(ARRAY['super_admin','hq_admin']));

CREATE POLICY "admin_update_branch_prospects"
  ON public.branch_prospects FOR UPDATE
  USING (public.has_any_role(ARRAY['super_admin','hq_admin']))
  WITH CHECK (public.has_any_role(ARRAY['super_admin','hq_admin']));

-- ─── #I: reservation_items — 정책 없음 → 소유자+관리자 ───────────────────
CREATE POLICY "owner_or_staff_reservation_items"
  ON public.reservation_items FOR SELECT
  USING (
    reservation_id IN (
      SELECT id FROM public.reservations WHERE customer_id = auth.uid()
    )
    OR public.has_any_role(ARRAY[
      'super_admin','hq_admin','hub_manager','ops_staff','cs_staff','finance_staff'
    ])
  );

CREATE POLICY "service_insert_reservation_items"
  ON public.reservation_items FOR INSERT
  WITH CHECK (false);  -- service_role만 삽입 (Edge Fn, RLS 우회)

-- storage_assets — 정책 없음 → 업로더+관리자
CREATE POLICY "owner_or_staff_read_storage_assets"
  ON public.storage_assets FOR SELECT
  USING (
    uploaded_by_user_id = auth.uid()
    OR public.has_any_role(ARRAY['super_admin','hq_admin','hub_manager','ops_staff'])
  );

CREATE POLICY "owner_insert_storage_assets"
  ON public.storage_assets FOR INSERT
  WITH CHECK (uploaded_by_user_id = auth.uid());

CREATE POLICY "staff_update_storage_assets"
  ON public.storage_assets FOR UPDATE
  USING (public.has_any_role(ARRAY['super_admin','hq_admin','hub_manager','ops_staff']))
  WITH CHECK (public.has_any_role(ARRAY['super_admin','hq_admin','hub_manager','ops_staff']));

-- ─── #J: beeliber — 레거시 빈 테이블, 관리자만 ───────────────────────────
CREATE POLICY "admin_read_beeliber"
  ON public.beeliber FOR SELECT
  USING (public.has_any_role(ARRAY['super_admin','hq_admin']));
