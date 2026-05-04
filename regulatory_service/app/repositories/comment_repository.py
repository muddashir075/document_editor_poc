from sqlalchemy.orm import Session
from datetime import datetime, timezone
from app.models.comment import Comment
from app.schemas.comment_schema import CommentCreate


class CommentRepository:
    def __init__(self, db: Session):
        self.db = db

    def get_by_document(self, document_id: int) -> list[Comment]:
        return self.db.query(Comment).filter(Comment.document_id == document_id).all()

    def get_by_paragraph(self, document_id: int, paragraph_id: str) -> list[Comment]:
        return (
            self.db.query(Comment)
            .filter(Comment.document_id == document_id, Comment.paragraph_id == paragraph_id)
            .all()
        )

    def get_by_id(self, comment_id: int) -> Comment | None:
        return self.db.query(Comment).filter(Comment.id == comment_id).first()

    def create(self, data: CommentCreate) -> Comment:
        comment = Comment(**data.model_dump())
        self.db.add(comment)
        self.db.commit()
        self.db.refresh(comment)
        return comment

    def resolve(self, comment_id: int, resolved_by: str) -> Comment | None:
        comment = self.get_by_id(comment_id)
        if not comment:
            return None
        comment.is_resolved = True
        comment.resolved_by = resolved_by
        comment.resolved_at = datetime.now(timezone.utc)
        self.db.commit()
        self.db.refresh(comment)
        return comment

    def delete(self, comment_id: int) -> Comment | None:
        comment = self.get_by_id(comment_id)
        if comment:
            self.db.delete(comment)
            self.db.commit()
        return comment
