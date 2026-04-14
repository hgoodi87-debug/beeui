-- locations 테이블에 pickup_image_url 컬럼 추가
-- 픽업 지점 사진 URL (바우처 이메일 + 예약 완료 화면에서 픽업 위치 안내용)
alter table public.locations
  add column if not exists pickup_image_url text;

comment on column public.locations.pickup_image_url is '픽업 지점 사진 URL — 바우처 이메일 및 예약 완료 화면에서 픽업 위치 안내에 사용';
