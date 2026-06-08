export interface Wear {
  id: number;
  garmentId: number | null;
  outfitId: number | null;
  wornDate: string;
  notes: string | null;
  createdAt: string;
}

export interface Wash {
  id: number;
  garmentId: number;
  washedDate: string;
  method: string | null;
  notes: string | null;
  createdAt: string;
}

interface WearDto {
  id: number;
  garment_id: number | null;
  outfit_id: number | null;
  worn_date: string;
  notes: string | null;
  created_at: string;
}

interface WashDto {
  id: number;
  garment_id: number;
  washed_date: string;
  method: string | null;
  notes: string | null;
  created_at: string;
}

export function toWear(d: WearDto): Wear {
  return {
    id: d.id,
    garmentId: d.garment_id,
    outfitId: d.outfit_id,
    wornDate: d.worn_date,
    notes: d.notes,
    createdAt: d.created_at,
  };
}

export function toWash(d: WashDto): Wash {
  return {
    id: d.id,
    garmentId: d.garment_id,
    washedDate: d.washed_date,
    method: d.method,
    notes: d.notes,
    createdAt: d.created_at,
  };
}

export type { WearDto, WashDto };
