import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { TitleCasePipe } from '@angular/common';

import { ButtonDirective } from '../../../shared/ui/button.directive';
import { IconComponent } from '../../../shared/ui/icon.component';
import { Garment } from '../../garments/data/garment.models';
import { Outfit, OCCASIONS, OutfitInput, SEASONS } from '../data/outfit.models';
import { OutfitApi } from '../data/outfit-api.service';

const FIELD =
  'w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm text-ink ' +
  'placeholder:text-faint focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20';
const LABEL = 'block text-xs font-medium text-muted mb-1.5';

type PhotoVariant = 'original' | 'cutout';

@Component({
  selector: 'app-outfit-form',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, ButtonDirective, IconComponent, TitleCasePipe],
  template: `
    <form [formGroup]="form" (ngSubmit)="submit()" class="flex flex-col gap-5">

      <!-- ── Photo upload ──────────────────────────────────────────────── -->
      <div>
        <label [class]="LABEL">
          Outfit photo
          @if (!initial()) {
            <span class="font-normal text-faint">· optional · AI matches your wardrobe items</span>
          }
        </label>
        <input
          #fileInput
          type="file"
          accept="image/*"
          class="hidden"
          (change)="onFileSelected(fileInput)"
        />

        @if (imagePreview()) {
          <div class="relative overflow-hidden rounded-xl bg-canvas">
            <img [src]="imagePreview()" alt="Outfit photo" class="max-h-64 w-full object-contain" />
            @if (analyzing()) {
              <div class="absolute inset-0 flex flex-col items-center justify-center gap-2.5 bg-black/60">
                <div class="h-6 w-6 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                <span class="text-sm font-medium text-white">Analyzing outfit…</span>
              </div>
            }
          </div>

          @if (originalImageUrl() && cutoutImageUrl() && !analyzing()) {
            <div class="mt-2 grid grid-cols-2 gap-2">
              <button
                type="button"
                (click)="selectVariant('original')"
                [class]="photoVariant() === 'original'
                  ? 'flex items-center justify-center gap-1.5 rounded-lg border border-accent bg-accent-soft px-3 py-2 text-xs font-medium text-accent'
                  : 'flex items-center justify-center gap-1.5 rounded-lg border border-line px-3 py-2 text-xs font-medium text-muted hover:border-accent/50 hover:text-ink'"
              >
                <ui-icon name="camera" [size]="14" /> Original
              </button>
              <button
                type="button"
                (click)="selectVariant('cutout')"
                [class]="photoVariant() === 'cutout'
                  ? 'flex items-center justify-center gap-1.5 rounded-lg border border-accent bg-accent-soft px-3 py-2 text-xs font-medium text-accent'
                  : 'flex items-center justify-center gap-1.5 rounded-lg border border-line px-3 py-2 text-xs font-medium text-muted hover:border-accent/50 hover:text-ink'"
              >
                <ui-icon name="scissors" [size]="14" /> Cutout
              </button>
            </div>
          }

          @if (!analyzing()) {
            @if (aiMatchCount() > 0) {
              <div class="mt-2 flex items-center gap-1.5 rounded-lg bg-accent-soft px-3 py-2">
                <ui-icon name="sparkles" [size]="14" class="text-accent" />
                <span class="text-xs font-medium text-accent">
                  AI matched {{ aiMatchCount() }} item{{ aiMatchCount() === 1 ? '' : 's' }} from your wardrobe
                </span>
              </div>
            }
            @if (cutoutError()) {
              <p class="mt-1 text-xs text-faint">Cutout unavailable; original kept.</p>
            }
          }

          <div class="mt-2 flex gap-3">
            <button type="button" (click)="fileInput.click()" class="text-xs text-accent hover:underline">
              Change photo
            </button>
            <button type="button" (click)="removePhoto()" class="text-xs text-faint hover:text-red-500">
              Remove
            </button>
          </div>
        } @else {
          <button
            type="button"
            (click)="fileInput.click()"
            class="mt-1 flex w-full flex-col items-center gap-2 rounded-xl border border-dashed border-line py-8 text-sm text-muted transition hover:border-accent/50 hover:text-ink"
          >
            <ui-icon name="camera" [size]="22" />
            @if (initial()) { Upload a photo } @else { Upload photo — AI identifies your items }
          </button>
        }
      </div>

      <!-- ── Garment picker ─────────────────────────────────────────────── -->
      <div>
        <div class="mb-1.5 flex items-baseline justify-between">
          <label [class]="LABEL" class="!mb-0">Items ({{ selected().size }} selected)</label>
          @if (aiMatchCount() > 0) {
            <span class="text-xs text-accent">
              <ui-icon name="sparkles" [size]="11" /> AI pre-selected
            </span>
          }
        </div>

        @if (garments().length === 0) {
          <p class="text-sm text-muted">No items in wardrobe — add garments first.</p>
        } @else {
          <div class="relative mb-2">
            <ui-icon name="search" [size]="14" class="absolute left-3 top-1/2 -translate-y-1/2 text-faint" />
            <input
              type="text"
              [class]="FIELD + ' pl-8'"
              placeholder="Filter items…"
              [value]="filterText()"
              (input)="filterText.set($any($event.target).value)"
            />
          </div>

          <div class="flex max-h-64 flex-col gap-0.5 overflow-y-auto rounded-xl border border-line p-1.5">
            @for (g of filteredGarments(); track g.id) {
              <label
                class="flex cursor-pointer items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm transition-colors hover:bg-canvas"
                [class.bg-accent-soft]="selected().has(g.id)"
              >
                <input type="checkbox" class="accent-accent" [checked]="selected().has(g.id)" (change)="toggle(g.id)" />
                @if (g.imageUrl) {
                  <img [src]="g.imageUrl" [alt]="g.name" class="h-9 w-9 rounded-lg object-cover" />
                } @else {
                  <span
                    class="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-line"
                    [style.background-color]="g.colorHex || '#e7e5e4'"
                  ></span>
                }
                <div class="min-w-0 flex-1">
                  <p class="truncate font-medium text-ink">{{ g.name }}</p>
                  <p class="text-xs text-muted">{{ g.category | titlecase }}
                    @if (g.brand) { · {{ g.brand }} }
                  </p>
                </div>
                @if (aiMatchedIds().has(g.id)) {
                  <ui-icon name="sparkles" [size]="13" class="shrink-0 text-accent" />
                }
              </label>
            } @empty {
              <p class="px-2.5 py-3 text-sm text-muted">No items match "{{ filterText() }}"</p>
            }
          </div>
        }
      </div>

      <!-- ── Name ──────────────────────────────────────────────────────── -->
      <div>
        <label [class]="LABEL" for="name">Name</label>
        <input id="name" [class]="FIELD" formControlName="name" placeholder="Casual Friday" />
        @if (form.controls.name.touched && form.controls.name.invalid) {
          <p class="mt-1 text-xs text-red-600">Name is required.</p>
        }
      </div>

      <!-- ── Season / Occasion ─────────────────────────────────────────── -->
      <div class="grid grid-cols-2 gap-3">
        <div>
          <label [class]="LABEL" for="season">Season</label>
          <select id="season" [class]="FIELD" formControlName="season">
            <option value="">—</option>
            @for (s of seasons; track s) {
              <option [value]="s">{{ formatLabel(s) }}</option>
            }
          </select>
        </div>
        <div>
          <label [class]="LABEL" for="occasion">Occasion</label>
          <select id="occasion" [class]="FIELD" formControlName="occasion">
            <option value="">—</option>
            @for (o of occasions; track o) {
              <option [value]="o">{{ o | titlecase }}</option>
            }
          </select>
        </div>
      </div>

      <!-- ── Notes ─────────────────────────────────────────────────────── -->
      <div>
        <label [class]="LABEL" for="notes">
          Notes <span class="font-normal text-faint">· optional</span>
        </label>
        <textarea id="notes" rows="2" [class]="FIELD" formControlName="notes" placeholder="When or how to wear this…"></textarea>
      </div>

      <!-- ── Actions ───────────────────────────────────────────────────── -->
      <div class="flex justify-end gap-2 pt-1">
        <button type="button" appBtn variant="outline" (click)="cancelled.emit()">Cancel</button>
        <button type="submit" appBtn variant="primary">
          {{ initial() ? 'Save changes' : 'Create outfit' }}
        </button>
      </div>
    </form>
  `,
})
export class OutfitFormComponent {
  private readonly fb = inject(FormBuilder);
  private readonly api = inject(OutfitApi);

  readonly garments = input.required<Garment[]>();
  readonly initial = input<Outfit | null>(null);
  readonly save = output<OutfitInput>();
  readonly cancelled = output<void>();

  protected readonly seasons = SEASONS;
  protected readonly occasions = OCCASIONS;
  protected readonly FIELD = FIELD;
  protected readonly LABEL = LABEL;

  protected readonly selected = signal<Set<number>>(new Set());
  protected readonly aiMatchedIds = signal<Set<number>>(new Set());
  protected readonly filterText = signal('');

  protected readonly imageUrl = signal<string | null | undefined>(undefined);
  protected readonly imagePreview = signal<string | null>(null);
  protected readonly originalImageUrl = signal<string | null>(null);
  protected readonly cutoutImageUrl = signal<string | null>(null);
  protected readonly cutoutError = signal<string | null>(null);
  protected readonly photoVariant = signal<PhotoVariant>('original');
  protected readonly analyzing = signal(false);
  protected readonly aiMatchCount = signal(0);

  protected readonly filteredGarments = computed(() => {
    const q = this.filterText().toLowerCase().trim();
    if (!q) return this.garments();
    return this.garments().filter(
      (g) =>
        g.name.toLowerCase().includes(q) ||
        g.category.toLowerCase().includes(q) ||
        (g.brand?.toLowerCase().includes(q) ?? false),
    );
  });

  protected readonly form = this.fb.nonNullable.group({
    name: ['', Validators.required],
    season: [''],
    occasion: [''],
    notes: [''],
  });

  constructor() {
    effect(() => {
      const o = this.initial();
      if (!o) return;
      this.form.patchValue({
        name: o.name,
        season: o.season ?? '',
        occasion: o.occasion ?? '',
        notes: o.notes ?? '',
      });
      this.selected.set(new Set(o.garments.map((g) => g.id)));
      if (o.imageUrl) {
        this.imageUrl.set(o.imageUrl);
        this.imagePreview.set(o.imageUrl);
        this.originalImageUrl.set(o.imageUrl);
      }
    });
  }

  protected toggle(id: number): void {
    this.selected.update((set) => {
      const next = new Set(set);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  protected formatLabel(s: string): string {
    return s.replace('_', ' ').replace(/\b\w/g, (c) => c.toUpperCase());
  }

  protected selectVariant(variant: PhotoVariant): void {
    const url = variant === 'cutout' ? this.cutoutImageUrl() : this.originalImageUrl();
    if (!url) return;
    this.photoVariant.set(variant);
    this.imageUrl.set(url);
    this.imagePreview.set(url);
  }

  protected removePhoto(): void {
    this.imageUrl.set(null);
    this.imagePreview.set(null);
    this.originalImageUrl.set(null);
    this.cutoutImageUrl.set(null);
    this.cutoutError.set(null);
    this.photoVariant.set('original');
    this.analyzing.set(false);
    this.aiMatchCount.set(0);
    this.aiMatchedIds.set(new Set());
  }

  protected onFileSelected(input: HTMLInputElement): void {
    const file = input.files?.[0];
    if (!file) return;

    const localUrl = URL.createObjectURL(file);
    this.imagePreview.set(localUrl);
    this.imageUrl.set(undefined);
    this.originalImageUrl.set(null);
    this.cutoutImageUrl.set(null);
    this.cutoutError.set(null);
    this.photoVariant.set('original');
    this.analyzing.set(true);
    this.aiMatchCount.set(0);
    this.aiMatchedIds.set(new Set());

    this.api.analyzeOutfitPhoto(file).subscribe({
      next: (analysis) => {
        this.analyzing.set(false);
        const original = analysis.originalImageUrl;
        this.originalImageUrl.set(original);
        this.cutoutImageUrl.set(analysis.cutoutImageUrl);
        this.cutoutError.set(analysis.cutoutError);
        if (original) {
          this.imageUrl.set(original);
          this.imagePreview.set(original);
        }
        if (analysis.matchedGarmentIds.length > 0) {
          const matchedSet = new Set(analysis.matchedGarmentIds);
          this.aiMatchedIds.set(matchedSet);
          this.selected.update((cur) => {
            const next = new Set(cur);
            for (const id of matchedSet) next.add(id);
            return next;
          });
          this.aiMatchCount.set(analysis.matchedGarmentIds.length);
        }
      },
      error: () => this.analyzing.set(false),
    });

    input.value = '';
  }

  protected submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const v = this.form.getRawValue();
    this.save.emit({
      name: v.name.trim(),
      season: v.season || null,
      occasion: v.occasion || null,
      notes: v.notes.trim() || null,
      garmentIds: [...this.selected()],
      // undefined = not changed (backend skips it); null = explicitly removed
      imageUrl: this.imageUrl() !== undefined ? (this.imageUrl() ?? null) : undefined,
    });
  }
}
