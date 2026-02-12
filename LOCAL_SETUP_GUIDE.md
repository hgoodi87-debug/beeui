# Beeliber 프로젝트 로컬 작업 및 자동 배포 가이드

이 문서는 본인의 노트북에서 작업을 이어가고, 변경 사항이 자동으로 배포되도록 설정하는 방법을 안내합니다.

## 1. 프로젝트 로컬 설정 (노트북에서 최초 1회)

노트북에서 작업을 시작하려면 다음 단계가 필요합니다.

### 필수 소프트웨어 설치

1. **Node.js 설치**: [nodejs.org](https://nodejs.org/)에서 LTS 버전을 설치합니다 (v20 권장).
2. **Git 설치**: [git-scm.com](https://git-scm.com/)에서 설치합니다.
3. **Visual Studio Code 설치**: 추천 에디터입니다.

### 저장소 가져오기 및 의존성 설치

터미널(또는 CMD)에서 다음 명령어를 실행합니다.

```bash
# 저장소 클론 (이미 있는 경우 생략)
git clone <GitHub 저장소 URL>
cd beeliber-global---no-bags,-just-freedom

# 의존성 패키지 설치
npm install
npm run client:install
```

### Firebase 로그인을 위한 설정

명령프롬프트(CMD)에서 실행하세요.

```bash
# Firebase CLI 설치 (없을 경우)
npm install -g firebase-tools

# 로그아웃 후 다시 로그인 (계정 확인)
firebase logout
firebase login
```

---

## 2. 노트북에서 작업하는 방법

1. **코드 수정**: VS Code 등 에디터에서 원하는 코드를 수정합니다.
2. **로컬 서버 실행**: 수정된 내용을 실시간으로 확인하려면 다음 명령어를 사용하세요.

    ```bash
    npm run dev
    ```

    브라우저에서 `http://localhost:5173`으로 접속하여 확인 가능합니다.

---

## 3. 수정 사항 반영 및 자동 배포 (GitHub Actions)

이 프로젝트는 GitHub에 코드를 올리면(Push) 자동으로 빌드되어 배포되도록 설정되어 있습니다.

### 자동 배포 단계

1. **변경 사항 저장 및 커밋**:

    ```bash
    git add .
    git commit -m "수정 내용 설명 (예: 헤더 수정)"
    ```

2. **GitHub에 푸시**:

    ```bash
    git push origin main
    ```

3. **확인**:
    - GitHub 저장소의 **Actions** 탭으로 이동합니다.
    - `Deploy to Firebase Hosting on merge` 워크플로우가 돌아가는지 확인합니다.
    - 작업이 완료되면 `https://beeliber-main.web.app`에 자동으로 반영됩니다.

---

## 4. 로컬에서 수동으로 배포하기 (필요한 경우)

자동 배포에 문제가 생기거나 즉시 반영이 필요한 경우 로컬에서 직접 배포할 수 있습니다.

```bash
# 빌드 (노트북 환경에 따라 오류가 날 수 있음*)
npm run build

# Firebase 배포
firebase deploy --only hosting
```

*\*참고: 현재 로컬 환경의 Node.js 바이너리 충돌 이슈로 인해 `npm run build`가 실패할 수 있습니다. 이 경우 GitHub Actions(자동 배포)를 이용하는 것이 가장 안정적입니다.*

---

## 5. 주요 파일 및 구조

- `client/src/`: 웹사이트 UI 및 로직 (React/Vite)
- `functions/`: 백엔드 서버리스 로직
- `.github/workflows/deploy.yml`: 자동 배포 설정 파일
