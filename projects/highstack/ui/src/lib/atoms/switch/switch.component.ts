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

export type SwitchSize = 'sm' | 'md';

let nextId = 0;

/**
 * Interruptor on/off. Funciona con Signal Forms (`[formField]`, contrato
 * FormCheckboxControl), ControlValueAccessor (ngModel/Reactive) y two-way `[(checked)]`.
 */
@Component({
  selector: 'ui-switch',
  templateUrl: './switch.component.html',
  host: { class: 'block' },
  providers: [
    { provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => SwitchComponent), multi: true },
  ],
})
export class SwitchComponent implements ControlValueAccessor {
  readonly checked = model<boolean>(false);

  readonly label = input<string>('');
  readonly description = input<string>('');
  readonly size = input<SwitchSize>('md');
  readonly id = input<string>(`ui-switch-${nextId++}`);
  readonly name = input<string>('');

  readonly disabled = input(false, { transform: booleanAttribute });
  readonly required = input(false, { transform: booleanAttribute });

  private readonly cvaDisabled = signal(false);
  protected readonly isDisabled = computed(() => this.disabled() || this.cvaDisabled());

  protected readonly trackClasses = computed(() => {
    const sizeMap: Record<SwitchSize, string> = {
      sm: 'h-4 w-7',
      md: 'h-5 w-9',
    };
    const base =
      'relative shrink-0 inline-flex items-center rounded-full transition-colors outline-none peer-focus-visible:ring-[3px] peer-focus-visible:ring-[var(--color-ring)]/40';
    const state = this.checked()
      ? 'bg-[var(--color-primary)]'
      : 'bg-[var(--color-input)]';
    const disabled = this.isDisabled() ? 'opacity-50' : '';
    return [base, sizeMap[this.size()], state, disabled].join(' ');
  });

  protected readonly thumbClasses = computed(() => {
    // Tamaño del thumb y desplazamiento al activarse.
    const sm = this.size() === 'sm';
    const dims = sm ? 'size-3' : 'size-4';
    const off = 'translate-x-0.5';
    const on = sm ? 'translate-x-3.5' : 'translate-x-4';
    const base = 'inline-block rounded-full bg-white shadow-sm transition-transform';
    return [base, dims, this.checked() ? on : off].join(' ');
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
