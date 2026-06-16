import { computed, inject } from '@angular/core';
import { patchState, signalStore, withComputed, withMethods, withState } from '@ngrx/signals';
import { firstValueFrom, forkJoin } from 'rxjs';

import { ApiError } from '../../../core/error.interceptor';
import { DateRange, Period, StatsApi } from '../data/stats-api.service';
import { CategorySpending, ColorUsage, SpendingPoint, Summary } from '../data/stats.models';

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

interface StatsState {
  // Wardrobe snapshot — always current, no date filter
  summary: Summary | null;
  colors: ColorUsage[];
  // Spending — date-filtered, reloads on preset change
  spending: CategorySpending[];
  spendingSeries: SpendingPoint[];
  // UI
  preset: RangePreset;
  snapshotLoading: boolean;
  spendingLoading: boolean;
  error: string | null;
}

const initial: StatsState = {
  summary: null,
  colors: [],
  spending: [],
  spendingSeries: [],
  preset: 'all',
  snapshotLoading: false,
  spendingLoading: false,
  error: null,
};

export const StatsStore = signalStore(
  { providedIn: 'root' },
  withState(initial),
  withComputed((store) => ({
    totalSpent: computed(() => store.spending().reduce((s, c) => s + c.totalSpent, 0)),
    maxCategorySpend: computed(() =>
      store.spending().reduce((m, c) => Math.max(m, c.totalSpent), 0),
    ),
    maxSeriesSpend: computed(() =>
      store.spendingSeries().reduce((m, p) => Math.max(m, p.totalSpent), 0),
    ),
    maxCategoryCount: computed(() =>
      (store.summary()?.categoryCounts ?? []).reduce((m, c) => Math.max(m, c.count), 0),
    ),
  })),
  withMethods((store, api = inject(StatsApi)) => {
    function buildRange(): DateRange {
      const { days } = PRESETS[store.preset()];
      return days == null
        ? { start: null, end: null }
        : { start: daysAgo(days), end: iso(new Date()) };
    }

    async function loadSpending(): Promise<void> {
      patchState(store, { spendingLoading: true });
      const { period } = PRESETS[store.preset()];
      const range = buildRange();
      const data = await firstValueFrom(
        forkJoin({
          spending: api.spendingByCategory(range),
          spendingSeries: api.spendingOverTime(period, range),
        }),
      );
      patchState(store, { ...data, spendingLoading: false });
    }

    return {
      async load(): Promise<void> {
        patchState(store, { snapshotLoading: true, spendingLoading: true, error: null });
        try {
          await Promise.all([
            firstValueFrom(forkJoin({ summary: api.summary(), colors: api.colors() })).then((d) =>
              patchState(store, { ...d, snapshotLoading: false }),
            ),
            loadSpending(),
          ]);
        } catch (e) {
          patchState(store, {
            error: (e as ApiError).message,
            snapshotLoading: false,
            spendingLoading: false,
          });
        }
      },

      async setPreset(preset: RangePreset): Promise<void> {
        patchState(store, { preset, error: null });
        try {
          await loadSpending();
        } catch (e) {
          patchState(store, { error: (e as ApiError).message, spendingLoading: false });
        }
      },
    };
  }),
);
