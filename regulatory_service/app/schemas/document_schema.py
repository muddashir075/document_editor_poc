from pydantic import BaseModel
from datetime import datetime
from app.models.document import DocumentType, DocumentStatus


class DocumentBase(BaseModel):
    title: str
    content: str
    doc_type: DocumentType = DocumentType.regulation
    status: DocumentStatus = DocumentStatus.draft
    author: str = "system"


class DocumentCreate(DocumentBase):
    file_path: str | None = None
    original_filename: str | None = None


class DocumentUpdate(BaseModel):
    title: str | None = None
    content: str | None = None
    doc_type: DocumentType | None = None
    status: DocumentStatus | None = None


class DocumentRead(DocumentBase):
    id: int
    file_path: str | None
    original_filename: str | None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
