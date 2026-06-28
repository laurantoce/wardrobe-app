import json
from decimal import Decimal

from app.ai.client import LLMClient
from app.exceptions import ExternalServiceError, ValidationError
from app.models import Garment
from app.repositories import GarmentRepository
from app.schemas.ai import GarmentPhotoAnalysis, OutfitSuggestion, SuggestedGarment, SuggestionRequest, SuggestionResponse
from app.schemas.garment import MaterialEntry
from app.services.image_processing import remove_background
from app.services.upload import upload_to_object_storage

_PHOTO_ANALYSIS_PROMPT = """\
Analyze this clothing item photo (may show the garment itself, its care label, or brand tag).
Extract all visible information and return ONLY a JSON object (no markdown, no prose):

{
  "name": "<descriptive name e.g. 'White Linen Blazer' — or null if you cannot determine>",
  "category": "<exactly one of: top, bottom, shoes, outerwear, dress, swimwear, accessory, underwear, other>",
  "sub_type": "<specific type e.g. 't-shirt', 'jeans', 'ankle boots', 'blazer' — or null>",
  "brand": "<brand name if clearly visible — or null>",
  "color_name": "<closest match from: Black, Charcoal, Grey, White, Cream, Beige, Camel, Brown, Navy, Blue, Light Blue, Teal, Green, Olive, Burgundy, Red, Pink, Orange, Yellow, Purple>",
  "occasion": "<most fitting from: casual, work, formal, sport, beach, travel, lounge — or null>",
  "material": [{"material": "<one of: cotton, linen, wool, silk, polyester, denim, leather, cashmere, nylon, other>", "pct": <integer 0-100 or null if blend ratio unknown>}],
  "purchase_price": <numeric price if a price tag is clearly visible — or null>,
  "notes": "<brief notes on pattern, fit, or notable details — or null>"
}

Use null for any field you cannot confidently determine. Do not invent data."""

_PROMPT = """\
You are a personal stylist. The user's wardrobe is listed below.
Suggest {max_outfits} outfit combination(s) for: {context}.

Rules:
- Use only garment IDs that appear in the wardrobe list.
- Each outfit must contain between 2 and 5 garments.
- Consider color harmony, occasion, season, and material compatibility.
- Return ONLY a JSON object with this exact shape (no markdown, no prose):
{{
  "suggestions": [
    {{
      "title": "<short outfit name>",
      "garment_ids": [<id>, ...],
      "reasoning": "<1-2 sentences explaining the combination>"
    }}
  ]
}}

Wardrobe:
{wardrobe_json}"""


class AIService:
    def __init__(self, garments: GarmentRepository, llm: LLMClient | None) -> None:
        self._garments = garments
        self._llm = llm

    def suggest_outfits(self, user_id: int, request: SuggestionRequest) -> SuggestionResponse:
        if self._llm is None:
            raise ExternalServiceError("AI not configured: set GEMINI_API_KEY in .env")

        wardrobe = self._garments.list_for_user(user_id)
        if not wardrobe:
            raise ValidationError("Add some garments to your wardrobe first.")

        garment_index = {g.id: g for g in wardrobe}
        prompt = self._build_prompt(request, wardrobe)
        raw = self._call_llm(prompt)
        return self._parse_and_validate(raw, garment_index)

    # ------------------------------------------------------------------
    # private helpers
    # ------------------------------------------------------------------

    def _build_prompt(self, request: SuggestionRequest, wardrobe: list[Garment]) -> str:
        context_parts: list[str] = []
        if request.occasion:
            context_parts.append(f"occasion={request.occasion}")
        if request.season:
            context_parts.append(f"season={request.season}")
        if request.vibe:
            context_parts.append(f"vibe={request.vibe}")
        context = ", ".join(context_parts) if context_parts else "any occasion"

        wardrobe_data = [
            {
                "id": g.id,
                "name": g.name,
                "category": g.category,
                "color_name": g.color_name,
                "brand": g.brand,
                "occasion": g.occasion,
                "material": g.material,
                "sub_type": g.sub_type,
            }
            for g in wardrobe
        ]
        return _PROMPT.format(
            max_outfits=request.max_outfits,
            context=context,
            wardrobe_json=json.dumps(wardrobe_data, indent=2),
        )

    def _call_llm(self, prompt: str) -> str:
        try:
            return self._llm.generate(prompt)
        except Exception as exc:
            raise ExternalServiceError(f"AI provider error: {exc}") from exc

    def analyze_garment_photo(
        self, image_bytes: bytes, mime_type: str, generate_cutout: bool = True
    ) -> GarmentPhotoAnalysis:
        original_image_url = upload_to_object_storage(image_bytes, mime_type)
        cutout_image_url: str | None = None
        cutout_error: str | None = None
        if generate_cutout:
            try:
                cutout = remove_background(image_bytes)
                if cutout is not None:
                    cutout_image_url = upload_to_object_storage(
                        cutout.image_bytes, cutout.mime_type
                    )
            except ExternalServiceError as exc:
                cutout_error = str(exc)
        data = {}
        if self._llm is not None:
            try:
                raw = self._llm.analyze_image(image_bytes, mime_type, _PHOTO_ANALYSIS_PROMPT)
                data = json.loads(raw)
            except Exception as exc:
                raise ExternalServiceError(f"AI photo analysis failed: {exc}") from exc

        materials: list[MaterialEntry] = []
        for m in (data.get("material") or []):
            if isinstance(m, dict) and "material" in m:
                materials.append(MaterialEntry(material=m["material"], pct=m.get("pct")))

        price_raw = data.get("purchase_price")
        price = Decimal(str(price_raw)) if price_raw is not None else None

        return GarmentPhotoAnalysis(
            image_url=original_image_url,
            original_image_url=original_image_url,
            cutout_image_url=cutout_image_url,
            cutout_error=cutout_error,
            name=data.get("name"),
            category=data.get("category"),
            sub_type=data.get("sub_type"),
            brand=data.get("brand"),
            color_name=data.get("color_name"),
            occasion=data.get("occasion"),
            material=materials or None,
            purchase_price=price,
            notes=data.get("notes"),
        )

    def _parse_and_validate(
        self, raw: str, garment_index: dict[int, Garment]
    ) -> SuggestionResponse:
        try:
            data = json.loads(raw)
            raw_suggestions: list[dict] = data.get("suggestions", [])
        except (json.JSONDecodeError, AttributeError) as exc:
            raise ExternalServiceError("AI returned an unexpected response format.") from exc

        suggestions: list[OutfitSuggestion] = []
        for item in raw_suggestions:
            valid_ids = [gid for gid in item.get("garment_ids", []) if gid in garment_index]
            if len(valid_ids) < 2:
                continue
            suggestions.append(
                OutfitSuggestion(
                    title=item.get("title", "Outfit"),
                    garment_ids=valid_ids,
                    garments=[
                        SuggestedGarment(id=gid, name=garment_index[gid].name)
                        for gid in valid_ids
                    ],
                    reasoning=item.get("reasoning", ""),
                )
            )
        return SuggestionResponse(suggestions=suggestions)
