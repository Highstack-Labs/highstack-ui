import {
  Component,
  ElementRef,
  booleanAttribute,
  computed,
  forwardRef,
  inject,
  input,
  model,
  numberAttribute,
  signal,
} from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

interface TextareaValidationError {
  kind?: string;
  message?: string;
}

let nextId = 0;

/**
 * Campo de texto multilínea. Funciona con Signal Forms (`[formField]`),
 * ControlValueAccessor (ngModel/Reactive) y two-way `[(value)]`.
 */
@Component({
  selector: 'ui-textarea',
  templateUrl: './textarea.component.html',
  host: { class: 'block' },
  providers: [
    { provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => TextareaComponent), multi: true },
  ],
})
export class TextareaComponent implements ControlValueAccessor {
  readonly value = model<string>('');

  readonly label = input<string>('');
  readonly hint = input<string>('');
  readonly error = input<string>('');
  readonly placeholder = input<string>('');
  readonly name = input<string>('');
  readonly id = input<string>(`ui-textarea-${nextId++}`);
  readonly rows = input(4, { transform: numberAttribute });

  readonly disabled = input(false, { transform: booleanAttribute });
  readonly readonly = input(false, { transform: booleanAttribute });
  readonly required = input(false, { transform: booleanAttribute });
  /** Crece en alto según el contenido. */
  readonly autoGrow = input(false, { transform: booleanAttribute });

  readonly invalid = input(false, { transform: booleanAttribute });
  readonly touched = input(false, { transform: booleanAttribute });
  readonly errors = input<readonly TextareaValidationError[]>([]);

  private readonly host = inject(ElementRef<HTMLElement>);
  private readonly cvaDisabled = signal(false);
  protected readonly isDisabled = computed(() => this.disabled() || this.cvaDisabled());

  protected readonly errorMessage = computed(() => {
    if (this.error()) return this.error();
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

  protected readonly fieldClasses = computed(() => {
    const base =
      'w-full rounded-[10px] border bg-[var(--color-background)] px-3 py-2 text-sm text-[var(--color-foreground)] placeholder:text-[var(--color-muted-foreground)] transition-all outline-none resize-y disabled:cursor-not-allowed';
    const state = this.hasError()
      ? 'border-[var(--color-destructive)] focus:ring-[3px] focus:ring-[var(--color-destructive)]/25'
      : 'border-[var(--color-input)] focus:border-[var(--color-ring)] focus:ring-[3px] focus:ring-[var(--color-ring)]/40';
    const disabled = this.isDisabled() ? 'opacity-50 bg-[var(--color-muted)]/40' : '';
    const grow = this.autoGrow() ? 'resize-none overflow-hidden' : '';
    return [base, state, disabled, grow].join(' ');
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
    const el = event.target as HTMLTextAreaElement;
    this.value.set(el.value);
    this.onChange(el.value);
    if (this.autoGrow()) this.grow(el);
  }

  protected onBlur() {
    this.onTouched();
  }

  private grow(el: HTMLTextAreaElement) {
    el.style.height = 'auto';
    el.style.height = `${el.scrollHeight}px`;
  }
}
