import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { ApiError } from '../../../core/error.interceptor';
import { GarmentApi } from '../data/garment-api.service';
import { Garment } from '../data/garment.models';
import { GarmentStore } from './garment.store';

function garment(overrides: Partial<Garment> = {}): Garment {
  return {
    id: 1,
    name: 'White Tee',
    category: 'top',
    colorHex: null,
    colorName: 'White',
    brand: null,
    purchaseDate: null,
    purchasePrice: 25,
    imageUrl: null,
    sourceUrl: null,
    notes: null,
    occasion: null,
    material: null,
    subType: null,
    createdAt: '2026-06-10T12:00:00Z',
    ...overrides,
  };
}

describe('GarmentStore', () => {
  let store: GarmentStore;
  let list: ReturnType<typeof vi.fn>;
  let create: ReturnType<typeof vi.fn>;
  let update: ReturnType<typeof vi.fn>;
  let remove: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    list = vi.fn(() => of([garment()]));
    create = vi.fn(() => of(garment({ id: 2, name: 'Black Jeans', category: 'bottom' })));
    update = vi.fn(() => of(garment({ id: 1, name: 'Updated Tee' })));
    remove = vi.fn(() => of(undefined));

    TestBed.configureTestingModule({
      providers: [
        GarmentStore,
        {
          provide: GarmentApi,
          useValue: { list, create, update, remove },
        },
      ],
    });
    store = TestBed.inject(GarmentStore);
  });

  it('loads garments and derives count/value from signal state', async () => {
    await store.load();

    expect(list).toHaveBeenCalledWith(undefined);
    expect(store.entities()).toEqual([garment()]);
    expect(store.count()).toBe(1);
    expect(store.totalValue()).toBe(25);
    expect(store.loading()).toBe(false);
    expect(store.error()).toBeNull();
  });

  it('reloads when the category changes', async () => {
    await store.setCategory('bottom');

    expect(store.category()).toBe('bottom');
    expect(list).toHaveBeenCalledWith('bottom');
  });

  it('adds, updates, and removes garments in-place', async () => {
    await store.load();
    await store.add({ name: 'Black Jeans', category: 'bottom' });
    await store.update(1, { name: 'Updated Tee', category: 'top' });
    await store.remove(2);

    expect(create).toHaveBeenCalledWith({ name: 'Black Jeans', category: 'bottom' });
    expect(update).toHaveBeenCalledWith(1, { name: 'Updated Tee', category: 'top' });
    expect(remove).toHaveBeenCalledWith(2);
    expect(store.entities()).toEqual([garment({ id: 1, name: 'Updated Tee' })]);
  });

  it('stores API errors from failed loads', async () => {
    const apiError: ApiError = { status: 500, message: 'Backend unavailable' };
    list.mockReturnValue(throwError(() => apiError));

    await store.load();

    expect(store.loading()).toBe(false);
    expect(store.error()).toBe('Backend unavailable');
  });
});
