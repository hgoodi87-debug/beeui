---
name: db_audit_operations
description: "DB 검수 서브에이전트 — OPERATIONS & FINANCE 섹션. locations, location_translations, daily_closings, expenditures, service_rules, storage_tiers, audit_logs 테이블 검증."
---

# DB 검수: OPERATIONS & FINANCE

## 담당 테이블
- `locations` (54 cols) — 거점 마스터 ★
- `location_translations` — 거점 다국어 번역
- `daily_closings` (18 cols) — 일일 마감
- `expenditures` — 지출 내역
- `service_rules` — 서비스별 허용 규칙
- `storage_tiers` — 보관 요금 등급
- `audit_logs` / `audit_logs_archive` — 감사 로그

## 검수 체크리스트

### 1. 스키마 무결성
- [ ] locations.short_code UNIQUE 확인
- [ ] locations.branch_id → branches FK 확인
- [ ] locations.type CHECK 제약 (AIRPORT/HOTEL/STATION/PARTNER/...)
- [ ] daily_closings.branch_id → branches FK 확인
- [ ] daily_closings.date NOT NULL 확인
- [ ] expenditures.branch_id → branches FK 확인
- [ ] service_rules: branch_id OR branch_type_id 중 하나는 NOT NULL인 CHECK 제약
- [ ] storage_tiers.tier_code UNIQUE 확인
- [ ] location_translations.location_id → locations FK 확인

### 2. RLS 정책 검증
- [ ] locations: public_read (모든 사용자 읽기 가능)
- [ ] locations: employee_write는 super_admin/hq_admin/ops_manager만
- [ ] daily_closings: employee_all은 재무/운영 역할만
- [ ] expenditures: employee_all은 재무/운영 역할만
- [ ] audit_logs: super_admin/hq_admin/ops_manager만

### 3. 데이터 정합성 — locations
- [ ] is_active=true인 거점에 name이 있는지
- [ ] lat/lng 값이 유효 범위(한국: lat 33~39, lng 124~132)인지
- [ ] supports_delivery=true인 거점에 address가 있는지
- [ ] branch_code가 branches.branch_code에 매핑되는지
- [ ] commission_rate_delivery / commission_rate_storage가 0~100 범위인지
- [ ] 다국어 필드(name_zh_tw 등)가 주요 거점에 비어있지 않은지

### 4. 데이터 정합성 — 재무
- [ ] daily_closings에서 total_revenue = cash + card + apple + ... 합산 확인
- [ ] daily_closings.difference = total_revenue - actual_cash_on_hand 확인
- [ ] expenditures.amount > 0 확인
- [ ] 같은 branch_id + date에 중복 daily_closings가 없는지

### 5. 뷰 검증
- [ ] v_branch_daily_summary 정상 조회 가능
- [ ] v_branch_settlement_candidates 정상 조회 가능
- [ ] v_branch_settlement_monthly 정상 조회 가능
- [ ] v_branch_settlement_summary 정상 조회 가능

## 검수 SQL 예시

```sql
-- 거점 좌표 이상값
SELECT id, name, lat, lng FROM locations
WHERE is_active = true AND (lat < 33 OR lat > 39 OR lng < 124 OR lng > 132);

-- 수수료율 범위 이상
SELECT id, name, commission_rate_delivery, commission_rate_storage
FROM locations WHERE commission_rate_delivery > 100 OR commission_rate_storage > 100;

-- daily_closings 합산 불일치
SELECT id, date, total_revenue,
  coalesce(cash_revenue,0)+coalesce(card_revenue,0)+coalesce(apple_revenue,0)+
  coalesce(samsung_revenue,0)+coalesce(wechat_revenue,0)+coalesce(alipay_revenue,0)+
  coalesce(naver_revenue,0)+coalesce(kakao_revenue,0)+coalesce(paypal_revenue,0) as calc_total
FROM daily_closings
WHERE total_revenue != coalesce(cash_revenue,0)+coalesce(card_revenue,0)+coalesce(apple_revenue,0)+
  coalesce(samsung_revenue,0)+coalesce(wechat_revenue,0)+coalesce(alipay_revenue,0)+
  coalesce(naver_revenue,0)+coalesce(kakao_revenue,0)+coalesce(paypal_revenue,0);

-- 중복 일일 마감
SELECT branch_id, date, count(*)
FROM daily_closings GROUP BY branch_id, date HAVING count(*) > 1;
```

## 연관 스킬
- `beeliber_operations` — 상태머신·SLA·기사배정·이슈
- `beeliber_pricing` — 가격 정책 + 계산 로직
- `beeliber_eval` — KPI·실패분석·성과측정
