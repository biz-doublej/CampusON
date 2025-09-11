from sqlalchemy import Column, Integer, String, JSON, DateTime, ForeignKey, Float, Boolean
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
from app.db.database import Base


class QuestionSkill(Base):
    __tablename__ = "question_skills"

    id = Column(Integer, primary_key=True, index=True)
    question_id = Column(Integer, ForeignKey("questions.id"), nullable=False)
    skill = Column(String, nullable=False, index=True)


class StudentInteraction(Base):
    __tablename__ = "student_interactions"

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(String, index=True, nullable=False)
    question_id = Column(Integer, ForeignKey("questions.id"), nullable=False)
    correct = Column(Boolean, default=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))


class StudentSkillState(Base):
    __tablename__ = "student_skill_states"

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(String, index=True, nullable=False)
    skill = Column(String, index=True, nullable=False)
    p_mastery = Column(Float, default=0.5)
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

