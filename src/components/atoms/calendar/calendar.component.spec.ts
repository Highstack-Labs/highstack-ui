import { TestBed } from '@angular/core/testing';
import { CalendarComponent } from './calendar.component';

function create(inputs: Record<string, unknown> = {}) {
  const fixture = TestBed.createComponent(CalendarComponent);
  for (const [k, v] of Object.entries(inputs)) fixture.componentRef.setInput(k, v);
  fixture.detectChanges();
  return fixture;
}

function days(fixture: ReturnType<typeof create>): HTMLButtonElement[] {
  return Array.from(fixture.nativeElement.querySelectorAll('[role="gridcell"] button'));
}

describe('CalendarComponent', () => {
  it('renderiza siempre 42 celdas', () => {
    expect(days(create({ month: '2026-02-01' }))).toHaveLength(42);
    expect(days(create({ month: '2026-08-01' }))).toHaveLength(42);
  });

  it('renderiza siete encabezados de día', () => {
    const fixture = create({ month: '2026-07-01' });
    const heads = fixture.nativeElement.querySelectorAll('[data-weekday]');
    expect(heads).toHaveLength(7);
  });

  it('atenúa los días que no son del mes visible', () => {
    const fixture = create({ month: '2026-07-01', locale: 'es-MX' });
    // Julio 2026 empieza en miércoles; con semana en domingo sobran 3 del mes previo.
    const outside = fixture.nativeElement.querySelectorAll('[data-outside="true"]');
    expect(outside.length).toBeGreaterThan(0);
  });

  it('marca el día seleccionado con aria-selected', () => {
    const fixture = create({ value: '2026-07-15', month: '2026-07-01' });
    const selected = fixture.nativeElement.querySelectorAll('[aria-selected="true"]');
    expect(selected).toHaveLength(1);
    expect(selected[0].textContent?.trim()).toBe('15');
  });

  it('al hacer clic actualiza value', () => {
    const fixture = create({ month: '2026-07-01', value: '' });
    const target = days(fixture).find((b) => b.dataset['date'] === '2026-07-15')!;
    target.click();
    fixture.detectChanges();
    expect(fixture.componentInstance.value()).toBe('2026-07-15');
  });

  it('el mes visible arranca en el mes del valor', () => {
    const fixture = create({ value: '2026-11-20' });
    expect(fixture.componentInstance.month()).toBe('2026-11-01');
  });

  describe('días deshabilitados', () => {
    it('respeta min y max', () => {
      const fixture = create({ month: '2026-07-01', min: '2026-07-10', max: '2026-07-20' });
      const cmp = fixture.componentInstance;
      expect(cmp.isDisabled('2026-07-09')).toBe(true);
      expect(cmp.isDisabled('2026-07-10')).toBe(false);
      expect(cmp.isDisabled('2026-07-20')).toBe(false);
      expect(cmp.isDisabled('2026-07-21')).toBe(true);
    });

    it('respeta la lista de fechas', () => {
      const fixture = create({ month: '2026-07-01', disabledDates: ['2026-07-15'] });
      expect(fixture.componentInstance.isDisabled('2026-07-15')).toBe(true);
      expect(fixture.componentInstance.isDisabled('2026-07-16')).toBe(false);
    });

    it('respeta el predicado', () => {
      const fixture = create({
        month: '2026-07-01',
        // Bloquea sábados y domingos.
        dateDisabled: (iso: string) => [0, 6].includes(new Date(iso + 'T12:00:00Z').getUTCDay()),
      });
      expect(fixture.componentInstance.isDisabled('2026-07-04')).toBe(true); // sábado
      expect(fixture.componentInstance.isDisabled('2026-07-06')).toBe(false); // lunes
    });

    it('no selecciona al hacer clic en un día deshabilitado', () => {
      const fixture = create({ month: '2026-07-01', value: '', disabledDates: ['2026-07-15'] });
      days(fixture)
        .find((b) => b.dataset['date'] === '2026-07-15')!
        .click();
      fixture.detectChanges();
      expect(fixture.componentInstance.value()).toBe('');
    });
  });

  describe('navegación de mes', () => {
    it('los botones ‹ › cambian el mes visible', () => {
      const fixture = create({ month: '2026-07-01' });
      const [prev, next] = Array.from(
        fixture.nativeElement.querySelectorAll('[data-nav]'),
      ) as HTMLButtonElement[];

      next.click();
      fixture.detectChanges();
      expect(fixture.componentInstance.month()).toBe('2026-08-01');

      prev.click();
      prev.click();
      fixture.detectChanges();
      expect(fixture.componentInstance.month()).toBe('2026-06-01');
    });
  });
});

describe('CalendarComponent — teclado', () => {
  function press(fixture: ReturnType<typeof create>, key: string, shiftKey = false) {
    const grid = fixture.nativeElement.querySelector('[role="grid"]') as HTMLElement;
    grid.dispatchEvent(new KeyboardEvent('keydown', { key, shiftKey, bubbles: true }));
    fixture.detectChanges();
  }

  function focusedDate(fixture: ReturnType<typeof create>): string | undefined {
    const el = fixture.nativeElement.querySelector('[tabindex="0"][data-date]') as HTMLElement;
    return el?.dataset['date'];
  }

  it('arranca con el foco en el valor seleccionado', () => {
    const fixture = create({ value: '2026-07-15', month: '2026-07-01' });
    expect(focusedDate(fixture)).toBe('2026-07-15');
  });

  it('flechas izquierda/derecha mueven un día', () => {
    const fixture = create({ value: '2026-07-15', month: '2026-07-01' });
    press(fixture, 'ArrowRight');
    expect(focusedDate(fixture)).toBe('2026-07-16');
    press(fixture, 'ArrowLeft');
    press(fixture, 'ArrowLeft');
    expect(focusedDate(fixture)).toBe('2026-07-14');
  });

  it('flechas arriba/abajo mueven una semana', () => {
    const fixture = create({ value: '2026-07-15', month: '2026-07-01' });
    press(fixture, 'ArrowDown');
    expect(focusedDate(fixture)).toBe('2026-07-22');
    press(fixture, 'ArrowUp');
    press(fixture, 'ArrowUp');
    expect(focusedDate(fixture)).toBe('2026-07-08');
  });

  it('Home y End van al inicio y fin de la semana', () => {
    // 2026-07-15 es miércoles; con semana en domingo (es-MX) va del 12 al 18.
    const fixture = create({ value: '2026-07-15', month: '2026-07-01', locale: 'es-MX' });
    press(fixture, 'Home');
    expect(focusedDate(fixture)).toBe('2026-07-12');
    press(fixture, 'End');
    expect(focusedDate(fixture)).toBe('2026-07-18');
  });

  it('PageUp y PageDown cambian de mes', () => {
    const fixture = create({ value: '2026-07-15', month: '2026-07-01' });
    press(fixture, 'PageDown');
    expect(focusedDate(fixture)).toBe('2026-08-15');
    expect(fixture.componentInstance.month()).toBe('2026-08-01');
    press(fixture, 'PageUp');
    expect(focusedDate(fixture)).toBe('2026-07-15');
  });

  it('Shift+PageUp y Shift+PageDown cambian de año', () => {
    const fixture = create({ value: '2026-07-15', month: '2026-07-01' });
    press(fixture, 'PageDown', true);
    expect(focusedDate(fixture)).toBe('2027-07-15');
    press(fixture, 'PageUp', true);
    expect(focusedDate(fixture)).toBe('2026-07-15');
  });

  it('cruzar de mes con flechas cambia el mes visible', () => {
    const fixture = create({ value: '2026-07-31', month: '2026-07-01' });
    press(fixture, 'ArrowRight');
    expect(focusedDate(fixture)).toBe('2026-08-01');
    expect(fixture.componentInstance.month()).toBe('2026-08-01');
  });

  it('Enter selecciona el día enfocado', () => {
    const fixture = create({ value: '', month: '2026-07-01' });
    press(fixture, 'ArrowRight');
    const target = focusedDate(fixture)!;
    press(fixture, 'Enter');
    expect(fixture.componentInstance.value()).toBe(target);
  });

  it('Enter no hace nada sobre un día deshabilitado', () => {
    const fixture = create({
      value: '2026-07-14',
      month: '2026-07-01',
      disabledDates: ['2026-07-15'],
    });
    press(fixture, 'ArrowRight');
    // El día deshabilitado SÍ recibe foco: saltárselo se cicla si el mes entero
    // está bloqueado, y esconde información del lector de pantalla.
    expect(focusedDate(fixture)).toBe('2026-07-15');
    press(fixture, 'Enter');
    expect(fixture.componentInstance.value()).toBe('2026-07-14');
  });
});
