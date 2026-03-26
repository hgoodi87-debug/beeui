---
name: beeliber_supabase
description: Firebase→Supabase 전환 마스터 플랜, 스키마 설계 원칙, RLS 권한 구조. Supabase 관련 작업 시 필수 참조.
---

# 🗄️ Beeliber Supabase 마이그레이션 마스터

## 📍 현재 상태 (2026.03.26)

- **현재 Phase**: Phase 1 완료 → Phase 2 진입
- **전환 방식**: 병행 검증 + 단계적 절체
- **운영 원칙**: Firebase를 즉시 끊지 않고 Supabase를 검증 후 전환
- **DB**: 39개 테이블, RLS 전체 ON, 11개 역할
- **진행도**: ~25% (인증 + 조직 + 마스터 데이터 완료)

### 기능별 현재 상태

| 기능 | 제공자 | 상태 |
|------|--------|------|
| 관리자 인증 | ✅ Supabase | 완전 구현 (Firebase 브리지 경유) |
| 관리자 계정 동기화 | ✅ Supabase | upsertAdminAccount 자동 |
| 스토리지 업로드 | ⚠️ Supabase | 환경변수 설정 완료, 테스트 필요 |
| 데이터 조회 | 🔴 Firebase | storageService.ts 마이그레이션 대기 |
| 예약 관리 | 🔴 Firebase | Supabase reservations 테이블 준비 완료 |
| 결제 | ✅ Toss | Mock 모드, 실배포 대기 |

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

## 🏗️ 목표 데이터 모델 (Harness Engineering v1 기준)

**핵심 원칙**: `직원 1명 = auth 계정 1개 = 프로필 1개`

```
마스터:     branch_types, branches, services, baggage_types, service_rules
고객/예약:  customers, reservations, reservation_items
결제:       payments
배송/운영:  delivery_assignments, proof_assets, operation_status_logs
이슈:       issue_tickets
AI:         ai_outputs, ai_review_logs
인프라:     notifications, audit_logs
```

전체 SQL 초안: `docs/beeliber_harness_engineering_v1.md` § 7 참조

## 🔒 RLS 역할 체계 (Harness v1 기준)

```
admin → ops_manager → ops_staff / finance / marketing / content_manager / driver / customer
```

**역할별 접근 범위**:
- `customer` → 본인 reservations, payments만
- `driver` → 배정된 delivery_assignments, proof_assets 업로드
- `ops_staff` → issue_tickets, operation_status_logs
- `finance` → payments 전체
- `marketing / content_manager` → ai_outputs, ai_review_logs
- `admin / ops_manager` → 전체 테이블

**핵심 정책**:
- **삭제 금지 — 상태 전환만 허용**
- 프론트 조건 분기만으로 권한 제어 금지 — DB RLS가 최종 방어선
- RLS 정책 SQL 초안: `docs/beeliber_harness_engineering_v1.md` § 8 참조

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
