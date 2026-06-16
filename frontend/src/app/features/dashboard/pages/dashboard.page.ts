import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { CurrencyPipe, TitleCasePipe } from '@angular/common';

import { CardComponent } from '../../../shared/ui/card.component';
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

@Component({
  selector: 'app-dashboard',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CardComponent, CurrencyPipe, TitleCasePipe],
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

      <!-- Category breakdown + color palette -->
      <div class="mb-8 grid gap-4 lg:grid-cols-3">
        <ui-card class="p-5 lg:col-span-2">
          <h2 class="mb-4 text-sm font-semibold">By category</h2>
          @if (s.categoryCounts.length === 0) {
            <p class="text-sm text-muted">No items yet.</p>
          } @else {
            <div class="flex flex-col gap-3">
              @for (c of s.categoryCounts; track c.category) {
                <div class="flex items-center gap-3 text-sm">
                  <span class="w-24 shrink-0 text-muted">{{ categoryLabel(c.category) }}</span>
                  <div class="h-2 flex-1 overflow-hidden rounded-full bg-canvas">
                    <div
                      class="h-full rounded-full bg-accent transition-all"
                      [style.width.%]="pct(c.count, store.maxCategoryCount())"
                    ></div>
                  </div>
                  <span class="w-5 shrink-0 text-right font-medium">{{ c.count }}</span>
                </div>
              }
            </div>
          }
        </ui-card>

        <ui-card class="p-5">
          <h2 class="mb-4 text-sm font-semibold">Colors</h2>
          @if (store.colors().length === 0) {
            <p class="text-sm text-muted">No colors recorded.</p>
          } @else {
            <div class="flex flex-col gap-2.5">
              @for (col of store.colors(); track col.colorName) {
                <div class="flex items-center gap-3 text-sm">
                  <span
                    class="h-5 w-5 shrink-0 rounded-full border border-line"
                    [style.background-color]="col.colorHex || '#fff'"
                  ></span>
                  <span class="truncate">{{ col.colorName }}</span>
                  <span class="ml-auto font-medium">{{ col.garmentCount }}</span>
                </div>
              }
            </div>
          }
        </ui-card>
      </div>
    }

    <!-- ── Spending section ───────────────────────────────────────── -->
    <div class="mb-5 flex items-center gap-4">
      <span class="shrink-0 text-xs font-semibold uppercase tracking-widest text-muted"
        >Spending</span
      >
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
        <!-- Total + over-time chart -->
        <ui-card class="p-5 lg:col-span-2">
          <div class="mb-4 flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <span class="text-sm text-muted">Total spent · {{ periodLabel() }}</span>
            <span class="text-xl font-semibold">{{ store.totalSpent() | currency: 'EUR' }}</span>
          </div>
          @if (store.spendingSeries().length === 0) {
            <p class="text-sm text-muted">No purchases in this period.</p>
          } @else {
            <div class="flex h-32 items-end gap-1">
              @for (pt of store.spendingSeries(); track pt.period) {
                <div class="flex h-full flex-1 flex-col items-center justify-end gap-1">
                  <div
                    class="w-full rounded-t bg-accent transition-all"
                    [style.height.%]="pct(pt.totalSpent, store.maxSeriesSpend())"
                    [title]="pt.period + ': ' + (pt.totalSpent | currency: 'EUR')"
                  ></div>
                  @if (showLabels()) {
                    <span class="text-[10px] text-faint">{{ pointLabel(pt.period) }}</span>
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

  protected readonly presets: { key: RangePreset; label: string }[] = [
    { key: 'week', label: 'Week' },
    { key: 'month', label: 'Month' },
    { key: 'year', label: 'Year' },
    { key: 'all', label: 'All' },
  ];

  private readonly daily = computed(
    () => this.store.preset() === 'week' || this.store.preset() === 'month',
  );

  protected readonly showLabels = computed(() => this.store.spendingSeries().length <= 12);

  protected readonly periodLabel = computed(() => {
    switch (this.store.preset()) {
      case 'week':
        return 'last 7 days';
      case 'month':
        return 'last 30 days';
      case 'year':
        return 'last 12 months';
      default:
        return 'all time';
    }
  });

  constructor() {
    void this.store.load();
  }

  protected categoryLabel(cat: string): string {
    return CATEGORY_LABELS[cat] ?? cat;
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
