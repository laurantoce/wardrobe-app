import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { CurrencyPipe, TitleCasePipe } from '@angular/common';

import { CardComponent } from '../../../shared/ui/card.component';
import { RangePreset, StatsStore } from '../state/stats.store';

@Component({
  selector: 'app-dashboard',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CardComponent, CurrencyPipe, TitleCasePipe],
  template: `
    <header class="mb-6 flex flex-wrap items-center justify-between gap-3">
      <div>
        <h1 class="text-2xl font-semibold tracking-tight">Dashboard</h1>
        <p class="text-sm text-muted">{{ periodLabel() }}</p>
      </div>

      <!-- Period selector -->
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
    </header>

    @if (store.loading()) {
      <p class="py-16 text-center text-sm text-muted">Loading…</p>
    } @else if (store.error()) {
      <p class="py-16 text-center text-sm text-red-600">{{ store.error() }}</p>
    } @else if (store.summary(); as s) {
      <!-- Summary tiles -->
      <div class="mb-4 grid grid-cols-3 gap-3">
        <ui-card class="p-5">
          <p class="text-sm text-muted">Spent</p>
          <p class="mt-1 text-2xl font-semibold">{{ s.totalSpent | currency: 'EUR' }}</p>
        </ui-card>
        <ui-card class="p-5">
          <p class="text-sm text-muted">Items</p>
          <p class="mt-1 text-2xl font-semibold">{{ s.totalGarments }}</p>
        </ui-card>
        <ui-card class="p-5">
          <p class="text-sm text-muted">Outfits</p>
          <p class="mt-1 text-2xl font-semibold">{{ s.totalOutfits }}</p>
        </ui-card>
      </div>

      <!-- Spending over time -->
      <div class="mb-4">
        <ui-card class="p-5">
          <h2 class="mb-4 text-sm font-semibold">Spending over time</h2>
          @if (store.spendingSeries().length === 0) {
            <p class="text-sm text-muted">No purchases in this period.</p>
          } @else {
            <div class="flex h-36 items-end gap-1.5">
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
      </div>

      <!-- Category + colors -->
      <div class="grid gap-4 lg:grid-cols-3">
        <ui-card class="p-5 lg:col-span-2">
          <h2 class="mb-4 text-sm font-semibold">Spending by category</h2>
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
                  <div class="h-2 overflow-hidden rounded-full bg-canvas">
                    <div
                      class="h-full rounded-full bg-accent transition-all"
                      [style.width.%]="pct(c.totalSpent, store.maxCategorySpend())"
                    ></div>
                  </div>
                </div>
              }
            </div>
          }
        </ui-card>

        <ui-card class="p-5">
          <h2 class="mb-4 text-sm font-semibold">Top colors</h2>
          @if (store.colors().length === 0) {
            <p class="text-sm text-muted">No colors recorded.</p>
          } @else {
            <div class="flex flex-col gap-2.5">
              @for (col of store.colors(); track col.colorName) {
                <div class="flex items-center gap-3 text-sm">
                  <span
                    class="h-6 w-6 shrink-0 rounded-full border border-line"
                    [style.background-color]="col.colorHex || '#ffffff'"
                  ></span>
                  <span>{{ col.colorName }}</span>
                  <span class="ml-auto font-medium">{{ col.garmentCount }}</span>
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
        return 'Last 7 days';
      case 'month':
        return 'Last 30 days';
      case 'year':
        return 'Last 12 months';
      default:
        return 'All time';
    }
  });

  constructor() {
    void this.store.load();
  }

  protected pct(value: number, max: number): number {
    return max > 0 ? (value / max) * 100 : 0;
  }

  protected pointLabel(iso: string): string {
    const d = new Date(iso);
    return this.daily()
      ? `${d.getDate()}/${d.getMonth() + 1}`
      : d.toLocaleDateString(undefined, { month: 'short' });
  }
}
