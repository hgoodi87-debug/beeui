---
name: beeliber_ui_map
description: 빌리버 웹 전체 사용자 입장 구조 맵 + 화면별 연동 포인트. UI/UX 작업 시 영향 범위 파악과 연동 체크에 사용.
---

# 🗺️ Beeliber 전체 사용자 구조 맵 & 연동 체크

UI/UX 수정 시 **어떤 화면이 무엇과 연결돼 있는지** 즉시 파악하기 위한 시각화 기준서.

---

## 📐 전체 사용자 여정 (User Journey)

```
[입장]
  └─ bee-liber.com/:lang
         │
         ▼
┌─────────────────────────────────────────┐
│  LANDING  /  LandingRenewal             │
│  ├─ Navbar                              │
│  ├─ Hero ──────── [CTA: Store] ──┐      │
│  │                [CTA: Deliver]─┼──┐   │
│  ├─ TrackingWidget               │  │   │
│  ├─ PainSection (lazy)           │  │   │
│  ├─ HowItWorks (lazy)            │  │   │
│  ├─ TrustBadge (lazy)            │  │   │
│  ├─ Pricing (lazy)               │  │   │
│  ├─ Reviews (lazy)               │  │   │
│  ├─ FAQ (lazy)                   │  │   │
│  ├─ FinalCTA (lazy)              │  │   │
│  ├─ ChatBot                      │  │   │
│  └─ Footer                       │  │   │
└──────────────────────────────────┼──┼───┘
                                   │  │
         ┌─────────────────────────┘  │
         ▼                            ▼
┌──────────────────┐       ┌──────────────────────┐
│  LOCATIONS        │       │  BOOKING             │
│  /locations       │──────▶│  /booking            │
│  ├─ LocationList  │       │  ├─ 서비스 선택       │
│  ├─ LocationMap   │       │  ├─ 날짜/시간         │
│  └─ BaggageCounter│       │  ├─ 짐 종류/수량      │
└──────────────────┘       │  ├─ 사용자 정보       │
                            │  ├─ 보험 선택         │
                            │  ├─ 쿠폰 입력         │
                            │  └─ 결제 방식 선택    │
                            └──────────┬───────────┘
                                       │
                          ┌────────────┴──────────┐
                          │                       │
                          ▼                       ▼
               ┌──────────────────┐   ┌──────────────────────┐
               │  TOSS 결제       │   │  현금 결제            │
               │  /payments/toss  │   │  (직접 저장)          │
               │  /success        │   └──────────┬───────────┘
               │  /fail           │              │
               └──────┬───────────┘              │
                      └──────────────┬───────────┘
                                     ▼
                          ┌──────────────────────┐
                          │  BOOKING SUCCESS      │
                          │  /booking-success     │
                          │  ├─ 예약번호          │
                          │  ├─ 바우처            │
                          │  └─ 추적 링크         │
                          └──────────┬───────────┘
                                     │
                                     ▼
                          ┌──────────────────────┐
                          │  TRACKING            │
                          │  /tracking           │
                          │  └─ 예약 상태 조회   │
                          └──────────────────────┘
```

---

## 🔌 화면별 연동 포인트 맵

### 🏠 랜딩페이지 (`/`) — LandingRenewal

```
LandingRenewal
├─ [읽기] Firestore: hero/{docId} ──────── HeroTab (관리자 설정)
├─ [읽기] Firestore: notices/{id} ──────── NoticeTab (공지)
├─ [읽기] Firestore: storageTiers ──────── LandingPricing 가격 표시
├─ [읽기] bookingStore.customerBranch ──── branch/:code 진입 시
├─ [쓰기] bookingStore.preSelectedBooking ─ CTA 클릭 → /booking 이동
├─ [언어] appStore.lang ────────────────── translations_split/
├─ [SEO]  SEO.tsx ───────────────────────── <title>, <meta>, hreflang
└─ [연결] ChatBot → Firestore chats/{sessionId}
```

**체크 포인트**:
| 수정 영역 | 연동 체크 |
|---------|---------|
| Hero 이미지/텍스트 | HeroTab에서 관리자 설정과 일치 여부 |
| CTA 버튼 | bookingStore.preSelectedBooking 정상 set 여부 |
| LandingPricing | Firestore storageTiers 값 vs 화면 표시값 |
| 공지 팝업 | NoticePopup → notices 컬렉션 연동 |
| 번역 | 6개 언어 전환 시 모든 텍스트 변경 여부 |

---

### 📍 위치 선택 (`/locations`) — LocationsPage

```
LocationsPage
├─ [읽기] StorageService.getLocations() → Firestore: locations/{id}
├─ [읽기] StorageService.getDeliveryPrices() → Firestore: deliveryPrices
├─ [상태] serviceType (STORAGE / DELIVERY / BOTH)
├─ [쓰기] bookingStore.preSelectedBooking ─ 위치 선택 → /booking
└─ [컴포] LocationList / LocationMap / BaggageCounter
```

**체크 포인트**:
| 수정 영역 | 연동 체크 |
|---------|---------|
| 위치 카드 | Firestore locations 데이터 렌더링 정합 |
| 지도 마커 | 좌표 데이터 누락 여부 |
| 선택 → 예약 이동 | preSelectedBooking에 locationId 포함 여부 |

---

### 📋 예약 (`/booking`) — BookingPage ⭐ 가장 복잡

```
BookingPage
├─ [초기화] bookingStore.preSelectedBooking (위치/서비스 타입 사전입력)
│
├─ [읽기] StorageService.getLocations() ─── 위치 목록
├─ [읽기] StorageService.getStorageTiers() ─ 보관 요금표
├─ [읽기] StorageService.getDeliveryPrices() ─ 배송 요금
├─ [읽기] Firestore: discount_codes/{code} ─ 쿠폰 검증
│
├─ [계산] bookingService.ts (calculatePrice) ─ 실시간 가격
│           └─ STORAGE_RATES 상수 기준
│
├─ [트래킹] TrackingService.addToCart() ─── Meta Pixel
│
├─ [결제 분기]
│   ├─ Toss (isTossPaymentsEnabled() = true)
│   │    └─ createTossPaymentSession() → Firebase Function
│   └─ 현금
│        └─ StorageService.saveBooking() → Firestore bookings/{id}
│               └─ onBookingCreated Trigger → 바우처 이메일
│
└─ [인증] useCurrentUser() → Firebase Auth
```

**체크 포인트**:
| 수정 영역 | 연동 체크 |
|---------|---------|
| 서비스 타입 UI | preSelectedBooking.serviceType 반영 여부 |
| 가격 표시 | STORAGE_RATES 상수 vs LandingPricing 표시 일치 여부 |
| 쿠폰 입력 | Firestore discount_codes 조회 + 할인 계산 |
| Toss 결제 버튼 | VITE_TOSS_PAYMENTS_ENABLED 환경변수 |
| 예약 완료 후 | lastBooking store set + /booking-success 이동 |
| 이메일 발송 | onBookingCreated Trigger 정상 동작 |

---

### 💳 결제 결과 (`/payments/toss/success`, `/fail`)

```
TossPaymentSuccessPage
├─ [읽기] URL 쿼리: paymentKey, orderId, amount
├─ [호출] confirmTossPayment() → Firebase Function
│           ├─ Toss API 결제 확인
│           └─ Firestore bookings/{id} paymentStatus 업데이트
├─ [트래킹] TrackingService.purchase()
└─ [이동] → /booking-success

TossPaymentFailPage
├─ [읽기] URL 쿼리: errorCode, message
└─ [이동] → /booking (재시도)
```

**체크 포인트**:
| 수정 영역 | 연동 체크 |
|---------|---------|
| 성공 화면 UI | confirmTossPayment 호출 후 bookingId 반환 여부 |
| 실패 화면 UI | 에러 메시지 번역 표시 여부 |
| 리다이렉트 URL | 토스 콘솔 등록 URL 일치 여부 |

---

### ✅ 예약 완료 (`/booking-success`) — BookingSuccess

```
BookingSuccess
├─ [읽기] bookingStore.lastBooking
├─ [표시] BookingVoucher (바우처 정보)
└─ [연결] /tracking 링크
```

**체크 포인트**:
| 수정 영역 | 연동 체크 |
|---------|---------|
| 바우처 표시 | lastBooking store 값 정합 |
| 예약번호 | Firestore bookingId 일치 여부 |

---

### 🔍 추적 (`/tracking`) — UserTrackingPage

```
UserTrackingPage
├─ [읽기] StorageService.getBookingByCode(code)
│           └─ Firestore: bookings where bookingCode == ?
├─ [표시] BookingStatus 상태 단계
└─ [언어] 다국어 상태 텍스트
```

---

### 👤 마이페이지 (`/mypage`) — MyPage

```
MyPage
├─ [인증] useCurrentUser() → Firebase Auth
├─ [읽기] StorageService.getBookingsByUser(userId)
└─ [표시] BookingHistoryTab
```

---

### 🔐 관리자 로그인 (`/admin`) — AdminLoginPage

```
AdminLoginPage
├─ [인증] adminAuthService.loginAdmin(id, pw)
│   ├─ Firebase Auth 경로: VITE_ADMIN_AUTH_PROVIDER=firebase
│   └─ Supabase Auth 경로: VITE_ADMIN_AUTH_PROVIDER=supabase
├─ [쓰기] localStorage: beeliber_admin_info (24h)
└─ [이동] → /admin/dashboard 또는 /admin/branch/:id
```

---

### 🏢 관리자 대시보드 (`/admin/dashboard`) — AdminDashboard

```
AdminDashboard
├─ [인증] adminAuthService.ensureActiveAdminSession()
│           └─ 5분 간격 세션 갱신
│
├─ [탭별 연동]
│   ├─ OverviewTab → Firestore: bookings, admins
│   ├─ DailySettlementTab → Firestore: cash_closings, bookings
│   ├─ MonthlySettlementTab → Firestore: settlements
│   ├─ AccountingTab → Firestore: expenditures
│   ├─ DiscountTab → Firestore: discount_codes
│   ├─ LogisticsTab → Firestore: delivery 관련
│   ├─ LocationsTab → Firestore: locations
│   ├─ NoticeTab → Firestore: notices
│   ├─ ChatTab → Firestore: chats
│   ├─ HeroTab → Supabase Storage (signed upload) + Firestore: hero
│   ├─ TipsCMSTab → Firestore: tips
│   ├─ TermsEditorTab → Firestore: terms/{lang}
│   ├─ PrivacyEditorTab → Firestore: privacy/{lang}
│   ├─ QnaEditorTab → Firestore: qnas
│   ├─ OperationsConsole → Firestore: delivery_jobs
│   └─ HR (RoleManagement, EmployeeList) → Firebase Function: upsertAdminAccount
│                                         └─ Supabase 직원 테이블 동기화
│
└─ [전역] appStore.adminInfo (role 기반 탭 접근 제어)
```

---

## 🔗 전역 연동 레이어

### 상태 관리 (Zustand)
```
appStore
├─ lang ──────────── 모든 페이지 번역 언어
└─ adminInfo ──────── 관리자 탭 접근 제어 (24h 캐시)

bookingStore
├─ preSelectedBooking ─ 랜딩/위치선택 → 예약 이동 데이터
├─ lastBooking ──────── 예약 완료 → 결과 페이지
├─ customerBranchCode ─ branch/:code 진입 시
└─ customerBranch ───── branch/:code 데이터
```

### 번역 (translations_split)
```
모든 화면 → appStore.lang → 동적 import
ko / en / ja / zh / zh-TW / zh-HK
```
> ⚠️ 신규 텍스트 추가 시 **6개 언어 모두** 키 추가 필수

### Firebase Functions 트리거 체인
```
Firestore bookings 생성
  └─ onBookingCreated → 바우처 이메일 (SMTP)

Firestore bookings 수정
  └─ onBookingUpdated → 상태별 알림 이메일
     ├─ 도착 알림 (arrivalService)
     └─ 환불 알림 (refundService)
```

---

## ⚡ 작업별 빠른 연동 체크 가이드

UI/UX 수정 전 아래 표에서 **수정 영역** 찾아서 연동 포인트 확인하세요.

| 수정 영역 | 연동 체크 필수 대상 |
|---------|-----------------|
| 랜딩 Hero / CTA | bookingStore.preSelectedBooking / HeroTab 관리자 설정 |
| 랜딩 Pricing 섹션 | Firestore storageTiers / beeliber_pricing 기준값 |
| 예약 폼 가격 | STORAGE_RATES 상수 / LandingPricing 표시와 일치 여부 |
| 예약 폼 쿠폰 | Firestore discount_codes / 할인 계산 로직 |
| 결제 버튼 | VITE_TOSS_PAYMENTS_ENABLED / mock 모드 여부 |
| 예약 완료 화면 | lastBooking store / 바우처 이메일 발송 |
| 상태 텍스트 | translations_split 6개 언어 모두 |
| 공지 팝업 | Firestore notices 컬렉션 |
| 관리자 탭 UI | 역할(role) 접근 제어 / adminInfo.role 확인 |
| 로그인 화면 | VITE_ADMIN_AUTH_PROVIDER (firebase/supabase) |
| 이미지 업로드 | Supabase signed upload / issueSupabaseSignedUpload 함수 |
| SEO 메타태그 | SEO.tsx / beeliber_seo 스킬 기준 |

---

## 📁 핵심 파일 위치 (빠른 참조)

```
[화면]
client/components/LandingRenewal.tsx      ← 홈
client/components/landing/               ← 랜딩 섹션들
client/components/BookingPage.tsx         ← 예약 ⭐
client/components/AdminDashboard.tsx      ← 관리자 ⭐
client/components/admin/                 ← 관리자 탭들
client/components/locations/             ← 위치 선택
client/components/SEO.tsx                ← SEO 태그

[상태/로직]
client/src/store/bookingStore.ts          ← 예약 상태
client/src/store/appStore.ts              ← 앱 전역 상태
client/src/domains/booking/bookingService.ts ← 가격 계산
client/src/domains/booking/bagCategoryUtils.ts ← 짐 카테고리

[서비스]
client/services/storageService.ts         ← Firestore CRUD ⭐
client/services/tossPaymentsService.ts    ← 결제
client/services/adminAuthService.ts       ← 관리자 인증
client/services/trackingService.ts        ← Meta Pixel

[번역]
client/translations_split/ko.ts           ← 한국어 (기준)
client/translations_split/zh-TW.ts        ← 대만 번체 (주력)

[백엔드]
functions/index.js                        ← Functions 진입점 ⭐
functions/src/domains/payments/           ← Toss 결제
functions/src/domains/notification/       ← 이메일 발송
functions/src/shared/pricing.js           ← 서버 가격 계산
```
