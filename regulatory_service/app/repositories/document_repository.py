from sqlalchemy.orm import Session
from app.models.document import Document, DocumentStatus
from app.schemas.document_schema import DocumentCreate, DocumentUpdate


class DocumentRepository:
    def __init__(self, db: Session):
        self.db = db

    def get_all(self) -> list[Document]:
        return self.db.query(Document).all()

    def get_by_id(self, doc_id: int) -> Document | None:
        return self.db.query(Document).filter(Document.id == doc_id).first()

    def get_by_type(self, doc_type: str) -> list[Document]:
        return self.db.query(Document).filter(Document.doc_type == doc_type).all()

    def create(self, data: DocumentCreate) -> Document:
        doc = Document(**data.model_dump())
        self.db.add(doc)
        self.db.commit()
        self.db.refresh(doc)
        return doc

    def update(self, doc_id: int, data: DocumentUpdate) -> Document | None:
        doc = self.get_by_id(doc_id)
        if not doc:
            return None
        for field, value in data.model_dump(exclude_none=True).items():
            setattr(doc, field, value)
        self.db.commit()
        self.db.refresh(doc)
        return doc

    def update_status(self, doc_id: int, status: DocumentStatus) -> Document | None:
        doc = self.get_by_id(doc_id)
        if not doc:
            return None
        doc.status = status
        self.db.commit()
        self.db.refresh(doc)
        return doc

    def delete(self, doc_id: int) -> Document | None:
        doc = self.get_by_id(doc_id)
        if doc:
            self.db.delete(doc)
            self.db.commit()
        return doc
