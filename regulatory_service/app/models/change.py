from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, Enum
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
import enum
from app.db.base import Base


class ChangeStatus(str, enum.Enum):
    pending = "pending"
    accepted = "accepted"
    rejected = "rejected"


class Change(Base):
    """Tracks individual text changes (insertions/deletions) with author identification."""
    __tablename__ = "changes"

    id = Column(Integer, primary_key=True, index=True)
    document_id = Column(Integer, ForeignKey("documents.id"), nullable=False)
    author = Column(String, nullable=False)
    paragraph_id = Column(String, nullable=True)
    original_text = Column(Text, nullable=True)
    new_text = Column(Text, nullable=True)
    change_type = Column(String, nullable=False)   # "insert" | "delete" | "replace"
    status = Column(Enum(ChangeStatus), default=ChangeStatus.pending, nullable=False)
    reviewed_by = Column(String, nullable=True)
    reviewed_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    document = relationship("Document", back_populates="changes")
