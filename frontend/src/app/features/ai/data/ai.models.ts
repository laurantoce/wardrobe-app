export interface SuggestedGarment {
  id: number;
  name: string;
}

export interface OutfitSuggestion {
  title: string;
  garmentIds: number[];
  garments: SuggestedGarment[];
  reasoning: string;
}

export interface SuggestionRequest {
  occasion?: string | null;
  season?: string | null;
  vibe?: string | null;
  max_outfits?: number;
}

// DTO (wire format — snake_case from FastAPI)
export interface SuggestionResponseDto {
  suggestions: Array<{
    title: string;
    garment_ids: number[];
    garments: SuggestedGarment[];
    reasoning: string;
  }>;
}

export function toSuggestions(dto: SuggestionResponseDto): OutfitSuggestion[] {
  return dto.suggestions.map((s) => ({
    title: s.title,
    garmentIds: s.garment_ids,
    garments: s.garments,
    reasoning: s.reasoning,
  }));
}

export const AI_OCCASIONS = [
  'casual', 'work', 'formal', 'sport', 'beach', 'travel', 'lounge', 'party',
] as const;

export const AI_SEASONS = ['spring', 'summer', 'autumn', 'winter'] as const;
