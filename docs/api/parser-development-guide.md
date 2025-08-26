# 파서 개발 가이드

## 🚀 시작하기

이 가이드는 CampusON 파서 API를 개발하는 백엔드 개발자를 위한 실용적인 개발 가이드입니다.

## 📁 프로젝트 구조

```
backend/python-api/
├── app/
│   ├── __init__.py
│   ├── main.py                 # FastAPI 애플리케이션 진입점
│   ├── models/
│   │   ├── __init__.py
│   │   ├── parse_models.py     # 데이터 모델 정의
│   │   └── response_models.py  # API 응답 모델
│   ├── services/
│   │   ├── __init__.py
│   │   ├── parser_service.py   # 파싱 로직
│   │   ├── file_service.py     # 파일 처리
│   │   └── ai_service.py       # AI 해설 생성 (선택사항)
│   ├── api/
│   │   ├── __init__.py
│   │   ├── endpoints/
│   │   │   ├── __init__.py
│   │   │   ├── parser.py       # 파서 API 엔드포인트
│   │   │   └── results.py      # 결과 조회 API
│   │   └── dependencies.py     # 의존성 주입
│   ├── core/
│   │   ├── __init__.py
│   │   ├── config.py          # 설정 관리
│   │   ├── exceptions.py      # 커스텀 예외
│   │   └── logging.py         # 로깅 설정
│   └── utils/
│       ├── __init__.py
│       ├── file_utils.py      # 파일 유틸리티
│       └── text_utils.py      # 텍스트 처리 유틸리티
├── tests/
│   ├── __init__.py
│   ├── test_parser.py
│   ├── test_api.py
│   └── test_files/
├── requirements.txt
├── Dockerfile
└── README.md
```

## 🔧 핵심 구현

### 1. FastAPI 애플리케이션 설정

**`app/main.py`**
```python
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from app.api.endpoints import parser, results
from app.core.config import settings
from app.core.logging import setup_logging

# 로깅 설정
setup_logging()

app = FastAPI(
    title="CampusON Parser API",
    description="PDF 문제 파싱 API",
    version="1.0.0",
    docs_url="/docs" if settings.DEBUG else None,
    redoc_url="/redoc" if settings.DEBUG else None,
)

# CORS 설정
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 신뢰할 수 있는 호스트 설정
app.add_middleware(
    TrustedHostMiddleware, 
    allowed_hosts=settings.ALLOWED_HOSTS
)

# 라우터 등록
app.include_router(parser.router, prefix="/api", tags=["parser"])
app.include_router(results.router, prefix="/api", tags=["results"])

@app.get("/api/health")
async def health_check():
    return {
        "status": "healthy",
        "timestamp": datetime.utcnow().isoformat(),
        "version": "1.0.0"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=settings.PORT)
```

### 2. 데이터 모델 정의

**`app/models/parse_models.py`**
```python
from pydantic import BaseModel, Field
from typing import Dict, List, Optional
from datetime import datetime

class ParsedQuestion(BaseModel):
    number: int = Field(..., description="문제 번호")
    content: str = Field(..., description="문제 내용")
    options: Dict[str, str] = Field(..., description="선택지")
    answer: Optional[str] = Field(None, description="정답")
    explanation: Optional[str] = Field(None, description="해설")

class ParsedMetadata(BaseModel):
    title: Optional[str] = Field(None, description="시험 제목")
    year: Optional[int] = Field(None, description="시험 연도")
    subject: Optional[str] = Field(None, description="과목명")
    totalQuestions: Optional[int] = Field(None, description="전체 문제 수")

class ParsedResult(BaseModel):
    questions: List[ParsedQuestion] = Field(..., description="파싱된 문제 목록")
    metadata: Optional[ParsedMetadata] = Field(None, description="메타데이터")

class ParseJob(BaseModel):
    id: str
    status: str  # pending, processing, completed, failed
    result: Optional[ParsedResult] = None
    error: Optional[str] = None
    created_at: datetime
    completed_at: Optional[datetime] = None
```

### 3. 파싱 서비스 구현

**`app/services/parser_service.py`**
```python
import re
import logging
from typing import List, Dict, Optional, Tuple
import pdfplumber
from app.models.parse_models import ParsedQuestion, ParsedResult, ParsedMetadata
from app.core.exceptions import ParsingError

logger = logging.getLogger(__name__)

class PDFParserService:
    def __init__(self):
        # 문제 번호 패턴 (1., 2., 3. 또는 1) 2) 3))
        self.question_pattern = re.compile(r'^(\d+)[\.\)]', re.MULTILINE)
        
        # 선택지 패턴 (1), 2), 3) 또는 ①, ②, ③)
        self.option_patterns = [
            re.compile(r'^(\d+)\)\s*(.+)$', re.MULTILINE),
            re.compile(r'^([①-⑤])\s*(.+)$', re.MULTILINE),
            re.compile(r'^([가-마])\.\s*(.+)$', re.MULTILINE),
        ]
        
        # 정답 패턴
        self.answer_pattern = re.compile(r'정답[\s:]*(\d+|[①-⑤]|[가-마])', re.IGNORECASE)

    async def parse_pdf(self, file_path: str) -> ParsedResult:
        """PDF 파일을 파싱하여 문제와 선택지를 추출합니다."""
        try:
            with pdfplumber.open(file_path) as pdf:
                # 전체 텍스트 추출
                full_text = ""
                for page in pdf.pages:
                    full_text += page.extract_text() or ""
                
                # 메타데이터 추출
                metadata = self._extract_metadata(full_text, pdf)
                
                # 문제 추출
                questions = self._extract_questions(full_text)
                
                # 정답 추출 (별도 섹션에 있는 경우)
                answers = self._extract_answers(full_text)
                
                # 정답을 문제에 매핑
                self._map_answers_to_questions(questions, answers)
                
                return ParsedResult(
                    questions=questions,
                    metadata=metadata
                )
                
        except Exception as e:
            logger.error(f"PDF 파싱 오류: {str(e)}")
            raise ParsingError(f"PDF 파싱 중 오류가 발생했습니다: {str(e)}")

    def _extract_metadata(self, text: str, pdf) -> ParsedMetadata:
        """PDF에서 메타데이터를 추출합니다."""
        metadata = ParsedMetadata()
        
        # 연도 추출 (2023년도, 2023년 등)
        year_match = re.search(r'(\d{4})년', text)
        if year_match:
            metadata.year = int(year_match.group(1))
        
        # 과목명 추출 (일반적인 과목명 패턴)
        subject_patterns = [
            r'([가-힣]+학)\s*국가시험',
            r'([가-힣]+치료)\s*국가시험',
            r'([가-힣]+과)\s*시험',
        ]
        
        for pattern in subject_patterns:
            match = re.search(pattern, text)
            if match:
                metadata.subject = match.group(1)
                break
        
        # 제목 추출 (첫 번째 줄에서 추출)
        lines = text.split('\n')
        for line in lines[:10]:  # 첫 10줄 내에서 찾기
            line = line.strip()
            if line and len(line) > 10:
                metadata.title = line
                break
        
        return metadata

    def _extract_questions(self, text: str) -> List[ParsedQuestion]:
        """텍스트에서 문제와 선택지를 추출합니다."""
        questions = []
        
        # 문제 분할
        question_splits = self.question_pattern.split(text)
        
        for i in range(1, len(question_splits), 2):
            try:
                question_num = int(question_splits[i])
                question_text = question_splits[i + 1]
                
                # 문제 내용과 선택지 분리
                content, options = self._parse_question_content(question_text)
                
                if content and options:
                    question = ParsedQuestion(
                        number=question_num,
                        content=content.strip(),
                        options=options
                    )
                    questions.append(question)
                    
            except (ValueError, IndexError) as e:
                logger.warning(f"문제 {i//2 + 1} 파싱 실패: {str(e)}")
                continue
        
        return questions

    def _parse_question_content(self, text: str) -> Tuple[str, Dict[str, str]]:
        """문제 텍스트에서 내용과 선택지를 분리합니다."""
        lines = text.split('\n')
        content_lines = []
        options = {}
        
        for line in lines:
            line = line.strip()
            if not line:
                continue
            
            # 선택지 패턴 확인
            option_found = False
            for pattern in self.option_patterns:
                match = pattern.match(line)
                if match:
                    option_key = self._normalize_option_key(match.group(1))
                    option_value = match.group(2).strip()
                    options[option_key] = option_value
                    option_found = True
                    break
            
            if not option_found:
                content_lines.append(line)
        
        content = ' '.join(content_lines).strip()
        
        # 문제 내용에서 불필요한 부분 제거
        content = re.sub(r'다음.*?중.*?것은', '다음 중 적절한 것은', content)
        content = re.sub(r'\s+', ' ', content)
        
        return content, options

    def _normalize_option_key(self, key: str) -> str:
        """선택지 키를 표준화합니다."""
        # ① → 1, ② → 2 등으로 변환
        if key in '①②③④⑤':
            return str(ord(key) - ord('①') + 1)
        # 가 → 1, 나 → 2 등으로 변환
        if key in '가나다라마':
            return str(ord(key) - ord('가') + 1)
        return key

    def _extract_answers(self, text: str) -> Dict[int, str]:
        """텍스트에서 정답을 추출합니다."""
        answers = {}
        
        # 정답 섹션 찾기
        answer_section_match = re.search(r'정답.*?(?=\n\n|\Z)', text, re.DOTALL | re.IGNORECASE)
        if answer_section_match:
            answer_section = answer_section_match.group(0)
            
            # 각 문제별 정답 추출
            answer_matches = re.findall(r'(\d+)[\.\)]\s*([①-⑤]|\d+|[가-마])', answer_section)
            for match in answer_matches:
                question_num = int(match[0])
                answer_key = self._normalize_option_key(match[1])
                answers[question_num] = answer_key
        
        return answers

    def _map_answers_to_questions(self, questions: List[ParsedQuestion], answers: Dict[int, str]):
        """정답을 해당 문제에 매핑합니다."""
        for question in questions:
            if question.number in answers:
                question.answer = answers[question.number]

# 싱글톤 인스턴스
parser_service = PDFParserService()
```

### 4. API 엔드포인트 구현

**`app/api/endpoints/parser.py`**
```python
import os
import uuid
import logging
from fastapi import APIRouter, UploadFile, File, HTTPException, BackgroundTasks
from fastapi.responses import JSONResponse
from app.services.parser_service import parser_service
from app.services.file_service import file_service
from app.models.response_models import ApiResponse
from app.core.config import settings

router = APIRouter()
logger = logging.getLogger(__name__)

@router.post("/parse")
async def parse_file(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...)
):
    """PDF 파일을 업로드하고 파싱합니다."""
    
    # 파일 검증
    if not file.filename.lower().endswith('.pdf'):
        raise HTTPException(
            status_code=400,
            detail="PDF 파일만 업로드 가능합니다."
        )
    
    if file.size > settings.MAX_FILE_SIZE:
        raise HTTPException(
            status_code=413,
            detail=f"파일 크기는 {settings.MAX_FILE_SIZE // 1024 // 1024}MB를 초과할 수 없습니다."
        )
    
    try:
        # 임시 파일 저장
        file_id = str(uuid.uuid4())
        file_path = await file_service.save_temp_file(file, file_id)
        
        # 파싱 실행
        result = await parser_service.parse_pdf(file_path)
        
        # 백그라운드에서 임시 파일 삭제
        background_tasks.add_task(file_service.cleanup_temp_file, file_path)
        
        return ApiResponse(
            success=True,
            data=result,
            message="파일 파싱 성공"
        )
        
    except Exception as e:
        logger.error(f"파일 파싱 오류: {str(e)}")
        return JSONResponse(
            status_code=500,
            content=ApiResponse(
                success=False,
                error="파일 파싱 중 오류가 발생했습니다.",
                details=str(e)
            ).dict()
        )

@router.post("/parse-async")
async def parse_file_async(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...)
):
    """비동기 PDF 파싱 (대용량 파일용)"""
    
    # 파일 검증 (동일)
    
    try:
        # 작업 ID 생성
        job_id = str(uuid.uuid4())
        
        # 파일 저장
        file_path = await file_service.save_temp_file(file, job_id)
        
        # 백그라운드에서 파싱 실행
        background_tasks.add_task(
            process_file_async, 
            job_id, 
            file_path
        )
        
        return ApiResponse(
            success=True,
            data={"job_id": job_id},
            message="파싱 작업이 시작되었습니다."
        )
        
    except Exception as e:
        logger.error(f"비동기 파싱 시작 오류: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

async def process_file_async(job_id: str, file_path: str):
    """백그라운드에서 파일을 처리합니다."""
    try:
        # 파싱 실행
        result = await parser_service.parse_pdf(file_path)
        
        # 결과 저장 (DB 또는 캐시)
        await file_service.save_parse_result(job_id, result)
        
    except Exception as e:
        logger.error(f"비동기 파싱 오류 (job_id: {job_id}): {str(e)}")
        await file_service.save_parse_error(job_id, str(e))
    
    finally:
        # 임시 파일 정리
        await file_service.cleanup_temp_file(file_path)
```

### 5. 파일 서비스 구현

**`app/services/file_service.py`**
```python
import os
import aiofiles
import tempfile
from pathlib import Path
from fastapi import UploadFile
from app.core.config import settings

class FileService:
    def __init__(self):
        self.temp_dir = Path(settings.TEMP_DIR)
        self.temp_dir.mkdir(exist_ok=True)

    async def save_temp_file(self, file: UploadFile, file_id: str) -> str:
        """업로드된 파일을 임시 디렉토리에 저장합니다."""
        file_extension = Path(file.filename).suffix
        temp_filename = f"{file_id}{file_extension}"
        temp_path = self.temp_dir / temp_filename
        
        async with aiofiles.open(temp_path, 'wb') as f:
            content = await file.read()
            await f.write(content)
        
        return str(temp_path)

    async def cleanup_temp_file(self, file_path: str):
        """임시 파일을 삭제합니다."""
        try:
            if os.path.exists(file_path):
                os.remove(file_path)
        except Exception as e:
            # 로깅만 하고 에러는 무시
            import logging
            logging.getLogger(__name__).warning(f"임시 파일 삭제 실패: {e}")

# 싱글톤 인스턴스
file_service = FileService()
```

## 🧪 테스트 작성

**`tests/test_parser.py`**
```python
import pytest
from app.services.parser_service import PDFParserService

@pytest.fixture
def parser():
    return PDFParserService()

@pytest.fixture
def sample_pdf_path():
    return "tests/test_files/sample_exam.pdf"

@pytest.mark.asyncio
async def test_parse_pdf_success(parser, sample_pdf_path):
    """PDF 파싱 성공 테스트"""
    result = await parser.parse_pdf(sample_pdf_path)
    
    assert result is not None
    assert len(result.questions) > 0
    assert result.questions[0].number == 1
    assert result.questions[0].content is not None
    assert len(result.questions[0].options) > 0

@pytest.mark.asyncio 
async def test_question_extraction(parser):
    """문제 추출 테스트"""
    sample_text = """
    1. 다음 중 물리치료사의 역할은?
    1) 진단
    2) 재활
    3) 처방
    4) 수술
    
    2. 근육의 기능이 아닌 것은?
    1) 움직임
    2) 지지
    3) 소화
    4) 열생산
    """
    
    questions = parser._extract_questions(sample_text)
    
    assert len(questions) == 2
    assert questions[0].number == 1
    assert "물리치료사" in questions[0].content
    assert "1" in questions[0].options
    assert "2" in questions[0].options
```

## 🔍 디버깅 팁

### 1. 로깅 활용
```python
import logging

# 상세 로깅 설정
logging.basicConfig(
    level=logging.DEBUG,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)

# 파싱 과정에서 중간 결과 로깅
logger.debug(f"추출된 텍스트 길이: {len(text)}")
logger.debug(f"찾은 문제 수: {len(questions)}")
```

### 2. 정규표현식 테스트
```python
import re

# 패턴 테스트용 함수
def test_regex_pattern():
    text = "1. 문제내용\n1) 선택지1\n2) 선택지2"
    pattern = re.compile(r'^(\d+)[\.\)]', re.MULTILINE)
    matches = pattern.findall(text)
    print(f"매치 결과: {matches}")

# 온라인 정규표현식 테스터 활용: regex101.com
```

### 3. PDF 텍스트 추출 검증
```python
# 추출된 텍스트 확인
with open('extracted_text.txt', 'w', encoding='utf-8') as f:
    f.write(extracted_text)

# 특정 페이지만 추출해서 테스트
page_text = pdf.pages[0].extract_text()
```

## 🚀 성능 최적화

### 1. 비동기 처리
```python
import asyncio
from concurrent.futures import ThreadPoolExecutor

# CPU 집약적 작업을 별도 스레드에서 실행
async def parse_pdf_async(file_path: str):
    loop = asyncio.get_event_loop()
    with ThreadPoolExecutor() as executor:
        result = await loop.run_in_executor(
            executor, 
            _parse_pdf_sync, 
            file_path
        )
    return result
```

### 2. 메모리 관리
```python
import gc

# 대용량 파일 처리 후 메모리 해제
def process_large_pdf():
    # ... 처리 로직
    gc.collect()  # 명시적 가비지 컬렉션
```

### 3. 캐싱 활용
```python
from functools import lru_cache

@lru_cache(maxsize=100)
def extract_metadata_cached(text_hash: str, text: str):
    return extract_metadata(text)
```

---

## 📝 다음 단계

1. **AI 해설 생성**: OpenAI API를 활용한 자동 해설 생성
2. **데이터베이스 연동**: 파싱 결과 영구 저장
3. **배치 처리**: 여러 파일 동시 처리
4. **API 문서화**: Swagger UI 자동 생성
5. **모니터링**: 성능 지표 수집 및 모니터링

각 단계별로 점진적으로 개발해 나가세요! 