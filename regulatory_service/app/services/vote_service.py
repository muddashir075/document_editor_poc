from app.repositories.vote_repository import VoteRepository
from app.repositories.notification_repository import NotificationRepository
from app.schemas.vote_schema import VoteCreate, VoteSummary
from app.models.vote import Vote
from app.models.notification import NotificationType


class VoteService:
    def __init__(self, vote_repo: VoteRepository, notif_repo: NotificationRepository):
        self.vote_repo = vote_repo
        self.notif_repo = notif_repo

    def get_votes(self, document_id: int) -> list[Vote]:
        return self.vote_repo.get_by_document(document_id)

    def get_votes_by_paragraph(self, document_id: int, paragraph_id: str) -> list[Vote]:
        return self.vote_repo.get_by_paragraph(document_id, paragraph_id)

    def get_summary(self, document_id: int) -> VoteSummary:
        counts = self.vote_repo.count_by_type(document_id)
        total = sum(counts.values())
        return VoteSummary(
            in_favor=counts.get("in_favor", 0),
            against=counts.get("against", 0),
            observed=counts.get("observed", 0),
            total=total,
        )

    def create_vote(self, data: VoteCreate) -> Vote:
        vote = self.vote_repo.create(data)
        self.notif_repo.create(
            document_id=data.document_id,
            recipient="admin",
            notification_type=NotificationType.pending_vote,
            message=f"New vote '{data.vote_type}' by {data.user} on document {data.document_id}"
            + (f" (paragraph {data.paragraph_id})" if data.paragraph_id else ""),
        )
        return vote
