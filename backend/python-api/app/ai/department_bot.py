from typing import List, Dict, Any, Optional
import logging
import os

from sqlalchemy.orm import Session
from app.models.knowledge import KnowledgeChunk
from . import rag as rag_ai

logger = logging.getLogger(__name__)


def _init_model():
    try:
        import google.generativeai as genai  # type: ignore
    except Exception:
        return None
    api_key = os.getenv("GEMINI_API_KEY") or os.getenv("GOOGLE_API_KEY")
    if not api_key:
        return None
    try:
        genai.configure(api_key=api_key)  # type: ignore
        from app.core.config import settings
        model_name = getattr(settings, 'GEMINI_MODEL_NAME', 'gemini-2.0-flash-exp')
        return genai.GenerativeModel(model_name)  # type: ignore
    except Exception:
        return None


def answer_department_query(
    db: Session,
    query: str,
    department: str,
    top_k: int = 5,
    course: Optional[str] = None,
) -> Dict[str, Any]:
    # retrieve wider then filter by meta
    raw_hits = rag_ai.query_index(db, query, top_k=max(top_k * 5, 10))
    dep = (department or '').strip().lower()
    course_norm = (course or '').strip().lower()

    hits: List[Dict[str, Any]] = []
    for h in raw_hits:
        meta = h.get('meta') or {}
        h_dep = str(meta.get('department', '')).lower()
        h_course = str(meta.get('course', '')).lower()
        if not dep or h_dep == dep:
            if not course_norm or (course_norm and course_norm in h_course):
                hits.append(h)
        if len(hits) >= top_k:
            break

    # If nothing matched department filter, fallback to direct LIKE with filter
    if not hits:
        like = f"%{query}%"
        rows = db.query(KnowledgeChunk).filter(KnowledgeChunk.text.ilike(like)).order_by(KnowledgeChunk.id.desc()).limit(top_k * 5).all()
        for r in rows:
            meta = r.meta or {}
            h_dep = str(meta.get('department', '')).lower()
            h_course = str(meta.get('course', '')).lower()
            if (not dep or h_dep == dep) and (not course_norm or course_norm in h_course):
                hits.append({
                    'id': r.id,
                    'text': r.text,
                    'meta': r.meta,
                })
            if len(hits) >= top_k:
                break

    # Compose answer
    context_snippets = [h.get('text') for h in hits if h.get('text')]
    model = _init_model()
    if model and context_snippets:
        try:
            prompt = (
                "당신은 물리치료학과 학생의 전공 질문에 교재 기반으로 답하는 조교입니다.\n"
                f"질문: {query}\n\n"
                "핵심 근거:\n" + "\n---\n".join(context_snippets[:top_k]) + "\n\n"
                "정확하고 간결하게, 학생 눈높이로 설명하세요. 필요한 경우 용어 정리도 포함하세요."
            )
            resp = model.generate_content(prompt)  # type: ignore
            text = getattr(resp, 'text', '') or ''
            return {"success": True, "answer": text.strip(), "sources": hits}
        except Exception as e:
            logger.warning(f"department bot LLM failed: {e}")

    answer = ("\n\n".join(context_snippets[:3]) or "관련 텍스트를 찾지 못했습니다.").strip()
    return {"success": True, "answer": answer, "sources": hits}

