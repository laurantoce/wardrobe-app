import { computed, inject } from '@angular/core';
import { patchState, signalStore, withComputed, withMethods, withState } from '@ngrx/signals';
import { firstValueFrom, forkJoin } from 'rxjs';

import { ApiError } from '../../../core/error.interceptor';
import { DateRange, Period, StatsApi } from '../data/stats-api.service';
import {
  CategorySpending,
  ColorUsage,
  SpendingPoint,
  Summary,
} from '../data/stats.models';

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
  summary: Summary | null;
  spending: CategorySpending[];
  colors: ColorUsage[];
  spendingSeries: SpendingPoint[];
  preset: RangePreset;
  loading: boolean;
  error: string | null;
}

const initial: StatsState = {
  summary: null,
  spending: [],
  colors: [],
  spendingSeries: [],
  preset: 'all',
  loading: false,
  error: null,
};

export const StatsStore = signalStore(
  { providedIn: 'root' },
  withState(initial),
  withComputed((store) => ({
    maxCategorySpend: computed(() =>
      store.spending().reduce((m, c) => Math.max(m, c.totalSpent), 0),
    ),
    maxSeriesSpend: computed(() =>
      store.spendingSeries().reduce((m, p) => Math.max(m, p.totalSpent), 0),
    ),
  })),
  withMethods((store, api = inject(StatsApi)) => {
    async function load(): Promise<void> {
      patchState(store, { loading: true, error: null });
      const { days, period } = PRESETS[store.preset()];
      const range: DateRange =
        days == null ? { start: null, end: null } : { start: daysAgo(days), end: iso(new Date()) };
      try {
        const data = await firstValueFrom(
          forkJoin({
            summary: api.summary(range),
            spending: api.spendingByCategory(range),
            colors: api.colors(),
            spendingSeries: api.spendingOverTime(period, range),
          }),
        );
        patchState(store, { ...data, loading: false });
      } catch (e) {
        patchState(store, { loading: false, error: (e as ApiError).message });
      }
    }

    return {
      load,
      setPreset(preset: RangePreset): Promise<void> {
        patchState(store, { preset });
        return load();
      },
    };
  }),
);
