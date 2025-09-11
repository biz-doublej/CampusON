from typing import List, Dict, Any, Tuple
import re


def schema_validator(items: List[Dict[str, Any]]) -> Tuple[bool, Dict[str, Any]]:
    ok = True
    errors = []
    for i, it in enumerate(items, start=1):
        if not isinstance(it.get("content"), str) or not it.get("content"): ok=False; errors.append((i, "missing_content"))
        opts = it.get("options") or {}
        if not isinstance(opts, dict) or len(opts) < 4: ok=False; errors.append((i, "insufficient_options"))
        ca = str(it.get("correct_answer", ""))
        if ca not in {"1","2","3","4","5"}: ok=False; errors.append((i, "invalid_correct_answer"))
    return ok, {"errors": errors}


def domain_validator(items: List[Dict[str, Any]], domain: str) -> Tuple[bool, Dict[str, Any]]:
    # Simple heuristic: content must not include common out-of-domain keywords
    ban = ["신뢰성 평가", "미디어 리터러시", "미디어", "SNS", "웹검색", "가짜뉴스"]
    ood = []
    for i, it in enumerate(items, start=1):
        text = (it.get("content") or "")
        if any(b in text for b in ban):
            ood.append(i)
    return (len(ood) == 0), {"ood": ood}


def difficulty_heuristic_score(item: Dict[str, Any]) -> float:
    # crude heuristic: longer content and more similar options => higher difficulty
    content = item.get("content") or ""
    L = len(content)
    opts = item.get("options") or {}
    avg_opt_len = sum(len(str(v)) for v in opts.values()) / max(1, len(opts))
    return 0.5 * (L/200.0) + 0.5 * (avg_opt_len/20.0)


def difficulty_validator(items: List[Dict[str, Any]], target: str) -> Tuple[bool, Dict[str, Any]]:
    # Estimate difficulty ~ low, mid, high
    scores = [difficulty_heuristic_score(it) for it in items]
    avg = sum(scores)/max(1,len(scores))
    # thresholds chosen empirically
    if target == "하": ok = avg < 0.35
    elif target == "상": ok = avg > 0.65
    else: ok = 0.35 <= avg <= 0.65
    return ok, {"avg_difficulty_score": avg}

