export interface CategoryColorCount {
  colorHex: string | null;
  colorName: string | null;
  count: number;
}

export interface CategoryBreakdown {
  category: string;
  total: number;
  colors: CategoryColorCount[];
}

export interface Summary {
  totalGarments: number;
  totalOutfits: number;
  categoryBreakdown: CategoryBreakdown[];
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

export interface MaterialCount {
  material: string;
  count: number;
}

export interface SpendingPoint {
  period: string; // ISO date (bucket start)
  totalSpent: number;
}

// ── DTOs (wire format from backend) ────────────────────────────────────────

interface SummaryDto {
  total_garments: number;
  total_outfits: number;
  category_breakdown: Array<{
    category: string;
    total: number;
    colors: Array<{ color_hex: string | null; color_name: string | null; count: number }>;
  }>;
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
    categoryBreakdown: d.category_breakdown.map((cat) => ({
      category: cat.category,
      total: cat.total,
      colors: cat.colors.map((c) => ({
        colorHex: c.color_hex,
        colorName: c.color_name,
        count: c.count,
      })),
    })),
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

export function toMaterialCount(d: MaterialCount): MaterialCount {
  return d; // no snake_case conversion needed
}
