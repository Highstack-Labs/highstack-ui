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
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

export type RadioSize = 'sm' | 'md';
export type RadioOrientation = 'vertical' | 'horizontal';
export type RadioAppearance = 'default' | 'card';

interface RadioValidationError {
  kind?: string;
  message?: string;
}

let nextId = 0;

/**
 * Grupo de selección única. El valor vive aquí. Funciona con Signal Forms
 * (`[formField]`, FormValueControl), ControlValueAccessor y two-way `[(value)]`.
 * Los ui-radio hijos lo inyectan por DI.
 */
@Component({
  selector: 'ui-radio-group',
  template: `<ng-content />`,
  host: { role: 'radiogroup', '[class]': 'hostClasses()' },
  providers: [
    { provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => RadioGroupComponent), multi: true },
  ],
})
export class RadioGroupComponent implements ControlValueAccessor {
  readonly value = model<string>('');

  readonly size = input<RadioSize>('md');
  readonly orientation = input<RadioOrientation>('vertical');
  readonly appearance = input<RadioAppearance>('default');
  readonly name = input<string>(`ui-radio-group-${nextId++}`);

  readonly disabled = input(false, { transform: booleanAttribute });
  readonly required = input(false, { transform: booleanAttribute });
  readonly invalid = input(false, { transform: booleanAttribute });
  readonly touched = input(false, { transform: booleanAttribute });
  readonly errors = input<readonly RadioValidationError[]>([]);

  private readonly cvaDisabled = signal(false);
  readonly isDisabled = computed(() => this.disabled() || this.cvaDisabled());

  readonly errorMessage = computed(() => {
    if (this.touched()) {
      const first = this.errors()[0];
      if (first) return first.message ?? first.kind ?? 'Campo inválido';
    }
    return '';
  });
  readonly hasError = computed(() => !!this.errorMessage() || (this.invalid() && this.touched()));

  protected readonly hostClasses = computed(() => {
    const dir =
      this.orientation() === 'horizontal' ? 'flex flex-row flex-wrap gap-3' : 'flex flex-col gap-3';
    return dir;
  });

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

  /** Llamado por un ui-radio hijo al seleccionarse. */
  select(value: string) {
    this.value.set(value);
    this.onChange(value);
    this.onTouched();
  }
}

/** Una opción dentro de ui-radio-group. */
@Component({
  selector: 'ui-radio',
  templateUrl: './radio.component.html',
  host: { class: 'block' },
})
export class RadioComponent {
  protected readonly group = inject(RadioGroupComponent);

  readonly value = input.required<string>();
  readonly label = input<string>('');
  readonly description = input<string>('');
  readonly disabled = input(false, { transform: booleanAttribute });

  protected readonly id = `ui-radio-${nextId++}`;

  protected readonly checked = computed(() => this.group.value() === this.value());
  protected readonly isDisabled = computed(() => this.group.isDisabled() || this.disabled());

  protected readonly circleClasses = computed(() => {
    const sizeMap: Record<RadioSize, string> = { sm: 'size-4', md: 'size-5' };
    const base =
      'shrink-0 flex items-center justify-center rounded-full border transition-all peer-focus-visible:ring-[3px] peer-focus-visible:ring-[var(--color-ring)]/40';
    const state = this.checked()
      ? 'border-[var(--color-primary)]'
      : this.group.hasError()
        ? 'border-[var(--color-destructive)]'
        : 'border-[var(--color-input)]';
    const disabled = this.isDisabled() ? 'opacity-50' : '';
    return [base, sizeMap[this.group.size()], state, disabled].join(' ');
  });

  protected readonly dotClasses = computed(() => {
    const sizeMap: Record<RadioSize, string> = { sm: 'size-1.5', md: 'size-2' };
    return `rounded-full bg-[var(--color-primary)] ${sizeMap[this.group.size()]}`;
  });

  protected readonly cardClasses = computed(() => {
    const base = 'rounded-[var(--radius)] border p-4 transition-all';
    const state = this.checked()
      ? 'border-[var(--color-primary)] ring-1 ring-[var(--color-primary)] bg-[var(--color-primary)]/5'
      : 'border-[var(--color-border)] hover:border-[var(--color-muted-foreground)]/40';
    const disabled = this.isDisabled() ? 'opacity-50' : '';
    return [base, state, disabled].join(' ');
  });

  protected onSelect() {
    if (!this.isDisabled()) this.group.select(this.value());
  }
}
