from datetime import date
from decimal import Decimal

from app.models import Garment, Outfit, Wash, Wear
from app.repositories import StatsRepository
from app.schemas import (
    ActivityPoint,
    CategorySpending,
    ColorUsage,
    GarmentUsage,
    SpendingPoint,
    WardrobeSummary,
)

CENTS = Decimal("0.01")


class StatsService:
    def __init__(self, stats: StatsRepository) -> None:
        self.stats = stats

    def summary(
        self, user_id: int, start: date | None = None, end: date | None = None
    ) -> WardrobeSummary:
        return WardrobeSummary(
            total_garments=self.stats.count_in_range(
                Garment, Garment.purchase_date, user_id, start, end
            )
            if (start or end)
            else self.stats.count_all(Garment, user_id),
            total_outfits=self.stats.count_all(Outfit, user_id),
            total_wears=self.stats.count_in_range(
                Wear, Wear.worn_date, user_id, start, end
            ),
            total_washes=self.stats.count_in_range(
                Wash, Wash.washed_date, user_id, start, end
            ),
            total_spent=self.stats.total_spent(user_id, start, end),
        )

    def spending_by_category(
        self, user_id: int, start: date | None = None, end: date | None = None
    ) -> list[CategorySpending]:
        return [
            CategorySpending(category=cat, total_spent=spent, garment_count=count)
            for cat, spent, count in self.stats.spending_by_category(user_id, start, end)
        ]

    def colors(self, user_id: int) -> list[ColorUsage]:
        return [
            ColorUsage(color_name=label, color_hex=hex_, garment_count=count)
            for label, hex_, count in self.stats.color_usage(user_id)
        ]

    def most_worn(
        self, user_id: int, limit: int, start: date | None = None, end: date | None = None
    ) -> list[GarmentUsage]:
        result: list[GarmentUsage] = []
        for garment, count in self.stats.wear_counts(user_id, limit, start, end):
            cost_per_wear = None
            if garment.purchase_price is not None and count > 0:
                cost_per_wear = (garment.purchase_price / count).quantize(CENTS)
            result.append(
                GarmentUsage(
                    garment_id=garment.id,
                    name=garment.name,
                    category=garment.category,
                    count=count,
                    purchase_price=garment.purchase_price,
                    cost_per_wear=cost_per_wear,
                )
            )
        return result

    def most_washed(
        self, user_id: int, limit: int, start: date | None = None, end: date | None = None
    ) -> list[GarmentUsage]:
        return [
            GarmentUsage(
                garment_id=garment.id,
                name=garment.name,
                category=garment.category,
                count=count,
                purchase_price=garment.purchase_price,
            )
            for garment, count in self.stats.wash_counts(user_id, limit, start, end)
        ]

    def spending_over_time(
        self, user_id: int, period: str, start: date | None, end: date | None
    ) -> list[SpendingPoint]:
        return [
            SpendingPoint(period=p, total_spent=total)
            for p, total in self.stats.spending_over_time(user_id, period, start, end)
        ]

    def activity_over_time(
        self, user_id: int, period: str, start: date | None, end: date | None
    ) -> list[ActivityPoint]:
        buckets: dict[date, list[int]] = {}
        for p, count in self.stats.wears_over_time(user_id, period, start, end):
            buckets.setdefault(p, [0, 0])[0] = count
        for p, count in self.stats.washes_over_time(user_id, period, start, end):
            buckets.setdefault(p, [0, 0])[1] = count
        return [
            ActivityPoint(period=p, wears=w, washes=ws)
            for p, (w, ws) in sorted(buckets.items())
        ]
