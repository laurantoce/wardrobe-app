from datetime import date

from app.models import Garment, Outfit
from app.repositories import StatsRepository
from app.schemas import (
    CategoryCount,
    CategorySpending,
    ColorUsage,
    SpendingPoint,
    WardrobeSummary,
)


class StatsService:
    def __init__(self, stats: StatsRepository) -> None:
        self.stats = stats

    def summary(self, user_id: int) -> WardrobeSummary:
        return WardrobeSummary(
            total_garments=self.stats.count_all(Garment, user_id),
            total_outfits=self.stats.count_all(Outfit, user_id),
            category_counts=[
                CategoryCount(category=cat, count=count)
                for cat, count in self.stats.category_counts(user_id)
            ],
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

    def spending_over_time(
        self, user_id: int, period: str, start: date | None, end: date | None
    ) -> list[SpendingPoint]:
        return [
            SpendingPoint(period=p, total_spent=total)
            for p, total in self.stats.spending_over_time(user_id, period, start, end)
        ]
