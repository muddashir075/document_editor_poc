from app.repositories.comment_repository import CommentRepository
from app.repositories.notification_repository import NotificationRepository
from app.schemas.comment_schema import CommentCreate
from app.models.comment import Comment
from app.models.notification import NotificationType


class CommentService:
    def __init__(self, comment_repo: CommentRepository, notif_repo: NotificationRepository):
        self.comment_repo = comment_repo
        self.notif_repo = notif_repo

    def get_comments(self, document_id: int) -> list[Comment]:
        return self.comment_repo.get_by_document(document_id)

    def get_comments_by_paragraph(self, document_id: int, paragraph_id: str) -> list[Comment]:
        return self.comment_repo.get_by_paragraph(document_id, paragraph_id)

    def create_comment(self, data: CommentCreate) -> Comment:
        comment = self.comment_repo.create(data)
        # Notify document author / admins about new pending comment
        self.notif_repo.create(
            document_id=data.document_id,
            recipient="admin",
            notification_type=NotificationType.pending_comment,
            message=f"New comment by {data.author} on document {data.document_id}"
            + (f" (paragraph {data.paragraph_id})" if data.paragraph_id else ""),
        )
        return comment

    def resolve_comment(self, comment_id: int, resolved_by: str) -> Comment | None:
        return self.comment_repo.resolve(comment_id, resolved_by)

    def delete_comment(self, comment_id: int) -> Comment | None:
        return self.comment_repo.delete(comment_id)
