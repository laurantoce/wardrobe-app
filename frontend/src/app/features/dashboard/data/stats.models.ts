export interface Summary {
  totalGarments: number;
  totalOutfits: number;
  totalWears: number;
  totalWashes: number;
  totalSpent: number;
}

export interface CategorySpending {
  category: string;
  totalSpent: number;
  garmentCount: number;
}

export interface ColorUsage {
  colorName: string;
  colorHex: string | null;
  garmentCount: number;
}

export interface SpendingPoint {
  period: string; // ISO date (bucket start)
  totalSpent: number;
}

export interface ActivityPoint {
  period: string;
  wears: number;
  washes: number;
}

export interface GarmentUsage {
  garmentId: number;
  name: string;
  category: string;
  count: number;
  purchasePrice: number | null;
  costPerWear: number | null;
}

interface SummaryDto {
  total_garments: number;
  total_outfits: number;
  total_wears: number;
  total_washes: number;
  total_spent: string;
}
interface CategorySpendingDto {
  category: string;
  total_spent: string;
  garment_count: number;
}
interface ColorUsageDto {
  color_name: string;
  color_hex: string | null;
  garment_count: number;
}
interface SpendingPointDto {
  period: string;
  total_spent: string;
}
interface ActivityPointDto {
  period: string;
  wears: number;
  washes: number;
}
interface GarmentUsageDto {
  garment_id: number;
  name: string;
  category: string;
  count: number;
  purchase_price: string | null;
  cost_per_wear: string | null;
}

const num = (s: string | null): number | null => (s != null ? Number(s) : null);

export function toSummary(d: SummaryDto): Summary {
  return {
    totalGarments: d.total_garments,
    totalOutfits: d.total_outfits,
    totalWears: d.total_wears,
    totalWashes: d.total_washes,
    totalSpent: Number(d.total_spent),
  };
}

export function toCategorySpending(d: CategorySpendingDto): CategorySpending {
  return {
    category: d.category,
    totalSpent: Number(d.total_spent),
    garmentCount: d.garment_count,
  };
}

export function toColorUsage(d: ColorUsageDto): ColorUsage {
  return {
    colorName: d.color_name,
    colorHex: d.color_hex,
    garmentCount: d.garment_count,
  };
}

export function toSpendingPoint(d: SpendingPointDto): SpendingPoint {
  return { period: d.period, totalSpent: Number(d.total_spent) };
}

export function toActivityPoint(d: ActivityPointDto): ActivityPoint {
  return { period: d.period, wears: d.wears, washes: d.washes };
}

export function toGarmentUsage(d: GarmentUsageDto): GarmentUsage {
  return {
    garmentId: d.garment_id,
    name: d.name,
    category: d.category,
    count: d.count,
    purchasePrice: num(d.purchase_price),
    costPerWear: num(d.cost_per_wear),
  };
}

export type {
  SummaryDto,
  CategorySpendingDto,
  ColorUsageDto,
  GarmentUsageDto,
  SpendingPointDto,
  ActivityPointDto,
};
