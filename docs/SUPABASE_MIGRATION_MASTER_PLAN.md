# Beeliber Supabase 전환 마스터 플랜

## 문서 목적

이 문서는 Beeliber의 Firebase 기반 운영 구조를 Supabase 중심 구조로 단계적으로 전환하기 위한 기준 문서다.

앞으로 전환 관련 작업은 이 문서를 단일 기준으로 삼는다.

- 운영 원칙: 운영 코어 우선 전환
- 전환 방식: 병행 검증 + 단계적 절체
- 우선 목표: 직원/권한/지점/관리자 로그인 안정화

---

## 1. 추천 전환 전략

추천안은 아래 순서다.

1. 1차: 직원 / 권한 / 지점 / 관리자 로그인
2. 2차: 예약 / 짐 / 배송 이벤트
3. 3차: 정산 / 리포트 / 파일
4. 마지막: 사용자 앱 read/write 절체

이 방식을 추천하는 이유는 다음과 같다.

- 운영 코어부터 먼저 옮기면 현재 겪고 있는 직원 중복, 권한 꼬임, 관리자 로그인 불안정 문제를 가장 먼저 잡을 수 있다.
- Firebase를 바로 끊지 않고 검증 기간을 두면 데이터 불일치와 운영 사고를 줄일 수 있다.
- Firebase의 기존 운영 데이터를 기준값으로 삼고, Supabase를 병행 비교 대상으로 두면 절체 리스크가 낮아진다.

---

## 2. 목표 아키텍처

전환 완료 후의 기준 아키텍처는 아래와 같다.

### 운영 원칙

- Supabase를 단일 운영 소스 오브 트루스로 사용
- Firebase는 전환 기간 동안만 보조로 유지
- Firebase는 백필, 비교 검증, 레거시 호환 용도로만 사용

### 구성 요소

- Auth: 직원, 관리자, 추후 고객 계정
- Postgres: 운영 DB 전체
- Storage: 인수 사진, 배송 사진, 증빙 파일, 서명 이미지
- RLS: 지점/역할별 접근 제어
- SQL / View / Function: 관리자 집계, 정산, 감사로그

### 핵심 원칙

- 인증과 운영 데이터의 기준을 분리하지 않는다.
- 직원 1명 = auth 계정 1개 = 프로필 1개
- 삭제보다 상태 전환을 우선한다.
- 권한 제어는 앱 코드가 아니라 DB 정책까지 포함해 설계한다.

---

## 3. 전환 목표 데이터 모델

핵심 원칙은 아래 한 줄이다.

`직원 1명 = auth 계정 1개 = 프로필 1개`

### 인증 / 조직

- `auth.users`
- `profiles`
- `employees`
- `roles`
- `employee_roles`
- `branches`
- `employee_branch_assignments`

### 고객 / 예약 / 짐

- `customers`
- `bookings`
- `booking_items`
- `baggage_items`
- `price_quotes`
- `insurance_records`

### 배송 / 운영

- `delivery_jobs`
- `job_stops`
- `job_events`
- `tracking_points`
- `proof_of_pickup`
- `proof_of_dropoff`

### 정산 / 리포트

- `daily_settlements`
- `monthly_settlements`
- `partner_commissions`
- `payouts`
- `audit_logs`

### 설계 메모

- Firestore의 중첩 구조와 서브컬렉션은 그대로 옮기지 않는다.
- 관계형으로 풀기 애매한 필드는 `jsonb` 후보로 분류한다.
- 관리자 화면의 행 기준 키는 반드시 `employee.id`로 통일한다.

---

## 4. 단계별 실행안

## Phase 0. 진단 및 동결

목표는 “당장 옮기기”가 아니라 현재 Firebase 구조를 정확히 표로 뽑는 것이다.

### 정리 대상

- Firestore 컬렉션 목록
- 문서 샘플 50~100개
- 서브컬렉션 구조
- 인증 사용자 타입
- Storage 폴더 구조
- 관리자 페이지 실제 읽기 쿼리
- 직원 로그인 흐름

### 특히 확인할 항목

- 같은 직원이 여러 문서로 중복 저장됐는지
- `email`, `uid`, `branchId`, `role`이 일관된지
- 정리/삭제가 soft delete인지 실제 delete인지
- 로그인 성공 후 어떤 추가 조회가 실패하는지

### 결과물

- Firebase 컬렉션 맵
- 로그인 흐름도
- 운영 핵심 화면 쿼리 목록
- 데이터 이상 유형 목록

## Phase 1. Supabase 기초 환경 구축

### 작업 항목

- Supabase 프로젝트 생성
- DB region 결정
- `auth.users` 연계 구조 설계
- RLS 기본 정책 설계
- SSL / 네트워크 제한 / 운영 체크리스트 반영

### 완료 조건

- 기본 스키마 생성 가능
- RLS 초안 준비 완료
- 운영 환경 접근 정책 확정

## Phase 2. 인증 / 직원 / 권한 우선 이전

이 단계가 가장 먼저 가야 한다.

### 작업 항목

- Firebase Auth 사용자 내보내기
- Supabase Auth import 구조 설계 및 검증
- `profiles`, `employees`, `roles`, `employee_branch_assignments` 생성
- 관리자 로그인 플로우 교체
- 인사관리 페이지를 Supabase 기준으로 재작성

### 핵심 규칙

- 목록 기준 테이블은 무조건 `employees`
- 역할/소속은 하위 테이블로 분리
- 삭제 금지, 상태값 전환만 허용
- 관리자 화면 row key는 `employee.id`

### 목표

현재의 중복/누락/로그인 문제를 이 단계에서 먼저 안정화한다.

## Phase 3. 운영 데이터 이전

이 단계에서는 단순 평탄화에 의존하지 않는다.

### 작업 순서

1. Firestore export
2. 컬렉션별 JSON 추출
3. 중첩 객체/서브컬렉션 분해
4. 정합성 검사
5. Supabase 적재

### 권장 이관 순서

1. `branches`
2. `employees`
3. `customers`
4. `bookings`
5. `baggage_items`
6. `delivery_jobs`
7. `job_events`
8. `settlements`

### 원칙

- 정규화 설계가 먼저다.
- 마이그레이션 도구 사용은 그 다음이다.
- 적재 전 검증 스크립트를 반드시 둔다.

## Phase 4. Storage 이전

### 이전 대상 예시

- 인수 사진
- 인계 사진
- 배송 사진
- 증빙 파일
- 서명 이미지

### 권장 버킷 구조

- `booking-proofs/`
- `delivery-proofs/`
- `employee-docs/`
- `partner-settlement-files/`

## Phase 5. 병행 운영과 컷오버

바로 끊지 말고, 양쪽 결과를 비교한다.

### 컷오버 검증 기준

- 직원 수 일치
- 활성 지점 수 일치
- 예약 건수 일치
- 최근 30일 정산 합계 일치
- 로그인 성공률 정상
- 관리자 핵심 화면 전체 정상

### 운영 원칙

- Supabase를 우선 후보로 올리되 Firebase 비교값을 유지한다.
- 차이가 나는 항목은 즉시 원인 분석 표로 누적한다.

## Phase 6. Firebase 쓰기 중단 및 종료

### 순서

1. Firestore write freeze
2. 최종 delta backfill
3. 앱 환경변수 전환
4. 48~72시간 집중 모니터링
5. 문제 없으면 Firebase 운영 역할 축소

---

## 5. 권한 설계 원칙

Beeliber는 RLS를 나중에 붙이면 안 된다.

### 최소 역할

- `super_admin`
- `hq_admin`
- `hub_manager`
- `partner_manager`
- `ops_staff`
- `driver`
- `cs_staff`

### 최소 정책

- 본인 프로필만 조회/수정
- 본인 소속 지점 데이터만 조회
- HQ만 전 지점 조회
- 정산 테이블은 HQ/재무만 조회
- 파트너는 자기 지점 정산만 조회
- 삭제보다 상태 변경 우선

### 정책 메모

- 프론트 조건 분기만으로 권한 제어하지 않는다.
- DB의 RLS가 최종 방어선이다.
- 감사 로그는 읽기 권한도 별도 분리한다.

---

## 6. 가장 중요한 리스크

### 리스크 1. Firestore 중첩 구조를 그대로 가져오려는 것

이건 실패 확률이 높다.

- 반드시 정규화 설계
- 변환 스크립트 작성
- 검증 후 적재

### 리스크 2. 로그인만 옮기고 직원 마스터를 안 고치는 것

이 경우 인증은 성공해도 관리자 화면은 다시 깨진다.

### 리스크 3. RLS를 뒤늦게 붙이는 것

처음에는 빨라 보여도, 나중에 전체 쿼리와 화면을 다시 뜯게 된다.

### 리스크 4. 현재 정리/삭제 로직을 그대로 복사하는 것

지금 문제를 그대로 옮겨 심는 셈이다.

- `merge`
- `inactive`
- `suspended`
- `resigned`

같은 상태 머신으로 재정의해야 한다.

---

## 7. 현실적인 일정안

### 1주차

- Firebase 구조 전수조사
- 컬렉션 맵 작성
- 관리자 핵심 화면 목록화

### 2주차

- Supabase 프로젝트 생성
- 스키마 초안 작성
- RLS 초안 작성
- Auth 연동 구조 설계

### 3주차

- 직원/권한/지점 테이블 이관
- 관리자 로그인 교체
- 인사관리 페이지 재구축

### 4주차

- 예약/짐/배송 테이블 이관
- 운영 리스트/상세/상태 변경 연결

### 5주차

- 정산/리포트/파일 이관
- 집계 쿼리/뷰 정리

### 6주차

- 병행 검증
- 최종 delta migration
- 컷오버

운영 중 서비스 기준으로 6주가 무난하고, 앱 변경 범위가 더 크면 8주까지 본다.

---

## 8. 이번 주 바로 시작할 작업

이번 주 우선 작업은 아래와 같다.

1. Firebase 컬렉션 전체 목록 뽑기
2. 직원/로그인 관련 컬렉션과 필드 샘플 추출
3. 관리자 페이지에서 쓰는 API/쿼리 목록 정리
4. 예약 → 배송 → 정산 데이터 흐름 한 장으로 시각화
5. Supabase 목표 스키마 초안 작성
6. 직원 / 권한 / 지점 마이그레이션 PoC 진행

---

## 9. 현재 작업 기준선

앞으로 Supabase 전환 작업은 아래 원칙을 따른다.

- Firebase 문제를 임시로 덮지 않고, 최종적으로 Supabase 구조에서 해결 가능한 방식으로 정리한다.
- 인사관리, 관리자 로그인, 권한, 지점 데이터는 항상 최우선 범위로 본다.
- 새 기능을 추가하더라도 `Supabase 기준 데이터 모델`과 충돌하면 먼저 구조를 다시 확인한다.
- 작업 중 결정된 내용은 이 문서에 누적한다.

---

## 10. 다음 문서 후보

이 문서를 기준으로 다음 산출물을 이어서 만든다.

- `docs/FIREBASE_COLLECTION_INVENTORY.md`
- `docs/SUPABASE_SCHEMA_DRAFT.md`
- `docs/ADMIN_QUERY_MAP.md`
- `docs/BOOKING_DELIVERY_SETTLEMENT_FLOW.md`
- `docs/RLS_POLICY_DRAFT.md`

