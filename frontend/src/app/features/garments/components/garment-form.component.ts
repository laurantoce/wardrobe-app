import { ChangeDetectionStrategy, Component, computed, effect, inject, input, output, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { TitleCasePipe } from '@angular/common';

import { ButtonDirective } from '../../../shared/ui/button.directive';
import { IconComponent } from '../../../shared/ui/icon.component';
import { COLOR_PALETTE, PaletteColor } from '../../../shared/colors';
import { Garment, GARMENT_CATEGORIES, GarmentInput, GarmentPhotoAnalysis, MaterialEntry, MATERIALS, OCCASIONS } from '../data/garment.models';
import { GarmentApi } from '../data/garment-api.service';

const FIELD =
  'w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm text-ink ' +
  'placeholder:text-faint focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20';
const LABEL = 'block text-xs font-medium text-muted mb-1.5';

const TYPE_HINTS: Record<string, string> = {
  top:       't-shirt, shirt, blouse, sweater, hoodie…',
  bottom:    'jeans, trousers, skirt, shorts, leggings…',
  shoes:     'sneakers, heels, boots, sandals, loafers…',
  outerwear: 'jacket, coat, blazer, parka…',
  dress:     'midi, maxi, mini, wrap, shift…',
  swimwear:  'bikini, swimsuit, trunks, coverup…',
  accessory: 'bag, scarf, hat, belt, jewelry…',
};

@Component({
  selector: 'app-garment-form',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, ButtonDirective, IconComponent, TitleCasePipe],
  template: `
    <form [formGroup]="form" (ngSubmit)="submit()" class="flex flex-col gap-4">

      <!-- Photo upload -->
      <div>
        <label [class]="LABEL">
          Photo <span class="font-normal text-faint">· optional · AI will pre-fill fields</span>
        </label>
        <input
          #fileInput
          type="file"
          accept="image/*"
          class="hidden"
          (change)="onFileSelected(fileInput)"
        />

        @if (imagePreview()) {
          <div class="relative overflow-hidden rounded-lg">
            <img
              [src]="imagePreview()"
              alt="Garment photo"
              class="max-h-52 w-full object-cover"
            />
            @if (analyzing()) {
              <div class="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-black/50">
                <div class="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                <span class="text-sm font-medium text-white">Analyzing…</span>
              </div>
            }
          </div>
          @if (aiFieldCount() > 0 && !analyzing()) {
            <p class="mt-1.5 text-xs text-faint">
              AI pre-filled {{ aiFieldCount() }} fields · review before saving
            </p>
          }
          <div class="mt-2 flex gap-3">
            <button
              type="button"
              (click)="fileInput.click()"
              class="text-xs text-accent hover:underline"
            >Change photo</button>
            <button
              type="button"
              (click)="removePhoto()"
              class="text-xs text-faint hover:text-red-500"
            >Remove</button>
          </div>
        } @else {
          <button
            type="button"
            (click)="fileInput.click()"
            class="mt-1 flex w-full flex-col items-center gap-2 rounded-lg border border-dashed border-line py-6 text-sm text-muted transition hover:border-accent/50 hover:text-ink"
          >
            <ui-icon name="camera" [size]="20" />
            Upload photo — AI fills the form
          </button>
        }
      </div>

      <div>
        <label [class]="LABEL" for="name">Name</label>
        <input id="name" [class]="FIELD" formControlName="name" placeholder="White Linen Shirt" />
        @if (form.controls.name.touched && form.controls.name.invalid) {
          <p class="mt-1 text-xs text-red-600">Name is required.</p>
        }
      </div>

      <div class="grid grid-cols-2 gap-3">
        <div>
          <label [class]="LABEL" for="category">Category</label>
          <select id="category" [class]="FIELD" formControlName="category">
            @for (c of categories; track c) {
              <option [value]="c">{{ c | titlecase }}</option>
            }
          </select>
        </div>
        <div>
          <label [class]="LABEL" for="brand">Brand</label>
          <input id="brand" [class]="FIELD" formControlName="brand" placeholder="Uniqlo" />
        </div>
      </div>

      <div>
        <label [class]="LABEL" for="subType">
          Type <span class="font-normal text-faint">· optional</span>
        </label>
        <input
          id="subType"
          [class]="FIELD"
          formControlName="subType"
          [placeholder]="typePlaceholder()"
        />
      </div>

      <!-- Color — curated palette only, no custom picker -->
      <div>
        <label [class]="LABEL">
          Color
          @if (form.controls.colorName.value) {
            <span class="text-ink">· {{ form.controls.colorName.value }}</span>
          }
        </label>
        <div class="flex flex-wrap gap-1.5">
          @for (c of palette; track c.hex) {
            <button
              type="button"
              (click)="selectColor(c)"
              [title]="c.name"
              class="h-7 w-7 rounded-full border transition-transform hover:scale-110 [box-shadow:inset_0_0_0_1px_#0000001a]"
              [style.background-color]="c.hex"
              [class]="isSelected(c) ? 'border-accent ring-2 ring-accent/40' : 'border-line'"
            ></button>
          }
        </div>
      </div>

      <div class="grid grid-cols-2 gap-3">
        <div>
          <label [class]="LABEL" for="price">Price (€)</label>
          <input
            id="price"
            type="number"
            min="0"
            step="0.01"
            [class]="FIELD"
            formControlName="purchasePrice"
            placeholder="25.00"
          />
        </div>
        <div>
          <label [class]="LABEL" for="date">
            Date <span class="font-normal text-faint">· optional</span>
          </label>
          <input
            id="date"
            type="date"
            formControlName="purchaseDate"
            [class]="FIELD + (form.controls.purchaseDate.value ? '' : ' !text-faint')"
          />
        </div>
      </div>

      <!-- Occasion — single select, tap again to clear -->
      <div>
        <label [class]="LABEL">
          Occasion <span class="font-normal text-faint">· optional</span>
        </label>
        <div class="flex flex-wrap gap-1.5">
          @for (o of occasions; track o) {
            <button
              type="button"
              (click)="toggleOccasion(o)"
              class="rounded-full border px-3 py-1 text-xs font-medium capitalize transition-colors"
              [class]="
                form.controls.occasion.value === o
                  ? 'border-accent bg-accent-soft text-accent'
                  : 'border-line text-muted hover:border-accent/50 hover:text-ink'
              "
            >{{ o }}</button>
          }
        </div>
      </div>

      <!-- Material — click chips to add, then enter % per entry -->
      <div>
        <label [class]="LABEL">
          Material <span class="font-normal text-faint">· select all that apply</span>
        </label>

        <!-- Unselected chips -->
        <div class="flex flex-wrap gap-1.5">
          @for (m of unselectedMaterials(); track m) {
            <button
              type="button"
              (click)="addMaterial(m)"
              class="rounded-full border border-line px-3 py-1 text-xs font-medium capitalize text-muted transition-colors hover:border-accent/50 hover:text-ink"
            >{{ m }}</button>
          }
        </div>

        <!-- Selected entries with optional % -->
        @if (selectedMaterials().length > 0) {
          <div class="mt-3 flex flex-col gap-2">
            @for (entry of selectedMaterials(); track entry.material; let i = $index) {
              <div class="flex items-center gap-2 text-sm">
                <span
                  class="min-w-20 flex-1 font-medium capitalize text-accent"
                >{{ entry.material }}</span>
                <input
                  type="number"
                  min="0"
                  max="100"
                  placeholder="—"
                  [value]="entry.pct ?? ''"
                  (input)="updatePct(i, $any($event.target).value)"
                  class="w-16 rounded-lg border border-line bg-surface px-2 py-1 text-right text-sm text-ink placeholder:text-faint focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
                />
                <span class="text-muted">%</span>
                <button
                  type="button"
                  (click)="removeMaterial(i)"
                  class="text-lg leading-none text-faint hover:text-accent"
                  aria-label="Remove"
                >×</button>
              </div>
            }
            @if (pctTotal() > 0) {
              <p
                class="text-xs"
                [class]="pctTotal() === 100 ? 'text-faint' : 'text-muted'"
              >Total: {{ pctTotal() }}%</p>
            }
          </div>
        }
      </div>

      <div>
        <label [class]="LABEL" for="notes">Notes</label>
        <textarea id="notes" rows="2" [class]="FIELD" formControlName="notes"></textarea>
      </div>

      <div class="flex justify-end gap-2 pt-1">
        <button type="button" appBtn variant="outline" (click)="cancelled.emit()">Cancel</button>
        <button type="submit" appBtn variant="primary">
          {{ initial() ? 'Save changes' : 'Add item' }}
        </button>
      </div>
    </form>
  `,
})
export class GarmentFormComponent {
  private readonly fb = inject(FormBuilder);
  private readonly api = inject(GarmentApi);

  readonly initial = input<Garment | null>(null);
  readonly save = output<GarmentInput>();
  readonly cancelled = output<void>();

  protected readonly categories = GARMENT_CATEGORIES;
  protected readonly occasions = OCCASIONS;
  protected readonly materials = MATERIALS;
  protected readonly FIELD = FIELD;
  protected readonly LABEL = LABEL;

  protected readonly palette = COLOR_PALETTE;
  protected readonly selectedMaterials = signal<MaterialEntry[]>([]);

  // Photo state
  protected readonly imageUrl = signal<string | null | undefined>(undefined);
  protected readonly imagePreview = signal<string | null>(null);
  protected readonly analyzing = signal(false);
  protected readonly aiFieldCount = signal(0);

  protected readonly form = this.fb.nonNullable.group({
    name: ['', Validators.required],
    category: ['top', Validators.required],
    colorHex: ['#1c1917'],
    colorName: ['Black'],
    brand: [''],
    subType: [''],
    purchaseDate: [''],
    purchasePrice: [''],
    notes: [''],
    occasion: ['' as string],
  });

  private readonly categoryValue = toSignal(
    this.form.controls.category.valueChanges,
    { initialValue: this.form.controls.category.value },
  );

  protected readonly typePlaceholder = computed(
    () => TYPE_HINTS[this.categoryValue()] ?? 'e.g. t-shirt, sneakers, blazer…',
  );

  protected readonly unselectedMaterials = computed(() => {
    const picked = new Set(this.selectedMaterials().map((e) => e.material));
    return MATERIALS.filter((m) => !picked.has(m));
  });

  protected readonly pctTotal = computed(() =>
    this.selectedMaterials().reduce((sum, e) => sum + (e.pct ?? 0), 0),
  );

  constructor() {
    effect(() => {
      const g = this.initial();
      if (!g) return;
      this.form.patchValue({
        name: g.name,
        category: g.category,
        colorHex: g.colorHex ?? '#1c1917',
        colorName: g.colorName ?? '',
        brand: g.brand ?? '',
        subType: g.subType ?? '',
        purchaseDate: g.purchaseDate ?? '',
        purchasePrice: g.purchasePrice != null ? String(g.purchasePrice) : '',
        notes: g.notes ?? '',
        occasion: g.occasion ?? '',
      });
      this.selectedMaterials.set(g.material ?? []);
      this.imageUrl.set(g.imageUrl ?? null);
      this.imagePreview.set(g.imageUrl ?? null);
    });
  }

  protected isSelected(c: PaletteColor): boolean {
    return this.form.controls.colorHex.value?.toLowerCase() === c.hex.toLowerCase();
  }

  protected selectColor(c: PaletteColor): void {
    this.form.patchValue({ colorHex: c.hex, colorName: c.name });
  }

  protected toggleOccasion(value: string): void {
    const current = this.form.controls.occasion.value;
    this.form.controls.occasion.setValue(current === value ? '' : value);
  }

  protected addMaterial(mat: string): void {
    this.selectedMaterials.update((list) => [...list, { material: mat, pct: null }]);
  }

  protected removeMaterial(index: number): void {
    this.selectedMaterials.update((list) => list.filter((_, i) => i !== index));
  }

  protected updatePct(index: number, value: string): void {
    const pct = value === '' ? null : Math.min(100, Math.max(0, Math.round(Number(value))));
    this.selectedMaterials.update((list) =>
      list.map((e, i) => (i === index ? { ...e, pct } : e)),
    );
  }

  protected removePhoto(): void {
    this.imageUrl.set(null);
    this.imagePreview.set(null);
    this.aiFieldCount.set(0);
  }

  protected onFileSelected(input: HTMLInputElement): void {
    const file = input.files?.[0];
    if (!file) return;

    const localUrl = URL.createObjectURL(file);
    this.imagePreview.set(localUrl);
    this.analyzing.set(true);
    this.aiFieldCount.set(0);

    this.api.analyzePhoto(file).subscribe({
      next: (analysis) => {
        this.analyzing.set(false);
        if (analysis.imageUrl) {
          this.imageUrl.set(analysis.imageUrl);
          this.imagePreview.set(analysis.imageUrl);
        }
        this.applyAnalysis(analysis);
      },
      error: () => {
        this.analyzing.set(false);
        // Keep local preview; analysis failed, don't pre-fill
      },
    });

    // Reset so the same file can be re-selected
    input.value = '';
  }

  private applyAnalysis(a: GarmentPhotoAnalysis): void {
    let count = 0;
    const patch: Record<string, unknown> = {};

    if (a.name)     { patch['name']          = a.name;            count++; }
    if (a.category) { patch['category']       = a.category;        count++; }
    if (a.brand)    { patch['brand']          = a.brand;           count++; }
    if (a.subType)  { patch['subType']        = a.subType;         count++; }
    if (a.occasion) { patch['occasion']       = a.occasion;        count++; }
    if (a.notes)    { patch['notes']          = a.notes;           count++; }
    if (a.purchasePrice != null) {
      patch['purchasePrice'] = String(a.purchasePrice);
      count++;
    }
    if (a.colorName) {
      const color = COLOR_PALETTE.find(
        (c) => c.name.toLowerCase() === a.colorName!.toLowerCase(),
      );
      if (color) {
        patch['colorHex']  = color.hex;
        patch['colorName'] = color.name;
        count++;
      }
    }
    if (a.material?.length) {
      this.selectedMaterials.set(a.material);
      count++;
    }

    this.form.patchValue(patch as Parameters<typeof this.form.patchValue>[0]);
    this.aiFieldCount.set(count);
  }

  protected submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const v = this.form.getRawValue();
    this.save.emit({
      name: v.name.trim(),
      category: v.category,
      colorHex: v.colorHex || null,
      colorName: v.colorName || null,
      brand: v.brand.trim() || null,
      subType: v.subType.trim() || null,
      purchaseDate: v.purchaseDate || null,
      purchasePrice: v.purchasePrice === '' ? null : Number(v.purchasePrice),
      notes: v.notes.trim() || null,
      occasion: v.occasion || null,
      material: this.selectedMaterials().length > 0 ? this.selectedMaterials() : null,
      imageUrl: this.imageUrl() !== undefined ? this.imageUrl() : undefined,
    });
  }
}
