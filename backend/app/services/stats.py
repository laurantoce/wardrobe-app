from decimal import Decimal

from app.models import Garment, Outfit, Wash, Wear
from app.repositories import StatsRepository
from app.schemas import CategorySpending, ColorUsage, GarmentUsage, WardrobeSummary

CENTS = Decimal("0.01")


class StatsService:
    def __init__(self, stats: StatsRepository) -> None:
        self.stats = stats

    def summary(self, user_id: int) -> WardrobeSummary:
        return WardrobeSummary(
            total_garments=self.stats.count_for_user(Garment, user_id),
            total_outfits=self.stats.count_for_user(Outfit, user_id),
            total_wears=self.stats.count_for_user(Wear, user_id),
            total_washes=self.stats.count_for_user(Wash, user_id),
            total_spent=self.stats.total_spent(user_id),
        )

    def spending_by_category(self, user_id: int) -> list[CategorySpending]:
        return [
            CategorySpending(category=category, total_spent=spent, garment_count=count)
            for category, spent, count in self.stats.spending_by_category(user_id)
        ]

    def colors(self, user_id: int) -> list[ColorUsage]:
        return [
            ColorUsage(color_hex=color, garment_count=count)
            for color, count in self.stats.color_usage(user_id)
        ]

    def most_worn(self, user_id: int, limit: int) -> list[GarmentUsage]:
        result: list[GarmentUsage] = []
        for garment, count in self.stats.wear_counts(user_id, limit):
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

    def most_washed(self, user_id: int, limit: int) -> list[GarmentUsage]:
        return [
            GarmentUsage(
                garment_id=garment.id,
                name=garment.name,
                category=garment.category,
                count=count,
                purchase_price=garment.purchase_price,
            )
            for garment, count in self.stats.wash_counts(user_id, limit)
        ]
