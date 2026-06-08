import { computed, Directive, input } from '@angular/core';

export type ButtonVariant = 'primary' | 'outline' | 'ghost' | 'danger';
export type ButtonSize = 'sm' | 'md';

const BASE =
  'inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-colors ' +
  'disabled:opacity-50 disabled:pointer-events-none focus:outline-none ' +
  'focus-visible:ring-2 focus-visible:ring-accent/40 cursor-pointer select-none';

const SIZES: Record<ButtonSize, string> = {
  sm: 'h-8 px-3 text-xs',
  md: 'h-9 px-4 text-sm',
};

const VARIANTS: Record<ButtonVariant, string> = {
  primary: 'bg-accent text-white hover:bg-accent-strong',
  outline: 'border border-line bg-surface text-ink hover:bg-canvas',
  ghost: 'text-muted hover:text-ink hover:bg-accent-soft',
  danger: 'text-red-600 hover:bg-red-50',
};

/** Tailwind button styling as a directive, so native <button>/<a> semantics
 *  (type, disabled, routerLink) are preserved. */
@Directive({
  selector: 'button[appBtn], a[appBtn]',
  host: { '[class]': 'classes()' },
})
export class ButtonDirective {
  readonly variant = input<ButtonVariant>('primary');
  readonly size = input<ButtonSize>('md');

  protected readonly classes = computed(
    () => `${BASE} ${SIZES[this.size()]} ${VARIANTS[this.variant()]}`,
  );
}
