#!/bin/bash

# 123/1234 폴더로 이동
cd "$(dirname "$0")"

# 현재 위치 확인
echo "📁 Current directory: $(pwd)"

# 변경사항 확인
echo ""
echo "📝 Checking git status..."
git status --short

# 변경사항이 있는지 확인
if [ -z "$(git status --porcelain)" ]; then
    echo ""
    echo "✅ No changes to commit"
    exit 0
fi

# 커밋 메시지 입력받기 (인자로 받거나 기본 메시지 사용)
COMMIT_MSG="${1:-Update: auto deploy}"

echo ""
echo "💾 Adding all changes..."
git add .

echo ""
echo "📦 Committing with message: '$COMMIT_MSG'"
git commit -m "$COMMIT_MSG"

echo ""
echo "🚀 Pushing to GitHub (main branch)..."
git push origin main

echo ""
echo "✅ Deploy complete!"
echo "🔗 Check Vercel dashboard for deployment status"
