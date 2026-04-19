@echo off
REM 변경사항을 GitHub에 한 번에 올림 (더블클릭 실행)
cd /d "%~dp0"

git diff --quiet && git diff --cached --quiet
if not errorlevel 1 (
  echo 변경사항이 없습니다.
  timeout /t 2 >nul
  exit /b 0
)

for /f "tokens=1-5 delims=/: " %%a in ('echo %date% %time%') do set STAMP=%%a-%%b-%%c %%d:%%e

git add -A
git commit -m "update %STAMP%"
git push

echo.
echo 동기화 완료.
timeout /t 2 >nul
