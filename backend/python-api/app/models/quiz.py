from sqlalchemy import Column, Integer, String, JSON, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
from app.db.database import Base


class Quiz(Base):
    __tablename__ = "quizzes"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))


class QuizQuestion(Base):
    __tablename__ = "quiz_questions"

    id = Column(Integer, primary_key=True, index=True)
    quiz_id = Column(Integer, ForeignKey("quizzes.id"), nullable=False)
    question_id = Column(Integer, ForeignKey("questions.id"), nullable=False)
    display_order = Column(Integer, default=0)


class QuizSubmission(Base):
    __tablename__ = "quiz_submissions"

    id = Column(Integer, primary_key=True, index=True)
    quiz_id = Column(Integer, ForeignKey("quizzes.id"), nullable=False)
    student_id = Column(String, nullable=False)
    answers = Column(JSON, nullable=False)  # {question_id: chosen}
    score = Column(Integer, nullable=True)  # store as integer percentage 0-100
    submitted_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

