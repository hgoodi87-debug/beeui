# Beeliber 구글 애즈 전략 완료 보고서

> 기준일: 2026-04-07  
> 작성자: Claude Code (Beeliber 하네스)  
> 참조: `client/src/utils/gads.ts`, `client/index.html`, `client/App.tsx`, `.agent/skills/beeliber_seo/SKILL.md`

---

## 요약

| 구분 | 항목 | 상태 |
|---|---|---|
| 기술 인프라 | UTM/GCLID 캡처 → sessionStorage 저장 | ✅ 완료 |
| 기술 인프라 | 예약 완료 전환 이벤트 발송 (`gtag`) | ✅ 완료 |
| 기술 인프라 | GA4 측정 ID 연동 (`G-PQBL1SG842`) | ✅ 완료 |
| 기술 인프라 | Google Ads 전환 ID/Label 환경변수 구조 | ✅ 완료 (활성화 대기) |
| 전략 | 타겟 시장 / 키워드 체계 | ✅ 정의 완료 |
| 전략 | 광고 유형별 세그먼트 구성 | ✅ 정의 완료 |
| 실행 | Google Ads 계정 전환 액션 생성 | ⚠️ 미완 (수동 작업 필요) |
| 실행 | 환경변수 `VITE_GOOGLE_ADS_ID` 실값 입력 | ⚠️ 미완 |
| 실행 | 캠페인 실제 집행 | ⚠️ 미완 |

---

## 1. 기술 인프라 (구현 완료)

### 1-1. UTM / GCLID 캡처 시스템

**파일:** `client/src/utils/gads.ts`

SPA(Single Page Application) 특성상 라우팅 중 URL 파라미터가 유실되는 문제를 방지하기 위해 첫 방문 시 광고 파라미터를 sessionStorage에 저장하는 구조 구현 완료.

**캡처 파라미터 목록:**

| 파라미터 | 용도 |
|---|---|
| `utm_source` | 유입 소스 (google, naver 등) |
| `utm_medium` | 매체 유형 (cpc, organic 등) |
| `utm_campaign` | 캠페인 이름 |
| `utm_term` | 검색 키워드 |
| `utm_content` | 광고 소재 구분 |
| `gclid` | Google Click ID (자동 태깅) |
| `gad_source` | Google Ads 소스 구분자 |

**동작 방식:**
- `App.tsx` 최초 마운트 시 `captureAdParams()` 호출 (line 121)
- 이미 저장된 경우 덮어쓰지 않음 → **첫 터치 어트리뷰션** 유지
- `getAdParams()`로 언제든지 저장값 접근 가능 (향후 예약 데이터에 첨부 활용 가능)

---

### 1-2. 예약 완료 전환 이벤트

**파일:** `client/App.tsx` (line 384~389)

예약이 Supabase에 최종 저장된 직후 `fireBookingConversion()` 호출. 중복 발송 없이 정확한 전환 시점에 이벤트 발송.

```typescript
fireBookingConversion({
  value: confirmedBooking.totalPrice ?? 0,  // 예약 금액 (KRW)
  currency: 'KRW',
  transactionId: confirmedBooking.id,        // 예약 고유 ID
});
```

**전환 이벤트 스펙:**
- 이벤트명: `conversion`
- 전송 대상: `{VITE_GOOGLE_ADS_ID}/{VITE_GOOGLE_ADS_CONVERSION_LABEL}`
- 값: 실제 결제 금액 (KRW)
- 거래 ID: Supabase 예약 UUID → **중복 집계 방지**

---

### 1-3. GA4 측정 ID 연동

**파일:** `client/index.html` (line ~42)

```html
<script async src="https://www.googletagmanager.com/gtag/js?id=G-PQBL1SG842"></script>
```

- GA4 측정 ID `G-PQBL1SG842` 활성화 완료
- `gtag` 전역 함수 선언 → `fireBookingConversion()`이 동일 gtag 인스턴스 재사용

---

### 1-4. 사이트 검증 완료 (다중 플랫폼)

`client/index.html` 기준:

| 플랫폼 | 인증 코드 | 상태 |
|---|---|---|
| Google Search Console | `sLGwv--I9zUjxvE6QgM-Ul-1kZFlgMhsFLFBiQsoOIQ` | ✅ |
| Naver 서치어드바이저 | `27b3efc19cfcc972a2ec5b219dc20454c3ec4ea3` | ✅ |
| Bing Webmaster | `9E83A560CF3A42D430E45966271F7AF3` | ✅ |
| Yahoo (y_key) | `9E83A560CF3A42D430E45966271F7AF3` | ✅ |

---

## 2. 광고 전략 (정의 완료)

### 2-1. 타겟 시장

| 우선순위 | 시장 | 언어 | 비중 | 비고 |
|---|---|---|---|---|
| 1 | 대만 | zh-TW | ~60% | 핵심 타겟, x-default |
| 2 | 홍콩 | zh-HK | ~30% | 대만과 용어 차이 주의 |
| 3 | 일본 | ja | ~5% | 성장 시장 |
| 4 | 영어권 | en | ~5% | 글로벌 백업 |

주요 고객: **대만·홍콩 20~30대 여성 여행객 90%**

---

### 2-2. 검색 광고 (Search) 키워드 체계

#### 대만 zh-TW (최우선)

| 캠페인 | 키워드 그룹 | 핵심 키워드 | 매칭 유형 |
|---|---|---|---|
| 브랜드 | 브랜드 | 빌리버, Beeliber | 완전일치 |
| 서울 짐보관 | Head | 首爾 行李寄放, 韓國 行李寄存 | 구문일치 |
| 지역별 | 弘大 | 弘大 行李寄放, 弘大역 짐보관 | 구문일치 |
| 지역별 | 明洞 | 明洞 行李寄放 | 구문일치 |
| 지역별 | 聖水 | 聖水 行李寄放 | 구문일치 |
| 공항 배송 | 仁川 | 仁川機場 行李配送, 仁川機場 當日送達 | 구문일치 |
| 롱테일 | 여행 니즈 | 首爾旅行 行李寄存, 退房後 行李寄放 | 확장검색 |

#### 홍콩 zh-HK (용어 차이 필수 반영)

> **주의:** 대만 "寄放/當日" → 홍콩 "寄存/即日"

| 핵심 키워드 |
|---|
| 首爾 行李寄存 |
| 仁川機場 即日配送 |
| 弘大 行李寄存 |
| 韓國旅行 行李 |

#### 일본 ja

| 핵심 키워드 |
|---|
| ソウル 荷物預かり |
| 仁川空港 荷物配送 |
| ホンデ 荷物預かり |
| 韓国旅行 手荷物 |

---

### 2-3. 광고 유형별 세그먼트

#### A. Google 검색 광고 (RSA — Responsive Search Ads)

**구조 원칙:**
- 헤드라인 15개 준비 (Google이 최적 3개 자동 조합)
- 설명문 4개 준비
- 언어별 광고 세트 분리 (zh-TW / zh-HK / ja / en)

**zh-TW 헤드라인 예시:**
```
首爾行李寄放 | Beeliber
弘大·明洞·聖水 就近寄放
仁川機場當日配送
退房後輕裝暢遊首爾
安心寄放，即走即取
```

**zh-TW 설명문 예시:**
```
弘大、聖水、明洞等主要據點寄放行李，仁川機場當日配送。退房後輕裝暢遊首爾！
無需往返飯店，手提行李一鍵搞定。韓國旅行必備服務。
```

#### B. 디스플레이 / PMAX (Performance Max)

- 타겟: 한국 여행 관심사 (Travel > Asia > Korea) 대만·홍콩 사용자
- 시각 소재: 서울 주요 관광지 + 짐 없이 가벼운 여행객 이미지
- CTA: "지금 예약" / "立即預約" / "今すぐ予約"

#### C. 리마케팅

- 타겟: bee-liber.com 방문 후 예약 미완료 사용자
- 조건: GA4 오디언스 `booking_started_not_completed`
- 소재: "아직 짐 맡기셨나요?" / "還沒預約嗎？"

---

### 2-4. 랜딩 페이지 매핑

| 광고 그룹 | 랜딩 URL |
|---|---|
| 브랜드 (zh-TW) | `bee-liber.com/zh-tw/` |
| 弘大 (zh-TW) | `bee-liber.com/zh-tw/` + 지점 선택 자동화 (향후) |
| 仁川空港 배송 | `bee-liber.com/zh-tw/` (DELIVERY 서비스 탭) |
| 일본어 | `bee-liber.com/ja/` |
| 영어 | `bee-liber.com/en/` |

---

## 3. 전환 추적 설계

```
사용자 광고 클릭
      │
      ▼
bee-liber.com?utm_source=google&utm_medium=cpc&gclid=XXX
      │
      ▼ (App.tsx 마운트 시)
captureAdParams() → sessionStorage 저장 (첫 터치 어트리뷰션)
      │
      ▼ (예약 완료 시)
Supabase에 예약 저장 성공
      │
      ▼
fireBookingConversion({value, currency: 'KRW', transactionId})
      │
      ▼
gtag('event', 'conversion', {send_to: ADS_ID/LABEL, value, ...})
      │
      ▼
Google Ads 전환 집계 완료
```

**전환 가치 측정 방식:** 실제 예약 금액(KRW) → ROAS 계산 가능

---

## 4. 남은 실행 항목 (수동 작업 필요)

### Step 1 — Google Ads 계정 설정

1. [ads.google.com](https://ads.google.com) → 도구 → 전환 → 새 전환 액션 생성
2. 유형: 웹사이트
3. 카테고리: 구매
4. 전환 이름: `예약_완료` (또는 `booking_complete`)
5. 전환 ID와 Label 복사

### Step 2 — 환경변수 설정

```bash
# .env.production 또는 Firebase Hosting 환경변수
VITE_GOOGLE_ADS_ID=AW-XXXXXXXXX        # Google Ads 전환 ID
VITE_GOOGLE_ADS_CONVERSION_LABEL=XXXXX  # 전환 라벨
```

### Step 3 — Google Ads 스크립트 추가 (선택)

`client/index.html`에 GA4 태그 아래 Ads 연결 설정 추가:

```html
<!-- Google Ads 전환 링크 -->
<script>
  gtag('config', 'AW-XXXXXXXXX');
</script>
```

### Step 4 — 캠페인 생성 순서

```
1. 브랜드 캠페인 (Beeliber 검색) — 가장 먼저, 저비용 고효율
2. 首爾 行李寄放 캠페인 (zh-TW 핵심)
3. 仁川機場 行李配送 캠페인 (서비스 특화)
4. 일본어 캠페인 (ja)
5. PMAX 캠페인 (리마케팅 포함)
```

---

## 5. 예산 / 입찰 권고

| 캠페인 | 일 예산 | 입찰 전략 | 비고 |
|---|---|---|---|
| 브랜드 (zh-TW) | ₩20,000 | 클릭수 최대화 | 초기 데이터 수집 |
| 首爾 行李寄放 (zh-TW) | ₩50,000 | 목표 CPA (전환 30개 이상 쌓인 후) | 초기엔 클릭수 최대화 |
| 仁川機場 배송 | ₩30,000 | 클릭수 최대화 | |
| 일본어 | ₩20,000 | 클릭수 최대화 | |
| PMAX / 리마케팅 | ₩30,000 | 전환수 최대화 | |
| **합계** | **₩150,000/일** | — | 월 약 ₩4.5M |

> 전환 데이터 30건 이상 누적 후 **목표 ROAS** 입찰 전환 권장 (현재 서비스 객단가 기준 ROAS 300~500% 목표)

---

## 6. KPI 대시보드 (GA4 연동)

| 지표 | 측정 방법 | 목표 |
|---|---|---|
| 클릭률 (CTR) | GA4 / Google Ads 보고서 | zh-TW 5%+, en 3%+ |
| 전환율 (CVR) | 예약완료 / 방문자 | 3% 이상 |
| 전환당 비용 (CPA) | 광고비 / 전환수 | ₩5,000 이하 |
| ROAS | 전환가치 / 광고비 | 300% 이상 |
| 예약 완료 건수 | GA4 `conversion` 이벤트 | 월 100건+ |

---

## 7. 현재 상태 요약

```
기술 인프라: ████████████ 100% 완료
  ✅ UTM/GCLID 캡처
  ✅ 전환 이벤트 코드
  ✅ GA4 연동
  ✅ 전환 ID/Label 구조 (환경변수 대기)

전략 설계: ████████████ 100% 완료
  ✅ 타겟 시장 정의
  ✅ 키워드 체계 (zh-TW / zh-HK / ja / en)
  ✅ 광고 유형 세그먼트
  ✅ 전환 추적 흐름

실행 (수동 작업):  ████░░░░░░░░ 33% 진행 중
  ✅ Google 사이트 소유 확인
  ❌ Google Ads 전환 액션 생성
  ❌ VITE_GOOGLE_ADS_ID 환경변수 입력
  ❌ 캠페인 실제 생성 및 소재 업로드
```

---

*작성 기준: 2026-04-07 현재 배포된 코드베이스 및 전략 문서 기준*
