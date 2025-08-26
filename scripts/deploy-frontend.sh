#!/bin/bash

# Frontend 배포 스크립트
echo "🎨 Frontend 배포를 시작합니다..."

cd frontend

# 의존성 설치
echo "📦 의존성을 설치합니다..."
npm ci

# TypeScript 타입 체크
echo "🔍 TypeScript 타입을 확인합니다..."
npm run type-check

# ESLint 검사
echo "🔧 코드 품질을 검사합니다..."
npm run lint

# 빌드
echo "🏗️ Production 빌드를 생성합니다..."
npm run build

# 빌드 결과 확인
if [ -d ".next" ]; then
    echo "✅ 빌드가 성공적으로 완료되었습니다!"
    echo "📁 빌드 결과: .next 디렉터리"
    
    # 빌드 크기 정보
    echo "📊 빌드 크기 정보:"
    du -sh .next/
else
    echo "❌ 빌드에 실패했습니다."
    exit 1
fi

echo "🚀 배포가 완료되었습니다!" 