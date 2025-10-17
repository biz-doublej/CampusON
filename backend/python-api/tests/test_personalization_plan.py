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
from app.models import question  # noqa: F401,E402
from app.models.learning import StudentSkillState  # noqa: E402


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
        db.commit()

        plan = build_personalized_plan(
            db,
            student_id="s1",
            department="nursing",
            target_exam_date=date.today() + timedelta(days=35),
        )

        assert plan["department_key"] == "nursing"
        skills = {item["key"]: item for item in plan["skills"]}
        assert skills["assessment"]["priority"] == "focus"
        assert skills["clinical_judgment"]["priority"] == "reinforce"
        assert len(plan["weekly_schedule"]) >= 1
    finally:
        db.close()


def test_personalized_plan_invalid_department():
    db = _session()
    try:
        with pytest.raises(PersonalizationError):
            build_personalized_plan(db, student_id="anon", department="unknown")
    finally:
        db.close()
