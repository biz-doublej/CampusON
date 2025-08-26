# 🚀 완전한 국가고시 AI 튜터링 시스템

## 📋 시스템 개요

이 시스템은 국가고시 준비생들을 위한 완전한 AI 기반 학습 플랫폼입니다. 파일 업로드부터 AI 해설 생성, 실시간 질의응답, 지식베이스 검색, 개인화된 튜터링까지 모든 기능을 제공합니다.

### 🎯 핵심 기능

1. **📁 문제 파일 업로드 → 자동 분석 → AI 해설 생성**
   - PDF, Excel, CSV 파일 지원
   - 자동 문제 추출 및 분석
   - HyperCLOVA 기반 AI 해설 생성
   - 지식베이스 자동 인덱싱

2. **💬 실시간 질의응답 시스템**
   - WebSocket 기반 실시간 채팅
   - HTTP API 기반 일반 Q&A
   - 대화 히스토리 관리
   - 상황별 맞춤 응답

3. **🔍 지식베이스 기반 스마트 검색**
   - 시맨틱 검색 (의미 기반)
   - 키워드 검색
   - 하이브리드 검색
   - 추천 시스템

4. **🎓 국가고시 맞춤형 AI 튜터링**
   - 개인화된 학습 경로
   - 적응형 문제 제공
   - 실시간 성과 분석
   - 지식 상태 추적

5. **🌟 통합 워크플로우**
   - 전체 학습 사이클 관리
   - 빠른 도움말
   - 가이드형 학습
   - 평가 기반 학습

## 🏗️ 시스템 아키텍처

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   사용자 인터페이스   │    │    백엔드 API     │    │   HyperCLOVA    │
│   (Frontend)    │◄──►│   (FastAPI)     │◄──►│     서버       │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                              │
                              ▼
        ┌─────────────────────────────────────────────────┐
        │                 핵심 서비스                      │
        ├─────────────────┬─────────────────┬─────────────┤
        │  파일 처리 서비스   │  실시간 Q&A     │  AI 튜터링   │
        │  - 파일 파싱      │  - WebSocket    │  - 학습 경로  │
        │  - AI 해설 생성   │  - 대화 관리     │  - 문제 생성  │
        │  - 자동 인덱싱    │  - 참조 검색     │  - 진도 추적  │
        └─────────────────┴─────────────────┴─────────────┘
                              │
        ┌─────────────────────────────────────────────────┐
        │                 데이터 계층                      │
        ├─────────────────┬─────────────────┬─────────────┤
        │   PostgreSQL    │     Qdrant      │   Redis     │
        │   (관계형 DB)    │   (벡터 DB)     │   (캐시)    │
        └─────────────────┴─────────────────┴─────────────┘
```

## 🚀 빠른 시작

### 1. 전체 시스템 실행 (권장)

```powershell
# 모든 서비스 실행 (HyperCLOVA + 백엔드)
.\run_complete_system.ps1

# HyperCLOVA 없이 빠른 실행
.\run_complete_system.ps1 -Mode quick

# 테스트만 실행
.\run_complete_system.ps1 -TestOnly
```

### 2. 개별 서비스 실행

#### HyperCLOVA 서버 실행
```bash
# Docker로 실행
docker-compose -f docker-compose.hyperclova.yml up -d

# 직접 실행 (Windows PowerShell)
.\run_hyperclova.ps1
```

#### 백엔드 서버 실행
```bash
# 가상환경 활성화
venv\Scripts\activate  # Windows
source venv/bin/activate  # Linux/Mac

# 서버 시작
python main.py
```

### 3. 시스템 테스트
```bash
# 전체 시스템 테스트
python test_complete_system.py --mode full

# 빠른 테스트
python test_complete_system.py --mode quick
```

## 📚 API 사용 가이드

### 🔑 인증

모든 API는 JWT 토큰 기반 인증을 사용합니다.

```bash
# 로그인
curl -X POST "http://localhost:8000/auth/login" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "username=your_email&password=your_password"

# 응답에서 access_token을 사용
Authorization: Bearer <access_token>
```

### 📁 1. 파일 처리 시스템

#### 파일 업로드 및 처리
```bash
curl -X POST "http://localhost:8000/file-processing/upload" \
  -H "Authorization: Bearer <token>" \
  -F "file=@questions.pdf" \
  -F "department=physical_therapy" \
  -F "generate_explanations=true"
```

#### 처리 상태 확인
```bash
curl -X GET "http://localhost:8000/file-processing/status/{task_id}" \
  -H "Authorization: Bearer <token>"
```

#### 처리 결과 조회
```bash
curl -X GET "http://localhost:8000/file-processing/results/{task_id}" \
  -H "Authorization: Bearer <token>"
```

### 💬 2. 실시간 질의응답

#### HTTP 기반 Q&A
```bash
curl -X POST "http://localhost:8000/realtime-qa/ask" \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "question": "물리치료에서 스트레칭의 효과는?",
    "department": "physical_therapy",
    "include_references": true
  }'
```

#### WebSocket 실시간 채팅
```javascript
// JavaScript 예시
const ws = new WebSocket('ws://localhost:8000/realtime-qa/ws/client_123');

ws.onmessage = function(event) {
    const data = JSON.parse(event.data);
    console.log('AI 응답:', data);
};

// 메시지 전송
ws.send(JSON.stringify({
    "message": "간호학 기본 원리를 설명해주세요",
    "type": "question",
    "department": "nursing"
}));
```

### 🔍 3. 지식베이스 검색

#### 시맨틱 검색
```bash
curl -X GET "http://localhost:8000/knowledge-base/search" \
  -H "Authorization: Bearer <token>" \
  -G \
  -d "query=물리치료 재활운동" \
  -d "search_type=semantic" \
  -d "department=physical_therapy" \
  -d "limit=10"
```

#### 하이브리드 검색 (추천)
```bash
curl -X GET "http://localhost:8000/knowledge-base/search" \
  -H "Authorization: Bearer <token>" \
  -G \
  -d "query=간호학 기본 개념" \
  -d "search_type=hybrid" \
  -d "department=nursing"
```

### 🎓 4. AI 튜터링 시스템

#### 튜터링 세션 생성
```bash
curl -X POST "http://localhost:8000/ai-tutoring/sessions" \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "department": "physical_therapy",
    "learning_goal": "exam_prep",
    "difficulty_level": "intermediate",
    "study_mode": "guided",
    "session_duration": 60
  }'
```

#### 문제 생성 요청
```bash
curl -X POST "http://localhost:8000/ai-tutoring/sessions/{session_id}/problems" \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "session_id": "session_123",
    "topic": "스트레칭 기법",
    "count": 5
  }'
```

#### 답안 제출
```bash
curl -X POST "http://localhost:8000/ai-tutoring/sessions/{session_id}/submit" \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "session_id": "session_123",
    "problem_id": "problem_456",
    "answer": "A",
    "time_spent": 120,
    "confidence_level": 4
  }'
```

### 🌟 5. 통합 워크플로우

#### 완전한 학습 사이클 시작
```bash
curl -X POST "http://localhost:8000/integrated/workflow/start" \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "workflow_type": "full_study_cycle",
    "department": "nursing",
    "user_goal": "간호사 국가고시 준비"
  }'
```

#### 빠른 도움말
```bash
curl -X POST "http://localhost:8000/integrated/workflow/start" \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "workflow_type": "quick_help",
    "department": "physical_therapy",
    "user_goal": "스트레칭 방법을 알고 싶습니다"
  }'
```

#### 가이드형 학습
```bash
curl -X POST "http://localhost:8000/integrated/workflow/start" \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "workflow_type": "guided_learning",
    "department": "computer_science",
    "user_goal": "알고리즘 체계적 학습"
  }'
```

## 📊 대시보드 및 분석

### 사용자 대시보드
```bash
curl -X GET "http://localhost:8000/integrated/dashboard" \
  -H "Authorization: Bearer <token>"
```

### 성과 분석
```bash
curl -X GET "http://localhost:8000/ai-tutoring/analytics/performance" \
  -H "Authorization: Bearer <token>" \
  -G \
  -d "department=nursing" \
  -d "days=30"
```

### 개인화된 학습 계획
```bash
curl -X GET "http://localhost:8000/ai-tutoring/personalized-plan" \
  -H "Authorization: Bearer <token>" \
  -G \
  -d "department=physical_therapy" \
  -d "target_exam_date=2024-12-01"
```

## 🔧 고급 설정

### 환경 변수 설정

```bash
# .env 파일 생성
HYPERCLOVA_API_URL=http://localhost:8001
DATABASE_URL=postgresql://user:password@localhost/dbname
QDRANT_URL=http://localhost:6333
REDIS_URL=redis://localhost:6379
JWT_SECRET_KEY=your_secret_key
LOG_LEVEL=INFO
```

### HyperCLOVA 서버 설정

```yaml
# docker-compose.hyperclova.yml
version: '3.8'
services:
  hyperclova:
    build:
      context: .
      dockerfile: Dockerfile.hyperclova
    ports:
      - "8001:8000"
    environment:
      - CUDA_VISIBLE_DEVICES=0
      - TORCH_CUDA_ARCH_LIST=7.5  # RTX 3070용
    deploy:
      resources:
        reservations:
          devices:
            - driver: nvidia
              count: 1
              capabilities: [gpu]
```

### 지식베이스 설정

```python
# Qdrant 컬렉션 초기화
from qdrant_client import QdrantClient
from qdrant_client.models import Distance, VectorParams

client = QdrantClient("localhost", port=6333)
client.create_collection(
    collection_name="knowledge_base",
    vectors_config=VectorParams(size=768, distance=Distance.COSINE)
)
```

## 🧪 테스트 가이드

### 단위 테스트
```bash
# 특정 모듈 테스트
python -m pytest tests/test_file_processing.py -v
python -m pytest tests/test_qa_system.py -v
python -m pytest tests/test_tutoring.py -v
```

### 통합 테스트
```bash
# 전체 시스템 통합 테스트
python test_complete_system.py --mode comprehensive

# 성능 테스트
python test_complete_system.py --mode performance

# 부하 테스트
python test_complete_system.py --mode load --concurrent 10
```

### 수동 테스트

1. **파일 업로드 테스트**
   - `uploads/questions/` 폴더에 테스트 파일 준비
   - API 문서에서 파일 업로드 실행
   - 결과 확인

2. **실시간 채팅 테스트**
   - WebSocket 클라이언트 연결
   - 다양한 질문 전송
   - 응답 품질 확인

3. **튜터링 세션 테스트**
   - 세션 생성 후 문제 풀이
   - 답안 제출 및 피드백 확인
   - 진도 추적 확인

## 📈 성능 최적화

### 1. HyperCLOVA 최적화
```python
# GPU 메모리 최적화
torch.cuda.empty_cache()
model.half()  # FP16 사용

# 배치 처리
batch_size = 4  # RTX 3070 기준
```

### 2. 데이터베이스 최적화
```sql
-- 인덱스 생성
CREATE INDEX idx_questions_department ON questions(department);
CREATE INDEX idx_sessions_user_id ON study_sessions(user_id);
```

### 3. 캐싱 전략
```python
# Redis 캐싱
from redis import Redis
redis_client = Redis(host='localhost', port=6379, db=0)

# 검색 결과 캐싱
cache_key = f"search:{query_hash}"
cached_result = redis_client.get(cache_key)
```

## 🔒 보안 고려사항

### 1. 인증 및 권한
- JWT 토큰 기반 인증
- 역할 기반 접근 제어
- API 요청 제한

### 2. 데이터 보호
- 파일 업로드 크기 제한 (50MB)
- 허용된 파일 형식만 업로드
- 사용자 데이터 암호화

### 3. API 보안
- CORS 설정
- Rate Limiting
- 입력 데이터 검증

## 🚨 문제 해결

### 일반적인 문제

1. **HyperCLOVA 서버 연결 실패**
   ```bash
   # Docker 상태 확인
   docker ps | grep hyperclova
   
   # 로그 확인
   docker logs hyperclova-container
   
   # 재시작
   docker-compose -f docker-compose.hyperclova.yml restart
   ```

2. **메모리 부족 오류**
   ```python
   # GPU 메모리 정리
   torch.cuda.empty_cache()
   
   # 배치 크기 감소
   batch_size = 1
   ```

3. **데이터베이스 연결 오류**
   ```bash
   # PostgreSQL 상태 확인
   pg_isready -h localhost -p 5432
   
   # 연결 테스트
   psql -h localhost -U username -d dbname
   ```

### 로그 확인

```bash
# 백엔드 로그
tail -f logs/main.log

# HyperCLOVA 로그
docker logs -f hyperclova-container

# 시스템 로그
tail -f logs/server.log
```

## 📞 지원 및 문의

- **이슈 리포팅**: GitHub Issues
- **문서**: `/docs` 엔드포인트
- **API 문서**: `http://localhost:8000/docs`
- **OpenAPI 스키마**: `http://localhost:8000/openapi.json`

## 🎉 축하합니다!

모든 핵심 기능이 성공적으로 구현되었습니다:

✅ **파일 처리 시스템** - 자동 분석 및 AI 해설 생성  
✅ **실시간 질의응답** - WebSocket + HTTP 지원  
✅ **지식베이스 검색** - 시맨틱/하이브리드 검색  
✅ **AI 튜터링** - 개인화된 학습 경로  
✅ **통합 워크플로우** - 완전한 학습 사이클  
✅ **HyperCLOVA 연동** - GPU 최적화 추론  

이제 국가고시 준비생들이 최고의 AI 기반 학습 경험을 할 수 있습니다! 🚀 