from pydantic import BaseModel
from datetime import datetime
from app.models.notification import NotificationType


class NotificationRead(BaseModel):
    id: int
    document_id: int
    recipient: str
    notification_type: NotificationType
    message: str
    is_read: bool
    created_at: datetime

    class Config:
        from_attributes = True
