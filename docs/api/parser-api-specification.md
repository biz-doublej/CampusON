# 파서 API 명세서

## 📋 개요

CampusON 파서 시스템의 백엔드 API 명세서입니다. 프론트엔드와의 원활한 연동을 위한 API 구조와 요구사항을 정의합니다.

## 🔧 기술 스택
- **언어**: Python 3.8+
- **프레임워크**: FastAPI 또는 Flask
- **파일 처리**: PyPDF2, pdfplumber
- **AI/ML**: OpenAI GPT API, LangChain (선택사항)
- **데이터베이스**: PostgreSQL 또는 MongoDB
- **파일 저장**: Local storage 또는 AWS S3

## 🚀 API 엔드포인트

### 1. 파일 업로드 및 파싱

#### `POST /api/parse`

PDF 파일을 업로드하고 문제, 선택지, 정답을 추출합니다.

**요청**
```http
POST /api/parse
Content-Type: multipart/form-data

file: [PDF 파일]
```

**요청 헤더**
```
Content-Type: multipart/form-data
Accept: application/json
```

**응답 (성공)**
```json
{
  "success": true,
  "data": {
    "questions": [
      {
        "number": 1,
        "content": "다음 중 물리치료사의 역할로 가장 적절한 것은?",
        "options": {
          "1": "환자의 진단을 내리는 것",
          "2": "환자의 재활을 돕는 것",
          "3": "약물을 처방하는 것",
          "4": "수술을 집도하는 것",
          "5": "의료기기를 판매하는 것"
        },
        "answer": "2",
        "explanation": "물리치료사는 환자의 재활을 돕는 역할을 합니다."
      }
    ],
    "metadata": {
      "title": "2023년도 물리치료사 국가시험",
      "year": 2023,
      "subject": "물리치료학",
      "totalQuestions": 150
    }
  },
  "message": "파일 파싱 성공"
}
```

**응답 (실패)**
```json
{
  "success": false,
  "error": "파일 파싱 중 오류가 발생했습니다.",
  "details": "PDF 형식이 올바르지 않습니다."
}
```

### 2. 파싱 결과 조회

#### `GET /api/results/{result_id}`

특정 파싱 결과를 조회합니다.

**요청**
```http
GET /api/results/12345
```

**응답**
```json
{
  "success": true,
  "data": {
    "id": "12345",
    "questions": [...],
    "metadata": {...},
    "created_at": "2023-12-01T10:00:00Z",
    "status": "completed"
  }
}
```

### 3. 파싱 결과 목록 조회

#### `GET /api/results`

파싱 결과 목록을 조회합니다 (페이지네이션 지원).

**요청**
```http
GET /api/results?page=1&limit=10&subject=물리치료학
```

**쿼리 파라미터**
- `page`: 페이지 번호 (기본값: 1)
- `limit`: 페이지당 항목 수 (기본값: 10)
- `subject`: 과목 필터 (선택사항)
- `year`: 연도 필터 (선택사항)

**응답**
```json
{
  "success": true,
  "data": {
    "results": [...],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 50,
      "totalPages": 5
    }
  }
}
```

### 4. 헬스체크

#### `GET /api/health`

API 서버 상태를 확인합니다.

**응답**
```json
{
  "status": "healthy",
  "timestamp": "2023-12-01T10:00:00Z",
  "version": "1.0.0"
}
```

## 📊 데이터 모델

### ParsedQuestion
```typescript
interface ParsedQuestion {
  number: number;           // 문제 번호 (1, 2, 3, ...)
  content: string;          // 문제 내용
  options: Record<string, string>; // 선택지 {"1": "내용", "2": "내용", ...}
  answer?: string;          // 정답 ("1", "2", "3", ...)
  explanation?: string;     // 해설 (선택사항)
}
```

### ParsedResult
```typescript
interface ParsedResult {
  questions: ParsedQuestion[];
  metadata?: {
    title?: string;         // 시험 제목
    year?: number;          // 시험 연도
    subject?: string;       // 과목명
    totalQuestions?: number; // 전체 문제 수
  };
}
```

### ApiResponse
```typescript
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  details?: string;
  message?: string;
}
```

## 🔍 파일 처리 요구사항

### 지원 파일 형식
- **PDF**: 주요 지원 형식
- **최대 파일 크기**: 10MB
- **인코딩**: UTF-8

### 파싱 규칙
1. **문제 번호**: 숫자로 시작하는 패턴 인식
2. **선택지**: 1), 2), 3) 또는 ①, ②, ③ 패턴
3. **정답**: 문서 내 정답 섹션에서 추출
4. **해설**: 해설 섹션이 있는 경우 추출

## ⚠️ 에러 코드

| 코드 | 설명 | HTTP 상태 |
|------|------|-----------|
| `FILE_TOO_LARGE` | 파일 크기 초과 | 413 |
| `INVALID_FILE_FORMAT` | 지원하지 않는 파일 형식 | 400 |
| `PARSING_FAILED` | 파싱 처리 실패 | 500 |
| `FILE_NOT_FOUND` | 파일을 찾을 수 없음 | 404 |
| `INVALID_REQUEST` | 잘못된 요청 | 400 |

## 🔒 보안 고려사항

1. **파일 검증**: 업로드된 파일의 MIME 타입 확인
2. **바이러스 스캔**: 파일 업로드 시 보안 검사
3. **파일 저장**: 임시 파일 자동 삭제 (처리 후 30분)
4. **요청 제한**: Rate limiting (분당 10회)

## 📝 로깅

### 로그 레벨
- **INFO**: 정상적인 API 호출
- **WARNING**: 파싱 부분 실패
- **ERROR**: 시스템 오류
- **DEBUG**: 상세 디버깅 정보

### 로그 항목
```python
{
  "timestamp": "2023-12-01T10:00:00Z",
  "level": "INFO",
  "message": "File parsing completed",
  "metadata": {
    "file_name": "exam_2023.pdf",
    "file_size": 2048576,
    "processing_time": 15.5,
    "questions_found": 50
  }
}
```

## 🧪 개발 및 테스트

### 환경 변수
```bash
# 개발 환경
ENVIRONMENT=development
API_PORT=8001
DATABASE_URL=postgresql://user:pass@localhost/parser_db
OPENAI_API_KEY=sk-...
MAX_FILE_SIZE=10485760  # 10MB
TEMP_FILE_RETENTION=1800  # 30분

# 프로덕션 환경
ENVIRONMENT=production
API_PORT=8000
DATABASE_URL=postgresql://user:pass@prod-db/parser_db
```

### 테스트 파일
`backend/python-api/tests/` 디렉토리에 다음 테스트 파일들을 준비하세요:
- `test_pdf_samples/` - 다양한 PDF 샘플 파일
- `test_parser.py` - 파서 로직 테스트
- `test_api.py` - API 엔드포인트 테스트

## 🚢 배포 고려사항

### Docker 설정
```dockerfile
FROM python:3.9-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt
COPY . .
EXPOSE 8000
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
```

### 성능 최적화
- **비동기 처리**: 대용량 파일 처리를 위한 async/await 활용
- **캐싱**: 파싱 결과 Redis 캐싱 (선택사항)
- **큐잉**: Celery를 이용한 백그라운드 작업 처리

---

## 📞 연락처

개발 중 문의사항이 있으시면 언제든 연락하세요!
- 프론트엔드 팀과의 API 연동 테스트는 개발 완료 후 진행
- Mock 데이터를 활용한 초기 개발 권장 