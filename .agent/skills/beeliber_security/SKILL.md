---
name: beeliber_security
description: CISO-level security guardrails for preventing common AI-generated vulnerabilities in web applications.
---

# 🛡️ Beeliber CISO Security Guardrails

이 스킬은 Beeliber 프로젝트의 모든 코딩 작업에서 발생할 수 있는 보안 취약점을 원천 차단하기 위한 **최우선 강제 지침**입니다. 사장님(CISO)의 명령에 따라 다음 5대 가드레일을 철저히 준수하세요.

## 1. 🔍 입력 검증 및 출력 인코딩 (Input Validation & Output Encoding)

- **원칙**: 모든 외부 입력값(사용자 입력, URL 파라미터 등)은 **신뢰할 수 없는 것**으로 간주합니다.
- **실행**:
    - 서버 단에서 모든 입력값에 대한 철저한 검증(Type, Length, Format) 및 살균(Sanitization)을 수행하세요.
    - XSS(Cross-Site Scripting) 방지를 위해 HTML 렌더링 전 모든 특수 문자를 반드시 이스케이프(Escape) 처리하세요.
    - `dangerouslySetInnerHTML` 같은 위험한 속성 사용은 극도로 지양하며, 필요시 반드시 검증된 라이브러리를 사용하세요.

## 2. 🔐 BOLA 및 인가 방어 (BOLA & Authorization)

- **원칙**: 객체(데이터)에 접근하거나 수정하는 모든 API는 반드시 권한을 재검증해야 합니다.
- **실행**:
    - Broken Object Level Authorization (BOLA) 방지를 위해, 요청한 사용자의 세션/토큰이 해당 데이터의 **실제 소유자**인지 확인하는 로직을 무조건 작성하세요.
    - 단순히 ID 값만으로 데이터를 반환하지 말고, 하위 쿼리나 필터링을 통해 권한을 강제하세요. (예: `db.collection('orders').where('userId', '==', currentUser.uid)`)

## 3. 💉 주입 공격 방지 (SQLi/NoSQL Injection Prevention)

- **원칙**: 쿼리 생성 시 신뢰할 수 없는 데이터를 직접 포함시키지 않습니다.
- **실행**:
    - 단순 문자열 연결(String concatenation) 방식을 절대 사용하지 마세요.
    - 반드시 **매개변수화된 쿼리(Parameterized queries)**나 프로젝트에서 사전에 검증된 ORM/SDK(Firebase SDK 등)를 사용하세요.

## 4. 🤫 시크릿 관리와 하드코딩 금지 (Secrets Management)

- **원칙**: 민감 정보는 코드베이스에 절대 노출되지 않아야 합니다.
- **실행**:
    - API 키, 데이터베이스 비밀번호, 인증 토큰 등은 소스 코드 내에 **절대 하드코딩하지 마세요.**
    - 반드시 **환경 변수(.env)**나 Firebase Secrets Manager 등 안전한 Vault 참조를 사용하도록 코드를 작성하세요.
    - `.gitignore`에 민감 파일이 포함되어 있는지 주기적으로 확인하세요.

## 5. 🚑 안전한 에러 핸들링 (Secure Error Handling)

- **원칙**: 에러 메시지는 사용자에게 최소한의 정보만 제공하며, 시스템 내부 구조를 노출하지 않습니다.
- **실행**:
    - 시스템 내부 구조, 스택 트레이스(Stack trace), 내부 경로 등의 정보가 사용자 화면이나 API 응답(Response)에 노출되지 않도록 하세요.
    - 에러 발생 시 사용자에게는 "요청을 처리하는 중 오류가 발생했습니다"와 같은 일반적인 메시지를 보여주고, 상세 로그는 서버 측 보안 로깅 시스템에만 남기세요.

---
> [!IMPORTANT]
> "보안은 타협의 대상이 아닙니다. 비리버의 신뢰는 완벽한 데이터 보호에서 시작됩니다. 💅🛡️✨"
