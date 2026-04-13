# 빌리버 MCP 서버 설정 가이드

> 설정 파일: `~/.claude/settings.json`  
> 작성일: 2026-04-09

---

## 현재 상태

| MCP | 용도 | 상태 | 필요 작업 |
|-----|------|------|-----------|
| **slack** | 배포/장애/리뷰 알림 | ⚠️ 토큰 필요 | Bot Token + Team ID 입력 |
| **gdrive** | PRD/브랜드가이드 참조 | ⚠️ 인증 확인 필요 | gcloud 재인증 or OAuth 설정 |
| **github** | 작업 티켓 상태 반영 | ✅ 자동 설정됨 | 없음 |
| **analytics** | 예약/전환 수치 확인 | ⚠️ Property ID 필요 | GA4 숫자 ID 입력 |

---

## 1. Slack MCP 설정

### Slack Bot 앱 만들기
1. https://api.slack.com/apps 접속
2. **Create New App** → **From scratch**
3. App Name: `beeliber-claude`, Workspace 선택
4. **OAuth & Permissions** → **Bot Token Scopes** 추가:
   - `channels:read`
   - `channels:history`
   - `chat:write`
   - `files:read`
   - `groups:read`
   - `im:read`
   - `users:read`
5. **Install to Workspace** → Bot User OAuth Token 복사 (`xoxb-...`)
6. Workspace URL에서 Team ID 확인 (`app.slack.com/client/T0XXXXXXX`)

### settings.json 업데이트
```json
"slack": {
  "env": {
    "SLACK_BOT_TOKEN": "xoxb-여기에-실제-토큰-입력",
    "SLACK_TEAM_ID": "T0XXXXXXXXX"
  }
}
```

### 사용 예시
```text
# Claude에게 요청
슬랙 #deploy 채널에 "배포 완료: v1.2.3" 메시지 보내줘
슬랙 #incidents 채널 최근 메시지 확인해줘
```

---

## 2. Google Drive MCP 설정

현재 `authorized_user` 타입 gcloud 자격증명 사용 중.  
처음 실행 시 브라우저 OAuth 인증이 필요할 수 있음.

### 만약 인증 실패 시
```bash
gcloud auth application-default login --scopes=\
  https://www.googleapis.com/auth/drive.readonly,\
  https://www.googleapis.com/auth/documents.readonly
```

### 사용 예시
```text
# Claude에게 요청
구글 드라이브에서 "빌리버 브랜드가이드" 파일 찾아줘
PRD 최신 버전 내용 요약해줘
드라이브에서 "가격정책" 관련 문서 검색해줘
```

---

## 3. GitHub MCP 설정 (티켓)

✅ 자동 설정 완료 (`gh auth token` 사용)

### 사용 예시
```text
# Claude에게 요청
bcodeoffice/beeliber 레포 열린 이슈 목록 보여줘
이슈 #42 상태 업데이트해줘
PR #15 리뷰 코멘트 확인해줘
새 이슈 만들어줘: "결제 페이지 오류"
```

---

## 4. Analytics MCP 설정 (GA4)

GA4 Property ID (숫자) 가 필요함. Measurement ID(`G-PQBL1SG842`)와 다름.

### Property ID 확인 방법
1. https://analytics.google.com 접속
2. 빌리버 속성 선택
3. **관리** → **속성** → 속성 ID 확인 (예: `123456789`)

### settings.json 업데이트
```json
"analytics": {
  "env": {
    "GA4_PROPERTY_ID": "519026628",
    "GOOGLE_APPLICATION_CREDENTIALS": "/Users/cm/.config/gcloud/application_default_credentials.json"
  }
}
```

### GA4 서비스 계정 권한 확인
GA4 Admin에서 서비스 계정(`application_default_credentials.json`)이 **뷰어** 이상 권한 있어야 함.  
`authorized_user` 타입이라면 gcloud 계정에 GA4 접근 권한 있으면 OK.

### 사용 예시
```text
# Claude에게 요청
이번 주 예약 전환율 확인해줘
어제 booking-success 페이지 도달 수 알려줘
지난 7일 채널별 유입 수 비교해줘
```

---

## MCP 활성화 확인

Claude Code 재시작 후:
```bash
claude mcp list
```

또는 Claude에게:
```text
사용 가능한 MCP 서버 목록 보여줘
```

---

## 트러블슈팅

### MCP 연결 안 될 때
```bash
# 로그 확인
tail -f ~/.claude/debug/*.log

# 특정 MCP 테스트
npx -y @modelcontextprotocol/server-github --help
```

### Slack 권한 오류
→ Bot Token Scopes에서 필요한 권한 재확인 후 재설치

### Google Drive 인증 오류
```bash
gcloud auth application-default revoke
gcloud auth application-default login
```

### GA4 접근 오류
→ Google Analytics Admin에서 해당 계정/서비스계정에 속성 접근 권한 부여
