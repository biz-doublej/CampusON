from typing import List, Dict, Any
import random


def ensure_five_options(items: List[Dict[str, Any]]) -> None:
    for it in items:
        opts = it.get("options") or {}
        opts = {str(k): str(v) for k, v in list(opts.items())}
        for k in ["1","2","3","4","5"]:
            if k not in opts:
                opts[k] = f"선지 {k}"
        it["options"] = {k: opts[k] for k in ["1","2","3","4","5"]}
        ca = str(it.get("correct_answer") or it.get("answer") or "1")
        if ca not in {"1","2","3","4","5"}:
            it["correct_answer"] = random.choice(["1","2","3","4","5"])


def enforce_difficulty(items: List[Dict[str, Any]], dif: str) -> None:
    for it in items:
        it["difficulty"] = dif


def maybe_add_description_box(items: List[Dict[str, Any]], prob: float = 0.3) -> None:
    for it in items:
        if not it.get("description") and random.random() < prob:
            it["description"] = [
                "[문제 조건] 아래 사항을 참고하여 답을 고르시오.",
                "- 제시문을 근거로 판단하시오.",
                "- 필요한 경우 표/그림을 가정하시오.",
            ]

