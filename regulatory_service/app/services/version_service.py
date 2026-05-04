from app.repositories.version_repository import VersionRepository
from app.repositories.document_repository import DocumentRepository
from app.schemas.version_schema import VersionCreate
from app.models.version import Version
from app.utils.diff_utils import compute_diff


class VersionService:
    def __init__(self, version_repo: VersionRepository, doc_repo: DocumentRepository):
        self.version_repo = version_repo
        self.doc_repo = doc_repo

    def get_versions(self, document_id: int) -> list[Version]:
        return self.version_repo.get_by_document(document_id)

    def get_consolidated_versions(self, document_id: int) -> list[Version]:
        return self.version_repo.get_consolidated(document_id)

    def create_version(self, data: VersionCreate) -> Version:
        latest = self.version_repo.get_latest(data.document_id)
        diff = compute_diff(latest.content, data.content) if latest else None
        return self.version_repo.create(data, diff=diff)

    def create_consolidated_version(self, data: VersionCreate) -> Version:
        """Creates a clean/consolidated version after admin approval."""
        latest = self.version_repo.get_latest(data.document_id)
        diff = compute_diff(latest.content, data.content) if latest else None
        version = self.version_repo.create(data, diff=diff, is_consolidated=1)
        # Update document content to the consolidated version
        doc = self.doc_repo.get_by_id(data.document_id)
        if doc:
            doc.content = data.content
            self.doc_repo.db.commit()
        return version


    def restore_version(self, version_id: int, restored_by: str) -> Version | None:
        """
        Admin: restore a previous version as the current document content.
        Creates a new version snapshot so the restore is tracked in history.
        """
        target = self.version_repo.get_by_id(version_id)
        if not target:
            return None

        doc = self.doc_repo.get_by_id(target.document_id)
        if not doc:
            return None

        old_content = doc.content
        doc.content = target.content
        self.doc_repo.db.commit()
        self.doc_repo.db.refresh(doc)

        diff = compute_diff(old_content, doc.content)
        new_version = self.version_repo.create(
            VersionCreate(
                document_id=doc.id,
                content=doc.content,
                created_by=f"{restored_by} (restored v{target.version_number})",
            ),
            diff=diff,
        )
        return new_version
