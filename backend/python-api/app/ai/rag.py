import os
import json
from datetime import datetime, timezone
import numpy as np
from typing import List, Optional, Dict, Any
from sqlalchemy.orm import Session
from app.models.knowledge import KnowledgeChunk
from app.utils.embedding_utils import create_embedding

INDEX_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'data', 'faiss')
INDEX_PATH = os.path.join(INDEX_DIR, 'kb.index')
IDS_PATH = os.path.join(INDEX_DIR, 'kb.ids.json')

try:
    import faiss  # type: ignore
except Exception:
    faiss = None  # type: ignore


def _ensure_dir():
    os.makedirs(INDEX_DIR, exist_ok=True)


def build_index(db: Session) -> Dict[str, Any]:
    _ensure_dir()
    if faiss is None:
        return {"success": False, "error": "faiss not available"}

    chunks = db.query(KnowledgeChunk).filter(KnowledgeChunk.embedding.isnot(None)).order_by(KnowledgeChunk.id.asc()).all()
    if not chunks:
        return {"success": False, "error": "no embeddings to index"}

    vecs: List[np.ndarray] = []
    ids: List[int] = []
    for c in chunks:
        try:
            v = np.array(c.embedding, dtype=np.float32)
            n = v / (np.linalg.norm(v) + 1e-12)
            vecs.append(n)
            ids.append(c.id)
        except Exception:
            continue
    if not vecs:
        return {"success": False, "error": "no valid vectors"}

    x = np.vstack(vecs).astype('float32')
    dim = x.shape[1]
    index = faiss.IndexFlatIP(dim)
    index.add(x)
    faiss.write_index(index, INDEX_PATH)
    with open(IDS_PATH, 'w', encoding='utf-8') as f:
        json.dump(ids, f)
    return {"success": True, "count": len(ids), "index_path": INDEX_PATH}


def query_index(db: Session, query: str, top_k: int = 5) -> List[Dict[str, Any]]:
    if faiss is None:
        # fallback: LIKE search on text
        like = f"%{query}%"
        rows = db.query(KnowledgeChunk).filter(KnowledgeChunk.text.ilike(like)).order_by(KnowledgeChunk.id.desc()).limit(top_k).all()
        return [{"text": r.text, "meta": r.meta, "score": None} for r in rows]

    if not os.path.exists(INDEX_PATH) or not os.path.exists(IDS_PATH):
        # No index; attempt on-the-fly search by LIKE
        like = f"%{query}%"
        rows = db.query(KnowledgeChunk).filter(KnowledgeChunk.text.ilike(like)).order_by(KnowledgeChunk.id.desc()).limit(top_k).all()
        return [{"text": r.text, "meta": r.meta, "score": None} for r in rows]

    # embed query
    qv = create_embedding(query)
    if qv is None:
        like = f"%{query}%"
        rows = db.query(KnowledgeChunk).filter(KnowledgeChunk.text.ilike(like)).order_by(KnowledgeChunk.id.desc()).limit(top_k).all()
        return [{"text": r.text, "meta": r.meta, "score": None} for r in rows]

    import faiss as _faiss  # ensure available here without shadowing module-level name
    index = _faiss.read_index(INDEX_PATH)
    # handle potential dimension mismatch (e.g., embeddings provider changed)
    if index.d != len(qv):
        rebuild = build_index(db)
        if rebuild.get("success"):
            index = _faiss.read_index(INDEX_PATH)
        else:
            index = None
    if index is None or index.d != len(qv):
        like = f"%{query}%"
        rows = db.query(KnowledgeChunk).filter(KnowledgeChunk.text.ilike(like)).order_by(KnowledgeChunk.id.desc()).limit(top_k).all()
        return [{"text": r.text, "meta": r.meta, "score": None} for r in rows]
    with open(IDS_PATH, 'r', encoding='utf-8') as f:
        ids = json.load(f)
    v = np.array(qv, dtype=np.float32)
    v = v / (np.linalg.norm(v) + 1e-12)
    D, I = index.search(v.reshape(1, -1), top_k)
    results: List[Dict[str, Any]] = []
    for rank, idx in enumerate(I[0]):
        if idx < 0 or idx >= len(ids):
            continue
        row_id = ids[idx]
        row = db.query(KnowledgeChunk).get(row_id)
        if not row:
            continue
        results.append({"text": row.text, "meta": row.meta, "score": float(D[0][rank])})
    return results


def get_index_status(db: Session) -> Dict[str, Any]:
    total_chunks = db.query(KnowledgeChunk).count()
    index_exists = os.path.exists(INDEX_PATH) and os.path.exists(IDS_PATH)
    vector_count = 0
    index_size = 0
    last_built = None
    dimension: Optional[int] = None

    if index_exists:
        try:
            index_size = os.path.getsize(INDEX_PATH)
        except OSError:
            index_size = 0
        try:
            mtime = os.path.getmtime(INDEX_PATH)
            last_built = datetime.fromtimestamp(mtime, tz=timezone.utc).isoformat()
        except OSError:
            last_built = None
        try:
            with open(IDS_PATH, 'r', encoding='utf-8') as f:
                ids = json.load(f)
                vector_count = len(ids)
        except Exception:
            vector_count = 0
        if faiss is not None:
            try:
                import faiss as _faiss
                index = _faiss.read_index(INDEX_PATH)
                dimension = index.d
            except Exception:
                dimension = None

    return {
        "total_chunks": int(total_chunks),
        "index_exists": index_exists,
        "vector_count": vector_count,
        "dimension": dimension,
        "index_size": index_size,
        "last_built": last_built,
        "index_path": INDEX_PATH if index_exists else None,
        "ids_path": IDS_PATH if index_exists else None,
        "faiss_available": faiss is not None,
    }
