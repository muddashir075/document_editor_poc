from pydantic import BaseModel
from datetime import datetime


class CommentBase(BaseModel):
    document_id: int
    author: str
    content: str
    paragraph_id: str | None = None
    selected_text: str | None = None
    start_offset: int | None = None
    end_offset: int | None = None


class CommentCreate(CommentBase):
    pass


class CommentResolve(BaseModel):
    resolved_by: str


class CommentRead(CommentBase):
    id: int
    is_resolved: bool
    resolved_by: str | None
    resolved_at: datetime | None
    created_at: datetime

    class Config:
        from_attributes = True
