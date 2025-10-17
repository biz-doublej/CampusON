from typing import Dict, Any, List, Optional
from datetime import date

from fastapi import FastAPI, File, UploadFile, HTTPException, Depends, Query, Body
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session

from app.db.database import Base, engine, get_db
from app.parsers.question_parser import question_parser
from app.core.config import settings

from app.ai.knowledge import ingest_questions_as_knowledge
from app.ai.generation import generate_questions
from app.ai.chat import chat_with_ai
from app.models.quiz import Quiz, QuizQuestion, QuizSubmission
from app.models.community import CommunityPost, CommunityComment, CommunityLike
from app.models.question import Question
from app.parsers.question_service import create_question_from_parsed_data
from app.models.knowledge import KnowledgeChunk
from app.ai import rag as rag_ai
from app.ai.pipeline import generate_validate_postprocess, commit_questions
from app.ai import deepconf as deepconf_ai
from app.ai import dupo as dupo_ai
from app.models.learning import QuestionSkill, StudentInteraction, StudentSkillState
from app.routers.community_v2 import router as community_v2_router
from app.ai.school_bot import ingest_school_docs, answer_school_query
from app.ai.department_bot import answer_department_query
from app.ai.personalization import build_personalized_plan, PersonalizationError

import tempfile
import os
import logging


# Logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="CampusON Parser + AI API", version="1.1.0")

# CORS (safer defaults for dev)
configured_origins = getattr(settings, "ALLOWED_ORIGINS", ["*"])
if configured_origins == ["*"]:
    # Browsers block credentialed requests with wildcard; also some setups behave better with explicit origins.
    allowed_origins = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ]
else:
    allowed_origins = configured_origins

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
logger.info(f"CORS allow_origins: {allowed_origins}")

# DB init
Base.metadata.create_all(bind=engine)
app.include_router(community_v2_router)


@app.get("/api/health")
def health_check():
    return {"status": "healthy", "version": "1.1.0"}


@app.get("/api/knowledge/list")
def knowledge_list(limit: int = 50, db: Session = Depends(get_db)):
    rows = db.query(KnowledgeChunk).order_by(KnowledgeChunk.id.desc()).limit(max(1, min(limit, 200))).all()
    items = [{
        "id": r.id,
        "text_preview": (r.text or "")[:200],
        "meta": r.meta,
        "created_at": r.created_at.isoformat() if r.created_at else None,
    } for r in rows]
    return {"success": True, "data": items}


@app.post("/api/parse")
async def parse_pdf_file(
    file: UploadFile = File(...),
    auto_ingest: bool = Query(True, description="파싱 후 자동으로 AI 지식베이스에 인덱싱"),
    auto_save: bool = Query(True, description="파싱 후 자동으로 DB에 문제 저장"),
    db: Session = Depends(get_db),
):
    """Parse uploaded PDF and return questions."""
    if not file.filename or not file.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="PDF 파일만 허용됩니다.")

    content = await file.read()
    file_size = len(content or b"")
    await file.seek(0)
    if file_size > 10 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="파일 크기는 10MB 이하여야 합니다.")

    tmp_file_path = None
    try:
        with tempfile.NamedTemporaryFile(delete=False, suffix=".pdf") as tmp_file:
            tmp_file.write(content)
            tmp_file_path = tmp_file.name

        logger.info(f"Parsing file: {file.filename} ({file_size} bytes)")
        try:
            result = question_parser.parse_any_file(tmp_file_path, "questions")
        except Exception as pe:
            # cleanup temp, then return structured error instead of 500
            try:
                os.unlink(tmp_file_path)
            except Exception:
                pass
            logger.error(f"Parse exception: {pe}")
            return {"success": False, "error": f"파싱 중 예외: {str(pe)}"}

        # cleanup temp
        os.unlink(tmp_file_path)

        if result.get("error"):
            logger.error(f"Parse error: {result['error']}")
            return {"success": False, "error": result["error"]}

        parsed_data = result.get("data", [])
        if not parsed_data:
            return {"success": False, "error": "추출된 데이터가 없습니다. PDF를 확인하세요."}

        questions: List[Dict[str, Any]] = []
        for item in parsed_data:
            # Normalize content with robust fallbacks
            content_text = (
                item.get("content")
                or item.get("question")
                or item.get("stem")
                or item.get("question_text")
                or item.get("text")
                or ""
            )
            if not content_text:
                desc = item.get("description")
                if isinstance(desc, list) and desc:
                    content_text = "\n".join([str(x).strip() for x in desc if str(x).strip()])
            # Normalize options: accept dict or list of option texts
            options_val = item.get("options") or {}
            if isinstance(options_val, list):
                try:
                    options_val = {str(i + 1): str(v) for i, v in enumerate(options_val)}
                except Exception:
                    options_val = {}
            questions.append({
                "number": item.get("question_number", 0),
                "content": content_text,
                "description": item.get("description", []),
                "options": options_val,
                "answer": item.get("correct_answer", ""),
                "explanation": item.get("explanation", ""),
                "subject": item.get("subject", ""),
                "area_name": item.get("area_name", ""),
                "year": item.get("year"),
            })

        metadata = {
            "title": f"{file.filename} 파싱 결과",
            "totalQuestions": len(questions),
            "subject": parsed_data[0].get("subject", "") if parsed_data else "",
            "year": parsed_data[0].get("year") if parsed_data else None,
        }

        # Auto save to DB if enabled
        saved_ids: List[int] = []
        saved_count = 0
        if auto_save:
            try:
                for it in questions:
                    qdata = {
                        "question_number": it.get("number") or it.get("question_number") or 0,
                        "content": it.get("content", ""),
                        "description": it.get("description"),
                        "options": it.get("options") or {},
                        "correct_answer": it.get("answer") or it.get("correct_answer") or "",
                        "subject": it.get("subject", ""),
                        "area_name": it.get("area_name", ""),
                        "difficulty": it.get("difficulty") or "중",
                        "year": it.get("year"),
                    }
                    q, ok = create_question_from_parsed_data(db, qdata)
                    if ok and q is not None:
                        saved_ids.append(q.id)
                db.commit()
                saved_count = len(saved_ids)
            except Exception as se:
                logger.warning(f"Auto-save to DB failed: {se}")
                db.rollback()

        # Auto-ingest to knowledge base if enabled (run after DB save attempt)
        ingested = 0
        if auto_ingest:
            try:
                ingested = ingest_questions_as_knowledge(db, questions)
                db.commit()
            except Exception as ie:
                logger.warning(f"Auto-ingest failed: {ie}")
                db.rollback()

        return {
            "success": True,
            "data": {"questions": questions, "metadata": metadata},
            "message": "파일 파싱 완료",
            "auto_ingest": auto_ingest,
            "ingested_count": ingested,
            "auto_save": auto_save,
            "saved_count": saved_count,
            "saved_question_ids": saved_ids,
        }

    except Exception as e:
        if tmp_file_path and os.path.exists(tmp_file_path):
            try:
                os.unlink(tmp_file_path)
            except Exception:
                pass
        logger.error(f"Parse failure: {e}")
        raise HTTPException(status_code=500, detail=f"파싱 중 오류: {str(e)}")


# ---------- AI Knowledge Ingest ----------
@app.post("/api/ai/ingest")
def ai_ingest(payload: Dict[str, Any] = Body(...), db: Session = Depends(get_db)):
    try:
        questions = payload.get("questions", [])
        if not isinstance(questions, list) or not questions:
            raise HTTPException(status_code=400, detail="questions 배열이 필요합니다.")
        saved = ingest_questions_as_knowledge(db, questions)
        db.commit()
        return {"success": True, "ingested": saved}
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        logger.error(f"AI ingest error: {e}")
        raise HTTPException(status_code=500, detail="지식 인덱싱 중 오류")


# ---------- AI Question Generation ----------
@app.post("/api/ai/generate-questions")
def ai_generate_questions(payload: Dict[str, Any] = Body(...), db: Session = Depends(get_db)):
    topic: str = payload.get("topic", "일반")
    count: int = int(payload.get("count", 5))
    difficulty: Optional[str] = payload.get("difficulty")
    subject: Optional[str] = payload.get("subject")
    data = generate_questions(db, topic, count, difficulty, subject)
    return {"success": True, "questions": data}


# ---------- RAG (FAISS) ----------
@app.post("/api/ai/rag/build")
def rag_build(db: Session = Depends(get_db)):
    res = rag_ai.build_index(db)
    return res


@app.post("/api/ai/rag/query")
def rag_query(payload: Dict[str, Any] = Body(...), db: Session = Depends(get_db)):
    query = payload.get("query", "")
    top_k = int(payload.get("top_k", 5))
    results = rag_ai.query_index(db, query, top_k)
    return {"success": True, "results": results}


# ---------- Community AI Chat ----------
@app.post("/api/community/ai/chat")
def community_ai_chat(payload: Dict[str, Any] = Body(...)):
    messages: List[Dict[str, str]] = payload.get("messages", [])
    context: Optional[str] = payload.get("context")
    if not messages:
        raise HTTPException(status_code=400, detail="messages가 필요합니다.")
    reply = chat_with_ai(messages, context)
    return {"success": True, "reply": reply}


# ---------- Quiz APIs ----------
@app.post("/api/quiz/create")
def create_quiz(payload: Dict[str, Any] = Body(...), db: Session = Depends(get_db)):
    title = payload.get("title") or "생성 퀴즈"
    questions: List[Dict[str, Any]] = payload.get("questions", [])
    if not questions:
        raise HTTPException(status_code=400, detail="questions 배열이 필요합니다.")
    quiz = Quiz(title=title)
    db.add(quiz)
    db.flush()
    order = 1
    for q in questions:
        qid = q.get("id") or q.get("question_id")
        if not qid:
            continue
        db.add(QuizQuestion(quiz_id=quiz.id, question_id=int(qid), display_order=order))
        order += 1
    db.commit()
    return {"success": True, "quiz": {"id": quiz.id, "title": quiz.title, "count": order - 1}}


@app.get("/api/quiz/{quiz_id}")
def get_quiz(quiz_id: int, db: Session = Depends(get_db)):
    from app.models.question import Question
    qqs = db.query(QuizQuestion).filter(QuizQuestion.quiz_id == quiz_id).order_by(QuizQuestion.display_order).all()
    if not qqs:
        raise HTTPException(status_code=404, detail="퀴즈가 없거나 비어있습니다.")
    qids = [qq.question_id for qq in qqs]
    qs = db.query(Question).filter(Question.id.in_(qids)).all()
    by_id = {q.id: q for q in qs}
    items: List[Dict[str, Any]] = []
    for qq in qqs:
        q = by_id.get(qq.question_id)
        if not q:
            continue
        items.append({
            "id": q.id,
            "number": q.question_number,
            "content": q.content,
            "options": q.options or {},
            "difficulty": str(getattr(q.difficulty, 'value', '중')),
        })
    return {"success": True, "quiz": {"id": quiz_id, "items": items}}


@app.post("/api/quiz/{quiz_id}/submit")
def submit_quiz(quiz_id: int, payload: Dict[str, Any] = Body(...), db: Session = Depends(get_db)):
    answers: Dict[str, str] = payload.get("answers", {})
    student_id: str = payload.get("student_id", "anon")
    if not isinstance(answers, dict) or not answers:
        raise HTTPException(status_code=400, detail="answers가 필요합니다.")
    from app.models.question import Question
    qqs = db.query(QuizQuestion).filter(QuizQuestion.quiz_id == quiz_id).all()
    qids = [qq.question_id for qq in qqs]
    qs = db.query(Question).filter(Question.id.in_(qids)).all()
    by_id = {q.id: q for q in qs}
    total = 0
    correct = 0
    for qid_str, choice in answers.items():
        try:
            qid = int(qid_str)
        except Exception:
            continue
        q = by_id.get(qid)
        if not q:
            continue
        total += 1
        if (q.correct_answer or "").strip() == str(choice).strip():
            correct += 1
    score_pct = int(round(100 * (correct / total), 0)) if total > 0 else 0
    sub = QuizSubmission(quiz_id=quiz_id, student_id=student_id, answers=answers, score=score_pct)
    db.add(sub)
    db.commit()
    return {"success": True, "score": score_pct, "correct": correct, "total": total}


# ---------- Community CRUD ----------
@app.post("/api/community/posts")
def create_post(payload: Dict[str, Any] = Body(...), db: Session = Depends(get_db)):
    title = payload.get("title")
    content = payload.get("content")
    author_id = payload.get("author_id", "anon")
    if not title or not content:
        raise HTTPException(status_code=400, detail="title, content 필수")
    post = CommunityPost(title=title, content=content, author_id=author_id)
    db.add(post)
    db.commit()
    db.refresh(post)
    return {"success": True, "post": {"id": post.id, "title": post.title, "content": post.content}}


@app.get("/api/community/posts")
def list_posts(db: Session = Depends(get_db)):
    posts = db.query(CommunityPost).order_by(CommunityPost.created_at.desc()).all()
    data = [{"id": p.id, "title": p.title, "content": p.content, "author_id": p.author_id, "created_at": p.created_at.isoformat()} for p in posts]
    return {"success": True, "posts": data}


@app.post("/api/community/posts/{post_id}/comments")
def add_comment(post_id: int, payload: Dict[str, Any] = Body(...), db: Session = Depends(get_db)):
    content = payload.get("content")
    author_id = payload.get("author_id", "anon")
    if not content:
        raise HTTPException(status_code=400, detail="content 필수")
    c = CommunityComment(post_id=post_id, content=content, author_id=author_id)
    db.add(c)
    db.commit()
    return {"success": True}


@app.post("/api/community/posts/{post_id}/likes")
def add_like(post_id: int, payload: Dict[str, Any] = Body({}), db: Session = Depends(get_db)):
    user_id = payload.get("user_id", "anon")
    like = CommunityLike(post_id=post_id, user_id=user_id)
    db.add(like)
    db.commit()
    return {"success": True}


# ---------- School Notices Proxy (optional) ----------
@app.get("/api/notices/proxy")
def notices_proxy(url: str = Query(..., description="학교 공지 URL")):
    try:
        import requests
        resp = requests.get(url, timeout=10)
        content_type = resp.headers.get("Content-Type", "text/html")
        return {
            "success": True,
            "content_type": content_type,
            "status_code": resp.status_code,
            "html": resp.text,
        }
    except Exception as e:
        logger.warning(f"Notice proxy failed: {e}")
        raise HTTPException(status_code=502, detail="원격 사이트에 접속 실패")


# ---------- Question Management ----------
@app.post("/api/questions/bulk")
def save_questions_bulk(payload: Dict[str, Any] = Body(...), db: Session = Depends(get_db)):
    """Save parsed questions to DB questions table.
    Accepts same structure as parser/generator output.
    """
    items = payload.get("questions", [])
    if not isinstance(items, list) or not items:
        raise HTTPException(status_code=400, detail="questions 배열이 필요합니다.")
    saved_ids: List[int] = []
    try:
        for it in items:
            qdata = {
                "question_number": it.get("number") or it.get("question_number") or 0,
                "content": it.get("content", ""),
                "description": it.get("description"),
                "options": it.get("options") or {},
                "correct_answer": it.get("answer") or it.get("correct_answer") or "",
                "subject": it.get("subject", ""),
                "area_name": it.get("area_name", ""),
                "difficulty": it.get("difficulty") or "중",
                "year": it.get("year"),
            }
            q, ok = create_question_from_parsed_data(db, qdata)
            if ok and q is not None:
                saved_ids.append(q.id)
        db.commit()
    except Exception as e:
        db.rollback()
        logger.error(f"save_questions_bulk error: {e}")
        raise HTTPException(status_code=500, detail="질문 저장 중 오류")
    return {"success": True, "question_ids": saved_ids, "count": len(saved_ids)}


@app.get("/api/questions")
def list_questions(db: Session = Depends(get_db), limit: int = 50, offset: int = 0):
    q = db.query(Question).order_by(Question.id.desc()).offset(offset).limit(limit).all()
    data = [{
        "id": x.id,
        "number": x.question_number,
        "content": x.content,
        "options": x.options or {},
        "answer": x.correct_answer,
        "subject": x.subject,
        "difficulty": getattr(x.difficulty, 'value', '중'),
        "year": x.year,
    } for x in q]
    return {"success": True, "items": data, "count": len(data)}


@app.delete("/api/questions/{question_id}")
def delete_question(question_id: int, db: Session = Depends(get_db)):
    q = db.query(Question).get(question_id)
    if not q:
        raise HTTPException(status_code=404, detail="Question not found")
    db.delete(q)
    db.commit()
    return {"success": True}


@app.post("/api/questions/delete-bulk")
def delete_questions_bulk(payload: Dict[str, Any] = Body(...), db: Session = Depends(get_db)):
    ids = payload.get("ids", [])
    if not isinstance(ids, list) or not ids:
        raise HTTPException(status_code=400, detail="ids array is required")
    try:
        db.query(Question).filter(Question.id.in_([int(x) for x in ids])).delete(synchronize_session=False)
        db.commit()
    except Exception:
        db.rollback()
        raise HTTPException(status_code=500, detail="Bulk delete failed")
    return {"success": True, "deleted": len(ids)}


# ---------- CoA Pipeline ----------
@app.post("/api/ai/coa/generate-and-commit")
def coa_generate_and_commit(payload: Dict[str, Any] = Body(...), db: Session = Depends(get_db)):
    topic: str = payload.get("topic", "일반")
    count: int = int(payload.get("count", 5))
    difficulty: Optional[str] = payload.get("difficulty", "중")
    subject: Optional[str] = payload.get("subject")
    config: Optional[Dict[str, Any]] = payload.get("config")
    res = generate_validate_postprocess(db, topic, count, difficulty or "중", subject, config)
    commit = commit_questions(db, res["items"], source_name="AI")
    return {"success": True, "result": res, "commit": commit}


# ---------- DeepConf ----------
@app.post("/api/ai/deepconf/tune")
def deepconf_tune(payload: Dict[str, Any] = Body(...), db: Session = Depends(get_db)):
    subject: str = payload.get("subject", "물리치료학")
    topic: str = payload.get("topic", "일반")
    difficulty: str = payload.get("difficulty", "중")
    trials: int = int(payload.get("trials", 8))
    res = deepconf_ai.random_search(db, subject, topic, difficulty, trials)
    return res


@app.get("/api/ai/deepconf/get")
def deepconf_get():
    best = deepconf_ai.get_best()
    return {"success": best is not None, "best": best}


# ---------- DuPO ----------
@app.post("/api/ai/dupo/choose")
def dupo_choose(payload: Dict[str, Any] = Body(...)):
    policies = payload.get("policies", [])
    weights = payload.get("weights", {"schema":0.3, "domain":0.3, "difficulty":0.2, "novelty":0.2})
    best = dupo_ai.choose_policy(policies, weights)
    return {"success": True, "best": best}


# ---------- DKT (simplified BKT-like) ----------
def _update_skill_state(db: Session, student_id: str, skill: str, correct: bool):
    # Simple Bayesian update: p' = p + alpha*(1-p) if correct else p*(1-alpha)
    alpha = 0.2
    st = db.query(StudentSkillState).filter(StudentSkillState.student_id==student_id, StudentSkillState.skill==skill).first()
    if not st:
        st = StudentSkillState(student_id=student_id, skill=skill, p_mastery=0.5)
        db.add(st)
    if correct:
        st.p_mastery = st.p_mastery + alpha*(1.0 - st.p_mastery)
    else:
        st.p_mastery = st.p_mastery*(1.0 - alpha)


@app.post("/api/dkt/interaction")
def dkt_interaction(payload: Dict[str, Any] = Body(...), db: Session = Depends(get_db)):
    student_id: str = payload.get("student_id")
    question_id: int = int(payload.get("question_id"))
    correct: bool = bool(payload.get("correct", False))
    if not student_id or not question_id:
        raise HTTPException(status_code=400, detail="student_id, question_id 필수")
    inter = StudentInteraction(student_id=student_id, question_id=question_id, correct=correct)
    db.add(inter)
    # update skill states
    skills = db.query(QuestionSkill).filter(QuestionSkill.question_id==question_id).all()
    for s in skills:
        _update_skill_state(db, student_id, s.skill, correct)
    db.commit()
    return {"success": True}


@app.get("/api/dkt/recommend")
def dkt_recommend(student_id: str, k: int = 5, db: Session = Depends(get_db)):
    # Recommend questions targeting skills with mid-range mastery (practice zone)
    # 1) collect skill states
    states = db.query(StudentSkillState).filter(StudentSkillState.student_id==student_id).all()
    target_skills = [s.skill for s in states if 0.3 <= s.p_mastery <= 0.7]
    if not target_skills:
        target_skills = [s.skill for s in states] or []
    # 2) sample questions having those skills
    qids = db.query(QuestionSkill).filter(QuestionSkill.skill.in_(target_skills)).all()
    ids = list({qs.question_id for qs in qids})
    qs = db.query(Question).filter(Question.id.in_(ids)).limit(k).all()
    items = [{
        "id": q.id,
        "number": q.question_number,
        "content": q.content,
        "options": q.options or {},
        "difficulty": str(getattr(q.difficulty, 'value', '중')),
    } for q in qs]
    return {"success": True, "items": items}


@app.get("/ai-tutoring/personalized-plan")
def ai_personalized_plan(
    department: str = Query(..., description="학과 키 (예: nursing, physical_therapy)"),
    student_id: str = Query("anon", description="학생 식별자"),
    target_exam_date: Optional[date] = Query(None, description="목표 시험일 (YYYY-MM-DD)"),
    db: Session = Depends(get_db),
):
    try:
        plan = build_personalized_plan(
            db,
            student_id=student_id,
            department=department,
            target_exam_date=target_exam_date,
        )
        return {"success": True, "plan": plan}
    except PersonalizationError as pe:
        raise HTTPException(status_code=400, detail=str(pe))


# ---------- School Info AI ----------
@app.post("/api/school/ingest")
def school_ingest(payload: Dict[str, Any] = Body(...), db: Session = Depends(get_db)):
    docs = payload.get("docs", [])  # [{text, url?, meta?}]
    if not isinstance(docs, list) or not docs:
        raise HTTPException(status_code=400, detail="docs 배열이 필요합니다.")
    res = ingest_school_docs(db, docs)
    return res


@app.post("/api/school/ai/query")
def school_ai_query(payload: Dict[str, Any] = Body(...), db: Session = Depends(get_db)):
    query = payload.get("query", "")
    top_k = int(payload.get("top_k", 5))
    urls = payload.get("urls")
    if not query:
        raise HTTPException(status_code=400, detail="query 필수")
    res = answer_school_query(db, query, top_k=top_k, urls=urls)
    return res


# ---------- Department Course Q&A ----------
@app.post("/api/department/ai/query")
def department_ai_query(payload: Dict[str, Any] = Body(...), db: Session = Depends(get_db)):
    query = payload.get("query", "")
    department = payload.get("department", "")
    course = payload.get("course")
    top_k = int(payload.get("top_k", 5))
    if not query or not department:
        raise HTTPException(status_code=400, detail="query, department required")
    return answer_department_query(db, query, department=department, top_k=top_k, course=course)
