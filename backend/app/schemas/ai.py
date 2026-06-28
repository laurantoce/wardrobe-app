from decimal import Decimal

from pydantic import BaseModel, Field

from app.schemas.garment import MaterialEntry


class SuggestionRequest(BaseModel):
    occasion: str | None = None
    season: str | None = None
    vibe: str | None = None
    max_outfits: int = Field(default=3, ge=1, le=5)


class GarmentPhotoAnalysis(BaseModel):
    image_url: str | None = None
    original_image_url: str | None = None
    cutout_image_url: str | None = None
    cutout_error: str | None = None
    name: str | None = None
    category: str | None = None
    sub_type: str | None = None
    brand: str | None = None
    color_name: str | None = None
    occasion: str | None = None
    material: list[MaterialEntry] | None = None
    purchase_price: Decimal | None = None
    notes: str | None = None


class OutfitPhotoAnalysis(BaseModel):
    original_image_url: str | None = None
    cutout_image_url: str | None = None
    cutout_error: str | None = None
    matched_garment_ids: list[int] = Field(default_factory=list)
    unmatched_descriptions: list[str] = Field(default_factory=list)


class SuggestedGarment(BaseModel):
    id: int
    name: str


class OutfitSuggestion(BaseModel):
    title: str
    garment_ids: list[int]
    garments: list[SuggestedGarment]
    reasoning: str


class SuggestionResponse(BaseModel):
    suggestions: list[OutfitSuggestion]
