import { TestBed } from '@angular/core/testing';
import { DatepickerComponent } from './datepicker.component';

function create(inputs: Record<string, unknown> = {}) {
  const fixture = TestBed.createComponent(DatepickerComponent);
  for (const [k, v] of Object.entries(inputs)) fixture.componentRef.setInput(k, v);
  fixture.detectChanges();
  return fixture;
}

function textbox(fixture: ReturnType<typeof create>): HTMLInputElement {
  return fixture.nativeElement.querySelector('input');
}

function type(fixture: ReturnType<typeof create>, text: string) {
  const el = textbox(fixture);
  // focusin/focusout y no focus/blur: los segundos no burbujean, así que nunca
  // llegarían al host. El navegador dispara ambos pares al entrar y salir.
  el.dispatchEvent(new FocusEvent('focusin', { bubbles: true }));
  el.value = text;
  el.dispatchEvent(new Event('input', { bubbles: true }));
  fixture.detectChanges();
}

function blur(fixture: ReturnType<typeof create>) {
  textbox(fixture).dispatchEvent(new FocusEvent('focusout', { bubbles: true }));
  fixture.detectChanges();
}

function errorText(fixture: ReturnType<typeof create>): string {
  const p = fixture.nativeElement.querySelector('p');
  return p?.textContent?.trim() ?? '';
}

describe('DatepickerComponent — texto y valor', () => {
  it('muestra el valor inicial formateado según el locale', () => {
    const fixture = create({ value: '2026-07-31', locale: 'es-MX' });
    expect(textbox(fixture).value).toBe('31/07/2026');
  });

  it('commitea al teclear una fecha completa y válida', () => {
    const fixture = create({ locale: 'es-MX' });
    type(fixture, '31/07/2026');
    expect(fixture.componentInstance.value()).toBe('2026-07-31');
  });

  it('no muestra error mientras se teclea', () => {
    const fixture = create({ locale: 'es-MX' });
    type(fixture, '31/0');
    // '31/0' es un estado legítimo de camino a '31/07/2026'.
    expect(errorText(fixture)).toBe('');
    expect(fixture.componentInstance.value()).toBe('');
  });

  it('revela el error al perder el foco', () => {
    const fixture = create({ locale: 'es-MX' });
    type(fixture, '31/0');
    blur(fixture);
    expect(errorText(fixture)).toBe('Fecha incompleta o inválida');
  });

  it('distingue una fecha que no existe', () => {
    const fixture = create({ locale: 'es-MX' });
    type(fixture, '31/02/2026');
    blur(fixture);
    expect(errorText(fixture)).toBe('Esa fecha no existe');
  });

  it('distingue una fecha fuera de rango', () => {
    const fixture = create({ locale: 'es-MX', min: '2026-01-01' });
    type(fixture, '01/01/2020');
    blur(fixture);
    expect(errorText(fixture)).toContain('debe ser posterior');
  });

  it('distingue una fecha bloqueada', () => {
    const fixture = create({ locale: 'es-MX', disabledDates: ['2026-07-15'] });
    type(fixture, '15/07/2026');
    blur(fixture);
    expect(errorText(fixture)).toBe('Esa fecha no está disponible');
  });

  it('borrar el texto deja el valor vacío sin error', () => {
    const fixture = create({ locale: 'es-MX', value: '2026-07-31' });
    type(fixture, '');
    blur(fixture);
    expect(fixture.componentInstance.value()).toBe('');
    expect(errorText(fixture)).toBe('');
  });

  it('seguir tecleando sobre una fecha válida la invalida', () => {
    const fixture = create({ locale: 'es-MX' });
    type(fixture, '31/07/2026');
    expect(fixture.componentInstance.value()).toBe('2026-07-31');
    type(fixture, '31/07/20261');
    expect(fixture.componentInstance.value()).toBe('');
  });

  it('acepta ceros a la izquierda opcionales', () => {
    const fixture = create({ locale: 'es-MX' });
    type(fixture, '1/7/2026');
    expect(fixture.componentInstance.value()).toBe('2026-07-01');
  });

  it('rechaza años de dos dígitos', () => {
    const fixture = create({ locale: 'es-MX' });
    type(fixture, '31/07/26');
    blur(fixture);
    expect(fixture.componentInstance.value()).toBe('');
    expect(errorText(fixture)).toBe('Fecha incompleta o inválida');
  });
});

describe('DatepickerComponent — valores externos', () => {
  it('muestra un valor fuera de rango sin borrarlo', () => {
    // Las restricciones bloquean lo que el usuario elige; no reescriben lo que
    // la app le pasó al componente.
    const fixture = create({ value: '2020-01-01', min: '2026-01-01', locale: 'es-MX' });
    expect(textbox(fixture).value).toBe('01/01/2020');
    expect(fixture.componentInstance.value()).toBe('2020-01-01');
  });

  it('enfocar y salir sin teclear no dispara el error ni borra el valor', () => {
    const fixture = create({ value: '2020-01-01', min: '2026-01-01', locale: 'es-MX' });
    blur(fixture);
    expect(fixture.componentInstance.value()).toBe('2020-01-01');
    expect(errorText(fixture)).toBe('');
  });

  it('normaliza basura a cadena vacía', () => {
    const fixture = create({});
    fixture.componentInstance.writeValue('no-soy-fecha');
    fixture.detectChanges();
    expect(fixture.componentInstance.value()).toBe('');
    expect(textbox(fixture).value).toBe('');
  });
});

describe('DatepickerComponent — precedencia de errores', () => {
  it('el input error manual gana sobre el error de parseo', () => {
    const fixture = create({ locale: 'es-MX', error: 'Mensaje del desarrollador' });
    type(fixture, '31/0');
    blur(fixture);
    expect(errorText(fixture)).toBe('Mensaje del desarrollador');
  });

  it('el error de parseo gana sobre los errors de Signal Forms', () => {
    const fixture = create({
      locale: 'es-MX',
      errors: [{ message: 'Requerido' }],
      touched: true,
    });
    type(fixture, '31/0');
    blur(fixture);
    expect(errorText(fixture)).toBe('Fecha incompleta o inválida');
  });

  it('muestra el hint cuando no hay ningún error', () => {
    const fixture = create({ locale: 'es-MX', hint: 'Elige tu fecha de nacimiento' });
    expect(errorText(fixture)).toBe('Elige tu fecha de nacimiento');
  });
});

describe('DatepickerComponent — ControlValueAccessor', () => {
  it('writeValue actualiza el texto', () => {
    const fixture = create({ locale: 'es-MX' });
    fixture.componentInstance.writeValue('2026-12-25');
    fixture.detectChanges();
    expect(textbox(fixture).value).toBe('25/12/2026');
  });

  it('registerOnChange recibe el ISO al teclear', () => {
    const fixture = create({ locale: 'es-MX' });
    const seen: string[] = [];
    fixture.componentInstance.registerOnChange((v: string) => seen.push(v));
    type(fixture, '31/07/2026');
    expect(seen).toContain('2026-07-31');
  });

  it('setDisabledState deshabilita el input', () => {
    const fixture = create({});
    fixture.componentInstance.setDisabledState(true);
    fixture.detectChanges();
    expect(textbox(fixture).disabled).toBe(true);
  });
});

describe('DatepickerComponent — panel', () => {
  function trigger(fixture: ReturnType<typeof create>): HTMLButtonElement {
    return fixture.nativeElement.querySelector('[data-trigger]');
  }
  /**
   * El panel está portalizado al contenedor de overlays a nivel de <body>, así
   * que NO se busca desde el host del fixture sino desde el documento.
   */
  function panel(): HTMLElement | null {
    return document.querySelector('[role="dialog"]');
  }

  afterEach(() => {
    document.querySelector('[data-ui-overlay-root]')?.remove();
  });

  it('arranca cerrado', () => {
    const fixture = create({});
    expect(panel()).toBeNull();
    expect(trigger(fixture).getAttribute('aria-expanded')).toBe('false');
  });

  it('el botón abre y cierra el panel', () => {
    const fixture = create({});
    trigger(fixture).click();
    fixture.detectChanges();
    expect(panel()).not.toBeNull();
    expect(trigger(fixture).getAttribute('aria-expanded')).toBe('true');

    trigger(fixture).click();
    fixture.detectChanges();
    expect(panel()).toBeNull();
  });

  it('no abre si está deshabilitado o en readonly', () => {
    const deshabilitado = create({ disabled: true });
    trigger(deshabilitado).click();
    deshabilitado.detectChanges();
    expect(panel()).toBeNull();

    const soloLectura = create({ readonly: true });
    trigger(soloLectura).click();
    soloLectura.detectChanges();
    expect(panel()).toBeNull();
  });

  it('Escape cierra el panel y devuelve el foco al campo', () => {
    const fixture = create({});
    trigger(fixture).click();
    fixture.detectChanges();

    panel()!.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    fixture.detectChanges();

    expect(panel()).toBeNull();
    expect(document.activeElement).toBe(textbox(fixture));
  });

  it('elegir un día cierra el panel y escribe el texto', () => {
    const fixture = create({ locale: 'es-MX', value: '2026-07-01' });
    trigger(fixture).click();
    fixture.detectChanges();

    const day = panel()!.querySelector('[data-date="2026-07-15"]') as HTMLButtonElement;
    day.click();
    fixture.detectChanges();

    expect(fixture.componentInstance.value()).toBe('2026-07-15');
    expect(textbox(fixture).value).toBe('15/07/2026');
    expect(panel()).toBeNull();
  });

  it('reenvía las restricciones al calendario', () => {
    const fixture = create({ value: '2026-07-01', disabledDates: ['2026-07-15'] });
    trigger(fixture).click();
    fixture.detectChanges();

    const day = panel()!.querySelector('[data-date="2026-07-15"]') as HTMLButtonElement;
    expect(day.getAttribute('aria-disabled')).toBe('true');
  });

  it('un clic fuera cierra el panel', () => {
    const fixture = create({});
    trigger(fixture).click();
    fixture.detectChanges();

    document.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    fixture.detectChanges();
    expect(panel()).toBeNull();
  });

  it('el panel se monta en el contenedor de overlays, fuera del host', () => {
    // Es lo que lo salva del `transform` y el `overflow` de un modal o un drawer.
    const fixture = create({});
    trigger(fixture).click();
    fixture.detectChanges();

    const root = document.querySelector('[data-ui-overlay-root]');
    expect(root).not.toBeNull();
    expect(panel()!.parentElement).toBe(root);
    expect(fixture.nativeElement.querySelector('[role="dialog"]')).toBeNull();
  });

  it('un clic dentro del panel portalizado no lo cierra', () => {
    // Regresión: al salir el panel del host, el `host.contains(target)` del
    // detector de clic-afuera daba false y el panel se cerraba al usarlo.
    const fixture = create({ value: '2026-07-15' });
    trigger(fixture).click();
    fixture.detectChanges();

    const inside = panel()!.querySelector('[data-nav="next"]') as HTMLElement;
    inside.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    fixture.detectChanges();

    expect(panel()).not.toBeNull();
  });

  it('salir del panel con Tab lo cierra', () => {
    // El panel no es modal: no hay trampa de foco, tabular fuera lo cierra.
    const fixture = create({});
    trigger(fixture).click();
    fixture.detectChanges();

    const outside = document.createElement('button');
    document.body.appendChild(outside);
    panel()!.dispatchEvent(
      new FocusEvent('focusout', { bubbles: true, relatedTarget: outside }),
    );
    fixture.detectChanges();

    expect(panel()).toBeNull();
    outside.remove();
  });

  it('mover el foco dentro del panel no lo cierra', () => {
    const fixture = create({});
    trigger(fixture).click();
    fixture.detectChanges();

    const inside = panel()!.querySelector('[data-nav="next"]') as HTMLElement;
    panel()!.dispatchEvent(
      new FocusEvent('focusout', { bubbles: true, relatedTarget: inside }),
    );
    fixture.detectChanges();

    expect(panel()).not.toBeNull();
  });
});
