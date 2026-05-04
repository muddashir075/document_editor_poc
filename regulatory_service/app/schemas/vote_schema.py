from pydantic import BaseModel
from datetime import datetime
from app.models.vote import VoteType


class VoteBase(BaseModel):
    document_id: int
    user: str
    vote_type: VoteType
    paragraph_id: str | None = None
    justification: str | None = None


class VoteCreate(VoteBase):
    pass


class VoteRead(VoteBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True


class VoteSummary(BaseModel):
    in_favor: int
    against: int
    observed: int
    total: int
