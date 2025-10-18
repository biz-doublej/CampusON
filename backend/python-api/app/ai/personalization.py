from __future__ import annotations

from dataclasses import dataclass
from datetime import date, datetime, timezone
from typing import Any, Dict, Iterable, List, Optional, Tuple

from sqlalchemy import case, func
from sqlalchemy.orm import Session

from app.ai import rag as rag_ai
from app.models.knowledge import KnowledgeChunk
from app.models.learning import QuestionSkill, StudentInteraction, StudentSkillState
from app.models.question import Question


class PersonalizationError(Exception):
    """Raised when a personalized plan cannot be generated."""


@dataclass(frozen=True)
class SkillDefinition:
    key: str
    label: str
    focus: str
    description: str
    aliases: Tuple[str, ...]
    keywords: Tuple[str, ...]
    resources: Tuple[Dict[str, str], ...]


DEPARTMENT_CATALOG: Dict[str, Dict[str, Any]] = {
    "nursing": {
        "name": "간호학과",
        "skills": (
            SkillDefinition(
                key="assessment",
                label="기본 간호사정",
                focus="신체사정 · 활력징후 분석",
                description="환자 상태를 체계적으로 수집하고 문제를 선별합니다.",
                aliases=("nursing:assessment", "assessment", "간호사정"),
                keywords=("간호사정", "활력징후", "신체사정"),
                resources=(
                    {"type": "simulation", "tag": "vital-signs", "title": "활력징후 시뮬레이션"},
                    {"type": "rag", "tag": "assessment", "title": "간호사정 RAG 검색"},
                ),
            ),
            SkillDefinition(
                key="clinical_judgment",
                label="임상적 판단",
                focus="간호과정 적용 · 우선순위 결정",
                description="간호진단을 설정하고 적용 가능한 중재를 선택합니다.",
                aliases=("nursing:clinical_judgment", "clinical_judgment", "간호과정"),
                keywords=("간호과정", "임상적 판단", "간호진단"),
                resources=(
                    {"type": "quiz", "tag": "case-study", "title": "케이스 기반 간호판단 문제"},
                    {"type": "rag", "tag": "nanda", "title": "NANDA 간호진단 근거"},
                ),
            ),
            SkillDefinition(
                key="fundamentals",
                label="기초간호술",
                focus="투약 · 감염관리 · 기본 술기",
                description="병동 필수 기본 간호술 수행 능력을 기릅니다.",
                aliases=("nursing:fundamentals", "fundamentals", "기초간호"),
                keywords=("기초간호술", "투약", "감염관리"),
                resources=(
                    {"type": "video", "tag": "skills", "title": "기초간호술 시연"},
                    {"type": "practice", "tag": "skills-lab", "title": "술기 실습 체크리스트"},
                ),
            ),
        ),
    },
    "physical_therapy": {
        "name": "물리치료학과",
        "skills": (
            SkillDefinition(
                key="musculoskeletal",
                label="근골격계 평가",
                focus="근력 · 관절가동범위 · 정렬 분석",
                description="정형도수치료 전 평가 프로토콜을 숙지합니다.",
                aliases=("physical_therapy:musculoskeletal", "musculoskeletal", "근골격"),
                keywords=("근골격계 평가", "도수치료", "관절가동범위"),
                resources=(
                    {"type": "rag", "tag": "musculoskeletal", "title": "근골격계 평가 근거"},
                    {"type": "practice", "tag": "manual-therapy", "title": "도수평가 핸드북"},
                ),
            ),
            SkillDefinition(
                key="neurology",
                label="신경계 재활",
                focus="중추신경계 · 균형 · 보행 분석",
                description="뇌졸중 및 신경계 환자 재활 프로토콜을 연습합니다.",
                aliases=("physical_therapy:neurology", "neurology", "신경계"),
                keywords=("신경계 재활", "뇌졸중 재활", "균형 훈련"),
                resources=(
                    {"type": "video", "tag": "neurorehab", "title": "신경계 재활 평가 시연"},
                    {"type": "quiz", "tag": "balance-training", "title": "균형·보행 퀴즈"},
                ),
            ),
            SkillDefinition(
                key="cardiopulmonary",
                label="심폐계 물리치료",
                focus="호흡운동 · 유산소 재활",
                description="심폐질환 환자를 위한 운동처방을 세웁니다.",
                aliases=("physical_therapy:cardiopulmonary", "cardiopulmonary", "심폐"),
                keywords=("심폐 재활", "호흡운동", "유산소 재활"),
                resources=(
                    {"type": "rag", "tag": "cardiopulmonary", "title": "심폐 재활 프로토콜"},
                    {"type": "practice", "tag": "breathing", "title": "호흡운동 지도안"},
                ),
            ),
        ),
    },
    "dental_hygiene": {
        "name": "치위생학과",
        "skills": (
            SkillDefinition(
                key="periodontal",
                label="치주관리",
                focus="치석제거 · 치주질환 교육",
                description="치주조직 평가와 환자맞춤 교육을 수행합니다.",
                aliases=("dental:periodontal", "periodontal", "치주관리"),
                keywords=("치주관리", "치석제거", "치주질환"),
                resources=(
                    {"type": "practice", "tag": "scaling", "title": "치석제거 실습 루틴"},
                    {"type": "rag", "tag": "periodontal", "title": "치주질환 가이드"},
                ),
            ),
            SkillDefinition(
                key="radiology",
                label="치과방사선",
                focus="방사선 촬영 · 판독",
                description="촬영 원칙과 판독 절차를 반복 학습합니다.",
                aliases=("dental:radiology", "radiology", "치과방사선"),
                keywords=("치과방사선", "방사선 안전", "판독"),
                resources=(
                    {"type": "quiz", "tag": "radiology", "title": "치과방사선 판독 퀴즈"},
                    {"type": "video", "tag": "safety", "title": "방사선 안전 교육"},
                ),
            ),
            SkillDefinition(
                key="patient_education",
                label="환자 구강보건 교육",
                focus="맞춤형 교육 계획 · 동기부여",
                description="환자 상태에 따른 교육 전략을 설계합니다.",
                aliases=("dental:patient_education", "patient_education", "구강보건교육"),
                keywords=("구강보건 교육", "환자 상담", "동기부여"),
                resources=(
                    {"type": "rag", "tag": "education", "title": "교육 스크립트 템플릿"},
                    {"type": "practice", "tag": "counseling", "title": "상담 역할극"},
                ),
            ),
        ),
    },
}


def _normalize_department(department: str) -> Optional[str]:
    dep = (department or "").strip().lower()
    mapping = {
        "nursing": "nursing",
        "간호": "nursing",
        "간호학과": "nursing",
        "physical_therapy": "physical_therapy",
        "physical-therapy": "physical_therapy",
        "물리치료": "physical_therapy",
        "물리치료학과": "physical_therapy",
        "pt": "physical_therapy",
        "dental_hygiene": "dental_hygiene",
        "dental-hygiene": "dental_hygiene",
        "치위생": "dental_hygiene",
        "치위생과": "dental_hygiene",
    }
    return mapping.get(dep, dep if dep in DEPARTMENT_CATALOG else None)


def _state_index(states: Iterable[StudentSkillState]) -> Dict[str, StudentSkillState]:
    indexed: Dict[str, StudentSkillState] = {}
    for st in states:
        key = (st.skill or "").strip().lower()
        if not key:
            continue
        if key not in indexed or indexed[key].updated_at < st.updated_at:
            indexed[key] = st
    return indexed


def _skill_aliases(skill: SkillDefinition) -> Tuple[str, ...]:
    return tuple(alias.strip().lower() for alias in skill.aliases + (skill.key,))


def _match_skill_state(
    skill: SkillDefinition,
    index: Dict[str, StudentSkillState],
) -> Optional[StudentSkillState]:
    for alias in _skill_aliases(skill):
        normalized = alias
        if normalized in index:
            return index[normalized]
    return None


def _priority_from_mastery(mastery: Optional[float]) -> str:
    if mastery is None:
        return "establish"
    if mastery < 0.4:
        return "focus"
    if mastery < 0.7:
        return "reinforce"
    return "maintain"


def _weeks_until(target: Optional[date]) -> int:
    if not target:
        return 6
    today = date.today()
    if target <= today:
        return 2
    days = (target - today).days
    return max(2, min(16, (days // 7) + 1))


def _compose_weekly_schedule(
    skills: List[Dict[str, Any]],
    weeks: int,
) -> List[Dict[str, Any]]:
    scheduled: List[Dict[str, Any]] = []
    if not skills:
        return scheduled
    high = [s for s in skills if s["priority"] == "focus"]
    mid = [s for s in skills if s["priority"] == "reinforce"]
    low = [s for s in skills if s["priority"] in {"maintain", "establish"}]
    pools = [pool for pool in (high, mid, low) if pool]
    if not pools:
        pools = [skills]
    for week_index in range(weeks):
        pool = pools[min(week_index, len(pools) - 1)]
        skill = pool[week_index % len(pool)]
        recommended_questions = skill.get("recommended_questions") or []
        rag_contexts = skill.get("rag_contexts") or []
        scheduled.append(
            {
                "week": week_index + 1,
                "theme": skill["label"],
                "focus": skill["focus"],
                "skill_key": skill["key"],
                "priority": skill["priority"],
                "suggested_actions": [
                    "주간 퀴즈 10문제 풀기",
                    "RAG 검색으로 핵심 개념 복습",
                    "실습 체크리스트 작성",
                ],
                "recommended_resource": skill["resources"][0] if skill["resources"] else None,
                "recommended_question": recommended_questions[0] if recommended_questions else None,
                "recommended_context": rag_contexts[0] if rag_contexts else None,
            }
        )
    return scheduled


def _calculate_performance(db: Session, student_id: str) -> Dict[str, Any]:
    total_attempts, correct_count = (
        db.query(
            func.count(StudentInteraction.id),
            func.sum(case((StudentInteraction.correct.is_(True), 1), else_=0)),
        )
        .filter(StudentInteraction.student_id == student_id)
        .one()
    )
    total_attempts = int(total_attempts or 0)
    correct_count = int(correct_count or 0)
    accuracy = round(correct_count / total_attempts, 3) if total_attempts else None

    last_interaction = (
        db.query(StudentInteraction)
        .filter(StudentInteraction.student_id == student_id)
        .order_by(StudentInteraction.created_at.desc())
        .first()
    )
    last_activity = (
        last_interaction.created_at.isoformat()
        if last_interaction and last_interaction.created_at
        else None
    )

    streak = 0
    if total_attempts:
        recent = (
            db.query(StudentInteraction.correct)
            .filter(StudentInteraction.student_id == student_id)
            .order_by(StudentInteraction.created_at.desc())
            .limit(12)
            .all()
        )
        for (is_correct,) in recent:
            if is_correct:
                streak += 1
            else:
                break

    skill_rows = (
        db.query(
            QuestionSkill.skill,
            func.count(StudentInteraction.id),
            func.sum(case((StudentInteraction.correct.is_(True), 1), else_=0)),
        )
        .join(QuestionSkill, QuestionSkill.question_id == StudentInteraction.question_id)
        .filter(StudentInteraction.student_id == student_id)
        .group_by(QuestionSkill.skill)
        .all()
    )
    skill_metrics: Dict[str, Dict[str, Any]] = {}
    for raw_skill, attempts, correct in skill_rows:
        normalized = (raw_skill or "").strip().lower()
        if not normalized:
            continue
        attempts_i = int(attempts or 0)
        correct_i = int(correct or 0)
        skill_metrics[normalized] = {
            "attempts": attempts_i,
            "correct": correct_i,
            "accuracy": round(correct_i / attempts_i, 3) if attempts_i else None,
        }

    recent_incorrect_rows = (
        db.query(StudentInteraction, Question, QuestionSkill.skill)
        .join(Question, Question.id == StudentInteraction.question_id)
        .outerjoin(QuestionSkill, QuestionSkill.question_id == Question.id)
        .filter(
            StudentInteraction.student_id == student_id,
            StudentInteraction.correct.is_(False),
        )
        .order_by(StudentInteraction.created_at.desc())
        .limit(3)
        .all()
    )
    recent_incorrect: List[Dict[str, Any]] = []
    for interaction, question, skill in recent_incorrect_rows:
        recent_incorrect.append(
            {
                "question_id": question.id,
                "question_number": question.question_number,
                "skill": (skill or "").strip() or None,
                "content_preview": (question.content or "")[:140],
                "attempted_at": interaction.created_at.isoformat()
                if interaction.created_at
                else None,
            }
        )

    return {
        "total_attempts": total_attempts,
        "correct": correct_count,
        "accuracy": accuracy,
        "last_activity": last_activity,
        "current_streak": streak,
        "skill_metrics": skill_metrics,
        "recent_incorrect": recent_incorrect,
    }


def _fetch_questions_for_skill(
    db: Session,
    skill: SkillDefinition,
    limit: int = 3,
) -> List[Dict[str, Any]]:
    aliases = _skill_aliases(skill)
    rows = (
        db.query(Question)
        .join(QuestionSkill, QuestionSkill.question_id == Question.id)
        .filter(QuestionSkill.skill.in_(aliases))
        .order_by(Question.id.desc())
        .limit(limit)
        .all()
    )
    items: List[Dict[str, Any]] = []
    for q in rows:
        items.append(
            {
                "id": q.id,
                "number": q.question_number,
                "difficulty": getattr(q.difficulty, "value", "중"),
                "subject": q.subject,
                "area_name": q.area_name,
            }
        )
    return items


def _fetch_rag_contexts(
    db: Session,
    skill: SkillDefinition,
    department_key: str,
    limit: int = 3,
) -> List[Dict[str, Any]]:
    query_text = " ".join(skill.keywords) or skill.label
    results: List[Dict[str, Any]] = []
    try:
        rag_hits = rag_ai.query_index(db, query_text, top_k=limit * 2)
        for hit in rag_hits:
            meta = hit.get("meta") or {}
            if meta.get("department") and meta.get("department") != department_key:
                continue
            snippet = (hit.get("text") or "").strip()
            if not snippet:
                continue
            results.append(
                {
                    "text": snippet[:500],
                    "source": meta.get("source_file"),
                    "page": meta.get("page"),
                    "score": hit.get("score"),
                }
            )
            if len(results) >= limit:
                break
    except Exception:
        pass

    if len(results) >= limit:
        return results[:limit]

    like = f"%{skill.keywords[0]}%" if skill.keywords else f"%{skill.label}%"
    fallback_rows = (
        db.query(KnowledgeChunk)
        .filter(KnowledgeChunk.text.ilike(like))
        .order_by(KnowledgeChunk.id.desc())
        .limit(limit)
        .all()
    )
    for row in fallback_rows:
        snippet = (row.text or "").strip()
        if not snippet:
            continue
        results.append(
            {
                "text": snippet[:500],
                "source": (row.meta or {}).get("source_file"),
                "page": (row.meta or {}).get("page"),
                "score": None,
            }
        )
    deduped: List[Dict[str, Any]] = []
    seen = set()
    for item in results:
        text = item.get("text")
        if not text or text in seen:
            continue
        seen.add(text)
        deduped.append(item)
        if len(deduped) >= limit:
            break
    return deduped


def _build_dynamic_actions(
    perf: Dict[str, Any],
    focus_skills: List[Dict[str, Any]],
    recent_incorrect: List[Dict[str, Any]],
) -> List[str]:
    actions: List[str] = []
    total_attempts = perf.get("total_attempts", 0)
    accuracy = perf.get("accuracy")

    if total_attempts < 10:
        actions.append("학습 로그가 부족합니다. 최소 5문제를 추가로 풀이하세요.")
    if isinstance(accuracy, float) and accuracy < 0.65:
        actions.append("정답률이 낮습니다. RAG 검색으로 핵심 개념을 복습한 뒤 복습 퀴즈를 진행하세요.")
    if focus_skills:
        primary = ", ".join(skill["label"] for skill in focus_skills[:2])
        actions.append(f"집중 관리 역량({primary})에 대한 요약 노트를 작성해 보세요.")
    if recent_incorrect:
        actions.append("최근 오답 문제의 정답 근거를 스스로 설명해 보세요.")
    if not actions:
        actions.append("현재 학습 계획을 유지하면서 주간 목표를 확인하세요.")
    return actions[:4]


def build_personalized_plan(
    db: Session,
    *,
    student_id: str,
    department: str,
    target_exam_date: Optional[date] = None,
) -> Dict[str, Any]:
    dep_key = _normalize_department(department)
    if not dep_key or dep_key not in DEPARTMENT_CATALOG:
        raise PersonalizationError("지원하지 않는 학과입니다.")

    catalog = DEPARTMENT_CATALOG[dep_key]
    base_skills: Tuple[SkillDefinition, ...] = catalog.get("skills", ())
    if not base_skills:
        raise PersonalizationError("학과에 대한 스킬 카탈로그가 비어 있습니다.")

    performance = _calculate_performance(db, student_id)
    states = (
        db.query(StudentSkillState)
        .filter(StudentSkillState.student_id == student_id)
        .all()
    )
    index = _state_index(states)

    skill_plans: List[Dict[str, Any]] = []
    focus_count = 0
    reinforce_count = 0
    maintain_count = 0

    for definition in base_skills:
        matched_state = _match_skill_state(definition, index)
        mastery = float(matched_state.p_mastery) if matched_state else None
        priority = _priority_from_mastery(mastery)
        if priority == "focus":
            focus_count += 1
        elif priority == "reinforce":
            reinforce_count += 1
        else:
            maintain_count += 1
        skill_perf = None
        for alias in _skill_aliases(definition):
            metrics = performance["skill_metrics"].get(alias)
            if metrics:
                skill_perf = metrics
                break
        recommendations = _fetch_questions_for_skill(db, definition, limit=3)
        if priority == "focus" and not recommendations:
            fallback_rows = (
                db.query(Question)
                .order_by(Question.id.desc())
                .limit(3)
                .all()
            )
            recommendations = [
                {
                    "id": q.id,
                    "number": q.question_number,
                    "difficulty": getattr(q.difficulty, "value", "중"),
                    "subject": q.subject,
                    "area_name": q.area_name,
                }
                for q in fallback_rows
            ]
        action_plan = [
            f"{definition.label} 관련 RAG 문서를 2건 요약하십시오.",
            "주간 퀴즈 결과와 정답 근거를 정리해 보세요.",
        ]
        if priority == "focus":
            action_plan.insert(0, "핵심 개념을 정리하고 실습 또는 시뮬레이션을 수행하세요.")
        elif priority == "reinforce":
            action_plan.insert(0, "중간 난이도 문제를 선정하여 복습 풀이를 진행하세요.")
        rag_contexts = _fetch_rag_contexts(db, definition, dep_key, limit=3)
        skill_plans.append(
            {
                "key": definition.key,
                "label": definition.label,
                "focus": definition.focus,
                "description": definition.description,
                "mastery": mastery,
                "priority": priority,
                "updated_at": matched_state.updated_at.isoformat() if matched_state else None,
                "resources": list(definition.resources),
                "performance": skill_perf,
                "recommended_questions": recommendations,
                "action_plan": action_plan,
                "rag_contexts": rag_contexts,
                "suggested_prompts": [
                    f"{definition.label}과 관련된 실습 체크리스트를 알려줘",
                    f"{definition.label} 역량 강화를 위한 케이스 스터디를 제안해줘",
                ],
            }
        )

    weeks = _weeks_until(target_exam_date)
    weekly_schedule = _compose_weekly_schedule(skill_plans, weeks=min(weeks, 8))
    primary_focus_skills = [s for s in skill_plans if s["priority"] in {"focus", "reinforce"}]
    focus_questions: List[Dict[str, Any]] = []
    seen_qids = set()
    for skill in primary_focus_skills:
        for q in skill.get("recommended_questions", [])[:2]:
            qid = q.get("id")
            if qid and qid not in seen_qids:
                seen_qids.add(qid)
                focus_questions.append(q)
    focus_rag: List[Dict[str, Any]] = []
    seen_texts = set()
    for skill in primary_focus_skills:
        for ctx in skill.get("rag_contexts", [])[:2]:
            txt = ctx.get("text")
            if txt and txt not in seen_texts:
                seen_texts.add(txt)
                focus_rag.append(ctx)
    dynamic_actions = _build_dynamic_actions(performance, primary_focus_skills, performance["recent_incorrect"])

    return {
        "student_id": student_id,
        "department_key": dep_key,
        "department_name": catalog["name"],
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "target_exam_date": target_exam_date.isoformat() if target_exam_date else None,
        "weeks_until_exam": weeks,
        "performance_summary": {
            "total_attempts": performance["total_attempts"],
            "correct": performance["correct"],
            "accuracy": performance["accuracy"],
            "last_activity": performance["last_activity"],
            "current_streak": performance["current_streak"],
        },
        "skill_summary": {
            "focus": focus_count,
            "reinforce": reinforce_count,
            "maintain": maintain_count,
            "total": len(skill_plans),
        },
        "skills": skill_plans,
        "weekly_schedule": weekly_schedule,
        "recommendations": {
            "primary_focus_skills": [s["key"] for s in primary_focus_skills],
            "focus_questions": focus_questions,
            "recent_incorrect": performance["recent_incorrect"],
            "focus_rag_contexts": focus_rag,
            "next_actions": dynamic_actions,
        },
        "recommended_endpoints": {
            "rag_query": "/api/ai/rag/query",
            "department_bot": "/api/department/ai/query",
            "dkt_recommend": "/api/dkt/recommend",
        },
    }
