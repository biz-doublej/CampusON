from typing import Dict, Any, List, Optional
from sqlalchemy.orm import Session
import logging
from .generation import generate_questions
from .validators import schema_validator, domain_validator, difficulty_validator
from .postprocess import ensure_five_options, enforce_difficulty, maybe_add_description_box
from app.models.question import Question
from app.parsers.question_service import create_question_from_parsed_data
from app.ai import rag as rag_ai

logger = logging.getLogger(__name__)


def generate_validate_postprocess(
    db: Session,
    topic: str,
    count: int,
    difficulty: str,
    subject: Optional[str] = None,
    config: Optional[Dict[str, Any]] = None,
) -> Dict[str, Any]:
    cfg = config or {}
    # 1) Generate
    items = generate_questions(db, topic, count, difficulty, subject)

    # 2) Validate
    ok_schema, sch = schema_validator(items)
    ok_domain, dom = domain_validator(items, subject or topic)
    ok_diff, dif = difficulty_validator(items, difficulty)
    if not (ok_schema and ok_domain and ok_diff):
        logger.info(f"Validation failed: schema={ok_schema}, domain={ok_domain}, diff={ok_diff}")
        # Simple one-shot regeneration with slight variability
        items = generate_questions(db, topic, count, difficulty, subject)

    # 3) Postprocess
    ensure_five_options(items)
    enforce_difficulty(items, difficulty)
    maybe_add_description_box(items, float(cfg.get("description_prob", 0.3)))

    # Re-validate schema after postprocess
    ok_schema2, sch2 = schema_validator(items)
    return {
        "items": items,
        "validation": {
            "schema": ok_schema2,
            "domain": ok_domain,
            "difficulty": ok_diff,
        }
    }


def commit_questions(db: Session, items: List[Dict[str, Any]], source_name: str = "AI") -> Dict[str, Any]:
    saved_ids: List[int] = []
    for it in items:
        qdata = {
            "question_number": it.get("question_number", 0),
            "content": it.get("content", ""),
            "description": it.get("description"),
            "options": it.get("options", {}),
            "correct_answer": it.get("correct_answer", ""),
            "subject": it.get("subject", ""),
            "area_name": it.get("area_name", ""),
            "difficulty": it.get("difficulty") or "중",
            "year": it.get("year"),
        }
        q, ok = create_question_from_parsed_data(db, qdata)
        if ok and q is not None:
            saved_ids.append(q.id)
    db.commit()
    # optional: rebuild RAG index after commit
    try:
        rag_ai.build_index(db)
    except Exception:
        pass
    return {"count": len(saved_ids), "question_ids": saved_ids}

