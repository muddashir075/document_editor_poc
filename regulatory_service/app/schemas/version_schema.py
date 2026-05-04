from pydantic import BaseModel
from datetime import datetime


class VersionBase(BaseModel):
    document_id: int
    content: str
    created_by: str = "system"


class VersionCreate(VersionBase):
    pass


class VersionRead(VersionBase):
    id: int
    version_number: int
    diff: str | None
    is_consolidated: int
    created_at: datetime

    class Config:
        from_attributes = True
