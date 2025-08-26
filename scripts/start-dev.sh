#!/bin/bash

# CampusON 개발 환경 시작 스크립트
echo "🚀 CampusON 개발 환경을 시작합니다..."

# 필수 디렉터리 확인
required_dirs=("backend/python-api" "backend/nodejs-api" "frontend" "database")
for dir in "${required_dirs[@]}"; do
    if [ ! -d "$dir" ]; then
        echo "❌ 필수 디렉터리가 없습니다: $dir"
        exit 1
    fi
done

# Python API 시작 (백그라운드)
echo "📄 PDF Parser API 시작 중..."
cd backend/python-api
if [ ! -d "venv" ]; then
    echo "Python 가상환경을 생성합니다..."
    python -m venv venv
fi

source venv/bin/activate || source venv/Scripts/activate
pip install -r requirements.txt
python app/main.py &
PYTHON_PID=$!
cd ../..

# Node.js API 시작 (백그라운드)
echo "⚡ Node.js API 시작 중..."
cd backend/nodejs-api
if [ ! -d "node_modules" ]; then
    echo "Node.js 의존성을 설치합니다..."
    npm install
fi
npm run dev &
NODEJS_PID=$!
cd ../..

# Frontend 시작 (백그라운드)
echo "🎨 Frontend 시작 중..."
cd frontend
if [ ! -d "node_modules" ]; then
    echo "Frontend 의존성을 설치합니다..."
    npm install
fi
npm run dev &
FRONTEND_PID=$!
cd ..

echo ""
echo "✅ 모든 서비스가 시작되었습니다!"
echo "📊 서비스 상태:"
echo "  - PDF Parser API: http://localhost:8001"
echo "  - Node.js API:    http://localhost:3001"
echo "  - Frontend:       http://localhost:3000"
echo ""
echo "🛑 종료하려면 Ctrl+C를 누르세요"

# 종료 시그널 처리
cleanup() {
    echo ""
    echo "🛑 서비스들을 종료합니다..."
    kill $PYTHON_PID $NODEJS_PID $FRONTEND_PID 2>/dev/null
    echo "✅ 모든 서비스가 종료되었습니다."
    exit 0
}

trap cleanup SIGINT SIGTERM

# 무한 대기
wait 