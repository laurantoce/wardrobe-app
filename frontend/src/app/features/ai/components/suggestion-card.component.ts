import { ChangeDetectionStrategy, Component, input } from '@angular/core';

import { CardComponent } from '../../../shared/ui/card.component';
import { Garment } from '../../garments/data/garment.models';
import { OutfitSuggestion } from '../data/ai.models';

@Component({
  selector: 'app-suggestion-card',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CardComponent],
  template: `
    <ui-card class="flex flex-col gap-3 p-5">
      <h3 class="font-semibold tracking-tight">{{ suggestion().title }}</h3>

      <!-- Colour swatches + item count -->
      <div class="flex items-center gap-1.5">
        @for (gid of suggestion().garmentIds; track gid) {
          @let g = garmentById().get(gid);
          <span
            class="h-5 w-5 rounded-full border border-line [box-shadow:inset_0_0_0_1px_#0000001a]"
            [style.background-color]="g?.colorHex || '#c8c4be'"
            [title]="g?.name || ''"
          ></span>
        }
        <span class="ml-1 text-xs text-muted">
          {{ suggestion().garments.length }}
          {{ suggestion().garments.length === 1 ? 'item' : 'items' }}
        </span>
      </div>

      <!-- Garment name chips -->
      <div class="flex flex-wrap gap-1.5">
        @for (sg of suggestion().garments; track sg.id) {
          <span
            class="rounded-full border border-line bg-canvas px-2.5 py-0.5 text-xs text-ink"
          >
            {{ sg.name }}
          </span>
        }
      </div>

      <!-- AI reasoning -->
      <p class="text-sm italic text-muted leading-relaxed">{{ suggestion().reasoning }}</p>
    </ui-card>
  `,
})
export class SuggestionCardComponent {
  readonly suggestion = input.required<OutfitSuggestion>();
  readonly garmentById = input.required<Map<number, Garment>>();
}
