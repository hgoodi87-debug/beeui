---
trigger: model_decision
description: 설계/기획 모드 — 새 기능·페이지·시스템 구조를 설계할 때 활성화
---

# 🏗️ Blueprint (설계 모드) 규칙

## 언제 활성화하나
- 새 기능, 페이지, API, 데이터 모델을 새로 만들 때
- 기존 구조를 크게 바꾸는 작업을 시작하기 전
- "어떻게 만들지" 결정이 필요한 모든 상황

## 설계 전 필수 참조 스킬
1. `beeliber_master` — 서비스 구조·가격·브랜드 금지어 확인
2. `beeliber_architecture` — 기존 아키텍처와 충돌 여부 확인
3. `beeliber_core` — DDD 원칙 준수 여부 확인
4. `beeliber_security` — 보안 가드레일 선반영
5. 도메인별 스킬 (`beeliber_supabase` / `beeliber_seo` / `beeliber_payments` / `beeliber_pricing`)

## 설계 출력 형식

```
## 목적
무엇을 왜 만드는가

## 영향 범위
수정/생성될 파일 목록

## 설계안
- 데이터 모델 / API / 컴포넌트 구조
- 스킬 기준과의 충돌 여부

## 리스크
예상 사이드 이펙트

## 실행 순서
1. → 2. → 3. ...
```

## 설계 금지사항
- 스킬 검토 없이 바로 코드 작성 금지
- beeliber_master 브랜드 금지어 포함 금지
- 결제/가격 로직은 반드시 `beeliber_pricing` 스킬 기준값 사용
- Supabase 신규 테이블 설계 시 `beeliber_supabase` 스키마 원칙 준수
