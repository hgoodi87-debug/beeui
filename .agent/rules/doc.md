---
trigger: model_decision
description: 문서 작성 모드 — 프로젝트 진행 상황, 결정 사항, 가이드를 기록할 때 활성화
---

# 📝 Doc (문서 작성 모드) 규칙

## 언제 활성화하나
- 결정 사항, 진행 상황, 가이드를 `docs/`에 기록할 때
- 스킬 파일(`.agent/skills/`)을 새로 만들거나 업데이트할 때
- "문서화 해줘", "기록해줘", "MD 파일 만들어줘" 요청 시

## 문서 저장 위치

| 유형 | 위치 |
|---|---|
| 운영/기술 기획 문서 | `docs/` |
| 도메인 스킬 (AI 참조용) | `.agent/skills/[name]/SKILL.md` |
| 작업 규칙 | `.agent/rules/` |
| 워크플로우 | `.agent/workflows/` |

## 스킬 파일 작성 형식

```md
---
name: skill_name
description: 한 줄 설명 — 언제 이 스킬을 참조해야 하는가
---

# 제목

상세 원문: docs/관련파일.md  ← 반드시 원본 문서 링크

## 핵심 내용 (요약)
...
```

## 금지사항

- 브랜드 금지어 포함 금지 (`beeliber_master` 참조)
- "비리버" 표기 금지 → "빌리버" 사용
- 가격 숫자를 임의로 변경 금지 → `beeliber_pricing` 기준 사용
- `docs/` 파일은 `README.md` 형식이 아닌 실무 기준서 형식으로 작성
