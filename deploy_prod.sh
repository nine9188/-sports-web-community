#!/bin/bash
# deploy_prod.sh - 자동화된 오라클 VM 운영 서버 배포 스크립트
set -e

# 로컬 SSH 키 경로 및 서버 IP
SSH_KEY="/home/kim/.ssh/oracle.key"
SERVER_IP="138.2.48.63"
SERVER_USER="ubuntu"
REMOTE_PATH="/home/ubuntu/web2-run"

echo "============================================="
echo "🚀 4590 Football 실서버 자동 배포를 시작합니다."
echo "============================================="

# 1. 로컬 빌드 수행
echo "1. 🛠️  Next.js 빌드 및 컴파일 중..."
npm run build

# 2. 빌드본 압축
echo "2. 📦  배포용 압축 파일 생성 중 (web2-build.tar.gz)..."
# tar 실행 시 백그라운드 로그 파일 변경 경고(exit code 1)를 허용하도록 처리
tar --exclude='node_modules' \
    --exclude='.git' \
    --exclude='.next/cache' \
    --exclude='.next/dev' \
    --exclude='dist' \
    --exclude='web2-build.tar.gz' \
    --exclude='test-build.tar.gz' \
    --exclude='deploy_prod.sh' \
    -czf web2-build.tar.gz . || {
        RC=$?
        if [ $RC -ne 1 ]; then
            echo "❌ tar 압축 실패 (Error Code: $RC)"
            exit $RC
        fi
        echo "⚠️  일부 파일 변동 경고가 발생했으나 압축을 계속 진행합니다."
    }

# 3. SCP로 전송
echo "3. 📡  오라클 VM 서버로 파일 전송 중..."
scp -i "$SSH_KEY" web2-build.tar.gz "$SERVER_USER@$SERVER_IP:/home/ubuntu/"

# 4. 원격지 해제 및 재시작
echo "4. ⚙️  실서버 압축 해제 및 PM2 웹서버 재시작 중..."
ssh -i "$SSH_KEY" "$SERVER_USER@$SERVER_IP" "
  echo '📂 [원격] .env.local 백업 생성...'
  cp $REMOTE_PATH/.env.local $REMOTE_PATH/.env.local.deploy_backup
  
  echo '📦 [원격] 압축 해제...'
  tar -xzf /home/ubuntu/web2-build.tar.gz -C $REMOTE_PATH
  
  echo '🔄 [원격] .env.local 복구...'
  mv $REMOTE_PATH/.env.local.deploy_backup $REMOTE_PATH/.env.local
  
  echo '🧹 [원격] 임시 파일 정리...'
  rm /home/ubuntu/web2-build.tar.gz
  
  echo '🚀 [원격] PM2 프로세스 4590fb 재시작...'
  pm2 restart 4590fb
  
  echo '✅ [원격] 웹서버 재시작 완료!'
"

# 5. 로컬 정리
echo "5. 🧹  로컬 임시 압축 파일 정리 중..."
rm web2-build.tar.gz

echo "============================================="
echo "🎉 배포가 완벽하게 성공했습니다!"
echo "🔗 라이브 사이트: https://4590fb.com"
echo "============================================="
