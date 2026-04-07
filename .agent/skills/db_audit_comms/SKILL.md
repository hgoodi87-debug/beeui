---
name: db_audit_comms
description: "DB 검수 서브에이전트 — COMMUNICATIONS 섹션. chat_sessions, chat_messages, notifications 테이블 검증."
---

# DB 검수: COMMUNICATIONS

## 담당 테이블
- `chat_sessions` — 고객 채팅 세션
- `chat_messages` — 채팅 메시지
- `notifications` — 알림 (kakao/sms/email/slack)

## 검수 체크리스트

### 1. 스키마 무결성
- [ ] chat_sessions.session_id UNIQUE NOT NULL 확인
- [ ] chat_messages.session_id → chat_sessions.session_id (CASCADE) FK 확인
- [ ] chat_messages.role CHECK 제약 (user/model/admin)
- [ ] notifications.reservation_id → reservations (CASCADE) FK 확인
- [ ] notifications.channel CHECK 제약 (kakao/sms/email/slack)
- [ ] notifications.status CHECK 제약 (queued/sent/failed)

### 2. RLS 정책 검증
- [ ] chat_sessions: public ALL (고객 채팅이므로 열려있음)
- [ ] chat_messages: public ALL
- [ ] notifications: employee_all은 super_admin/hq_admin/ops_manager/ops_staff/marketing_staff
- [ ] notifications: customer는 자기 예약의 알림만 조회 가능 (reservation_id → customer_id = auth.uid())

### 3. 데이터 정합성
- [ ] chat_messages에서 session_id가 chat_sessions에 존재하는지
- [ ] notifications에서 reservation_id가 reservations에 존재하는지
- [ ] notifications.status='sent'인 행에 sent_at이 NULL이 아닌지
- [ ] chat_sessions.unread_count와 실제 미읽음 메시지 수 일치 여부

## 검수 SQL 예시

```sql
-- orphan chat messages
SELECT cm.id FROM chat_messages cm
LEFT JOIN chat_sessions cs ON cm.session_id = cs.session_id
WHERE cs.session_id IS NULL;

-- 발송 완료인데 sent_at이 없는 알림
SELECT id, template_code, status, sent_at
FROM notifications
WHERE status = 'sent' AND sent_at IS NULL;

-- unread_count 불일치
SELECT cs.session_id, cs.unread_count,
  (SELECT count(*) FROM chat_messages cm
   WHERE cm.session_id = cs.session_id AND cm.is_read = false) as actual_unread
FROM chat_sessions cs
WHERE cs.unread_count != (
  SELECT count(*) FROM chat_messages cm
  WHERE cm.session_id = cs.session_id AND cm.is_read = false
);
```

## 연관 스킬
- `beeliber_operations` — 운영 하네스 (알림 SLA)
- `beeliber_master` — 브랜드 톤 (고객 메시지)
