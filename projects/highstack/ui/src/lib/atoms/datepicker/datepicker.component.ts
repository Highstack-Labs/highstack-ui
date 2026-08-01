import {
  Component,
  booleanAttribute,
  computed,
  effect,
  forwardRef,
  input,
  model,
  signal,
} from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { CalendarComponent } from '../calendar/calendar.component';
import { InputComponent } from '../input/input.component';
import { formatForDisplay, isValidIso, parseLocalized } from '../calendar/date-utils';

export type DatepickerSize = 'sm' | 'md' | 'lg';

/** Forma laxa de un error de validación (Signal Forms entrega { kind, message? }). */
interface DatepickerValidationError {
  kind?: string;
  message?: string;
}

let nextId = 0;

/**
 * Selector de fecha: compone ui-input (para el campo, el label y el mensaje) con
 * ui-calendar (para el panel).
 *
 * Mantiene DOS fuentes de verdad sincronizadas: `value` (ISO, lo que ve el
 * formulario) y `text` (lo que hay en la caja). Las reglas de esa sincronía son
 * la parte delicada del componente y están documentadas en cada método.
 */
@Component({
  selector: 'ui-datepicker',
  templateUrl: './datepicker.component.html',
  imports: [InputComponent, CalendarComponent],
  host: { class: 'block' },
  providers: [
    { provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => DatepickerComponent), multi: true },
  ],
})
export class DatepickerComponent implements ControlValueAccessor {
  /** Fecha en ISO 'YYYY-MM-DD', o '' si no hay. */
  readonly value = model<string>('');

  readonly label = input<string>('');
  readonly hint = input<string>('');
  readonly placeholder = input<string>('');
  readonly name = input<string>('');
  readonly id = input<string>(`ui-datepicker-${nextId++}`);
  readonly size = input<DatepickerSize>('md');

  readonly disabled = input(false, { transform: booleanAttribute });
  readonly readonly = input(false, { transform: booleanAttribute });
  readonly required = input(false, { transform: booleanAttribute });

  /** Mensaje de error manual (tiene prioridad sobre todo lo demás). */
  readonly error = input<string>('');
  readonly invalid = input(false, { transform: booleanAttribute });
  readonly touched = input(false, { transform: booleanAttribute });
  readonly errors = input<readonly DatepickerValidationError[]>([]);

  // Reenviados al calendario.
  readonly locale = input<string>('es-MX');
  readonly weekStartsOn = input<number | undefined>(undefined);
  readonly min = input<string>('');
  readonly max = input<string>('');
  readonly disabledDates = input<readonly string[]>([]);
  readonly dateDisabled = input<((iso: string) => boolean) | undefined>(undefined);

  /** Lo que hay literalmente en la caja de texto. */
  protected readonly text = signal<string>('');
  /** ¿El usuario ya editó el texto? Ver `onBlur`. */
  private dirty = false;
  private focusedField = false;
  /** Error de parseo/restricción, revelado solo tras blur o Enter. */
  protected readonly parseError = signal<string>('');

  private readonly cvaDisabled = signal(false);
  protected readonly isDisabled = computed(() => this.disabled() || this.cvaDisabled());

  constructor() {
    // El valor puede cambiar desde afuera (writeValue, [(value)], formField).
    // Reformatear mientras el campo tiene foco movería el caret bajo el cursor,
    // así que solo se sincroniza cuando no está enfocado.
    effect(() => {
      const iso = this.value();
      if (this.focusedField) return;
      this.text.set(formatForDisplay(iso, this.locale()));
    });
  }

  /** Precedencia: manual > parseo > Signal Forms (tras touched). */
  protected readonly resolvedError = computed(() => {
    if (this.error()) return this.error();
    if (this.parseError()) return this.parseError();
    if (this.touched()) {
      const first = this.errors()[0];
      if (first) return first.message ?? first.kind ?? 'Campo inválido';
    }
    return '';
  });

  // --- Sincronización texto -> valor ---

  protected onTextInput(next: string) {
    this.dirty = true;
    this.text.set(next);
    // Al teclear NUNCA se muestra error: '31/0' es un estado de camino válido.
    this.parseError.set('');

    const iso = parseLocalized(next, this.locale());
    this.value.set(iso && !this.violates(iso) ? iso : '');
    this.onChange(this.value());
  }

  protected onFocus() {
    this.focusedField = true;
  }

  /**
   * Al salir del campo se revela el error, si lo hay.
   *
   * Solo se valida texto que el usuario editó: si el valor vino de afuera y
   * nadie tecleó, pasar con Tab por un formulario precargado no debe borrar
   * nada ni marcar error.
   */
  protected onBlur() {
    this.focusedField = false;
    this.onTouched();

    if (!this.dirty) {
      this.text.set(formatForDisplay(this.value(), this.locale()));
      return;
    }

    this.parseError.set(this.validateText(this.text()));
    if (!this.parseError() && this.value()) {
      this.text.set(formatForDisplay(this.value(), this.locale()));
    }
  }

  /** Devuelve el mensaje adecuado, o '' si el texto está bien. */
  private validateText(text: string): string {
    if (!text.trim()) return '';

    const iso = parseLocalized(text, this.locale());
    if (!iso) {
      // Distinguir "no existe" de "no se entiende": si los tres números están
      // completos pero la fecha no existe, el mensaje debe decirlo.
      const chunks = text
        .trim()
        .split(/[^\d]+/)
        .filter(Boolean);
      const looksComplete = chunks.length === 3 && chunks.some((c) => c.length === 4);
      return looksComplete ? 'Esa fecha no existe' : 'Fecha incompleta o inválida';
    }

    const min = this.min();
    if (min && iso < min) {
      return `La fecha debe ser posterior a ${formatForDisplay(min, this.locale())}`;
    }

    const max = this.max();
    if (max && iso > max) {
      return `La fecha debe ser anterior a ${formatForDisplay(max, this.locale())}`;
    }

    if (this.disabledDates().includes(iso) || this.dateDisabled()?.(iso)) {
      return 'Esa fecha no está disponible';
    }

    return '';
  }

  private violates(iso: string): boolean {
    return this.validateText(formatForDisplay(iso, this.locale())) !== '';
  }

  /** Elegir del calendario siempre produce una fecha válida. */
  protected onCalendarPick(iso: string) {
    this.dirty = true;
    this.value.set(iso);
    this.text.set(formatForDisplay(iso, this.locale()));
    this.parseError.set('');
    this.onChange(iso);
    this.onTouched();
  }

  // --- ControlValueAccessor ---
  private onChange: (value: string) => void = () => {};
  private onTouched: () => void = () => {};

  writeValue(value: string): void {
    // Basura real se normaliza a '': no hay nada que mostrar.
    const iso = typeof value === 'string' && isValidIso(value) ? value : '';
    this.value.set(iso);
    this.text.set(formatForDisplay(iso, this.locale()));
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
}
