import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { ApiError } from '../../../core/error.interceptor';
import { AiApi } from '../data/ai-api.service';
import { OutfitSuggestion } from '../data/ai.models';
import { AiStore } from './ai.store';

const suggestion: OutfitSuggestion = {
  title: 'Office uniform',
  garmentIds: [1, 2],
  garments: [
    { id: 1, name: 'Shirt' },
    { id: 2, name: 'Trousers' },
  ],
  reasoning: 'Balanced and work-ready.',
};

describe('AiStore', () => {
  let store: AiStore;
  let suggest: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    suggest = vi.fn(() => of([suggestion]));
    TestBed.configureTestingModule({
      providers: [AiStore, { provide: AiApi, useValue: { suggest } }],
    });
    store = TestBed.inject(AiStore);
  });

  it('stores outfit suggestions from the API', async () => {
    await store.suggest({ occasion: 'work', max_outfits: 1 });

    expect(suggest).toHaveBeenCalledWith({ occasion: 'work', max_outfits: 1 });
    expect(store.suggestions()).toEqual([suggestion]);
    expect(store.hasFetched()).toBe(true);
    expect(store.loading()).toBe(false);
    expect(store.error()).toBeNull();
  });

  it('captures API errors and marks the fetch as attempted', async () => {
    const apiError: ApiError = { status: 400, message: 'Add some garments first' };
    suggest.mockReturnValue(throwError(() => apiError));

    await store.suggest({});

    expect(store.suggestions()).toEqual([]);
    expect(store.hasFetched()).toBe(true);
    expect(store.loading()).toBe(false);
    expect(store.error()).toBe('Add some garments first');
  });

  it('resets suggestion state without changing loading state', () => {
    store.suggestions.set([suggestion]);
    store.error.set('No match');
    store.hasFetched.set(true);

    store.reset();

    expect(store.suggestions()).toEqual([]);
    expect(store.error()).toBeNull();
    expect(store.hasFetched()).toBe(false);
  });
});
