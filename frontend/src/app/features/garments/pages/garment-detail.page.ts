import {
  ChangeDetectionStrategy,
  Component,
  effect,
  inject,
  input,
  signal,
} from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { CurrencyPipe, DatePipe, TitleCasePipe } from '@angular/common';

import { ButtonDirective } from '../../../shared/ui/button.directive';
import { CardComponent } from '../../../shared/ui/card.component';
import { IconComponent } from '../../../shared/ui/icon.component';
import { SheetComponent } from '../../../shared/ui/sheet.component';
import { ApiError } from '../../../core/error.interceptor';
import { GarmentFormComponent } from '../components/garment-form.component';
import { GarmentApi } from '../data/garment-api.service';
import { Garment, GarmentInput } from '../data/garment.models';

@Component({
  selector: 'app-garment-detail',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    RouterLink,
    CardComponent,
    ButtonDirective,
    IconComponent,
    SheetComponent,
    GarmentFormComponent,
    CurrencyPipe,
    DatePipe,
    TitleCasePipe,
  ],
  template: `
    <a
      routerLink="/items"
      class="mb-5 inline-flex items-center gap-1 text-sm text-muted hover:text-ink"
    >
      <ui-icon name="chevron-left" [size]="16" /> Back to items
    </a>

    @if (loading()) {
      <p class="py-16 text-center text-sm text-muted">Loading…</p>
    } @else if (error()) {
      <p class="py-16 text-center text-sm text-red-600">{{ error() }}</p>
    } @else if (garment(); as g) {
      <header class="mb-6 flex items-start justify-between gap-4">
        <div class="flex items-center gap-3">
          <span
            class="h-8 w-8 shrink-0 rounded-full border border-line [box-shadow:inset_0_0_0_1px_#0000001a]"
            [style.background-color]="g.colorHex || '#ffffff'"
          ></span>
          <div>
            <h1 class="text-2xl font-semibold tracking-tight">{{ g.name }}</h1>
            <p class="text-sm text-muted">
              {{ g.category | titlecase }}{{ g.brand ? ' · ' + g.brand : '' }}
            </p>
          </div>
        </div>
        <div class="flex gap-2">
          <button appBtn variant="outline" (click)="sheetOpen.set(true)">Edit</button>
          <button appBtn variant="danger" (click)="remove(g)">
            <ui-icon name="trash" [size]="16" />
          </button>
        </div>
      </header>

      <div class="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
        <ui-card class="p-4">
          <p class="text-xs text-muted">Price</p>
          <p class="mt-1 text-lg font-semibold">
            {{ g.purchasePrice != null ? (g.purchasePrice | currency: 'EUR') : '—' }}
          </p>
        </ui-card>
        <ui-card class="p-4">
          <p class="text-xs text-muted">Purchased</p>
          <p class="mt-1 text-lg font-semibold">
            {{ g.purchaseDate != null ? (g.purchaseDate | date: 'mediumDate') : '—' }}
          </p>
        </ui-card>
        <ui-card class="p-4">
          <p class="text-xs text-muted">Category</p>
          <p class="mt-1 text-lg font-semibold">{{ g.category | titlecase }}</p>
        </ui-card>
      </div>

      @if (g.notes) {
        <ui-card class="mb-4 p-4">
          <h2 class="mb-1 text-sm font-semibold">Notes</h2>
          <p class="text-sm text-muted">{{ g.notes }}</p>
        </ui-card>
      }

      <ui-sheet [open]="sheetOpen()" title="Edit item" (closed)="sheetOpen.set(false)">
        @if (sheetOpen()) {
          <app-garment-form
            [initial]="g"
            (save)="update(g, $event)"
            (cancelled)="sheetOpen.set(false)"
          />
        }
      </ui-sheet>
    }
  `,
})
export class GarmentDetailPage {
  private readonly api = inject(GarmentApi);
  private readonly router = inject(Router);

  /** Bound from the :id route param (withComponentInputBinding). */
  readonly id = input.required<string>();

  protected readonly garment = signal<Garment | null>(null);
  protected readonly loading = signal(true);
  protected readonly error = signal<string | null>(null);
  protected readonly sheetOpen = signal(false);

  constructor() {
    effect(() => {
      const idNum = Number(this.id());
      if (Number.isFinite(idNum)) this.load(idNum);
    });
  }

  private load(id: number): void {
    this.loading.set(true);
    this.error.set(null);
    this.api.get(id).subscribe({
      next: (garment) => {
        this.garment.set(garment);
        this.loading.set(false);
      },
      error: (e: ApiError) => {
        this.error.set(e.message);
        this.loading.set(false);
      },
    });
  }

  protected update(g: Garment, input: GarmentInput): void {
    this.api.update(g.id, input).subscribe({
      next: (updated) => {
        this.garment.set(updated);
        this.sheetOpen.set(false);
      },
      error: (e: ApiError) => this.error.set(e.message),
    });
  }

  protected remove(g: Garment): void {
    if (!confirm(`Delete "${g.name}"?`)) return;
    this.api.remove(g.id).subscribe({
      next: () => this.router.navigate(['/items']),
      error: (e: ApiError) => this.error.set(e.message),
    });
  }
}
