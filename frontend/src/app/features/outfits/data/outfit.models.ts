import { Garment, GarmentDto, toGarment } from '../../garments/data/garment.models';

export interface Outfit {
  id: number;
  name: string;
  season: string | null;
  occasion: string | null;
  notes: string | null;
  createdAt: string;
  garments: Garment[];
}

interface OutfitDto {
  id: number;
  name: string;
  season: string | null;
  occasion: string | null;
  notes: string | null;
  created_at: string;
  garments: GarmentDto[];
}

export interface OutfitInput {
  name: string;
  season?: string | null;
  occasion?: string | null;
  notes?: string | null;
  garmentIds: number[];
}

export const SEASONS = ['spring', 'summer', 'autumn', 'winter', 'all_season'] as const;
export const OCCASIONS = [
  'casual',
  'work',
  'formal',
  'sport',
  'travel',
  'party',
] as const;

export function toOutfit(d: OutfitDto): Outfit {
  return {
    id: d.id,
    name: d.name,
    season: d.season,
    occasion: d.occasion,
    notes: d.notes,
    createdAt: d.created_at,
    garments: d.garments.map(toGarment),
  };
}

export function toOutfitPayload(i: OutfitInput): Record<string, unknown> {
  return {
    name: i.name,
    season: i.season || null,
    occasion: i.occasion || null,
    notes: i.notes || null,
    garment_ids: i.garmentIds,
  };
}

export type { OutfitDto };
