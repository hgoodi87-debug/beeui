# Claude Code 에이전트 팀 가이드

> 출처: https://code.claude.com/docs/ko/agent-teams  
> 저장일: 2026-04-09

---

## 에이전트 팀이란?

함께 작동하는 여러 Claude Code 인스턴스를 조율하는 기능. 한 세션이 **팀 리더** 역할을 하여 작업을 조율하고, 팀원들은 독립적으로 작동하며 서로 직접 통신한다.

Subagents와 차이: subagents는 메인 에이전트에게만 결과를 보고하지만, 에이전트 팀원들은 서로 직접 메시지를 주고받는다.

---

## 활성화 방법

기본적으로 비활성화. 두 가지 방법으로 활성화:

**1. settings.json**
```json
{
  "env": {
    "CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS": "1"
  }
}
```

**2. 환경 변수**
```bash
export CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1
```

> Claude Code v2.1.32 이상 필요. `claude --version`으로 확인.

---

## Subagents vs 에이전트 팀 비교

| 항목 | Subagents | 에이전트 팀 |
|------|-----------|------------|
| 컨텍스트 | 자신의 윈도우, 결과를 호출자에게 반환 | 자신의 윈도우, 완전히 독립적 |
| 통신 | 메인 에이전트에게만 보고 | 팀원 간 직접 메시지 전송 |
| 조율 | 메인 에이전트가 모든 작업 관리 | 공유 작업 목록으로 자체 조율 |
| 최적 용도 | 결과만 중요한 집중된 작업 | 논의와 협업이 필요한 복잡한 작업 |
| 토큰 비용 | 낮음 | 높음 (각 팀원이 별도 Claude 인스턴스) |

**선택 기준**: 워커들이 서로 통신해야 하면 에이전트 팀, 아니면 subagents.

---

## 에이전트 팀 시작하기

Claude에게 자연어로 요청:

```text
I'm designing a CLI tool that helps developers track TODO comments across
their codebase. Create an agent team to explore this from different angles:
one teammate on UX, one on technical architecture, one playing devil's advocate.
```

Claude가 공유 작업 목록을 가진 팀을 만들고, 팀원들을 생성하며, 완료 시 정리까지 시도한다.

---

## 팀 제어 방법

### 표시 모드

**In-process 모드** (기본)
- 모든 팀원이 메인 터미널 내 실행
- `Shift+Down`: 팀원 순환
- 입력하면 직접 메시지 전송
- `Enter`: 팀원 세션 보기
- `Escape`: 현재 턴 중단
- `Ctrl+T`: 작업 목록 전환

**분할 창 모드**
- 각 팀원이 자신의 창 보유
- tmux 또는 iTerm2 필요
- 창 클릭으로 직접 상호작용

**모드 설정** (`~/.claude.json`):
```json
{
  "teammateMode": "in-process"
}
```

또는 CLI 플래그:
```bash
claude --teammate-mode in-process
```

### 팀원 수 및 모델 지정

```text
Create a team with 4 teammates to refactor these modules in parallel.
Use Sonnet for each teammate.
```

### 계획 승인 요구 (위험한 작업)

```text
Spawn an architect teammate to refactor the authentication module.
Require plan approval before they make any changes.
```

팀원이 계획 완료 → 리더에게 승인 요청 → 리더 승인/거부 → 승인 시 구현 시작.

### 팀원과 직접 대화

- In-process: `Shift+Down`으로 팀원 전환 후 입력
- 분할 창: 팀원 창 클릭

### 작업 할당 방식

1. **리더 할당**: "A 작업을 B 팀원에게 줘"
2. **자체 요청**: 팀원이 작업 완료 후 다음 작업 자율 선택

### 팀원 종료

```text
Ask the researcher teammate to shut down
```

### 팀 정리

```text
Clean up the team
```

> **주의**: 항상 리더로 정리할 것. 팀원이 정리하면 리소스 불일치 발생.

---

## Hooks로 품질 게이트

| Hook | 트리거 | 사용법 |
|------|--------|--------|
| `TeammateIdle` | 팀원이 유휴 상태 될 때 | 종료 코드 2로 피드백 전송, 계속 작동 |
| `TaskCreated` | 작업 생성 시 | 종료 코드 2로 생성 방지 |
| `TaskCompleted` | 작업 완료 표시 시 | 종료 코드 2로 완료 방지 |

---

## 아키텍처

| 구성 요소 | 역할 |
|-----------|------|
| 팀 리더 | 팀 생성, 팀원 생성, 작업 조율 |
| 팀원들 | 할당 작업 독립 처리 |
| 작업 목록 | 공유 작업 항목 (대기/진행/완료) |
| 메일박스 | 에이전트 간 메시징 |

**저장 위치**:
- 팀 구성: `~/.claude/teams/{team-name}/config.json`
- 작업 목록: `~/.claude/tasks/{team-name}/`

> config.json은 수동 편집 금지. 런타임 상태(세션 ID, tmux 창 ID 등) 보유.

### Subagent 정의 재사용

팀원 생성 시 기존 subagent 타입 참조 가능:

```text
Spawn a teammate using the security-reviewer agent type to audit the auth module.
```

해당 subagent의 시스템 프롬프트, 도구, 모델을 팀원이 상속.

---

## 모범 사례

### 1. 팀원에게 충분한 컨텍스트 제공

팀원은 리더의 대화 기록을 상속하지 않음. 생성 프롬프트에 작업별 세부 사항 포함:

```text
Spawn a security reviewer teammate with the prompt: "Review the authentication module
at src/auth/ for security vulnerabilities. Focus on token handling, session
management, and input validation. The app uses JWT tokens stored in
httpOnly cookies. Report any issues with severity ratings."
```

### 2. 적절한 팀 크기

- **권장**: 3-5명 (병렬 작업과 조율 오버헤드의 균형)
- **팀원당 작업**: 5-6개 유지
- 15개 독립 작업 → 3명 팀원이 좋은 시작점
- 팀원 추가할수록 토큰 비용 선형 증가

### 3. 작업 크기 조정

- **너무 작음**: 조율 오버헤드 > 이점
- **너무 큼**: 체크인 없이 너무 오래 작동, 낭비 위험
- **적절함**: 함수, 테스트 파일, 검토 단위의 명확한 결과물

### 4. 파일 충돌 방지

두 팀원이 같은 파일 편집 시 덮어쓰기 발생. 각 팀원이 다른 파일 집합을 소유하도록 작업 분리.

### 5. 팀원 완료 대기

리더가 팀원을 기다리지 않고 혼자 구현하기 시작하면:

```text
Wait for your teammates to complete their tasks before proceeding
```

---

## 사용 사례 예시

### 병렬 코드 검토

```text
Create an agent team to review PR #142. Spawn three reviewers:
- One focused on security implications
- One checking performance impact
- One validating test coverage
Have them each review and report findings.
```

### 경쟁 가설 디버깅

```text
Users report the app exits after one message instead of staying connected.
Spawn 5 agent teammates to investigate different hypotheses. Have them talk to
each other to try to disprove each other's theories, like a scientific debate.
Update the findings doc with whatever consensus emerges.
```

### 병렬 모듈 개발

```text
Create a team with 4 teammates to refactor the auth, payment, notification,
and reporting modules in parallel. Each teammate owns one module.
```

---

## 주요 제한 사항

| 제한 | 설명 |
|------|------|
| 세션 재개 불가 | `/resume`, `/rewind`로 in-process 팀원 복원 안 됨 |
| 세션당 한 팀 | 새 팀 시작 전 현재 팀 정리 필요 |
| 중첩 팀 없음 | 팀원은 팀 생성 불가, 리더만 가능 |
| 리더 고정 | 팀 생성 세션이 수명 동안 리더 (리더십 이전 불가) |
| 분할 창 제한 | tmux 또는 iTerm2 필요 (VS Code 통합 터미널 등 미지원) |
| 작업 상태 지연 | 팀원이 완료 표시 실패 시 수동 업데이트 필요 |

---

## 빌리버 프로젝트 활용 패턴

빌리버의 `.claude/settings.json`에 이미 활성화 설정 추가 필요:

```json
{
  "env": {
    "CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS": "1"
  }
}
```

**추천 팀 구성 예시:**

```text
// 새 기능 개발
Create an agent team with 3 teammates:
- DB 설계이: booking_details 스키마 설계
- 프론트이: React 예약 폼 컴포넌트
- 테스트이: 통합 테스트 작성

// 버그 조사
Spawn 3 agent teammates to investigate the settlement status bug:
- 한 명은 DB 레이어 조사
- 한 명은 프론트 상태 관리 조사
- 한 명은 Edge Function 조사
각자 발견한 내용을 공유하고 서로의 이론에 도전할 것.
```

---

## 관련 문서

- [Subagents 가이드](https://code.claude.com/docs/ko/sub-agents)
- [Hooks 설정](https://code.claude.com/docs/ko/hooks)
- [비용 및 토큰 사용](https://code.claude.com/docs/ko/costs)
