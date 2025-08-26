# CampusON 파서 API 개발 가이드

## 📋 문서 개요

백엔드 개발자를 위한 CampusON 파서 시스템 API 개발 가이드입니다. 이 문서들을 통해 프론트엔드와 완벽하게 연동되는 파서 API를 개발할 수 있습니다.

## 📚 문서 구성

### 1. [📋 API 명세서](./parser-api-specification.md)
- **목적**: 프론트엔드와의 API 계약 정의
- **포함 내용**:
  - API 엔드포인트 상세 명세
  - 요청/응답 데이터 구조
  - 에러 코드 및 처리 방법
  - 데이터 모델 정의
  - 보안 고려사항

### 2. [🛠️ 개발 가이드](./parser-development-guide.md)
- **목적**: 실제 코드 구현을 위한 실용적 가이드
- **포함 내용**:
  - FastAPI 애플리케이션 구조
  - 핵심 서비스 구현 예제
  - 데이터 모델 및 API 엔드포인트 코드
  - 성능 최적화 기법
  - 디버깅 팁

### 3. [🔍 PDF 파싱 알고리즘](./pdf-parsing-algorithms.md)
- **목적**: PDF 문서 파싱을 위한 고급 알고리즘 제공
- **포함 내용**:
  - 국가시험 PDF 구조 분석
  - 정규표현식 패턴 모음
  - 지능형 문제 추출 알고리즘
  - 품질 검증 및 오류 복구 기법
  - 성능 최적화 방법

### 4. [🧪 테스트 및 배포 가이드](./testing-deployment-guide.md)
- **목적**: 안정적인 개발 및 배포 환경 구축
- **포함 내용**:
  - 단위/통합/성능 테스트 작성법
  - 디버깅 도구 및 로깅 설정
  - Docker 기반 배포 설정
  - CI/CD 파이프라인 구성
  - 모니터링 시스템 설정

## 🚀 빠른 시작

### 1단계: 환경 설정
```bash
# Python 가상환경 생성
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# 의존성 설치
pip install -r requirements.txt
pip install -r requirements-test.txt
```

### 2단계: 프로젝트 구조 생성
```bash
mkdir -p backend/python-api/{app,tests,logs,uploads}
mkdir -p backend/python-api/app/{api,core,models,services,utils}
mkdir -p backend/python-api/app/api/endpoints
```

### 3단계: 기본 설정 파일 생성
- `.env` 파일 (환경 변수)
- `app/core/config.py` (설정 관리)
- `app/main.py` (FastAPI 애플리케이션)

### 4단계: 개발 시작
1. **API 명세서**를 먼저 읽고 요구사항 파악
2. **개발 가이드**를 참고하여 기본 구조 구현
3. **파싱 알고리즘**을 적용하여 핵심 기능 개발
4. **테스트 가이드**에 따라 테스트 작성 및 검증

## 🎯 개발 우선순위

### Phase 1: 기본 API 구현 (1-2주)
- [ ] FastAPI 애플리케이션 설정
- [ ] 파일 업로드 엔드포인트
- [ ] 기본 PDF 텍스트 추출
- [ ] 간단한 문제 패턴 인식
- [ ] 헬스체크 API

### Phase 2: 파싱 기능 고도화 (2-3주)
- [ ] 고급 정규표현식 패턴 적용
- [ ] 메타데이터 추출 기능
- [ ] 정답 매칭 알고리즘
- [ ] 파싱 품질 검증
- [ ] 오류 처리 강화

### Phase 3: 성능 및 안정성 (1-2주)
- [ ] 비동기 처리 구현
- [ ] 캐싱 시스템 도입
- [ ] 로깅 및 모니터링
- [ ] 단위 테스트 작성
- [ ] 성능 최적화

### Phase 4: 배포 및 운영 (1주)
- [ ] Docker 컨테이너화
- [ ] CI/CD 파이프라인 설정
- [ ] 프로덕션 배포
- [ ] 모니터링 시스템 구축

## 📞 개발 지원

### 프론트엔드 연동 테스트
```bash
# 개발 서버 실행
uvicorn app.main:app --reload --host 0.0.0.0 --port 8001

# API 문서 확인
http://localhost:8001/docs
```

### 디버깅 도구
```bash
# 파서 디버깅 스크립트 실행
python scripts/debug_parser.py sample.pdf

# 테스트 실행
pytest tests/ -v --cov=app
```

### Mock 데이터 활용
개발 초기에는 프론트엔드의 Mock 데이터와 동일한 구조로 응답하여 연동 테스트를 진행할 수 있습니다.

## 🔧 주요 의존성

```txt
# 핵심 프레임워크
fastapi==0.104.1
uvicorn==0.24.0
pydantic==2.5.0

# PDF 처리
pdfplumber==0.10.3
PyPDF2==3.0.1

# 데이터베이스 (선택사항)
asyncpg==0.29.0
sqlalchemy==2.0.23

# 캐싱 (선택사항)
redis==5.0.1

# AI/ML (선택사항)
openai==1.3.8
langchain==0.0.350

# 테스트
pytest==7.4.3
pytest-asyncio==0.21.1
httpx==0.25.2
```

## 📈 성능 목표

### 응답 시간
- **파일 업로드**: < 1초
- **PDF 파싱 (10페이지)**: < 10초
- **파싱 결과 조회**: < 500ms

### 처리 용량
- **동시 업로드**: 10개 파일
- **최대 파일 크기**: 10MB
- **일일 처리량**: 1,000개 파일

### 품질 지표
- **파싱 정확도**: > 95%
- **완성도**: > 90%
- **시스템 가용성**: > 99%

## 🎉 마무리

이 가이드들을 순서대로 따라하시면 프론트엔드와 완벽하게 연동되는 고품질 파서 API를 개발할 수 있습니다.

### 추가 리소스
- [FastAPI 공식 문서](https://fastapi.tiangolo.com/)
- [pdfplumber 문서](https://github.com/jsvine/pdfplumber)
- [Python 정규표현식 가이드](https://docs.python.org/3/library/re.html)
- [pytest 문서](https://docs.pytest.org/)

### 질문이나 지원이 필요하신가요?
개발 중 문의사항이 있으시면 언제든 연락하세요. 프론트엔드 팀과의 원활한 연동을 위해 적극 지원하겠습니다!

---

**Happy Coding! 🚀** 