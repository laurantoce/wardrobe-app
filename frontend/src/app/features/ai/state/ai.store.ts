import { inject, Injectable, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';

import { ApiError } from '../../../core/error.interceptor';
import { AiApi } from '../data/ai-api.service';
import { OutfitSuggestion, SuggestionRequest } from '../data/ai.models';

@Injectable({ providedIn: 'root' })
export class AiStore {
  private readonly api = inject(AiApi);

  readonly suggestions = signal<OutfitSuggestion[]>([]);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly hasFetched = signal(false);

  async suggest(request: SuggestionRequest): Promise<void> {
    this.loading.set(true);
    this.error.set(null);
    try {
      const suggestions = await firstValueFrom(this.api.suggest(request));
      this.suggestions.set(suggestions);
      this.loading.set(false);
      this.hasFetched.set(true);
    } catch (e) {
      this.loading.set(false);
      this.hasFetched.set(true);
      this.error.set((e as ApiError).message);
    }
  }

  reset(): void {
    this.suggestions.set([]);
    this.error.set(null);
    this.hasFetched.set(false);
  }
}
