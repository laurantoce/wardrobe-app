import json

from app.ai.client import LLMClient
from app.exceptions import ExternalServiceError, ValidationError
from app.models import Garment
from app.repositories import GarmentRepository
from app.schemas.ai import OutfitSuggestion, SuggestedGarment, SuggestionRequest, SuggestionResponse

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
    def __init__(self, garments: GarmentRepository, llm: LLMClient) -> None:
        self._garments = garments
        self._llm = llm

    def suggest_outfits(self, user_id: int, request: SuggestionRequest) -> SuggestionResponse:
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
