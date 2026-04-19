@echo off
REM 이미 연결 완료됨. 새 PC에서 처음 받아올 때는 clone을 쓰세요:
REM   git clone https://github.com/hgoodi87-debug/beeui.git
cd /d "%~dp0"
git remote -v
git status
pause
