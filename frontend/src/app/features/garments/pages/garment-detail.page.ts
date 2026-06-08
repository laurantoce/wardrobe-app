import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  input,
  signal,
} from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { CurrencyPipe, DatePipe, TitleCasePipe } from '@angular/common';
import { forkJoin } from 'rxjs';

import { ButtonDirective } from '../../../shared/ui/button.directive';
import { CardComponent } from '../../../shared/ui/card.component';
import { IconComponent } from '../../../shared/ui/icon.component';
import { SheetComponent } from '../../../shared/ui/sheet.component';
import { ApiError } from '../../../core/error.interceptor';
import { ActivityApi } from '../../activity/data/activity-api.service';
import { Wash, Wear } from '../../activity/data/activity.models';
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
            class="h-8 w-8 shrink-0 rounded-full border border-line"
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

      <div class="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <ui-card class="p-4">
          <p class="text-xs text-muted">Price</p>
          <p class="mt-1 text-lg font-semibold">
            {{ g.purchasePrice != null ? (g.purchasePrice | currency: 'EUR') : '—' }}
          </p>
        </ui-card>
        <ui-card class="p-4">
          <p class="text-xs text-muted">Wears</p>
          <p class="mt-1 text-lg font-semibold">{{ wears().length }}</p>
        </ui-card>
        <ui-card class="p-4">
          <p class="text-xs text-muted">Washes</p>
          <p class="mt-1 text-lg font-semibold">{{ washes().length }}</p>
        </ui-card>
        <ui-card class="p-4">
          <p class="text-xs text-muted">Cost / wear</p>
          <p class="mt-1 text-lg font-semibold text-accent">
            {{ costPerWear() != null ? (costPerWear() | currency: 'EUR') : '—' }}
          </p>
        </ui-card>
      </div>

      <div class="mb-6 flex gap-2">
        <button appBtn variant="primary" (click)="logWear(g)">
          <ui-icon name="shirt" [size]="16" /> Wore today
        </button>
        <button appBtn variant="outline" (click)="logWash(g)">
          <ui-icon name="droplet" [size]="16" /> Washed today
        </button>
      </div>

      <div class="grid gap-4 sm:grid-cols-2">
        <ui-card class="p-4">
          <h2 class="mb-3 text-sm font-semibold">Recent wears</h2>
          @if (wears().length === 0) {
            <p class="text-sm text-muted">No wears logged yet.</p>
          } @else {
            <ul class="flex flex-col gap-0.5">
              @for (w of wears().slice(0, 8); track w.id) {
                <li class="group flex items-center gap-2 rounded-md py-1 text-sm">
                  <ui-icon name="shirt" [size]="14" />
                  <span>{{ w.wornDate | date: 'mediumDate' }}</span>
                  <button
                    appBtn
                    variant="ghost"
                    size="sm"
                    class="ml-auto opacity-0 group-hover:opacity-100"
                    (click)="removeWear(w.id)"
                    aria-label="Delete this wear"
                  >
                    <ui-icon name="x" [size]="14" />
                  </button>
                </li>
              }
            </ul>
          }
        </ui-card>
        <ui-card class="p-4">
          <h2 class="mb-3 text-sm font-semibold">Recent washes</h2>
          @if (washes().length === 0) {
            <p class="text-sm text-muted">No washes logged yet.</p>
          } @else {
            <ul class="flex flex-col gap-0.5">
              @for (w of washes().slice(0, 8); track w.id) {
                <li class="group flex items-center gap-2 rounded-md py-1 text-sm">
                  <ui-icon name="droplet" [size]="14" />
                  <span>{{ w.washedDate | date: 'mediumDate' }}</span>
                  <span class="text-muted">{{ w.method }}</span>
                  <button
                    appBtn
                    variant="ghost"
                    size="sm"
                    class="ml-auto opacity-0 group-hover:opacity-100"
                    (click)="removeWash(w.id)"
                    aria-label="Delete this wash"
                  >
                    <ui-icon name="x" [size]="14" />
                  </button>
                </li>
              }
            </ul>
          }
        </ui-card>
      </div>

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
  private readonly activity = inject(ActivityApi);
  private readonly router = inject(Router);

  /** Bound from the :id route param (withComponentInputBinding). */
  readonly id = input.required<string>();

  protected readonly garment = signal<Garment | null>(null);
  protected readonly wears = signal<Wear[]>([]);
  protected readonly washes = signal<Wash[]>([]);
  protected readonly loading = signal(true);
  protected readonly error = signal<string | null>(null);
  protected readonly sheetOpen = signal(false);

  protected readonly costPerWear = computed(() => {
    const g = this.garment();
    const n = this.wears().length;
    if (!g || g.purchasePrice == null || n === 0) return null;
    return g.purchasePrice / n;
  });

  constructor() {
    effect(() => {
      const idNum = Number(this.id());
      if (Number.isFinite(idNum)) this.load(idNum);
    });
  }

  private load(id: number): void {
    this.loading.set(true);
    this.error.set(null);
    forkJoin({
      garment: this.api.get(id),
      wears: this.activity.listWears(id),
      washes: this.activity.listWashes(id),
    }).subscribe({
      next: ({ garment, wears, washes }) => {
        this.garment.set(garment);
        this.wears.set(wears);
        this.washes.set(washes);
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

  protected logWear(g: Garment): void {
    this.activity.logWear(g.id).subscribe((w) => this.wears.update((l) => [w, ...l]));
  }

  protected logWash(g: Garment): void {
    this.activity.logWash(g.id).subscribe((w) => this.washes.update((l) => [w, ...l]));
  }

  protected removeWear(id: number): void {
    this.activity
      .deleteWear(id)
      .subscribe(() => this.wears.update((l) => l.filter((w) => w.id !== id)));
  }

  protected removeWash(id: number): void {
    this.activity
      .deleteWash(id)
      .subscribe(() => this.washes.update((l) => l.filter((w) => w.id !== id)));
  }
}
