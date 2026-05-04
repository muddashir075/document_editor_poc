from sqlalchemy.orm import Session
from datetime import datetime, timezone
from app.models.change import Change, ChangeStatus
from app.schemas.change_schema import ChangeCreate


class ChangeRepository:
    def __init__(self, db: Session):
        self.db = db

    def get_by_document(self, document_id: int) -> list[Change]:
        return self.db.query(Change).filter(Change.document_id == document_id).all()

    def get_pending(self, document_id: int) -> list[Change]:
        return (
            self.db.query(Change)
            .filter(Change.document_id == document_id, Change.status == ChangeStatus.pending)
            .all()
        )

    def get_by_id(self, change_id: int) -> Change | None:
        return self.db.query(Change).filter(Change.id == change_id).first()

    def create(self, data: ChangeCreate) -> Change:
        change = Change(**data.model_dump())
        self.db.add(change)
        self.db.commit()
        self.db.refresh(change)
        return change

    def review(self, change_id: int, status: ChangeStatus, reviewed_by: str) -> Change | None:
        change = self.get_by_id(change_id)
        if not change:
            return None
        change.status = status
        change.reviewed_by = reviewed_by
        change.reviewed_at = datetime.now(timezone.utc)
        self.db.commit()
        self.db.refresh(change)
        return change
