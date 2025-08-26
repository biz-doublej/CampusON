# Vercel 배포 가이드

## 📋 개요

CampusON 프론트엔드를 Vercel에 배포하기 위한 완전한 가이드입니다. 
초보자부터 숙련자까지 누구나 쉽게 따라할 수 있도록 단계별로 설명합니다.

## 🚀 빠른 시작

### 전제 조건
- Node.js 18+ 설치
- npm 또는 yarn 설치  
- GitHub, GitLab, 또는 Bitbucket 계정

### 1단계: Vercel CLI 설치
```bash
npm install -g vercel
```

### 2단계: 로그인
```bash
vercel login
```
브라우저에서 계정 연동 완료

### 3단계: 프로젝트 디렉토리로 이동
```bash
cd frontend
```

### 4단계: 배포 실행
```bash
# 신규 프로젝트 배포
vercel

# 기존 프로젝트 업데이트 배포
vercel --prod
```

## 🔧 상세 배포 과정

### 신규 프로젝트 첫 배포

#### 1. 프로젝트 설정
```bash
vercel
```

배포 중 나타나는 질문들:

**Q: Set up and deploy "frontend"?**
```
? Y (Yes)
```

**Q: Which scope do you want to deploy to?**
```
? [본인 계정 선택] (화살표 키로 선택 후 엔터)
```

**Q: Link to existing project?**
```
? N (No) - 새 프로젝트 생성
```

**Q: What's your project's name?**
```
? campuson-parser (또는 원하는 프로젝트명)
```

**Q: In which directory is your code located?**
```
? ./ (기본값, 그냥 엔터)
```

#### 2. 첫 배포 완료
- Preview URL이 생성됩니다 (예: `https://campuson-parser-abc123.vercel.app`)
- 정상 작동 확인 후 프로덕션 배포 진행

#### 3. 프로덕션 배포
```bash
vercel --prod
```
- Production URL 생성 (예: `https://campuson-parser.vercel.app`)

### 기존 프로젝트 업데이트 배포

이미 배포된 프로젝트를 업데이트하는 경우:

```bash
# 방법 1: 바로 프로덕션 업데이트
vercel --prod

# 방법 2: 미리보기 후 승격
vercel
# 확인 후 Dashboard에서 프로덕션 승격
```

## 📁 프로젝트 구조 확인

배포 전 다음 파일들이 올바르게 설정되어 있는지 확인:

### package.json
```json
{
  "name": "campuson-frontend",
  "scripts": {
    "build": "next build",
    "start": "next start"
  }
}
```

### vercel.json (선택사항)
```json
{
  "buildCommand": "npm run build",
  "outputDirectory": ".next",
  "framework": "nextjs",
  "env": {
    "NEXT_PUBLIC_API_URL": "https://api.campuson.com"
  }
}
```

## 🔍 배포 전 체크리스트

### 로컬 빌드 테스트
```bash
# 의존성 설치
npm install

# 빌드 테스트
npm run build

# 로컬 서버 확인
npm start
```

### 코드 품질 확인
```bash
# 린트 체크
npm run lint

# 타입 체크 (TypeScript 사용시)
npm run type-check
```

## 🌍 환경 변수 설정

### Vercel Dashboard에서 설정

1. [Vercel Dashboard](https://vercel.com/dashboard) 접속
2. 프로젝트 선택
3. **Settings** → **Environment Variables**
4. 다음 변수들 추가:

```bash
# API 엔드포인트
NEXT_PUBLIC_API_URL=https://api.campuson.com
NEXT_PUBLIC_PARSER_API_URL=https://parser.campuson.com

# 인증 시크릿 (프로덕션용)
NEXTAUTH_SECRET=your-production-secret-key

# 기타 환경변수
NEXT_PUBLIC_APP_ENV=production
```

### 환경별 설정

#### Development
```bash
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_PARSER_API_URL=http://localhost:8001
```

#### Production
```bash
NEXT_PUBLIC_API_URL=https://api.campuson.com
NEXT_PUBLIC_PARSER_API_URL=https://parser.campuson.com
```

## 🔧 트러블슈팅

### 자주 발생하는 문제들

#### 1. 빌드 실패
```bash
# 캐시 정리
rm -rf .next node_modules package-lock.json
npm install
npm run build
```

#### 2. 권한 오류 (Windows)
```powershell
# PowerShell에서
Remove-Item -Recurse -Force .next -ErrorAction SilentlyContinue
Remove-Item -Recurse -Force node_modules -ErrorAction SilentlyContinue
npm install
```

#### 3. 환경변수 인식 안됨
- Vercel Dashboard에서 환경변수 재설정
- `NEXT_PUBLIC_` 접두사 확인
- 배포 후 다시 빌드

#### 4. 함수 크기 초과 오류
```javascript
// next.config.js
module.exports = {
  experimental: {
    outputFileTracingIncludes: {
      '/api/**/*': ['./node_modules/**/*.wasm'],
    },
  },
}
```

### 로그 확인 방법

#### Vercel CLI로 로그 확인
```bash
# 실시간 로그
vercel logs [deployment-url]

# 특정 함수 로그
vercel logs [deployment-url] --follow
```

#### Dashboard에서 확인
1. Vercel Dashboard → 프로젝트 선택
2. **Deployments** 탭
3. 실패한 배포 클릭 → **Build Logs** 확인

## 🚀 고급 배포 설정

### GitHub 연동 자동 배포

#### 1. GitHub 연동
```bash
# GitHub에 코드 푸시 후
vercel --prod --github
```

#### 2. 자동 배포 설정
- Vercel Dashboard → Settings → Git Integration
- GitHub repository 연결
- Auto-deploy 활성화

#### 3. Branch Protection
```json
// vercel.json
{
  "github": {
    "autoAlias": false,
    "enabled": true,
    "autoJobCancelation": true
  },
  "git": {
    "deploymentEnabled": {
      "main": true,
      "develop": false
    }
  }
}
```

### 커스텀 도메인 설정

#### 1. 도메인 추가
- Vercel Dashboard → 프로젝트 → Settings → Domains
- 커스텀 도메인 입력 (예: `parser.campuson.com`)

#### 2. DNS 설정
도메인 제공업체에서:
```
Type: CNAME
Name: parser (또는 원하는 서브도메인)
Value: cname.vercel-dns.com
```

#### 3. SSL 자동 설정
- Vercel에서 자동으로 Let's Encrypt SSL 인증서 발급
- HTTPS 강제 리디렉션 자동 설정

## 📊 성능 최적화

### 빌드 최적화

#### next.config.js 설정
```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  // 이미지 최적화
  images: {
    formats: ['image/webp', 'image/avif'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
  },
  
  // 번들 크기 최적화
  experimental: {
    optimizeCss: true,
    swcMinify: true,
  },
  
  // 정적 파일 압축
  compress: true,
  
  // 캐시 헤더 설정
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable'
          }
        ]
      }
    ]
  }
}

module.exports = nextConfig
```

### Bundle Analyzer
```bash
# 번들 크기 분석
npm install --save-dev @next/bundle-analyzer

# package.json에 추가
"analyze": "ANALYZE=true next build"

# 실행
npm run analyze
```

## 📝 배포 체크리스트

### 배포 전 확인사항
- [ ] 로컬에서 빌드 성공 확인
- [ ] 환경변수 설정 완료
- [ ] API 엔드포인트 올바른지 확인
- [ ] 린트 오류 해결
- [ ] 타입 오류 해결 (TypeScript)
- [ ] 불필요한 console.log 제거

### 배포 후 확인사항
- [ ] 사이트 정상 접속 확인
- [ ] 주요 기능 동작 테스트
- [ ] API 연동 정상 작동
- [ ] 모바일 반응형 확인
- [ ] SEO 메타태그 확인

## 🔄 CI/CD 자동화

### GitHub Actions 예제
```yaml
# .github/workflows/deploy.yml
name: Deploy to Vercel

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      
      - name: Setup Node.js
        uses: actions/setup-node@v2
        with:
          node-version: '18'
          
      - name: Install dependencies
        run: npm ci
        working-directory: ./frontend
        
      - name: Build project
        run: npm run build
        working-directory: ./frontend
        
      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v20
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.ORG_ID }}
          vercel-project-id: ${{ secrets.PROJECT_ID }}
          working-directory: ./frontend
```

## 📞 지원 및 문의

### 공식 리소스
- [Vercel 공식 문서](https://vercel.com/docs)
- [Next.js 배포 가이드](https://nextjs.org/docs/deployment)
- [Vercel 커뮤니티](https://github.com/vercel/vercel/discussions)

### 프로젝트 관련 문의
배포 관련 문제가 발생하면:
1. 이 문서의 트러블슈팅 섹션 확인
2. Vercel 로그 확인
3. 팀 개발자에게 문의

---

**Happy Deploying! 🚀** 