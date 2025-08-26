#!/bin/bash

# Vercel 배포 스크립트
echo "🚀 Vercel 배포를 시작합니다..."

# 현재 디렉터리 확인
if [ ! -d "frontend" ]; then
    echo "❌ frontend 디렉터리를 찾을 수 없습니다."
    echo "프로젝트 루트에서 실행해주세요."
    exit 1
fi

cd frontend

# Vercel CLI 설치 확인
if ! command -v vercel &> /dev/null; then
    echo "📦 Vercel CLI를 설치합니다..."
    npm install -g vercel
fi

# 의존성 설치
echo "📦 의존성을 설치합니다..."
npm ci

# TypeScript 타입 체크
echo "🔍 TypeScript 타입을 확인합니다..."
npm run type-check

# ESLint 검사
echo "🔧 코드 품질을 검사합니다..."
npm run lint

# 로컬 빌드 테스트
echo "🏗️ 로컬 빌드를 테스트합니다..."
npm run build

if [ $? -eq 0 ]; then
    echo "✅ 로컬 빌드가 성공했습니다!"
else
    echo "❌ 로컬 빌드에 실패했습니다. 오류를 수정하고 다시 시도해주세요."
    exit 1
fi

# Vercel 로그인 확인
echo "🔐 Vercel 로그인을 확인합니다..."
vercel whoami

if [ $? -ne 0 ]; then
    echo "🔑 Vercel에 로그인합니다..."
    vercel login
fi

# 환경 변수 설정 안내
echo ""
echo "⚙️  Vercel 대시보드에서 다음 환경 변수를 설정해주세요:"
echo "  - NEXT_PUBLIC_API_URL: 백엔드 API URL"
echo "  - NEXT_PUBLIC_PARSER_API_URL: 파서 API URL"
echo "  - NEXTAUTH_SECRET: 인증 시크릿 키"
echo ""

# 배포 실행
echo "🚀 Vercel에 배포합니다..."
if [ "$1" = "--production" ]; then
    vercel --prod
else
    vercel
fi

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ 배포가 완료되었습니다!"
    echo "🌐 배포된 URL을 확인하고 환경 변수를 설정해주세요."
    echo ""
    echo "📋 다음 단계:"
    echo "1. Vercel 대시보드에서 환경 변수 설정"
    echo "2. 백엔드 API 서버 배포 (별도 필요)"
    echo "3. 도메인 연결 (선택사항)"
else
    echo "❌ 배포에 실패했습니다."
    exit 1
fi 