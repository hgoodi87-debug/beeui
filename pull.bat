@echo off
REM 다른 PC에서 바꾼 내용 가져오기 (더블클릭 실행)
cd /d "%~dp0"
git pull --rebase
echo.
echo 최신 상태로 갱신 완료.
timeout /t 2 >nul
