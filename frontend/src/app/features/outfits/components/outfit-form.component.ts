import { ChangeDetectionStrategy, Component, inject, input, output, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { TitleCasePipe } from '@angular/common';

import { ButtonDirective } from '../../../shared/ui/button.directive';
import { Garment } from '../../garments/data/garment.models';
import { OCCASIONS, OutfitInput, SEASONS } from '../data/outfit.models';

const FIELD =
  'w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm text-ink ' +
  'placeholder:text-faint focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20';
const LABEL = 'block text-xs font-medium text-muted mb-1.5';

@Component({
  selector: 'app-outfit-form',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, ButtonDirective, TitleCasePipe],
  template: `
    <form [formGroup]="form" (ngSubmit)="submit()" class="flex flex-col gap-4">
      <div>
        <label [class]="LABEL" for="name">Name</label>
        <input id="name" [class]="FIELD" formControlName="name" placeholder="Casual Friday" />
        @if (form.controls.name.touched && form.controls.name.invalid) {
          <p class="mt-1 text-xs text-red-600">Name is required.</p>
        }
      </div>

      <div class="grid grid-cols-2 gap-3">
        <div>
          <label [class]="LABEL" for="season">Season</label>
          <select id="season" [class]="FIELD" formControlName="season">
            <option value="">—</option>
            @for (s of seasons; track s) {
              <option [value]="s">{{ label(s) }}</option>
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

      <div>
        <label [class]="LABEL">Items ({{ selected().size }} selected)</label>
        @if (garments().length === 0) {
          <p class="text-sm text-muted">No items available — add garments first.</p>
        } @else {
          <div class="flex max-h-56 flex-col gap-1 overflow-y-auto rounded-lg border border-line p-2">
            @for (g of garments(); track g.id) {
              <label
                class="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-canvas"
              >
                <input
                  type="checkbox"
                  class="accent-accent"
                  [checked]="selected().has(g.id)"
                  (change)="toggle(g.id)"
                />
                <span
                  class="h-3.5 w-3.5 rounded-full border border-line"
                  [style.background-color]="g.colorHex || '#ffffff'"
                ></span>
                <span class="truncate">{{ g.name }}</span>
                <span class="ml-auto text-xs text-muted">{{ g.category | titlecase }}</span>
              </label>
            }
          </div>
        }
      </div>

      <div class="flex justify-end gap-2 pt-1">
        <button type="button" appBtn variant="outline" (click)="cancelled.emit()">
          Cancel
        </button>
        <button type="submit" appBtn variant="primary">Create outfit</button>
      </div>
    </form>
  `,
})
export class OutfitFormComponent {
  private readonly fb = inject(FormBuilder);

  readonly garments = input.required<Garment[]>();
  readonly save = output<OutfitInput>();
  readonly cancelled = output<void>();

  protected readonly seasons = SEASONS;
  protected readonly occasions = OCCASIONS;
  protected readonly FIELD = FIELD;
  protected readonly LABEL = LABEL;
  protected readonly selected = signal<Set<number>>(new Set());

  protected readonly form = this.fb.nonNullable.group({
    name: ['', Validators.required],
    season: [''],
    occasion: [''],
  });

  protected toggle(id: number): void {
    this.selected.update((set) => {
      const next = new Set(set);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  protected label(s: string): string {
    return s.replace('_', ' ').replace(/\b\w/g, (c) => c.toUpperCase());
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
      garmentIds: [...this.selected()],
    });
  }
}
