@echo off
REM 최초 1회만 실행: GitHub 로그인 + 저장소 생성 + 푸시
cd /d "%~dp0"

echo.
echo ========================================
echo   beeliber GitHub 연동 1회 설정
echo ========================================
echo.

where gh >nul 2>&1
if errorlevel 1 (
  echo [!] GitHub CLI (gh) 가 설치되어 있지 않습니다.
  echo     https://cli.github.com/ 에서 설치 후 다시 실행하세요.
  pause
  exit /b 1
)

echo 1) GitHub 로그인을 시작합니다. 브라우저 안내를 따라주세요.
echo.
gh auth status >nul 2>&1
if errorlevel 1 (
  gh auth login
) else (
  echo    이미 로그인 되어 있습니다. 건너뜁니다.
)

echo.
echo 2) 원격 저장소 생성 + 첫 푸시
gh repo view bee-liber >nul 2>&1
if errorlevel 1 (
  gh repo create bee-liber --private --source=. --push --description "beeliber 모바일 웹 프로토타입"
) else (
  echo    저장소가 이미 존재합니다. 원격 연결만 설정합니다.
  for /f "tokens=*" %%i in ('gh api user --jq .login') do set GH_USER=%%i
  git remote add origin https://github.com/%GH_USER%/bee-liber.git 2>nul
  git push -u origin main
)

echo.
echo 완료! 이제부터는 sync.bat 을 더블클릭하면 자동 푸시됩니다.
pause
