from fastapi import APIRouter, Depends, HTTPException
from app.schemas.comment_schema import CommentCreate, CommentRead, CommentResolve
from app.services.comment_service import CommentService
from app.dependencies import get_comment_service
from app.core.roles import require_admin, require_reviewer, UserRole

router = APIRouter(prefix="/comments", tags=["comments"])


# ── Read — all roles ──────────────────────────────────────────────────────────
@router.get("/{document_id}", response_model=list[CommentRead])
def list_comments(document_id: int, svc: CommentService = Depends(get_comment_service)):
    return svc.get_comments(document_id)


@router.get("/{document_id}/paragraph/{paragraph_id}", response_model=list[CommentRead])
def list_comments_by_paragraph(
    document_id: int,
    paragraph_id: str,
    svc: CommentService = Depends(get_comment_service),
):
    return svc.get_comments_by_paragraph(document_id, paragraph_id)


# ── Write — reviewer + admin ──────────────────────────────────────────────────
@router.post("/", response_model=CommentRead, status_code=201)
def create_comment(
    data: CommentCreate,
    _role: UserRole = Depends(require_reviewer),
    svc: CommentService = Depends(get_comment_service),
):
    return svc.create_comment(data)


@router.patch("/{comment_id}/resolve", response_model=CommentRead)
def resolve_comment(
    comment_id: int,
    data: CommentResolve,
    _role: UserRole = Depends(require_reviewer),
    svc: CommentService = Depends(get_comment_service),
):
    comment = svc.resolve_comment(comment_id, data.resolved_by)
    if not comment:
        raise HTTPException(status_code=404, detail="Comment not found")
    return comment


# ── Delete — admin only ───────────────────────────────────────────────────────
@router.delete("/{comment_id}", status_code=204)
def delete_comment(
    comment_id: int,
    _role: UserRole = Depends(require_admin),
    svc: CommentService = Depends(get_comment_service),
):
    comment = svc.delete_comment(comment_id)
    if not comment:
        raise HTTPException(status_code=404, detail="Comment not found")
