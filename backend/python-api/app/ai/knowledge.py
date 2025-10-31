from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session
from app.models.knowledge import KnowledgeChunk
from app.utils.embedding_utils import create_embedding


def _chunk_text(text: str, max_len: int = 800, overlap: int = 120) -> List[str]:
    if not text:
        return []
    clean = text.strip()
    if not clean:
        return []
    chunks: List[str] = []
    start = 0
    n = len(clean)
    while start < n:
        end = min(n, start + max_len)
        chunk = clean[start:end].strip()
        if chunk:
            chunks.append(chunk)
        if end >= n:
            break
        start = max(0, end - overlap)
    return chunks


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


def ingest_documents_as_knowledge(
    db: Session,
    documents: List[Dict[str, Any]],
    *,
    default_meta: Optional[Dict[str, Any]] = None,
    chunk_size: int = 800,
    chunk_overlap: int = 120,
) -> int:
    """Ingest arbitrary documents (text + meta) into the knowledge base."""
    saved = 0
    base_meta = default_meta or {}
    for doc in documents:
        text = doc.get("text")
        if not isinstance(text, str) or not text.strip():
            continue
        doc_meta = {}
        doc_specific_meta = doc.get("meta") or {}
        if isinstance(base_meta, dict):
            doc_meta.update(base_meta)
        if isinstance(doc_specific_meta, dict):
            doc_meta.update(doc_specific_meta)

        for chunk_text in _chunk_text(text, max_len=chunk_size, overlap=chunk_overlap):
            embedding = None
            try:
                emb = create_embedding(chunk_text)
                embedding = emb[0] if isinstance(emb, list) else emb
            except Exception:
                embedding = None
            chunk = KnowledgeChunk(
                text=chunk_text,
                meta=doc_meta or None,
                embedding=embedding,
            )
            db.add(chunk)
            saved += 1
    return saved


def chunk_plain_text(text: str, *, chunk_size: int = 800, chunk_overlap: int = 120) -> List[str]:
    return _chunk_text(text, max_len=chunk_size, overlap=chunk_overlap)
