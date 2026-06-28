import {
  ChangeDetectionStrategy,
  Component,
  effect,
  inject,
  input,
  signal,
} from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { TitleCasePipe } from '@angular/common';

import { ButtonDirective } from '../../../shared/ui/button.directive';
import { CardComponent } from '../../../shared/ui/card.component';
import { IconComponent } from '../../../shared/ui/icon.component';
import { SheetComponent } from '../../../shared/ui/sheet.component';
import { ApiError } from '../../../core/error.interceptor';
import { GarmentStore } from '../../garments/state/garment.store';
import { OutfitFormComponent } from '../components/outfit-form.component';
import { Outfit, OutfitInput } from '../data/outfit.models';
import { OutfitApi } from '../data/outfit-api.service';
import { OutfitStore } from '../state/outfit.store';

@Component({
  selector: 'app-outfit-detail',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    RouterLink,
    CardComponent,
    ButtonDirective,
    IconComponent,
    SheetComponent,
    OutfitFormComponent,
    TitleCasePipe,
  ],
  template: `
    <a routerLink="/outfits" class="mb-5 inline-flex items-center gap-1 text-sm text-muted hover:text-ink">
      <ui-icon name="chevron-left" [size]="16" /> Back to outfits
    </a>

    @if (loading()) {
      <p class="py-16 text-center text-sm text-muted">Loading…</p>
    } @else if (error()) {
      <p class="py-16 text-center text-sm text-red-600">{{ error() }}</p>
    } @else if (outfit(); as o) {

      <!-- Photo -->
      @if (o.imageUrl) {
        <div
          class="mb-6 flex max-h-96 cursor-pointer items-center justify-center overflow-hidden rounded-xl bg-canvas"
          (click)="photoOverlayOpen.set(true)"
          title="Click to manage photo"
        >
          <img [src]="o.imageUrl" [alt]="o.name" class="max-h-96 w-full object-contain" />
        </div>
      }

      <!-- Photo overlay -->
      @if (photoOverlayOpen() && o.imageUrl) {
        <div
          class="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/80"
          (click)="photoOverlayOpen.set(false)"
        >
          <div class="flex max-w-xl flex-col items-center gap-4 p-4" (click)="$event.stopPropagation()">
            <img [src]="o.imageUrl" [alt]="o.name" class="max-h-[65vh] max-w-full rounded-xl object-contain" />
            @if (photoLoading()) {
              <p class="text-sm text-white/70">Uploading…</p>
            } @else {
              <div class="flex gap-3">
                <input #replaceInput type="file" accept="image/*" class="hidden" (change)="replacePhoto(replaceInput)" />
                <button appBtn variant="outline" class="bg-white/90" (click)="replaceInput.click()">
                  Replace photo
                </button>
                <button appBtn variant="danger" (click)="deletePhoto()">Delete photo</button>
                <button appBtn variant="ghost" class="text-white" (click)="photoOverlayOpen.set(false)">
                  Close
                </button>
              </div>
            }
          </div>
        </div>
      }

      <!-- Header -->
      <header class="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 class="text-2xl font-semibold tracking-tight">{{ o.name }}</h1>
          <div class="mt-1.5 flex flex-wrap gap-1.5">
            @if (o.season) {
              <span class="rounded-full border border-line px-2.5 py-0.5 text-xs font-medium capitalize text-muted">
                {{ o.season.replace('_', ' ') }}
              </span>
            }
            @if (o.occasion) {
              <span class="rounded-full border border-line px-2.5 py-0.5 text-xs font-medium capitalize text-muted">
                {{ o.occasion }}
              </span>
            }
            <span class="rounded-full bg-canvas px-2.5 py-0.5 text-xs font-medium text-muted">
              {{ o.garments.length }} {{ o.garments.length === 1 ? 'item' : 'items' }}
            </span>
          </div>
        </div>

        <div class="flex shrink-0 items-center gap-2">
          @if (!o.imageUrl) {
            <!-- Hidden file input, triggered by the button below -->
            <input #photoInput type="file" accept="image/*" class="hidden" (change)="uploadPhoto($event)" />
            <button appBtn variant="outline" size="sm" (click)="photoInput.click()">
              <ui-icon name="camera" [size]="15" /> Add photo
            </button>
          }
          <button appBtn variant="outline" size="sm" (click)="sheetOpen.set(true)">
            Edit
          </button>
          <button appBtn variant="danger" size="sm" (click)="remove(o)">
            <ui-icon name="trash" [size]="15" />
          </button>
        </div>
      </header>

      <!-- Notes -->
      @if (o.notes) {
        <ui-card class="mb-5 p-4">
          <p class="text-sm text-muted">{{ o.notes }}</p>
        </ui-card>
      }

      <!-- Garments -->
      <section>
        <h2 class="mb-3 text-xs font-semibold uppercase tracking-widest text-muted">
          Items in this outfit
        </h2>
        @if (o.garments.length === 0) {
          <p class="text-sm text-muted">No items linked — tap Edit to add some.</p>
        } @else {
          <div class="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            @for (g of o.garments; track g.id) {
              <a
                [routerLink]="['/items', g.id]"
                class="group flex flex-col overflow-hidden rounded-xl border border-line bg-surface transition-shadow hover:shadow-md"
              >
                <div class="aspect-square w-full overflow-hidden bg-canvas">
                  @if (g.imageUrl) {
                    <img
                      [src]="g.imageUrl"
                      [alt]="g.name"
                      class="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.04]"
                    />
                  } @else {
                    <div
                      class="h-full w-full"
                      [style.background-color]="g.colorHex || '#e7e5e4'"
                    ></div>
                  }
                </div>
                <div class="p-2.5">
                  <p class="truncate text-sm font-medium">{{ g.name }}</p>
                  <p class="text-xs text-muted">
                    {{ g.category | titlecase }}
                    @if (g.brand) { · {{ g.brand }} }
                  </p>
                </div>
              </a>
            }
          </div>
        }
      </section>

      <!-- Edit sheet -->
      <ui-sheet [open]="sheetOpen()" title="Edit outfit" (closed)="sheetOpen.set(false)">
        @if (sheetOpen()) {
          <app-outfit-form
            [garments]="garmentStore.entities()"
            [initial]="o"
            (save)="save($event)"
            (cancelled)="sheetOpen.set(false)"
          />
        }
      </ui-sheet>
    }
  `,
})
export class OutfitDetailPage {
  private readonly api = inject(OutfitApi);
  private readonly outfitStore = inject(OutfitStore);
  protected readonly garmentStore = inject(GarmentStore);
  private readonly router = inject(Router);

  readonly id = input.required<string>();

  protected readonly outfit = signal<Outfit | null>(null);
  protected readonly loading = signal(true);
  protected readonly error = signal<string | null>(null);
  protected readonly sheetOpen = signal(false);
  protected readonly photoOverlayOpen = signal(false);
  protected readonly photoLoading = signal(false);

  constructor() {
    void this.garmentStore.load();
    effect(() => {
      const idNum = Number(this.id());
      if (Number.isFinite(idNum)) this.load(idNum);
    });
  }

  private load(id: number): void {
    this.loading.set(true);
    this.error.set(null);
    this.api.get(id).subscribe({
      next: (o) => { this.outfit.set(o); this.loading.set(false); },
      error: (e: ApiError) => { this.error.set(e.message); this.loading.set(false); },
    });
  }

  protected save(input: OutfitInput): void {
    const id = this.outfit()!.id;
    this.api.update(id, input).subscribe({
      next: (updated) => {
        this.outfit.set(updated);
        void this.outfitStore.update(id, input);
        this.sheetOpen.set(false);
      },
      error: (e: ApiError) => this.error.set(e.message),
    });
  }

  protected remove(o: Outfit): void {
    if (!confirm(`Delete outfit "${o.name}"?`)) return;
    this.api.remove(o.id).subscribe({
      next: () => {
        void this.outfitStore.remove(o.id);
        this.router.navigate(['/outfits']);
      },
      error: (e: ApiError) => this.error.set(e.message),
    });
  }

  protected uploadPhoto(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file || !this.outfit()) return;
    this.photoLoading.set(true);
    this.api.analyzeOutfitPhoto(file, false).subscribe({
      next: (analysis) => {
        const url = analysis.originalImageUrl;
        if (!url) { this.photoLoading.set(false); return; }
        this.api.update(this.outfit()!.id, { imageUrl: url }).subscribe({
          next: (updated) => { this.outfit.set(updated); this.photoLoading.set(false); },
          error: () => this.photoLoading.set(false),
        });
      },
      error: () => this.photoLoading.set(false),
    });
    (event.target as HTMLInputElement).value = '';
  }

  protected replacePhoto(input: HTMLInputElement): void {
    const file = input.files?.[0];
    if (!file || !this.outfit()) return;
    this.photoLoading.set(true);
    this.api.analyzeOutfitPhoto(file, false).subscribe({
      next: (analysis) => {
        const url = analysis.originalImageUrl;
        if (!url) { this.photoLoading.set(false); return; }
        this.api.update(this.outfit()!.id, { imageUrl: url }).subscribe({
          next: (updated) => {
            this.outfit.set(updated);
            this.photoOverlayOpen.set(false);
            this.photoLoading.set(false);
          },
          error: () => this.photoLoading.set(false),
        });
      },
      error: () => this.photoLoading.set(false),
    });
    input.value = '';
  }

  protected deletePhoto(): void {
    if (!this.outfit()) return;
    this.api.update(this.outfit()!.id, { imageUrl: null }).subscribe({
      next: (updated) => {
        this.outfit.set(updated);
        this.photoOverlayOpen.set(false);
      },
      error: (e: ApiError) => this.error.set(e.message),
    });
  }
}
