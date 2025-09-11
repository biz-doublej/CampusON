from typing import List, Dict, Any
from sqlalchemy.orm import Session
from app.models.knowledge import KnowledgeChunk
from app.utils.embedding_utils import create_embedding


def ingest_questions_as_knowledge(db: Session, questions: List[Dict[str, Any]]) -> int:
    """Ingest parsed questions into knowledge base as chunks.

    Each question becomes one chunk combining content and options.
    """
    saved = 0
    for q in questions:
        text_parts: List[str] = []
        if q.get("content"):
            text_parts.append(str(q.get("content")))
        options = q.get("options") or {}
        if isinstance(options, dict) and options:
            # join as "1) text 2) text ..."
            opt_str = " ".join([f"{k}) {v}" for k, v in options.items()])
            text_parts.append(opt_str)
        description = q.get("description")
        if isinstance(description, list) and description:
            text_parts.append("\n".join(map(str, description)))
        chunk_text = "\n".join(text_parts).strip()
        if not chunk_text:
            continue
        embedding = None
        try:
            emb = create_embedding(chunk_text)
            embedding = emb[0] if isinstance(emb, list) else emb
        except Exception:
            embedding = None
        chunk = KnowledgeChunk(
            text=chunk_text,
            meta={
                "question_number": q.get("number") or q.get("question_number"),
                "subject": q.get("subject"),
                "area_name": q.get("area_name"),
                "year": q.get("year"),
            },
            embedding=embedding,
        )
        db.add(chunk)
        saved += 1
    return saved
