from typing import Dict, Any, List


def score_multi_objective(metrics: Dict[str, Any], weights: Dict[str, float]) -> float:
    # metrics: { schema: bool, domain: bool, difficulty: bool, novelty: float(0..1), length: float }
    val = 0.0
    val += weights.get('schema', 0.3) * (1.0 if metrics.get('schema') else 0.0)
    val += weights.get('domain', 0.3) * (1.0 if metrics.get('domain') else 0.0)
    val += weights.get('difficulty', 0.2) * (1.0 if metrics.get('difficulty') else 0.0)
    val += weights.get('novelty', 0.2) * float(metrics.get('novelty', 0.5))
    return val


def choose_policy(policies: List[Dict[str, Any]], weights: Dict[str, float]) -> Dict[str, Any]:
    best = None
    best_score = -1e9
    for p in policies:
        s = score_multi_objective(p.get('metrics', {}), weights)
        if s > best_score:
            best_score = s
            best = p
    return best or {}

