from fastapi import APIRouter, Depends, HTTPException
from app.schemas.notification_schema import NotificationRead
from app.services.notification_service import NotificationService
from app.dependencies import get_notification_service

router = APIRouter(prefix="/notifications", tags=["notifications"])


@router.get("/{recipient}", response_model=list[NotificationRead])
def get_notifications(
    recipient: str,
    unread_only: bool = False,
    svc: NotificationService = Depends(get_notification_service),
):
    return svc.get_notifications(recipient, unread_only)


@router.patch("/{notification_id}/read", response_model=NotificationRead)
def mark_read(notification_id: int, svc: NotificationService = Depends(get_notification_service)):
    n = svc.mark_read(notification_id)
    if not n:
        raise HTTPException(status_code=404, detail="Notification not found")
    return n


@router.patch("/read-all/{recipient}")
def mark_all_read(recipient: str, svc: NotificationService = Depends(get_notification_service)):
    count = svc.mark_all_read(recipient)
    return {"marked_read": count}
