import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

import { ButtonDirective } from '../../../shared/ui/button.directive';
import { IconComponent } from '../../../shared/ui/icon.component';
import { Outfit } from '../data/outfit.models';

@Component({
  selector: 'app-outfit-card',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ButtonDirective, IconComponent],
  template: `
    <article
      class="group relative flex flex-col overflow-hidden rounded-xl border border-line bg-surface transition-shadow hover:shadow-md"
    >
      <!-- Clickable photo + info area -->
      <button
        type="button"
        (click)="open.emit()"
        class="flex flex-1 flex-col items-start text-left"
      >
        <!-- Photo area -->
        <div class="relative aspect-[3/4] w-full overflow-hidden bg-canvas">
          @if (outfit().imageUrl) {
            <img
              [src]="outfit().imageUrl"
              [alt]="outfit().name"
              class="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
            />
          } @else {
            <div class="flex h-full flex-col items-center justify-center gap-2 text-faint">
              <ui-icon name="layers" [size]="28" />
              <span class="text-xs">No photo</span>
            </div>
          }

          <!-- Season / occasion badge -->
          @if (badge()) {
            <span
              class="absolute left-2.5 top-2.5 rounded-full bg-surface/90 px-2.5 py-1 text-xs font-medium text-ink backdrop-blur-sm"
            >
              {{ badge() }}
            </span>
          }
        </div>

        <!-- Info row -->
        <div class="w-full px-3 py-2.5">
          <p class="truncate text-sm font-medium text-ink">{{ outfit().name }}</p>
          <div class="mt-1 flex items-center gap-1">
            @for (g of outfit().garments.slice(0, 5); track g.id) {
              <span
                class="h-4 w-4 rounded-full border border-line [box-shadow:inset_0_0_0_1px_#0000001a]"
                [style.background-color]="g.colorHex || '#c8c4be'"
                [title]="g.name"
              ></span>
            }
            @if (outfit().garments.length > 5) {
              <span class="text-xs text-faint">+{{ outfit().garments.length - 5 }}</span>
            }
            <span class="ml-auto text-xs text-muted">
              {{ outfit().garments.length }}{{ outfit().garments.length === 1 ? ' item' : ' items' }}
            </span>
          </div>
        </div>
      </button>

      <!-- Delete — top-right, appears on hover -->
      <button
        appBtn
        variant="ghost"
        size="sm"
        (click)="remove.emit()"
        aria-label="Delete outfit"
        class="absolute right-2 top-2 opacity-0 transition-opacity group-hover:opacity-100 bg-surface/80 backdrop-blur-sm hover:bg-surface"
      >
        <ui-icon name="trash" [size]="15" />
      </button>
    </article>
  `,
})
export class OutfitCardComponent {
  readonly outfit = input.required<Outfit>();
  readonly open = output<void>();
  readonly remove = output<void>();

  protected badge(): string {
    const o = this.outfit();
    return [o.season, o.occasion]
      .filter((s): s is string => !!s)
      .map((s) => s.replace('_', ' ').replace(/\b\w/g, (c) => c.toUpperCase()))
      .join(' · ');
  }
}
