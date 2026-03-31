---
name: beeliber_app_structure
description: "앱 전체 구조 맵. 라우팅, 컴포넌트 계층, 도메인 구조, 서비스 레이어, 상태 관리. 구조적 수정 시 참조."
---

# 앱 구조 스킬

## 라우트 구조
- 사용자: `/:lang/*` (25+ 라우트)
- 관리자: `/admin/*` (4 라우트)
- App.tsx가 전체 라우팅 관리

## 도메인 (DDD)
- `booking/` — 예약 로직, 가격 계산
- `location/` — 거점 관리
- `admin/` — 관리자 통계/데이터
- `user/` — 사용자 인증
- `shared/` — 공통 타입/유틸

## 상태 관리
- **Zustand**: appStore, bookingStore, adminStore
- **React Query**: 서버 데이터 페칭/캐싱

## 서비스 레이어
- `storageService.ts` — 핵심 CRUD (Supabase 어댑터)
- `adminAuthService.ts` — 관리자 인증
- `tossPaymentsService.ts` — 결제
- `supabaseClient.ts` + `supabaseRuntime.ts` — DB 연결

## 컴포넌트 계층
```
App → ErrorBoundary → Routes
├── LandingRenewal (12개 섹션)
├── BookingPage (4단계)
├── AdminDashboard (20개 탭)
└── 공통: Navbar, Footer, ChatBot, Modals
```

## 수정 가이드
- 새 페이지 추가: App.tsx 라우트 + 번역 키 추가
- 새 도메인 훅: domains/{domain}/ 에 use*.ts 파일
- DB 호출 추가: storageService.ts의 어댑터 패턴 따라가기
- 번역 추가: translations_split/의 6개 파일 모두 업데이트
- 관리자 탭 추가: AdminDashboard.tsx + 역할 기반 접근 제어
