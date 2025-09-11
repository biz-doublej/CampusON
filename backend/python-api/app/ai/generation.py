from typing import List, Dict, Any, Optional, Tuple
import logging
import os
import time
import random
import json
from sqlalchemy.orm import Session
from app.core.config import settings
from app.models.question import Question
from app.models.knowledge import KnowledgeChunk

logger = logging.getLogger(__name__)

try:
    import google.generativeai as genai  # type: ignore
except Exception:
    genai = None  # type: ignore


def _init_model():
    api_key = (
        getattr(settings, "GEMINI_API_KEY", None)
        or os.getenv("GEMINI_API_KEY")
        or os.getenv("GOOGLE_API_KEY")
    )
    if not api_key or genai is None:
        return None
    try:
        genai.configure(api_key=api_key)  # type: ignore
        model_name = getattr(settings, 'GEMINI_MODEL_NAME', 'gemini-2.0-flash-exp')
        return genai.GenerativeModel(model_name)  # type: ignore
    except Exception as e:
        logger.warning(f"Gemini init failed: {e}")
        return None


def _placeholders(topic: str, count: int, difficulty: Optional[str]) -> List[Dict[str, Any]]:
    qs: List[Dict[str, Any]] = []
    for i in range(1, count + 1):
        correct = str(random.randint(1, 5))
        qs.append({
            "question_number": i,
            "content": f"[sample] {topic} question {i}",
            "options": {"1": "Option 1", "2": "Option 2", "3": "Option 3", "4": "Option 4", "5": "Option 5"},
            "correct_answer": correct,
            "difficulty": difficulty or "중",
        })
    return qs


def _fetch_examples(db: Optional[Session], topic: str, difficulty: Optional[str], subject: Optional[str], k: int = 6) -> Tuple[List[Dict[str, Any]], List[str]]:
    examples: List[Dict[str, Any]] = []
    notes: List[str] = []
    if not db:
        return examples, notes
    q = db.query(Question)
    try:
        like = f"%{topic}%" if topic else None
        if subject:
            q = q.filter(Question.subject.ilike(f"%{subject}%"))
        if like:
            q = q.filter((Question.content.ilike(like)) | (Question.subject.ilike(like)) | (Question.area_name.ilike(like)))
        pool = q.order_by(Question.id.desc()).limit(200).all()
        if pool:
            sample = random.sample(pool, k=min(k, len(pool)))
            for s in sample:
                examples.append({
                    "content": s.content,
                    "options": s.options or {},
                    "correct_answer": s.correct_answer or "",
                    "difficulty": getattr(s.difficulty, 'value', '중'),
                    "subject": s.subject or "",
                })
    except Exception as e:
        notes.append(f"examples_fetch_error:{e}")
    try:
        like = f"%{topic}%" if topic else None
        if like:
            kc = db.query(KnowledgeChunk).filter(KnowledgeChunk.text.ilike(like)).order_by(KnowledgeChunk.id.desc()).limit(3).all()
            for c in kc:
                notes.append(f"kb:{(c.meta or {}).get('subject','')}")
    except Exception:
        pass
    return examples, notes


def _parse_json_array(text: Optional[str]) -> List[Dict[str, Any]]:
    if not text:
        return []
    try:
        data = json.loads(text)
        return data if isinstance(data, list) else []
    except Exception:
        pass
    try:
        import re
        m = re.search(r"```json\s*(\[.*?\])\s*```", text, re.S | re.I)
        if m:
            return json.loads(m.group(1))
    except Exception:
        pass
    try:
        l = text.find("[")
        r = text.rfind("]")
        if l != -1 and r != -1 and r > l:
            return json.loads(text[l : r + 1])
    except Exception:
        pass
    return []


def _normalize_items(items: List[Dict[str, Any]], count: int, difficulty: Optional[str]) -> List[Dict[str, Any]]:
    out: List[Dict[str, Any]] = []
    for idx, it in enumerate(items[:count], start=1):
        it["question_number"] = it.get("question_number") or idx
        opts = it.get("options") or {}
        opts = {str(k): str(v) for k, v in list(opts.items())}
        for k in ["1", "2", "3", "4", "5"]:
            if k not in opts:
                opts[k] = f"선지 {k}"
        opts = {k: opts[k] for k in ["1", "2", "3", "4", "5"]}
        it["options"] = opts
        ca = str(it.get("correct_answer") or it.get("answer") or "1")
        if ca not in {"1", "2", "3", "4", "5"}:
            ca = random.choice(["1", "2", "3", "4", "5"])
        it["correct_answer"] = ca
        if difficulty:
            it["difficulty"] = difficulty
        if not it.get("description") and random.random() < 0.3:
            it["description"] = [
                "[문제 조건] 아래 사항을 참고하여 답을 고르시오.",
                "- 제시문을 근거로 판단하시오.",
                "- 필요한 경우 표/그림을 가정하시오.",
            ]
        out.append(it)
    if len(out) < count:
        pass
    return out


def generate_questions(db: Optional[Session], topic: str, count: int = 5, difficulty: Optional[str] = None, subject: Optional[str] = None) -> List[Dict[str, Any]]:
    """Generate questions using Gemini guided by KB/examples; fallback to DB samples/placeholders.

    - 5 options (1..5) enforced
    - difficulty normalized to the requested value
    - optional description box sometimes added
    - domain constrained using subject/topic
    """
    model = _init_model()

    examples, _ = _fetch_examples(db, topic, difficulty, subject, k=6)

    if not model:
        if examples:
            out: List[Dict[str, Any]] = []
            for i, ex in enumerate(examples[:count], start=1):
                out.append({
                    "question_number": i,
                    "content": ex.get("content", ""),
                    "options": ex.get("options", {}),
                    "correct_answer": ex.get("correct_answer", ""),
                    "difficulty": ex.get("difficulty") or (difficulty or "중"),
                })
            return _normalize_items(out, count, difficulty)
        return _placeholders(topic, count, difficulty)

    dom = subject or "물리치료학"
    parts: List[str] = []
    parts.append("You are an exam item writer. Generate Korean multiple-choice questions.")
    parts.append(f"Topic: {topic}")
    parts.append(f"Difficulty: {difficulty or '중'}")
    parts.append(f"Restrict domain strictly to '{dom}'. Do not include unrelated topics (e.g., 정보 신뢰성 평가, 미디어 리터러시).")
    if examples:
        parts.append("Example items (JSON):")
        ex_json = json.dumps(examples[: min(6, len(examples))], ensure_ascii=False)
        parts.append(ex_json)
    parts.append("Respond with a pure JSON array ONLY. Each item must include question_number, content, options(keys '1'..'5'), correct_answer.")
    parts.append("Optionally include a 'description' field as an array of short lines that represents a boxed instruction like the parsed PDF description box.")
    prompt = "\n".join(parts)

    attempts = 0
    last_err: Optional[Exception] = None
    while attempts < 3:
        attempts += 1
        try:
            resp = model.generate_content(prompt)  # type: ignore
            text = getattr(resp, 'text', None)
            data = _parse_json_array(text)
            if data:
                return _normalize_items(data, count, difficulty)
        except Exception as e:
            last_err = e
            logger.warning(f"Question generation failed, attempt {attempts}: {e}")
            time.sleep(min(2 * attempts, 6))

    logger.warning(f"Question generation failed, using fallback: {last_err}")

    if examples:
        out: List[Dict[str, Any]] = []
        for i, ex in enumerate(examples[:count], start=1):
            out.append({
                "question_number": i,
                "content": ex.get("content", ""),
                "options": ex.get("options", {}),
                "correct_answer": ex.get("correct_answer", ""),
                "difficulty": ex.get("difficulty") or (difficulty or "중"),
            })
        return _normalize_items(out, count, difficulty)
    return _placeholders(topic, count, difficulty)

