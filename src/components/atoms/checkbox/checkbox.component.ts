import {
  Component,
  booleanAttribute,
  computed,
  forwardRef,
  input,
  model,
  signal,
} from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

export type CheckboxSize = 'sm' | 'md';

interface CheckboxValidationError {
  kind?: string;
  message?: string;
}

let nextId = 0;

/**
 * Casilla de verificación. Funciona con Signal Forms (`[formField]`, contrato
 * FormCheckboxControl), ControlValueAccessor (ngModel/Reactive) y two-way `[(checked)]`.
 */
@Component({
  selector: 'ui-checkbox',
  templateUrl: './checkbox.component.html',
  host: { class: 'block' },
  providers: [
    { provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => CheckboxComponent), multi: true },
  ],
})
export class CheckboxComponent implements ControlValueAccessor {
  /** Fuente única de verdad (Signal Forms usa `checked` para checkboxes). */
  readonly checked = model<boolean>(false);

  readonly label = input<string>('');
  /** Texto secundario en línea, debajo del label y junto a la casilla. */
  readonly description = input<string>('');
  /** Texto de ayuda debajo de todo el control (mismo lugar que en input/select). */
  readonly hint = input<string>('');
  readonly size = input<CheckboxSize>('md');
  readonly id = input<string>(`ui-checkbox-${nextId++}`);
  readonly name = input<string>('');

  readonly disabled = input(false, { transform: booleanAttribute });
  readonly required = input(false, { transform: booleanAttribute });
  readonly indeterminate = input(false, { transform: booleanAttribute });

  /** Mensaje de error manual (tiene prioridad sobre los errors de Signal Forms). */
  readonly error = input<string>('');
  readonly invalid = input(false, { transform: booleanAttribute });
  readonly touched = input(false, { transform: booleanAttribute });
  readonly errors = input<readonly CheckboxValidationError[]>([]);

  private readonly cvaDisabled = signal(false);
  protected readonly isDisabled = computed(() => this.disabled() || this.cvaDisabled());

  protected readonly errorMessage = computed(() => {
    if (this.error()) return this.error();
    // Los errores de validación (Signal Forms) solo se muestran tras interactuar.
    if (this.touched()) {
      const first = this.errors()[0];
      if (first) return first.message ?? first.kind ?? 'Campo inválido';
    }
    return '';
  });
  protected readonly hasError = computed(
    () => !!this.errorMessage() || (this.invalid() && this.touched()),
  );

  /** Solo apunta a un `<p>` que realmente se renderiza (error con texto o hint). */
  protected readonly describedById = computed(() =>
    this.errorMessage() || this.hint() ? `${this.id()}-desc` : null,
  );

  protected readonly boxClasses = computed(() => {
    const sizeMap: Record<CheckboxSize, string> = {
      sm: 'size-4',
      md: 'size-5',
    };
    const on = this.checked() || this.indeterminate();
    const base =
      'shrink-0 flex items-center justify-center rounded-[6px] border transition-all outline-none';
    const state = on
      ? 'bg-[var(--color-primary)] border-[var(--color-primary)] text-[var(--color-primary-foreground)]'
      : this.hasError()
        ? 'border-[var(--color-destructive)] bg-[var(--color-background)]'
        : 'border-[var(--color-input)] bg-[var(--color-background)]';
    const focus = 'peer-focus-visible:ring-[3px] peer-focus-visible:ring-[var(--color-ring)]/40';
    const disabled = this.isDisabled() ? 'opacity-50' : '';
    return [base, sizeMap[this.size()], state, focus, disabled].join(' ');
  });

  // --- ControlValueAccessor ---
  private onChange: (value: boolean) => void = () => {};
  private onTouched: () => void = () => {};

  writeValue(value: boolean): void {
    this.checked.set(!!value);
  }
  registerOnChange(fn: (value: boolean) => void): void {
    this.onChange = fn;
  }
  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }
  setDisabledState(isDisabled: boolean): void {
    this.cvaDisabled.set(isDisabled);
  }

  protected toggle(event: Event) {
    const next = (event.target as HTMLInputElement).checked;
    this.checked.set(next);
    this.onChange(next);
    this.onTouched();
  }
}
