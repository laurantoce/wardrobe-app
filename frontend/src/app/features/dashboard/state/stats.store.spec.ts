import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { ApiError } from '../../../core/error.interceptor';
import { StatsApi } from '../data/stats-api.service';
import { StatsStore } from './stats.store';

describe('StatsStore', () => {
  let store: StatsStore;
  let summary: ReturnType<typeof vi.fn>;
  let colors: ReturnType<typeof vi.fn>;
  let materials: ReturnType<typeof vi.fn>;
  let spendingByCategory: ReturnType<typeof vi.fn>;
  let spendingOverTime: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    summary = vi.fn(() =>
      of({
        totalGarments: 4,
        totalOutfits: 2,
        categoryBreakdown: [
          { category: 'top', total: 3, colors: [] },
          { category: 'bottom', total: 1, colors: [] },
        ],
      }),
    );
    colors = vi.fn(() => of([{ colorName: 'Navy', colorHex: '#001f3f', garmentCount: 2 }]));
    materials = vi.fn(() => of([{ material: 'cotton', count: 3 }]));
    spendingByCategory = vi.fn(() =>
      of([
        { category: 'top', totalSpent: 120, garmentCount: 2 },
        { category: 'bottom', totalSpent: 80, garmentCount: 1 },
      ]),
    );
    spendingOverTime = vi.fn(() =>
      of([
        { period: '2026-06-01', totalSpent: 40 },
        { period: '2026-06-02', totalSpent: 160 },
      ]),
    );

    TestBed.configureTestingModule({
      providers: [
        StatsStore,
        {
          provide: StatsApi,
          useValue: { summary, colors, materials, spendingByCategory, spendingOverTime },
        },
      ],
    });
    store = TestBed.inject(StatsStore);
  });

  it('loads snapshot and spending data in parallel', async () => {
    await store.load();

    expect(store.summary()?.totalGarments).toBe(4);
    expect(store.colors()).toHaveLength(1);
    expect(store.materials()).toEqual([{ material: 'cotton', count: 3 }]);
    expect(store.totalSpent()).toBe(200);
    expect(store.maxCategorySpend()).toBe(120);
    expect(store.maxSeriesSpend()).toBe(160);
    expect(store.maxCategoryCount()).toBe(3);
    expect(store.snapshotLoading()).toBe(false);
    expect(store.spendingLoading()).toBe(false);
  });

  it('reloads spending only when the preset changes', async () => {
    await store.setPreset('week');

    expect(store.preset()).toBe('week');
    expect(summary).not.toHaveBeenCalled();
    expect(spendingOverTime).toHaveBeenCalledWith(
      'day',
      expect.objectContaining({
        start: expect.stringMatching(/^\d{4}-\d{2}-\d{2}$/),
        end: expect.stringMatching(/^\d{4}-\d{2}-\d{2}$/),
      }),
    );
  });

  it('captures errors and clears loading flags', async () => {
    const apiError: ApiError = { status: 500, message: 'Stats unavailable' };
    summary.mockReturnValue(throwError(() => apiError));

    await store.load();

    expect(store.error()).toBe('Stats unavailable');
    expect(store.snapshotLoading()).toBe(false);
    expect(store.spendingLoading()).toBe(false);
  });
});
