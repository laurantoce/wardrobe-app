from datetime import date

from app.models import Garment, Outfit
from app.repositories import StatsRepository
from app.schemas import (
    CategoryBreakdown,
    CategoryColorCount,
    CategorySpending,
    ColorUsage,
    MaterialCount,
    SpendingPoint,
    WardrobeSummary,
)


class StatsService:
    def __init__(self, stats: StatsRepository) -> None:
        self.stats = stats

    def summary(self, user_id: int) -> WardrobeSummary:
        rows = self.stats.category_color_breakdown(user_id)

        # Group into categories preserving per-category color order (count desc from SQL)
        cats: dict[str, dict] = {}
        for cat, color_name, color_hex, count in rows:
            if cat not in cats:
                cats[cat] = {"total": 0, "colors": []}
            cats[cat]["total"] += count
            cats[cat]["colors"].append(
                CategoryColorCount(color_hex=color_hex, color_name=color_name, count=count)
            )

        breakdown = [
            CategoryBreakdown(category=cat, total=data["total"], colors=data["colors"])
            for cat, data in sorted(cats.items(), key=lambda x: -x[1]["total"])
        ]

        return WardrobeSummary(
            total_garments=self.stats.count_all(Garment, user_id),
            total_outfits=self.stats.count_all(Outfit, user_id),
            category_breakdown=breakdown,
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

    def materials(self, user_id: int) -> list[MaterialCount]:
        return [
            MaterialCount(material=mat, count=count)
            for mat, count in self.stats.material_counts(user_id)
        ]

    def spending_over_time(
        self, user_id: int, period: str, start: date | None, end: date | None
    ) -> list[SpendingPoint]:
        return [
            SpendingPoint(period=p, total_spent=total)
            for p, total in self.stats.spending_over_time(user_id, period, start, end)
        ]
