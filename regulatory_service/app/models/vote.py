from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Enum
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
import enum
from app.db.base import Base


class VoteType(str, enum.Enum):
    in_favor = "in_favor"
    against = "against"
    observed = "observed"


class Vote(Base):
    __tablename__ = "votes"

    id = Column(Integer, primary_key=True, index=True)
    document_id = Column(Integer, ForeignKey("documents.id"), nullable=False)
    user = Column(String, nullable=False)
    vote_type = Column(Enum(VoteType), nullable=False)
    # Optional: vote on a specific paragraph/article
    paragraph_id = Column(String, nullable=True)
    justification = Column(String, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    document = relationship("Document", back_populates="votes")
