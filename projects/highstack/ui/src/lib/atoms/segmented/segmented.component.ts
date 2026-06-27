import {
  Component,
  booleanAttribute,
  computed,
  forwardRef,
  inject,
  input,
  model,
  signal,
} from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

export type SegmentedSize = 'sm' | 'md';

export interface SegmentedOption {
  value: string;
  label: string;
  /** SVG inline opcional mostrado a la izquierda del label. */
  icon?: string;
  disabled?: boolean;
}

interface SegmentedValidationError {
  kind?: string;
  message?: string;
}

let nextId = 0;

/**
 * Control de selección única con apariencia de botones conectados (segmented
 * control). Data-driven vía `options`. Funciona con Signal Forms (`[formField]`,
 * FormValueControl), ControlValueAccessor (ngModel/Reactive) y two-way `[(value)]`.
 */
@Component({
  selector: 'ui-segmented',
  templateUrl: './segmented.component.html',
  host: { class: 'block' },
  providers: [
    { provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => SegmentedComponent), multi: true },
  ],
})
export class SegmentedComponent implements ControlValueAccessor {
  private readonly sanitizer = inject(DomSanitizer);

  /** Fuente única de verdad del valor (Signal Forms + two-way). */
  readonly value = model<string>('');

  readonly options = input<readonly SegmentedOption[]>([]);
  readonly size = input<SegmentedSize>('md');
  readonly fullWidth = input(false, { transform: booleanAttribute });
  readonly name = input<string>(`ui-segmented-${nextId++}`);

  readonly disabled = input(false, { transform: booleanAttribute });
  readonly required = input(false, { transform: booleanAttribute });
  readonly invalid = input(false, { transform: booleanAttribute });
  readonly touched = input(false, { transform: booleanAttribute });
  readonly errors = input<readonly SegmentedValidationError[]>([]);

  private readonly cvaDisabled = signal(false);
  protected readonly isDisabled = computed(() => this.disabled() || this.cvaDisabled());

  protected readonly errorMessage = computed(() => {
    if (this.touched()) {
      const first = this.errors()[0];
      if (first) return first.message ?? first.kind ?? 'Campo inválido';
    }
    return '';
  });
  protected readonly hasError = computed(
    () => !!this.errorMessage() || (this.invalid() && this.touched()),
  );

  /** Cache de SVGs saneados para no rehacer el trabajo en cada CD. */
  private readonly safeIcons = new Map<string, SafeHtml>();
  protected safeIcon(icon: string): SafeHtml {
    let safe = this.safeIcons.get(icon);
    if (!safe) {
      safe = this.sanitizer.bypassSecurityTrustHtml(icon);
      this.safeIcons.set(icon, safe);
    }
    return safe;
  }

  protected readonly trackClasses = computed(() => {
    const sizeMap: Record<SegmentedSize, string> = {
      sm: 'h-8 p-0.5 gap-0.5 text-xs rounded-lg',
      md: 'h-9 p-1 gap-1 text-sm rounded-[10px]',
    };
    const layout = this.fullWidth() ? 'flex w-full' : 'inline-flex';
    const base = 'items-center border bg-[var(--color-muted)] transition-colors';
    const state = this.hasError()
      ? 'border-[var(--color-destructive)]'
      : 'border-transparent';
    const disabled = this.isDisabled() ? 'opacity-50 cursor-not-allowed' : '';
    return [layout, base, sizeMap[this.size()], state, disabled].join(' ');
  });

  protected segmentClasses(option: SegmentedOption): string {
    const active = this.value() === option.value;
    const optDisabled = this.isDisabled() || !!option.disabled;
    const base =
      'inline-flex items-center justify-center gap-1.5 px-3 h-full rounded-[7px] font-medium whitespace-nowrap transition-all outline-none focus-visible:ring-[3px] focus-visible:ring-[var(--color-ring)]/40';
    const grow = this.fullWidth() ? 'flex-1' : '';
    const state = active
      ? 'bg-[var(--color-background)] text-[var(--color-foreground)] shadow-sm'
      : 'text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)]';
    const disabled = optDisabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer';
    return [base, grow, state, disabled].join(' ');
  }

  protected isOptionDisabled(option: SegmentedOption): boolean {
    return this.isDisabled() || !!option.disabled;
  }

  // --- ControlValueAccessor ---
  private onChange: (value: string) => void = () => {};
  private onTouched: () => void = () => {};

  writeValue(value: string): void {
    this.value.set(value ?? '');
  }
  registerOnChange(fn: (value: string) => void): void {
    this.onChange = fn;
  }
  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }
  setDisabledState(isDisabled: boolean): void {
    this.cvaDisabled.set(isDisabled);
  }

  protected select(option: SegmentedOption) {
    if (this.isOptionDisabled(option)) return;
    this.value.set(option.value);
    this.onChange(option.value);
    this.onTouched();
  }
}
