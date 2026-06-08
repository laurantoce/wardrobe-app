"""Read-only aggregate queries. Returns raw rows; the service turns them into schemas
and applies any derived business logic (e.g. cost-per-wear)."""
from decimal import Decimal

from sqlalchemy import Row, func, select
from sqlalchemy.orm import Session

from app.models import Garment, Wash, Wear

ZERO = Decimal("0.00")


class StatsRepository:
    def __init__(self, db: Session) -> None:
        self.db = db

    def count_for_user(self, model, user_id: int) -> int:
        return (
            self.db.scalar(
                select(func.count(model.id)).where(model.user_id == user_id)
            )
            or 0
        )

    def total_spent(self, user_id: int) -> Decimal:
        return (
            self.db.scalar(
                select(func.coalesce(func.sum(Garment.purchase_price), ZERO)).where(
                    Garment.user_id == user_id
                )
            )
            or ZERO
        )

    def spending_by_category(self, user_id: int) -> list[Row]:
        total = func.coalesce(func.sum(Garment.purchase_price), ZERO)
        return self.db.execute(
            select(Garment.category, total, func.count(Garment.id))
            .where(Garment.user_id == user_id)
            .group_by(Garment.category)
            .order_by(total.desc())
        ).all()

    def color_usage(self, user_id: int) -> list[Row]:
        count = func.count(Garment.id)
        return self.db.execute(
            select(Garment.color_hex, count)
            .where(Garment.user_id == user_id, Garment.color_hex.is_not(None))
            .group_by(Garment.color_hex)
            .order_by(count.desc())
        ).all()

    def wear_counts(self, user_id: int, limit: int) -> list[Row]:
        wear_count = func.count(Wear.id)
        return self.db.execute(
            select(Garment, wear_count)
            .join(Wear, Wear.garment_id == Garment.id)
            .where(Garment.user_id == user_id)
            .group_by(Garment.id)
            .order_by(wear_count.desc())
            .limit(limit)
        ).all()

    def wash_counts(self, user_id: int, limit: int) -> list[Row]:
        wash_count = func.count(Wash.id)
        return self.db.execute(
            select(Garment, wash_count)
            .join(Wash, Wash.garment_id == Garment.id)
            .where(Garment.user_id == user_id)
            .group_by(Garment.id)
            .order_by(wash_count.desc())
            .limit(limit)
        ).all()
