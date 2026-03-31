---
name: db_audit_promotion
description: "DB 검수 서브에이전트 — PROMOTION & PARTNERSHIPS 섹션. discount_codes, user_coupons, partnership_inquiries, branch_prospects, app_settings 테이블 검증."
---

# DB 검수: PROMOTION & PARTNERSHIPS

## 담당 테이블
- `discount_codes` — 할인 코드
- `user_coupons` — 고객별 쿠폰
- `partnership_inquiries` — 파트너 제휴 문의
- `branch_prospects` — 지점 후보
- `app_settings` — 앱 설정 (key-value)

## 검수 체크리스트

### 1. 스키마 무결성
- [ ] discount_codes.code UNIQUE NOT NULL 확인
- [ ] discount_codes.allowed_service CHECK 제약 (DELIVERY/STORAGE/ALL)
- [ ] user_coupons.discount_code_id → discount_codes FK 확인
- [ ] partnership_inquiries.status CHECK 제약 (NEW/CONTACTED/NEGOTIATING/CONVERTED/REJECTED)
- [ ] branch_prospects.partnership_inquiry_id → partnership_inquiries FK 확인
- [ ] branch_prospects.status CHECK 제약 (PROSPECTING/NEGOTIATING/READY/ACTIVE/ON_HOLD)
- [ ] app_settings.key UNIQUE NOT NULL 확인

### 2. RLS 정책 검증
- [ ] discount_codes: public_read (할인 코드 조회 가능)
- [ ] discount_codes: 쓰기는 super_admin/hq_admin/marketing_staff만
- [ ] user_coupons: public_read + public INSERT (쿠폰 발급)
- [ ] partnership_inquiries: public INSERT (외부 문의 가능) + admin SELECT
- [ ] app_settings: public_read + HQ만 쓰기

### 3. 데이터 정합성
- [ ] discount_codes에서 is_active=true인 코드가 중복되지 않는지
- [ ] user_coupons에서 is_used=true인데 used_at이 NULL인 경우
- [ ] user_coupons에서 expiry_date가 지난 미사용 쿠폰 확인
- [ ] user_coupons.discount_code_id가 discount_codes에 존재하는지
- [ ] branch_prospects에서 partnership_inquiry_id가 존재하는지 (NULL 허용)
- [ ] app_settings에서 필수 키(delivery_prices, storage_tiers 등)가 존재하는지

## 검수 SQL 예시

```sql
-- 사용됐는데 used_at 없는 쿠폰
SELECT id, code, is_used, used_at
FROM user_coupons WHERE is_used = true AND used_at IS NULL;

-- orphan user_coupons
SELECT uc.id FROM user_coupons uc
LEFT JOIN discount_codes dc ON uc.discount_code_id = dc.id
WHERE dc.id IS NULL AND uc.discount_code_id IS NOT NULL;

-- 만료된 미사용 쿠폰 수
SELECT count(*) as expired_unused
FROM user_coupons
WHERE is_used = false AND expiry_date < now();

-- 필수 app_settings 키 존재 확인
SELECT key FROM (
  VALUES ('delivery_prices'), ('storage_tiers'), ('insurance_config')
) AS required(key)
WHERE key NOT IN (SELECT key FROM app_settings);

-- partnership_inquiries 상태별 집계
SELECT status, count(*) FROM partnership_inquiries GROUP BY status ORDER BY count(*) DESC;
```

## 연관 스킬
- `beeliber_pricing` — 가격 정책 + 계산 로직
- `beeliber_master` — 브랜드 가격표, 서비스 구조
- `beeliber_eval` — KPI·성과측정
