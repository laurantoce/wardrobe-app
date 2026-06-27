import { inject } from '@angular/core';
import { patchState, signalStore, withMethods, withState } from '@ngrx/signals';
import { firstValueFrom } from 'rxjs';

import { ApiError } from '../../../core/error.interceptor';
import { AiApi } from '../data/ai-api.service';
import { OutfitSuggestion, SuggestionRequest } from '../data/ai.models';

interface AiState {
  suggestions: OutfitSuggestion[];
  loading: boolean;
  error: string | null;
  hasFetched: boolean;
}

export const AiStore = signalStore(
  { providedIn: 'root' },
  withState<AiState>({ suggestions: [], loading: false, error: null, hasFetched: false }),
  withMethods((store, api = inject(AiApi)) => ({
    async suggest(request: SuggestionRequest): Promise<void> {
      patchState(store, { loading: true, error: null });
      try {
        const suggestions = await firstValueFrom(api.suggest(request));
        patchState(store, { suggestions, loading: false, hasFetched: true });
      } catch (e) {
        patchState(store, {
          loading: false,
          hasFetched: true,
          error: (e as ApiError).message,
        });
      }
    },
    reset(): void {
      patchState(store, { suggestions: [], error: null, hasFetched: false });
    },
  })),
);
