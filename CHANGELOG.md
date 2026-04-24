# Changelog

## [1.4.1.0] - 2026-04-24

### Added
- **이메일 바우처 4단계 체크인 가이드**: 발송 바우처에 4단계 이용 메뉴얼 + 네임택 부착 안내(DELIVERY만 표시) 6개 언어 삽입

### Changed
- **커미션 % → 품목별 고정금액 전환**: 배송/보관 요율 % 방식 폐지, 품목(손가방/캐리어/특수)·서비스별 KRW 고정금액으로 전면 교체
  - 손가방 4시간 2,000원(잠금)·1일 3,000원 / 캐리어 4시간 2,000원·1일 3,000원 / 특수 4시간 3,000원·1일 5,000원
  - 배송: 손가방 2,000원 / 캐리어 3,000원 / 특수 3,000원
  - SystemTab 커미션 UI: 품목/서비스별 편집 테이블로 교체 (일괄 % 변경 버튼 제거)
  - LocationsTab: 지점별 커미션 % 컬럼 제거

### Fixed
- **AccountingTab BranchSettlementPanel**: 날짜 필터 외 전체 예약(allBookings) 전달 수정 — 정산 패널 집계 오류 해결
- **고객 심플QR 내보내기**: 바우처 QR 이미지에 네임택 번호 표시 추가

## [1.4.0.0] - 2026-04-24

### Added
- **예약 완료 페이지 체크인 안내**: 바우처 하단에 4단계 체크인 가이드 (6개 언어 — ko/en/ja/zh/zh-TW/zh-HK) 표시
- **예약 완료 페이지 문의 버튼**: Instagram DM · 웹 챗봇 · 이메일 3종 버튼 추가, 예약 코드가 메일 제목에 자동 삽입
- **챗봇 3탭 구조 (Home/Messages/Help)**: Bounce 애니메이션 스타일 탭 리뉴얼 — 홈탭 빠른 링크 · 메시지탭 대화 · 도움말탭 FAQ
- **챗봇 상담원 연결 웹훅**: 상담원 연결 시 고객정보·대화내역을 전용 웹훅으로 전송
- **쿠키 배너 + Google Consent Mode v2**: GDPR/CCPA 동의 플로우, GCM analytics/ads_storage 연동
- **정산 영수증 업로드**: 일일 정산 지출 영수증 업로드 기능 (Supabase Storage 연동)
- **booking_analytics 뷰**: EMS anon 전용 예약 집계 뷰 — 민감 컬럼 제외
- **지점 운영상태 배지**: 운영중/예약가능/마감 3단계 실시간 배지

### Changed
- **키오스크 장부 리뉴얼**: 보관장부 1열 + A/B/C 구역 3열 카드 레이아웃, 이벤트 할인 버튼 디자인 개선
- **QR 스캔 jsQR 전환**: WebRTC 기반 jsQR 라이브러리로 전환 + 예약 조회 RPC 추가
- **PayPal USD 가격 안내 다국어**: 랜딩·로케이션·예약 페이지 6개 언어 USD 가격 표시
- **히어로 CTA 버튼**: Split 버튼(짐보관 / 공항배송) 구조로 개편
- **캐러셀 이미지 동기화**: 리뷰 이미지 프리미엄 버전으로 통합 + 가격 ₩4,000/₩25,000 통일

### Fixed
- **챗봇 zh-TW 언어 키 불일치**: LABELS 맵 `'zh-TW'` → `'zh-tw'` 수정 — URL 경로 소문자와 불일치로 대만 사용자 전원 영어 폴백되던 버그
- **관리자 대시보드 Edge Function 인증**: anon key Bearer 토큰 → `getActiveAdminRequestHeaders()` 어드민 JWT로 교체 (신뢰경계 위반 수정)
- **chat_sessions RLS 강화**: anon UPDATE `WITH CHECK (is_bot_disabled = false)` — anon이 봇 비활성화 불가하도록 제한
- **admin RPC anon 권한 제거**: `admin_update_booking_details` SECURITY DEFINER 함수에서 anon EXECUTE 권한 철회
- **키오스크 예약 접수 FK**: booking_details 생성 시 reservation_id FK 연결 누락 수정
- **PayPal 결제 취소 안내**: onCancel 6개 언어 안내 메시지 + stale closure 수정
- **SEO 구조화 데이터**: 브랜드 금지어 4건 + JSON-LD 오류 수정
- **frankfurter CORS**: Vite 프록시 + 환경별 URL 분기로 개발환경 CORS 우회
- **바우처 QR 스캔 무반응**: jsQR 전환 후 예약 조회 연동 버그 수정
- **완료 체크박스 독립 컬럼 복구**: 키오스크 탭 체크박스 해제 불가 버그 수정
- **GA4 SPA 라우트 page_view 누락**: 라우트 변경 시 page_view 이벤트 자동 전송 수정
- **모바일 UI 최적화**: 5건 레이아웃 수정

### Security
- `chat_sessions` anon UPDATE 정책: `USING(true)/WITH CHECK(true)` → `WITH CHECK (is_bot_disabled = false)` 강화
- `admin_update_booking_details` RPC: anon EXECUTE 권한 철회 (`REVOKE EXECUTE ... FROM anon`)
- `AdminDashboard` Edge Function 호출: anon key Bearer → admin JWT 인증 헤더로 교체
- **보관번호 신뢰 경계 수정**: `public_create_booking_details_v1` RPC — anon 사용자 storage_numbers 입력 무시, 트리거 강제 실행으로 1~30 번호 카운터 보호

### Added (2026-04-23~24)
- **보관 1~30 번호 자동 할당**: 결제완료 시점 DB 트리거(`trg_assign_storage_numbers_on_payment`)로 지점별·일별 순번 자동 배정 — QR 바우처 즉시 노출
- **Google Chat 알림 채널 분리**: 예약 알림과 챗봇 상담원 연결 알림을 별도 웹훅 채널로 분리

### Fixed (2026-04-23~24)
- **공항 배송 FAQ**: 13시 예약 마감·16~21시 수령·22시 이후 별도 보관비 안내 6개 언어 표시 정정

## [1.3.2.0] - 2026-04-18

### Fixed
- **랜딩→예약 플로우 QA 14건 수정**
  - Instagram 링크 제거 (채널 중단)
  - Footer 전화번호 국제 표기 수정 (`+82 010-` → `+82 10-`)
  - /en/pricing 404 → /en/services 리다이렉트 추가
  - 국가 선택 중복 "Other" 항목 제거
  - 영어 기본 국적 자동선택 US → TW 변경
  - 예약 페이지 제목 한국어 하드코딩 → 다국어 대응
  - 지점 내부 코드(shortCode) 공개 위치 페이지에서 제거 (바우처·관리자는 유지)
  - 디버그 console.log 7건 제거 (스봉이 리포트, Storage loaded, shim)

## [1.3.1.0] - 2026-04-14

### Added
- **키오스크 대용량 수용**: 100개 태그 슬롯 + 언어 팝업 중앙 모달 개편 + 바우처 픽업 사진 지원
- **제브라 라벨 프린터 연동**: `zebraPrintService` 신규 — ZPL 코드 생성 + Zebra Browser Print API 전송, 직원 페이지 라벨 인쇄 버튼 연결
- **키오스크 QR 반납 흐름 개선**: 고객 바우처에서 "직원 전용 반납 완료" 버튼 제거, 직원 관리 페이지(KIOSK 탭)에서만 반납 처리 가능

### Fixed
- **직원 소속지점 수정 불가 버그**: `employment_status 'inactive'` 정규화 + UUID v7 지원
- **완료 탭 기본 날짜**: 과거 이력이 아닌 오늘 날짜로 기본 설정
- **알림 함수**: `on-booking-created` 재배포 + Vault 의존성 제거
- **직원 등록/수정 401 오류**: Edge Function 헤더 분리 수정
- **챗봇 렌더링**: 메시지 로컬 state 즉시 업데이트로 깜빡임 수정
- **익명 예약 INSERT 실패**: `return=minimal`로 SELECT 권한 의존성 제거
- **현금 현장결제 오류**: `DIRECT_BOOKING_MODE=true` 설정 수정
- **SEO 색인 실패 3건 수정**: 구글 서치콘솔 기준 canonical·hreflang 오류 수정
- **배포 후 청크 해시 변경 시 자동 새로고침**: Error Boundary에서 구버전 청크 감지 시 자동 reload

### Changed
- **바우처 언어 팝업**: 키오스크 첫 페이지(`/kiosk/:slug`)에만 표시하도록 범위 축소
- **WebP 이미지 최적화 + 성능 개선**: 키오스크 이미지 포맷 전환 및 초기 로딩 최적화

## [1.3.0.0] - 2026-04-08

### Added
- **정산 시스템 Phase 1~3 완성**: 데이터 정합성 검증 → 월마감·지점지급·크레딧·부분환불 체계 → Supabase Edge Functions 자동화 배포까지 3단계 완전 구현
- **완료 처리 시 정산 자동 확정**: 예약 완료 처리 시 미정산 금융대조로 자동 이동, 정산 확정 후 원래 탭으로 복귀
- **크레딧 계정 시스템**: 부분 환불·크레딧 발행·지점 정산 지급 흐름 DB 지원

### Fixed
- **예약하기 버튼 오류 수정**: `pickup/dropoff_location_id`에 short_code 대신 Supabase UUID 사용 — Postgres `22P02` 오류 근본 해결
- **LocationMap 앱 크래시 수정 (CRITICAL)**: Naver Maps API 500 시 `window.naver.maps`가 null — `window.naver?.maps` null 가드 추가, 지점 카드 클릭 시 전체 화면 오류 방지
- **가격 정책 로직 수정**: 8시간 이상 = 1일 요금, hourlyAfter4h = (1일-4시간) / 4 공식 적용, localStorage 운영 정책값 반영
- **지점 필터링**: INITIAL_LOCATIONS 미등록 미운영 지점 노출 방지, 사용자 위치 기준 가까운 지점 3개 우선 노출 (모바일 포함)
- **관리자 대시보드**: 이동 노선 UUID → 지점명 변환 표시, 정산 확정 후 잘못된 탭 이동 수정

### Changed
- **보관 안내 텍스트 다국어 번역 추가**: `storage_notice_title` / `storage_notice_desc` 키 6개 언어(ko/zh-TW/zh-HK/zh/en/ja) 전체 추가 — 영어 fallback 제거

## [1.2.1.0] - 2026-04-07

### Added
- **빌드 시 sitemap 자동 생성**: `npm run build` 실행 시 `generate-sitemap.mjs` + `generate-robots.mjs` 자동 실행 — 186 URLs (31 routes × 6 langs), `lastmod` 항상 오늘 날짜
- **SEO 지역별 랜딩 페이지**: `StorageLandingPage` 컴포넌트 신규 + `/storage/:slug` 라우트 추가

### Fixed
- **`index.html` x-default**: 주요 고객(대만·홍콩 90%) 기준으로 기본 언어를 zh-TW로 변경
- **브랜드 오타 수정**: "비리버" → "빌리버" (seoLocations.ts 2곳)
- **테스트 동기화**: bookingService 요금 로직 변경 후 테스트 기댓값 미반영 수정 (hourlyAfter4h 상한, 24h 초과 extraDay 단위 과금)

## [1.2.0.0] - 2026-04-07

### Added
- **바우처 재발송**: 수정 내용 + 운영 메모 포함하여 재발송
- **예약 세부사항**: 국가 필드를 연락처 앞으로 이동

### Fixed
- **이메일 바우처 픽업시간 오표시**: 보관 예약에서 "도착 일정"에 픽업 시간이 잘못 표시되던 버그 수정 — 영업시간 단축에 맞춰 이메일 정확도 개선
- **이메일 바우처 도착 일정**: 배송 시간 없는 보관 예약에서 "도착 일정" 행이 빈 값으로 표시되던 버그 수정 (값 없으면 행 숨김)
- **예약 세부사항 저장**: `admin_note` 컬럼 추가로 PATCH 400 오류 해결
- **지점 대시보드**: 지점 관리자 진입 불가 버그 수정
- **QR 스캔 페이지**: 로그인 게이트 제거로 직원 스캔 원활화
- **UUID 검증**: 정규식 완화 + 일괄 처리 버그 수정
- **바우처 수하물**: bag_summary 중복 표기 수정
- **중복 예약 감지**: 10분 이내 동일 예약 시 확인 다이얼로그

### Changed
- **보관 지점 영업시간**: 전 지점 -1시간 단축 (공항 제외)
- **코드 정리**: 중복 제거, 레거시 주석, debug log 삭제

## [1.1.0] - 2026-04-06

### Features
- **AI 검수 시스템**: Claude 어드민 AI 검수 생성 + 검수함 탭 (`feat(ai)`)
- **Realtime**: Supabase Realtime 채널 전환 (`feat(realtime)`)
- **네임태그**: 배정 UI + 환율우대 쿠폰 + QR 직원 스캔 연결 (`feat(booking)`)
- **PayPal 결제**: 샌드박스 연동 + Edge Function 보안 수정 (`feat(payments)`)
- **랜딩페이지**: 비로그인 예약 버튼 → 로그인 모달 게이트 (`feat(landing)`)
- **Gemini 챗봇**: chat-ai Edge Function 추가 (6개 언어, FAQ 자동응답, 에스컬레이션)
- **서비스 페이지**: 가격 섹션 추가
- **GA4**: G-PQBL1SG842 측정 ID 설정 + 표준 정적 스크립트
- **지점 다국어**: zh-TW/zh-HK 지원 추가

### Bug Fixes
- **미정산 정산 오류**: reservation_code 폴백 추가로 35개 skip 문제 해결 (`fix(admin)`)
- **Google Search Console hreflang**: ko-KR→ko, ja-JP→ja 코드 수정, x-default→/zh-tw, 인라인 JS lang prefix 제거 (`fix(seo)`)
- **AI 검수 RPC**: approve/reject에서 p_reviewer_id 클라이언트 전달 제거 → auth.uid() 사용 (감사 로그 위조 방지)
- **on-booking-created**: UPDATE 이벤트 무시 — 중복 알림 방지
- **예약 상태**: 완료 후 목록 즉시 숨김 + ALL 탭 완전 숨김
- **예약 버그**: INSERT→PATCH 분리로 400 오류 해결, PostgREST 400 화이트리스트 적용
- **보안 P0**: 크레딧 함수 권한 차단, Admin fallback, Vault hard-fail, OWASP 취약점 3개
- **i18n**: BranchDetails zh-TW 언어 표시, 지점 목록 카드 전 언어 번역
- **QA 버그 8개**: 언어 스위처, 여행 팁 링크, Instagram 제거, GA4 빈 ID 방지, 모바일 스플래시, Vision 페이지 다국어
- **랜딩**: 그라디언트 오버레이 pointer-events-none

### Design (design-review 7개 패스 적용)
- FINDING-001: 전역 focus-visible 링 (WCAG 2.1 AA) + 금지 카피 제거
- FINDING-002: 파트너십 아이콘 bee-yellow 통일
- FINDING-003: 서비스 페이지 이모지 → Lucide 아이콘
- FINDING-004: Navbar touch target 44px, Logo h1→span
- FINDING-005: 푸터 링크 44px, 소셜 아이콘 44px, 폰트 패밀리 3개로 정리
- FINDING-006: ServicesPage AI slop 파란색 제거
- FINDING-007: 헤딩 text-wrap: balance
- FINDING-008: 이미지 loading=lazy 명시
- FINDING-009: 지점 빈 상태 메시지 개선
- FINDING-010: 지점 레이블 P/R → DROP/PICK
- FINDING-012: 서비스 푸터 이모지 제거
- 네임태그 UI 디자인 리뷰 7개 패스

### Database Migrations
- `20260406000003`: approve/reject RPC 보안 강화 — reviewer_id 클라이언트 주입 방지

### SEO
- MULTILANG_ROUTE_META 추가 — 10개 라우트 × 6개 언어 타이틀/설명/키워드
- sitemap.xml: /booking 거래성 페이지 제거, lastmod 갱신
- hreflang 정적 HTML + 인라인 JS + React Helmet 3중 레이어 동기화
