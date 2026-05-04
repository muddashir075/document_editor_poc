from fastapi import APIRouter, Depends
from app.schemas.vote_schema import VoteCreate, VoteRead, VoteSummary
from app.services.vote_service import VoteService
from app.dependencies import get_vote_service
from app.core.roles import require_reviewer, UserRole

router = APIRouter(prefix="/votes", tags=["votes"])


# ── Read — all roles ──────────────────────────────────────────────────────────
@router.get("/{document_id}", response_model=list[VoteRead])
def list_votes(document_id: int, svc: VoteService = Depends(get_vote_service)):
    return svc.get_votes(document_id)


@router.get("/{document_id}/summary", response_model=VoteSummary)
def vote_summary(document_id: int, svc: VoteService = Depends(get_vote_service)):
    return svc.get_summary(document_id)


@router.get("/{document_id}/paragraph/{paragraph_id}", response_model=list[VoteRead])
def votes_by_paragraph(
    document_id: int,
    paragraph_id: str,
    svc: VoteService = Depends(get_vote_service),
):
    return svc.get_votes_by_paragraph(document_id, paragraph_id)


# ── Cast vote — reviewer + admin ──────────────────────────────────────────────
@router.post("/", response_model=VoteRead, status_code=201)
def create_vote(
    data: VoteCreate,
    _role: UserRole = Depends(require_reviewer),
    svc: VoteService = Depends(get_vote_service),
):
    return svc.create_vote(data)
