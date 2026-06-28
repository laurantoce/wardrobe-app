import { Garment, GarmentDto, toGarment } from '../../garments/data/garment.models';

export interface Outfit {
  id: number;
  name: string;
  season: string | null;
  occasion: string | null;
  notes: string | null;
  imageUrl: string | null;
  createdAt: string;
  garments: Garment[];
}

interface OutfitDto {
  id: number;
  name: string;
  season: string | null;
  occasion: string | null;
  notes: string | null;
  image_url: string | null;
  created_at: string;
  garments: GarmentDto[];
}

export interface OutfitInput {
  name: string;
  season?: string | null;
  occasion?: string | null;
  notes?: string | null;
  garmentIds: number[];
  imageUrl?: string | null;
}

export interface OutfitPhotoAnalysis {
  originalImageUrl: string | null;
  cutoutImageUrl: string | null;
  cutoutError: string | null;
  matchedGarmentIds: number[];
  unmatchedDescriptions: string[];
}

interface OutfitPhotoAnalysisDto {
  original_image_url: string | null;
  cutout_image_url: string | null;
  cutout_error: string | null;
  matched_garment_ids: number[];
  unmatched_descriptions: string[];
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
    imageUrl: d.image_url,
    createdAt: d.created_at,
    garments: d.garments.map(toGarment),
  };
}

export function toOutfitPhotoAnalysis(d: OutfitPhotoAnalysisDto): OutfitPhotoAnalysis {
  return {
    originalImageUrl: d.original_image_url,
    cutoutImageUrl: d.cutout_image_url,
    cutoutError: d.cutout_error,
    matchedGarmentIds: d.matched_garment_ids ?? [],
    unmatchedDescriptions: d.unmatched_descriptions ?? [],
  };
}

export function toOutfitPayload(i: OutfitInput | Partial<OutfitInput>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  if (i.name !== undefined) out['name'] = i.name;
  if (i.season !== undefined) out['season'] = i.season || null;
  if (i.occasion !== undefined) out['occasion'] = i.occasion || null;
  if (i.notes !== undefined) out['notes'] = i.notes || null;
  if (i.garmentIds !== undefined) out['garment_ids'] = i.garmentIds;
  if (i.imageUrl !== undefined) out['image_url'] = i.imageUrl || null;
  return out;
}

export type { OutfitDto };
