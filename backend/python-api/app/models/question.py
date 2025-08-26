from enum import Enum as PyEnum
from sqlalchemy import Column, Integer, String, JSON, Enum, ForeignKey, Boolean
from sqlalchemy.orm import relationship
from app.db.database import Base


class DifficultyLevel(PyEnum):
    LOW = "하"
    MEDIUM = "중"
    HIGH = "상"


class Source(Base):
    __tablename__ = "sources"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, nullable=False)
    description = Column(String)
    type = Column(String)
    year = Column(Integer, nullable=True)


class Subject(Base):
    __tablename__ = "subjects"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, nullable=False)
    description = Column(String)


class Question(Base):
    __tablename__ = "questions"

    id = Column(Integer, primary_key=True, index=True)
    question_number = Column(Integer, nullable=False)
    content = Column(String, nullable=False)
    description = Column(JSON, nullable=True)
    options = Column(JSON, nullable=True)
    correct_answer = Column(String, default="")
    subject = Column(String, default="")
    area_name = Column(String, default="")
    difficulty = Column(Enum(DifficultyLevel), default=DifficultyLevel.MEDIUM)
    year = Column(Integer, nullable=True)
    image_urls = Column(JSON, nullable=True)
    embedding = Column(JSON, nullable=True)
    is_active = Column(Boolean, default=True)


class AnswerOption(Base):
    __tablename__ = "answer_options"

    id = Column(Integer, primary_key=True, index=True)
    question_id = Column(Integer, ForeignKey("questions.id"), nullable=False)
    option_text = Column(String, nullable=False)
    option_label = Column(String, nullable=False)
    display_order = Column(Integer, default=0)


class CorrectAnswer(Base):
    __tablename__ = "correct_answers"

    id = Column(Integer, primary_key=True, index=True)
    question_id = Column(Integer, ForeignKey("questions.id"), nullable=False)
    answer_text = Column(String, nullable=False)


