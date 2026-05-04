from fastapi import APIRouter, Depends, HTTPException
from app.schemas.version_schema import VersionCreate, VersionRead
from app.services.version_service import VersionService
from app.dependencies import get_version_service
from app.core.roles import require_admin, UserRole

router = APIRouter(prefix="/versions", tags=["versions"])


@router.get("/{document_id}", response_model=list[VersionRead])
def list_versions(document_id: int, svc: VersionService = Depends(get_version_service)):
    return svc.get_versions(document_id)


@router.get("/{document_id}/consolidated", response_model=list[VersionRead])
def list_consolidated(document_id: int, svc: VersionService = Depends(get_version_service)):
    return svc.get_consolidated_versions(document_id)


@router.post("/", response_model=VersionRead, status_code=201)
def create_version(data: VersionCreate, svc: VersionService = Depends(get_version_service)):
    return svc.create_version(data)


@router.post("/consolidated", response_model=VersionRead, status_code=201)
def create_consolidated_version(data: VersionCreate, svc: VersionService = Depends(get_version_service)):
    return svc.create_consolidated_version(data)


@router.post("/{version_id}/restore", response_model=VersionRead, status_code=201)
def restore_version(
    version_id: int,
    restored_by: str = "admin",
    _role: UserRole = Depends(require_admin),
    svc: VersionService = Depends(get_version_service),
):
    """Admin only: restore a previous version as the current document content."""
    version = svc.restore_version(version_id, restored_by)
    if not version:
        raise HTTPException(status_code=404, detail="Version not found")
    return version
