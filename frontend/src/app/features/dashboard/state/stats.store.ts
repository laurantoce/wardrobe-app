import { computed, inject, Injectable, signal } from '@angular/core';
import { firstValueFrom, forkJoin } from 'rxjs';

import { ApiError } from '../../../core/error.interceptor';
import { DateRange, Period, StatsApi } from '../data/stats-api.service';
import { CategorySpending, ColorUsage, MaterialCount, SpendingPoint, Summary } from '../data/stats.models';

export type RangePreset = 'week' | 'month' | 'year' | 'all';

const PRESETS: Record<RangePreset, { days: number | null; period: Period }> = {
  week: { days: 7, period: 'day' },
  month: { days: 30, period: 'day' },
  year: { days: 365, period: 'month' },
  all: { days: null, period: 'month' },
};

function iso(d: Date): string {
  const tz = d.getTimezoneOffset() * 60000;
  return new Date(d.getTime() - tz).toISOString().slice(0, 10);
}
function daysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return iso(d);
}

@Injectable({ providedIn: 'root' })
export class StatsStore {
  private readonly api = inject(StatsApi);

  readonly summary = signal<Summary | null>(null);
  readonly colors = signal<ColorUsage[]>([]);
  readonly materials = signal<MaterialCount[]>([]);
  readonly spending = signal<CategorySpending[]>([]);
  readonly spendingSeries = signal<SpendingPoint[]>([]);
  readonly preset = signal<RangePreset>('all');
  readonly snapshotLoading = signal(false);
  readonly spendingLoading = signal(false);
  readonly error = signal<string | null>(null);

  readonly totalSpent = computed(() => this.spending().reduce((s, c) => s + c.totalSpent, 0));
  readonly maxCategorySpend = computed(() =>
    this.spending().reduce((m, c) => Math.max(m, c.totalSpent), 0),
  );
  readonly maxSeriesSpend = computed(() =>
    this.spendingSeries().reduce((m, p) => Math.max(m, p.totalSpent), 0),
  );
  readonly maxCategoryCount = computed(() =>
    (this.summary()?.categoryBreakdown ?? []).reduce((m, c) => Math.max(m, c.total), 0),
  );

  async load(): Promise<void> {
    this.snapshotLoading.set(true);
    this.spendingLoading.set(true);
    this.error.set(null);
    try {
      await Promise.all([
        firstValueFrom(
          forkJoin({
            summary: this.api.summary(),
            colors: this.api.colors(),
            materials: this.api.materials(),
          }),
        ).then((d) => {
          this.summary.set(d.summary);
          this.colors.set(d.colors);
          this.materials.set(d.materials);
          this.snapshotLoading.set(false);
        }),
        this.loadSpending(),
      ]);
    } catch (e) {
      this.error.set((e as ApiError).message);
      this.snapshotLoading.set(false);
      this.spendingLoading.set(false);
    }
  }

  async setPreset(preset: RangePreset): Promise<void> {
    this.preset.set(preset);
    this.error.set(null);
    try {
      await this.loadSpending();
    } catch (e) {
      this.error.set((e as ApiError).message);
      this.spendingLoading.set(false);
    }
  }

  private buildRange(): DateRange {
    const { days } = PRESETS[this.preset()];
    return days == null
      ? { start: null, end: null }
      : { start: daysAgo(days), end: iso(new Date()) };
  }

  private async loadSpending(): Promise<void> {
    this.spendingLoading.set(true);
    const { period } = PRESETS[this.preset()];
    const range = this.buildRange();
    const data = await firstValueFrom(
      forkJoin({
        spending: this.api.spendingByCategory(range),
        spendingSeries: this.api.spendingOverTime(period, range),
      }),
    );
    this.spending.set(data.spending);
    this.spendingSeries.set(data.spendingSeries);
    this.spendingLoading.set(false);
  }
}
