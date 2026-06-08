"""add garment color_name

Revision ID: a1b2c3d4e5f6
Revises: 74c8b52c2e22
Create Date: 2026-06-08 21:10:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'a1b2c3d4e5f6'
down_revision: Union[str, Sequence[str], None] = '74c8b52c2e22'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('garments', sa.Column('color_name', sa.String(length=40), nullable=True))


def downgrade() -> None:
    op.drop_column('garments', 'color_name')
