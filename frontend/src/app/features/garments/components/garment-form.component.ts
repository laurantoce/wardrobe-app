import { ChangeDetectionStrategy, Component, effect, inject, input, output } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { TitleCasePipe } from '@angular/common';

import { ButtonDirective } from '../../../shared/ui/button.directive';
import { COLOR_PALETTE, PaletteColor } from '../../../shared/colors';
import { Garment, GARMENT_CATEGORIES, GarmentInput } from '../data/garment.models';

const FIELD =
  'w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm text-ink ' +
  'placeholder:text-faint focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20';
const LABEL = 'block text-xs font-medium text-muted mb-1.5';

@Component({
  selector: 'app-garment-form',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, ButtonDirective, TitleCasePipe],
  template: `
    <form [formGroup]="form" (ngSubmit)="submit()" class="flex flex-col gap-4">
      <div>
        <label [class]="LABEL" for="name">Name</label>
        <input id="name" [class]="FIELD" formControlName="name" placeholder="Black Tee" />
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

      <!-- Color: curated palette + custom fallback -->
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
              [class]="
                isSelected(c)
                  ? 'border-accent ring-2 ring-accent/40'
                  : 'border-line'
              "
            ></button>
          }
          <label
            class="flex h-7 w-7 cursor-pointer items-center justify-center rounded-full border border-dashed border-faint text-faint"
            title="Custom color"
          >
            +
            <input
              type="color"
              class="absolute h-0 w-0 opacity-0"
              (input)="selectCustom($any($event.target).value)"
            />
          </label>
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
            Purchase date <span class="font-normal text-faint">· optional</span>
          </label>
          <input
            id="date"
            type="date"
            formControlName="purchaseDate"
            [class]="FIELD + (form.controls.purchaseDate.value ? '' : ' !text-faint')"
          />
        </div>
      </div>

      <div>
        <label [class]="LABEL" for="notes">Notes</label>
        <textarea id="notes" rows="2" [class]="FIELD" formControlName="notes"></textarea>
      </div>

      <div class="flex justify-end gap-2 pt-1">
        <button type="button" appBtn variant="outline" (click)="cancelled.emit()">
          Cancel
        </button>
        <button type="submit" appBtn variant="primary">
          {{ initial() ? 'Save changes' : 'Add item' }}
        </button>
      </div>
    </form>
  `,
})
export class GarmentFormComponent {
  private readonly fb = inject(FormBuilder);

  readonly initial = input<Garment | null>(null);
  readonly save = output<GarmentInput>();
  readonly cancelled = output<void>();

  protected readonly categories = GARMENT_CATEGORIES;
  protected readonly palette = COLOR_PALETTE;
  protected readonly FIELD = FIELD;
  protected readonly LABEL = LABEL;

  protected readonly form = this.fb.nonNullable.group({
    name: ['', Validators.required],
    category: ['top', Validators.required],
    colorHex: ['#1c1917'],
    colorName: ['Black'],
    brand: [''],
    purchaseDate: [''],
    purchasePrice: [''],
    notes: [''],
  });

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
        purchaseDate: g.purchaseDate ?? '',
        purchasePrice: g.purchasePrice != null ? String(g.purchasePrice) : '',
        notes: g.notes ?? '',
      });
    });
  }

  protected isSelected(c: PaletteColor): boolean {
    return this.form.controls.colorHex.value?.toLowerCase() === c.hex.toLowerCase();
  }

  protected selectColor(c: PaletteColor): void {
    this.form.patchValue({ colorHex: c.hex, colorName: c.name });
  }

  protected selectCustom(hex: string): void {
    this.form.patchValue({ colorHex: hex, colorName: 'Custom' });
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
      purchaseDate: v.purchaseDate || null,
      purchasePrice: v.purchasePrice === '' ? null : Number(v.purchasePrice),
      notes: v.notes.trim() || null,
    });
  }
}
