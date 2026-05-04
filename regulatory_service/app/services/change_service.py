from app.repositories.change_repository import ChangeRepository
from app.repositories.notification_repository import NotificationRepository
from app.repositories.version_repository import VersionRepository
from app.repositories.document_repository import DocumentRepository
from app.schemas.change_schema import ChangeCreate
from app.schemas.version_schema import VersionCreate
from app.models.change import Change, ChangeStatus
from app.models.notification import NotificationType
from app.utils.diff_utils import compute_diff


class ChangeService:
    def __init__(
        self,
        change_repo: ChangeRepository,
        notif_repo: NotificationRepository,
        version_repo: VersionRepository,
        doc_repo: DocumentRepository,
    ):
        self.change_repo = change_repo
        self.notif_repo = notif_repo
        self.version_repo = version_repo
        self.doc_repo = doc_repo

    def get_changes(self, document_id: int) -> list[Change]:
        return self.change_repo.get_by_document(document_id)

    def get_pending_changes(self, document_id: int) -> list[Change]:
        return self.change_repo.get_pending(document_id)

    def propose_change(self, data: ChangeCreate) -> Change:
        return self.change_repo.create(data)

    def review_change(self, change_id: int, status: ChangeStatus, reviewed_by: str) -> Change | None:
        change = self.change_repo.review(change_id, status, reviewed_by)
        if not change:
            return None

        # Notify the author
        notif_type = (
            NotificationType.change_accepted
            if status == ChangeStatus.accepted
            else NotificationType.change_rejected
        )
        self.notif_repo.create(
            document_id=change.document_id,
            recipient=change.author,
            notification_type=notif_type,
            message=f"Your change on document {change.document_id} was {status.value} by {reviewed_by}",
        )

        if status != ChangeStatus.accepted:
            return change

        # ── Apply the change to document content ──────────────────────────────
        doc = self.doc_repo.get_by_id(change.document_id)
        if not doc:
            return change

        old_content = doc.content

        if change.change_type == "replace" and change.original_text and change.new_text:
            doc.content = doc.content.replace(change.original_text, change.new_text, 1)
        elif change.change_type == "insert" and change.new_text:
            doc.content = doc.content + "\n\n" + change.new_text
        elif change.change_type == "delete" and change.original_text:
            doc.content = doc.content.replace(change.original_text, "", 1)
        else:
            # Nothing to apply (e.g. insert with no new_text)
            return change

        # Commit the updated document content first
        self.doc_repo.db.commit()
        self.doc_repo.db.refresh(doc)

        # ── Snapshot a new version ────────────────────────────────────────────
        diff = compute_diff(old_content, doc.content)
        self.version_repo.create(
            VersionCreate(
                document_id=doc.id,
                content=doc.content,
                created_by=reviewed_by,
            ),
            diff=diff,
        )

        return change
