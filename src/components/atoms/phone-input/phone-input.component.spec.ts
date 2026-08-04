import { TestBed } from '@angular/core/testing';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { PhoneInputComponent } from './phone-input.component';

function create(inputs: Record<string, unknown> = {}) {
  const fixture = TestBed.createComponent(PhoneInputComponent);
  for (const [key, value] of Object.entries(inputs)) fixture.componentRef.setInput(key, value);
  fixture.detectChanges();
  return fixture;
}
type Fixture = ReturnType<typeof create>;

/** El campo del número (el buscador del panel vive fuera del host). */
function textbox(fixture: Fixture): HTMLInputElement {
  return fixture.nativeElement.querySelector('input')!;
}

function trigger(fixture: Fixture): HTMLButtonElement {
  return fixture.nativeElement.querySelector('[data-trigger]')!;
}

/**
 * El foco se simula con focusin/focusout porque son los que burbujean desde el
 * <input> de ui-input hasta el host, que es donde escucha el componente.
 */
function type(fixture: Fixture, text: string) {
  const input = textbox(fixture);
  input.dispatchEvent(new Event('focusin', { bubbles: true }));
  input.value = text;
  input.dispatchEvent(new Event('input', { bubbles: true }));
  fixture.detectChanges();
}

function blur(fixture: Fixture) {
  textbox(fixture).dispatchEvent(new Event('focusout', { bubbles: true }));
  fixture.detectChanges();
}

function errorText(fixture: Fixture): string {
  return (
    fixture.nativeElement
      .querySelector('p.text-\\[var\\(--color-destructive\\)\\]')
      ?.textContent?.trim() ?? ''
  );
}

/** El panel vive en el contenedor de overlays, no en el host. */
function panel(): HTMLElement | null {
  return document.querySelector('[role="dialog"]');
}

function searchBox(): HTMLInputElement | null {
  return panel()?.querySelector('input[role="combobox"]') ?? null;
}

function options(): HTMLElement[] {
  return Array.from(panel()?.querySelectorAll<HTMLElement>('[role="option"]') ?? []);
}

function option(iso2: string): HTMLElement | null {
  return panel()?.querySelector(`[data-iso2="${iso2}"]`) ?? null;
}

async function openPanel(fixture: Fixture) {
  trigger(fixture).click();
  fixture.detectChanges();
  await fixture.whenStable();
  fixture.detectChanges();
}

function key(target: HTMLElement, k: string) {
  target.dispatchEvent(new KeyboardEvent('keydown', { key: k, bubbles: true }));
}

afterEach(() => {
  document.querySelector('[data-ui-overlay-root]')?.remove();
});

describe('PhoneInputComponent — país por defecto', () => {
  it('deriva el país de la región del locale', () => {
    const fixture = create({ locale: 'es-EC' });
    expect(trigger(fixture).textContent).toContain('+593');
  });

  it('sin región en el locale no elige país', () => {
    const fixture = create({ locale: 'es' });
    expect(trigger(fixture).textContent).not.toContain('+');
    expect(trigger(fixture).textContent).toContain('País');
  });

  it('defaultCountry gana sobre el locale', () => {
    const fixture = create({ locale: 'es-EC', defaultCountry: 'MX' });
    expect(trigger(fixture).textContent).toContain('+52');
  });

  it('acepta el defaultCountry en minúsculas', () => {
    const fixture = create({ defaultCountry: 'ec' });
    expect(trigger(fixture).textContent).toContain('+593');
  });

  it('un defaultCountry inexistente cae al locale', () => {
    const fixture = create({ locale: 'es-EC', defaultCountry: 'ZZ' });
    expect(trigger(fixture).textContent).toContain('+593');
  });
});

describe('PhoneInputComponent — texto y valor', () => {
  it('arranca vacío sin inventar número', () => {
    const fixture = create({ locale: 'es-EC' });
    expect(textbox(fixture).value).toBe('');
    expect(fixture.componentInstance.value()).toBe('');
  });

  it('muestra el valor inicial agrupado y sin el prefijo', () => {
    const fixture = create({ locale: 'es-EC', value: '+593987654321' });
    expect(textbox(fixture).value).toBe('98 765 4321');
  });

  it('teclear dígitos publica el E.164 del país elegido', () => {
    const fixture = create({ locale: 'es-EC' });
    type(fixture, '987654321');
    expect(fixture.componentInstance.value()).toBe('+593987654321');
  });

  it('los separadores que teclea el usuario no llegan al valor', () => {
    const fixture = create({ locale: 'es-EC' });
    type(fixture, '98 765-4321');
    expect(fixture.componentInstance.value()).toBe('+593987654321');
  });

  it('no reagrupa mientras el campo tiene foco, y sí al salir', () => {
    const fixture = create({ locale: 'es-EC' });
    type(fixture, '987654321');
    expect(textbox(fixture).value).toBe('987654321');
    blur(fixture);
    expect(textbox(fixture).value).toBe('98 765 4321');
  });

  it('quita el cero de troncal al teclear', () => {
    const fixture = create({ locale: 'es-EC' });
    type(fixture, '0987654321');
    expect(fixture.componentInstance.value()).toBe('+593987654321');
  });

  it('pegar un número internacional re-detecta el país', () => {
    const fixture = create({ locale: 'es-EC' });
    type(fixture, '+34600111222');
    expect(fixture.componentInstance.value()).toBe('+34600111222');
    expect(trigger(fixture).textContent).toContain('+34');
  });

  it('pegar con prefijo de salida 00 también re-detecta', () => {
    const fixture = create({ locale: 'es-EC' });
    type(fixture, '0034600111222');
    expect(fixture.componentInstance.value()).toBe('+34600111222');
    expect(trigger(fixture).textContent).toContain('+34');
  });

  it('sin país elegido, teclear dígitos deja el valor vacío', () => {
    const fixture = create({ locale: 'es' });
    type(fixture, '987654321');
    expect(fixture.componentInstance.value()).toBe('');
  });

  it('avisa por countryChange cuando el país cambia', async () => {
    const fixture = create({ locale: 'es-EC' });
    const seen: string[] = [];
    fixture.componentInstance.countryChange.subscribe((iso2) => seen.push(iso2));

    await openPanel(fixture);
    option('MX')!.click();
    fixture.detectChanges();

    expect(seen).toEqual(['MX']);
  });

  it('cambiar de país conserva los dígitos y los reagrupa', async () => {
    const fixture = create({ locale: 'es-EC' });
    type(fixture, '987654321');

    await openPanel(fixture);
    option('MX')!.click();
    fixture.detectChanges();

    expect(fixture.componentInstance.value()).toBe('+52987654321');
    expect(textbox(fixture).value).toBe('98 7654 321');
  });
});

describe('PhoneInputComponent — writeValue', () => {
  it('normaliza un valor con separadores', () => {
    const fixture = create({ locale: 'es-EC' });
    fixture.componentInstance.writeValue('+593 98-765 4321');
    fixture.detectChanges();
    expect(fixture.componentInstance.value()).toBe('+593987654321');
    expect(textbox(fixture).value).toBe('98 765 4321');
  });

  it('la elección de Canadá sobrevive al round-trip de un +1', async () => {
    const fixture = create({ locale: 'en-US' });
    await openPanel(fixture);
    option('CA')!.click();
    fixture.detectChanges();

    type(fixture, '4165551234');
    expect(fixture.componentInstance.value()).toBe('+14165551234');

    // El formulario devuelve el mismo valor: el país elegido no debe voltearse.
    fixture.componentInstance.writeValue('+14165551234');
    fixture.detectChanges();

    await openPanel(fixture);
    expect(option('CA')!.getAttribute('aria-selected')).toBe('true');
    expect(option('US')!.getAttribute('aria-selected')).toBe('false');
  });

  it('un +1 de fuera sin elección previa se muestra como Estados Unidos', async () => {
    // Limitación aceptada: distinguir US de CA exige la tabla de NPA del NANP.
    const fixture = create({ locale: 'es-MX' });
    fixture.componentInstance.writeValue('+14165551234');
    fixture.detectChanges();

    await openPanel(fixture);
    expect(option('US')!.getAttribute('aria-selected')).toBe('true');
  });

  it('un valor sin + se toma como número nacional del país actual', () => {
    const fixture = create({ locale: 'es-EC' });
    fixture.componentInstance.writeValue('0987654321');
    fixture.detectChanges();
    expect(fixture.componentInstance.value()).toBe('+593987654321');
  });

  it('la basura se descarta y deja el campo vacío', () => {
    const fixture = create({ locale: 'es-EC' });
    for (const junk of ['', '+', '++abc', 'abc', null, 123, undefined]) {
      fixture.componentInstance.writeValue(junk);
      fixture.detectChanges();
      expect(fixture.componentInstance.value(), String(junk)).toBe('');
      expect(textbox(fixture).value, String(junk)).toBe('');
    }
  });

  it('vaciar el valor no borra la bandera', () => {
    const fixture = create({ locale: 'es-EC', value: '+593987654321' });
    fixture.componentInstance.writeValue('');
    fixture.detectChanges();
    expect(trigger(fixture).textContent).toContain('+593');
  });

  it('un prefijo inexistente se descarta', () => {
    const fixture = create({ locale: 'es-EC' });
    fixture.componentInstance.writeValue('+9995551234');
    fixture.detectChanges();
    expect(fixture.componentInstance.value()).toBe('');
  });

  it('setDisabledState apaga el campo y el botón', () => {
    const fixture = create({ locale: 'es-EC' });
    fixture.componentInstance.setDisabledState(true);
    fixture.detectChanges();
    expect(textbox(fixture).disabled).toBe(true);
    expect(trigger(fixture).disabled).toBe(true);
  });

  it('avisa por onChange al teclear, pero no al recibir un valor de fuera', () => {
    const fixture = create({ locale: 'es-EC' });
    const onChange = vi.fn();
    fixture.componentInstance.registerOnChange(onChange);

    fixture.componentInstance.writeValue('+593987654321');
    fixture.detectChanges();
    expect(onChange).not.toHaveBeenCalled();

    type(fixture, '987654322');
    expect(onChange).toHaveBeenCalledWith('+593987654322');
  });
});

describe('PhoneInputComponent — errores', () => {
  it('teclear nunca muestra error, ni con el número a medias', () => {
    const fixture = create({ locale: 'es-EC' });
    for (const partial of ['9', '98', '987', '9876', '98765']) {
      type(fixture, partial);
      expect(errorText(fixture), partial).toBe('');
    }
  });

  it('el error de longitud aparece solo al salir del campo', () => {
    const fixture = create({ locale: 'es-EC' });
    type(fixture, '9876');
    expect(errorText(fixture)).toBe('');
    blur(fixture);
    expect(errorText(fixture)).toBe('El número debe tener 9 dígitos');
  });

  it('avisa también si el número es demasiado largo', () => {
    const fixture = create({ locale: 'es-EC' });
    type(fixture, '98765432199');
    blur(fixture);
    expect(errorText(fixture)).toContain('9 dígitos');
  });

  it('con un rango amplio el mensaje da el intervalo', () => {
    const fixture = create({ locale: 'de-DE' });
    type(fixture, '12345');
    blur(fixture);
    expect(errorText(fixture)).toBe('El número debe tener entre 6 y 11 dígitos');
  });

  it('avisa si no hay país elegido', () => {
    const fixture = create({ locale: 'es' });
    type(fixture, '987654321');
    blur(fixture);
    expect(errorText(fixture)).toBe('Selecciona un país');
  });

  it('el campo vacío no es un error', () => {
    const fixture = create({ locale: 'es-EC' });
    type(fixture, '');
    blur(fixture);
    expect(errorText(fixture)).toBe('');
  });

  it('no marca error al tabular por un campo precargado que nadie editó', () => {
    const fixture = create({ locale: 'es-EC', value: '+593987654321' });
    textbox(fixture).dispatchEvent(new Event('focusin', { bubbles: true }));
    blur(fixture);
    expect(errorText(fixture)).toBe('');
    expect(textbox(fixture).value).toBe('98 765 4321');
  });

  it('el error manual gana sobre el de longitud', () => {
    const fixture = create({ locale: 'es-EC', error: 'Ese número ya está registrado' });
    type(fixture, '9876');
    blur(fixture);
    expect(errorText(fixture)).toBe('Ese número ya está registrado');
  });

  it('los errores de Signal Forms solo se ven tras touched', () => {
    const fixture = create({
      locale: 'es-EC',
      errors: [{ kind: 'required', message: 'El teléfono es obligatorio' }],
    });
    expect(errorText(fixture)).toBe('');

    fixture.componentRef.setInput('touched', true);
    fixture.detectChanges();
    expect(errorText(fixture)).toBe('El teléfono es obligatorio');
  });

  it('cambiar de país no dispara el error de inmediato', async () => {
    const fixture = create({ locale: 'es-EC' });
    type(fixture, '987654321');
    blur(fixture);

    await openPanel(fixture);
    option('DK')!.click(); // Dinamarca son 8 dígitos, no 9
    fixture.detectChanges();

    expect(errorText(fixture)).toBe('');
    blur(fixture);
    expect(errorText(fixture)).toBe('El número debe tener 8 dígitos');
  });
});

describe('PhoneInputComponent — panel', () => {
  it('arranca cerrado y el botón lo abre y lo cierra', async () => {
    const fixture = create({ locale: 'es-EC' });
    expect(panel()).toBeNull();

    await openPanel(fixture);
    expect(panel()).not.toBeNull();

    trigger(fixture).click();
    fixture.detectChanges();
    expect(panel()).toBeNull();
  });

  it('no abre si está deshabilitado o en readonly', async () => {
    for (const state of ['disabled', 'readonly']) {
      const fixture = create({ locale: 'es-EC', [state]: true });
      await openPanel(fixture);
      expect(panel(), state).toBeNull();
    }
  });

  it('se monta en el contenedor de overlays, fuera del host', async () => {
    const fixture = create({ locale: 'es-EC' });
    await openPanel(fixture);
    expect(document.querySelector('[data-ui-overlay-root]')).not.toBeNull();
    expect(fixture.nativeElement.querySelector('[role="dialog"]')).toBeNull();
  });

  it('un clic dentro no lo cierra; un clic fuera sí', async () => {
    const fixture = create({ locale: 'es-EC' });
    await openPanel(fixture);

    panel()!.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    fixture.detectChanges();
    expect(panel()).not.toBeNull();

    document.body.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    fixture.detectChanges();
    expect(panel()).toBeNull();
  });

  it('Escape lo cierra y devuelve el foco al botón', async () => {
    const fixture = create({ locale: 'es-EC' });
    document.body.appendChild(fixture.nativeElement);
    await openPanel(fixture);

    key(panel()!, 'Escape');
    fixture.detectChanges();

    expect(panel()).toBeNull();
    expect(document.activeElement).toBe(trigger(fixture));
  });

  it('salir con Tab lo cierra', async () => {
    const fixture = create({ locale: 'es-EC' });
    await openPanel(fixture);

    panel()!.dispatchEvent(new FocusEvent('focusout', { bubbles: true, relatedTarget: null }));
    fixture.detectChanges();
    expect(panel()).toBeNull();
  });

  it('el buscador recibe el foco al abrir', async () => {
    const fixture = create({ locale: 'es-EC' });
    document.body.appendChild(fixture.nativeElement);
    await openPanel(fixture);
    expect(document.activeElement).toBe(searchBox());
  });

  it('lista todos los países ordenados por nombre', async () => {
    const fixture = create({ locale: 'es-MX' });
    await openPanel(fixture);
    const names = options().map((o) => o.textContent!.replace(/\s+/g, ' ').trim());
    expect(options().length).toBeGreaterThan(200);
    expect(names[0]).toContain('Afganistán');
  });

  it('countries limita la lista y esconde el buscador si son pocos', async () => {
    const fixture = create({ locale: 'es-MX', countries: ['EC', 'CO', 'PE'] });
    await openPanel(fixture);
    expect(options().map((o) => o.getAttribute('data-iso2'))).toEqual(['CO', 'EC', 'PE']);
    expect(searchBox()).toBeNull();
  });

  it('preferredCountries van arriba en el orden dado, con separador', async () => {
    const fixture = create({ locale: 'es-MX', preferredCountries: ['EC', 'MX'] });
    await openPanel(fixture);
    const isos = options().map((o) => o.getAttribute('data-iso2'));
    expect(isos.slice(0, 2)).toEqual(['EC', 'MX']);
    expect(panel()!.querySelectorAll('[data-list] > div.border-t').length).toBe(1);
  });

  it('el buscador filtra por nombre y por prefijo', async () => {
    const fixture = create({ locale: 'es-MX' });
    await openPanel(fixture);

    searchBox()!.value = 'espana';
    searchBox()!.dispatchEvent(new Event('input', { bubbles: true }));
    fixture.detectChanges();
    expect(options().map((o) => o.getAttribute('data-iso2'))).toEqual(['ES']);

    searchBox()!.value = '+593';
    searchBox()!.dispatchEvent(new Event('input', { bubbles: true }));
    fixture.detectChanges();
    expect(options().map((o) => o.getAttribute('data-iso2'))).toEqual(['EC']);
  });

  it('sin resultados avisa y las flechas no revientan', async () => {
    const fixture = create({ locale: 'es-MX' });
    await openPanel(fixture);

    searchBox()!.value = 'zzzzz';
    searchBox()!.dispatchEvent(new Event('input', { bubbles: true }));
    fixture.detectChanges();

    expect(options()).toEqual([]);
    expect(panel()!.querySelector('[role="status"]')!.textContent).toContain('Sin resultados');
    key(panel()!, 'ArrowDown');
    key(panel()!, 'Enter');
    fixture.detectChanges();
    expect(panel()).not.toBeNull();
  });
});

describe('PhoneInputComponent — teclado del panel', () => {
  it('al abrir, la opción activa es el país ya elegido', async () => {
    const fixture = create({ locale: 'es-EC' });
    await openPanel(fixture);
    expect(option('EC')!.getAttribute('data-active')).toBe('true');
    expect(searchBox()!.getAttribute('aria-activedescendant')).toBe(option('EC')!.id);
  });

  it('las flechas mueven la opción activa sin sacar el foco del buscador', async () => {
    const fixture = create({ locale: 'es-MX', countries: ['EC', 'CO', 'PE'] });
    document.body.appendChild(fixture.nativeElement);
    await openPanel(fixture);

    key(panel()!, 'ArrowDown');
    fixture.detectChanges();
    expect(options()[1].getAttribute('data-active')).toBe('true');
    expect(document.activeElement).not.toBe(options()[1]);
  });

  it('las flechas dan la vuelta en los extremos', async () => {
    const fixture = create({ locale: 'es-MX', countries: ['EC', 'CO', 'PE'] });
    await openPanel(fixture);

    key(panel()!, 'ArrowUp');
    fixture.detectChanges();
    expect(options()[options().length - 1].getAttribute('data-active')).toBe('true');
  });

  it('Inicio y Fin van a los extremos', async () => {
    const fixture = create({ locale: 'es-MX', countries: ['EC', 'CO', 'PE'] });
    await openPanel(fixture);

    key(panel()!, 'End');
    fixture.detectChanges();
    expect(options()[2].getAttribute('data-active')).toBe('true');

    key(panel()!, 'Home');
    fixture.detectChanges();
    expect(options()[0].getAttribute('data-active')).toBe('true');
  });

  it('Enter elige la opción activa y cierra', async () => {
    const fixture = create({ locale: 'es-MX', countries: ['EC', 'CO', 'PE'] });
    await openPanel(fixture);

    key(panel()!, 'Home'); // Colombia, la primera por nombre
    key(panel()!, 'Enter');
    fixture.detectChanges();

    expect(panel()).toBeNull();
    expect(trigger(fixture).textContent).toContain('+57');
  });

  it('elegir un país devuelve el foco al campo del número', async () => {
    const fixture = create({ locale: 'es-EC' });
    document.body.appendChild(fixture.nativeElement);
    await openPanel(fixture);

    option('MX')!.click();
    fixture.detectChanges();

    expect(document.activeElement).toBe(textbox(fixture));
  });
});
