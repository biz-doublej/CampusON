# CampusON Frontend

이 프로젝트는 Next.js와 TypeScript로 구축된 CampusON 교육 플랫폼의 프론트엔드입니다.

## 🚀 Vercel 배포 가이드

### 1. Vercel CLI 설치
```bash
npm install -g vercel
```

### 2. 프로젝트 배포
```bash
# 루트 디렉터리에서 실행
./scripts/deploy-vercel.sh

# 또는 frontend 디렉터리에서 직접 실행
cd frontend
vercel
```

### 3. 환경 변수 설정

Vercel 대시보드 (Project Settings > Environment Variables)에서 다음 변수들을 설정하세요:

#### 필수 환경 변수
```env
NEXT_PUBLIC_API_URL=https://your-backend-api.vercel.app
NEXT_PUBLIC_PARSER_API_URL=https://your-parser-api.vercel.app
NEXTAUTH_URL=https://your-frontend-domain.vercel.app
NEXTAUTH_SECRET=your-secret-key-here
```

#### 선택적 환경 변수
```env
NEXT_PUBLIC_OPENAI_API_KEY=your-openai-key
NEXT_PUBLIC_GEMINI_API_KEY=your-gemini-key
NEXT_PUBLIC_CLAUDE_API_KEY=your-claude-key
```

### 4. 도메인 연결 (선택사항)
1. Vercel 대시보드에서 Domains 탭 클릭
2. Custom Domain 추가
3. DNS 설정 완료

## 🛠️ 로컬 개발

### 환경 설정
```bash
# 의존성 설치
npm install

# 개발 서버 시작
npm run dev

# 빌드 테스트
npm run build

# 타입 체크
npm run type-check
```

### 폴더 구조
```
frontend/
├── pages/              # Next.js 페이지 라우팅
│   ├── index.tsx      # 홈페이지
│   ├── auth/          # 인증 관련 페이지
│   ├── dashboard/     # 대시보드
│   ├── professor/     # 교수용 페이지
│   ├── student/       # 학생용 페이지
│   └── admin/         # 관리자 페이지
├── src/
│   ├── components/    # 재사용 가능한 컴포넌트
│   ├── services/      # API 호출 서비스
│   ├── types/         # TypeScript 타입 정의
│   ├── hooks/         # 커스텀 React 훅
│   └── utils/         # 유틸리티 함수
├── public/            # 정적 파일들
└── styles/            # CSS 파일들
```

## 🔗 API 연결

### 백엔드 서비스
- **Node.js API** (포트 3001): 사용자 관리, 인증, 대시보드
- **Python API** (포트 8001): PDF 파싱, 문서 처리

### API 호출 예시
```typescript
// src/services/api.ts
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;

export const authService = {
  login: async (credentials) => {
    const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentials)
    });
    return response.json();
  }
};
```

## 📱 주요 기능

### 사용자 역할별 기능
- **학생**: 진단 테스트, 학습 분석, 과제 제출
- **교수**: 문제 생성, 학생 관리, 성적 분석
- **관리자**: 시스템 관리, 사용자 관리

### 반응형 디자인
- 모바일 최적화
- 태블릿 지원
- 데스크톱 완전 지원

## 🔒 보안

### 인증
- JWT 토큰 기반 인증
- NextAuth.js 사용
- 역할 기반 접근 제어

### 환경 변수 보안
- `.env.local` 파일 사용 (로컬)
- Vercel 환경 변수 (프로덕션)
- 클라이언트 노출 방지

## 🚨 문제 해결

### 일반적인 문제들

1. **빌드 오류**: `npm run type-check`로 타입 오류 확인
2. **API 연결 실패**: 환경 변수 URL 확인
3. **인증 오류**: NEXTAUTH_SECRET 설정 확인

### 로그 확인
```bash
# Vercel 함수 로그 확인
vercel logs

# 로컬 개발 로그
npm run dev
```

## 📞 지원

- **GitHub Issues**: 버그 리포트 및 기능 요청
- **문서**: `/docs` 디렉터리 참조
- **API 문서**: `/docs/api/README.md` 