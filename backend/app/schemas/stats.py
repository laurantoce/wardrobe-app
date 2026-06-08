from datetime import date
from decimal import Decimal

from pydantic import BaseModel


class WardrobeSummary(BaseModel):
    total_garments: int
    total_outfits: int
    total_wears: int
    total_washes: int
    total_spent: Decimal


class CategorySpending(BaseModel):
    category: str
    total_spent: Decimal
    garment_count: int


class ColorUsage(BaseModel):
    # `color_name` is the grouping label (palette name, or the hex if unnamed).
    color_name: str
    color_hex: str | None = None
    garment_count: int


class GarmentUsage(BaseModel):
    garment_id: int
    name: str
    category: str
    count: int
    purchase_price: Decimal | None = None
    # Only populated for wear-based stats: price / number of wears.
    cost_per_wear: Decimal | None = None


class SpendingPoint(BaseModel):
    """One bucket of a spending-over-time series."""

    period: date
    total_spent: Decimal


class ActivityPoint(BaseModel):
    """One bucket of a wear/wash-over-time series."""

    period: date
    wears: int
    washes: int
