import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { ButtonDirective } from './button.directive';
import { IconComponent } from './icon.component';

/** Right-side slide-over panel. Controlled via `open` input; emits `closed`. */
@Component({
  selector: 'ui-sheet',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ButtonDirective, IconComponent],
  template: `
    @if (open()) {
      <div
        class="fixed inset-0 z-40 bg-ink/20 backdrop-blur-[1px]"
        (click)="closed.emit()"
      ></div>
      <aside
        class="fixed right-0 top-0 z-50 flex h-full w-full max-w-md flex-col border-l border-line bg-surface shadow-2xl"
        role="dialog"
        aria-modal="true"
      >
        <header class="flex items-center justify-between border-b border-line px-6 py-4">
          <h2 class="text-base font-semibold text-ink">{{ title() }}</h2>
          <button appBtn variant="ghost" size="sm" (click)="closed.emit()" aria-label="Close">
            <ui-icon name="x" [size]="18" />
          </button>
        </header>
        <div class="flex-1 overflow-y-auto px-6 py-5">
          <ng-content />
        </div>
      </aside>
    }
  `,
})
export class SheetComponent {
  readonly open = input(false);
  readonly title = input('');
  readonly closed = output<void>();
}
