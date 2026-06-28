import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { ApiError } from '../../../core/error.interceptor';
import { OutfitApi } from '../data/outfit-api.service';
import { Outfit } from '../data/outfit.models';
import { OutfitStore } from './outfit.store';

function outfit(overrides: Partial<Outfit> = {}): Outfit {
  return {
    id: 1,
    name: 'Work Look',
    season: null,
    occasion: 'work',
    notes: null,
    createdAt: '2026-06-10T12:00:00Z',
    garments: [],
    ...overrides,
  };
}

describe('OutfitStore', () => {
  let store: OutfitStore;
  let list: ReturnType<typeof vi.fn>;
  let create: ReturnType<typeof vi.fn>;
  let remove: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    list = vi.fn(() => of([outfit()]));
    create = vi.fn(() => of(outfit({ id: 2, name: 'Weekend Look' })));
    remove = vi.fn(() => of(undefined));

    TestBed.configureTestingModule({
      providers: [OutfitStore, { provide: OutfitApi, useValue: { list, create, remove } }],
    });
    store = TestBed.inject(OutfitStore);
  });

  it('loads outfits and derives count from signal state', async () => {
    await store.load();

    expect(store.entities()).toEqual([outfit()]);
    expect(store.count()).toBe(1);
    expect(store.loading()).toBe(false);
    expect(store.error()).toBeNull();
  });

  it('adds and removes outfits', async () => {
    await store.load();
    await store.add({ name: 'Weekend Look', garmentIds: [1, 2] });
    await store.remove(1);

    expect(create).toHaveBeenCalledWith({ name: 'Weekend Look', garmentIds: [1, 2] });
    expect(remove).toHaveBeenCalledWith(1);
    expect(store.entities()).toEqual([outfit({ id: 2, name: 'Weekend Look' })]);
  });

  it('stores API errors from failed loads', async () => {
    const apiError: ApiError = { status: 500, message: 'Outfits unavailable' };
    list.mockReturnValue(throwError(() => apiError));

    await store.load();

    expect(store.loading()).toBe(false);
    expect(store.error()).toBe('Outfits unavailable');
  });
});
