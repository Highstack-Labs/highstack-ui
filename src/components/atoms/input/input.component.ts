import { Component, booleanAttribute, computed, forwardRef, input, model, signal } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

export type InputSize = 'sm' | 'md' | 'lg';
export type InputType = 'text' | 'email' | 'password' | 'number' | 'search' | 'tel' | 'url';

/** Forma laxa de un error de validación (Signal Forms entrega { kind, message? }). */
interface InputValidationError {
  kind?: string;
  message?: string;
}

let nextId = 0;

/**
 * Campo de texto. Funciona con:
 *  - Signal Forms (Angular 22) vía `[formField]` — implementa el contrato
 *    FormValueControl por duck typing (value = model + errors/disabled/... = input).
 *  - ControlValueAccessor — ngModel, Reactive Forms, formControlName.
 *  - Two-way simple `[(value)]`.
 */
@Component({
  selector: 'ui-input',
  templateUrl: './input.component.html',
  host: { class: 'block' },
  providers: [
    { provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => InputComponent), multi: true },
  ],
})
export class InputComponent implements ControlValueAccessor {
  /** Fuente única de verdad del valor (Signal Forms + two-way). */
  readonly value = model<string>('');

  readonly type = input<InputType>('text');
  readonly size = input<InputSize>('md');
  readonly label = input<string>('');
  readonly hint = input<string>('');
  readonly placeholder = input<string>('');
  readonly name = input<string>('');
  readonly id = input<string>(`ui-input-${nextId++}`);

  readonly disabled = input(false, { transform: booleanAttribute });
  readonly readonly = input(false, { transform: booleanAttribute });
  readonly required = input(false, { transform: booleanAttribute });
  /** Muestra el botón de ojito para revelar/ocultar la contraseña (solo type="password"). */
  readonly passwordToggle = input(true, { transform: booleanAttribute });

  /** Mensaje de error manual (tiene prioridad sobre los errors de Signal Forms). */
  readonly error = input<string>('');
  /** Estado de validación que cablea Signal Forms automáticamente. */
  readonly invalid = input(false, { transform: booleanAttribute });
  readonly touched = input(false, { transform: booleanAttribute });
  readonly errors = input<readonly InputValidationError[]>([]);

  /** disabled puede venir del input o de CVA (setDisabledState). */
  private readonly cvaDisabled = signal(false);
  protected readonly isDisabled = computed(() => this.disabled() || this.cvaDisabled());

  /** Estado y tipo efectivo para el toggle de contraseña. */
  protected readonly showPassword = signal(false);
  protected readonly hasPasswordToggle = computed(
    () => this.type() === 'password' && this.passwordToggle(),
  );
  protected readonly resolvedType = computed(() =>
    this.type() === 'password' && this.showPassword() ? 'text' : this.type(),
  );

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
    () => !!this.error() || !!this.errorMessage() || (this.invalid() && this.touched()),
  );

  protected readonly describedById = computed(() =>
    this.hasError() || this.hint() ? `${this.id()}-desc` : null,
  );

  protected readonly wrapperClasses = computed(() => {
    // Radio ligado al tamaño: menos alto -> menos redondez (estilo shadcn).
    const sizeMap: Record<InputSize, string> = {
      sm: 'h-8 px-2.5 gap-2 text-xs rounded-md',
      md: 'h-9 px-3 gap-2 text-sm rounded-lg',
      lg: 'h-10 px-3.5 gap-2 text-base rounded-lg',
    };

    const base =
      'flex items-center border bg-[var(--color-background)] transition-all';

    const state = this.hasError()
      ? 'border-[var(--color-destructive)] focus-within:ring-[3px] focus-within:ring-[var(--color-destructive)]/25'
      : 'border-[var(--color-input)] focus-within:border-[var(--color-ring)] focus-within:ring-[3px] focus-within:ring-[var(--color-ring)]/40';

    const disabled = this.isDisabled()
      ? 'opacity-50 cursor-not-allowed bg-[var(--color-muted)]/40'
      : '';

    return [base, sizeMap[this.size()], state, disabled].join(' ');
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

  protected onInput(event: Event) {
    const next = (event.target as HTMLInputElement).value;
    this.value.set(next);
    this.onChange(next);
  }

  protected onBlur() {
    this.onTouched();
  }
}
