# Beeliber Database Migration Changelog
> 최종 업데이트: 2026.03.28 | 안티그래비티 공유용

---

## 프로젝트 전환 이력

| 날짜 | 이벤트 | 상세 |
|------|--------|------|
| 2026.03.21 | Supabase 프로젝트 생성 | `fzvfyeskdivulazjjpgr` (beeliber, ap-northeast-1) |
| 2026.03.21 | Phase 0 마이그레이션 | Auth/Org 테이블 (profiles, employees, roles, branches) |
| 2026.03.26 | 하네스 v1 마이그레이션 | 39개 테이블 + RLS + 인덱스 + 시드 |
| 2026.03.26 | Firebase 데이터 이전 | locations 41건, expenditures 29건 등 |
| 2026.03.26 | Firebase Firestore 제거 | Supabase 어댑터 레이어로 전환 |
| 2026.03.27 | **새 프로젝트로 전환** | `xpnfjolqiffduedwtxey` (ap-northeast-1) |
| 2026.03.27 | 데이터 복사 완료 | 9개 테이블 247건 + 시드 데이터 |
| 2026.03.28 | Storage 런타임 브리지 적용 | `storage_assets` 테이블 + 5개 Storage 버킷 생성/정렬 |
| 2026.03.28 | Admin Reporting View 추가 | `admin_booking_list_v1`, `admin_revenue_daily_v1`, `admin_revenue_monthly_v1` |

---

## 현재 운영 프로젝트

```
프로젝트: xpnfjolqiffduedwtxey
URL: https://xpnfjolqiffduedwtxey.supabase.co
리전: ap-northeast-1
```

### 이전 프로젝트 (비활성)
```
프로젝트: fzvfyeskdivulazjjpgr
URL: https://fzvfyeskdivulazjjpgr.supabase.co
리전: ap-northeast-1
상태: 일시정지 가능 (무료 플랜)
```

---

## 데이터베이스 구조 (39+ 테이블)

### Layer 1: Auth/Org (Phase 0)
| 테이블 | 행 | 설명 |
|--------|---:|------|
| profiles | 0* | Auth 사용자 프로필 (auth.users FK) |
| employees | 0* | 직원 마스터 |
| roles | 11 | 역할 (super_admin~customer) |
| employee_roles | 0* | 직원↔역할 매핑 |
| employee_branch_assignments | 0* | 직원↔지점 배정 |
| branches | 42 | 지점/Hub/파트너 |

> *Auth 관련 테이블은 `supabase:sync-phase1-auth` 스크립트로 동기화 필요

### Layer 2: Commerce (하네스 v1)
| 테이블 | 행 | 설명 |
|--------|---:|------|
| branch_types | 3 | HUB/PARTNER/HQ |
| services | 2 | STORAGE/HUB_TO_AIRPORT |
| baggage_types | 4 | 쇼핑백/기내용/대형/특수짐 |
| service_rules | 24 | Phase 1 baseline 규칙 |
| customers | 0 | 고객 (auth.uid FK) |
| reservations | 0 | 예약 본체 |
| reservation_items | 0 | 예약 짐 항목 |
| payments | 0 | 결제 |
| booking_details | 0 | 예약 확장 필드 (Firebase 호환) |

### Layer 3: Operations
| 테이블 | 행 | 설명 |
|--------|---:|------|
| delivery_assignments | 0 | 배송 배정 |
| proof_assets | 0 | 증빙 사진 |
| operation_status_logs | 0 | 상태 전이 로그 |
| issue_tickets | 0 | 이슈 관리 |

### Layer 4: AI
| 테이블 | 행 | 설명 |
|--------|---:|------|
| ai_outputs | 0 | AI 생성 텍스트 |
| ai_review_logs | 0 | AI 검수 로그 |

### Layer 5: Admin/운영
| 테이블 | 행 | 설명 |
|--------|---:|------|
| locations | 41 | 다국어 지점 마스터 (6개 언어) |
| app_settings | 4 | 설정 (가격/히어로/약관) |
| daily_closings | 1 | 일일 정산 |
| expenditures | 29 | 지출 기록 |
| discount_codes | 1 | 할인 코드 |
| user_coupons | 0 | 사용자 쿠폰 |
| system_notices | 0 | 공지사항 |
| partnership_inquiries | 0 | 제휴 문의 |
| branch_prospects | 0 | 지점 확장 후보 |

### Layer 6: CMS/커뮤니케이션
| 테이블 | 행 | 설명 |
|--------|---:|------|
| chat_sessions | 123 | 챗봇 세션 |
| chat_messages | 0 | 챗봇 메시지 |
| cms_areas | 0 | CMS 지역 |
| cms_themes | 0 | CMS 테마 |
| cms_contents | 0 | CMS 콘텐츠 |
| legal_documents | 0 | 약관/개인정보 |
| storage_tiers | 0 | 보관 가격 티어 |

### Google Reviews
| 테이블 | 행 | 설명 |
|--------|---:|------|
| google_reviews | 5 | Google 리뷰 캐시 |
| google_review_summary | 1 | 리뷰 집계 (5.0★, 101건) |

### 인프라
| 테이블 | 행 | 설명 |
|--------|---:|------|
| notifications | 0 | 알림 발송 기록 |
| audit_logs | 0 | 감사 로그 |

---

## 역할 체계 (11개)

```
super_admin → hq_admin → hub_manager / partner_manager
  → finance_staff / ops_staff / cs_staff / driver
  → marketing / content_manager
  → customer
```

---

## RLS 정책 요약

| 접근 수준 | 대상 테이블 |
|----------|------------|
| **anon 공개 읽기** | locations, app_settings, discount_codes, branches, services, baggage_types, branch_types, service_rules, storage_tiers, system_notices, cms_*, legal_documents, google_reviews, booking_details |
| **anon 공개 쓰기** | chat_sessions, chat_messages, booking_details(INSERT) |
| **인증 사용자** | profiles(본인), customers(본인), reservations(본인) |
| **관리자 전체** | daily_closings, expenditures, branch_prospects, 전 테이블 |
| **역할 기반** | payments(finance), issue_tickets(ops), ai_outputs(marketing) |

---

## Edge Functions (5개)

| 함수 | 트리거 | 기능 |
|------|--------|------|
| on-booking-created | booking_details INSERT | 예약코드 생성 + 바우처 이메일 + Google Chat |
| on-booking-updated | booking_details UPDATE | 도착 알림 + 정산 계산 |
| toss-payments | 클라이언트 호출 | create-session / confirm |
| cancel-booking | 클라이언트 호출 | 예약 취소 |
| sync-google-reviews | 수동/스케줄 | Google Places API → 리뷰 동기화 |

---

## DB Triggers

```sql
booking_details INSERT → trigger_on_booking_created() → Edge Function
booking_details UPDATE → trigger_on_booking_updated() → Edge Function
```

---

## 마이그레이션 파일 위치

```
supabase/migrations/
├── NEW_PROJECT_PART1_core.sql        ← Auth/Org 테이블 + RLS
├── NEW_PROJECT_PART2_harness.sql     ← 하네스 39개 테이블 + RLS + 트리거
├── 001_init_tables.sql               ← 원본 (참고용)
├── 002_indexes.sql
├── 003_rls.sql
├── 004_seed_data.sql
├── 005_firebase_bridge_tables.sql
├── 20260327065330_remote_baseline.sql
├── 20260328000100_storage_runtime_bridge.sql
├── 20260328000200_admin_reporting_views.sql
└── FULL_MIGRATION_FOR_NEW_PROJECT.sql ← 통합본 (deprecated)
```

### 적용 주의

- `20260322_000002_storage_bucket_rls_draft.sql`은 현재 운영 프로젝트에 직접 적용하지 않는다.
- Storage 실운영 브리지는 `20260328000100_storage_runtime_bridge.sql`이 기준이다.

---

## 클라이언트 연동

```
.env.local:
  VITE_SUPABASE_URL=https://xpnfjolqiffduedwtxey.supabase.co
  VITE_SUPABASE_ANON_KEY=eyJ...

storageService.ts:
  Firebase Firestore 어댑터 → Supabase REST 자동 라우팅
  147개 Firestore 호출 → Supabase 투명 변환
```

---

## 다음 작업 필요

1. **Auth 동기화**: Firebase admins → 새 Supabase auth.users + profiles + employees
   ```bash
   SUPABASE_URL=https://xpnfjolqiffduedwtxey.supabase.co \
   SUPABASE_SECRET_KEY=sb_secret_... \
   npm run supabase:sync-phase1-auth
   ```

2. **Edge Functions 배포**: 새 프로젝트에 5개 Edge Function 배포

3. **service_rules 재생성**: branch_type UUID가 새 프로젝트에서 다르므로 재생성 필요

---

> 가벼운 여행 되세요! 🐝 — beeliber · bee-liber.com
