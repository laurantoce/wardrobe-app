import { TitleCasePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, output } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';

import { ButtonDirective } from '../../../shared/ui/button.directive';
import { IconComponent } from '../../../shared/ui/icon.component';
import { AI_OCCASIONS, AI_SEASONS, SuggestionRequest } from '../data/ai.models';

const FIELD =
  'w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm text-ink ' +
  'placeholder:text-faint focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20';
const LABEL = 'block text-xs font-medium text-muted mb-1.5';

@Component({
  selector: 'app-suggestion-form',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, ButtonDirective, IconComponent, TitleCasePipe],
  template: `
    <form [formGroup]="form" (ngSubmit)="submit()" class="flex flex-col gap-4">
      <div class="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div>
          <label [class]="LABEL" for="occasion">Occasion</label>
          <select id="occasion" [class]="FIELD" formControlName="occasion">
            <option value="">Any</option>
            @for (o of occasions; track o) {
              <option [value]="o">{{ o | titlecase }}</option>
            }
          </select>
        </div>
        <div>
          <label [class]="LABEL" for="season">Season</label>
          <select id="season" [class]="FIELD" formControlName="season">
            <option value="">Any</option>
            @for (s of seasons; track s) {
              <option [value]="s">{{ s | titlecase }}</option>
            }
          </select>
        </div>
        <div>
          <label [class]="LABEL" for="maxOutfits">Suggestions</label>
          <select id="maxOutfits" [class]="FIELD" formControlName="maxOutfits">
            @for (n of [1, 2, 3, 4, 5]; track n) {
              <option [value]="n">{{ n }}</option>
            }
          </select>
        </div>
      </div>

      <div>
        <label [class]="LABEL" for="vibe">Vibe (optional)</label>
        <input
          id="vibe"
          [class]="FIELD"
          formControlName="vibe"
          placeholder="e.g. cozy weekend, smart casual dinner…"
        />
      </div>

      <div class="flex justify-end">
        <button type="submit" appBtn variant="primary">
          <ui-icon name="sparkles" [size]="16" />
          Generate suggestions
        </button>
      </div>
    </form>
  `,
})
export class SuggestionFormComponent {
  private readonly fb = inject(FormBuilder);

  readonly generate = output<SuggestionRequest>();

  protected readonly occasions = AI_OCCASIONS;
  protected readonly seasons = AI_SEASONS;
  protected readonly FIELD = FIELD;
  protected readonly LABEL = LABEL;

  protected readonly form = this.fb.nonNullable.group({
    occasion: [''],
    season: [''],
    vibe: [''],
    maxOutfits: [3],
  });

  protected submit(): void {
    const v = this.form.getRawValue();
    this.generate.emit({
      occasion: v.occasion || null,
      season: v.season || null,
      vibe: v.vibe.trim() || null,
      max_outfits: v.maxOutfits,
    });
  }
}
