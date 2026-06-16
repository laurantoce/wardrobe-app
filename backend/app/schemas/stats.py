from datetime import date
from decimal import Decimal

from pydantic import BaseModel


class CategoryColorCount(BaseModel):
    color_hex: str | None = None
    color_name: str | None = None
    count: int


class CategoryBreakdown(BaseModel):
    category: str
    total: int
    colors: list[CategoryColorCount]


class WardrobeSummary(BaseModel):
    total_garments: int
    total_outfits: int
    category_breakdown: list[CategoryBreakdown]


class CategorySpending(BaseModel):
    category: str
    total_spent: Decimal
    garment_count: int


class ColorUsage(BaseModel):
    color_name: str
    color_hex: str | None = None
    garment_count: int


class SpendingPoint(BaseModel):
    period: date
    total_spent: Decimal
