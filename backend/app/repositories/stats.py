"""Read-only aggregate queries. Returns raw rows; the service turns them into schemas."""
from datetime import date
from decimal import Decimal

from sqlalchemy import Date, Row, cast, func, select, text
from sqlalchemy.orm import Session

from app.models import Garment

ZERO = Decimal("0.00")

Period = str  # one of: day, week, month, year (validated at the router)


def _within(column, start: date | None, end: date | None) -> list:
    conds = []
    if start is not None:
        conds.append(column >= start)
    if end is not None:
        conds.append(column <= end)
    return conds


class StatsRepository:
    def __init__(self, db: Session) -> None:
        self.db = db

    def count_in_range(self, model, date_col, user_id: int, start, end) -> int:
        return (
            self.db.scalar(
                select(func.count(model.id)).where(
                    model.user_id == user_id, *_within(date_col, start, end)
                )
            )
            or 0
        )

    def count_all(self, model, user_id: int) -> int:
        return (
            self.db.scalar(select(func.count(model.id)).where(model.user_id == user_id))
            or 0
        )

    def total_spent(self, user_id: int, start=None, end=None) -> Decimal:
        return (
            self.db.scalar(
                select(func.coalesce(func.sum(Garment.purchase_price), ZERO)).where(
                    Garment.user_id == user_id,
                    *_within(Garment.purchase_date, start, end),
                )
            )
            or ZERO
        )

    def spending_by_category(self, user_id: int, start=None, end=None) -> list[Row]:
        total = func.coalesce(func.sum(Garment.purchase_price), ZERO)
        return self.db.execute(
            select(Garment.category, total, func.count(Garment.id))
            .where(Garment.user_id == user_id, *_within(Garment.purchase_date, start, end))
            .group_by(Garment.category)
            .order_by(total.desc())
        ).all()

    def color_usage(self, user_id: int) -> list[Row]:
        label = func.coalesce(Garment.color_name, Garment.color_hex)
        count = func.count(Garment.id)
        return self.db.execute(
            select(label, func.max(Garment.color_hex), count)
            .where(Garment.user_id == user_id, label.is_not(None))
            .group_by(label)
            .order_by(count.desc())
        ).all()

    def category_color_breakdown(self, user_id: int) -> list[Row]:
        """Returns (category, color_name, color_hex, count) sorted by category then count desc."""
        count = func.count(Garment.id)
        return self.db.execute(
            select(Garment.category, Garment.color_name, Garment.color_hex, count)
            .where(Garment.user_id == user_id)
            .group_by(Garment.category, Garment.color_name, Garment.color_hex)
            .order_by(Garment.category, count.desc())
        ).all()

    def material_counts(self, user_id: int) -> list:
        # Each element is {material, pct}; extract the name and count per garment.
        stmt = text("""
            SELECT mat->>'material' AS material, COUNT(*) AS count
            FROM garments,
                 json_array_elements(material) AS mat
            WHERE user_id = :user_id
              AND material IS NOT NULL
              AND json_array_length(material) > 0
            GROUP BY mat->>'material'
            ORDER BY count DESC
        """)
        return self.db.execute(stmt, {"user_id": user_id}).fetchall()

    def spending_over_time(self, user_id: int, period: Period, start, end) -> list[Row]:
        bucket = cast(func.date_trunc(period, Garment.purchase_date), Date)
        total = func.coalesce(func.sum(Garment.purchase_price), ZERO)
        return self.db.execute(
            select(bucket.label("period"), total)
            .where(
                Garment.user_id == user_id,
                Garment.purchase_date.is_not(None),
                *_within(Garment.purchase_date, start, end),
            )
            .group_by(bucket)
            .order_by(bucket)
        ).all()
