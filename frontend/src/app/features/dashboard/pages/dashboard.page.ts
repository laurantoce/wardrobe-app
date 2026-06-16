import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { CurrencyPipe, DecimalPipe, TitleCasePipe } from '@angular/common';

import { CardComponent } from '../../../shared/ui/card.component';
import { CategoryColorCount } from '../data/stats.models';
import { RangePreset, StatsStore } from '../state/stats.store';

const CATEGORY_LABELS: Record<string, string> = {
  top: 'Tops',
  bottom: 'Bottoms',
  shoes: 'Shoes',
  outerwear: 'Outerwear',
  dress: 'Dresses',
  accessory: 'Accessories',
  underwear: 'Underwear',
  other: 'Other',
};

/** Fallback swatch color for garments with no color assigned. */
const NO_COLOR = '#cbd5e1';

@Component({
  selector: 'app-dashboard',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CardComponent, CurrencyPipe, DecimalPipe, TitleCasePipe],
  template: `
    <h1 class="mb-6 text-2xl font-semibold tracking-tight">Dashboard</h1>

    <!-- ── Wardrobe snapshot ──────────────────────────────────────── -->
    @if (store.snapshotLoading()) {
      <p class="py-12 text-center text-sm text-muted">Loading…</p>
    } @else if (store.error() && !store.summary()) {
      <p class="py-12 text-center text-sm text-red-600">{{ store.error() }}</p>
    } @else if (store.summary(); as s) {
      <!-- Count tiles -->
      <div class="mb-4 grid grid-cols-2 gap-3">
        <ui-card class="p-5">
          <p class="text-sm text-muted">Items</p>
          <p class="mt-1 text-3xl font-semibold">{{ s.totalGarments }}</p>
        </ui-card>
        <ui-card class="p-5">
          <p class="text-sm text-muted">Outfits</p>
          <p class="mt-1 text-3xl font-semibold">{{ s.totalOutfits }}</p>
        </ui-card>
      </div>

      <!-- Category stacked bars + color palette -->
      <div class="mb-8 grid gap-4 lg:grid-cols-3">

        <!-- Stacked bars: bar length = relative category size, fill = color breakdown -->
        <ui-card class="p-5 lg:col-span-2">
          <h2 class="mb-4 text-sm font-semibold">By category</h2>
          @if (s.categoryBreakdown.length === 0) {
            <p class="text-sm text-muted">No items yet.</p>
          } @else {
            <div class="flex flex-col gap-3">
              @for (cat of s.categoryBreakdown; track cat.category) {
                <div class="flex items-center gap-3 text-sm">
                  <span class="w-24 shrink-0 text-muted">{{ categoryLabel(cat.category) }}</span>
                  <!-- Outer bar: width proportional to this category vs largest -->
                  <div class="h-5 flex-1 overflow-hidden rounded-full bg-canvas">
                    <div
                      class="flex h-full overflow-hidden rounded-full transition-all"
                      [style.width.%]="pct(cat.total, store.maxCategoryCount())"
                    >
                      <!-- Inner segments: proportional to color count using flex -->
                      @for (c of cat.colors; track (c.colorName ?? c.colorHex)) {
                        <div
                          class="h-full shrink-0 [box-shadow:inset_0_0_0_1px_#0000001a]"
                          [style.flex]="c.count"
                          [style.background-color]="c.colorHex ?? NO_COLOR"
                          [title]="colorLabel(c) + ': ' + c.count"
                        ></div>
                      }
                    </div>
                  </div>
                  <span class="w-5 shrink-0 text-right font-medium text-muted">{{ cat.total }}</span>
                </div>
              }
            </div>
          }
        </ui-card>

        <!-- Color palette strip + legend -->
        <ui-card class="p-5">
          <h2 class="mb-4 text-sm font-semibold">Colors</h2>
          @if (store.colors().length === 0) {
            <p class="text-sm text-muted">No colors recorded.</p>
          } @else {
            <!-- Proportional color strip -->
            <div class="mb-4 flex h-8 overflow-hidden rounded-lg">
              @for (col of store.colors(); track col.colorName) {
                <div
                  class="h-full shrink-0 [box-shadow:inset_0_0_0_1px_#0000001a]"
                  [style.flex]="col.garmentCount"
                  [style.background-color]="col.colorHex ?? NO_COLOR"
                  [title]="col.colorName + ': ' + col.garmentCount"
                ></div>
              }
            </div>
            <!-- Legend -->
            <div class="flex flex-col gap-2">
              @for (col of store.colors(); track col.colorName) {
                <div class="flex items-center gap-2 text-sm">
                  <span
                    class="h-3 w-3 shrink-0 rounded-full border border-line [box-shadow:inset_0_0_0_1px_#0000001a]"
                    [style.background-color]="col.colorHex ?? NO_COLOR"
                  ></span>
                  <span class="truncate text-muted">{{ col.colorName }}</span>
                  <span class="ml-auto font-medium">{{ col.garmentCount }}</span>
                  <span class="w-9 shrink-0 text-right text-faint">
                    {{ pct(col.garmentCount, s.totalGarments) | number: '1.0-0' }}%
                  </span>
                </div>
              }
            </div>
          }
        </ui-card>
      </div>
    }

    <!-- ── Spending section ───────────────────────────────────────── -->
    <div class="mb-5 flex flex-wrap items-center gap-x-4 gap-y-3">
      <span class="shrink-0 text-xs font-semibold uppercase tracking-widest text-muted">
        Spending
      </span>
      <div class="flex-1 border-t border-line"></div>
      <div class="flex rounded-lg border border-line bg-surface p-0.5 text-sm">
        @for (p of presets; track p.key) {
          <button
            type="button"
            (click)="store.setPreset(p.key)"
            class="rounded-md px-3 py-1 font-medium transition-colors"
            [class]="
              store.preset() === p.key
                ? 'bg-accent-soft text-accent'
                : 'text-muted hover:text-ink'
            "
          >
            {{ p.label }}
          </button>
        }
      </div>
    </div>

    @if (store.spendingLoading()) {
      <p class="py-8 text-center text-sm text-muted">Loading…</p>
    } @else if (store.error() && store.spending().length === 0) {
      <p class="py-8 text-center text-sm text-red-600">{{ store.error() }}</p>
    } @else {
      <div class="grid gap-4 lg:grid-cols-3">
        <!-- Total + bar chart -->
        <ui-card class="p-5 lg:col-span-2">
          <div class="mb-4 flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <span class="text-sm text-muted">Total · {{ periodLabel() }}</span>
            <span class="text-xl font-semibold">{{ store.totalSpent() | currency: 'EUR' }}</span>
          </div>

          @if (store.spendingSeries().length === 0) {
            <p class="text-sm text-muted">No purchases in this period.</p>
          } @else {
            <!--
              Fixed-width bars (w-7 = 28 px) so a handful of bars don't stretch awkwardly.
              Container scrolls horizontally when there are many bars.
            -->
            <div class="flex h-32 items-end gap-1 overflow-x-auto pb-1">
              @for (pt of store.spendingSeries(); track pt.period) {
                <div class="flex h-full w-7 shrink-0 flex-col items-center justify-end gap-1">
                  <div
                    class="w-full rounded-t bg-accent transition-all"
                    [style.height.%]="pct(pt.totalSpent, store.maxSeriesSpend())"
                    [title]="pt.period + ': ' + (pt.totalSpent | currency: 'EUR')"
                  ></div>
                  @if (showLabels()) {
                    <span class="text-[9px] leading-none text-faint">
                      {{ pointLabel(pt.period) }}
                    </span>
                  }
                </div>
              }
            </div>
          }
        </ui-card>

        <!-- Spending by category -->
        <ui-card class="p-5">
          <h2 class="mb-4 text-sm font-semibold">By category</h2>
          @if (store.spending().length === 0) {
            <p class="text-sm text-muted">No spending in this period.</p>
          } @else {
            <div class="flex flex-col gap-3">
              @for (c of store.spending(); track c.category) {
                <div>
                  <div class="mb-1 flex items-baseline justify-between text-sm">
                    <span>{{ c.category | titlecase }}</span>
                    <span class="font-medium">{{ c.totalSpent | currency: 'EUR' }}</span>
                  </div>
                  <div class="h-1.5 overflow-hidden rounded-full bg-canvas">
                    <div
                      class="h-full rounded-full bg-accent/60 transition-all"
                      [style.width.%]="pct(c.totalSpent, store.maxCategorySpend())"
                    ></div>
                  </div>
                </div>
              }
            </div>
          }
        </ui-card>
      </div>
    }
  `,
})
export class DashboardPage {
  protected readonly store = inject(StatsStore);
  protected readonly NO_COLOR = NO_COLOR;

  protected readonly presets: { key: RangePreset; label: string }[] = [
    { key: 'week', label: 'Week' },
    { key: 'month', label: 'Month' },
    { key: 'year', label: 'Year' },
    { key: 'all', label: 'All' },
  ];

  private readonly daily = computed(
    () => this.store.preset() === 'week' || this.store.preset() === 'month',
  );

  protected readonly showLabels = computed(() => this.store.spendingSeries().length <= 14);

  protected readonly periodLabel = computed(() => {
    switch (this.store.preset()) {
      case 'week':   return 'last 7 days';
      case 'month':  return 'last 30 days';
      case 'year':   return 'last 12 months';
      default:       return 'all time';
    }
  });

  constructor() {
    void this.store.load();
  }

  protected categoryLabel(cat: string): string {
    return CATEGORY_LABELS[cat] ?? cat;
  }

  protected colorLabel(c: CategoryColorCount): string {
    return c.colorName ?? c.colorHex ?? 'No color';
  }

  protected pct(value: number, max: number): number {
    return max > 0 ? (value / max) * 100 : 0;
  }

  protected pointLabel(isoStr: string): string {
    const d = new Date(isoStr);
    return this.daily()
      ? `${d.getDate()}/${d.getMonth() + 1}`
      : d.toLocaleDateString(undefined, { month: 'short' });
  }
}
