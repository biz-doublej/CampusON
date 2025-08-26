#!/bin/bash

# 모든 서비스 Vercel 배포 스크립트
echo "🚀 CampusON 전체 시스템을 Vercel에 배포합니다..."

# Vercel CLI 설치 확인
if ! command -v vercel &> /dev/null; then
    echo "📦 Vercel CLI를 설치합니다..."
    npm install -g vercel
fi

# Vercel 로그인 확인
echo "🔐 Vercel 로그인을 확인합니다..."
vercel whoami

if [ $? -ne 0 ]; then
    echo "🔑 Vercel에 로그인합니다..."
    vercel login
fi

echo ""
echo "📋 배포 순서:"
echo "1. Node.js API (백엔드 웹 서비스)"
echo "2. Python API (PDF 파서)"
echo "3. Frontend (Next.js)"
echo ""

# 1. Node.js API 배포
echo "⚡ 1/3: Node.js API 배포 중..."
cd backend/nodejs-api

if [ ! -d "node_modules" ]; then
    echo "📦 의존성을 설치합니다..."
    npm ci
fi

echo "🏗️ TypeScript 빌드..."
npm run build

echo "🚀 Vercel에 배포..."
vercel --prod --yes

if [ $? -eq 0 ]; then
    echo "✅ Node.js API 배포 완료!"
    NODEJS_URL=$(vercel --prod --silent 2>/dev/null | tail -1)
    echo "🔗 URL: $NODEJS_URL"
else
    echo "❌ Node.js API 배포 실패!"
    exit 1
fi

cd ../..

# 2. Python API 배포
echo ""
echo "🐍 2/3: Python API 배포 중..."
cd backend/python-api

echo "🚀 Vercel에 배포..."
vercel --prod --yes

if [ $? -eq 0 ]; then
    echo "✅ Python API 배포 완료!"
    PYTHON_URL=$(vercel --prod --silent 2>/dev/null | tail -1)
    echo "🔗 URL: $PYTHON_URL"
else
    echo "❌ Python API 배포 실패!"
    exit 1
fi

cd ../..

# 3. Frontend 배포
echo ""
echo "🎨 3/3: Frontend 배포 중..."
cd frontend

if [ ! -d "node_modules" ]; then
    echo "📦 의존성을 설치합니다..."
    npm ci
fi

echo "🔍 TypeScript 타입 체크..."
npm run type-check

echo "🏗️ 빌드 테스트..."
npm run build

echo "🚀 Vercel에 배포..."
vercel --prod --yes

if [ $? -eq 0 ]; then
    echo "✅ Frontend 배포 완료!"
    FRONTEND_URL=$(vercel --prod --silent 2>/dev/null | tail -1)
    echo "🔗 URL: $FRONTEND_URL"
else
    echo "❌ Frontend 배포 실패!"
    exit 1
fi

cd ..

# 배포 완료 안내
echo ""
echo "🎉 모든 서비스 배포가 완료되었습니다!"
echo ""
echo "📋 배포된 서비스 URL:"
echo "  🎨 Frontend:    $FRONTEND_URL"
echo "  ⚡ Node.js API: $NODEJS_URL"
echo "  🐍 Python API:  $PYTHON_URL"
echo ""
echo "⚙️  다음 단계:"
echo "1. Vercel 대시보드에서 각 프로젝트의 환경 변수 설정"
echo "2. Frontend 프로젝트에 API URL 환경 변수 추가:"
echo "   - NEXT_PUBLIC_API_URL=$NODEJS_URL"
echo "   - NEXT_PUBLIC_PARSER_API_URL=$PYTHON_URL"
echo "3. 데이터베이스 연결 설정 (PostgreSQL)"
echo "4. 도메인 연결 및 SSL 설정 (선택사항)"
echo ""
echo "📖 자세한 설정 방법: frontend/README.md 참조" 