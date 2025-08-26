from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from app.db.database import Base, engine
from app.core.config import settings
from app.parsers.question_parser import question_parser
import tempfile
import os
import logging

# 로깅 설정
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="CampusON Parser API", version="1.0.0")

# CORS 미들웨어 추가
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # 개발 환경에서는 모든 origins 허용
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 개발 편의: 최초 기동 시 스키마 생성
Base.metadata.create_all(bind=engine)


@app.get("/api/health")
def health_check():
    return {"status": "healthy", "version": "1.0.0"}


@app.post("/api/parse")
async def parse_pdf_file(file: UploadFile = File(...)):
    """
    PDF 파일을 업로드하고 파싱하여 문제를 추출합니다.
    """
    # 파일 타입 검증
    if not file.filename or not file.filename.lower().endswith('.pdf'):
        raise HTTPException(status_code=400, detail="PDF 파일만 지원됩니다.")
    
    # 파일 크기 검증 (10MB 제한)
    file_size = 0
    content = await file.read()
    file_size = len(content)
    await file.seek(0)  # 파일 포인터 리셋
    
    if file_size > 10 * 1024 * 1024:  # 10MB
        raise HTTPException(status_code=400, detail="파일 크기는 10MB를 초과할 수 없습니다.")
    
    tmp_file_path = None
    try:
        # 임시 파일로 저장
        with tempfile.NamedTemporaryFile(delete=False, suffix='.pdf') as tmp_file:
            if 'content' not in locals():
                content = await file.read()
            tmp_file.write(content)
            tmp_file_path = tmp_file.name
        
        logger.info(f"파일 파싱 시작: {file.filename} ({file_size} bytes)")
        
        # 파일 파싱
        result = question_parser.parse_any_file(tmp_file_path, "questions")
        
        # 임시 파일 삭제
        os.unlink(tmp_file_path)
        
        # 파싱 결과 검증
        if result.get("error"):
            logger.error(f"파싱 오류: {result['error']}")
            return {
                "success": False,
                "error": result["error"]
            }
        
        parsed_data = result.get("data", [])
        
        if not parsed_data:
            return {
                "success": False,
                "error": "파싱된 문제가 없습니다. PDF 형식을 확인해주세요."
            }
        
        # 응답 형식에 맞게 변환
        questions = []
        for item in parsed_data:
            question = {
                "number": item.get("question_number", 0),
                "content": item.get("content", ""),
                "description": item.get("description", []),  # 박스 내용 포함
                "options": item.get("options", {}),
                "answer": item.get("correct_answer", ""),
                "explanation": item.get("explanation", "")
            }
            questions.append(question)
        
        # 메타데이터 생성
        metadata = {
            "title": f"{file.filename} 파싱 결과",
            "totalQuestions": len(questions),
            "subject": parsed_data[0].get("subject", "") if parsed_data else "",
            "year": parsed_data[0].get("year") if parsed_data else None
        }
        
        logger.info(f"파싱 완료: {len(questions)}개 문제 추출")
        
        return {
            "success": True,
            "data": {
                "questions": questions,
                "metadata": metadata
            },
            "message": "파일 파싱 성공"
        }
        
    except Exception as e:
        # 임시 파일 정리
        if tmp_file_path and os.path.exists(tmp_file_path):
            os.unlink(tmp_file_path)
        
        logger.error(f"파싱 중 오류 발생: {str(e)}")
        raise HTTPException(
            status_code=500, 
            detail=f"파일 파싱 중 오류가 발생했습니다: {str(e)}"
        )


