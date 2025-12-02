@echo off
chcp 65001 > nul
setlocal enabledelayedexpansion

:: web2 루트로 이동
cd /d "%~dp0"

:: 현재 위치 확인
echo 📁 Current directory: %CD%
echo.

:: 변경사항 확인
echo 📝 Checking git status...
git status --short

:: 변경사항이 있는지 확인
for /f %%i in ('git status --porcelain') do set HAS_CHANGES=1
if not defined HAS_CHANGES (
    echo.
    echo ✅ No changes to commit
    exit /b 0
)

:: 커밋 메시지 (첫 번째 인자 또는 기본값)
set "COMMIT_MSG=%~1"
if not defined COMMIT_MSG set "COMMIT_MSG=Update: auto deploy"

echo.
echo 💾 Adding all changes...
git add .

echo.
echo 📦 Committing with message: '%COMMIT_MSG%'
git commit -m "%COMMIT_MSG%" -m "" -m "🤖 Generated with [Claude Code](https://claude.com/claude-code)" -m "" -m "Co-Authored-By: Claude <noreply@anthropic.com>"

echo.
echo 🚀 Pushing to GitHub (main branch)...
git push origin master:main

echo.
echo ✅ Deploy complete!
echo 🔗 Check Vercel dashboard for deployment status
pause
