import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';

import { CardComponent } from '../../../shared/ui/card.component';
import { IconComponent } from '../../../shared/ui/icon.component';
import { GarmentStore } from '../../garments/state/garment.store';
import { SuggestionCardComponent } from '../components/suggestion-card.component';
import { SuggestionFormComponent } from '../components/suggestion-form.component';
import { SuggestionRequest } from '../data/ai.models';
import { AiStore } from '../state/ai.store';

@Component({
  selector: 'app-ai-suggestions',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CardComponent, IconComponent, SuggestionFormComponent, SuggestionCardComponent],
  template: `
    <header class="mb-6">
      <div class="flex items-center gap-2">
        <ui-icon name="sparkles" [size]="22" class="text-accent" />
        <h1 class="text-2xl font-semibold tracking-tight">AI Stylist</h1>
      </div>
      <p class="mt-1 text-sm text-muted">
        Tell the AI what you need and it will suggest outfits from your wardrobe.
      </p>
    </header>

    <!-- Filter form -->
    <ui-card class="mb-6 p-5">
      <app-suggestion-form (generate)="suggest($event)" />
    </ui-card>

    <!-- States -->
    @if (store.loading()) {
      <div class="flex flex-col items-center gap-3 py-20 text-center">
        <ui-icon name="sparkles" [size]="32" class="animate-pulse text-accent" />
        <p class="text-sm text-muted">Thinking about your wardrobe…</p>
      </div>
    } @else if (store.error()) {
      <p class="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
        {{ store.error() }}
      </p>
    } @else if (store.hasFetched() && store.suggestions().length === 0) {
      <div class="flex flex-col items-center gap-2 py-16 text-center">
        <ui-icon name="layers" [size]="28" class="text-faint" />
        <p class="text-sm text-muted">
          No suggestions — try adjusting the filters or adding more garments.
        </p>
      </div>
    } @else if (store.suggestions().length > 0) {
      <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        @for (s of store.suggestions(); track s.title) {
          <app-suggestion-card [suggestion]="s" [garmentById]="garmentById()" />
        }
      </div>
    }
  `,
})
export class AiSuggestionsPage {
  protected readonly store = inject(AiStore);
  private readonly garmentStore = inject(GarmentStore);

  protected readonly garmentById = computed(
    () => new Map(this.garmentStore.entities().map((g) => [g.id, g])),
  );

  constructor() {
    void this.garmentStore.load();
  }

  protected suggest(request: SuggestionRequest): void {
    void this.store.suggest(request);
  }
}
