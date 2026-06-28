from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field

from app.schemas.garment import GarmentRead


class OutfitBase(BaseModel):
    name: str = Field(max_length=120)
    season: str | None = Field(default=None, max_length=50)
    occasion: str | None = Field(default=None, max_length=50)
    notes: str | None = None
    image_url: str | None = None


class OutfitCreate(OutfitBase):
    garment_ids: list[int] = Field(default_factory=list)


class OutfitUpdate(BaseModel):
    """Partial update. Pass ``garment_ids`` to replace the garment set."""

    name: str | None = Field(default=None, max_length=120)
    season: str | None = Field(default=None, max_length=50)
    occasion: str | None = Field(default=None, max_length=50)
    notes: str | None = None
    image_url: str | None = None
    garment_ids: list[int] | None = None


class OutfitRead(OutfitBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    created_at: datetime
    garments: list[GarmentRead] = Field(default_factory=list)
