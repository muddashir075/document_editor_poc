from fastapi import APIRouter, Depends, HTTPException
from app.schemas.change_schema import ChangeCreate, ChangeRead, ChangeReview
from app.services.change_service import ChangeService
from app.dependencies import get_change_service
from app.core.roles import require_admin, require_reviewer, UserRole

router = APIRouter(prefix="/changes", tags=["changes"])


# ── Read — all roles ──────────────────────────────────────────────────────────
@router.get("/{document_id}", response_model=list[ChangeRead])
def list_changes(document_id: int, svc: ChangeService = Depends(get_change_service)):
    return svc.get_changes(document_id)


@router.get("/{document_id}/pending", response_model=list[ChangeRead])
def list_pending_changes(document_id: int, svc: ChangeService = Depends(get_change_service)):
    return svc.get_pending_changes(document_id)


# ── Propose — reviewer + admin ────────────────────────────────────────────────
@router.post("/", response_model=ChangeRead, status_code=201)
def propose_change(
    data: ChangeCreate,
    _role: UserRole = Depends(require_reviewer),
    svc: ChangeService = Depends(get_change_service),
):
    return svc.propose_change(data)


# ── Review — admin only ───────────────────────────────────────────────────────
@router.patch("/{change_id}/review", response_model=ChangeRead)
def review_change(
    change_id: int,
    data: ChangeReview,
    _role: UserRole = Depends(require_admin),
    svc: ChangeService = Depends(get_change_service),
):
    """Admin endpoint: accept or reject a proposed change."""
    change = svc.review_change(change_id, data.status, data.reviewed_by)
    if not change:
        raise HTTPException(status_code=404, detail="Change not found")
    return change
