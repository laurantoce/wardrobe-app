"""Read-only aggregate queries. Returns raw rows; the service turns them into schemas
and applies any derived business logic (e.g. cost-per-wear).

All metrics accept an optional [start, end] date window applied to the metric's own
date column (garments by purchase_date, wears by worn_date, washes by washed_date)."""
from datetime import date
from decimal import Decimal

from sqlalchemy import Date, Row, cast, func, select
from sqlalchemy.orm import Session

from app.models import Garment, Wash, Wear

ZERO = Decimal("0.00")

# Postgres date_trunc units we expose for time-series grouping.
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

    # ── point-in-time counts / sums ──────────────────────────────────────────
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
        # Group by the palette name when present, otherwise the raw hex.
        label = func.coalesce(Garment.color_name, Garment.color_hex)
        count = func.count(Garment.id)
        return self.db.execute(
            select(label, func.max(Garment.color_hex), count)
            .where(Garment.user_id == user_id, label.is_not(None))
            .group_by(label)
            .order_by(count.desc())
        ).all()

    def wear_counts(self, user_id: int, limit: int, start=None, end=None) -> list[Row]:
        wear_count = func.count(Wear.id)
        return self.db.execute(
            select(Garment, wear_count)
            .join(Wear, Wear.garment_id == Garment.id)
            .where(Garment.user_id == user_id, *_within(Wear.worn_date, start, end))
            .group_by(Garment.id)
            .order_by(wear_count.desc())
            .limit(limit)
        ).all()

    def wash_counts(self, user_id: int, limit: int, start=None, end=None) -> list[Row]:
        wash_count = func.count(Wash.id)
        return self.db.execute(
            select(Garment, wash_count)
            .join(Wash, Wash.garment_id == Garment.id)
            .where(Garment.user_id == user_id, *_within(Wash.washed_date, start, end))
            .group_by(Garment.id)
            .order_by(wash_count.desc())
            .limit(limit)
        ).all()

    # ── time series ──────────────────────────────────────────────────────────
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

    def _events_over_time(self, model, date_col, user_id, period, start, end) -> list[Row]:
        bucket = cast(func.date_trunc(period, date_col), Date)
        return self.db.execute(
            select(bucket.label("period"), func.count(model.id))
            .where(model.user_id == user_id, *_within(date_col, start, end))
            .group_by(bucket)
            .order_by(bucket)
        ).all()

    def wears_over_time(self, user_id: int, period: Period, start, end) -> list[Row]:
        return self._events_over_time(Wear, Wear.worn_date, user_id, period, start, end)

    def washes_over_time(self, user_id: int, period: Period, start, end) -> list[Row]:
        return self._events_over_time(Wash, Wash.washed_date, user_id, period, start, end)
