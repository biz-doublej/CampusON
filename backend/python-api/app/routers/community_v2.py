from fastapi import APIRouter, Depends, HTTPException, Body, Query
from sqlalchemy.orm import Session
from typing import Dict, Any, List, Optional
from app.db.database import get_db
from app.models.community_v2 import (
    UserProfile, Board, BoardSubscription, PostV2, CommentV2, LikeV2, Bookmark, Notification,
    Lecture, LectureReview, EnrollmentStat, TimetableEntry, Group, GroupMember, GroupMessage, Place, MarketItem
)


router = APIRouter(prefix="/api/community", tags=["community_v2"])


def require_kbu(db: Session, user_id: str) -> UserProfile:
    up = db.query(UserProfile).filter(UserProfile.user_id == user_id).first()
    if not up or not up.kbu_verified:
        raise HTTPException(status_code=403, detail="경복대 재학생만 이용 가능합니다.")
    return up


@router.post("/verify")
def set_verification(payload: Dict[str, Any] = Body(...), db: Session = Depends(get_db)):
    user_id = payload.get("user_id")
    kbu_verified = bool(payload.get("kbu_verified", False))
    if not user_id:
        raise HTTPException(status_code=400, detail="user_id 필수")
    up = db.query(UserProfile).filter(UserProfile.user_id == user_id).first()
    if not up:
        up = UserProfile(user_id=user_id)
        db.add(up)
    up.kbu_verified = kbu_verified
    db.commit()
    return {"success": True}


# Boards
@router.post("/boards")
def create_board(payload: Dict[str, Any] = Body(...), db: Session = Depends(get_db)):
    user_id = payload.get("user_id")
    require_kbu(db, user_id)
    name = payload.get("name")
    desc = payload.get("description")
    is_anonymous = bool(payload.get("is_anonymous", False))
    b = Board(name=name, description=desc, is_anonymous=is_anonymous, creator_user_id=user_id)
    db.add(b)
    db.commit()
    db.refresh(b)
    return {"success": True, "board": {"id": b.id, "name": b.name}}


@router.get("/boards")
def list_boards(db: Session = Depends(get_db)):
    rows = db.query(Board).order_by(Board.id.asc()).all()
    return {"success": True, "boards": [{"id": r.id, "name": r.name, "is_anonymous": r.is_anonymous} for r in rows]}


# Posts
@router.post("/posts")
def create_post(payload: Dict[str, Any] = Body(...), db: Session = Depends(get_db)):
    user_id = payload.get("user_id")
    require_kbu(db, user_id)
    board_id = int(payload.get("board_id"))
    title = payload.get("title")
    content = payload.get("content")
    is_anonymous = bool(payload.get("is_anonymous", False))
    p = PostV2(board_id=board_id, author_id=user_id, title=title, content=content, is_anonymous=is_anonymous, tags=payload.get("tags"))
    db.add(p)
    db.commit()
    db.refresh(p)
    return {"success": True, "post_id": p.id}


@router.get("/posts")
def list_posts(board_id: int, q: Optional[str] = None, db: Session = Depends(get_db)):
    qry = db.query(PostV2).filter(PostV2.board_id == board_id)
    if q:
        like = f"%{q}%"
        qry = qry.filter(PostV2.title.ilike(like) | PostV2.content.ilike(like))
    rows = qry.order_by(PostV2.id.desc()).limit(100).all()
    items = []
    for r in rows:
        items.append({
            "id": r.id,
            "title": r.title,
            "content": r.content,
            "tags": r.tags or [],
            "author": None if r.is_anonymous else r.author_id,
            "created_at": r.created_at.isoformat(),
        })
    return {"success": True, "posts": items}


@router.post("/comments")
def create_comment(payload: Dict[str, Any] = Body(...), db: Session = Depends(get_db)):
    user_id = payload.get("user_id")
    require_kbu(db, user_id)
    c = CommentV2(post_id=int(payload.get("post_id")), author_id=user_id, is_anonymous=bool(payload.get("is_anonymous", False)), content=payload.get("content"))
    db.add(c)
    # notify post author
    post = db.query(PostV2).get(c.post_id)
    if post and post.author_id != user_id:
        db.add(Notification(user_id=post.author_id, type="comment", data={"post_id": post.id}))
    db.commit()
    return {"success": True}


# Likes/Bookmarks
@router.post("/posts/{post_id}/like")
def like_post(post_id: int, payload: Dict[str, Any] = Body(...), db: Session = Depends(get_db)):
    user_id = payload.get("user_id")
    require_kbu(db, user_id)
    ex = db.query(LikeV2).filter(LikeV2.post_id==post_id, LikeV2.user_id==user_id).first()
    if ex:
        db.delete(ex)
        db.commit()
        return {"success": True, "liked": False}
    db.add(LikeV2(post_id=post_id, user_id=user_id))
    db.commit()
    return {"success": True, "liked": True}


@router.post("/posts/{post_id}/bookmark")
def bookmark_post(post_id: int, payload: Dict[str, Any] = Body(...), db: Session = Depends(get_db)):
    user_id = payload.get("user_id")
    require_kbu(db, user_id)
    ex = db.query(Bookmark).filter(Bookmark.post_id==post_id, Bookmark.user_id==user_id).first()
    if ex:
        db.delete(ex)
        db.commit()
        return {"success": True, "bookmarked": False}
    db.add(Bookmark(post_id=post_id, user_id=user_id))
    db.commit()
    return {"success": True, "bookmarked": True}


# Notifications
@router.get("/notifications")
def list_notifications(user_id: str, db: Session = Depends(get_db)):
    require_kbu(db, user_id)
    rows = db.query(Notification).filter(Notification.user_id==user_id).order_by(Notification.id.desc()).limit(100).all()
    return {"success": True, "items": [{"id": r.id, "type": r.type, "data": r.data, "read": r.read, "created_at": r.created_at.isoformat()} for r in rows]}


@router.post("/notifications/{nid}/read")
def mark_read(nid: int, payload: Dict[str, Any] = Body(...), db: Session = Depends(get_db)):
    user_id = payload.get("user_id")
    require_kbu(db, user_id)
    n = db.query(Notification).get(nid)
    if not n or n.user_id != user_id:
        raise HTTPException(status_code=404, detail="not found")
    n.read = True
    db.commit()
    return {"success": True}


# Timetable
@router.post("/timetable")
def add_timetable(payload: Dict[str, Any] = Body(...), db: Session = Depends(get_db)):
    user_id = payload.get("user_id")
    require_kbu(db, user_id)
    entry = TimetableEntry(
        user_id=user_id,
        lecture_code=payload.get("lecture_code"),
        title=payload.get("title"),
        day_of_week=int(payload.get("day_of_week")),
        time_start=payload.get("time_start"),
        time_end=payload.get("time_end"),
        location=payload.get("location"),
    )
    db.add(entry)
    db.commit()
    return {"success": True}


@router.get("/timetable")
def list_timetable(user_id: str, db: Session = Depends(get_db)):
    require_kbu(db, user_id)
    rows = db.query(TimetableEntry).filter(TimetableEntry.user_id==user_id).order_by(TimetableEntry.day_of_week.asc(), TimetableEntry.time_start.asc()).all()
    return {"success": True, "items": [{"id": r.id, "title": r.title, "dow": r.day_of_week, "start": r.time_start, "end": r.time_end, "place": r.location} for r in rows]}


# Lecture review
@router.post("/lectures")
def add_lecture(payload: Dict[str, Any] = Body(...), db: Session = Depends(get_db)):
    code = payload.get("code"); title=payload.get("title")
    lec = db.query(Lecture).filter(Lecture.code==code).first()
    if not lec:
        lec = Lecture(code=code, title=title, professor=payload.get("professor"), department=payload.get("department"))
        db.add(lec)
        db.commit(); db.refresh(lec)
    return {"success": True, "lecture_id": lec.id}


@router.post("/lectures/{lecture_id}/review")
def add_review(lecture_id: int, payload: Dict[str, Any] = Body(...), db: Session = Depends(get_db)):
    user_id = payload.get("user_id"); require_kbu(db, user_id)
    rv = LectureReview(lecture_id=lecture_id, author_id=user_id, rating=float(payload.get("rating", 0)), difficulty=float(payload.get("difficulty", 0)), workload=float(payload.get("workload", 0)), content=payload.get("content"))
    db.add(rv); db.commit(); return {"success": True}


@router.get("/lectures/{lecture_id}/review")
def list_review(lecture_id: int, db: Session = Depends(get_db)):
    rows = db.query(LectureReview).filter(LectureReview.lecture_id==lecture_id).order_by(LectureReview.id.desc()).limit(100).all()
    avg = 0.0
    if rows:
        avg = sum(r.rating for r in rows)/len(rows)
    return {"success": True, "avg": avg, "reviews": [{"id": r.id, "rating": r.rating, "diff": r.difficulty, "work": r.workload, "content": r.content} for r in rows]}


# Groups
@router.post("/groups")
def create_group(payload: Dict[str, Any] = Body(...), db: Session = Depends(get_db)):
    user_id = payload.get("user_id"); require_kbu(db, user_id)
    g = Group(name=payload.get("name"), group_type=payload.get("group_type"), created_by=user_id)
    db.add(g); db.commit(); db.refresh(g)
    db.add(GroupMember(group_id=g.id, user_id=user_id, role="owner")); db.commit()
    return {"success": True, "group_id": g.id}


@router.post("/groups/{group_id}/join")
def join_group(group_id: int, payload: Dict[str, Any] = Body(...), db: Session = Depends(get_db)):
    user_id = payload.get("user_id"); require_kbu(db, user_id)
    ex = db.query(GroupMember).filter(GroupMember.group_id==group_id, GroupMember.user_id==user_id).first()
    if not ex:
        db.add(GroupMember(group_id=group_id, user_id=user_id)); db.commit()
    return {"success": True}


@router.post("/groups/{group_id}/messages")
def send_message(group_id: int, payload: Dict[str, Any] = Body(...), db: Session = Depends(get_db)):
    user_id = payload.get("user_id"); require_kbu(db, user_id)
    db.add(GroupMessage(group_id=group_id, author_id=user_id, content=payload.get("content"))); db.commit(); return {"success": True}


@router.get("/groups/{group_id}/messages")
def list_messages(group_id: int, db: Session = Depends(get_db)):
    rows = db.query(GroupMessage).filter(GroupMessage.group_id==group_id).order_by(GroupMessage.id.desc()).limit(100).all()
    return {"success": True, "messages": [{"id": r.id, "author": r.author_id, "content": r.content, "created_at": r.created_at.isoformat()} for r in rows]}


# Market/Places
@router.post("/market")
def add_market(payload: Dict[str, Any] = Body(...), db: Session = Depends(get_db)):
    user_id = payload.get("user_id"); require_kbu(db, user_id)
    item = MarketItem(seller_id=user_id, title=payload.get("title"), description=payload.get("description"), price=float(payload.get("price",0)))
    db.add(item); db.commit(); return {"success": True}


@router.get("/market")
def list_market(db: Session = Depends(get_db)):
    rows = db.query(MarketItem).order_by(MarketItem.id.desc()).limit(100).all()
    return {"success": True, "items": [{"id": r.id, "title": r.title, "price": r.price, "seller": r.seller_id} for r in rows]}


@router.get("/search")
def search_all(q: str, db: Session = Depends(get_db)):
    like = f"%{q}%"
    posts = db.query(PostV2).filter(PostV2.title.ilike(like) | PostV2.content.ilike(like)).order_by(PostV2.id.desc()).limit(50).all()
    market = db.query(MarketItem).filter(MarketItem.title.ilike(like)).limit(20).all()
    return {"success": True, "posts": [{"id": p.id, "title": p.title}], "market": [{"id": m.id, "title": m.title}]}

