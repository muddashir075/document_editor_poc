"""
Dependency injection mappings.
Each function provides a repository or service instance bound to the current DB session.
Import these with FastAPI's Depends() in routers.
"""
from fastapi import Depends
from sqlalchemy.orm import Session

from app.db.session import get_db

# --- Repositories ---
from app.repositories.document_repository import DocumentRepository
from app.repositories.comment_repository import CommentRepository
from app.repositories.vote_repository import VoteRepository
from app.repositories.version_repository import VersionRepository
from app.repositories.change_repository import ChangeRepository
from app.repositories.notification_repository import NotificationRepository

# --- Services ---
from app.services.document_service import DocumentService
from app.services.comment_service import CommentService
from app.services.vote_service import VoteService
from app.services.version_service import VersionService
from app.services.change_service import ChangeService
from app.services.notification_service import NotificationService


# Repository providers
def get_document_repo(db: Session = Depends(get_db)) -> DocumentRepository:
    return DocumentRepository(db)

def get_comment_repo(db: Session = Depends(get_db)) -> CommentRepository:
    return CommentRepository(db)

def get_vote_repo(db: Session = Depends(get_db)) -> VoteRepository:
    return VoteRepository(db)

def get_version_repo(db: Session = Depends(get_db)) -> VersionRepository:
    return VersionRepository(db)

def get_change_repo(db: Session = Depends(get_db)) -> ChangeRepository:
    return ChangeRepository(db)

def get_notification_repo(db: Session = Depends(get_db)) -> NotificationRepository:
    return NotificationRepository(db)


# Service providers (services depend on repos)
def get_document_service(
    doc_repo: DocumentRepository = Depends(get_document_repo),
    version_repo: VersionRepository = Depends(get_version_repo),
) -> DocumentService:
    return DocumentService(doc_repo, version_repo)

def get_comment_service(
    comment_repo: CommentRepository = Depends(get_comment_repo),
    notif_repo: NotificationRepository = Depends(get_notification_repo),
) -> CommentService:
    return CommentService(comment_repo, notif_repo)

def get_vote_service(
    vote_repo: VoteRepository = Depends(get_vote_repo),
    notif_repo: NotificationRepository = Depends(get_notification_repo),
) -> VoteService:
    return VoteService(vote_repo, notif_repo)

def get_version_service(
    version_repo: VersionRepository = Depends(get_version_repo),
    doc_repo: DocumentRepository = Depends(get_document_repo),
) -> VersionService:
    return VersionService(version_repo, doc_repo)

def get_change_service(
    change_repo: ChangeRepository = Depends(get_change_repo),
    notif_repo: NotificationRepository = Depends(get_notification_repo),
    version_repo: VersionRepository = Depends(get_version_repo),
    doc_repo: DocumentRepository = Depends(get_document_repo),
) -> ChangeService:
    return ChangeService(change_repo, notif_repo, version_repo, doc_repo)

def get_notification_service(
    notif_repo: NotificationRepository = Depends(get_notification_repo),
) -> NotificationService:
    return NotificationService(notif_repo)
