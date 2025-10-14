# 테스트 및 배포 가이드

## 🧪 테스트 전략

### 테스트 환경 설정

#### 1. 테스트 의존성 설치

**`requirements-test.txt`**
```txt
# 기본 의존성
fastapi==0.115.9
uvicorn==0.30.6
pydantic>=2.7,<3
pdfplumber==0.10.3

# 테스트 의존성
pytest==7.4.3
pytest-asyncio==0.21.1
pytest-cov==4.1.0
httpx==0.25.2
faker==19.12.0
factory-boy==3.3.0

# 개발 도구
black==23.11.0
flake8==6.1.0
mypy==1.7.1
pre-commit==3.5.0
```

#### 2. pytest 설정

**`pytest.ini`**
```ini
[tool:pytest]
minversion = 6.0
testpaths = tests
python_files = test_*.py
python_classes = Test*
python_functions = test_*
addopts = 
    --strict-markers
    --disable-warnings
    --cov=app
    --cov-report=term-missing
    --cov-report=html:htmlcov
    --cov-fail-under=80
asyncio_mode = auto
```

### 테스트 케이스 작성

#### 1. 단위 테스트

**`tests/test_parser_service.py`**
```python
import pytest
import tempfile
import os
from pathlib import Path
from app.services.parser_service import PDFParserService, ParsingError

@pytest.fixture
def parser_service():
    return PDFParserService()

@pytest.fixture
def sample_pdf_text():
    return """
    2023년도 물리치료사 국가시험 문제지
    
    1. 다음 중 물리치료사의 주요 역할은?
    1) 환자 진단
    2) 환자 재활
    3) 약물 처방
    4) 수술 집도
    5) 의료기기 판매
    
    2. 근육의 기능이 아닌 것은?
    ① 움직임 생성
    ② 자세 유지
    ③ 열 생산
    ④ 혈액 생성
    ⑤ 관절 보호
    
    정답
    1번: 2
    2번: ④
    """

@pytest.fixture
def create_test_pdf(sample_pdf_text):
    """테스트용 PDF 파일 생성"""
    with tempfile.NamedTemporaryFile(suffix='.pdf', delete=False) as tmp_file:
        # 실제로는 reportlab 등을 사용해서 PDF 생성
        # 여기서는 간단히 텍스트 파일로 대체
        tmp_file.write(sample_pdf_text.encode())
        tmp_file.flush()
        yield tmp_file.name
    
    # 정리
    os.unlink(tmp_file.name)

class TestPDFParserService:
    
    @pytest.mark.asyncio
    async def test_parse_pdf_success(self, parser_service, create_test_pdf):
        """PDF 파싱 성공 테스트"""
        result = await parser_service.parse_pdf(create_test_pdf)
        
        assert result is not None
        assert len(result.questions) == 2
        assert result.questions[0].number == 1
        assert "물리치료사" in result.questions[0].content
        assert len(result.questions[0].options) == 5
        assert result.questions[0].answer == "2"

    @pytest.mark.asyncio
    async def test_parse_invalid_file(self, parser_service):
        """잘못된 파일 파싱 테스트"""
        with pytest.raises(ParsingError):
            await parser_service.parse_pdf("nonexistent.pdf")

    def test_extract_metadata(self, parser_service, sample_pdf_text):
        """메타데이터 추출 테스트"""
        metadata = parser_service._extract_metadata(sample_pdf_text, None)
        
        assert metadata.year == 2023
        assert "물리치료" in metadata.subject
        assert "국가시험" in metadata.title

    def test_normalize_option_key(self, parser_service):
        """선택지 키 정규화 테스트"""
        assert parser_service._normalize_option_key("①") == "1"
        assert parser_service._normalize_option_key("가") == "1"
        assert parser_service._normalize_option_key("A") == "1"
        assert parser_service._normalize_option_key("1") == "1"

    def test_extract_questions(self, parser_service):
        """문제 추출 테스트"""
        text = """
        1. 첫 번째 문제입니다.
        1) 선택지1
        2) 선택지2
        
        2. 두 번째 문제입니다.
        1) 답1
        2) 답2
        """
        
        questions = parser_service._extract_questions(text)
        
        assert len(questions) == 2
        assert questions[0].number == 1
        assert "첫 번째" in questions[0].content
        assert "1" in questions[0].options
        assert "2" in questions[0].options

    def test_extract_answers(self, parser_service):
        """정답 추출 테스트"""
        text = """
        정답
        1번: 2
        2번: ④
        3번: 가
        """
        
        answers = parser_service._extract_answers(text)
        
        assert answers[1] == "2"
        assert answers[2] == "4"  # ④ → 4로 변환
        assert answers[3] == "1"  # 가 → 1로 변환
```

#### 2. 통합 테스트

**`tests/test_api_integration.py`**
```python
import pytest
import tempfile
import os
from fastapi.testclient import TestClient
from app.main import app

@pytest.fixture
def client():
    return TestClient(app)

@pytest.fixture
def sample_pdf_file():
    """테스트용 PDF 파일 생성"""
    content = b"Sample PDF content for testing"
    with tempfile.NamedTemporaryFile(suffix='.pdf', delete=False) as tmp_file:
        tmp_file.write(content)
        tmp_file.flush()
        yield tmp_file.name
    os.unlink(tmp_file.name)

class TestParserAPI:
    
    def test_health_check(self, client):
        """헬스체크 테스트"""
        response = client.get("/api/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "healthy"
        assert "timestamp" in data
        assert "version" in data

    def test_parse_file_success(self, client, sample_pdf_file):
        """파일 파싱 성공 테스트"""
        with open(sample_pdf_file, 'rb') as f:
            response = client.post(
                "/api/parse",
                files={"file": ("test.pdf", f, "application/pdf")}
            )
        
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        assert "data" in data
        assert "questions" in data["data"]

    def test_parse_file_invalid_format(self, client):
        """잘못된 파일 형식 테스트"""
        response = client.post(
            "/api/parse",
            files={"file": ("test.txt", b"not a pdf", "text/plain")}
        )
        
        assert response.status_code == 400
        data = response.json()
        assert "PDF 파일만" in data["detail"]

    def test_parse_file_no_file(self, client):
        """파일 누락 테스트"""
        response = client.post("/api/parse")
        
        assert response.status_code == 422

    def test_parse_file_large_file(self, client):
        """대용량 파일 테스트"""
        large_content = b"x" * (11 * 1024 * 1024)  # 11MB
        
        response = client.post(
            "/api/parse",
            files={"file": ("large.pdf", large_content, "application/pdf")}
        )
        
        assert response.status_code == 413
```

#### 3. 성능 테스트

**`tests/test_performance.py`**
```python
import pytest
import time
import asyncio
from concurrent.futures import ThreadPoolExecutor
from app.services.parser_service import PDFParserService

class TestPerformance:
    
    @pytest.mark.asyncio
    async def test_parsing_speed(self):
        """파싱 속도 테스트"""
        parser = PDFParserService()
        
        # 가상의 PDF 파일 경로 (실제 테스트에서는 샘플 파일 사용)
        sample_file = "tests/fixtures/sample_exam.pdf"
        
        start_time = time.time()
        result = await parser.parse_pdf(sample_file)
        end_time = time.time()
        
        parsing_time = end_time - start_time
        
        # 10초 이내에 파싱 완료되어야 함
        assert parsing_time < 10.0
        
        # 최소한의 결과가 나와야 함
        assert len(result.questions) > 0

    @pytest.mark.asyncio
    async def test_concurrent_parsing(self):
        """동시 파싱 테스트"""
        parser = PDFParserService()
        sample_files = [
            "tests/fixtures/sample1.pdf",
            "tests/fixtures/sample2.pdf",
            "tests/fixtures/sample3.pdf"
        ]
        
        start_time = time.time()
        
        # 동시에 여러 파일 파싱
        tasks = [parser.parse_pdf(file) for file in sample_files]
        results = await asyncio.gather(*tasks, return_exceptions=True)
        
        end_time = time.time()
        total_time = end_time - start_time
        
        # 순차 처리보다 빨라야 함 (가정: 각 파일당 3초 → 동시 처리시 5초 이내)
        assert total_time < 8.0
        
        # 모든 결과가 성공해야 함
        for result in results:
            assert not isinstance(result, Exception)

    def test_memory_usage(self):
        """메모리 사용량 테스트"""
        import psutil
        import gc
        
        process = psutil.Process()
        
        # 초기 메모리 사용량
        initial_memory = process.memory_info().rss / 1024 / 1024  # MB
        
        parser = PDFParserService()
        
        # 여러 번 파싱 수행
        for i in range(10):
            # 가상의 파싱 작업
            parser._extract_questions("sample text" * 1000)
            
            # 주기적으로 가비지 컬렉션
            if i % 3 == 0:
                gc.collect()
        
        # 최종 메모리 사용량
        final_memory = process.memory_info().rss / 1024 / 1024  # MB
        memory_increase = final_memory - initial_memory
        
        # 메모리 증가량이 100MB 이하여야 함
        assert memory_increase < 100
```

#### 4. 테스트 데이터 생성

**`tests/fixtures/generate_test_data.py`**
```python
from faker import Faker
import json
import random

fake = Faker('ko_KR')

def generate_mock_questions(num_questions: int = 50):
    """모의 문제 데이터 생성"""
    questions = []
    
    subjects = ["물리치료학", "간호학", "컴퓨터과학", "의학", "공학"]
    
    for i in range(1, num_questions + 1):
        # 문제 생성
        question_types = [
            "다음 중 {subject}의 특징으로 옳은 것은?",
            "{subject}에서 가장 중요한 요소는?",
            "{subject} 분야의 올바른 설명은?",
            "다음 중 {subject}와 관련이 없는 것은?"
        ]
        
        question_template = random.choice(question_types)
        subject = random.choice(subjects)
        content = question_template.format(subject=subject)
        
        # 선택지 생성
        options = {}
        for j in range(1, 6):
            options[str(j)] = fake.sentence(nb_words=6)
        
        # 정답 선택
        answer = str(random.randint(1, 5))
        
        question = {
            "number": i,
            "content": content,
            "options": options,
            "answer": answer,
            "explanation": fake.sentence(nb_words=10)
        }
        
        questions.append(question)
    
    return {
        "questions": questions,
        "metadata": {
            "title": f"{random.choice(subjects)} 국가시험",
            "year": 2023,
            "subject": random.choice(subjects),
            "totalQuestions": num_questions
        }
    }

if __name__ == "__main__":
    # 테스트 데이터 생성
    test_data = generate_mock_questions(50)
    
    with open("tests/fixtures/mock_questions.json", "w", encoding="utf-8") as f:
        json.dump(test_data, f, ensure_ascii=False, indent=2)
    
    print("테스트 데이터가 생성되었습니다.")
```

## 🐛 디버깅 가이드

### 로깅 설정

**`app/core/logging.py`**
```python
import logging
import logging.config
import sys
from pathlib import Path

def setup_logging():
    """로깅 설정"""
    
    # 로그 디렉토리 생성
    log_dir = Path("logs")
    log_dir.mkdir(exist_ok=True)
    
    logging_config = {
        "version": 1,
        "disable_existing_loggers": False,
        "formatters": {
            "default": {
                "format": "%(asctime)s - %(name)s - %(levelname)s - %(message)s",
                "datefmt": "%Y-%m-%d %H:%M:%S"
            },
            "detailed": {
                "format": "%(asctime)s - %(name)s - %(levelname)s - %(filename)s:%(lineno)d - %(funcName)s - %(message)s",
                "datefmt": "%Y-%m-%d %H:%M:%S"
            }
        },
        "handlers": {
            "console": {
                "class": "logging.StreamHandler",
                "formatter": "default",
                "level": "INFO",
                "stream": sys.stdout
            },
            "file": {
                "class": "logging.handlers.RotatingFileHandler",
                "formatter": "detailed",
                "level": "DEBUG",
                "filename": "logs/parser.log",
                "maxBytes": 10485760,  # 10MB
                "backupCount": 5
            },
            "error_file": {
                "class": "logging.handlers.RotatingFileHandler",
                "formatter": "detailed",
                "level": "ERROR",
                "filename": "logs/errors.log",
                "maxBytes": 10485760,
                "backupCount": 5
            }
        },
        "loggers": {
            "app": {
                "level": "DEBUG",
                "handlers": ["console", "file", "error_file"],
                "propagate": False
            },
            "uvicorn": {
                "level": "INFO",
                "handlers": ["console", "file"],
                "propagate": False
            }
        },
        "root": {
            "level": "INFO",
            "handlers": ["console", "file"]
        }
    }
    
    logging.config.dictConfig(logging_config)

# 사용 예제
logger = logging.getLogger("app.parser")

def debug_pdf_extraction(pdf_path: str):
    """PDF 추출 과정 디버깅"""
    logger.debug(f"PDF 파일 처리 시작: {pdf_path}")
    
    try:
        import pdfplumber
        with pdfplumber.open(pdf_path) as pdf:
            logger.debug(f"PDF 페이지 수: {len(pdf.pages)}")
            
            for i, page in enumerate(pdf.pages):
                text = page.extract_text()
                logger.debug(f"페이지 {i+1} 텍스트 길이: {len(text) if text else 0}")
                
                if text:
                    # 첫 100자만 로깅
                    logger.debug(f"페이지 {i+1} 시작 텍스트: {text[:100]}")
    
    except Exception as e:
        logger.error(f"PDF 처리 중 오류: {e}", exc_info=True)
```

### 개발용 디버깅 도구

**`scripts/debug_parser.py`**
```python
#!/usr/bin/env python3
"""
파서 디버깅용 스크립트
"""
import sys
import asyncio
from pathlib import Path

# 프로젝트 루트를 Python 경로에 추가
project_root = Path(__file__).parent.parent
sys.path.insert(0, str(project_root))

from app.services.parser_service import PDFParserService

async def debug_parse_file(pdf_path: str):
    """파일 파싱 디버깅"""
    parser = PDFParserService()
    
    print(f"📄 파일 분석 시작: {pdf_path}")
    print("=" * 50)
    
    try:
        # 1. PDF 텍스트 추출
        import pdfplumber
        with pdfplumber.open(pdf_path) as pdf:
            print(f"📋 PDF 정보:")
            print(f"  - 페이지 수: {len(pdf.pages)}")
            print(f"  - 메타데이터: {pdf.metadata}")
            
            # 전체 텍스트 추출
            full_text = ""
            for page in pdf.pages:
                page_text = page.extract_text() or ""
                full_text += page_text + "\n"
            
            print(f"  - 전체 텍스트 길이: {len(full_text)}")
            print()
            
            # 첫 500자 출력
            print("📝 텍스트 샘플 (첫 500자):")
            print("-" * 30)
            print(full_text[:500])
            print("-" * 30)
            print()
        
        # 2. 메타데이터 추출 테스트
        print("🔍 메타데이터 추출:")
        metadata = parser._extract_metadata(full_text, pdf)
        print(f"  - 제목: {metadata.title}")
        print(f"  - 연도: {metadata.year}")
        print(f"  - 과목: {metadata.subject}")
        print()
        
        # 3. 문제 추출 테스트
        print("❓ 문제 추출:")
        questions = parser._extract_questions(full_text)
        print(f"  - 추출된 문제 수: {len(questions)}")
        
        for i, q in enumerate(questions[:3]):  # 첫 3개만 출력
            print(f"  문제 {q.number}:")
            print(f"    내용: {q.content[:100]}...")
            print(f"    선택지 수: {len(q.options)}")
            print(f"    선택지: {list(q.options.keys())}")
            print()
        
        # 4. 정답 추출 테스트
        print("✅ 정답 추출:")
        answers = parser._extract_answers(full_text)
        print(f"  - 추출된 정답 수: {len(answers)}")
        if answers:
            print(f"  - 정답 샘플: {dict(list(answers.items())[:5])}")
        print()
        
        # 5. 전체 파싱 결과
        print("🎯 전체 파싱 결과:")
        result = await parser.parse_pdf(pdf_path)
        print(f"  - 최종 문제 수: {len(result.questions)}")
        print(f"  - 정답이 있는 문제 수: {sum(1 for q in result.questions if q.answer)}")
        
        # 품질 점수 계산
        if result.questions:
            complete_questions = sum(1 for q in result.questions 
                                   if q.content and q.options and len(q.options) >= 2)
            quality_score = complete_questions / len(result.questions) * 100
            print(f"  - 완성도: {quality_score:.1f}%")
        
    except Exception as e:
        print(f"❌ 오류 발생: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    if len(sys.argv) != 2:
        print("사용법: python debug_parser.py <pdf_file_path>")
        sys.exit(1)
    
    pdf_path = sys.argv[1]
    if not Path(pdf_path).exists():
        print(f"파일을 찾을 수 없습니다: {pdf_path}")
        sys.exit(1)
    
    asyncio.run(debug_parse_file(pdf_path))
```

## 🚀 배포 가이드

### Docker 설정

**`Dockerfile`**
```dockerfile
FROM python:3.11-slim

# 시스템 의존성 설치
RUN apt-get update && apt-get install -y \
    gcc \
    g++ \
    && rm -rf /var/lib/apt/lists/*

# 작업 디렉토리 설정
WORKDIR /app

# Python 의존성 설치
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# 애플리케이션 코드 복사
COPY . .

# 비root 사용자 생성
RUN useradd --create-home --shell /bin/bash app
RUN chown -R app:app /app
USER app

# 포트 노출
EXPOSE 8000

# 헬스체크
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:8000/api/health || exit 1

# 애플리케이션 실행
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

**`docker-compose.yml`**
```yaml
version: '3.8'

services:
  parser-api:
    build: .
    ports:
      - "8001:8000"
    environment:
      - ENVIRONMENT=development
      - DATABASE_URL=postgresql://user:password@db:5432/parser_db
      - REDIS_URL=redis://redis:6379
    volumes:
      - ./logs:/app/logs
      - ./uploads:/app/uploads
    depends_on:
      - db
      - redis
    restart: unless-stopped

  db:
    image: postgres:15
    environment:
      - POSTGRES_DB=parser_db
      - POSTGRES_USER=user
      - POSTGRES_PASSWORD=password
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/nginx/ssl
    depends_on:
      - parser-api

volumes:
  postgres_data:
  redis_data:
```

### 환경 설정

**`.env.example`**
```bash
# 개발 환경 설정
ENVIRONMENT=development
DEBUG=true
API_PORT=8001

# 데이터베이스
DATABASE_URL=postgresql://user:password@localhost:5432/parser_db

# Redis (캐싱용)
REDIS_URL=redis://localhost:6379

# 파일 처리
MAX_FILE_SIZE=10485760  # 10MB
TEMP_DIR=/tmp/parser_uploads
UPLOAD_DIR=/app/uploads

# AI 서비스 (선택사항)
OPENAI_API_KEY=sk-your-api-key-here

# 보안
SECRET_KEY=your-secret-key-here
ALLOWED_HOSTS=localhost,127.0.0.1,your-domain.com
ALLOWED_ORIGINS=http://localhost:3000,https://your-frontend.com

# 로깅
LOG_LEVEL=INFO
LOG_FILE=/app/logs/parser.log

# 성능
WORKER_PROCESSES=4
MAX_CONCURRENT_REQUESTS=100
```

### CI/CD 파이프라인

**`.github/workflows/test-and-deploy.yml`**
```yaml
name: Test and Deploy

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main ]

jobs:
  test:
    runs-on: ubuntu-latest
    
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_PASSWORD: postgres
          POSTGRES_DB: test_db
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 5432:5432
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Set up Python
      uses: actions/setup-python@v4
      with:
        python-version: '3.11'
    
    - name: Cache dependencies
      uses: actions/cache@v3
      with:
        path: ~/.cache/pip
        key: ${{ runner.os }}-pip-${{ hashFiles('**/requirements*.txt') }}
        restore-keys: |
          ${{ runner.os }}-pip-
    
    - name: Install dependencies
      run: |
        python -m pip install --upgrade pip
        pip install -r requirements.txt
        pip install -r requirements-test.txt
    
    - name: Lint with flake8
      run: |
        flake8 app tests --count --select=E9,F63,F7,F82 --show-source --statistics
        flake8 app tests --count --exit-zero --max-complexity=10 --max-line-length=127 --statistics
    
    - name: Type check with mypy
      run: |
        mypy app
    
    - name: Test with pytest
      run: |
        pytest tests/ --cov=app --cov-report=xml
      env:
        DATABASE_URL: postgresql://postgres:postgres@localhost:5432/test_db
    
    - name: Upload coverage to Codecov
      uses: codecov/codecov-action@v3
      with:
        file: ./coverage.xml

  deploy:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Build and push Docker image
      run: |
        echo ${{ secrets.DOCKER_PASSWORD }} | docker login -u ${{ secrets.DOCKER_USERNAME }} --password-stdin
        docker build -t your-registry/parser-api:latest .
        docker push your-registry/parser-api:latest
    
    - name: Deploy to production
      run: |
        # 실제 배포 스크립트 실행
        echo "Deploying to production..."
```

### 모니터링 설정

**`app/core/monitoring.py`**
```python
import time
import logging
from functools import wraps
from typing import Callable, Any
import psutil

logger = logging.getLogger(__name__)

def monitor_performance(func: Callable) -> Callable:
    """성능 모니터링 데코레이터"""
    @wraps(func)
    async def wrapper(*args, **kwargs) -> Any:
        start_time = time.time()
        start_memory = psutil.Process().memory_info().rss
        
        try:
            result = await func(*args, **kwargs)
            
            end_time = time.time()
            end_memory = psutil.Process().memory_info().rss
            
            execution_time = end_time - start_time
            memory_used = end_memory - start_memory
            
            logger.info(
                f"Performance - {func.__name__}: "
                f"time={execution_time:.2f}s, "
                f"memory={memory_used/1024/1024:.2f}MB"
            )
            
            return result
            
        except Exception as e:
            logger.error(f"Error in {func.__name__}: {e}", exc_info=True)
            raise
    
    return wrapper

class HealthChecker:
    """시스템 상태 체크"""
    
    @staticmethod
    def check_database():
        """데이터베이스 연결 상태 확인"""
        # 실제 구현에서는 DB 연결 테스트
        return {"status": "healthy", "response_time": 0.001}
    
    @staticmethod
    def check_redis():
        """Redis 연결 상태 확인"""
        # 실제 구현에서는 Redis 연결 테스트
        return {"status": "healthy", "response_time": 0.001}
    
    @staticmethod
    def check_disk_space():
        """디스크 공간 확인"""
        disk = psutil.disk_usage('/')
        free_percent = (disk.free / disk.total) * 100
        
        status = "healthy" if free_percent > 10 else "warning"
        return {
            "status": status,
            "free_space_percent": free_percent,
            "free_space_gb": disk.free / (1024**3)
        }
    
    @staticmethod
    def check_memory():
        """메모리 사용량 확인"""
        memory = psutil.virtual_memory()
        
        status = "healthy" if memory.percent < 80 else "warning"
        return {
            "status": status,
            "usage_percent": memory.percent,
            "available_gb": memory.available / (1024**3)
        }
```

---

이 가이드를 통해 견고하고 안정적인 파서 API를 개발하고 배포할 수 있습니다! 🚀 
