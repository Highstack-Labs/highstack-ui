import { Component, booleanAttribute, computed, input, numberAttribute } from '@angular/core';

export type LoadingSize = 'sm' | 'md' | 'lg';

/** Indicador giratorio. Hereda el color (currentColor). */
@Component({
  selector: 'ui-spinner',
  template: `
    <svg
      [attr.width]="px()"
      [attr.height]="px()"
      class="animate-spin"
      viewBox="0 0 24 24"
      fill="none"
      [attr.aria-label]="'Cargando'"
      role="status"
    >
      <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
      <path class="opacity-90" fill="currentColor" d="M4 12a8 8 0 0 1 8-8V0C5.37 0 0 5.37 0 12h4z"></path>
    </svg>
  `,
  host: { class: 'inline-flex' },
})
export class SpinnerComponent {
  readonly size = input<LoadingSize>('md');
  protected readonly px = computed(() => ({ sm: 16, md: 24, lg: 36 })[this.size()]);
}

/** Placeholder con pulso mientras carga el contenido real. */
@Component({
  selector: 'ui-skeleton',
  template: '',
  host: {
    class: 'block animate-pulse bg-[var(--color-muted)]',
    '[class.rounded-full]': 'circle()',
    '[class.rounded-md]': '!circle()',
    '[style.width]': 'width()',
    '[style.height]': 'height()',
  },
})
export class SkeletonComponent {
  readonly width = input<string>('100%');
  readonly height = input<string>('1rem');
  readonly circle = input(false, { transform: booleanAttribute });
}

/** Barra de progreso (determinada con value 0-100, o indeterminada). */
@Component({
  selector: 'ui-progress',
  template: `
    <div
      class="h-full rounded-full bg-[var(--color-primary)] transition-[width] duration-300"
      [class.animate-progress-indeterminate]="indeterminate()"
      [class.w-2/5]="indeterminate()"
      [style.width.%]="indeterminate() ? null : clamped()"
    ></div>
  `,
  host: {
    role: 'progressbar',
    class: 'block w-full overflow-hidden rounded-full bg-[var(--color-muted)]',
    '[class.h-1]': "size() === 'sm'",
    '[class.h-2]': "size() === 'md'",
    '[class.h-3]': "size() === 'lg'",
    '[attr.aria-valuenow]': 'indeterminate() ? null : clamped()',
    '[attr.aria-valuemin]': '0',
    '[attr.aria-valuemax]': '100',
  },
})
export class ProgressComponent {
  readonly value = input(0, { transform: numberAttribute });
  readonly size = input<LoadingSize>('md');
  readonly indeterminate = input(false, { transform: booleanAttribute });

  protected readonly clamped = computed(() => Math.max(0, Math.min(100, this.value())));
}
