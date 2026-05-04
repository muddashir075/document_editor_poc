from pydantic import BaseModel
from datetime import datetime
from app.models.change import ChangeStatus


class ChangeBase(BaseModel):
    document_id: int
    author: str
    paragraph_id: str | None = None
    original_text: str | None = None
    new_text: str | None = None
    change_type: str  # "insert" | "delete" | "replace"


class ChangeCreate(ChangeBase):
    pass


class ChangeReview(BaseModel):
    status: ChangeStatus   # accepted | rejected
    reviewed_by: str


class ChangeRead(ChangeBase):
    id: int
    status: ChangeStatus
    reviewed_by: str | None
    reviewed_at: datetime | None
    created_at: datetime

    class Config:
        from_attributes = True
