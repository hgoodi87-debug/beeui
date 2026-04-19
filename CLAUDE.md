# beeliber 프로젝트 작업 규칙

## 파일 위치
- 메인 파일: `index.html` (이 폴더)
- 동일 사본: `C:\Users\money\Downloads\bee-liber-mobile.html` (초기 사본)

작업은 반드시 이 폴더의 `index.html` 에만 한다. Downloads 사본은 무시.

## 변경 후 흐름
1. `index.html` 편집
2. 사용자가 확인하면 커밋·푸시를 바로 진행:
   ```bash
   git add -A && git commit -m "<요약>" && git push
   ```
3. 사용자가 따로 요청하지 않아도 의미 있는 변경 단위마다 자동 커밋한다.

## 커밋 메시지 규칙
- 한국어 1줄 요약, 50자 이내
- 예: `예약 플로우 시간 선택 30분 단위 제한`, `햄버거 메뉴에 법적 정보 추가`

## 프리뷰
- `python -m http.server 8787 --directory .` (혹은 `.claude/launch.json` 의 `beeliber` 사용)
- 모바일 뷰(375×812)로 항상 확인

## 다른 PC에서 작업 시
1. `git clone <repo-url>` 또는 `pull.bat` 더블클릭
2. Claude Code 새 세션에서 "이 폴더 이어서 작업" 이라고만 하면 됨
