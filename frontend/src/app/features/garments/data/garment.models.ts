/** Domain model (camelCase) used throughout the app. */
export interface Garment {
  id: number;
  name: string;
  category: string;
  colorHex: string | null;
  colorName: string | null;
  brand: string | null;
  purchaseDate: string | null; // ISO date (YYYY-MM-DD)
  purchasePrice: number | null;
  imageUrl: string | null;
  sourceUrl: string | null;
  notes: string | null;
  occasion: string | null;
  material: MaterialEntry[] | null;
  subType: string | null;
  createdAt: string;
}

/** Wire format from FastAPI (snake_case; Decimals serialized as strings). */
export interface GarmentDto {
  id: number;
  name: string;
  category: string;
  color_hex: string | null;
  color_name: string | null;
  brand: string | null;
  purchase_date: string | null;
  purchase_price: string | null;
  image_url: string | null;
  source_url: string | null;
  notes: string | null;
  occasion: string | null;
  material: MaterialEntry[] | null;
  sub_type: string | null;
  created_at: string;
}

/** Form input for create/update. */
export interface GarmentInput {
  name: string;
  category: string;
  colorHex?: string | null;
  colorName?: string | null;
  brand?: string | null;
  purchaseDate?: string | null;
  purchasePrice?: number | null;
  imageUrl?: string | null;
  sourceUrl?: string | null;
  notes?: string | null;
  occasion?: string | null;
  material?: MaterialEntry[] | null;
  subType?: string | null;
}

export interface MaterialEntry {
  material: string;
  pct: number | null; // percentage 0–100; null = blend ratio not specified
}

/** Wire DTO from POST /ai/analyze-garment-photo */
interface GarmentPhotoAnalysisDto {
  image_url: string | null;
  name: string | null;
  category: string | null;
  sub_type: string | null;
  brand: string | null;
  color_name: string | null;
  occasion: string | null;
  material: MaterialEntry[] | null;
  purchase_price: string | null;
  notes: string | null;
}

/** Domain model for photo analysis result. */
export interface GarmentPhotoAnalysis {
  imageUrl: string | null;
  name: string | null;
  category: string | null;
  subType: string | null;
  brand: string | null;
  colorName: string | null;
  occasion: string | null;
  material: MaterialEntry[] | null;
  purchasePrice: number | null;
  notes: string | null;
}

export function toPhotoAnalysis(dto: GarmentPhotoAnalysisDto): GarmentPhotoAnalysis {
  return {
    imageUrl: dto.image_url,
    name: dto.name,
    category: dto.category,
    subType: dto.sub_type,
    brand: dto.brand,
    colorName: dto.color_name,
    occasion: dto.occasion,
    material: dto.material,
    purchasePrice: dto.purchase_price != null ? Number(dto.purchase_price) : null,
    notes: dto.notes,
  };
}

export const OCCASIONS = [
  'casual', 'work', 'formal', 'sport', 'beach', 'travel', 'lounge',
] as const;

export const MATERIALS = [
  'cotton', 'linen', 'wool', 'silk', 'polyester', 'denim',
  'leather', 'cashmere', 'nylon', 'other',
] as const;

export const GARMENT_CATEGORIES = [
  'top',
  'bottom',
  'shoes',
  'outerwear',
  'dress',
  'swimwear',
  'accessory',
  'underwear',
  'other',
] as const;

export function toGarment(d: GarmentDto): Garment {
  return {
    id: d.id,
    name: d.name,
    category: d.category,
    colorHex: d.color_hex,
    colorName: d.color_name,
    brand: d.brand,
    purchaseDate: d.purchase_date,
    purchasePrice: d.purchase_price != null ? Number(d.purchase_price) : null,
    imageUrl: d.image_url,
    sourceUrl: d.source_url,
    notes: d.notes,
    occasion: d.occasion,
    material: d.material,
    subType: d.sub_type,
    createdAt: d.created_at,
  };
}

/** camelCase input -> snake_case payload. Money sent as string to preserve precision. */
export function toGarmentPayload(i: Partial<GarmentInput>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  if (i.name !== undefined) out['name'] = i.name;
  if (i.category !== undefined) out['category'] = i.category;
  if (i.colorHex !== undefined) out['color_hex'] = i.colorHex || null;
  if (i.colorName !== undefined) out['color_name'] = i.colorName || null;
  if (i.brand !== undefined) out['brand'] = i.brand || null;
  if (i.purchaseDate !== undefined) out['purchase_date'] = i.purchaseDate || null;
  if (i.purchasePrice !== undefined)
    out['purchase_price'] = i.purchasePrice != null ? String(i.purchasePrice) : null;
  if (i.imageUrl !== undefined) out['image_url'] = i.imageUrl || null;
  if (i.sourceUrl !== undefined) out['source_url'] = i.sourceUrl || null;
  if (i.notes !== undefined) out['notes'] = i.notes || null;
  if (i.occasion !== undefined) out['occasion'] = i.occasion || null;
  if (i.material !== undefined) out['material'] = i.material?.length ? i.material : null;
  if (i.subType !== undefined) out['sub_type'] = i.subType || null;
  return out;
}
