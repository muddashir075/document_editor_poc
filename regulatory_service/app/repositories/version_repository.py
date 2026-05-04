from sqlalchemy.orm import Session
from app.models.version import Version
from app.schemas.version_schema import VersionCreate


class VersionRepository:
    def __init__(self, db: Session):
        self.db = db

    def get_by_document(self, document_id: int) -> list[Version]:
        return (
            self.db.query(Version)
            .filter(Version.document_id == document_id)
            .order_by(Version.version_number)
            .all()
        )

    def get_latest(self, document_id: int) -> Version | None:
        return (
            self.db.query(Version)
            .filter(Version.document_id == document_id)
            .order_by(Version.version_number.desc())
            .first()
        )

    def get_consolidated(self, document_id: int) -> list[Version]:
        return (
            self.db.query(Version)
            .filter(Version.document_id == document_id, Version.is_consolidated == 1)
            .all()
        )

    def get_by_id(self, version_id: int) -> Version | None:
        return self.db.query(Version).filter(Version.id == version_id).first()

    def create(self, data: VersionCreate, diff: str | None = None, is_consolidated: int = 0) -> Version:
        latest = self.get_latest(data.document_id)
        version_number = (latest.version_number + 1) if latest else 1
        version = Version(
            **data.model_dump(),
            diff=diff,
            is_consolidated=is_consolidated,
            version_number=version_number,
        )
        self.db.add(version)
        self.db.commit()
        self.db.refresh(version)
        return version
