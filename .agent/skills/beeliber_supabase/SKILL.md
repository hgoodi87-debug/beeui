---
name: beeliber_supabase
description: Firebase→Supabase 전환 마스터 플랜, 스키마 설계 원칙, RLS 권한 구조. Supabase 관련 작업 시 필수 참조.
---

# 🗄️ Beeliber Supabase 마이그레이션 마스터

상세 원문: `docs/SUPABASE_MIGRATION_MASTER_PLAN.md`

## 📍 현재 상태

- **현재 Phase**: Phase 0 (Firebase 구조 전수조사 단계)
- **전환 방식**: 병행 검증 + 단계적 절체
- **운영 원칙**: Firebase를 즉시 끊지 않고 Supabase를 검증 후 전환

## 🗺️ Phase 로드맵

| Phase | 목표 | 핵심 작업 |
|---|---|---|
| **Phase 0** | 진단·동결 | Firebase 컬렉션 맵, 로그인 흐름도, 쿼리 목록 |
| **Phase 1** | Supabase 기초 환경 | 프로젝트 생성, RLS 초안, SSL/네트워크 설정 |
| **Phase 2** | 인증·직원·권한 이전 | ⭐ 최우선 — 관리자 로그인 불안정 문제 해결 |
| **Phase 3** | 운영 데이터 이전 | branches → employees → customers → bookings 순 |
| **Phase 4** | Storage 이전 | 5개 버킷 구조로 이관 |
| **Phase 5** | 병행 운영·컷오버 | 양쪽 결과 비교 검증 |
| **Phase 6** | Firebase 쓰기 중단 | 최종 delta backfill + 48~72시간 모니터링 |

## 🏗️ 목표 데이터 모델

**핵심 원칙**: `직원 1명 = auth 계정 1개 = 프로필 1개`

```
인증/조직: auth.users, profiles, employees, roles, employee_roles,
           branches, employee_branch_assignments
고객/예약: customers, bookings, booking_items, baggage_items,
           price_quotes, insurance_records
배송/운영: delivery_jobs, job_stops, job_events, tracking_points,
           proof_of_pickup, proof_of_dropoff
정산/리포트: daily_settlements, monthly_settlements, partner_commissions,
            payouts, audit_logs
```

## 🔒 RLS 최소 역할

```
super_admin → hq_admin → hub_manager / partner_manager
→ finance_staff / ops_staff / driver / cs_staff
```

**핵심 정책**:
- 본인 소속 지점 데이터만 조회
- HQ만 전 지점 조회
- 정산 테이블은 HQ/재무만 조회
- **삭제 금지 — 상태 전환만 허용** (merge/inactive/suspended/resigned)
- 프론트 조건 분기만으로 권한 제어 금지 — DB RLS가 최종 방어선

## 🪣 Storage 버킷 구조

- `brand-public` — 공개 브랜드 에셋
- `branch-public` — 지점 공개 정보
- `ops-private` — 운영 증빙 사진
- `customer-private` — 고객 파일
- `backoffice-private` — 정산 첨부

## ⚠️ 4대 핵심 리스크

1. Firestore 중첩 구조를 그대로 가져오려는 것 → **반드시 정규화**
2. 로그인만 옮기고 직원 마스터를 안 고치는 것 → 관리자 화면 다시 깨짐
3. RLS를 뒤늦게 붙이는 것 → 나중에 전체 쿼리 재작성 필요
4. 현재 정리/삭제 로직을 그대로 복사하는 것 → 문제를 그대로 옮김

## 🔗 관련 문서

- `docs/SUPABASE_SCHEMA_DRAFT.md`
- `docs/ADMIN_QUERY_MAP.md`
- `docs/FIREBASE_SUPABASE_OPERATING_BOUNDARY.md`
- `docs/SUPABASE_PHASE1_RUNBOOK.md`
