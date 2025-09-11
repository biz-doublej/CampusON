from typing import List, Dict, Any, Optional
import logging
import os

from sqlalchemy.orm import Session
from app.models.knowledge import KnowledgeChunk
from app.utils.embedding_utils import create_embedding
from . import rag as rag_ai

logger = logging.getLogger(__name__)


def ingest_school_docs(db: Session, docs: List[Dict[str, Any]]) -> Dict[str, Any]:
    """Ingest school-related documents into the knowledge base.

    docs item: { text: str, url?: str, meta?: dict }
    """
    saved = 0
    for d in docs:
        text = (d.get("text") or "").strip()
        if not text:
            continue
        # embedding (optional; provider is selected by env EMBEDDING_PROVIDER)
        emb = create_embedding(text)
        chunk = KnowledgeChunk(
            text=text,
            meta={"type": "school", "url": d.get("url"), **(d.get("meta") or {})},
            embedding=emb if isinstance(emb, list) else emb,
        )
        db.add(chunk)
        saved += 1
    db.commit()
    # rebuild index
    try:
        rag_ai.build_index(db)
    except Exception:
        pass
    return {"success": True, "ingested": saved}


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


def answer_school_query(db: Session, query: str, top_k: int = 5, urls: Optional[List[str]] = None) -> Dict[str, Any]:
    """Answer school information queries using RAG over KnowledgeChunk and optional URLs.
    If urls are provided, they should be ingested upstream; here we only query.
    """
    # retrieve
    hits = rag_ai.query_index(db, query, top_k=top_k)
    context_snippets = [h.get("text") for h in hits if h.get("text")]
    # build answer
    model = _init_model()
    if model and context_snippets:
        try:
            prompt = (
                "당신은 경복대학교 안내 봇입니다. 아래 자료를 근거로 질문에 한국어로 간결하게 답하세요.\n"
                f"질문: {query}\n\n"
                "자료:\n" + "\n---\n".join(context_snippets[:top_k]) + "\n\n"
                "정확한 서비스/공지/학과/교수 정보를 우선 제공하고, 불확실하면 '관련 정보가 부족합니다'라고 답하세요."
            )
            resp = model.generate_content(prompt)  # type: ignore
            text = getattr(resp, 'text', '') or ''
            return {"success": True, "answer": text.strip(), "sources": hits}
        except Exception as e:
            logger.warning(f"school bot LLM failed: {e}")
    # fallback: return top snippets
    answer = ("\n\n".join(context_snippets[:3]) or "관련 정보가 부족합니다.").strip()
    return {"success": True, "answer": answer, "sources": hits}
