@echo off
chcp 65001 >nul
echo ==========================================
echo 🔍 개발 환경 확인 스크립트 (Windows)
echo ==========================================
echo.

REM Node.js 확인
echo 📦 Node.js 환경 확인
where node >nul 2>&1
if %errorlevel% equ 0 (
    for /f "tokens=*" %%i in ('node -v') do set NODE_VERSION=%%i
    echo ✅ Node.js 설치됨: %NODE_VERSION%
) else (
    echo ❌ Node.js 미설치
    echo    → 설치 필요: https://nodejs.org/ (LTS 버전 권장)
)
echo.

REM npm 확인
echo 📦 npm 확인
where npm >nul 2>&1
if %errorlevel% equ 0 (
    for /f "tokens=*" %%i in ('npm -v') do set NPM_VERSION=%%i
    echo ✅ npm 설치됨: %NPM_VERSION%
) else (
    echo ❌ npm 미설치
    echo    → Node.js 설치 시 함께 설치됩니다
)
echo.

REM Git 확인
echo 📦 Git 확인
where git >nul 2>&1
if %errorlevel% equ 0 (
    for /f "tokens=*" %%i in ('git --version') do set GIT_VERSION=%%i
    echo ✅ Git 설치됨: %GIT_VERSION%
) else (
    echo ❌ Git 미설치
    echo    → 설치 필요: https://git-scm.com/download/win
)
echo.

REM 프로젝트 의존성 확인
echo 📦 프로젝트 의존성 확인
if exist "node_modules" (
    echo ✅ node_modules 폴더 존재
    echo    → 의존성 설치 완료된 것으로 보입니다
) else (
    echo ⚠️  node_modules 폴더 없음
    echo    → 'npm install' 실행 필요
)
echo.

REM 환경 변수 파일 확인
echo 📦 환경 변수 파일 확인
if exist ".env.local" (
    echo ✅ .env.local 파일 존재
) else (
    echo ⚠️  .env.local 파일 없음
    echo    → Supabase 환경 변수 설정 필요
    echo    → NEXT_PUBLIC_SUPABASE_URL
    echo    → NEXT_PUBLIC_SUPABASE_ANON_KEY
)
echo.

echo ==========================================
echo 📋 다음 단계
echo ==========================================
echo.
echo 1. Node.js가 없다면:
echo    → https://nodejs.org/ 에서 LTS 버전 다운로드
echo.
echo 2. 의존성 설치:
echo    → npm install
echo.
echo 3. 환경 변수 설정:
echo    → .env.local 파일 생성 및 Supabase 키 설정
echo.
echo 4. 개발 서버 실행:
echo    → npm run dev
echo.

pause






