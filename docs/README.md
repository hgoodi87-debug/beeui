# Docs Index

> 최종 갱신: 2026-04-17
> 원칙: 실제 존재하는 문서만 기재. 완료된 계획서는 상단에 상태 배너 부착.

---

## 1. 브랜드 & 서비스 기준

| 문서 | 내용 | 상태 |
|---|---|---|
| [`beeliber_brand_guide_v4.md`](beeliber_brand_guide_v4.md) | 브랜드 원문 — 금지어·슬로건·톤앤매너·채널 현황 | 최신 (2026-03-26) |

---

## 2. 아키텍처 & DB

| 문서 | 내용 | 상태 |
|---|---|---|
| [`beeliber_harness_engineering_v1.md`](beeliber_harness_engineering_v1.md) | 하네스 8-Layer 엔지니어링 원문 | 최신 (2026-04-04) |
| [`APP_STRUCTURE_AND_BOOKING_FLOW.md`](APP_STRUCTURE_AND_BOOKING_FLOW.md) | 앱 구조 + 예약 흐름 전체 | 최신 (2026-04-04) |
| [`DATABASE_ERD.md`](DATABASE_ERD.md) | 코어 테이블 ERD 상세 | 최신 (2026-04-04) |
| [`DATABASE_STRUCTURE_MAP.md`](DATABASE_STRUCTURE_MAP.md) | 도메인별 테이블 맵 | 2026-03-31 기준 — CLAUDE.md 최신 |
| [`SUPABASE_STRUCTURE_CONNECTION_GUIDE.md`](SUPABASE_STRUCTURE_CONNECTION_GUIDE.md) | Supabase 구조 연결 요약 (프로젝트 ref: `xpnfjolqiffduedwtxey`, 리전: `ap-southeast-1`) | 2026-03-27 기준 |
| [`AGENT_TEAMS_GUIDE.md`](AGENT_TEAMS_GUIDE.md) | 서브 에이전트 맵·역할 정의 | 최신 |
| [`MCP_SETUP_GUIDE.md`](MCP_SETUP_GUIDE.md) | MCP 서버 설치·연동 가이드 | 최신 |

---

## 3. 결제 & 가격

| 문서 | 내용 | 상태 |
|---|---|---|
| [`PRICING_LOGIC.md`](PRICING_LOGIC.md) | 짐보관·배송 요금 계산 로직 (단가표·계산식·예외처리) | 최신 (2026-04-07) |

---

## 4. 마케팅 & SEO

| 문서 | 내용 | 상태 |
|---|---|---|
| [`SEO_GEO_KEYWORD_PLAN_20260408.md`](SEO_GEO_KEYWORD_PLAN_20260408.md) | Google 검색 조사 기반 SEO/GEO 키워드·랜딩 매칭 실행안 | 2026-04-08 스냅샷 (일부 반영 완료) |
| [`GOOGLE_ADS_STRATEGY_REPORT_20260407.md`](GOOGLE_ADS_STRATEGY_REPORT_20260407.md) | 구글 애즈 기술 인프라 + 키워드 전략 + 캠페인 설계 | ✅ 기술 완료 / ⚠️ 실집행 대기 |
| [`GA_ANALYTICS_REPORT_20260417.md`](GA_ANALYTICS_REPORT_20260417.md) | GA4 주간 트래픽 비판 분석 | 2026-04-17 스냅샷 |

---

## 5. 계획서 (완료/진행 상태 배너 포함)

| 문서 | 내용 | 상태 |
|---|---|---|
| [`SETTLEMENT_SYSTEM_PLAN_20260408.md`](SETTLEMENT_SYSTEM_PLAN_20260408.md) | 예산·정산 체계 3단계 로드맵 | ✅ Phase 1~3 구현 완료 (v1.3.0.0) — 역사 참조용 |
| [`TECH_ROADMAP_DEEP_DIVE_20260417.md`](TECH_ROADMAP_DEEP_DIVE_20260417.md) | Sprint 1–7 기술 기획 심화편 | 진행 중 |

---

## 6. 정리 원칙

- 이 README에 **없는** 문서 참조는 모두 삭제됨(이관·손실). 외부 참조 복구는 git 히스토리 확인.
- 날짜가 붙은 보고서(`*_YYYYMMDD`)는 해당 날짜 스냅샷이며, 최신 정보는 루트 `CLAUDE.md` → `.agent/skills/` 순서로 참조.
- **과거 이관/삭제된 참조 문서** (다른 md에서 링크만 있고 실체 없음):
  - `docs/DATABASE_MIGRATION_CHANGELOG.md` — 존재하지 않음. 마이그레이션 이력은 `supabase/migrations/*.sql` 파일명으로 추적.
  - `docs/ADMIN_QUERY_MAP.md` — 존재하지 않음. 관리자 쿼리는 각 탭 컴포넌트에서 직접 확인.
  - `docs/BRANCH_LOCATION_CONTRACT.md` — 존재하지 않음. `client/services/storageService.ts`의 `getLocations`/`getBranches` 참조.
  - `docs/SEO_GEO_STRATEGY_2026.md` · `docs/SEO_GEO_REPORT_20260407.md` — 존재하지 않음. 현 SEO 실행 상황은 `TODOS.md` G3~G7 참조.

---

## 7. 루트 레벨 md (CLAUDE.md가 최상위 참조)

| 파일 | 역할 |
|---|---|
| `CLAUDE.md` | 하네스 전체 인스트럭션 — 첫 참조 |
| `DONE.md` | 완료 이슈 이력 — 세션 시작 시 먼저 읽어 재조사 방지 |
| `TODOS.md` | 남은 개선 항목 — 우선순위 포함 |
| `CHANGELOG.md` | 버전별 릴리스 노트 |
| `AI_RUNTIME_INSTRUCTIONS.md` | AI 런타임 규칙 (Do/Don't, 검증, 컨텍스트) |
| `BEELIBER_SECURITY_POLICY.md` | 보안 정책 |
| `LOCAL_SETUP_GUIDE.md` | 로컬 개발 환경 셋업 |
