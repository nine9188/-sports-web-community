#!/bin/bash

# Git Bash에서 Node.js PATH를 영구적으로 추가하는 스크립트

BASH_PROFILE="$HOME/.bash_profile"
BASH_RC="$HOME/.bashrc"

# Node.js 경로
NODE_PATH="/c/Program Files/nodejs"

# PATH에 이미 추가되어 있는지 확인
if grep -q "nodejs" "$BASH_PROFILE" 2>/dev/null || grep -q "nodejs" "$BASH_RC" 2>/dev/null; then
    echo "✅ PATH에 이미 Node.js가 추가되어 있습니다"
else
    # .bash_profile 또는 .bashrc에 추가
    if [ -f "$BASH_PROFILE" ]; then
        echo "" >> "$BASH_PROFILE"
        echo "# Node.js PATH 추가" >> "$BASH_PROFILE"
        echo "export PATH=\"$NODE_PATH:\$PATH\"" >> "$BASH_PROFILE"
        echo "✅ $BASH_PROFILE에 PATH 추가 완료"
    elif [ -f "$BASH_RC" ]; then
        echo "" >> "$BASH_RC"
        echo "# Node.js PATH 추가" >> "$BASH_RC"
        echo "export PATH=\"$NODE_PATH:\$PATH\"" >> "$BASH_RC"
        echo "✅ $BASH_RC에 PATH 추가 완료"
    else
        # 파일이 없으면 생성
        echo "# Node.js PATH 추가" > "$BASH_PROFILE"
        echo "export PATH=\"$NODE_PATH:\$PATH\"" >> "$BASH_PROFILE"
        echo "✅ $BASH_PROFILE 파일 생성 및 PATH 추가 완료"
    fi
    
    echo ""
    echo "⚠️  터미널을 재시작하거나 다음 명령어를 실행하세요:"
    echo "   source ~/.bash_profile"
    echo "   또는"
    echo "   source ~/.bashrc"
fi





