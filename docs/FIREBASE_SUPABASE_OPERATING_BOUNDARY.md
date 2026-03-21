# Firebase / Supabase 운영 경계표

## 문서 목적

이 문서는 Beeliber가 Supabase Phase 1을 완료한 뒤에도,
실제 운영에서 무엇을 Firebase에 두고 무엇을 Supabase로 넘길지 헷갈리지 않게 하기 위한 기준표다.

지금 단계에서 가장 중요한 원칙은 간단하다.

- 배포는 당분간 Firebase
- 운영 코어 데이터는 단계적으로 Supabase
- 사용자 앱 read/write 절체는 마지막

---

## 1. 지금 당장 운영 기준

### 결론

현재 권장 운영 방식은 아래다.

- `Firebase Hosting` 계속 사용
- `Firebase Functions` 계속 사용
- `Supabase Auth`는 관리자/직원 로그인 전환 대상으로 사용
- `Supabase Postgres`는 직원/권한/지점 마스터의 새 기준으로 사용
- 고객 예약/배송/정산 본문은 아직 Firebase 기준 유지

즉, 지금은 **배포 레이어는 Firebase**, **운영 코어 마스터는 Supabase**로 가는 하이브리드 상태가 맞다.

---

## 2. 시스템별 책임 분리

## 2-1. Firebase에 계속 두는 것

### 1) 배포 / 서비스 노출

- Firebase Hosting
- 기존 프론트 배포 라인
- 기존 도메인 연결

이유:

- 지금 서비스 노출 경로가 이미 Firebase 기준으로 안정화되어 있다.
- Supabase로 호스팅까지 한 번에 바꾸면 전환 리스크가 커진다.

### 2) 서버 실행 로직

- Firebase Functions
- 예약 후처리
- 바우처/알림 트리거
- 기존 외부 연동 webhook

이유:

- 실제 운영 자동화가 아직 Firebase Functions에 묶여 있다.
- Phase 1 목표는 서버 이전이 아니라 운영 코어 안정화다.

### 3) 사용자 앱 쓰기 경로

- 고객 예약 생성
- 고객 예약 변경
- 고객용 tracking / 마이페이지 일부
- 채팅 / 세션 / 메세지
- 할인코드 / 공지 / FAQ 등 기존 읽기 경로

이유:

- 사용자 앱은 마지막 절체 대상이다.
- 지금 여기까지 건드리면 서비스 사고가 난다, 참나.

### 4) 정산 / 리포트 / 파일 운영 본문

- `bookings`
- `daily_closings`
- `expenditures`
- 리포트용 집계 원본
- Firebase Storage 업로드 자산

이유:

- 이 영역은 아직 Supabase Phase 2~3 범위다.

---

## 2-2. Supabase로 넘긴 것

### 1) 관리자 / 직원 인증 기반

- 관리자 로그인용 `auth.users`
- `profiles`
- `employees`
- `roles`
- `employee_roles`
- `employee_branch_assignments`

상태:

- Phase 1 반영 완료
- 첫 관리자 계정 부트스트랩 완료
- Firebase에서 이메일 있는 관리자 계정 일부 이관 완료

### 2) 지점 마스터

- `branches`

상태:

- Firebase `locations` + `branches` 기준으로 1차 병합 반영 완료
- 다만 실제 프론트 사용자 지점 페이지는 아직 Firebase/기존 로직 유지

---

## 2-3. 당분간 병행 검증이 필요한 것

### 직원 / 권한 / 지점

기준:

- 신규 기준은 Supabase
- Firebase는 비교 검증 및 레거시 로그인 참조용

주의:

- Firebase `admins`에 이메일 없는 문서가 많아서 완전 절체가 아직 안 된다.
- 이건 데이터 정리 없이는 끝까지 못 간다.

### 관리자 로그인

기준:

- 코드상으로는 Supabase 로그인 경로 준비 완료
- 실제 운영 전환은 프론트 env와 배포 반영 후 진행

필요 env:

```env
VITE_SUPABASE_URL=프로젝트_URL
VITE_SUPABASE_PUBLISHABLE_KEY=프로젝트_publishable_key
VITE_ADMIN_AUTH_PROVIDER=supabase
```

GitHub Actions 배포 기준:

- Repository Secret `VITE_SUPABASE_URL`
- Repository Secret `VITE_SUPABASE_PUBLISHABLE_KEY`
- Repository Variable `VITE_ADMIN_AUTH_PROVIDER=supabase`

이 세 개를 넣어야 Firebase Hosting으로 배포해도 운영 빌드가 Supabase 관리자 로그인 모드로 켜진다.

---

## 3. 현재 단계에서 절대 안 하는 것

지금은 아래를 한 번에 바꾸면 안 된다.

- Hosting를 Supabase로 옮기기
- 고객 예약 write를 Supabase로 즉시 전환
- Firebase Functions를 한 번에 중단
- Firestore를 바로 read-only로 잠그기
- Firebase Storage를 바로 끊기

이건 아직 순서가 아니다.

---

## 4. 다음 단계 권장 순서

## Step 1. 관리자 로그인 운영 전환

할 일:

- 프론트 배포 환경에 Supabase env 주입
- 관리자 로그인 경로를 Supabase 모드로 전환
- 실제 관리자 로그인 QA

완료 기준:

- 본사 관리자 로그인 성공
- 역할/지점 읽기 정상
- 대시보드 진입 정상

## Step 2. 이메일 없는 직원 데이터 정리

할 일:

- Firebase `admins`에서 이메일 없는 직원 목록 정리
- 실제 사용할 직원 로그인 식별자 확정
- 필요 시 이메일 보완 또는 계정 구조 재정비

완료 기준:

- Supabase Auth로 생성 가능한 직원 목록 확정

## Step 3. 예약 / 배송 / 이벤트를 Supabase 설계로 분리

할 일:

- `bookings`
- `baggage_items`
- `delivery_jobs`
- `job_events`

관계형 초안 확정

## Step 4. 정산 / 리포트 / 파일 이전

할 일:

- 정산 원장
- 리포트 뷰
- 증빙 파일 / 사진

정리

## Step 5. 마지막에 사용자 앱 절체

그때 가서만 아래를 검토한다.

- 예약 생성 write path 전환
- 고객 mypage read path 전환
- Firebase 역할 축소

---

## 5. 운영자용 한 줄 판단 기준

사장님이 헷갈릴 때는 이 기준으로 보면 된다.

- 화면이 고객 예약/배송/정산 본문이면: 아직 Firebase
- 화면이 직원/권한/지점/관리자 로그인 기준이면: 이제 Supabase
- 배포 자체면: 아직 Firebase

이게 지금 가장 덜 위험하고, 가장 현실적인 운영선이다.
