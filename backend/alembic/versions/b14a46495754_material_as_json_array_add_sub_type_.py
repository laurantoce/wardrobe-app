"""material as json array, add sub_type, drop wear wash tables

Revision ID: b14a46495754
Revises: 63accb56692f
Create Date: 2026-06-16 21:59:34.661897

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = 'b14a46495754'
down_revision: Union[str, Sequence[str], None] = '63accb56692f'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('garments', sa.Column('sub_type', sa.String(length=80), nullable=True))

    # VARCHAR -> JSON requires an explicit cast via a temporary column.
    op.add_column('garments', sa.Column('material_json', sa.JSON(), nullable=True))
    op.execute("""
        UPDATE garments
        SET material_json = to_json(material)
        WHERE material IS NOT NULL
    """)
    op.drop_column('garments', 'material')
    op.alter_column('garments', 'material_json', new_column_name='material')


def downgrade() -> None:
    op.add_column('garments', sa.Column('material_old', sa.VARCHAR(length=50), nullable=True))
    op.execute("""
        UPDATE garments
        SET material_old = material::text
        WHERE material IS NOT NULL
    """)
    op.drop_column('garments', 'material')
    op.alter_column('garments', 'material_old', new_column_name='material')
    op.drop_column('garments', 'sub_type')
