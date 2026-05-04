import markdown
import re


def render_markdown(content: str) -> str:
    """Convert markdown content to HTML."""
    return markdown.markdown(content, extensions=["tables", "fenced_code", "toc"])


def extract_paragraphs(content: str) -> list[dict]:
    """
    Parse markdown content and return a list of paragraphs with IDs.
    Each paragraph gets a stable ID like 'p-1', 'p-2', etc.
    Useful for anchoring inline comments and votes.
    """
    lines = content.split("\n\n")
    paragraphs = []
    for idx, block in enumerate(lines):
        block = block.strip()
        if not block:
            continue
        paragraphs.append({
            "id": f"p-{idx + 1}",
            "content": block,
            "is_heading": block.startswith("#"),
        })
    return paragraphs


def extract_article_ids(content: str) -> list[str]:
    """Extract article/section headings as anchor IDs from markdown."""
    headings = re.findall(r"^#{1,6}\s+(.+)$", content, re.MULTILINE)
    return [re.sub(r"\s+", "-", h.strip().lower()) for h in headings]
