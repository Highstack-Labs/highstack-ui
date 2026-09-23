import { Component, computed, input, linkedSignal, model } from '@angular/core';
import {
  addDays,
  addMonths,
  buildMonthGrid,
  fullDateLabel,
  monthLabel,
  parseIso,
  resolveWeekStart,
  startOfMonth,
  today,
  weekday,
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

  /**
   * Día con tabindex=0 (roving focus). Sigue al valor cuando cambia desde
   * afuera, pero la navegación con flechas lo mueve sin tocar el valor.
   */
  protected readonly focused = linkedSignal<string>(
    () => this.value() || startOfMonth(this.month()),
  );

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

  /**
   * Navegación bidimensional del grid. No existía nada así en el repo: select y
   * dropdown solo manejan ArrowUp/ArrowDown sobre una lista.
   */
  protected onKeydown(event: KeyboardEvent) {
    const from = this.focused();
    let next: string | null = null;

    switch (event.key) {
      case 'ArrowLeft':
        next = addDays(from, -1);
        break;
      case 'ArrowRight':
        next = addDays(from, 1);
        break;
      case 'ArrowUp':
        next = addDays(from, -7);
        break;
      case 'ArrowDown':
        next = addDays(from, 7);
        break;
      case 'Home':
        next = addDays(from, -this.offsetInWeek(from));
        break;
      case 'End':
        next = addDays(from, 6 - this.offsetInWeek(from));
        break;
      case 'PageUp':
        next = addMonths(from, event.shiftKey ? -12 : -1);
        break;
      case 'PageDown':
        next = addMonths(from, event.shiftKey ? 12 : 1);
        break;
      case 'Enter':
      case ' ':
        event.preventDefault();
        this.select(from);
        return;
      default:
        return;
    }

    event.preventDefault();
    this.moveFocus(next);
  }

  /** Posición del día dentro de su semana, respetando weekStartsOn. */
  private offsetInWeek(iso: string): number {
    return (weekday(iso) - this.resolvedWeekStart() + 7) % 7;
  }

  /**
   * Mueve el foco y arrastra el mes visible si hizo falta cruzar. Sin esto,
   * llegar al 1° del mes siguiente obligaría a usar el mouse.
   */
  private moveFocus(iso: string) {
    this.focused.set(iso);
    const target = startOfMonth(iso);
    if (target !== this.month()) this.month.set(target);
  }

  /** Para el aria-label de cada día: '15 de julio de 2026', no '15/07/2026'. */
  protected dayLabel(iso: string): string {
    return fullDateLabel(iso, this.locale());
  }
}
