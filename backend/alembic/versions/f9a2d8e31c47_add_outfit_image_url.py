"""add outfit image_url

Revision ID: f9a2d8e31c47
Revises: 0761328d1085
Create Date: 2026-06-28 12:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = 'f9a2d8e31c47'
down_revision: Union[str, Sequence[str], None] = '0761328d1085'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('outfits', sa.Column('image_url', sa.Text(), nullable=True))


def downgrade() -> None:
    op.drop_column('outfits', 'image_url')
