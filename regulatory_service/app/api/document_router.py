from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from app.schemas.document_schema import DocumentCreate, DocumentRead, DocumentUpdate
from app.services.document_service import DocumentService
from app.dependencies import get_document_service
from app.models.document import DocumentType
from app.core.roles import require_admin, require_reviewer, get_role, UserRole

router = APIRouter(prefix="/documents", tags=["documents"])


# ── Read endpoints — all roles ────────────────────────────────────────────────
@router.get("/", response_model=list[DocumentRead])
def list_documents(svc: DocumentService = Depends(get_document_service)):
    return svc.get_documents()


@router.get("/type/{doc_type}", response_model=list[DocumentRead])
def list_by_type(doc_type: str, svc: DocumentService = Depends(get_document_service)):
    return svc.get_documents_by_type(doc_type)


@router.get("/{doc_id}", response_model=DocumentRead)
def get_document(doc_id: int, svc: DocumentService = Depends(get_document_service)):
    doc = svc.get_document(doc_id)
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    return doc


# ── Write endpoints — admin only ──────────────────────────────────────────────
@router.post("/upload", response_model=DocumentRead, status_code=201)
def upload_document(
    file: UploadFile = File(..., description="Word document (.docx)"),
    title: str = Form(...),
    doc_type: DocumentType = Form(DocumentType.regulation),
    author: str = Form("system"),
    _role: UserRole = Depends(require_admin),
    svc: DocumentService = Depends(get_document_service),
):
    """Upload a .docx file. Admin only."""
    return svc.upload_document(file, title, doc_type, author)


@router.post("/", response_model=DocumentRead, status_code=201)
def create_document(
    data: DocumentCreate,
    _role: UserRole = Depends(require_admin),
    svc: DocumentService = Depends(get_document_service),
):
    return svc.create_document(data)


@router.patch("/{doc_id}", response_model=DocumentRead)
def update_document(
    doc_id: int,
    data: DocumentUpdate,
    updated_by: str = "system",
    _role: UserRole = Depends(require_admin),
    svc: DocumentService = Depends(get_document_service),
):
    doc = svc.update_document(doc_id, data, updated_by=updated_by)
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    return doc


@router.delete("/{doc_id}", status_code=204)
def delete_document(
    doc_id: int,
    _role: UserRole = Depends(require_admin),
    svc: DocumentService = Depends(get_document_service),
):
    doc = svc.delete_document(doc_id)
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
