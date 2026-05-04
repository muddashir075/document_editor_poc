from sqlalchemy import Column, Integer, String, Text, DateTime, Enum
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
import enum
from app.db.base import Base


class DocumentType(str, enum.Enum):
    standard = "standard"
    matrix = "matrix"
    regulation = "regulation"


class DocumentStatus(str, enum.Enum):
    draft = "draft"
    under_review = "under_review"
    approved = "approved"
    rejected = "rejected"


class Document(Base):
    __tablename__ = "documents"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    # Extracted plain-text / markdown content from the uploaded .docx
    content = Column(Text, nullable=False, default="")
    doc_type = Column(Enum(DocumentType), default=DocumentType.regulation, nullable=False)
    status = Column(Enum(DocumentStatus), default=DocumentStatus.draft, nullable=False)
    author = Column(String, nullable=False, default="system")
    # File storage fields
    file_path = Column(String, nullable=True)          # relative path inside MEDIA_ROOT
    original_filename = Column(String, nullable=True)  # original uploaded filename
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    versions = relationship("Version", back_populates="document", cascade="all, delete-orphan")
    comments = relationship("Comment", back_populates="document", cascade="all, delete-orphan")
    votes = relationship("Vote", back_populates="document", cascade="all, delete-orphan")
    changes = relationship("Change", back_populates="document", cascade="all, delete-orphan")
    notifications = relationship("Notification", back_populates="document", cascade="all, delete-orphan")
