from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, Boolean
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
from app.db.base import Base


class Comment(Base):
    __tablename__ = "comments"

    id = Column(Integer, primary_key=True, index=True)
    document_id = Column(Integer, ForeignKey("documents.id"), nullable=False)
    author = Column(String, nullable=False)
    content = Column(Text, nullable=False)
    # For marginal/inline comments: selected text anchor
    paragraph_id = Column(String, nullable=True)       # e.g. "p-3" or article ref
    selected_text = Column(Text, nullable=True)        # the highlighted text
    start_offset = Column(Integer, nullable=True)
    end_offset = Column(Integer, nullable=True)
    is_resolved = Column(Boolean, default=False)
    resolved_by = Column(String, nullable=True)
    resolved_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    document = relationship("Document", back_populates="comments")
