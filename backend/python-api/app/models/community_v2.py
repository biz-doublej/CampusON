from sqlalchemy import Column, Integer, String, JSON, DateTime, ForeignKey, Boolean, Float, Text, UniqueConstraint
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
from app.db.database import Base


class UserProfile(Base):
    __tablename__ = "user_profiles"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(String, unique=True, index=True, nullable=False)
    display_name = Column(String, nullable=True)
    kbu_verified = Column(Boolean, default=False)  # 경복대 재학생 검증 완료 여부
    department = Column(String, nullable=True)
    entered_year = Column(Integer, nullable=True)


class Board(Base):
    __tablename__ = "boards"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, nullable=False)
    description = Column(String, nullable=True)
    is_anonymous = Column(Boolean, default=False)
    is_student_only = Column(Boolean, default=True)
    creator_user_id = Column(String, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))


class BoardSubscription(Base):
    __tablename__ = "board_subscriptions"
    id = Column(Integer, primary_key=True, index=True)
    board_id = Column(Integer, ForeignKey("boards.id"), nullable=False)
    user_id = Column(String, nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    UniqueConstraint('board_id', 'user_id', name='uq_board_sub')


class PostV2(Base):
    __tablename__ = "posts_v2"

    id = Column(Integer, primary_key=True, index=True)
    board_id = Column(Integer, ForeignKey("boards.id"), nullable=False)
    author_id = Column(String, nullable=False)
    is_anonymous = Column(Boolean, default=False)
    title = Column(String, nullable=False)
    content = Column(Text, nullable=False)
    tags = Column(JSON, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))


class CommentV2(Base):
    __tablename__ = "comments_v2"

    id = Column(Integer, primary_key=True, index=True)
    post_id = Column(Integer, ForeignKey("posts_v2.id"), nullable=False)
    author_id = Column(String, nullable=False)
    is_anonymous = Column(Boolean, default=False)
    content = Column(Text, nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))


class LikeV2(Base):
    __tablename__ = "likes_v2"
    id = Column(Integer, primary_key=True, index=True)
    post_id = Column(Integer, ForeignKey("posts_v2.id"), nullable=False)
    user_id = Column(String, nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    UniqueConstraint('post_id', 'user_id', name='uq_like_v2')


class Bookmark(Base):
    __tablename__ = "bookmarks"
    id = Column(Integer, primary_key=True, index=True)
    post_id = Column(Integer, ForeignKey("posts_v2.id"), nullable=False)
    user_id = Column(String, nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    UniqueConstraint('post_id', 'user_id', name='uq_bookmark')


class Notification(Base):
    __tablename__ = "notifications"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(String, nullable=False)
    type = Column(String, nullable=False)  # comment, like, system
    data = Column(JSON, nullable=True)
    read = Column(Boolean, default=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))


class Lecture(Base):
    __tablename__ = "lectures"
    id = Column(Integer, primary_key=True, index=True)
    code = Column(String, unique=True, nullable=False)
    title = Column(String, nullable=False)
    professor = Column(String, nullable=True)
    department = Column(String, nullable=True)


class LectureReview(Base):
    __tablename__ = "lecture_reviews"
    id = Column(Integer, primary_key=True, index=True)
    lecture_id = Column(Integer, ForeignKey("lectures.id"), nullable=False)
    author_id = Column(String, nullable=False)
    rating = Column(Float, default=0.0)  # 1~5
    difficulty = Column(Float, default=0.0)
    workload = Column(Float, default=0.0)
    content = Column(Text, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))


class EnrollmentStat(Base):
    __tablename__ = "enrollment_stats"
    id = Column(Integer, primary_key=True, index=True)
    lecture_code = Column(String, nullable=False)
    semester = Column(String, nullable=False)
    rating = Column(Float, default=0.0)
    competition_ratio = Column(Float, default=0.0)
    data = Column(JSON, nullable=True)


class TimetableEntry(Base):
    __tablename__ = "timetable_entries"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(String, nullable=False)
    lecture_code = Column(String, nullable=True)
    title = Column(String, nullable=False)
    day_of_week = Column(Integer, nullable=False)  # 0=Mon
    time_start = Column(String, nullable=False)    # "09:00"
    time_end = Column(String, nullable=False)
    location = Column(String, nullable=True)


class Group(Base):
    __tablename__ = "groups"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    group_type = Column(String, nullable=True)  # department/year/graduates/etc
    created_by = Column(String, nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))


class GroupMember(Base):
    __tablename__ = "group_members"
    id = Column(Integer, primary_key=True, index=True)
    group_id = Column(Integer, ForeignKey("groups.id"), nullable=False)
    user_id = Column(String, nullable=False)
    role = Column(String, default="member")
    UniqueConstraint('group_id', 'user_id', name='uq_group_member')


class GroupMessage(Base):
    __tablename__ = "group_messages"
    id = Column(Integer, primary_key=True, index=True)
    group_id = Column(Integer, ForeignKey("groups.id"), nullable=False)
    author_id = Column(String, nullable=False)
    content = Column(Text, nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))


class Place(Base):
    __tablename__ = "places"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    category = Column(String, nullable=False)  # cafeteria, shuttle, library, etc.
    meta = Column(JSON, nullable=True)


class MarketItem(Base):
    __tablename__ = "market_items"
    id = Column(Integer, primary_key=True, index=True)
    seller_id = Column(String, nullable=False)
    title = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    price = Column(Float, default=0.0)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

