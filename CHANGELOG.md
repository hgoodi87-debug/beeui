# Changelog

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
