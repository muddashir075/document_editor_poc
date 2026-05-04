from sqlalchemy.orm import Session
from app.models.notification import Notification, NotificationType


class NotificationRepository:
    def __init__(self, db: Session):
        self.db = db

    def get_for_user(self, recipient: str, unread_only: bool = False) -> list[Notification]:
        q = self.db.query(Notification).filter(Notification.recipient == recipient)
        if unread_only:
            q = q.filter(Notification.is_read == False)  # noqa: E712
        return q.order_by(Notification.created_at.desc()).all()

    def create(self, document_id: int, recipient: str, notification_type: NotificationType, message: str) -> Notification:
        n = Notification(
            document_id=document_id,
            recipient=recipient,
            notification_type=notification_type,
            message=message,
        )
        self.db.add(n)
        self.db.commit()
        self.db.refresh(n)
        return n

    def mark_read(self, notification_id: int) -> Notification | None:
        n = self.db.query(Notification).filter(Notification.id == notification_id).first()
        if n:
            n.is_read = True
            self.db.commit()
            self.db.refresh(n)
        return n

    def mark_all_read(self, recipient: str) -> int:
        updated = (
            self.db.query(Notification)
            .filter(Notification.recipient == recipient, Notification.is_read == False)  # noqa: E712
            .all()
        )
        for n in updated:
            n.is_read = True
        self.db.commit()
        return len(updated)
