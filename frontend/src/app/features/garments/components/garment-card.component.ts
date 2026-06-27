import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { CurrencyPipe, TitleCasePipe } from '@angular/common';

import { ButtonDirective } from '../../../shared/ui/button.directive';
import { CardComponent } from '../../../shared/ui/card.component';
import { IconComponent } from '../../../shared/ui/icon.component';
import { Garment } from '../data/garment.models';

@Component({
  selector: 'app-garment-card',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CardComponent, ButtonDirective, IconComponent, CurrencyPipe, TitleCasePipe],
  template: `
    <ui-card class="flex flex-col overflow-hidden">
      <button
        type="button"
        (click)="open.emit()"
        class="flex flex-1 flex-col items-start text-left transition-colors hover:bg-canvas"
      >
        @if (garment().imageUrl) {
          <div class="flex aspect-[4/5] w-full items-center justify-center overflow-hidden bg-canvas">
            <img
              [src]="garment().imageUrl"
              [alt]="garment().name"
              class="h-full w-full object-contain"
            />
          </div>
        }
        <div class="flex w-full flex-col items-start gap-3 p-4">
          <div class="flex w-full items-center gap-2">
            <span
              class="h-4 w-4 shrink-0 rounded-full border border-line [box-shadow:inset_0_0_0_1px_#0000001a]"
              [style.background-color]="garment().colorHex || '#c8c4be'"
            ></span>
            <span class="truncate font-medium">{{ garment().name }}</span>
          </div>
          <span class="rounded-full bg-canvas px-2 py-0.5 text-xs text-muted">
            {{ garment().category | titlecase }}
          </span>
          <div class="mt-auto flex w-full items-baseline justify-between pt-1">
            <span class="truncate text-sm text-muted">{{ garment().brand || '—' }}</span>
            <span class="text-sm font-semibold">
              {{
                garment().purchasePrice != null
                  ? (garment().purchasePrice | currency: 'EUR')
                  : '—'
              }}
            </span>
          </div>
        </div>
      </button>

      <div class="flex items-center border-t border-line px-2 py-2">
        <button
          appBtn
          variant="ghost"
          size="sm"
          class="ml-auto"
          (click)="remove.emit()"
          aria-label="Delete item"
        >
          <ui-icon name="trash" [size]="15" />
        </button>
      </div>
    </ui-card>
  `,
})
export class GarmentCardComponent {
  readonly garment = input.required<Garment>();
  readonly open = output<void>();
  readonly remove = output<void>();
}
