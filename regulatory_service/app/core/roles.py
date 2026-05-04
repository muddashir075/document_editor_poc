"""
Role definitions and FastAPI dependencies for role-based access control.

Roles:
  sgcan_admin  — full access: create, edit, manage, review changes, delete
  reviewer     — comment, vote, propose changes; cannot edit document content or manage
  consultation — read-only; cannot comment, vote, or edit
"""
from enum import Enum
from fastapi import Depends, Header, HTTPException, status


class UserRole(str, Enum):
    sgcan_admin  = "sgcan_admin"
    reviewer     = "reviewer"
    consultation = "consultation"


def get_role(x_user_role: str = Header(default="consultation")) -> UserRole:
    """Extract role from X-User-Role request header."""
    try:
        return UserRole(x_user_role)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid role '{x_user_role}'. Valid values: {[r.value for r in UserRole]}",
        )


def require_admin(role: UserRole = Depends(get_role)) -> UserRole:
    """Dependency — allows only sgcan_admin."""
    if role != UserRole.sgcan_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="This action requires the SGCAN Administrator role.",
        )
    return role


def require_reviewer(role: UserRole = Depends(get_role)) -> UserRole:
    """Dependency — allows sgcan_admin and reviewer (blocks consultation)."""
    if role == UserRole.consultation:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Read-only consultation accounts cannot perform this action.",
        )
    return role
