import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';

import { ButtonDirective } from '../../../shared/ui/button.directive';
import { IconComponent } from '../../../shared/ui/icon.component';
import { SheetComponent } from '../../../shared/ui/sheet.component';
import { ApiError } from '../../../core/error.interceptor';
import { GarmentStore } from '../../garments/state/garment.store';
import { OutfitCardComponent } from '../components/outfit-card.component';
import { OutfitFormComponent } from '../components/outfit-form.component';
import { Outfit, OutfitInput } from '../data/outfit.models';
import { OutfitStore } from '../state/outfit.store';

@Component({
  selector: 'app-outfit-list',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    OutfitCardComponent,
    OutfitFormComponent,
    SheetComponent,
    ButtonDirective,
    IconComponent,
  ],
  template: `
    <header class="mb-6 flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-semibold tracking-tight">Outfits</h1>
        <p class="text-sm text-muted">{{ store.count() }} saved outfits</p>
      </div>
      <button appBtn variant="primary" (click)="sheetOpen.set(true)">
        <ui-icon name="plus" [size]="16" /> New outfit
      </button>
    </header>

    @if (store.loading()) {
      <p class="py-16 text-center text-sm text-muted">Loading…</p>
    } @else if (store.error()) {
      <p class="py-16 text-center text-sm text-red-600">{{ store.error() }}</p>
    } @else if (store.entities().length === 0) {
      <div class="flex flex-col items-center gap-3 py-20 text-center">
        <ui-icon name="layers" [size]="32" />
        <p class="text-sm text-muted">No outfits yet. Combine some items into a look.</p>
        <button appBtn variant="outline" (click)="sheetOpen.set(true)">
          <ui-icon name="plus" [size]="16" /> New outfit
        </button>
      </div>
    } @else {
      <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        @for (o of store.entities(); track o.id) {
          <app-outfit-card [outfit]="o" (remove)="remove(o)" />
        }
      </div>
    }

    <ui-sheet [open]="sheetOpen()" title="New outfit" (closed)="sheetOpen.set(false)">
      @if (sheetOpen()) {
        <app-outfit-form
          [garments]="garmentStore.entities()"
          (save)="add($event)"
          (cancelled)="sheetOpen.set(false)"
        />
      }
    </ui-sheet>

    @if (toast()) {
      <div
        class="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-lg bg-ink px-4 py-2 text-sm text-white shadow-lg"
      >
        {{ toast() }}
      </div>
    }
  `,
})
export class OutfitListPage {
  protected readonly store = inject(OutfitStore);
  protected readonly garmentStore = inject(GarmentStore);

  protected readonly sheetOpen = signal(false);
  protected readonly toast = signal<string | null>(null);

  constructor() {
    void this.store.load();
    void this.garmentStore.load();
  }

  protected async add(input: OutfitInput): Promise<void> {
    try {
      await this.store.add(input);
      this.sheetOpen.set(false);
      this.flash('Outfit created');
    } catch (e) {
      this.flash((e as ApiError).message);
    }
  }

  protected async remove(o: Outfit): Promise<void> {
    if (!confirm(`Delete outfit "${o.name}"?`)) return;
    try {
      await this.store.remove(o.id);
      this.flash('Outfit deleted');
    } catch (e) {
      this.flash((e as ApiError).message);
    }
  }

  private flash(message: string): void {
    this.toast.set(message);
    setTimeout(() => this.toast.set(null), 2500);
  }
}
