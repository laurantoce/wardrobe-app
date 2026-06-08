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
    color_hex: str
    garment_count: int


class GarmentUsage(BaseModel):
    garment_id: int
    name: str
    category: str
    count: int
    purchase_price: Decimal | None = None
    # Only populated for wear-based stats: price / number of wears.
    cost_per_wear: Decimal | None = None
