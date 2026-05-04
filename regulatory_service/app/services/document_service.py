import os
from pathlib import Path

from fastapi import UploadFile

from app.repositories.document_repository import DocumentRepository
from app.repositories.version_repository import VersionRepository
from app.schemas.document_schema import DocumentCreate, DocumentUpdate
from app.schemas.version_schema import VersionCreate
from app.models.document import Document, DocumentStatus
from app.utils.docx_utils import save_upload, extract_html
from app.utils.diff_utils import compute_diff
from app.core.config import settings


class DocumentService:
    def __init__(self, doc_repo: DocumentRepository, version_repo: VersionRepository):
        self.doc_repo = doc_repo
        self.version_repo = version_repo

    def get_documents(self) -> list[Document]:
        return self.doc_repo.get_all()

    def get_documents_by_type(self, doc_type: str) -> list[Document]:
        return self.doc_repo.get_by_type(doc_type)

    def get_document(self, doc_id: int) -> Document | None:
        return self.doc_repo.get_by_id(doc_id)

    def upload_document(self, file: UploadFile, title: str, doc_type: str, author: str) -> Document:
        """Save .docx to media folder, extract content, persist to DB."""
        relative_path, original_filename = save_upload(file)
        content = extract_html(relative_path)
        data = DocumentCreate(
            title=title,
            content=content,
            doc_type=doc_type,  # type: ignore[arg-type]
            author=author,
            file_path=relative_path,
            original_filename=original_filename,
        )
        doc = self.doc_repo.create(data)
        # Snapshot v1 immediately after upload
        self.version_repo.create(
            VersionCreate(document_id=doc.id, content=doc.content, created_by=author),
            diff=None,
        )
        return doc

    def create_document(self, data: DocumentCreate) -> Document:
        doc = self.doc_repo.create(data)
        # Snapshot v1
        self.version_repo.create(
            VersionCreate(document_id=doc.id, content=doc.content, created_by=data.author),
            diff=None,
        )
        return doc

    def update_document(self, doc_id: int, data: DocumentUpdate, updated_by: str = "system") -> Document | None:
        existing = self.doc_repo.get_by_id(doc_id)
        if not existing:
            return None

        old_content = existing.content
        doc = self.doc_repo.update(doc_id, data)
        if not doc:
            return None

        # Only snapshot a new version when content actually changed
        if data.content is not None and data.content != old_content:
            diff = compute_diff(old_content, doc.content)
            self.version_repo.create(
                VersionCreate(document_id=doc.id, content=doc.content, created_by=updated_by),
                diff=diff,
            )

        return doc

    def update_status(self, doc_id: int, status: DocumentStatus) -> Document | None:
        return self.doc_repo.update_status(doc_id, status)

    def delete_document(self, doc_id: int) -> Document | None:
        doc = self.doc_repo.get_by_id(doc_id)
        if doc and doc.file_path:
            try:
                full = Path(settings.MEDIA_ROOT) / doc.file_path
                if full.exists():
                    os.remove(full)
            except OSError:
                pass
        return self.doc_repo.delete(doc_id)
