import { Component, computed, input, linkedSignal, model, signal } from '@angular/core';
import {
  addMonths,
  buildMonthGrid,
  fullDateLabel,
  monthLabel,
  parseIso,
  resolveWeekStart,
  startOfMonth,
  today,
  weekdayLabels,
} from './date-utils';

/** Una celda del grid, ya resuelta para el template. */
export interface CalendarDay {
  iso: string;
  label: string;
  outside: boolean;
  disabled: boolean;
  selected: boolean;
  isToday: boolean;
}

/**
 * Cuadrícula de un mes. No sabe nada de overlays ni de inputs de texto: recibe
 * un valor y emite el que el usuario elige. Se puede embeber suelto.
 */
@Component({
  selector: 'ui-calendar',
  templateUrl: './calendar.component.html',
  host: { class: 'block' },
})
export class CalendarComponent {
  /** Fecha seleccionada en ISO 'YYYY-MM-DD', o '' si no hay. */
  readonly value = model<string>('');

  readonly locale = input<string>('es-MX');
  /** 0 = domingo. Si no se pasa, se deriva del locale. */
  readonly weekStartsOn = input<number | undefined>(undefined);

  readonly min = input<string>('');
  readonly max = input<string>('');
  readonly disabledDates = input<readonly string[]>([]);
  readonly dateDisabled = input<((iso: string) => boolean) | undefined>(undefined);

  /**
   * Mes a mostrar al arrancar, en ISO. Opcional: si no se pasa, se deriva del
   * valor. Se expone como `[month]`; el mes visible en vivo es `month()`.
   */
  readonly defaultMonth = input<string>('', { alias: 'month' });

  /**
   * Mes visible. Es un linkedSignal para que siga al valor cuando este cambia
   * desde afuera, pero sin perder la navegación manual del usuario.
   */
  readonly month = linkedSignal<string>(() =>
    startOfMonth(this.defaultMonth() || this.value() || today()),
  );

  /** Día que tiene el tabindex=0 del roving focus. */
  protected readonly focused = signal<string>('');

  protected readonly resolvedWeekStart = computed(
    () => this.weekStartsOn() ?? resolveWeekStart(this.locale()),
  );

  protected readonly heading = computed(() => monthLabel(this.month(), this.locale()));

  protected readonly weekdays = computed(() =>
    weekdayLabels(this.locale(), this.resolvedWeekStart()),
  );

  protected readonly weeks = computed<CalendarDay[][]>(() => {
    const grid = buildMonthGrid(this.month(), this.resolvedWeekStart());
    const visibleMonth = parseIso(this.month())?.m;
    const selected = this.value();
    const hoy = today();

    const cells = grid.map<CalendarDay>((iso) => ({
      iso,
      label: String(parseIso(iso)!.d),
      outside: parseIso(iso)!.m !== visibleMonth,
      disabled: this.isDisabled(iso),
      selected: iso === selected,
      isToday: iso === hoy,
    }));

    // Seis filas de siete.
    return Array.from({ length: 6 }, (_, r) => cells.slice(r * 7, r * 7 + 7));
  });

  /**
   * Un día se deshabilita si CUALQUIERA de las cuatro restricciones lo dice. Se
   * evalúan en orden y se corta en la primera, para no llamar al predicado 42
   * veces si min ya descartó el día.
   */
  isDisabled(iso: string): boolean {
    const min = this.min();
    if (min && iso < min) return true;

    const max = this.max();
    if (max && iso > max) return true;

    if (this.disabledDates().includes(iso)) return true;

    return this.dateDisabled()?.(iso) ?? false;
  }

  protected select(iso: string) {
    if (this.isDisabled(iso)) return;
    this.value.set(iso);
    this.focused.set(iso);
  }

  protected shiftMonth(n: number) {
    this.month.set(addMonths(this.month(), n));
  }

  /** Para el aria-label de cada día: '15 de julio de 2026', no '15/07/2026'. */
  protected dayLabel(iso: string): string {
    return fullDateLabel(iso, this.locale());
  }
}
