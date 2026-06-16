"""material entries with pct

Revision ID: 0761328d1085
Revises: b14a46495754
Create Date: 2026-06-16 22:12:15.892246

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '0761328d1085'
down_revision: Union[str, Sequence[str], None] = 'b14a46495754'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Format changed from string[] to [{material, pct}][] — clear dev data.
    op.execute("UPDATE garments SET material = NULL WHERE material IS NOT NULL")


def downgrade() -> None:
    op.execute("UPDATE garments SET material = NULL WHERE material IS NOT NULL")
