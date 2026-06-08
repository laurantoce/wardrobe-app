import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { TitleCasePipe } from '@angular/common';
import { Observable } from 'rxjs';

import { ButtonDirective } from '../../../shared/ui/button.directive';
import { IconComponent } from '../../../shared/ui/icon.component';
import { SheetComponent } from '../../../shared/ui/sheet.component';
import { ApiError } from '../../../core/error.interceptor';
import { ActivityApi } from '../../activity/data/activity-api.service';
import { GarmentCardComponent } from '../components/garment-card.component';
import { GarmentFormComponent } from '../components/garment-form.component';
import { GARMENT_CATEGORIES, Garment, GarmentInput } from '../data/garment.models';
import { GarmentStore } from '../state/garment.store';

@Component({
  selector: 'app-garment-list',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    GarmentCardComponent,
    GarmentFormComponent,
    SheetComponent,
    ButtonDirective,
    IconComponent,
    TitleCasePipe,
  ],
  template: `
    <header class="mb-6 flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-semibold tracking-tight">Items</h1>
        <p class="text-sm text-muted">{{ store.count() }} garments in your wardrobe</p>
      </div>
      <button appBtn variant="primary" (click)="openAdd()">
        <ui-icon name="plus" [size]="16" /> Add item
      </button>
    </header>

    <div class="mb-5 flex flex-wrap gap-2">
      @for (c of categories; track c) {
        <button
          type="button"
          (click)="filter(c)"
          class="rounded-full border px-3 py-1 text-xs font-medium transition-colors"
          [class]="
            isActive(c)
              ? 'border-accent bg-accent-soft text-accent'
              : 'border-line text-muted hover:text-ink'
          "
        >
          {{ c === 'all' ? 'All' : (c | titlecase) }}
        </button>
      }
    </div>

    @if (store.loading()) {
      <p class="py-16 text-center text-sm text-muted">Loading…</p>
    } @else if (store.error()) {
      <p class="py-16 text-center text-sm text-red-600">{{ store.error() }}</p>
    } @else if (store.entities().length === 0) {
      <div class="flex flex-col items-center gap-3 py-20 text-center">
        <ui-icon name="shirt" [size]="32" />
        <p class="text-sm text-muted">No items yet. Add your first garment.</p>
        <button appBtn variant="outline" (click)="openAdd()">
          <ui-icon name="plus" [size]="16" /> Add item
        </button>
      </div>
    } @else {
      <div class="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        @for (g of store.entities(); track g.id) {
          <app-garment-card
            [garment]="g"
            (open)="goToDetail(g)"
            (wore)="logWear(g)"
            (washed)="logWash(g)"
            (remove)="remove(g)"
          />
        }
      </div>
    }

    <ui-sheet [open]="sheetOpen()" title="Add item" (closed)="sheetOpen.set(false)">
      @if (sheetOpen()) {
        <app-garment-form (save)="add($event)" (cancelled)="sheetOpen.set(false)" />
      }
    </ui-sheet>

    @if (toast(); as t) {
      <div
        class="fixed bottom-6 left-1/2 z-50 flex -translate-x-1/2 items-center gap-4 rounded-lg bg-ink px-4 py-2 text-sm text-white shadow-lg"
      >
        <span>{{ t.text }}</span>
        @if (t.undo; as undoFn) {
          <button
            type="button"
            class="font-semibold text-white underline underline-offset-2 hover:opacity-80"
            (click)="undoFn()"
          >
            Undo
          </button>
        }
      </div>
    }
  `,
})
export class GarmentListPage {
  protected readonly store = inject(GarmentStore);
  private readonly activity = inject(ActivityApi);
  private readonly router = inject(Router);

  protected readonly categories = ['all', ...GARMENT_CATEGORIES];
  protected readonly sheetOpen = signal(false);
  protected readonly toast = signal<{ text: string; undo?: () => void } | null>(null);

  constructor() {
    void this.store.load();
  }

  protected isActive(c: string): boolean {
    return (this.store.category() ?? 'all') === c;
  }

  protected filter(c: string): void {
    void this.store.setCategory(c === 'all' ? null : c);
  }

  protected openAdd(): void {
    this.sheetOpen.set(true);
  }

  protected goToDetail(g: Garment): void {
    void this.router.navigate(['/items', g.id]);
  }

  protected async add(input: GarmentInput): Promise<void> {
    try {
      await this.store.add(input);
      this.sheetOpen.set(false);
      this.flash('Item added');
    } catch (e) {
      this.flash((e as ApiError).message);
    }
  }

  protected async remove(g: Garment): Promise<void> {
    if (!confirm(`Delete "${g.name}"? This also removes its wear/wash history.`)) return;
    try {
      await this.store.remove(g.id);
      this.flash('Item deleted');
    } catch (e) {
      this.flash((e as ApiError).message);
    }
  }

  protected logWear(g: Garment): void {
    this.activity.logWear(g.id).subscribe({
      next: (w) =>
        this.flash(`Logged a wear for ${g.name}`, () =>
          this.applyUndo(this.activity.deleteWear(w.id), 'Wear removed'),
        ),
      error: (e: ApiError) => this.flash(e.message),
    });
  }

  protected logWash(g: Garment): void {
    this.activity.logWash(g.id).subscribe({
      next: (w) =>
        this.flash(`Logged a wash for ${g.name}`, () =>
          this.applyUndo(this.activity.deleteWash(w.id), 'Wash removed'),
        ),
      error: (e: ApiError) => this.flash(e.message),
    });
  }

  /** Run the undo request, then confirm. */
  private applyUndo(request: Observable<void>, confirmText: string): void {
    this.toast.set(null);
    request.subscribe({
      next: () => this.flash(confirmText),
      error: (e: ApiError) => this.flash(e.message),
    });
  }

  private flash(text: string, undo?: () => void): void {
    this.toast.set({ text, undo });
    // Give a longer window when an Undo action is offered.
    setTimeout(() => this.toast.set(null), undo ? 5000 : 2500);
  }
}
