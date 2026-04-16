-- ─────────────────────────────────────────────────────────────────────────────
-- Migration: 20260416000001_admin_login_resolver_rpc.sql
-- Purpose:   로그인 전(anon) 상태에서 login_id → email 변환을 위한 RPC 함수
--
-- 문제: comprehensive_rls_fix에서 employees public_read 제거 →
--       adminAuthService의 resolveAdminEmailFromPublicDirectory가 RLS에 막혀
--       unknown-admin-identifier 오류 발생 (닭-달걀 구조)
--
-- 해결: SECURITY DEFINER RPC로 최소한의 정보(email만)만 anon에 노출
-- ─────────────────────────────────────────────────────────────────────────────

-- 기존 함수가 있으면 교체
DROP FUNCTION IF EXISTS public.resolve_admin_login_email(text);

CREATE OR REPLACE FUNCTION public.resolve_admin_login_email(p_identifier text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER           -- RLS를 우회, 내부에서만 안전하게 조회
SET search_path = public
AS $$
DECLARE
  v_identifier_trimmed text;
  v_email              text;
BEGIN
  v_identifier_trimmed := trim(p_identifier);
  IF v_identifier_trimmed = '' OR v_identifier_trimmed IS NULL THEN
    RETURN NULL;
  END IF;

  -- 1순위: login_id 대소문자 무시 매칭
  SELECT e.email
    INTO v_email
    FROM public.employees e
   WHERE lower(e.login_id) = lower(v_identifier_trimmed)
     AND e.employment_status IN ('active', 'probation', 'inactive')  -- 퇴직자 제외
   ORDER BY
     CASE e.employment_status WHEN 'active' THEN 0 WHEN 'probation' THEN 1 ELSE 2 END
   LIMIT 1;

  IF v_email IS NOT NULL AND v_email != '' THEN
    RETURN v_email;
  END IF;

  -- 2순위: name 매칭
  SELECT e.email
    INTO v_email
    FROM public.employees e
   WHERE e.name = v_identifier_trimmed
     AND e.employment_status IN ('active', 'probation', 'inactive')
   ORDER BY
     CASE e.employment_status WHEN 'active' THEN 0 WHEN 'probation' THEN 1 ELSE 2 END
   LIMIT 1;

  IF v_email IS NOT NULL AND v_email != '' THEN
    RETURN v_email;
  END IF;

  -- 3순위: employee_code 대문자 매칭
  SELECT e.email
    INTO v_email
    FROM public.employees e
   WHERE upper(e.employee_code) = upper(v_identifier_trimmed)
     AND e.employment_status IN ('active', 'probation', 'inactive')
   ORDER BY
     CASE e.employment_status WHEN 'active' THEN 0 WHEN 'probation' THEN 1 ELSE 2 END
   LIMIT 1;

  RETURN v_email;
END;
$$;

-- anon 역할에 실행 권한 부여 (로그인 전 호출용)
GRANT EXECUTE ON FUNCTION public.resolve_admin_login_email(text) TO anon;
-- authenticated 역할에도 부여 (일관성)
GRANT EXECUTE ON FUNCTION public.resolve_admin_login_email(text) TO authenticated;

COMMENT ON FUNCTION public.resolve_admin_login_email(text) IS
  '로그인 전(anon) 단계에서 login_id / name / employee_code → email 변환. '
  'SECURITY DEFINER로 RLS 우회. employees 전체 데이터는 노출하지 않고 email만 반환.';
