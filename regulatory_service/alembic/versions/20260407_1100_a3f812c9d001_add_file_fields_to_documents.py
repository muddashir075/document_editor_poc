"""add file_path and original_filename to documents

Revision ID: a3f812c9d001
Revises: ff57598e57a9
Create Date: 2026-04-07 11:00:00.000000+00:00

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'a3f812c9d001'
down_revision: Union[str, None] = 'ff57598e57a9'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('documents', sa.Column('file_path', sa.String(), nullable=True))
    op.add_column('documents', sa.Column('original_filename', sa.String(), nullable=True))


def downgrade() -> None:
    op.drop_column('documents', 'original_filename')
    op.drop_column('documents', 'file_path')
