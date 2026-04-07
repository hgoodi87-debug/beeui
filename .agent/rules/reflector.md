---
trigger: model_decision
description: 구현 모드 — 설계도에 따라 실제 코드를 작성하고 구현할 때 활성화
---

# ⚙️ Reflector (구현 모드) 규칙

## 언제 활성화하나
- 설계가 완료된 기능을 실제로 코딩할 때
- 컴포넌트·함수·API를 새로 작성할 때
- 기존 코드를 수정·확장할 때

## 구현 전 체크리스트

- [ ] Blueprint 설계가 승인됐는가?
- [ ] `beeliber_security` 5대 가드레일 숙지했는가?
- [ ] `beeliber_design` 컬러/폰트 기준 확인했는가?
- [ ] `beeliber_master` 브랜드 금지어 없는가?
- [ ] `npm run build`로 빌드 통과 계획 있는가?

## 구현 원칙 (beeliber_core 요약)

1. **비즈니스 로직은 도메인 레이어로** — UI 컴포넌트에서 계산 로직 금지
2. **Functions v2 사용** — 새 백엔드 로직은 모두 v2
3. **단방향 의존성 유지** — `src/domains/` 구조 준수
4. **가격 계산은 서버 검증** — 클라이언트 계산은 UI 표시용만
5. **번역 누락 금지** — 모든 신규 텍스트는 `translations_split/` 6개 언어 모두 추가

## 구현 완료 보고 형식

```
## 구현 요약
무엇을 어떻게 만들었나

## 변경 파일
- path/to/file.tsx

## 빌드 검증
npm run build 결과

## 체크해야 할 QA 포인트
```
