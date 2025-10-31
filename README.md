# CampusON - PDF 파서 시스템

## 📋 프로젝트 개요

CampusON은 국가시험 문제지 PDF를 자동으로 파싱하여 문제, 선택지, 정답을 추출하는 시스템입니다.

## 🏗️ 프로젝트 구조

```
project/
├── frontend/           # Next.js 프론트엔드
├── backend/           # 백엔드 API 서버
│   ├── python-api/    # Python 파서 API
│   ├── nodejs-api/    # Node.js API
│   └── csharp-api/    # C# API
├── database/          # 데이터베이스 스키마
├── docs/             # 프로젝트 문서
├── unity-simulation/ # Unity 시뮬레이션
└── .github/          # GitHub Actions 워크플로우
```

## 🚀 기술 스택

### Frontend
- **Framework**: Next.js 14
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Deployment**: Vercel

### Backend
- **Python API**: FastAPI, pdfplumber
- **Node.js API**: Express.js
- **C# API**: ASP.NET Core

### Database
- **Database**: PostgreSQL
- **ORM**: Various (Prisma, SQLAlchemy, Entity Framework)

## 🔥 주요 기능

### 📄 PDF 파싱
- 국가시험 문제지 PDF 자동 분석
- 문제, 선택지, 정답 추출
- 다양한 PDF 형식 지원

### 🎯 문제 관리
- 추출된 문제 검토 및 수정
- 카테고리별 문제 분류
- 메타데이터 관리

### 🔍 검색 및 필터링
- 과목별, 연도별 문제 검색
- 키워드 기반 검색
- 고급 필터링 옵션

## 🚀 빠른 시작

### 프론트엔드 실행

```bash
cd frontend
npm install
npm run dev
```

브라우저에서 `http://localhost:3000` 접속

### 백엔드 실행

#### Python API
```bash
cd backend/python-api
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8001
```

#### Node.js API
```bash
cd backend/nodejs-api
npm install
npm run dev
```

## 🧠 RAG 지식베이스 운영

- Python API에서 `/api/ai/rag/status`, `/api/ai/rag/ingest`, `/api/ai/rag/upload`, `/api/ai/rag/build`, `/api/ai/rag/query` 엔드포인트로 지식베이스를 관리할 수 있습니다.
- 관리자 프론트엔드에서는 `/admin/rag` 페이지에서 텍스트/파일 업로드, 인덱스 빌드, 질의 실행을 UI로 제어할 수 있습니다.

## 📚 문서

- [Vercel 배포 가이드](./docs/vercel-deployment-guide.md)
- [API 개발 가이드](./docs/api/)
- [시스템 아키텍처](./docs/system-overview.md)

## 🔧 개발 환경 설정

### 필요한 도구
- Node.js 18+
- Python 3.8+
- Git
- Docker (선택사항)

### 환경 변수
```bash
# 프론트엔드 (.env.local)
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_PARSER_API_URL=http://localhost:8001

# 백엔드
DATABASE_URL=postgresql://user:password@localhost:5432/campuson
OPENAI_API_KEY=your-api-key-here
```

## 🚢 배포

### 프론트엔드 (Vercel)
```bash
cd frontend
vercel --prod
```

### 백엔드 (Docker)
```bash
docker-compose up -d
```

## 🧪 테스트

### 프론트엔드 테스트
```bash
cd frontend
npm run test
npm run lint
```

### 백엔드 테스트
```bash
cd backend/python-api
pytest tests/
```

## 📊 성능

- **파싱 속도**: 10페이지 PDF 기준 < 10초
- **정확도**: > 95%
- **동시 처리**: 최대 10개 파일

## 🤝 기여 가이드

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 라이선스

이 프로젝트는 Proprietary License 하에 있습니다. 자세한 내용은 [LICENSE](./LICENSE) 파일을 참조하세요.

라이선스 관련 문의: gabrieljung0727@icloud.com

## 👥 팀

- **Project Lead**: CampusON Team
- **Frontend**: Next.js/React 개발자
- **Backend**: Python/Node.js 개발자
- **DevOps**: Infrastructure 엔지니어

## 📞 지원

- **이슈 리포트**: GitHub Issues
- **기술 문의**: 팀 개발자에게 연락
- **라이선스 문의**: gabrieljung0727@icloud.com

---

Made with ❤️ by CampusON Team 
