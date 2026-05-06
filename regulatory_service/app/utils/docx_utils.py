"""
Utilities for handling .docx uploads:
- Save the file to MEDIA_ROOT
- Extract full HTML content (preserving tables, bold, lists, headings) via mammoth
"""
import uuid
import base64
from pathlib import Path

import mammoth
import docx
from fastapi import UploadFile, HTTPException

from app.core.config import settings


ALLOWED_EXTENSIONS = {".docx"}

# Custom mammoth style map — maps Word styles to clean HTML elements
_STYLE_MAP = """
p[style-name='Heading 1'] => h1:fresh
p[style-name='Heading 1 Centered'] => h1.text-center:fresh
p[style-name='Heading 2'] => h2:fresh
p[style-name='Heading 2 Centered'] => h2.text-center:fresh
p[style-name='Heading 3'] => h3:fresh
p[style-name='Heading 3 Centered'] => h3.text-center:fresh
p[style-name='Heading 4'] => h4:fresh
p[style-name='Heading 4 Centered'] => h4.text-center:fresh
p[style-name='Title'] => h1:fresh
p[style-name='Title Centered'] => h1.text-center:fresh
p[style-name='Subtitle'] => h2:fresh
p[style-name='Subtitle Centered'] => h2.text-center:fresh
p[style-name='List Paragraph'] => li:fresh
r[style-name='Strong'] => strong
r[style-name='Emphasis'] => em
u => u
r[style-name='Underline'] => u

# Generic alignment mappings (for non-heading paragraphs)
p[style-name='Normal Centered'] => p.text-center:fresh
p[style-name='Normal Right'] => p.text-right:fresh
p[style-name='Normal Justified'] => p.text-justify:fresh
r[style-name='Page Break'] => span.page-break:fresh
"""


def _transform_paragraph(paragraph):
    """
    Inspect paragraph alignment and modify the style name so the style map can catch it.
    This runs BEFORE the style map is applied.
    """
    # Check for page break before property
    if getattr(paragraph, 'page_break_before', False):
        return paragraph.copy(
            style_id="PageBreak",
            style_name="Page Break",
            children=[]
        )

    if paragraph.alignment:
        suffix = ""
        if paragraph.alignment == "center": suffix = " Centered"
        elif paragraph.alignment == "right": suffix = " Right"
        elif paragraph.alignment == "justify": suffix = " Justified"
        
        if suffix:
            curr_id = paragraph.style_id or "Normal"
            curr_name = paragraph.style_name or "Normal"
            return paragraph.copy(
                style_id=curr_id + suffix.replace(" ", ""), 
                style_name=curr_name + suffix
            )
    return paragraph

def _transform_run(run):
    """
    Detect page breaks in runs and replace them with a marker we can style.
    Mammoth doesn't handle page breaks by default.
    """
    new_children = []
    has_page_break = False
    
    for child in run.children:
        # Mammoth break objects have type="break" and break_type="page"
        el_type = getattr(child, 'type', None)
        br_type = getattr(child, 'break_type', None)
        
        if el_type == "break" and br_type == "page":
            has_page_break = True
            break
        new_children.append(child)
    
    if has_page_break:
        return run.copy(
            style_id="PageBreak",
            style_name="Page Break",
            children=[mammoth.documents.text("\u00A0")]
        )
    
    return run


def _ensure_media_dir() -> Path:
    media = Path(settings.MEDIA_ROOT)
    media.mkdir(parents=True, exist_ok=True)
    return media


def save_upload(file: UploadFile) -> tuple[str, str]:
    """
    Save an uploaded .docx file to MEDIA_ROOT.
    Returns (relative_file_path, original_filename).
    """
    original_name = file.filename or "upload.docx"
    ext = Path(original_name).suffix.lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail=f"Only .docx files are supported. Got: {ext}",
        )

    media_dir = _ensure_media_dir()
    unique_name = f"{uuid.uuid4().hex}{ext}"
    dest = media_dir / unique_name
    dest.write_bytes(file.file.read())

    return unique_name, original_name


def extract_html(relative_path: str) -> str:
    """
    Convert a saved .docx to clean HTML using mammoth.
    Tables, headings, bold, italic, lists are all preserved.
    Returns an HTML string stored directly in document.content.
    """
    full_path = Path(settings.MEDIA_ROOT) / relative_path
    if not full_path.exists():
        raise HTTPException(status_code=404, detail="Stored file not found")

    with open(full_path, "rb") as f:
        def combined_transform(element):
            # The root 'Document' or other objects might not have a 'type' attribute
            el_type = getattr(element, "type", None)
            
            if el_type == "paragraph":
                return _transform_paragraph(element)
            if el_type == "run":
                return _transform_run(element)
            return element

        result = mammoth.convert_to_html(
            f,
            style_map=_STYLE_MAP,
            transform_document=combined_transform
        )

    html = result.value  # the converted HTML string
    return html