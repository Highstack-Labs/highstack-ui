import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { TimezoneSelectComponent } from './timezone-select.component';

@Component({
  selector: 'app-timezone-host',
  imports: [TimezoneSelectComponent],
  template: `<ui-timezone-select [(value)]="zona" label="Zona horaria" />`,
})
class TimezoneHost {
  readonly zona = signal('');
}

type Fixture = ReturnType<typeof create>;

function create() {
  const fixture = TestBed.createComponent(TimezoneHost);
  fixture.detectChanges();
  return fixture;
}

function host(fixture: Fixture): HTMLElement {
  return fixture.nativeElement;
}
function trigger(fixture: Fixture): HTMLButtonElement {
  return host(fixture).querySelector('[data-trigger]')!;
}
function searchBox(fixture: Fixture): HTMLInputElement {
  return host(fixture).querySelector('input[role="combobox"]')!;
}
function options(fixture: Fixture): HTMLElement[] {
  return Array.from(host(fixture).querySelectorAll('[role="option"]'));
}
function dialog(fixture: Fixture): HTMLElement | null {
  return host(fixture).querySelector('[role="dialog"]');
}

function openModal(fixture: Fixture) {
  trigger(fixture).click();
  fixture.detectChanges();
}

function type(fixture: Fixture, text: string) {
  const input = searchBox(fixture);
  input.value = text;
  input.dispatchEvent(new Event('input'));
  fixture.detectChanges();
}

function press(fixture: Fixture, key: string) {
  searchBox(fixture).dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true }));
  fixture.detectChanges();
}

describe('TimezoneSelectComponent', () => {
  it('arranca cerrado y con el placeholder', () => {
    const fixture = create();
    expect(dialog(fixture)).toBeNull();
    expect(trigger(fixture).textContent).toContain('Selecciona una zona horaria…');
  });

  it('el trigger abre el modal con la lista completa', () => {
    const fixture = create();
    openModal(fixture);

    expect(dialog(fixture)).not.toBeNull();
    expect(options(fixture).length).toBeGreaterThan(100);
  });

  it('el buscador filtra la lista', () => {
    const fixture = create();
    openModal(fixture);
    type(fixture, 'madrid europa');

    const visibles = options(fixture);
    expect(visibles.length).toBe(1);
    expect(visibles[0].getAttribute('data-zone')).toBe('Europe/Madrid');
  });

  it('avisa cuando la búsqueda no encuentra nada', () => {
    const fixture = create();
    openModal(fixture);
    type(fixture, 'xyzxyz');

    expect(options(fixture).length).toBe(0);
    expect(host(fixture).querySelector('[role="status"]')?.textContent).toContain('Sin resultados');
  });

  it('elegir una zona fija el valor y cierra el modal', () => {
    const fixture = create();
    openModal(fixture);
    type(fixture, 'bogota');
    options(fixture)[0].click();
    fixture.detectChanges();

    expect(fixture.componentInstance.zona()).toBe('America/Bogota');
    expect(trigger(fixture).textContent).toContain('Bogota');
    expect(trigger(fixture).textContent).toContain('GMT-05:00');
  });

  it('Enter elige la opción resaltada', () => {
    const fixture = create();
    openModal(fixture);
    type(fixture, 'bogota');
    press(fixture, 'Enter');

    expect(fixture.componentInstance.zona()).toBe('America/Bogota');
  });

  it('las flechas mueven el resaltado sin sacar el foco del buscador', () => {
    const fixture = create();
    openModal(fixture);
    type(fixture, 'europa');

    const antes = options(fixture);
    expect(antes[0].getAttribute('data-active')).toBe('true');

    press(fixture, 'ArrowDown');
    const despues = options(fixture);
    expect(despues[0].getAttribute('data-active')).toBe('false');
    expect(despues[1].getAttribute('data-active')).toBe('true');
    // El foco no se mueve: se navega con aria-activedescendant.
    expect(searchBox(fixture).getAttribute('aria-activedescendant')).toBe(despues[1].id);
  });

  it('las flechas dan la vuelta al llegar al final', () => {
    const fixture = create();
    openModal(fixture);
    type(fixture, 'madrid europa'); // Un único resultado.

    press(fixture, 'ArrowDown');
    expect(options(fixture)[0].getAttribute('data-active')).toBe('true');
  });

  it('el resaltado navega en el mismo orden en que se ve la lista agrupada', () => {
    const fixture = create();
    openModal(fixture);

    // Regresión: si se numeraran las zonas antes de agrupar, ArrowDown saltaría
    // de un grupo a otro en vez de bajar a la fila siguiente.
    press(fixture, 'ArrowDown');
    const visibles = options(fixture);
    const activa = visibles.findIndex((o) => o.getAttribute('data-active') === 'true');
    expect(activa).toBe(1);
  });

  it('la lista se agrupa por región y se puede desagrupar', () => {
    const fixture = TestBed.createComponent(TimezoneSelectComponent);
    fixture.detectChanges();
    fixture.componentInstance.open.set(true);
    fixture.detectChanges();

    const encabezados = () =>
      (fixture.nativeElement as HTMLElement).querySelectorAll('.sticky').length;
    expect(encabezados()).toBeGreaterThan(1);

    fixture.componentRef.setInput('grouped', false);
    fixture.detectChanges();
    expect(encabezados()).toBe(0);
  });

  it('abre resaltando la zona ya elegida', () => {
    const fixture = create();
    fixture.componentInstance.zona.set('Europe/Madrid');
    fixture.detectChanges();
    openModal(fixture);

    const activa = options(fixture).find((o) => o.getAttribute('data-active') === 'true');
    expect(activa?.getAttribute('data-zone')).toBe('Europe/Madrid');
    expect(activa?.getAttribute('aria-selected')).toBe('true');
  });

  it('el buscador se vacía entre aperturas', () => {
    const fixture = create();
    openModal(fixture);
    type(fixture, 'bogota');
    options(fixture)[0].click();
    fixture.detectChanges();

    openModal(fixture);
    expect(searchBox(fixture).value).toBe('');
  });

  it('deshabilitado no abre el modal', () => {
    const fixture = TestBed.createComponent(TimezoneSelectComponent);
    fixture.componentRef.setInput('disabled', true);
    fixture.detectChanges();

    (fixture.nativeElement as HTMLElement).querySelector<HTMLElement>('[data-trigger]')!.click();
    fixture.detectChanges();

    expect((fixture.nativeElement as HTMLElement).querySelector('[role="dialog"]')).toBeNull();
  });

  it('muestra un valor que no está en la lista del runtime', () => {
    const fixture = create();
    fixture.componentInstance.zona.set('Etc/GMT+3');
    fixture.detectChanges();

    expect(trigger(fixture).textContent).toContain('GMT-03:00');
  });

  it('no renderiza un párrafo de error vacío cuando invalid+touched sin mensaje', () => {
    const fixture = TestBed.createComponent(TimezoneSelectComponent);
    fixture.componentRef.setInput('invalid', true);
    fixture.componentRef.setInput('touched', true);
    fixture.componentRef.setInput('hint', 'Elige tu zona');
    fixture.detectChanges();

    const el = fixture.nativeElement as HTMLElement;
    const parrafos = Array.from(el.querySelectorAll('p'));
    expect(parrafos.length).toBe(1);
    expect(parrafos[0].textContent?.trim()).toBe('Elige tu zona');
    expect(el.querySelector('[data-trigger]')?.getAttribute('aria-invalid')).toBe('true');
  });

  it('aria-describedby apunta al párrafo que sí existe', () => {
    const fixture = TestBed.createComponent(TimezoneSelectComponent);
    fixture.componentRef.setInput('error', 'Campo obligatorio');
    fixture.detectChanges();

    const el = fixture.nativeElement as HTMLElement;
    const describedBy = el.querySelector('[data-trigger]')!.getAttribute('aria-describedby')!;
    expect(el.querySelector(`#${describedBy}`)?.textContent?.trim()).toBe('Campo obligatorio');
  });
});
