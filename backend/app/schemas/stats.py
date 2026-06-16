from datetime import date
from decimal import Decimal

from pydantic import BaseModel


class WardrobeSummary(BaseModel):
    total_garments: int
    total_outfits: int
    total_spent: Decimal


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
