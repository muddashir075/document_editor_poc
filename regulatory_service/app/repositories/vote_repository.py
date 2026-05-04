from sqlalchemy.orm import Session
from app.models.vote import Vote, VoteType
from app.schemas.vote_schema import VoteCreate


class VoteRepository:
    def __init__(self, db: Session):
        self.db = db

    def get_by_document(self, document_id: int) -> list[Vote]:
        return self.db.query(Vote).filter(Vote.document_id == document_id).all()

    def get_by_paragraph(self, document_id: int, paragraph_id: str) -> list[Vote]:
        return (
            self.db.query(Vote)
            .filter(Vote.document_id == document_id, Vote.paragraph_id == paragraph_id)
            .all()
        )

    def get_by_user_and_document(self, user: str, document_id: int) -> Vote | None:
        return (
            self.db.query(Vote)
            .filter(Vote.user == user, Vote.document_id == document_id)
            .first()
        )

    def create(self, data: VoteCreate) -> Vote:
        vote = Vote(**data.model_dump())
        self.db.add(vote)
        self.db.commit()
        self.db.refresh(vote)
        return vote

    def count_by_type(self, document_id: int) -> dict:
        votes = self.get_by_document(document_id)
        summary = {t.value: 0 for t in VoteType}
        for v in votes:
            summary[v.vote_type.value] += 1
        return summary
