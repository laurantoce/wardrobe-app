from datetime import date, datetime
from decimal import Decimal

from pydantic import BaseModel, ConfigDict, Field


class MaterialEntry(BaseModel):
    material: str
    pct: int | None = None  # percentage 0-100; None means unspecified blend ratio


class GarmentBase(BaseModel):
    name: str = Field(max_length=120)
    category: str = Field(max_length=50)
    color_hex: str | None = Field(default=None, max_length=7)
    color_name: str | None = Field(default=None, max_length=40)
    brand: str | None = Field(default=None, max_length=100)
    purchase_date: date | None = None
    purchase_price: Decimal | None = Field(default=None, ge=0)
    image_url: str | None = None
    source_url: str | None = None
    notes: str | None = None
    occasion: str | None = Field(default=None, max_length=50)
    material: list[MaterialEntry] | None = None
    sub_type: str | None = Field(default=None, max_length=80)


class GarmentCreate(GarmentBase):
    pass


class GarmentUpdate(BaseModel):
    """Partial update — every field optional."""

    name: str | None = Field(default=None, max_length=120)
    category: str | None = Field(default=None, max_length=50)
    color_hex: str | None = Field(default=None, max_length=7)
    color_name: str | None = Field(default=None, max_length=40)
    brand: str | None = Field(default=None, max_length=100)
    purchase_date: date | None = None
    purchase_price: Decimal | None = Field(default=None, ge=0)
    image_url: str | None = None
    source_url: str | None = None
    notes: str | None = None
    occasion: str | None = Field(default=None, max_length=50)
    material: list[MaterialEntry] | None = None
    sub_type: str | None = Field(default=None, max_length=80)


class GarmentRead(GarmentBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    created_at: datetime
