-- admin_update_booking_details: anon EXECUTE 권한 제거
-- 함수 내부 auth.role() 가드가 anon을 차단하지만,
-- GRANT TO anon 자체가 공격 면을 넓힘.
-- anon은 이 함수를 호출할 이유가 없으므로 권한 제거.
REVOKE EXECUTE ON FUNCTION public.admin_update_booking_details(uuid, jsonb) FROM anon;
