# 🚀 Vercel 배포 가이드

이 문서는 CampusON 프로젝트를 [Vercel](https://vercel.com)에 배포하는 방법을 설명합니다.

## 📋 배포 개요

### 서비스 구조
- **Frontend (Next.js)**: 사용자 인터페이스
- **Node.js API**: 웹 서비스 백엔드 (인증, 대시보드)
- **Python API**: PDF 파서 서비스

### 배포 전략
각 서비스를 별도의 Vercel 프로젝트로 배포하여 독립적으로 관리합니다.

## 🛠️ 사전 준비

### 1. 계정 설정
- [Vercel 계정](https://vercel.com/gabrieljung0727s-projects) 로그인
- GitHub/GitLab 연동 설정

### 2. CLI 설치
```bash
npm install -g vercel
vercel login
```

### 3. 환경 확인
```bash
node --version  # 18+ 필요
python --version  # 3.9+ 필요
```

## 🚀 자동 배포 (권장)

### 전체 시스템 배포
```bash
# 프로젝트 루트에서 실행
./scripts/deploy-all-vercel.sh
```

이 스크립트는 다음 순서로 배포합니다:
1. Node.js API → 백엔드 서비스
2. Python API → PDF 파서 서비스  
3. Frontend → 사용자 인터페이스

## 📱 개별 배포

### 1. Frontend 배포

```bash
cd frontend
vercel

# 프로덕션 배포
vercel --prod
```

#### Frontend 환경 변수
Vercel 대시보드에서 설정:
```env
NEXT_PUBLIC_API_URL=https://your-nodejs-api.vercel.app
NEXT_PUBLIC_PARSER_API_URL=https://your-python-api.vercel.app
NEXTAUTH_URL=https://your-frontend.vercel.app
NEXTAUTH_SECRET=your-random-secret-key
```

### 2. Node.js API 배포

```bash
cd backend/nodejs-api
npm run build
vercel --prod
```

#### Node.js API 환경 변수
```env
DATABASE_URL=postgresql://user:password@host:5432/database
SECRET_KEY=your-jwt-secret
NODE_ENV=production
```

### 3. Python API 배포

```bash
cd backend/python-api
vercel --prod
```

#### Python API 환경 변수
```env
PYTHONPATH=/var/task/app
```

## ⚙️ 환경 변수 설정

### Vercel 대시보드에서 설정
1. 프로젝트 선택
2. Settings > Environment Variables
3. 변수 추가 및 저장
4. 재배포 (자동 또는 수동)

### 환경별 설정

#### Development
```env
NODE_ENV=development
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_PARSER_API_URL=http://localhost:8001
```

#### Production
```env
NODE_ENV=production
NEXT_PUBLIC_API_URL=https://campuson-api.vercel.app
NEXT_PUBLIC_PARSER_API_URL=https://campuson-parser.vercel.app
```

## 🗃️ 데이터베이스 설정

### PostgreSQL 옵션

#### 1. Vercel Postgres (권장)
```bash
vercel postgres create campuson-db
```

#### 2. 외부 제공업체
- **Supabase**: 무료 PostgreSQL + Auth
- **Railway**: 간단한 PostgreSQL 호스팅
- **PlanetScale**: 서버리스 MySQL (대안)

### 연결 설정
```env
# Node.js API에 설정
DATABASE_URL=postgresql://username:password@host:5432/database_name
```

## 🔗 도메인 연결

### 1. Vercel 대시보드
1. Project Settings > Domains
2. Add Domain 클릭
3. 원하는 도메인 입력

### 2. DNS 설정
```
Type: CNAME
Name: your-subdomain (또는 @)
Value: cname.vercel-dns.com
```

### 3. SSL 인증서
- Vercel이 자동으로 Let's Encrypt SSL 설정
- 커스텀 SSL 인증서도 지원

## 📊 모니터링 및 로그

### Vercel 대시보드
- **Analytics**: 사용자 통계
- **Functions**: 서버리스 함수 로그
- **Deployments**: 배포 히스토리

### 로그 확인
```bash
# 실시간 로그
vercel logs

# 특정 배포 로그
vercel logs [deployment-url]
```

## 🔄 CI/CD 설정

### GitHub Actions 연동
```yaml
# .github/workflows/deploy.yml
name: Deploy to Vercel
on:
  push:
    branches: [main]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.ORG_ID }}
          vercel-project-id: ${{ secrets.PROJECT_ID }}
```

### 자동 배포 설정
1. GitHub 저장소와 Vercel 프로젝트 연결
2. Git Push 시 자동 배포
3. Preview 브랜치별 미리보기 생성

## 🚨 문제 해결

### 일반적인 문제

#### 1. 빌드 실패
```bash
# 로컬에서 빌드 테스트
npm run build

# 타입 에러 확인
npm run type-check
```

#### 2. API 연결 실패
- 환경 변수 URL 확인
- CORS 설정 점검
- 네트워크 정책 확인

#### 3. 함수 타임아웃
```json
// vercel.json에서 타임아웃 설정
{
  "functions": {
    "src/**/*.ts": {
      "maxDuration": 30
    }
  }
}
```

### 디버깅 도구

#### Vercel CLI
```bash
# 프로젝트 정보
vercel project ls

# 배포 상태
vercel ls

# 실시간 로그
vercel logs --follow
```

#### 브라우저 개발자 도구
- Network 탭에서 API 호출 확인
- Console에서 JavaScript 에러 확인

## 📈 성능 최적화

### Frontend 최적화
- Next.js Image 최적화 활용
- Static Generation (SSG) 적용
- Code Splitting으로 번들 크기 최소화

### API 최적화
- Edge Functions 활용
- 데이터베이스 연결 풀링
- 캐싱 전략 구현

### 전역 최적화
- CDN 활용 (Vercel Edge Network)
- 지역별 배포 (Multi-region)
- 이미지 및 에셋 압축

## 💰 비용 최적화

### Vercel 요금제
- **Hobby**: 개인 프로젝트 (무료)
- **Pro**: 상업적 사용 ($20/월)
- **Enterprise**: 대규모 조직

### 무료 제한
- 월 대역폭: 100GB
- 함수 실행 시간: 10초
- 빌드 시간: 45분

### 최적화 팁
- 불필요한 재배포 방지
- 이미지 최적화로 대역폭 절약
- 함수 실행 시간 단축

## 🔒 보안 설정

### 환경 변수 보안
- 민감한 정보는 환경 변수로 관리
- `.env` 파일은 git에 포함하지 않음
- 개발/프로덕션 환경 분리

### HTTPS 설정
- Vercel이 자동으로 HTTPS 적용
- HSTS 헤더 설정 권장

### 접근 제어
- Vercel Password Protection (Pro 이상)
- IP 화이트리스트 설정
- 팀 멤버 권한 관리

## 📞 지원 및 문의

### 공식 리소스
- [Vercel 문서](https://vercel.com/docs)
- [Vercel Community](https://vercel.com/community)
- [Vercel 지원팀](https://vercel.com/support)

### 프로젝트 관련
- GitHub Issues
- 개발팀 연락처
- 내부 문서: `docs/` 디렉터리

---

**참고**: 이 가이드는 CampusON 프로젝트의 특성에 맞게 작성되었습니다. 
일반적인 Vercel 배포 방법은 [공식 문서](https://vercel.com/docs)를 참조하세요. 