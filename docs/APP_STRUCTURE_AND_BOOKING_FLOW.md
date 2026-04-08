# Beeliber 전체 구조 & 사용자 예약 로직

> 생성일: 2026-03-31

---

## 1. 앱 전체 구조

```
┌─────────────────────────────────────────────┐
│                  App.tsx                      │
│  (Router + QueryClient + HelmetProvider)     │
├──────────────┬──────────────────────────────┤
│  사용자 영역   │  관리자 영역                   │
│  /:lang/*    │  /admin/*                    │
├──────────────┼──────────────────────────────┤
│ Landing      │ AdminLoginPage               │
│ Locations    │ AdminDashboard (19개 탭)      │
│ Booking      │ BranchAdminPage              │
│ Payment      │ StaffScanPage                │
│ Success      │                              │
│ Tracking     │                              │
│ MyPage       │                              │
│ Legal Pages  │                              │
└──────────────┴──────────────────────────────┘
```

### 사용자 라우트
| 경로 | 컴포넌트 | 설명 |
|------|---------|------|
| `/:lang` | LandingRenewal | 메인 랜딩 |
| `/:lang/branch/:code` | LandingRenewal | 파트너 지점 랜딩 |
| `/:lang/locations` | LocationsPage | 거점 선택 + 지도 |
| `/:lang/booking` | BookingPage | 예약 폼 (4단계) |
| `/:lang/payments/toss/success` | TossPaymentSuccessPage | 결제 성공 |
| `/:lang/payments/toss/fail` | TossPaymentFailPage | 결제 실패 |
| `/:lang/booking-success` | BookingSuccess | 예약 확인 + 바우처 |
| `/:lang/tracking` | UserTrackingPage | 배송 추적 |
| `/:lang/mypage` | MyPage | 내 예약/프로필 |
| `/:lang/services` | ServicesPage | 서비스 안내 |
| `/:lang/partnership` | PartnershipPage | 제휴 문의 |
| `/:lang/terms,privacy,refund,qna` | Legal Pages | 약관 등 |

### 관리자 라우트
| 경로 | 컴포넌트 | 접근 권한 |
|------|---------|----------|
| `/admin` | AdminLoginPage | 전체 |
| `/admin/dashboard` | AdminDashboard | super/hq/finance/cs |
| `/admin/branch/:id` | BranchAdminPage | branch/partner |
| `/admin/scan` | StaffScanPage | 전체 직원 |

---

## 2. 기술 스택 & 상태 관리

| 항목 | 기술 |
|------|------|
| UI | React + TypeScript + Vite |
| CSS | Tailwind CSS |
| 애니메이션 | Framer Motion |
| 상태 (글로벌) | Zustand (3개 스토어) |
| 상태 (서버) | TanStack React Query |
| DB | Supabase (PostgreSQL) |
| 인증 | Supabase Auth (Firebase Auth RETIRED 2026-03-29) |
| 결제 | Toss Payments |
| i18n | 6개 언어 (ko/en/ja/zh/zh-TW/zh-HK) |
| 호스팅 | Firebase Hosting |

### Zustand 스토어
| 스토어 | 파일 | 역할 |
|--------|------|------|
| `appStore` | store/appStore.ts | 현재 언어, 관리자 정보 |
| `bookingStore` | store/bookingStore.ts | 사전 선택 예약, 마지막 예약, 고객 지점 |
| `adminStore` | store/adminStore.ts | 관리자 UI 상태 (탭, 필터) |

---

## 3. 도메인 구조 (DDD)

```
client/src/domains/
├── booking/          # 예약 핵심 로직
│   ├── types.ts              # BookingState, BookingStatus
│   ├── bookingService.ts     # 보관 가격 계산, STORAGE_RATES
│   ├── deliveryStoragePricing.ts  # 배송+보관 복합 가격
│   ├── bagCategoryUtils.ts   # 짐 유형 유틸, DEFAULT_DELIVERY_PRICES
│   └── useBookings.ts        # 예약 데이터 훅
├── location/         # 거점 관리
│   ├── types.ts              # LocationOption
│   └── useLocations.ts       # 실시간 거점 구독
├── admin/            # 관리자 대시보드
│   ├── types.ts
│   ├── useAdminStats.ts      # KPI 계산
│   ├── useAdmins.ts
│   ├── useCashClosings.ts
│   ├── useExpenditures.ts
│   └── useAdminRevenue*.ts   # 매출 집계
├── user/             # 사용자
│   ├── types.ts
│   └── useCurrentUser.ts
└── shared/           # 공통
    ├── types.ts              # ServiceType, BagSizes, PriceSettings
    └── ui/                   # SEO 스키마 등
```

---

## 4. 서비스 레이어

| 파일 | 역할 |
|------|------|
| `storageService.ts` | **핵심 데이터 레이어** — 예약 CRUD, 거점, 지점 (Supabase 어댑터) |
| `supabaseClient.ts` | Supabase REST 클라이언트 유틸 |
| `supabaseRuntime.ts` | Supabase URL/키 런타임 설정 |
| `adminAuthService.ts` | 관리자 인증 + 세션 관리 |
| `tossPaymentsService.ts` | Toss 결제 통합 |
| `supabaseStorageUploadService.ts` | 파일 업로드 |
| `trackingService.ts` | 실시간 배송 추적 |
| `claudeService.ts` | Claude AI 연동 |
| `geminiService.ts` | Gemini AI 연동 |

---

## 5. 사용자 예약 플로우 (전체)

```
[1] 랜딩 페이지                    [2] 거점 선택
    LandingRenewal                     LocationsPage
    ├─ Hero + CTA                      ├─ 지도에서 거점 선택
    ├─ 서비스 안내                       ├─ STORAGE / DELIVERY 선택
    └─ "지금 예약" 클릭                  └─ handleLocationSelect()
         │                                  │
         │    preSelectedBooking 저장 (Zustand)
         ▼                                  ▼
[3] 예약 폼 (BookingPage) ─────────────────────
    │
    ├─ Step 01: 일정 & 장소
    │   ├─ 서비스 유형 토글 (DELIVERY ↔ STORAGE)
    │   ├─ 픽업 거점 선택
    │   ├─ 픽업 날짜/시간 선택
    │   ├─ 반환 날짜/시간 (STORAGE) 또는 배송 시간 (DELIVERY)
    │   └─ 공항 안내 표시
    │
    ├─ Step 02: 짐 선택
    │   ├─ 핸드백 (handBag) 수량
    │   ├─ 캐리어 (carrier) 수량
    │   └─ 유모차/자전거 (strollerBicycle) 수량  ※STORAGE만
    │
    ├─ Step 03: 고객 정보 & 동의
    │   ├─ 이름, 이메일
    │   ├─ SNS 채널 (kakao/line/whatsapp)
    │   ├─ 국가 선택
    │   ├─ 이용약관 동의
    │   ├─ 개인정보 동의
    │   └─ 보험 선택 (레벨 0~3)
    │
    └─ Step 04: 가격 확인 & 결제
        ├─ 기본 요금 (실시간 계산)
        ├─ 출발지/도착지 할증
        ├─ 보험료
        ├─ 쿠폰 할인
        ├─ 최종 가격
        └─ "예약하기" 클릭
              │
              ▼
[4] 결제 분기 ─────────────────────────
    │
    ├─ 현재 운영: 현장 결제 / 별도 안내
    │   └─ VITE_DIRECT_BOOKING_MODE 기본값 기준 바로 예약 저장
    │
    └─ 향후 활성화: Toss / PayPal 온라인 결제
        ├─ TossPayments 인증 완료 후 환경변수로 활성화
        ├─ createTossPaymentSession()
        ├─ requestTossCardPayment() → Toss 결제창
        ├─ 성공 → /payments/toss/success
        │         confirmTossPayment()
        └─ 실패 → /payments/toss/fail
              │
              ▼
[5] 예약 저장 ─────────────────────────
    storageService.saveBooking()
    ├─ BookingState → booking_details 테이블 매핑
    ├─ Supabase POST (booking_details)
    └─ on-booking-created 웹훅 호출
              │
              ▼
[6] 후처리 (Edge Function) ────────────
    on-booking-created
    ├─ 예약 코드 생성 (ICN-ADDR-1234 형식)
    ├─ 바우처 이메일 발송
    └─ Google Chat 알림
              │
              ▼
[7] 예약 완료 ─────────────────────────
    BookingSuccess
    ├─ 예약 코드 표시
    ├─ 예약 상세 정보
    ├─ 바우처 다운로드
    └─ 취소 정책 안내
```

---

## 6. 가격 계산 로직

### 보관 (STORAGE) 요금
**파일**: `bookingService.ts`

```
STORAGE_RATES:
  핸드백:  4시간 4,000원 / 4시간 초과 시간당 1,000원 / 1일 8,000원 / 추가일 6,000원 / 7일 44,000원
  캐리어:  4시간 5,000원 / 4시간 초과 시간당 1,000원 / 1일 10,000원 / 추가일 8,000원 / 7일 58,000원
  유모차:  4시간 10,000원 / 4시간 초과 시간당 2,500원 / 1일 14,000원 / 추가일 10,000원 / 7일 74,000원
```

**계산 흐름**:
1. 픽업~반환 시간 차이 (KST 기준)
2. 영업시간 경계 넘으면 1일 요금 적용
3. 짐 유형별 × 수량 합산

### 배송 (DELIVERY) 요금
**파일**: `deliveryStoragePricing.ts`

```
DEFAULT_DELIVERY_PRICES:
  핸드백: 10,000원
  캐리어: 25,000원
  (유모차/자전거: 배송 불가)
```

**계산 흐름**:
1. 기본 배송 요금 (짐 유형 × 수량)
2. 배송일 > 픽업일이면 보관 요금 추가
3. 출발지/도착지 할증 추가

### 공통 추가 요금
```
보험료 = 5,000원 × 보험레벨 × 짐 개수
출발지 할증 = location.originSurcharge
도착지 할증 = location.destinationSurcharge
할인 = 쿠폰 금액 (정액 or 정률)
최종가격 = 기본 + 할증 + 보험 - 할인
```

---

## 7. 핵심 타입

### BookingState
```typescript
{
  // 서비스
  serviceType: 'STORAGE' | 'DELIVERY'
  
  // 장소
  pickupLocation: string       // 거점 ID
  dropoffLocation: string      // 도착 거점 ID
  pickupLoc?: LocationOption   // 거점 상세
  
  // 일정
  pickupDate: string           // YYYY-MM-DD
  pickupTime: string           // HH:MM
  dropoffDate?: string
  deliveryTime?: string
  returnDate?: string
  returnTime?: string
  
  // 짐
  bagSizes: BagSizes           // { handBag, carrier, strollerBicycle }
  
  // 가격
  price: number                // 기본가
  finalPrice: number           // 최종가
  discountAmount?: number
  
  // 고객
  userName: string
  userEmail: string
  snsChannel: string
  snsId: string
  country: string
  
  // 결제
  paymentMethod: string
  paymentProvider?: string
  paymentKey?: string
  
  // 상태
  status: BookingStatus
}
```

### BookingStatus 상태 흐름
```
PENDING → CONFIRMED → STORAGE → TRANSIT → ARRIVED → COMPLETED
                                                   → CANCELLED
                                                   → REFUNDED
```

### LocationOption
```typescript
{
  id: string
  name: string               // + name_en, name_ja, name_zh, name_zh_tw
  type: 'AIRPORT' | 'HOTEL' | 'STATION' | 'PARTNER' | ...
  supportsDelivery: boolean
  supportsStorage: boolean
  lat: number, lng: number
  originSurcharge: number
  destinationSurcharge: number
  businessHours: string      // + 다국어
  commissionRates: { delivery, storage }
}
```

---

## 8. 핵심 파일 맵

| 영역 | 파일 | 줄 수 | 역할 |
|------|------|------|------|
| **라우팅** | App.tsx | 709 | 전체 라우트, 예약 콜백 |
| **예약 폼** | BookingPage.tsx | 1,352 | 4단계 예약 UI + 가격 계산 |
| **예약 완료** | BookingSuccess.tsx | 200+ | 확인 페이지, 바우처 |
| **결제** | tossPaymentsService.ts | 351 | Toss 결제 세션/확인 |
| **보관 가격** | bookingService.ts | 195 | STORAGE_RATES, 보관 가격 |
| **배송 가격** | deliveryStoragePricing.ts | 104 | 배송+보관 복합 가격 |
| **짐 유틸** | bagCategoryUtils.ts | 246 | 짐 검증, 가격 정규화 |
| **데이터 서비스** | storageService.ts | 1,400+ | 전체 CRUD (Supabase 어댑터) |
| **인증** | adminAuthService.ts | 737 | 관리자 로그인/세션 |
| **예약 타입** | booking/types.ts | 101 | BookingState 정의 |
| **거점 타입** | location/types.ts | 70 | LocationOption 정의 |
| **공통 타입** | shared/types.ts | 250 | ServiceType, BagSizes |
| **번역** | translations_split/*.ts | 326KB | 6개 언어 |
| **관리자** | AdminDashboard.tsx | 3,000+ | 19개 탭 대시보드 |
| **랜딩** | LandingRenewal.tsx | — | 12개 섹션 조합 |
| **웹훅** | on-booking-created/index.ts | 267 | 코드생성+이메일+알림 |
| **스토어** | store/bookingStore.ts | 36 | 예약 Zustand 스토어 |

---

## 9. 랜딩 페이지 섹션 구조

```
LandingRenewal
├─ LandingHero              # 히어로 + CTA
├─ LandingPainSection       # 문제 제시 (짐 불편)
├─ LandingHowItWorks        # 이용 방법 (3단계)
├─ LandingPricing           # 요금 안내
├─ LandingFreedomSection    # 자유로운 여행 메시지
├─ LandingVIPSafety         # 안전/VIP 서비스
├─ LandingTrustBadge        # 신뢰 배지
├─ LandingGoogleReviewsStrip # 구글 리뷰 스트립
├─ LandingReviews           # 고객 후기
├─ LandingOperationsMarquee # 운영 지점 마퀴
├─ LandingFAQ               # 자주 묻는 질문
└─ LandingFinalCTA          # 최종 CTA
```

---

## 10. 관리자 대시보드 탭

| # | 탭 | 역할 | 접근 권한 |
|---|-----|------|---------|
| 1 | OverviewTab | KPI + 매출 요약 | super/hq |
| 2 | LogisticsTab | 배송 추적 | super/hq/ops |
| 3 | LocationsTab | 거점 관리 | super/hq |
| 4 | DailySettlementTab | 일일 정산 | super/hq/finance |
| 5 | AccountingTab | 회계 | super/hq/finance |
| 6 | MonthlySettlementTab | 월별 정산 | super/hq/finance |
| 7 | NoticeTab | 공지 관리 | super/hq |
| 8 | PartnershipTab | 제휴 관리 | super/hq |
| 9 | HRTab | 인사 관리 | super/hq |
| 10 | SystemTab | 시스템 설정 | super |
| 11 | ChatTab | 채팅 관리 | super/hq/cs |
| 12 | DiscountTab | 할인 관리 | super/hq |
| 13 | ReportsTab | 리포트 | super/hq |
| 14 | OperationsConsole | 운영 콘솔 | super/hq/ops |
| 15-19 | Editor Tabs | 약관/개인정보/QnA 편집 | super/hq |
