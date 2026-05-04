import difflib


def compute_diff(old: str, new: str) -> str:
    """Returns a unified diff string between two text versions."""
    diff = difflib.unified_diff(
        old.splitlines(keepends=True),
        new.splitlines(keepends=True),
        fromfile="previous",
        tofile="current",
    )
    return "".join(diff)


def apply_accepted_changes(content: str, changes: list) -> str:
    """
    Apply a list of accepted Change model instances to document content
    in order, returning the consolidated result.
    """
    result = content
    for change in changes:
        if change.change_type == "replace" and change.original_text:
            result = result.replace(change.original_text, change.new_text or "", 1)
        elif change.change_type == "insert" and change.new_text:
            result = result + "\n" + change.new_text
        elif change.change_type == "delete" and change.original_text:
            result = result.replace(change.original_text, "", 1)
    return result
