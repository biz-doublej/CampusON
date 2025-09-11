from typing import Dict, Any, List, Optional
import os, json, random
from sqlalchemy.orm import Session
from .pipeline import generate_validate_postprocess

CONF_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'data', 'deepconf')
CONF_PATH = os.path.join(CONF_DIR, 'best.json')


def _ensure_dir():
    os.makedirs(CONF_DIR, exist_ok=True)


def _score(validation: Dict[str, Any]) -> float:
    return (
        (1.0 if validation.get('schema') else 0.0) * 0.4 +
        (1.0 if validation.get('domain') else 0.0) * 0.3 +
        (1.0 if validation.get('difficulty') else 0.0) * 0.3
    )


def random_search(db: Session, subject: str, topic: str, difficulty: str, trials: int = 8) -> Dict[str, Any]:
    _ensure_dir()
    best: Optional[Dict[str, Any]] = None
    best_score = -1.0
    history: List[Dict[str, Any]] = []
    for _ in range(trials):
        cfg = {
            "description_prob": round(random.uniform(0.2, 0.6), 2),
        }
        res = generate_validate_postprocess(db, topic, count=5, difficulty=difficulty, subject=subject, config=cfg)
        s = _score(res.get('validation', {}))
        history.append({"cfg": cfg, "score": s})
        if s > best_score:
            best_score = s
            best = {"cfg": cfg, "score": s, "subject": subject, "topic": topic, "difficulty": difficulty}
    if best:
        with open(CONF_PATH, 'w', encoding='utf-8') as f:
            json.dump(best, f, ensure_ascii=False, indent=2)
    return {"success": best is not None, "best": best, "history": history}


def get_best() -> Optional[Dict[str, Any]]:
    if os.path.exists(CONF_PATH):
        with open(CONF_PATH, 'r', encoding='utf-8') as f:
            return json.load(f)
    return None

