from pydantic import BaseModel, Field


class SuggestionRequest(BaseModel):
    occasion: str | None = None
    season: str | None = None
    vibe: str | None = None
    max_outfits: int = Field(default=3, ge=1, le=5)


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
