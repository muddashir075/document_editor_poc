from app.repositories.notification_repository import NotificationRepository
from app.models.notification import Notification


class NotificationService:
    def __init__(self, notif_repo: NotificationRepository):
        self.notif_repo = notif_repo

    def get_notifications(self, recipient: str, unread_only: bool = False) -> list[Notification]:
        return self.notif_repo.get_for_user(recipient, unread_only)

    def mark_read(self, notification_id: int) -> Notification | None:
        return self.notif_repo.mark_read(notification_id)

    def mark_all_read(self, recipient: str) -> int:
        return self.notif_repo.mark_all_read(recipient)
