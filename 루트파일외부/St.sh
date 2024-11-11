#!/bin/zsh

echo "📱 전시 웹 애플리케이션 시작하기..."

# 현재 스크립트의 디렉토리로 이동
cd "$(dirname "$0")/graduation_exhibition_KYS-main"

# Node.js 버전 확인 및 설치
if ! command -v node &> /dev/null || [ "$(node -v | cut -d. -f1 | tr -d 'v')" != "20" ]; then
    echo "❌ Node.js 20 버전이 필요합니다. 설치를 시작합니다..."
    curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
    source ~/.zshrc
    nvm install 20
    nvm use 20
    echo "✅ Node.js 20 설치 완료"
fi

# Python 패키지 설치 확인
echo "🐍 Python 패키지 설치 확인 중..."
pip3 install mediapipe numpy websockets

# Node.js 의존성 설치
echo "📦 Node.js 패키지 설치 중..."
npm install

# Vision 서비스 시작
echo "👀 Vision 서비스 시작 중..."
python3 vision.py &
VISION_PID=$!

# 개발 서버 시작
echo "🚀 개발 서버 시작 중..."
npm run dev &
DEV_PID=$!

# 브라우저에서 열기
echo "🌐 브라우저 실행 중..."
sleep 5
open http://localhost:3000

echo "✨ 전시가 실행되었습니다!"
echo "❗ 종료하려면 Ctrl+C를 누르세요..."

# 프로세스 종료 처리
trap 'kill $VISION_PID $DEV_PID; exit' INT TERM

# 프로세스가 종료될 때까지 대기
wait