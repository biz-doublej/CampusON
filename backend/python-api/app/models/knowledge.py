from sqlalchemy import Column, Integer, String, JSON, DateTime
from datetime import datetime, timezone
from app.db.database import Base


class KnowledgeChunk(Base):
    __tablename__ = "knowledge_chunks"

    id = Column(Integer, primary_key=True, index=True)
    text = Column(String, nullable=False)
    # 'metadata' is reserved by SQLAlchemy's Declarative API; use 'meta' instead
    meta = Column(JSON, nullable=True)
    embedding = Column(JSON, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
