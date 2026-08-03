import { TestBed } from '@angular/core/testing';
import { TimepickerComponent } from './timepicker.component';

function create(inputs: Record<string, unknown> = {}) {
  const fixture = TestBed.createComponent(TimepickerComponent);
  for (const [k, v] of Object.entries(inputs)) fixture.componentRef.setInput(k, v);
  fixture.detectChanges();
  return fixture;
}

type Fixture = ReturnType<typeof create>;

function textbox(fixture: Fixture): HTMLInputElement {
  return fixture.nativeElement.querySelector('input');
}

function type(fixture: Fixture, text: string) {
  const el = textbox(fixture);
  // focusin/focusout y no focus/blur: los segundos no burbujean, así que nunca
  // llegarían al host. El navegador dispara ambos pares al entrar y salir.
  el.dispatchEvent(new FocusEvent('focusin', { bubbles: true }));
  el.value = text;
  el.dispatchEvent(new Event('input', { bubbles: true }));
  fixture.detectChanges();
}

function blur(fixture: Fixture) {
  textbox(fixture).dispatchEvent(new FocusEvent('focusout', { bubbles: true }));
  fixture.detectChanges();
}

function errorText(fixture: Fixture): string {
  const p = fixture.nativeElement.querySelector('p');
  return p?.textContent?.trim() ?? '';
}

function trigger(fixture: Fixture): HTMLButtonElement {
  return fixture.nativeElement.querySelector('[data-trigger]');
}

/** El panel vive en el contenedor de overlays, no en el host. */
function panel(): HTMLElement | null {
  return document.querySelector('[role="dialog"]');
}

function column(kind: string): HTMLElement {
  return panel()!.querySelector(`[data-column][data-kind="${kind}"]`)!;
}

function options(kind: string): HTMLButtonElement[] {
  return Array.from(column(kind).querySelectorAll('[role="option"]'));
}

function option(kind: string, value: string): HTMLButtonElement {
  return column(kind).querySelector(`[data-value="${value}"]`)!;
}

function openPanel(fixture: Fixture) {
  trigger(fixture).click();
  fixture.detectChanges();
}

afterEach(() => {
  document.querySelector('[data-ui-overlay-root]')?.remove();
});

describe('TimepickerComponent — texto y valor', () => {
  it('arranca vacío sin inventar una hora', () => {
    const fixture = create({});
    expect(textbox(fixture).value).toBe('');
    expect(fixture.componentInstance.value()).toBe('');
  });

  it('muestra el valor inicial en formato 24', () => {
    const fixture = create({ value: '09:30', hourFormat: 24 });
    expect(textbox(fixture).value).toBe('09:30');
  });

  it('muestra el valor inicial en formato 12 con su periodo', () => {
    const fixture = create({ value: '21:05', hourFormat: 12, locale: 'en-US' });
    expect(textbox(fixture).value).toBe('9:05 PM');
  });

  it("'auto' saca el formato del locale", () => {
    expect(textbox(create({ value: '21:05', locale: 'en-US' })).value).toBe('9:05 PM');
    expect(textbox(create({ value: '21:05', locale: 'es-ES' })).value).toBe('21:05');
  });

  it('con showSeconds el valor y el texto llevan segundos', () => {
    const fixture = create({ value: '09:30:07', hourFormat: 24, showSeconds: true });
    expect(textbox(fixture).value).toBe('09:30:07');
  });

  it('sin showSeconds los segundos se descartan del valor publicado', () => {
    const fixture = create({ hourFormat: 24 });
    type(fixture, '09:30:07');
    expect(fixture.componentInstance.value()).toBe('09:30');
  });

  it('teclear una hora con pm la convierte a 24h', () => {
    const fixture = create({ hourFormat: 12, locale: 'en-US' });
    type(fixture, '9:30 pm');
    expect(fixture.componentInstance.value()).toBe('21:30');
  });

  it('teclear nunca muestra error, ni en los estados de camino', () => {
    // '9:' y '9:3' son pasos válidos hacia '9:30'; marcarlos en rojo mientras se
    // escribe sería ruido.
    const fixture = create({ hourFormat: 24 });
    for (const paso of ['9', '9:', '9:3', '9:30']) {
      type(fixture, paso);
      expect(errorText(fixture)).toBe('');
    }
    expect(fixture.componentInstance.value()).toBe('09:30');
  });

  it('un texto que no se entiende deja el valor vacío', () => {
    const fixture = create({ hourFormat: 24, value: '09:30' });
    type(fixture, 'no es una hora');
    expect(fixture.componentInstance.value()).toBe('');
  });

  it('una hora prohibida por min no llega al formulario', () => {
    const fixture = create({ hourFormat: 24, min: '09:00' });
    type(fixture, '08:00');
    expect(fixture.componentInstance.value()).toBe('');
  });

  it('reformatea al salir del campo', () => {
    const fixture = create({ hourFormat: 24 });
    type(fixture, '930');
    blur(fixture);
    expect(textbox(fixture).value).toBe('09:30');
  });

  it('un valor de fuera se normaliza; la basura se descarta', () => {
    const fixture = create({ hourFormat: 24 });
    fixture.componentInstance.writeValue('09:30:45');
    fixture.detectChanges();
    expect(fixture.componentInstance.value()).toBe('09:30');

    fixture.componentInstance.writeValue('25:00');
    fixture.detectChanges();
    expect(fixture.componentInstance.value()).toBe('');
    expect(textbox(fixture).value).toBe('');
  });
});

describe('TimepickerComponent — errores', () => {
  it('el error de formato solo aparece al salir del campo', () => {
    const fixture = create({ hourFormat: 24 });
    type(fixture, 'no es una hora');
    expect(errorText(fixture)).toBe('');

    blur(fixture);
    expect(errorText(fixture)).toBe('Hora incompleta o inválida');
  });

  it('distingue una hora que no existe de un texto que no se entiende', () => {
    const fixture = create({ hourFormat: 24 });
    type(fixture, '25:99');
    blur(fixture);
    expect(errorText(fixture)).toBe('Esa hora no existe');
  });

  it('avisa cuando la hora queda fuera de min/max', () => {
    const conMin = create({ hourFormat: 24, min: '09:00' });
    type(conMin, '08:00');
    blur(conMin);
    expect(errorText(conMin)).toContain('posterior a 09:00');

    const conMax = create({ hourFormat: 24, max: '17:00' });
    type(conMax, '18:00');
    blur(conMax);
    expect(errorText(conMax)).toContain('anterior a 17:00');
  });

  it('avisa cuando la hora está en la lista de no disponibles', () => {
    const fixture = create({ hourFormat: 24, disabledTimes: ['13:00'] });
    type(fixture, '13:00');
    blur(fixture);
    expect(errorText(fixture)).toBe('Esa hora no está disponible');
  });

  it('no marca error al tabular por un campo precargado que nadie editó', () => {
    const fixture = create({ hourFormat: 24, value: '09:30' });
    blur(fixture);
    expect(errorText(fixture)).toBe('');
    expect(fixture.componentInstance.value()).toBe('09:30');
  });

  it('el error manual gana sobre el de parseo', () => {
    const fixture = create({ hourFormat: 24, error: 'Falta la hora' });
    type(fixture, 'basura');
    blur(fixture);
    expect(errorText(fixture)).toBe('Falta la hora');
  });
});

describe('TimepickerComponent — panel', () => {
  it('arranca cerrado y el botón lo abre y lo cierra', () => {
    const fixture = create({});
    expect(panel()).toBeNull();
    expect(trigger(fixture).getAttribute('aria-expanded')).toBe('false');

    openPanel(fixture);
    expect(panel()).not.toBeNull();

    trigger(fixture).click();
    fixture.detectChanges();
    expect(panel()).toBeNull();
  });

  it('no abre si está deshabilitado o en readonly', () => {
    const deshabilitado = create({ disabled: true });
    openPanel(deshabilitado);
    expect(panel()).toBeNull();

    const soloLectura = create({ readonly: true });
    openPanel(soloLectura);
    expect(panel()).toBeNull();
  });

  it('se monta en el contenedor de overlays, fuera del host', () => {
    // Es lo que lo salva del transform y el overflow de un modal o un drawer.
    const fixture = create({});
    openPanel(fixture);

    const root = document.querySelector('[data-ui-overlay-root]');
    expect(panel()!.parentElement).toBe(root);
    expect(fixture.nativeElement.querySelector('[role="dialog"]')).toBeNull();
  });

  it('un clic dentro del panel no lo cierra', () => {
    const fixture = create({});
    openPanel(fixture);

    panel()!.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    fixture.detectChanges();
    expect(panel()).not.toBeNull();
  });

  it('un clic fuera lo cierra', () => {
    const fixture = create({});
    openPanel(fixture);

    document.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    fixture.detectChanges();
    expect(panel()).toBeNull();
  });

  it('Escape lo cierra', () => {
    const fixture = create({});
    openPanel(fixture);

    panel()!.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    fixture.detectChanges();
    expect(panel()).toBeNull();
  });

  it('"Listo" lo cierra', () => {
    const fixture = create({});
    openPanel(fixture);

    (panel()!.querySelector('[data-action="done"]') as HTMLButtonElement).click();
    fixture.detectChanges();
    expect(panel()).toBeNull();
  });
});

describe('TimepickerComponent — columnas', () => {
  it('en formato 12 hay columna de periodo; en 24 no', () => {
    const doce = create({ hourFormat: 12, locale: 'en-US' });
    openPanel(doce);
    expect(panel()!.querySelector('[data-kind="period"]')).not.toBeNull();
    expect(options('hour').map((o) => o.textContent!.trim())[0]).toBe('12');
    expect(options('hour').length).toBe(12);
    doce.destroy();

    const veinticuatro = create({ hourFormat: 24 });
    openPanel(veinticuatro);
    expect(panel()!.querySelector('[data-kind="period"]')).toBeNull();
    expect(options('hour').length).toBe(24);
  });

  it('la columna de segundos aparece solo con showSeconds', () => {
    const sin = create({ hourFormat: 24 });
    openPanel(sin);
    expect(panel()!.querySelector('[data-kind="second"]')).toBeNull();
    sin.destroy();

    const con = create({ hourFormat: 24, showSeconds: true });
    openPanel(con);
    expect(options('second').length).toBe(60);
  });

  it('minuteStep acota los minutos ofrecidos', () => {
    const fixture = create({ hourFormat: 24, minuteStep: 15 });
    openPanel(fixture);
    expect(options('minute').map((o) => o.textContent!.trim())).toEqual([
      '00',
      '15',
      '30',
      '45',
    ]);
  });

  it('marca como elegida la opción del valor actual', () => {
    const fixture = create({ hourFormat: 24, value: '09:30', minuteStep: 30 });
    openPanel(fixture);
    expect(option('hour', '9').getAttribute('aria-selected')).toBe('true');
    expect(option('minute', '30').getAttribute('aria-selected')).toBe('true');
    expect(option('hour', '10').getAttribute('aria-selected')).toBe('false');
  });

  it('elegir una hora emite el valor y NO cierra el panel', () => {
    const fixture = create({ hourFormat: 24, value: '09:30', minuteStep: 30 });
    openPanel(fixture);

    option('hour', '14').click();
    fixture.detectChanges();

    expect(fixture.componentInstance.value()).toBe('14:30');
    expect(textbox(fixture).value).toBe('14:30');
    expect(panel()).not.toBeNull();
  });

  it('elegir los minutos conserva la hora', () => {
    const fixture = create({ hourFormat: 24, value: '09:30', minuteStep: 15 });
    openPanel(fixture);

    option('minute', '45').click();
    fixture.detectChanges();

    expect(fixture.componentInstance.value()).toBe('09:45');
  });

  it('el periodo mueve la hora media vuelta de reloj', () => {
    const fixture = create({ hourFormat: 12, locale: 'en-US', value: '09:30', minuteStep: 30 });
    openPanel(fixture);

    option('period', 'pm').click();
    fixture.detectChanges();
    expect(fixture.componentInstance.value()).toBe('21:30');

    option('period', 'am').click();
    fixture.detectChanges();
    expect(fixture.componentInstance.value()).toBe('09:30');
  });

  it('en formato 12 elegir "12" con periodo am da medianoche', () => {
    const fixture = create({ hourFormat: 12, locale: 'en-US', value: '09:00', minuteStep: 60 });
    openPanel(fixture);

    option('hour', '12').click();
    fixture.detectChanges();
    expect(fixture.componentInstance.value()).toBe('00:00');
  });

  it('elegir con segundos publica la hora completa', () => {
    const fixture = create({ hourFormat: 24, showSeconds: true, value: '09:30:00' });
    openPanel(fixture);

    option('second', '15').click();
    fixture.detectChanges();
    expect(fixture.componentInstance.value()).toBe('09:30:15');
  });

  it('"Ahora" rellena el campo con una hora válida', () => {
    const fixture = create({ hourFormat: 24 });
    openPanel(fixture);

    (panel()!.querySelector('[data-action="now"]') as HTMLButtonElement).click();
    fixture.detectChanges();

    expect(fixture.componentInstance.value()).toMatch(/^\d{2}:\d{2}$/);
  });

  it('desde vacío, elegir una columna produce una hora completa', () => {
    const fixture = create({ hourFormat: 24, minuteStep: 30 });
    openPanel(fixture);

    option('hour', '7').click();
    fixture.detectChanges();

    expect(fixture.componentInstance.value()).toMatch(/^07:\d{2}$/);
  });

  it('min/max deshabilitan las opciones que quedan fuera', () => {
    const fixture = create({ hourFormat: 24, value: '12:00', minuteStep: 60, min: '09:00', max: '17:00' });
    openPanel(fixture);

    expect(option('hour', '8').getAttribute('aria-disabled')).toBe('true');
    expect(option('hour', '18').getAttribute('aria-disabled')).toBe('true');
    expect(option('hour', '12').hasAttribute('aria-disabled')).toBe(false);
  });

  it('timeDisabled deshabilita las opciones que rechaza', () => {
    const fixture = create({
      hourFormat: 24,
      value: '12:00',
      minuteStep: 60,
      timeDisabled: (iso: string) => iso.startsWith('13'),
    });
    openPanel(fixture);

    expect(option('hour', '13').getAttribute('aria-disabled')).toBe('true');
    expect(option('hour', '12').hasAttribute('aria-disabled')).toBe(false);
  });
});

describe('TimepickerComponent — teclado del panel', () => {
  function key(name: string) {
    panel()!.dispatchEvent(new KeyboardEvent('keydown', { key: name, bubbles: true }));
  }

  it('las flechas verticales navegan dentro de la columna', () => {
    // Regresión: con el panel portalizado, un handler en el host no ve estas
    // teclas porque el foco está fuera de su subárbol.
    const fixture = create({ hourFormat: 24, value: '09:30', minuteStep: 30 });
    openPanel(fixture);

    const horas = options('hour');
    horas[9].focus();
    key('ArrowDown');
    fixture.detectChanges();
    expect(document.activeElement).toBe(horas[10]);

    key('ArrowUp');
    fixture.detectChanges();
    expect(document.activeElement).toBe(horas[9]);
  });

  it('las flechas horizontales saltan de columna', () => {
    const fixture = create({ hourFormat: 24, value: '09:30', minuteStep: 30 });
    openPanel(fixture);

    options('hour')[9].focus();
    key('ArrowRight');
    fixture.detectChanges();

    expect(column('minute').contains(document.activeElement)).toBe(true);
    // Cae sobre la opción ya elegida de esa columna, no sobre la primera.
    expect(document.activeElement).toBe(option('minute', '30'));
  });

  it('Inicio y Fin van a los extremos de la columna', () => {
    const fixture = create({ hourFormat: 24, value: '09:30', minuteStep: 30 });
    openPanel(fixture);

    const horas = options('hour');
    horas[9].focus();
    key('End');
    fixture.detectChanges();
    expect(document.activeElement).toBe(horas[23]);

    key('Home');
    fixture.detectChanges();
    expect(document.activeElement).toBe(horas[0]);
  });

  it('las flechas saltan las opciones deshabilitadas', () => {
    const fixture = create({ hourFormat: 24, value: '12:00', minuteStep: 60, max: '13:00' });
    openPanel(fixture);

    option('hour', '13').focus();
    key('ArrowDown');
    fixture.detectChanges();

    // Después de las 13 todo está fuera de rango: la vuelta cae en 00.
    expect(document.activeElement).toBe(option('hour', '0'));
  });

  it('mover el foco de una columna a otra no cierra el panel', () => {
    const fixture = create({ hourFormat: 24, value: '09:30', minuteStep: 30 });
    openPanel(fixture);

    panel()!.dispatchEvent(
      new FocusEvent('focusout', { bubbles: true, relatedTarget: option('minute', '30') }),
    );
    fixture.detectChanges();

    expect(panel()).not.toBeNull();
  });

  it('salir del panel con Tab lo cierra', () => {
    const fixture = create({ hourFormat: 24 });
    openPanel(fixture);

    const fuera = document.createElement('button');
    document.body.appendChild(fuera);
    panel()!.dispatchEvent(new FocusEvent('focusout', { bubbles: true, relatedTarget: fuera }));
    fixture.detectChanges();

    expect(panel()).toBeNull();
    fuera.remove();
  });
});
