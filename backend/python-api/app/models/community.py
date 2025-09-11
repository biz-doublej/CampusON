from sqlalchemy import Column, Integer, String, JSON, DateTime, ForeignKey
from datetime import datetime, timezone
from app.db.database import Base


class CommunityPost(Base):
    __tablename__ = "community_posts"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    content = Column(String, nullable=False)
    author_id = Column(String, nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))


class CommunityComment(Base):
    __tablename__ = "community_comments"

    id = Column(Integer, primary_key=True, index=True)
    post_id = Column(Integer, ForeignKey("community_posts.id"), nullable=False)
    content = Column(String, nullable=False)
    author_id = Column(String, nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))


class CommunityLike(Base):
    __tablename__ = "community_likes"

    id = Column(Integer, primary_key=True, index=True)
    post_id = Column(Integer, ForeignKey("community_posts.id"), nullable=False)
    user_id = Column(String, nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

