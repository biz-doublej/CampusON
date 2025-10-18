from datetime import date, timedelta
import sys
from pathlib import Path

import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from app.ai.personalization import PersonalizationError, build_personalized_plan  # noqa: E402
from app.db.database import Base  # noqa: E402
from app.models.question import DifficultyLevel, Question  # noqa: E402
from app.models.learning import QuestionSkill, StudentInteraction, StudentSkillState  # noqa: E402


def _session():
    engine = create_engine("sqlite:///:memory:", future=True)
    TestingSession = sessionmaker(bind=engine)
    Base.metadata.create_all(bind=engine)
    return TestingSession()


def test_personalized_plan_prioritizes_low_mastery():
    db = _session()
    try:
        db.add(StudentSkillState(student_id="s1", skill="nursing:assessment", p_mastery=0.2))
        db.add(StudentSkillState(student_id="s1", skill="nursing:clinical_judgment", p_mastery=0.55))
        question1 = Question(
            question_number=1,
            content="간호사정에서 활력징후 측정 순서를 올바르게 고르세요.",
            options={"1": "호흡-맥박-체온-혈압", "2": "체온-맥박-호흡-혈압", "3": "체온-호흡-맥박-혈압", "4": "혈압-맥박-호흡-체온", "5": "맥박-호흡-체온-혈압"},
            correct_answer="2",
            difficulty=DifficultyLevel.MEDIUM,
            subject="기본간호",
        )
        question2 = Question(
            question_number=2,
            content="간호과정 수행 단계의 올바른 순서를 고르세요.",
            options={"1": "사정-진단-평가-계획-수행", "2": "사정-진단-계획-수행-평가", "3": "사정-계획-진단-수행-평가", "4": "계획-사정-진단-수행-평가", "5": "사정-수행-계획-진단-평가"},
            correct_answer="2",
            difficulty=DifficultyLevel.MEDIUM,
            subject="간호과정",
        )
        db.add_all([question1, question2])
        db.flush()
        db.add_all(
            [
                QuestionSkill(question_id=question1.id, skill="nursing:assessment"),
                QuestionSkill(question_id=question2.id, skill="nursing:clinical_judgment"),
            ]
        )
        db.add_all(
            [
                StudentInteraction(student_id="s1", question_id=question1.id, correct=False),
                StudentInteraction(student_id="s1", question_id=question2.id, correct=True),
            ]
        )
        db.commit()

        plan = build_personalized_plan(
            db,
            student_id="s1",
            department="nursing",
            target_exam_date=date.today() + timedelta(days=35),
        )

        assert plan["department_key"] == "nursing"
        performance = plan["performance_summary"]
        assert performance["total_attempts"] == 2
        assert performance["correct"] == 1
        assert performance["accuracy"] == 0.5
        skills = {item["key"]: item for item in plan["skills"]}
        assert skills["assessment"]["priority"] == "focus"
        assert skills["clinical_judgment"]["priority"] == "reinforce"
        assert len(plan["weekly_schedule"]) >= 1
        assert skills["assessment"]["performance"]["attempts"] == 1
        assert skills["assessment"]["recommended_questions"]
        assert isinstance(skills["assessment"]["rag_contexts"], list)
        assert plan["recommendations"]["focus_questions"]
        assert plan["recommendations"]["recent_incorrect"]
        assert plan["weekly_schedule"][0]["recommended_question"] is not None
        assert "focus_rag_contexts" in plan["recommendations"]
        assert "recommended_context" in plan["weekly_schedule"][0]
    finally:
        db.close()


def test_personalized_plan_invalid_department():
    db = _session()
    try:
        with pytest.raises(PersonalizationError):
            build_personalized_plan(db, student_id="anon", department="unknown")
    finally:
        db.close()
