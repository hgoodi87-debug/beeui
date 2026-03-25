# Beeliber Claude Code 하네스 설정 (v2026.03)

## 프로젝트 개요

**Beeliber (빌리버)** — 서울 여행객 대상 짐보관·공항배송 서비스.
- 웹사이트: bee-liber.com
- 슬로건: 짐 없는 자유, 온전한 만끽
- 주요 고객: 대만·홍콩 20~30대 여성 여행객 (90%)

## 기술 스택

- **Frontend**: React SPA (Vite + TypeScript) + Tailwind CSS
- **Backend**: Firebase Functions v2 (Callable + REST)
- **DB**: Firestore (→ Supabase 전환 진행 중)
- **Auth**: Firebase Auth (→ Supabase Auth 전환 예정)
- **Storage**: Firebase Storage (→ Supabase Storage 전환 예정)
- **Hosting**: Firebase Hosting
- **결제**: Toss Payments (현재 mock 모드, 실배포 대기)

## 작업 브랜치

현재 브랜치: `codex/continue-after-restore-20260322`
메인 브랜치: `main`

## 하네스 구조

```
.agent/
  skills/
    beeliber_master/     # 브랜드·서비스·가격 Master (최우선 참조)
    beeliber_architecture/ # 기술 아키텍처 + Hyper-Gap 로드맵
    beeliber_core/       # DDD 개발 원칙 + 협업 프로토콜
    beeliber_design/     # 비주얼 아이덴티티 + UX 가이드
    beeliber_security/   # CISO 보안 가드레일 (5대 원칙)
    beeliber_supabase/   # Supabase 전환 마스터 플랜
    beeliber_seo/        # 다국어 SEO 전략 (zh-TW 우선)
    beeliber_payments/   # Toss Payments 실배포 가이드
    beeliber_pricing/    # 가격 정책 + 계산 로직 기준
  rules/
    brand_guide_v2.md    # 브랜드 가이드 v2 최우선 적용 규칙
    blueprint.md         # 설계/기획 모드 트리거
    reflector.md         # 구현 모드 트리거
    fix.md               # 버그 수정 모드 트리거
    uipolish.md          # UI 다듬기 모드 트리거
    doc.md               # 문서 작성 모드 트리거
    bug_fix.md           # 버그 수정 상세 절차
    safe_refactor.md     # 안전 리팩토링 절차
    ui_patch.md          # UI 패치 상세 절차
  workflows/
    screenshot-to-code.md # 스샷 → 코드 자동 반영 워크플로우
```

## 스킬 참조 우선순위

작업 시작 전 항상 아래 순서로 참조하세요:

1. `beeliber_master` — 브랜드 금지어, 가격표, 서비스 구조
2. `beeliber_security` — 보안 가드레일 (코드 작성 전 필수)
3. `beeliber_design` — 컬러, 폰트, UX 원칙 (UI 작업 시)
4. `beeliber_core` — 아키텍처 원칙, 팀 프로토콜
5. 도메인별: `beeliber_supabase` / `beeliber_seo` / `beeliber_payments` / `beeliber_pricing`

## 핵심 금지사항 (beeliber_master 요약)

절대 사용 금지 단어: **저렴한, 싼, 할인, 힘들다, 무겁다, 택배, 물류, AI기반솔루션, 호텔픽업, 공항→호텔배송**

## 현재 진행 중인 주요 이니셔티브

| 우선순위 | 이니셔티브 | 상태 | 참조 문서 |
|---|---|---|---|
| 1 | Supabase 마이그레이션 | Phase 0 진단 중 | `beeliber_supabase` |
| 2 | 다국어 SEO 개선 | 전략 수립 완료, 구현 대기 | `beeliber_seo` |
| 3 | Toss Payments 실배포 | 코드 준비 완료, 환경변수 대기 | `beeliber_payments` |
| 4 | 랜딩페이지 리뉴얼 | 진행 중 | `beeliber_design` |

## 빌드 & 배포

```bash
npm run build     # 빌드 검증 (작업 완료 후 필수)
firebase deploy   # 전체 배포
```

## 중요 파일 위치

- 예약 로직: `client/src/domains/booking/`
- 가격 계산: `client/utils/pricing.ts` + `functions/src/shared/pricing.js`
- 랜딩 컴포넌트: `client/components/landing/`
- 관리자 대시보드: `client/components/AdminDashboard.tsx`
- 번역 파일: `client/translations_split/`
- SEO 컴포넌트: `client/components/SEO.tsx`
- Firebase Functions: `functions/src/domains/`
