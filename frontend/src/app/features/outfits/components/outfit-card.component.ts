import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

import { ButtonDirective } from '../../../shared/ui/button.directive';
import { CardComponent } from '../../../shared/ui/card.component';
import { IconComponent } from '../../../shared/ui/icon.component';
import { Outfit } from '../data/outfit.models';

@Component({
  selector: 'app-outfit-card',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CardComponent, ButtonDirective, IconComponent],
  template: `
    <ui-card class="flex flex-col p-4">
      <div class="flex items-start justify-between gap-2">
        <div class="min-w-0">
          <h3 class="truncate font-medium">{{ outfit().name }}</h3>
          <p class="text-xs text-muted">
            {{ subtitle() || 'No season / occasion' }}
          </p>
        </div>
        <button
          appBtn
          variant="ghost"
          size="sm"
          (click)="remove.emit()"
          aria-label="Delete outfit"
        >
          <ui-icon name="trash" [size]="15" />
        </button>
      </div>

      <div class="mt-4 flex items-center gap-1.5">
        @for (g of outfit().garments.slice(0, 6); track g.id) {
          <span
            class="h-5 w-5 rounded-full border border-line [box-shadow:inset_0_0_0_1px_#0000001a]"
            [style.background-color]="g.colorHex || '#c8c4be'"
            [title]="g.name"
          ></span>
        }
        <span class="ml-1 text-xs text-muted">
          {{ outfit().garments.length }}
          {{ outfit().garments.length === 1 ? 'item' : 'items' }}
        </span>
      </div>
    </ui-card>
  `,
})
export class OutfitCardComponent {
  readonly outfit = input.required<Outfit>();
  readonly remove = output<void>();

  protected subtitle(): string {
    const o = this.outfit();
    return [o.season, o.occasion]
      .filter((s): s is string => !!s)
      .map((s) => s.replace('_', ' ').replace(/\b\w/g, (c) => c.toUpperCase()))
      .join(' · ');
  }
}
