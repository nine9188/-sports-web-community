#!/bin/bash

echo "=========================================="
echo "🔍 개발 환경 확인 스크립트"
echo "=========================================="
echo ""

# 색상 정의
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 체크 함수
check_command() {
    if command -v $1 &> /dev/null; then
        VERSION=$($1 --version 2>&1 | head -n 1)
        echo -e "${GREEN}✅ $1 설치됨${NC}: $VERSION"
        return 0
    else
        echo -e "${RED}❌ $1 미설치${NC}"
        return 1
    fi
}

# Node.js 확인
echo "📦 Node.js 환경 확인"
if check_command node; then
    NODE_VERSION=$(node -v | cut -d'v' -f2)
    MAJOR_VERSION=$(echo $NODE_VERSION | cut -d'.' -f1)
    if [ "$MAJOR_VERSION" -lt 18 ]; then
        echo -e "${YELLOW}⚠️  Node.js 18 이상이 필요합니다 (현재: $NODE_VERSION)${NC}"
    else
        echo -e "${GREEN}   ✓ 버전 확인 완료 (18 이상)${NC}"
    fi
else
    echo -e "${RED}   → 설치 필요: https://nodejs.org/ (LTS 버전 권장)${NC}"
fi
echo ""

# npm 확인
echo "📦 npm 확인"
if check_command npm; then
    NPM_VERSION=$(npm -v)
    echo -e "${GREEN}   ✓ 버전: $NPM_VERSION${NC}"
else
    echo -e "${RED}   → Node.js 설치 시 함께 설치됩니다${NC}"
fi
echo ""

# Git 확인
echo "📦 Git 확인"
if check_command git; then
    GIT_VERSION=$(git --version | cut -d' ' -f3)
    echo -e "${GREEN}   ✓ 버전: $GIT_VERSION${NC}"
else
    echo -e "${RED}   → 설치 필요: https://git-scm.com/download/win${NC}"
fi
echo ""

# 프로젝트 의존성 확인
echo "📦 프로젝트 의존성 확인"
if [ -d "node_modules" ]; then
    echo -e "${GREEN}✅ node_modules 폴더 존재${NC}"
    echo "   → 의존성 설치 완료된 것으로 보입니다"
else
    echo -e "${YELLOW}⚠️  node_modules 폴더 없음${NC}"
    echo "   → 'npm install' 실행 필요"
fi
echo ""

# 환경 변수 파일 확인
echo "📦 환경 변수 파일 확인"
if [ -f ".env.local" ]; then
    echo -e "${GREEN}✅ .env.local 파일 존재${NC}"
else
    echo -e "${YELLOW}⚠️  .env.local 파일 없음${NC}"
    echo "   → Supabase 환경 변수 설정 필요"
    echo "   → NEXT_PUBLIC_SUPABASE_URL"
    echo "   → NEXT_PUBLIC_SUPABASE_ANON_KEY"
fi
echo ""

# 요약
echo "=========================================="
echo "📋 다음 단계"
echo "=========================================="
echo ""
echo "1. Node.js가 없다면:"
echo "   → https://nodejs.org/ 에서 LTS 버전 다운로드"
echo ""
echo "2. 의존성 설치:"
echo "   → npm install"
echo ""
echo "3. 환경 변수 설정:"
echo "   → .env.local 파일 생성 및 Supabase 키 설정"
echo ""
echo "4. 개발 서버 실행:"
echo "   → npm run dev"
echo ""






