export interface CategoryCount {
  category: string;
  count: number;
}

export interface Summary {
  totalGarments: number;
  totalOutfits: number;
  categoryCounts: CategoryCount[];
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

// ── DTOs (wire format from backend) ────────────────────────────────────────

interface SummaryDto {
  total_garments: number;
  total_outfits: number;
  category_counts: Array<{ category: string; count: number }>;
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

// ── Mappers ─────────────────────────────────────────────────────────────────

export function toSummary(d: SummaryDto): Summary {
  return {
    totalGarments: d.total_garments,
    totalOutfits: d.total_outfits,
    categoryCounts: d.category_counts,
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

export type { SummaryDto, CategorySpendingDto, ColorUsageDto, SpendingPointDto };
